// 빠른 로그인 함수 먼저 정의 (전역으로)
window.quickLogin = async function(userId) {
  console.log(`🚀 빠른 로그인 시도: ${userId}`);

  try {
    // 로딩 표시
    const quickBtn = document.querySelector('#quickLogin');
    if (quickBtn) {
      quickBtn.disabled = true;
      quickBtn.innerHTML = `
        <div class="quick-btn-icon">⏳</div>
        <div class="quick-btn-content">
          <span class="quick-btn-title">로그인 중...</span>
          <span class="quick-btn-desc">잠시만 기다리세요</span>
        </div>
      `;
    }

    const response = await fetch('/api/auth/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, pw: '1234' })
    });

    const data = await response.json();

    if (response.ok && data.user) {
      // 사용자 정보 설정
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

      // 쿠키 저장
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      document.cookie = `userInfo=${encodeURIComponent(JSON.stringify(window.userInfo))}; expires=${expires.toUTCString()}; path=/`;

      console.log(`✅ 빠른 로그인 성공: ${data.user.name}`);

      // 성공 메시지
      const successDiv = document.createElement('div');
      successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
      `;
      successDiv.textContent = `${data.user.name}님 환영합니다!`;
      document.body.appendChild(successDiv);

      setTimeout(() => {
        successDiv.remove();
        if (typeof renderMap === 'function') {
          renderMap();
        } else {
          window.location.href = '/';
        }
      }, 500);

    } else {
      throw new Error(data.error || '로그인에 실패했습니다');
    }
  } catch (error) {
    console.error('❌ 빠른 로그인 실패:', error);

    // 버튼 복원
    const quickBtn = document.querySelector('#quickLogin');
    if (quickBtn) {
      quickBtn.disabled = false;
      quickBtn.innerHTML = `
        <div class="quick-btn-icon">⚡</div>
        <div class="quick-btn-content">
          <span class="quick-btn-title">빠른 로그인</span>
          <span class="quick-btn-desc">user1 계정</span>
        </div>
      `;
    }

    // 에러 메시지
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ef4444;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    `;
    errorDiv.textContent = error.message || '빠른 로그인에 실패했습니다';
    document.body.appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 3000);
  }
};

