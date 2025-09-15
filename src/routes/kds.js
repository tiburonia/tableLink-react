
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

    console.log(`🍳 KDS 주문 목록 조회 - 매장 ${storeId}`);

    const result = await pool.query(`
      SELECT 
        o.id as order_id,
        ot.id as ticket_id,
        ot.status as ticket_status,
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
            'kitchenNotes', '',
            'priority', 0,
            'cook_station', COALESCE(oi.cook_station, 'KITCHEN')
          ) ORDER BY oi.created_at
        ) as items
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE o.store_id = $1 
        AND o.status = 'OPEN'
        AND ot.status IN ('PENDING', 'COOKING')
        AND ot.display_status != 'UNVISIBLE'
        AND EXISTS (
          SELECT 1 FROM order_items oi2 
          WHERE oi2.ticket_id = ot.id 
          AND COALESCE(oi2.cook_station, 'KITCHEN') != 'DRINK'
          AND COALESCE(oi2.cook_station, 'KITCHEN') != 'NO_COOK'
        )
      GROUP BY o.id, ot.id, ot.status, o.table_num, o.created_at, o.source
      ORDER BY o.created_at ASC
    `, [parseInt(storeId)]);

    // renderKDS.js에서 기대하는 형태로 변환 - cook_station 필터링 적용
    const orders = result.rows.map(order => {
      // 조리가 필요한 아이템만 필터링 (DRINK, NO_COOK 제외)
      const filteredItems = (order.items || []).filter(item => {
        const cookStation = item.cook_station || 'KITCHEN';
        return cookStation !== 'DRINK' && cookStation !== 'NO_COOK';
      });

      return {
        check_id: order.ticket_id,
        id: order.order_id,
        ticket_id: order.ticket_id,
        customer_name: order.customer_name || `테이블 ${order.table_num}`,
        table_number: order.table_num,
        status: order.ticket_status?.toUpperCase() || 'PENDING',
        created_at: order.created_at,
        updated_at: order.created_at,
        items: filteredItems,
        original_items_count: order.items?.length || 0,
        filtered_items_count: filteredItems.length
      };
    }).filter(order => order.items.length > 0); // 조리할 아이템이 없는 티켓은 제외

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

// 🖨️ KDS 티켓 출력 상태 업데이트 API
router.put('/tickets/:ticketId/print', async (req, res) => {
  const client = await pool.connect();

  try {
    const { ticketId } = req.params;

    console.log(`🖨️ KDS 티켓 ${ticketId} 출력 처리 - PRINTED 상태로 업데이트`);

    await client.query('BEGIN');

    // order_tickets 테이블에서 출력 상태를 PRINTED로 변경하고 printed_at 설정
    const ticketUpdateResult = await client.query(`
      UPDATE order_tickets
      SET print_status = 'PRINTED',
          printed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, order_id, created_at
    `, [parseInt(ticketId)]);

    if (ticketUpdateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '티켓을 찾을 수 없습니다'
      });
    }

    const { order_id, created_at } = ticketUpdateResult.rows[0];

    // 해당 티켓의 실제 아이템 정보 조회 (KRP 전송용)
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
            'item_status', oi.item_status,
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

    // KDS에서 실제 출력될 아이템만 필터링 (DRINK 제외 등)
    const filteredItems = (orderDetail.items || []).filter(item => {
      // KDS에서 실제로 조리가 필요한 아이템만 출력
      return item.cook_station !== 'DRINK' && 
             item.item_status !== 'CANCELED' &&
             item.item_status !== 'DONE';
    });

    // KRP WebSocket으로 필터링된 출력 요청 전송
    const printData = {
      ticket_id: parseInt(ticketId),
      order_id: orderDetail.order_id,
      table_number: orderDetail.table_num,
      customer_name: orderDetail.customer_name,
      total_amount: filteredItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
      items: filteredItems,
      original_items_count: orderDetail.items?.length || 0,
      filtered_items_count: filteredItems.length,
      created_at: orderDetail.order_created_at,
      timestamp: new Date().toISOString(),
      source: 'kds_print_button',
      filter_applied: true
    };

    console.log(`🖨️ KRP 출력 데이터 준비:`, printData);

    // 전역 브로드캐스트 함수 사용
    if (global.broadcastKRPPrint) {
      global.broadcastKRPPrint(orderDetail.store_id, printData);
    } else {
      console.error(`❌ global.broadcastKRPPrint 함수가 없음 - WebSocket 서버가 초기화되지 않음`);
    }

    res.json({
      success: true,
      message: '출력 처리 완료 - KRP로 전송됨 (KDS 필터링 적용)',
      ticket_id: parseInt(ticketId),
      order_id: orderDetail.order_id,
      print_data: {
        table_number: orderDetail.table_num,
        customer_name: orderDetail.customer_name,
        original_items_count: orderDetail.items?.length || 0,
        filtered_items_count: filteredItems.length,
        filtered_total_amount: filteredItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
        filter_info: {
          excluded_drinks: (orderDetail.items || []).filter(item => item.cook_station === 'DRINK').length,
          excluded_done: (orderDetail.items || []).filter(item => item.item_status === 'DONE').length,
          excluded_canceled: (orderDetail.items || []).filter(item => item.item_status === 'CANCELED').length
        }
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

module.exports = router;
