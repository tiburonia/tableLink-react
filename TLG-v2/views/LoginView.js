export function renderLoginPage(root) {
  root.innerHTML = `
    <section class="login-page">
      <div class="login-page__header">
        <button id="backBtn" class="back-btn">←</button>
        <h1 class="login-page__title">로그인</h1>
      </div>
      
      <form id="loginForm" class="login-form">
        <div class="form-group">
          <label class="form-label">이메일</label>
          <input 
            type="email" 
            id="email" 
            class="form-input" 
            placeholder="example@email.com"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input 
            type="password" 
            id="password" 
            class="form-input" 
            placeholder="비밀번호를 입력하세요"
            required
          />
        </div>
        
        <button type="submit" class="btn-primary btn-block">
          로그인
        </button>
      </form>
      
      <div class="login-page__footer">
        <button id="signupBtn" class="link-btn">
          계정이 없으신가요? 회원가입
        </button>
      </div>
    </section>
  `;
  
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.hash = '#/';
  });
  
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const evt = new CustomEvent('tlg:login', { detail: { email, password } });
    window.dispatchEvent(evt);
  });
  
  document.getElementById('signupBtn').addEventListener('click', () => {
    console.log('Navigate to signup');
  });
}
