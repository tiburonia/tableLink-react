async function renderLogin() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div class="login-layout">
      <!-- 배경 애니메이션 -->
      <div class="background-animation">
        <div class="floating-element element-1"></div>
        <div class="floating-element element-2"></div>
        <div class="floating-element element-3"></div>
        <div class="floating-element element-4"></div>
      </div>

      <!-- 로그인 컨테이너 -->
      <div class="login-container">
        <!-- 헤더 섹션 -->
        <div class="login-header">
          <div class="brand-logo">
            <div class="logo-icon">🍽️</div>
            <h1 class="brand-name">TableLink</h1>
          </div>
          <p class="brand-subtitle">스마트 테이블 주문의 새로운 경험</p>
        </div>

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
          <button id="login" class="primary-btn login-btn">
            <span class="btn-text">로그인</span>
            <div class="btn-loading" style="display: none;">
              <div class="spinner"></div>
            </div>
          </button>

          <!-- 회원가입 링크 -->
          <div class="signup-section">
            <span class="signup-text">아직 계정이 없으신가요?</span>
            <button id="join" class="link-btn">회원가입하기</button>
          </div>
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
          <p class="footer-text">© 2024 TableLink. 모든 권리 보유.</p>
        </div>
      </div>
    </div>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .login-layout {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
      }

      .background-animation {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 1;
      }

      .floating-element {
        position: absolute;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        animation: float 6s ease-in-out infinite;
      }

      .element-1 {
        width: 80px;
        height: 80px;
        top: 20%;
        left: 10%;
        animation-delay: 0s;
      }

      .element-2 {
        width: 120px;
        height: 120px;
        top: 60%;
        right: 10%;
        animation-delay: -2s;
      }

      .element-3 {
        width: 60px;
        height: 60px;
        top: 30%;
        right: 30%;
        animation-delay: -4s;
      }

      .element-4 {
        width: 100px;
        height: 100px;
        bottom: 20%;
        left: 20%;
        animation-delay: -1s;
      }

      @keyframes float {
        0%, 100% {
          transform: translateY(0px) rotate(0deg);
          opacity: 0.5;
        }
        50% {
          transform: translateY(-20px) rotate(180deg);
          opacity: 0.8;
        }
      }

      .login-container {
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(20px);
        border-radius: 24px;
        padding: 40px 32px;
        width: 100%;
        max-width: 440px;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        position: relative;
        z-index: 2;
        animation: slideUp 0.8s ease-out;
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

      .login-header {
        text-align: center;
        margin-bottom: 32px;
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
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .brand-subtitle {
        color: #334155;
        font-size: 14px;
        font-weight: 600;
        margin: 0;
      }

      .login-form-section {
        margin-bottom: 32px;
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

      .btn-loading .spinner {
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
        background: rgba(255, 255, 255, 0.98);
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

      .login-link {
        display: block;
        text-align: center;
        margin: 24px 0 16px 0;
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: color 0.3s ease;
        position: relative;
        z-index: 10;
      }

      .login-link:hover {
        color: white;
      }

      .quick-buttons-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin: 20px 0 16px 0;
        position: relative;
        z-index: 5;
      }

      .quick-btn {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 16px 12px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
        min-height: 60px;
        position: relative;
        z-index: 6;
      }

      .quick-btn:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15));
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
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
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin: 16px 0 20px 0;
        padding: 0 4px;
        position: relative;
        z-index: 5;
      }

      .system-btn {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        padding: 12px 8px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        text-align: center;
        min-height: 70px;
        font-size: 11px;
        position: relative;
        z-index: 8;
        margin-bottom: 8px;
      }

      .system-btn:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
        border-color: rgba(255, 255, 255, 0.3);
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

      /* searchOrderbtn-sea 전용 스타일 추가 */
      #searchOrderbtn-sea {
        position: relative;
        z-index: 12;
        margin-top: 12px;
        clear: both;
      }

      .login-footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
      }

      .footer-text {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
        margin: 0;
      }

      /* 반응형 디자인 */
      @media (max-width: 480px) {
        .login-container {
          margin: 20px;
          padding: 24px 20px;
          max-width: none;
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
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
      }

      @media (max-height: 800px) {
        .login-container {
          max-height: 90vh;
          overflow-y: auto;
        }
      }
    </style>
  `;

  const id = document.querySelector('#id');
  const pw = document.querySelector('#pw');
  const join = document.querySelector('#join');
  const login = document.querySelector('#login');
  const quickLogin = document.querySelector('#quickLogin');
  const adminLogin = document.querySelector('#adminLogin');
  const goKDS = document.querySelector('#goKDS');
  const goPOS = document.querySelector('#goPOS');
  const goTLM = document.querySelector('#goTLM');

  join.addEventListener('click', async () => {
    try {
      // renderSignUp 함수가 로드되지 않은 경우 동적으로 로드
      if (typeof renderSignUp !== 'function' && typeof window.renderSignUp !== 'function') {
        console.log('🔄 renderSignUp 함수 동적 로드 시도');

        // 스크립트 동적 로드
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
        // 함수가 이미 로드된 경우 바로 실행
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

  // 개발용 빠른 로그인
  quickLogin.addEventListener('click', async () => {
    try {
      showLoadingScreen();

      const response = await fetch('/api/users/login', {
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

      const response = await fetch('/api/users/login', {
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

  const handleEnterKey = (event) => {
    if (!document.querySelector('.login-container')) {
      return;
    }

    if (event.key === 'Enter' && event.target.id !== 'join') {
      login.click();
    }
  };

  document.removeEventListener('keydown', handleEnterKey);
  document.addEventListener('keydown', handleEnterKey);

  join.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') join.click();
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

  // 사장님 앱 버튼
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

    // 검색 기능 설정
    setupPOSStoreSearch();

    // 입력 필드에 포커스
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

      // 이전 타이머 취소
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      if (query.length < 2) {
        results.style.display = 'none';
        return;
      }

      // 200ms 딜레이 후 검색 실행
      searchTimeout = setTimeout(() => {
        searchStoresForPOS(query);
      }, 200);
    });

    // 엔터키로 첫 번째 결과 선택
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

      // 로딩 상태 표시
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

    // 약간의 딜레이 후 이동 (모달 닫힘 애니메이션 완료 후)
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

    // 검색 기능 설정
    setupKDSStoreSearch();

    // 입력 필드에 포커스
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

      // 이전 타이머 취소
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      if (query.length < 2) {
        results.style.display = 'none';
        return;
      }

      // 200ms 딜레이 후 검색 실행
      searchTimeout = setTimeout(() => {
        searchStoresForKDS(query);
      }, 200);
    });

    // 엔터키로 첫 번째 결과 선택
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

      // 로딩 상태 표시
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

    // 약간의 딜레이 후 이동 (모달 닫힘 애니메이션 완료 후)
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

    // 검색 기능 설정
    setupStoreSearch();

    // 입력 필드에 포커스
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

      // 이전 타이머 취소
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      if (query.length < 2) {
        results.style.display = 'none';
        return;
      }

      // 200ms 딜레이 후 검색 실행
      searchTimeout = setTimeout(() => {
        searchStoresForTLM(query);
      }, 200);
    });

    // 엔터키로 첫 번째 결과 선택
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

      // 로딩 상태 표시
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

    // 약간의 딜레이 후 이동 (모달 닫힘 애니메이션 완료 후)
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
}