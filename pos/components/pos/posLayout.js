// POS 레이아웃 관리 모듈
function renderPOSLayout() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div class="pos-container">
      <!-- 상단 헤더 바 -->
      <header class="pos-header">
        <div class="header-left">
          <h1 class="pos-logo">🍽️ TableLink POS</h1>
          <div class="store-info">
            <span id="storeName">매장 정보 로딩중...</span>
          </div>
        </div>

        <div class="header-center">
          <div class="search-bar">
            <input type="text" placeholder="테이블/주문번호 검색..." id="searchInput" />
            <button class="search-btn">🔍</button>
          </div>
        </div>

        <div class="header-right">
          <button class="header-btn notification-btn" title="알림">
            🔔
            <span class="notification-badge">3</span>
          </button>
          <div class="sync-status">
            <span class="sync-time" id="syncTime">연결 중...</span>
            <div class="sync-indicator" id="syncIndicator"></div>
          </div>
          <div class="home-mode-toggle">
            <button class="mode-btn ${window.homeMode === 'table_map' ? 'active' : ''}" onclick="switchHomeMode('table_map')">
              🗺️ 테이블 맵
            </button>
            <button class="mode-btn ${window.homeMode === 'order_list' ? 'active' : ''}" onclick="switchHomeMode('order_list')">
              📋 주문 목록
            </button>
          </div>
        </div>
      </header>

      <!-- 메인 컨텐츠 영역 -->
      <main class="pos-main-content">
        <!-- 테이블 맵 모드 -->
        <div id="tableMapMode" class="home-mode ${window.homeMode === 'table_map' ? 'active' : ''}">
          <main class="table-map-container">
            <div class="table-map" id="tableMap">
              <div class="map-grid" id="mapGrid">
                <!-- 테이블들이 여기에 동적으로 생성됩니다 -->
              </div>
            </div>
          </main>

          <!-- 우측 세부 패널 -->
          <aside class="detail-panel" id="detailPanel">
            <div class="panel-header">
              <h3 id="panelTitle">테이블을 선택하세요</h3>
              <button class="panel-close" onclick="closeDetailPanel()">✕</button>
            </div>
            <div class="panel-content" id="panelContent">
              <div class="select-table-message">
                테이블을 클릭하여 주문 관리를 시작하세요
              </div>
            </div>
          </aside>
        </div>

        <!-- 주문 리스트 모드 -->
        <div id="orderListMode" class="home-mode ${window.homeMode === 'order_list' ? 'active' : ''}">
          <aside class="order-filter-panel">
            <div class="filter-section">
              <h3>주문 상태</h3>
              <div class="order-status-filters">
                <button class="order-filter-btn active" data-status="all" onclick="filterOrders('all')">
                  전체 <span class="count">0</span>
                </button>
                <button class="order-filter-btn" data-status="new" onclick="filterOrders('new')">
                  신규 <span class="count">0</span>
                </button>
                <button class="order-filter-btn" data-status="cooking" onclick="filterOrders('cooking')">
                  조리중 <span class="count">0</span>
                </button>
                <button class="order-filter-btn" data-status="ready" onclick="filterOrders('ready')">
                  완료 <span class="count">0</span>
                </button>
                <button class="order-filter-btn" data-status="payment" onclick="filterOrders('payment')">
                  결제대기 <span class="count">0</span>
                </button>
              </div>
            </div>
          </aside>

          <main class="order-timeline-container">
            <div class="order-timeline" id="orderTimeline">
              <!-- 주문 카드들이 여기에 표시됩니다 -->
            </div>
          </main>

          <aside class="order-detail-panel" id="orderDetailPanel">
            <div class="panel-header">
              <h3>주문 세부정보</h3>
            </div>
            <div class="panel-content">
              <div class="select-order-message">
                주문을 선택하여 세부정보를 확인하세요
              </div>
            </div>
          </aside>
        </div>
      </main>

      <!-- 하단 액션바 -->
      <footer class="pos-footer">
        <div class="action-bar">
          <button class="action-btn primary" onclick="createNewOrder()">
            📦 새 포장 주문
          </button>
          <button class="action-btn" onclick="showPickupQueue()">
            🛍️ 픽업 대기함 <span class="queue-count">0</span>
          </button>
          <button class="action-btn" onclick="showUnassignedOrders()">
            📋 미지정 주문함 <span class="unassigned-count">0</span>
          </button>
          <button class="action-btn" onclick="openQuickMenu()">
            ⚡ 빠른 메뉴
          </button>
        </div>
      </footer>
    </div>

    <style>
      .pos-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* 헤더 스타일 */
      .pos-header {
        background: white;
        padding: 12px 20px;
        border-bottom: 2px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        z-index: 100;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .pos-logo {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
      }

      .store-info {
        background: #eff6ff;
        color: #1e40af;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        border: 1px solid #3b82f6;
      }

      .header-center {
        flex: 1;
        max-width: 400px;
        margin: 0 20px;
      }

      .search-bar {
        display: flex;
        background: #f1f5f9;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid #e2e8f0;
        transition: border-color 0.2s;
      }

      .search-bar:focus-within {
        border-color: #3b82f6;
      }

      #searchInput {
        flex: 1;
        padding: 10px 12px;
        border: none;
        background: transparent;
        font-size: 14px;
        outline: none;
      }

      .search-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 10px 16px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
      }

      .search-btn:hover {
        background: #2563eb;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-btn {
        position: relative;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
      }

      .header-btn:hover {
        background: #e2e8f0;
      }

      .notification-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #ef4444;
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: 600;
        min-width: 16px;
        text-align: center;
      }

      .sync-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: #f1f5f9;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }

      .sync-time {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .sync-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #94a3b8;
        transition: background 0.3s;
      }

      .sync-indicator.active {
        background: #10b981;
        animation: pulse 2s infinite;
      }

      .sync-indicator.inactive {
        background: #ef4444;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .home-mode-toggle {
        display: flex;
        background: #f1f5f9;
        border-radius: 8px;
        padding: 2px;
        border: 1px solid #e2e8f0;
      }

      .mode-btn {
        padding: 8px 16px;
        border: none;
        background: transparent;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        color: #64748b;
      }

      .mode-btn.active {
        background: #3b82f6;
        color: white;
      }

      .mode-btn:not(.active):hover {
        background: #e2e8f0;
      }

      /* 메인 컨텐츠 */
      .pos-main-content {
        flex: 1;
        padding: 20px;
        overflow: hidden;
        display: flex; /* Ensure flex is applied to the main content area */
        position: relative; /* For positioning child modes */
      }

      .home-mode {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        overflow: auto; /* Allow scrolling within each mode */
      }

      .home-mode.active {
        opacity: 1;
        pointer-events: all;
      }

      /* 테이블 맵 */
      .table-map-container {
        flex: 1;
        padding: 20px;
        overflow: auto; /* Changed from hidden to auto for scrolling */
      }

      .table-map {
        height: 100%;
        background: white;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        position: relative;
      }

      .map-grid {
        padding: 20px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 16px;
        height: 100%;
      }

      /* 세부 패널 */
      .detail-panel {
        width: 350px;
        background: white;
        border-left: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
      }

      .panel-header {
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .panel-header h3 {
        font-size: 16px;
        font-weight: 600;
      }

      .panel-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #64748b;
      }

      .panel-content {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        min-height: 0;
        height: 100%;
      }

      .select-table-message {
        text-align: center;
        color: #64748b;
        margin-top: 100px;
      }

      /* 주문 리스트 모드 */
      .order-filter-panel {
        width: 250px;
        background: white;
        border-right: 1px solid #e2e8f0;
        padding: 20px;
      }

      .order-status-filters {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .order-filter-btn {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
      }

      .order-filter-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .count {
        background: #f1f5f9;
        color: #64748b;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 12px;
      }

      .order-filter-btn.active .count {
        background: rgba(255,255,255,0.2);
        color: white;
      }

      .order-timeline-container {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
      }

      .order-detail-panel {
        width: 350px;
        background: white;
        border-left: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        height: 100vh;
      }

      .order-detail-panel .panel-content {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 20px;
      }

      .select-order-message {
        text-align: center;
        color: #64748b;
        margin-top: 100px;
      }

      /* 하단 액션바 */
      .pos-footer {
        background: white;
        border-top: 2px solid #e2e8f0;
        padding: 12px 20px;
        box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
      }

      .action-bar {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .action-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        min-width: 140px;
        text-align: center;
      }

      .action-btn.primary {
        background: #3b82f6;
        color: white;
      }

      .action-btn.primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }

      .action-btn:not(.primary) {
        background: #f1f5f9;
        color: #64748b;
        border: 1px solid #e2e8f0;
      }

      .action-btn:not(.primary):hover {
        background: #e2e8f0;
        color: #475569;
      }

      .queue-count, .unassigned-count {
        background: #ef4444;
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: 700;
        margin-left: 6px;
        min-width: 16px;
        display: inline-block;
        text-align: center;
      }

      /* 반응형 디자인 */
      @media (max-width: 1024px) {
        .pos-header {
          flex-wrap: wrap;
          gap: 12px;
        }

        .header-center {
          order: 3;
          flex-basis: 100%;
          margin: 0;
          max-width: none;
        }

        .action-bar {
          flex-wrap: wrap;
          justify-content: center;
        }

        .action-btn {
          min-width: 120px;
          font-size: 12px;
          padding: 10px 16px;
        }
      }

      @media (max-width: 768px) {
        .pos-header {
          padding: 8px 12px;
        }

        .pos-main-content {
          padding: 12px;
        }

        .pos-footer {
          padding: 8px 12px;
        }

        .home-mode-toggle {
          display: none;
        }

        .header-right {
          gap: 8px;
        }

        .action-btn {
          min-width: 100px;
          font-size: 11px;
          padding: 8px 12px;
        }
      }
    </style>
  `;
}

// POS 레이아웃 스타일
// function getPOSLayoutStyles() { // This function is no longer needed as styles are inlined
//   return `
//     <style>
//       // ... styles ...
//     </style>
//   `;
// }

