
// POS UI 렌더링 모듈 - 완전 재작성 (시각적 수정 상태 표시)
import { POSStateManager } from './posStateManager.js';

export class POSUIRenderer {

  // 🎨 주문 목록 렌더링
  static renderOrderItems() {
    console.log('🎨 주문 목록 렌더링 시작');

    const container = document.getElementById('orderItems');
    if (!container) {
      console.error('❌ orderItems 컨테이너 없음');
      return;
    }

    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();
    const selectedItems = POSStateManager.getSelectedItems();

    if (pendingItems.length === 0 && confirmedItems.length === 0) {
      container.innerHTML = `
        <div class="empty-order">
          <div class="empty-icon">🛒</div>
          <h4>주문이 없습니다</h4>
          <p>메뉴를 선택해서 주문을 시작하세요</p>
        </div>
      `;
      return;
    }

    let html = '';

    // 📝 임시 주문 섹션
    if (pendingItems.length > 0) {
      html += `
        <div class="order-section pending-section">
          <div class="section-header">
            <div class="section-title">
              <span class="section-icon">📝</span>
              <h4>임시 주문 (${pendingItems.length}개)</h4>
            </div>
            <span class="status-badge pending">확정 필요</span>
          </div>
          <div class="items-list">
      `;

      pendingItems.forEach(item => {
        const isSelected = selectedItems.includes(item.id);
        html += `
          <div class="order-item pending ${isSelected ? 'selected' : ''}" 
               data-item-id="${item.id}" 
               onclick="toggleItemSelection('${item.id}')">
            <div class="item-info">
              <div class="item-name">${item.name}</div>
              <div class="item-price">₩${item.price.toLocaleString()}</div>
            </div>
            <div class="item-controls">
              <div class="quantity-controls">
                <button class="qty-btn minus" onclick="event.stopPropagation(); changeQuantity('${item.id}', -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="qty-btn plus" onclick="event.stopPropagation(); changeQuantity('${item.id}', 1)">+</button>
              </div>
              <div class="item-total">₩${(item.price * item.quantity).toLocaleString()}</div>
            </div>
          </div>
        `;
      });

      html += '</div></div>';
    }

    // ✅ 확정된 주문 섹션
    if (confirmedItems.length > 0) {
      html += `
        <div class="order-section confirmed-section">
          <div class="section-header">
            <div class="section-title">
              <span class="section-icon">✅</span>
              <h4>확정된 주문 (${confirmedItems.length}개)</h4>
            </div>
            <span class="status-badge confirmed">주방 전송됨</span>
          </div>
          <div class="items-list">
      `;

      confirmedItems.forEach(item => {
        const isSelected = selectedItems.includes(item.id);
        const hasChanges = item.tempChanges?.isModified;
        const isDeleted = item.tempChanges?.isDeleted;
        const newQuantity = item.tempChanges?.newQuantity || item.quantity;

        html += `
          <div class="order-item confirmed ${isSelected ? 'selected' : ''} ${hasChanges ? 'has-changes' : ''} ${isDeleted ? 'marked-deleted' : ''}" 
               data-item-id="${item.id}" 
               onclick="toggleItemSelection('${item.id}')"
               title="클릭하여 선택 후 주문 수정 도구로 수정 가능">
            <div class="item-info">
              <div class="item-name">
                ${item.name}
                ${hasChanges ? '<span class="change-indicator">🔄</span>' : ''}
                ${isDeleted ? '<span class="delete-indicator">🗑️</span>' : ''}
              </div>
              <div class="item-price">₩${item.price.toLocaleString()}</div>
            </div>
            <div class="item-controls">
              <div class="quantity-display">
                ${isDeleted ? 
                  '<span class="deleted-text">삭제 예정</span>' :
                  hasChanges ? 
                    `<span class="original-qty">${item.quantity}</span> → <span class="new-qty">${newQuantity}</span>` :
                    `<span class="quantity">${item.quantity}개</span>`
                }
              </div>
              <div class="item-total ${hasChanges ? 'changed' : ''}">
                ${isDeleted ? 
                  '<span class="deleted-total">₩0</span>' :
                  `₩${(item.price * newQuantity).toLocaleString()}`
                }
              </div>
            </div>
            ${hasChanges ? '<div class="change-overlay">수정됨</div>' : ''}
          </div>
        `;
      });

      html += '</div></div>';
    }

    // 주문 수정 도구
    html += this.renderOrderControlTools();

    container.innerHTML = html;
    console.log('✅ 주문 목록 렌더링 완료');
  }

