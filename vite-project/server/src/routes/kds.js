
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 🍽️ KDS 주문 목록 조회
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🍳 KDS 주문 목록 조회 - 매장 ${storeId} (${new Date().toISOString()})`);

    const result = await pool.query(`
      SELECT 
        o.id as order_id,
        ot.id as ticket_id,
        ot.status as ticket_status,
        ot.batch_no,
        o.table_num,
        o.created_at,
        o.source,
        array_agg(
          json_build_object(
            'id', oi.id,
            'menuName', oi.menu_name,
            'quantity', oi.quantity,
            'status', oi.item_status,
            'orderedAt', oi.created_at,
            'cook_station', COALESCE(oi.cook_station, 'KITCHEN')
          ) ORDER BY oi.created_at
        ) as items
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE o.store_id = $1 
        AND o.session_status = 'OPEN'
        AND ot.status IN ('PENDING', 'COOKING')
        AND COALESCE(ot.display_status, 'VISIBLE') != 'UNVISIBLE'
        AND oi.cook_station IN ('KITCHEN', 'GRILL', 'FRY', 'COLD_STATION')
      GROUP BY o.id, ot.id, ot.status, ot.batch_no, o.table_num, o.created_at, o.source
      ORDER BY 
        CASE WHEN ot.status = 'COOKING' THEN 1 ELSE 2 END,
        ot.id ASC
    `, [parseInt(storeId)]);

    // renderKDS.js에서 기대하는 형태로 변환 - 정확한 상태 반영
    const orders = result.rows.map(order => ({
      check_id: order.ticket_id,
      id: order.order_id,
      ticket_id: order.ticket_id,
      batch_no: order.batch_no || 1,
      customer_name: order.customer_name || `테이블 ${order.table_num}`,
      table_number: order.table_num,
      table_num: order.table_num,
      status: order.ticket_status?.toUpperCase() || 'PENDING', // DB의 실제 ticket 상태 사용
      created_at: order.created_at,
      updated_at: order.created_at,
      source: order.source || 'POS',
      items: (order.items || []).filter(item => 
        ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(item.cook_station)
      )
    }));

    res.json({
      success: true,
      orders: orders,
      count: orders.length
    });

  } catch (error) {
    console.error('❌ KDS 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 주문 조회 실패',
      details: error.message
    });
  }
});

// 🍳 KDS 아이템 상태 업데이트
router.put('/items/:itemId/status', async (req, res) => {
  const client = await pool.connect();

  try {
    const { itemId } = req.params;
    const { status, kitchenNotes } = req.body;

    console.log(`🍳 KDS 아이템 ${itemId} 상태 업데이트: ${status}`);

    // 유효한 상태 확인
    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELED'];
    const upperStatus = status.toUpperCase();
    if (!validStatuses.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 상태입니다',
        validStatuses: validStatuses
      });
    }

    await client.query('BEGIN');

    // order_items 테이블에서 아이템 상태 업데이트
    const updateQuery = `
      UPDATE order_items 
      SET item_status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING ticket_id, menu_name, quantity
    `;

    const result = await client.query(updateQuery, [upperStatus, parseInt(itemId)]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '아이템을 찾을 수 없습니다'
      });
    }

    const { ticket_id, menu_name, quantity } = result.rows[0];

    // 주문 정보 조회
    const orderQuery = `
      SELECT o.store_id, o.table_number, o.id as order_id
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      WHERE ot.id = $1
    `;

    const orderResult = await client.query(orderQuery, [ticket_id]);
    const { store_id, table_number, order_id } = orderResult.rows[0];

    await client.query('COMMIT');

    // WebSocket으로 실시간 업데이트 브로드캐스트
    if (global.io) {
      // 메인 이벤트
      global.io.to(`kds:${store_id}`).emit('kds-update', {
        type: 'item_status_update',
        data: {
          item_id: parseInt(itemId),
          ticket_id: ticket_id,
          order_id: order_id,
          item_status: upperStatus,
          menu_name: menu_name,
          quantity: quantity,
          table_number: table_number,
          timestamp: new Date().toISOString()
        }
      });

      // 호환성을 위한 개별 이벤트
      global.io.to(`kds:${store_id}`).emit('item.updated', {
        item_id: parseInt(itemId),
        ticket_id: ticket_id,
        item_status: upperStatus,
        timestamp: new Date().toISOString()
      });

      console.log(`📡 아이템 상태 업데이트 이벤트: 매장 ${store_id}, 아이템 ${itemId} -> ${upperStatus}`);
    }

    res.json({
      success: true,
      itemId: parseInt(itemId),
      ticketId: ticket_id,
      orderId: order_id,
      newStatus: upperStatus,
      message: `${menu_name} 상태가 ${upperStatus}로 변경되었습니다`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ KDS 아이템 상태 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: '아이템 상태를 업데이트할 수 없습니다',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// 🍳 KDS 티켓 조리 시작 API
router.put('/tickets/:ticketId/start-cooking', async (req, res) => {
  const client = await pool.connect();

  try {
    const { ticketId } = req.params;

    console.log(`🔥 KDS 티켓 ${ticketId} 조리 시작`);

    await client.query('BEGIN');

    // 1. order_tickets 테이블에서 티켓 상태를 조리 중으로 변경
    const ticketUpdateResult = await client.query(`
      UPDATE order_tickets 
      SET status = 'COOKING',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, order_id
    `, [parseInt(ticketId)]);

    if (ticketUpdateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '티켓을 찾을 수 없습니다'
      });
    }

    const { order_id } = ticketUpdateResult.rows[0];

    // 2. order_items 테이블에서 해당 티켓의 모든 아이템을 조리 중 상태로 변경
    await client.query(`
      UPDATE order_items 
      SET item_status = 'COOKING',
          updated_at = CURRENT_TIMESTAMP
      WHERE ticket_id = $1 AND item_status = 'PENDING'
    `, [parseInt(ticketId)]);

    // 3. 주문 정보 조회 (WebSocket 브로드캐스트용)
    const orderResult = await pool.query(`
      SELECT o.store_id, o.table_num as table_number
      FROM orders o
      WHERE o.id = $1
    `, [order_id]);

    const { store_id, table_number } = orderResult.rows[0];

    await client.query('COMMIT');

    // WebSocket으로 실시간 업데이트 브로드캐스트
    if (global.io) {
      global.io.to(`kds:${store_id}`).emit('kds-update', {
        type: 'ticket_cooking_started',
        data: {
          ticket_id: parseInt(ticketId),
          order_id: order_id,
          status: 'COOKING',
          table_number: table_number
        }
      });
    }

    res.json({
      success: true,
      ticketId: parseInt(ticketId),
      orderId: order_id,
      status: 'COOKING',
      message: '조리가 시작되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ KDS 조리 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: '조리 시작 처리 중 오류가 발생했습니다',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// 🖨️ KDS 티켓 출력 상태 업데이트 API - 완료 처리하지 않음
router.put('/tickets/:ticketId/print', async (req, res) => {
  const client = await pool.connect();

  try {
    const { ticketId } = req.params;

    console.log(`🖨️ KDS 티켓 ${ticketId} 출력 요청 - 출력 상태만 업데이트 (완료 처리 안함)`);

    await client.query('BEGIN');

    // order_tickets 테이블에서 출력 상태만 PRINTED로 변경 (status는 변경하지 않음)
    const ticketUpdateResult = await client.query(`
      UPDATE order_tickets
      SET print_status = 'PRINTED',
          printed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, order_id, status, created_at
    `, [parseInt(ticketId)]);

    if (ticketUpdateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '티켓을 찾을 수 없습니다'
      });
    }

    const { order_id, status, created_at } = ticketUpdateResult.rows[0];

    console.log(`ℹ️ 출력 처리 완료 - 티켓 상태는 ${status}로 유지됨 (변경하지 않음)`);

    // 상세 주문 정보 조회 (KRP 전송용) - cook_station 정보 포함
    const orderDetailResult = await client.query(`
      SELECT 
        o.id as order_id,
        o.store_id,
        o.table_num,
        o.created_at as order_created_at,
        COALESCE(u.name, g.phone, '게스트') as customer_name,
        array_agg(
          json_build_object(
            'id', oi.id,
            'menuName', oi.menu_name,
            'quantity', oi.quantity,
            'price', oi.unit_price,
            'totalPrice', oi.unit_price * oi.quantity,
            'cook_station', COALESCE(oi.cook_station, 'KITCHEN'),
            'options', COALESCE(oi.options, '{}')
          ) ORDER BY oi.created_at
        ) as items,
        SUM(oi.unit_price * oi.quantity) as total_amount
      FROM orders o
      JOIN order_items oi ON oi.ticket_id = $1
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN guests g ON o.guest_phone = g.phone
      WHERE o.id = $2
      GROUP BY o.id, o.store_id, o.table_num, o.created_at, u.name, g.phone
    `, [parseInt(ticketId), order_id]);

    if (orderDetailResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '주문 정보를 찾을 수 없습니다'
      });
    }

    const orderDetail = orderDetailResult.rows[0];

    await client.query('COMMIT');

    // KRP WebSocket으로 새 출력 요청 즉시 전송 - cook_station 정보 강화
    const printData = {
      ticket_id: parseInt(ticketId),
      order_id: orderDetail.order_id,
      table_number: orderDetail.table_num,
      customer_name: orderDetail.customer_name,
      total_amount: parseInt(orderDetail.total_amount) || 0,
      items: (orderDetail.items || []).map(item => ({
        ...item,
        // cook_station 정보 명시적 설정 (null/undefined 방지)
        cook_station: item.cook_station || 'KITCHEN',
        menuName: item.menuName || item.menu_name || '메뉴',
        quantity: item.quantity || 1,
        price: item.price || item.unit_price || 0,
        totalPrice: item.totalPrice || (item.price * item.quantity) || 0
      })),
      created_at: orderDetail.order_created_at,
      timestamp: new Date().toISOString(),
      source: 'kds_print_button'
    };

    // 상세한 cook_station 분석 로깅
    const stationAnalysis = {};
    printData.items.forEach(item => {
      const station = item.cook_station;
      if (!stationAnalysis[station]) {
        stationAnalysis[station] = { count: 0, items: [] };
      }
      stationAnalysis[station].count++;
      stationAnalysis[station].items.push(item.menuName);
    });

    console.log(`🖨️ KRP 출력 데이터 준비 (cook_station 상세 분석):`, {
      ticket_id: printData.ticket_id,
      total_items: printData.items.length,
      station_breakdown: stationAnalysis,
      raw_items: printData.items.map(item => ({
        name: item.menuName,
        cook_station: item.cook_station,
        quantity: item.quantity
      }))
    });

    // 전역 브로드캐스트 함수 사용
    if (global.broadcastKRPPrint) {
      global.broadcastKRPPrint(orderDetail.store_id, printData);
    } else {
      console.error(`❌ global.broadcastKRPPrint 함수가 없음 - WebSocket 서버가 초기화되지 않음`);
    }

    res.json({
      success: true,
      message: '출력 요청 완료 - KRP로 전송됨 (티켓 상태 유지)',
      ticket_id: parseInt(ticketId),
      order_id: orderDetail.order_id,
      ticket_status: status, // 현재 티켓 상태 반환
      print_data: {
        table_number: orderDetail.table_num,
        customer_name: orderDetail.customer_name,
        items_count: orderDetail.items?.length || 0,
        kitchen_items: orderDetail.items?.filter(item => 
          ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(item.cook_station)
        ).length || 0,
        total_amount: parseInt(orderDetail.total_amount) || 0
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ KDS 출력 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '출력 처리 실패',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// 🍳 KDS 티켓 완료 API
router.put('/tickets/:ticketId/complete', async (req, res) => {
  const client = await pool.connect();

  try {
    const { ticketId } = req.params;

    console.log(`✅ KDS 티켓 ${ticketId} 완료 처리`);

    await client.query('BEGIN');

    // 1. order_tickets 테이블에서 티켓 상태를 완료로 변경
    const ticketUpdateResult = await client.query(`
      UPDATE order_tickets
      SET status = 'DONE',
          display_status = 'UNVISIBLE',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, order_id
    `, [parseInt(ticketId)]);

    if (ticketUpdateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '티켓을 찾을 수 없습니다'
      });
    }

    const { order_id } = ticketUpdateResult.rows[0];

    // 2. order_items 테이블에서 해당 티켓의 모든 아이템을 완료 상태로 변경
    await client.query(`
      UPDATE order_items 
      SET item_status = 'DONE',
          updated_at = CURRENT_TIMESTAMP
      WHERE ticket_id = $1 AND item_status != 'CANCELED'
    `, [parseInt(ticketId)]);

    // 3. 주문 정보 조회 (WebSocket 브로드캐스트용)
    const orderResult = await pool.query(`
      SELECT o.store_id, o.table_num as table_number
      FROM orders o
      WHERE o.id = $1
    `, [order_id]);

    const { store_id, table_number } = orderResult.rows[0];

    await client.query('COMMIT');

    // WebSocket으로 실시간 업데이트 브로드캐스트 - DONE 상태 즉시 제거용
    if (global.io) {
      console.log(`📡 WebSocket 브로드캐스트: 티켓 ${ticketId} 완료 이벤트 전송`);

      // KDS 업데이트 이벤트
      global.io.to(`kds:${store_id}`).emit('kds-update', {
        type: 'ticket_completed',
        data: {
          ticket_id: parseInt(ticketId),
          order_id: order_id,
          status: 'DONE',
          table_number: table_number,
          action: 'remove_immediately'
        }
      });

      // 티켓 완료 이벤트 (즉시 제거용)
      global.io.to(`kds:${store_id}`).emit('ticket.completed', {
        ticket_id: parseInt(ticketId),
        order_id: order_id,
        status: 'DONE',
        table_number: table_number,
        action: 'remove'
      });

      // 추가: 티켓 업데이트 이벤트 (기존 핸들러 호환)
      global.io.to(`kds:${store_id}`).emit('ticket.updated', {
        ticket_id: parseInt(ticketId),
        id: parseInt(ticketId),
        check_id: parseInt(ticketId),
        status: 'DONE',
        order_id: order_id,
        table_number: table_number
      });

      // KRP에 출력 요청 이벤트 전송
      global.io.to(`krp:${store_id}`).emit('krp-print-request', {
        ticket_id: parseInt(ticketId),
        order_id: order_id,
        table_number: table_number,
        action: 'add_to_print_queue'
      });

      console.log(`✅ WebSocket 브로드캐스트 완료: 매장 ${store_id}, 티켓 ${ticketId}`);
    }

    res.json({
      success: true,
      ticketId: parseInt(ticketId),
      orderId: order_id,
      status: 'COMPLETED',
      message: '주문이 완료되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ KDS 완료 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '완료 처리 중 오류가 발생했습니다',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * [GET] /tickets/:ticketId/details - 티켓 상세 정보 조회 (KDS용)
 */
router.get('/tickets/:ticketId/details', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { storeId } = req.query;

    console.log(`🔍 KDS 티켓 상세 조회: ${ticketId}, 매장: ${storeId}`);

    if (!ticketId || !storeId) {
      return res.status(400).json({
        success: false,
        error: '티켓 ID와 매장 ID가 필요합니다'
      });
    }

    // 티켓 기본 정보 조회
    const ticketResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.order_id,
        ot.batch_no,
        ot.status,
        ot.source,
        ot.table_num as table_number,
        ot.created_at,
        ot.updated_at,
        o.user_id,
        COALESCE(u.name, '포스고객') as customer_name
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ot.id = $1 AND ot.store_id = $2
    `, [ticketId, storeId]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '티켓을 찾을 수 없습니다'
      });
    }

    const ticket = ticketResult.rows[0];

    // 티켓의 아이템들 조회
    const itemsResult = await pool.query(`
      SELECT 
        oi.id,
        oi.menu_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.item_status as status,
        oi.cook_station,
        oi.created_at
      FROM order_items oi
      WHERE oi.ticket_id = $1 
        AND oi.item_status NOT IN ('CANCELED', 'REFUNDED')
      ORDER BY oi.created_at ASC
    `, [ticketId]);

    // 주방 관련 아이템만 필터링
    const kitchenItems = itemsResult.rows.filter(item => {
      const cookStation = item.cook_station || 'KITCHEN';
      return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
    });

    const ticketData = {
      ...ticket,
      id: ticket.ticket_id,
      check_id: ticket.ticket_id,
      items: kitchenItems,
      table_num: ticket.table_number
    };

    console.log(`✅ KDS 티켓 상세 조회 완료: ${ticketId}, ${kitchenItems.length}개 주방 아이템`);

    res.json({
      success: true,
      ticket: ticketData,
      kitchenItemsCount: kitchenItems.length,
      totalItemsCount: itemsResult.rows.length
    });

  } catch (error) {
    console.error('❌ KDS 티켓 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '티켓 상세 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /:storeId/table/:tableNumber/tickets - 테이블별 KDS 티켓 조회
 */
router.get('/:storeId/table/:tableNumber/tickets', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 KDS 테이블 티켓 조회: 매장 ${storeId}, 테이블 ${tableNumber}`);

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID 또는 테이블 번호입니다'
      });
    }

    // 해당 테이블의 활성 티켓들 조회
    const ticketsResult = await pool.query(`
      SELECT DISTINCT
        ot.id as ticket_id,
        ot.order_id,
        ot.batch_no,
        ot.status,
        ot.source,
        ot.table_num as table_number,
        ot.created_at,
        ot.updated_at,
        o.user_id,
        COALESCE(u.name, '포스고객') as customer_name
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ot.store_id = $1 
        AND ot.table_num = $2
        AND ot.status NOT IN ('CANCELED', 'COMPLETED', 'DONE')
        AND ot.paid_status = 'UNPAID'
      ORDER BY ot.created_at ASC
    `, [parsedStoreId, parsedTableNumber]);

    const tickets = [];

    // 각 티켓의 아이템들 조회
    for (const ticketRow of ticketsResult.rows) {
      const itemsResult = await pool.query(`
        SELECT 
          oi.id,
          oi.menu_name,
          oi.quantity,
          oi.unit_price,
          oi.total_price,
          oi.item_status as status,
          oi.cook_station,
          oi.created_at
        FROM order_items oi
        WHERE oi.ticket_id = $1 
          AND oi.item_status NOT IN ('CANCELED', 'REFUNDED')
        ORDER BY oi.created_at ASC
      `, [ticketRow.ticket_id]);

      // 주방 관련 아이템만 필터링
      const kitchenItems = itemsResult.rows.filter(item => {
        const cookStation = item.cook_station || 'KITCHEN';
        return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
      });

      // 주방 아이템이 있는 티켓만 포함
      if (kitchenItems.length > 0) {
        tickets.push({
          ...ticketRow,
          id: ticketRow.ticket_id,
          check_id: ticketRow.ticket_id,
          items: kitchenItems,
          table_num: ticketRow.table_number
        });
      }
    }

    console.log(`✅ KDS 테이블 티켓 조회 완료: 테이블 ${tableNumber}, ${tickets.length}개 주방 티켓`);

    res.json({
      success: true,
      tickets: tickets,
      totalTickets: tickets.length,
      tableNumber: parsedTableNumber
    });

  } catch (error) {
    console.error('❌ KDS 테이블 티켓 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 티켓 조회 실패: ' + error.message
    });
  }
});

// 🔍 KDS 티켓 상세 정보 조회 API
router.get('/tickets/:ticketId/details', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { storeId } = req.query;

    console.log(`🔍 KDS 티켓 ${ticketId} 상세 정보 조회 (매장: ${storeId})`);

    // 파라미터 검증
    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: '매장 ID가 필요합니다'
      });
    }

    // 티켓 상세 정보 조회
    const ticketResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.order_id,
        ot.batch_no,
        ot.status,
        ot.created_at,
        ot.updated_at,
        o.table_num as table_number,
        o.store_id,
        array_agg(
          json_build_object(
            'id', oi.id,
            'menuName', oi.menu_name,
            'menu_name', oi.menu_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'status', oi.item_status,
            'item_status', oi.item_status,
            'cook_station', oi.cook_station,
            'notes', oi.notes
          )
        ) as items
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.id = $1 
        AND o.store_id = $2
        AND ot.status NOT IN ('DONE', 'COMPLETED', 'SERVED')
      GROUP BY ot.id, ot.order_id, ot.batch_no, ot.status, ot.created_at, ot.updated_at, o.table_num, o.store_id
    `, [parseInt(ticketId), parseInt(storeId)]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '티켓을 찾을 수 없거나 이미 완료된 티켓입니다'
      });
    }

    const ticket = ticketResult.rows[0];

    // 주방 아이템만 필터링
    const kitchenItems = (ticket.items || []).filter(item => {
      if (!item.id) return false;
      const cookStation = item.cook_station || 'KITCHEN';
      return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
    });

    if (kitchenItems.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주방 아이템이 없는 티켓입니다'
      });
    }

    const responseTicket = {
      ...ticket,
      items: kitchenItems,
      check_id: ticket.ticket_id,
      id: ticket.ticket_id,
      customer_name: `테이블 ${ticket.table_number}`,
      source: 'POS'
    };

    console.log(`✅ 티켓 ${ticketId} 상세 정보 반환: ${kitchenItems.length}개 주방 아이템`);

    res.json({
      success: true,
      ticket: responseTicket
    });

  } catch (error) {
    console.error('❌ KDS 티켓 상세 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '티켓 상세 정보 조회 실패: ' + error.message
    });
  }
});

