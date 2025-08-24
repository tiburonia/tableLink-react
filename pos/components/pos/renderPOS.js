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
            <span class="sync-time">마지막 동기화: 방금 전</span>
            <div class="sync-indicator active"></div>
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
function updateDetailPanel(tableNumber) {
  const panelTitle = document.getElementById('panelTitle');
  const panelContent = document.getElementById('panelContent');

  panelTitle.textContent = `테이블 ${tableNumber}`;
  panelContent.innerHTML = `
    <div class="table-actions">
      <button class="action-btn primary" onclick="addOrder()">주문 추가</button>
      <button class="action-btn" onclick="viewOrders()">주문 내역</button>
      <button class="action-btn" onclick="moveTable()">테이블 이동</button>
      <button class="action-btn warning" onclick="processPayment()">결제 처리</button>
    </div>

    <div class="current-orders">
      <h4>현재 주문</h4>
      <div class="order-items">
        <!-- 주문 항목들이 여기에 표시됩니다 -->
      </div>
    </div>
  `;
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
    allMenus = store.menu || [];

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

function addOrder() {
  alert('주문 추가 기능 - 개발 예정');
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

// 전역 함수들을 window 객체에 등록
window.renderPOS = renderPOS;
window.selectStore = selectStore;
window.chooseStore = chooseStore;
window.closeStoreModal = closeStoreModal;
window.switchHomeMode = switchHomeMode;
window.selectTableFromMap = selectTableFromMap;
window.filterOrders = filterOrders;
window.closeDetailPanel = closeDetailPanel;
window.createNewOrder = createNewOrder;
window.showPickupQueue = showPickupQueue;
window.showUnassignedOrders = showUnassignedOrders;
window.openQuickMenu = openQuickMenu;
window.addOrder = addOrder;
window.viewOrders = viewOrders;
window.moveTable = moveTable;
window.processPayment = processPayment;