/**
 * 결제 전용 서비스 모듈
 * - 결제 관련 비즈니스 로직 집중 관리
 * - 이벤트 발생을 통해 다른 서비스와 통신
 */

const eventBus = require('../utils/eventBus');
const pool = require('../db/pool');

class PaymentService {
  /**
   * TLL 주문 처리 (이벤트 기반 아키텍처)
   */
  async processTLLOrder({ orderId, amount, paymentKey, tossResult, orderData, notificationMetadata }) {
    const client = await pool.connect();

    try {
      console.log('💳 결제 서비스: TLL 주문 처리 시작', {
        orderId,
        amount,
        storeId: orderData.storeId,
        userPk: orderData.userPk,
        itemCount: orderData.items?.length
      });

      await client.query('BEGIN');

      // 1. 기존 OPEN 주문 확인 또는 새 주문 생성
      const orderResult = await this.getOrCreateOrder(client, orderData);
      const { orderIdToUse, isNewOrder } = orderResult;

      // 2. 배치 번호 계산
      const batchNo = await this.calculateBatchNumber(client, orderIdToUse);

      // 3. 티켓 생성
      const ticketId = await this.createOrderTicket(client, {
        orderId: orderIdToUse,
        storeId: orderData.storeId,
        batchNo,
        tableNumber: orderData.tableNumber
      });

      // 4. 주문 아이템 생성
      await this.createOrderItems(client, {
        orderId: orderIdToUse,
        ticketId,
        storeId: orderData.storeId,
        items: orderData.items
      });

      // 5. 주문 총 금액 재계산 (서버 사이드 검증)
      const recalculatedTotal = await this.updateOrderTotalAmount(client, orderIdToUse);
      console.log(`💰 TLL 주문 ${orderIdToUse} 금액 재계산: 요청 ${orderData.finalTotal}원 → 실제 ${recalculatedTotal}원`);

      // 6. 결제 정보 저장
      const paymentId = await this.createPaymentRecord(client, {
        orderId: orderIdToUse,
        amount: orderData.finalTotal,
        paymentKey,
        providerResponse: tossResult
      });

      // 7. TLL 주문 시 store_tables에 주문 ID 등록 (새 주문이든 기존 주문에 추가든 항상 수행)
      try {
        // 현재 테이블 상태 확인
        const currentTableResult = await client.query(`
          SELECT processing_order_id, spare_processing_order_id, status
          FROM store_tables
          WHERE store_id = $1 AND id = $2
        `, [orderData.storeId, orderData.tableNumber]);

        if (currentTableResult.rows.length > 0) {
          const currentTable = currentTableResult.rows[0];
          const hasMainOrder = currentTable.processing_order_id !== null;
          const hasSpareOrder = currentTable.spare_processing_order_id !== null;

          // 현재 주문이 이미 테이블에 등록되어 있는지 확인
          const isAlreadyRegistered = (
            parseInt(currentTable.processing_order_id) === parseInt(orderIdToUse) ||
            parseInt(currentTable.spare_processing_order_id) === parseInt(orderIdToUse)
          );

          if (!isAlreadyRegistered) {
            if (!hasMainOrder) {
              // processing_order_id가 비어있으면 메인 주문으로 설정
              const tableUpdateResult = await client.query(`
                UPDATE store_tables
                SET
                  processing_order_id = $3,
                  status = 'OCCUPIED',
                  updated_at = CURRENT_TIMESTAMP
                WHERE store_id = $1 AND id = $2
              `, [orderData.storeId, orderData.tableNumber, orderIdToUse]);

              if (tableUpdateResult.rowCount > 0) {
                console.log(`🍽️ TLL 주문 - 메인 슬롯 설정: 매장 ${orderData.storeId}, 테이블 ${orderData.tableNumber}, 주문 ${orderIdToUse}`);
              }
            } else if (!hasSpareOrder) {
              // 메인 슬롯이 차있고 보조 슬롯이 비어있으면 보조 주문으로 설정
              const tableUpdateResult = await client.query(`
                UPDATE store_tables
                SET
                  spare_processing_order_id = $3,
                  status = 'OCCUPIED',
                  updated_at = CURRENT_TIMESTAMP
                WHERE store_id = $1 AND id = $2
              `, [orderData.storeId, orderData.tableNumber, orderIdToUse]);

              if (tableUpdateResult.rowCount > 0) {
                console.log(`🍽️ TLL 주문 - 보조 슬롯 설정: 매장 ${orderData.storeId}, 테이블 ${orderData.tableNumber}, 주문 ${orderIdToUse}`);
              }
            } else {
              // 두 슬롯이 모두 차있는 경우
              console.warn(`⚠️ TLL 주문 - 테이블에 이미 2개 주문 존재: 매장 ${orderData.storeId}, 테이블 ${orderData.tableNumber} (현재: ${currentTable.processing_order_id}, ${currentTable.spare_processing_order_id}, 신규: ${orderIdToUse})`);
            }
          } else {
            console.log(`ℹ️ TLL 주문 - 이미 테이블에 등록된 주문: 매장 ${orderData.storeId}, 테이블 ${orderData.tableNumber}, 주문 ${orderIdToUse}`);
            // 테이블 상태를 OCCUPIED로 확실히 설정
            await client.query(`
              UPDATE store_tables
              SET 
                status = 'OCCUPIED',
                updated_at = CURRENT_TIMESTAMP
              WHERE store_id = $1 AND id = $2
            `, [orderData.storeId, orderData.tableNumber]);
          }
        } else {
          // 테이블 레코드가 없는 경우 (예외 상황)
          console.warn(`⚠️ TLL 주문 - store_tables 레코드 없음: 매장 ${orderData.storeId}, 테이블 ${orderData.tableNumber}`);
        }
      } catch (tableError) {
        console.error(`❌ TLL store_tables 업데이트 실패: 매장 ${orderData.storeId}, 테이블 ${orderData.tableNumber}, 주문 ${orderIdToUse}`, tableError);
      }

      await client.query('COMMIT');

      console.log(`✅ 결제 서비스: TLL 주문 처리 완료 - 주문 ${orderIdToUse}, 새 주문: ${isNewOrder}`);

      // 새 주문인 경우 알림 생성
      if (isNewOrder) {
        await this.createOrderNotification(client, {
          userId: orderData.userPk,
          storeId: orderData.storeId,
          storeName: orderData.storeName,
          tableNumber: orderData.tableNumber,
          orderId: orderIdToUse,
          ticketId: ticketId,
          paymentKey,
          amount,
          // 추가 메타데이터 포함
          additionalMetadata: notificationMetadata || {}
        });
      }

      // 이벤트 발생: 새 주문 생성됨
      eventBus.emit('order.created', {
        orderId: orderIdToUse,
        ticketId,
        storeId: orderData.storeId,
        tableNumber: orderData.tableNumber,
        items: orderData.items,
        batchNo,
        isNewOrder
      });

      // 이벤트 발생: 결제 완료됨
      eventBus.emit('payment.completed', {
        orderId: orderIdToUse,
        ticketId,
        storeId: orderData.storeId,
        amount: orderData.finalTotal,
        paymentKey: paymentKey
      });

      return {
        success: true,
        orderId: orderIdToUse,
        ticketId,
        batchNo,
        amount: orderData.finalTotal,
        isNewOrder,
        paymentId
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 결제 서비스: TLL 주문 처리 실패:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 기존 주문 확인 또는 새 주문 생성
   */
  async getOrCreateOrder(client, orderData) {
    // 기존 활성 주문 확인
    const existingOrderResult = await client.query(`
      SELECT id, session_status, created_at
      FROM orders
      WHERE store_id = $1 
        AND table_num = $2 
        AND user_id = $3
        AND session_status = 'OPEN'
        AND NOT COALESCE(session_ended, false)
      ORDER BY created_at DESC
      LIMIT 1
    `, [orderData.storeId, orderData.tableNumber, orderData.userPk]);

    let orderIdToUse;
    let isNewOrder = false;

    if (existingOrderResult.rows.length > 0) {
      // 기존 주문에 추가
      orderIdToUse = existingOrderResult.rows[0].id;
      console.log(`🔄 기존 주문에 추가: ${orderIdToUse}`);
      
    } else {
      // 새 주문 생성
      const newOrderResult = await client.query(`
        INSERT INTO orders (
          store_id,
          user_id,
          source,
          session_status,
          payment_status,
          total_price,
          table_num,
          session_ended,
          created_at,
          updated_at
        ) VALUES ($1, $2, 'TLL', 'OPEN', 'PAID', 0, $3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        orderData.storeId,
        orderData.userPk,
        orderData.tableNumber
      ]);

      orderIdToUse = newOrderResult.rows[0].id;
      isNewOrder = true;
      console.log(`✅ 새 주문 생성: ${orderIdToUse}`);
    }

    return {
      orderIdToUse,
      isNewOrder
    };
  }

  /**
   * 배치 번호 계산
   */
  async calculateBatchNumber(client, orderId) {
    // 새 batch_no 생성
    const newBatchResult = await client.query(`
      SELECT COALESCE(MAX(batch_no), 0) + 1 AS next_batch 
      FROM order_tickets 
      WHERE order_id = $1
    `, [orderId]);
    const nextBatchNo = newBatchResult.rows[0].next_batch;

    return parseInt(nextBatchNo)

  }

  /**
   * 주문 티켓 생성
   */
  async createOrderTicket(client, ticketData) {
    const result = await client.query(`
      INSERT INTO order_tickets (
        order_id,
        store_id,
        batch_no,
        status,
        payment_type,
        source,
        table_num,
        paid_status
      ) VALUES ($1, $2, $3, 'PENDING', 'PREPAID', 'TLL', $4, 'PAID')
      RETURNING id
    `, [
      ticketData.orderId,
      ticketData.storeId,
      ticketData.batchNo,
      ticketData.tableNumber
    ]);

    return result.rows[0].id;
  }

  /**
   * 주문 아이템 생성
   */
  async createOrderItems(client, itemData) {
    const { orderId, ticketId, storeId, items } = itemData;

    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id,
          ticket_id,
          store_id,
          menu_id,
          menu_name,
          quantity,
          unit_price,
          total_price,
          item_status,
          cook_station
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9)
      `, [
        orderId,
        ticketId,
        storeId,
        item.menuId || item.menu_id || 1,
        item.name,
        item.quantity || 1,
        item.price,
        item.totalPrice || item.price,
        item.cook_station || 'KITCHEN'
      ]);
    }
  }

  /**
   * 결제 정보 저장 (payment_details와 함께)
   */
  async createPaymentRecord(client, paymentData) {
    // 1. payments 테이블에 결제 정보 저장
    const paymentResult = await client.query(`
      INSERT INTO payments (
        order_id,
        method,
        amount,
        status,
        paid_at,
        transaction_id,
        provider_response
      ) VALUES ($1, 'TOSS', $2, 'COMPLETED', CURRENT_TIMESTAMP, $3, $4)
      RETURNING id
    `, [
      paymentData.orderId,
      paymentData.amount,
      paymentData.paymentKey,
      JSON.stringify(paymentData.providerResponse)
    ]);

    const paymentId = paymentResult.rows[0].id;

    // 2. payment_details 테이블에 연관 정보 저장
    // orderId로 해당 주문의 모든 티켓 조회
    const ticketsResult = await client.query(`
      SELECT id FROM order_tickets 
      WHERE order_id = $1
    `, [paymentData.orderId]);

    // 각 티켓에 대해 payment_details 레코드 생성
    for (const ticket of ticketsResult.rows) {
      await client.query(`
        INSERT INTO payment_details (
          payment_id,
          order_id,
          ticket_id
        ) VALUES ($1, $2, $3)
      `, [
        paymentId,
        paymentData.orderId,
        ticket.id
      ]);
    }

    console.log(`✅ 결제 정보 저장 완료: payment ${paymentId}, payment_details ${ticketsResult.rows.length}개`);
    
    return paymentId;
  }

  /**
   * 주문 총 금액 재계산 및 업데이트
   */
  async updateOrderTotalAmount(client, orderId) {
    try {
      const totalResult = await client.query(`
        SELECT 
          COALESCE(SUM(oi.unit_price * oi.quantity), 0) as item_total
        FROM order_items oi
        JOIN order_tickets ot ON oi.ticket_id = ot.id
        WHERE ot.order_id = $1 
          AND oi.item_status NOT IN ('CANCELLED', 'REFUNDED')
          AND ot.status NOT IN ('CANCELLED')
      `, [orderId]);

      const itemTotal = parseFloat(totalResult.rows[0].item_total) || 0;

      await client.query(`
        UPDATE orders
        SET 
          total_price = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [orderId, itemTotal]);

      console.log(`✅ 주문 ${orderId} 총 금액 업데이트: ${itemTotal}원`);
      
      return itemTotal;
    } catch (error) {
      console.error(`❌ 주문 ${orderId} 총 금액 재계산 실패:`, error);
      throw error;
    }
  }

  /**
   * 새 주문 알림 생성
   */
  async createOrderNotification(client, notificationData) {
    try {
      const { 
        userId, 
        storeId, 
        storeName, 
        tableNumber, 
        orderId, 
        ticketId,
        paymentKey, 
        amount,
        additionalMetadata = {}
      } = notificationData;

      // user_id 검증 (반드시 정수여야 함)
      const validUserId = parseInt(userId);
      if (isNaN(validUserId)) {
        throw new Error(`유효하지 않은 user_id: ${userId}`);
      }

      console.log(`📢 결제 서비스: 새 주문 알림 생성 준비`, {
        validUserId,
        storeId,
        storeName,
        tableNumber,
        orderId,
        ticketId,
        paymentKey,
        amount
      });

      // 결제 ID 조회 (방금 생성된 결제 레코드)
      let paymentId = null;
      try {
        const paymentResult = await client.query(`
          SELECT id FROM payments 
          WHERE order_id = $1 AND transaction_id = $2 
          ORDER BY created_at DESC LIMIT 1
        `, [orderId, paymentKey]);

        if (paymentResult.rows.length > 0) {
          paymentId = paymentResult.rows[0].id;
        }
      } catch (paymentError) {
        console.warn('⚠️ 결제 ID 조회 실패:', paymentError.message);
      }

      // 완전한 메타데이터 구성
      const completeMetadata = {
        // 핵심 ID들
        order_id: orderId,
        ticket_id: ticketId,
        store_id: storeId,
        payment_id: paymentId,

        // 기본 정보
        store_name: storeName || '매장',
        table_number: tableNumber,
        payment_key: paymentKey,
        amount: amount,

        // 추가 메타데이터 병합
        ...additionalMetadata,

        // 알림 생성 정보
        created_source: 'payment_completion',
        notification_type: 'new_order'
      };

      const insertResult = await client.query(`
        INSERT INTO notifications (
          user_id, type, title, message, metadata, is_read, sent_source
        ) VALUES ($1, $2, $3, $4, $5, false, 'TLL')
        RETURNING id
      `, [
        validUserId,
        'order',
        '새로운 주문이 시작되었습니다',
        `${storeName || '매장'}에서 새로운 주문 세션이 시작되었습니다. 테이블 ${tableNumber}`,
        JSON.stringify(completeMetadata)
      ]);

      const notificationId = insertResult.rows[0]?.id;
      console.log(`✅ 결제 서비스: 새 주문 알림 생성 성공`, {
        notificationId,
        userId: validUserId,
        orderId,
        ticketId,
        paymentId,
        metadataKeys: Object.keys(completeMetadata)
      });

    } catch (error) {
      console.error('❌ 결제 서비스: 새 주문 알림 생성 실패:', error);
      // 알림 실패가 전체 결제를 방해하지 않도록 에러를 throw하지 않음
    }
  }

  /**
   * 토스 결제 준비
   */
  async prepareTossPayment(prepareData) {
    const client = await pool.connect();

    try {
      const { storeId, tableNumber, userId, userPk, orderData, amount } = prepareData;

      console.log('💳 결제 서비스: 토스 결제 준비 시작', {
        storeId,
        tableNumber,
        userId,
        userPk,
        amount
      });

      // 고유한 orderId 생성 (UUID 형태)
      const orderId = `toss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // pending_payments에 저장
      await client.query(`
        INSERT INTO pending_payments (
          order_id, user_id, user_pk, store_id, table_number, 
          order_data, amount, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', CURRENT_TIMESTAMP)
      `, [
        orderId,
        userId,
        userPk,
        storeId,
        tableNumber,
        JSON.stringify(orderData),
        parseInt(amount)
      ]);

      console.log('✅ 결제 준비 완료 - pending_payments에 저장:', orderId);

      return { orderId };

    } catch (error) {
      console.error('❌ 결제 준비 실패:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 토스 결제 승인
   */
  async confirmTossPayment(confirmData) {
    const { paymentKey, orderId, amount } = confirmData;

    try {
      console.log('🔄 결제 서비스: 토스 결제 승인 시작', { paymentKey, orderId, amount });

      // pending_payments에서 주문 데이터 조회
      const client = await pool.connect();
      let pendingPayment;

      try {
        const pendingResult = await client.query(`
          SELECT * FROM pending_payments
          WHERE order_id = $1 AND status = 'PENDING'
        `, [orderId]);

        if (pendingResult.rows.length === 0) {
          throw new Error('대기 중인 결제를 찾을 수 없습니다');
        }

        pendingPayment = pendingResult.rows[0];
      } finally {
        client.release();
      }

      // 토스페이먼츠 API 승인 요청
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
        // 이미 처리된 결제인 경우 성공으로 처리
        if (tossResult.code === 'ALREADY_PROCESSED_PAYMENT') {
          console.log('⚠️ 이미 처리된 결제 - 성공으로 처리');
          return {
            success: true,
            message: '이미 처리된 결제입니다',
            alreadyProcessed: true
          };
        }
        throw new Error(tossResult.message || '토스페이먼츠 승인 실패');
      }

      console.log('✅ 토스페이먼츠 승인 성공:', tossResult);

      // 주문 및 결제 처리 (기존 TLL 로직 사용)
      const orderData = pendingPayment.order_data;
      const result = await this.processTLLOrder({
        orderId: pendingPayment.order_id,
        amount: pendingPayment.amount,
        paymentKey,
        tossResult,
        orderData,
        notificationMetadata: {}
      });

      // pending_payments 상태 업데이트
      const updateClient = await pool.connect();
      try {
        await updateClient.query(`
          UPDATE pending_payments
          SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
          WHERE order_id = $1
        `, [orderId]);
      } finally {
        updateClient.release();
      }

      return result;

    } catch (error) {
      console.error('❌ 결제 서비스: 토스 결제 승인 실패:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();