// 로그인 렌더링 함수
async function renderLogin() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <!-- 헤더 -->
    <header id="loginHeader">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="header-title">
          <div class="brand-logo">
            <div class="logo-icon">🍽️</div>
            <h1 class="brand-name">TableLink</h1>
          </div>
          <p class="brand-subtitle">스마트 테이블 주문의 새로운 경험</p>
        </div>
      </div>
    </header>

    <!-- 로그인 패널 -->
    <div id="loginPanel" class="collapsed">
      <div id="loginPanelHandle"></div>
      <div id="loginPanelContainer">
        <div id="loginInfoContainer">
          <!-- 로그인 폼 -->
          <div class="login-form-section">
            <div class="form-group">
              <div class="input-wrapper">
                <input id="id" type="text" placeholder=" " class="form-input" autocomplete="username" />
                <label class="form-label">아이디</label>
                <div class="input-icon">👤</div>
              </div>
            </div>

            <div class="form-group">
              <div class="input-wrapper">
                <input id="pw" type="password" placeholder=" " class="form-input" autocomplete="current-password" />
                <label class="form-label">비밀번호</label>
                <div class="input-icon">🔒</div>
              </div>
            </div>

            <!-- 로그인 버튼 -->
            <button type="submit" class="primary-btn login-btn" id="loginBtn" disabled>
            <div class="btn-content">
              <span class="btn-text">로그인</span>
              <div class="btn-loading" style="display: none;"></div>
            </div>
          </button>
        </form>


          </div>

          <!-- 구분선 -->
          <div class="divider">
            <span class="divider-text">또는</span>
          </div>

          <!-- 빠른 액세스 섹션 -->
          <div class="quick-access-section">
            <h3 class="section-title">빠른 접근</h3>

            <div class="quick-buttons-grid">
              <button id="quickLogin" class="quick-btn user-btn">
                <div class="quick-btn-icon">⚡</div>
                <div class="quick-btn-content">
                  <span class="quick-btn-title">빠른 로그인</span>
                  <span class="quick-btn-desc">user1 계정</span>
                </div>
              </button>

              <button id="adminLogin" class="quick-btn admin-btn">
                <div class="quick-btn-icon">🛠️</div>
                <div class="quick-btn-content">
                  <span class="quick-btn-title">관리자</span>
                  <span class="quick-btn-desc">Admin Panel</span>
                </div>
              </button>
            </div>

            <div class="system-buttons-grid">
              <button id="goKDS" class="system-btn kds-btn">
                <div class="system-btn-icon">📟</div>
                <div class="system-btn-content">
                  <span class="system-btn-title">KDS</span>
                  <span class="system-btn-desc">주방 디스플레이</span>
                </div>
              </button>

              <button id="goPOS" class="system-btn pos-btn">
                <div class="system-btn-icon">💳</div>
                <div class="system-btn-content">
                  <span class="system-btn-title">POS</span>
                  <span class="system-btn-desc">포스 시스템</span>
                </div>
              </button>

              <button id="goKRP" class="system-btn krp-btn">
                <div class="system-btn-icon">🖨️</div>
                <div class="system-btn-content">
                  <span class="system-btn-title">KRP</span>
                  <span class="system-btn-desc">주방 프린터</span>
                </div>
              </button>

              <button id="goTLM" class="system-btn tlm-btn">
                <div class="system-btn-icon">🏪</div>
                <div class="system-btn-content">
                  <span class="system-btn-title">사장님 앱</span>
                  <span class="system-btn-desc">매장 관리</span>
                </div>
              </button>
            </div>
          </div>

          <!-- 푸터 -->
          <div class="login-footer">
            <p class="footer-text">© 2025 TableLink. 모든 권리 보유.</p>
          </div>
        </div>
      </div>
    </div>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      /* 헤더 영역 */
      #loginHeader {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 160px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 11;
        overflow: hidden;
      }

      .header-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('TableLink.png') center/cover;
        opacity: 0.1;
      }

      .header-content {
        position: relative;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px 20px;
        color: white;
      }

      .header-title {
        text-align: center;
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
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      .brand-name {
        font-size: 28px;
        font-weight: 800;
        background: linear-gradient(135deg, #ffffff, #f0f4ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .brand-subtitle {
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        font-weight: 600;
        margin: 0;
      }

      /* 로그인 패널 - renderMyPage 스타일 */
      #loginPanel {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        background: white;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 10;
      }

      #loginPanel.collapsed {
        top: 160px;
        bottom: 0;
        height: calc(100vh - 160px);
        border-radius: 20px 20px 0 0;
      }

      #loginPanel.expanded {
        top: 0;
        bottom: 0;
        height: 100vh;
        border-radius: 0;
        z-index: 99;
      }

      #loginPanelHandle {
        width: 40px;
        height: 4px;
        background: #d1d5db;
        border-radius: 2px;
        margin: 12px auto 8px auto;
        cursor: grab;
        touch-action: none;
        transition: background 0.2s ease;
      }

      #loginPanelHandle:hover {
        background: #9ca3af;
      }

      #loginPanelContainer {
        position: relative;
        height: calc(100% - 24px);
        overflow-y: auto !important;
        overflow-x: hidden;
        box-sizing: border-box;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        padding: 0 20px 40px 20px;
        scroll-behavior: smooth;
        will-change: scroll-position;
      }

      #loginPanelContainer::-webkit-scrollbar {
        width: 4px;
      }

      #loginPanelContainer::-webkit-scrollbar-track {
        background: transparent;
      }

      #loginPanelContainer::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
      }

      #loginPanelContainer::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
      }

      /* 로그인 폼 스타일 */
      .login-form-section {
        margin-bottom: 32px;
        padding-top: 20px;
      }

      .form-group {
        margin-bottom: 24px;
      }

      .input-wrapper {
        position: relative;
      }

      .form-input {
        width: 100%;
        padding: 16px 20px 16px 48px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 16px;
        background: #fafbfc;
        transition: all 0.3s ease;
        outline: none;
      }

      .form-input:focus {
        border-color: #667eea;
        background: #ffffff;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      }

      .form-input:not(:placeholder-shown) + .form-label,
      .form-input:focus + .form-label {
        transform: translateY(-28px) scale(0.85);
        color: #667eea;
        font-weight: 600;
        opacity: 0;
      }

      .form-label {
        position: absolute;
        left: 48px;
        top: 16px;
        color: #475569;
        font-size: 16px;
        font-weight: 500;
        pointer-events: none;
        transition: all 0.3s ease;
        transform-origin: left top;
      }

      .input-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 18px;
        color: #64748b;
      }

      .primary-btn {
        width: 100%;
        padding: 16px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        margin-bottom: 20px;
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

      .btn-loading .btn-loading {
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

      .signup-section {
        text-align: center;
        margin-top: 16px;
      }

      .signup-text {
        color: #475569;
        font-size: 14px;
        font-weight: 500;
        margin-right: 8px;
      }

      .link-btn {
        background: none;
        border: none;
        color: #667eea;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 2px;
        transition: color 0.3s ease;
      }

      .link-btn:hover {
        color: #764ba2;
      }

      .divider {
        position: relative;
        text-align: center;
        margin: 32px 0;
      }

      .divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: #e2e8f0;
      }

      .divider-text {
        background: white;
        padding: 0 16px;
        color: #475569;
        font-size: 14px;
        font-weight: 600;
      }

      .quick-access-section {
        margin-bottom: 24px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 16px;
        text-align: center;
      }

      .quick-buttons-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin: 20px 0 16px 0;
      }

      .quick-btn {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px 12px;
        color: #1f2937;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
        min-height: 60px;
      }

      .quick-btn:hover {
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        border-color: #cbd5e1;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }

      .quick-btn-icon {
        font-size: 24px;
        min-width: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .quick-btn-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .quick-btn-title {
        font-size: 14px;
        font-weight: 600;
        line-height: 1.2;
      }

      .quick-btn-desc {
        font-size: 11px;
        opacity: 0.8;
        line-height: 1.2;
      }

      .system-buttons-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin: 16px 0 20px 0;
      }

      .system-btn {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px 8px;
        color: #1f2937;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        text-align: center;
        min-height: 70px;
        font-size: 11px;
        margin-bottom: 8px;
      }

      .system-btn:hover {
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        border-color: #cbd5e1;
        transform: translateY(-1px);
      }

      .system-btn-icon {
        font-size: 18px;
        margin-bottom: 2px;
      }

      .system-btn-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .system-btn-title {
        font-weight: 600;
        font-size: 11px;
        line-height: 1.1;
      }

      .system-btn-desc {
        font-size: 9px;
        opacity: 0.7;
        line-height: 1.1;
      }

      .login-footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        margin-top: 40px;
      }

      .footer-text {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
        margin: 0;
      }



      /* 반응형 디자인 */
      @media (max-width: 480px) {
        #loginHeader {
          height: 140px;
        }

        #loginPanel.collapsed {
          top: 140px;
          height: calc(100vh - 140px);
        }

        .brand-name {
          font-size: 24px;
        }

        .form-input {
          padding: 14px 16px 14px 44px;
        }

        .form-label {
          left: 44px;
          top: 14px;
        }

        .input-icon {
          left: 14px;
        }

        .quick-buttons-grid {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .system-buttons-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
      }

      @media (max-height: 800px) {
        #loginPanelContainer {
          padding-bottom: 20px;
        }
      }
    </style>
  `;

  // DOM 요소 가져오기
  const id = document.querySelector('#id');
  const pw = document.querySelector('#pw');
  const join = document.querySelector('#join');
  const login = document.querySelector('#loginBtn'); // 올바른 ID 사용
  const quickLoginBtn = document.querySelector('#quickLogin'); // Renamed to avoid conflict
  const adminLogin = document.querySelector('#adminLogin');
  const goKDS = document.querySelector('#goKDS');
  const goPOS = document.querySelector('#goPOS');
  const goKRP = document.querySelector('#goKRP');
  const goTLM = document.querySelector('#goTLM');

  // 패널 핸들링 설정
  setupLoginPanelHandling();

  // 입력 필드 변화 감지 및 버튼 활성화
  const updateLoginButton = () => {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      const idValue = id.value.trim();
      const pwValue = pw.value.trim();
      loginBtn.disabled = !(idValue && pwValue);
    }
  };

  id.addEventListener('input', updateLoginButton);
  pw.addEventListener('input', updateLoginButton);
  updateLoginButton(); // 초기 상태 설정

  // 기존 이벤트 리스너들...
  join.addEventListener('click', async () => {
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

  const showLoadingScreen = () => {
    const btnText = login.querySelector('.btn-text');
    const btnLoading = login.querySelector('.btn-loading');

    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    login.disabled = true;
  };

  const hideLoadingScreen = () => {
    const btnText = login.querySelector('.btn-text');
    const btnLoading = login.querySelector('.btn-loading');

    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    login.disabled = false;
  };

  quickLoginBtn.addEventListener('click', async () => { // Use renamed variable
    try {
      showLoadingScreen();

      const response = await fetch('/api/auth/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'user1',
          pw: '11'
        })
      });

      const data = await response.json();

      if (response.ok) {
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
        }, 100);
      } else {
        hideLoadingScreen();
        await renderLogin();
        alert(data.error || '빠른 로그인 실패');
      }
    } catch (error) {
      console.error('빠른 로그인 오류:', error);
      hideLoadingScreen();
      await renderLogin();
      alert('서버 연결에 실패했습니다');
    }
  });

  login.addEventListener('click', async () => {
    try {
      showLoadingScreen();

      const response = await fetch('/api/auth/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id.value,
          pw: pw.value
        })
      });

      const data = await response.json();

      if (response.ok) {
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
        }, 100);
      } else {
        hideLoadingScreen();
        await renderLogin();
        alert(data.error || '로그인 실패');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      hideLoadingScreen();
      await renderLogin();
      alert('서버 연결에 실패했습니다');
    }
  });



  adminLogin.addEventListener('click', () => {
    window.location.href = '/ADMIN';
  });

  goKDS.addEventListener('click', () => {
    showKDSStoreSearchModal();
  });

  goPOS.addEventListener('click', () => {
    showPOSStoreSearchModal();
  });

  goKRP.addEventListener('click', () => {
    showKRPStoreSearchModal();
  });

  goTLM.addEventListener('click', () => {
    showStoreSearchModal();
  });

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

  // KRP 매장 검색 모달 표시
  function showKRPStoreSearchModal() {
    const modal = document.createElement('div');
    modal.id = 'krpStoreSearchModal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>🖨️ KRP 진입</h2>
            <button class="close-btn" onclick="closeKRPStoreSearchModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="search-section">
              <div class="search-input-wrapper">
                <input 
                  id="krpStoreNameInput" 
                  type="text" 
                  placeholder="매장 이름을 입력하세요..." 
                  class="search-input"
                  autocomplete="off"
                />
                <div class="search-icon">🔍</div>
              </div>
              <div id="krpStoreSearchResults" class="search-results"></div>
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
          background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
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
          border-color: #e67e22;
          background: white;
          box-shadow: 0 0 0 4px rgba(230, 126, 34, 0.1);
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
          color: #e67e22;
          font-size: 14px;
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #e0e0e0;
          border-top: 2px solid #e67e22;
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
    setupKRPStoreSearch();

    setTimeout(() => {
      const input = document.getElementById('krpStoreNameInput');
      if (input) input.focus();
    }, 100);
  }

  // KRP 매장 검색 기능 설정
  function setupKRPStoreSearch() {
    const input = document.getElementById('krpStoreNameInput');
    const results = document.getElementById('krpStoreSearchResults');
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
        searchStoresForKRP(query);
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

  // KRP용 매장 검색 함수
  async function searchStoresForKRP(query) {
    const results = document.getElementById('krpStoreSearchResults');
    if (!results) return;

    try {
      console.log(`🔍 KRP 매장 검색: "${query}"`);

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
        displayKRPSearchResults(data.stores);
      } else {
        results.innerHTML = `
          <div class="no-results">
            "${query}"에 대한 검색 결과가 없습니다
          </div>
        `;
        results.style.display = 'block';
      }
    } catch (error) {
      console.error('KRP 매장 검색 실패:', error);
      results.innerHTML = `
        <div class="no-results">
          검색 중 오류가 발생했습니다
        </div>
      `;
      results.style.display = 'block';
    }
  }

  // KRP 검색 결과 표시
  function displayKRPSearchResults(stores) {
    const results = document.getElementById('krpStoreSearchResults');
    if (!results) return;

    const resultsHTML = stores.map(store => `
      <div class="store-result-item" onclick="selectStoreForKRP(${store.id}, '${store.name.replace(/'/g, "\\'")}')">
        <div class="store-result-name">${store.name}</div>
        <div class="store-result-info">
          ${store.category || '기타'} • ${store.address || '주소 정보 없음'}
        </div>
      </div>
    `).join('');

    results.innerHTML = resultsHTML;
    results.style.display = 'block';
  }

  // KRP 매장 선택
  window.selectStoreForKRP = function(storeId, storeName) {
    console.log(`✅ KRP 매장 선택: ${storeName} (ID: ${storeId})`);
    closeKRPStoreSearchModal();

    setTimeout(() => {
      window.location.href = `/krp?storeId=${storeId}`;
    }, 200);
  };

  // KRP 매장 검색 모달 닫기
  window.closeKRPStoreSearchModal = function() {
    const modal = document.getElementById('krpStoreSearchModal');
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
    const krpModal = document.getElementById('krpStoreSearchModal');

    if (tlmModal && e.target.classList.contains('modal-overlay')) {
      closeStoreSearchModal();
    }

    if (kdsModal && e.target.classList.contains('modal-overlay')) {
      closeKDSStoreSearchModal();
    }

    if (posModal && e.target.classList.contains('modal-overlay')) {
      closePOSStoreSearchModal();
    }

    if (krpModal && e.target.classList.contains('modal-overlay')) {
      closeKRPStoreSearchModal();
    }
  });

  // 패널 핸들링 함수 정의
  function setupLoginPanelHandling() {
    const panel = document.getElementById('loginPanel');
    const panelContainer = document.getElementById('loginPanelContainer');
    const handle = document.getElementById('loginPanelHandle');

    if (!panel || !panelContainer || !handle) return;

    // 마우스 휠 이벤트
    panel.addEventListener('wheel', (e) => {
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
      const isExpanded = top === 0;
      const isCollapsed = !isExpanded;

      // 아래로(내림) - 패널 확장
      if (e.deltaY > 0) {
        if (isCollapsed) {
          e.preventDefault();
          panel.classList.remove('collapsed');
          panel.classList.add('expanded');
          panel.style.top = '0px';
          return;
        }
        return;
      }

      // 위로(올림) - 패널 축소 또는 스크롤
      if (e.deltaY < 0) {
        if (isExpanded) {
          if (panelContainer.scrollTop <= 0) {
            e.preventDefault();
            panel.classList.remove('expanded');
            panel.classList.add('collapsed');
            panel.style.top = '160px';
            return;
          }
          return;
        }
      }
    });

    // 터치 이벤트
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let initialScrollTop = 0;

    handle.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      initialScrollTop = panelContainer.scrollTop;
      isDragging = true;
      panel.style.transition = 'none';
    });

    handle.addEventListener('touchmove', (e) => {
      if (!isDragging) return;

      currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
      const isExpanded = top === 0;
      const isCollapsed = !isExpanded;

      if (isExpanded && initialScrollTop <= 0 && deltaY < 0) {
        e.preventDefault();
        const newTop = Math.max(0, Math.min(160, -deltaY));
        panel.style.top = `${newTop}px`;
        return;
      }

      if (isCollapsed && deltaY > 30) {
        e.preventDefault();
        panel.classList.remove('collapsed');
        panel.classList.add('expanded');
        panel.style.top = '0px';
        return;
      }
    });

    handle.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      panel.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

      const deltaY = startY - currentY;
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;

      if (top > 80) {
        panel.classList.remove('expanded');
        panel.classList.add('collapsed');
        panel.style.top = '160px';
      } else {
        panel.classList.remove('collapsed');
        panel.classList.add('expanded');
        panel.style.top = '0px';
      }
    });

    // 핸들 클릭 이벤트
    handle.addEventListener('click', () => {
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
      const isExpanded = top === 0;

      if (isExpanded) {
        panel.classList.remove('expanded');
        panel.classList.add('collapsed');
        panel.style.top = '160px';
      } else {
        panel.classList.remove('collapsed');
        panel.classList.add('expanded');
        panel.style.top = '0px';
      }
    });
  }

  // 이벤트 리스너 설정 함수
  function setupEventListeners() {
    // Enter 키 이벤트
    const handleEnterKey = (event) => {
      if (!document.querySelector('#loginPanelContainer')) {
        return;
      }

      if (event.key === 'Enter' && event.target.id !== 'join') {
        login.click();
      }
    };

    document.removeEventListener('keydown', handleEnterKey);
    document.addEventListener('keydown', handleEnterKey);

    if (join) {
      join.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') join.click();
      });
    }
  }

  // 초기화
  setupEventListeners();


  console.log('✅ 로그인 화면 렌더링 완료 (빠른 로그인 포함)');
}

// 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.renderLogin = renderLogin;
}