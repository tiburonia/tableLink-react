
async function renderSignUp() {
  const main = document.getElementById('main');
  
  main.innerHTML = `
    <div id="signupContainer">
      <header class="signup-header">
        <button class="back-btn" onclick="renderLogin()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1>TableLink 회원가입</h1>
        <div></div>
      </header>

      <div class="signup-content">
        <div class="welcome-section">
          <div class="welcome-icon">🎉</div>
          <h2>환영합니다!</h2>
          <p>TableLink에 가입하고 더 편리한 서비스를 이용하세요</p>
        </div>

        <form class="signup-form" id="signupForm">
          <!-- 아이디 입력 -->
          <div class="form-group">
            <label for="signupId" class="form-label">
              <span class="label-text">아이디</span>
              <span class="required">*</span>
            </label>
            <div class="input-wrapper">
              <input type="text" id="signupId" class="form-input" placeholder="영문, 숫자 3-20자" autocomplete="username">
              <div class="input-status" id="idStatus"></div>
            </div>
            <div class="form-hint">영문과 숫자만 사용 가능합니다 (3-20자)</div>
          </div>

          <!-- 비밀번호 입력 -->
          <div class="form-group">
            <label for="signupPw" class="form-label">
              <span class="label-text">비밀번호</span>
              <span class="required">*</span>
            </label>
            <div class="input-wrapper">
              <input type="password" id="signupPw" class="form-input" placeholder="최소 4자 이상" autocomplete="new-password">
              <button type="button" class="password-toggle" onclick="togglePassword('signupPw')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            <div class="form-hint">최소 4자 이상 입력해주세요</div>
          </div>

          <!-- 비밀번호 확인 -->
          <div class="form-group">
            <label for="signupPwConfirm" class="form-label">
              <span class="label-text">비밀번호 확인</span>
              <span class="required">*</span>
            </label>
            <div class="input-wrapper">
              <input type="password" id="signupPwConfirm" class="form-input" placeholder="비밀번호를 다시 입력하세요" autocomplete="new-password">
              <button type="button" class="password-toggle" onclick="togglePassword('signupPwConfirm')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            <div class="form-hint" id="passwordMatchHint">비밀번호가 일치하지 않습니다</div>
          </div>

          <!-- 이름 입력 -->
          <div class="form-group">
            <label for="signupName" class="form-label">
              <span class="label-text">이름</span>
              <span class="optional">선택</span>
            </label>
            <div class="input-wrapper">
              <input type="text" id="signupName" class="form-input" placeholder="실명을 입력하세요" autocomplete="name">
            </div>
          </div>

          <!-- 전화번호 입력 -->
          <div class="form-group">
            <label for="signupPhone" class="form-label">
              <span class="label-text">전화번호</span>
              <span class="optional">선택</span>
            </label>
            <div class="input-wrapper">
              <input type="tel" id="signupPhone" class="form-input" placeholder="010-1234-5678" autocomplete="tel">
              <div class="input-status" id="phoneStatus"></div>
            </div>
            <div class="form-hint">전화번호를 입력하면 기존 주문 내역이 연동됩니다</div>
            <button type="button" class="search-orders-btn" id="searchOrdersBtn" onclick="searchOrdersByPhone()" style="display: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2"/>
              </svg>
              주문내역 찾기
            </button>
          </div>

          <!-- 게스트 주문 내역 미리보기 -->
          <div class="guest-orders-preview" id="guestOrdersPreview" style="display: none;">
            <div class="preview-header">
              <span class="preview-icon">🎯</span>
              <span class="preview-title">발견된 주문 내역</span>
              <span class="preview-count" id="previewCount"></span>
            </div>
            <div class="preview-content" id="guestOrdersContent"></div>
            <div class="preview-summary" id="previewSummary"></div>
          </div>

          <!-- 회원가입 버튼 -->
          <button type="submit" class="signup-btn" id="signupBtn" disabled>
            <span class="btn-text">회원가입</span>
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </form>

        <!-- 로그인 링크 -->
        <div class="login-link">
          이미 계정이 있으신가요? 
          <button onclick="renderLogin()" class="link-btn">로그인하기</button>
        </div>
      </div>
    </div>

    <style>
      #main {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
        overflow-x: hidden;
      }

      #signupContainer {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .signup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .back-btn {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .back-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateX(-2px) scale(1.05);
      }

      .signup-header h1 {
        margin: 0;
        color: white;
        font-size: 18px;
        font-weight: 700;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        letter-spacing: -0.5px;
      }

      .signup-content {
        flex: 1;
        padding: 24px 20px 32px;
        display: flex;
        flex-direction: column;
        max-width: 420px;
        width: 100%;
        margin: 0 auto;
      }

      .welcome-section {
        text-align: center;
        margin-bottom: 32px;
        animation: fadeInUp 0.6s ease-out;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .welcome-icon {
        font-size: 48px;
        margin-bottom: 12px;
        animation: bounce 2s infinite;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-8px); }
        60% { transform: translateY(-4px); }
      }

      .welcome-section h2 {
        margin: 0 0 6px 0;
        color: white;
        font-size: 24px;
        font-weight: 800;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        letter-spacing: -0.5px;
      }

      .welcome-section p {
        margin: 0;
        color: rgba(255, 255, 255, 0.9);
        font-size: 15px;
        line-height: 1.5;
        font-weight: 500;
      }

      .signup-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
        animation: fadeInUp 0.8s ease-out;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 600;
        color: white;
        margin-bottom: 2px;
      }

      .required {
        color: #ff6b6b;
        font-size: 11px;
        font-weight: 700;
      }

      .optional {
        color: rgba(255, 255, 255, 0.7);
        font-size: 11px;
        font-weight: 500;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .form-input {
        width: 100%;
        padding: 14px 18px;
        font-size: 15px;
        border: 2px solid rgba(255, 255, 255, 0.25);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
        font-weight: 500;
      }

      .form-input::placeholder {
        color: #999;
        font-weight: 400;
      }

      .form-input:focus {
        outline: none;
        border-color: #667eea;
        background: white;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15), 0 8px 25px rgba(102, 126, 234, 0.1);
        transform: translateY(-1px);
      }

      .form-input.error {
        border-color: #ff6b6b;
        background: #fff5f5;
        animation: shake 0.5s ease-in-out;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      .form-input.success {
        border-color: #51cf66;
        background: #f8fff9;
      }

      .input-status {
        position: absolute;
        right: 16px;
        font-size: 18px;
        z-index: 2;
      }

      .password-toggle {
        position: absolute;
        right: 14px;
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        transition: all 0.2s ease;
        z-index: 2;
      }

      .password-toggle:hover {
        color: #333;
        background: rgba(0, 0, 0, 0.05);
        transform: scale(1.1);
      }

      .form-hint {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.4;
        display: none;
        margin-top: 2px;
        font-weight: 500;
      }

      .form-hint.show {
        display: block;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .form-hint.error {
        color: #ff8a95;
        display: block;
      }

      .form-hint.success {
        color: #69db7c;
        display: block;
      }

      .search-orders-btn {
        margin-top: 8px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        color: white;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        align-self: flex-start;
      }

      .search-orders-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .guest-orders-preview {
        background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 16px;
        padding: 20px;
        border: 2px solid rgba(102, 126, 234, 0.2);
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
        animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        margin-top: 8px;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-15px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        justify-content: space-between;
      }

      .preview-icon {
        font-size: 18px;
      }

      .preview-title {
        font-weight: 700;
        color: #333;
        font-size: 15px;
        flex: 1;
      }

      .preview-count {
        background: #667eea;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
      }

      .preview-content {
        color: #666;
        font-size: 13px;
        line-height: 1.5;
        max-height: 200px;
        overflow-y: auto;
      }

      .order-preview-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        transition: all 0.2s ease;
      }

      .order-preview-item:hover {
        background: rgba(102, 126, 234, 0.05);
        margin: 0 -8px;
        padding: 12px 8px;
        border-radius: 8px;
      }

      .order-preview-item:last-child {
        border-bottom: none;
      }

      .order-item-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .store-name {
        font-weight: 600;
        color: #333;
        font-size: 14px;
      }

      .order-date {
        font-size: 11px;
        color: #999;
        font-weight: 500;
      }

      .order-amount {
        font-weight: 700;
        color: #667eea;
        font-size: 14px;
      }

      .preview-summary {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 2px solid #f0f0f0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        font-size: 12px;
      }

      .summary-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .summary-label {
        color: #666;
        font-weight: 500;
      }

      .summary-value {
        color: #333;
        font-weight: 700;
        font-size: 14px;
      }

      .signup-btn {
        width: 100%;
        padding: 16px 24px;
        background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
        color: white;
        border: none;
        border-radius: 14px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 8px 32px rgba(81, 207, 102, 0.3);
        margin-top: 8px;
      }

      .signup-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(81, 207, 102, 0.4);
        background: linear-gradient(135deg, #69db7c 0%, #51cf66 100%);
      }

      .signup-btn:active:not(:disabled) {
        transform: translateY(0);
        transition: transform 0.1s ease;
      }

      .signup-btn:disabled {
        background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
        color: rgba(255, 255, 255, 0.7);
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }

      .btn-icon {
        transition: transform 0.3s ease;
      }

      .signup-btn:hover:not(:disabled) .btn-icon {
        transform: translateX(3px);
      }

      .login-link {
        text-align: center;
        margin-top: 24px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 13px;
        font-weight: 500;
      }

      .link-btn {
        background: none;
        border: none;
        color: white;
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
        font-size: 13px;
        transition: all 0.2s ease;
      }

      .link-btn:hover {
        color: #51cf66;
        text-shadow: 0 0 8px rgba(81, 207, 102, 0.5);
      }

      /* 로딩 상태 */
      .loading {
        pointer-events: none;
        opacity: 0.7;
        position: relative;
      }

      .loading .btn-text {
        opacity: 0;
      }

      .loading .btn-icon {
        opacity: 0;
      }

      .loading::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }

      /* 스크롤바 스타일링 */
      .preview-content::-webkit-scrollbar {
        width: 4px;
      }

      .preview-content::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 2px;
      }

      .preview-content::-webkit-scrollbar-thumb {
        background: #667eea;
        border-radius: 2px;
      }

      /* 반응형 */
      @media (max-width: 480px) {
        .signup-content {
          padding: 20px 16px 28px;
        }

        .signup-header {
          padding: 12px 16px;
        }

        .form-input {
          font-size: 16px; /* iOS 줌 방지 */
        }

        .welcome-section h2 {
          font-size: 22px;
        }

        .welcome-section p {
          font-size: 14px;
        }
      }

      @media (max-width: 360px) {
        .signup-content {
          max-width: 100%;
        }

        .guest-orders-preview {
          padding: 16px;
        }
      }
    </style>
  `;

  // 폼 유효성 검사 및 이벤트 설정
  setupSignupForm();
}

