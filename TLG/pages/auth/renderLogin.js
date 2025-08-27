async function renderLogin() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div id="loginContainer">
      <!-- 배경 애니메이션 -->
      <div class="background-animation">
        <div class="floating-circle circle-1"></div>
        <div class="floating-circle circle-2"></div>
        <div class="floating-circle circle-3"></div>
        <div class="floating-circle circle-4"></div>
      </div>

      <!-- 메인 컨텐츠 -->
      <div class="login-content">
        <!-- 브랜드 섹션 -->
        <div class="brand-section">
          <div class="brand-logo">
            <div class="logo-icon">🍽️</div>
            <h1 class="brand-title">TableLink</h1>
          </div>
          <p class="brand-subtitle">테이블에서 시작하는 새로운 경험</p>
        </div>

        <!-- 로그인 폼 -->
        <div class="login-form-container">
          <form class="login-form" id="loginForm">
            <div class="input-group">
              <div class="input-container">
                <input 
                  id='loginId' 
                  type='text' 
                  placeholder='아이디를 입력하세요'
                  class="modern-input"
                  autocomplete="username"
                />
                <div class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="input-group">
              <div class="input-container">
                <input 
                  id='loginPw' 
                  type='password' 
                  placeholder='비밀번호를 입력하세요'
                  class="modern-input"
                  autocomplete="current-password"
                />
                <div class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7A5 5 0 0 1 17 7V11"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="button-group">
              <button type="button" id='signupBtn' class="secondary-btn">
                <span class="btn-content">
                  <span>회원가입</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21V19A4 4 0 0 0 12 15H5A4 4 0 0 0 1 19V21"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                </span>
              </button>

              <button type="submit" id='loginBtn' class="primary-btn">
                <span class="btn-content">
                  <span>로그인</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3H19A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H15"/>
                    <polyline points="10,17 15,12 10,7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </span>
                <div class="btn-loading" style="display: none;">
                  <div class="loading-spinner"></div>
                </div>
              </button>
            </div>
          </form>
        </div>

        <!-- 구분선 -->
        <div class="divider">
          <span class="divider-text">개발자 도구</span>
        </div>

        <!-- 개발자 버튼들 -->
        <div class="dev-buttons">
          <button id='quickLoginBtn' class="dev-btn quick-login">
            <div class="dev-btn-content">
              <span class="dev-btn-icon">⚡</span>
              <div class="dev-btn-text">
                <span class="dev-btn-title">빠른 로그인</span>
                <span class="dev-btn-desc">user1 계정</span>
              </div>
            </div>
          </button>

          <div class="dev-grid">
            <button id='adminLoginBtn' class="dev-btn admin">
              <span class="dev-btn-icon">🛠️</span>
              <span class="dev-btn-label">Admin</span>
            </button>

            <button id='goKDSBtn' class="dev-btn kds">
              <span class="dev-btn-icon">📟</span>
              <span class="dev-btn-label">KDS</span>
            </button>

            <button id='goPOSBtn' class="dev-btn pos">
              <span class="dev-btn-icon">💳</span>
              <span class="dev-btn-label">POS</span>
            </button>

            <button id='goTLMBtn' class="dev-btn tlm">
              <span class="dev-btn-icon">🏪</span>
              <span class="dev-btn-label">사장님</span>
            </button>
          </div>
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
        width: 390px;
        height: 760px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
        position: relative;
        overflow: hidden;
        left: 50%;
        transform: translateX(-50%);
      }

      #loginContainer {
        height: 760px;
        width: 390px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }

      /* 배경 애니메이션 */
      .background-animation {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .floating-circle {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        animation: float 6s ease-in-out infinite;
      }

      .circle-1 {
        width: 80px;
        height: 80px;
        top: 20%;
        left: 10%;
        animation-delay: 0s;
      }

      .circle-2 {
        width: 60px;
        height: 60px;
        top: 60%;
        right: 15%;
        animation-delay: 2s;
      }

      .circle-3 {
        width: 100px;
        height: 100px;
        bottom: 20%;
        left: 20%;
        animation-delay: 4s;
      }

      .circle-4 {
        width: 40px;
        height: 40px;
        top: 40%;
        right: 30%;
        animation-delay: 1s;
      }

      @keyframes float {
        0%, 100% {
          transform: translateY(0px) scale(1);
          opacity: 0.7;
        }
        50% {
          transform: translateY(-20px) scale(1.1);
          opacity: 1;
        }
      }

      /* 메인 컨텐츠 */
      .login-content {
        width: 100%;
        max-width: 300px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 24px;
        padding: 28px 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        position: relative;
        z-index: 10;
        margin: 0 auto;
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
        gap: 12px;
        margin-bottom: 12px;
      }

      .logo-icon {
        font-size: 40px;
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      .brand-title {
        font-size: 28px;
        font-weight: 800;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.5px;
        margin: 0;
      }

      .brand-subtitle {
        color: #666;
        font-size: 14px;
        font-weight: 500;
        margin: 0;
        line-height: 1.4;
      }

      /* 로그인 폼 */
      .login-form-container {
        margin-bottom: 24px;
      }

      .input-group {
        margin-bottom: 16px;
      }

      .input-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      .modern-input {
        width: 100%;
        height: 52px;
        padding: 0 50px 0 16px;
        font-size: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        background: white;
        color: #333;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
      }

      .modern-input::placeholder {
        color: #9ca3af;
        font-weight: 400;
      }

      .modern-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      }

      .input-icon {
        position: absolute;
        right: 16px;
        color: #9ca3af;
        pointer-events: none;
      }

      .modern-input:focus + .input-icon {
        color: #667eea;
      }

      /* 버튼 그룹 */
      .button-group {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }

      .primary-btn, .secondary-btn {
        flex: 1;
        height: 52px;
        border: none;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        touch-action: manipulation;
      }

      .primary-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      }

      .primary-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
      }

      .secondary-btn {
        background: white;
        color: #667eea;
        border: 2px solid #667eea;
      }

      .secondary-btn:hover {
        background: #667eea;
        color: white;
        transform: translateY(-2px);
      }

      .btn-content {
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.3s ease;
      }

      .primary-btn.loading .btn-content {
        opacity: 0;
      }

      .primary-btn.loading .btn-loading {
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

      /* 구분선 */
      .divider {
        display: flex;
        align-items: center;
        margin: 32px 0 24px;
      }

      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e5e7eb;
      }

      .divider-text {
        padding: 0 16px;
        color: #9ca3af;
        font-size: 12px;
        font-weight: 500;
      }

      /* 개발자 버튼들 */
      .dev-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .dev-btn {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        touch-action: manipulation;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 13px;
      }

      .dev-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .quick-login {
        padding: 16px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;
      }

      .quick-login:hover {
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
      }

      .dev-btn-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .dev-btn-icon {
        font-size: 20px;
      }

      .dev-btn-text {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }

      .dev-btn-title {
        font-weight: 700;
        font-size: 14px;
      }

      .dev-btn-desc {
        font-weight: 500;
        font-size: 11px;
        opacity: 0.8;
      }

      .dev-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .dev-grid .dev-btn {
        padding: 12px 8px;
        flex-direction: column;
        gap: 6px;
      }

      .dev-btn-label {
        font-size: 11px;
        font-weight: 600;
      }

      .admin { border-left: 4px solid #6b7280; }
      .kds { border-left: 4px solid #1f2937; }
      .pos { border-left: 4px solid #374151; }
      .tlm { border-left: 4px solid #667eea; }

      .admin:hover { background: #f9fafb; }
      .kds:hover { background: #f3f4f6; }
      .pos:hover { background: #f9fafb; }
      .tlm:hover { background: #f0f4ff; }

      /* TLG 760px 높이에 최적화 */
      @media (max-height: 760px) {
        .login-content {
          padding: 24px 18px;
        }

        .brand-section {
          margin-bottom: 20px;
        }

        .logo-icon {
          width: 60px;
          height: 60px;
          font-size: 30px;
        }

        .brand-title {
          font-size: 22px;
        }

        .dev-buttons {
          gap: 8px;
        }
      }

      /* 터치 디바이스 최적화 */
      @media (pointer: coarse) {
        .modern-input {
          height: 54px;
        }

        .primary-btn, .secondary-btn {
          height: 54px;
        }
      }
    </style>
  `;

  // 이벤트 리스너 설정
  setupLoginEvents();
}

function setupLoginEvents() {
  const loginForm = document.getElementById('loginForm');
  const loginId = document.getElementById('loginId');
  const loginPw = document.getElementById('loginPw');
  const signupBtn = document.getElementById('signupBtn');
  const loginBtn = document.getElementById('loginBtn');
  const quickLoginBtn = document.getElementById('quickLoginBtn');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const goKDSBtn = document.getElementById('goKDSBtn');
  const goPOSBtn = document.getElementById('goPOSBtn');
  const goTLMBtn = document.getElementById('goTLMBtn');

  // 회원가입 버튼
  signupBtn.addEventListener('click', async () => {
    try {
      if (typeof renderSignUp !== 'function' && typeof window.renderSignUp !== 'function') {
        console.log('🔄 renderSignUp 함수 동적 로드 시도');

        const script = document.createElement('script');
        script.src = '/TLG/pages/auth/renderSignUp.js';
        script.onload = () => {
          console.log('✅ renderSignUp 스크립트 로드 완료');
          if (typeof window.renderSignUp === 'function') {
            window.renderSignUp();
          } else {
            alert('회원가입 기능 로드에 실패했습니다.');
          }
        };
        script.onerror = () => {
          console.error('❌ renderSignUp 스크립트 로드 실패');
          alert('회원가입 기능 로드에 실패했습니다.');
        };
        document.head.appendChild(script);
      } else {
        const signUpFunc = window.renderSignUp || renderSignUp;
        signUpFunc();
      }
    } catch (error) {
      console.error('❌ renderSignUp 실행 오류:', error);
      alert('회원가입 화면으로 이동할 수 없습니다.');
    }
  });

  // 로딩 화면 함수
  const showLoadingScreen = () => {
    loginBtn.classList.add('loading');
  };

  const hideLoadingScreen = () => {
    loginBtn.classList.remove('loading');
  };

  // 빠른 로그인
  quickLoginBtn.addEventListener('click', async () => {
    try {
      showLoadingScreen();

      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'user1', pw: '11' })
      });

      const data = await response.json();

      if (response.ok) {
        handleLoginSuccess(data);
      } else {
        hideLoadingScreen();
        alert(data.error || '빠른 로그인 실패');
      }
    } catch (error) {
      console.error('빠른 로그인 오류:', error);
      hideLoadingScreen();
      alert('서버 연결에 실패했습니다');
    }
  });

  // 일반 로그인
  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!loginId.value.trim() || !loginPw.value.trim()) {
      alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      showLoadingScreen();

      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: loginId.value.trim(),
          pw: loginPw.value.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        handleLoginSuccess(data);
      } else {
        hideLoadingScreen();
        alert(data.error || '로그인 실패');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      hideLoadingScreen();
      alert('서버 연결에 실패했습니다');
    }
  };

  // 로그인 성공 처리
  const handleLoginSuccess = (data) => {
    if (!window.userInfo) {
      window.userInfo = {};
    }

    window.userInfo = {
      id: data.user.id,
      pw: data.user.pw || '',
      name: data.user.name,
      phone: data.user.phone,
      email: '',
      address: '',
      birth: '',
      gender: '',
      point: data.user.point || 0,
      orderList: data.user.orderList || [],
      totalCost: 0,
      realCost: 0,
      reservationList: data.user.reservationList || [],
      coupons: data.user.coupons || { unused: [], used: [] },
      favorites: data.user.favoriteStores || []
    };

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `userInfo=${encodeURIComponent(JSON.stringify(window.userInfo))}; expires=${expires.toUTCString()}; path=/`;

    if (typeof cacheManager !== 'undefined' && cacheManager.setUserInfo) {
      cacheManager.setUserInfo(window.userInfo);
    }

    setTimeout(async () => {
      if (typeof renderMap === 'function') {
        await renderMap();
      } else {
        window.location.href = '/';
      }
    }, 500);
  };

  // 폼 제출 이벤트
  loginForm.addEventListener('submit', handleLogin);
  loginBtn.addEventListener('click', handleLogin);

  // 엔터키 처리
  const handleEnterKey = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleLogin();
    }
  };

  loginId.addEventListener('keydown', handleEnterKey);
  loginPw.addEventListener('keydown', handleEnterKey);

  // 개발자 버튼들
  adminLoginBtn.addEventListener('click', () => {
    window.location.href = '/ADMIN';
  });

  goKDSBtn.addEventListener('click', () => {
    showKDSStoreSearchModal();
  });

  goPOSBtn.addEventListener('click', () => {
    showPOSStoreSearchModal();
  });

  goTLMBtn.addEventListener('click', () => {
    showStoreSearchModal();
  });

  // 매장 검색 모달들 (기존 코드 유지)
  // ... (기존 모달 코드들은 그대로 유지)
}

// POS 매장 검색 모달 표시
function showPOSStoreSearchModal() {
  const modal = document.createElement('div');
  modal.id = 'posStoreSearchModal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>💳 POS 진입</h2>
          <button class="close-btn" onclick="closePOSStoreSearchModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="search-section">
            <div class="search-input-wrapper">
              <input 
                id="posStoreNameInput" 
                type="text" 
                placeholder="매장 이름을 입력하세요..." 
                class="search-input"
                autocomplete="off"
              />
              <div class="search-icon">🔍</div>
            </div>
            <div id="posStoreSearchResults" class="search-results"></div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }

      .modal-content {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #666666 0%, #333333 100%);
        color: white;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
      }

      .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .modal-body {
        padding: 24px;
      }

      .search-section {
        position: relative;
      }

      .search-input-wrapper {
        position: relative;
        margin-bottom: 16px;
      }

      .search-input {
        width: 100%;
        padding: 16px 20px;
        padding-right: 50px;
        font-size: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        background: #f9fafb;
        transition: all 0.3s ease;
        box-sizing: border-box;
      }

      .search-input:focus {
        outline: none;
        border-color: #666666;
        background: white;
        box-shadow: 0 0 0 4px rgba(102, 102, 102, 0.1);
      }

      .search-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 18px;
        pointer-events: none;
      }

      .search-results {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: white;
        display: none;
      }

      .store-result-item {
        padding: 16px 20px;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
        transition: all 0.2s ease;
      }

      .store-result-item:hover {
        background: #f8fafc;
      }

      .store-result-item:last-child {
        border-bottom: none;
      }

      .store-result-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .store-result-info {
        font-size: 14px;
        color: #6b7280;
      }

      .no-results {
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
      }

      .loading-results {
        padding: 20px;
        text-align: center;
        color: #666666;
        font-size: 14px;
      }

      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #e0e0e0;
        border-top: 2px solid #666666;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  document.body.appendChild(modal);
  setupPOSStoreSearch();

  setTimeout(() => {
    const input = document.getElementById('posStoreNameInput');
    if (input) input.focus();
  }, 100);
}

// POS 매장 검색 기능 설정
function setupPOSStoreSearch() {
  const input = document.getElementById('posStoreNameInput');
  const results = document.getElementById('posStoreSearchResults');
  let searchTimeout = null;

  if (!input || !results) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
      results.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(() => {
      searchStoresForPOS(query);
    }, 200);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstResult = results.querySelector('.store-result-item');
      if (firstResult) {
        firstResult.click();
      }
    }
  });
}

// POS용 매장 검색 함수
async function searchStoresForPOS(query) {
  const results = document.getElementById('posStoreSearchResults');
  if (!results) return;

  try {
    console.log(`🔍 POS 매장 검색: "${query}"`);

    results.innerHTML = `
      <div class="loading-results">
        <div class="loading-spinner"></div>
        검색 중...
      </div>
    `;
    results.style.display = 'block';

    const response = await fetch(`/api/stores/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error('검색 실패');
    }

    const data = await response.json();

    if (data.success && data.stores && data.stores.length > 0) {
      displayPOSSearchResults(data.stores);
    } else {
      results.innerHTML = `
        <div class="no-results">
          "${query}"에 대한 검색 결과가 없습니다
        </div>
      `;
      results.style.display = 'block';
    }
  } catch (error) {
    console.error('POS 매장 검색 실패:', error);
    results.innerHTML = `
      <div class="no-results">
        검색 중 오류가 발생했습니다
      </div>
    `;
    results.style.display = 'block';
  }
}

// POS 검색 결과 표시
function displayPOSSearchResults(stores) {
  const results = document.getElementById('posStoreSearchResults');
  if (!results) return;

  const resultsHTML = stores.map(store => `
    <div class="store-result-item" onclick="selectStoreForPOS(${store.id}, '${store.name.replace(/'/g, "\\'")}')">
      <div class="store-result-name">${store.name}</div>
      <div class="store-result-info">
        ${store.category || '기타'} • ${store.address || '주소 정보 없음'}
      </div>
    </div>
  `).join('');

  results.innerHTML = resultsHTML;
  results.style.display = 'block';
}

// POS 매장 선택
window.selectStoreForPOS = function(storeId, storeName) {
  console.log(`✅ POS 매장 선택: ${storeName} (ID: ${storeId})`);
  closePOSStoreSearchModal();

  setTimeout(() => {
    window.location.href = `/pos/${storeId}`;
  }, 200);
};

// POS 매장 검색 모달 닫기
window.closePOSStoreSearchModal = function() {
  const modal = document.getElementById('posStoreSearchModal');
  if (modal) {
    modal.remove();
  }
};

// KDS 매장 검색 모달 표시
function showKDSStoreSearchModal() {
  const modal = document.createElement('div');
  modal.id = 'kdsStoreSearchModal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>📟 KDS 진입</h2>
          <button class="close-btn" onclick="closeKDSStoreSearchModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="search-section">
            <div class="search-input-wrapper">
              <input 
                id="kdsStoreNameInput" 
                type="text" 
                placeholder="매장 이름을 입력하세요..." 
                class="search-input"
                autocomplete="off"
              />
              <div class="search-icon">🔍</div>
            </div>
            <div id="kdsStoreSearchResults" class="search-results"></div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }

      .modal-content {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
        color: white;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
      }

      .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .modal-body {
        padding: 24px;
      }

      .search-section {
        position: relative;
      }

      .search-input-wrapper {
        position: relative;
        margin-bottom: 16px;
      }

      .search-input {
        width: 100%;
        padding: 16px 20px;
        padding-right: 50px;
        font-size: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        background: #f9fafb;
        transition: all 0.3s ease;
        box-sizing: border-box;
      }

      .search-input:focus {
        outline: none;
        border-color: #2c3e50;
        background: white;
        box-shadow: 0 0 0 4px rgba(44, 62, 80, 0.1);
      }

      .search-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 18px;
        pointer-events: none;
      }

      .search-results {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: white;
        display: none;
      }

      .store-result-item {
        padding: 16px 20px;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
        transition: all 0.2s ease;
      }

      .store-result-item:hover {
        background: #f8fafc;
      }

      .store-result-item:last-child {
        border-bottom: none;
      }

      .store-result-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .store-result-info {
        font-size: 14px;
        color: #6b7280;
      }

      .no-results {
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
      }

      .loading-results {
        padding: 20px;
        text-align: center;
        color: #2c3e50;
        font-size: 14px;
      }

      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #e0e0e0;
        border-top: 2px solid #2c3e50;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  document.body.appendChild(modal);
  setupKDSStoreSearch();

  setTimeout(() => {
    const input = document.getElementById('kdsStoreNameInput');
    if (input) input.focus();
  }, 100);
}

// KDS 매장 검색 기능 설정
function setupKDSStoreSearch() {
  const input = document.getElementById('kdsStoreNameInput');
  const results = document.getElementById('kdsStoreSearchResults');
  let searchTimeout = null;

  if (!input || !results) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
      results.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(() => {
      searchStoresForKDS(query);
    }, 200);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstResult = results.querySelector('.store-result-item');
      if (firstResult) {
        firstResult.click();
      }
    }
  });
}

