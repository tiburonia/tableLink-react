
// POS UI 렌더링 모듈
import { POSStateManager } from './posStateManager.js';

export class POSUIRenderer {
  // 주문 아이템 렌더링
  static renderOrderItems() {
    const orderItemsList = document.getElementById('orderItemsList');
    if (!orderItemsList) return;

    const currentOrder = POSStateManager.getCurrentOrder();
    const selectedItems = POSStateManager.getSelectedItems();

    if (!currentOrder || currentOrder.length === 0) {
      orderItemsList.innerHTML = `
        <div class="empty-order">
          <div class="empty-icon">📝</div>
          <p>메뉴를 선택해주세요</p>
        </div>
      `;
      return;
    }

    const confirmedItems = currentOrder.filter(item => item.isConfirmed);
    const pendingItems = currentOrder.filter(item => item.isPending && !item.isConfirmed);

    const itemsHTML = currentOrder.map((item) => {
      const price = parseInt(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const discount = parseInt(item.discount) || 0;
      const total = (price * quantity) - discount;
      const isSelected = selectedItems.includes(item.id);

      let statusClass = '';
      let statusBadge = '';

      if (item.isDeleted) {
        statusClass = 'deleted';
        statusBadge = 'DELETE';
      } else if (item.isModified) {
        statusClass = 'modified';
        statusBadge = 'MODIFY';
      } else if (item.isPending) {
        statusClass = 'pending';
        statusBadge = 'TEMP';
      } else if (item.isConfirmed) {
        statusClass = 'confirmed';
        statusBadge = item.sessionId ? 'SESSION' : 'DB';
      } else {
        statusBadge = 'POS';
      }

      const itemStyle = item.isDeleted ? 'opacity: 0.5; text-decoration: line-through;' : '';

      return `
        <div class="order-item-row ${isSelected ? 'selected' : ''} ${statusClass}" 
             onclick="toggleItemSelection('${item.id}')" 
             style="${itemStyle}">
          <div class="item-type">
            <span class="order-type-badge type-${statusBadge.toLowerCase()}">${statusBadge}</span>
          </div>
          <div class="item-name">${item.name || '메뉴명 없음'}</div>
          <div class="item-price">₩${price.toLocaleString()}</div>
          <div class="item-qty">${quantity}개</div>
          <div class="item-discount">₩${discount.toLocaleString()}</div>
          <div class="item-total">₩${total.toLocaleString()}</div>
        </div>
      `;
    }).join('');

    orderItemsList.innerHTML = itemsHTML;

    console.log(`🔄 주문 내역 렌더링 완료: ${currentOrder.length}개 아이템 (확정: ${confirmedItems.length}개, 대기: ${pendingItems.length}개)`);
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
