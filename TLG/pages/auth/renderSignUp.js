
async function renderSignUp() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div id="signupContainer">
      <header class="signup-header">
        <button class="back-btn" onclick="renderLogin()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19L5 12L12 5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1>회원가입</h1>
        <div class="header-spacer"></div>
      </header>

      <div class="signup-content">
        <div class="welcome-section">
          <div class="brand-logo">
            <div class="logo-icon">🍽️</div>
            <div class="brand-text">TableLink</div>
          </div>
          <p class="welcome-text">새로운 테이블 경험을 시작하세요</p>
        </div>

        <form class="signup-form" id="signupForm">
          <!-- 아이디 입력 -->
          <div class="form-group">
            <label class="form-label">
              아이디 <span class="required">*</span>
            </label>
            <div class="input-container">
              <input type="text" id="signupId" class="form-input" placeholder="영문, 숫자 3-20자" autocomplete="username">
              <div class="input-status" id="idStatus"></div>
            </div>
            <div class="form-hint" id="idHint">영문과 숫자만 사용 가능합니다</div>
          </div>

          <!-- 비밀번호 입력 -->
          <div class="form-group">
            <label class="form-label">
              비밀번호 <span class="required">*</span>
            </label>
            <div class="input-container">
              <input type="password" id="signupPw" class="form-input" placeholder="최소 4자 이상" autocomplete="new-password">
              <button type="button" class="input-action" onclick="togglePassword('signupPw')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div class="form-hint" id="pwHint">비밀번호는 4자 이상 입력해주세요</div>
          </div>

          <!-- 비밀번호 확인 -->
          <div class="form-group">
            <label class="form-label">
              비밀번호 확인 <span class="required">*</span>
            </label>
            <div class="input-container">
              <input type="password" id="signupPwConfirm" class="form-input" placeholder="비밀번호를 다시 입력하세요" autocomplete="new-password">
              <button type="button" class="input-action" onclick="togglePassword('signupPwConfirm')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div class="form-hint" id="pwConfirmHint">비밀번호를 다시 입력해주세요</div>
          </div>

          <!-- 이름 입력 -->
          <div class="form-group">
            <label class="form-label">
              이름 <span class="optional">선택</span>
            </label>
            <div class="input-container">
              <input type="text" id="signupName" class="form-input" placeholder="실명을 입력하세요" autocomplete="name">
              <div class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 전화번호 입력 -->
          <div class="form-group">
            <label class="form-label">
              전화번호 <span class="optional">선택</span>
            </label>
            <div class="input-container">
              <input type="tel" id="signupPhone" class="form-input" placeholder="010-1234-5678" autocomplete="tel">
              <div class="input-status" id="phoneStatus"></div>
            </div>
            <div class="form-hint" id="phoneHint">기존 주문 내역 연동을 위해 입력해주세요</div>

            <button type="button" class="search-btn" id="searchOrdersBtn" onclick="searchOrdersByPhone()" style="display: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <span>주문내역 찾기</span>
            </button>
          </div>

          <!-- 게스트 주문 내역 미리보기 -->
          <div class="orders-preview" id="guestOrdersPreview" style="display: none;">
            <div class="preview-header">
              <div class="preview-info">
                <span class="preview-icon">📋</span>
                <span class="preview-title">발견된 주문 내역</span>
              </div>
              <span class="preview-count" id="previewCount"></span>
            </div>
            <div class="preview-content" id="guestOrdersContent"></div>
            <div class="preview-summary" id="previewSummary"></div>
          </div>

          <!-- 회원가입 버튼 -->
          <button type="submit" class="signup-btn" id="signupBtn" disabled>
            <span class="btn-content">
              <span class="btn-text">회원가입</span>
              <svg class="btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12H19M12 5L19 12L12 19" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <div class="btn-loading" style="display: none;">
              <div class="loading-spinner"></div>
            </div>
          </button>
        </form>

        <!-- 구분선 -->
        <div class="divider-section">
          <div class="divider-line">
            <span class="divider-text">또는</span>
          </div>
        </div>

        <!-- 로그인 링크 -->
        <div class="auth-link-section">
          <button type="button" class="auth-link-btn" onclick="renderLogin()">
            <svg class="back-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19L5 12L12 5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>이미 계정이 있으신가요? <strong>로그인하기</strong></span>
          </button>
        </div>
      </div>
    </div>

    <style>
      * {
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      #main {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
        overflow: hidden;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
      }

      #signupContainer {
        width: 100%;
        max-width: 390px;
        height: 95vh;
        max-height: 780px;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      }

      /* 헤더 */
      .signup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: max(env(safe-area-inset-top), 20px) 24px 20px;
        background: rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(30px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        flex-shrink: 0;
        z-index: 100;
      }

      .back-btn {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.15);
        border: none;
        border-radius: 12px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        touch-action: manipulation;
      }

      .back-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateX(-2px);
      }

      .signup-header h1 {
        margin: 0;
        color: white;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.3px;
      }

      .header-spacer {
        width: 36px;
      }

      /* 메인 콘텐츠 */
      .signup-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        padding: 0 24px;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      /* 브랜드 섹션 */
      .welcome-section {
        text-align: center;
        padding: 28px 0 24px;
        flex-shrink: 0;
      }

      .brand-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .logo-icon {
        font-size: 28px;
        width: 50px;
        height: 50px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .brand-text {
        font-size: 24px;
        font-weight: 800;
        color: white;
        letter-spacing: -0.6px;
      }

      .welcome-text {
        margin: 0;
        color: rgba(255, 255, 255, 0.85);
        font-size: 14px;
        font-weight: 500;
        line-height: 1.5;
      }

      /* 폼 */
      .signup-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
        flex: 1;
        min-height: 0;
        margin-bottom: 8px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex-shrink: 0;
      }

      .form-label {
        font-size: 14px;
        font-weight: 600;
        color: white;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 2px;
      }

      .required {
        color: #ff7875;
        font-size: 12px;
        font-weight: 700;
      }

      .optional {
        color: rgba(255, 255, 255, 0.55);
        font-size: 12px;
        font-weight: 500;
      }

      .input-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      .form-input {
        width: 100%;
        height: 48px;
        padding: 0 48px 0 16px;
        font-size: 16px;
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.95);
        color: #2d3748;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
        outline: none;
      }

      .form-input::placeholder {
        color: #a0aec0;
        font-weight: 400;
      }

      .form-input:focus {
        border-color: rgba(255, 255, 255, 0.6);
        background: white;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
      }

      .form-input.error {
        border-color: #ff7875;
        background: #fff5f5;
      }

      .form-input.success {
        border-color: #52c41a;
        background: #f6ffed;
      }

      .input-status,
      .input-icon {
        position: absolute;
        right: 16px;
        color: #a0aec0;
        pointer-events: none;
        font-size: 14px;
      }

      .input-action {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        color: #718096;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .input-action:hover {
        color: #4a5568;
        background: rgba(0, 0, 0, 0.04);
      }

      .form-hint {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.65);
        margin-top: 4px;
        min-height: 16px;
        transition: all 0.3s ease;
        line-height: 1.4;
        padding-left: 2px;
      }

      .form-hint.error {
        color: #ff9c99;
        font-weight: 500;
      }

      .form-hint.success {
        color: #73d13d;
        font-weight: 500;
      }

      .search-btn {
        width: 100%;
        background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 14px 18px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 12px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(66, 153, 225, 0.25);
      }

      .search-btn:hover {
        background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(66, 153, 225, 0.35);
      }

      /* 주문 내역 미리보기 */
      .orders-preview {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        margin-top: 16px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        flex-shrink: 0;
      }

      .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .preview-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .preview-icon {
        font-size: 16px;
      }

      .preview-title {
        font-weight: 700;
        color: #2d3748;
        font-size: 14px;
      }

      .preview-count {
        background: #667eea;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
      }

      .preview-content {
        color: #4a5568;
        font-size: 13px;
        line-height: 1.5;
        max-height: 160px;
        overflow-y: auto;
      }

      .order-preview-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .order-preview-item:last-child {
        border-bottom: none;
      }

      .order-item-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .store-name {
        font-weight: 600;
        color: #2d3748;
        font-size: 14px;
      }

      .order-date {
        font-size: 12px;
        color: #718096;
      }

      .order-amount {
        font-weight: 700;
        color: #667eea;
        font-size: 14px;
      }

      .preview-summary {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #f1f5f9;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        font-size: 13px;
      }

      .summary-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .summary-label {
        color: #718096;
        font-weight: 500;
      }

      .summary-value {
        color: #2d3748;
        font-weight: 700;
        font-size: 15px;
      }

      /* 회원가입 버튼 */
      .signup-btn {
        width: 100%;
        height: 52px;
        background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
        color: white;
        border: none;
        border-radius: 14px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        margin: 24px 0 0;
        box-shadow: 0 6px 25px rgba(82, 196, 26, 0.3);
        touch-action: manipulation;
        flex-shrink: 0;
      }

      .signup-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 35px rgba(82, 196, 26, 0.4);
      }

      .signup-btn:disabled {
        background: linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%);
        color: rgba(255, 255, 255, 0.6);
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }

      .btn-content {
        display: flex;
        align-items: center;
        gap: 8px;
        transition: opacity 0.3s ease;
      }

      .signup-btn.loading .btn-content {
        opacity: 0;
      }

      .signup-btn.loading .btn-loading {
        display: flex !important;
      }

      .btn-loading {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
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

      .btn-arrow {
        transition: transform 0.3s ease;
      }

      .signup-btn:hover:not(:disabled) .btn-arrow {
        transform: translateX(2px);
      }

      /* 구분선 섹션 */
      .divider-section {
        padding: 32px 0 24px;
        flex-shrink: 0;
      }

      .divider-line {
        position: relative;
        width: 100%;
        height: 1px;
        background-color: rgba(255, 255, 255, 0.2);
      }

      .divider-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: rgba(255, 255, 255, 0.7);
        padding: 0 16px;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
      }

      /* 인증 링크 섹션 */
      .auth-link-section {
        padding-bottom: max(env(safe-area-inset-bottom), 24px);
        flex-shrink: 0;
        display: flex;
        justify-content: center;
      }

      .auth-link-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        color: rgba(255, 255, 255, 0.85);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        touch-action: manipulation;
        text-decoration: none;
        padding: 14px 20px;
        backdrop-filter: blur(10px);
      }

      .auth-link-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateY(-1px);
      }

      .auth-link-btn strong {
        font-weight: 700;
        color: #73d13d;
      }

      .auth-link-btn .back-icon {
        stroke: rgba(255, 255, 255, 0.7);
        transition: all 0.3s ease;
        flex-shrink: 0;
      }

      .auth-link-btn:hover .back-icon {
        stroke: white;
        transform: translateX(-2px);
      }

      /* 스크롤바 */
      .signup-content::-webkit-scrollbar {
        width: 4px;
      }

      .signup-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 2px;
      }

      .signup-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.25);
        border-radius: 2px;
      }

      .signup-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.4);
      }

      .preview-content::-webkit-scrollbar {
        width: 3px;
      }

      .preview-content::-webkit-scrollbar-track {
        background: #f8fafc;
        border-radius: 2px;
      }

      .preview-content::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 2px;
      }

      .preview-content::-webkit-scrollbar-thumb:hover {
        background: #cbd5e0;
      }

      /* 반응형 디자인 */
      @media (max-width: 400px) {
        .signup-content {
          padding: 0 20px;
        }

        .signup-header {
          padding-left: 20px;
          padding-right: 20px;
        }
      }

      @media (max-height: 700px) {
        .welcome-section {
          padding: 20px 0 16px;
        }

        .signup-form {
          gap: 16px;
        }

        .divider-section {
          padding: 24px 0 16px;
        }
      }

      /* Safe area 지원 */
      @supports (padding: max(0px)) {
        .signup-header {
          padding-top: max(env(safe-area-inset-top), 20px);
        }

        .auth-link-section {
          padding-bottom: max(env(safe-area-inset-bottom), 24px);
        }
      }

      /* 터치 디바이스 최적화 */
      @media (pointer: coarse) {
        .form-input {
          height: 50px;
        }

        .signup-btn {
          height: 54px;
        }

        .search-btn {
          padding: 16px 20px;
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
  let isPhoneValid = true;

  phoneInput.addEventListener('input', (e) => {
    const value = formatPhoneNumber(e.target.value);
    e.target.value = value;

    clearTimeout(phoneCheckTimeout);

    if (value.length === 0) {
      hideGuestOrdersPreview();
      updateInputStatus(phoneInput, '', '', '');
      searchBtn.style.display = 'none';
      isPhoneValid = true;
      updateSubmitButton();
      return;
    }

    if (value.length < 13) {
      updateInputStatus(phoneInput, 'error', '❌', '올바른 전화번호를 입력하세요');
      searchBtn.style.display = 'none';
      hideGuestOrdersPreview();
      isPhoneValid = false;
      updateSubmitButton();
      return;
    }

    // 전화번호 중복 검사
    updateInputStatus(phoneInput, 'checking', '⏳', '전화번호 확인 중...');

    phoneCheckTimeout = setTimeout(async () => {
      await checkPhoneAvailability(value);
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

  // 전화번호 중복 확인
  async function checkPhoneAvailability(phone) {
    isPhoneChecking = true;
    try {
      const response = await fetch('/api/users/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (data.available) {
        updateInputStatus(phoneInput, 'success', '✅', '사용 가능한 전화번호입니다');
        searchBtn.style.display = 'flex';
        isPhoneValid = true;
      } else {
        updateInputStatus(phoneInput, 'error', '❌', '이미 등록된 전화번호입니다');
        searchBtn.style.display = 'none';
        hideGuestOrdersPreview();
        isPhoneValid = false;
      }
    } catch (error) {
      updateInputStatus(phoneInput, 'error', '❌', '전화번호 확인 중 오류가 발생했습니다');
      isPhoneValid = false;
    } finally {
      isPhoneChecking = false;
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
    const container = input.closest('.input-container');
    const statusElement = container.querySelector('.input-status');
    const hint = container.closest('.form-group').querySelector('.form-hint');

    input.className = `form-input ${status}`;
    if (statusElement) statusElement.textContent = icon;

    if (message) {
      hint.textContent = message;
      hint.className = `form-hint ${status}`;
    } else {
      hint.textContent = hint.getAttribute('data-default') || '';
      hint.className = 'form-hint';
    }
  }

  // 제출 버튼 상태 업데이트
  function updateSubmitButton() {
    const id = idInput.value.trim();
    const pw = pwInput.value;
    const pwConfirm = pwConfirmInput.value;
    const phone = phoneInput.value.trim();

    const isFormValid = 
      isIdValid && 
      !isIdChecking && 
      !isPhoneChecking &&
      id.length >= 3 && 
      pw.length >= 4 && 
      pw === pwConfirm &&
      (phone.length === 0 || isPhoneValid);

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
        showSuccessMessage('🎉 회원가입이 완료되었습니다!');

        if (formData.phone) {
          try {
            await convertGuestToMember(formData.phone, formData.id);
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

// 전화번호로 주문내역 검색 함수
async function searchOrdersByPhone() {
  const phoneInput = document.getElementById('signupPhone');
  const phone = phoneInput.value.trim();

  if (!phone || phone.length < 13) {
    showErrorMessage('올바른 전화번호를 입력해주세요');
    return;
  }

  const searchBtn = document.getElementById('searchOrdersBtn');
  const originalHtml = searchBtn.innerHTML;

  searchBtn.innerHTML = `
    <div style="width: 12px; height: 12px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <span>검색중...</span>
  `;
  searchBtn.disabled = true;

  try {
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
    searchBtn.innerHTML = originalHtml;
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
    (orders.length > 5 ? `<div style="text-align: center; margin-top: 16px; color: #718096; font-size: 12px;">외 ${orders.length - 5}건 더</div>` : '');

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
  const button = input.parentElement.querySelector('.input-action');

  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12A18.5 18.5 0 0 1 19.42 16.42"/>
        <path d="M1 1L23 23" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10.584 10.587A2 2 0 0 0 13.415 13.414" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  } else {
    input.type = 'password';
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    `;
  }
}

// 토스트 메시지 함수들
function showSuccessMessage(message) {
  showToast(message, 'success');
}

function showErrorMessage(message) {
  showToast(message, 'error');
}

function showInfoMessage(message) {
  showToast(message, 'info');
}

function showToast(message, type) {
  const colors = {
    success: { bg: '#52c41a', shadow: 'rgba(82, 196, 26, 0.3)' },
    error: { bg: '#ff4d4f', shadow: 'rgba(255, 77, 79, 0.3)' },
    info: { bg: '#1890ff', shadow: 'rgba(24, 144, 255, 0.3)' }
  };

  const color = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: ${color.bg};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 10px 40px ${color.shadow};
    backdrop-filter: blur(10px);
    animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 90%;
    text-align: center;
  `;

  // 애니메이션 추가
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { opacity: 0; transform: translate(-50%, -20px) scale(0.95); }
      to { opacity: 1; transform: translate(-50%, 0) scale(1); }
    }
    @keyframes slideUp {
      from { opacity: 1; transform: translate(-50%, 0) scale(1); }
      to { opacity: 0; transform: translate(-50%, -20px) scale(0.95); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 400);
  }, 3500);
}

// 전역 함수로 등록
window.renderSignUp = renderSignUp;
window.togglePassword = togglePassword;
window.searchOrdersByPhone = searchOrdersByPhone;
