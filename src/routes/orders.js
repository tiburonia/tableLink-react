
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 📋 체크 생성 또는 기존 체크에 아이템 추가 (POS/TLL 통합)
router.post('/create-or-add', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      storeId,
      tableNumber,
      items,
      userId,
      guestPhone,
      customerName,
      sourceSystem = 'TLL'
    } = req.body;

    console.log(`📋 체크 생성/추가 요청:`, {
      storeId,
      tableNumber,
      itemCount: items?.length,
      sourceSystem,
      customer: userId || guestPhone || customerName
    });

    await client.query('BEGIN');

    // 1. 해당 테이블의 활성 체크 확인
    let checkId = null;
    const activeCheckResult = await client.query(`
      SELECT id, final_amount, customer_name
      FROM checks
      WHERE store_id = $1 AND table_number = $2 AND status = 'open'
      ORDER BY opened_at DESC
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

    if (activeCheckResult.rows.length > 0) {
      // 기존 체크에 추가
      checkId = activeCheckResult.rows[0].id;
      console.log(`🔄 기존 체크 ${checkId}에 아이템 추가`);
    } else {
      // 새 체크 생성
      const newCheckResult = await client.query(`
        INSERT INTO checks (
          store_id, table_number, user_id, guest_phone, customer_name,
          status, source_system
        ) VALUES ($1, $2, $3, $4, $5, 'open', $6)
        RETURNING id
      `, [
        parseInt(storeId),
        parseInt(tableNumber),
        userId || null,
        guestPhone || null,
        customerName || (userId ? null : '게스트'),
        sourceSystem
      ]);

      checkId = newCheckResult.rows[0].id;
      console.log(`✅ 새 체크 ${checkId} 생성 완료`);

      // 테이블 점유 처리
      await client.query(`
        UPDATE store_tables 
        SET is_occupied = true, 
            occupied_since = CURRENT_TIMESTAMP,
            auto_release_source = $3
        WHERE store_id = $1 AND table_number = $2
      `, [parseInt(storeId), parseInt(tableNumber), sourceSystem]);
    }

    // 2. 아이템들 추가
    for (const item of items) {
      await client.query(`
        INSERT INTO check_items (
          check_id, menu_name, menu_category, unit_price, quantity,
          options, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'ordered')
      `, [
        checkId,
        item.name,
        item.category || null,
        item.price,
        item.quantity || 1,
        item.options ? JSON.stringify(item.options) : null
      ]);
    }

    // 3. 게스트 정보 업데이트 (필요한 경우)
    if (guestPhone && !userId) {
      await client.query(`
        INSERT INTO guests (phone, total_visits, last_visit_date)
        VALUES ($1, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (phone) 
        DO UPDATE SET
          total_visits = guests.total_visits + 1,
          last_visit_date = CURRENT_TIMESTAMP
      `, [guestPhone]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      checkId: checkId,
      tableNumber: parseInt(tableNumber),
      itemCount: items.length,
      message: activeCheckResult.rows.length > 0 ? 
        '기존 체크에 아이템이 추가되었습니다' : 
        '새로운 체크가 생성되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 체크 생성/추가 실패:', error);
    res.status(500).json({
      success: false,
      error: '체크 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 🍽️ KDS 주문 목록 조회
router.get('/kds/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🍳 KDS 주문 목록 조회 - 매장 ${storeId}`);

    const result = await pool.query(`
      SELECT 
        c.id as check_id,
        c.table_number,
        c.customer_name,
        c.opened_at,
        c.source_system,
        array_agg(
          json_build_object(
            'id', ci.id,
            'menuName', ci.menu_name,
            'quantity', ci.quantity,
            'status', ci.status,
            'orderedAt', ci.ordered_at,
            'kitchenNotes', ci.kitchen_notes,
            'priority', ci.priority
          ) ORDER BY ci.ordered_at
        ) as items
      FROM checks c
      JOIN check_items ci ON c.id = ci.check_id
      WHERE c.store_id = $1 
        AND c.status = 'open'
        AND ci.status IN ('ordered', 'preparing', 'ready')
      GROUP BY c.id, c.table_number, c.customer_name, c.opened_at, c.source_system
      ORDER BY c.opened_at ASC
    `, [parseInt(storeId)]);

    res.json({
      success: true,
      orders: result.rows
    });

  } catch (error) {
    console.error('❌ KDS 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 주문 조회 실패'
    });
  }
});

