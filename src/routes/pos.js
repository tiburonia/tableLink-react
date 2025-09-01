
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/pool');
const { storeAuth, checkIdempotency } = require('../mw/auth');

/**
 * [GET] /stores/:storeId/menu - 매장 메뉴 조회 (새 스키마)
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

    let menu = [];

    try {
      // 새 스키마: menu_items 테이블에서 실제 메뉴 조회 시도
      const menuResult = await pool.query(`
        SELECT 
          mi.id,
          mi.name,
          mi.price,
          mi.description,
          COALESCE(mg.name, '기본메뉴') as category
        FROM menu_items mi
        LEFT JOIN menu_groups mg ON mi.group_id = mg.id
        WHERE mi.store_id = $1
        ORDER BY COALESCE(mg.display_order, 999) ASC, COALESCE(mi.display_order, 999) ASC
      `, [storeId]);

      menu = menuResult.rows;
    } catch (menuError) {
      console.warn(`⚠️ menu_items 테이블 조회 실패 (매장 ${storeId}), 기본 메뉴 사용:`, menuError.message);
      
      // menu_items 테이블이 없으면 기본 메뉴 사용
      console.log(`⚠️ menu_items 테이블이 없어서 기본 메뉴 사용 (매장 ${storeId})`);
      menu = [];
    }

    // 메뉴가 없으면 카테고리별 기본 메뉴 생성
    if (menu.length === 0) {
      menu = getDefaultMenusByCategory(store.category);
    }

    console.log(`✅ POS 매장 ${storeId} 메뉴 ${menu.length}개 조회 완료`);

    res.json({
      success: true,
      menu: menu
    });

  } catch (error) {
    console.error('❌ POS 메뉴 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 메뉴 조회 실패'
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/all-orders - 테이블별 주문 조회 (새 스키마)
 */
