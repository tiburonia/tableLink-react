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
    console.log('📨 토스 confirm 라우트 - 전체 요청 바디:', JSON.stringify(req.body, null, 2));

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
      paymentMethod = '카드' 
    } = req.body;

    console.log('🔄 토스페이먼츠 결제 승인 요청 - 필수 파라미터:', { paymentKey, orderId, amount });
    console.log('🔄 토스페이먼츠 결제 승인 요청 - 추가 파라미터:', {
      userId: userId || 'undefined',
      storeId: storeId || 'undefined',
      storeName: storeName || 'undefined',
      tableNumber: tableNumber || 'undefined',
      orderData: orderData ? `객체 존재 (${Object.keys(orderData).length}개 키)` : '없음',
      usedPoint: usedPoint || 0,
      selectedCouponId: selectedCouponId || 'null',
      couponDiscount: couponDiscount || 0,
      paymentMethod: paymentMethod || '카드'
    });

    if (!paymentKey || !orderId || !amount) {
      console.error('❌ 필수 파라미터 누락:', { paymentKey: !!paymentKey, orderId: !!orderId, amount: !!amount });
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
      // TLL 주문 처리 - 새로운 스키마(orders, order_tickets, order_items) 사용
      console.log('📋 TLL 주문 처리 시작 - 새 스키마로 주문 생성');

      // 전달받은 파라미터 정규화 및 검증
      console.log('🔍 전달받은 파라미터 상세 검사:', {
        userId: userId || 'missing',
        storeId: storeId || 'missing',
        storeName: storeName || 'missing',
        tableNumber: tableNumber || 'missing',
        orderData: orderData ? (typeof orderData === 'object' ? `객체 (${Object.keys(orderData).length}개 키)` : typeof orderData) : 'missing',
        usedPoint: usedPoint || 0,
        couponDiscount: couponDiscount || 0,
        paymentMethod: paymentMethod || '카드'
      });

      // 파라미터 정규화
      const normalizedParams = {
        userId: userId || null,
        storeId: storeId ? parseInt(storeId) : null,
        storeName: storeName || null,
        tableNumber: tableNumber ? parseInt(tableNumber) : 1,
        orderData: orderData || null,
        usedPoint: parseInt(usedPoint) || 0,
        couponDiscount: parseInt(couponDiscount) || 0,
        paymentMethod: paymentMethod || '카드'
      };

      console.log('📋 정규화된 파라미터:', normalizedParams);

      // 기본 TLL 주문 정보 설정 (정규화된 파라미터 우선, 기본값 fallback)
      const finalOrderInfo = {
        storeId: normalizedParams.storeId || 497, // 기본 매장 (정통 양념)
        userId: normalizedParams.userId || 'tiburonia', // 현재 로그인된 사용자
        tableNumber: normalizedParams.tableNumber || 1,
        finalTotal: parseInt(amount) - normalizedParams.usedPoint - normalizedParams.couponDiscount,
        subtotal: parseInt(amount),
        usedPoint: normalizedParams.usedPoint,
        couponDiscount: normalizedParams.couponDiscount,
        items: normalizedParams.orderData?.items || [
          {
            name: normalizedParams.storeName || 'TLL 주문',
            price: parseInt(amount),
            quantity: 1,
            totalPrice: parseInt(amount),
            menuId: 1 // 기본 메뉴 ID
          }
        ]
      };

      console.log('📊 최종 주문 정보:', {
        ...finalOrderInfo,
        items: `${finalOrderInfo.items.length}개 아이템`
      });

      // 1. orders 테이블에 주문 생성
      const orderResult = await client.query(`
        INSERT INTO orders (
          store_id, 
          user_id,
          source,
          status,
          payment_status,
          " total_price"
        ) VALUES ($1, $2, 'TLL', 'COMPLETED', 'PAID', $3)
        RETURNING id
      `, [
        finalOrderInfo.storeId,
        finalOrderInfo.userId,
        finalOrderInfo.finalTotal
      ]);

      const orderId = orderResult.rows[0].id;

      // 2. order_tickets 테이블에 티켓 생성
      const ticketResult = await client.query(`
        INSERT INTO order_tickets (
          order_id,
          batch_no,
          status,
          payment_type,
          source
        ) VALUES ($1, 1, 'COMPLETED', 'PREPAID', 'TLL')
        RETURNING id
      `, [orderId]);

      const ticketId = ticketResult.rows[0].id;

      // 3. order_items 테이블에 아이템들 생성
      for (const item of finalOrderInfo.items) {
        await client.query(`
          INSERT INTO order_items (
            ticket_id,
            menu_id,
            menu_name,
            quantity,
            unit_price,
            total_price,
            item_status
          ) VALUES ($1, $2, $3, $4, $5, $6, 'SERVED')
        `, [
          ticketId,
          item.menuId || 1,
          item.name,
          item.quantity || 1,
          item.price,
          item.totalPrice || item.price
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
        ) VALUES ($1, $2, 'TOSS', $3, 'COMPLETED', CURRENT_TIMESTAMP, $4, $5)
      `, [
        orderId,
        ticketId,
        finalOrderInfo.finalTotal,
        paymentKey,
        JSON.stringify(tossResult)
      ]);

      // 5. order_adjustments 테이블에 할인/포인트 사용 내역 추가
      if (finalOrderInfo.usedPoint > 0) {
        await client.query(`
          INSERT INTO order_adjustments (
            order_id,
            ticket_id,
            scope,
            kind,
            method,
            code,
            amount_signed
          ) VALUES ($1, $2, 'order', 'point', 'use', 'POINT_USE', $3)
        `, [orderId, ticketId, -finalOrderInfo.usedPoint]);
      }

      if (finalOrderInfo.couponDiscount > 0) {
        await client.query(`
          INSERT INTO order_adjustments (
            order_id,
            ticket_id,
            scope,
            kind,
            method,
            code,
            amount_signed
          ) VALUES ($1, $2, 'order', 'coupon', 'discount', 'COUPON_DISCOUNT', $3)
        `, [orderId, ticketId, -finalOrderInfo.couponDiscount]);
      }

      // 6. 사용자 포인트 업데이트 (사용한 포인트 차감 및 적립)
      const earnedPoints = Math.floor(finalOrderInfo.finalTotal * 0.01); // 1% 적립
      const pointChange = earnedPoints - finalOrderInfo.usedPoint;

      await client.query(`
        UPDATE users 
        SET point = COALESCE(point, 0) + $1
        WHERE id = $2
      `, [pointChange, finalOrderInfo.userId]);

      console.log(`✅ TLL 새 스키마 주문 완료: 주문 ${orderId}, 티켓 ${ticketId}, 결제 ${paymentKey}`);

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