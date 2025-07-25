
function renderAdminMain() {
  main.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>🛠️ 관리자 페이지</h1>
      <p>개발 중인 관리자 기능입니다.</p>
      <div style="margin: 20px 0;">
        <button id="viewOrders" style="margin: 10px; padding: 10px 20px;">주문 관리</button>
        <button id="viewStores" style="margin: 10px; padding: 10px 20px;">매장 관리</button>
        <button id="viewUsers" style="margin: 10px; padding: 10px 20px;">사용자 관리</button>
      </div>
      <button id="backToLogin" style="background: #666; color: white; padding: 10px 20px;">로그인 화면으로</button>
    </div>
  `;

  const viewOrders = document.getElementById('viewOrders');
  const viewStores = document.getElementById('viewStores');
  const viewUsers = document.getElementById('viewUsers');
  const backToLogin = document.getElementById('backToLogin');

  viewOrders.addEventListener('click', () => {
    alert('주문 관리 기능은 개발 중입니다');
  });

  viewStores.addEventListener('click', () => {
    alert('매장 관리 기능은 개발 중입니다');
  });

  viewUsers.addEventListener('click', () => {
    alert('사용자 관리 기능은 개발 중입니다');
  });

  backToLogin.addEventListener('click', () => {
    renderLogin();
  });
}

window.renderAdminMain = renderAdminMain;
