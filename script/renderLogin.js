// 메인 화면이 표시될 요소 선택
const main = document.querySelector('#main');
let renderLogin = function() {
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
    renderSignUp(); // 회원가입 화면 렌더링
  });

  // 로그인 버튼 클릭 이벤트
  login.addEventListener('click', () => {
    if (users[id.value]?.pw === pw.value) {
      Object.assign(userInfo, users[id.value]);
      userInfo.id = id.value;
      alert('로그인 성공');
      renderMain();
    } else { alert('로그인 실패') };
  });


}