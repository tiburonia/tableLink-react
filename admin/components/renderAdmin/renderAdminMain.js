
const renderAdminMain = function() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div id="adminContainer" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
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
      <div style="padding: 20px; min-height: 100vh; box-sizing: border-box; max-width: 1400px; margin: 0 auto;">
        <header style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="color: #ff6b6b; margin: 0; font-size: clamp(24px, 4vw, 32px);">🛠️ TableLink 관리자 패널</h1>
          <p style="color: #888; margin: 10px 0 0 0; font-size: clamp(14px, 2vw, 16px);">시스템 관리 및 모니터링</p>
        </header>

        <main>
          <!-- 대시보드 통계 -->
          <section style="margin-bottom: 30px;">
            <h2 style="color: #4ecdc4; margin-bottom: 15px; font-size: clamp(18px, 3vw, 24px);">📊 실시간 통계</h2>
            <div class="stats-grid">
              <div id="storeStats" class="stat-card">
                <h4 style="margin: 0 0 10px 0; color: #4ecdc4;">매장 통계</h4>
                <p style="margin: 5px 0; color: #ccc;">총 매장 수: <span id="totalStores">로딩중...</span></p>
                <p style="margin: 5px 0; color: #ccc;">활성 매장: <span id="activeStores">로딩중...</span></p>
              </div>
              <div id="userStats" class="stat-card">
                <h4 style="margin: 0 0 10px 0; color: #45b7d1;">사용자 통계</h4>
                <p style="margin: 5px 0; color: #ccc;">총 사용자 수: <span id="totalUsers">로딩중...</span></p>
                <p style="margin: 5px 0; color: #ccc;">오늘 활성 사용자: <span id="activeUsers">로딩중...</span></p>
              </div>
              <div id="orderStats" class="stat-card">
                <h4 style="margin: 0 0 10px 0; color: #f39c12;">주문 통계</h4>
                <p style="margin: 5px 0; color: #ccc;">오늘 주문 수: <span id="todayOrders">로딩중...</span></p>
                <p style="margin: 5px 0; color: #ccc;">총 매출: <span id="totalRevenue">로딩중...</span></p>
              </div>
            </div>
          </section>

          <!-- 관리 기능 -->
          <section style="margin-bottom: 30px;">
            <h2 style="color: #f39c12; margin-bottom: 15px; font-size: clamp(18px, 3vw, 24px);">⚙️ 관리 기능</h2>
            <div class="management-grid">
              <div class="management-card">
                <h3 style="color: #ff6b6b; margin: 0 0 15px 0;">🏪 매장 관리</h3>
                <button id="viewStores" class="admin-button primary">매장 목록 보기</button>
                <button id="addStore" class="admin-button primary">새 매장 추가</button>
                <button id="storeSettings" class="admin-button primary">매장 설정</button>
              </div>

              <div class="management-card">
                <h3 style="color: #4ecdc4; margin: 0 0 15px 0;">👥 사용자 관리</h3>
                <button id="viewUsers" class="admin-button secondary">사용자 목록</button>
                <button id="userAnalytics" class="admin-button secondary">사용자 분석</button>
                <button id="banUser" class="admin-button secondary">계정 관리</button>
              </div>

              <div class="management-card">
                <h3 style="color: #f39c12; margin: 0 0 15px 0;">📦 주문 관리</h3>
                <button id="viewOrders" class="admin-button warning">주문 현황</button>
                <button id="orderHistory" class="admin-button warning">주문 내역</button>
                <button id="refunds" class="admin-button warning">환불 처리</button>
              </div>
            </div>
          </section>

          <!-- 시스템 관리 -->
          <section style="margin-bottom: 30px;">
            <h2 style="color: #9b59b6; margin-bottom: 15px; font-size: clamp(18px, 3vw, 24px);">🔧 시스템 관리</h2>
            <div class="system-grid">
              <button id="systemLogs" class="system-button">📋 시스템 로그</button>
              <button id="databaseBackup" class="system-button">💾 데이터베이스 백업</button>
              <button id="cacheManagement" class="system-button">🗂️ 캐시 관리</button>
              <button id="serverStatus" class="system-button">⚡ 서버 상태</button>
            </div>
          </section>

          <!-- 로그아웃 -->
          <section class="logout-section">
            <button id="backToLogin" class="logout-button secondary">← 로그인 화면으로</button>
            <button id="logoutAdmin" class="logout-button danger">🚪 관리자 로그아웃</button>
          </section>
        </main>
      </div>
    </div>

    <style>
      /* 반응형 그리드 시스템 */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }

      .management-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }

      .system-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }

      /* 카드 스타일 */
      .stat-card {
        background: #2d2d2d;
        padding: 20px;
        border-radius: 12px;
        border-left: 4px solid #4ecdc4;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .stat-card:nth-child(2) {
        border-left-color: #45b7d1;
      }

      .stat-card:nth-child(3) {
        border-left-color: #f39c12;
      }

      .management-card {
        background: #2d2d2d;
        padding: 24px;
        border-radius: 12px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .management-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      /* 버튼 스타일 */
      .admin-button {
        width: 100%;
        padding: 12px 16px;
        margin: 6px 0;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        text-transform: none;
      }

      .admin-button.primary {
        background: #ff6b6b;
        color: white;
      }

      .admin-button.primary:hover {
        background: #ff5252;
        transform: translateY(-1px);
      }

      .admin-button.secondary {
        background: #4ecdc4;
        color: white;
      }

      .admin-button.secondary:hover {
        background: #26d0ce;
        transform: translateY(-1px);
      }

      .admin-button.warning {
        background: #f39c12;
        color: white;
      }

      .admin-button.warning:hover {
        background: #e67e22;
        transform: translateY(-1px);
      }

      .system-button {
        padding: 16px 20px;
        background: #9b59b6;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        text-align: center;
      }

      .system-button:hover {
        background: #8e44ad;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .logout-section {
        text-align: center;
        margin-top: 40px;
        padding: 30px 0;
        border-top: 2px solid #333;
        display: flex;
        justify-content: center;
        gap: 15px;
        flex-wrap: wrap;
      }

      .logout-button {
        padding: 14px 30px;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: all 0.2s ease;
        min-width: 180px;
      }

      .logout-button.secondary {
        background: #666;
        color: white;
      }

      .logout-button.secondary:hover {
        background: #555;
        transform: translateY(-1px);
      }

      .logout-button.danger {
        background: #e74c3c;
        color: white;
      }

      .logout-button.danger:hover {
        background: #c0392b;
        transform: translateY(-1px);
      }

      /* 태블릿 스타일 */
      @media (max-width: 1024px) {
        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .management-grid {
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 15px;
        }

        .system-grid {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
      }

      /* 모바일 스타일 */
      @media (max-width: 768px) {
        #adminContainer > div {
          padding: 15px;
        }

        .stats-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .management-grid {
          grid-template-columns: 1fr;
          gap: 15px;
        }

        .system-grid {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }

        .stat-card, .management-card {
          padding: 16px;
        }

        .logout-section {
          flex-direction: column;
          align-items: center;
        }

        .logout-button {
          width: 100%;
          max-width: 280px;
        }

        .admin-button {
          padding: 14px 16px;
          font-size: 15px;
        }

        .system-button {
          padding: 14px 16px;
          font-size: 13px;
        }
      }

      /* 작은 모바일 화면 */
      @media (max-width: 480px) {
        #adminContainer > div {
          padding: 12px;
        }

        .system-grid {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .system-button {
          padding: 12px 10px;
          font-size: 12px;
        }

        header h1 {
          font-size: 22px !important;
        }

        header p {
          font-size: 14px !important;
        }

        section h2 {
          font-size: 18px !important;
        }
      }

      /* 큰 화면 스타일 */
      @media (min-width: 1200px) {
        .stats-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .management-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .system-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      /* 다크 테마 스크롤바 */
      #adminContainer::-webkit-scrollbar {
        width: 8px;
      }

      #adminContainer::-webkit-scrollbar-track {
        background: #1a1a1a;
      }

      #adminContainer::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 4px;
      }

      #adminContainer::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    </style>
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
        window.location.href = '/';
      });
    }
    
    if (logoutAdminBtn) {
      logoutAdminBtn.addEventListener('click', () => {
        if (confirm('관리자 모드에서 로그아웃하시겠습니까?')) {
          window.location.href = '/';
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
