// POS 시스템 상태
let currentStore = null;
let currentTable = null;
let currentOrder = [];
let allMenus = [];
let categories = [];
let selectedCategory = 'all';
let allTables = [];
let homeMode = 'table_map'; // 'table_map' 또는 'order_list'
let tableFilter = 'all';
let orderFilter = 'all';

// WebSocket 연결 상태
let posSocket = null;
let isWebSocketConnected = false;

// POS 시스템 초기화
async function renderPOS() {
  try {
    console.log('📟 POS 시스템 초기화 중...');

    // 기본 UI 렌더링
    renderPOSLayout();

    // URL에서 매장 ID 추출
    const urlParts = window.location.pathname.split('/');
    const storeId = urlParts[2]; // /pos/:storeId

    if (storeId) {
      console.log(`📟 URL에서 매장 ID 감지: ${storeId}`);
      await loadStoreById(storeId);
      
      // WebSocket 연결 시작
      initWebSocket(storeId);
    } else {
      // 매장 정보 로드 (기존에는 매장 선택 UI를 통해 로드했으나, 이제는 URL 필수)
      showError('매장 ID가 URL에 포함되어야 합니다. (예: /pos/123)');
      return; // 매장 ID가 없으면 초기화 중단
    }

    console.log('✅ POS 시스템 초기화 완료');
  } catch (error) {
    console.error('❌ POS 시스템 초기화 실패:', error);
    showError('POS 시스템 초기화에 실패했습니다.');
  }
}