// 🍳 KDS 아이템 상태 업데이트
router.put('/kds/items/:itemId/status', async (req, res) => {
  const client = await pool.connect();

  try {
    const { itemId } = req.params;
    const { status, kitchenNotes } = req.body;

    console.log(`🍳 KDS 아이템 ${itemId} 상태 업데이트: ${status}`);

    await client.query('BEGIN');

    // 상태별 시간 컬럼 업데이트
    const timeColumns = {
      'preparing': 'preparing_at',
      'ready': 'ready_at',
      'served': 'served_at',
      'canceled': 'canceled_at'
    };

    const timeColumn = timeColumns[status];
    let updateQuery = `
      UPDATE check_items 
      SET status = $1, kitchen_notes = $2, updated_at = CURRENT_TIMESTAMP
    `;

    let queryParams = [status, kitchenNotes || null, itemId];

    if (timeColumn) {
      updateQuery += `, ${timeColumn} = CURRENT_TIMESTAMP`;
    }

    updateQuery += ` WHERE id = $3 RETURNING check_id, menu_name`;

    const result = await client.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '아이템을 찾을 수 없습니다'
      });
    }

    const { check_id, menu_name } = result.rows[0];

    // 체크의 매장 ID 조회
    const checkInfo = await client.query(`
      SELECT store_id, table_number FROM checks WHERE id = $1
    `, [check_id]);

    const { store_id, table_number } = checkInfo.rows[0];

    await client.query('COMMIT');

    res.json({
      success: true,
      itemId: parseInt(itemId),
      checkId: check_id,
      newStatus: status,
      message: `${menu_name} 상태가 ${status}로 변경되었습니다`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ KDS 아이템 상태 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 아이템 상태 업데이트 실패'
    });
  } finally {
    client.release();
  }
});

