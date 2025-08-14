function renderSignUp() {
  main.innerHTML = `
    <div id="signupContainer">
      <h1>회원가입</h1>
      
      <div class="form-group">
        <label for="id">아이디 *</label>
        <input id="id" type="text" placeholder="3-20자의 영문, 숫자 조합" maxlength="20">
        <small class="help-text">영문과 숫자만 사용 가능합니다</small>
      </div>

      <div class="form-group">
        <label for="pw">비밀번호 *</label>
        <input id="pw" type="password" placeholder="최소 4자 이상" minlength="4">
      </div>

      <div class="form-group">
        <label for="name">이름</label>
        <input id="name" type="text" placeholder="실명을 입력하세요">
      </div>

      <div class="form-group">
        <label for="phone">전화번호</label>
        <input id="phone" type="tel" placeholder="010-0000-0000" maxlength="13">
        <small class="help-text">010-0000-0000 형식으로 입력</small>
      </div>

      <div class="button-group">
        <button id="submit" class="submit-btn">가입하기</button>
        <button id="back" class="back-btn">뒤로가기</button>
      </div>
    </div>

    <style>
      #main {
        background: #f0f8ff;
        font-family: sans-serif;
        min-height: 100vh;
        padding: 20px;
      }

      #signupContainer {
        max-width: 400px;
        margin: 0 auto;
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      #signupContainer h1 {
        text-align: center;
        color: #297efc;
        margin-bottom: 30px;
        font-size: 28px;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #333;
        font-size: 14px;
      }

      .form-group input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 16px;
        box-sizing: border-box;
        transition: border-color 0.3s;
      }

      .form-group input:focus {
        outline: none;
        border-color: #297efc;
      }

      .help-text {
        display: block;
        margin-top: 5px;
        font-size: 12px;
        color: #666;
      }

      .button-group {
        margin-top: 30px;
        display: flex;
        gap: 10px;
      }

      .submit-btn, .back-btn {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
      }

      .submit-btn {
        background: #297efc;
        color: white;
      }

      .submit-btn:hover {
        background: #1e6acc;
      }

      .submit-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .back-btn {
        background: #f5f5f5;
        color: #333;
      }

      .back-btn:hover {
        background: #e0e0e0;
      }
    </style>
  `;

  const id = document.querySelector('#id');
  const pw = document.querySelector('#pw');
  const name = document.querySelector('#name');
  const phone = document.querySelector('#phone');
  const submit = document.querySelector('#submit');
  const back = document.querySelector('#back');

  submit.addEventListener('click', async () => {
    // 입력값 검증
    const idValue = id.value.trim();
    const pwValue = pw.value.trim();
    const nameValue = name.value.trim();
    const phoneValue = phone.value.trim();

    // 필수 필드 검증
    if (!idValue || !pwValue) {
      alert('아이디와 비밀번호는 필수입니다');
      return;
    }

    // 아이디 형식 검증 (3-20자, 영문숫자만)
    if (!/^[a-zA-Z0-9]{3,20}$/.test(idValue)) {
      alert('아이디는 3-20자의 영문과 숫자만 사용 가능합니다');
      return;
    }

    // 비밀번호 길이 검증
    if (pwValue.length < 4) {
      alert('비밀번호는 최소 4자 이상이어야 합니다');
      return;
    }

    // 전화번호 형식 검증 (입력된 경우에만)
    if (phoneValue && !/^010-\d{4}-\d{4}$/.test(phoneValue)) {
      alert('전화번호는 010-0000-0000 형식으로 입력해주세요');
      return;
    }

    // 로딩 상태 표시
    submit.disabled = true;
    submit.textContent = '가입 중...';

    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: idValue,
          pw: pwValue,
          name: nameValue,
          phone: phoneValue
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('회원가입 성공! 로그인 페이지로 이동합니다.');
        renderLogin(); // 로그인 화면으로 이동
      } else {
        alert(data.error || '회원가입 실패');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('서버 연결에 실패했습니다');
    } finally {
      // 로딩 상태 해제
      submit.disabled = false;
      submit.textContent = '가입하기';
    }
  });

  back.addEventListener('click', renderLogin);

  // 전화번호 자동 포맷팅
  phone.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    
    if (value.length >= 3) {
      if (value.length <= 7) {
        value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
      } else {
        value = value.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
      }
    }
    
    e.target.value = value;
  });

  // 엔터키로 가입하기
  const handleEnterKey = (event) => {
    if (event.key === 'Enter') {
      submit.click();
    }
  };

  id.addEventListener('keydown', handleEnterKey);
  pw.addEventListener('keydown', handleEnterKey);
  name.addEventListener('keydown', handleEnterKey);
  phone.addEventListener('keydown', handleEnterKey);

  // 실시간 아이디 중복 체크
  let checkTimeout;
  id.addEventListener('input', (e) => {
    const idValue = e.target.value.trim();
    const helpText = e.target.parentElement.querySelector('.help-text');
    
    // 기존 타이머 클리어
    clearTimeout(checkTimeout);
    
    if (idValue.length < 3) {
      helpText.textContent = '영문과 숫자만 사용 가능합니다';
      helpText.style.color = '#666';
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(idValue)) {
      helpText.textContent = '영문과 숫자만 사용 가능합니다';
      helpText.style.color = '#e74c3c';
      return;
    }

    // 500ms 후 중복 체크
    checkTimeout = setTimeout(async () => {
      try {
        helpText.textContent = '확인 중...';
        helpText.style.color = '#f39c12';

        const response = await fetch('/api/users/check-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: idValue })
        });

        const data = await response.json();

        if (data.available) {
          helpText.textContent = '✓ 사용 가능한 아이디입니다';
          helpText.style.color = '#27ae60';
        } else {
          helpText.textContent = '✗ 이미 사용 중인 아이디입니다';
          helpText.style.color = '#e74c3c';
        }
      } catch (error) {
        helpText.textContent = '확인 중 오류가 발생했습니다';
        helpText.style.color = '#e74c3c';
      }
    }, 500);
  });
}

// 전역으로 등록
window.renderSignUp = renderSignUp;

// 즉시 실행하여 전역에서 접근 가능하도록 설정
if (typeof window !== 'undefined') {
  window.renderSignUp = renderSignUp;
}
