
/**
 * 로그인 폼 컴포넌트
 */

export function createLoginForm() {
  return `
    <div class="login-form-section">
      <div class="form-group">
        <div class="input-wrapper">
          <input id="id" type="text" placeholder=" " class="form-input" autocomplete="username" />
          <label class="form-label">아이디</label>
          <div class="input-icon">👤</div>
        </div>
      </div>

      <div class="form-group">
        <div class="input-wrapper">
          <input id="pw" type="password" placeholder=" " class="form-input" autocomplete="current-password" />
          <label class="form-label">비밀번호</label>
          <div class="input-icon">🔒</div>
        </div>
      </div>

      <button type="submit" class="primary-btn login-btn" id="loginBtn" disabled>
        <div class="btn-content">
          <span class="btn-text">로그인</span>
          <div class="btn-loading" style="display: none;"></div>
        </div>
      </button>
    </div>
  `;
}

export function setupLoginFormEvents() {
  const id = document.querySelector('#id');
  const pw = document.querySelector('#pw');
  const login = document.querySelector('#loginBtn');

  if (!id || !pw || !login) return;

  // 입력 필드 변화 감지 및 버튼 활성화
  const updateLoginButton = () => {
    const idValue = id.value.trim();
    const pwValue = pw.value.trim();
    login.disabled = !(idValue && pwValue);
  };

  // 입력 필드 이벤트 리스너
  id.addEventListener('input', updateLoginButton);
  pw.addEventListener('input', updateLoginButton);
  updateLoginButton();

  // 로딩 스크린 관리
  const showLoadingScreen = () => {
    const btnText = login.querySelector('.btn-text');
    const btnLoading = login.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    login.disabled = true;
  };

  const hideLoadingScreen = () => {
    const btnText = login.querySelector('.btn-text');
    const btnLoading = login.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
    login.disabled = false;
  };

  // 로그인 버튼 이벤트
  login.addEventListener('click', async () => {
    try {
      showLoadingScreen();

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id.value,
          pw: pw.value
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 로그인 응답 데이터:', data);

      if (data.success && data.user) {
        console.log('✅ 로그인 성공:', data.user.name);
        
        if (window.setUserInfo) {
          window.setUserInfo(data.user);
        }

        alert(`${data.user.name}님, 환영합니다!`);

        // React Router 라우팅으로 전환
        console.log('🔄 React Router로 전환: /react/map');
        window.location.href = '/react/map';
      } else {
        hideLoadingScreen();
        throw new Error(data.error || data.message || '로그인에 실패했습니다');
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      hideLoadingScreen();
      alert('서버 연결에 실패했습니다');
    }
  });

  // Enter 키 이벤트
  const handleEnterKey = (event) => {
    if (event.key === 'Enter' && login) {
      login.click();
    }
  };

  document.addEventListener('keydown', handleEnterKey);
}
