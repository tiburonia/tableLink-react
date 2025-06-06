  let renderLogin = function () {
    // 로그인 화면 HTML 삽입
    main.innerHTML = `
          <h1>Tablelink</h1>
          <br>
          <input id='id' type='text' placeholder='아이디'/>
          <br><input id='pw' type='password' placeholder='비밀번호'/>
          <br>
          <button id='join'>회원가입</button>
          <button id='login'>로그인</button>`;

    // 로그인 화면의 입력 및 버튼 요소 재선택 (생성 이후)
    const id = document.querySelector('#id');
    const pw = document.querySelector('#pw');
    const join = document.querySelector('#join');
    const login = document.querySelector('#login');

    // 회원가입 버튼 클릭 이벤트
    join.addEventListener('click', () => {
      if ((id.value === '') || (pw.value === '')) {
        alert('회원가입에 실패했습니다');
        return;
      }
      localStorage.setItem(id.value, pw.value);
      alert('회원가입에 성공했습니다');
    });

    // 로그인 버튼 클릭 이벤트
    login.addEventListener('click', () => {
      if (localStorage.getItem(id.value) === pw.value) {
        alert('로그인에 성공했습니다');
        renderMain(); // 로그인 성공 시 메인 화면 렌더링
      } else {
        alert('로그인에 실패했습니다');
      }
    });
  };