// POS 레이아웃 렌더링
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
            <button class="mode-btn ${homeMode === 'table_map' ? 'active' : ''}" onclick="switchHomeMode('table_map')">
              🗺️ 테이블 맵
            </button>
            <button class="mode-btn ${homeMode === 'order_list' ? 'active' : ''}" onclick="switchHomeMode('order_list')">
              📋 주문 리스트
            </button>
          </div>
        </div>
      </header>

      <!-- 메인 컨텐츠 영역 -->
      <div class="pos-main">
        <!-- 테이블 맵 모드 -->
        <div id="tableMapMode" class="home-mode ${homeMode === 'table_map' ? 'active' : ''}">
          <!-- 중앙 테이블 맵 -->
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
        <div id="orderListMode" class="home-mode ${homeMode === 'order_list' ? 'active' : ''}">
          <!-- 좌측 주문 필터 -->
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

          <!-- 중앙 주문 타임라인 -->
          <main class="order-timeline-container">
            <div class="order-timeline" id="orderTimeline">
              <!-- 주문 카드들이 여기에 표시됩니다 -->
            </div>
          </main>

          <!-- 우측 주문 세부 패널 -->
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

    <!-- 스타일 -->
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

      /* POS 실시간 알림 스타일 */
      .pos-notification {
        position: fixed;
        top: 80px;
        right: 20px;
        max-width: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        border-left: 4px solid #3b82f6;
        animation: slideInFromRight 0.3s ease-out;
      }

      .pos-notification.success {
        border-left-color: #10b981;
      }

      .pos-notification.warning {
        border-left-color: #f59e0b;
      }

      .pos-notification.error {
        border-left-color: #ef4444;
      }

      .notification-content {
        padding: 16px 20px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .notification-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
        color: #374151;
        white-space: pre-line;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #9ca3af;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .notification-close:hover {
        color: #6b7280;
      }

      @keyframes slideInFromRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
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

      .table-item {
        position: relative;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100px;
      }

      .table-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .table-item.selected {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .table-item.available { 
        border-color: #10b981; 
        background: #ecfdf5; 
      }
      .table-item.occupied { 
        border-color: #ef4444; 
        background: #fef2f2; 
      }

      .table-number {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .table-info {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 8px;
      }

      .table-badges {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
      }

      .badge {
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
      }

      .badge.timer { background: #ddd6fe; color: #7c3aed; }
      .badge.amount { background: #dcfce7; color: #16a34a; }

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

      /* 테이블 상태 섹션 */
      .table-status-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .table-status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .table-status-header h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .status-indicator {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-indicator.occupied {
        background: #fef2f2;
        color: #dc2626;
      }

      .status-indicator.available {
        background: #f0fdf4;
        color: #16a34a;
      }

      .table-control-actions {
        display: flex;
        gap: 8px;
      }

      /* POS 주문 아이템 스타일 */
      .pos-container .order-item {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .pos-container .order-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 0 2px 2px 0;
      }

      .pos-container .order-item:hover {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-color: rgba(59, 130, 246, 0.3);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
      }

      .pos-container .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .pos-container .order-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .pos-container .customer-name {
        font-size: 15px;
        font-weight: 700;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .pos-container .order-time {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .pos-container .order-amount {
        font-size: 16px;
        font-weight: 700;
        color: #059669;
        background: #ecfdf5;
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid #d1fae5;
      }

      .pos-container .order-details {
        margin: 12px 0;
        background: #f8fafc;
        border-radius: 8px;
        padding: 8px;
        border: 1px solid #f1f5f9;
      }

      .pos-container .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        font-size: 13px;
        border-bottom: 1px solid #f1f5f9;
      }

      .pos-container .menu-item:last-child {
        border-bottom: none;
      }

      .pos-container .menu-name {
        flex: 1;
        color: #374151;
        font-weight: 500;
      }

      .pos-container .menu-quantity {
        color: #6b7280;
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        margin: 0 8px;
        min-width: 24px;
        text-align: center;
      }

      .pos-container .menu-price {
        color: #059669;
        font-weight: 600;
        font-size: 12px;
        min-width: 60px;
        text-align: right;
      }

      .pos-container .order-status {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
      }

      .pos-container .status-badge {
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .pos-container .status-badge.pending {
        background: #fef3c7;
        color: #d97706;
        border: 1px solid #fde68a;
      }

      .pos-container .status-badge.cooking {
        background: #ddd6fe;
        color: #7c3aed;
        border: 1px solid #c4b5fd;
      }

      .pos-container .status-badge.completed {
        background: #dcfce7;
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }

      .pos-container .status-badge.cancelled {
        background: #fecaca;
        color: #dc2626;
        border: 1px solid #fca5a5;
      }

      .pos-container .no-orders, 
      .pos-container .no-items {
        text-align: center;
        color: #94a3b8;
        font-style: italic;
        padding: 24px 20px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px dashed #cbd5e1;
        margin: 12px 0;
      }

      .pos-container .loading-message, 
      .pos-container .error-message {
        text-align: center;
        color: #64748b;
        padding: 40px 20px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #f1f5f9;
      }

      .pos-container .error-message {
        color: #dc2626;
        background: #fef2f2;
        border-color: #fecaca;
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
  homeMode = mode;
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

// 테이블 맵 렌더링
function renderTableMap() {
  const mapGrid = document.getElementById('mapGrid');

  if (!allTables || allTables.length === 0) {
    mapGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #64748b; margin-top: 50px;">
        테이블 정보를 불러오는 중...
      </div>
    `;
    return;
  }

  mapGrid.innerHTML = allTables.map(table => {
    const status = table.isOccupied ? 'occupied' : 'available';
    const statusText = table.isOccupied ? '사용중' : '이용가능';
    const occupiedTime = table.isOccupied && table.occupiedSince 
      ? getTimeDifferenceText(table.occupiedSince) 
      : '';
    
    return `
      <div class="table-item ${status}" onclick="selectTableFromMap('${table.tableNumber}')">
        <div class="table-number">T${table.tableNumber}</div>
        <div class="table-info">${table.seats}석</div>
        <div class="table-badges">
          <div class="badge ${status === 'occupied' ? 'timer' : 'amount'}">${statusText}</div>
          ${occupiedTime ? `<div class="badge timer">${occupiedTime}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// 테이블 맵에서 테이블 선택
function selectTableFromMap(tableNumber) {
  // 기존 선택 해제
  document.querySelectorAll('.table-item').forEach(item => {
    item.classList.remove('selected');
  });

  // 새로운 선택
  event.target.closest('.table-item').classList.add('selected');
  currentTable = tableNumber;

  // 세부 패널 업데이트
  updateDetailPanel(tableNumber);
}

// 세부 패널 업데이트
async function updateDetailPanel(tableNumber) {
  const panelTitle = document.getElementById('panelTitle');
  const panelContent = document.getElementById('panelContent');

  panelTitle.textContent = `테이블 ${tableNumber}`;
  
  // 로딩 상태 표시
  panelContent.innerHTML = `
    <div class="loading-message">
      테이블 정보를 불러오는 중...
    </div>
  `;

  try {
    // 현재 테이블 상태 확인
    const currentTable = allTables.find(t => t.tableNumber == tableNumber);
    const isOccupied = currentTable ? currentTable.isOccupied : false;
    
    let activeOrders = [];
    
    if (isOccupied) {
      // 테이블이 점유된 경우, 점유 시점 이후의 주문들만 조회
      const occupiedSince = new Date(currentTable.occupiedSince);
      
      const ordersResponse = await fetch(`/api/orders/stores/${currentStore.id}?limit=50`);
      const ordersData = await ordersResponse.json();
      
      // 현재 테이블의 점유 시점 이후 주문들만 필터링
      activeOrders = ordersData.success ? 
        ordersData.orders.filter(order => {
          const orderDate = new Date(order.orderDate);
          return order.tableNumber == tableNumber && orderDate >= occupiedSince;
        }) : [];
    }

    panelContent.innerHTML = `
      <div class="table-status-section">
        <div class="table-status-header">
          <h4>테이블 상태</h4>
          <div class="status-indicator ${isOccupied ? 'occupied' : 'available'}">
            ${isOccupied ? '🔴 사용중' : '🟢 이용가능'}
          </div>
        </div>
        
        <div class="table-control-actions">
          ${isOccupied ? 
            `<button class="action-btn warning" onclick="releaseTable('${tableNumber}')">
              테이블 해제
            </button>` :
            `<button class="action-btn primary" onclick="occupyTable('${tableNumber}')">
              테이블 점유
            </button>`
          }
        </div>
      </div>

      <div class="table-actions">
        <button class="action-btn primary" onclick="addOrder()">주문 추가</button>
        <button class="action-btn" onclick="viewOrders()">주문 내역</button>
        <button class="action-btn" onclick="moveTable()">테이블 이동</button>
        <button class="action-btn warning" onclick="processPayment()">결제 처리</button>
      </div>

      <div class="current-orders">
        <h4>${isOccupied ? '현재 점유 주문' : '주문 없음'}</h4>
        <div class="order-items">
          ${activeOrders.length > 0 ? 
            activeOrders.map(order => `
              <div class="order-item">
                <div class="order-header">
                  <div class="order-info">
                    <span class="customer-name">👤 ${order.customerName}</span>
                    <span class="order-time">${formatOrderTime(order.orderDate)}</span>
                  </div>
                  <div class="order-amount">₩${order.finalAmount.toLocaleString()}</div>
                </div>
                
                <div class="order-details">
                  ${order.orderData && order.orderData.items ? 
                    order.orderData.items.map(item => `
                      <div class="menu-item">
                        <span class="menu-name">${item.name}</span>
                        <span class="menu-quantity">x${item.quantity || 1}</span>
                        <span class="menu-price">₩${item.price.toLocaleString()}</span>
                      </div>
                    `).join('') : 
                    '<div class="no-items">주문 상세 정보 없음</div>'
                  }
                </div>
                
                <div class="order-status">
                  <span class="status-badge ${order.orderStatus}">${getStatusText(order.orderStatus)}</span>
                </div>
              </div>
            `).join('') :
            `<div class="no-orders">${isOccupied ? '점유된 테이블이지만 주문이 없습니다' : '테이블이 비어있습니다'}</div>`
          }
        </div>
      </div>
    `;

  } catch (error) {
    console.error('❌ 테이블 정보 로드 실패:', error);
    panelContent.innerHTML = `
      <div class="error-message">
        테이블 정보를 불러오는데 실패했습니다.
      </div>
    `;
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

// 시간 차이 텍스트 반환
function getTimeDifferenceText(occupiedSince) {
  const now = new Date();
  const occupied = new Date(occupiedSince);
  const diffMinutes = Math.floor((now - occupied) / (1000 * 60));
  
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}시간 ${diffMinutes % 60}분 전`;
}

// 주문 필터링
function filterOrders(status) {
  orderFilter = status;

  document.querySelectorAll('.order-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[onclick="filterOrders('${status}')"]`).classList.add('active');

  // 주문 필터링 로직 구현
  renderOrderList();
}

// 세부 패널 닫기
function closeDetailPanel() {
  document.querySelectorAll('.table-item').forEach(item => {
    item.classList.remove('selected');
  });
  currentTable = null;

  document.getElementById('panelTitle').textContent = '테이블을 선택하세요';
  document.getElementById('panelContent').innerHTML = `
    <div class="select-table-message">
      테이블을 클릭하여 주문 관리를 시작하세요
    </div>
  `;
}

// 테이블 상세 정보 로드
async function loadStoreDetails(storeId) {
  try {
    const response = await fetch(`/api/stores/${storeId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error('매장 정보 조회 실패');
    }

    const store = data.store;
    
    // 메뉴 데이터 처리
    let menu = store.menu || [];
    if (typeof menu === 'string') {
      try {
        menu = JSON.parse(menu);
      } catch (error) {
        console.warn('메뉴 JSON 파싱 실패:', error);
        menu = [];
      }
    }
    allMenus = menu;
    
    console.log(`🍽️ 매장 ${storeId} 메뉴 ${allMenus.length}개 로드 완료`);

    // 실제 데이터베이스에서 테이블 정보 로드
    await loadTables();

    // 테이블 맵 렌더링
    if (homeMode === 'table_map') {
      renderTableMap();
    }

  } catch (error) {
    console.error('❌ 매장 상세 정보 로드 실패:', error);
    throw error;
  }
}

// 테이블 목록 로드 (실제 데이터베이스 사용)
async function loadTables() {
  try {
    const response = await fetch(`/api/pos/stores/${currentStore.id}/tables`);
    const data = await response.json();
    
    if (data.success) {
      allTables = data.tables || [];
      console.log(`🪑 매장 ${currentStore.id} 테이블 ${allTables.length}개 로드 완료`);
    } else {
      throw new Error('테이블 데이터 로드 실패');
    }
  } catch (error) {
    console.error('❌ 테이블 데이터 로드 실패:', error);
    allTables = [];
  }
}

// URL에서 매장 ID로 직접 로드
async function loadStoreById(storeId) {
  try {
    console.log(`🏪 매장 ID ${storeId}로 직접 로드 중...`);

    const response = await fetch(`/api/stores/${storeId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error('매장 정보 조회 실패');
    }

    const store = data.store;

    currentStore = { 
      id: parseInt(storeId), 
      name: store.name, 
      category: store.category || '기타' 
    };

    // 매장 정보 표시
    document.getElementById('storeName').textContent = `${store.name} (${store.category || '기타'})`;

    await loadStoreDetails(storeId);

    console.log(`✅ 매장 ${store.name} 로드 완료 (URL 고정 모드)`);

  } catch (error) {
    console.error('❌ 매장 직접 로드 실패:', error);
    showError('매장 정보를 불러오는데 실패했습니다.');
  }
}


// 에러 표시
function showError(message) {
  alert(message);
}

// 테이블 점유 기능
async function occupyTable(tableNumber) {
  try {
    console.log(`🔒 [POS] 테이블 ${tableNumber} 점유 요청`);
    
    const response = await fetch('/api/tables/occupy-manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: currentStore.id,
        tableName: `테이블 ${tableNumber}`,
        duration: 0 // 무제한 (수동 해제)
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(`테이블 ${tableNumber}이 점유 상태로 변경되었습니다.`);
      
      // 테이블 상태 업데이트
      await loadTables();
      renderTableMap();
      updateDetailPanel(tableNumber);
    } else {
      alert('오류: ' + data.error);
    }
    
  } catch (error) {
    console.error('❌ [POS] 테이블 점유 실패:', error);
    alert('테이블 점유 요청 실패');
  }
}

// 테이블 해제 기능
async function releaseTable(tableNumber) {
  try {
    console.log(`🔓 [POS] 테이블 ${tableNumber} 해제 요청`);
    
    const response = await fetch('/api/tables/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: currentStore.id,
        tableName: `테이블 ${tableNumber}`,
        isOccupied: false
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(`테이블 ${tableNumber}이 해제되었습니다.`);
      
      // 테이블 상태 업데이트
      await loadTables();
      renderTableMap();
      updateDetailPanel(tableNumber);
    } else {
      alert('오류: ' + data.error);
    }
    
  } catch (error) {
    console.error('❌ [POS] 테이블 해제 실패:', error);
    alert('테이블 해제 요청 실패');
  }
}

// 시간 포맷팅 함수
function formatOrderTime(orderDate) {
  const date = new Date(orderDate);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5);
}

// 주문 상태 텍스트 변환
function getStatusText(status) {
  const statusMap = {
    'pending': '대기중',
    'cooking': '조리중',
    'ready': '완료',
    'completed': '완료',
    'cancelled': '취소됨'
  };
  return statusMap[status] || status;
}

// 주문 추가 기능
function addOrder() {
  if (!currentTable) {
    alert('테이블을 먼저 선택해주세요.');
    return;
  }
  
  showOrderModal();
}

// 주문 모달 표시
function showOrderModal() {
  const modal = document.createElement('div');
  modal.id = 'orderModal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeOrderModal(event)">
      <div class="modal-content order-modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>🍽️ 주문 추가 - 테이블 ${currentTable}</h2>
          <button class="close-btn" onclick="closeOrderModal()">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- 고객 정보 입력 -->
          <div class="customer-section">
            <div class="section-title">👤 고객 정보</div>
            <div class="customer-type-selector">
              <label class="radio-option">
                <input type="radio" name="customerType" value="member" checked onchange="toggleCustomerType()">
                <span>회원</span>
              </label>
              <label class="radio-option">
                <input type="radio" name="customerType" value="guest" onchange="toggleCustomerType()">
                <span>비회원</span>
              </label>
            </div>
            
            <div id="memberInfo" class="customer-info">
              <div class="info-text">POS 회원 주문으로 처리됩니다</div>
            </div>
            
            <div id="guestInfo" class="customer-info" style="display: none;">
              <input type="tel" id="guestPhone" placeholder="전화번호 (예: 010-1234-5678)" class="input-field">
              <input type="text" id="guestName" placeholder="고객 이름 (선택사항)" class="input-field">
            </div>
          </div>

          <!-- 메뉴 선택 -->
          <div class="menu-section">
            <div class="section-title">🍴 메뉴 선택</div>
            <div class="menu-categories">
              <button class="category-btn active" onclick="filterMenuCategory('all')">전체</button>
              <button class="category-btn" onclick="filterMenuCategory('치킨')">치킨</button>
              <button class="category-btn" onclick="filterMenuCategory('사이드')">사이드</button>
              <button class="category-btn" onclick="filterMenuCategory('음료')">음료</button>
            </div>
            
            <div class="menu-grid" id="menuGrid">
              <!-- 메뉴 아이템들이 여기에 표시됩니다 -->
            </div>
          </div>

          <!-- 주문 요약 -->
          <div class="order-summary">
            <div class="section-title">📝 주문 내역</div>
            <div class="order-items" id="orderItems">
              <div class="empty-order">메뉴를 선택해주세요</div>
            </div>
            <div class="order-total">
              <div class="total-line">
                <span>총 금액:</span>
                <span id="totalAmount">₩0</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeOrderModal()">취소</button>
          <button class="btn btn-primary" onclick="submitOrder()" id="submitOrderBtn" disabled>
            주문 추가
          </button>
        </div>
      </div>
    </div>

    <style>
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
      }

      .order-modal {
        width: 90%;
        max-width: 800px;
        height: 90%;
        max-height: 600px;
        background: white;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease;
      }

      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #64748b;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-body {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        gap: 20px;
      }

      .customer-section {
        width: 250px;
        flex-shrink: 0;
      }

      .menu-section {
        flex: 1;
        min-width: 0;
      }

      .order-summary {
        width: 200px;
        flex-shrink: 0;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f1f5f9;
      }

      .customer-type-selector {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }

      .radio-option {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 14px;
      }

      .customer-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .info-text {
        font-size: 13px;
        color: #64748b;
        padding: 12px;
        background: #f8fafc;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }

      .input-field {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
      }

      .input-field:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .menu-categories {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .category-btn {
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .category-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        max-height: 300px;
        overflow-y: auto;
      }

      .menu-item-card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
      }

      .menu-item-card:hover {
        border-color: #3b82f6;
        background: #f8fafc;
      }

      .menu-item-name {
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 4px;
        color: #374151;
      }

      .menu-item-price {
        font-size: 12px;
        color: #059669;
        font-weight: 600;
      }

      .order-items {
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 16px;
      }

      .empty-order {
        text-align: center;
        color: #9ca3af;
        font-size: 13px;
        padding: 20px;
      }

      .order-item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 13px;
      }

      .order-item-row:last-child {
        border-bottom: none;
      }

      .item-name {
        flex: 1;
        color: #374151;
      }

      .item-controls {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .qty-btn {
        width: 20px;
        height: 20px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .qty-btn:hover {
        background: #f3f4f6;
      }

      .qty-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .item-quantity {
        min-width: 20px;
        text-align: center;
        font-weight: 500;
      }

      .item-price {
        min-width: 60px;
        text-align: right;
        color: #059669;
        font-weight: 500;
      }

      .order-total {
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        color: #1e293b;
      }

      .modal-footer {
        padding: 20px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary {
        background: #f1f5f9;
        color: #64748b;
      }

      .btn-secondary:hover {
        background: #e2e8f0;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .btn-primary:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;

  document.body.appendChild(modal);
  loadMenuItems();
}

// 고객 유형 전환
function toggleCustomerType() {
  const customerType = document.querySelector('input[name="customerType"]:checked').value;
  const memberInfo = document.getElementById('memberInfo');
  const guestInfo = document.getElementById('guestInfo');
  
  if (customerType === 'member') {
    memberInfo.style.display = 'block';
    guestInfo.style.display = 'none';
  } else {
    memberInfo.style.display = 'none';
    guestInfo.style.display = 'block';
  }
  
  updateSubmitButton();
}

// 메뉴 아이템 로드
function loadMenuItems() {
  const menuGrid = document.getElementById('menuGrid');
  
  if (!allMenus || allMenus.length === 0) {
    menuGrid.innerHTML = '<div class="empty-order">메뉴 데이터가 없습니다</div>';
    return;
  }
  
  const menuHTML = allMenus.map(menu => `
    <div class="menu-item-card" onclick="addMenuItem('${menu.name}', ${menu.price})" data-category="${menu.category || '기타'}">
      <div class="menu-item-name">${menu.name}</div>
      <div class="menu-item-price">₩${menu.price.toLocaleString()}</div>
    </div>
  `).join('');
  
  menuGrid.innerHTML = menuHTML;
}

// 메뉴 카테고리 필터
function filterMenuCategory(category) {
  // 버튼 활성화 상태 변경
  document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // 메뉴 아이템 필터링
  const menuCards = document.querySelectorAll('.menu-item-card');
  menuCards.forEach(card => {
    const cardCategory = card.dataset.category;
    if (category === 'all' || cardCategory === category) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// 현재 주문 상태
let currentOrderItems = [];

// 메뉴 아이템 추가
function addMenuItem(name, price) {
  const existingItem = currentOrderItems.find(item => item.name === name);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    currentOrderItems.push({
      name: name,
      price: price,
      quantity: 1
    });
  }
  
  updateOrderDisplay();
  updateSubmitButton();
}

// 주문 디스플레이 업데이트
function updateOrderDisplay() {
  const orderItemsContainer = document.getElementById('orderItems');
  const totalAmountElement = document.getElementById('totalAmount');
  
  if (currentOrderItems.length === 0) {
    orderItemsContainer.innerHTML = '<div class="empty-order">메뉴를 선택해주세요</div>';
    totalAmountElement.textContent = '₩0';
    return;
  }
  
  const itemsHTML = currentOrderItems.map((item, index) => `
    <div class="order-item-row">
      <div class="item-name">${item.name}</div>
      <div class="item-controls">
        <button class="qty-btn" onclick="changeQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
        <span class="item-quantity">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
      </div>
      <div class="item-price">₩${(item.price * item.quantity).toLocaleString()}</div>
    </div>
  `).join('');
  
  orderItemsContainer.innerHTML = itemsHTML;
  
  const totalAmount = currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  totalAmountElement.textContent = `₩${totalAmount.toLocaleString()}`;
}

// 수량 변경
function changeQuantity(index, change) {
  const item = currentOrderItems[index];
  item.quantity += change;
  
  if (item.quantity <= 0) {
    currentOrderItems.splice(index, 1);
  }
  
  updateOrderDisplay();
  updateSubmitButton();
}

// 제출 버튼 상태 업데이트
function updateSubmitButton() {
  const submitBtn = document.getElementById('submitOrderBtn');
  const customerType = document.querySelector('input[name="customerType"]:checked').value;
  const hasItems = currentOrderItems.length > 0;
  
  let isValid = hasItems;
  
  if (customerType === 'guest') {
    const guestPhone = document.getElementById('guestPhone').value.trim();
    isValid = hasItems && guestPhone.length > 0;
  }
  
  submitBtn.disabled = !isValid;
}

// 주문 제출
async function submitOrder() {
  try {
    const customerType = document.querySelector('input[name="customerType"]:checked').value;
    const totalAmount = currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
      storeId: currentStore.id,
      storeName: currentStore.name,
      tableNumber: currentTable,
      items: currentOrderItems,
      totalAmount: totalAmount,
      isGuestOrder: customerType === 'guest'
    };
    
    if (customerType === 'guest') {
      orderData.guestPhone = document.getElementById('guestPhone').value.trim();
      orderData.guestName = document.getElementById('guestName').value.trim();
    }
    
    console.log('💳 POS 주문 제출:', orderData);
    
    const response = await fetch('/api/pos/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`주문이 성공적으로 추가되었습니다!\n주문번호: ${result.orderId}`);
      closeOrderModal();
      
      // 테이블 세부 정보 새로고침
      if (currentTable) {
        updateDetailPanel(currentTable);
      }
    } else {
      alert('주문 처리 실패: ' + result.error);
    }
    
  } catch (error) {
    console.error('❌ POS 주문 제출 실패:', error);
    alert('주문 처리 중 오류가 발생했습니다.');
  }
}

// 주문 모달 닫기
function closeOrderModal(event) {
  if (event && event.target !== event.currentTarget) return;
  
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.remove();
  }
  
  // 주문 상태 초기화
  currentOrderItems = [];
}

// 액션 함수들 (스텁)
function createNewOrder() {
  alert('새 포장 주문 기능 - 개발 예정');
}

function showPickupQueue() {
  alert('픽업 대기함 기능 - 개발 예정');
}

function showUnassignedOrders() {
  alert('미지정 주문함 기능 - 개발 예정');
}

function openQuickMenu() {
  alert('빠른 메뉴 기능 - 개발 예정');
}

function viewOrders() {
  alert('주문 내역 기능 - 개발 예정');
}

function moveTable() {
  alert('테이블 이동 기능 - 개발 예정');
}

function processPayment() {
  alert('결제 처리 기능 - 개발 예정');
}

// WebSocket 초기화
function initWebSocket(storeId) {
  try {
    console.log(`🔌 POS WebSocket 연결 시작... (매장 ID: ${storeId})`);

    // Socket.IO 클라이언트 연결
    posSocket = io({
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // 연결 성공
    posSocket.on('connect', () => {
      console.log('✅ POS WebSocket 연결 성공:', posSocket.id);
      isWebSocketConnected = true;

      // POS 룸 참여
      posSocket.emit('join-pos-room', parseInt(storeId));
      console.log(`📟 매장 ${storeId} POS 룸 참여 요청 전송`);

      // 연결 상태 표시 업데이트
      updateConnectionStatus(true);
      showNotification('🔌 실시간 연결 활성화');
    });

    // 연결 해제
    posSocket.on('disconnect', (reason) => {
      console.log('❌ POS WebSocket 연결 해제:', reason);
      isWebSocketConnected = false;
      updateConnectionStatus(false);
      showNotification('⚠️ 실시간 연결 해제됨', 'warning');
    });

    // 재연결 시도
    posSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 POS WebSocket 재연결 성공:', attemptNumber);
      posSocket.emit('join-pos-room', parseInt(storeId));
      isWebSocketConnected = true;
      updateConnectionStatus(true);
      showNotification('🔄 실시간 연결 복구');
    });

    // POS 실시간 업데이트 수신
    posSocket.on('pos-update', (data) => {
      console.log('📡 POS 실시간 업데이트 수신:', data);
      handlePOSRealTimeUpdate(data);
    });

    // 새 주문 알림 수신
    posSocket.on('new-order', (data) => {
      console.log('🆕 새 주문 실시간 알림 수신:', data);
      handleNewOrderNotification(data);
    });

    // 테이블 상태 변경 알림
    posSocket.on('table-update', (data) => {
      console.log('🪑 테이블 상태 실시간 업데이트:', data);
      handleTableStatusUpdate(data);
    });

  } catch (error) {
    console.error('❌ POS WebSocket 초기화 실패:', error);
    updateConnectionStatus(false);
  }
}

// 연결 상태 업데이트
function updateConnectionStatus(isConnected) {
  const syncTime = document.getElementById('syncTime');
  const syncIndicator = document.getElementById('syncIndicator');
  
  if (syncTime && syncIndicator) {
    if (isConnected) {
      syncTime.textContent = '실시간 연결됨';
      syncIndicator.className = 'sync-indicator active';
    } else {
      syncTime.textContent = '연결 끊김';
      syncIndicator.className = 'sync-indicator inactive';
    }
  }
}

// POS 실시간 업데이트 처리
function handlePOSRealTimeUpdate(data) {
  const { type, storeId, timestamp, updateData } = data;
  
  console.log(`📡 POS 실시간 업데이트 처리: ${type}`);
  
  switch (type) {
    case 'order-update':
      refreshCurrentTableOrders();
      updateOrderCounts();
      break;
    case 'table-update':
      refreshTableMap();
      break;
    case 'menu-update':
      loadStoreDetails(storeId);
      break;
    default:
      console.log('🔄 알 수 없는 업데이트 타입:', type);
  }
}

// 새 주문 알림 처리
function handleNewOrderNotification(data) {
  const { orderId, storeName, tableNumber, customerName, itemCount, totalAmount } = data;
  
  showNotification(
    `🆕 새 주문 접수!\n테이블 ${tableNumber} | ${itemCount}개 메뉴 | ₩${totalAmount.toLocaleString()}`, 
    'success'
  );
  
  // 현재 보고 있는 테이블이면 즉시 새로고침
  if (currentTable && currentTable == tableNumber) {
    setTimeout(() => updateDetailPanel(currentTable), 1000);
  }
  
  // 테이블 맵 새로고침
  refreshTableMap();
}

// 테이블 상태 업데이트 처리
function handleTableStatusUpdate(data) {
  const { tableNumber, isOccupied, source } = data;
  
  console.log(`🪑 테이블 ${tableNumber} 상태 변경: ${isOccupied ? '점유' : '해제'} (${source})`);
  
  // 테이블 맵 새로고침
  refreshTableMap();
  
  // 현재 보고 있는 테이블이면 세부 정보 새로고침
  if (currentTable && currentTable == tableNumber) {
    updateDetailPanel(currentTable);
  }
  
  showNotification(
    `🪑 테이블 ${tableNumber} ${isOccupied ? '점유됨' : '해제됨'}`,
    isOccupied ? 'warning' : 'success'
  );
}

// 테이블 맵 새로고침
async function refreshTableMap() {
  try {
    await loadTables();
    if (homeMode === 'table_map') {
      renderTableMap();
    }
  } catch (error) {
    console.error('❌ 테이블 맵 새로고침 실패:', error);
  }
}

// 현재 테이블 주문 새로고침
async function refreshCurrentTableOrders() {
  if (currentTable) {
    await updateDetailPanel(currentTable);
  }
}

// 주문 카운트 업데이트 (스텁 함수 - 필요시 구현)
function updateOrderCounts() {
  // 주문 리스트 모드에서 카운트 업데이트 로직
  console.log('📊 주문 카운트 업데이트');
}

// 알림 표시 함수
function showNotification(message, type = 'info') {
  // 기존 알림 제거
  const existingNotification = document.querySelector('.pos-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `pos-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // 5초 후 자동 제거
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// 전역 함수들을 window 객체에 등록
window.renderPOS = renderPOS;
window.selectStore = selectStore;
window.chooseStore = chooseStore;
window.closeStoreModal = closeStoreModal;
window.switchHomeMode = switchHomeMode;
window.selectTableFromMap = selectTableFromMap;
window.filterOrders = filterOrders;
window.closeDetailPanel = closeDetailPanel;
window.occupyTable = occupyTable;
window.releaseTable = releaseTable;
window.createNewOrder = createNewOrder;
window.showPickupQueue = showPickupQueue;
window.showUnassignedOrders = showUnassignedOrders;
window.openQuickMenu = openQuickMenu;
window.addOrder = addOrder;
window.viewOrders = viewOrders;
window.moveTable = moveTable;
window.processPayment = processPayment;
// 주문 모달 관련 함수들
window.showOrderModal = showOrderModal;
window.closeOrderModal = closeOrderModal;
window.toggleCustomerType = toggleCustomerType;
window.filterMenuCategory = filterMenuCategory;
window.addMenuItem = addMenuItem;
window.changeQuantity = changeQuantity;
window.submitOrder = submitOrder;