router.get('/stores/:storeId/table/:tableNumber/all-orders', async (req, res, next) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`📋 테이블 ${tableNumber} 주문 조회 요청 (매장 ${storeId})`);

    // 해당 테이블의 열린 체크들 조회 (새 스키마)
    const checksResult = await pool.query(`
      SELECT 
        c.id as check_id,
        c.status,
        c.opened_at as created_at,
        c.user_id,
        c.guest_phone,
        COALESCE(u.name, '포스고객') as customer_name,
        c.final_amount,
        c.subtotal_amount
      FROM checks c
      LEFT JOIN users u ON c.user_id = u.id
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
        ci.ordered_at as created_at,
        ci.kitchen_notes,
        ci.preparing_at,
        ci.ready_at,
        ci.served_at
      FROM check_items ci
      WHERE ci.check_id = $1 AND ci.status != 'canceled'
      ORDER BY ci.ordered_at ASC
    `, [currentCheck.check_id]);

    const items = itemsResult.rows.map(item => ({
      id: item.id,
      menuName: item.menuName,
      price: item.price,
      quantity: item.quantity,
      cookingStatus: item.cookingStatus.toUpperCase(),
      created_at: item.created_at,
      notes: item.kitchen_notes,
      isConfirmed: true,
      sessionId: currentCheck.check_id
    }));

    console.log(`✅ 테이블 ${tableNumber} 주문 ${items.length}개 조회 완료`);

    res.json({
      success: true,
      currentSession: {
        orderId: currentCheck.check_id,
        checkId: currentCheck.check_id,
        status: currentCheck.status,
        customerName: currentCheck.customer_name,
        totalAmount: currentCheck.final_amount || 0,
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
 * [GET] /stores/:storeId/table/:tableNumber/session-status - 세션 상태 확인
 */
router.get('/stores/:storeId/table/:tableNumber/session-status', async (req, res, next) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 테이블 ${tableNumber} 세션 상태 확인 (매장 ${storeId})`);

    const result = await pool.query(`
      SELECT 
        c.id,
        c.status,
        c.opened_at,
        COALESCE(u.name, '포스고객') as customer_name,
        c.source_system,
        COUNT(ci.id) as item_count
      FROM checks c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN check_items ci ON c.id = ci.check_id
      WHERE c.store_id = $1 AND c.table_number = $2 AND c.status = 'open'
      GROUP BY c.id, c.status, c.opened_at, u.name, c.source_system
      ORDER BY c.opened_at DESC
    `, [storeId, tableNumber]);

    const hasActiveSession = result.rows.length > 0;
    const sessionInfo = hasActiveSession ? {
      checkId: result.rows[0].id,
      status: result.rows[0].status,
      startTime: result.rows[0].opened_at,
      customerName: result.rows[0].customer_name,
      sourceSystem: result.rows[0].source_system,
      itemCount: parseInt(result.rows[0].item_count)
    } : null;

    res.json({
      success: true,
      hasActiveSession,
      sessionInfo,
      conflictingSessions: [] // 단순화: 현재는 충돌 없음
    });

  } catch (error) {
    console.error('❌ 세션 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '세션 상태 확인 실패'
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

    // 기존 열린 체크가 있는지 확인
    const existingCheckResult = await client.query(`
      SELECT id FROM checks 
      WHERE store_id = $1 AND table_number = $2 AND status = 'open'
      ORDER BY opened_at DESC
      LIMIT 1
    `, [storeId, tableNumber]);

    let checkId;

    if (existingCheckResult.rows.length > 0) {
      // 기존 체크에 아이템 추가
      checkId = existingCheckResult.rows[0].id;
      console.log(`📝 기존 체크 ${checkId}에 아이템 추가`);
    } else {
      // 새 체크 생성
      const checkResult = await client.query(`
        INSERT INTO checks (
          store_id, table_number, user_id, guest_phone, 
          status, source_system, subtotal_amount
        )
        VALUES ($1, $2, $3, $4, 'open', 'POS', $5)
        RETURNING id, opened_at
      `, [storeId, tableNumber, userId, guestPhone, totalAmount]);

      checkId = checkResult.rows[0].id;
      console.log(`✅ 새 체크 ${checkId} 생성`);
    }

    // 체크 아이템들 생성 (새 스키마)
    for (const item of items) {
      const { name, price, quantity } = item;
      
      await client.query(`
        INSERT INTO check_items (
          check_id, menu_name, unit_price, quantity, status
        )
        VALUES ($1, $2, $3, $4, 'ordered')
      `, [checkId, name, price, quantity]);
    }

    // 체크 총액 업데이트
    await client.query(`
      UPDATE checks 
      SET 
        subtotal_amount = (
          SELECT COALESCE(SUM(unit_price * quantity), 0) 
          FROM check_items 
          WHERE check_id = $1 AND status != 'canceled'
        ),
        final_amount = (
          SELECT COALESCE(SUM(unit_price * quantity), 0) 
          FROM check_items 
          WHERE check_id = $1 AND status != 'canceled'
        )
      WHERE id = $1
    `, [checkId]);

    await client.query('COMMIT');

    console.log(`✅ 새 주문 생성: 체크 ${checkId} (매장 ${storeId}, 테이블 ${tableNumber}, 아이템 ${items.length}개)`);

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
 * [POST] /stores/:storeId/table/:tableNumber/payment - 테이블 결제 처리 (새 스키마)
 */
router.post('/stores/:storeId/table/:tableNumber/payment', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { storeId, tableNumber } = req.params;
    const { 
      paymentMethod = 'CASH', 
      guestPhone = null 
    } = req.body;

    if (!['CASH', 'CARD', 'MIXED'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 결제 방법입니다'
      });
    }

    await client.query('BEGIN');

    // 해당 테이블의 열린 체크 조회
    const checkResult = await client.query(`
      SELECT 
        c.id, 
        c.final_amount, 
        c.user_id,
        c.source_system
      FROM checks c
      WHERE c.store_id = $1 AND c.table_number = $2 AND c.status = 'open'
      ORDER BY c.opened_at DESC
      LIMIT 1
    `, [storeId, tableNumber]);

    if (checkResult.rows.length === 0) {
      throw new Error('결제할 주문이 없습니다');
    }

    const check = checkResult.rows[0];
    const finalAmount = check.final_amount || 0;

    if (finalAmount <= 0) {
      throw new Error('결제 금액이 유효하지 않습니다');
    }

    // 결제 생성 (새 스키마)
    const paymentResult = await client.query(`
      INSERT INTO payments (
        check_id, payment_method, amount, status, completed_at
      )
      VALUES ($1, $2, $3, 'completed', CURRENT_TIMESTAMP)
      RETURNING id, completed_at
    `, [check.id, paymentMethod, finalAmount]);

    const paymentId = paymentResult.rows[0].id;

    // 체크 종료 (새 스키마)
    await client.query(`
      UPDATE checks 
      SET 
        status = 'closed', 
        closed_at = CURRENT_TIMESTAMP,
        final_amount = $1
      WHERE id = $2
    `, [finalAmount, check.id]);

    // 모든 아이템을 served 상태로 변경
    await client.query(`
      UPDATE check_items 
      SET 
        status = 'served',
        served_at = CURRENT_TIMESTAMP
      WHERE check_id = $1 AND status != 'canceled'
    `, [check.id]);

    // TLL 회원인 경우 포인트 적립
    if (check.user_id) {
      const points = Math.floor(finalAmount * 0.01); // 1% 적립
      await client.query(`
        UPDATE users 
        SET points = COALESCE(points, 0) + $1
        WHERE id = $2
      `, [points, check.user_id]);

      console.log(`🎉 회원 ${check.user_id} 포인트 적립: ${points}원`);
    }

    await client.query('COMMIT');

    console.log(`✅ 결제 완료: 체크 ${check.id}, 결제 ${paymentId}, 금액 ₩${finalAmount.toLocaleString()}`);

    res.json({
      success: true,
      checkId: check.id,
      paymentId: paymentId,
      amount: finalAmount,
      method: paymentMethod,
      status: 'completed'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 테이블 결제 실패:', error);
    res.status(500).json({
      success: false,
      error: '결제 실패: ' + error.message
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

    // 체크 기본 정보 (새 스키마)
    const checkResult = await client.query(`
      SELECT 
        c.id, 
        c.store_id, 
        c.table_number,
        c.status, 
        c.final_amount, 
        c.subtotal_amount,
        COALESCE(u.name, '포스고객') as customer_name,
        c.opened_at,
        c.closed_at,
        s.name as store_name
      FROM checks c
      LEFT JOIN stores s ON c.store_id = s.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
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
      SELECT 
        status, 
        COUNT(*) as count,
        SUM(unit_price * quantity) as amount
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

    const itemAmounts = { ...items };

    itemStatsResult.rows.forEach(row => {
      items[row.status] = parseInt(row.count);
      itemAmounts[row.status] = parseInt(row.amount);
    });

    // 결제 내역 (새 스키마)
    const paymentsResult = await client.query(`
      SELECT 
        p.id, 
        p.amount, 
        p.status, 
        p.payment_method, 
        p.completed_at
      FROM payments p
      WHERE p.check_id = $1
      ORDER BY p.created_at DESC
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
      check: {
        id: checkId,
        storeId: check.store_id,
        storeName: check.store_name,
        tableNumber: check.table_number,
        status: check.status,
        customerName: check.customer_name,
        openedAt: check.opened_at,
        closedAt: check.closed_at
      },
      totals: {
        subtotal: check.subtotal_amount || 0,
        final_total: check.final_amount || 0,
        paid_total: paidTotal,
        due: Math.max(0, (check.final_amount || 0) - paidTotal)
      },
      items: items,
      itemAmounts: itemAmounts,
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
      SELECT 
        ci.id, 
        ci.status, 
        ci.check_id, 
        c.store_id,
        c.table_number
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

    // 체크 총액 재계산
    await client.query(`
      UPDATE checks 
      SET 
        subtotal_amount = (
          SELECT COALESCE(SUM(unit_price * quantity), 0) 
          FROM check_items 
          WHERE check_id = $1 AND status != 'canceled'
        ),
        final_amount = (
          SELECT COALESCE(SUM(unit_price * quantity), 0) 
          FROM check_items 
          WHERE check_id = $1 AND status != 'canceled'
        )
      WHERE id = $1
    `, [item.check_id]);

    await client.query('COMMIT');

    console.log(`✅ 아이템 상태 변경: ${itemId} (${item.status} → ${status})`);

    res.json({
      success: true,
      item_id: itemId,
      status: status,
      checkId: item.check_id,
      storeId: item.store_id,
      tableNumber: item.table_number
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
 * [POST] /payments - 직접 결제 처리 (새 스키마)
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

    if (!['CASH', 'CARD', 'MIXED'].includes(payment_method)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 결제 방법입니다'
      });
    }

    await client.query('BEGIN');

    // 체크 존재 및 상태 확인
    const checkResult = await client.query(`
      SELECT 
        c.id, 
        c.store_id, 
        c.table_number,
        c.status, 
        c.final_amount,
        c.user_id
      FROM checks c
      WHERE c.id = $1
    `, [check_id]);

    if (checkResult.rows.length === 0) {
      throw new Error('체크를 찾을 수 없습니다');
    }

    const check = checkResult.rows[0];

    if (check.status === 'closed') {
      throw new Error('이미 종료된 체크입니다');
    }

    const finalAmount = amount || check.final_amount;

    // 결제 생성 (새 스키마)
    const paymentResult = await client.query(`
      INSERT INTO payments (
        check_id, payment_method, amount, status, 
        payment_data, completed_at
      )
      VALUES ($1, $2, $3, 'completed', $4, CURRENT_TIMESTAMP)
      RETURNING id, status, completed_at
    `, [check_id, payment_method, finalAmount, JSON.stringify(payment_data)]);

    const payment = paymentResult.rows[0];

    // 체크 종료 (새 스키마)
    await client.query(`
      UPDATE checks 
      SET 
        status = 'closed', 
        closed_at = CURRENT_TIMESTAMP,
        final_amount = $1
      WHERE id = $2
    `, [finalAmount, check_id]);

    // 모든 아이템을 served 상태로 변경
    await client.query(`
      UPDATE check_items 
      SET 
        status = 'served',
        served_at = CURRENT_TIMESTAMP
      WHERE check_id = $1 AND status != 'canceled'
    `, [check_id]);

    // TLL 회원인 경우 포인트 적립
    if (check.user_id) {
      const points = Math.floor(finalAmount * 0.01); // 1% 적립
      await client.query(`
        UPDATE users 
        SET points = COALESCE(points, 0) + $1
        WHERE id = $2
      `, [points, check.user_id]);

      console.log(`🎉 회원 ${check.user_id} 포인트 적립: ${points}원`);
    }

    await client.query('COMMIT');

    console.log(`✅ 결제 완료: 체크 ${check_id}, 결제 ${payment.id}, 매장 ${check.store_id}, 테이블 ${check.table_number}`);

    res.status(201).json({
      success: true,
      payment_id: payment.id,
      check_id: check_id,
      amount: finalAmount,
      method: payment_method,
      status: payment.status,
      completed_at: payment.completed_at
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

/**
 * [GET] /stores/:storeId/orders/active - 매장의 활성 주문들 (새 스키마)
 */
router.get('/stores/:storeId/orders/active', async (req, res, next) => {
  try {
    const { storeId } = req.params;

    console.log(`📊 매장 ${storeId} 활성 주문 조회`);

    const result = await pool.query(`
      SELECT 
        c.id as check_id,
        c.table_number,
        COALESCE(u.name, '포스고객') as customer_name,
        c.user_id,
        c.guest_phone,
        c.final_amount,
        c.status,
        c.opened_at,
        c.source_system,
        COUNT(ci.id) as item_count,
        COUNT(CASE WHEN ci.status = 'ready' THEN 1 END) as ready_items,
        COUNT(CASE WHEN ci.status = 'preparing' THEN 1 END) as preparing_items
      FROM checks c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN check_items ci ON c.id = ci.check_id AND ci.status != 'canceled'
      WHERE c.store_id = $1 AND c.status = 'open'
      GROUP BY c.id, c.table_number, u.name, c.user_id, 
               c.guest_phone, c.final_amount, c.status, c.opened_at, c.source_system
      ORDER BY c.opened_at ASC
    `, [storeId]);

    const activeOrders = result.rows.map(row => ({
      checkId: row.check_id,
      tableNumber: row.table_number,
      customerName: row.customer_name,
      isGuest: !row.user_id,
      totalAmount: row.final_amount || 0,
      status: row.status,
      openedAt: row.opened_at,
      sourceSystem: row.source_system,
      itemCount: parseInt(row.item_count),
      readyItems: parseInt(row.ready_items),
      preparingItems: parseInt(row.preparing_items),
      waitingTime: Math.floor((new Date() - new Date(row.opened_at)) / 60000) // 분 단위
    }));

    console.log(`✅ 매장 ${storeId} 활성 주문 ${activeOrders.length}개 조회 완료`);

    res.json({
      success: true,
      activeOrders: activeOrders,
      summary: {
        totalActiveChecks: activeOrders.length,
        totalReadyItems: activeOrders.reduce((sum, order) => sum + order.readyItems, 0),
        totalPreparingItems: activeOrders.reduce((sum, order) => sum + order.preparingItems, 0)
      }
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
 * [DELETE] /check-items/:id - 아이템 취소 (새 스키마)
 */
router.delete('/check-items/:id', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const itemId = parseInt(req.params.id);
    const { reason = 'POS 취소' } = req.body;

    await client.query('BEGIN');

    // 아이템 확인 (새 스키마)
    const itemResult = await client.query(`
      SELECT 
        ci.id, 
        ci.status, 
        ci.check_id,
        ci.menu_name,
        ci.quantity,
        c.status as check_status
      FROM check_items ci
      JOIN checks c ON ci.check_id = c.id
      WHERE ci.id = $1
    `, [itemId]);

    if (itemResult.rows.length === 0) {
      throw new Error('아이템을 찾을 수 없습니다');
    }

    const item = itemResult.rows[0];

    if (item.check_status === 'closed') {
      throw new Error('종료된 체크의 아이템은 취소할 수 없습니다');
    }

    if (item.status === 'served') {
      throw new Error('이미 서빙된 아이템은 취소할 수 없습니다');
    }

    // 아이템 취소 처리 (새 스키마)
    await client.query(`
      UPDATE check_items 
      SET 
        status = 'canceled',
        canceled_at = CURRENT_TIMESTAMP,
        kitchen_notes = COALESCE(kitchen_notes || ' ', '') || '[취소: ' || $1 || ']'
      WHERE id = $2
    `, [reason, itemId]);

    // 체크 총액 재계산 (새 스키마)
    await client.query(`
      UPDATE checks 
      SET 
        subtotal_amount = (
          SELECT COALESCE(SUM(unit_price * quantity), 0) 
          FROM check_items 
          WHERE check_id = $1 AND status != 'canceled'
        ),
        final_amount = (
          SELECT COALESCE(SUM(unit_price * quantity), 0) 
          FROM check_items 
          WHERE check_id = $1 AND status != 'canceled'
        )
      WHERE id = $1
    `, [item.check_id]);

    await client.query('COMMIT');

    console.log(`✅ 아이템 취소: ${itemId} (${item.menu_name} x${item.quantity})`);

    res.json({
      success: true,
      item_id: itemId,
      status: 'canceled',
      reason: reason
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 아이템 취소 실패:', error);
    res.status(500).json({
      success: false,
      error: '아이템 취소 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 기본 메뉴 생성 함수 (카테고리별) - 메뉴 테이블이 비어있을 때 사용
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

module.exports = router;
