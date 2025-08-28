async function renderSignUp() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div id="signupContainer">
      <!-- 헤더 -->
      <header class="signup-header">
        <button class="back-btn" onclick="renderLogin()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19L5 12L12 5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1>회원가입</h1>
        <div class="header-spacer"></div>
      </header>

      <!-- 메인 컨텐츠 -->
      <div class="signup-content">
        <!-- 브랜드 섹션 -->
        <div class="brand-section">
          <div class="brand-logo">
            <div class="logo-wrapper">
              <div class="logo-icon">🍽️</div>
              <div class="logo-glow"></div>
            </div>
            <div class="brand-info">
              <h2 class="brand-name">TableLink</h2>
              <p class="brand-tagline">새로운 식사 경험의 시작</p>
            </div>
          </div>
        </div>

        <!-- 회원가입 폼 -->
        <form class="signup-form" id="signupForm">
          <!-- 아이디 입력 -->
          <div class="input-group">
            <label for="signupId" class="input-label">
              아이디 <span class="required">*</span>
            </label>
            <div class="input-wrapper">
              <input 
                type="text" 
                id="signupId" 
                class="form-input" 
                placeholder="영문, 숫자 조합 3-20자"
                autocomplete="username"
                maxlength="20"
                required
              >
              <div class="input-status" id="idStatus"></div>
            </div>
            <div class="input-hint" id="idHint">영문과 숫자만 사용 가능합니다</div>
          </div>

          <!-- 비밀번호 입력 -->
          <div class="input-group">
            <label for="signupPw" class="input-label">
              비밀번호 <span class="required">*</span>
            </label>
            <div class="input-wrapper">
              <input 
                type="password" 
                id="signupPw" 
                class="form-input" 
                placeholder="최소 4자 이상"
                autocomplete="new-password"
                required
              >
              <button type="button" class="input-toggle" onclick="togglePasswordVisibility('signupPw')">
                <svg class="eye-icon show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg class="eye-icon hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12A18.5 18.5 0 0 1 19.42 16.42"/>
                  <path d="M1 1L23 23" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10.584 10.587A2 2 0 0 0 13.415 13.414" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="input-status" id="pwStatus"></div>
            </div>
            <div class="input-hint" id="pwHint">안전한 비밀번호를 설정해주세요</div>
          </div>

          <!-- 비밀번호 확인 -->
          <div class="input-group">
            <label for="signupPwConfirm" class="input-label">
              비밀번호 확인 <span class="required">*</span>
            </label>
            <div class="input-wrapper">
              <input 
                type="password" 
                id="signupPwConfirm" 
                class="form-input" 
                placeholder="비밀번호를 다시 입력해주세요"
                autocomplete="new-password"
                required
              >
              <button type="button" class="input-toggle" onclick="togglePasswordVisibility('signupPwConfirm')">
                <svg class="eye-icon show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg class="eye-icon hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12A18.5 18.5 0 0 1 19.42 16.42"/>
                  <path d="M1 1L23 23" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10.584 10.587A2 2 0 0 0 13.415 13.414" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="input-status" id="pwConfirmStatus"></div>
            </div>
            <div class="input-hint" id="pwConfirmHint">위에서 입력한 비밀번호와 같아야 합니다</div>
          </div>

          <!-- 이름 입력 -->
          <div class="input-group">
            <label for="signupName" class="input-label">
              이름 <span class="optional">선택사항</span>
            </label>
            <div class="input-wrapper">
              <input 
                type="text" 
                id="signupName" 
                class="form-input" 
                placeholder="실명을 입력해주세요"
                autocomplete="name"
              >
              <div class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>
            <div class="input-hint">개인화된 서비스 제공을 위해 입력해주세요</div>
          </div>

          <!-- 전화번호 입력 -->
          <div class="input-group">
            <label for="signupPhone" class="input-label">
              전화번호 <span class="optional">선택사항</span>
            </label>
            <div class="input-wrapper">
              <input 
                type="tel" 
                id="signupPhone" 
                class="form-input" 
                placeholder="010-1234-5678"
                autocomplete="tel"
              >
              <div class="input-status" id="phoneStatus"></div>
            </div>
            <div class="input-hint" id="phoneHint">기존 주문 내역 연동을 위해 입력해주세요</div>

            <!-- 주문내역 검색 버튼 -->
            <button type="button" class="search-orders-btn" id="searchOrdersBtn" onclick="searchOrdersByPhone()" style="display: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              주문 내역 찾기
            </button>
          </div>

          <!-- 주문 내역 미리보기 -->
          <div class="orders-preview" id="guestOrdersPreview" style="display: none;">
            <div class="preview-header">
              <div class="preview-icon">📋</div>
              <div class="preview-title">발견된 주문 내역</div>
              <div class="preview-count" id="previewCount">0건</div>
            </div>
            <div class="preview-content" id="guestOrdersContent"></div>
            <div class="preview-summary" id="previewSummary"></div>
          </div>

          <!-- 회원가입 버튼 -->
          <button type="submit" class="signup-btn" id="signupBtn" disabled>
            <span class="btn-text">회원가입</span>
            <div class="btn-loading" style="display: none;">
              <div class="spinner"></div>
              계정 생성 중...
            </div>
            <svg class="btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12H19M12 5L19 12L12 19" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </form>

        <!-- 로그인 링크 -->
        <div class="login-link">
          <div class="divider">
            <span>또는</span>
          </div>
          <button type="button" class="login-btn" onclick="renderLogin()">
            이미 계정이 있으신가요? 로그인하기
          </button>
        </div>
      </div>
    </div>

    <style>
      /* 기본 리셋 및 변수 */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      :root {
        --primary-color: #667eea;
        --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --secondary-color: #f8fafc;
        --accent-color: #10b981;
        --error-color: #ef4444;
        --warning-color: #f59e0b;
        --text-dark: #1f2937;
        --text-light: #6b7280;
        --border-color: #e5e7eb;
        --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
        --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);
        --radius-sm: 8px;
        --radius-md: 12px;
        --radius-lg: 16px;
        --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* 메인 컨테이너 */
      #main {
        background: var(--primary-gradient);
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      #signupContainer {
        width: 100%;
        max-width: 420px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        border: 1px solid rgba(255, 255, 255, 0.2);
        overflow: hidden;
        animation: slideUp 0.6s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* 헤더 */
      .signup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px;
        background: var(--primary-gradient);
        color: white;
        position: relative;
      }

      .back-btn {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: var(--radius-sm);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition);
        backdrop-filter: blur(10px);
      }

      .back-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateX(-2px);
      }

      .signup-header h1 {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .header-spacer {
        width: 40px;
      }

      /* 컨텐츠 */
      .signup-content {
        padding: 32px 24px 24px;
        max-height: 70vh;
        overflow-y: auto;
      }

      /* 브랜드 섹션 */
      .brand-section {
        text-align: center;
        margin-bottom: 32px;
      }

      .brand-logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .logo-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .logo-icon {
        font-size: 28px;
        width: 56px;
        height: 56px;
        background: var(--primary-gradient);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 2;
        box-shadow: var(--shadow-md);
      }

      .logo-glow {
        position: absolute;
        width: 56px;
        height: 56px;
        background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        filter: blur(10px);
        z-index: 1;
      }

      .brand-info {
        text-align: center;
      }

      .brand-name {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-dark);
        margin-bottom: 4px;
        letter-spacing: -0.5px;
      }

      .brand-tagline {
        font-size: 14px;
        color: var(--text-light);
        font-weight: 500;
      }

      /* 폼 스타일 */
      .signup-form {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .input-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-dark);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .required {
        color: var(--error-color);
        font-size: 12px;
      }

      .optional {
        color: var(--text-light);
        font-size: 11px;
        background: var(--secondary-color);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .form-input {
        width: 100%;
        height: 48px;
        padding: 12px 16px;
        padding-right: 48px;
        font-size: 15px;
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        background: white;
        color: var(--text-dark);
        transition: var(--transition);
        font-weight: 500;
      }

      .form-input::placeholder {
        color: var(--text-light);
        font-weight: 400;
      }

      .form-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        transform: translateY(-1px);
      }

      .form-input.success {
        border-color: var(--accent-color);
        background: rgba(16, 185, 129, 0.05);
      }

      .form-input.error {
        border-color: var(--error-color);
        background: rgba(239, 68, 68, 0.05);
        animation: shake 0.4s ease-in-out;
      }

      .form-input.warning {
        border-color: var(--warning-color);
        background: rgba(245, 158, 11, 0.05);
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
      }

      .input-status,
      .input-icon,
      .input-toggle {
        position: absolute;
        right: 16px;
        color: var(--text-light);
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .input-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: var(--transition);
      }

      .input-toggle:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--text-dark);
      }

      .input-hint {
        font-size: 12px;
        color: var(--text-light);
        font-weight: 500;
        min-height: 16px;
        transition: var(--transition);
      }

      .input-hint.success {
        color: var(--accent-color);
      }

      .input-hint.error {
        color: var(--error-color);
      }

      .input-hint.warning {
        color: var(--warning-color);
      }

      /* 검색 버튼 */
      .search-orders-btn {
        width: 100%;
        padding: 12px 16px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 12px;
        transition: var(--transition);
        box-shadow: var(--shadow-sm);
      }

      .search-orders-btn:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      /* 주문 내역 미리보기 */
      .orders-preview {
        background: var(--secondary-color);
        border-radius: var(--radius-md);
        padding: 16px;
        margin-top: 16px;
        border: 1px solid var(--border-color);
      }

      .preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .preview-icon {
        font-size: 16px;
      }

      .preview-title {
        font-weight: 600;
        color: var(--text-dark);
        font-size: 14px;
        flex: 1;
      }

      .preview-count {
        background: var(--primary-gradient);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }

      .preview-content {
        max-height: 120px;
        overflow-y: auto;
        margin-bottom: 12px;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
        font-size: 13px;
      }

      .order-item:last-child {
        border-bottom: none;
      }

      .store-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .store-name {
        font-weight: 600;
        color: var(--text-dark);
      }

      .order-date {
        color: var(--text-light);
        font-size: 11px;
      }

      .order-amount {
        font-weight: 600;
        color: var(--primary-color);
      }

      .preview-summary {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
      }

      .summary-item {
        text-align: center;
        padding: 8px;
        background: white;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
      }

      .summary-label {
        font-size: 11px;
        color: var(--text-light);
        margin-bottom: 2px;
      }

      .summary-value {
        font-weight: 700;
        color: var(--text-dark);
        font-size: 14px;
      }

      /* 회원가입 버튼 */
      .signup-btn {
        width: 100%;
        height: 52px;
        background: var(--primary-gradient);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 8px;
        transition: var(--transition);
        box-shadow: var(--shadow-md);
        position: relative;
        overflow: hidden;
      }

      .signup-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .signup-btn:disabled {
        background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
        cursor: not-allowed;
        transform: none;
        box-shadow: var(--shadow-sm);
      }

      .signup-btn.loading .btn-text,
      .signup-btn.loading .btn-arrow {
        opacity: 0;
      }

      .signup-btn.loading .btn-loading {
        display: flex !important;
      }

      .btn-loading {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
      }

      .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .btn-arrow {
        transition: transform 0.3s ease;
      }

      .signup-btn:hover:not(:disabled) .btn-arrow {
        transform: translateX(2px);
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* 로그인 링크 */
      .login-link {
        margin-top: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .divider {
        position: relative;
        width: 100%;
        height: 1px;
        background: var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .divider span {
        background: white;
        padding: 0 16px;
        color: var(--text-light);
        font-size: 13px;
        font-weight: 500;
      }

      .login-btn {
        background: none;
        border: 1px solid var(--border-color);
        color: var(--text-light);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        padding: 12px 20px;
        border-radius: var(--radius-md);
        transition: var(--transition);
      }

      .login-btn:hover {
        background: var(--secondary-color);
        color: var(--text-dark);
        border-color: var(--primary-color);
      }

      /* 스크롤바 */
      .signup-content::-webkit-scrollbar {
        width: 4px;
      }

      .signup-content::-webkit-scrollbar-track {
        background: var(--secondary-color);
        border-radius: 2px;
      }

      .signup-content::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 2px;
      }

      .signup-content::-webkit-scrollbar-thumb:hover {
        background: var(--text-light);
      }

      .preview-content::-webkit-scrollbar {
        width: 4px;
      }

      .preview-content::-webkit-scrollbar-track {
        background: white;
        border-radius: 2px;
      }

      .preview-content::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 2px;
      }

      /* 반응형 */
      @media (max-width: 480px) {
        #main {
          padding: 12px;
        }

        #signupContainer {
          max-width: 100%;
        }

        .signup-content {
          padding: 24px 20px 20px;
        }

        .brand-section {
          margin-bottom: 24px;
        }

        .signup-form {
          gap: 20px;
        }
      }

      @media (max-height: 700px) {
        .signup-content {
          max-height: 60vh;
        }

        .brand-section {
          margin-bottom: 20px;
        }

        .signup-form {
          gap: 16px;
        }
      }
    </style>
  `;

  // 폼 유효성 검사 및 이벤트 설정
  setupSignupFormLogic();
}

function setupSignupFormLogic() {
  const form = document.getElementById('signupForm');
  const idInput = document.getElementById('signupId');
  const pwInput = document.getElementById('signupPw');
  const pwConfirmInput = document.getElementById('signupPwConfirm');
  const nameInput = document.getElementById('signupName');
  const phoneInput = document.getElementById('signupPhone');
  const submitBtn = document.getElementById('signupBtn');
  const searchBtn = document.getElementById('searchOrdersBtn');

  let validationState = {
    id: { valid: false, checking: false },
    password: { valid: false },
    passwordConfirm: { valid: false },
    phone: { valid: true, checking: false } // 선택사항이므로 기본값 true
  };

  // 아이디 실시간 검증
  let idCheckTimeout;
  idInput.addEventListener('input', async (e) => {
    const value = e.target.value.trim();
    clearTimeout(idCheckTimeout);

    if (value.length === 0) {
      resetInputState(idInput, 'idHint', '영문과 숫자만 사용 가능합니다');
      validationState.id.valid = false;
      updateSubmitButton();
      return;
    }

    if (value.length < 3) {
      setInputError(idInput, 'idHint', '아이디는 3자 이상이어야 합니다');
      validationState.id.valid = false;
      updateSubmitButton();
      return;
    }

    if (!/^[a-zA-Z0-9]{3,20}$/.test(value)) {
      setInputError(idInput, 'idHint', '영문과 숫자만 사용 가능합니다');
      validationState.id.valid = false;
      updateSubmitButton();
      return;
    }

    setInputWarning(idInput, 'idHint', '아이디 확인 중...', '⏳');
    validationState.id.checking = true;

    idCheckTimeout = setTimeout(async () => {
      await checkIdAvailability(value);
    }, 500);
  });

  // 비밀번호 실시간 검증
  pwInput.addEventListener('input', validatePasswords);
  pwConfirmInput.addEventListener('input', validatePasswords);

  // 전화번호 실시간 검증
  let phoneCheckTimeout;
  phoneInput.addEventListener('input', (e) => {
    const value = formatPhoneNumber(e.target.value);
    e.target.value = value;

    clearTimeout(phoneCheckTimeout);
    hideGuestOrdersPreview();
    searchBtn.style.display = 'none';

    if (value.length === 0) {
      resetInputState(phoneInput, 'phoneHint', '기존 주문 내역 연동을 위해 입력해주세요');
      validationState.phone.valid = true; // 선택사항이므로 비어있어도 유효
      updateSubmitButton();
      return;
    }

    if (value.length < 13) {
      setInputError(phoneInput, 'phoneHint', '올바른 전화번호 형식을 입력해주세요');
      validationState.phone.valid = false;
      updateSubmitButton();
      return;
    }

    setInputWarning(phoneInput, 'phoneHint', '전화번호 확인 중...', '⏳');
    validationState.phone.checking = true;

    phoneCheckTimeout = setTimeout(async () => {
      await checkPhoneAvailability(value);
    }, 500);
  });

  // 폼 제출 이벤트
  form.addEventListener('submit', handleFormSubmit);

  // 아이디 중복 확인
  async function checkIdAvailability(id) {
    try {
      const response = await fetch('/api/users/check-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json();

      if (data.available) {
        setInputSuccess(idInput, 'idHint', '사용 가능한 아이디입니다', '✅');
        validationState.id.valid = true;
      } else {
        setInputError(idInput, 'idHint', data.message || '이미 사용 중인 아이디입니다', '❌');
        validationState.id.valid = false;
      }
    } catch (error) {
      setInputError(idInput, 'idHint', '아이디 확인 중 오류가 발생했습니다', '❌');
      validationState.id.valid = false;
    } finally {
      validationState.id.checking = false;
      updateSubmitButton();
    }
  }

  // 전화번호 중복 확인
  async function checkPhoneAvailability(phone) {
    try {
      const response = await fetch('/api/users/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.JSON.stringify({ phone })
      });

      const data = await response.json();

      if (data.available) {
        setInputSuccess(phoneInput, 'phoneHint', '사용 가능한 전화번호입니다', '✅');
        searchBtn.style.display = 'flex';
        validationState.phone.valid = true;
      } else {
        setInputError(phoneInput, 'phoneHint', '이미 등록된 전화번호입니다', '❌');
        validationState.phone.valid = false;
      }
    } catch (error) {
      setInputError(phoneInput, 'phoneHint', '전화번호 확인 중 오류가 발생했습니다', '❌');
      validationState.phone.valid = false;
    } finally {
      validationState.phone.checking = false;
      updateSubmitButton();
    }
  }

  // 비밀번호 검증
  function validatePasswords() {
    const pw = pwInput.value;
    const pwConfirm = pwConfirmInput.value;

    // 비밀번호 검증
    if (pw.length === 0) {
      resetInputState(pwInput, 'pwHint', '안전한 비밀번호를 설정해주세요');
      validationState.password.valid = false;
    } else if (pw.length < 4) {
      setInputError(pwInput, 'pwHint', '비밀번호는 4자 이상이어야 합니다', '❌');
      validationState.password.valid = false;
    } else {
      setInputSuccess(pwInput, 'pwHint', '사용 가능한 비밀번호입니다', '✅');
      validationState.password.valid = true;
    }

    // 비밀번호 확인 검증
    if (pwConfirm.length === 0) {
      resetInputState(pwConfirmInput, 'pwConfirmHint', '위에서 입력한 비밀번호와 같아야 합니다');
      validationState.passwordConfirm.valid = false;
    } else if (pw !== pwConfirm) {
      setInputError(pwConfirmInput, 'pwConfirmHint', '비밀번호가 일치하지 않습니다', '❌');
      validationState.passwordConfirm.valid = false;
    } else {
      setInputSuccess(pwConfirmInput, 'pwConfirmHint', '비밀번호가 일치합니다', '✅');
      validationState.passwordConfirm.valid = true;
    }

    updateSubmitButton();
  }

  // 입력 상태 설정 함수들
  function setInputSuccess(input, hintId, message, icon = '') {
    input.className = 'form-input success';
    const status = input.parentElement.querySelector('.input-status');
    if (status) status.textContent = icon;
    document.getElementById(hintId).textContent = message;
    document.getElementById(hintId).className = 'input-hint success';
  }

  function setInputError(input, hintId, message, icon = '') {
    input.className = 'form-input error';
    const status = input.parentElement.querySelector('.input-status');
    if (status) status.textContent = icon;
    document.getElementById(hintId).textContent = message;
    document.getElementById(hintId).className = 'input-hint error';
  }

  function setInputWarning(input, hintId, message, icon = '') {
    input.className = 'form-input warning';
    const status = input.parentElement.querySelector('.input-status');
    if (status) status.textContent = icon;
    document.getElementById(hintId).textContent = message;
    document.getElementById(hintId).className = 'input-hint warning';
  }

  function resetInputState(input, hintId, message) {
    input.className = 'form-input';
    const status = input.parentElement.querySelector('.input-status');
    if (status) status.textContent = '';
    document.getElementById(hintId).textContent = message;
    document.getElementById(hintId).className = 'input-hint';
  }

  // 제출 버튼 상태 업데이트
  function updateSubmitButton() {
    const isFormValid = 
      validationState.id.valid &&
      validationState.password.valid &&
      validationState.passwordConfirm.valid &&
      validationState.phone.valid &&
      !validationState.id.checking &&
      !validationState.phone.checking;

    submitBtn.disabled = !isFormValid;
  }

  // 폼 제출 처리
  async function handleFormSubmit(e) {
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
        showToast('🎉 회원가입이 완료되었습니다!', 'success');

        // 전화번호가 있는 경우 게스트 주문 연동 시도
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
      showToast(error.message || '회원가입 중 오류가 발생했습니다', 'error');
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
        showToast('🔄 기존 주문 내역이 회원 계정에 연동되었습니다!', 'success');
      }
    } catch (error) {
      console.error('게스트 회원 전환 실패:', error);
      throw error;
    }
  }
}

// 전화번호로 주문내역 검색
async function searchOrdersByPhone() {
  const phoneInput = document.getElementById('signupPhone');
  const phone = phoneInput.value.trim();

  if (!phone || phone.length < 13) {
    showToast('올바른 전화번호를 입력해주세요', 'error');
    return;
  }

  const searchBtn = document.getElementById('searchOrdersBtn');
  const originalContent = searchBtn.innerHTML;

  searchBtn.innerHTML = `
    <div class="spinner"></div>
    검색 중...
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
      showToast(`📱 ${data.orders.length}건의 주문 내역을 찾았습니다!`, 'success');
    } else {
      hideGuestOrdersPreview();
      showToast('해당 전화번호로 등록된 주문 내역이 없습니다', 'info');
    }
  } catch (error) {
    console.error('주문내역 검색 실패:', error);
    showToast('주문내역 검색 중 오류가 발생했습니다', 'error');
    hideGuestOrdersPreview();
  } finally {
    searchBtn.innerHTML = originalContent;
    searchBtn.disabled = false;
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
    <div class="order-item">
      <div class="store-info">
        <div class="store-name">${order.store_name || '매장 정보 없음'}</div>
        <div class="order-date">${new Date(order.payment_date || order.order_date).toLocaleDateString('ko-KR')}</div>
      </div>
      <div class="order-amount">${(order.final_amount || 0).toLocaleString()}원</div>
    </div>
  `).join('');

  content.innerHTML = ordersHtml + 
    (orders.length > 5 ? `<div style="text-align: center; margin-top: 12px; color: #6b7280; font-size: 12px;">외 ${orders.length - 5}건 더</div>` : '');

  if (stats) {
    summary.innerHTML = `
      <div class="summary-item">
        <div class="summary-label">총 주문</div>
        <div class="summary-value">${stats.totalOrders}회</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">총 금액</div>
        <div class="summary-value">${stats.totalAmount.toLocaleString()}원</div>
      </div>
    `;
  }

  preview.style.display = 'block';
}

// 게스트 주문 내역 미리보기 숨김
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
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector('.input-toggle');
  const showIcon = button.querySelector('.eye-icon.show');
  const hideIcon = button.querySelector('.eye-icon.hide');

  if (input.type === 'password') {
    input.type = 'text';
    showIcon.style.display = 'none';
    hideIcon.style.display = 'block';
  } else {
    input.type = 'password';
    showIcon.style.display = 'block';
    hideIcon.style.display = 'none';
  }
}

// 토스트 메시지
function showToast(message, type = 'info') {
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

  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">${icons[type]}</span>
      <span>${message}</span>
    </div>
  `;

  toast.style.cssText = `
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
    backdrop-filter: blur(16px);
    animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 90%;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;

  // 애니메이션 스타일 추가
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideDown {
        from { 
          opacity: 0; 
          transform: translate(-50%, -20px) scale(0.9); 
        }
        to { 
          opacity: 1; 
          transform: translate(-50%, 0) scale(1); 
        }
      }
      @keyframes slideUp {
        from { 
          opacity: 1; 
          transform: translate(-50%, 0) scale(1); 
        }
        to { 
          opacity: 0; 
          transform: translate(-50%, -20px) scale(0.9); 
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3000);
}

// 전역 함수로 등록
window.renderSignUp = renderSignUp;
window.togglePasswordVisibility = togglePasswordVisibility;
window.searchOrdersByPhone = searchOrdersByPhone;