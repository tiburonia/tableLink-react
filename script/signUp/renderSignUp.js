function renderSignUp() {
  main.innerHTML = `
    <h1>회원가입</h1>
    <input id="id" type="text" placeholder="아이디"><br>
    <input id="pw" type="password" placeholder="비밀번호"><br>
    <input id="name" type="text" placeholder="이름"><br>
    <input id="phone" type="text" placeholder="전화번호"><br>
    <button id="submit">가입하기</button>
    <button id="back">뒤로가기</button>
  `;

  const id = document.querySelector('#id');
  const pw = document.querySelector('#pw');
  const name = document.querySelector('#name');
  const phone = document.querySelector('#phone');
  const submit = document.querySelector('#submit');
  const back = document.querySelector('#back');

  submit.addEventListener('click', () => {
    // 검증
    if (!id.value || !pw.value) {
      alert('아이디와 비밀번호는 필수입니다');
      return;
    }

    if (users[id.value]) {
      alert('이미 존재하는 아이디입니다');
      return;
    }

    // 저장
    users[id.value] = {
      pw: pw.value,
      name: name.value,
      phone: phone.value,
      point: 0,
      orderList: [],
      reservationList: []
    };

    alert('회원가입 성공!');
    renderLogin(); // 로그인 화면으로 이동
  });

  back.addEventListener('click', renderLogin);
}

window.renderSignUp = renderSignUp;
