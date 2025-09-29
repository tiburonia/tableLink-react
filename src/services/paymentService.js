/**
 * 결제 전용 서비스 모듈
 * - 결제 관련 비즈니스 로직 집중 관리
 * - 이벤트 발생을 통해 다른 서비스와 통신
 * - 리포지토리 패턴 적용
 */

const eventBus = require('../utils/eventBus');
const pool = require('../db/pool');
const orderRepository = require('../repositories/orderRepository');
const tableRepository = require('../repositories/tableRepository');
const paymentRepository = require('../repositories/paymentRepository');

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
      const batchNo = await orderRepository.getNextBatchNo(client, orderIdToUse);

      // 3. 티켓 생성
      const ticketId = await orderRepository.createTicket(client, {
        orderId: orderIdToUse,
        storeId: orderData.storeId,
        tableNumber: orderData.tableNumber,
        batchNo,
        source: 'TLL'
      });

      // 4. 주문 아이템 생성
      await this.createOrderItems(client, {
        orderId: orderIdToUse,
        ticketId,
        storeId: orderData.storeId,
        items: orderData.items
      });

      // 5. 주문 총 금액 재계산
      await orderRepository.updateOrderTotalAmount(client, orderIdToUse);

      // 6. 결제 정보 저장
      const paymentId = await paymentRepository.createPaymentRecord(client, {
        orderId: orderIdToUse,
        amount: orderData.finalTotal,
        paymentKey,
        providerResponse: tossResult
      });

      // 7. 결제 세부 정보 저장
      await paymentRepository.createPaymentDetails(client, paymentId, orderIdToUse);

      // 8. TLL 주문 시 store_tables에 주문 ID 등록
      await this.updateTableProcessingOrder(client, orderData.storeId, orderData.tableNumber, orderIdToUse);

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
    // 기존 활성 주문 확인 (orderRepository의 getActiveOrderId 메서드 활용)
    const existingOrderId = await this.getActiveUserOrder(client, orderData);

    let orderIdToUse;
    let isNewOrder = false;

    if (existingOrderId) {
      // 기존 주문에 추가
      orderIdToUse = existingOrderId;
      console.log(`🔄 기존 주문에 추가: ${orderIdToUse}`);
    } else {
      // 새 주문 생성
      orderIdToUse = await orderRepository.createOrder(client, {
        storeId: orderData.storeId,
        tableNumber: orderData.tableNumber,
        source: 'TLL',
        totalPrice: 0
      });

      // TLL 주문 특수 속성 설정
      await client.query(`
        UPDATE orders 
        SET user_id = $1, payment_status = 'PAID', session_ended = false
        WHERE id = $2
      `, [orderData.userPk, orderIdToUse]);

      isNewOrder = true;
      console.log(`✅ 새 주문 생성: ${orderIdToUse}`);
    }

    return { orderIdToUse, isNewOrder };
  }

  /**
   * 사용자별 활성 주문 조회
   */
  async getActiveUserOrder(client, orderData) {
    const result = await client.query(`
      SELECT id FROM orders
      WHERE store_id = $1 
        AND table_num = $2 
        AND user_id = $3
        AND session_status = 'OPEN'
        AND NOT COALESCE(session_ended, false)
      ORDER BY created_at DESC
      LIMIT 1
    `, [orderData.storeId, orderData.tableNumber, orderData.userPk]);

    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  /**
   * 주문 아이템 생성
   */
  async createOrderItems(client, itemData) {
    const { orderId, ticketId, storeId, items } = itemData;

    for (const item of items) {
      await orderRepository.createOrderItem(client, {
        orderId,
        ticketId,
        menuId: item.menuId || item.menu_id || 1,
        menuName: item.name,
        unitPrice: item.price,
        quantity: item.quantity || 1,
        options: null,
        cookStation: item.cook_station || 'KITCHEN',
        storeId
      });
    }
  }

  /**
   * 테이블 처리 주문 업데이트
   */
  async updateTableProcessingOrder(client, storeId, tableNumber, orderId) {
    try {
      // 현재 테이블 상태 확인
      const currentTable = await tableRepository.getTableByNumber(storeId, tableNumber);

      if (!currentTable) {
        console.warn(`⚠️ 테이블 정보 없음: 매장 ${storeId}, 테이블 ${tableNumber}`);
        return;
      }

      const hasMainOrder = currentTable.processing_order_id !== null;
      const hasSpareOrder = currentTable.spare_processing_order_id !== null;

      // 현재 주문이 이미 테이블에 등록되어 있는지 확인
      const isAlreadyRegistered = (
        parseInt(currentTable.processing_order_id) === parseInt(orderId) ||
        parseInt(currentTable.spare_processing_order_id) === parseInt(orderId)
      );

      if (!isAlreadyRegistered) {
        if (!hasMainOrder) {
          // 메인 주문으로 설정
          await tableRepository.setMainOrder(client, storeId, tableNumber, orderId);
          console.log(`🍽️ TLL 주문 - 메인 슬롯 설정: 매장 ${storeId}, 테이블 ${tableNumber}, 주문 ${orderId}`);
        } else if (!hasSpareOrder) {
          // 보조 주문으로 설정
          await tableRepository.setSpareOrder(client, storeId, tableNumber, orderId);
          console.log(`🍽️ TLL 주문 - 보조 슬롯 설정: 매장 ${storeId}, 테이블 ${tableNumber}, 주문 ${orderId}`);
        } else {
          console.warn(`⚠️ TLL 주문 - 테이블에 이미 2개 주문 존재: 매장 ${storeId}, 테이블 ${tableNumber}`);
        }
      } else {
        console.log(`ℹ️ TLL 주문 - 이미 테이블에 등록된 주문: 매장 ${storeId}, 테이블 ${tableNumber}, 주문 ${orderId}`);
        // 테이블 상태를 OCCUPIED로 확실히 설정
        await client.query(`
          UPDATE store_tables
          SET status = 'OCCUPIED', updated_at = CURRENT_TIMESTAMP
          WHERE store_id = $1 AND id = $2
        `, [storeId, tableNumber]);
      }

    } catch (error) {
      console.error(`❌ 테이블 업데이트 실패: 매장 ${storeId}, 테이블 ${tableNumber}, 주문 ${orderId}`, error);
    }
  }

  /**
   * 새 주문 알림 생성
   */
  async createOrderNotification(client, notificationData) {
    try {
      const notificationId = await paymentRepository.createOrderNotification(client, notificationData);
      console.log(`✅ 결제 서비스: 새 주문 알림 생성 성공`, {
        notificationId,
        orderId: notificationData.orderId,
        userId: notificationData.userId
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
        storeId, tableNumber, userId, userPk, amount
      });

      // 고유한 orderId 생성
      const orderId = `toss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // pending_payments에 저장
      await paymentRepository.createPendingPayment(client, {
        orderId, userId, userPk, storeId, tableNumber, orderData, amount
      });

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
      const pendingPayment = await paymentRepository.getPendingPayment(orderId);

      if (!pendingPayment) {
        throw new Error('대기 중인 결제를 찾을 수 없습니다');
      }

      // 토스페이먼츠 API 승인 요청
      const tossResult = await this.requestTossPaymentConfirm(paymentKey, orderId, amount);

      console.log('✅ 토스페이먼츠 승인 성공:', tossResult);

      // 주문 및 결제 처리
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
        await paymentRepository.updatePendingPaymentStatus(updateClient, orderId, 'COMPLETED');
      } finally {
        updateClient.release();
      }

      return result;

    } catch (error) {
      console.error('❌ 결제 서비스: 토스 결제 승인 실패:', error);
      throw error;
    }
  }

  /**
   * 토스페이먼츠 API 승인 요청
   */
  async requestTossPaymentConfirm(paymentKey, orderId, amount) {
    const secretKey = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
    const authHeader = Buffer.from(secretKey + ':').toString('base64');

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
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

    const result = await response.json();

    if (!response.ok) {
      // 이미 처리된 결제인 경우 성공으로 처리
      if (result.code === 'ALREADY_PROCESSED_PAYMENT') {
        console.log('⚠️ 이미 처리된 결제 - 성공으로 처리');
        return {
          success: true,
          message: '이미 처리된 결제입니다',
          alreadyProcessed: true
        };
      }
      throw new Error(result.message || '토스페이먼츠 승인 실패');
    }

    return result;
  }
}

module.exports = new PaymentService();