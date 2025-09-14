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

    // cook_station 정보 추출 - DRINK 제외
    const cookStations = orderData.items ?
      orderData.items
      .filter(item => item.cook_station !== 'DRINK') // DRINK 제외
      .map(item => item.cook_station || 'KITCHEN')
      .join(',') :
      'KITCHEN';

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
        status,
        cook_station
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
    `, [
      orderId,
      userIdString, // users.user_id (사용자 입력 ID, 문자열)
      parsedUserId, // users.id PK (정수)
      parseInt(storeId),
      parseInt(tableNumber),
      JSON.stringify({
        items: orderData.items || [],
        storeName: storeName,
        usedPoint: parseInt(usedPoint),
        couponDiscount: parseInt(couponDiscount),
        paymentMethod: paymentMethod,
        total: parseInt(amount),
        subtotal: parseInt(amount) + parseInt(usedPoint) + parseInt(couponDiscount)
      }),
      parseInt(amount),
      cookStations
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
 * 토스페이먼츠 결제 승인 (pending_payments 사용)
 */
router.post('/confirm', async (req, res) => {
  const client = await pool.connect();

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

    const pendingPayment = pendingResult.rows[0];
    const orderData = pendingPayment.order_data;

    console.log('📦 pending_payments에서 복구된 주문 데이터:', {
      orderId: pendingPayment.order_id,
      userId: pendingPayment.user_id,
      user_pk: pendingPayment.user_pk, // user_pk 추가
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

    await client.query('BEGIN');

    if (isTLLOrder) {
      // TLL 주문 처리 - 새로운 스키마(orders, order_tickets, order_items) 사용
      console.log('📋 TLL 주문 처리 시작 - 기존 OPEN 주문 확인');

      // pending_payments에서 복구된 데이터로 주문 정보 설정
      const finalOrderInfo = {
        storeId: pendingPayment.store_id,
        userPk: pendingPayment.user_pk, // user_pk를 user_id에 저장 (정수형)
        tableNumber: pendingPayment.table_number,
        finalTotal: parseInt(amount),
        subtotal: orderData.subtotal || parseInt(amount),
        usedPoint: orderData.usedPoint || 0,
        couponDiscount: orderData.couponDiscount || 0,
        items: (orderData.items || []).filter(item => item.cook_station !== 'DRINK'), // DRINK 제외
        cookStation: pendingPayment.cook_station // pending_payments에서 cook_station 가져오기
      };

      console.log('📊 최종 주문 정보:', {
        storeId: finalOrderInfo.storeId,
        userPk: finalOrderInfo.userPk,
        tableNumber: finalOrderInfo.tableNumber,
        finalTotal: finalOrderInfo.finalTotal,
        itemCount: finalOrderInfo.items.length
      });

      // 1. 해당 매장에서 OPEN 상태인 기존 주문 확인
      const existingOrderResult = await client.query(`
        SELECT id FROM orders 
        WHERE store_id = $1 AND status = 'OPEN'
        LIMIT 1
      `, [finalOrderInfo.storeId]);

      let orderIdToUse;

      if (existingOrderResult.rows.length > 0) {
        // 기존 OPEN 주문이 있으면 그것을 사용
        orderIdToUse = existingOrderResult.rows[0].id;
        console.log('🔄 기존 OPEN 주문 재사용:', orderIdToUse);
      } else {
        // 기존 OPEN 주문이 없으면 새로 생성
        const newOrderResult = await client.query(`
          INSERT INTO orders (
            store_id,
            user_id,
            source,
            status,
            payment_status,
            total_price,
            table_num
          ) VALUES ($1, $2, 'TLL', 'OPEN', 'PAID', $3, $4)
          RETURNING id
        `, [
          finalOrderInfo.storeId,
          finalOrderInfo.userPk,
          finalOrderInfo.finalTotal,
          finalOrderInfo.tableNumber
        ]);

        orderIdToUse = newOrderResult.rows[0].id;
        console.log('✨ 새 주문 생성:', orderIdToUse);
      }

      // 2. 해당 주문의 기존 order_tickets 개수 확인하여 batch_no 계산
      const existingTicketsResult = await client.query(`
        SELECT COUNT(*) as count FROM order_tickets 
        WHERE order_id = $1
      `, [orderIdToUse]);

      const existingTicketCount = parseInt(existingTicketsResult.rows[0].count);
      const nextBatchNo = existingTicketCount + 1;

      console.log('📊 배치 번호 계산:', {
        orderId: orderIdToUse,
        existingTickets: existingTicketCount,
        nextBatchNo: nextBatchNo
      });

      // 3. order_tickets 테이블에 티켓 생성 (순차적 batch_no 부여)
      const ticketResult = await client.query(`
        INSERT INTO order_tickets (
          order_id,
          store_id,
          batch_no,
          status,
          payment_type,
          source,
          table_num
        ) VALUES ($1, $2, $3, 'PENDING', 'PREPAID', 'TLL', $4)
        RETURNING id
      `, [orderIdToUse, finalOrderInfo.storeId, nextBatchNo, finalOrderInfo.tableNumber]);

      const ticketId = ticketResult.rows[0].id;

      // 3. order_items 테이블에 아이템들 생성
      for (const item of finalOrderInfo.items) {
        // menu_id 우선순위: 1) 프론트에서 전달된 값, 2) DB 조회, 3) null
        let actualMenuId = item.menuId || item.menu_id || null;

        // 프론트에서 menu_id를 전달하지 않은 경우에만 DB에서 조회
        if (!actualMenuId) {
          try {
            const menuResult = await client.query(`
              SELECT id FROM menu_items 
              WHERE store_id = $1 AND name = $2
              LIMIT 1
            `, [finalOrderInfo.storeId, item.name]);

            if (menuResult.rows.length > 0) {
              actualMenuId = menuResult.rows[0].id;
              console.log(`✅ DB에서 메뉴 ID 조회 성공: ${item.name} -> ${actualMenuId}`);
            } else {
              console.warn(`⚠️ 메뉴를 찾을 수 없음: ${item.name} (store_id: ${finalOrderInfo.storeId})`);
              actualMenuId = null;
            }
          } catch (menuError) {
            console.warn(`⚠️ 메뉴 조회 실패: ${item.name}`, menuError.message);
            actualMenuId = null;
          }
        } else {
          console.log(`✅ 프론트에서 전달된 menu_id 사용: ${item.name} -> ${actualMenuId}`);
        }

        await client.query(`
          INSERT INTO order_items (
            ticket_id,
            store_id,
            menu_id,
            menu_name,
            quantity,
            unit_price,
            total_price,
            item_status,
            cook_station
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
        `, [
          ticketId,
          finalOrderInfo.storeId,
          actualMenuId, // 수정된 menu_id 사용
          item.name,
          item.quantity || 1,
          item.price,
          item.totalPrice || item.price,
          item.cook_station || 'KITCHEN' // order_items 테이블에 cook_station 추가
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
        orderIdToUse,
        ticketId,
        finalOrderInfo.finalTotal,
        paymentKey,
        JSON.stringify(tossResult)
      ]);

      // 5. order_adjustments 테이블에 할인/포인트 사용 내역 추가 (존재하는 경우만)
      if (finalOrderInfo.usedPoint > 0) {
        try {
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
          `, [orderIdToUse, ticketId, -finalOrderInfo.usedPoint]);
        } catch (adjustmentError) {
          console.log('⚠️ order_adjustments 테이블 없음 - 스킵');
        }
      }

      if (finalOrderInfo.couponDiscount > 0) {
        try {
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
          `, [orderIdToUse, ticketId, -finalOrderInfo.couponDiscount]);
        } catch (adjustmentError) {
          console.log('⚠️ order_adjustments 테이블 없음 - 스킵');
        }
      }

      // 6. 사용자 포인트 업데이트 (사용한 포인트 차감 및 적립)
      /*  const earnedPoints = Math.floor(finalOrderInfo.finalTotal * 0.01); // 1% 적립
        const pointChange = earnedPoints - finalOrderInfo.usedPoint;

        await client.query(`
          UPDATE users
          SET point = COALESCE(point, 0) + $1
          WHERE id = $2
        `, [pointChange, finalOrderInfo.userPk]);  */

      // pending_payments 상태를 SUCCESS로 업데이트
      await client.query(`
        UPDATE pending_payments
        SET
          status = 'SUCCESS',
          payment_key = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $2
      `, [paymentKey, orderId]);

      console.log('✅ TLL 결제 성공 처리 완료:', {
        orderId: orderIdToUse,
        ticketId: ticketId,
        batchNo: nextBatchNo,
        finalAmount: finalOrderInfo.finalTotal,
        storeId: finalOrderInfo.storeId
      });

      // KDS 형태로 데이터 변환하여 WebSocket 브로드캐스트
      try {
        const kdsTicketData = {
          check_id: ticketId,
          id: orderIdToUse,
          ticket_id: ticketId,
          batch_no: nextBatchNo,
          customer_name: `테이블 ${finalOrderInfo.tableNumber}`,
          table_number: finalOrderInfo.tableNumber,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: finalOrderInfo.items.map(item => ({
            id: Math.random().toString(36).substr(2, 9), // 임시 ID
            menuName: item.name,
            menu_name: item.name,
            quantity: item.quantity || 1,
            status: 'pending',
            cook_station: item.cook_station || 'KITCHEN',
            notes: '',
            created_at: new Date().toISOString()
          }))
        };

        console.log('📡 KDS 웹소켓 브로드캐스트 시작:', kdsTicketData);

        // WebSocket을 통한 실시간 브로드캐스트
        if (typeof global.broadcastKDSUpdate === 'function') {
          global.broadcastKDSUpdate(finalOrderInfo.storeId, 'new-order', kdsTicketData);
          console.log('✅ KDS 웹소켓 브로드캐스트 완료');
        } else {
          console.warn('⚠️ broadcastKDSUpdate 함수를 찾을 수 없음');
        }

        // PostgreSQL NOTIFY로 KDS에 실시간 알림 (백업)
        await client.query(`
          SELECT pg_notify('kds_updates', $1)
        `, [JSON.stringify({
          type: 'new_ticket',
          store_id: finalOrderInfo.storeId,
          ticket_id: ticketId,
          order_id: orderIdToUse,
          batch_no: nextBatchNo,
          source_system: 'TLL',
          table_number: finalOrderInfo.tableNumber,
          total_amount: finalOrderInfo.finalTotal,
          timestamp: Date.now()
        })]);
        console.log('✅ KDS PostgreSQL NOTIFY 전송 완료');
      } catch (notifyError) {
        console.warn('⚠️ KDS 알림 전송 실패:', notifyError.message);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        orderId: orderIdToUse,
        ticketId: ticketId,
        batchNo: nextBatchNo,
        paymentKey,
        amount: finalOrderInfo.finalTotal
      });

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

      await client.query('COMMIT');

      res.json({
        success: true,
        data: tossResult
      });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 토스페이먼츠 결제 승인 실패:', error);

    // 응답이 이미 전송되었는지 확인
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    } else {
      console.warn('⚠️ 응답이 이미 전송됨 - 추가 응답 생략');
    }
  } finally {
    client.release();
  }
});

module.exports = router;