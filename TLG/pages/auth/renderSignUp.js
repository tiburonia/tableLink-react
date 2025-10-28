function renderSignUp() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        overflow-x: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
      }

      .signup-page {
        height: 794px;
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .signup-container {
        background: white;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        min-height: 100vh;
        position: relative;
        overflow-y: auto;
      }

      .signup-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 60px 24px 40px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .signup-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.1"><circle cx="30" cy="30" r="1.5"/></g></svg>') repeat;
        animation: float 15s ease-in-out infinite;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      .logo-container {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 70px;
        height: 70px;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        border-radius: 18px;
        margin-bottom: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        position: relative;
        z-index: 1;
      }

      .logo-text {
        color: white;
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.5px;
      }

      .signup-title {
        font-size: 28px;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
        position: relative;
        z-index: 1;
      }

      .signup-subtitle {
        color: rgba(255, 255, 255, 0.9);
        font-size: 15px;
        font-weight: 400;
        position: relative;
        z-index: 1;
      }

      .form-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 24px;
      }

      .form-group {
        position: relative;
      }

      .form-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
        letter-spacing: -0.2px;
      }

      .required-mark {
        color: #ef4444;
        margin-left: 2px;
      }

      .input-container {
        position: relative;
      }

      .form-input {
        width: 100%;
        padding: 14px 16px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        font-size: 16px;
        background: #fafbfc;
        transition: all 0.2s ease;
        outline: none;
        -webkit-appearance: none;
      }

      .form-input:focus {
        border-color: #667eea;
        background: white;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.08);
      }

      .form-input.success {
        border-color: #10b981;
        background: #f0fdf4;
      }

      .form-input.error {
        border-color: #ef4444;
        background: #fef2f2;
        animation: shake 0.3s ease-in-out;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
      }

      .input-action-btn {
        position: absolute;
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 7px;
        padding: 7px 14px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .input-action-btn:hover {
        transform: translateY(-50%) scale(1.02);
        box-shadow: 0 3px 10px rgba(102, 126, 234, 0.25);
      }

      .input-action-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
        transform: translateY(-50%);
        opacity: 0.6;
      }

      .check-btn {
        width: 100%;
        padding: 11px 18px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 9px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 10px;
      }

      .check-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 5px 14px rgba(16, 185, 129, 0.25);
      }

      .check-btn:active {
        transform: translateY(0);
      }

      .check-btn:disabled {
        background: #d1d5db;
        color: #9ca3af;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
        opacity: 0.6;
      }

      .input-status {
        margin-top: 6px;
        font-size: 12px;
        font-weight: 500;
        min-height: 18px;
        display: flex;
        align-items: center;
        gap: 5px;
        letter-spacing: -0.1px;
      }

      .input-status.success {
        color: #10b981;
      }

      .input-status.error {
        color: #ef4444;
      }

      .input-status.info {
        color: #667eea;
      }

      .status-icon {
        width: 14px;
        height: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .form-hint {
        font-size: 11px;
        color: #6b7280;
        margin-top: 4px;
        line-height: 1.4;
        letter-spacing: -0.1px;
      }

      .guest-orders-info {
        margin-top: 12px;
        padding: 14px;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 1.5px solid #38bdf8;
        border-radius: 10px;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .guest-orders-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        color: #0284c7;
        font-weight: 600;
        font-size: 13px;
      }

      .guest-orders-header svg {
        width: 18px;
        height: 18px;
      }

      .guest-orders-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .guest-order-item {
        background: white;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #e0f2fe;
        font-size: 12px;
      }

      .guest-order-store {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .guest-order-details {
        color: #6b7280;
        font-size: 11px;
        line-height: 1.5;
      }

      .guest-order-price {
        color: #0284c7;
        font-weight: 600;
        margin-top: 4px;
      }

      .guest-orders-notice {
        margin-top: 10px;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 6px;
        font-size: 11px;
        color: #0369a1;
        line-height: 1.4;
      }

      .password-strength {
        margin-top: 10px;
      }

      .strength-bar-container {
        display: flex;
        gap: 3px;
        margin-bottom: 7px;
      }

      .strength-segment {
        height: 3px;
        flex: 1;
        background: #e5e7eb;
        border-radius: 1.5px;
        transition: all 0.2s ease;
      }

      .strength-segment.active {
        background: #667eea;
      }

      .strength-segment.weak {
        background: #ef4444;
      }

      .strength-segment.fair {
        background: #f59e0b;
      }

      .strength-segment.good {
        background: #10b981;
      }

      .strength-segment.strong {
        background: #059669;
      }

      .strength-text {
        font-size: 11px;
        font-weight: 500;
        color: #6b7280;
        letter-spacing: -0.1px;
      }

      .signup-btn {
        width: 100%;
        padding: 16px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
        margin-top: 12px;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
      }

      .signup-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
        transition: left 0.4s ease;
      }

      .signup-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.35);
      }

      .signup-btn:hover::before {
        left: 100%;
      }

      .signup-btn:active {
        transform: translateY(0);
      }

      .signup-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .btn-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .btn-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .login-link {
        text-align: center;
        padding: 24px;
        border-top: 1px solid #f3f4f6;
        background: #fafbfc;
      }

      .login-text {
        color: #6b7280;
        font-size: 13px;
        margin-bottom: 6px;
        letter-spacing: -0.1px;
      }

      .login-btn {
        background: none;
        border: none;
        color: #667eea;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
        transition: color 0.2s ease;
        letter-spacing: -0.1px;
      }

      .login-btn:hover {
        color: #5568d3;
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(3px);
      }

      .loading-card {
        background: white;
        padding: 28px;
        border-radius: 14px;
        text-align: center;
        max-width: 280px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      }

      .loading-spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 18px;
      }

      .success-page {
        text-align: center;
        padding: 60px 24px;
      }

      .success-icon {
        width: 70px;
        height: 70px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        color: white;
        font-size: 30px;
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
      }

      .success-title {
        font-size: 26px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 10px;
        letter-spacing: -0.5px;
      }

      .success-message {
        color: #6b7280;
        font-size: 15px;
        margin-bottom: 28px;
        line-height: 1.6;
        letter-spacing: -0.2px;
      }

      /* 반응형 디자인 */
      @media (max-width: 640px) {
        .signup-header {
          padding: 50px 20px 35px;
        }

        .logo-container {
          width: 60px;
          height: 60px;
        }

        .logo-text {
          font-size: 24px;
        }

        .signup-title {
          font-size: 26px;
        }

        .signup-subtitle {
          font-size: 14px;
        }

        .form-container {
          padding: 20px;
          gap: 18px;
        }

        .form-input {
          padding: 13px 14px;
        }
      }

      /* 세로 화면 대응 */
      @media (max-height: 800px) {
        .signup-header {
          padding: 50px 24px 35px;
        }

        .logo-container {
          width: 60px;
          height: 60px;
          margin-bottom: 16px;
        }

        .logo-text {
          font-size: 24px;
        }

        .signup-title {
          font-size: 26px;
        }

        .form-container {
          gap: 16px;
          padding: 20px;
        }
      }

      @media (max-height: 700px) {
        .signup-header {
          padding: 40px 24px 30px;
        }

        .form-container {
          gap: 14px;
          padding: 18px;
        }

        .form-group {
          margin-bottom: 0;
        }
      }

      /* 접근성 개선 */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* iOS 스타일 */
      @supports (-webkit-touch-callout: none) {
        .form-input {
          -webkit-appearance: none;
          appearance: none;
        }
      }
    </style>

    <div class="signup-page">
      <div class="signup-container">
        <div class="signup-header">
          <div class="logo-container">
            <div class="logo-text">TL</div>
          </div>
          <h1 class="signup-title">회원가입</h1>
          <p class="signup-subtitle">TableLink와 함께 새로운 주문 경험을 시작하세요</p>
        </div>

        <form id="signupForm" class="form-container">
          <div class="form-group">
            <label class="form-label" for="userId">
              아이디<span class="required-mark">*</span>
            </label>
            <div class="input-container">
              <input 
                type="text" 
                id="userId" 
                class="form-input" 
                placeholder="영문, 숫자 조합 (3-20자)"
                autocomplete="username"
                maxlength="20"
              >
              <button type="button" class="input-action-btn" id="checkIdBtn" disabled>
                중복확인
              </button>
            </div>
            <div class="input-status" id="userIdStatus"></div>
            <div class="form-hint">영문과 숫자만 사용 가능합니다 (중복확인 필요)</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="userPassword">
              비밀번호<span class="required-mark">*</span>
            </label>
            <div class="input-container">
              <input 
                type="password" 
                id="userPassword" 
                class="form-input" 
                placeholder="안전한 비밀번호를 입력하세요"
                autocomplete="new-password"
              >
            </div>
            <div class="password-strength">
              <div class="strength-bar-container">
                <div class="strength-segment"></div>
                <div class="strength-segment"></div>
                <div class="strength-segment"></div>
                <div class="strength-segment"></div>
              </div>
              <div class="strength-text" id="strengthText">비밀번호를 입력해주세요</div>
            </div>
            <div class="input-status" id="userPasswordStatus"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="userPasswordConfirm">
              비밀번호 확인<span class="required-mark">*</span>
            </label>
            <div class="input-container">
              <input 
                type="password" 
                id="userPasswordConfirm" 
                class="form-input" 
                placeholder="비밀번호를 다시 입력하세요"
                autocomplete="new-password"
              >
            </div>
            <div class="input-status" id="userPasswordConfirmStatus"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="userName">이름</label>
            <div class="input-container">
              <input 
                type="text" 
                id="userName" 
                class="form-input" 
                placeholder="이름을 입력하세요 (선택사항)"
                autocomplete="name"
                maxlength="20"
              >
            </div>
            <div class="input-status" id="userNameStatus"></div>
            <div class="form-hint">실명을 입력하시면 더 나은 서비스를 제공받을 수 있습니다</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="userPhone">전화번호</label>
            <div class="input-container">
              <input 
                type="tel" 
                id="userPhone" 
                class="form-input" 
                placeholder="010-1234-5678 (선택사항)"
                autocomplete="tel"
                maxlength="13"
              >
              <button type="button" class="input-action-btn" id="checkPhoneBtn" style="display: none;" disabled>
                중복확인
              </button>
            </div>
            <div class="input-status" id="userPhoneStatus"></div>
            <div class="form-hint">전화번호를 등록하시면 주문 내역 연동 및 알림 서비스를 받을 수 있습니다 (중복확인 필요)</div>
            <div id="guestOrdersContainer"></div>
          </div>

          <button type="submit" class="signup-btn" id="signupBtn" disabled>
            <div class="btn-content">
              <span class="btn-text">회원가입 완료</span>
              <div class="btn-spinner" style="display: none;"></div>
            </div>
          </button>
        </form>

        <div class="login-link">
          <p class="login-text" id="goToLoginBtn">이미 계정이 있으신가요?</p>
          <button type="button" class="login-btn" id="goToLoginBtn">로그인하기</button>
        </div>
      </div>
    </div>

    <div class="loading-overlay" id="loadingOverlay">
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <h3>회원가입 처리중...</h3>
        <p>잠시만 기다려주세요</p>
      </div>
    </div>
  `;

  // DOM 요소 참조 (안전한 확인)
  const elements = {
    form: document.getElementById('signupForm'),
    userId: document.getElementById('userId'),
    userPassword: document.getElementById('userPassword'),
    userPasswordConfirm: document.getElementById('userPasswordConfirm'),
    userName: document.getElementById('userName'),
    userPhone: document.getElementById('userPhone'),
    checkIdBtn: document.getElementById('checkIdBtn'),
    checkPhoneBtn: document.getElementById('checkPhoneBtn'),
    signupBtn: document.getElementById('signupBtn'),
    goToLoginBtn: document.getElementById('goToLoginBtn'),
    loadingOverlay: document.getElementById('loadingOverlay')
  };

  // DOM 요소들이 모두 존재하는지 확인
  const requiredElements = ['form', 'userId', 'userPassword', 'userPasswordConfirm', 'userName', 'userPhone', 'signupBtn', 'goToLoginBtn', 'loadingOverlay'];
  const missingElements = requiredElements.filter(key => !elements[key]);
  
  if (missingElements.length > 0) {
    console.error('❌ 필수 DOM 요소를 찾을 수 없음:', missingElements);
    return;
  }

  // 유효성 검사 상태
  const validation = {
    userId: { isValid: false },
    password: { isValid: false },
    passwordConfirm: { isValid: false },
    name: { isValid: true }, // 선택사항이므로 기본 true
    phone: { isValid: true } // 선택사항이므로 기본 true
  };

  // 유틸리티 함수들
  const utils = {
    showStatus(fieldId, message, type, icon = '') {
      const statusEl = document.getElementById(`${fieldId}Status`);
      const inputEl = document.getElementById(fieldId);

      statusEl.innerHTML = icon ? `<span class="status-icon">${icon}</span>${message}` : message;
      statusEl.className = `input-status ${type}`;

      if (inputEl) {
        inputEl.className = `form-input ${type}`;
      }
    },

    validateUserId(userId) {
      if (!userId) return { isValid: false, message: '' };
      if (userId.length < 3) return { isValid: false, message: '아이디는 3자 이상이어야 합니다' };
      if (userId.length > 20) return { isValid: false, message: '아이디는 20자 이하여야 합니다' };
      if (!/^[a-zA-Z0-9]+$/.test(userId)) return { isValid: false, message: '영문과 숫자만 사용 가능합니다' };
      return { isValid: true, message: '중복 확인을 해주세요' };
    },

    validatePassword(password) {
      if (!password) return { isValid: false, message: '', strength: 0 };
      if (password.length < 4) return { isValid: false, message: '비밀번호는 최소 4자 이상이어야 합니다', strength: 0 };

      let strength = 0;
      if (password.length >= 4) strength++;
      if (password.length >= 8) strength++;
      if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;

      return { isValid: true, message: '사용 가능한 비밀번호입니다', strength };
    },

    validateName(name) {
      if (!name) return { isValid: true, message: '' };
      if (name.length < 2) return { isValid: false, message: '이름은 2자 이상 입력해주세요' };
      if (name.length > 20) return { isValid: false, message: '이름은 20자 이하로 입력해주세요' };
      if (!/^[가-힣a-zA-Z\s]+$/.test(name)) return { isValid: false, message: '한글, 영문만 사용 가능합니다' };
      return { isValid: true, message: '올바른 이름입니다' };
    },

    validatePhone(phone) {
      if (!phone) return { isValid: true, message: '' };
      if (!/^010-\d{4}-\d{4}$/.test(phone)) return { isValid: false, message: '올바른 전화번호 형식이 아닙니다' };
      return { isValid: true, message: '중복 확인을 해주세요' };
    },

    formatPhone(value) {
      const numbers = value.replace(/[^\d]/g, '');
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    },

    updatePasswordStrength(strength) {
      const segments = document.querySelectorAll('.strength-segment');
      const strengthText = document.getElementById('strengthText');

      const levels = ['', 'weak', 'fair', 'good', 'strong'];
      const texts = ['비밀번호를 입력해주세요', '약함', '보통', '좋음', '매우 강함'];

      segments.forEach((segment, index) => {
        segment.className = 'strength-segment';
        if (index < strength) {
          segment.classList.add('active', levels[strength] || '');
        }
      });

      strengthText.textContent = `보안 강도: ${texts[strength]}`;
    },

    updateSubmitButton() {
      // 필수 필드: userId, password, passwordConfirm이 모두 유효해야 함
      // 선택 필드: name, phone은 입력했다면 유효해야 함
      const requiredFieldsValid = validation.userId.isValid && 
                                  validation.password.isValid && 
                                  validation.passwordConfirm.isValid;
      
      // 아이디 중복확인이 필요한 경우 체크
      const userIdChecked = !validation.userId.isValid || validation.userId.isChecked;
      
      // 전화번호가 입력된 경우 중복확인 체크
      const phoneValue = elements.userPhone.value.trim();
      const phoneChecked = !phoneValue || !validation.phone.isValid || validation.phone.isChecked;
      
      const allValid = requiredFieldsValid && userIdChecked && phoneChecked && 
                       validation.name.isValid && validation.phone.isValid;
      
      elements.signupBtn.disabled = !allValid;
    },

    showLoading(show = true) {
      const btnText = elements.signupBtn.querySelector('.btn-text');
      const btnSpinner = elements.signupBtn.querySelector('.btn-spinner');

      if (show) {
        btnText.style.display = 'none';
        btnSpinner.style.display = 'block';
        elements.loadingOverlay.style.display = 'flex';
        elements.signupBtn.disabled = true;
      } else {
        btnText.style.display = 'block';
        btnSpinner.style.display = 'none';
        elements.loadingOverlay.style.display = 'none';
        utils.updateSubmitButton();
      }
    },

    displayGuestOrders(orders, orderCount) {
      const container = document.getElementById('guestOrdersContainer');
      if (!container) return;

      const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '어제';
        if (diffDays < 7) return `${diffDays}일 전`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
        return `${Math.floor(diffDays / 30)}개월 전`;
      };

      const ordersHTML = orders.slice(0, 3).map(order => `
        <div class="guest-order-item">
          <div class="guest-order-store">${order.store_name || '매장'}</div>
          <div class="guest-order-details">
            ${order.menu_items || '메뉴 정보 없음'} · ${order.item_count || 0}개 항목
          </div>
          <div class="guest-order-details">${formatDate(order.created_at)}</div>
          <div class="guest-order-price">₩${parseInt(order.total_price || 0).toLocaleString()}</div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="guest-orders-info">
          <div class="guest-orders-header">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>기존 주문 내역 ${orderCount}건 발견</span>
          </div>
          <div class="guest-orders-list">
            ${ordersHTML}
          </div>
          ${orderCount > 3 ? `<div class="guest-order-details" style="text-align: center; margin-top: 8px; color: #0284c7;">외 ${orderCount - 3}건</div>` : ''}
          <div class="guest-orders-notice">
            ✨ 회원가입 시 모든 주문 내역이 자동으로 연동됩니다
          </div>
        </div>
      `;
    }
  };

  // 이벤트 리스너 설정
  const setupEventListeners = () => {
    // 아이디 유효성 검사
    if (elements.userId) {
      elements.userId.addEventListener('input', () => {
      const userId = elements.userId.value.trim();
      const result = utils.validateUserId(userId);

      validation.userId.isValid = result.isValid;
      validation.userId.isChecked = false;
      
      if (elements.checkIdBtn) {
        elements.checkIdBtn.disabled = !result.isValid;
      }

      if (result.message) {
        utils.showStatus('userId', result.message, result.isValid ? 'info' : 'error', 
                        result.isValid ? '⏳' : '❌');
      } else {
        utils.showStatus('userId', '', '');
      }

      utils.updateSubmitButton();
      });
    } else {
      console.error('❌ userId 요소를 찾을 수 없음');
    }

    // 아이디 중복 확인
    if (elements.checkIdBtn) {
      elements.checkIdBtn.addEventListener('click', async () => {
      const userId = elements.userId.value.trim();
      const result = utils.validateUserId(userId);

      if (!result.isValid) {
        utils.showStatus('userId', result.message, 'error', '❌');
        return;
      }

      elements.checkIdBtn.disabled = true;
      elements.checkIdBtn.textContent = '확인중...';

      try {
        const response = await fetch('/api/auth/users/check-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (data.available) {
            utils.showStatus('userId', '사용 가능한 아이디입니다', 'success', '✅');
            validation.userId.isChecked = true;
          } else {
            utils.showStatus('userId', '이미 사용중인 아이디입니다', 'error', '❌');
            validation.userId.isChecked = false;
          }
        } else {
          throw new Error(data.error || '중복 확인에 실패했습니다');
        }
      } catch (error) {
        console.error('아이디 중복 확인 오류:', error);
        utils.showStatus('userId', '중복 확인 중 오류가 발생했습니다', 'error', '❌');
        validation.userId.isChecked = false;
      } finally {
        elements.checkIdBtn.disabled = false;
        elements.checkIdBtn.textContent = '아이디 중복확인';
        utils.updateSubmitButton();
      }
      });
    } else {
      console.error('❌ checkIdBtn 요소를 찾을 수 없음');
    }

    // 비밀번호 유효성 검사
    if (elements.userPassword) {
      elements.userPassword.addEventListener('input', () => {
      const password = elements.userPassword.value;
      const result = utils.validatePassword(password);

      validation.password.isValid = result.isValid;
      utils.updatePasswordStrength(result.strength);

      if (result.message) {
        utils.showStatus('userPassword', result.message, result.isValid ? 'success' : 'error',
                        result.isValid ? '✅' : '❌');
      } else {
        utils.showStatus('userPassword', '', '');
      }

      // 비밀번호 확인 재검사
      if (elements.userPasswordConfirm.value) {
        const confirmPassword = elements.userPasswordConfirm.value;
        if (password !== confirmPassword) {
          utils.showStatus('userPasswordConfirm', '비밀번호가 일치하지 않습니다', 'error', '❌');
          validation.passwordConfirm.isValid = false;
        } else {
          utils.showStatus('userPasswordConfirm', '비밀번호가 일치합니다', 'success', '✅');
          validation.passwordConfirm.isValid = true;
        }
      }

      utils.updateSubmitButton();
      });
    } else {
      console.error('❌ userPassword 요소를 찾을 수 없음');
    }

    // 비밀번호 확인
    if (elements.userPasswordConfirm) {
      elements.userPasswordConfirm.addEventListener('input', () => {
      const password = elements.userPassword.value;
      const confirmPassword = elements.userPasswordConfirm.value;

      if (!confirmPassword) {
        utils.showStatus('userPasswordConfirm', '', '');
        validation.passwordConfirm.isValid = false;
      } else if (password !== confirmPassword) {
        utils.showStatus('userPasswordConfirm', '비밀번호가 일치하지 않습니다', 'error', '❌');
        validation.passwordConfirm.isValid = false;
      } else {
        utils.showStatus('userPasswordConfirm', '비밀번호가 일치합니다', 'success', '✅');
        validation.passwordConfirm.isValid = true;
      }

      utils.updateSubmitButton();
      });
    } else {
      console.error('❌ userPasswordConfirm 요소를 찾을 수 없음');
    }

    // 이름 유효성 검사
    if (elements.userName) {
      elements.userName.addEventListener('input', () => {
      const name = elements.userName.value.trim();
      const result = utils.validateName(name);

      validation.name.isValid = result.isValid;

      if (result.message) {
        utils.showStatus('userName', result.message, result.isValid ? 'success' : 'error',
                        result.isValid ? '✅' : '❌');
      } else {
        utils.showStatus('userName', '', '');
      }

      utils.updateSubmitButton();
      });
    } else {
      console.error('❌ userName 요소를 찾을 수 없음');
    }

    // 전화번호 포매팅 및 유효성 검사
    if (elements.userPhone) {
      let phoneCheckTimeout;
      elements.userPhone.addEventListener('input', async (e) => {
      const formatted = utils.formatPhone(e.target.value);
      e.target.value = formatted;

      const result = utils.validatePhone(formatted);
      validation.phone.isValid = result.isValid;
      validation.phone.isChecked = false;

      if (elements.checkPhoneBtn) {
        elements.checkPhoneBtn.style.display = formatted ? 'block' : 'none';
        elements.checkPhoneBtn.disabled = !result.isValid;
      }

      if (result.message) {
        utils.showStatus('userPhone', result.message, result.isValid ? 'info' : 'error',
                        result.isValid ? '⏳' : '❌');
      } else {
        utils.showStatus('userPhone', '', '');
      }

      // 게스트 주문 조회 (디바운스)
      clearTimeout(phoneCheckTimeout);
      const guestOrdersContainer = document.getElementById('guestOrdersContainer');
      
      if (result.isValid && formatted.length === 13) {
        phoneCheckTimeout = setTimeout(async () => {
          try {
            const response = await fetch('/api/auth/users/check-guest-orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: formatted })
            });

            const data = await response.json();

            if (data.success && data.hasOrders) {
              utils.displayGuestOrders(data.orders, data.orderCount);
            } else {
              guestOrdersContainer.innerHTML = '';
            }
          } catch (error) {
            console.error('게스트 주문 조회 오류:', error);
          }
        }, 500);
      } else {
        guestOrdersContainer.innerHTML = '';
      }

      utils.updateSubmitButton();
      });
    } else {
      console.error('❌ userPhone 요소를 찾을 수 없음');
    }

    // 전화번호 중복 확인
    if (elements.checkPhoneBtn) {
      elements.checkPhoneBtn.addEventListener('click', async () => {
      const phone = elements.userPhone.value.trim();
      const result = utils.validatePhone(phone);

      if (!result.isValid) {
        utils.showStatus('userPhone', result.message, 'error', '❌');
        return;
      }

      elements.checkPhoneBtn.disabled = true;
      elements.checkPhoneBtn.textContent = '확인중...';

      try {
        const response = await fetch('/api/auth/users/check-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (data.available) {
            utils.showStatus('userPhone', '사용 가능한 전화번호입니다', 'success', '✅');
            validation.phone.isChecked = true;
          } else {
            utils.showStatus('userPhone', '이미 등록된 전화번호입니다', 'error', '❌');
            validation.phone.isChecked = false;
          }
        } else {
          throw new Error(data.error || '중복 확인에 실패했습니다');
        }
      } catch (error) {
        console.error('전화번호 중복 확인 오류:', error);
        utils.showStatus('userPhone', '중복 확인 중 오류가 발생했습니다', 'error', '❌');
        validation.phone.isChecked = false;
      } finally {
        elements.checkPhoneBtn.disabled = false;
        elements.checkPhoneBtn.textContent = '전화번호 중복확인';
        utils.updateSubmitButton();
      }
      });
    } else {
      console.error('❌ checkPhoneBtn 요소를 찾을 수 없음');
    }

    // 폼 제출
    if (elements.form) {
      elements.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        id: elements.userId.value.trim(),
        pw: elements.userPassword.value,
        name: elements.userName.value.trim() || null,
        phone: elements.userPhone.value.trim() || null
      };

      utils.showLoading(true);

      try {
        const response = await fetch('/api/auth/users/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
          // 성공 페이지 표시
          main.innerHTML = `
            <div class="signup-page">
              <div class="signup-container">
                <div class="success-page">
                  <div class="success-icon">✓</div>
                  <h2 class="success-title">회원가입 완료!</h2>
                  <p class="success-message">${data.user.name || data.user.id}님, 환영합니다!</p>
                  <button class="primary-btn" id="goToLoginBtn">로그인하러 가기</button>
                </div>
              </div>
            </div>
          `;

          // 로그인 페이지로 이동 버튼 이벤트
          setTimeout(() => {
            const goToLoginBtn = document.getElementById('goToLoginBtn');
            if (goToLoginBtn) {
              goToLoginBtn.addEventListener('click', () => {
                console.log('🔄 로그인 페이지로 이동');
                if (typeof window.renderLogin === 'function') {
                  window.renderLogin();
                } else {
                  window.location.href = '/';
                }
              });
            }
          }, 100);
        } else {
          throw new Error(data.error || '회원가입에 실패했습니다');
        }
      } catch (error) {
        console.error('회원가입 오류:', error);
        utils.showLoading(false);
        alert(error.message || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
      });
    } else {
      console.error('❌ form 요소를 찾을 수 없음');
    }

    // 로그인 페이지로 이동
    if (elements.goToLoginBtn) {
      elements.goToLoginBtn.addEventListener('click', () => {
      if (typeof renderLogin === 'function') {
        renderLogin();
      } else if (typeof window.renderLogin === 'function') {
        window.renderLogin();
      } else {
        const script = document.createElement('script');
        script.src = '/TLG/pages/auth/renderLogin.js';
        script.onload = () => {
          if (typeof window.renderLogin === 'function') {
            window.renderLogin();
          } else {
            alert('로그인 페이지를 불러올 수 없습니다.');
          }
        };
        script.onerror = () => {
          alert('로그인 페이지를 불러올 수 없습니다.');
        };
        document.head.appendChild(script);
      }
      });
    } else {
      console.error('❌ goToLoginBtn 요소를 찾을 수 없음');
    }
  };

  // 초기화
  setupEventListeners();
  utils.updateSubmitButton();

  console.log('✅ 새로운 회원가입 화면 렌더링 완료');
}

// 전역 함수로 등록 (export도 함께 지원)
if (typeof window !== 'undefined') {
  window.renderSignUp = renderSignUp;
}

// ES6 모듈 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = renderSignUp;
} else if (typeof exports !== 'undefined') {
  exports.renderSignUp = renderSignUp;
}