// POS UI 렌더링 모듈
import { POSStateManager } from './posStateManager.js';

export class POSUIRenderer {
  // 주문 목록 렌더링 (임시/확정 구분)
  static renderOrderItems() {
    console.log('🎨 renderOrderItems 호출됨');
    
    const orderItemsContainer = document.getElementById('orderItems');
    if (!orderItemsContainer) {
      console.error('❌ orderItems DOM 요소를 찾을 수 없습니다');
      return;
    }
    
    console.log('✅ orderItems DOM 요소 확인됨');

    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    const confirmedItems = POSStateManager.getConfirmedItems();
    const selectedItems = POSStateManager.getSelectedItems();

    if (pendingItems.length === 0 && confirmedItems.length === 0) {
      orderItemsContainer.innerHTML = '<div class="empty-order">주문된 메뉴가 없습니다</div>';
      return;
    }

    let html = '';

    // 🟡 임시 주문 섹션
    if (pendingItems.length > 0) {
      html += `
        <div class="order-section pending-section">
          <div class="section-header pending-header">
            <h4>📝 임시 주문 (미확정)</h4>
            <span class="pending-badge">확정 필요</span>
          </div>
          <div class="order-items pending-items">
      `;

      pendingItems.forEach(item => {
        const isSelected = selectedItems.includes(item.id);
        const finalPrice = item.price - (item.discount || 0);
        
        html += `
          <div class="order-item pending-item ${isSelected ? 'selected' : ''}" 
               data-item-id="${item.id}" 
               onclick="toggleItemSelection('${item.id}')">
            <div class="item-info">
              <div class="item-name">${item.name}</div>
              <div class="item-details">
                <span class="item-price">₩${item.price.toLocaleString()}</span>
                ${item.discount > 0 ? `<span class="discount">-₩${item.discount.toLocaleString()}</span>` : ''}
                <span class="final-price">₩${finalPrice.toLocaleString()}</span>
              </div>
              ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
            </div>
            <div class="item-controls">
              <div class="quantity-controls">
                <button onclick="event.stopPropagation(); changeQuantity('${item.id}', -1)" class="qty-btn minus">-</button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="event.stopPropagation(); changeQuantity('${item.id}', 1)" class="qty-btn plus">+</button>
              </div>
              <div class="item-status pending-status">임시</div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    // 🟢 확정된 주문 섹션
    if (confirmedItems.length > 0) {
      html += `
        <div class="order-section confirmed-section">
          <div class="section-header confirmed-header">
            <h4>✅ 확정된 주문</h4>
            <span class="confirmed-badge">주방 전송됨</span>
          </div>
          <div class="order-items confirmed-items">
      `;

      confirmedItems.forEach(item => {
        const isSelected = selectedItems.includes(item.id);
        const finalPrice = item.price - (item.discount || 0);
        const statusText = {
          'ordered': '주문됨',
          'cooking': '조리중',
          'ready': '완료',
          'served': '서빙됨'
        }[item.status] || item.status;

        html += `
          <div class="order-item confirmed-item ${isSelected ? 'selected' : ''}" 
               data-item-id="${item.id}" 
               onclick="toggleItemSelection('${item.id}')">
            <div class="item-info">
              <div class="item-name">${item.name}</div>
              <div class="item-details">
                <span class="item-price">₩${item.price.toLocaleString()}</span>
                ${item.discount > 0 ? `<span class="discount">-₩${item.discount.toLocaleString()}</span>` : ''}
                <span class="final-price">₩${finalPrice.toLocaleString()}</span>
              </div>
              ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
              ${item.confirmedAt ? `<div class="confirmed-time">확정: ${new Date(item.confirmedAt).toLocaleTimeString()}</div>` : ''}
            </div>
            <div class="item-controls">
              <div class="quantity-display">
                <span class="quantity">${item.quantity}개</span>
              </div>
              <div class="item-status confirmed-status">${statusText}</div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    // DOM 업데이트 강제 적용
    orderItemsContainer.innerHTML = html;
    
    // DOM 변경 강제 적용 (브라우저 렌더링 엔진 트리거)
    orderItemsContainer.offsetHeight;
    
    console.log(`🎨 새 시스템: 주문 목록 렌더링 완료 - 임시: ${pendingItems.length}개, 확정: ${confirmedItems.length}개`);
    console.log('📄 렌더링된 HTML 길이:', html.length);
    console.log('🔍 실제 DOM 내용 확인:', orderItemsContainer.children.length, '개 요소');
    
    // DOM 업데이트 검증
    if (orderItemsContainer.children.length === 0 && (pendingItems.length > 0 || confirmedItems.length > 0)) {
      console.error('❌ DOM 업데이트 실패 감지 - 재시도');
      setTimeout(() => {
        orderItemsContainer.innerHTML = html;
        orderItemsContainer.offsetHeight;
      }, 50);
    }
  }

  // 결제 요약 렌더링
  static renderPaymentSummary() {
    const paymentSummaryContainer = document.getElementById('paymentSummary');
    if (!paymentSummaryContainer) return;

    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    const confirmedItems = POSStateManager.getConfirmedItems();
    const session = POSStateManager.getCurrentSession();

    // 임시 주문 총액 계산
    const pendingTotal = pendingItems.reduce((sum, item) => {
      return sum + ((item.price - (item.discount || 0)) * item.quantity);
    }, 0);

    // 확정 주문 총액 계산
    const confirmedTotal = confirmedItems.reduce((sum, item) => {
      return sum + ((item.price - (item.discount || 0)) * item.quantity);
    }, 0);

    const grandTotal = pendingTotal + confirmedTotal;
    const paidAmount = session.paidAmount || 0;
    const remainingAmount = grandTotal - paidAmount;

    let html = `
      <div class="payment-summary">
        <div class="summary-section">
          <h4>💰 결제 요약</h4>
          
          ${pendingItems.length > 0 ? `
            <div class="summary-line pending-line">
              <span>임시 주문 (${pendingItems.length}개)</span>
              <span>₩${pendingTotal.toLocaleString()}</span>
            </div>
          ` : ''}
          
          ${confirmedItems.length > 0 ? `
            <div class="summary-line confirmed-line">
              <span>확정 주문 (${confirmedItems.length}개)</span>
              <span>₩${confirmedTotal.toLocaleString()}</span>
            </div>
          ` : ''}
          
          <div class="summary-line total-line">
            <span><strong>총 금액</strong></span>
            <span><strong>₩${grandTotal.toLocaleString()}</strong></span>
          </div>
          
          ${paidAmount > 0 ? `
            <div class="summary-line paid-line">
              <span>결제 완료</span>
              <span>-₩${paidAmount.toLocaleString()}</span>
            </div>
            <div class="summary-line remaining-line">
              <span><strong>잔액</strong></span>
              <span><strong>₩${remainingAmount.toLocaleString()}</strong></span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    paymentSummaryContainer.innerHTML = html;
    console.log(`💰 결제 요약 렌더링 완료 - 총액: ₩${grandTotal.toLocaleString()}, 잔액: ₩${remainingAmount.toLocaleString()}`);
  }

  // 기본 액션 버튼 업데이트
  static updatePrimaryActionButton() {
    const primaryActionBtn = document.getElementById('primaryActionBtn');
    if (!primaryActionBtn) return;

    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    const confirmedItems = POSStateManager.getConfirmedItems();
    const session = POSStateManager.getCurrentSession();

    let buttonText = '메뉴를 선택하세요';
    let buttonClass = 'disabled';
    let isDisabled = true;

    if (pendingItems.length > 0) {
      buttonText = `임시 주문 확정 (${pendingItems.length}개)`;
      buttonClass = 'confirm';
      isDisabled = false;
    } else if (confirmedItems.length > 0 && session.checkId) {
      if (session.status === 'closed') {
        buttonText = '결제 완료됨';
        buttonClass = 'completed';
        isDisabled = true;
      } else {
        buttonText = '결제하기';
        buttonClass = 'payment';
        isDisabled = false;
      }
    }

    primaryActionBtn.textContent = buttonText;
    primaryActionBtn.className = `primary-action-btn ${buttonClass}`;
    primaryActionBtn.disabled = isDisabled;

    console.log(`🔘 기본 액션 버튼 업데이트: ${buttonText}`);
  }

  // 테이블 정보 업데이트
  static updateTableInfo() {
    const currentTable = POSStateManager.getCurrentTable();
    const currentStore = POSStateManager.getCurrentStore();
    
    if (currentTable && currentStore) {
      const tableTitle = document.getElementById('orderTableTitle');
      if (tableTitle) {
        tableTitle.textContent = `${currentStore.name} - 테이블 ${currentTable}`;
      }
    }

    const tableInfoElement = document.getElementById('currentTableInfo');
    const tableNumberElement = document.getElementById('currentTableNumber');

    if (tableInfoElement && currentTable) {
      tableInfoElement.textContent = `테이블 ${currentTable}`;
    }

    if (tableNumberElement && currentTable) {
      tableNumberElement.textContent = currentTable;
    }
  }
}