function setupSignupForm() {
  const form = document.getElementById('signupForm');
  const idInput = document.getElementById('signupId');
  const pwInput = document.getElementById('signupPw');
  const pwConfirmInput = document.getElementById('signupPwConfirm');
  const nameInput = document.getElementById('signupName');
  const phoneInput = document.getElementById('signupPhone');
  const submitBtn = document.getElementById('signupBtn');
  const searchBtn = document.getElementById('searchOrdersBtn');

  let isIdChecking = false;
  let isIdValid = false;
  let isPhoneChecking = false;

  // 아이디 실시간 검증
  let idCheckTimeout;
  idInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    clearTimeout(idCheckTimeout);
    
    if (value.length < 3) {
      updateInputStatus(idInput, 'error', '❌', '아이디는 3자 이상이어야 합니다');
      isIdValid = false;
      updateSubmitButton();
      return;
    }
    
    if (!/^[a-zA-Z0-9]{3,20}$/.test(value)) {
      updateInputStatus(idInput, 'error', '❌', '영문과 숫자만 사용 가능합니다');
      isIdValid = false;
      updateSubmitButton();
      return;
    }

    updateInputStatus(idInput, 'checking', '⏳', '아이디 확인 중...');
    
    idCheckTimeout = setTimeout(async () => {
      await checkIdAvailability(value);
    }, 500);
  });

  // 비밀번호 실시간 검증
  pwInput.addEventListener('input', validatePassword);
  pwConfirmInput.addEventListener('input', validatePassword);

  // 전화번호 실시간 검증
  let phoneCheckTimeout;
  phoneInput.addEventListener('input', (e) => {
    const value = formatPhoneNumber(e.target.value);
    e.target.value = value;
    
    clearTimeout(phoneCheckTimeout);
    
    if (value.length === 0) {
      hideGuestOrdersPreview();
      updateInputStatus(phoneInput, '', '', '');
      searchBtn.style.display = 'none';
      updateSubmitButton();
      return;
    }
    
    if (value.length < 13) {
      updateInputStatus(phoneInput, 'error', '❌', '올바른 전화번호를 입력하세요');
      hideGuestOrdersPreview();
      searchBtn.style.display = 'none';
      updateSubmitButton();
      return;
    }

    // 전화번호가 완성되면 주문내역 찾기 버튼 표시
    updateInputStatus(phoneInput, 'success', '✅', '유효한 전화번호입니다');
    searchBtn.style.display = 'flex';
    updateSubmitButton();
  });

  // 폼 제출 이벤트
  form.addEventListener('submit', handleSignupSubmit);

  // 아이디 중복 확인
  async function checkIdAvailability(id) {
    isIdChecking = true;
    try {
      const response = await fetch('/api/users/check-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const data = await response.json();
      
      if (data.available) {
        updateInputStatus(idInput, 'success', '✅', '사용 가능한 아이디입니다');
        isIdValid = true;
      } else {
        updateInputStatus(idInput, 'error', '❌', data.message || '사용할 수 없는 아이디입니다');
        isIdValid = false;
      }
    } catch (error) {
      updateInputStatus(idInput, 'error', '❌', '아이디 확인 중 오류가 발생했습니다');
      isIdValid = false;
    } finally {
      isIdChecking = false;
      updateSubmitButton();
    }
  }

  // 비밀번호 검증
  function validatePassword() {
    const pw = pwInput.value;
    const pwConfirm = pwConfirmInput.value;
    
    if (pw.length === 0) {
      updateInputStatus(pwInput, '', '', '');
      updateInputStatus(pwConfirmInput, '', '', '');
      updateSubmitButton();
      return;
    }
    
    if (pw.length < 4) {
      updateInputStatus(pwInput, 'error', '❌', '비밀번호는 4자 이상이어야 합니다');
    } else {
      updateInputStatus(pwInput, 'success', '✅', '사용 가능한 비밀번호입니다');
    }
    
    if (pwConfirm.length > 0) {
      if (pw === pwConfirm) {
        updateInputStatus(pwConfirmInput, 'success', '✅', '비밀번호가 일치합니다');
      } else {
        updateInputStatus(pwConfirmInput, 'error', '❌', '비밀번호가 일치하지 않습니다');
      }
    } else {
      updateInputStatus(pwConfirmInput, '', '', '');
    }
    
    updateSubmitButton();
  }

  // 입력 상태 업데이트
  function updateInputStatus(input, status, icon, message) {
    const wrapper = input.closest('.input-wrapper');
    const statusElement = wrapper.querySelector('.input-status');
    const hint = wrapper.closest('.form-group').querySelector('.form-hint');
    
    input.className = `form-input ${status}`;
    statusElement.textContent = icon;
    
    if (message) {
      hint.textContent = message;
      hint.className = `form-hint ${status} show`;
    } else {
      hint.className = 'form-hint';
    }
  }

  // 제출 버튼 상태 업데이트
  function updateSubmitButton() {
    const id = idInput.value.trim();
    const pw = pwInput.value;
    const pwConfirm = pwConfirmInput.value;
    
    const isFormValid = 
      isIdValid && 
      !isIdChecking && 
      !isPhoneChecking &&
      id.length >= 3 && 
      pw.length >= 4 && 
      pw === pwConfirm;
    
    submitBtn.disabled = !isFormValid;
  }

  // 폼 제출 처리
  async function handleSignupSubmit(e) {
    e.preventDefault();
    
    if (submitBtn.disabled) return;
    
    const formData = {
      id: idInput.value.trim(),
      pw: pwInput.value.trim(),
      name: nameInput.value.trim() || null,
      phone: phoneInput.value.trim() || null
    };
    
    submitBtn.classList.add('loading');
    
    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 회원가입 성공 알림
        showSuccessMessage('🎉 회원가입이 완료되었습니다!');
        
        // 전화번호가 있는 경우 게스트 주문 내역 연동 처리
        if (formData.phone) {
          try {
            await convertGuestToMember(formData.phone, formData.id);
          } catch (conversionError) {
            console.warn('게스트 주문 연동 실패:', conversionError);
          }
        }
        
        // 2초 후 로그인 페이지로 이동
        setTimeout(() => {
          renderLogin();
        }, 2000);
      } else {
        throw new Error(data.error || '회원가입에 실패했습니다');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      showErrorMessage(error.message || '회원가입 중 오류가 발생했습니다');
    } finally {
      submitBtn.classList.remove('loading');
    }
  }

  // 게스트를 회원으로 전환
  async function convertGuestToMember(guestPhone, userId) {
    try {
      const response = await fetch(`/api/guests/${guestPhone}/convert-to-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ 게스트 ${guestPhone}의 주문 ${data.transferredOrders}건이 회원 ${userId}로 이전됨`);
        showSuccessMessage('🔄 기존 주문 내역이 회원 계정에 연동되었습니다!');
      }
    } catch (error) {
      console.error('게스트 회원 전환 실패:', error);
      throw error;
    }
  }

  // 게스트 주문 내역 미리보기 표시
  function showGuestOrdersPreview(orders, stats) {
    const preview = document.getElementById('guestOrdersPreview');
    const content = document.getElementById('guestOrdersContent');
    const count = document.getElementById('previewCount');
    const summary = document.getElementById('previewSummary');
    
    count.textContent = `${orders.length}건`;
    
    const ordersHtml = orders.slice(0, 5).map(order => `
      <div class="order-preview-item">
        <div class="order-item-info">
          <div class="store-name">${order.store_name || '매장 정보 없음'}</div>
          <div class="order-date">${new Date(order.order_date).toLocaleDateString('ko-KR')}</div>
        </div>
        <div class="order-amount">
          ${(order.final_amount || 0).toLocaleString()}원
        </div>
      </div>
    `).join('');
    
    content.innerHTML = ordersHtml + 
      (orders.length > 5 ? `<div style="text-align: center; margin-top: 12px; color: #999; font-size: 12px;">외 ${orders.length - 5}건 더</div>` : '');
    
    // 통계 요약 표시
    if (stats) {
      summary.innerHTML = `
        <div class="summary-item">
          <div class="summary-label">총 주문 횟수</div>
          <div class="summary-value">${stats.totalOrders}회</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">총 주문 금액</div>
          <div class="summary-value">${stats.totalAmount.toLocaleString()}원</div>
        </div>
      `;
    }
    
    preview.style.display = 'block';
  }

  // 게스트 주문 내역 미리보기 숨김
  function hideGuestOrdersPreview() {
    const preview = document.getElementById('guestOrdersPreview');
    preview.style.display = 'none';
  }
}

