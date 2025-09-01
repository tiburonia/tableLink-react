// POS UI 렌더링 모듈
import { POSStateManager } from './posStateManager.js';

export class POSUIRenderer {
  // 주문 목록 렌더링 (임시/확정 구분)
  static renderOrderItems() {
    const orderItemsContainer = document.getElementById('orderItems');
    if (!orderItemsContainer) return;

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

    orderItemsContainer.innerHTML = html;
    console.log(`🎨 주문 목록 렌더링 완료 - 임시: ${pendingItems.length}개, 확정: ${confirmedItems.length}개`);
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
  }cludes(item.id);
        const totalPrice = (item.price - (item.discount || 0)) * item.quantity;

        html += `
          <div class="order-item pending-item ${isSelected ? 'selected' : ''}" 
               onclick="toggleItemSelection('${item.id}')">
            <div class="item-info">
              <div class="item-name">${item.name}</div>
              <div class="item-details">
                ₩${item.price.toLocaleString()} × ${item.quantity}
                ${item.discount > 0 ? ` (할인: -₩${item.discount.toLocaleString()})` : ''}
              </div>
              ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
            </div>
            <div class="item-total pending-total">₩${totalPrice.toLocaleString()}</div>
            <div class="item-status pending-status">임시</div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    // ✅ 확정 주문 섹션
    if (confirmedItems.length > 0) {
      html += `
        <div class="order-section confirmed-section">
          <div class="section-header confirmed-header">
            <h4>✅ 확정 주문 (세션 진행중)</h4>
            <span class="session-badge">세션 ${POSStateManager.getCurrentSession().checkId || 'N/A'}</span>
          </div>
          <div class="order-items confirmed-items">
      `;

      confirmedItems.forEach(item => {
        const isSelected = selectedItems.includes(item.id);
        const totalPrice = (item.price - (item.discount || 0)) * item.quantity;
        const statusText = this.getStatusDisplayText(item.status || item.cookingStatus);

        html += `
          <div class="order-item confirmed-item ${isSelected ? 'selected' : ''}" 
               onclick="toggleItemSelection('${item.id}')">
            <div class="item-info">
              <div class="item-name">${item.name}</div>
              <div class="item-details">
                ₩${item.price.toLocaleString()} × ${item.quantity}
                ${item.discount > 0 ? ` (할인: -₩${item.discount.toLocaleString()})` : ''}
              </div>
              ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
            </div>
            <div class="item-total confirmed-total">₩${totalPrice.toLocaleString()}</div>
            <div class="item-status status-${item.status || 'ordered'}">${statusText}</div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    orderItemsContainer.innerHTML = html;
  }

  // 상태 표시 텍스트 변환
  static getStatusDisplayText(status) {
    const statusMap = {
      'pending': '임시',
      'ordered': '주문완료',
      'preparing': '조리중',
      'ready': '준비완료', 
      'served': '서빙완료',
      'canceled': '취소됨',
      'ORDERED': '주문완료',
      'PREPARING': '조리중',
      'READY': '준비완료',
      'SERVED': '서빙완료',
      'CANCELED': '취소됨'
    };

    return statusMap[status] || status;
  }

  // 결제 요약 렌더링
  static renderPaymentSummary() {
    const currentOrder = POSStateManager.getCurrentOrder();

    const totalAmount = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = currentOrder.reduce((sum, item) => sum + item.discount, 0);
    const finalAmount = totalAmount - totalDiscount;

    const totalAmountElement = document.getElementById('totalAmount');
    const discountAmountElement = document.getElementById('discountAmount');
    const finalAmountElement = document.getElementById('finalAmount');

    if (totalAmountElement) totalAmountElement.textContent = `₩${totalAmount.toLocaleString()}`;
    if (discountAmountElement) discountAmountElement.textContent = `₩${totalDiscount.toLocaleString()}`;
    if (finalAmountElement) finalAmountElement.textContent = `₩${finalAmount.toLocaleString()}`;
  }

  // Primary Action 버튼 업데이트
  static updatePrimaryActionButton() {
    const primaryBtn = document.querySelector('.primary-action-btn');
    if (!primaryBtn) return;

    const btnTitle = primaryBtn.querySelector('.btn-title');
    const btnSubtitle = primaryBtn.querySelector('.btn-subtitle');

    const currentOrder = POSStateManager.getCurrentOrder();
    const pendingItems = currentOrder ? currentOrder.filter(item => item.isPending && !item.isConfirmed) : [];
    const confirmedItems = currentOrder ? currentOrder.filter(item => item.isConfirmed) : [];
    const modifiedItems = pendingItems.filter(item => item.isModified || item.isDeleted);
    const newItems = pendingItems.filter(item => !item.isModified && !item.isDeleted);
    const hasPendingItems = pendingItems.length > 0;
    const hasAnyItems = pendingItems.length > 0 || confirmedItems.length > 0;

    // 결제 버튼들 활성화/비활성화 처리
    this.updatePaymentButtons(hasAnyItems);

    if (hasPendingItems) {
      primaryBtn.disabled = false;

      let subtitleText = '';
      if (newItems.length > 0 && modifiedItems.length > 0) {
        subtitleText = `신규 ${newItems.length}개, 수정 ${modifiedItems.length}개`;
      } else if (newItems.length > 0) {
        subtitleText = `${newItems.length}개 신규 추가`;
      } else if (modifiedItems.length > 0) {
        subtitleText = `${modifiedItems.length}개 수정사항`;
      }

      if (btnTitle) btnTitle.textContent = '세션에 확정';
      if (btnSubtitle) btnSubtitle.textContent = subtitleText;
      primaryBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
      primaryBtn.style.color = 'white';
      primaryBtn.style.cursor = 'pointer';
      primaryBtn.onclick = () => window.handlePrimaryAction();
    } else if (confirmedItems.length > 0) {
      primaryBtn.disabled = false;
      if (btnTitle) btnTitle.textContent = '추가 주문';
      if (btnSubtitle) btnSubtitle.textContent = `${confirmedItems.length}개 세션 진행중`;
      primaryBtn.style.background = '#10b981';
      primaryBtn.style.color = 'white';
      primaryBtn.style.cursor = 'pointer';
      primaryBtn.onclick = () => window.showPOSNotification('새 메뉴를 추가하고 확정하세요', 'info');
    } else {
      primaryBtn.disabled = true;
      if (btnTitle) btnTitle.textContent = '주문 없음';
      if (btnSubtitle) btnSubtitle.textContent = '메뉴를 선택하세요';
      primaryBtn.style.background = '#e2e8f0';
      primaryBtn.style.color = '#64748b';
      primaryBtn.style.cursor = 'not-allowed';
      primaryBtn.onclick = null;
    }
  }

  // 결제 버튼들 활성화/비활성화 처리
  static updatePaymentButtons(hasItems) {
    const paymentButtons = document.querySelectorAll('.payment-btn');
    const paymentIndicator = document.getElementById('paymentIndicator');

    paymentButtons.forEach(btn => {
      btn.disabled = !hasItems;
    });

    if (paymentIndicator) {
      if (hasItems) {
        paymentIndicator.textContent = '결제 가능';
        paymentIndicator.style.background = '#10b981';
        paymentIndicator.style.color = 'white';
      } else {
        paymentIndicator.textContent = '대기중';
        paymentIndicator.style.background = '#f3f4f6';
        paymentIndicator.style.color = '#6b7280';
      }
    }
  }

  // 테이블 정보 업데이트
  static updateTableInfo() {
    const currentTable = POSStateManager.getCurrentTable();
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