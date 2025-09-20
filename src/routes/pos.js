const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');

/**
 * 새로운 POS 시스템 API (orders, order_tickets, order_items 스키마 사용)
 */

/**
 * [POST] /orders/confirm - POS 주문 확정 (카트 -> order_tickets/order_items 생성)
 * 비회원 포스 주문 지원 (user_id, guest_phone NULL)
 */
router.post('/orders/confirm', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, items, totalAmount, orderType, isGuestOrder = true } = req.body;

    console.log(`🛒 POS 주문 확정: 매장 ${storeId}, 테이블 ${tableNumber}, ${items.length}개 아이템 (비회원: ${isGuestOrder})`);

    if (!storeId || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // 1. 해당 테이블의 활성 주문 확인 또는 생성
    let orderId;

    const existingOrderResult = await client.query(`
      SELECT id FROM orders 
      WHERE store_id = $1 AND table_num = $2 AND status = 'OPEN'
      ORDER BY created_at DESC 
      LIMIT 1
    `, [storeId, tableNumber]);

    if (existingOrderResult.rows.length > 0) {
      // 기존 주문에 추가
      orderId = existingOrderResult.rows[0].id;
      console.log(`📋 기존 주문 ${orderId}에 추가`);

      // 기존 주문 금액 업데이트
      await client.query(`
        UPDATE orders 
        SET total_price = COALESCE(total_price, 0) + $1,
            updated_at = NOW()
        WHERE id = $2
      `, [totalAmount, orderId]);
    } else {
      // 새 주문 생성 (비회원 POS 주문: user_id, guest_phone NULL)
      const orderResult = await client.query(`
        INSERT INTO orders (
          store_id, 
          table_num,
          user_id,
          guest_phone,
          source,
          status, 
          payment_status,
          total_price,
          created_at
        ) VALUES ($1, $2, NULL, NULL, 'POS', 'OPEN', 'PENDING', $3, NOW())
        RETURNING id
      `, [storeId, tableNumber, totalAmount]);

      orderId = orderResult.rows[0].id;
      console.log(`📋 새 비회원 POS 주문 ${orderId} 생성 (user_id: NULL, guest_phone: NULL)`);

      // store_tables의 processing_order_id 업데이트
      await client.query(`
        UPDATE store_tables 
        SET processing_order_id = $1,
            status = 'OCCUPIED'
        WHERE store_id = $2 AND id = $3
      `, [orderId, storeId, tableNumber]);
    }

    // 2. order_tickets 테이블에 티켓 생성
    const ticketResult = await client.query(`
      INSERT INTO order_tickets (
        order_id,
        store_id,
        batch_no,
        status,
        payment_type,
        source,
        table_num,
        created_at,
        paid_status
      ) VALUES ($1, $2, 
        (SELECT COALESCE(MAX(batch_no), 0) + 1 FROM order_tickets WHERE order_id = $1),
        'PENDING', 'POSTPAID', 'POS', $3, NOW(), 'UNPAID')
      RETURNING id, batch_no
    `, [orderId, storeId, tableNumber]);

    const { id: ticketId, batch_no: batchNo } = ticketResult.rows[0];

    // 3. order_items 테이블에 주문 아이템들 생성
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id,
          ticket_id,
          menu_name,
          unit_price,
          quantity,
          total_price,
          item_status,
          cook_station,
          created_at,
          menu_id,
          store_id
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, NOW(), $8, $9)
      `, [
        orderId,
        ticketId,
        item.name,
        item.price,
        item.quantity,
        item.price * item.quantity,
        item.cook_station || 'KITCHEN',
        item.id,
        item.store_id
      ]);
    }

    await client.query('COMMIT');

    console.log(`✅ POS 주문 확정 완료: 주문 ID ${orderId}, 티켓 ID ${ticketId}, 배치 ${batchNo}`);

    res.json({
      success: true,
      orderId: orderId,
      ticketId: ticketId,
      batchNo: batchNo,
      message: '주문이 성공적으로 확정되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 주문 확정 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 확정 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    client.release();
  }
});

/**
 * [POST] /guest-orders/confirm - 비회원 POS 주문 확정 전용 API
 * TLL 연동되지 않은 테이블에서의 비회원 주문 처리
 */
router.post('/guest-orders/confirm', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, items, totalAmount } = req.body;

    console.log(`👤 비회원 POS 주문 확정: 매장 ${storeId}, 테이블 ${tableNumber}, ${items.length}개 아이템`);

    if (!storeId || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // 1. 해당 테이블의 기존 비회원 주문 확인
    let orderId;

    const existingOrderResult = await client.query(`
      SELECT id FROM orders 
      WHERE store_id = $1 
        AND table_num = $2 
        AND status = 'OPEN'
        AND user_id IS NULL 
        AND guest_phone IS NULL
        AND source = 'POS'
      ORDER BY created_at DESC 
      LIMIT 1
    `, [storeId, tableNumber]);

    if (existingOrderResult.rows.length > 0) {
      // 기존 비회원 주문에 추가
      orderId = existingOrderResult.rows[0].id;
      console.log(`📋 기존 비회원 주문 ${orderId}에 추가`);

      // 기존 주문 금액 업데이트
      await client.query(`
        UPDATE orders 
        SET total_price = COALESCE(total_price, 0) + $1,
            updated_at = NOW()
        WHERE id = $2
      `, [totalAmount, orderId]);
    } else {
      // 새 비회원 주문 생성
      const orderResult = await client.query(`
        INSERT INTO orders (
          store_id, 
          table_num,
          user_id,
          guest_phone,
          source,
          status, 
          payment_status,
          total_price,
          created_at
        ) VALUES ($1, $2, NULL, NULL, 'POS', 'OPEN', 'PENDING', $3, NOW())
        RETURNING id
      `, [storeId, tableNumber, totalAmount]);

      orderId = orderResult.rows[0].id;
      console.log(`📋 새 비회원 POS 주문 ${orderId} 생성`);

      // store_tables 상태 업데이트
      await client.query(`
        UPDATE store_tables 
        SET processing_order_id = $1,
            status = 'OCCUPIED'
        WHERE store_id = $2 AND id = $3
      `, [orderId, storeId, tableNumber]);
    }

    // 2. order_tickets 테이블에 티켓 생성
    const ticketResult = await client.query(`
      INSERT INTO order_tickets (
        order_id,
        store_id,
        batch_no,
        status,
        payment_type,
        source,
        table_num,
        created_at,
        paid_status
      ) VALUES ($1, $2, 
        (SELECT COALESCE(MAX(batch_no), 0) + 1 FROM order_tickets WHERE order_id = $1),
        'PENDING', 'POSTPAID', 'POS', $3, NOW(), 'UNPAID')
      RETURNING id, batch_no
    `, [orderId, storeId, tableNumber]);

    const { id: ticketId, batch_no: batchNo } = ticketResult.rows[0];

    // 3. order_items 테이블에 주문 아이템들 생성
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id,
          ticket_id,
          menu_name,
          unit_price,
          quantity,
          total_price,
          item_status,
          cook_station,
          created_at,
          menu_id,
          store_id
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, NOW(), $8, $9)
      `, [
        orderId,
        ticketId,
        item.name,
        item.price,
        item.quantity,
        item.price * item.quantity,
        item.cook_station || 'KITCHEN',
        item.id,
        storeId
      ]);
    }

    await client.query('COMMIT');

    console.log(`✅ 비회원 POS 주문 확정 완료: 주문 ID ${orderId}, 티켓 ID ${ticketId}, 배치 ${batchNo}`);

    res.json({
      success: true,
      orderId: orderId,
      ticketId: ticketId,
      batchNo: batchNo,
      isGuestOrder: true,
      message: '비회원 주문이 성공적으로 확정되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 비회원 POS 주문 확정 실패:', error);
    res.status(500).json({
      success: false,
      error: '비회원 주문 확정 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    client.release();
  }
});