// 💳 체크 결제 처리 (POS/TLL 통합)
router.post('/pay/:checkId', async (req, res) => {
  const client = await pool.connect();

  try {
    const { checkId } = req.params;
    const { 
      paymentMethod, 
      paymentData, 
      discountAmount = 0 
    } = req.body;

    console.log(`💳 체크 ${checkId} 결제 처리:`, {
      method: paymentMethod,
      discount: discountAmount
    });

    await client.query('BEGIN');

    // 1. 체크 정보 조회
    const checkResult = await client.query(`
      SELECT id, store_id, table_number, user_id, guest_phone, 
             subtotal_amount, final_amount, status
      FROM checks
      WHERE id = $1 AND status = 'open'
    `, [parseInt(checkId)]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '활성 체크를 찾을 수 없습니다'
      });
    }

    const check = checkResult.rows[0];

    // 2. 할인 적용 및 최종 금액 계산
    const finalAmount = check.final_amount - discountAmount;

    if (finalAmount < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: '할인 금액이 주문 금액을 초과합니다'
      });
    }

    // 3. 결제 기록 생성
    const paymentResult = await client.query(`
      INSERT INTO payments (
        check_id, payment_method, amount, status, 
        payment_data, completed_at
      ) VALUES ($1, $2, $3, 'completed', $4, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      parseInt(checkId),
      paymentMethod,
      finalAmount,
      paymentData ? JSON.stringify(paymentData) : null
    ]);

    const paymentId = paymentResult.rows[0].id;

    // 4. 체크 완료 처리
    await client.query(`
      UPDATE checks 
      SET status = 'closed',
          discount_amount = $1,
          final_amount = $2,
          closed_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [discountAmount, finalAmount, parseInt(checkId)]);

    // 5. 모든 아이템을 'served' 상태로 변경
    await client.query(`
      UPDATE check_items 
      SET status = 'served',
          served_at = CURRENT_TIMESTAMP
      WHERE check_id = $1 AND status != 'canceled'
    `, [parseInt(checkId)]);

    // 6. 테이블 해제
    await client.query(`
      UPDATE store_tables 
      SET is_occupied = false,
          occupied_since = NULL,
          auto_release_source = NULL
      WHERE store_id = $1 AND table_number = $2
    `, [check.store_id, check.table_number]);

    // 7. 사용자 통계 업데이트 (회원인 경우)
    if (check.user_id) {
      const points = Math.floor(finalAmount * 0.01); // 1% 포인트

      await client.query(`
        INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count)
        VALUES ($1, $2, $3, $4, 1)
        ON CONFLICT (user_id, store_id)
        DO UPDATE SET
          points = user_store_stats.points + $3,
          total_spent = user_store_stats.total_spent + $4,
          visit_count = user_store_stats.visit_count + 1,
          updated_at = CURRENT_TIMESTAMP
      `, [check.user_id, check.store_id, points, finalAmount]);

      // 사용자 포인트 업데이트
      await client.query(`
        UPDATE users 
        SET point = COALESCE(point, 0) + $1
        WHERE id = $2
      `, [points, check.user_id]);

      console.log(`🎉 회원 ${check.user_id} 포인트 적립: ${points}원`);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      checkId: parseInt(checkId),
      paymentId: paymentId,
      finalAmount: finalAmount,
      message: '결제가 성공적으로 완료되었습니다'
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

// 📊 POS 주문 현황 조회
router.get('/pos/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`💳 POS 주문 현황 조회 - 매장 ${storeId}`);

    const result = await pool.query(`
      SELECT 
        c.id as check_id,
        c.table_number,
        c.customer_name,
        c.user_id,
        c.guest_phone,
        c.final_amount,
        c.status,
        c.opened_at,
        c.source_system,
        COUNT(ci.id) as item_count,
        COUNT(CASE WHEN ci.status = 'ready' THEN 1 END) as ready_items
      FROM checks c
      LEFT JOIN check_items ci ON c.id = ci.check_id
      WHERE c.store_id = $1
      GROUP BY c.id, c.table_number, c.customer_name, c.user_id, c.guest_phone, 
               c.final_amount, c.status, c.opened_at, c.source_system
      ORDER BY c.opened_at DESC
      LIMIT 50
    `, [parseInt(storeId)]);

    res.json({
      success: true,
      checks: result.rows
    });

  } catch (error) {
    console.error('❌ POS 주문 현황 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 주문 현황 조회 실패'
    });
  }
});