  // 🔧 주문 수정 도구 렌더링
  static renderOrderControlTools() {
    const selectedItems = POSStateManager.getSelectedItems();
    
    if (selectedItems.length === 0) {
      return `
        <div class="order-controls empty">
          <div class="controls-message">
            <div class="message-icon">🎯</div>
            <h4>주문 수정 도구</h4>
            <p>수정할 아이템을 선택해주세요</p>
            <div class="help-tips">
              <div class="tip">📝 <strong>임시 주문</strong>: 직접 +/- 버튼 사용</div>
              <div class="tip">✅ <strong>확정 주문</strong>: 선택 후 이 도구로 수정</div>
            </div>
          </div>
        </div>
      `;
    }

    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();
    
    let pendingCount = 0;
    let confirmedCount = 0;
    
    selectedItems.forEach(itemId => {
      if (pendingItems.find(item => item.id === itemId)) pendingCount++;
      if (confirmedItems.find(item => item.id === itemId)) confirmedCount++;
    });

    return `
      <div class="order-controls active">
        <div class="controls-header">
          <h4>🔧 주문 수정 도구 (${selectedItems.length}개 선택)</h4>
          <button class="clear-btn" onclick="clearOrderSelection()">선택 해제</button>
        </div>
        
        <div class="controls-content">
          ${pendingCount > 0 ? `
            <div class="control-group pending-group">
              <div class="group-title">📝 임시 주문 (${pendingCount}개)</div>
              <div class="control-actions">
                <button onclick="changeSelectedQuantity(-1)" class="action-btn minus">➖ 수량 감소</button>
                <button onclick="changeSelectedQuantity(1)" class="action-btn plus">➕ 수량 증가</button>
                <button onclick="deleteSelectedItems()" class="action-btn delete">🗑️ 삭제</button>
              </div>
            </div>
          ` : ''}

          ${confirmedCount > 0 ? `
            <div class="control-group confirmed-group">
              <div class="group-title">✅ 확정 주문 (${confirmedCount}개)</div>
              <div class="control-info">
                <span class="info-icon">ℹ️</span>
                <span>변경사항은 임시 저장되며, 주문확정 버튼을 눌러야 실제 적용됩니다</span>
              </div>
              <div class="control-actions">
                <button onclick="changeSelectedQuantity(-1)" class="action-btn minus">➖ 수량 감소</button>
                <button onclick="changeSelectedQuantity(1)" class="action-btn plus">➕ 수량 증가</button>
                <button onclick="deleteSelectedItems()" class="action-btn delete">🗑️ 삭제 표시</button>
              </div>
            </div>
          ` : ''}

          <div class="confirm-section">
            <button onclick="confirmSelectedChanges()" class="confirm-btn">
              ✅ 선택 항목 주문확정
              <small>
                ${pendingCount > 0 && confirmedCount > 0 ? 
                  `신규 ${pendingCount}개 + 변경 ${confirmedCount}개` :
                  pendingCount > 0 ? 
                    `신규 ${pendingCount}개` :
                    `변경 ${confirmedCount}개`
                }
              </small>
            </button>
          </div>
        </div>
      </div>

      <style>
        .order-controls {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          margin-top: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .order-controls.empty .controls-message {
          padding: 32px 20px;
          text-align: center;
          color: #6b7280;
        }

        .message-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .help-tips {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tip {
          font-size: 12px;
          padding: 8px 12px;
          background: #f3f4f6;
          border-radius: 6px;
          text-align: left;
        }

        .controls-header {
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          color: white;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .controls-header h4 {
          margin: 0;
          font-size: 16px;
        }

        .clear-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }

        .controls-content {
          padding: 20px;
        }

        .control-group {
          margin-bottom: 20px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .pending-group {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-color: #f59e0b;
        }

        .confirmed-group {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          border-color: #3b82f6;
        }

        .group-title {
          font-weight: 600;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .control-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #1e40af;
          margin-bottom: 12px;
          padding: 8px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 6px;
        }

        .control-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: white;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .action-btn.plus {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          color: #065f46;
          border-color: #10b981;
        }

        .action-btn.minus {
          background: linear-gradient(135deg, #fed7d7, #fbb6ce);
          color: #7c2d12;
          border-color: #f59e0b;
        }

        .action-btn.delete {
          background: linear-gradient(135deg, #fecaca, #fca5a5);
          color: #7f1d1d;
          border-color: #ef4444;
        }

        .confirm-section {
          border-top: 2px solid #e5e7eb;
          padding-top: 20px;
          margin-top: 20px;
        }

        .confirm-btn {
          width: 100%;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          color: white;
          padding: 16px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .confirm-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        .confirm-btn small {
          display: block;
          font-size: 12px;
          opacity: 0.9;
          margin-top: 4px;
          font-weight: normal;
        }
      </style>
    `;
  }