/**
 * [GET] /stores/:storeId/menu - 매장 메뉴 조회
 */
router.get('/stores/:storeId/menu', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🍽️ POS 매장 ${storeId} 메뉴 조회 요청`);

    // 매장 존재 확인
    const storeResult = await pool.query(`
      SELECT id, name FROM stores WHERE id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    // store_menu 테이블에서 메뉴 조회
    const menuResult = await pool.query(`
      SELECT 
        id,
        name,
        price,
        description,
        cook_station as category
      FROM store_menu
      WHERE store_id = $1
      ORDER BY id ASC
    `, [storeId]);

    const menu = menuResult.rows.length > 0 ? menuResult.rows : getDefaultMenu();

    console.log(`✅ POS 매장 ${storeId} 메뉴 ${menu.length}개 조회 완료`);

    res.json({
      success: true,
      menu: menu
    });

  } catch (error) {
    console.error('❌ POS 메뉴 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 메뉴 조회 실패',
      details: error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/orders/active - 매장의 활성 주문들
 */
router.get('/stores/:storeId/orders/active', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`📊 매장 ${storeId} 활성 주문 조회 (store_tables.processing_order_id 기반)`);

    const result = await pool.query(`
      SELECT 
        st.id as table_number,
        o.id as order_id,
        COALESCE(u.name, '포스고객') as customer_name,
        o.user_id,
        o.total_price as total_amount,
        o.status,
        o.created_at as opened_at,
        o.source as source_system,
        COUNT(oi.id) as item_count
      FROM store_tables st
      JOIN orders o ON st.processing_order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status != 'CANCELED'
      WHERE st.store_id = $1 AND st.processing_order_id IS NOT NULL
      GROUP BY st.id, o.id, u.name, o.user_id, 
               o.total_price, o.status, o.created_at, o.source
      ORDER BY o.created_at ASC
    `, [storeId]);

    const activeOrders = result.rows.map(row => ({
      checkId: row.order_id, // order_id를 checkId로 사용
      tableNumber: row.table_number,
      customerName: row.customer_name,
      isGuest: !row.user_id,
      totalAmount: row.total_amount || 0,
      status: row.status,
      openedAt: row.opened_at,
      sourceSystem: row.source_system,
      itemCount: parseInt(row.item_count)
    }));

    console.log(`✅ 매장 ${storeId} 활성 주문 ${activeOrders.length}개 조회 완료`);

    res.json({
      success: true,
      activeOrders: activeOrders
    });

  } catch (error) {
    console.error('❌ 활성 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '활성 주문 조회 실패'
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/all-orders - 테이블별 모든 주문 조회
 */
router.get('/stores/:storeId/table/:tableNumber/all-orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 파라미터: storeId=${storeId}, tableNumber=${tableNumber}`
      });
    }

    console.log(`📋 테이블 ${parsedTableNumber} 주문 조회 요청 (매장 ${parsedStoreId})`);

    // 해당 테이블의 활성 주문들 조회 (UNPAID 상태만)
    const ordersResult = await pool.query(`
      SELECT 
        o.id as order_id,
        ot.id as ticket_id,
        o.status,
        o.created_at,
        o.user_id,
        COALESCE(u.name, '포스고객') as customer_name,
        o.total_price as final_amount
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.store_id = $1 
        AND o.table_num = $2 
        AND o.status = 'OPEN'
        AND ot.paid_status = 'UNPAID'
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [parsedStoreId, parsedTableNumber]);

    if (ordersResult.rows.length === 0) {
      console.log(`ℹ️ 테이블 ${tableNumber}에 활성 주문 없음`);
      return res.json({
        success: true,
        currentSession: null,
        items: []
      });
    }

    const currentOrder = ordersResult.rows[0];

    // 주문 아이템들 조회
    const itemsResult = await pool.query(`
      SELECT 
        oi.id,
        oi.menu_name as "menuName",
        oi.unit_price as price,
        oi.quantity,
        oi.item_status as "cookingStatus",
        oi.created_at,
        oi.options
      FROM order_items oi
      WHERE oi.ticket_id = $1 AND oi.item_status != 'CANCELED'
      ORDER BY oi.created_at ASC
    `, [currentOrder.order_id]);

    const items = itemsResult.rows.map(item => ({
      id: item.id,
      menuName: item.menuName,
      price: item.price,
      quantity: item.quantity,
      cookingStatus: item.cookingStatus,
      created_at: item.created_at,
      isConfirmed: true,
      sessionId: currentOrder.ticket_id
    }));

    console.log(`✅ 테이블 ${tableNumber} 주문 ${items.length}개 조회 완료`);

    res.json({
      success: true,
      currentSession: {
        orderId: currentOrder.order_id,
        checkId: currentOrder.ticket_id,
        status: currentOrder.status,
        customerName: currentOrder.customer_name,
        totalAmount: currentOrder.final_amount || 0,
        items: items
      }
    });

  } catch (error) {
    console.error('❌ 테이블 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 주문 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/order-items - 테이블별 order_items 조회 (수량 통합용)
 */
router.get('/stores/:storeId/table/:tableNumber/order-items', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 파라미터: storeId=${storeId}, tableNumber=${tableNumber}`
      });
    }

    console.log(`📋 POS order_items 조회 (미지불만): 매장 ${parsedStoreId}, 테이블 ${parsedTableNumber}`);

    // 먼저 해당 테이블의 모든 티켓 상태 확인 (디버깅용)
    const debugResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.paid_status,
        ot.source,
        o.status as order_status,
        COUNT(oi.id) as item_count
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE o.store_id = $1 AND o.table_num = $2
      GROUP BY ot.id, ot.paid_status, ot.source, o.status
      ORDER BY ot.created_at DESC
    `, [parsedStoreId, parsedTableNumber]);

    console.log(`🔍 테이블 ${parsedTableNumber} 모든 티켓 상태:`, debugResult.rows);

    // 해당 테이블의 order_items 조회 (POS 소스, UNPAID + OPEN 상태만 확실히 필터링)
    const result = await pool.query(`
      SELECT 
        oi.id,
        oi.menu_id,
        oi.menu_name,
        oi.unit_price,
        oi.quantity,
        oi.total_price,
        oi.item_status,
        oi.cook_station,
        oi.ticket_id,
        oi.created_at,
        ot.order_id,
        ot.paid_status,
        o.status as order_status
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      JOIN orders o ON ot.order_id = o.id
      WHERE o.store_id = $1 
        AND o.table_num = $2 
        AND ot.source = 'POS'
        AND ot.paid_status = 'UNPAID'  -- 반드시 미지불만
        AND ot.paid_status != 'PAID'   -- PAID 상태 명시적 배제
        AND o.status = 'OPEN'
        AND oi.item_status NOT IN ('CANCELLED', 'REFUNDED')
      ORDER BY oi.created_at ASC
    `, [parsedStoreId, parsedTableNumber]);

    // 결과에서 PAID 상태 완전 제거 (이중 체크)
    const filteredResults = result.rows.filter(item => {
      const isPaid = item.paid_status === 'PAID';
      if (isPaid) {
        console.warn(`⚠️ PAID 상태 아이템 발견 및 제거:`, {
          ticket_id: item.ticket_id,
          menu_name: item.menu_name,
          paid_status: item.paid_status
        });
      }
      return !isPaid && item.paid_status === 'UNPAID';
    });

    console.log(`✅ POS 미지불 order_items ${filteredResults.length}개 조회 완료 (원본: ${result.rows.length}개)`);
    
    // 디버깅용 로그 추가
    if (filteredResults.length > 0) {
      console.log(`🔍 첫 번째 아이템 상태:`, {
        paid_status: filteredResults[0].paid_status,
        order_status: filteredResults[0].order_status,
        item_status: filteredResults[0].item_status
      });
    }

    // 각 아이템의 결제 상태 확인
    filteredResults.forEach((item, index) => {
      if (item.paid_status !== 'UNPAID') {
        console.error(`❌ 비미지불 아이템 발견 [${index}]:`, {
          menu_name: item.menu_name,
          paid_status: item.paid_status,
          ticket_id: item.ticket_id
        });
      }
    });

    res.json({
      success: true,
      orderItems: filteredResults,
      count: filteredResults.length
    });

  } catch (error) {
    console.error('❌ POS order_items 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'order_items 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/order-tickets - 테이블별 POS 주문 티켓 조회
 */
router.get('/stores/:storeId/table/:tableNumber/order-tickets', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    console.log(`🎫 테이블 ${parsedTableNumber}의 POS 주문 티켓 조회 (매장 ${parsedStoreId})`);

    // 해당 테이블의 미지불 POS 티켓들과 그 아이템들을 조회
    const result = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.batch_no,
        ot.status,
        ot.paid_status,
        ot.created_at,
        ot.order_id,
        o.status as order_status,
        
        -- 티켓의 모든 아이템 정보를 JSON으로 집계
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', oi.id,
              'menu_id', oi.menu_id,
              'menu_name', oi.menu_name,
              'unit_price', oi.unit_price,
              'quantity', oi.quantity,
              'total_price', oi.total_price,
              'item_status', oi.item_status,
              'cook_station', oi.cook_station
            ) ORDER BY oi.created_at
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) as items
        
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id 
        AND oi.item_status NOT IN ('CANCELLED', 'REFUNDED')
      WHERE o.store_id = $1 
        AND o.table_num = $2 
        AND ot.source = 'POS'
        AND ot.paid_status = 'UNPAID'
        AND o.status = 'OPEN'
        AND ot.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY ot.id, ot.batch_no, ot.status, ot.paid_status, ot.created_at, ot.order_id, o.status
      ORDER BY ot.created_at DESC
    `, [parsedStoreId, parsedTableNumber]);

    console.log(`📊 조회된 POS 티켓: ${result.rows.length}개`);

    if (result.rows.length > 0) {
      result.rows.forEach(ticket => {
        console.log(`🎫 티켓 #${ticket.batch_no}: ${ticket.items.length}개 아이템, 상태: ${ticket.status}`);
      });
    }

    res.json({
      success: true,
      orderTickets: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('❌ POS 주문 티켓 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 주문 티켓 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/tll-orders - 테이블별 TLL 주문 조회
 */
router.get('/stores/:storeId/table/:tableNumber/tll-orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 파라미터: storeId=${storeId}, tableNumber=${tableNumber}`
      });
    }

    console.log(`📱 TLL 주문 조회: 매장 ${parsedStoreId}, 테이블 ${parsedTableNumber}`);

    // TLL 주문 조회 (order_items 기준으로 조회, TLL 소스의 모든 상태)
    const tllOrdersResult = await pool.query(`
      SELECT 
        oi.id,
        oi.menu_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.item_status,
        oi.cook_station,
        oi.order_id,
        ot.paid_status,
        ot.created_at as ticket_created_at,
        o.user_id,
        o.guest_phone,
        o.created_at as order_created_at
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      JOIN orders o ON ot.order_id = o.id
      WHERE o.store_id = $1 
        AND o.table_num = $2 
        AND ot.source = 'TLL'
        AND oi.item_status != 'CANCELLED'
        AND o.status != 'CANCELLED'
      ORDER BY oi.created_at DESC
    `, [parsedStoreId, parsedTableNumber]);

    console.log(`📱 TLL 주문 조회 결과: ${tllOrdersResult.rows.length}개 아이템 발견`);

    // 사용자 정보 조회 (첫 번째 TLL 주문의 사용자 정보 사용)
    let userInfo = null;
    if (tllOrdersResult.rows.length > 0) {
      const firstOrder = tllOrdersResult.rows[0];

      if (firstOrder.user_id) {
        // 회원 주문인 경우
        const userResult = await pool.query(`
          SELECT id, name, phone,  created_at
          FROM users
          WHERE id = $1
        `, [firstOrder.user_id]);

        if (userResult.rows.length > 0) {
          userInfo = userResult.rows[0];
          console.log(`📱 TLL 회원 사용자 정보 로드: ${userInfo.name}`);
        }
      } else if (firstOrder.guest_phone) {
        // 게스트 주문인 경우
        userInfo = {
          id: null,
          name: '게스트',
          phone: firstOrder.guest_phone,
          guest_phone: firstOrder.guest_phone,
          point: 0,
          created_at: null
        };
        console.log(`📱 TLL 게스트 사용자 정보 로드: ${userInfo.phone}`);
      }
    }

    res.json({
      success: true,
      tllOrders: tllOrdersResult.rows,
      userInfo: userInfo
    });

  } catch (error) {
    console.error('❌ TLL 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 주문 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/session-status - 테이블 세션 상태 확인
 */
router.get('/stores/:storeId/table/:tableNumber/session-status', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 테이블 ${tableNumber} 세션 상태 확인 (매장 ${storeId})`);

    const result = await pool.query(`
      SELECT 
        o.id,
        o.status,
        o.created_at,
        COALESCE(u.name, '포스고객') as customer_name,
        o.source,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.ticket_id
      WHERE o.store_id = $1 AND o.table_num = $2 AND o.status = 'OPEN'
      GROUP BY o.id, o.status, o.created_at, u.name, o.source
      ORDER BY o.created_at DESC
    `, [storeId, tableNumber]);

    const hasActiveSession = result.rows.length > 0;
    const sessionInfo = hasActiveSession ? {
      orderId: result.rows[0].id,
      status: result.rows[0].status,
      startTime: result.rows[0].created_at,
      customerName: result.rows[0].customer_name,
      sourceSystem: result.rows[0].source,
      itemCount: parseInt(result.rows[0].item_count)
    } : null;

    console.log(`✅ 테이블 ${tableNumber} 세션 상태 확인 완료 - 활성 세션: ${hasActiveSession}`);

    res.json({
      success: true,
      hasActiveSession,
      sessionInfo
    });

  } catch (error) {
    console.error('❌ 세션 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '세션 상태 확인 실패: ' + error.message
    });
  }
});

/**
 * [POST] /orders - POS 주문 생성 (기존 API - 호환성용)
 */
router.post('/orders', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, items, totalAmount, orderType } = req.body;

    console.log(`🛒 POS 주문 생성: 매장 ${storeId}, 테이블 ${tableNumber}, ${items.length}개 아이템`);

    if (!storeId || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // 1. orders 테이블에 주문 생성
    const orderResult = await client.query(`
      INSERT INTO orders (
        store_id, 
        table_num,
        source,
        status, 
        payment_status,
        total_price,
        created_at
      ) VALUES ($1, $2, 'POS', 'OPEN', 'PENDING', $3, NOW())
      RETURNING id
    `, [storeId, tableNumber, totalAmount]);

    const orderId = orderResult.rows[0].id;

    // 2. order_tickets 테이블에 티켓 생성
    const ticketResult = await client.query(`
      INSERT INTO order_tickets (
        order_id,
        store_id,
        batch_no,
        status,
        payment_type,
        source,
        table_num,
        created_at,
        paid_status
      ) VALUES ($1, $2, 1, 'PENDING', 'POSTPAID', 'POS', $3, NOW(), 'UNPAID')
      RETURNING id
    `, [orderId, storeId, tableNumber]);

    const ticketId = ticketResult.rows[0].id;

    // 3. order_items 테이블에 주문 아이템들 생성
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id,
          ticket_id,
          menu_name,
          unit_price,
          quantity,
          subtotal,
          item_status,
          options,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, NOW())
      `, [
        orderId,
        ticketId,
        item.name,
        item.price,
        item.quantity,
        item.price * item.quantity,
        item.options ? JSON.stringify(item.options) : null
      ]);
    }

    await client.query('COMMIT');

    console.log(`✅ POS 주문 생성 완료: 주문 ID ${orderId}, 티켓 ID ${ticketId}`);

    res.json({
      success: true,
      orderId: orderId,
      ticketId: ticketId,
      message: '주문이 성공적으로 생성되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 생성 중 오류가 발생했습니다'
    });
  } finally {
    client.release();
  }
});



