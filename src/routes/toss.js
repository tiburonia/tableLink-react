
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
    const { 
      paymentKey, 
      orderId, 
      amount,
      userId,
      storeId,
      storeName,
      tableNumber,
      orderData,
      usedPoint = 0,
      selectedCouponId,
      couponDiscount = 0,
      paymentMethod
    } = req.body;

    console.log('🔄 토스페이먼츠 결제 승인 요청:', { 
      paymentKey, 
      orderId, 
      amount,
      userId,
      storeId,
      tableNumber
    });

    if (!paymentKey || !orderId || !amount || !userId || !storeId || !tableNumber) {
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
      // TLL 주문 처리 - 기본 주문 정보로 처리 (sessionStorage 사용 안함)
      console.log('📋 TLL 주문 처리 시작 - 기본 정보로 주문 생성');
      
      // 클라이언트에서 전달받은 주문 정보 사용
      const orderInfo = {
        storeId: parseInt(storeId),
        userId: userId,
        tableNumber: parseInt(tableNumber),
        finalTotal: parseInt(amount),
        subtotal: orderData?.total || parseInt(amount),
        items: orderData?.items || [
          {
            name: 'TLL 주문',
            price: parseInt(amount),
            quantity: 1,
            totalPrice: parseInt(amount)
          }
        ],
        usedPoint: parseInt(usedPoint) || 0,
        selectedCouponId: selectedCouponId,
        couponDiscount: parseInt(couponDiscount) || 0,
        paymentMethod: paymentMethod || 'TOSS'
      };

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
          used_points,
          coupon_discount,
          source,
          order_type,
          created_at
        ) VALUES ($1, $2, $3, 'PENDING', 'PAID', $4, $5, $6, $7, 'TLL', 'DINE_IN', CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        orderInfo.storeId,
        orderInfo.userId,
        orderInfo.tableNumber,
        orderInfo.subtotal,
        orderInfo.finalTotal,
        orderInfo.usedPoint,
        orderInfo.couponDiscount
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
      `, [orderId_new, defaultOrderInfo.finalTotal]);

      const ticketId = ticketResult.rows[0].id;

      // 3. order_items 테이블에 주문 아이템들 생성
      for (const item of orderInfo.items) {
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

      // 4. payments 테이블에 결제 정보 생성
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
        ) VALUES ($1, $2, $3, $4, 'COMPLETED', CURRENT_TIMESTAMP, $5, $6)
      `, [
        orderId_new,
        ticketId,
        orderInfo.paymentMethod,
        orderInfo.finalTotal,
        paymentKey,
        JSON.stringify(tossResult)
      ]);

      // 5. 테이블 상태를 UNAVAILABLE로 변경
      await client.query(`
        UPDATE store_tables 
        SET status = 'UNAVAILABLE'
        WHERE store_id = $1 AND table_number = $2
      `, [orderInfo.storeId, orderInfo.tableNumber]);

      // 6. 사용자 포인트 처리 (사용한 포인트 차감 + 적립)
      const earnedPoints = Math.floor(orderInfo.finalTotal * 0.01); // 1% 적립
      const pointChange = earnedPoints - orderInfo.usedPoint;
      
      await client.query(`
        UPDATE users 
        SET point = COALESCE(point, 0) + $1
        WHERE id = $2
      `, [pointChange, orderInfo.userId]);

      // 7. 쿠폰 사용 처리 (선택된 쿠폰이 있는 경우)
      if (orderInfo.selectedCouponId) {
        await client.query(`
          UPDATE user_coupons 
          SET used = true, used_at = CURRENT_TIMESTAMP, order_id = $1
          WHERE user_id = $2 AND coupon_id = $3
        `, [orderId_new, orderInfo.userId, orderInfo.selectedCouponId]);
      }

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
