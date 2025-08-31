
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// POS 주문 세션 시작/추가
router.post('/pos/orders/add', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, items, userId, guestPhone } = req.body;

    console.log(`📦 POS 주문 추가 요청:`, {
      storeId,
      tableNumber,
      itemCount: items?.length || 0,
      totalAmount: items?.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      customer: userId || guestPhone || 'Unknown'
    });

    await client.query('BEGIN');

    // 1. 현재 열린 체크 확인
    let check;
    const existingCheck = await client.query(`
      SELECT * FROM checks 
      WHERE store_id = $1 AND table_number = $2 AND status = 'open'
    `, [storeId, tableNumber]);

    if (existingCheck.rows.length > 0) {
      // 기존 체크에 추가
      check = existingCheck.rows[0];
      console.log(`🔄 기존 체크 ${check.id}에 추가 주문`);
    } else {
      // 새 체크 생성
      const newCheckResult = await client.query(`
        INSERT INTO checks (store_id, table_number, user_id, guest_phone, status)
        VALUES ($1, $2, $3, $4, 'open')
        RETURNING *
      `, [storeId, tableNumber, userId || null, guestPhone || null]);
      
      check = newCheckResult.rows[0];
      console.log(`✅ 새로운 체크 ${check.id} 생성`);

      // 테이블 점유 처리
      await client.query(`
        UPDATE store_tables 
        SET is_occupied = true, occupied_by = 'POS', occupied_at = CURRENT_TIMESTAMP
        WHERE store_id = $1 AND table_number = $2
      `, [storeId, tableNumber]);
    }

    // 2. 체크 아이템 추가
    let totalAmount = 0;
    for (const item of items) {
      const subtotal = item.price * item.quantity;
      const finalPrice = subtotal; // 할인 없음

      // 기존 같은 메뉴가 있는지 확인
      const existingItem = await client.query(`
        SELECT * FROM check_items 
        WHERE check_id = $1 AND menu_name = $2 AND unit_price = $3
      `, [check.id, item.name, item.price]);

      if (existingItem.rows.length > 0) {
        // 수량 증가
        await client.query(`
          UPDATE check_items 
          SET quantity = quantity + $1, 
              subtotal = subtotal + $2, 
              final_price = final_price + $2
          WHERE id = $3
        `, [item.quantity, subtotal, existingItem.rows[0].id]);
        
        console.log(`🔄 기존 메뉴 수량 증가: ${item.name} (+${item.quantity}개)`);
      } else {
        // 새 아이템 추가
        await client.query(`
          INSERT INTO check_items (check_id, menu_name, unit_price, quantity, subtotal, final_price)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [check.id, item.name, item.price, item.quantity, subtotal, finalPrice]);
        
        console.log(`➕ 새 메뉴 추가: ${item.name} (${item.quantity}개)`);
      }

      totalAmount += subtotal;
    }

    // 3. 체크 총액 업데이트
    await client.query(`
      UPDATE checks 
      SET subtotal = subtotal + $1, 
          final_amount = subtotal + $1
      WHERE id = $2
    `, [totalAmount, check.id]);

    await client.query('COMMIT');

    console.log(`✅ 체크 ${check.id}에 메뉴 아이템 ${items.length}개 추가 완료`);

    res.json({
      success: true,
      checkId: check.id,
      message: '주문이 추가되었습니다',
      totalAmount: check.final_amount + totalAmount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 주문 추가 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 추가 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// POS 테이블 주문 조회
router.get('/pos/tables/:storeId/:tableNumber', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 POS - 테이블 ${tableNumber} 모든 주문 조회 (체크 단위)`);

    // 1. 현재 열린 체크 조회
    const currentCheck = await client.query(`
      SELECT c.*, 
             COALESCE(u.name, 'Guest') as customer_name
      FROM checks c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.store_id = $1 AND c.table_number = $2 AND c.status = 'open'
    `, [storeId, tableNumber]);

    let currentSession = null;
    if (currentCheck.rows.length > 0) {
      const check = currentCheck.rows[0];
      
      // 체크 아이템들 조회
      const items = await client.query(`
        SELECT * FROM check_items 
        WHERE check_id = $1 
        ORDER BY ordered_at ASC
      `, [check.id]);

      currentSession = {
        checkId: check.id,
        items: items.rows.map(item => ({
          id: item.id,
          name: item.menu_name,
          price: item.unit_price,
          quantity: item.quantity,
          subtotal: item.final_price,
          status: item.status,
          orderedAt: item.ordered_at
        })),
        totalAmount: check.final_amount,
        customerName: check.customer_name,
        openedAt: check.opened_at
      };
    }

    // 2. 완료된 체크들 조회 (최근 10개)
    const completedChecks = await client.query(`
      SELECT c.id, c.final_amount, c.closed_at,
             COALESCE(u.name, 'Guest') as customer_name,
             p.payment_method
      FROM checks c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN payments p ON c.id = p.check_id AND p.status = 'completed'
      WHERE c.store_id = $1 AND c.table_number = $2 AND c.status = 'closed'
      ORDER BY c.closed_at DESC
      LIMIT 10
    `, [storeId, tableNumber]);

    console.log(`✅ 테이블 ${tableNumber} 주문 조회 완료: 현재 세션 ${currentSession ? '1개' : '없음'}, 완료된 체크 ${completedChecks.rows.length}개`);

    res.json({
      success: true,
      currentSession,
      completedSessions: completedChecks.rows,
      tableNumber: parseInt(tableNumber)
    });

  } catch (error) {
    console.error('❌ POS 테이블 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 주문 조회 실패'
    });
  }
});

