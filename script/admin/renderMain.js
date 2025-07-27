
function renderAdminMain() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div id="adminContainer" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: #1a1a1a;
      color: white;
      font-family: Arial, sans-serif;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
    ">
      <div style="padding: 20px 20px 40px 20px; min-height: 100vh; box-sizing: border-box;">
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
        <section style="text-align: center; margin-top: 40px; margin-bottom: 40px; padding-top: 20px; padding-bottom: 20px; border-top: 2px solid #333;">
          <button id="backToLogin" style="padding: 12px 30px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 0 10px;">← 로그인 화면으로</button>
          <button id="logoutAdmin" style="padding: 12px 30px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 0 10px;">🚪 관리자 로그아웃</button>
        </section>
      </main>
      </div>
    </div>
  `;

  // 통계 데이터 로드 (비동기로 안전하게 처리)
  setTimeout(() => {
    loadAdminStats();
  }, 100);

  // 이벤트 리스너 등록
  setupAdminEventListeners();
}

// 관리자 통계 데이터 로드
async function loadAdminStats() {
  try {
    console.log('📊 관리자 통계 로딩 시작...');
    
    // 실제 데이터베이스에서 통계 정보 가져오기
    const [storesResponse, usersResponse] = await Promise.all([
      fetch('/api/admin/stats/stores'),
      fetch('/api/admin/stats/users')
    ]);

    const storesData = storesResponse.ok ? await storesResponse.json() : { total: 0, active: 0 };
    const usersData = usersResponse.ok ? await usersResponse.json() : { total: 0, activeToday: 0 };
    
    // 주문 데이터는 아직 API가 없으므로 임시로 0으로 설정
    const orderData = { todayCount: 0, totalRevenue: 0 };
    
    // DOM 요소 존재 확인 후 업데이트
    const totalStoresEl = document.getElementById('totalStores');
    const activeStoresEl = document.getElementById('activeStores');
    const totalUsersEl = document.getElementById('totalUsers');
    const activeUsersEl = document.getElementById('activeUsers');
    const todayOrdersEl = document.getElementById('todayOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    if (totalStoresEl) totalStoresEl.textContent = storesData.total || '0';
    if (activeStoresEl) activeStoresEl.textContent = storesData.active || '0';
    if (totalUsersEl) totalUsersEl.textContent = usersData.total || '0';
    if (activeUsersEl) activeUsersEl.textContent = usersData.activeToday || '0';
    if (todayOrdersEl) todayOrdersEl.textContent = orderData.todayCount || '0';
    if (totalRevenueEl) totalRevenueEl.textContent = (orderData.totalRevenue || 0).toLocaleString() + '원';
    
    console.log('✅ 관리자 통계 로딩 완료');
    
  } catch (error) {
    console.error('❌ 관리자 통계 로드 실패:', error);
    // 에러 시 기본값 표시
    const totalStoresEl = document.getElementById('totalStores');
    const activeStoresEl = document.getElementById('activeStores');
    const totalUsersEl = document.getElementById('totalUsers');
    const activeUsersEl = document.getElementById('activeUsers');
    const todayOrdersEl = document.getElementById('todayOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    if (totalStoresEl) totalStoresEl.textContent = 'N/A';
    if (activeStoresEl) activeStoresEl.textContent = 'N/A';
    if (totalUsersEl) totalUsersEl.textContent = 'N/A';
    if (activeUsersEl) activeUsersEl.textContent = 'N/A';
    if (todayOrdersEl) todayOrdersEl.textContent = 'N/A';
    if (totalRevenueEl) totalRevenueEl.textContent = 'N/A';
  }
}

// 관리자 이벤트 리스너 설정
function setupAdminEventListeners() {
  try {
    console.log('🔧 관리자 이벤트 리스너 설정 중...');
    
    // 매장 관리
    const viewStoresBtn = document.getElementById('viewStores');
    const addStoreBtn = document.getElementById('addStore');
    const storeSettingsBtn = document.getElementById('storeSettings');
    
    if (viewStoresBtn) {
      viewStoresBtn.addEventListener('click', () => {
        alert('매장 목록 보기 기능은 개발 중입니다');
      });
    }
    
    if (addStoreBtn) {
      addStoreBtn.addEventListener('click', () => {
        alert('새 매장 추가 기능은 개발 중입니다');
      });
    }
    
    if (storeSettingsBtn) {
      storeSettingsBtn.addEventListener('click', () => {
        alert('매장 설정 기능은 개발 중입니다');
      });
    }

    // 사용자 관리
    const viewUsersBtn = document.getElementById('viewUsers');
    const userAnalyticsBtn = document.getElementById('userAnalytics');
    const banUserBtn = document.getElementById('banUser');
    
    if (viewUsersBtn) {
      viewUsersBtn.addEventListener('click', () => {
        alert('사용자 목록 기능은 개발 중입니다');
      });
    }
    
    if (userAnalyticsBtn) {
      userAnalyticsBtn.addEventListener('click', () => {
        alert('사용자 분석 기능은 개발 중입니다');
      });
    }
    
    if (banUserBtn) {
      banUserBtn.addEventListener('click', () => {
        alert('계정 관리 기능은 개발 중입니다');
      });
    }

    // 주문 관리
    const viewOrdersBtn = document.getElementById('viewOrders');
    const orderHistoryBtn = document.getElementById('orderHistory');
    const refundsBtn = document.getElementById('refunds');
    
    if (viewOrdersBtn) {
      viewOrdersBtn.addEventListener('click', () => {
        alert('주문 현황 기능은 개발 중입니다');
      });
    }
    
    if (orderHistoryBtn) {
      orderHistoryBtn.addEventListener('click', () => {
        alert('주문 내역 기능은 개발 중입니다');
      });
    }
    
    if (refundsBtn) {
      refundsBtn.addEventListener('click', () => {
        alert('환불 처리 기능은 개발 중입니다');
      });
    }

    // 시스템 관리
    const systemLogsBtn = document.getElementById('systemLogs');
    const databaseBackupBtn = document.getElementById('databaseBackup');
    const cacheManagementBtn = document.getElementById('cacheManagement');
    const serverStatusBtn = document.getElementById('serverStatus');
    
    if (systemLogsBtn) {
      systemLogsBtn.addEventListener('click', () => {
        alert('시스템 로그 기능은 개발 중입니다');
      });
    }
    
    if (databaseBackupBtn) {
      databaseBackupBtn.addEventListener('click', () => {
        alert('데이터베이스 백업 기능은 개발 중입니다');
      });
    }
    
    if (cacheManagementBtn) {
      cacheManagementBtn.addEventListener('click', () => {
        alert('캐시 관리 기능은 개발 중입니다');
      });
    }
    
    if (serverStatusBtn) {
      serverStatusBtn.addEventListener('click', () => {
        alert('서버 상태 기능은 개발 중입니다');
      });
    }

    // 로그아웃 및 뒤로가기
    const backToLoginBtn = document.getElementById('backToLogin');
    const logoutAdminBtn = document.getElementById('logoutAdmin');
    
    if (backToLoginBtn) {
      backToLoginBtn.addEventListener('click', () => {
        renderLogin();
      });
    }
    
    if (logoutAdminBtn) {
      logoutAdminBtn.addEventListener('click', () => {
        if (confirm('관리자 모드에서 로그아웃하시겠습니까?')) {
          renderLogin();
        }
      });
    }
    
    console.log('✅ 관리자 이벤트 리스너 설정 완료');
    
  } catch (error) {
    console.error('❌ 이벤트 리스너 설정 오류:', error);
  }
}

// 전역 함수로 등록
window.renderAdminMain = renderAdminMain;