// 전화번호로 주문내역 검색 함수
async function searchOrdersByPhone() {
  const phoneInput = document.getElementById('signupPhone');
  const phone = phoneInput.value.trim();
  
  if (!phone || phone.length < 13) {
    showErrorMessage('올바른 전화번호를 입력해주세요');
    return;
  }
  
  const searchBtn = document.getElementById('searchOrdersBtn');
  const originalText = searchBtn.innerHTML;
  
  searchBtn.innerHTML = '<div style="width: 12px; height: 12px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite;"></div> 검색중...';
  searchBtn.disabled = true;
  
  try {
    // paid_orders 테이블에서 게스트 주문 내역 조회
    const response = await fetch(`/api/orders/guest-phone/${phone}`);
    const data = await response.json();
    
    if (data.success && data.orders && data.orders.length > 0) {
      const stats = {
        totalOrders: data.orders.length,
        totalAmount: data.orders.reduce((sum, order) => sum + (order.final_amount || 0), 0)
      };
      
      showGuestOrdersPreview(data.orders, stats);
      showSuccessMessage(`📱 ${phone} 번호로 ${data.orders.length}건의 주문 내역을 찾았습니다!`);
    } else {
      hideGuestOrdersPreview();
      showInfoMessage('해당 전화번호로 등록된 주문 내역이 없습니다');
    }
  } catch (error) {
    console.error('주문내역 검색 실패:', error);
    showErrorMessage('주문내역 검색 중 오류가 발생했습니다');
    hideGuestOrdersPreview();
  } finally {
    searchBtn.innerHTML = originalText;
    searchBtn.disabled = false;
  }
}

