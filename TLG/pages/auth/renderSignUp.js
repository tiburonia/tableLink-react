
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
        font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .signup-page {
        min-height: 100vh;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 20px;
        position: relative;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .signup-page::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><circle cx="30" cy="30" r="1"/></g></svg>') repeat;
        animation: float 20s ease-in-out infinite;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }

      .signup-container {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 24px;
        padding: 40px;
        width: 100%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        z-index: 1;
        margin: 20px 0;
      }

      .signup-header {
        text-align: center;
        margin-bottom: 40px;
      }

      .logo-container {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 20px;
        margin-bottom: 24px;
        box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
      }

      .logo-text {
        color: white;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -1px;
      }

      .signup-title {
        font-size: 32px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }

      .signup-subtitle {
        color: #64748b;
        font-size: 16px;
        font-weight: 400;
      }

      .form-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .form-group {
        position: relative;
      }

      .form-label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
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
        padding: 16px 20px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 16px;
        background: #fafafa;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
      }

      .form-input:focus {
        border-color: #6366f1;
        background: white;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        transform: translateY(-1px);
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
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      .input-action-btn {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .input-action-btn:hover {
        transform: translateY(-50%) scale(1.05);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }

      .input-action-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
        transform: translateY(-50%) scale(1);
      }

      .check-btn {
        width: 100%;
        padding: 12px 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 12px;
      }

      .check-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
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
      }

      .input-status {
        margin-top: 8px;
        font-size: 13px;
        font-weight: 500;
        min-height: 20px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .input-status.success {
        color: #10b981;
      }

      .input-status.error {
        color: #ef4444;
      }

      .input-status.info {
        color: #6366f1;
      }

      .status-icon {
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .form-hint {
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
        line-height: 1.4;
      }

      .password-strength {
        margin-top: 12px;
      }

      .strength-bar-container {
        display: flex;
        gap: 4px;
        margin-bottom: 8px;
      }

      .strength-segment {
        height: 4px;
        flex: 1;
        background: #e5e7eb;
        border-radius: 2px;
        transition: all 0.3s ease;
      }

      .strength-segment.active {
        background: #6366f1;
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
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
      }

      .signup-btn {
        width: 100%;
        padding: 18px 24px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        margin-top: 16px;
      }

      .signup-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
      }

      .signup-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4);
      }

      .signup-btn:hover::before {
        left: 100%;
      }

      .signup-btn:active {
        transform: translateY(0);
      }

      .signup-btn:disabled {
        opacity: 0.6;
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

      .login-link {
        text-align: center;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
      }

      .login-text {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 8px;
      }

      .login-btn {
        background: none;
        border: none;
        color: #6366f1;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
        transition: color 0.2s ease;
      }

      .login-btn:hover {
        color: #4f46e5;
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
      }

      .loading-card {
        background: white;
        padding: 32px;
        border-radius: 16px;
        text-align: center;
        max-width: 300px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }

      .success-page {
        text-align: center;
        padding: 40px;
      }

      .success-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
        color: white;
        font-size: 32px;
      }

      .success-title {
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 12px;
      }

      .success-message {
        color: #64748b;
        font-size: 16px;
        margin-bottom: 32px;
        line-height: 1.6;
      }

      /* 반응형 디자인 */
      @media (max-width: 640px) {
        .signup-page {
          padding: 10px;
        }

        .signup-container {
          padding: 24px;
          margin: 10px 0;
          max-height: 95vh;
        }

        .signup-title {
          font-size: 28px;
        }

        .form-input {
          padding: 14px 16px;
          font-size: 16px;
        }
      }

      /* 세로 화면 대응 */
      @media (max-height: 800px) {
        .signup-container {
          max-height: 95vh;
          padding: 30px;
        }

        .signup-header {
          margin-bottom: 30px;
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
          font-size: 28px;
        }
      }

      @media (max-height: 700px) {
        .signup-container {
          max-height: 98vh;
          padding: 20px;
        }

        .signup-header {
          margin-bottom: 20px;
        }

        .form-container {
          gap: 18px;
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
            </div>
            <div class="input-status" id="userIdStatus"></div>
            <div class="form-hint">영문과 숫자만 사용 가능합니다</div>
            <button type="button" class="check-btn" id="checkIdBtn" disabled>아이디 중복확인</button>
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
            </div>
            <div class="input-status" id="userPhoneStatus"></div>
            <div class="form-hint">전화번호를 등록하시면 주문 내역 연동 및 알림 서비스를 받을 수 있습니다</div>
            <button type="button" class="check-btn" id="checkPhoneBtn" style="display: none;" disabled>전화번호 중복확인</button>
          </div>

          <button type="submit" class="signup-btn" id="signupBtn" disabled>
            <div class="btn-content">
              <span class="btn-text">회원가입 완료</span>
              <div class="btn-spinner" style="display: none;"></div>
            </div>
          </button>
        </form>

        <div class="login-link">
          <p class="login-text">이미 계정이 있으신가요?</p>
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

  // DOM 요소 참조
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

  // 유효성 검사 상태
  const validation = {
    userId: { isValid: false, isChecked: false },
    password: { isValid: false },
    passwordConfirm: { isValid: false },
    name: { isValid: true }, // 선택사항이므로 기본 true
    phone: { isValid: true, isChecked: false } // 선택사항이므로 기본 true
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
      const allValid = Object.values(validation).every(field => field.isValid);
      const requiredChecked = validation.userId.isChecked && 
                            (elements.userPhone.value ? validation.phone.isChecked : true);
      
      elements.signupBtn.disabled = !(allValid && requiredChecked);
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
    }
  };

  // 이벤트 리스너 설정
  const setupEventListeners = () => {
    // 아이디 유효성 검사
    elements.userId.addEventListener('input', () => {
      const userId = elements.userId.value.trim();
      const result = utils.validateUserId(userId);
      
      validation.userId.isValid = result.isValid;
      validation.userId.isChecked = false;
      elements.checkIdBtn.disabled = !result.isValid;
      
      if (result.message) {
        utils.showStatus('userId', result.message, result.isValid ? 'info' : 'error', 
                        result.isValid ? '⏳' : '❌');
      } else {
        utils.showStatus('userId', '', '');
      }
      
      utils.updateSubmitButton();
    });

    // 아이디 중복 확인
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

    // 비밀번호 유효성 검사
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

    // 비밀번호 확인
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

    // 이름 유효성 검사
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

    // 전화번호 포매팅 및 유효성 검사
    elements.userPhone.addEventListener('input', (e) => {
      const formatted = utils.formatPhone(e.target.value);
      e.target.value = formatted;
      
      const result = utils.validatePhone(formatted);
      validation.phone.isValid = result.isValid;
      validation.phone.isChecked = false;
      
      elements.checkPhoneBtn.style.display = formatted ? 'block' : 'none';
      elements.checkPhoneBtn.disabled = !result.isValid;
      
      if (result.message) {
        utils.showStatus('userPhone', result.message, result.isValid ? 'info' : 'error',
                        result.isValid ? '⏳' : '❌');
      } else {
        utils.showStatus('userPhone', '', '');
      }
      
      utils.updateSubmitButton();
    });

    // 전화번호 중복 확인
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

    // 폼 제출
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
                  <p class="success-message">
                    TableLink에 가입해 주셔서 감사합니다.<br>
                    이제 다양한 매장에서 편리하게 주문하실 수 있습니다.
                  </p>
                  <button onclick="renderLogin()" class="signup-btn">
                    로그인하러 가기
                  </button>
                </div>
              </div>
            </div>
          `;
        } else {
          throw new Error(data.error || '회원가입에 실패했습니다');
        }
      } catch (error) {
        console.error('회원가입 오류:', error);
        utils.showLoading(false);
        alert(error.message || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    });

    // 로그인 페이지로 이동
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
  };

  // 초기화
  setupEventListeners();
  utils.updateSubmitButton();
  
  console.log('✅ 새로운 회원가입 화면 렌더링 완료');
}

// 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.renderSignUp = renderSignUp;
}
