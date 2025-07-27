
function renderAdminMain() {
  main.innerHTML = `
    <div style="background: #1a1a1a; color: white; min-height: 100vh; padding: 20px; font-family: Arial, sans-serif;">
      <header style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="color: #ff6b6b; margin: 0; font-size: 28px;">🛠️ TableLink 관리자 패널</h1>
        <p style="color: #888; margin: 10px 0 0 0;">시스템 관리 및 모니터링</p>
      </header>

      <main style="max-width: 1200px; margin: 0 auto;">
        <!-- 대시보드 통계 -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #4ecdc4; margin-bottom: 15px;">📊 실시간 통계</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div id="storeStats" style="background: #2d2d2d; padding: 20px; border-radius: 8px; border-left: 4px solid #4ecdc4;">
              <h4 style="margin: 0 0 10px 0; color: #4ecdc4;">매장 통계</h4>
              <p style="margin: 5px 0; color: #ccc;">총 매장 수: <span id="totalStores">로딩중...</span></p>
              <p style="margin: 5px 0; color: #ccc;">활성 매장: <span id="activeStores">로딩중...</span></p>
            </div>
            <div id="userStats" style="background: #2d2d2d; padding: 20px; border-radius: 8px; border-left: 4px solid #45b7d1;">
              <h4 style="margin: 0 0 10px 0; color: #45b7d1;">사용자 통계</h4>
              <p style="margin: 5px 0; color: #ccc;">총 사용자 수: <span id="totalUsers">로딩중...</span></p>
              <p style="margin: 5px 0; color: #ccc;">오늘 활성 사용자: <span id="activeUsers">로딩중...</span></p>
            </div>
            <div id="orderStats" style="background: #2d2d2d; padding: 20px; border-radius: 8px; border-left: 4px solid #f39c12;">
              <h4 style="margin: 0 0 10px 0; color: #f39c12;">주문 통계</h4>
              <p style="margin: 5px 0; color: #ccc;">오늘 주문 수: <span id="todayOrders">로딩중...</span></p>
              <p style="margin: 5px 0; color: #ccc;">총 매출: <span id="totalRevenue">로딩중...</span></p>
            </div>
          </div>
        </section>

        <!-- 관리 기능 -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #f39c12; margin-bottom: 15px;">⚙️ 관리 기능</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
            <div style="background: #2d2d2d; padding: 20px; border-radius: 8px;">
              <h3 style="color: #ff6b6b; margin: 0 0 15px 0;">🏪 매장 관리</h3>
              <button id="viewStores" style="width: 100%; padding: 10px; margin: 5px 0; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer;">매장 목록 보기</button>
              <button id="addStore" style="width: 100%; padding: 10px; margin: 5px 0; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">새 매장 추가</button>
              <button id="storeSettings" style="width: 100%; padding: 10px; margin: 5px 0; background: #c0392b; color: white; border: none; border-radius: 5px; cursor: pointer;">매장 설정</button>
            </div>

            <div style="background: #2d2d2d; padding: 20px; border-radius: 8px;">
              <h3 style="color: #4ecdc4; margin: 0 0 15px 0;">👥 사용자 관리</h3>
              <button id="viewUsers" style="width: 100%; padding: 10px; margin: 5px 0; background: #4ecdc4; color: white; border: none; border-radius: 5px; cursor: pointer;">사용자 목록</button>
              <button id="userAnalytics" style="width: 100%; padding: 10px; margin: 5px 0; background: #26d0ce; color: white; border: none; border-radius: 5px; cursor: pointer;">사용자 분석</button>
              <button id="banUser" style="width: 100%; padding: 10px; margin: 5px 0; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">계정 관리</button>
            </div>

            <div style="background: #2d2d2d; padding: 20px; border-radius: 8px;">
              <h3 style="color: #f39c12; margin: 0 0 15px 0;">📦 주문 관리</h3>
              <button id="viewOrders" style="width: 100%; padding: 10px; margin: 5px 0; background: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer;">주문 현황</button>
              <button id="orderHistory" style="width: 100%; padding: 10px; margin: 5px 0; background: #e67e22; color: white; border: none; border-radius: 5px; cursor: pointer;">주문 내역</button>
              <button id="refunds" style="width: 100%; padding: 10px; margin: 5px 0; background: #d35400; color: white; border: none; border-radius: 5px; cursor: pointer;">환불 처리</button>
            </div>
          </div>
        </section>

        <!-- 시스템 관리 -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #9b59b6; margin-bottom: 15px;">🔧 시스템 관리</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <button id="systemLogs" style="padding: 15px; background: #9b59b6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">📋 시스템 로그</button>
            <button id="databaseBackup" style="padding: 15px; background: #8e44ad; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">💾 데이터베이스 백업</button>
            <button id="cacheManagement" style="padding: 15px; background: #7d3c98; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">🗂️ 캐시 관리</button>
            <button id="serverStatus" style="padding: 15px; background: #6c3483; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">⚡ 서버 상태</button>
          </div>
        </section>

        <!-- 로그아웃 -->
        <section style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #333;">
          <button id="backToLogin" style="padding: 12px 30px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 0 10px;">← 로그인 화면으로</button>
          <button id="logoutAdmin" style="padding: 12px 30px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 0 10px;">🚪 관리자 로그아웃</button>
        </section>
      </main>
    </div>
  `;

  // 통계 데이터 로드
  loadAdminStats();

  // 이벤트 리스너 등록
  setupAdminEventListeners();
}