// 게스트 주문 내역 미리보기 표시 함수
function showGuestOrdersPreview(orders, stats) {
  const preview = document.getElementById('guestOrdersPreview');
  const content = document.getElementById('guestOrdersContent');
  const count = document.getElementById('previewCount');
  const summary = document.getElementById('previewSummary');
  
  count.textContent = `${orders.length}건`;
  
  const ordersHtml = orders.slice(0, 5).map(order => `
    <div class="order-preview-item">
      <div class="order-item-info">
        <div class="store-name">${order.store_name || '매장 정보 없음'}</div>
        <div class="order-date">${new Date(order.payment_date || order.order_date).toLocaleDateString('ko-KR')}</div>
      </div>
      <div class="order-amount">
        ${(order.final_amount || 0).toLocaleString()}원
      </div>
    </div>
  `).join('');
  
  content.innerHTML = ordersHtml + 
    (orders.length > 5 ? `<div style="text-align: center; margin-top: 12px; color: #999; font-size: 12px;">외 ${orders.length - 5}건 더</div>` : '');
  
  // 통계 요약 표시
  if (stats) {
    summary.innerHTML = `
      <div class="summary-item">
        <div class="summary-label">총 주문 횟수</div>
        <div class="summary-value">${stats.totalOrders}회</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">총 주문 금액</div>
        <div class="summary-value">${stats.totalAmount.toLocaleString()}원</div>
      </div>
    `;
  }
  
  preview.style.display = 'block';
}

