// 메인 화면이 표시될 요소 선택
const main = document.querySelector('#main');
let renderLogin = function() {
  // 로그인 화면 HTML 삽입
  main.innerHTML = `
           <div id="loginContainer">
      <h1>TableLink</h1>
      <input id='id' type='text' placeholder='아이디'/>
      <input id='pw' type='password' placeholder='비밀번호'/>
      <div>
        <button id='join'>회원가입</button>
        <button id='login'>로그인</button>
      </div>
    </div>
    <style>
   #main {
  
  background: #f0f8ff; /* 💡 은은한 하늘색 */
  font-family: sans-serif;
}
</style>
`;

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

      // userInfo 리셋
      for (let key in userInfo) {
        if (Array.isArray(userInfo[key])) userInfo[key] = [];
        else if (typeof userInfo[key] === 'number') userInfo[key] = 0;
        else userInfo[key] = '';
      }

      // users에 있는 해당 계정의 모든 정보를 userInfo에 복사
      Object.assign(userInfo, users[id.value]);

      userInfo.id = id.value;
      alert('로그인 성공');
      renderMain();

      // 로그인 성공 시, handleEnterKey 이벤트 리스너 제거
      document.removeEventListener('keydown', handleEnterKey);
    } else { alert('로그인 실패') };
  });

  //로그인 화면에서 엔터키로 로그인

  const handleEnterKey = (event) => {
    if (event.key === 'Enter' && event.target.id !== 'join') {
      login.click();
    }
  };
  document.addEventListener('keydown', handleEnterKey);


  //회원가입 엔터키로 진행
  join.addEventListener('keydown', (event) => {
    if (event.key === 'Enter')
      join.click();
  })

}
// a키로 현재 users, userInfo 콘솔에 출력
document.addEventListener('keydown', (e) => {
  if (e.key === 'a' || e.key === 'A' || e.key === 'ㅁ') {
    console.log("------------------------------------------")
    console.log("users")
    console.log(JSON.stringify(users, null, 2))
    console.log("------------------------------------------")
    console.log("userInfo")
    console.log(JSON.stringify(userInfo, null, 2))

    console.log("------------------------------------------")
    console.log(JSON.stringify(savedCart, null, 2))
  }
});