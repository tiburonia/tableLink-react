
// KDS UI 렌더링 모듈
class KDSUI {
  constructor(orderManager) {
    this.orderManager = orderManager;
    this.isDevMode = window.location.search.includes('dev=true');
  }

  // 주문 카드 렌더링
  renderOrderCard(order) {
    const statusClass = this.getStatusClass(order.cookingStatus);
    const timeAgo = this.getTimeAgo(order.createdAt);
    
    return `
      <div class="order-card ${statusClass}" data-order-id="${order.orderId}">
        <div class="order-header">
          <div class="order-info">
            <span class="order-number">#${order.orderId}</span>
            <span class="table-info">테이블 ${order.tableNumber}</span>
            <span class="time-stamp">${timeAgo}</span>
          </div>
          <div class="order-status">
            ${this.renderStatusBadge(order.cookingStatus)}
          </div>
        </div>
        
        <div class="customer-info">
          <span class="customer-name">${order.customerName || '손님'}</span>
          <span class="order-source">${order.source === 'TLL' ? '📱 앱주문' : '🔴 POS주문'}</span>
        </div>

        <div class="order-items">
          ${this.renderOrderItems(order)}
        </div>

        <div class="order-actions">
          ${this.renderActionButtons(order)}
        </div>
      </div>
    `;
  }

  renderOrderItems(order) {
    let items = [];
    
    if (order.items && Array.isArray(order.items)) {
      items = order.items;
    } else if (order.orderData) {
      try {
        const orderData = typeof order.orderData === 'string' 
          ? JSON.parse(order.orderData) 
          : order.orderData;
        items = orderData.items || [];
      } catch (e) {
        console.error('주문 데이터 파싱 실패:', e);
      }
    }

    return items.map(item => `
      <div class="order-item">
        <span class="item-name">${item.name}</span>
        <span class="item-quantity">x${item.quantity || item.qty || 1}</span>
        ${this.isDevMode ? this.renderItemActions(item) : ''}
      </div>
    `).join('');
  }

  renderStatusBadge(status) {
    const statusConfig = {
      'PENDING': { text: '대기중', class: 'status-pending' },
      'COOKING': { text: '조리중', class: 'status-cooking' },
      'READY': { text: '완료', class: 'status-ready' },
      'COMPLETED': { text: '서빙완료', class: 'status-completed' }
    };

    const config = statusConfig[status] || statusConfig['PENDING'];
    return `<span class="status-badge ${config.class}">${config.text}</span>`;
  }

  renderActionButtons(order) {
    const status = order.cookingStatus;
    
    if (status === 'COMPLETED') {
      return '<div class="no-actions">서빙 완료</div>';
    }

    return `
      <div class="action-buttons">
        ${status === 'PENDING' ? `
          <button class="action-btn start-btn" onclick="changeOrderStatus('${order.orderId}', 'COOKING')">
            🔥 조리 시작
          </button>
        ` : ''}
        
        ${status === 'COOKING' ? `
          <button class="action-btn complete-btn" onclick="changeOrderStatus('${order.orderId}', 'READY')">
            ✅ 조리 완료
          </button>
        ` : ''}
        
        ${status === 'READY' ? `
          <button class="action-btn serve-btn" onclick="changeOrderStatus('${order.orderId}', 'COMPLETED')">
            🍽️ 서빙 완료
          </button>
        ` : ''}
      </div>
    `;
  }

  getStatusClass(status) {
    return {
      'PENDING': 'order-pending',
      'COOKING': 'order-cooking', 
      'READY': 'order-ready',
      'COMPLETED': 'order-completed'
    }[status] || 'order-pending';
  }

  getTimeAgo(dateString) {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    return orderTime.toLocaleDateString();
  }

  renderItemActions(item) {
    return `
      <div class="item-actions">
        <button class="item-action-btn" onclick="markItemDone('${item.id}')">✓</button>
      </div>
    `;
  }

  // 필터 UI 렌더링
  renderFilters() {
    return `
      <div class="kds-filters">
        <div class="filter-group">
          <label>상태:</label>
          <select id="statusFilter" onchange="updateFilter('status', this.value)">
            <option value="all">전체</option>
            <option value="PENDING">대기중</option>
            <option value="COOKING">조리중</option>
            <option value="READY">완료</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>시간:</label>
          <select id="timeFilter" onchange="updateFilter('timeRange', this.value)">
            <option value="all">전체</option>
            <option value="1hour">1시간</option>
            <option value="3hours">3시간</option>
            <option value="6hours">6시간</option>
          </select>
        </div>
      </div>
    `;
  }
}

window.KDSUI = KDSUI;
