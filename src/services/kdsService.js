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

    // 주문 수정 이벤트 처리 (batch 변경)
    eventBus.on('order.modified', this.handleOrderModified.bind(this));

    // 주문 취소 이벤트 처리
    eventBus.on('order.canceled', this.handleOrderCanceled.bind(this));
  }

  /**
   * 새 주문 생성 처리
   */
  async handleNewOrder(orderData) {
    try {
      console.log('🍳 KDS: 새 주문 처리 시작', {
        ...orderData,
        timestamp: new Date().toISOString(),
        source: 'kdsService'
      });

      const { orderId, ticketId, storeId, tableNumber, items, batchNo } = orderData;

      // 주방 관련 아이템만 필터링
      const kitchenItems = (items || []).filter(item => {
        const cookStation = item.cook_station || 'KITCHEN';
        return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
      });

      console.log(`🍳 KDS: 티켓 ${ticketId} 아이템 필터링 - 전체 ${items.length}개 → 주방 ${kitchenItems.length}개`);

      if (kitchenItems.length === 0) {
        console.log(`ℹ️ 티켓 ${ticketId}에 주방 아이템이 없음 - KDS 처리 스킵`);
        return { success: true, ticketId, skipped: true };
      }

      // KDS 형태로 데이터 변환
      const kdsTicketData = {
        check_id: ticketId,
        id: orderId,
        ticket_id: ticketId,
        batch_no: batchNo || 1,
        customer_name: `테이블 ${tableNumber}`,
        table_number: tableNumber,
        table_num: tableNumber,
        status: 'PENDING',
        source: 'POS',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: kitchenItems.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          menuName: item.name || item.menu_name,
          menu_name: item.name || item.menu_name,
          quantity: item.quantity || 1,
          status: 'PENDING',
          item_status: 'PENDING',
          cook_station: item.cook_station || 'KITCHEN',
          notes: item.notes || '',
          created_at: new Date().toISOString()
        }))
      };

      console.log(`🍳 KDS 티켓 데이터 생성: ${kitchenItems.length}개 주방 아이템`, kdsTicketData);

      // WebSocket 브로드캐스트 (기존 카드 유지하며 새 카드 추가)
      await this.broadcastToKDS(storeId, 'new-order', kdsTicketData);

      // PostgreSQL NOTIFY
      await this.sendPostgreSQLNotify('kds_updates', {
        type: 'new_ticket',
        store_id: storeId,
        ticket_id: ticketId,
        order_id: orderId,
        batch_no: batchNo || 1,
        source_system: 'POS',
        table_number: tableNumber,
        kitchen_items_count: kitchenItems.length,
        total_items_count: items.length,
        timestamp: Date.now()
      });

      console.log(`✅ KDS: 새 주문 처리 완료 - ${kitchenItems.length}개 주방 아이템`);
      return { success: true, ticketId, kitchenItemsCount: kitchenItems.length };

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
   * 주문 수정 처리 (batch 변경 포함)
   */
  async handleOrderModified(modifyData) {
    try {
      console.log('🔄 KDS: 주문 수정 처리 (batch 변경)', modifyData);

      const { orderId, ticketId, storeId, batchNo, items, modifications } = modifyData;

      // 주방 관련 아이템만 필터링
      const kitchenItems = (items || []).filter(item => {
        const cookStation = item.cook_station || 'KITCHEN';
        return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
      });

      console.log(`🍳 KDS: 티켓 ${ticketId} 수정 - 전체 ${items?.length || 0}개 → 주방 ${kitchenItems.length}개`);

      // KDS 업데이트 데이터 생성
      const kdsUpdateData = {
        order_id: orderId,
        ticket_id: ticketId,
        batch_no: batchNo,
        status: 'PENDING', // 수정 후 대기 상태로 리셋
        items: kitchenItems.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          menuName: item.name || item.menu_name,
          menu_name: item.name || item.menu_name,
          quantity: item.quantity || 1,
          status: 'PENDING',
          item_status: 'PENDING',
          cook_station: item.cook_station || 'KITCHEN',
          notes: item.notes || '',
          created_at: new Date().toISOString()
        })),
        modifications: modifications,
        timestamp: new Date().toISOString()
      };

      // WebSocket 브로드캐스트
      await this.broadcastToKDS(storeId, 'ticket-modified', kdsUpdateData);

      // PostgreSQL NOTIFY
      await this.sendPostgreSQLNotify('kds_updates', {
        type: 'ticket_modified',
        store_id: storeId,
        ticket_id: ticketId,
        order_id: orderId,
        batch_no: batchNo,
        kitchen_items_count: kitchenItems.length,
        modification_type: modifications?.type || 'batch_update',
        timestamp: Date.now()
      });

      console.log(`✅ KDS: 주문 수정 처리 완료 - ${kitchenItems.length}개 주방 아이템`);
      return { success: true, ticketId, kitchenItemsCount: kitchenItems.length };

    } catch (error) {
      console.error('❌ KDS: 주문 수정 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 주문 취소 처리
   */
  async handleOrderCanceled(cancelData) {
    try {
      console.log('❌ KDS: 주문 취소 처리', cancelData);

      const { orderId, ticketId, storeId, items, reason } = cancelData;

      // 주방 관련 아이템만 필터링
      const kitchenItems = (items || []).filter(item => {
        const cookStation = item.cook_station || 'KITCHEN';
        return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
      });

      console.log(`❌ KDS: 티켓 ${ticketId} 취소 - 주방 아이템 ${kitchenItems.length}개`);

      // KDS 취소 데이터 생성
      const kdsCancelData = {
        order_id: orderId,
        ticket_id: ticketId,
        status: 'CANCELED',
        items: kitchenItems,
        kitchen_items_count: kitchenItems.length,
        reason: reason || 'canceled',
        timestamp: new Date().toISOString()
      };

      // WebSocket 브로드캐스트 (반짝임 효과 트리거)
      await this.broadcastToKDS(storeId, 'ticket-canceled', kdsCancelData);

      // PostgreSQL NOTIFY
      await this.sendPostgreSQLNotify('kds_updates', {
        type: 'ticket_canceled',
        store_id: storeId,
        ticket_id: ticketId,
        order_id: orderId,
        kitchen_items_count: kitchenItems.length,
        has_kitchen_items: kitchenItems.length > 0,
        timestamp: Date.now()
      });

      console.log(`✅ KDS: 주문 취소 처리 완료 - ${kitchenItems.length > 0 ? '반짝임 교체' : '완전 제거'}`);
      return { success: true, ticketId, removed: kitchenItems.length === 0 };

    } catch (error) {
      console.error('❌ KDS: 주문 취소 처리 실패:', error);
      throw error;
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