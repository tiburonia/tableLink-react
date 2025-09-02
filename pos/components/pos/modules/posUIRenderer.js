
/**
 * 완전히 새로운 POS UI 렌더링 시스템
 * - 현대적이고 직관적인 UI
 * - 실시간 상태 반영
 * - 시각적 피드백 시스템
 */

class POSUIRenderer {
  constructor() {
    this.init();
  }

  init() {
    console.log('🎨 새로운 POS UI 렌더러 초기화');
  }

  // ===========================================
  // 주문 목록 렌더링
  // ===========================================

  updateOrderDisplay() {
    this.renderTempOrders();
    this.renderConfirmedOrders();
  }

  renderTempOrders() {
    const container = document.getElementById('tempOrders');
    if (!container) return;

    const tempOrders = window.posOrderManager?.getTempOrders() || [];
    
    if (tempOrders.length === 0) {
      container.innerHTML = `
        <div class="empty-orders">
          <div class="empty-icon">🛒</div>
          <div class="empty-text">임시 주문이 없습니다</div>
          <div class="empty-subtitle">메뉴를 선택해주세요</div>
        </div>
      `;
      return;
    }

    const html = tempOrders.map(item => this.renderOrderItem(item, true)).join('');
    container.innerHTML = html;
  }

  async renderConfirmedOrders() {
    const container = document.getElementById('confirmedOrders');
    if (!container) return;

    try {
      const storeId = new URLSearchParams(window.location.search).get('storeId');
      const tableId = new URLSearchParams(window.location.search).get('tableId') || '1';
      
      const response = await fetch(`/api/pos/orders/confirmed?storeId=${storeId}&tableId=${tableId}`);
      
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        
        if (orders.length === 0) {
          container.innerHTML = `
            <div class="empty-orders">
              <div class="empty-icon">📋</div>
              <div class="empty-text">확정된 주문이 없습니다</div>
            </div>
          `;
          return;
        }

        const html = orders.map(item => this.renderOrderItem(item, false)).join('');
        container.innerHTML = html;
      }
    } catch (error) {
      console.error('❌ 확정된 주문 렌더링 실패:', error);
    }
  }

  renderOrderItem(item, isTemp) {
    const selectedItem = window.posOrderManager?.getSelectedItem();
    const isSelected = selectedItem?.id === item.id;
    const isEdit = item.isEdit;
    
    return `
      <div class="order-item ${isTemp ? 'temp' : 'confirmed'} ${isSelected ? 'selected' : ''} ${isEdit ? 'edit' : ''}"
           onclick="selectOrderItem('${item.id}', ${!isTemp})"
           data-item-id="${item.id}">
        
        <div class="item-content">
          <div class="item-info">
            <div class="item-name">
              ${item.name}
              ${isEdit ? '<span class="edit-badge">수정</span>' : ''}
            </div>
            <div class="item-details">
              <span class="item-price">₩${item.price?.toLocaleString() || 0}</span>
              <span class="item-multiply">×</span>
              <span class="item-quantity">${item.quantity}</span>
            </div>
          </div>
          
          <div class="item-total">
            ₩${((item.price || 0) * item.quantity).toLocaleString()}
          </div>
        </div>

        <div class="item-status">
          ${isTemp ? '<span class="status-temp">임시</span>' : '<span class="status-confirmed">확정</span>'}
        </div>

        ${isSelected ? '<div class="selection-indicator"></div>' : ''}
      </div>
    `;
  }

  // ===========================================
  // 주문 컨트롤 렌더링
  // ===========================================

  updateOrderControls() {
    const container = document.getElementById('orderControlsPanel');
    if (!container) return;

    const selectedItem = window.posOrderManager?.getSelectedItem();
    
    if (!selectedItem) {
      container.innerHTML = `
        <div class="no-selection">
          <div class="no-selection-icon">👆</div>
          <div class="no-selection-text">수정할 아이템을 선택하세요</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="order-controls-active">
        <div class="controls-header">
          <h3>선택된 아이템 수정</h3>
          <button class="close-controls" onclick="window.posOrderManager.clearSelection()">×</button>
        </div>
        
        <div class="controls-body">
          <div class="quantity-controls">
            <button class="control-btn minus" onclick="changeSelectedQuantity(-1)">
              <span class="control-icon">➖</span>
              <span class="control-text">수량 감소</span>
            </button>
            
            <button class="control-btn plus" onclick="changeSelectedQuantity(1)">
              <span class="control-icon">➕</span>
              <span class="control-text">수량 증가</span>
            </button>
          </div>
          
          <div class="action-controls">
            <button class="control-btn delete" onclick="deleteSelectedItem()">
              <span class="control-icon">🗑️</span>
              <span class="control-text">삭제</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ===========================================
  // 액션 버튼 업데이트
  // ===========================================

  updateActionButton() {
    const button = document.getElementById('primaryActionBtn');
    if (!button) return;

    const tempOrdersCount = window.posOrderManager?.getTempOrdersCount() || 0;
    const totalAmount = window.posOrderManager?.getTotalAmount() || 0;

    if (tempOrdersCount === 0) {
      button.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">주문 없음</span>
          <span class="btn-subtitle">메뉴를 선택하세요</span>
        </div>
      `;
      button.className = 'primary-action-btn disabled';
      button.onclick = null;
    } else {
      button.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">주문 확정 (${tempOrdersCount}개)</span>
          <span class="btn-subtitle">₩${totalAmount.toLocaleString()}</span>
        </div>
      `;
      button.className = 'primary-action-btn active';
      button.onclick = () => window.confirmOrders();
    }

    // 전체 취소 버튼 업데이트
    this.updateClearButton(tempOrdersCount);
  }

  updateClearButton(tempOrdersCount) {
    let clearButton = document.getElementById('clearAllBtn');
    
    if (tempOrdersCount === 0) {
      if (clearButton) {
        clearButton.remove();
      }
      return;
    }

    if (!clearButton) {
      clearButton = document.createElement('button');
      clearButton.id = 'clearAllBtn';
      clearButton.className = 'secondary-action-btn';
      
      const actionContainer = document.querySelector('.action-buttons');
      if (actionContainer) {
        actionContainer.appendChild(clearButton);
      }
    }

    clearButton.innerHTML = `
      <div class="btn-content">
        <span class="btn-title">전체 취소</span>
        <span class="btn-subtitle">${tempOrdersCount}개 주문</span>
      </div>
    `;
    clearButton.onclick = () => window.clearAllOrders();
  }

  // ===========================================
  // 스타일 주입
  // ===========================================

  injectStyles() {
    if (document.getElementById('posUIStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'posUIStyles';
    styles.textContent = `
      /* 주문 아이템 스타일 */
      .order-item {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .order-item:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      }

      .order-item.selected {
        border-color: #10b981;
        background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
      }

      .order-item.temp {
        border-left: 4px solid #f59e0b;
      }

      .order-item.confirmed {
        border-left: 4px solid #10b981;
      }

      .order-item.edit {
        border-left: 4px solid #ef4444;
      }

      .item-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .item-info {
        flex: 1;
      }

      .item-name {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .edit-badge {
        background: #ef4444;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
      }

      .item-details {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #6b7280;
      }

      .item-quantity {
        background: #f3f4f6;
        padding: 2px 8px;
        border-radius: 6px;
        font-weight: 600;
        color: #374151;
      }

      .item-total {
        font-size: 18px;
        font-weight: 700;
        color: #10b981;
      }

      .item-status {
        position: absolute;
        top: 8px;
        right: 8px;
      }

      .status-temp, .status-confirmed {
        font-size: 10px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 6px;
        text-transform: uppercase;
      }

      .status-temp {
        background: #fef3c7;
        color: #92400e;
      }

      .status-confirmed {
        background: #d1fae5;
        color: #065f46;
      }

      .selection-indicator {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(135deg, #10b981, #059669);
        animation: pulse 2s infinite;
      }

      /* 빈 상태 스타일 */
      .empty-orders {
        text-align: center;
        padding: 40px 20px;
        color: #6b7280;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .empty-text {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .empty-subtitle {
        font-size: 14px;
        opacity: 0.7;
      }

      /* 주문 컨트롤 스타일 */
      .order-controls-active {
        background: white;
        border: 2px solid #10b981;
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
      }

      .controls-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;
      }

      .controls-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #10b981;
      }

      .close-controls {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #6b7280;
        padding: 4px;
      }

      .controls-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .quantity-controls, .action-controls {
        display: flex;
        gap: 8px;
      }

      .control-btn {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
        font-weight: 500;
      }

      .control-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .control-btn.plus {
        border-color: #10b981;
        color: #065f46;
      }

      .control-btn.plus:hover {
        background: #ecfdf5;
      }

      .control-btn.minus {
        border-color: #f59e0b;
        color: #92400e;
      }

      .control-btn.minus:hover {
        background: #fffbeb;
      }

      .control-btn.delete {
        border-color: #ef4444;
        color: #dc2626;
      }

      .control-btn.delete:hover {
        background: #fef2f2;
      }

      .control-icon {
        font-size: 16px;
      }

      .no-selection {
        text-align: center;
        padding: 24px;
        color: #6b7280;
        background: #f9fafb;
        border-radius: 8px;
        margin: 16px 0;
      }

      .no-selection-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .no-selection-text {
        font-size: 14px;
        font-weight: 500;
      }

      /* 액션 버튼 스타일 */
      .primary-action-btn {
        width: 100%;
        padding: 16px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        margin-bottom: 8px;
      }

      .primary-action-btn.active {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      .primary-action-btn.active:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
      }

      .primary-action-btn.disabled {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
      }

      .secondary-action-btn {
        width: 100%;
        padding: 12px;
        border: 2px solid #ef4444;
        border-radius: 8px;
        background: white;
        color: #dc2626;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .secondary-action-btn:hover {
        background: #fef2f2;
        transform: translateY(-1px);
      }

      .btn-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .btn-title {
        font-size: inherit;
        font-weight: inherit;
      }

      .btn-subtitle {
        font-size: 12px;
        opacity: 0.8;
      }

      /* 애니메이션 */
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* 반응형 */
      @media (max-width: 768px) {
        .controls-body {
          flex-direction: column;
        }
        
        .quantity-controls, .action-controls {
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(styles);
  }
}

// 전역 인스턴스 생성 및 스타일 주입
window.posUIRenderer = new POSUIRenderer();
window.posUIRenderer.injectStyles();

console.log('✅ 새로운 POS UI 렌더러 로드 완료');