// 관리자 통계 데이터 로드
async function loadAdminStats() {
  try {
    // 매장 통계
    const storesResponse = await fetch('/api/admin/stores/stats');
    const storesData = await storesResponse.json();
    
    document.getElementById('totalStores').textContent = storesData.total || '0';
    document.getElementById('activeStores').textContent = storesData.active || '0';

    // 사용자 통계
    const usersResponse = await fetch('/api/admin/users/stats');
    const usersData = await usersResponse.json();
    
    document.getElementById('totalUsers').textContent = usersData.total || '0';
    document.getElementById('activeUsers').textContent = usersData.activeToday || '0';

    // 주문 통계
    const ordersResponse = await fetch('/api/admin/orders/stats');
    const ordersData = await ordersResponse.json();
    
    document.getElementById('todayOrders').textContent = ordersData.todayCount || '0';
    document.getElementById('totalRevenue').textContent = (ordersData.totalRevenue || 0).toLocaleString() + '원';
    
  } catch (error) {
    console.error('❌ 관리자 통계 로드 실패:', error);
    // 에러 시 기본값 표시
    document.getElementById('totalStores').textContent = 'N/A';
    document.getElementById('activeStores').textContent = 'N/A';
    document.getElementById('totalUsers').textContent = 'N/A';
    document.getElementById('activeUsers').textContent = 'N/A';
    document.getElementById('todayOrders').textContent = 'N/A';
    document.getElementById('totalRevenue').textContent = 'N/A';
  }
}

// 관리자 이벤트 리스너 설정
function setupAdminEventListeners() {
  // 매장 관리
  document.getElementById('viewStores').addEventListener('click', () => {
    alert('매장 목록 보기 기능은 개발 중입니다');
  });
  
  document.getElementById('addStore').addEventListener('click', () => {
    alert('새 매장 추가 기능은 개발 중입니다');
  });
  
  document.getElementById('storeSettings').addEventListener('click', () => {
    alert('매장 설정 기능은 개발 중입니다');
  });

  // 사용자 관리
  document.getElementById('viewUsers').addEventListener('click', () => {
    alert('사용자 목록 기능은 개발 중입니다');
  });
  
  document.getElementById('userAnalytics').addEventListener('click', () => {
    alert('사용자 분석 기능은 개발 중입니다');
  });
  
  document.getElementById('banUser').addEventListener('click', () => {
    alert('계정 관리 기능은 개발 중입니다');
  });

  // 주문 관리
  document.getElementById('viewOrders').addEventListener('click', () => {
    alert('주문 현황 기능은 개발 중입니다');
  });
  
  document.getElementById('orderHistory').addEventListener('click', () => {
    alert('주문 내역 기능은 개발 중입니다');
  });
  
  document.getElementById('refunds').addEventListener('click', () => {
    alert('환불 처리 기능은 개발 중입니다');
  });

  // 시스템 관리
  document.getElementById('systemLogs').addEventListener('click', () => {
    alert('시스템 로그 기능은 개발 중입니다');
  });
  
  document.getElementById('databaseBackup').addEventListener('click', () => {
    alert('데이터베이스 백업 기능은 개발 중입니다');
  });
  
  document.getElementById('cacheManagement').addEventListener('click', () => {
    alert('캐시 관리 기능은 개발 중입니다');
  });
  
  document.getElementById('serverStatus').addEventListener('click', () => {
    alert('서버 상태 기능은 개발 중입니다');
  });

  // 로그아웃 및 뒤로가기
  document.getElementById('backToLogin').addEventListener('click', () => {
    renderLogin();
  });
  
  document.getElementById('logoutAdmin').addEventListener('click', () => {
    if (confirm('관리자 모드에서 로그아웃하시겠습니까?')) {
      renderLogin();
    }
  });
}

// 전역 함수로 등록
window.renderAdminMain = renderAdminMain;
