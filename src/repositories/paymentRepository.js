
const pool = require('../db/pool');

/**
 * 결제 레포지토리 - 결제 관련 데이터베이스 접근
 */
class PaymentRepository {
  /**
   * pending_payments에 결제 대기 정보 저장
   */
  async createPendingPayment(client, paymentData) {
    const { orderId,  userPK, storeId, tableNumber, orderData, amount } = paymentData;

    

    await client.query(`
      INSERT INTO pending_payments (
        order_id, user_pk, store_id, table_number, 
        order_data, amount, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', CURRENT_TIMESTAMP)
    `, [
      orderId,
      userPK,
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

  /**
   * 미지불 티켓 조회
   */
  async getUnpaidTickets(client, orderId, source = null) {
    const clientToUse = client || pool;
    
    let query = `
      SELECT
        ot.id as ticket_id,
        ot.batch_no,
        ot.table_num,
        ot.created_at,
        COUNT(oi.id) as item_count,
        COALESCE(SUM(oi.total_price), 0) as ticket_amount
      FROM order_tickets ot
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.order_id = $1
        AND ot.paid_status = 'UNPAID'
        AND ot.status != 'CANCELED'
    `;
    
    const params = [orderId];
    
    if (source) {
      query += ` AND ot.source = $2`;
      params.push(source);
    }
    
    query += `
      GROUP BY ot.id, ot.batch_no, ot.table_num, ot.created_at
      ORDER BY ot.created_at ASC
    `;

    const result = await clientToUse.query(query, params);
    return result.rows;
  }

  /**
   * 티켓 결제 상태를 PAID로 업데이트
   */
  async updateTicketsToPaid(client, orderId, source = null) {
    let query = `
      UPDATE order_tickets
      SET paid_status = 'PAID',
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
        AND paid_status = 'UNPAID'
    `;
    
    const params = [orderId];
    
    if (source) {
      query += ` AND source = $2`;
      params.push(source);
    }
    
    query += ` RETURNING id, batch_no`;

    const result = await client.query(query, params);
    return result.rows.map(row => ({
      ticketId: row.id,
      batchNo: row.batch_no
    }));
  }

  /**
   * 특정 티켓들에 대한 결제 세부 정보 생성
   */
  async createPaymentDetailsForTickets(client, paymentId, orderId, tickets) {
    for (const ticket of tickets) {
      await client.query(`
        INSERT INTO payment_details (
          payment_id,
          order_id,
          ticket_id
        ) VALUES ($1, $2, $3)
      `, [paymentId, orderId, ticket.ticket_id]);
    }

    return tickets.length;
  }

  /**
   * 전화번호로 게스트 조회
   */
  async findGuestByPhone(client, phone) {
    const result = await client.query(`
      SELECT id FROM guests WHERE phone = $1
    `, [phone]);

    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  /**
   * 새 게스트 생성
   */
  async createGuest(client, phone) {
    const result = await client.query(`
      INSERT INTO guests (phone, created_at)
      VALUES ($1, CURRENT_TIMESTAMP)
      RETURNING id
    `, [phone]);

    return result.rows[0].id;
  }

  /**
   * ID로 회원 조회
   */
  async findMemberById(client, memberId) {
    const result = await client.query(`
      SELECT id, name, phone FROM users
      WHERE id = $1
    `, [memberId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 전화번호로 회원 조회
   */
  async findMemberByPhone(client, phone) {
    const result = await client.query(`
      SELECT id, name, phone, point FROM users
      WHERE phone = $1
    `, [phone]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 미지불 티켓 개수 조회
   */
  async countUnpaidTickets(client, orderId) {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM order_tickets
      WHERE order_id = $1 AND paid_status = 'UNPAID'
    `, [orderId]);

    return parseInt(result.rows[0].count);
  }

  /**
   * 주문 정보 조회
   */
  async getOrderInfo(orderId) {
    const result = await pool.query(`
      SELECT
        o.id,
        o.store_id,
        o.table_num,
        o.total_price,
        o.payment_status,
        o.status,
        o.user_id,
        o.guest_phone,
        s.name as store_name
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE o.id = $1
    `, [orderId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 결제 내역 조회
   */
  async getPaymentHistory(orderId) {
    const result = await pool.query(`
      SELECT
        p.id,
        p.method,
        p.amount,
        p.status,
        p.paid_at,
        p.transaction_id,
        array_agg(pd.ticket_id) as ticket_ids
      FROM payments p
      LEFT JOIN payment_details pd ON p.id = pd.payment_id
      WHERE p.order_id = $1
      GROUP BY p.id, p.method, p.amount, p.status, p.paid_at, p.transaction_id
      ORDER BY p.paid_at DESC
    `, [orderId]);

    return result.rows;
  }

  /**
   * 티켓 상태 조회
   */
  async getTicketStatus(orderId) {
    const result = await pool.query(`
      SELECT
        ot.id as ticket_id,
        ot.batch_no,
        ot.paid_status,
        ot.source,
        COUNT(oi.id) as item_count
      FROM order_tickets ot
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.order_id = $1
      GROUP BY ot.id, ot.batch_no, ot.paid_status, ot.source
      ORDER BY ot.batch_no ASC
    `, [orderId]);

    return result.rows;
  }

  /**
   * 비회원 TLL 결제 레코드 생성
   */
  async createGuestTLLPayment(client, paymentData) {
    const { orderId, amount, paymentKey, guestName, guestPhone, providerResponse } = paymentData;

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
      JSON.stringify({
        ...providerResponse,
        guest_name: guestName,
        guest_phone: guestPhone,
        payment_type: 'GUEST_TLL'
      })
    ]);

    return result.rows[0].id;
  }

  /**
   * 비회원 정보로 주문 업데이트
   */
  async updateOrderWithGuestInfo(client, orderId, guestName, guestPhone, guestId = null) {
    const query = guestId 
      ? `UPDATE orders
         SET guest_phone = $1,
             guest_id = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`
      : `UPDATE orders
         SET guest_phone = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`;
    
    const params = guestId 
      ? [guestPhone, guestId, orderId]
      : [guestPhone, orderId];

    await client.query(query, params);

    console.log(`✅ 주문 ${orderId}에 비회원 정보 업데이트: ${guestName}, ${guestPhone}${guestId ? `, guestId: ${guestId}` : ''}`);
  }
}

module.exports = new PaymentRepository();
