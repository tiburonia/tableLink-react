
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
              📋 주문 리스트
            </button>
          </div>
        </div>
      </header>

      <!-- 메인 컨텐츠 영역 -->
      <div class="pos-main">
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
      </div>

      <!-- 하단 액션바 -->
      <footer class="pos-footer">
        <div class="action-bar">
          <button class="action-btn primary" onclick="createNewOrder()">
            📦 새 포장 주문
          </button>
          <button class="action-btn" onclick="showPickupQueue()">
            🛍️ 픽업 대기함 <span class="queue-count">2</span>
          </button>
          <button class="action-btn warning" onclick="showUnassignedOrders()">
            ❓ 미지정 주문함 <span class="unassigned-count">1</span>
          </button>
          <button class="action-btn" onclick="openQuickMenu()">
            ⚡ 빠른 메뉴
          </button>
        </div>
      </footer>
    </div>

    ${getPOSLayoutStyles()}
  `;
}

// POS 레이아웃 스타일
function getPOSLayoutStyles() {
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

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
        border-bottom: 1px solid #e2e8f0;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        z-index: 1000;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .pos-logo {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
      }

      .store-info {
        display: flex;
        align-items: center;
        color: #1e293b;
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 0px;
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
      }

      .search-bar input {
        flex: 1;
        padding: 10px 16px;
        border: none;
        background: transparent;
        outline: none;
      }

      .search-btn {
        padding: 10px 16px;
        background: #64748b;
        color: white;
        border: none;
        cursor: pointer;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .header-btn {
        position: relative;
        padding: 8px 12px;
        background: #f1f5f9;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
      }

      .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sync-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #64748b;
      }

      .sync-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        transition: background-color 0.3s ease;
      }

      .sync-indicator.inactive {
        background: #ef4444;
      }

      .home-mode-toggle {
        display: flex;
        background: #f1f5f9;
        border-radius: 8px;
        overflow: hidden;
      }

      .mode-btn {
        padding: 8px 16px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .mode-btn.active {
        background: #3b82f6;
        color: white;
      }

      /* 메인 컨텐츠 */
      .pos-main {
        flex: 1;
        display: flex;
        position: relative;
        overflow: hidden;
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
      }

      .home-mode.active {
        opacity: 1;
        pointer-events: all;
      }

      /* 테이블 맵 */
      .table-map-container {
        flex: 1;
        padding: 20px;
        overflow: auto;
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
        border-top: 1px solid #e2e8f0;
        padding: 16px 20px;
      }

      .action-bar {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .action-btn {
        position: relative;
        padding: 12px 20px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: #f8fafc;
      }

      .action-btn.primary {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .action-btn.warning {
        background: #f59e0b;
        color: white;
        border-color: #f59e0b;
      }

      .queue-count, .unassigned-count {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* 반응형 */
      @media (max-width: 1200px) {
        .detail-panel {
          width: 300px;
        }
      }

      @media (max-width: 900px) {
        .header-center {
          display: none;
        }
      }
    </style>
  `;
}

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
  orderTimeline.innerHTML = `
    <div style="text-align: center; color: #64748b; margin-top: 50px;">
      주문 데이터를 불러오는 중...
    </div>
  `;
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

// 전역 함수 등록
window.renderPOSLayout = renderPOSLayout;
window.switchHomeMode = switchHomeMode;
window.filterOrders = filterOrders;
window.renderOrderList = renderOrderList;
