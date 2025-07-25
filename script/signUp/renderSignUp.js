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

  submit.addEventListener('click', async () => {
    // 검증
    if (!id.value || !pw.value) {
      alert('아이디와 비밀번호는 필수입니다');
      return;
    }

    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id.value,
          pw: pw.value,
          name: name.value,
          phone: phone.value
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('회원가입 성공!');
        renderLogin(); // 로그인 화면으로 이동
      } else {
        alert(data.error || '회원가입 실패');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('서버 연결에 실패했습니다');
    }
  });

  back.addEventListener('click', renderLogin);
}

window.renderSignUp = renderSignUp;