// 홈 모드 전환
function switchHomeMode(mode) {
  window.homeMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[onclick="switchHomeMode('${mode}')"]`).classList.add('active');

  document.querySelectorAll('.home-mode').forEach(el => el.classList.remove('active'));
  document.getElementById(mode === 'table_map' ? 'tableMapMode' : 'orderListMode').classList.add('active');

  if (mode === 'table_map') {
    renderTableMap();
  } else {
    renderOrderList();
  }
}

// 주문 리스트 렌더링
function renderOrderList() {
  const orderTimeline = document.getElementById('orderTimeline');
  if (orderTimeline) {
    orderTimeline.innerHTML = `
      <div style="text-align: center; color: #64748b; margin-top: 50px;">
        주문 데이터를 불러오는 중...
      </div>
    `;
  }
}

// 주문 필터링
function filterOrders(status) {
  window.orderFilter = status;
  document.querySelectorAll('.order-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[onclick="filterOrders('${status}')"]`).classList.add('active');
  renderOrderList();
}

// Helper function to close the detail panel (assuming it exists and is needed)
function closeDetailPanel() {
  const detailPanel = document.getElementById('detailPanel');
  if (detailPanel) {
    detailPanel.style.display = 'none'; // Or some other way to hide it
  }
}

// Helper function to render the table map (assuming it exists and is needed)
function renderTableMap() {
  const mapGrid = document.getElementById('mapGrid');
  if (mapGrid) {
    mapGrid.innerHTML = `
      <div style="text-align: center; color: #64748b; margin-top: 50px;">
        테이블 맵을 불러오는 중...
      </div>
    `;
  }
}

// Placeholder functions for buttons in footer
function createNewOrder() { console.log('Creating new order...'); }
function showPickupQueue() { console.log('Showing pickup queue...'); }
function showUnassignedOrders() { console.log('Showing unassigned orders...'); }
function openQuickMenu() { console.log('Opening quick menu...'); }


// 전역 함수 등록
window.renderPOSLayout = renderPOSLayout;
window.switchHomeMode = switchHomeMode;
window.filterOrders = filterOrders;
window.renderOrderList = renderOrderList;
window.closeDetailPanel = closeDetailPanel; // Register closeDetailPanel
window.renderTableMap = renderTableMap; // Register renderTableMap