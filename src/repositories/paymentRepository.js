
const pool = require('../db/pool');

/**
 * 결제 레포지토리 - 결제 관련 데이터베이스 접근
 */
class PaymentRepository {
  /**
   * pending_payments에 결제 대기 정보 저장
   */
  async createPendingPayment(client, paymentData) {
    const { orderId, userId, userPk, storeId, tableNumber, orderData, amount } = paymentData;

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
  }

  /**
   * pending_payments에서 주문 데이터 조회
   */
  async getPendingPayment(orderId) {
    const result = await pool.query(`
      SELECT * FROM pending_payments
      WHERE order_id = $1 AND status = 'PENDING'
    `, [orderId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * pending_payments 상태 업데이트
   */
  async updatePendingPaymentStatus(client, orderId, status) {
    await client.query(`
      UPDATE pending_payments
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $2
    `, [status, orderId]);
  }

  /**
   * 결제 정보 저장 (payments 테이블)
   */
  async createPaymentRecord(client, paymentData) {
    const { orderId, amount, paymentKey, providerResponse } = paymentData;

    const result = await client.query(`
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
      orderId,
      amount,
      paymentKey,
      JSON.stringify(providerResponse)
    ]);

    return result.rows[0].id;
  }

  /**
   * 결제 세부 정보 저장 (payment_details 테이블)
   */
  async createPaymentDetails(client, paymentId, orderId) {
    // orderId로 해당 주문의 모든 티켓 조회
    const ticketsResult = await client.query(`
      SELECT id FROM order_tickets 
      WHERE order_id = $1
    `, [orderId]);

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
        orderId,
        ticket.id
      ]);
    }

    return ticketsResult.rows.length;
  }

  /**
   * 알림 생성
   */
  async createOrderNotification(client, notificationData) {
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

    // user_id 검증
    const validUserId = parseInt(userId);
    if (isNaN(validUserId)) {
      throw new Error(`유효하지 않은 user_id: ${userId}`);
    }

    // 결제 ID 조회
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
    } catch (error) {
      console.warn('⚠️ 결제 ID 조회 실패:', error.message);
    }

    // 완전한 메타데이터 구성
    const completeMetadata = {
      order_id: orderId,
      ticket_id: ticketId,
      store_id: storeId,
      payment_id: paymentId,
      store_name: storeName || '매장',
      table_number: tableNumber,
      payment_key: paymentKey,
      amount: amount,
      ...additionalMetadata,
      created_source: 'payment_completion',
      notification_type: 'new_order'
    };

    const result = await client.query(`
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

    return result.rows[0]?.id;
  }
}

module.exports = new PaymentRepository();
