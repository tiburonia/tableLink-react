// POS UI 렌더링 모듈 - 단순 장바구니 방식
import { POSStateManager } from './posStateManager.js';

export class POSUIRenderer {

  // 🔘 Primary Action 버튼 업데이트 (장바구니 + 확정 주문 수정 상태 기반)
  static updatePrimaryActionButton() {
    const primaryBtn = document.getElementById('primaryActionBtn');
    if (!primaryBtn) {
      console.warn('⚠️ primaryActionBtn 요소 없음');
      return;
    }

    const cartItems = POSStateManager.getCartItems();
    const hasModifications = POSOrderManager.modifiedConfirmedItems && POSOrderManager.modifiedConfirmedItems.length > 0;

    if (cartItems.length > 0) {
      // 장바구니가 있으면 주문 확정 모드
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      primaryBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">🏆 주문 확정</span>
          <span class="btn-subtitle">${totalQuantity}개 메뉴 • ₩${totalAmount.toLocaleString()}</span>
        </div>
      `;
      primaryBtn.className = 'primary-action-btn confirm-order active';
      primaryBtn.disabled = false;
      primaryBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      primaryBtn.style.color = 'white';

      console.log(`🔘 Primary Action 버튼: 주문 확정 모드 (장바구니 ${cartItems.length}개)`);
    } else if (hasModifications) {
      // 확정된 주문 수정사항이 있으면 수정 저장 모드
      primaryBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">💾 수정사항 저장</span>
          <span class="btn-subtitle">${POSOrderManager.modifiedConfirmedItems.length}개 주문 수정됨</span>
        </div>
      `;
      primaryBtn.className = 'primary-action-btn modify-order active';
      primaryBtn.disabled = false;
      primaryBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
      primaryBtn.style.color = 'white';

      console.log(`🔘 Primary Action 버튼: 수정 저장 모드 (${POSOrderManager.modifiedConfirmedItems.length}개 수정)`);
    } else {
      // 아무것도 없으면 비활성화
      primaryBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">🛒 주문 없음</span>
          <span class="btn-subtitle">메뉴를 선택하세요</span>
        </div>
      `;
      primaryBtn.className = 'primary-action-btn disabled';
      primaryBtn.disabled = true;
      primaryBtn.style.background = '#f1f5f9';
      primaryBtn.style.color = '#94a3b8';

      console.log('⚪ Primary Action 버튼: 비활성화');
    }
  }

  // 💳 결제 패널 상태 업데이트
  static updatePaymentPanel() {
    const cartItems = POSStateManager.getCartItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    // 결제 버튼들 상태 업데이트
    const paymentButtons = document.querySelectorAll('.payment-btn');
    const hasConfirmedOrders = confirmedItems.length > 0;

    paymentButtons.forEach(btn => {
      if (hasConfirmedOrders) {
        btn.disabled = false;
        btn.classList.remove('disabled');
      } else {
        btn.disabled = true;
        btn.classList.add('disabled');
      }
    });
  }

  // 📋 주문 아이템 렌더링 (장바구니 + 확정 주문)
  static renderOrderItems() {
    const orderItemsContainer = document.getElementById('orderItemsContainer') || document.getElementById('orderItems');
    if (!orderItemsContainer) {
      console.warn('⚠️ orderItemsContainer/orderItems 요소를 찾을 수 없습니다');
      return;
    }

    const cartItems = POSStateManager.getCartItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    let html = '';

    // 장바구니 아이템들
    if (cartItems.length > 0) {
      html += '<div class="cart-section"><h4>🛒 장바구니</h4>';
      cartItems.forEach(item => {
        html += `
          <div class="order-item cart-item">
            <div class="item-info">
              <span class="item-name">${item.name}</span>
              <span class="item-price">₩${(item.price * item.quantity).toLocaleString()}</span>
            </div>
            <div class="item-controls">
              <button onclick="POSOrderManager.changeCartQuantity('${item.id}', -1)">-</button>
              <span class="quantity">${item.quantity}</span>
              <button onclick="POSOrderManager.changeCartQuantity('${item.id}', 1)">+</button>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    // 확정된 주문들
    if (confirmedItems.length > 0) {
      html += '<div class="confirmed-section"><h4>✅ 확정 주문</h4>';
      confirmedItems.forEach(item => {
        html += `
          <div class="order-item confirmed-item">
            <div class="item-info">
              <span class="item-name">${item.name}</span>
              <span class="item-price">₩${(item.price * item.quantity).toLocaleString()}</span>
            </div>
            <div class="item-status">
              <span class="quantity">${item.quantity}개</span>
              <span class="status">${item.status || 'ordered'}</span>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    if (cartItems.length === 0 && confirmedItems.length === 0) {
      html = '<div class="no-items">선택된 메뉴가 없습니다</div>';
    }

    orderItemsContainer.innerHTML = html;
  }

  // 💰 결제 요약 렌더링
  static renderPaymentSummary() {
    const summaryContainer = document.getElementById('paymentSummary');
    if (!summaryContainer) return;

    const cartItems = POSStateManager.getCartItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const confirmedTotal = confirmedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const grandTotal = cartTotal + confirmedTotal;

    let html = `
      <div class="summary-section">
        <div class="summary-line">
          <span>장바구니 소계</span>
          <span>₩${cartTotal.toLocaleString()}</span>
        </div>
        <div class="summary-line">
          <span>확정 주문 소계</span>
          <span>₩${confirmedTotal.toLocaleString()}</span>
        </div>
        <div class="summary-line total">
          <span>총 금액</span>
          <span>₩${grandTotal.toLocaleString()}</span>
        </div>
      </div>
    `;

    summaryContainer.innerHTML = html;
  }

  // 🔄 전체 UI 업데이트
  static renderAll() {
    this.renderOrderItems();
    this.renderPaymentSummary();
    this.updatePrimaryActionButton();
  }
}

// 전역 함수로 노출
window.POSUIRenderer = POSUIRenderer;

console.log('✅ POSUIRenderer 모듈 로드 완료');