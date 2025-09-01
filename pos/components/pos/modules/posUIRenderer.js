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