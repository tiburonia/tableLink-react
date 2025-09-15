
/**
 * KDS 전용 서비스 모듈
 * - KDS 관련 비즈니스 로직 집중 관리
 * - 이벤트 기반으로 결제 시스템과 분리
 */

const eventBus = require('../utils/eventBus');
const pool = require('../db/pool');

class KDSService {
  constructor() {
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 새 주문 생성 이벤트 처리
    eventBus.on('order.created', this.handleNewOrder.bind(this));
    
    // 결제 완료 이벤트 처리
    eventBus.on('payment.completed', this.handlePaymentCompleted.bind(this));
    
    // 주문 상태 변경 이벤트 처리
    eventBus.on('order.statusChanged', this.handleOrderStatusChanged.bind(this));
  }

  /**
   * 새 주문 생성 처리
   */
  async handleNewOrder(orderData) {
    try {
      console.log('🍳 KDS: 새 주문 처리 시작', orderData);

      const { orderId, ticketId, storeId, tableNumber, items, batchNo } = orderData;

      // KDS 형태로 데이터 변환
      const kdsTicketData = {
        check_id: ticketId,
        id: orderId,
        ticket_id: ticketId,
        batch_no: batchNo || 1,
        customer_name: `테이블 ${tableNumber}`,
        table_number: tableNumber,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: items.map(item => ({
          id: Math.random().toString(36).substr(2, 9),
          menuName: item.name,
          menu_name: item.name,
          quantity: item.quantity || 1,
          status: 'pending',
          cook_station: item.cook_station || 'KITCHEN',
          notes: '',
          created_at: new Date().toISOString()
        }))
      };

      // KRP용 필터링된 데이터 생성 (조리가 필요한 아이템만)
      const krpItems = items.filter(item => 
        item.cook_station !== 'DRINK' && 
        item.cook_station !== 'NO_COOK'
      );

      const krpPrintData = {
        ticket_id: ticketId,
        order_id: orderId,
        table_number: tableNumber,
        customer_name: `테이블 ${tableNumber}`,
        total_amount: krpItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0),
        items: krpItems.map(item => ({
          menuName: item.name,
          quantity: item.quantity || 1,
          price: item.price || 0,
          totalPrice: (item.price || 0) * (item.quantity || 1),
          cook_station: item.cook_station || 'KITCHEN'
        })),
        created_at: new Date().toISOString(),
        source: 'new_order_auto',
        filter_applied: true,
        original_items_count: items.length,
        filtered_items_count: krpItems.length
      };

      // WebSocket 브로드캐스트 (KDS용)
      await this.broadcastToKDS(storeId, 'new-order', kdsTicketData);

      // KRP 브로드캐스트 (필터링된 데이터 사용)
      if (krpItems.length > 0 && global.broadcastKRPPrint) {
        console.log(`🖨️ KDS 서비스: KRP 자동 출력 - ${krpItems.length}개 조리 아이템`);
        global.broadcastKRPPrint(storeId, krpPrintData);
      } else {
        console.log(`ℹ️ KDS 서비스: 조리가 필요한 아이템이 없어 KRP 출력 생략`);
      }

      // PostgreSQL NOTIFY
      await this.sendPostgreSQLNotify('kds_updates', {
        type: 'new_ticket',
        store_id: storeId,
        ticket_id: ticketId,
        order_id: orderId,
        batch_no: batchNo || 1,
        source_system: 'TLL',
        table_number: tableNumber,
        timestamp: Date.now()
      });

      console.log('✅ KDS: 새 주문 처리 완료');
      return { success: true, ticketId };

    } catch (error) {
      console.error('❌ KDS: 새 주문 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 결제 완료 처리
   */
  async handlePaymentCompleted(paymentData) {
    try {
      console.log('💳 KDS: 결제 완료 처리', paymentData);

      const { orderId, ticketId, storeId } = paymentData;

      // KDS에 결제 완료 알림
      await this.broadcastToKDS(storeId, 'payment-completed', {
        order_id: orderId,
        ticket_id: ticketId,
        status: 'paid',
        timestamp: new Date().toISOString()
      });

      console.log('✅ KDS: 결제 완료 처리 완료');

    } catch (error) {
      console.error('❌ KDS: 결제 완료 처리 실패:', error);
    }
  }

  /**
   * 주문 상태 변경 처리
   */
  async handleOrderStatusChanged(statusData) {
    try {
      console.log('🔄 KDS: 주문 상태 변경 처리', statusData);

      const { orderId, ticketId, storeId, status } = statusData;

      await this.broadcastToKDS(storeId, 'status-changed', {
        order_id: orderId,
        ticket_id: ticketId,
        status: status,
        timestamp: new Date().toISOString()
      });

      console.log('✅ KDS: 주문 상태 변경 처리 완료');

    } catch (error) {
      console.error('❌ KDS: 주문 상태 변경 처리 실패:', error);
    }
  }

  /**
   * WebSocket을 통한 KDS 브로드캐스트
   */
  async broadcastToKDS(storeId, event, data) {
    if (typeof global.broadcastKDSUpdate === 'function') {
      global.broadcastKDSUpdate(storeId, event, data);
      console.log(`📡 KDS WebSocket 브로드캐스트: ${storeId} -> ${event}`);
    } else {
      console.warn('⚠️ broadcastKDSUpdate 함수를 찾을 수 없음');
    }
  }

  /**
   * PostgreSQL NOTIFY 전송
   */
  async sendPostgreSQLNotify(channel, data) {
    const client = await pool.connect();
    try {
      await client.query(`
        SELECT pg_notify($1, $2)
      `, [channel, JSON.stringify(data)]);
      
      console.log(`✅ PostgreSQL NOTIFY 전송: ${channel}`);
    } catch (error) {
      console.warn('⚠️ PostgreSQL NOTIFY 전송 실패:', error);
    } finally {
      client.release();
    }
  }
}

module.exports = new KDSService();
