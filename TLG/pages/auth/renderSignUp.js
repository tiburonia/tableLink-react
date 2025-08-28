async function renderSignUp() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div class="signup-container">
      <!-- 헤더 -->
      <div class="signup-header">
        <button class="back-button" onclick="renderLogin()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18L9 12L15 6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1 class="header-title">회원가입</h1>
        <div class="header-spacer"></div>
      </div>

      <!-- 메인 컨텐츠 -->
      <div class="signup-content">
        <!-- 브랜드 섹션 -->
        <div class="brand-section">
          <div class="brand-logo">
            <div class="logo-icon">🍽️</div>
            <h2 class="brand-name">TableLink</h2>
          </div>
          <p class="brand-tagline">간편한 테이블 주문 서비스</p>
        </div>

        <!-- 회원가입 폼 -->
        <form class="signup-form" id="signupForm">
          <!-- 아이디 -->
          <div class="form-field">
            <label class="field-label">아이디 *</label>
            <div class="input-container">
              <input 
                type="text" 
                id="userId" 
                class="form-input" 
                placeholder="아이디를 입력하세요"
                autocomplete="username"
                required
              >
              <div class="field-status" id="userIdStatus"></div>
            </div>
            <div class="field-message" id="userIdMessage">영문, 숫자 조합 3~20자</div>
          </div>

          <!-- 비밀번호 -->
          <div class="form-field">
            <label class="field-label">비밀번호 *</label>
            <div class="input-container">
              <input 
                type="password" 
                id="userPassword" 
                class="form-input" 
                placeholder="비밀번호를 입력하세요"
                autocomplete="new-password"
                required
              >
              <button type="button" class="toggle-password" onclick="togglePassword('userPassword')">
                <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12A18.5 18.5 0 0 1 19.42 16.42"/>
                  <path d="M1 1L23 23" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="field-status" id="userPasswordStatus"></div>
            </div>
            <div class="field-message" id="userPasswordMessage">4자 이상 입력해주세요</div>
          </div>

          <!-- 비밀번호 확인 -->
          <div class="form-field">
            <label class="field-label">비밀번호 확인 *</label>
            <div class="input-container">
              <input 
                type="password" 
                id="userPasswordConfirm" 
                class="form-input" 
                placeholder="비밀번호를 다시 입력하세요"
                autocomplete="new-password"
                required
              >
              <button type="button" class="toggle-password" onclick="togglePassword('userPasswordConfirm')">
                <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12A18.5 18.5 0 0 1 19.42 16.42"/>
                  <path d="M1 1L23 23" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="field-status" id="userPasswordConfirmStatus"></div>
            </div>
            <div class="field-message" id="userPasswordConfirmMessage">비밀번호가 일치해야 합니다</div>
          </div>

          <!-- 이름 -->
          <div class="form-field">
            <label class="field-label">이름 <span class="optional-text">(선택사항)</span></label>
            <div class="input-container">
              <input 
                type="text" 
                id="userName" 
                class="form-input" 
                placeholder="이름을 입력하세요"
                autocomplete="name"
              >
              <div class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>
            <div class="field-message">맞춤형 서비스 제공을 위해 입력해주세요</div>
          </div>

          <!-- 전화번호 -->
          <div class="form-field">
            <label class="field-label">전화번호 <span class="optional-text">(선택사항)</span></label>
            <div class="input-container">
              <input 
                type="tel" 
                id="userPhone" 
                class="form-input" 
                placeholder="010-0000-0000"
                autocomplete="tel"
              >
              <div class="field-status" id="userPhoneStatus"></div>
            </div>
            <div class="field-message" id="userPhoneMessage">기존 주문 내역 연동을 위해 입력해주세요</div>
          </div>

          <!-- 주문 내역 검색 버튼 -->
          <button type="button" class="search-orders-button" id="searchOrdersButton" style="display: none;" onclick="searchExistingOrders()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            주문 내역 확인하기
          </button>

          <!-- 주문 내역 미리보기 -->
          <div class="orders-preview" id="ordersPreview" style="display: none;">
            <div class="preview-header">
              <span class="preview-icon">📋</span>
              <span class="preview-title">발견된 주문 내역</span>
              <span class="preview-count" id="ordersCount">0건</span>
            </div>
            <div class="preview-list" id="ordersList"></div>
            <div class="preview-summary" id="ordersSummary"></div>
          </div>

          <!-- 가입 버튼 -->
          <button type="submit" class="signup-button" id="signupButton" disabled>
            <span class="button-text">회원가입</span>
            <span class="button-loading" style="display: none;">
              <div class="loading-spinner"></div>
              처리 중...
            </span>
          </button>
        </form>

        <!-- 로그인 링크 -->
        <div class="login-link-section">
          <div class="divider">
            <span class="divider-text">또는</span>
          </div>
          <button type="button" class="login-link-button" onclick="renderLogin()">
            이미 계정이 있으신가요? 로그인하기
          </button>
        </div>
      </div>
    </div>

    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .signup-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .signup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .back-button {
        width: 44px;
        height: 44px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 12px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .back-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateX(-2px);
      }

      .header-title {
        color: white;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .header-spacer {
        width: 44px;
      }

      .signup-content {
        flex: 1;
        padding: 32px 24px;
        display: flex;
        flex-direction: column;
        max-width: 480px;
        margin: 0 auto;
        width: 100%;
      }

      .brand-section {
        text-align: center;
        margin-bottom: 40px;
      }

      .brand-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 8px;
      }

      .logo-icon {
        font-size: 32px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        border-radius: 16px;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .brand-name {
        color: white;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -1px;
      }

      .brand-tagline {
        color: rgba(255, 255, 255, 0.8);
        font-size: 16px;
        font-weight: 500;
      }

      .signup-form {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(30px);
        border-radius: 20px;
        padding: 32px 28px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .form-field {
        margin-bottom: 24px;
      }

      .field-label {
        display: block;
        margin-bottom: 8px;
        font-size: 15px;
        font-weight: 600;
        color: #374151;
      }

      .optional-text {
        font-size: 12px;
        color: #9ca3af;
        font-weight: 400;
      }

      .input-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      .form-input {
        width: 100%;
        height: 52px;
        padding: 16px;
        padding-right: 48px;
        font-size: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 14px;
        background: white;
        transition: all 0.3s ease;
        color: #111827;
        font-weight: 500;
      }

      .form-input::placeholder {
        color: #9ca3af;
        font-weight: 400;
      }

      .form-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        transform: translateY(-1px);
      }

      .form-input.valid {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.05);
      }

      .form-input.invalid {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.05);
        animation: shake 0.4s ease-in-out;
      }

      .form-input.checking {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.05);
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        75% { transform: translateX(3px); }
      }

      .field-status,
      .input-icon,
      .toggle-password {
        position: absolute;
        right: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toggle-password {
        background: none;
        border: none;
        cursor: pointer;
        color: #6b7280;
        padding: 4px;
        border-radius: 6px;
        transition: all 0.3s ease;
      }

      .toggle-password:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .field-message {
        margin-top: 6px;
        font-size: 13px;
        color: #6b7280;
        font-weight: 500;
        min-height: 18px;
        transition: all 0.3s ease;
      }

      .field-message.valid {
        color: #10b981;
      }

      .field-message.invalid {
        color: #ef4444;
      }

      .field-message.checking {
        color: #f59e0b;
      }

      .search-orders-button {
        width: 100%;
        height: 48px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin: 16px 0;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .search-orders-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
      }

      .orders-preview {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        margin: 16px 0;
      }

      .preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;
      }

      .preview-icon {
        font-size: 18px;
      }

      .preview-title {
        flex: 1;
        font-weight: 600;
        color: #374151;
        font-size: 15px;
      }

      .preview-count {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
      }

      .preview-list {
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 16px;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 14px;
      }

      .order-item:last-child {
        border-bottom: none;
      }

      .order-info h4 {
        font-weight: 600;
        color: #374151;
        margin-bottom: 2px;
      }

      .order-info p {
        color: #6b7280;
        font-size: 12px;
      }

      .order-amount {
        font-weight: 700;
        color: #667eea;
        font-size: 15px;
      }

      .preview-summary {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
      }

      .summary-card {
        background: white;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid #f1f5f9;
      }

      .summary-card h4 {
        font-size: 11px;
        color: #6b7280;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .summary-card p {
        font-size: 16px;
        font-weight: 700;
        color: #374151;
      }

      .signup-button {
        width: 100%;
        height: 56px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 16px;
        font-size: 17px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        position: relative;
        overflow: hidden;
      }

      .signup-button:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 12px 36px rgba(102, 126, 234, 0.4);
      }

      .signup-button:disabled {
        background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .signup-button.loading .button-text {
        opacity: 0;
      }

      .signup-button.loading .button-loading {
        display: flex !important;
      }

      .button-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 600;
      }

      .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .login-link-section {
        margin-top: 32px;
        text-align: center;
      }

      .divider {
        position: relative;
        margin: 24px 0;
      }

      .divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(255, 255, 255, 0.3);
      }

      .divider-text {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: rgba(255, 255, 255, 0.8);
        padding: 0 16px;
        font-size: 14px;
        font-weight: 500;
        position: relative;
      }

      .login-link-button {
        background: none;
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: rgba(255, 255, 255, 0.9);
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        padding: 14px 24px;
        border-radius: 12px;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .login-link-button:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
        color: white;
        transform: translateY(-1px);
      }

      /* 반응형 */
      @media (max-width: 480px) {
        .signup-content {
          padding: 20px 16px;
        }

        .signup-form {
          padding: 24px 20px;
        }

        .form-input {
          font-size: 16px; /* iOS 줌 방지 */
        }
      }

      /* 스크롤바 스타일 */
      .preview-list::-webkit-scrollbar {
        width: 4px;
      }

      .preview-list::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 2px;
      }

      .preview-list::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }

      .preview-list::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    </style>
  `;

  // 폼 로직 초기화
  initializeSignupForm();
}

function initializeSignupForm() {
  const form = document.getElementById('signupForm');
  const userIdInput = document.getElementById('userId');
  const passwordInput = document.getElementById('userPassword');
  const passwordConfirmInput = document.getElementById('userPasswordConfirm');
  const nameInput = document.getElementById('userName');
  const phoneInput = document.getElementById('userPhone');
  const signupButton = document.getElementById('signupButton');
  const searchButton = document.getElementById('searchOrdersButton');

  // 폼 유효성 상태
  const formState = {
    userId: { valid: false, checking: false },
    password: { valid: false },
    passwordConfirm: { valid: false },
    phone: { valid: true } // 선택사항이므로 기본값 true
  };

  let idCheckTimeout;
  let phoneCheckTimeout;

  // 아이디 실시간 검증
  userIdInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    clearTimeout(idCheckTimeout);

    if (!value) {
      resetFieldState(userIdInput, 'userIdMessage', '영문, 숫자 조합 3~20자');
      formState.userId.valid = false;
      updateSubmitButton();
      return;
    }

    if (value.length < 3) {
      setFieldError(userIdInput, 'userIdMessage', '아이디는 3자 이상이어야 합니다');
      formState.userId.valid = false;
      updateSubmitButton();
      return;
    }

    if (!/^[a-zA-Z0-9]{3,20}$/.test(value)) {
      setFieldError(userIdInput, 'userIdMessage', '영문과 숫자만 사용 가능합니다');
      formState.userId.valid = false;
      updateSubmitButton();
      return;
    }

    setFieldChecking(userIdInput, 'userIdMessage', '아이디 확인 중...', '⏳');
    formState.userId.checking = true;

    idCheckTimeout = setTimeout(() => checkUserId(value), 500);
  });

  // 비밀번호 실시간 검증
  passwordInput.addEventListener('input', validatePasswords);
  passwordConfirmInput.addEventListener('input', validatePasswords);

  // 전화번호 실시간 검증
  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');

    // 전화번호 포맷팅
    if (value.length <= 3) {
      value = value;
    } else if (value.length <= 7) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else {
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }

    e.target.value = value;
    clearTimeout(phoneCheckTimeout);
    hideOrdersPreview();
    searchButton.style.display = 'none';

    if (!value) {
      resetFieldState(phoneInput, 'userPhoneMessage', '기존 주문 내역 연동을 위해 입력해주세요');
      formState.phone.valid = true; // 선택사항이므로 비어있어도 유효
      updateSubmitButton();
      return;
    }

    if (value.length < 13) {
      setFieldError(phoneInput, 'userPhoneMessage', '올바른 전화번호 형식을 입력해주세요');
      formState.phone.valid = false;
      updateSubmitButton();
      return;
    }

    setFieldChecking(phoneInput, 'userPhoneMessage', '전화번호 확인 중...', '⏳');
    formState.phone.checking = true;

    phoneCheckTimeout = setTimeout(() => checkPhoneNumber(value), 500);
  });

  // 폼 제출 처리
  form.addEventListener('submit', handleSignupSubmit);

  // 아이디 중복 확인
  async function checkUserId(userId) {
    try {
      const response = await fetch('/api/users/check-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });

      const data = await response.json();

      if (data.available) {
        setFieldValid(userIdInput, 'userIdMessage', '사용 가능한 아이디입니다', '✅');
        formState.userId.valid = true;
      } else {
        setFieldError(userIdInput, 'userIdMessage', '이미 사용 중인 아이디입니다', '❌');
        formState.userId.valid = false;
      }
    } catch (error) {
      setFieldError(userIdInput, 'userIdMessage', '아이디 확인 중 오류가 발생했습니다', '❌');
      formState.userId.valid = false;
    } finally {
      formState.userId.checking = false;
      updateSubmitButton();
    }
  }

  // 전화번호 중복 확인
  async function checkPhoneNumber(phone) {
    try {
      const response = await fetch('/api/users/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (data.available) {
        setFieldValid(phoneInput, 'userPhoneMessage', '사용 가능한 전화번호입니다', '✅');
        searchButton.style.display = 'block';
        formState.phone.valid = true;
      } else {
        setFieldError(phoneInput, 'userPhoneMessage', '이미 등록된 전화번호입니다', '❌');
        formState.phone.valid = false;
      }
    } catch (error) {
      setFieldError(phoneInput, 'userPhoneMessage', '전화번호 확인 중 오류가 발생했습니다', '❌');
      formState.phone.valid = false;
    } finally {
      formState.phone.checking = false;
      updateSubmitButton();
    }
  }

  // 비밀번호 검증
  function validatePasswords() {
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    // 비밀번호 검증
    if (!password) {
      resetFieldState(passwordInput, 'userPasswordMessage', '4자 이상 입력해주세요');
      formState.password.valid = false;
    } else if (password.length < 4) {
      setFieldError(passwordInput, 'userPasswordMessage', '비밀번호는 4자 이상이어야 합니다', '❌');
      formState.password.valid = false;
    } else {
      setFieldValid(passwordInput, 'userPasswordMessage', '사용 가능한 비밀번호입니다', '✅');
      formState.password.valid = true;
    }

    // 비밀번호 확인 검증
    if (!passwordConfirm) {
      resetFieldState(passwordConfirmInput, 'userPasswordConfirmMessage', '비밀번호가 일치해야 합니다');
      formState.passwordConfirm.valid = false;
    } else if (password !== passwordConfirm) {
      setFieldError(passwordConfirmInput, 'userPasswordConfirmMessage', '비밀번호가 일치하지 않습니다', '❌');
      formState.passwordConfirm.valid = false;
    } else {
      setFieldValid(passwordConfirmInput, 'userPasswordConfirmMessage', '비밀번호가 일치합니다', '✅');
      formState.passwordConfirm.valid = true;
    }

    updateSubmitButton();
  }

  // 필드 상태 설정 함수들
  function setFieldValid(input, messageId, message, icon = '') {
    input.className = 'form-input valid';
    document.getElementById(input.id + 'Status').textContent = icon;
    document.getElementById(messageId).textContent = message;
    document.getElementById(messageId).className = 'field-message valid';
  }

  function setFieldError(input, messageId, message, icon = '') {
    input.className = 'form-input invalid';
    document.getElementById(input.id + 'Status').textContent = icon;
    document.getElementById(messageId).textContent = message;
    document.getElementById(messageId).className = 'field-message invalid';
  }

  function setFieldChecking(input, messageId, message, icon = '') {
    input.className = 'form-input checking';
    document.getElementById(input.id + 'Status').textContent = icon;
    document.getElementById(messageId).textContent = message;
    document.getElementById(messageId).className = 'field-message checking';
  }

  function resetFieldState(input, messageId, message) {
    input.className = 'form-input';
    document.getElementById(input.id + 'Status').textContent = '';
    document.getElementById(messageId).textContent = message;
    document.getElementById(messageId).className = 'field-message';
  }

  // 제출 버튼 상태 업데이트
  function updateSubmitButton() {
    const isValid = 
      formState.userId.valid &&
      formState.password.valid &&
      formState.passwordConfirm.valid &&
      formState.phone.valid &&
      !formState.userId.checking &&
      !formState.phone.checking;

    signupButton.disabled = !isValid;
  }

  // 폼 제출 처리
  async function handleSignupSubmit(e) {
    e.preventDefault();

    if (signupButton.disabled) return;

    const formData = {
      id: userIdInput.value.trim(),
      pw: passwordInput.value.trim(),
      name: nameInput.value.trim() || null,
      phone: phoneInput.value.trim() || null
    };

    signupButton.classList.add('loading');

    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showNotification('🎉 회원가입이 완료되었습니다!', 'success');

        // 전화번호가 있는 경우 게스트 주문 연동
        if (formData.phone) {
          try {
            await convertGuestOrders(formData.phone, formData.id);
          } catch (conversionError) {
            console.warn('게스트 주문 연동 실패:', conversionError);
          }
        }

        setTimeout(() => {
          renderLogin();
        }, 2000);
      } else {
        throw new Error(data.error || '회원가입에 실패했습니다');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      showNotification(error.message || '회원가입 중 오류가 발생했습니다', 'error');
    } finally {
      signupButton.classList.remove('loading');
    }
  }

  // 게스트 주문 연동
  async function convertGuestOrders(phone, userId) {
    try {
      const response = await fetch(`/api/guests/${phone}/convert-to-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ 게스트 주문 ${data.transferredOrders}건이 회원으로 이전됨`);
        showNotification('🔄 기존 주문 내역이 연동되었습니다!', 'success');
      }
    } catch (error) {
      console.error('게스트 주문 연동 실패:', error);
      throw error;
    }
  }
}

// 기존 주문 검색
async function searchExistingOrders() {
  const phoneInput = document.getElementById('userPhone');
  const phone = phoneInput.value.trim();

  if (!phone || phone.length < 13) {
    showNotification('올바른 전화번호를 입력해주세요', 'error');
    return;
  }

  const searchButton = document.getElementById('searchOrdersButton');
  const originalText = searchButton.innerHTML;

  searchButton.innerHTML = `
    <div class="loading-spinner" style="width: 16px; height: 16px;"></div>
    검색 중...
  `;
  searchButton.disabled = true;

  try {
    const response = await fetch(`/api/orders/guest-phone/${phone}`);
    const data = await response.json();

    if (data.success && data.orders && data.orders.length > 0) {
      const stats = {
        totalOrders: data.orders.length,
        totalAmount: data.orders.reduce((sum, order) => sum + (order.final_amount || 0), 0)
      };

      showOrdersPreview(data.orders, stats);
      showNotification(`📱 ${data.orders.length}건의 주문 내역을 찾았습니다!`, 'success');
    } else {
      hideOrdersPreview();
      showNotification('해당 전화번호로 등록된 주문 내역이 없습니다', 'info');
    }
  } catch (error) {
    console.error('주문내역 검색 실패:', error);
    showNotification('주문내역 검색 중 오류가 발생했습니다', 'error');
    hideOrdersPreview();
  } finally {
    searchButton.innerHTML = originalText;
    searchButton.disabled = false;
  }
}

// 주문 내역 미리보기 표시
function showOrdersPreview(orders, stats) {
  const preview = document.getElementById('ordersPreview');
  const list = document.getElementById('ordersList');
  const count = document.getElementById('ordersCount');
  const summary = document.getElementById('ordersSummary');

  count.textContent = `${orders.length}건`;

  const ordersHtml = orders.slice(0, 5).map(order => `
    <div class="order-item">
      <div class="order-info">
        <h4>${order.store_name || '매장 정보 없음'}</h4>
        <p>${new Date(order.payment_date || order.order_date).toLocaleDateString('ko-KR')}</p>
      </div>
      <div class="order-amount">${(order.final_amount || 0).toLocaleString()}원</div>
    </div>
  `).join('');

  list.innerHTML = ordersHtml + 
    (orders.length > 5 ? `<div style="text-align: center; margin-top: 12px; color: #6b7280; font-size: 12px;">외 ${orders.length - 5}건 더</div>` : '');

  summary.innerHTML = `
    <div class="summary-card">
      <h4>총 주문</h4>
      <p>${stats.totalOrders}회</p>
    </div>
    <div class="summary-card">
      <h4>총 금액</h4>
      <p>${stats.totalAmount.toLocaleString()}원</p>
    </div>
  `;

  preview.style.display = 'block';
}

// 주문 내역 미리보기 숨김
function hideOrdersPreview() {
  const preview = document.getElementById('ordersPreview');
  if (preview) {
    preview.style.display = 'none';
  }
}

// 비밀번호 표시/숨김 토글
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector('.toggle-password');
  const eyeOpen = button.querySelector('.eye-open');
  const eyeClosed = button.querySelector('.eye-closed');

  if (input.type === 'password') {
    input.type = 'text';
    eyeOpen.style.display = 'none';
    eyeClosed.style.display = 'block';
  } else {
    input.type = 'password';
    eyeOpen.style.display = 'block';
    eyeClosed.style.display = 'none';
  }
}

// 알림 표시
function showNotification(message, type = 'info') {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">${icons[type]}</span>
      <span>${message}</span>
    </div>
  `;

  notification.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type]};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    animation: slideDown 0.4s ease-out;
    max-width: 90%;
  `;

  // 애니메이션 스타일 추가
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideDown {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      @keyframes slideUp {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, -20px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideUp 0.4s ease-out forwards';
    setTimeout(() => {
      notification.remove();
    }, 400);
  }, 3000);
}

// 전역 함수로 등록
window.renderSignUp = renderSignUp;
window.togglePassword = togglePassword;
window.searchExistingOrders = searchExistingOrders;