/**
 * [GET] /stores/:storeId/table/:tableNumber/active-order - 현재 테이블의 활성 주문 조회
 */
router.get('/stores/:storeId/table/:tableNumber/active-order', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 파라미터: storeId=${storeId}, tableNumber=${tableNumber}`
      });
    }

    console.log(`🔍 활성 주문 조회: 매장 ${parsedStoreId}, 테이블 ${parsedTableNumber}`);

    // 현재 테이블에서 UNPAID 상태의 티켓이 있는 주문 찾기 (store_tables.id와 매칭)
    const activeOrderResult = await pool.query(`
      SELECT DISTINCT o.id as order_id, o.created_at, o.total_price,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id AND oi.item_status != 'CANCELLED'
      WHERE o.store_id = $1 
        AND o.table_num = $2 
        AND ot.paid_status = 'UNPAID'
        AND o.status = 'OPEN'
      GROUP BY o.id, o.created_at, o.total_price
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [parsedStoreId, parsedTableNumber]);

    if (activeOrderResult.rows.length === 0) {
      console.log(`ℹ️ 테이블 ${parsedTableNumber}에 활성 주문이 없습니다`);
      return res.json({
        success: true,
        hasActiveOrder: false,
        message: '활성 주문이 없습니다'
      });
    }

    const orderData = activeOrderResult.rows[0];
    console.log(`✅ 활성 주문 발견: ${orderData.order_id}, 아이템 ${orderData.item_count}개`);

    res.json({
      success: true,
      hasActiveOrder: true,
      orderId: orderData.order_id,
      totalAmount: orderData.total_price || 0,
      itemCount: parseInt(orderData.item_count) || 0,
      storeId: parsedStoreId,
      tableNumber: parsedTableNumber
    });

  } catch (error) {
    console.error('❌ 활성 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '활성 주문 조회 실패: ' + error.message
    });
  }
});

// 기본 메뉴 데이터
function getDefaultMenu() {
  return [
    { id: 1, name: '김치찌개', price: 8000, description: '돼지고기와 김치가 들어간 찌개', category: '찌개류' },
    { id: 2, name: '된장찌개', price: 7000, description: '국산 콩으로 만든 된장찌개', category: '찌개류' },
    { id: 3, name: '불고기', price: 15000, description: '양념에 재운 소고기 불고기', category: '구이류' },
    { id: 4, name: '비빔밥', price: 9000, description: '각종 나물이 들어간 비빔밥', category: '밥류' },
    { id: 5, name: '냉면', price: 10000, description: '시원한 물냉면', category: '면류' },
    { id: 6, name: '공기밥', price: 1000, description: '갓 지은 따뜻한 쌀밥', category: '기타' },
    { id: 7, name: '콜라', price: 2000, description: '시원한 콜라', category: '음료' },
    { id: 8, name: '사이다', price: 2000, description: '시원한 사이다', category: '음료' }
  ];
}

module.exports = router;