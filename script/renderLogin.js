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
      // 입력값 검증
      if (!id.value || !pw.value) {
        alert('아이디와 비밀번호를 입력해주세요');
        return;
      }

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
      console.log('로그인 응답:', data);

      if (response.ok && data.user) {
        // 전역 userInfo 객체 초기화
        window.userInfo = {
          id: data.user.id,
          pw: data.user.pw || '',
          name: data.user.name || '',
          phone: data.user.phone || '',
          email: data.user.email || '',
          address: data.user.address || '',
          birth: data.user.birth || '',
          gender: data.user.gender || '',
          point: data.user.point || 0,
          orderList: data.user.orderList || [],
          totalCost: data.user.totalCost || 0,
          realCost: data.user.realCost || 0,
          reservationList: data.user.reservationList || [],
          coupons: data.user.coupons || { unused: [], used: [] },
          favorites: data.user.favoriteStores || data.user.favorites || []
        };

        // 캐시에 사용자 정보 저장
        if (window.cacheManager) {
          window.cacheManager.setUserInfo(window.userInfo);
        }
        
        console.log('로그인 성공:', window.userInfo);
        alert('로그인 성공');
        
        // 메인 화면으로 이동
        if (typeof renderMain === 'function') {
          renderMain();
        } else {
          console.error('renderMain 함수를 찾을 수 없습니다');
        }
        
        document.removeEventListener('keydown', handleEnterKey);
      } else {
        console.error('로그인 실패:', data);
        alert(data.error || '로그인 실패');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
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