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

      console.log('💳 결제 서비스: TLL 주문 처리 시작', {
        orderId,
        amount,
        userPk: orderData.userPk,
        storeId: orderData.storeId,
        tableNumber: orderData.tableNumber,
        itemsCount: orderData.items?.length || 0
      });

      await client.query('BEGIN');

      // 1. 기존 OPEN 주문 확인 또는 새 주문 생성
      const orderResult = await this.getOrCreateOrder(client, orderData);
      const { orderIdToUse, isNewOrder } = orderResult;

      // 2. 배치 번호 계산 (order_tickets 기준)
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

      console.log('✅ 결제 서비스: TLL 주문 처리 완료');

      return {
        success: true,
        orderId: orderIdToUse,
        ticketId,
        batchNo,
        amount: orderData.finalTotal
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
    // 기존 주문이 있는지 확인
    console.log('🔍 기존 주문 확인:', {
      userPk: orderData.userPk,
      storeId: orderData.storeId,
      tableNumber: orderData.tableNumber
    });

    const existingOrderResult = await client.query(`
      SELECT id, status, created_at
      FROM orders
      WHERE user_pk = $1 
        AND store_id = $2 
        AND table_number = $3 
        AND status IN ('PENDING', 'CONFIRMED', 'COOKING')
      ORDER BY created_at DESC
      LIMIT 1
    `, [orderData.userPk, orderData.storeId, orderData.tableNumber]);

    console.log('📊 기존 주문 조회 결과:', {
      찾은개수: existingOrderResult.rows.length,
      주문들: existingOrderResult.rows
    });

    let orderId, isNewOrder;

    if (existingOrderResult.rows.length > 0) {
      // 기존 주문에 추가
      const existingOrder = existingOrderResult.rows[0];
      orderId = existingOrder.id;
      isNewOrder = false;

      console.log(`🔄 기존 주문에 추가: Order ID ${orderId}, Status ${existingOrder.status}`);
    } else {
      // 새 주문 생성
      console.log(`🆕 새 주문 생성 시작`);

      const newOrderResult = await client.query(`
        INSERT INTO orders (
          user_pk, store_id, table_number, subtotal, final_total,
          used_point, coupon_discount, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'CONFIRMED', CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        orderData.userPk,
        orderData.storeId,
        orderData.tableNumber,
        orderData.subtotal,
        orderData.finalTotal,
        orderData.usedPoint,
        orderData.couponDiscount
      ]);

      orderId = newOrderResult.rows[0].id;
      isNewOrder = true;

      console.log(`✅ 새 주문 생성 완료: Order ID ${orderId}`);
    }

    return { orderIdToUse: orderId, isNewOrder };
  }

  /**
   * 배치 번호 계산
   */
  async calculateBatchNumber(client, orderId) {
    const result = await client.query(`
      SELECT COUNT(*) as count FROM order_tickets 
      WHERE order_id = $1
    `, [orderId]);

    const batchNo = parseInt(result.rows[0].count) + 1;
    
    console.log(`📊 배치 번호 계산: Order ID ${orderId}, 기존 티켓 ${result.rows[0].count}개, 새 배치 번호 ${batchNo}`);

    return batchNo;
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
}

module.exports = new PaymentService();