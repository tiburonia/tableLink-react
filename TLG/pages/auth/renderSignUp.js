
async function renderSignUp() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div id="signupContainer">
      <!-- 헤더 -->
      <header class="signup-header">
        <button class="back-btn" onclick="renderLogin()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 12H5M12 19L5 12L12 5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1>회원가입</h1>
        <div class="header-spacer"></div>
      </header>

      <!-- 컨텐츠 -->
      <div class="signup-content">
        <!-- 브랜드 섹션 -->
        <div class="brand-section">
          <div class="brand-logo">
            <div class="logo-container">
              <div class="logo-icon">🍽️</div>
              <div class="logo-glow"></div>
            </div>
            <div class="brand-text">
              <span class="brand-name">TableLink</span>
              <span class="brand-tagline">테이블의 새로운 경험</span>
            </div>
          </div>
          <div class="welcome-message">
            <h2>환영합니다!</h2>
            <p>몇 가지 정보만 입력하시면<br>바로 시작할 수 있어요</p>
          </div>
        </div>

        <!-- 회원가입 폼 -->
        <form class="signup-form" id="signupForm">
          <!-- 아이디 입력 -->
          <div class="form-group">
            <div class="input-wrapper">
              <label class="input-label" for="signupId">
                <span class="label-text">아이디</span>
                <span class="label-required">*</span>
              </label>
              <div class="input-container">
                <input 
                  type="text" 
                  id="signupId" 
                  class="form-input" 
                  placeholder="영문, 숫자 3-20자" 
                  autocomplete="username"
                  maxlength="20"
                >
                <div class="input-status" id="idStatus"></div>
                <div class="input-underline"></div>
              </div>
              <div class="form-hint" id="idHint">영문과 숫자만 사용할 수 있어요</div>
            </div>
          </div>

          <!-- 비밀번호 입력 -->
          <div class="form-group">
            <div class="input-wrapper">
              <label class="input-label" for="signupPw">
                <span class="label-text">비밀번호</span>
                <span class="label-required">*</span>
              </label>
              <div class="input-container">
                <input 
                  type="password" 
                  id="signupPw" 
                  class="form-input" 
                  placeholder="최소 4자 이상" 
                  autocomplete="new-password"
                >
                <button type="button" class="input-action" onclick="togglePassword('signupPw')">
                  <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <div class="input-underline"></div>
              </div>
              <div class="form-hint" id="pwHint">안전한 비밀번호를 만들어 주세요</div>
            </div>
          </div>

          <!-- 비밀번호 확인 -->
          <div class="form-group">
            <div class="input-wrapper">
              <label class="input-label" for="signupPwConfirm">
                <span class="label-text">비밀번호 확인</span>
                <span class="label-required">*</span>
              </label>
              <div class="input-container">
                <input 
                  type="password" 
                  id="signupPwConfirm" 
                  class="form-input" 
                  placeholder="비밀번호를 다시 입력해 주세요" 
                  autocomplete="new-password"
                >
                <button type="button" class="input-action" onclick="togglePassword('signupPwConfirm')">
                  <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <div class="input-underline"></div>
              </div>
              <div class="form-hint" id="pwConfirmHint">비밀번호가 일치하는지 확인해 주세요</div>
            </div>
          </div>

          <!-- 이름 입력 -->
          <div class="form-group">
            <div class="input-wrapper">
              <label class="input-label" for="signupName">
                <span class="label-text">이름</span>
                <span class="label-optional">선택사항</span>
              </label>
              <div class="input-container">
                <input 
                  type="text" 
                  id="signupName" 
                  class="form-input" 
                  placeholder="실명을 입력해 주세요" 
                  autocomplete="name"
                >
                <div class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div class="input-underline"></div>
              </div>
              <div class="form-hint">개인화된 서비스를 위해 입력해 주세요</div>
            </div>
          </div>

          <!-- 전화번호 입력 -->
          <div class="form-group">
            <div class="input-wrapper">
              <label class="input-label" for="signupPhone">
                <span class="label-text">전화번호</span>
                <span class="label-optional">선택사항</span>
              </label>
              <div class="input-container">
                <input 
                  type="tel" 
                  id="signupPhone" 
                  class="form-input" 
                  placeholder="010-1234-5678" 
                  autocomplete="tel"
                >
                <div class="input-status" id="phoneStatus"></div>
                <div class="input-underline"></div>
              </div>
              <div class="form-hint phone-hint" id="phoneHint">기존 주문 내역 연동을 위해 입력해 주세요</div>
              
              <!-- 주문내역 찾기 버튼 -->
              <button type="button" class="search-order-btn" id="searchOrdersBtn" onclick="searchOrdersByPhone()" style="display: none;">
                <div class="btn-content">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <span>주문내역 찾기</span>
                </div>
                <div class="btn-ripple"></div>
              </button>
            </div>
          </div>

          <!-- 게스트 주문 내역 미리보기 -->
          <div class="orders-preview-container" id="guestOrdersPreview" style="display: none;">
            <div class="preview-card">
              <div class="preview-header">
                <div class="preview-title">
                  <div class="preview-icon">📋</div>
                  <span>발견된 주문 내역</span>
                  <div class="preview-badge" id="previewCount"></div>
                </div>
              </div>
              <div class="preview-content" id="guestOrdersContent"></div>
              <div class="preview-summary" id="previewSummary"></div>
            </div>
          </div>

          <!-- 회원가입 버튼 -->
          <button type="submit" class="signup-submit-btn" id="signupBtn" disabled>
            <div class="btn-content">
              <span class="btn-text">계정 만들기</span>
              <svg class="btn-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12H19M12 5L19 12L12 19" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="btn-loading" style="display: none;">
              <div class="loading-spinner"></div>
              <span>계정 생성중...</span>
            </div>
            <div class="btn-shine"></div>
          </button>
        </form>

        <!-- 로그인 링크 -->
        <div class="login-link-section">
          <div class="divider">
            <span class="divider-text">또는</span>
          </div>
          <button type="button" class="login-link-btn" onclick="renderLogin()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19L5 12L12 5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>이미 계정이 있으신가요? 로그인하기</span>
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

      #main {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', system-ui, sans-serif;
        overflow: auto;
        position: relative;
      }

      #signupContainer {
        width: 390px;
        height: 760px;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        box-shadow: 0 32px 64px rgba(0, 0, 0, 0.2);
      }

      /* 헤더 */
      .signup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: max(env(safe-area-inset-top), 20px) 24px 20px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(32px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        flex-shrink: 0;
        z-index: 100;
      }

      .back-btn {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.15);
        border: none;
        border-radius: 12px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .back-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateX(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }

      .signup-header h1 {
        margin: 0;
        color: white;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .header-spacer {
        width: 40px;
      }

      /* 컨텐츠 */
      .signup-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        padding: 0 24px 24px;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      /* 브랜드 섹션 */
      .brand-section {
        text-align: center;
        margin: 32px 0 40px;
        flex-shrink: 0;
      }

      .brand-logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .logo-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .logo-icon {
        font-size: 32px;
        width: 64px;
        height: 64px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.25);
        position: relative;
        z-index: 2;
      }

      .logo-glow {
        position: absolute;
        width: 64px;
        height: 64px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
        border-radius: 50%;
        filter: blur(8px);
        z-index: 1;
      }

      .brand-text {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .brand-name {
        font-size: 28px;
        font-weight: 800;
        color: white;
        letter-spacing: -1px;
        background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .brand-tagline {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 500;
      }

      .welcome-message h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 700;
        color: white;
        letter-spacing: -0.5px;
      }

      .welcome-message p {
        margin: 0;
        font-size: 16px;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.5;
        font-weight: 400;
      }

      /* 폼 */
      .signup-form {
        display: flex;
        flex-direction: column;
        gap: 28px;
        flex: 1;
        min-height: 0;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }

      .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .input-label {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
      }

      .label-text {
        font-size: 15px;
        font-weight: 600;
        color: white;
        letter-spacing: -0.2px;
      }

      .label-required {
        color: #ff6b6b;
        font-size: 12px;
        font-weight: 700;
      }

      .label-optional {
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 6px;
        backdrop-filter: blur(8px);
      }

      .input-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      .form-input {
        width: 100%;
        height: 56px;
        padding: 16px 48px 16px 16px;
        font-size: 16px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.95);
        color: #1a1a1a;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
        position: relative;
        z-index: 2;
      }

      .form-input::placeholder {
        color: #888;
        font-weight: 400;
      }

      .form-input:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.6);
        background: white;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
      }

      .form-input.error {
        border-color: #ff6b6b;
        background: #fff8f8;
        animation: shake 0.4s ease-in-out;
      }

      .form-input.success {
        border-color: #51cf66;
        background: #f8fff9;
      }

      .input-underline {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateX(-50%);
        z-index: 3;
      }

      .form-input:focus + .input-action + .input-underline,
      .form-input:focus + .input-underline {
        width: 100%;
      }

      .input-status,
      .input-icon {
        position: absolute;
        right: 16px;
        color: #888;
        pointer-events: none;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .input-action {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3;
      }

      .input-action:hover {
        color: #333;
        background: rgba(0, 0, 0, 0.05);
        transform: scale(1.05);
      }

      .form-hint {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        margin-top: 6px;
        min-height: 16px;
        transition: all 0.3s ease;
        line-height: 1.4;
        font-weight: 500;
      }

      .form-hint.error {
        color: #ff8a95;
        font-weight: 600;
      }

      .form-hint.success {
        color: #69db7c;
        font-weight: 600;
      }

      .phone-hint {
        margin-bottom: 16px !important;
      }

      /* 주문내역 찾기 버튼 */
      .search-order-btn {
        width: 100%;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        border-radius: 14px;
        padding: 14px 20px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        position: relative;
        overflow: hidden;
      }

      .search-order-btn:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
      }

      .btn-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      }

      /* 주문 내역 미리보기 */
      .orders-preview-container {
        margin-top: 20px;
        flex-shrink: 0;
      }

      .preview-card {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(16px);
      }

      .preview-header {
        margin-bottom: 16px;
      }

      .preview-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .preview-icon {
        font-size: 16px;
      }

      .preview-title span {
        font-weight: 700;
        color: #1a1a1a;
        font-size: 15px;
      }

      .preview-badge {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        margin-left: auto;
      }

      .preview-content {
        color: #555;
        font-size: 13px;
        line-height: 1.5;
        max-height: 160px;
        overflow-y: auto;
        margin-bottom: 16px;
      }

      .order-preview-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 0;
        border-bottom: 1px solid #f0f0f0;
        transition: all 0.2s ease;
      }

      .order-preview-item:hover {
        background: rgba(103, 126, 234, 0.05);
        margin: 0 -8px;
        padding: 14px 8px;
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
        color: #1a1a1a;
        font-size: 14px;
      }

      .order-date {
        font-size: 12px;
        color: #888;
      }

      .order-amount {
        font-weight: 700;
        color: #667eea;
        font-size: 14px;
      }

      .preview-summary {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        font-size: 13px;
      }

      .summary-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        text-align: center;
        padding: 12px;
        background: rgba(103, 126, 234, 0.05);
        border-radius: 12px;
      }

      .summary-label {
        color: #666;
        font-weight: 500;
      }

      .summary-value {
        color: #1a1a1a;
        font-weight: 700;
        font-size: 16px;
      }

      /* 회원가입 버튼 */
      .signup-submit-btn {
        width: 100%;
        height: 56px;
        background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
        color: white;
        border: none;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        margin: 40px 0 20px;
        box-shadow: 0 6px 24px rgba(81, 207, 102, 0.3);
        flex-shrink: 0;
        overflow: hidden;
      }

      .signup-submit-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(81, 207, 102, 0.4);
      }

      .signup-submit-btn:disabled {
        background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
        color: rgba(255, 255, 255, 0.8);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .signup-submit-btn .btn-content {
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      }

      .signup-submit-btn.loading .btn-content {
        opacity: 0;
      }

      .signup-submit-btn.loading .btn-loading {
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

      .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .btn-shine {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: left 0.6s ease;
      }

      .signup-submit-btn:hover:not(:disabled) .btn-shine {
        left: 100%;
      }

      .btn-arrow {
        transition: transform 0.3s ease;
      }

      .signup-submit-btn:hover:not(:disabled) .btn-arrow {
        transform: translateX(2px);
      }

      /* 로그인 링크 섹션 */
      .login-link-section {
        margin: 40px 0 24px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        flex-shrink: 0;
      }

      .divider {
        position: relative;
        width: 100%;
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .divider-text {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: rgba(255, 255, 255, 0.7);
        padding: 0 16px;
        font-size: 13px;
        font-weight: 500;
      }

      .login-link-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 12px 20px;
        border-radius: 12px;
        backdrop-filter: blur(16px);
      }

      .login-link-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      /* 애니메이션 */
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
      }

      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      /* 스크롤바 */
      .signup-content::-webkit-scrollbar {
        width: 4px;
      }

      .signup-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
      }

      .signup-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
      }

      .signup-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }

      .preview-content::-webkit-scrollbar {
        width: 4px;
      }

      .preview-content::-webkit-scrollbar-track {
        background: #f8f9fa;
        border-radius: 2px;
      }

      .preview-content::-webkit-scrollbar-thumb {
        background: #dee2e6;
        border-radius: 2px;
      }

      /* 반응형 */
      @media (max-height: 800px) {
        .brand-section {
          margin: 20px 0 30px;
        }
        
        .welcome-message h2 {
          font-size: 20px;
        }
        
        .form-group {
          gap: 20px;
        }
      }

      /* Safe area 지원 */
      @supports (padding: max(0px)) {
        .signup-header {
          padding-top: max(env(safe-area-inset-top), 20px);
        }

        .login-link-section {
          margin-bottom: max(env(safe-area-inset-bottom), 24px);
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

  // 버튼 리플 효과
  function addRippleEffect(button, event) {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('div');
    ripple.className = 'btn-ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // 검색 버튼에 리플 효과 추가
  searchBtn.addEventListener('click', (e) => {
    addRippleEffect(searchBtn, e);
  });

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
    const hint = container.closest('.input-wrapper').querySelector('.form-hint');

    input.className = `form-input ${status}`;
    if (statusElement) statusElement.textContent = icon;

    if (message) {
      hint.textContent = message;
      hint.className = `form-hint ${status}`;
    } else {
      const originalHint = hint.getAttribute('data-original') || '';
      hint.textContent = originalHint;
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
        showSuccessToast('🎉 회원가입이 완료되었습니다!');

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
      showErrorToast(error.message || '회원가입 중 오류가 발생했습니다');
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
        showSuccessToast('🔄 기존 주문 내역이 회원 계정에 연동되었습니다!');
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
    showErrorToast('올바른 전화번호를 입력해주세요');
    return;
  }

  const searchBtn = document.getElementById('searchOrdersBtn');
  const originalContent = searchBtn.innerHTML;

  searchBtn.innerHTML = `
    <div class="btn-content">
      <div style="width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span>검색중...</span>
    </div>
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
      showSuccessToast(`📱 ${data.orders.length}건의 주문 내역을 찾았습니다!`);
    } else {
      hideGuestOrdersPreview();
      showInfoToast('해당 전화번호로 등록된 주문 내역이 없습니다');
    }
  } catch (error) {
    console.error('주문내역 검색 실패:', error);
    showErrorToast('주문내역 검색 중 오류가 발생했습니다');
    hideGuestOrdersPreview();
  } finally {
    searchBtn.innerHTML = originalContent;
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
    (orders.length > 5 ? `<div style="text-align: center; margin-top: 16px; color: #999; font-size: 13px;">외 ${orders.length - 5}건 더</div>` : '');

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
  const eyeIcon = button.querySelector('.eye-icon');

  if (input.type === 'password') {
    input.type = 'text';
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12A18.5 18.5 0 0 1 19.42 16.42"/>
      <path d="M1 1L23 23" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10.584 10.587A2 2 0 0 0 13.415 13.414" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  } else {
    input.type = 'password';
    eyeIcon.innerHTML = `
      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
      <circle cx="12" cy="12" r="3"/>
    `;
  }
}

// 토스트 메시지 함수들
function showSuccessToast(message) {
  showToast(message, 'success');
}

function showErrorToast(message) {
  showToast(message, 'error');
}

function showInfoToast(message) {
  showToast(message, 'info');
}

function showToast(message, type) {
  const colors = {
    success: { bg: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)', shadow: 'rgba(81, 207, 102, 0.3)' },
    error: { bg: 'linear-gradient(135deg, #ff6b6b 0%, #fa5252 100%)', shadow: 'rgba(255, 107, 107, 0.3)' },
    info: { bg: 'linear-gradient(135deg, #339af0 0%, #228be6 100%)', shadow: 'rgba(51, 154, 240, 0.3)' }
  };

  const color = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="font-size: 16px;">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</div>
      <span>${message}</span>
    </div>
  `;
  
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: ${color.bg};
    color: white;
    padding: 16px 24px;
    border-radius: 16px;
    font-weight: 600;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 12px 32px ${color.shadow};
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
window.togglePassword = togglePassword;
window.searchOrdersByPhone = searchOrdersByPhone;
