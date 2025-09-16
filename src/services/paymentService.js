/**
 * 결제 전용 서비스 모듈
 * - 결제 관련 비즈니스 로직 집중 관리
 * - 이벤트 발생을 통해 다른 서비스와 통신
 */

const eventBus = require('../utils/eventBus');
const pool = require('../db/pool');

class PaymentService {
  /**
   * TLL 주문 결제 처리
   */
  async processTLLOrder(paymentData) {
    const client = await pool.connect();

    try {
      const { orderId, amount, orderData } = paymentData;

      console.log('💳 결제 서비스: TLL 주문 처리 시작', orderId);

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
        ticketId,
        storeId: orderData.storeId,
        items: orderData.items
      });

      // 5. 결제 정보 저장
      await this.createPaymentRecord(client, {
        orderId: orderIdToUse,
        ticketId,
        amount: orderData.finalTotal,
        paymentKey: paymentData.paymentKey,
        providerResponse: paymentData.tossResult
      });

      await client.query('COMMIT');

      console.log(`✅ 결제 서비스: TLL 주문 처리 완료 - 주문 ${orderIdToUse}, 새 주문: ${isNewOrder}`);

      // 새 주문 생성 시 알림 생성
      if (isNewOrder) {
        await this.createOrderNotification(client, {
          userId: orderData.userPk,
          storeId: orderData.storeId,
          storeName: orderData.storeName,
          tableNumber: orderData.tableNumber,
          orderId: orderIdToUse,
          paymentKey: paymentData.paymentKey,
          amount: orderData.finalTotal
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
        paymentKey: paymentData.paymentKey
      });

      return {
        success: true,
        orderId: orderIdToUse,
        ticketId,
        batchNo,
        amount: orderData.finalTotal,
        isNewOrder
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
    // 기존 OPEN 주문 확인
    const existingOrderResult = await client.query(`
      SELECT id FROM orders 
      WHERE store_id = $1 AND user_id = $2 AND status = 'OPEN'
      LIMIT 1
    `, [orderData.storeId, orderData.userPk]);

    if (existingOrderResult.rows.length > 0) {
      return {
        orderIdToUse: existingOrderResult.rows[0].id,
        isNewOrder: false
      };
    }

    // 새 주문 생성
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
      orderData.storeId,
      orderData.userPk,
      orderData.finalTotal,
      orderData.tableNumber
    ]);

    return {
      orderIdToUse: newOrderResult.rows[0].id,
      isNewOrder: true
    };
  }

  /**
   * 배치 번호 계산
   */
  async calculateBatchNumber(client, orderId) {
    const result = await client.query(`
      SELECT COUNT(*) as count FROM order_tickets 
      WHERE order_id = $1
    `, [orderId]);

    return parseInt(result.rows[0].count) + 1;
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
        table_num
      ) VALUES ($1, $2, $3, 'PENDING', 'PREPAID', 'TLL', $4)
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
    const { ticketId, storeId, items } = itemData;

    for (const item of items) {
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
        storeId,
        item.menuId || item.menu_id || null,
        item.name,
        item.quantity || 1,
        item.price,
        item.totalPrice || item.price,
        item.cook_station || 'KITCHEN'
      ]);
    }
  }

  /**
   * 결제 정보 저장
   */
  async createPaymentRecord(client, paymentData) {
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
      paymentData.orderId,
      paymentData.ticketId,
      paymentData.amount,
      paymentData.paymentKey,
      JSON.stringify(paymentData.providerResponse)
    ]);
  }

  /**
   * 새 주문 알림 생성
   */
  async createOrderNotification(client, notificationData) {
    try {
      const { userId, storeId, storeName, tableNumber, orderId, paymentKey, amount } = notificationData;

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
        paymentKey,
        amount
      });

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
        JSON.stringify({
          order_id: orderId,
          store_id: storeId,
          store_name: storeName || '매장',
          table_number: tableNumber,
          payment_key: paymentKey,
          amount: amount
        })
      ]);

      const notificationId = insertResult.rows[0]?.id;
      console.log(`✅ 결제 서비스: 새 주문 알림 생성 성공 - 알림 ID ${notificationId}, 사용자 ${validUserId}, 주문 ${orderId}`);

      return notificationId;
    } catch (error) {
      console.error('❌ 결제 서비스: 새 주문 알림 생성 실패:', error);
      console.error('❌ 알림 생성 오류 상세:', {
        error: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        userId: notificationData.userId,
        userIdType: typeof notificationData.userId,
        storeId: notificationData.storeId,
        storeIdType: typeof notificationData.storeId
      });
      // 알림 생성 실패가 전체 결제를 실패시키지 않도록 에러를 던지지 않음
    }
  }
}

module.exports = new PaymentService();