// 게스트 주문 내역 미리보기 숨김 함수
function hideGuestOrdersPreview() {
  const preview = document.getElementById('guestOrdersPreview');
  if (preview) {
    preview.style.display = 'none';
  }
}

// 전화번호 포맷팅
function formatPhoneNumber(value) {
  const numbers = value.replace(/[^0-9]/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

// 비밀번호 표시/숨김 토글
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12A18.5 18.5 0 0 1 19.42 16.42" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M1 1L23 23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10.584 10.587A2 2 0 0 0 13.415 13.414" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  } else {
    input.type = 'password';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;
  }
}

// 성공 메시지 표시
function showSuccessMessage(message) {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 10000;
    animation: slideDown 0.3s ease;
    box-shadow: 0 8px 32px rgba(81, 207, 102, 0.3);
    backdrop-filter: blur(10px);
    font-size: 14px;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 에러 메시지 표시
function showErrorMessage(message) {
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ff6b6b 0%, #fa5252 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 10000;
    animation: slideDown 0.3s ease;
    box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
    backdrop-filter: blur(10px);
    font-size: 14px;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 정보 메시지 표시
function showInfoMessage(message) {
  const toast = document.createElement('div');
  toast.className = 'info-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #339af0 0%, #228be6 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 10000;
    animation: slideDown 0.3s ease;
    box-shadow: 0 8px 32px rgba(51, 154, 240, 0.3);
    backdrop-filter: blur(10px);
    font-size: 14px;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 전역 함수로 등록
window.renderSignUp = renderSignUp;
window.togglePassword = togglePassword;
window.searchOrdersByPhone = searchOrdersByPhone;
