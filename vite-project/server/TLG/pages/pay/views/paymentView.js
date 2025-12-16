/**
 * Payment View - UI 렌더링 레이어
 * 순수하게 UI 렌더링만 담당
 */

export const paymentView = {
  /**
   * 결제 화면 렌더링
   */
  renderPaymentScreen(orderData) {
    const main = document.getElementById('main') || document.body;
    
    main.innerHTML = `
      <div class="pay-container">
        ${this.renderHeader(orderData)}
        ${this.renderMainContent(orderData)}
        ${this.renderFooter(orderData)}
      </div>
    `;

    this.loadPaymentStyles();
  },

  /**
   * 헤더 렌더링
   */
  renderHeader(orderData) {
    return `
      <header class="pay-header">
        <button id="payBackBtn" class="back-btn" data-testid="button-back">
          ← 뒤로가기
        </button>
        <div class="header-info">
          <h1 data-testid="text-title">결제 확인</h1>
          <p data-testid="text-store-info">${orderData.store} • 테이블 ${orderData.table}</p>
        </div>
      </header>
    `;
  },

  /**
   * 메인 콘텐츠 렌더링
   */
  renderMainContent(orderData) {
    return `
      <main class="pay-main">
        ${this.renderOrderSection(orderData)}
        ${this.renderPointsSection()}
        ${this.renderCouponSection()}
        ${this.renderPaymentMethodSection()}
        ${this.renderSummarySection(orderData)}
      </main>
    `;
  },

  /**
   * 주문 내역 섹션
   */
  renderOrderSection(orderData) {
    return `
      <section class="order-section">
        <div class="section-title">
          <h2>주문 내역</h2>
          <span class="item-count" data-testid="text-item-count">${orderData.items.length}개</span>
        </div>
        <div class="order-list">
          ${orderData.items.map((item, index) => `
            <div class="order-item" data-testid="item-order-${index}">
              <div class="item-info">
                <span class="item-name" data-testid="text-item-name-${index}">${item.name}</span>
                <span class="item-qty" data-testid="text-item-qty-${index}">×${item.qty}</span>
              </div>
              <span class="item-price" data-testid="text-item-price-${index}">${item.totalPrice.toLocaleString()}원</span>
            </div>
          `).join('')}
        </div>
        <div class="subtotal-row">
          <span>주문 금액</span>
          <span class="subtotal-amount" data-testid="text-subtotal">${orderData.total.toLocaleString()}원</span>
        </div>
      </section>
    `;
  },

  /**
   * 포인트 사용 섹션
   */
  renderPointsSection() {
    return `
      <section class="points-section">
        <div class="section-title">
          <h2>포인트 사용</h2>
          <div id="storePointDisplay" class="point-balance" data-testid="text-point-balance">조회 중...</div>
        </div>
        <div class="point-input-group">
          <input type="number" id="usePoint" min="0" max="0" value="0"
                 placeholder="사용할 포인트" disabled class="point-input" data-testid="input-point">
          <button id="maxPointBtn" class="max-point-btn" disabled data-testid="button-max-point">전액</button>
        </div>
      </section>
    `;
  },

  /**
   * 쿠폰 사용 섹션
   */
  renderCouponSection() {
    return `
      <section class="coupon-section">
        <div class="section-title">
          <h2>쿠폰 사용</h2>
        </div>
        <div id="couponList" class="coupon-select"></div>
      </section>
    `;
  },

  /**
   * 결제 수단 선택 섹션
   */
  renderPaymentMethodSection() {
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
            <div class="payment-method-item ${method.active ? 'active' : ''}" 
                 data-method="${method.method}" 
                 data-testid="item-payment-method-${method.method}">
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
  },

  /**
   * 결제 요약 섹션
   */
  renderSummarySection(orderData) {
    return `
      <section class="summary-section">
        <div class="summary-details">
          <div class="summary-item">
            <span>주문 금액</span>
            <span data-testid="text-order-total">${orderData.total.toLocaleString()}원</span>
          </div>
          <div class="summary-item discount-item" id="discountRow" style="display: none;">
            <span id="discountLabel">할인 금액</span>
            <span id="discountAmount" class="discount-text" data-testid="text-discount">-0원</span>
          </div>
        </div>
        <div class="final-total-row">
          <span>최종 결제</span>
          <span id="finalAmount" class="final-amount" data-testid="text-final-amount">${orderData.total.toLocaleString()}원</span>
        </div>
        <div class="earn-point-info">
          <span>💰 적립 예정</span>
          <span id="pointEarned" class="earn-amount" data-testid="text-point-earned">+${Math.floor(orderData.total * 0.1).toLocaleString()}P</span>
        </div>
      </section>
    `;
  },

  /**
   * 푸터 렌더링
   */
  renderFooter(orderData) {
    return `
      <footer class="pay-footer">
        <button id="confirmPayBtn" class="confirm-btn" data-testid="button-confirm-pay">
          <span>결제하기</span>
          <span id="payBtnAmount" class="btn-price" data-testid="text-pay-button-amount">${orderData.total.toLocaleString()}원</span>
        </button>
        <button id="cancelPayBtn" class="cancel-btn" data-testid="button-cancel">취소</button>
      </footer>
    `;
  },

  /**
   * 포인트 UI 업데이트
   */
  updatePointUI(points, orderTotal) {
    const pointDisplay = document.getElementById('storePointDisplay');
    if (pointDisplay) {
      pointDisplay.textContent = `${points.toLocaleString()}P`;
    }

    const usePointInput = document.getElementById('usePoint');
    const maxPointBtn = document.getElementById('maxPointBtn');

    if (points > 0 && usePointInput && maxPointBtn) {
      usePointInput.max = Math.min(points, orderTotal);
      usePointInput.disabled = false;
      maxPointBtn.disabled = false;
    }
  },

  /**
   * 쿠폰 렌더링
   */
  renderCoupons(coupons) {
    const couponList = document.getElementById('couponList');
    if (!couponList) {
      console.error('❌ couponList 요소를 찾을 수 없습니다');
      return;
    }

    // 기존 쿠폰 선택 요소 제거
    const existingSelect = couponList.querySelector('#couponSelect');
    if (existingSelect) {
      existingSelect.remove();
    }

    if (coupons.length === 0) {
      couponList.innerHTML = '<p>사용 가능한 쿠폰이 없습니다</p>';
      return;
    }

    const couponSelect = document.createElement('select');
    couponSelect.id = 'couponSelect';
    couponSelect.className = 'coupon-select-element';
    couponSelect.setAttribute('data-testid', 'select-coupon');

    couponSelect.innerHTML = `
      <option value="">쿠폰을 선택하세요</option>
      ${coupons.map((coupon, index) => `
        <option value="${coupon.id}" 
                data-discount="${coupon.discountValue || coupon.discount_amount || 0}"
                data-testid="option-coupon-${index}">
          ${coupon.name} - ${(coupon.discountValue || coupon.discount_amount || 0).toLocaleString()}원 할인
        </option>
      `).join('')}
    `;

    couponList.appendChild(couponSelect);
  },

  /**
   * 금액 표시 업데이트
   */
  updateAmountDisplay(amountData) {
    const { totalDiscount, finalAmount, validatedPoints, couponDiscount, earnedPoints } = amountData;

    // 할인 행 표시/숨김
    const discountRow = document.getElementById('discountRow');
    if (totalDiscount > 0) {
      discountRow.style.display = 'flex';
      document.getElementById('discountAmount').textContent = `-${totalDiscount.toLocaleString()}원`;

      if (validatedPoints > 0 && couponDiscount > 0) {
        document.getElementById('discountLabel').textContent = '포인트 + 쿠폰 할인';
      } else if (validatedPoints > 0) {
        document.getElementById('discountLabel').textContent = '포인트 할인';
      } else {
        document.getElementById('discountLabel').textContent = '쿠폰 할인';
      }
    } else {
      discountRow.style.display = 'none';
    }

    // 최종 금액 업데이트
    document.getElementById('finalAmount').textContent = `${finalAmount.toLocaleString()}원`;
    document.getElementById('payBtnAmount').textContent = `${finalAmount.toLocaleString()}원`;

    // 적립 포인트 업데이트
    document.getElementById('pointEarned').textContent = `+${earnedPoints.toLocaleString()}P`;
  },

  /**
   * CSS 로드
   */
  loadPaymentStyles() {
    if (!document.querySelector('#payment-styles')) {
      const link = document.createElement('link');
      link.id = 'payment-styles';
      link.rel = 'stylesheet';
      link.href = '/TLG/pages/pay/styles/payment.css';
      document.head.appendChild(link);
    }
  },

  /**
   * 에러 메시지 표시
   */
  showError(message) {
    alert(`결제 오류: ${message}`);
  }
};

console.log('✅ paymentView 모듈 로드 완료');