// 🔍 KDS 테이블별 활성 티켓 조회 API
router.get('/:storeId/table/:tableNumber/tickets', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 KDS 테이블 ${tableNumber} 활성 티켓 조회 (매장: ${storeId})`);

    // 테이블의 모든 활성 티켓 조회
    const ticketsResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.order_id,
        ot.batch_no,
        ot.status,
        ot.created_at,
        ot.updated_at,
        o.table_num as table_number,
        o.store_id,
        array_agg(
          json_build_object(
            'id', oi.id,
            'menuName', oi.menu_name,
            'menu_name', oi.menu_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'status', oi.item_status,
            'item_status', oi.item_status,
            'cook_station', oi.cook_station,
            'notes', oi.notes
          )
        ) as items
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE o.store_id = $1 
        AND o.table_num = $2
        AND ot.status NOT IN ('DONE', 'COMPLETED', 'SERVED')
        AND o.session_status = 'OPEN'
      GROUP BY ot.id, ot.order_id, ot.batch_no, ot.status, ot.created_at, ot.updated_at, o.table_num, o.store_id
      ORDER BY ot.created_at ASC
    `, [parseInt(storeId), parseInt(tableNumber)]);

    const tickets = ticketsResult.rows.map(ticket => {
      // 주방 아이템만 필터링
      const kitchenItems = (ticket.items || []).filter(item => {
        if (!item.id) return false;
        const cookStation = item.cook_station || 'KITCHEN';
        return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
      });

      return {
        ...ticket,
        items: kitchenItems,
        check_id: ticket.ticket_id,
        id: ticket.ticket_id,
        customer_name: `테이블 ${ticket.table_number}`,
        source: 'POS'
      };
    }).filter(ticket => ticket.items.length > 0); // 주방 아이템이 있는 티켓만

    console.log(`✅ 테이블 ${tableNumber} 활성 티켓 ${tickets.length}개 반환`);

    res.json({
      success: true,
      tickets: tickets,
      tableNumber: parseInt(tableNumber),
      storeId: parseInt(storeId)
    });

  } catch (error) {
    console.error('❌ KDS 테이블 티켓 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 티켓 조회 실패: ' + error.message
    });
  }
});

