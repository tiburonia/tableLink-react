
async function renderLogin() {
  const main = document.getElementById('main');
  
  main.innerHTML = `
    <div id="loginContainer">
      <h1>TableLink</h1>
      <input id='id' type='text' placeholder='아이디'/>
      <input id='pw' type='password' placeholder='비밀번호'/>
      <div>
        <button id='join'>회원가입</button>
        <button id='login'>로그인</button>
      </div>
      <hr>
      <div style="width: 70%; display: flex; flex-direction: column; gap: 8px;">
        <button id='quickLogin' style="width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 14px;">⚡ 빠른 로그인 (user1)</button>
        <button id='adminLogin' style="width: 100%; padding: 12px; background: #444; color: white; border: none; border-radius: 6px; font-size: 14px;">🛠️ Admin 로그인</button>
        <button id='goKDS' style="width: 100%; padding: 12px; background: #222; color: white; border: none; border-radius: 6px; font-size: 14px;">📟 KDS</button>
        <button id='goPOS' style="width: 100%; padding: 12px; background: #666; color: white; border: none; border-radius: 6px; font-size: 14px;">💳 POS</button>
        <button id='goTLM' style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 14px;">🏪 사장님 앱</button>
      </div>
    </div>

    <style>
      #main {
        background: #f0f8ff;
        font-family: sans-serif;
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
    main.innerHTML = `
      <div id="loadingContainer">
        <h1>TableLink</h1>
        <div class="loading-spinner"></div>
        <p>로그인 중...</p>
      </div>

      <style>
        #loadingContainer {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #f0f8ff;
          font-family: sans-serif;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e0e0;
          border-top: 4px solid #297efc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20px 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        #loadingContainer p {
          color: #297efc;
          font-size: 16px;
          margin: 10px 0;
        }
      </style>
    `;
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
        await renderLogin();
        alert(data.error || '빠른 로그인 실패');
      }
    } catch (error) {
      console.error('빠른 로그인 오류:', error);
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
        await renderLogin();
        alert(data.error || '로그인 실패');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      await renderLogin();
      alert('서버 연결에 실패했습니다');
    }
  });

  const handleEnterKey = (event) => {
    if (!document.getElementById('loginContainer')) {
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
