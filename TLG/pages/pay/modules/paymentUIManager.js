
/**
 * 결제 UI 관리 모듈
 */

export class PaymentUIManager {
  /**
   * 결제 화면 렌더링
   */
  static renderPaymentScreen(orderData) {
    const main = document.getElementById('main') || document.body;
    
    main.innerHTML = `
      <div class="pay-container">
        ${this.renderHeader(orderData)}
        ${this.renderMainContent(orderData)}
        ${this.renderFooter(orderData)}
      </div>
    `;

    // CSS 로드
    this.loadPaymentStyles();
  }

  /**
   * 헤더 렌더링
   */
  static renderHeader(orderData) {
    return `
      <header class="pay-header">
        <button id="payBackBtn" class="back-btn">
          ← 뒤로가기
        </button>
        <div class="header-info">
          <h1>결제 확인</h1>
          <p>${orderData.store} • 테이블 ${orderData.table}</p>
        </div>
      </header>
    `;
  }

  /**
   * 메인 콘텐츠 렌더링
   */
  static renderMainContent(orderData) {
    return `
      <main class="pay-main">
        ${this.renderOrderSection(orderData)}
        ${this.renderPointsSection()}
        ${this.renderCouponSection()}
        ${this.renderPaymentMethodSection()}
        ${this.renderSummarySection(orderData)}
      </main>
    `;
  }

  /**
   * 주문 내역 섹션
   */
  static renderOrderSection(orderData) {
    return `
      <section class="order-section">
        <div class="section-title">
          <h2>주문 내역</h2>
          <span class="item-count">${orderData.items.length}개</span>
        </div>
        <div class="order-list">
          ${orderData.items.map(item => `
            <div class="order-item">
              <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-qty">×${item.qty}</span>
              </div>
              <span class="item-price">${item.totalPrice.toLocaleString()}원</span>
            </div>
          `).join('')}
        </div>
        <div class="subtotal-row">
          <span>주문 금액</span>
          <span class="subtotal-amount">${orderData.total.toLocaleString()}원</span>
        </div>
      </section>
    `;
  }

  /**
   * 포인트 사용 섹션
   */
  static renderPointsSection() {
    return `
      <section class="points-section">
        <div class="section-title">
          <h2>포인트 사용</h2>
          <div id="storePointDisplay" class="point-balance">조회 중...</div>
        </div>
        <div class="point-input-group">
          <input type="number" id="usePoint" min="0" max="0" value="0"
                 placeholder="사용할 포인트" disabled class="point-input">
          <button id="maxPointBtn" class="max-point-btn" disabled>전액</button>
        </div>
      </section>
    `;
  }

  /**
   * 쿠폰 사용 섹션
   */
  static renderCouponSection() {
    return `
      <section class="coupon-section">
        <div class="section-title">
          <h2>쿠폰 사용</h2>
        </div>
        <div id="couponList" class="coupon-select"></div>
      </section>
    `;
  }

  /**
   * 결제 수단 선택 섹션
   */
  static renderPaymentMethodSection() {
    const paymentMethods = [
      { method: '카드', icon: '💳', name: '신용/체크카드', desc: '간편하고 빠른 결제', active: true },
      { method: '계좌이체', icon: '🏦', name: '계좌이체', desc: '퀵계좌이체로 간편결제' },
      { method: '가상계좌', icon: '🏪', name: '가상계좌', desc: '계좌번호 발급 후 입금' },
      { method: '휴대폰', icon: '📱', name: '휴대폰', desc: '휴대폰 요금과 합산' },
      { method: '간편결제', icon: '⚡', name: '간편결제', desc: '페이코, 삼성페이 등' },
      { method: '문화상품권', icon: '🎫', name: '문화상품권', desc: '상품권으로 결제' },
      { method: '도서문화상품권', icon: '📚', name: '도서문화상품권', desc: '도서/문화 상품권' },
      { method: '게임문화상품권', icon: '🎮', name: '게임문화상품권', desc: '게임 상품권으로 결제' }
    ];

    return `
      <section class="payment-method-section">
        <div class="section-title">
          <h2>결제 수단</h2>
        </div>
        <div class="payment-methods">
          ${paymentMethods.map(method => `
            <div class="payment-method-item ${method.active ? 'active' : ''}" data-method="${method.method}">
              <div class="method-icon">${method.icon}</div>
              <div class="method-info">
                <span class="method-name">${method.name}</span>
                <span class="method-desc">${method.desc}</span>
              </div>
              <div class="method-check">✓</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  /**
   * 결제 요약 섹션
   */
  static renderSummarySection(orderData) {
    return `
      <section class="summary-section">
        <div class="summary-details">
          <div class="summary-item">
            <span>주문 금액</span>
            <span>${orderData.total.toLocaleString()}원</span>
          </div>
          <div class="summary-item discount-item" id="discountRow" style="display: none;">
            <span id="discountLabel">할인 금액</span>
            <span id="discountAmount" class="discount-text">-0원</span>
          </div>
        </div>
        <div class="final-total-row">
          <span>최종 결제</span>
          <span id="finalAmount" class="final-amount">${orderData.total.toLocaleString()}원</span>
        </div>
        <div class="earn-point-info">
          <span>💰 적립 예정</span>
          <span id="pointEarned" class="earn-amount">+${Math.floor(orderData.total * 0.1).toLocaleString()}P</span>
        </div>
      </section>
    `;
  }

  /**
   * 푸터 렌더링
   */
  static renderFooter(orderData) {
    return `
      <footer class="pay-footer">
        <button id="confirmPayBtn" class="confirm-btn">
          <span>결제하기</span>
          <span id="payBtnAmount" class="btn-price">${orderData.total.toLocaleString()}원</span>
        </button>
        <button id="cancelPayBtn" class="cancel-btn">취소</button>
      </footer>
    `;
  }

  /**
   * CSS 로드
   */
  static loadPaymentStyles() {
    if (!document.querySelector('#payment-styles')) {
      const link = document.createElement('link');
      link.id = 'payment-styles';
      link.rel = 'stylesheet';
      link.href = '/TLG/pages/store/pay/styles/payment.css';
      document.head.appendChild(link);
    }
  }
}
