
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/pool');
const { storeAuth, checkIdempotency } = require('../mw/auth');

/**
 * [GET] /stores/:storeId/menu - 매장 메뉴 조회
 */
router.get('/stores/:storeId/menu', async (req, res, next) => {
  try {
    const { storeId } = req.params;

    console.log(`🍽️ POS 매장 ${storeId} 메뉴 조회 요청`);

    // 매장 존재 확인
    const storeResult = await pool.query(`
      SELECT id, name, category FROM stores WHERE id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    const store = storeResult.rows[0];

    // 카테고리별 기본 메뉴 생성
    const defaultMenus = getDefaultMenusByCategory(store.category);

    console.log(`✅ POS 매장 ${storeId} 메뉴 ${defaultMenus.length}개 조회 완료`);

    res.json({
      success: true,
      menu: defaultMenus
    });

  } catch (error) {
    console.error('❌ POS 메뉴 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 메뉴 조회 실패'
    });
  }
});

// 기본 메뉴 생성 함수 (카테고리별)
function getDefaultMenusByCategory(category) {
  const menusByCategory = {
    '치킨': [
      { id: 1, name: '양념치킨', price: 18000, description: '매콤달콤한 양념치킨', category: '메인메뉴' },
      { id: 2, name: '후라이드치킨', price: 16000, description: '바삭한 후라이드치킨', category: '메인메뉴' },
      { id: 3, name: '순살치킨', price: 19000, description: '뼈없는 순살치킨', category: '메인메뉴' },
      { id: 4, name: '간장치킨', price: 18000, description: '담백한 간장치킨', category: '메인메뉴' },
      { id: 5, name: '치킨무', price: 3000, description: '시원한 치킨무', category: '사이드' },
      { id: 6, name: '콜라', price: 2000, description: '시원한 콜라', category: '음료' }
    ],
    '양식': [
      { id: 1, name: '마르게리타 피자', price: 15000, description: '클래식 마르게리타', category: '피자' },
      { id: 2, name: '페퍼로니 피자', price: 18000, description: '매콤한 페퍼로니', category: '피자' },
      { id: 3, name: '파스타', price: 12000, description: '크림 파스타', category: '파스타' },
      { id: 4, name: '리조또', price: 14000, description: '버섯 리조또', category: '리조또' },
      { id: 5, name: '샐러드', price: 8000, description: '신선한 샐러드', category: '사이드' },
      { id: 6, name: '콜라', price: 2500, description: '시원한 콜라', category: '음료' }
    ],
    '한식': [
      { id: 1, name: '김치찌개', price: 8000, description: '얼큰한 김치찌개', category: '찌개' },
      { id: 2, name: '된장찌개', price: 7000, description: '구수한 된장찌개', category: '찌개' },
      { id: 3, name: '불고기', price: 15000, description: '달콤한 불고기', category: '메인메뉴' },
      { id: 4, name: '비빔밥', price: 9000, description: '영양만점 비빔밥', category: '메인메뉴' },
      { id: 5, name: '공기밥', price: 1000, description: '갓지은 밥', category: '사이드' },
      { id: 6, name: '음료수', price: 2000, description: '시원한 음료', category: '음료' }
    ]
  };

  return menusByCategory[category] || [
    { id: 1, name: '기본메뉴1', price: 10000, description: '기본 메뉴', category: '메인메뉴' },
    { id: 2, name: '기본메뉴2', price: 12000, description: '기본 메뉴', category: '메인메뉴' },
    { id: 3, name: '음료', price: 2000, description: '시원한 음료', category: '음료' }
  ];
}

/**
 * [GET] /stores/:storeId/table/:tableNumber/all-orders - 테이블별 주문 조회 (새 스키마)
 */
router.get('/stores/:storeId/table/:tableNumber/all-orders', async (req, res, next) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`📋 테이블 ${tableNumber} 주문 조회 요청 (매장 ${storeId})`);

    // 해당 테이블의 열린 체크들 조회
    const checksResult = await pool.query(`
      SELECT 
        c.id as check_id,
        c.status,
        c.opened_at as created_at,
        c.user_id,
        c.guest_phone
      FROM checks c
      WHERE c.store_id = $1 AND c.table_number = $2 AND c.status = 'open'
      ORDER BY c.opened_at DESC
    `, [storeId, tableNumber]);

    if (checksResult.rows.length === 0) {
      return res.json({
        success: true,
        currentSession: null,
        items: []
      });
    }

    // 가장 최근 체크의 아이템들 조회 (새 스키마)
    const currentCheck = checksResult.rows[0];
    
    const itemsResult = await pool.query(`
      SELECT 
        ci.id,
        ci.menu_name as "menuName",
        ci.unit_price as price,
        ci.quantity,
        ci.status as "cookingStatus",
        ci.ordered_at as created_at
      FROM check_items ci
      WHERE ci.check_id = $1
      ORDER BY ci.ordered_at ASC
    `, [currentCheck.check_id]);

    const items = itemsResult.rows.map(item => ({
      id: item.id,
      menuName: item.menuName,
      price: item.price,
      quantity: item.quantity,
      cookingStatus: item.cookingStatus.toUpperCase(),
      created_at: item.created_at
    }));

    console.log(`✅ 테이블 ${tableNumber} 주문 ${items.length}개 조회 완료`);

    res.json({
      success: true,
      currentSession: {
        orderId: currentCheck.check_id,
        status: currentCheck.status,
        items: items
      }
    });

  } catch (error) {
    console.error('❌ 테이블 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 주문 조회 실패'
    });
  }
});

/**
 * [POST] /orders - 새 주문 생성 (새 스키마)
 */
router.post('/orders', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { 
      storeId, 
      storeName, 
      tableNumber, 
      items = [], 
      totalAmount, 
      userId = null, 
      guestPhone = null, 
      customerName = '포스 주문' 
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '주문 아이템이 필요합니다'
      });
    }

    await client.query('BEGIN');

    // 1. 체크 생성 (새 스키마)
    const checkResult = await client.query(`
      INSERT INTO checks (
        store_id, table_number, user_id, guest_phone, customer_name, 
        status, source_system
      )
      VALUES ($1, $2, $3, $4, $5, 'open', 'POS')
      RETURNING id, opened_at
    `, [storeId, tableNumber, userId, guestPhone, customerName]);

    const checkId = checkResult.rows[0].id;

    // 2. 체크 아이템들 생성 (새 스키마)
    for (const item of items) {
      const { name, price, quantity } = item;
      
      await client.query(`
        INSERT INTO check_items (
          check_id, menu_name, unit_price, quantity, status
        )
        VALUES ($1, $2, $3, $4, 'ordered')
      `, [checkId, name, price, quantity]);
    }

    await client.query('COMMIT');

    console.log(`✅ 새 주문 생성: 체크 ${checkId} (매장 ${storeId}, 테이블 ${tableNumber})`);

    res.status(201).json({
      success: true,
      orderId: checkId,
      checkId: checkId,
      status: 'open'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 생성 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

/**
 * [GET] /checks/:id/summary - 체크 요약 정보 (새 스키마)
 */
router.get('/checks/:id/summary', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const checkId = parseInt(req.params.id);

    // 체크 존재 확인
    const checkResult = await client.query(`
      SELECT id, store_id, status, final_amount, subtotal_amount
      FROM checks 
      WHERE id = $1
    `, [checkId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '체크를 찾을 수 없습니다'
      });
    }

    const check = checkResult.rows[0];

    // 아이템 상태별 카운트 (새 스키마)
    const itemStatsResult = await client.query(`
      SELECT status, COUNT(*) as count
      FROM check_items
      WHERE check_id = $1
      GROUP BY status
    `, [checkId]);

    const items = {
      ordered: 0,
      preparing: 0, 
      ready: 0,
      served: 0,
      canceled: 0
    };

    itemStatsResult.rows.forEach(row => {
      items[row.status] = parseInt(row.count);
    });

    // 결제 내역 (새 스키마)
    const paymentsResult = await client.query(`
      SELECT id, amount, status, payment_method, completed_at
      FROM payments
      WHERE check_id = $1
      ORDER BY created_at DESC
    `, [checkId]);

    const payments = paymentsResult.rows.map(p => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      method: p.payment_method,
      paid_at: p.completed_at
    }));

    const paidTotal = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      check_id: checkId,
      final_total: check.final_amount || 0,
      paid_total: paidTotal,
      due: Math.max(0, (check.final_amount || 0) - paidTotal),
      items: items,
      payments: payments
    });

  } catch (error) {
    console.error('❌ 체크 요약 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '체크 요약 조회 실패'
    });
  } finally {
    client.release();
  }
});

/**
 * [PATCH] /check-items/:id - 아이템 상태 변경 (새 스키마)
 */
router.patch('/check-items/:id', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const itemId = parseInt(req.params.id);
    const { status, notes } = req.body;

    if (!['ordered', 'preparing', 'ready', 'served', 'canceled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 상태입니다'
      });
    }

    await client.query('BEGIN');

    // 아이템 존재 확인 (새 스키마)
    const itemResult = await client.query(`
      SELECT ci.id, ci.status, ci.check_id, c.store_id
      FROM check_items ci
      JOIN checks c ON ci.check_id = c.id
      WHERE ci.id = $1
    `, [itemId]);

    if (itemResult.rows.length === 0) {
      throw new Error('아이템을 찾을 수 없습니다');
    }

    const item = itemResult.rows[0];

    // 이미 served된 항목은 canceled로 변경 불가
    if (item.status === 'served' && status === 'canceled') {
      return res.status(409).json({
        success: false,
        error: '이미 서빙된 항목은 취소할 수 없습니다'
      });
    }

    // 상태 업데이트 (새 스키마)
    const updateFields = [`status = $1`];
    const updateValues = [status];
    
    if (status === 'preparing') {
      updateFields.push(`preparing_at = CURRENT_TIMESTAMP`);
    } else if (status === 'ready') {
      updateFields.push(`ready_at = CURRENT_TIMESTAMP`);
    } else if (status === 'served') {
      updateFields.push(`served_at = CURRENT_TIMESTAMP`);
    } else if (status === 'canceled') {
      updateFields.push(`canceled_at = CURRENT_TIMESTAMP`);
    }

    if (notes) {
      updateFields.push(`kitchen_notes = $${updateValues.length + 1}`);
      updateValues.push(notes);
    }

    updateValues.push(itemId);

    await client.query(`
      UPDATE check_items 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${updateValues.length}
    `, updateValues);

    await client.query('COMMIT');

    console.log(`✅ 아이템 상태 변경: ${itemId} (${item.status} → ${status})`);

    res.json({
      success: true,
      item_id: itemId,
      status: status
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 아이템 상태 변경 실패:', error);
    res.status(500).json({
      success: false,
      error: '아이템 상태 변경 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

/**
 * [POST] /payments - 결제 처리 (새 스키마)
 */
router.post('/payments', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { 
      check_id, 
      payment_method, 
      amount, 
      payment_data = {} 
    } = req.body;

    if (!['CASH', 'CARD', 'TOSS', 'MIXED'].includes(payment_method)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 결제 방법입니다'
      });
    }

    await client.query('BEGIN');

    // 체크 존재 확인
    const checkResult = await client.query(`
      SELECT id, store_id, status
      FROM checks 
      WHERE id = $1
    `, [check_id]);

    if (checkResult.rows.length === 0) {
      throw new Error('체크를 찾을 수 없습니다');
    }

    if (checkResult.rows[0].status === 'closed') {
      throw new Error('이미 종료된 체크입니다');
    }

    // 결제 생성 (새 스키마)
    const paymentResult = await client.query(`
      INSERT INTO payments (
        check_id, payment_method, amount, status, 
        payment_data, completed_at
      )
      VALUES ($1, $2, $3, 'completed', $4, CURRENT_TIMESTAMP)
      RETURNING id, status, completed_at
    `, [check_id, payment_method, amount, JSON.stringify(payment_data)]);

    const payment = paymentResult.rows[0];

    // 체크 종료 (새 스키마)
    await client.query(`
      UPDATE checks 
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [check_id]);

    await client.query('COMMIT');

    console.log(`✅ 결제 완료: ${payment.id} (체크 ${check_id})`);

    res.status(201).json({
      success: true,
      payment_id: payment.id,
      status: payment.status
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