// KDS용 매장 검색 함수
async function searchStoresForKDS(query) {
  const results = document.getElementById('kdsStoreSearchResults');
  if (!results) return;

  try {
    console.log(`🔍 KDS 매장 검색: "${query}"`);

    results.innerHTML = `
      <div class="loading-results">
        <div class="loading-spinner"></div>
        검색 중...
      </div>
    `;
    results.style.display = 'block';

    const response = await fetch(`/api/stores/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error('검색 실패');
    }

    const data = await response.json();

    if (data.success && data.stores && data.stores.length > 0) {
      displayKDSSearchResults(data.stores);
    } else {
      results.innerHTML = `
        <div class="no-results">
          "${query}"에 대한 검색 결과가 없습니다
        </div>
      `;
      results.style.display = 'block';
    }
  } catch (error) {
    console.error('KDS 매장 검색 실패:', error);
    results.innerHTML = `
      <div class="no-results">
        검색 중 오류가 발생했습니다
      </div>
    `;
    results.style.display = 'block';
  }
}

// KDS 검색 결과 표시
function displayKDSSearchResults(stores) {
  const results = document.getElementById('kdsStoreSearchResults');
  if (!results) return;

  const resultsHTML = stores.map(store => `
    <div class="store-result-item" onclick="selectStoreForKDS(${store.id}, '${store.name.replace(/'/g, "\\'")}')">
      <div class="store-result-name">${store.name}</div>
      <div class="store-result-info">
        ${store.category || '기타'} • ${store.address || '주소 정보 없음'}
      </div>
    </div>
  `).join('');

  results.innerHTML = resultsHTML;
  results.style.display = 'block';
}

// KDS 매장 선택
window.selectStoreForKDS = function(storeId, storeName) {
  console.log(`✅ KDS 매장 선택: ${storeName} (ID: ${storeId})`);
  closeKDSStoreSearchModal();

  setTimeout(() => {
    window.location.href = `/kds/${storeId}`;
  }, 200);
};

// KDS 매장 검색 모달 닫기
window.closeKDSStoreSearchModal = function() {
  const modal = document.getElementById('kdsStoreSearchModal');
  if (modal) {
    modal.remove();
  }
};

// 매장 검색 모달 표시
function showStoreSearchModal() {
  const modal = document.createElement('div');
  modal.id = 'storeSearchModal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>🏪 사장님 앱 진입</h2>
          <button class="close-btn" onclick="closeStoreSearchModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="search-section">
            <div class="search-input-wrapper">
              <input 
                id="storeNameInput" 
                type="text" 
                placeholder="매장 이름을 입력하세요..." 
                class="search-input"
                autocomplete="off"
              />
              <div class="search-icon">🔍</div>
            </div>
            <div id="storeSearchResults" class="search-results"></div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }

      .modal-content {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
      }

      .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .modal-body {
        padding: 24px;
      }

      .search-section {
        position: relative;
      }

      .search-input-wrapper {
        position: relative;
        margin-bottom: 16px;
      }

      .search-input {
        width: 100%;
        padding: 16px 20px;
        padding-right: 50px;
        font-size: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        background: #f9fafb;
        transition: all 0.3s ease;
        box-sizing: border-box;
      }

      .search-input:focus {
        outline: none;
        border-color: #667eea;
        background: white;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      }

      .search-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 18px;
        pointer-events: none;
      }

      .search-results {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: white;
        display: none;
      }

      .store-result-item {
        padding: 16px 20px;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
        transition: all 0.2s ease;
      }

      .store-result-item:hover {
        background: #f8fafc;
      }

      .store-result-item:last-child {
        border-bottom: none;
      }

      .store-result-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .store-result-info {
        font-size: 14px;
        color: #6b7280;
      }

      .no-results {
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
      }

      .loading-results {
        padding: 20px;
        text-align: center;
        color: #667eea;
        font-size: 14px;
      }

      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #e0e0e0;
        border-top: 2px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  document.body.appendChild(modal);
  setupStoreSearch();

  setTimeout(() => {
    const input = document.getElementById('storeNameInput');
    if (input) input.focus();
  }, 100);
}

// 매장 검색 기능 설정
function setupStoreSearch() {
  const input = document.getElementById('storeNameInput');
  const results = document.getElementById('storeSearchResults');
  let searchTimeout = null;

  if (!input || !results) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
      results.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(() => {
      searchStoresForTLM(query);
    }, 200);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstResult = results.querySelector('.store-result-item');
      if (firstResult) {
        firstResult.click();
      }
    }
  });
}

// TLM용 매장 검색 함수
async function searchStoresForTLM(query) {
  const results = document.getElementById('storeSearchResults');
  if (!results) return;

  try {
    console.log(`🔍 TLM 매장 검색: "${query}"`);

    results.innerHTML = `
      <div class="loading-results">
        <div class="loading-spinner"></div>
        검색 중...
      </div>
    `;
    results.style.display = 'block';

    const response = await fetch(`/api/stores/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error('검색 실패');
    }

    const data = await response.json();

    if (data.success && data.stores && data.stores.length > 0) {
      displayTLMSearchResults(data.stores);
    } else {
      results.innerHTML = `
        <div class="no-results">
          "${query}"에 대한 검색 결과가 없습니다
        </div>
      `;
      results.style.display = 'block';
    }
  } catch (error) {
    console.error('TLM 매장 검색 실패:', error);
    results.innerHTML = `
      <div class="no-results">
        검색 중 오류가 발생했습니다
      </div>
    `;
    results.style.display = 'block';
  }
}

