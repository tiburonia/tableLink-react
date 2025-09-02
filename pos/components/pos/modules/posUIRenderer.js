// POS UI 렌더링 모듈 - 새 시스템 전용
import { POSStateManager } from './posStateManager.js';

export class POSUIRenderer {

  // 🔘 Primary Action 버튼 업데이트 (장바구니 → 주문 확정)
  static updatePrimaryActionButton() {
    const primaryBtn = document.getElementById('primaryActionBtn');
    if (!primaryBtn) {
      console.warn('⚠️ primaryActionBtn 요소를 찾을 수 없습니다');
      return;
    }

    const cartItems = POSStateManager.getCartItems();
    console.log(`🔘 Primary Action 버튼 업데이트: 장바구니 ${cartItems.length}개`);

    if (cartItems.length > 0) {
      // 장바구니에 아이템이 있으면 주문 확정 버튼 활성화
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      primaryBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">🏆 주문 확정</span>
          <span class="btn-subtitle">${cartItems.length}개 메뉴 • ₩${totalAmount.toLocaleString()}</span>
        </div>
      `;
      primaryBtn.className = 'primary-action-btn confirm-order active';

      console.log(`✅ 주문 확정 버튼 활성화: ${cartItems.length}개 메뉴, ₩${totalAmount.toLocaleString()}`);

    } else {
      // 장바구니가 비어있으면 비활성화
      primaryBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">🛒 주문 확정</span>
          <span class="btn-subtitle">메뉴를 선택하세요</span>
        </div>
      `;
      primaryBtn.className = 'primary-action-btn disabled';

      console.log('⚪ 주문 확정 버튼 비활성화: 장바구니 비어있음');
    }

    // 결제 패널도 업데이트
    this.updatePaymentPanel();
  }

  // 📋 주문 목록 렌더링
  static renderOrderItems() {
    const orderContainer = document.getElementById('orderItems');
    if (!orderContainer) {
      console.warn('⚠️ orderItems 컨테이너를 찾을 수 없습니다');
      return;
    }

    const cartItems = POSStateManager.getCartItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    let html = '';

    // 장바구니 아이템 표시
    if (cartItems.length > 0) {
      html += `
        <div class="order-section">
          <h3 class="section-title">🛒 장바구니 (${cartItems.length}개)</h3>
          <div class="order-items-list">
      `;

      cartItems.forEach(item => {
        html += `
          <div class="order-item cart-item" data-item-id="${item.id}">
            <div class="item-info">
              <span class="item-name">${item.name}</span>
              <span class="item-price">₩${item.price.toLocaleString()}</span>
            </div>
            <div class="item-controls">
              <button class="qty-btn" onclick="POSOrderManager.changeCartQuantity('${item.id}', -1)">-</button>
              <span class="quantity">${item.quantity}</span>
              <button class="qty-btn" onclick="POSOrderManager.changeCartQuantity('${item.id}', 1)">+</button>
            </div>
            <div class="item-total">₩${(item.price * item.quantity).toLocaleString()}</div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    // 확정된 주문 표시
    if (confirmedItems.length > 0) {
      html += `
        <div class="order-section">
          <h3 class="section-title">✅ 확정된 주문 (${confirmedItems.length}개)</h3>
          <div class="order-items-list">
      `;

      confirmedItems.forEach(item => {
        html += `
          <div class="order-item confirmed-item" data-item-id="${item.id}">
            <div class="item-info">
              <span class="item-name">${item.name || item.menuName}</span>
              <span class="item-price">₩${item.price.toLocaleString()}</span>
            </div>
            <div class="item-status">
              <span class="status-badge status-${item.status || 'ordered'}">${this.getStatusText(item.status || 'ordered')}</span>
              <span class="quantity">×${item.quantity}</span>
            </div>
            <div class="item-total">₩${(item.price * item.quantity).toLocaleString()}</div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    // 빈 상태 표시
    if (cartItems.length === 0 && confirmedItems.length === 0) {
      html = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <div class="empty-text">메뉴를 선택해서 장바구니에 담아보세요</div>
        </div>
      `;
    }

    orderContainer.innerHTML = html;
    console.log(`📋 주문 목록 렌더링 완료: 장바구니 ${cartItems.length}개, 확정 ${confirmedItems.length}개`);
  }

  // 💰 결제 요약 렌더링
  static renderPaymentSummary() {
    const summaryContainer = document.getElementById('paymentSummary');
    if (!summaryContainer) return;

    const cartItems = POSStateManager.getCartItems();
    const confirmedItems = POSStateManager.getConfirmedItems();
    const session = POSStateManager.getCurrentSession();

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const confirmedTotal = confirmedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const grandTotal = cartTotal + confirmedTotal;

    let html = `
      <div class="payment-summary">
        <div class="summary-section">
          <h4>💰 주문 요약</h4>
    `;

    if (cartItems.length > 0) {
      html += `
        <div class="summary-row">
          <span>🛒 장바구니 (${cartItems.length}개)</span>
          <span>₩${cartTotal.toLocaleString()}</span>
        </div>
      `;
    }

    if (confirmedItems.length > 0) {
      html += `
        <div class="summary-row">
          <span>✅ 확정 주문 (${confirmedItems.length}개)</span>
          <span>₩${confirmedTotal.toLocaleString()}</span>
        </div>
      `;
    }

    html += `
        <div class="summary-total">
          <span>총 합계</span>
          <span>₩${grandTotal.toLocaleString()}</span>
        </div>
      </div>
    `;

    // 결제 버튼들 (확정된 주문이 있을 때만 표시)
    if (session.checkId && confirmedTotal > 0) {
      html += `
        <div class="payment-buttons">
          <button class="payment-btn cash-btn" onclick="processPayment('CASH')">💵 현금결제</button>
          <button class="payment-btn card-btn" onclick="processPayment('CARD')">💳 카드결제</button>
        </div>
      `;
    }

    html += `</div>`;
    summaryContainer.innerHTML = html;
  }

  // 📍 테이블 정보 업데이트
  static updateTableInfo() {
    const tableInfoElement = document.getElementById('tableInfo');
    if (!tableInfoElement) return;

    const currentTable = POSStateManager.getCurrentTable();
    const currentStore = POSStateManager.getCurrentStore();

    if (currentTable && currentStore) {
      tableInfoElement.innerHTML = `
        <div class="table-info">
          <span class="store-name">${currentStore.name}</span>
          <span class="table-number">테이블 ${currentTable}</span>
        </div>
      `;
    }
  }

  // 💳 결제 패널 업데이트
  static updatePaymentPanel() {
    const session = POSStateManager.getCurrentSession();
    const confirmedItems = POSStateManager.getConfirmedItems();

    console.log(`💳 결제 패널 업데이트: 세션 ${session.checkId ? '있음' : '없음'}, 확정 주문 ${confirmedItems.length}개`);
  }

  // 상태 텍스트 변환
  static getStatusText(status) {
    const statusMap = {
      'ordered': '주문완료',
      'preparing': '조리중',
      'ready': '준비완료',
      'served': '서빙완료',
      'canceled': '취소됨'
    };
    return statusMap[status] || status;
  }
}