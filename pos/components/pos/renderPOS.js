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

// 매장 선택 함수
function selectStore(storeId, storeName) {
  // URL 업데이트
  const newUrl = `/pos/${storeId}`;
  window.history.pushState({ storeId }, '', newUrl);

  // POS 시스템 리로드
  renderPOS();

  console.log(`✅ POS 매장 선택: ${storeName} (ID: ${storeId})`);
}

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
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .pos-container .order-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: #3b82f6;
        border-radius: 0 4px 4px 0;
      }

      .pos-container .order-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: #3b82f6;
      }

      .pos-container .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .pos-container .order-info {
        flex: 1;
        min-width: 0;
      }

      .pos-container .customer-name {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .pos-container .order-time {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .pos-container .order-amount {
        font-size: 18px;
        font-weight: 800;
        color: #059669;
        background: #ecfdf5;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #bbf7d0;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .order-amount.pending {
        color: #d97706;
        background: #fef3c7;
        border-color: #fed7aa;
      }

      .order-amount.completed {
        color: #059669;
        background: #ecfdf5;
        border-color: #bbf7d0;
      }

      .pos-container .order-details {
        background: #f8fafc;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #e2e8f0;
      }

      .pos-container .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 14px;
        border-bottom: 1px solid #f1f5f9;
        gap: 12px;
      }

      .pos-container .menu-item:last-child {
        border-bottom: none;
      }

      .pos-container .menu-name {
        flex: 1;
        color: #374151;
        font-weight: 600;
        min-width: 0;
        word-break: break-word;
      }

      .pos-container .menu-quantity {
        color: #6b7280;
        background: #e2e8f0;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        min-width: 32px;
        text-align: center;
        flex-shrink: 0;
      }

      .pos-container .menu-price {
        color: #059669;
        font-weight: 700;
        font-size: 14px;
        min-width: 80px;
        text-align: right;
        flex-shrink: 0;
      }

      .pos-container .order-status {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
      }

      .pos-container .status-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        border: 2px solid transparent;
        transition: all 0.2s ease;
      }

      .pos-container .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
        border-color: #fcd34d;
      }

      .pos-container .status-badge.cooking {
        background: #ede9fe;
        color: #6b21a8;
        border-color: #c4b5fd;
        animation: pulse 2s infinite;
      }

      .pos-container .status-badge.ready,
      .pos-container .status-badge.completed {
        background: #dcfce7;
        color: #166534;
        border-color: #86efac;
      }

      .pos-container .status-badge.cancelled {
        background: #fecaca;
        color: #991b1b;
        border-color: #f87171;
      }

      /* 미결제/완료 주문 섹션 스타일 */
      .pending-orders-section, .completed-orders-section {
        margin-bottom: 20px;
      }

      .pending-orders-section h4 {
        color: #d97706;
        background: #fef3c7;
        padding: 8px 12px;
        border-radius: 6px;
        margin-bottom: 12px;
        border: 1px solid #fed7aa;
      }

      .completed-orders-section h4 {
        color: #059669;
        background: #ecfdf5;
        padding: 8px 12px;
        border-radius: 6px;
        margin-bottom: 12px;
        border: 1px solid #bbf7d0;
      }

      .pending-order-card {
        border: 2px solid #fbbf24;
        background: #fffbeb;
        border-radius: 12px;
        padding: 4px;
      }

      .pending-order::before {
        background: #fbbf24 !important;
      }

      .completed-order::before {
        background: #10b981 !important;
      }

      /* 배지 스타일 */
      .tll-badge, .pos-badge, .source-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: 8px;
      }

      .tll-badge {
        background: #3b82f6;
        color: white;
      }

      .pos-badge {
        background: #10b981;
        color: white;
      }

      .source-badge.tll {
        background: #3b82f6;
        color: white;
      }

      .source-badge.pos {
        background: #10b981;
        color: white;
      }

      .payment-badge {
        font-size: 10px;
        background: #f3f4f6;
        color: #374151;
        padding: 2px 6px;
        border-radius: 12px;
        margin-left: 8px;
      }

      .btn-small {
        padding: 4px 8px;
        font-size: 12px;
        border-radius: 4px;
      }

      .btn-warning {
        background: #f59e0b;
        color: white;
        border: 1px solid #d97706;
      }

      .btn-warning:hover {
        background: #d97706;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .pos-container .no-orders, 
      .pos-container .no-items {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 32px 24px;
        background: #f8fafc;
        border-radius: 12px;
        border: 2px dashed #cbd5e1;
        margin: 16px 0;
      }

      .pos-container .loading-message, 
      .pos-container .error-message {
        text-align: center;
        color: #64748b;
        padding: 40px 24px;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        font-size: 14px;
      }

      .pos-container .error-message {
        color: #dc2626;
        background: #fef2f2;
        border-color: #fecaca;
      }

      /* 반응형 레이아웃 */
      @media (max-width: 768px) {
        .pos-container .order-item {
          padding: 16px;
          margin-bottom: 12px;
        }

        .pos-container .order-header {
          flex-direction: column;
          gap: 12px;
          align-items: stretch;
        }

        .pos-container .order-amount {
          font-size: 16px;
          text-align: center;
          align-self: stretch;
        }

        .pos-container .menu-item {
          font-size: 13px;
          padding: 6px 0;
        }

        .pos-container .menu-price {
          min-width: 60px;
        }
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

      /* 스크롤 가능한 섹션들 */
      .scrollable-section {
        max-height: 300px;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .table-actions {
        margin-bottom: 16px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      /* 스크롤바 스타일링 */
      .panel-content::-webkit-scrollbar,
      .order-items::-webkit-scrollbar,
      .scrollable-section::-webkit-scrollbar {
        width: 6px;
      }

      .panel-content::-webkit-scrollbar-track,
      .order-items::-webkit-scrollbar-track,
      .scrollable-section::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }

      .panel-content::-webkit-scrollbar-thumb,
      .order-items::-webkit-scrollbar-thumb,
      .scrollable-section::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      .panel-content::-webkit-scrollbar-thumb:hover,
      .order-items::-webkit-scrollbar-thumb:hover,
      .scrollable-section::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      /* Firefox 스크롤바 스타일 */
      .panel-content,
      .order-items,
      .scrollable-section {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
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

    // 통합 주문 조회 (메모리 + DB)
    const allOrdersResponse = await fetch(`/api/pos/stores/${currentStore.id}/table/${tableNumber}/all-orders`);
    const allOrdersData = await allOrdersResponse.json();

    let pendingOrder = null;
    let completedOrders = [];

    if (allOrdersData.success) {
      pendingOrder = allOrdersData.pendingOrder;
      completedOrders = allOrdersData.completedOrders || [];
      console.log(`📊 테이블 ${tableNumber} 주문 조회: 미결제 ${pendingOrder ? 1 : 0}개, 완료 ${completedOrders.length}개`);
    }

    panelContent.innerHTML = `
      <div class="table-status-section">
        <div class="table-status-header">
          <h4>테이블 상태</h4>
          <div class="status-indicator ${isOccupied || pendingOrder ? 'occupied' : 'available'}">
            ${isOccupied || pendingOrder ? '🔴 사용중' : '🟢 이용가능'}
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
        <button class="action-btn warning" onclick="processPayment()" ${!pendingOrder && completedOrders.length === 0 ? 'disabled' : ''}>결제 처리</button>
      </div>

      <!-- 미결제 주문 (메모리에 저장된 주문) -->
      ${pendingOrder ? `
        <div class="pending-orders-section">
          <h4>🔄 미결제 주문 (결제 대기중)</h4>
          <div class="pending-order-card">
            <div class="order-item pending-order">
              <div class="order-header">
                <div class="order-info">
                  <span class="customer-name">👤 ${pendingOrder.customerName || '포스 주문'}</span>
                  <span class="order-time">${formatOrderTime(pendingOrder.createdAt)}</span>
                  ${pendingOrder.isTLLOrder ? '<span class="tll-badge">TLL 연동</span>' : '<span class="pos-badge">POS</span>'}
                </div>
                <div class="order-amount pending">₩${pendingOrder.totalAmount.toLocaleString()}</div>
              </div>

              <div class="order-details">
                ${pendingOrder.items.map(item => `
                  <div class="menu-item">
                    <span class="menu-name">${item.name}</span>
                    <span class="menu-quantity">x${item.quantity || 1}</span>
                    <span class="menu-price">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                  </div>
                `).join('')}
              </div>

              <div class="order-status">
                <span class="status-badge pending">결제 대기</span>
                <button class="btn btn-small btn-warning" onclick="processPayment()">결제하기</button>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- 완료된 주문 (DB에 저장된 주문) -->
      <div class="completed-orders-section">
        <h4>${completedOrders.length > 0 ? `✅ 완료된 주문 (${completedOrders.length}개)` : '주문 없음'}</h4>
        <div class="order-items scrollable-section">
          ${completedOrders.length > 0 ? 
            completedOrders.map(order => `
              <div class="order-item completed-order">
                <div class="order-header">
                  <div class="order-info">
                    <span class="customer-name">👤 ${order.customerName}</span>
                    <span class="order-time">${formatOrderTime(order.orderDate)}</span>
                    <span class="source-badge ${order.orderSource?.toLowerCase() || 'pos'}">${getOrderSourceText(order.orderSource || 'POS')}</span>
                  </div>
                  <div class="order-amount completed">₩${order.finalAmount.toLocaleString()}</div>
                </div>

                <div class="order-details">
                  ${order.orderData && order.orderData.items ? 
                    order.orderData.items.map(item => `
                      <div class="menu-item">
                        <span class="menu-name">${item.name}</span>
                        <span class="menu-quantity">x${item.quantity || 1}</span>
                        <span class="menu-price">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                      </div>
                    `).join('') : 
                    '<div class="no-items">주문 상세 정보 없음</div>'
                  }
                </div>

                <div class="order-status">
                  <span class="status-badge completed">결제 완료</span>
                  <span class="payment-badge">💳 ${order.paymentStatus === 'completed' ? '결제됨' : '미결제'}</span>
                </div>
              </div>
            `).join('') :
            (!pendingOrder ? `<div class="no-orders">테이블이 비어있습니다</div>` : '')
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

  // 해당 테이블의 TLL 주문 확인
  checkTableTLLOrder(currentTable);
}

// 테이블의 TLL 주문 확인
async function checkTableTLLOrder(tableNumber) {
  try {
    const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${tableNumber}/orders`);
    const data = await response.json();

    if (data.success && data.tllOrder) {
      // TLL 주문이 있는 경우 - 해당 사용자로 자동 주문
      showOrderModal(data.tllOrder);
    } else {
      // TLL 주문이 없는 경우 - 일반 POS 주문
      showOrderModal();
    }
  } catch (error) {
    console.error('❌ TLL 주문 확인 실패:', error);
    // 에러 시 일반 POS 주문으로 처리
    showOrderModal();
  }
}

// 주문 모달 표시
function showOrderModal(tllOrderInfo = null) {
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
          <!-- 고객 정보 입력 (간소화) -->
          <div class="customer-section">
            <div class="section-title">👤 주문 정보</div>

            ${tllOrderInfo ? `
              <!-- TLL 주문 정보 표시 -->
              <div class="tll-order-info ${tllOrderInfo.isGuest ? 'guest-order' : 'member-order'}">
                <div class="tll-badge ${tllOrderInfo.isGuest ? 'guest' : 'member'}">
                  ${tllOrderInfo.isGuest ? '👤 TLL 비회원 주문' : '🔗 TLL 회원 주문'}
                </div>
                <div class="tll-customer-info">
                  <div class="customer-detail">
                    <span class="label">고객명:</span>
                    <span class="value">${tllOrderInfo.customerName}</span>
                  </div>
                  <div class="customer-detail">
                    <span class="label">주문방식:</span>
                    <span class="value">${tllOrderInfo.isGuest ? 'TLL 비회원' : 'TLL 회원'}</span>
                  </div>
                  ${tllOrderInfo.phone ? `
                    <div class="customer-detail">
                      <span class="label">연락처:</span>
                      <span class="value">${tllOrderInfo.phone}</span>
                    </div>
                  ` : ''}
                </div>
                <div class="tll-note">
                  기존 TLL 주문에 메뉴를 추가합니다. 결제 시 고객 정보가 적용됩니다.
                </div>
              </div>
            ` : `
              <!-- 일반 POS 주문 - 간소화된 구조 -->
              <div class="pos-order-info">
                <div class="pos-badge">🏪 POS 주문</div>
                <div class="pos-note">
                  메뉴를 선택하여 주문을 생성하세요. 고객 유형은 결제 단계에서 선택할 수 있습니다.
                </div>
              </div>
            `}
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

      .tll-order-info {
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
      }

      .tll-order-info.member-order {
        background: #eff6ff;
        border: 2px solid #3b82f6;
      }

      .tll-order-info.guest-order {
        background: #fef3c7;
        border: 2px solid #f59e0b;
      }

      .tll-badge {
        color: white;
        padding: 6px 16px;
        border-radius: 25px;
        font-size: 13px;
        font-weight: 700;
        display: inline-block;
        margin-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .tll-badge.member {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      }

      .tll-badge.guest {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      .pos-order-info {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
      }

      .pos-badge {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 6px 16px;
        border-radius: 25px;
        font-size: 13px;
        font-weight: 700;
        display: inline-block;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .order-type-selector {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }

      .order-type-option {
        display: flex;
        align-items: center;
        padding: 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: white;
      }

      .order-type-option:hover {
        border-color: #94a3b8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .order-type-option.selected {
        border-color: #10b981;
        background: #f0fdf4;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
      }

      .option-icon {
        font-size: 28px;
        margin-right: 16px;
        flex-shrink: 0;
      }

      .option-content {
        flex: 1;
        min-width: 0;
      }

      .option-title {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 4px;
      }

      .option-desc {
        font-size: 13px;
        color: #64748b;
        line-height: 1.4;
      }

      .option-radio {
        margin-left: 12px;
        flex-shrink: 0;
      }

      .option-radio input[type="radio"] {
        width: 20px;
        height: 20px;
        accent-color: #10b981;
      }

      .pos-guest-form {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;
        animation: fadeIn 0.3s ease;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group:last-child {
        margin-bottom: 0;
      }

      .form-label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 6px;
      }

      .input-hint {
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
        line-height: 1.4;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .tll-customer-info {
        margin-bottom: 12px;
      }

      .customer-detail {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 14px;
      }

      .customer-detail .label {
        color: #64748b;
        font-weight: 500;
      }

      .customer-detail .value {
        color: #1e293b;
        font-weight: 600;
      }

      .tll-note {
        font-size: 12px;
        color: #3b82f6;
        font-style: italic;
        background: rgba(59, 130, 246, 0.1);
        padding: 8px;
        border-radius: 4px;
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

  // TLL 주문 정보를 전역 변수에 저장
  window.currentTLLOrder = tllOrderInfo;

  loadMenuItems();
}

// 고객 유형 선택 (결제 모달용)
function selectCustomerType(type) {
  // 모든 옵션에서 selected 클래스 제거
  document.querySelectorAll('.customer-type-option').forEach(option => {
    option.classList.remove('selected');
    option.style.borderColor = '#e2e8f0';
    option.style.background = 'white';
  });

  // 선택된 옵션에 selected 클래스 추가
  const selectedOption = document.querySelector(`[data-type="${type}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
    if (type === 'member') {
      selectedOption.style.borderColor = '#3b82f6';
      selectedOption.style.background = '#eff6ff';
    } else {
      selectedOption.style.borderColor = '#f59e0b';
      selectedOption.style.background = '#fef3c7';
    }
  }

  // 라디오 버튼 업데이트
  const radioBtn = document.querySelector(`input[name="customerType"][value="${type}"]`);
  if (radioBtn) {
    radioBtn.checked = true;
  }

  // 비회원 정보 입력 폼 표시/숨김
  const guestSection = document.getElementById('guestInfoSection');
  if (guestSection) {
    if (type === 'guest') {
      guestSection.style.display = 'block';
    } else {
      guestSection.style.display = 'none';
    }
  }

  updateSubmitButton();
}

// POS 주문 타입 선택 (레거시 지원)
function selectOrderType(type) {
  // 모든 옵션에서 selected 클래스 제거
  document.querySelectorAll('.order-type-option').forEach(option => {
    option.classList.remove('selected');
  });

  // 선택된 옵션에 selected 클래스 추가
  const selectedOption = document.querySelector(`[data-type="${type}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
  }

  // 라디오 버튼 업데이트
  const radioBtn = document.querySelector(`input[name="posOrderType"][value="${type}"]`);
  if (radioBtn) {
    radioBtn.checked = true;
  }

  // 비회원 폼 표시/숨김
  const guestForm = document.getElementById('posGuestInfo');
  if (guestForm) {
    if (type === 'pos_guest') {
      guestForm.style.display = 'block';
    } else {
      guestForm.style.display = 'none';
    }
  }

  updateSubmitButton();
}

// 고객 유형 전환 (레거시 지원)
function toggleCustomerType() {
  const customerType = document.querySelector('input[name="customerType"]:checked')?.value;
  const memberInfo = document.getElementById('memberInfo');
  const guestInfo = document.getElementById('guestInfo');

  if (memberInfo && guestInfo) {
    if (customerType === 'member') {
      memberInfo.style.display = 'block';
      guestForm.style.display = 'none'; // guestInfo 대신 guestForm 사용
    } else {
      memberInfo.style.display = 'none';
      guestForm.style.display = 'block'; // guestInfo 대신 guestForm 사용
    }
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
  const hasItems = currentOrderItems.length > 0;

  // TLL 주문인 경우 고객 정보 입력 불필요
  if (window.currentTLLOrder) {
    submitBtn.disabled = !hasItems;
    if (hasItems) {
      submitBtn.textContent = '주문 추가';
    }
    return;
  }

  // 일반 POS 주문인 경우
  const posOrderType = document.querySelector('input[name="posOrderType"]:checked')?.value;

  if (posOrderType) {
    // 새로운 POS 주문 구조
    submitBtn.disabled = !hasItems;
    if (hasItems) {
      submitBtn.textContent = posOrderType === 'pos_member' ? '회원 주문 추가' : '비회원 주문 추가';
    }
    return;
  }

  // 레거시 구조 지원
  const customerTypeElements = document.querySelectorAll('input[name="customerType"]');
  if (customerTypeElements.length === 0) {
    submitBtn.disabled = !hasItems;
    return;
  }

  const customerType = document.querySelector('input[name="customerType"]:checked')?.value;
  submitBtn.disabled = !hasItems;
}

// 주문 제출
async function submitOrder() {
  try {
    const totalAmount = currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // TLL 주문 정보 확인
    const tllOrderInfo = window.currentTLLOrder;

    const orderData = {
      storeId: currentStore.id,
      storeName: currentStore.name,
      tableNumber: currentTable,
      items: currentOrderItems,
      totalAmount: totalAmount,
      isTLLOrder: !!tllOrderInfo
    };

    if (tllOrderInfo) {
      // TLL 주문인 경우 - 기존 고객 정보 사용
      orderData.userId = tllOrderInfo.userId;
      orderData.guestPhone = tllOrderInfo.guestPhone;
      orderData.customerName = tllOrderInfo.customerName;
    }

    console.log('📦 POS 주문 제출 (메모리 저장):', orderData);

    const response = await fetch('/api/pos/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (result.success) {
      alert(`주문이 성공적으로 추가되었습니다!\n메뉴 ${result.orderData.itemCount}개 | 총 ₩${result.orderData.totalAmount.toLocaleString()}\n\n결제를 진행해주세요.`);
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
  window.currentTLLOrder = null;
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

// 결제 처리 기능
async function processPayment() {
  if (!currentTable) {
    alert('테이블을 먼저 선택해주세요.');
    return;
  }

  try {
    // 현재 테이블의 메모리 주문 확인
    const pendingResponse = await fetch(`/api/pos/stores/${currentStore.id}/table/${currentTable}/pending-orders`);
    const pendingData = await pendingResponse.json();

    if (pendingData.success && pendingData.hasPendingOrder) {
      // 메모리 주문이 있는 경우 - 바로 결제 처리
      console.log('📦 메모리 주문 결제 처리:', pendingData.orderData);
      showPaymentModalForPendingOrder(pendingData.orderData);
      return;
    }

    // 메모리 주문이 없으면 기존 DB 주문 확인
    const ordersResponse = await fetch(`/api/orders/stores/${currentStore.id}?limit=10`);
    const ordersData = await ordersResponse.json();

    if (!ordersData.success) {
      throw new Error('주문 조회 실패');
    }

    // 현재 테이블의 미결제 주문만 필터링
    const unpaidOrders = ordersData.orders.filter(order => 
      order.tableNumber == currentTable && 
      (order.orderStatus === 'completed' || order.orderStatus === 'pending') &&
      (!order.paymentStatus || order.paymentStatus !== 'completed')
    );

    if (unpaidOrders.length === 0) {
      alert(`테이블 ${currentTable}에 결제할 주문이 없습니다.`);
      return;
    }

    // 기존 DB 주문 결제 모달 표시
    showPaymentModal(unpaidOrders);

  } catch (error) {
    console.error('❌ 결제 처리 준비 실패:', error);
    alert('결제 처리 준비에 실패했습니다.');
  }
}

// 메모리 주문용 결제 모달 표시
function showPaymentModalForPendingOrder(orderData) {
  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closePaymentModal(event)" style="
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
    ">
      <div class="payment-modal-content" onclick="event.stopPropagation()" style="
        width: 90%;
        max-width: 500px;
        background: white;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease;
        overflow: hidden;
      ">
        <div class="modal-header" style="
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        ">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">💳 추가 주문 결제 - 테이블 ${currentTable}</h2>
          <button class="close-btn" onclick="closePaymentModal()" style="
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
          ">✕</button>
        </div>

        <div class="modal-body" style="
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        ">
          <!-- 주문 내역 -->
          <div class="order-summary">
            <div class="section-title" style="
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f1f5f9;
            ">📋 주문 내역</div>

            <div style="
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 16px;
            ">
              <div style="margin-bottom: 12px;">
                <strong style="color: #1e293b;">테이블 ${orderData.tableNumber}</strong>
                ${orderData.isTLLOrder ? `<span style="
                  font-size: 12px;
                  background: #3b82f6;
                  color: white;
                  padding: 2px 6px;
                  border-radius: 4px;
                  margin-left: 8px;
                ">TLL 연동</span>` : ''}
              </div>

              ${orderData.items.map(item => `
                <div style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 4px 0;
                  font-size: 14px;
                ">
                  <span style="color: #374151; font-weight: 600;">${item.name}</span>
                  <span style="
                    color: #6b7280;
                    background: #e2e8f0;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 700;
                    margin: 0 8px;
                  ">x${item.quantity || 1}</span>
                  <span style="color: #059669; font-weight: 700;">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                </div>
              `).join('')}

              <div style="
                border-top: 1px solid #e2e8f0;
                margin-top: 12px;
                padding-top: 12px;
                display: flex;
                justify-content: space-between;
                font-weight: 700;
                font-size: 16px;
                color: #1e293b;
              ">
                <span>총 금액:</span>
                <span style="color: #059669;">₩${orderData.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- 결제 방법 선택 -->
          <div class="payment-method-selection">
            <div class="section-title" style="
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f1f5f9;
            ">💳 결제 방법</div>

            <div style="
              display: flex;
              gap: 16px;
              margin-bottom: 16px;
              flex-wrap: wrap;
            ">
              <label style="
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              ">
                <input type="radio" name="paymentMethod" value="CARD" checked style="accent-color: #3b82f6;">
                <span>💳 카드</span>
              </label>
              <label style="
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              ">
                <input type="radio" name="paymentMethod" value="CASH" style="accent-color: #3b82f6;">
                <span>💵 현금</span>
              </label>
              <label style="
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              ">
                <input type="radio" name="paymentMethod" value="POS" style="accent-color: #3b82f6;">
                <span>📟 POS</span>
              </label>
            </div>
          </div>

          <!-- 고객 유형 선택 -->
          <div class="customer-type-section">
            <div class="section-title" style="
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f1f5f9;
            ">👤 고객 유형 선택</div>

            <div class="customer-type-options" style="
              display: flex;
              flex-direction: column;
              gap: 12px;
              margin-bottom: 16px;
            ">
              <div class="customer-type-option" onclick="selectCustomerType('member')" data-type="member" style="
                display: flex;
                align-items: center;
                padding: 12px;
                border: 2px solid #3b82f6;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #eff6ff;
              ">
                <div class="option-icon" style="font-size: 20px; margin-right: 12px;">👨‍💼</div>
                <div class="option-content" style="flex: 1;">
                  <div class="option-title" style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">회원 고객</div>
                  <div class="option-desc" style="font-size: 12px; color: #64748b;">POS 시스템 회원으로 처리</div>
                </div>
                <div class="option-radio" style="margin-left: 8px;">
                  <input type="radio" name="customerType" value="member" checked style="width: 18px; height: 18px; accent-color: #3b82f6;">
                </div>
              </div>

              <div class="customer-type-option" onclick="selectCustomerType('guest')" data-type="guest" style="
                display: flex;
                align-items: center;
                padding: 12px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: white;
              ">
                <div class="option-icon" style="font-size: 20px; margin-right: 12px;">👤</div>
                <div class="option-content" style="flex: 1;">
                  <div class="option-title" style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">비회원 고객</div>
                  <div class="option-desc" style="font-size: 12px; color: #64748b;">전화번호로 게스트 관리 (선택사항)</div>
                </div>
                <div class="option-radio" style="margin-left: 8px;">
                  <input type="radio" name="customerType" value="guest" style="width: 18px; height: 18px; accent-color: #f59e0b;">
                </div>
              </div>
            </div>

            <!-- 비회원 정보 입력 (초기에는 숨김) -->
            <div id="guestInfoSection" style="display: none;">
              <div style="
                background: #fef3c7;
                border: 2px solid #f59e0b;
                border-radius: 8px;
                padding: 12px;
                animation: fadeIn 0.3s ease;
              ">
                <div style="margin-bottom: 8px;">
                  <label style="
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 4px;
                  ">전화번호 (선택사항)</label>
                  <input type="tel" id="paymentGuestPhone" placeholder="010-1234-5678" style="
                    width: 100%;
                    padding: 6px 8px;
                    border: 1px solid #f59e0b;
                    border-radius: 4px;
                    font-size: 13px;
                    outline: none;
                  ">
                </div>
                <div style="margin-bottom: 8px;">
                  <label style="
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 4px;
                  ">고객 이름 (선택사항)</label>
                  <input type="text" id="paymentGuestName" placeholder="고객 이름" style="
                    width: 100%;
                    padding: 6px 8px;
                    border: 1px solid #f59e0b;
                    border-radius: 4px;
                    font-size: 13px;
                    outline: none;
                  ">
                </div>
                <div style="
                  font-size: 11px;
                  color: #92400e;
                  line-height: 1.3;
                ">
                  💡 전화번호를 입력하면 재방문시 고객 정보 확인 가능
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="
          padding: 16px 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          flex-shrink: 0;
        ">
          <button class="btn btn-secondary" onclick="closePaymentModal()" style="
            padding: 10px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            background: white;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">취소</button>
          <button class="btn btn-primary" onclick="processPayment()" id="processPaymentBtn" style="
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            background: #3b82f6;
            color: white;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">결제 처리</button>
        </div>
      </div>
    </div>

    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .customer-type-option.selected {
        border-color: #3b82f6 !important;
        background: #eff6ff !important;
      }

      .customer-type-option[data-type="guest"].selected {
        border-color: #f59e0b !important;
        background: #fef3c7 !important;
      }

      .btn:hover {
        transform: translateY(-1px);
      }

      .btn-secondary:hover {
        background: #f8fafc !important;
        border-color: #cbd5e1 !important;
      }

      .btn-primary:hover {
        background: #2563eb !important;
      }
    </style>
  `;

  document.body.appendChild(modal);
  console.log('💳 메모리 주문 결제 모달 표시 완료');
}


// 결제 모달 표시
function showPaymentModal(orders, pendingOrder = false) {
  // 기존 모달이 있다면 제거
  const existingModal = document.getElementById('paymentModal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.style.cssText = `
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
  `;

  modal.innerHTML = `
    <div class="payment-modal-content" onclick="event.stopPropagation()" style="
      width: 90%;
      max-width: 600px;
      height: 90%;
      max-height: 700px;
      background: white;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
      overflow: hidden;
    ">
      <div class="modal-header" style="
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      ">
        <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">💳 ${pendingOrder ? '추가 주문 결제' : '결제 처리'} - 테이블 ${currentTable}</h2>
        <button class="close-btn" onclick="closePaymentModal()" style="
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
        ">✕</button>
      </div>

      <div class="modal-body" style="
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
      ">
        <div class="payment-orders">
          <div class="section-title" style="
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f1f5f9;
          ">결제할 주문 선택</div>
          <div style="max-height: 400px; overflow-y: auto;">
            ${orders.map((order, index) => `
              <div class="payment-order-item" data-order-id="${order.id}" style="
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                transition: all 0.2s ease;
              ">
                <div class="order-header" style="
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  gap: 16px;
                  margin-bottom: 12px;
                ">
                  <div class="order-info" style="flex: 1; min-width: 0;">
                    <div style="margin-bottom: 4px;">
                      <span class="customer-name" style="font-size: 16px; font-weight: 700; color: #1e293b;">👤 ${order.customerName}</span>
                      <span class="order-source" style="
                        font-size: 12px;
                        background: #e2e8f0;
                        color: #64748b;
                        padding: 2px 6px;
                        border-radius: 4px;
                        margin-left: 8px;
                      ">${getOrderSourceText(order.orderSource || 'POS')}</span>
                    </div>
                    <span class="order-time" style="font-size: 13px; color: #64748b; font-weight: 500;">${formatOrderTime(order.orderDate)}</span>
                  </div>
                  <div class="order-amount" style="
                    font-size: 18px;
                    font-weight: 800;
                    color: #059669;
                    background: #ecfdf5;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid #bbf7d0;
                    white-space: nowrap;
                    flex-shrink: 0;
                  ">₩${order.finalAmount.toLocaleString()}</div>
                </div>

                <div class="order-items" style="
                  background: #f1f5f9;
                  border-radius: 6px;
                  padding: 12px;
                  margin-bottom: 12px;
                ">
                  ${order.orderData && order.orderData.items ? 
                    order.orderData.items.map(item => `
                      <div class="menu-item" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 4px 0;
                        font-size: 14px;
                      ">
                        <span class="menu-name" style="color: #374151; font-weight: 600;">${item.name}</span>
                        <span class="menu-quantity" style="
                          color: #6b7280;
                          background: #e2e8f0;
                          padding: 2px 6px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: 700;
                        ">x${item.quantity || 1}</span>
                      </div>
                    `).join('') : 
                    '<div class="no-items" style="text-align: center; color: #9ca3af; padding: 12px;">주문 상세 정보 없음</div>'
                  }
                </div>

                <div class="order-actions">
                  <label class="payment-checkbox" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                  ">
                    <input type="checkbox" data-order-id="${order.id}" data-amount="${order.finalAmount}" ${orders.length === 1 ? 'checked' : ''} style="
                      width: 18px;
                      height: 18px;
                      accent-color: #3b82f6;
                    ">
                    <span>결제 선택</span>
                  </label>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="payment-summary" style="
          background: #f1f5f9;
          border-radius: 8px;
          padding: 16px;
        ">
          <div class="section-title" style="
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f1f5f9;
          ">결제 정보</div>

          <div class="payment-method-selection" style="
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
            flex-wrap: wrap;
          ">
            <label class="radio-option" style="
              display: flex;
              align-items: center;
              gap: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">
              <input type="radio" name="paymentMethod" value="CARD" checked style="accent-color: #3b82f6;">
              <span>💳 카드</span>
            </label>
            <label class="radio-option" style="
              display: flex;
              align-items: center;
              gap: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">
              <input type="radio" name="paymentMethod" value="CASH" style="accent-color: #3b82f6;">
              <span>💵 현금</span>
            </label>
            <label class="radio-option" style="
              display: flex;
              align-items: center;
              gap: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">
              <input type="radio" name="paymentMethod" value="POS" style="accent-color: #3b82f6;">
              <span>📟 POS 통합</span>
            </label>
          </div>

          <!-- 고객 유형 선택 -->
          <div class="customer-type-section">
            <div class="section-title" style="
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f1f5f9;
            ">👤 고객 유형 선택</div>

            <div class="customer-type-options" style="
              display: flex;
              flex-direction: column;
              gap: 12px;
              margin-bottom: 16px;
            ">
              <div class="customer-type-option" onclick="selectCustomerType('member')" data-type="member" style="
                display: flex;
                align-items: center;
                padding: 16px;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: white;
              ">
                <div class="option-icon" style="font-size: 24px; margin-right: 12px;">👨‍💼</div>
                <div class="option-content" style="flex: 1;">
                  <div class="option-title" style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">회원 고객</div>
                  <div class="option-desc" style="font-size: 13px; color: #64748b;">POS 시스템 회원으로 처리, 포인트 적립</div>
                </div>
                <div class="option-radio" style="margin-left: 12px;">
                  <input type="radio" name="customerType" value="member" checked style="width: 20px; height: 20px; accent-color: #3b82f6;">
                </div>
              </div>

              <div class="customer-type-option" onclick="selectCustomerType('guest')" data-type="guest" style="
                display: flex;
                align-items: center;
                padding: 16px;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: white;
              ">
                <div class="option-icon" style="font-size: 24px; margin-right: 12px;">👤</div>
                <div class="option-content" style="flex: 1;">
                  <div class="option-title" style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">비회원 고객</div>
                  <div class="option-desc" style="font-size: 13px; color: #64748b;">전화번호로 게스트 관리 (선택사항)</div>
                </div>
                <div class="option-radio" style="margin-left: 12px;">
                  <input type="radio" name="customerType" value="guest" style="width: 20px; height: 20px; accent-color: #f59e0b;">
                </div>
              </div>
            </div>

            <!-- 비회원 정보 입력 (초기에는 숨김) -->
            <div id="guestInfoSection" style="display: none;">
              <div style="
                background: #fef3c7;
                border: 2px solid #f59e0b;
                border-radius: 8px;
                padding: 16px;
                animation: fadeIn 0.3s ease;
              ">
                <div style="margin-bottom: 12px;">
                  <label style="
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 6px;
                  ">전화번호 (선택사항)</label>
                  <input type="tel" id="paymentGuestPhone" placeholder="010-1234-5678" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 2px solid #f59e0b;
                    border-radius: 6px;
                    font-size: 14px;
                    outline: none;
                  ">
                </div>
                <div style="margin-bottom: 12px;">
                  <label style="
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 6px;
                  ">고객 이름 (선택사항)</label>
                  <input type="text" id="paymentGuestName" placeholder="고객 이름" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 2px solid #f59e0b;
                    border-radius: 6px;
                    font-size: 14px;
                    outline: none;
                  ">
                </div>
                <div style="
                  font-size: 12px;
                  color: #92400e;
                  line-height: 1.4;
                ">
                  💡 전화번호를 입력하면 다음 방문시 고객 정보와 방문 횟수를 확인할 수 있습니다
                </div>
              </div>
            </div>
          </div>

          <div class="payment-total" style="
            background: #f1f5f9;
            border-radius: 8px;
            padding: 16px;
          ">
            <div class="total-line" style="
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 14px;
              color: #475569;
            ">
              <span>선택된 주문 수:</span>
              <span id="selectedOrderCount">${orders.length === 1 ? '1' : '0'}개</span>
            </div>
            <div class="total-line final" style="
              display: flex;
              justify-content: space-between;
              font-weight: 600;
              font-size: 16px;
              color: #1e293b;
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
              margin-bottom: 0;
            ">
              <span>총 결제 금액:</span>
              <span id="totalPaymentAmount" style="color: #059669; font-weight: 800;">₩${orders.length === 1 ? orders[0].finalAmount.toLocaleString() : '0'}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="
        padding: 20px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        flex-shrink: 0;
      ">
        <button class="btn btn-secondary" onclick="closePaymentModal()" style="
          padding: 10px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">취소</button>
        <button class="btn btn-primary" onclick="processSelectedPayments()" id="processPaymentBtn" style="
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: #3b82f6;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">결제 처리</button>
      </div>
    </div>

    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .payment-order-item.selected {
        border-color: #3b82f6 !important;
        background: #eff6ff !important;
      }

      .btn:hover {
        transform: translateY(-1px);
      }

      .btn-secondary:hover {
        background: #f8fafc !important;
        border-color: #cbd5e1 !important;
      }

      .btn-primary:hover {
        background: #2563eb !important;
      }

      .btn-primary:disabled {
        background: #9ca3af !important;
        cursor: not-allowed !important;
      }
    </style>
  `;

  // 모달 클릭 시 닫기 (오버레이 클릭)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePaymentModal();
    }
  });

  document.body.appendChild(modal);

  // 체크박스 이벤트 리스너 추가
  const checkboxes = modal.querySelectorAll('input[type="checkbox"][data-order-id]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updatePaymentSummary);
  });

  // TLL 비회원 주문이 있는지 확인
  const hasTLLGuestOrder = orders.some(order => 
    (order.orderSource === 'TLL' || !order.userId) && order.customerName && !order.userId
  );

  if (hasTLLGuestOrder) {
    const tllSection = modal.querySelector('#tllGuestPhoneSection');
    if (tllSection) {
      tllSection.style.display = 'block';
    }

    // 전화번호 저장 체크박스 이벤트
    const savePhoneCheckbox = modal.querySelector('#saveGuestPhone');
    const phoneInputGroup = modal.querySelector('#guestPhoneInputGroup');

    if (savePhoneCheckbox && phoneInputGroup) {
      savePhoneCheckbox.addEventListener('change', function() {
        phoneInputGroup.style.display = this.checked ? 'block' : 'none';
      });
    }
  }

  updatePaymentSummary();
  console.log('💳 결제 모달 표시 완료');
}

// 결제 요약 정보 업데이트
function updatePaymentSummary() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
  const selectedCount = checkboxes.length;
  const totalAmount = Array.from(checkboxes).reduce((sum, checkbox) => {
    return sum + parseInt(checkbox.dataset.amount);
  }, 0);

  document.getElementById('selectedOrderCount').textContent = `${selectedCount}개`;
  document.getElementById('totalPaymentAmount').textContent = `₩${totalAmount.toLocaleString()}`;

  const processBtn = document.getElementById('processPaymentBtn');
  processBtn.disabled = selectedCount === 0;

  // 선택된 주문 아이템 하이라이트
  document.querySelectorAll('.payment-order-item').forEach(item => {
    const orderId = item.dataset.orderId;
    const checkbox = document.querySelector(`input[type="checkbox"][data-order-id="${orderId}"]`);
    if (checkbox && checkbox.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// 선택된 주문들 결제 처리
async function processSelectedPayments() {
  try {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const customerType = document.querySelector('input[name="customerType"]:checked').value;

    const processBtn = document.getElementById('processPaymentBtn');
    processBtn.disabled = true;
    processBtn.textContent = '처리 중...';

    const paymentData = {
      paymentMethod: paymentMethod,
      customerType: customerType
    };

    // 비회원인 경우 추가 정보 수집
    if (customerType === 'guest') {
      const guestPhone = document.getElementById('paymentGuestPhone')?.value.trim();
      const guestName = document.getElementById('paymentGuestName')?.value.trim();

      if (guestPhone) {
        paymentData.guestPhone = guestPhone;
      }
      if (guestName) {
        paymentData.guestName = guestName;
      }
    }

    console.log('💳 결제 처리 요청:', paymentData);

    const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${currentTable}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (result.success) {
      alert(`결제가 완료되었습니다!\n주문번호: ${result.orderId}\n결제금액: ₩${result.finalAmount.toLocaleString()}\n고객: ${result.customerName}`);

      closePaymentModal();

      // 테이블 정보 새로고침
      if (currentTable) {
        await updateDetailPanel(currentTable);
      }
    } else {
      alert('결제 처리 실패: ' + result.error);
    }

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    alert('결제 처리 중 오류가 발생했습니다.');
  } finally {
    const processBtn = document.getElementById('processPaymentBtn');
    if (processBtn) {
      processBtn.disabled = false;
      processBtn.textContent = '결제 처리';
    }
  }
}

// 주문 소스 텍스트 변환
function getOrderSourceText(source) {
  const sourceMap = {
    'TLL': 'TLL 주문',
    'POS': 'POS 주문',
    'POS_TLL': 'POS+TLL'
  };
  return sourceMap[source] || source;
}

// 결제 모달 닫기
function closePaymentModal(event) {
  if (event && event.target !== event.currentTarget) return;

  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.remove();
  }
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

    // POS 룸 참여 확인
    posSocket.on('join-pos-room-success', (data) => {
      console.log(`✅ POS 룸 참여 확인 - 매장 ${data.storeId}, 클라이언트: ${data.clientCount}개`);
      showNotification(`📡 매장 ${data.storeId} 실시간 연결 완료`);
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

    // 연결 에러 처리
    posSocket.on('connect_error', (error) => {
      console.error('❌ POS WebSocket 연결 에러:', error);
      showNotification('⚠️ 실시간 연결 오류 발생', 'error');
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
  const { orderId, storeName, tableNumber, customerName, itemCount, totalAmount, source } = data;

  console.log(`🆕 새 주문 알림 수신 - 주문 ${orderId}, 테이블 ${tableNumber}, 출처: ${source}`);

  showNotification(
    `🆕 새 주문 접수! (${source})\n테이블 ${tableNumber} | ${customerName} | ${itemCount}개 메뉴\n₩${totalAmount.toLocaleString()}`, 
    'success'
  );

  // 현재 보고 있는 테이블이면 즉시 새로고침
  if (currentTable && currentTable == tableNumber) {
    console.log(`🔄 현재 테이블 ${currentTable} 세부 정보 새로고침`);
    setTimeout(() => updateDetailPanel(currentTable), 500);
  }

  // 테이블 맵 새로고침
  refreshTableMap();
}

// 테이블 상태 업데이트 처리
function handleTableStatusUpdate(data) {
  const { tableNumber, isOccupied, source, occupiedSince } = data;

  console.log(`🪑 테이블 ${tableNumber} 상태 변경: ${isOccupied ? '점유' : '해제'} (${source})`);

  // 테이블 맵 새로고침
  refreshTableMap();

  // 현재 보고 있는 테이블이면 세부 정보 새로고침
  if (currentTable && currentTable == tableNumber) {
    console.log(`🔄 테이블 ${currentTable} 상태 변경으로 인한 세부 정보 새로고침`);
    setTimeout(() => updateDetailPanel(currentTable), 500);
  }

  const statusText = isOccupied ? '점유됨' : '해제됨';
  const sourceText = source === 'TLL' ? 'TLL 주문' : source === 'TLM' ? 'TLM 관리' : 'POS';

  showNotification(
    `🪑 테이블 ${tableNumber} ${statusText} (${sourceText})`,
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
window.selectOrderType = selectOrderType;
window.toggleCustomerType = toggleCustomerType;
window.filterMenuCategory = filterMenuCategory;
window.addMenuItem = addMenuItem;
window.changeQuantity = changeQuantity;
window.submitOrder = submitOrder;
// 결제 모달 관련 함수들
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.updatePaymentSummary = updatePaymentSummary;
window.processSelectedPayments = processSelectedPayments;