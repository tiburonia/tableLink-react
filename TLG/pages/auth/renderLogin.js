
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
        script.src = '/TLG/pages/main/renderSignUp.js';
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
    window.location.href = '/KDS';
  });

  goPOS.addEventListener('click', () => {
    window.location.href = '/POS';
  });

  // 사장님 앱 버튼
  goTLM.addEventListener('click', () => {
    const storeName = prompt('가게 이름을 입력하세요:');
    if (storeName && storeName.trim()) {
      findStoreByName(storeName.trim());
    }
  });

  // 가게 이름으로 매장 정보 찾기 함수
  async function findStoreByName(storeName) {
    try {
      console.log('🔍 매장 검색 시작:', storeName);
      
      // 서버에서 검색
      const response = await fetch('/api/stores');
      const data = await response.json();
      
      if (data.success && data.stores) {
        console.log('📋 전체 매장 목록:', data.stores.length, '개');
        
        const foundStore = data.stores.find(store => 
          store.name.toLowerCase().includes(storeName.toLowerCase())
        );
        
        if (foundStore) {
          console.log('✅ 서버에서 매장 찾음:', foundStore.name, 'ID:', foundStore.id);
          window.location.href = `/tlm/${foundStore.id}`;
        } else {
          alert(`'${storeName}' 매장을 찾을 수 없습니다.`);
        }
      } else {
        throw new Error('매장 목록을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 매장 검색 실패:', error);
      alert('매장 검색 중 오류가 발생했습니다.');
    }
  }
}
