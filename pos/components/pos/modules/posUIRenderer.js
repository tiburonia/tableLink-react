
// POS UI 렌더링 모듈 - 새 시스템 전용
import { POSStateManager } from './posStateManager.js';

export class POSUIRenderer {
  
  // 🎨 주문 목록 렌더링
  static renderOrderItems() {
    console.log('🎨 새 시스템: 주문 목록 렌더링 시작');
    
    // DOM 요소 안전 확인
    let container = document.getElementById('orderItems');
    
    // 첫 번째 시도 실패 시 대체 ID 확인
    if (!container) {
      container = document.getElementById('orderItemsList');
      if (container) {
        console.log('⚠️ orderItemsList 컨테이너 사용 (orderItems 없음)');
      }
    }
    
    // 여전히 없으면 동적 생성 시도
    if (!container) {
      console.error('❌ 주문 컨테이너 없음 - 동적 생성 시도');
      const orderSummary = document.querySelector('.order-summary');
      if (orderSummary) {
        const newContainer = document.createElement('div');
        newContainer.id = 'orderItems';
        newContainer.className = 'order-items';
        
        // 기존 order-actions 앞에 삽입
        const orderActions = orderSummary.querySelector('.order-actions');
        if (orderActions) {
          orderSummary.insertBefore(newContainer, orderActions);
        } else {
          orderSummary.appendChild(newContainer);
        }
        container = newContainer;
        console.log('✅ orderItems 컨테이너 동적 생성됨');
      } else {
        console.error('❌ order-summary 섹션도 없음 - 렌더링 중단');
        return;
      }
    }

    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    const confirmedItems = POSStateManager.getConfirmedItems();
    const selectedItems = POSStateManager.getSelectedItems();

    console.log(`📊 렌더링 데이터: 임시 ${pendingItems.length}개, 확정 ${confirmedItems.length}개`);

    if (pendingItems.length === 0 && confirmedItems.length === 0) {
      container.innerHTML = '<div class="empty-order">주문된 메뉴가 없습니다</div>';
      return;
    }

    let html = '';

    // 📝 임시 주문 섹션
    if (pendingItems.length > 0) {
      html += `
        <div class="order-section pending-section">
          <div class="section-header">
            <h4>📝 임시 주문 (${pendingItems.length}개)</h4>
            <span class="status-badge pending">확정 필요</span>
          </div>
          <div class="items-list">
      `;

      pendingItems.forEach(item => {
        const isSelected = selectedItems.includes(item.id);
        const finalPrice = item.price - (item.discount || 0);
        
        html += `
          <div class="order-item pending ${isSelected ? 'selected' : ''}" 
               data-item-id="${item.id}" 
               onclick="toggleItemSelection('${item.id}')">
            <div class="item-main">
              <div class="item-name">${item.name}</div>
              <div class="item-price">
                ₩${item.price.toLocaleString()}
                ${item.discount > 0 ? `<span class="discount">-₩${item.discount.toLocaleString()}</span>` : ''}
                <span class="final-price">₩${finalPrice.toLocaleString()}</span>
              </div>
            </div>
            <div class="item-controls">
              <div class="quantity-controls">
                <button onclick="event.stopPropagation(); changeQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="event.stopPropagation(); changeQuantity('${item.id}', 1)">+</button>
              </div>
              <div class="item-status">임시</div>
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
            <h4>✅ 확정된 주문 (${confirmedItems.length}개)</h4>
            <span class="status-badge confirmed">주방 전송됨</span>
          </div>
          <div class="items-list">
      `;

      confirmedItems.forEach(item => {
        const isSelected = selectedItems.includes(item.id);
        const finalPrice = item.price - (item.discount || 0);
        
        html += `
          <div class="order-item confirmed ${isSelected ? 'selected' : ''}" 
               data-item-id="${item.id}" 
               onclick="toggleItemSelection('${item.id}')">
            <div class="item-main">
              <div class="item-name">${item.name}</div>
              <div class="item-price">₩${finalPrice.toLocaleString()}</div>
            </div>
            <div class="item-controls">
              <div class="quantity-display">${item.quantity}개</div>
              <div class="item-status">${item.status || '주문됨'}</div>
            </div>
          </div>
        `;
      });

      html += '</div></div>';
    }

    // DOM 업데이트
    container.innerHTML = html;
    container.offsetHeight; // 강제 리플로우
    
    console.log(`✅ 새 시스템: 주문 목록 렌더링 완료 (DOM 요소: ${container.children.length}개)`);
  }

  // 💰 결제 요약 렌더링
  static renderPaymentSummary() {
    const container = document.getElementById('paymentSummary');
    if (!container) return;

    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    const confirmedItems = POSStateManager.getConfirmedItems();
    const session = POSStateManager.getCurrentSession();

    const pendingTotal = pendingItems.reduce((sum, item) => 
      sum + ((item.price - (item.discount || 0)) * item.quantity), 0);
    
    const confirmedTotal = confirmedItems.reduce((sum, item) => 
      sum + ((item.price - (item.discount || 0)) * item.quantity), 0);

    const grandTotal = pendingTotal + confirmedTotal;
    const paidAmount = session.paidAmount || 0;
    const remainingAmount = grandTotal - paidAmount;

    let html = `
      <div class="payment-summary">
        <h4>💰 결제 요약</h4>
        
        ${pendingItems.length > 0 ? `
          <div class="summary-line pending">
            <span>임시 주문 (${pendingItems.length}개)</span>
            <span>₩${pendingTotal.toLocaleString()}</span>
          </div>
        ` : ''}
        
        ${confirmedItems.length > 0 ? `
          <div class="summary-line confirmed">
            <span>확정 주문 (${confirmedItems.length}개)</span>
            <span>₩${confirmedTotal.toLocaleString()}</span>
          </div>
        ` : ''}
        
        <div class="summary-line total">
          <span><strong>총 금액</strong></span>
          <span><strong>₩${grandTotal.toLocaleString()}</strong></span>
        </div>
        
        ${paidAmount > 0 ? `
          <div class="summary-line paid">
            <span>결제 완료</span>
            <span>-₩${paidAmount.toLocaleString()}</span>
          </div>
          <div class="summary-line remaining">
            <span><strong>잔액</strong></span>
            <span><strong>₩${remainingAmount.toLocaleString()}</strong></span>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;
    console.log(`💰 새 시스템: 결제 요약 렌더링 완료 - 총액: ₩${grandTotal.toLocaleString()}`);
  }

  // 🔘 기본 액션 버튼 업데이트
  static updatePrimaryActionButton() {
    const button = document.getElementById('primaryActionBtn');
    if (!button) return;

    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    const session = POSStateManager.getCurrentSession();

    let buttonText = '메뉴를 선택하세요';
    let buttonClass = 'disabled';
    let isDisabled = true;

    if (pendingItems.length > 0) {
      buttonText = `임시 주문 확정 (${pendingItems.length}개)`;
      buttonClass = 'confirm';
      isDisabled = false;
    } else if (session.checkId && session.status !== 'closed') {
      buttonText = '결제하기';
      buttonClass = 'payment';
      isDisabled = false;
    }

    button.textContent = buttonText;
    button.className = `primary-action-btn ${buttonClass}`;
    button.disabled = isDisabled;

    console.log(`🔘 새 시스템: 액션 버튼 업데이트 - ${buttonText}`);
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

      const tableInfoElement = document.getElementById('currentTableInfo');
      if (tableInfoElement) {
        tableInfoElement.textContent = `테이블 ${currentTable}`;
      }
    }
  }
}
