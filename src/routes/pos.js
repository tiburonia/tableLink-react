const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');

/**
 * 새로운 POS 시스템 API (orders, order_tickets, order_items 스키마 사용)
 */

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

    console.log(`📊 매장 ${storeId} 활성 주문 조회`);

    const result = await pool.query(`
      SELECT 
        o.id as order_id,
        ot.id as ticket_id,
        o.table_num as table_number,
        COALESCE(u.name, '포스고객') as customer_name,
        o.user_id,
        o.total_price as total_amount,
        o.status,
        o.created_at as opened_at,
        o.source as source_system,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id AND oi.item_status != 'CANCELED'
      WHERE o.store_id = $1 AND o.status = 'OPEN'
      GROUP BY o.id, ot.id, o.table_num, u.name, o.user_id, 
               o.total_price, o.status, o.created_at, o.source
      ORDER BY o.created_at ASC
    `, [storeId]);

    const activeOrders = result.rows.map(row => ({
      checkId: row.ticket_id,
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
 * [GET] /stores/:storeId/table/:tableNumber/all-orders - 테이블별 주문 조회
 */
router.get('/stores/:storeId/table/:tableNumber/all-orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`📋 테이블 ${tableNumber} 주문 조회 요청 (매장 ${storeId})`);

    // 해당 테이블의 활성 주문들 조회
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
      WHERE o.store_id = $1 AND o.table_num = $2 AND o.status = 'OPEN'
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

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
      WHERE oi.order_id = $1 AND oi.item_status != 'CANCELED'
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
 * [POST] /stores/:storeId/table/:tableNumber/acquire-lock - 세션 락 획득
 */
router.post('/stores/:storeId/table/:tableNumber/acquire-lock', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;
    const { lockBy = 'POS', lockDuration = 300000 } = req.body;

    const lockKey = `table_${storeId}_${tableNumber}`;

    // 전역 락 저장소 초기화
    if (!global.tableLocks) {
      global.tableLocks = {};
    }

    // 기존 락 확인
    const existingLock = global.tableLocks[lockKey];
    if (existingLock && new Date() < new Date(existingLock.expires)) {
      return res.status(409).json({
        success: false,
        error: `테이블이 ${existingLock.lockedBy}에서 사용 중입니다`,
        lockedBy: existingLock.lockedBy,
        expires: existingLock.expires
      });
    }

    // 새 락 설정
    const lockData = {
      lockedBy: lockBy,
      lockedAt: new Date().toISOString(),
      expires: new Date(Date.now() + lockDuration).toISOString()
    };

    global.tableLocks[lockKey] = lockData;

    console.log(`🔒 테이블 ${tableNumber} 락 획득: ${lockBy}`);

    res.json({
      success: true,
      lockData: lockData
    });

  } catch (error) {
    console.error('❌ 세션 락 획득 실패:', error);
    res.status(500).json({
      success: false,
      error: '세션 락 획득 실패'
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/session-status - 세션 상태 확인
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
      LEFT JOIN order_items oi ON o.id = oi.order_id
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
 * [POST] /orders - POS 주문 생성
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
        created_at
      ) VALUES ($1, $2, 1, 'PENDING', 'POSTPAID', 'POS', $3, NOW())
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