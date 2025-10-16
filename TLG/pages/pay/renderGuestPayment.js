
/**
 * 비회원 전용 결제 화면
 * 토스페이먼츠 연동 (이름, 전화번호 필수 입력)
 */

import { GuestPaymentController } from './controllers/guestPaymentController.js';

let guestPaymentController = null;

export async function renderGuestPayment(orderData) {
  const main = document.getElementById('main');
  if (!main) return;

  console.log('💳 비회원 결제 화면 렌더링:', orderData);

  // 기본값 설정
  const { 
    storeId, 
    storeName = '매장',
    tableNumber,
    tableName,
    cart = [],
    totalAmount = 0 
  } = orderData;

  // 총 금액 계산
  const calculatedTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalAmount = totalAmount || calculatedTotal;

  main.innerHTML = `
    <div class="guest-payment-screen">
      <!-- 헤더 -->
      <header class="payment-header">
        <button class="payment-back-btn" id="guestPaymentBackBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="payment-header-info">
          <h1>비회원 결제</h1>
          <p>${storeName} • ${tableName || `${tableNumber}번 테이블`}</p>
        </div>
        <div class="header-spacer"></div>
      </header>

      <!-- 메인 컨텐츠 -->
      <div class="payment-content">
        <!-- 주문 내역 섹션 -->
        <section class="payment-section order-summary">
          <div class="section-header">
            <h2>주문 내역</h2>
            <span class="item-count">${cart.length}개</span>
          </div>
          <div class="order-items">
            ${cart.map(item => `
              <div class="order-item">
                <div class="item-info">
                  <span class="item-name">${escapeHtml(item.menuName)}</span>
                  <span class="item-qty">×${item.quantity}</span>
                </div>
                <span class="item-price">₩${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          <div class="order-total">
            <span>주문 금액</span>
            <strong>₩${finalAmount.toLocaleString()}</strong>
          </div>
        </section>

        <!-- 고객 정보 입력 섹션 -->
        <section class="payment-section customer-info">
          <div class="section-header">
            <h2>주문자 정보</h2>
            <span class="required-badge">필수</span>
          </div>

          <div class="form-group">
            <label for="guestName">
              <span class="label-text">이름</span>
              <span class="required-mark">*</span>
            </label>
            <input 
              type="text" 
              id="guestName" 
              class="form-input"
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div class="form-group">
            <label for="guestPhone">
              <span class="label-text">전화번호</span>
              <span class="required-mark">*</span>
            </label>
            <input 
              type="tel" 
              id="guestPhone" 
              class="form-input"
              placeholder="010-0000-0000"
              maxlength="13"
              required
            />
          </div>
        </section>

        <!-- 결제 수단 선택 섹션 -->
        <section class="payment-section payment-methods">
          <div class="section-header">
            <h2>결제 수단</h2>
          </div>

          <div class="payment-method-grid">
            ${renderPaymentMethods()}
          </div>
        </section>

        <!-- 결제 금액 요약 -->
        <section class="payment-section payment-summary">
          <div class="summary-row">
            <span>주문 금액</span>
            <span>₩${finalAmount.toLocaleString()}</span>
          </div>
          <div class="summary-row final-amount">
            <span>최종 결제 금액</span>
            <strong id="finalPaymentAmount">₩${finalAmount.toLocaleString()}</strong>
          </div>
        </section>
      </div>

      <!-- 하단 고정 버튼 -->
      <footer class="payment-footer">
        <button class="payment-submit-btn" id="guestPaymentSubmitBtn" disabled>
          <span class="btn-content">
            <span>결제하기</span>
            <strong class="btn-amount">₩${finalAmount.toLocaleString()}</strong>
          </span>
        </button>
      </footer>
    </div>

    ${getGuestPaymentStyles()}
  `;

  // 이벤트 리스너 설정
  await setupGuestPaymentEvents(orderData, finalAmount);
}

/**
 * 결제 수단 렌더링
 */
function renderPaymentMethods() {
  const methods = [
    { id: '카드', icon: '💳', name: '신용/체크카드', desc: '간편하고 빠른 결제' },
    { id: '계좌이체', icon: '🏦', name: '계좌이체', desc: '실시간 계좌이체' },
    { id: '가상계좌', icon: '🏪', name: '가상계좌', desc: '계좌번호 발급 후 입금' },
    { id: '휴대폰', icon: '📱', name: '휴대폰', desc: '휴대폰 소액결제' },
    { id: '간편결제', icon: '⚡', name: '토스페이', desc: '토스 간편결제' },
    { id: '문화상품권', icon: '🎫', name: '문화상품권', desc: '문화상품권 결제' },
    { id: '도서문화상품권', icon: '📚', name: '도서문화상품권', desc: '도서/문화 상품권' },
    { id: '게임문화상품권', icon: '🎮', name: '게임문화상품권', desc: '게임 상품권' }
  ];

  return methods.map(method => `
    <div class="payment-method-card" data-method="${method.id}">
      <div class="method-icon">${method.icon}</div>
      <div class="method-info">
        <div class="method-name">${method.name}</div>
        <div class="method-desc">${method.desc}</div>
      </div>
      <div class="method-check">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  `).join('');
}

/**
 * 이벤트 리스너 설정
 */
async function setupGuestPaymentEvents(orderData, finalAmount) {
  let selectedMethod = '카드';
  let isFormValid = false;

  // 결제 컨트롤러 초기화
  guestPaymentController = new GuestPaymentController();
  
  // orderData에 cart 데이터를 items로 추가
  const enhancedOrderData = {
    ...orderData,
    items: orderData.cart || cart
  };
  
  await guestPaymentController.initialize(
    null, // guestInfo는 나중에 입력
    enhancedOrderData,
    { name: orderData.storeName, id: orderData.storeId }
  );

  // 뒤로가기
  const backBtn = document.getElementById('guestPaymentBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (typeof window.renderGuestOrderScreen === 'function') {
        window.renderGuestOrderScreen(
          { id: orderData.storeId, name: orderData.storeName },
          orderData.tableName,
          orderData.tableNumber
        );
      }
    });
  }

  // 결제 수단 선택
  document.querySelectorAll('.payment-method-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedMethod = card.dataset.method;
      console.log('💳 결제 수단 선택:', selectedMethod);
      guestPaymentController.selectPaymentMethod(selectedMethod);
      validateForm();
    });
  });

  // 기본 선택 (카드)
  const defaultCard = document.querySelector('.payment-method-card[data-method="카드"]');
  if (defaultCard) {
    defaultCard.classList.add('selected');
  }

  // 이름 입력
  const nameInput = document.getElementById('guestName');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      validateForm();
    });
  }

  // 전화번호 입력 (자동 하이픈)
  const phoneInput = document.getElementById('guestPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^0-9]/g, '');

      if (value.length > 3 && value.length <= 7) {
        value = value.slice(0, 3) + '-' + value.slice(3);
      } else if (value.length > 7) {
        value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
      }

      e.target.value = value;
      validateForm();
    });
  }

  // 결제하기 버튼
  const submitBtn = document.getElementById('guestPaymentSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      if (!isFormValid) {
        alert('필수 정보를 모두 입력해주세요.');
        return;
      }

      const name = nameInput?.value.trim();
      const phone = phoneInput?.value.trim();

      if (!name || !phone) {
        alert('이름과 전화번호를 입력해주세요.');
        return;
      }

      const phoneRegex = /^010-\d{4}-\d{4}$/;
      if (!phoneRegex.test(phone)) {
        alert('올바른 전화번호 형식이 아닙니다. (010-0000-0000)');
        return;
      }

      console.log('💳 비회원 결제 진행:', { name, phone, method: selectedMethod, orderData });

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="btn-content">
            <div class="loading-spinner"></div>
            <span>결제 처리 중...</span>
          </span>
        `;

        // guestInfo 설정
        guestPaymentController.guestInfo = { name, phone };

        await guestPaymentController.executePayment(finalAmount);

      } catch (error) {
        console.error('❌ 결제 실패:', error);
        alert(`결제 실패: ${error.message}`);

        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span class="btn-content">
            <span>결제하기</span>
            <strong class="btn-amount">₩${finalAmount.toLocaleString()}</strong>
          </span>
        `;
      }
    });
  }

  /**
   * 폼 유효성 검증
   */
  function validateForm() {
    const name = nameInput?.value.trim();
    const phone = phoneInput?.value.trim();
    const phoneRegex = /^010-\d{4}-\d{4}$/;

    isFormValid = name && phone && phoneRegex.test(phone) && selectedMethod;

    if (submitBtn) {
      submitBtn.disabled = !isFormValid;
      if (isFormValid) {
        submitBtn.classList.add('enabled');
      } else {
        submitBtn.classList.remove('enabled');
      }
    }
  }

  validateForm();
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

/**
 * 스타일
 */
function getGuestPaymentStyles() {
  return `
    <style>
      .guest-payment-screen {
        position: fixed;
        left: 0;
        width: 100%;
        max-width: 390px;
        height: 794px;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .payment-header {
        background: white;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        flex-shrink: 0;
      }

      .payment-back-btn {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: #1e293b;
        display: flex;
        align-items: center;
      }

      .payment-header-info {
        flex: 1;
      }

      .payment-header-info h1 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .payment-header-info p {
        margin: 4px 0 0 0;
        font-size: 13px;
        color: #64748b;
      }

      .header-spacer {
        width: 40px;
      }

      .payment-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-bottom: 100px;
      }

      .payment-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        border: 1px solid #f1f5f9;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .item-count {
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        color: #2563eb;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
        border: 1px solid #bfdbfe;
      }

      .required-badge {
        background: linear-gradient(135deg, #fef2f2, #fee2e2);
        color: #dc2626;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
        border: 1px solid #fecaca;
      }

      .order-items {
        margin-bottom: 16px;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f8fafc;
      }

      .order-item:last-child {
        border-bottom: none;
      }

      .item-info {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
      }

      .item-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 15px;
      }

      .item-qty {
        background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
        color: #475569;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
      }

      .item-price {
        font-weight: 800;
        color: #3b82f6;
        font-size: 15px;
      }

      .order-total {
        display: flex;
        justify-content: space-between;
        padding-top: 16px;
        border-top: 2px solid #f1f5f9;
        font-weight: 700;
        color: #1e293b;
        font-size: 16px;
      }

      .order-total strong {
        font-weight: 800;
        color: #1e293b;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group:last-child {
        margin-bottom: 0;
      }

      .form-group label {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }

      .required-mark {
        color: #dc2626;
        font-weight: 700;
      }

      .form-input {
        width: 100%;
        padding: 14px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 15px;
        background: #f8fafc;
        font-weight: 600;
        color: #1e293b;
        transition: all 0.2s;
      }

      .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      }

      .form-input::placeholder {
        color: #94a3b8;
        font-weight: 500;
      }

      .payment-method-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .payment-method-card {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 8px;
        position: relative;
      }

      .payment-method-card:hover {
        border-color: #3b82f6;
        background: white;
        transform: translateY(-2px);
      }

      .payment-method-card.selected {
        border-color: #3b82f6;
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
      }

      .method-icon {
        font-size: 32px;
      }

      .method-info {
        width: 100%;
      }

      .method-name {
        font-size: 13px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 2px;
      }

      .method-desc {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
      }

      .method-check {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.2s;
      }

      .payment-method-card.selected .method-check {
        opacity: 1;
        background: #3b82f6;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        color: #475569;
        font-size: 15px;
        font-weight: 600;
      }

      .summary-row.final-amount {
        padding-top: 16px;
        border-top: 2px solid #e2e8f0;
        font-size: 17px;
        color: #1e293b;
      }

      .summary-row.final-amount strong {
        font-size: 24px;
        font-weight: 900;
        color: #3b82f6;
      }

      .payment-footer {
        background: white;
        padding: 16px 20px;
        padding-bottom: max(16px, env(safe-area-inset-bottom));
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
        flex-shrink: 0;
      }

      .payment-submit-btn {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        display: block;
        padding: 18px 24px;
        background: #9ca3af;
        color: white;
        font-size: 17px;
        font-weight: 700;
        border: none;
        border-radius: 16px;
        cursor: not-allowed;
        transition: all 0.3s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .payment-submit-btn.enabled {
        background: linear-gradient(135deg, #10b981, #059669);
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
      }

      .payment-submit-btn.enabled:active {
        transform: scale(0.98);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      .btn-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .btn-amount {
        font-size: 19px;
        font-weight: 900;
      }

      .loading-spinner {
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top: 4px solid #ffffff;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
}

// 전역 함수로 등록
window.renderGuestPayment = renderGuestPayment;

console.log('✅ renderGuestPayment 전역 함수 등록 완료');