// 🔍 KDS 티켓 상세 정보 조회 API
router.get('/tickets/:ticketId/details', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { storeId } = req.query;

    console.log(`🔍 KDS 티켓 ${ticketId} 상세 정보 조회 (매장: ${storeId})`);

    // 파라미터 검증
    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: '매장 ID가 필요합니다'
      });
    }

    // 티켓 상세 정보 조회
    const ticketResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.order_id,
        ot.batch_no,
        ot.status,
        ot.created_at,
        ot.updated_at,
        o.table_num as table_number,
        o.store_id,
        array_agg(
          json_build_object(
            'id', oi.id,
            'menuName', oi.menu_name,
            'menu_name', oi.menu_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'status', oi.item_status,
            'item_status', oi.item_status,
            'cook_station', oi.cook_station,
            'notes', oi.notes
          )
        ) as items
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.id = $1 
        AND o.store_id = $2
        AND ot.status NOT IN ('DONE', 'COMPLETED', 'SERVED')
      GROUP BY ot.id, ot.order_id, ot.batch_no, ot.status, ot.created_at, ot.updated_at, o.table_num, o.store_id
    `, [parseInt(ticketId), parseInt(storeId)]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '티켓을 찾을 수 없거나 이미 완료된 티켓입니다'
      });
    }

    const ticket = ticketResult.rows[0];

    // 주방 아이템만 필터링
    const kitchenItems = (ticket.items || []).filter(item => {
      if (!item.id) return false;
      const cookStation = item.cook_station || 'KITCHEN';
      return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
    });

    if (kitchenItems.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주방 아이템이 없는 티켓입니다'
      });
    }

    const responseTicket = {
      ...ticket,
      items: kitchenItems,
      check_id: ticket.ticket_id,
      id: ticket.ticket_id,
      customer_name: `테이블 ${ticket.table_number}`,
      source: 'POS'
    };

    console.log(`✅ 티켓 ${ticketId} 상세 정보 반환: ${kitchenItems.length}개 주방 아이템`);

    res.json({
      success: true,
      ticket: responseTicket
    });

  } catch (error) {
    console.error('❌ KDS 티켓 상세 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '티켓 상세 정보 조회 실패: ' + error.message
    });
  }
});

// 🔍 KDS 테이블별 활성 티켓 조회 API
router.get('/:storeId/table/:tableNumber/tickets', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 KDS 테이블 ${tableNumber} 활성 티켓 조회 (매장: ${storeId})`);

    // 테이블의 모든 활성 티켓 조회
    const ticketsResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.order_id,
        ot.batch_no,
        ot.status,
        ot.created_at,
        ot.updated_at,
        o.table_num as table_number,
        o.store_id,
        array_agg(
          json_build_object(
            'id', oi.id,
            'menuName', oi.menu_name,
            'menu_name', oi.menu_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'status', oi.item_status,
            'item_status', oi.item_status,
            'cook_station', oi.cook_station,
            'notes', oi.notes
          )
        ) as items
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE o.store_id = $1 
        AND o.table_num = $2
        AND ot.status NOT IN ('DONE', 'COMPLETED', 'SERVED')
        AND o.session_status = 'OPEN'
      GROUP BY ot.id, ot.order_id, ot.batch_no, ot.status, ot.created_at, ot.updated_at, o.table_num, o.store_id
      ORDER BY ot.created_at ASC
    `, [parseInt(storeId), parseInt(tableNumber)]);

    const tickets = ticketsResult.rows.map(ticket => {
      // 주방 아이템만 필터링
      const kitchenItems = (ticket.items || []).filter(item => {
        if (!item.id) return false;
        const cookStation = item.cook_station || 'KITCHEN';
        return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
      });

      return {
        ...ticket,
        items: kitchenItems,
        check_id: ticket.ticket_id,
        id: ticket.ticket_id,
        customer_name: `테이블 ${ticket.table_number}`,
        source: 'POS'
      };
    }).filter(ticket => ticket.items.length > 0); // 주방 아이템이 있는 티켓만

    console.log(`✅ 테이블 ${tableNumber} 활성 티켓 ${tickets.length}개 반환`);

    res.json({
      success: true,
      tickets: tickets,
      tableNumber: parseInt(tableNumber),
      storeId: parseInt(storeId)
    });

  } catch (error) {
    console.error('❌ KDS 테이블 티켓 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 티켓 조회 실패: ' + error.message
    });
  }
});

module.exports = router;