// 🎯 TLL 주문 생성 (토스페이먼츠 연동)
router.post('/tll/create', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      storeId,
      tableNumber,
      userId,
      guestPhone,
      orderData,
      paymentMethod = 'TOSS'
    } = req.body;

    console.log(`🎯 TLL 주문 생성:`, {
      storeId,
      tableNumber,
      customer: userId || guestPhone,
      itemCount: orderData?.items?.length
    });

    await client.query('BEGIN');

    // 1. 체크 생성
    const checkResult = await client.query(`
      INSERT INTO checks (
        store_id, table_number, user_id, guest_phone, customer_name,
        status, source_system, metadata
      ) VALUES ($1, $2, $3, $4, $5, 'open', 'TLL', $6)
      RETURNING id
    `, [
      parseInt(storeId),
      parseInt(tableNumber),
      userId || null,
      guestPhone || null,
      orderData.customerName || (userId ? null : '게스트'),
      JSON.stringify(orderData)
    ]);

    const checkId = checkResult.rows[0].id;

    // 2. 아이템들 추가
    for (const item of orderData.items) {
      await client.query(`
        INSERT INTO check_items (
          check_id, menu_name, unit_price, quantity, options
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        checkId,
        item.name,
        item.price,
        item.quantity,
        item.options ? JSON.stringify(item.options) : null
      ]);
    }

    // 3. 대기 중 결제 생성 (토스페이먼츠 연동 전)
    await client.query(`
      INSERT INTO payments (
        check_id, payment_method, amount, status
      ) VALUES ($1, $2, $3, 'pending')
    `, [checkId, paymentMethod, orderData.totalAmount]);

    await client.query('COMMIT');

    res.json({
      success: true,
      checkId: checkId,
      tableNumber: parseInt(tableNumber),
      totalAmount: orderData.totalAmount,
      message: 'TLL 주문이 생성되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL 주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 주문 생성 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 📈 매장별 일일 통계 조회
router.get('/stats/:storeId/daily', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    console.log(`📈 매장 ${storeId} 일일 통계 조회: ${date}`);

    const result = await pool.query(`
      SELECT 
        COUNT(c.id) as total_orders,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COUNT(DISTINCT COALESCE(c.user_id, c.guest_phone)) as total_customers,
        COUNT(CASE WHEN p.payment_method = 'CASH' THEN 1 END) as cash_orders,
        COUNT(CASE WHEN p.payment_method = 'CARD' THEN 1 END) as card_orders,
        COUNT(CASE WHEN p.payment_method = 'TOSS' THEN 1 END) as toss_orders
      FROM checks c
      JOIN payments p ON c.id = p.check_id
      WHERE c.store_id = $1 
        AND DATE(c.closed_at) = $2
        AND c.status = 'closed'
        AND p.status = 'completed'
    `, [parseInt(storeId), date]);

    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        date: date,
        totalRevenue: parseInt(stats.total_revenue),
        totalOrders: parseInt(stats.total_orders),
        totalCustomers: parseInt(stats.total_customers),
        cashRevenue: parseInt(stats.cash_orders) > 0 ? parseInt(stats.total_revenue) / parseInt(stats.total_orders) * parseInt(stats.cash_orders) : 0,
        cardRevenue: parseInt(stats.card_orders) > 0 ? parseInt(stats.total_revenue) / parseInt(stats.total_orders) * parseInt(stats.card_orders) : 0,
        tossRevenue: parseInt(stats.toss_orders) > 0 ? parseInt(stats.total_revenue) / parseInt(stats.total_orders) * parseInt(stats.toss_orders) : 0
      },
      realTime: true
    });

  } catch (error) {
    console.error('❌ 일일 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '일일 통계 조회 실패'
    });
  }
});

// 🔄 체크 상태 조회
router.get('/check/:checkId', async (req, res) => {
  try {
    const { checkId } = req.params;

    const result = await pool.query(`
      SELECT 
        c.*,
        array_agg(
          json_build_object(
            'id', ci.id,
            'menuName', ci.menu_name,
            'quantity', ci.quantity,
            'unitPrice', ci.unit_price,
            'totalPrice', ci.total_price,
            'status', ci.status,
            'orderedAt', ci.ordered_at
          ) ORDER BY ci.ordered_at
        ) as items,
        array_agg(
          json_build_object(
            'id', p.id,
            'method', p.payment_method,
            'amount', p.amount,
            'status', p.status,
            'completedAt', p.completed_at
          )
        ) FILTER (WHERE p.id IS NOT NULL) as payments
      FROM checks c
      LEFT JOIN check_items ci ON c.id = ci.check_id
      LEFT JOIN payments p ON c.id = p.check_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [parseInt(checkId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '체크를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      check: result.rows[0]
    });

  } catch (error) {
    console.error('❌ 체크 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '체크 조회 실패'
    });
  }
});

module.exports = router;