  // 💰 결제 요약 렌더링
  static renderPaymentSummary() {
    const container = document.getElementById('paymentSummary');
    if (!container) return;

    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    const pendingTotal = pendingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // 확정 아이템 총액 (임시 변경사항 반영)
    const confirmedTotal = confirmedItems.reduce((sum, item) => {
      if (item.tempChanges?.isDeleted) return sum;
      const quantity = item.tempChanges?.newQuantity || item.quantity;
      return sum + (item.price * quantity);
    }, 0);

    const grandTotal = pendingTotal + confirmedTotal;
    const totalItems = pendingItems.length + confirmedItems.filter(item => !item.tempChanges?.isDeleted).length;

    container.innerHTML = `
      <div class="payment-summary">
        <div class="summary-header">
          <h4>💰 결제 요약</h4>
          ${totalItems > 0 ? `<span class="item-count">${totalItems}개</span>` : ''}
        </div>

        ${totalItems === 0 ? `
          <div class="empty-summary">
            <div class="empty-icon">🛒</div>
            <p>주문이 없습니다</p>
          </div>
        ` : `
          <div class="summary-content">
            ${pendingItems.length > 0 ? `
              <div class="summary-item pending">
                <span class="label">📝 임시 주문 (${pendingItems.length}개)</span>
                <span class="amount">₩${pendingTotal.toLocaleString()}</span>
              </div>
            ` : ''}

            ${confirmedItems.length > 0 ? `
              <div class="summary-item confirmed">
                <span class="label">✅ 확정 주문 (${confirmedItems.filter(item => !item.tempChanges?.isDeleted).length}개)</span>
                <span class="amount">₩${confirmedTotal.toLocaleString()}</span>
              </div>
            ` : ''}

            <div class="summary-total">
              <span class="label">총 금액</span>
              <span class="total-amount">₩${grandTotal.toLocaleString()}</span>
            </div>
          </div>
        `}
      </div>

      <style>
        .payment-summary {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .summary-header {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .summary-header h4 {
          margin: 0;
          font-size: 16px;
        }

        .item-count {
          background: rgba(255,255,255,0.2);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .empty-summary {
          padding: 40px 20px;
          text-align: center;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .summary-content {
          padding: 20px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .summary-item:last-child {
          border-bottom: none;
        }

        .summary-item.pending .amount {
          color: #f59e0b;
        }

        .summary-item.confirmed .amount {
          color: #10b981;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-top: 2px solid #e5e7eb;
          margin-top: 12px;
        }

        .total-amount {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          font-family: 'Courier New', monospace;
        }
      </style>
    `;
  }

  // 🔘 기본 액션 버튼 업데이트
  static updatePrimaryActionButton() {
    const primaryBtn = document.getElementById('primaryActionBtn');
    if (!primaryBtn) return;

    const pendingItems = POSStateManager.getPendingItems();
    
    if (pendingItems.length > 0) {
      const totalAmount = pendingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      primaryBtn.disabled = false;
      primaryBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">주문 확정</span>
          <span class="btn-subtitle">${pendingItems.length}개 • ₩${totalAmount.toLocaleString()}</span>
        </div>
      `;
      primaryBtn.className = 'primary-action-btn confirm-order';
    } else {
      primaryBtn.disabled = true;
      primaryBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">주문 없음</span>
          <span class="btn-subtitle">메뉴를 선택하세요</span>
        </div>
      `;
      primaryBtn.className = 'primary-action-btn';
    }
  }

  // 📋 테이블 정보 업데이트
  static updateTableInfo() {
    const currentTable = POSStateManager.getCurrentTable();
    const currentStore = POSStateManager.getCurrentStore();

    if (currentTable && currentStore) {
      const titleElement = document.getElementById('orderTableTitle');
      if (titleElement) {
        titleElement.textContent = `${currentStore.name} - 테이블 ${currentTable}`;
      }
    }
  }
}

// 전역 함수들
window.toggleItemSelection = (itemId) => {
  const POSOrderManager = window.POSOrderManager || (window.pos && window.pos.POSOrderManager);
  if (POSOrderManager) {
    POSOrderManager.toggleItemSelection(itemId);
  }
};

window.changeQuantity = (itemId, change) => {
  const POSOrderManager = window.POSOrderManager || (window.pos && window.pos.POSOrderManager);
  if (POSOrderManager) {
    POSOrderManager.changeQuantity(itemId, change);
  }
};

window.changeSelectedQuantity = (change) => {
  const POSOrderManager = window.POSOrderManager || (window.pos && window.pos.POSOrderManager);
  if (POSOrderManager) {
    POSOrderManager.changeSelectedQuantity(change);
  }
};

window.deleteSelectedItems = () => {
  const POSOrderManager = window.POSOrderManager || (window.pos && window.pos.POSOrderManager);
  if (POSOrderManager) {
    POSOrderManager.deleteSelectedItems();
  }
};

window.confirmSelectedChanges = () => {
  const POSOrderManager = window.POSOrderManager || (window.pos && window.pos.POSOrderManager);
  if (POSOrderManager) {
    POSOrderManager.confirmSelectedChanges();
  }
};

window.clearOrderSelection = () => {
  const POSStateManager = window.POSStateManager || (window.pos && window.pos.POSStateManager);
  if (POSStateManager) {
    POSStateManager.setSelectedItems([]);
    POSUIRenderer.renderOrderItems();
  }
};
