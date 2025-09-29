const orderRepository = require('../repositories/orderRepository');
const tableRepository = require('../repositories/tableRepository');
const eventBus = require('../utils/eventBus');

/**
 * 주문 서비스 - 비즈니스 로직
 */
class OrderService {
  /**
   * 매장 메뉴 조회
   */
  async getStoreMenu(storeId) {
    const store = await orderRepository.getStoreById(storeId);
    if (!store) {
      throw new Error('매장을 찾을 수 없습니다');
    }

    let menu = await orderRepository.getStoreMenu(storeId);
    if (menu.length === 0) {
      menu = this.getDefaultMenu();
    }

    return menu;
  }

  /**
   * 테이블별 POS 주문 아이템 조회 (미지불만)
   */
  async getTableOrderItems(storeId, tableNumber) {
    if (isNaN(storeId) || isNaN(tableNumber)) {
      throw new Error(`유효하지 않은 파라미터: storeId=${storeId}, tableNumber=${tableNumber}`);
    }

    const orderItems = await orderRepository.getPOSOrderItems(storeId, tableNumber);

    // PAID 상태 완전 제거 (이중 체크)
    const filteredResults = orderItems.filter(item => {
      const isPaid = item.paid_status === 'PAID';
      if (isPaid) {
        console.warn(`⚠️ PAID 상태 아이템 발견 및 제거:`, {
          ticket_id: item.ticket_id,
          menu_name: item.menu_name,
          paid_status: item.paid_status
        });
      }
      return !isPaid && item.paid_status === 'UNPAID';
    });

    return {
      orderItems: filteredResults,
      count: filteredResults.length
    };
  }

  /**
   * 테이블별 TLL 주문 조회
   */
  async getTLLOrders(storeId, tableNumber) {
    if (isNaN(storeId) || isNaN(tableNumber)) {
      throw new Error(`유효하지 않은 파라미터: storeId=${storeId}, tableNumber=${tableNumber}`);
    }

    const tllOrders = await orderRepository.getTLLOrders(storeId, tableNumber);

    // 사용자 정보 조회
    let userInfo = null;
    if (tllOrders.length > 0) {
      const firstOrder = tllOrders[0];

      if (firstOrder.user_id) {
        userInfo = await orderRepository.getUserById(firstOrder.user_id);
      } else if (firstOrder.guest_phone) {
        userInfo = {
          id: null,
          name: '게스트',
          phone: firstOrder.guest_phone,
          guest_phone: firstOrder.guest_phone,
          point: 0,
          created_at: null
        };
      }
    }

    return {
      tllOrders,
      userInfo
    };
  }

