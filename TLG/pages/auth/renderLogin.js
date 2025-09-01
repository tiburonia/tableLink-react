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

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, pw: '1234' })
    });

    if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🔍 로그인 응답 데이터:', data);

        if (data.success && data.user) {
          console.log('✅ 빠른 로그인 성공:', data.user.name);

          // 전역 사용자 정보 설정
          setUserInfo(data.user);

          // 성공 알림
          alert(`${data.user.name}님, 환영합니다!`);

          // 메인 화면으로 이동
          if (typeof renderMap === 'function') {
            renderMap();
          } else {
            console.error('❌ renderMap 함수를 찾을 수 없음');
            window.location.href = '/';
          }

        } else {
          throw new Error(data.error || data.message || '로그인에 실패했습니다');
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

          <!-- 매장 검색 섹션 -->
          <div class="store-search-section">
            <h3 class="section-title">매장 선택</h3>
            <div class="input-wrapper">
              <input id="storeSearchInput" type="text" placeholder="매장 이름으로 검색" class="form-input" autocomplete="off" />
              <div class="input-icon">🔍</div>
            </div>
            <div id="storeSearchResults" class="search-results"></div>
          </div>

          <!-- 빠른 액세스 섹션 -->
          <div class="quick-access-section">
            <h3 class="section-title">시스템 접근</h3>

            <div class="system-buttons-grid">
              <button id="posBtn" class="system-btn pos-btn" disabled>
                <div class="system-btn-icon">💳</div>
                <div class="system-btn-content">
                  <span class="system-btn-title">POS</span>
                  <span class="system-btn-desc">매장 선택 필요</span>
                </div>
              </button>

              <button id="kdsBtn" class="system-btn kds-btn" disabled>
                <div class="system-btn-icon">📟</div>
                <div class="system-btn-content">
                  <span class="system-btn-title">KDS</span>
                  <span class="system-btn-desc">매장 선택 필요</span>
                </div>
              </button>

              <button id="krpBtn" class="system-btn krp-btn" disabled>
                <div class="system-btn-icon">🖨️</div>
                <div class="system-btn-content">
                  <span class="system-btn-title">KRP</span>
                  <span class="system-btn-desc">매장 선택 필요</span>
                </div>
              </button>

              <button id="tlmBtn" class="system-btn tlm-btn" disabled>
                <div class="system-btn-icon">🏪</div>
                <div class="system-btn-content">
                  <span class="system-btn-title">사장님 앱</span>
                  <span class="system-btn-desc">매장 선택 필요</span>
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

      .form-input::placeholder {
        color: transparent;
      }

      .form-input:focus + .form-label,
      .form-input:not(:placeholder-shown) + .form-label {
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

      .store-search-section {
        margin: 32px 0;
      }

      .section-title {
        font-size: 16px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 16px;
        text-align: center;
      }

      .search-results {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: white;
        display: none;
      }

      .store-search-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .store-search-item:hover {
        background-color: #f8f9fa;
        transform: translateX(2px);
      }

      .store-search-item.first-result {
        background-color: #f0f8ff;
        border-left: 3px solid #007bff;
      }

      .store-search-item:last-child {
        border-bottom: none;
      }

      .store-info {
        flex: 1;
      }

      .store-name {
        font-weight: bold;
        font-size: 14px;
        color: #333;
        margin-bottom: 4px;
      }

      .store-details {
        font-size: 12px;
        color: #666;
        margin-bottom: 2px;
      }

      .store-rating {
        font-size: 11px;
        color: #ff6b35;
        font-weight: 500;
      }

      .store-id {
        font-size: 12px;
        color: #999;
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 500;
      }

      .quick-access-section {
        margin-bottom: 24px;
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

      .system-btn[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
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
  const login = document.querySelector('#loginBtn');
  const storeSearchInput = document.getElementById('storeSearchInput');
  const storeSearchResults = document.getElementById('storeSearchResults');

  // 패널 핸들링 설정
  setupLoginPanelHandling();

  // 입력 필드 변화 감지 및 버튼 활성화
  const updateLoginButton = () => {
    if (login && id && pw) {
      const idValue = id.value.trim();
      const pwValue = pw.value.trim();
      login.disabled = !(idValue && pwValue);
    }
  };

  // 입력 필드 이벤트 리스너
  if (id && pw) {
    id.addEventListener('input', updateLoginButton);
    pw.addEventListener('input', updateLoginButton);
    updateLoginButton(); // 초기 상태 설정
  }

  // 로딩 스크린 관리 함수들
  const showLoadingScreen = () => {
    if (login) {
      const btnText = login.querySelector('.btn-text');
      const btnLoading = login.querySelector('.btn-loading');

      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'flex';
      login.disabled = true;
    }
  };

  const hideLoadingScreen = () => {
    if (login) {
      const btnText = login.querySelector('.btn-text');
      const btnLoading = login.querySelector('.btn-loading');

      if (btnText) btnText.style.display = 'inline';
      if (btnLoading) btnLoading.style.display = 'none';
      login.disabled = false;
    }
  };

  // 빠른 로그인 버튼 이벤트 리스너
  const quickLoginBtn = document.querySelector('#quickLogin');
  if (quickLoginBtn) {
    quickLoginBtn.addEventListener('click', async () => {
      try {
        console.log('🚀 빠른 로그인 시작: user1');

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: 'user1',
            pw: '1234'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🔍 로그인 응답 데이터:', data);

        if (data.success && data.user) {
          console.log('✅ 빠른 로그인 성공:', data.user.name);

          // 전역 사용자 정보 설정
          setUserInfo(data.user);

          // 성공 알림
          alert(`${data.user.name}님, 환영합니다!`);

          // 메인 화면으로 이동
          if (typeof renderMap === 'function') {
            renderMap();
          } else {
            console.error('❌ renderMap 함수를 찾을 수 없음');
            window.location.href = '/';
          }

        } else {
          throw new Error(data.error || data.message || '로그인에 실패했습니다');
        }
      } catch (error) {
        console.error('❌ 빠른 로그인 오류:', error);
        alert('서버 연결에 실패했습니다');
      }
    });
  }

  // 로그인 버튼 이벤트 리스너
  if (login) {
    login.addEventListener('click', async () => {
      if (!id || !pw) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return;
      }

      try {
        showLoadingScreen();

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: id.value,
            pw: pw.value
          })
        });

        if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 로그인 응답 데이터:', data);

      if (data.success && data.user) {
        console.log('✅ 로그인 성공:', data.user.name);

        setUserInfo(data.user);

        // 성공 알림
        alert(`${data.user.name}님, 환영합니다!`);

        if (typeof renderMap === 'function') {
          renderMap();
        } else {
          console.error('❌ renderMap 함수를 찾을 수 없음');
          window.location.href = '/';
        }
      } else {
        hideLoadingScreen();
        throw new Error(data.error || data.message || '로그인에 실패했습니다');
      }
      } catch (error) {
        console.error('❌ 로그인 오류:', error);
        hideLoadingScreen();
        alert('서버 연결에 실패했습니다');
      }
    });
  }

  // POS/KDS/TLM 버튼 이벤트
  const posBtn = document.getElementById('posBtn');
  if (posBtn) {
    posBtn.addEventListener('click', async () => {
      if (typeof window.selectedStoreId === 'undefined') {
        alert('먼저 매장을 선택해주세요.');
        return;
      }
      window.location.href = `/pos/${window.selectedStoreId}`;
    });
  }

  // KDS 버튼 이벤트  
  const kdsBtn = document.getElementById('kdsBtn');
  if (kdsBtn) {
    kdsBtn.addEventListener('click', async () => {
      if (typeof window.selectedStoreId === 'undefined') {
        alert('먼저 매장을 선택해주세요.');
        return;
      }
      window.location.href = `/kds/${window.selectedStoreId}`;
    });
  }

  // TLM 버튼 이벤트
  const tlmBtn = document.getElementById('tlmBtn');
  if (tlmBtn) {
    tlmBtn.addEventListener('click', async () => {
      if (typeof window.selectedStoreId === 'undefined') {
        alert('먼저 매장을 선택해주세요.');
        return;
      }
      window.location.href = `/tlm/${window.selectedStoreId}`;
    });
  }

  // 매장 검색 기능
  let searchTimeout;

  if (storeSearchInput && storeSearchResults) {
    storeSearchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const keyword = storeSearchInput.value.trim();

      if (keyword.length < 2) {
        storeSearchResults.style.display = 'none';
        return;
      }

      searchTimeout = setTimeout(async () => {
        try {
          const response = await fetch(`/api/stores/search/${encodeURIComponent(keyword)}`);
          if (response.ok) {
            const data = await response.json();
            displaySearchResults(data.stores || []);
          }
        } catch (error) {
          console.error('매장 검색 실패:', error);
          storeSearchResults.innerHTML = '<div style="padding:10px;color:#ff6b6b;text-align:center;">검색 중 오류가 발생했습니다</div>';
          storeSearchResults.style.display = 'block';
        }
      }, 300);
    });

    // 검색 결과 외부 클릭 시 숨기기
    document.addEventListener('click', (e) => {
      if (!storeSearchInput.contains(e.target) && !storeSearchResults.contains(e.target)) {
        storeSearchResults.style.display = 'none';
      }
    });

    // Enter 키로 첫 번째 검색 결과 선택
    storeSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const firstResult = storeSearchResults.querySelector('.store-search-item');
        if (firstResult) {
          firstResult.click();
        }
      }
    });
  }

  function displaySearchResults(stores) {
    if (!storeSearchResults) return;

    if (stores.length === 0) {
      storeSearchResults.innerHTML = '<div style="padding:10px;color:#666;text-align:center;">검색 결과가 없습니다</div>';
      storeSearchResults.style.display = 'block';
      return;
    }

    const resultsHTML = stores.map((store, index) => `
      <div class="store-search-item ${index === 0 ? 'first-result' : ''}" onclick="selectStoreFromSearch(${store.id}, '${store.name.replace(/'/g, "\\'")}')">
        <div class="store-info">
          <div class="store-name">${store.name}</div>
          <div class="store-details">${store.category || '기타'} • ${store.address || '주소 정보 없음'}</div>
          <div class="store-rating">⭐ ${store.ratingAverage?.toFixed(1) || '0.0'} (${store.reviewCount || 0})</div>
        </div>
        <div class="store-id">#${store.id}</div>
      </div>
    `).join('');

    storeSearchResults.innerHTML = resultsHTML;
    storeSearchResults.style.display = 'block';
  }

  // 매장 선택 함수 (전역으로 등록)
  window.selectStoreFromSearch = function(storeId, storeName) {
    console.log(`🏪 매장 선택: ${storeName} (ID: ${storeId})`);

    // 검색 입력창에 선택한 매장 표시
    if (storeSearchInput) {
      storeSearchInput.value = `${storeName} (#${storeId})`;
    }

    // 검색 결과 숨기기
    if (storeSearchResults) {
      storeSearchResults.style.display = 'none';
    }

    // 선택된 매장 ID를 전역 변수에 저장
    window.selectedStoreId = storeId;
    window.selectedStoreName = storeName;

    // 시스템 선택 버튼들 활성화
    activateSystemButtons(storeId, storeName);
  };

  // 시스템 버튼들 활성화
  function activateSystemButtons(storeId, storeName) {
    const systemButtons = document.querySelectorAll('.system-btn');

    systemButtons.forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';

      // 기존 이벤트 리스너 제거 후 새로 등록
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', () => {
        const systemType = newBtn.id.replace('Btn', ''); // pos, kds, tlm
        window.location.href = `/${systemType}/${storeId}`;
      });
    });

    // 버튼 텍스트 업데이트
    const posButton = document.getElementById('posBtn');
    if (posButton) {
      posButton.innerHTML = `<div class="system-btn-icon">💳</div><div class="system-btn-content"><span class="system-btn-title">POS</span><span class="system-btn-desc">${storeName}</span></div>`;
    }
    const kdsButton = document.getElementById('kdsBtn');
    if (kdsButton) {
      kdsButton.innerHTML = `<div class="system-btn-icon">📟</div><div class="system-btn-content"><span class="system-btn-title">KDS</span><span class="system-btn-desc">${storeName}</span></div>`;
    }
    const krpButton = document.getElementById('krpBtn');
    if (krpButton) {
      krpButton.innerHTML = `<div class="system-btn-icon">🖨️</div><div class="system-btn-content"><span class="system-btn-title">KRP</span><span class="system-btn-desc">${storeName}</span></div>`;
    }
    const tlmButton = document.getElementById('tlmBtn');
    if (tlmButton) {
      tlmButton.innerHTML = `<div class="system-btn-icon">🏪</div><div class="system-btn-content"><span class="system-btn-title">사장님 앱</span><span class="system-btn-desc">${storeName}</span></div>`;
    }
  }


  // Enter 키 이벤트 리스너 설정
  function setupEventListeners() {
    const handleEnterKey = (event) => {
      if (!document.querySelector('#loginPanelContainer')) {
        return;
      }

      if (event.key === 'Enter' && login && !login.disabled) {
        login.click();
      }
    };

    document.removeEventListener('keydown', handleEnterKey);
    document.addEventListener('keydown', handleEnterKey);
  }

  // 초기화
  setupEventListeners();

  console.log('✅ 로그인 화면 렌더링 완료 (매장 선택 및 시스템 접근 포함)');
}

// 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.renderLogin = renderLogin;
}