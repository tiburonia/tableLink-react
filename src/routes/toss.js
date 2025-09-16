const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * 결제 준비 - pending_payments 테이블에 임시 저장
 */
router.post('/prepare', async (req, res) => {
  const client = await pool.connect();

  try {
    console.log('📋 결제 준비 요청 - 전체 요청 바디:', JSON.stringify(req.body, null, 2));

    const {
      userId,
      storeId,
      storeName,
      tableNumber = 1,
      orderData,
      amount,
      usedPoint = 0,
      couponDiscount = 0,
      paymentMethod = '카드'
    } = req.body;

    // 필수 파라미터 검증
    if (!userId || !storeId || !orderData || !amount) {
      console.error('❌ 필수 파라미터 누락:', {
        userId: !!userId,
        storeId: !!storeId,
        orderData: !!orderData,
        amount: !!amount
      });
      return res.status(400).json({
        success: false,
        error: '필수 파라미터가 누락되었습니다'
      });
    }

    // userId를 정수형으로 파싱하여 user_pk로 사용
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      console.error('❌ 유효하지 않은 userId:', userId);
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 사용자 ID입니다.'
      });
    }

    // orderId 생성
    const orderId = `TLL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🔄 결제 준비 처리 시작:', {
      orderId,
      userId, // 프론트에서 받은 users.id (PK)
      parsedUserId, // user_pk로 사용될 값 (users.id)
      storeId,
      storeName,
      tableNumber,
      amount: parseInt(amount),
      usedPoint,
      couponDiscount,
      paymentMethod
    });

    // 프론트엔드에서 전달받은 userId는 users.id (PK)이므로, users.user_id를 조회
    const userResult = await client.query('SELECT user_id FROM users WHERE id = $1', [parsedUserId]);

    if (userResult.rows.length === 0) {
      console.error('❌ 사용자를 찾을 수 없음:', parsedUserId);
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다'
      });
    }

    const userIdString = userResult.rows[0].user_id; // users.user_id (문자열)

    // pending_payments 테이블에 데이터 저장 (user_id에 users.user_id, user_pk에 users.id 저장)
    await client.query(`
      INSERT INTO pending_payments (
        order_id,
        user_id,
        user_pk,
        store_id,
        table_number,
        order_data,
        amount,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
    `, [
      orderId,
      userIdString, // users.user_id (사용자 입력 ID, 문자열)
      parsedUserId, // users.id PK (정수)
      parseInt(storeId),
      parseInt(tableNumber),
      JSON.stringify({
        items: (orderData.items || []).map(item => ({
          ...item,
          menuId: item.menuId || item.menu_id || item.id || null,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          totalPrice: item.totalPrice || (item.price * (item.quantity || 1)),
          cook_station: item.cook_station || 'KITCHEN'
        })),
        storeName: storeName,
        usedPoint: parseInt(usedPoint),
        couponDiscount: parseInt(couponDiscount),
        paymentMethod: paymentMethod,
        // cook_station 정보도 order_data 안에 포함
        cook_station: {
          items: (orderData.items || []).map(item => ({
            name: item.name,
            cook_station: item.cook_station || 'KITCHEN',
            menuId: item.menuId || item.menu_id || item.id || null
          }))
        }
      }),
      parseInt(amount)
    ]);

    console.log('✅ 결제 준비 완료 - pending_payments에 저장:', orderId);

    res.json({
      success: true,
      orderId: orderId,
      message: '결제 준비가 완료되었습니다'
    });

  } catch (error) {
    console.error('❌ 결제 준비 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

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
 * 토스페이먼츠 결제 승인 (이벤트 기반 아키텍처)
 */
router.post('/confirm', async (req, res) => {
  const eventBus = require('../utils/eventBus');
  const paymentService = require('../services/paymentService');

  try {
    console.log('📨 토스 confirm 라우트 - 전체 요청 바디:', JSON.stringify(req.body, null, 2));

    const { paymentKey, orderId, amount } = req.body;

    console.log('🔄 토스페이먼츠 결제 승인 요청 - 필수 파라미터:', { paymentKey, orderId, amount });

    if (!paymentKey || !orderId || !amount) {
      console.error('❌ 필수 파라미터 누락:', { paymentKey: !!paymentKey, orderId: !!orderId, amount: !!amount });
      return res.status(400).json({
        success: false,
        error: '필수 파라미터가 누락되었습니다'
      });
    }

    // pending_payments에서 주문 데이터 조회
    const client = await pool.connect();
    let pendingPayment;

    try {
      const pendingResult = await client.query(`
        SELECT * FROM pending_payments
        WHERE order_id = $1 AND status = 'PENDING'
      `, [orderId]);

      if (pendingResult.rows.length === 0) {
        console.error('❌ 대기 중인 결제를 찾을 수 없습니다:', orderId);
        return res.status(404).json({
          success: false,
          error: '대기 중인 결제를 찾을 수 없습니다'
        });
      }

      pendingPayment = pendingResult.rows[0];
    } finally {
      client.release();
    }

    const orderData = pendingPayment.order_data;

    console.log('📦 pending_payments에서 복구된 주문 데이터:', {
      orderId: pendingPayment.order_id,
      userId: pendingPayment.user_id,
      user_pk: pendingPayment.user_pk,
      storeId: pendingPayment.store_id,
      tableNumber: pendingPayment.table_number,
      amount: pendingPayment.amount,
      orderData: orderData ? '객체 존재' : '없음'
    });

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

    if (isTLLOrder) {
      // TLL 주문 처리 - 이벤트 기반 결제 서비스 사용
      console.log('📋 TLL 주문 처리 시작 - 이벤트 기반 아키텍처 적용');

      // cook_station 정보 추출
      let cookStationData = {};
      try {
        const orderDataObj = typeof orderData === 'string' ? JSON.parse(orderData) : orderData;
        cookStationData = orderDataObj.cook_station || { items: [] };
      } catch (parseError) {
        console.warn('⚠️ cook_station 파싱 실패, 기본값 사용:', parseError);
        cookStationData = { items: [] };
      }

      // 아이템에 cook_station 정보 추가
      const itemsWithCookStation = (orderData.items || []).map(item => {
        let actualCookStation = 'KITCHEN';

        if (cookStationData?.items && Array.isArray(cookStationData.items)) {
          const savedItem = cookStationData.items.find(saved => saved.name === item.name);
          if (savedItem?.cook_station) {
            actualCookStation = savedItem.cook_station;
          }
        }

        return {
          ...item,
          cook_station: actualCookStation
        };
      });

      // 결제 서비스를 통한 주문 처리
      const orderInfo = {
        storeId: pendingPayment.store_id,
        userPk: pendingPayment.user_pk,
        tableNumber: pendingPayment.table_number,
        finalTotal: parseInt(amount),
        subtotal: orderData.subtotal || parseInt(amount),
        usedPoint: orderData.usedPoint || 0,
        couponDiscount: orderData.couponDiscount || 0,
        items: itemsWithCookStation,
        storeName: orderData.storeName || '매장', // order_data에서 storeName 추출
        userId: pendingPayment.user_id
      };

      const result = await paymentService.processTLLOrder({
        orderId,
        amount: parseInt(amount),
        paymentKey,
        tossResult,
        orderData: orderInfo
      });

      // pending_payments 상태 업데이트
      const updateClient = await pool.connect();
      try {
        await updateClient.query(`
          UPDATE pending_payments
          SET
            status = 'SUCCESS',
            payment_key = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE order_id = $2
        `, [paymentKey, orderId]);
      } finally {
        updateClient.release();
      }

      // 주문 처리 결과에서 ticketId, batchNo, isNewOrder 추출
      const { ticketId, batchNo, isNewOrder } = result;
      const orderIdToUse = result.orderId;
      const paymentData = { paymentKey, finalTotal: result.amount };

      // 새 주문 생성 시 알림 생성 - 스키마에 맞게 수정
      if (isNewOrder) {
        const notificationClient = await pool.connect();
        try {
          // storeName 우선순위: orderData.storeName > pendingPayment.order_data.storeName > '매장'
          let storeName;
          if (orderData && orderData.storeName) {
            storeName = orderData.storeName;
          } else if (pendingPayment.order_data && pendingPayment.order_data.storeName) {
            storeName = pendingPayment.order_data.storeName;
          }

          // user_id 검증 (반드시 정수여야 함)
          const validUserId = parseInt(orderInfo.userPk);
          if (isNaN(validUserId)) {
            throw new Error(`유효하지 않은 user_id: ${orderInfo.userPk}`);
          }

          console.log(`📢 알림 생성 준비:`, {
            validUserId,
            storeId: orderInfo.storeId,
            storeName,
            tableNumber: orderInfo.tableNumber,
            orderId: orderIdToUse,
            paymentKey,
            orderDataStoreName: orderData?.storeName,
            pendingDataStoreName: pendingPayment.order_data?.storeName
          });

          const insertResult = await notificationClient.query(`
            INSERT INTO notifications (
              user_id, type, title, message, metadata, is_read, sent_source
            ) VALUES ($1, $2, $3, $4, $5, false, 'TLL')
            RETURNING id
          `, [
            validUserId, // 검증된 INTEGER 타입 user_id
            'order',
            '새로운 주문이 시작되었습니다',
            `${storeName}에서 새로운 주문 세션이 시작되었습니다. 테이블 ${orderInfo.tableNumber}`,
            JSON.stringify({
              order_id: orderIdToUse,
              store_id: orderInfo.storeId,
              store_name: storeName,
              table_number: orderInfo.tableNumber,
              payment_key: paymentKey,
              amount: orderInfo.finalTotal
            })
          ]);

          const notificationId = insertResult.rows[0]?.id;
          console.log(`✅ 토스 라우트: 새 주문 알림 생성 성공 - 알림 ID ${notificationId}, 사용자 ${validUserId}, 주문 ${orderIdToUse}`);
        } catch (notificationError) {
          console.error('❌ 토스 라우트: 새 주문 알림 생성 실패:', notificationError);
          console.error('❌ 알림 생성 오류 상세:', {
            error: notificationError.message,
            code: notificationError.code,
            detail: notificationError.detail,
            hint: notificationError.hint,
            userPk: orderInfo.userPk,
            userPkType: typeof orderInfo.userPk,
            storeId: orderInfo.storeId,
            storeIdType: typeof orderInfo.storeId,
            orderData_storeName: orderData?.storeName,
            pendingData_storeName: pendingPayment.order_data?.storeName
          });
        } finally {
          notificationClient.release();
        }
      } else {
        console.log(`ℹ️ 기존 주문에 추가됨 - 알림 생성 생략: 주문 ${orderIdToUse}`);
      }

      // 이벤트 발생: 새 주문 생성됨
      eventBus.emit('order.created', {
        orderId: orderIdToUse,
        ticketId,
        storeId: orderInfo.storeId,
        tableNumber: orderInfo.tableNumber,
        items: orderInfo.items,
        batchNo,
        isNewOrder
      });

      // 이벤트 발생: 결제 완료됨
      eventBus.emit('payment.completed', {
        orderId: orderIdToUse,
        ticketId,
        storeId: orderInfo.storeId,
        amount: orderInfo.finalTotal,
        paymentKey: paymentData.paymentKey
      });

      console.log('✅ TLL 결제 성공 처리 완료 (이벤트 기반)');

      res.json({
        success: true,
        orderId: orderIdToUse,
        ticketId: ticketId,
        batchNo: batchNo,
        paymentKey,
        amount: orderInfo.finalTotal
      });

    } else {
      // 일반 주문 처리 - 기존 로직 유지
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

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

        await client.query('COMMIT');

        res.json({
          success: true,
          data: tossResult
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 승인 실패:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    } else {
      console.warn('⚠️ 응답이 이미 전송됨 - 추가 응답 생략');
    }
  }
});

module.exports = router;