  /**
   * POS 주문 생성
   */
  async createPOSOrder(orderData) {
    const { storeId, tableNumber, items, totalAmount } = orderData;

    if (!storeId || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error('필수 정보가 누락되었습니다');
    }

    const client = await orderRepository.getClient();

    try {
      await client.query('BEGIN');

      // 1. orders 테이블에 주문 생성
      const orderId = await orderRepository.createOrder(client, {
        storeId,
        tableNumber,
        source: 'POS',
        totalPrice: totalAmount
      });

      // 2. order_tickets 테이블에 티켓 생성
      const ticketId = await orderRepository.createTicket(client, {
        orderId,
        storeId,
        tableNumber,
        source: 'POS'
      });

      // 3. order_items 테이블에 주문 아이템들 생성
      for (const item of items) {
        await orderRepository.createOrderItem(client, {
          orderId,
          ticketId,
          menuName: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          options: item.options
        });
      }

      await client.query('COMMIT');

      return { orderId, ticketId };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Batch 알고리즘 주문 수정
   */
  async modifyBatch(modifyData) {
    const { storeId, tableNumber, modifications } = modifyData;
    const { add = {}, remove = {} } = modifications || {};

    if (!storeId || !tableNumber || (!Object.keys(add).length && !Object.keys(remove).length)) {
      throw new Error('필수 정보가 누락되었습니다');
    }

    const client = await orderRepository.getClient();

    try {
      await client.query('BEGIN');

      // 1. 활성 주문 조회 또는 생성
      let orderId = await orderRepository.getActiveOrderId(client, storeId, tableNumber);

      if (!orderId) {
        orderId = this.createNewPOSOrder(client, storeId, tableNumber);
      }

      // 2. 추가 주문 처리
      if (Object.keys(add).length > 0) {
        await this.processAddItems(client, orderId, storeId, tableNumber, add);
      }

      // 3. 감소 주문 처리
      for (const [menuName, removeQty] of Object.entries(remove)) {
        await this.processRemoveItems(client, orderId, menuName, removeQty);
      }

      // 4. 주문 완전 취소 확인
      const hasItems = await orderRepository.hasActiveItems(client, orderId);
      if (!hasItems) {
        await this.handleOrderCancellation(client, orderId, storeId, tableNumber);
      }

      // 5. 주문 총액 업데이트
      await orderRepository.updateOrderTotalAmount(client, orderId);

      await client.query('COMMIT');

      // KDS 이벤트 발생
      this.emitKDSEvent(orderId, storeId, tableNumber, { add, remove });

      return {
        orderId,
        processed: {
          added: Object.keys(add).length,
          removed: Object.keys(remove).length
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ modifyBatch 트랜잭션 실패:', {
        storeId,
        tableNumber,
        modifications,
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * TLL 연동 활성화
   */
  async enableMixed(orderId) {
    if (!orderId) {
      throw new Error('주문 ID가 필요합니다');
    }

    const client = await orderRepository.getClient();

    try {
      await client.query('BEGIN');

      const order = await orderRepository.getOrderById(client, orderId);
      if (!order) {
        throw new Error('주문을 찾을 수 없습니다');
      }

      if (order.source !== 'TLL') {
        throw new Error('TLL 주문이 아닙니다');
      }

      if (order.session_status !== 'OPEN') {
        throw new Error('종료된 주문은 연동할 수 없습니다');
      }

      if (order.is_mixed) {
        throw new Error('이미 연동이 활성화된 주문입니다');
      }

      // is_mixed를 true로 업데이트
      await orderRepository.updateOrderMixed(client, orderId, true);

      // store_tables의 spare_processing_order_id 업데이트
      await tableRepository.updateSpareProcessingOrder(client, orderId);

      await client.query('COMMIT');

      return {
        orderId: parseInt(orderId),
        is_mixed: true
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * TLL 주문 Mixed 상태 조회
   */
  async getMixedStatus(orderId) {
    if (!orderId) {
      throw new Error('주문 ID가 필요합니다');
    }

    const order = await orderRepository.getOrderById(null, orderId);
    if (!order) {
      throw new Error('주문을 찾을 수 없습니다');
    }

    return {
      orderId: parseInt(orderId),
      source: order.source,
      session_status: order.session_status,
      is_mixed: order.is_mixed,
      created_at: order.created_at,
      updated_at: order.updated_at
    };
  }

  /**
   * 활성 주문 조회 (교차 주문 지원)
   */
  async getActiveOrders(storeId) {
    const mainOrders = await orderRepository.getMainActiveOrders(storeId);
    const spareOrders = await orderRepository.getSpareActiveOrders(storeId);

    const activeOrders = [];

    // 메인 주문 처리
    mainOrders.forEach(row => {
      const hasSpareOrder = row.spare_processing_order_id !== null;
      activeOrders.push({
        checkId: row.order_id,
        tableNumber: row.table_number,
        customerName: row.customer_name,
        isGuest: !row.user_id,
        totalAmount: row.total_amount || 0,
        status: row.status,
        openedAt: row.opened_at,
        sourceSystem: row.source_system,
        itemCount: parseInt(row.item_count),
        orderType: 'main',
        isCrossOrder: hasSpareOrder
      });
    });

    // 보조 주문 처리
    spareOrders.forEach(row => {
      activeOrders.push({
        checkId: row.order_id,
        tableNumber: row.table_number,
        customerName: row.customer_name,
        isGuest: !row.user_id,
        totalAmount: row.total_amount || 0,
        status: row.status,
        openedAt: row.opened_at,
        sourceSystem: row.source_system,
        itemCount: parseInt(row.item_count),
        orderType: 'spare',
        isCrossOrder: true
      });
    });

    // 정렬
    activeOrders.sort((a, b) => {
      if (a.tableNumber !== b.tableNumber) {
        return a.tableNumber - b.tableNumber;
      }
      return new Date(a.openedAt) - new Date(b.openedAt);
    });

    return activeOrders;
  }

  /**
   * 공유 주문 조회 (POI=SPOI)
   */
  async getSharedOrder(storeId, tableId) {
    const table = await tableRepository.getTableById(storeId, tableId);
    if (!table) {
      throw new Error('테이블을 찾을 수 없습니다');
    }

    const { processing_order_id, spare_processing_order_id } = table;
    const isTLLMixed = (
      processing_order_id !== null &&
      spare_processing_order_id !== null &&
      parseInt(processing_order_id) === parseInt(spare_processing_order_id)
    );

    if (!isTLLMixed) {
      return {
        isSharedOrder: false,
        message: 'POI와 SPOI가 다르거나 비어있음'
      };
    }

    const tickets = await orderRepository.getOrderTicketsBySource(processing_order_id);

    if (tickets.length === 0) {
      return {
        isSharedOrder: true,
        sharedOrderId: processing_order_id,
        sourceGroups: {}
      };
    }

    // source별로 그룹핑
    const sourceGroups = {};
    let totalAmount = 0;

    for (const row of tickets) {
      const source = row.source;

      if (!sourceGroups[source]) {
        sourceGroups[source] = {
          source: source,
          items: [],
          totalAmount: 0,
          itemCount: 0
        };
      }

      const item = {
        id: row.item_id,
        ticketId: row.ticket_id,
        menuName: row.menu_name,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        totalPrice: row.total_price,
        itemStatus: row.item_status,
        cookStation: row.cook_station,
        paidStatus: row.paid_status,
        ticketCreatedAt: row.ticket_created_at,
        ticket_source: source
      };

      sourceGroups[source].items.push(item);
      sourceGroups[source].totalAmount += row.total_price || 0;
      sourceGroups[source].itemCount += 1;
      totalAmount += row.total_price || 0;
    }

    return {
      isSharedOrder: true,
      sharedOrderId: processing_order_id,
      sourceGroups: sourceGroups,
      totalAmount: totalAmount,
      totalItemCount: tickets.length
    };
  }

  /**
   * TLL 연동 교차주문 아이템 조회
   */
  async getMixedOrderItems(storeId, tableNumber) {
    const tableStatus = await tableRepository.getTableByNumber(storeId, tableNumber);
    if (!tableStatus) {
      throw new Error('테이블을 찾을 수 없습니다');
    }

    const isTLLMixed = (
      tableStatus.processing_order_id !== null &&
      tableStatus.spare_processing_order_id !== null &&
      parseInt(tableStatus.processing_order_id) === parseInt(tableStatus.spare_processing_order_id)
    );

    if (!isTLLMixed) {
      throw new Error('TLL 연동 교차주문이 아닙니다');
    }

    const orderId = tableStatus.processing_order_id;
    const orderItems = await orderRepository.getMixedOrderItems(orderId, tableNumber);
    const totalAmount = orderItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);

    // source별 통계
    const tllItems = orderItems.filter(item => item.ticket_source === 'TLL');
    const posItems = orderItems.filter(item => item.ticket_source === 'POS');

    return {
      orderId: parseInt(orderId),
      orderItems: orderItems,
      totalAmount: totalAmount,
      statistics: {
        tllItemCount: tllItems.length,
        posItemCount: posItems.length,
        totalItemCount: orderItems.length,
        tllAmount: tllItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0),
        posAmount: posItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0)
      }
    };
  }

  /**
   * 현재 테이블의 활성 주문 조회
   */
  async getActiveOrder(storeId, tableNumber) {
    const activeOrder = await orderRepository.getActiveOrderByTable(storeId, tableNumber);

    if (!activeOrder) {
      return {
        hasActiveOrder: false,
        message: '활성 주문이 없습니다'
      };
    }

    return {
      hasActiveOrder: true,
      orderId: activeOrder.order_id,
      totalAmount: activeOrder.total_price || 0,
      itemCount: parseInt(activeOrder.item_count) || 0,
      storeId: storeId,
      tableNumber: tableNumber
    };
  }

  /**
   * 세션 상태 확인
   */
  async getSessionStatus(storeId, tableNumber) {
    const sessions = await orderRepository.getActiveSessions(storeId, tableNumber);
    const hasActiveSession = sessions.length > 0;

    const sessionInfo = hasActiveSession ? {
      orderId: sessions[0].id,
      status: sessions[0].status,
      startTime: sessions[0].created_at,
      customerName: sessions[0].customer_name,
      sourceSystem: sessions[0].source,
      itemCount: parseInt(sessions[0].item_count)
    } : null;

    return {
      hasActiveSession,
      sessionInfo
    };
  }

  // ============ 프라이빗 메서드들 ============

  /**
   * 새 POS 주문 생성
   */
  async createNewPOSOrder(client, storeId, tableNumber) {
    const orderId = await orderRepository.createOrder(client, {
      storeId,
      tableNumber,
      source: 'POS',
      totalPrice: 0
    });

    // store_tables 업데이트
    await this.updateStoreTable(client, storeId, tableNumber, orderId);

    return orderId;
  }

  /**
   * 추가 아이템 처리
   */
  async processAddItems(client, orderId, storeId, tableNumber, add) {
    const newBatchNo = await orderRepository.getNextBatchNo(client, orderId);
    const newTicketId = await orderRepository.createTicket(client, {
      orderId,
      storeId,
      tableNumber,
      batchNo: newBatchNo,
      source: 'POS'
    });

    for (const [menuName, quantity] of Object.entries(add)) {
      const menu = await orderRepository.getMenuByName(client, storeId, menuName);
      if (menu) {
        await orderRepository.createOrderItem(client, {
          orderId,
          ticketId: newTicketId,
          menuId: menu.id,
          menuName,
          unitPrice: menu.price,
          quantity,
          cookStation: menu.cook_station || 'KITCHEN',
          storeId
        });
      }
    }
  }

  /**
   * 제거 아이템 처리
   */
  async processRemoveItems(client, orderId, menuName, removeQty) {
    const tickets = await orderRepository.getTicketsForRemoval(client, orderId, menuName);
    let remaining = removeQty;

    for (const ticket of tickets) {
      if (remaining <= 0) break;

      const reduceQty = Math.min(remaining, ticket.quantity);
      const newQty = ticket.quantity - reduceQty;

      if (newQty > 0) {
        await orderRepository.updateOrderItemQuantity(client, ticket.item_id, newQty, newQty * ticket.unit_price);
      } else {
        await orderRepository.cancelOrderItem(client, ticket.item_id);
      }

      remaining -= reduceQty;
    }
  }

  /**
   * 주문 취소 처리
   */
  async handleOrderCancellation(client, orderId, storeId, tableNumber) {
    await orderRepository.cancelAllTickets(client, orderId);
    await orderRepository.cancelOrder(client, orderId);

    const hasOtherOrders = await orderRepository.hasOtherActiveOrders(client, storeId, tableNumber, orderId);

    if (hasOtherOrders) {
      await this.updateTableAfterCancellation(client, storeId, tableNumber, orderId);
    } else {
      await tableRepository.clearTable(client, storeId, tableNumber);
    }
  }

  /**
   * 테이블 상태 업데이트 (주문 취소 후)
   */
  async updateTableAfterCancellation(client, storeId, tableNumber, cancelledOrderId) {
    const currentTable = await tableRepository.getTableByNumber(storeId, tableNumber);

    if (currentTable) {
      const processingOrderId = parseInt(currentTable.processing_order_id);
      const spareOrderId = parseInt(currentTable.spare_processing_order_id);
      const currentOrderId = parseInt(cancelledOrderId);

      if (spareOrderId === currentOrderId) {
        await tableRepository.clearSpareOrder(client, storeId, tableNumber);
      } else if (processingOrderId === currentOrderId) {
        if (currentTable.spare_processing_order_id !== null) {
          await tableRepository.moveSpareToMain(client, storeId, tableNumber);
        } else {
          await tableRepository.clearTable(client, storeId, tableNumber);
        }
      }
    }
  }

  /**
   * store_tables 업데이트
   */
  async updateStoreTable(client, storeId, tableNumber, orderId) {
    const currentTable = await tableRepository.getTableByNumber(storeId, tableNumber);

    if (currentTable) {
      const hasMainOrder = currentTable.processing_order_id !== null;
      const hasSpareOrder = currentTable.spare_processing_order_id !== null;

      if (!hasMainOrder) {
        await tableRepository.setMainOrder(client, storeId, tableNumber, orderId);
      } else if (!hasSpareOrder) {
        await tableRepository.setSpareOrder(client, storeId, tableNumber, orderId);
      } else {
        throw new Error('해당 테이블에 이미 2개의 활성 주문이 존재합니다. 더 이상 주문을 받을 수 없습니다.');
      }
    } else {
      throw new Error('테이블을 찾을 수 없습니다');
    }
  }

  /**
   * KDS 이벤트 발생
   */
  emitKDSEvent(orderId, storeId, tableNumber, modifications) {
    try {
      const kdsEventData = {
        orderId: orderId,
        ticketId: null,
        storeId: parseInt(storeId),
        tableNumber: parseInt(tableNumber),
        batchNo: null,
        items: [],
        modifications: {
          type: 'batch_update',
          added: Object.keys(modifications.add).length,
          removed: Object.keys(modifications.remove).length,
          details: modifications
        }
      };

      eventBus.emit('order.modified', kdsEventData);
    } catch (error) {
      console.warn('⚠️ KDS 이벤트 발생 실패:', error.message);
    }
  }

  /**
   * 기본 메뉴 데이터
   */
  getDefaultMenu() {
    return [
      { id: 1, name: '김치찌개', price: 8000, description: '돼지고기와 김치가 들어간 찌개', category: '찌개류' },
      { id: 2, name: '된장찌개', price: 7000, description: '국산 콩으로 만든 된장찌개', category: '찌개류' },
      { id: 3, name: '불고기', price: 15000, description: '양념에 재운 소고기 불고기', category: '구이류' },
      { id: 4, name: '비빔밥', price: 9000, description: '각종 나물이 들어간 비빔밥', category: '밥류' },
      { id: 5, name: '냉면', price: 10000, description: '시원한 물냉면', category: '면류' },
      { id: 6, name: '공기밥', price: 1000, description: '갓 지은 따뜻한 쌀밥', category: '기타' },
      { id: 7, name: '콜라', price: 2000, description: '시원한 콜라', category: '음료' },
      { id: 8, name: '사이다', price: 2000, description: '시원한 사이다', category: '음료' }
    ];
  }
}

module.exports = new OrderService();