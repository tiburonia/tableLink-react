let renderLogin = function () {
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
      <div>
        <button id='adminLogin' style="background: #444; color: white; margin-top: 10px;">🛠️ 어드민 로그인 (개발용)</button>
        <button id='goKDS' style="background: #222; color: white; margin-top: 6px;">📟 KDS 화면 이동</button>
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
  const adminLogin = document.querySelector('#adminLogin');
  const goKDS = document.querySelector('#goKDS');

  join.addEventListener('click', () => {
    renderSignUp();
  });

  login.addEventListener('click', async () => {
    try {
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
        // 전역 userInfo 객체 초기화
        if (!window.userInfo) {
          window.userInfo = {};
        }

        // userInfo를 서버에서 받은 데이터로 업데이트
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

        // 🍪 쿠키에 사용자 정보 저장 (7일 만료)
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        document.cookie = `userInfo=${encodeURIComponent(JSON.stringify(window.userInfo))}; expires=${expires.toUTCString()}; path=/`;
        console.log('🍪 로그인 정보 쿠키에 저장 완료');

        // 🆕 캐시에 사용자 정보 저장
        cacheManager.setUserInfo(window.userInfo);
        console.log('💾 로그인 정보 캐시에 저장 완료');

        alert('로그인 성공');
        renderMap();
        document.removeEventListener('keydown', handleEnterKey);
      } else {
        alert(data.error || '로그인 실패');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('서버 연결에 실패했습니다');
    }
  });

  const handleEnterKey = (event) => {
    if (event.key === 'Enter' && event.target.id !== 'join') {
      login.click();
    }
  };
  document.addEventListener('keydown', handleEnterKey);

  join.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') join.click();
  });

  // 개발용 어드민 로그인 버튼
  adminLogin.addEventListener('click', () => {
    alert('어드민 모드 진입');
    renderAdminMain(); // 이 함수 네가 따로 구현해놔야 함
  });

  // 개발용 KDS 버튼
  goKDS.addEventListener('click', () => {
    alert('KDS 화면 이동');
    renderKDS(); // 이 함수도 따로 있어야 함
  });
};