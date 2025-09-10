
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * 토스페이먼츠 클라이언트 키 반환
 */
router.get('/client-key', (req, res) => {
  try {
    // 환경변수에서 토스페이먼츠 클라이언트 키 가져오기
    const clientKey = process.env.TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
    
    console.log('🔑 토스페이먼츠 클라이언트 키 요청 처리');
    
    res.json({
      success: true,
      clientKey: clientKey
    });
  } catch (error) {
    console.error('❌ 토스페이먼츠 클라이언트 키 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '클라이언트 키 조회 실패'
    });
  }
});

/**
 * 토스페이먼츠 결제 승인 (현재 스키마 적용)
 */
router.post('/confirm', async (req, res) => {
  const client = await pool.connect();

  try {
    const { paymentKey, orderId, amount } = req.body;

    console.log('🔄 토스페이먼츠 결제 승인 요청:', { paymentKey, orderId, amount });

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({
        success: false,
        error: '필수 파라미터가 누락되었습니다'
      });
    }

    // 토스페이먼츠 API로 결제 승인 요청
    const secretKey = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
    const authHeader = Buffer.from(secretKey + ':').toString('base64');

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      })
    });

    const tossResult = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error('❌ 토스페이먼츠 승인 실패:', tossResult);
      
      // 이미 처리된 결제인 경우 성공으로 처리
      if (tossResult.code === 'ALREADY_PROCESSED_PAYMENT') {
        console.log('⚠️ 이미 처리된 결제 - 성공으로 처리');
        return res.json({
          success: true,
          data: { paymentKey, orderId, amount, alreadyProcessed: true }
        });
      }
      
      throw new Error(tossResult.message || '토스페이먼츠 승인 실패');
    }

    console.log('✅ 토스페이먼츠 승인 성공:', tossResult);

    // 주문 타입 확인 (TLL vs 일반 주문)
    const isTLLOrder = orderId.startsWith('TLL_');

    await client.query('BEGIN');

    if (isTLLOrder) {
      // TLL 주문 처리 - 새로운 스키마 적용
      const orderInfo = JSON.parse(sessionStorage?.getItem?.('pendingOrderData') || '{}');
      
      if (!orderInfo.userId || !orderInfo.storeId) {
        throw new Error('주문 정보가 불완전합니다.');
      }

      // 1. orders 테이블에 주문 생성
      const orderResult = await client.query(`
        INSERT INTO orders (
          store_id, 
          user_id, 
          table_number,
          status, 
          payment_status,
          subtotal,
          total_amount,
          source,
          order_type,
          created_at
        ) VALUES ($1, $2, $3, 'COMPLETED', 'PAID', $4, $5, 'TLL', 'DINE_IN', CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        orderInfo.storeId,
        orderInfo.userId,
        orderInfo.tableNumber,
        orderInfo.finalTotal,
        orderInfo.finalTotal
      ]);

      const orderId_new = orderResult.rows[0].id;

      // 2. order_tickets 테이블에 티켓 생성
      const ticketResult = await client.query(`
        INSERT INTO order_tickets (
          order_id,
          batch_no,
          status,
          payment_type,
          total_amount,
          created_at
        ) VALUES ($1, 1, 'COMPLETED', 'PREPAID', $2, CURRENT_TIMESTAMP)
        RETURNING id
      `, [orderId_new, orderInfo.finalTotal]);

      const ticketId = ticketResult.rows[0].id;

      // 3. order_items 테이블에 주문 아이템들 생성
      for (const item of orderInfo.orderData.items) {
        await client.query(`
          INSERT INTO order_items (
            ticket_id,
            menu_id,
            menu_name,
            quantity,
            unit_price,
            total_price,
            item_status,
            created_at
          ) VALUES ($1, 1, $2, $3, $4, $5, 'COMPLETED', CURRENT_TIMESTAMP)
        `, [
          ticketId,
          item.name,
          item.quantity,
          item.price,
          item.totalPrice
        ]);
      }

      // 4. 포인트 사용 기록 (order_adjustments)
      if (orderInfo.usedPoint > 0) {
        await client.query(`
          INSERT INTO order_adjustments (
            order_id,
            scope,
            kind,
            method,
            amount_signed,
            meta,
            created_at
          ) VALUES ($1, 'ORDER', 'DISCOUNT', 'POINT', $2, $3, CURRENT_TIMESTAMP)
        `, [
          orderId_new,
          -orderInfo.usedPoint,
          JSON.stringify({ description: '포인트 사용' })
        ]);
      }

      // 5. 쿠폰 할인 기록 (order_adjustments)
      if (orderInfo.couponDiscount > 0) {
        await client.query(`
          INSERT INTO order_adjustments (
            order_id,
            scope,
            kind,
            method,
            code,
            amount_signed,
            meta,
            created_at
          ) VALUES ($1, 'ORDER', 'DISCOUNT', 'COUPON', $2, $3, $4, CURRENT_TIMESTAMP)
        `, [
          orderId_new,
          orderInfo.selectedCouponId,
          -orderInfo.couponDiscount,
          JSON.stringify({ description: '쿠폰 할인' })
        ]);
      }

      // 6. payments 테이블에 결제 정보 생성
      await client.query(`
        INSERT INTO payments (
          order_id,
          ticket_id,
          method,
          amount,
          status,
          paid_at,
          transaction_id,
          provider_response
        ) VALUES ($1, $2, 'TOSS', $3, 'COMPLETED', CURRENT_TIMESTAMP, $4, $5)
      `, [
        orderId_new,
        ticketId,
        orderInfo.finalTotal,
        paymentKey,
        JSON.stringify(tossResult)
      ]);

      // 7. 테이블 상태를 UNAVAILABLE로 변경
      await client.query(`
        UPDATE store_tables 
        SET status = 'UNAVAILABLE'
        WHERE store_id = $1 AND table_number = $2
      `, [orderInfo.storeId, orderInfo.tableNumber]);

      // 8. 사용자 포인트 업데이트 (적립)
      const earnedPoints = Math.floor(orderInfo.finalTotal * 0.01); // 1% 적립
      await client.query(`
        UPDATE users 
        SET point = COALESCE(point, 0) + $1
        WHERE id = $2
      `, [earnedPoints, orderInfo.userId]);

      console.log(`✅ TLL 새 스키마 주문 완료: 주문 ${orderId_new}, 티켓 ${ticketId}`);

    } else {
      // 일반 주문 처리 - 기존 로직 유지
      const orderResult = await client.query(`
        SELECT id, user_id, store_id, total_amount 
        FROM orders 
        WHERE user_paid_order_id = $1
      `, [orderId]);

      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];

        // 결제 완료 처리
        await client.query(`
          UPDATE orders 
          SET 
            payment_status = 'PAID',
            payment_method = 'TOSS',
            payment_key = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [order.id, paymentKey]);

        console.log(`✅ 일반 주문 결제 승인 완료: 주문 ${order.id}`);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: tossResult
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 토스페이먼츠 결제 승인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
