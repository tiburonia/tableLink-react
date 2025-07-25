function renderLogin() {
  main.innerHTML = `
    <h1>로그인</h1>
    <input id="id" type="text" placeholder="아이디"><br>
    <input id="pw" type="password" placeholder="비밀번호"><br>
    <button id="submit">로그인</button>
    <button id="guest">비회원으로 계속</button>
    <button id="signUp">회원가입</button>
  `;

  const id = document.querySelector('#id');
  const pw = document.querySelector('#pw');
  const submit = document.querySelector('#submit');
  const guest = document.querySelector('#guest');
  const signUp = document.querySelector('#signUp');

  submit.addEventListener('click', async () => {
    if (!id.value || !pw.value) {
      alert('아이디와 비밀번호를 입력해주세요');
      return;
    }

    try {
      const loginResult = await API.login(id.value, pw.value);

      if (loginResult.success) {
        // 전역 userInfo 객체에 로그인한 사용자 정보 저장
        window.userInfo = {
          id: loginResult.user.id,
          name: loginResult.user.name,
          phone: loginResult.user.phone,
          point: loginResult.user.point,
          orderList: loginResult.user.orderList || [],
          reservationList: loginResult.user.reservationList || [],
          coupons: loginResult.user.coupons || { unused: [], used: [] },
          favorites: loginResult.user.favorites || []
        };

        alert(`${loginResult.user.name || loginResult.user.id}님 환영합니다!`);
        renderMain();
      }
    } catch (error) {
      alert(error.message || '로그인에 실패했습니다');
    }
  });

  guest.addEventListener('click', () => {
    // 비회원 모드로 전역 userInfo 초기화
    window.userInfo = {
      id: '',
      name: '비회원',
      phone: '',
      point: 0,
      orderList: [],
      reservationList: [],
      coupons: { unused: [], used: [] },
      favorites: []
    };
    renderMain();
  });

  signUp.addEventListener('click', renderSignUp);
}

window.renderLogin = renderLogin;