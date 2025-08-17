
function renderKDS() {
  main.innerHTML = `
    <div style="padding: 20px; background: #222; color: white; min-height: 100vh;">
      <h1>📟 KDS (Kitchen Display System)</h1>
      <p>주방 디스플레이 시스템</p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
        <div style="background: #444; padding: 15px; border-radius: 8px;">
          <h3 style="color: #ff6b6b;">🔥 긴급 주문</h3>
          <p>현재 긴급 주문이 없습니다</p>
        </div>
        
        <div style="background: #444; padding: 15px; border-radius: 8px;">
          <h3 style="color: #4ecdc4;">📋 대기 중인 주문</h3>
          <p>현재 대기 중인 주문이 없습니다</p>
        </div>
        
        <div style="background: #444; padding: 15px; border-radius: 8px;">
          <h3 style="color: #45b7d1;">🍳 조리 중</h3>
          <p>현재 조리 중인 주문이 없습니다</p>
        </div>
      </div>
      
      <button id="backToLogin" style="background: #666; color: white; padding: 10px 20px; margin-top: 20px; border: none; border-radius: 5px; cursor: pointer;">로그인 화면으로</button>
    </div>
  `;

  const backToLogin = document.getElementById('backToLogin');
  if (backToLogin) {
    backToLogin.addEventListener('click', () => {
      window.location.href = '/';
    });
  } document.getElementById('backToLogin');
  backToLogin.addEventListener('click', () => {
    renderLogin();
  });
}

window.renderKDS = renderKDS;
