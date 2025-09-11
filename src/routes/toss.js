
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
    
    const { paymentKey, orderId, amount, userId, storeId, storeName, tableNumber, orderData, usedPoint, selectedCouponId, couponDiscount, paymentMethod } = req.body;

    console.log('🔄 토스페이먼츠 결제 승인 요청 - 필수 파라미터:', { paymentKey, orderId, amount });
    console.log('🔄 토스페이먼츠 결제 승인 요청 - 추가 파라미터:', {
      userId,
      storeId,
      storeName,
      tableNumber,
      orderData: orderData ? '객체 존재' : '없음',
      usedPoint,
      selectedCouponId,
      couponDiscount,
      paymentMethod
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
      // TLL 주문 처리 - 기본 주문 정보로 처리 (sessionStorage 사용 안함)
      console.log('📋 TLL 주문 처리 시작 - 기본 정보로 주문 생성');
      
      // 전달받은 파라미터에서 주문 정보 가져오기
      let orderInfo = null;
      
      if (userId && storeId && orderData) {
        console.log('✅ 파라미터에서 주문 정보 사용:', {
          userId,
          storeId,
          storeName,
          tableNumber,
          orderData: orderData ? `${Object.keys(orderData).length}개 키` : '없음',
          usedPoint,
          couponDiscount
        });
        
        orderInfo = {
          userId,
          storeId,
          storeName,
          tableNumber,
          orderData,
          usedPoint: usedPoint || 0,
          couponDiscount: couponDiscount || 0,
          paymentMethod
        };
      } else {
        console.log('⚠️ 파라미터 불완전 - 기본값 사용:', {
          hasUserId: !!userId,
          hasStoreId: !!storeId,
          hasOrderData: !!orderData
        });
      }

      // 기본 TLL 주문 정보 설정 (파라미터 우선, 기본값 fallback)
      const defaultOrderInfo = {
        storeId: orderInfo?.storeId || storeId || 497, // 기본 매장 (정통 양념)
        userId: orderInfo?.userId || userId || 'tiburonia', // 현재 로그인된 사용자
        tableNumber: orderInfo?.tableNumber || tableNumber || 1,
        finalTotal: parseInt(amount) - (orderInfo?.usedPoint || usedPoint || 0) - (orderInfo?.couponDiscount || couponDiscount || 0),
        subtotal: parseInt(amount),
        usedPoint: orderInfo?.usedPoint || usedPoint || 0,
        couponDiscount: orderInfo?.couponDiscount || couponDiscount || 0,
        items: orderInfo?.orderData?.items || orderData?.items || [
          {
            name: orderData?.storeName || storeName || 'TLL 주문',
            price: parseInt(amount),
            quantity: 1,
            totalPrice: parseInt(amount)
          }
        ]
      };
      
      console.log('📊 최종 주문 정보:', {
        ...defaultOrderInfo,
        items: `${defaultOrderInfo.items.length}개 아이템`
      });

      // 1. checks 테이블에 체크 생성
      const checkResult = await client.query(`
        INSERT INTO checks (
          store_id, 
          user_id,
          customer_name,
          status,
          source_system,
          opened_at
        ) VALUES ($1, $2, $3, 'closed', 'TLL', CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        defaultOrderInfo.storeId,
        defaultOrderInfo.userId,
        '토스페이먼츠 결제'
      ]);

      const checkId = checkResult.rows[0].id;

      // 2. check_items 테이블에 아이템들 생성
      for (const item of defaultOrderInfo.items) {
        await client.query(`
          INSERT INTO check_items (
            check_id,
            menu_name,
            unit_price,
            quantity,
            status,
            ordered_at,
            served_at
          ) VALUES ($1, $2, $3, $4, 'served', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          checkId,
          item.name,
          item.price,
          item.quantity
        ]);
      }

      // 3. payments 테이블에 결제 정보 생성
      await client.query(`
        INSERT INTO payments (
          check_id,
          payment_method,
          amount,
          status,
          completed_at,
          transaction_id,
          payment_data
        ) VALUES ($1, 'TOSS', $2, 'completed', CURRENT_TIMESTAMP, $3, $4)
      `, [
        checkId,
        defaultOrderInfo.finalTotal,
        paymentKey,
        JSON.stringify(tossResult)
      ]);

      // 4. checks 테이블 금액 업데이트
      await client.query(`
        UPDATE checks 
        SET subtotal_amount = $1,
            final_amount = $2,
            closed_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [defaultOrderInfo.subtotal, defaultOrderInfo.finalTotal, checkId]);

      // 5. 사용자 포인트 업데이트 (적립)
      const earnedPoints = Math.floor(defaultOrderInfo.finalTotal * 0.01); // 1% 적립
      await client.query(`
        UPDATE users 
        SET point = COALESCE(point, 0) + $1
        WHERE id = $2
      `, [earnedPoints, defaultOrderInfo.userId]);

      console.log(`✅ TLL 새 스키마 주문 완료: 체크 ${checkId}, 결제 ${paymentKey}`);

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
