
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
              <input type="text" id="signupId" class="form-input" placeholder="영문, 숫자 3-20자">
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
              <input type="password" id="signupPw" class="form-input" placeholder="최소 4자 이상">
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
              <input type="password" id="signupPwConfirm" class="form-input" placeholder="비밀번호를 다시 입력하세요">
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
              <input type="text" id="signupName" class="form-input" placeholder="실명을 입력하세요">
            </div>
          </div>

          <!-- 전화번호 입력 -->
          <div class="form-group">
            <label for="signupPhone" class="form-label">
              <span class="label-text">전화번호</span>
              <span class="optional">선택</span>
            </label>
            <div class="input-wrapper">
              <input type="tel" id="signupPhone" class="form-input" placeholder="010-1234-5678">
              <div class="input-status" id="phoneStatus"></div>
            </div>
            <div class="form-hint">전화번호를 입력하면 기존 주문 내역이 연동됩니다</div>
          </div>

          <!-- 게스트 주문 내역 미리보기 -->
          <div class="guest-orders-preview" id="guestOrdersPreview" style="display: none;">
            <div class="preview-header">
              <span class="preview-icon">🎯</span>
              <span class="preview-title">발견된 주문 내역</span>
            </div>
            <div class="preview-content" id="guestOrdersContent"></div>
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
        padding: 20px 24px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .back-btn {
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
        transition: all 0.2s ease;
      }

      .back-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateX(-2px);
      }

      .signup-header h1 {
        margin: 0;
        color: white;
        font-size: 20px;
        font-weight: 700;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .signup-content {
        flex: 1;
        padding: 32px 24px;
        display: flex;
        flex-direction: column;
        max-width: 480px;
        width: 100%;
        margin: 0 auto;
      }

      .welcome-section {
        text-align: center;
        margin-bottom: 40px;
      }

      .welcome-icon {
        font-size: 64px;
        margin-bottom: 16px;
        animation: bounce 2s infinite;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }

      .welcome-section h2 {
        margin: 0 0 8px 0;
        color: white;
        font-size: 28px;
        font-weight: 700;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .welcome-section p {
        margin: 0;
        color: rgba(255, 255, 255, 0.9);
        font-size: 16px;
        line-height: 1.5;
      }

      .signup-form {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        font-weight: 600;
        color: white;
      }

      .required {
        color: #ff6b6b;
        font-size: 12px;
      }

      .optional {
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        font-weight: 500;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .form-input {
        width: 100%;
        padding: 16px 20px;
        font-size: 16px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        transition: all 0.3s ease;
        box-sizing: border-box;
      }

      .form-input:focus {
        outline: none;
        border-color: #667eea;
        background: white;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
      }

      .form-input.error {
        border-color: #ff6b6b;
        background: #fff5f5;
      }

      .form-input.success {
        border-color: #51cf66;
        background: #f8fff9;
      }

      .input-status {
        position: absolute;
        right: 16px;
        font-size: 20px;
      }

      .password-toggle {
        position: absolute;
        right: 16px;
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .password-toggle:hover {
        color: #333;
        background: rgba(0, 0, 0, 0.05);
      }

      .form-hint {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.4;
        display: none;
      }

      .form-hint.show {
        display: block;
      }

      .form-hint.error {
        color: #ff6b6b;
        display: block;
      }

      .form-hint.success {
        color: #51cf66;
        display: block;
      }

      .guest-orders-preview {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        padding: 20px;
        border: 2px solid rgba(102, 126, 234, 0.3);
        animation: slideDown 0.3s ease;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .preview-icon {
        font-size: 20px;
      }

      .preview-title {
        font-weight: 700;
        color: #333;
        font-size: 16px;
      }

      .preview-content {
        color: #666;
        font-size: 14px;
        line-height: 1.5;
      }

      .order-preview-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .order-preview-item:last-child {
        border-bottom: none;
      }

      .signup-btn {
        width: 100%;
        padding: 18px 24px;
        background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 8px 24px rgba(81, 207, 102, 0.4);
      }

      .signup-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(81, 207, 102, 0.5);
      }

      .signup-btn:disabled {
        background: rgba(255, 255, 255, 0.3);
        color: rgba(255, 255, 255, 0.7);
        cursor: not-allowed;
        box-shadow: none;
      }

      .btn-icon {
        transition: transform 0.2s ease;
      }

      .signup-btn:hover:not(:disabled) .btn-icon {
        transform: translateX(2px);
      }

      .login-link {
        text-align: center;
        margin-top: 24px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
      }

      .link-btn {
        background: none;
        border: none;
        color: white;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
        font-size: 14px;
      }

      .link-btn:hover {
        color: #51cf66;
      }

      /* 로딩 상태 */
      .loading {
        pointer-events: none;
        opacity: 0.7;
      }

      .loading .btn-text {
        display: none;
      }

      .loading::after {
        content: '';
        width: 20px;
        height: 20px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* 반응형 */
      @media (max-width: 480px) {
        .signup-content {
          padding: 24px 16px;
        }

        .signup-header {
          padding: 16px 20px;
        }

        .form-input {
          font-size: 16px; /* iOS 줌 방지 */
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

  // 전화번호 실시간 검증 및 게스트 주문 내역 조회
  let phoneCheckTimeout;
  phoneInput.addEventListener('input', (e) => {
    const value = formatPhoneNumber(e.target.value);
    e.target.value = value;
    
    clearTimeout(phoneCheckTimeout);
    
    if (value.length === 0) {
      hideGuestOrdersPreview();
      updateInputStatus(phoneInput, '', '', '');
      updateSubmitButton();
      return;
    }
    
    if (value.length < 13) {
      updateInputStatus(phoneInput, 'error', '❌', '올바른 전화번호를 입력하세요');
      hideGuestOrdersPreview();
      updateSubmitButton();
      return;
    }

    updateInputStatus(phoneInput, 'checking', '⏳', '게스트 주문 내역 확인 중...');
    
    phoneCheckTimeout = setTimeout(async () => {
      await checkGuestOrders(value);
    }, 500);
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

  // 게스트 주문 내역 확인
  async function checkGuestOrders(phone) {
    isPhoneChecking = true;
    try {
      const response = await fetch(`/api/guests/phone/${phone}`);
      const data = await response.json();
      
      if (data.success && data.guest && data.guest.recentOrders?.length > 0) {
        updateInputStatus(phoneInput, 'success', '🎯', '게스트 주문 내역이 발견되었습니다');
        showGuestOrdersPreview(data.guest.recentOrders);
      } else {
        updateInputStatus(phoneInput, 'success', '✅', '유효한 전화번호입니다');
        hideGuestOrdersPreview();
      }
    } catch (error) {
      updateInputStatus(phoneInput, 'success', '✅', '유효한 전화번호입니다');
      hideGuestOrdersPreview();
    } finally {
      isPhoneChecking = false;
      updateSubmitButton();
    }
  }

  // 게스트 주문 내역 미리보기 표시
  function showGuestOrdersPreview(orders) {
    const preview = document.getElementById('guestOrdersPreview');
    const content = document.getElementById('guestOrdersContent');
    
    const ordersHtml = orders.slice(0, 3).map(order => `
      <div class="order-preview-item">
        <div>
          <div style="font-weight: 600;">${order.store_name || '매장 정보 없음'}</div>
          <div style="font-size: 12px; color: #999;">${new Date(order.order_date).toLocaleDateString()}</div>
        </div>
        <div style="font-weight: 600; color: #667eea;">
          ${order.final_amount?.toLocaleString() || '0'}원
        </div>
      </div>
    `).join('');
    
    content.innerHTML = ordersHtml + 
      (orders.length > 3 ? `<div style="text-align: center; margin-top: 8px; color: #999; font-size: 12px;">외 ${orders.length - 3}건 더</div>` : '');
    
    preview.style.display = 'block';
  }

  // 게스트 주문 내역 미리보기 숨김
  function hideGuestOrdersPreview() {
    const preview = document.getElementById('guestOrdersPreview');
    preview.style.display = 'none';
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
    background: #51cf66;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    animation: slideDown 0.3s ease;
    box-shadow: 0 4px 12px rgba(81, 207, 102, 0.4);
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
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
    background: #ff6b6b;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    animation: slideDown 0.3s ease;
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
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