// POS 결제 처리
router.post('/pos/payment/process', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, paymentMethod, guestPhone } = req.body;

    console.log(`💳 POS 테이블 결제 처리 (테이블 ${tableNumber}):`, { paymentMethod, guestPhone });

    await client.query('BEGIN');

    // 1. 현재 열린 체크 조회
    const checkResult = await client.query(`
      SELECT * FROM checks 
      WHERE store_id = $1 AND table_number = $2 AND status = 'open'
    `, [storeId, tableNumber]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '결제할 주문이 없습니다'
      });
    }

    const check = checkResult.rows[0];
    console.log(`💳 테이블 ${tableNumber} 체크 ${check.id} 결제 처리 시작 (총액: ₩${check.final_amount.toLocaleString()})`);

    // 2. 결제 레코드 생성
    const paymentResult = await client.query(`
      INSERT INTO payments (check_id, payment_method, amount, status, processed_at)
      VALUES ($1, $2, $3, 'completed', CURRENT_TIMESTAMP)
      RETURNING id
    `, [check.id, paymentMethod, check.final_amount]);

    const paymentId = paymentResult.rows[0].id;

    // 3. 체크 완료 처리
    await client.query(`
      UPDATE checks 
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [check.id]);

    // 4. 체크 아이템들 서빙 완료 처리
    await client.query(`
      UPDATE check_items 
      SET status = 'served', served_at = CURRENT_TIMESTAMP
      WHERE check_id = $1
    `, [check.id]);

    // 5. 회원인 경우 포인트 적립 및 통계 업데이트
    if (check.user_id) {
      const earnedPoints = Math.floor(check.final_amount * 0.01); // 1% 적립

      // 포인트 적립
      await client.query(`
        UPDATE users 
        SET point = point + $1
        WHERE id = $2
      `, [earnedPoints, check.user_id]);

      // 매장별 통계 업데이트
      await client.query(`
        INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count, last_visit)
        VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, store_id)
        DO UPDATE SET
          points = user_store_stats.points + $3,
          total_spent = user_store_stats.total_spent + $4,
          visit_count = user_store_stats.visit_count + 1,
          last_visit = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `, [check.user_id, storeId, earnedPoints, check.final_amount]);

      console.log(`💰 회원 ${check.user_id} 포인트 적립: ${earnedPoints}P`);
    }

    // 6. 게스트인 경우 게스트 테이블 업데이트
    if (check.guest_phone) {
      await client.query(`
        INSERT INTO guests (phone, last_visit, visit_count)
        VALUES ($1, CURRENT_TIMESTAMP, 1)
        ON CONFLICT (phone)
        DO UPDATE SET
          last_visit = CURRENT_TIMESTAMP,
          visit_count = guests.visit_count + 1
      `, [check.guest_phone]);
    }

    // 7. 테이블 해제
    await client.query(`
      UPDATE store_tables 
      SET is_occupied = false, occupied_by = NULL, occupied_at = NULL
      WHERE store_id = $1 AND table_number = $2
    `, [storeId, tableNumber]);

    await client.query('COMMIT');

    console.log(`✅ 체크 ${check.id} 결제 완료 (결제 ID: ${paymentId})`);

    res.json({
      success: true,
      checkId: check.id,
      paymentId: paymentId,
      finalAmount: check.final_amount,
      message: '결제가 완료되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// TLL 주문 생성 (고객앱에서)
router.post('/tll/orders/create', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, items, userId, guestPhone } = req.body;

    console.log(`📱 TLL 주문 생성 요청:`, {
      storeId,
      tableNumber,
      itemCount: items?.length || 0,
      customer: userId || guestPhone
    });

    await client.query('BEGIN');

    // 1. 새 체크 생성
    const checkResult = await client.query(`
      INSERT INTO checks (store_id, table_number, user_id, guest_phone, status)
      VALUES ($1, $2, $3, $4, 'open')
      RETURNING *
    `, [storeId, tableNumber, userId || null, guestPhone || null]);

    const check = checkResult.rows[0];

    // 2. 체크 아이템 추가
    let totalAmount = 0;
    for (const item of items) {
      const subtotal = item.price * item.quantity;
      
      await client.query(`
        INSERT INTO check_items (check_id, menu_name, unit_price, quantity, subtotal, final_price, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'ordered')
      `, [check.id, item.name, item.price, item.quantity, subtotal, subtotal]);

      totalAmount += subtotal;
    }

    // 3. 체크 총액 업데이트
    await client.query(`
      UPDATE checks 
      SET subtotal = $1, final_amount = $1
      WHERE id = $2
    `, [totalAmount, check.id]);

    await client.query('COMMIT');

    console.log(`✅ TLL 주문 생성 완료: 체크 ${check.id}`);

    res.json({
      success: true,
      checkId: check.id,
      totalAmount: totalAmount,
      message: '주문이 접수되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL 주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 생성 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// TLL 주문 결제 (토스페이먼츠)
router.post('/tll/payment/confirm', async (req, res) => {
  const client = await pool.connect();

  try {
    const { checkId, paymentKey, orderId, amount } = req.body;

    console.log(`💳 TLL 결제 확인 요청: 체크 ${checkId}`);

    await client.query('BEGIN');

    // 1. 체크 확인
    const checkResult = await client.query(`
      SELECT * FROM checks WHERE id = $1 AND status = 'open'
    `, [checkId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '유효하지 않은 주문입니다'
      });
    }

    const check = checkResult.rows[0];

    // 2. 토스 결제 확인 (실제 구현 시 토스 API 호출)
    // const tossResult = await confirmTossPayment(paymentKey, orderId, amount);

    // 3. 결제 레코드 생성
    await client.query(`
      INSERT INTO payments (check_id, payment_method, amount, status, transaction_id, processed_at)
      VALUES ($1, 'CARD', $2, 'completed', $3, CURRENT_TIMESTAMP)
    `, [checkId, amount, paymentKey]);

    // 4. 체크 완료 처리
    await client.query(`
      UPDATE checks 
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [checkId]);

    // 5. 회원 포인트 적립
    if (check.user_id) {
      const earnedPoints = Math.floor(amount * 0.01);
      
      await client.query(`
        UPDATE users SET point = point + $1 WHERE id = $2
      `, [earnedPoints, check.user_id]);

      await client.query(`
        INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count, last_visit)
        VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, store_id)
        DO UPDATE SET
          points = user_store_stats.points + $3,
          total_spent = user_store_stats.total_spent + $4,
          visit_count = user_store_stats.visit_count + 1,
          last_visit = CURRENT_TIMESTAMP
      `, [check.user_id, check.store_id, earnedPoints, amount]);
    }

    await client.query('COMMIT');

    console.log(`✅ TLL 결제 완료: 체크 ${checkId}`);

    res.json({
      success: true,
      checkId: checkId,
      message: '결제가 완료되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL 결제 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '결제 확인 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 사용자 주문 내역 조회 (새 스키마 기반)
router.get('/users/:userId/orders', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    console.log(`📋 사용자 ${userId} 주문 내역 조회`);

    // 완료된 체크들 조회
    const ordersResult = await client.query(`
      SELECT 
        c.id as check_id,
        c.store_id,
        s.name as store_name,
        c.table_number,
        c.final_amount,
        c.opened_at as order_date,
        c.closed_at as completed_date,
        p.payment_method,
        
        -- 주문 아이템들 JSON 집계
        COALESCE(
          json_agg(
            json_build_object(
              'name', ci.menu_name,
              'quantity', ci.quantity,
              'price', ci.unit_price,
              'subtotal', ci.final_price
            ) ORDER BY ci.ordered_at
          ) FILTER (WHERE ci.id IS NOT NULL), 
          '[]'::json
        ) as items
        
      FROM checks c
      LEFT JOIN stores s ON c.store_id = s.id
      LEFT JOIN payments p ON c.id = p.check_id AND p.status = 'completed'
      LEFT JOIN check_items ci ON c.id = ci.check_id
      WHERE c.user_id = $1 AND c.status = 'closed'
      GROUP BY c.id, s.name, p.payment_method
      ORDER BY c.closed_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    console.log(`✅ 사용자 ${userId} 주문 내역 ${ordersResult.rows.length}개 조회 완료`);

    res.json({
      success: true,
      orders: ordersResult.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: ordersResult.rows.length
      }
    });

  } catch (error) {
    console.error('❌ 사용자 주문 내역 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 내역 조회 실패'
    });
  }
});

module.exports = router;