// TLM 검색 결과 표시
function displayTLMSearchResults(stores) {
  const results = document.getElementById('storeSearchResults');
  if (!results) return;

  const resultsHTML = stores.map(store => `
    <div class="store-result-item" onclick="selectStoreForTLM(${store.id}, '${store.name.replace(/'/g, "\\'")}')">
      <div class="store-result-name">${store.name}</div>
      <div class="store-result-info">
        ${store.category || '기타'} • ${store.address || '주소 정보 없음'}
      </div>
    </div>
  `).join('');

  results.innerHTML = resultsHTML;
  results.style.display = 'block';
}

// TLM 매장 선택
window.selectStoreForTLM = function(storeId, storeName) {
  console.log(`✅ TLM 매장 선택: ${storeName} (ID: ${storeId})`);
  closeStoreSearchModal();

  setTimeout(() => {
    window.location.href = `/tlm/${storeId}`;
  }, 200);
};

// 매장 검색 모달 닫기
window.closeStoreSearchModal = function() {
  const modal = document.getElementById('storeSearchModal');
  if (modal) {
    modal.remove();
  }
};

// 모달 외부 클릭시 닫기
document.addEventListener('click', (e) => {
  const tlmModal = document.getElementById('storeSearchModal');
  const kdsModal = document.getElementById('kdsStoreSearchModal');
  const posModal = document.getElementById('posStoreSearchModal');

  if (tlmModal && e.target.classList.contains('modal-overlay')) {
    closeStoreSearchModal();
  }

  if (kdsModal && e.target.classList.contains('modal-overlay')) {
    closeKDSStoreSearchModal();
  }

  if (posModal && e.target.classList.contains('modal-overlay')) {
    closePOSStoreSearchModal();
  }
});