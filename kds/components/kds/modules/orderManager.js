
// KDS 주문 데이터 관리 모듈
class KDSOrderManager {
  constructor() {
    this.orders = new Map();
    this.filters = {
      status: 'all',
      timeRange: 'all'
    };
  }

  // 주문 추가/업데이트
  updateOrder(orderData) {
    const orderId = orderData.orderId || orderData.id;
    this.orders.set(orderId, {
      ...orderData,
      updatedAt: new Date()
    });
    this.notifyChange();
  }

  // 주문 상태 변경
  changeOrderStatus(orderId, newStatus) {
    const order = this.orders.get(orderId);
    if (order) {
      order.cookingStatus = newStatus;
      order.updatedAt = new Date();
      this.notifyChange();
    }
  }

  // 필터링된 주문 목록 반환
  getFilteredOrders() {
    let filteredOrders = Array.from(this.orders.values());
    
    // 상태 필터
    if (this.filters.status !== 'all') {
      filteredOrders = filteredOrders.filter(order => 
        order.cookingStatus === this.filters.status
      );
    }

    // 시간 필터
    if (this.filters.timeRange !== 'all') {
      const cutoff = this.getTimeCutoff(this.filters.timeRange);
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.createdAt) >= cutoff
      );
    }

    return filteredOrders.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  // 필터 설정
  setFilter(type, value) {
    this.filters[type] = value;
    this.notifyChange();
  }

  // 변경 알림
  notifyChange() {
    if (this.onOrdersChange) {
      this.onOrdersChange(this.getFilteredOrders());
    }
  }

  getTimeCutoff(range) {
    const now = new Date();
    switch (range) {
      case '1hour': return new Date(now - 60 * 60 * 1000);
      case '3hours': return new Date(now - 3 * 60 * 60 * 1000);
      case '6hours': return new Date(now - 6 * 60 * 60 * 1000);
      default: return new Date(0);
    }
  }
}

window.KDSOrderManager = KDSOrderManager;
