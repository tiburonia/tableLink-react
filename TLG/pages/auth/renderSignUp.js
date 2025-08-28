
function renderSignUp() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .signup-container {
        width: 100%;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .signup-card {
        background: white;
        border-radius: 20px;
        padding: 40px;
        width: 100%;
        max-width: 450px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
      }

      .signup-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      }

      .header {
        text-align: center;
        margin-bottom: 40px;
      }

      .logo {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        color: white;
        font-size: 24px;
        font-weight: bold;
      }

      .title {
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 8px;
      }

      .subtitle {
        color: #64748b;
        font-size: 16px;
      }

      .form-group {
        margin-bottom: 25px;
        position: relative;
      }

      .form-label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
      }

      .required {
        color: #ef4444;
      }

      .form-input {
        width: 100%;
        padding: 16px 20px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 16px;
        transition: all 0.3s ease;
        background: #fafafa;
      }

      .form-input:focus {
        outline: none;
        border-color: #667eea;
        background: white;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .form-input.error {
        border-color: #ef4444;
        background: #fef2f2;
      }

      .form-input.success {
        border-color: #10b981;
        background: #f0fdf4;
      }

      .input-status {
        font-size: 12px;
        margin-top: 8px;
        min-height: 18px;
        font-weight: 500;
      }

      .input-status.error {
        color: #ef4444;
      }

      .input-status.success {
        color: #10b981;
      }

      .form-hint {
        font-size: 12px;
        color: #64748b;
        margin-top: 6px;
      }

      .check-btn {
        position: absolute;
        right: 12px;
        top: 36px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .check-btn:hover {
        background: #5a67d8;
      }

      .check-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
      }

      .primary-btn {
        width: 100%;
        padding: 18px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 20px;
        position: relative;
        overflow: hidden;
      }

      .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
      }

      .primary-btn:active {
        transform: translateY(0);
      }

      .primary-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }

      .btn-loading {
        display: none;
        align-items: center;
        justify-content: center;
      }

      .btn-loading .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 10px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .back-to-login {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        color: #64748b;
        font-size: 14px;
      }

      .back-to-login a {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
        cursor: pointer;
        transition: color 0.2s ease;
      }

      .back-to-login a:hover {
        color: #5a67d8;
        text-decoration: underline;
      }

      .password-strength {
        margin-top: 8px;
      }

      .strength-bar {
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 4px;
      }

      .strength-fill {
        height: 100%;
        border-radius: 2px;
        transition: all 0.3s ease;
        width: 0%;
      }

      .strength-weak .strength-fill { 
        background: #ef4444; 
        width: 25%; 
      }

      .strength-fair .strength-fill { 
        background: #f59e0b; 
        width: 50%; 
      }

      .strength-good .strength-fill { 
        background: #10b981; 
        width: 75%; 
      }

      .strength-strong .strength-fill { 
        background: #10b981; 
        width: 100%; 
      }

      .strength-text {
        font-size: 11px;
        font-weight: 500;
      }

      .loading-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        align-items: center;
        justify-content: center;
      }

      .loading-content {
        background: white;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }
    </style>

    <div class="signup-container">
      <div class="signup-card">
        <div class="header">
          <div class="logo">TL</div>
          <h1 class="title">회원가입</h1>
          <p class="subtitle">TableLink에 오신 것을 환영합니다</p>
        </div>

        <form id="signupForm">
          <div class="form-group">
            <label class="form-label" for="signupId">아이디 <span class="required">*</span></label>
            <div style="position: relative;">
              <input type="text" id="signupId" class="form-input" placeholder="영문, 숫자 3-20자" autocomplete="username" maxlength="20">
              <button type="button" class="check-btn" id="checkIdBtn">중복확인</button>
            </div>
            <div class="input-status" id="idStatus"></div>
            <div class="form-hint">영문과 숫자만 사용 가능합니다 (3-20자)</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="signupPw">비밀번호 <span class="required">*</span></label>
            <input type="password" id="signupPw" class="form-input" placeholder="비밀번호를 입력해주세요" autocomplete="new-password">
            <div class="password-strength">
              <div class="strength-bar">
                <div class="strength-fill"></div>
              </div>
              <div class="strength-text" id="strengthText">비밀번호를 입력해주세요</div>
            </div>
            <div class="input-status" id="pwStatus"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="signupPwConfirm">비밀번호 확인 <span class="required">*</span></label>
            <input type="password" id="signupPwConfirm" class="form-input" placeholder="비밀번호를 다시 입력해주세요" autocomplete="new-password">
            <div class="input-status" id="pwConfirmStatus"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="signupName">이름</label>
            <input type="text" id="signupName" class="form-input" placeholder="이름을 입력해주세요 (선택사항)" autocomplete="name">
            <div class="input-status" id="nameStatus"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="signupPhone">전화번호</label>
            <div style="position: relative;">
              <input type="tel" id="signupPhone" class="form-input" placeholder="010-1234-5678 (선택사항)" autocomplete="tel">
              <button type="button" class="check-btn" id="checkPhoneBtn" style="display: none;">중복확인</button>
            </div>
            <div class="input-status" id="phoneStatus"></div>
            <div class="form-hint">전화번호를 입력하시면 주문 내역 연동이 가능합니다</div>
          </div>

          <button type="submit" class="primary-btn" id="signupBtn">
            <span class="btn-text">회원가입</span>
            <div class="btn-loading">
              <div class="spinner"></div>
              <span>처리중...</span>
            </div>
          </button>
        </form>

        <div class="back-to-login">
          이미 계정이 있으신가요? <a id="backToLoginBtn">로그인하기</a>
        </div>
      </div>
    </div>

    <div class="loading-overlay" id="loadingOverlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>회원가입 처리중...</p>
      </div>
    </div>
  `;

  // DOM 요소들 가져오기
  const form = document.getElementById('signupForm');
  const idInput = document.getElementById('signupId');
  const pwInput = document.getElementById('signupPw');
  const pwConfirmInput = document.getElementById('signupPwConfirm');
  const nameInput = document.getElementById('signupName');
  const phoneInput = document.getElementById('signupPhone');
  const checkIdBtn = document.getElementById('checkIdBtn');
  const checkPhoneBtn = document.getElementById('checkPhoneBtn');
  const signupBtn = document.getElementById('signupBtn');
  const backToLoginBtn = document.getElementById('backToLoginBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');

  // 상태 관리
  const validationState = {
    id: { isValid: false, isChecked: false },
    password: { isValid: false },
    passwordConfirm: { isValid: false },
    name: { isValid: true }, // 선택사항이므로 기본값 true
    phone: { isValid: true, isChecked: false } // 선택사항이므로 기본값 true
  };

  // 유틸리티 함수들
  function showStatus(elementId, message, type) {
    const statusEl = document.getElementById(elementId);
    const inputEl = document.getElementById(elementId.replace('Status', ''));
    
    statusEl.textContent = message;
    statusEl.className = `input-status ${type}`;
    
    if (inputEl) {
      inputEl.className = `form-input ${type}`;
    }
  }

  function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.getElementById('strengthText');
    
    if (!password) {
      strengthBar.className = 'strength-bar';
      strengthText.textContent = '비밀번호를 입력해주세요';
      return;
    }

    let score = 0;
    if (password.length >= 4) score++;
    if (password.length >= 6) score++;
    if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];
    const texts = ['', '약함', '보통', '좋음', '강함'];
    
    strengthBar.className = `strength-bar ${levels[score]}`;
    strengthText.textContent = `보안 강도: ${texts[score]}`;
    strengthText.style.color = ['', '#ef4444', '#f59e0b', '#10b981', '#10b981'][score];
  }

  function validateForm() {
    const allValid = Object.values(validationState).every(field => field.isValid);
    const idChecked = validationState.id.isChecked;
    const phoneChecked = phoneInput.value ? validationState.phone.isChecked : true;
    
    signupBtn.disabled = !(allValid && idChecked && phoneChecked);
  }

  function showLoading(show = true) {
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    
    if (show) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
      loadingOverlay.style.display = 'flex';
      signupBtn.disabled = true;
    } else {
      btnText.style.display = 'block';
      btnLoading.style.display = 'none';
      loadingOverlay.style.display = 'none';
      validateForm();
    }
  }

  // 아이디 유효성 검사
  idInput.addEventListener('input', () => {
    const id = idInput.value.trim();
    validationState.id.isChecked = false;
    checkIdBtn.disabled = false;
    
    if (!id) {
      showStatus('idStatus', '', '');
      validationState.id.isValid = false;
    } else if (!/^[a-zA-Z0-9]{3,20}$/.test(id)) {
      showStatus('idStatus', '영문과 숫자만 3-20자로 입력해주세요', 'error');
      validationState.id.isValid = false;
    } else {
      showStatus('idStatus', '중복 확인을 해주세요', '');
      validationState.id.isValid = true;
    }
    
    validateForm();
  });

  // 아이디 중복 확인
  checkIdBtn.addEventListener('click', async () => {
    const id = idInput.value.trim();
    
    if (!id) {
      showStatus('idStatus', '아이디를 입력해주세요', 'error');
      return;
    }

    if (!/^[a-zA-Z0-9]{3,20}$/.test(id)) {
      showStatus('idStatus', '영문과 숫자만 3-20자로 입력해주세요', 'error');
      return;
    }

    checkIdBtn.disabled = true;
    checkIdBtn.textContent = '확인중...';

    try {
      const response = await fetch('/api/auth/users/check-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json();
      
      if (data.available) {
        showStatus('idStatus', '사용 가능한 아이디입니다', 'success');
        validationState.id.isChecked = true;
      } else {
        showStatus('idStatus', '이미 사용중인 아이디입니다', 'error');
        validationState.id.isChecked = false;
      }
    } catch (error) {
      showStatus('idStatus', '중복 확인 중 오류가 발생했습니다', 'error');
      validationState.id.isChecked = false;
    } finally {
      checkIdBtn.disabled = false;
      checkIdBtn.textContent = '중복확인';
      validateForm();
    }
  });

  // 비밀번호 유효성 검사
  pwInput.addEventListener('input', () => {
    const password = pwInput.value;
    updatePasswordStrength(password);
    
    if (!password) {
      showStatus('pwStatus', '', '');
      validationState.password.isValid = false;
    } else if (password.length < 4) {
      showStatus('pwStatus', '비밀번호는 최소 4자 이상이어야 합니다', 'error');
      validationState.password.isValid = false;
    } else {
      showStatus('pwStatus', '사용 가능한 비밀번호입니다', 'success');
      validationState.password.isValid = true;
    }

    // 비밀번호 확인 재검증
    if (pwConfirmInput.value) {
      const confirmPassword = pwConfirmInput.value;
      if (password !== confirmPassword) {
        showStatus('pwConfirmStatus', '비밀번호가 일치하지 않습니다', 'error');
        validationState.passwordConfirm.isValid = false;
      } else {
        showStatus('pwConfirmStatus', '비밀번호가 일치합니다', 'success');
        validationState.passwordConfirm.isValid = true;
      }
    }
    
    validateForm();
  });

  // 비밀번호 확인 유효성 검사
  pwConfirmInput.addEventListener('input', () => {
    const password = pwInput.value;
    const confirmPassword = pwConfirmInput.value;
    
    if (!confirmPassword) {
      showStatus('pwConfirmStatus', '', '');
      validationState.passwordConfirm.isValid = false;
    } else if (password !== confirmPassword) {
      showStatus('pwConfirmStatus', '비밀번호가 일치하지 않습니다', 'error');
      validationState.passwordConfirm.isValid = false;
    } else {
      showStatus('pwConfirmStatus', '비밀번호가 일치합니다', 'success');
      validationState.passwordConfirm.isValid = true;
    }
    
    validateForm();
  });

  // 이름 유효성 검사 (선택사항)
  nameInput.addEventListener('input', () => {
    const name = nameInput.value.trim();
    
    if (!name) {
      showStatus('nameStatus', '', '');
      validationState.name.isValid = true; // 선택사항이므로 항상 유효
    } else if (name.length < 2) {
      showStatus('nameStatus', '이름은 2자 이상 입력해주세요', 'error');
      validationState.name.isValid = false;
    } else if (name.length > 20) {
      showStatus('nameStatus', '이름은 20자 이하로 입력해주세요', 'error');
      validationState.name.isValid = false;
    } else {
      showStatus('nameStatus', '사용 가능한 이름입니다', 'success');
      validationState.name.isValid = true;
    }
    
    validateForm();
  });

  // 전화번호 유효성 검사 및 자동 포맷팅
  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d]/g, '');
    
    if (value.length >= 3) {
      if (value.length <= 7) {
        value = value.replace(/(\d{3})(\d+)/, '$1-$2');
      } else {
        value = value.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3');
      }
    }
    
    e.target.value = value;
    
    validationState.phone.isChecked = false;
    checkPhoneBtn.style.display = value ? 'block' : 'none';
    
    if (!value) {
      showStatus('phoneStatus', '', '');
      validationState.phone.isValid = true; // 선택사항이므로 빈 값도 유효
    } else if (!/^010-\d{4}-\d{4}$/.test(value)) {
      showStatus('phoneStatus', '올바른 전화번호 형식이 아닙니다 (010-0000-0000)', 'error');
      validationState.phone.isValid = false;
    } else {
      showStatus('phoneStatus', '중복 확인을 해주세요', '');
      validationState.phone.isValid = true;
    }
    
    validateForm();
  });

  // 전화번호 중복 확인
  checkPhoneBtn.addEventListener('click', async () => {
    const phone = phoneInput.value.trim();
    
    if (!phone) {
      showStatus('phoneStatus', '전화번호를 입력해주세요', 'error');
      return;
    }

    if (!/^010-\d{4}-\d{4}$/.test(phone)) {
      showStatus('phoneStatus', '올바른 전화번호 형식이 아닙니다', 'error');
      return;
    }

    checkPhoneBtn.disabled = true;
    checkPhoneBtn.textContent = '확인중...';

    try {
      const response = await fetch('/api/auth/users/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();
      
      if (data.available) {
        showStatus('phoneStatus', '사용 가능한 전화번호입니다', 'success');
        validationState.phone.isChecked = true;
      } else {
        showStatus('phoneStatus', '이미 등록된 전화번호입니다', 'error');
        validationState.phone.isChecked = false;
      }
    } catch (error) {
      showStatus('phoneStatus', '중복 확인 중 오류가 발생했습니다', 'error');
      validationState.phone.isChecked = false;
    } finally {
      checkPhoneBtn.disabled = false;
      checkPhoneBtn.textContent = '중복확인';
      validateForm();
    }
  });

  // 폼 제출 처리
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      id: idInput.value.trim(),
      pw: pwInput.value,
      name: nameInput.value.trim() || null,
      phone: phoneInput.value.trim() || null
    };

    showLoading(true);

    try {
      const response = await fetch('/api/auth/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // 성공 메시지 표시
        main.innerHTML = `
          <div class="signup-container">
            <div class="signup-card" style="text-align: center;">
              <div style="color: #10b981; font-size: 48px; margin-bottom: 20px;">✓</div>
              <h2 style="color: #1e293b; margin-bottom: 10px;">회원가입 완료!</h2>
              <p style="color: #64748b; margin-bottom: 30px;">TableLink에 가입해 주셔서 감사합니다.</p>
              <button onclick="renderLogin()" class="primary-btn">로그인하러 가기</button>
            </div>
          </div>
        `;
      } else {
        throw new Error(data.error || '회원가입에 실패했습니다');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      showLoading(false);
      
      // 에러 메시지 표시
      const errorMsg = error.message || '회원가입 중 오류가 발생했습니다';
      alert(errorMsg);
    }
  });

  // 로그인 화면으로 돌아가기
  backToLoginBtn.addEventListener('click', () => {
    if (typeof renderLogin === 'function') {
      renderLogin();
    } else if (typeof window.renderLogin === 'function') {
      window.renderLogin();
    } else {
      // renderLogin 함수 동적 로드
      const script = document.createElement('script');
      script.src = '/TLG/pages/auth/renderLogin.js';
      script.onload = () => {
        if (typeof window.renderLogin === 'function') {
          window.renderLogin();
        }
      };
      document.head.appendChild(script);
    }
  });

  // 초기 상태 검증
  validateForm();

  console.log('✅ 회원가입 화면 렌더링 완료');
}

// 전역에서 접근 가능하도록 설정
if (typeof window !== 'undefined') {
  window.renderSignUp = renderSignUp;
}
