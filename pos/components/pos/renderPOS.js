
// POS 시스템 상태
let currentStore = null;
let currentTable = null;
let allMenus = [];
let categories = [];
let selectedCategory = 'all';
let allTables = [];
let homeMode = 'table_map'; // 'table_map' 또는 'order_list'
let orderFilter = 'all';

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

    // 전역 변수 초기화
    window.currentStore = null;
    window.currentTable = null;
    window.allMenus = [];
    window.allTables = [];
    window.homeMode = homeMode;

    // 기본 UI 렌더링
    renderPOSLayout();

    // URL에서 매장 ID 추출
    const urlParts = window.location.pathname.split('/');
    const storeId = urlParts[2]; // /pos/:storeId

    if (storeId) {
      console.log(`📟 URL에서 매장 ID 감지: ${storeId}`);
      await loadStoreById(storeId);
      initWebSocket(storeId);
    } else {
      showPOSNotification('매장 ID가 URL에 포함되어야 합니다. (예: /pos/123)', 'error');
      return;
    }

    console.log('✅ POS 시스템 초기화 완료');
  } catch (error) {
    console.error('❌ POS 시스템 초기화 실패:', error);
    showPOSNotification('POS 시스템 초기화에 실패했습니다.', 'error');
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
    window.currentStore = currentStore;

    // 매장 정보 표시
    document.getElementById('storeName').textContent = `${store.name} (${store.category || '기타'})`;

    await loadStoreDetails(storeId);
    console.log(`✅ 매장 ${store.name} 로드 완료`);

  } catch (error) {
    console.error('❌ 매장 직접 로드 실패:', error);
    showPOSNotification('매장 정보를 불러오는데 실패했습니다.', 'error');
  }
}

// 매장 상세 정보 로드
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
    window.allMenus = allMenus;

    console.log(`🍽️ 매장 ${storeId} 메뉴 ${allMenus.length}개 로드 완료`);

    // 테이블 정보 로드
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

// 테이블 목록 로드
async function loadTables() {
  try {
    const response = await fetch(`/api/pos/stores/${currentStore.id}/tables`);
    const data = await response.json();

    if (data.success) {
      allTables = data.tables || [];
      window.allTables = allTables;
      console.log(`🪑 매장 ${currentStore.id} 테이블 ${allTables.length}개 로드 완료`);
    } else {
      throw new Error('테이블 데이터 로드 실패');
    }
  } catch (error) {
    console.error('❌ 테이블 데이터 로드 실패:', error);
    allTables = [];
    window.allTables = [];
  }
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

// 세부 패널 닫기
function closeDetailPanel() {
  document.querySelectorAll('.table-item').forEach(item => {
    item.classList.remove('selected');
  });
  currentTable = null;
  window.currentTable = null;

  document.getElementById('panelTitle').textContent = '테이블을 선택하세요';
  document.getElementById('panelContent').innerHTML = `
    <div class="select-table-message">
      테이블을 클릭하여 주문 관리를 시작하세요
    </div>
  `;
}

// 세부 패널 업데이트 (새 DB 구조에 맞게 수정)
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
    const currentTableData = allTables.find(t => t.tableNumber == tableNumber);
    const isOccupied = currentTableData ? currentTableData.isOccupied : false;

    // DB에서 주문 조회 (미결제 + 완료된 주문)
    const allOrdersResponse = await fetch(`/api/pos/stores/${currentStore.id}/table/${tableNumber}/all-orders`);
    const allOrdersData = await allOrdersResponse.json();

    let pendingOrders = [];
    let completedOrders = [];

    if (allOrdersData.success) {
      pendingOrders = allOrdersData.pendingOrders || [];
      completedOrders = allOrdersData.completedOrders || [];
      console.log(`📊 테이블 ${tableNumber} 주문 조회: 미결제 ${pendingOrders.length}개, 완료 ${completedOrders.length}개`);
    }

    panelContent.innerHTML = `
      <div class="table-status-section">
        <div class="table-status-header">
          <h4>테이블 상태</h4>
          <div class="status-indicator ${isOccupied || pendingOrders.length > 0 ? 'occupied' : 'available'}">
            ${isOccupied || pendingOrders.length > 0 ? '🔴 사용중' : '🟢 이용가능'}
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
        <button class="action-btn warning" onclick="processPayment()" ${pendingOrders.length === 0 ? 'disabled' : ''}>결제 처리</button>
      </div>

      <!-- 미결제 주문 -->
      ${pendingOrders.length > 0 ? `
        <div class="pending-orders-section">
          <h4>🔄 미결제 주문 (${pendingOrders.length}개)</h4>
          <div class="order-items scrollable-section">
            ${pendingOrders.map(order => `
              <div class="order-item pending-order" data-order-id="${order.id}">
                <div class="order-header">
                  <div class="order-info">
                    <span class="customer-name">👤 ${order.customerName}</span>
                    <span class="order-time">${formatOrderTime(order.orderDate)}</span>
                    <span class="source-badge ${order.orderSource?.toLowerCase() || 'pos'}">${getOrderSourceText(order.orderSource || 'POS')}</span>
                  </div>
                  <div class="order-amount pending">₩${order.finalAmount.toLocaleString()}</div>
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
                  <span class="status-badge pending">결제 대기</span>
                  <label class="payment-checkbox">
                    <input type="checkbox" data-order-id="${order.id}" data-amount="${order.finalAmount}" checked>
                    <span>결제 선택</span>
                  </label>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 완료된 주문 -->
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
                  <span class="payment-badge">💳 결제됨</span>
                </div>
              </div>
            `).join('') :
            (!pendingOrders.length ? `<div class="no-orders">테이블이 비어있습니다</div>` : '')
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

// 스텁 함수들
function createNewOrder() {
  showPOSNotification('새 포장 주문 기능 - 개발 예정', 'info');
}

function showPickupQueue() {
  showPOSNotification('픽업 대기함 기능 - 개발 예정', 'info');
}

function showUnassignedOrders() {
  showPOSNotification('미지정 주문함 기능 - 개발 예정', 'info');
}

function openQuickMenu() {
  showPOSNotification('빠른 메뉴 기능 - 개발 예정', 'info');
}

function viewOrders() {
  showPOSNotification('주문 내역 기능 - 개발 예정', 'info');
}

function moveTable() {
  showPOSNotification('테이블 이동 기능 - 개발 예정', 'info');
}

// 전역 함수들을 window 객체에 등록
window.renderPOS = renderPOS;
window.selectStore = selectStore;
window.loadStoreById = loadStoreById;
window.loadStoreDetails = loadStoreDetails;
window.loadTables = loadTables;
window.refreshTableMap = refreshTableMap;
window.refreshCurrentTableOrders = refreshCurrentTableOrders;
window.closeDetailPanel = closeDetailPanel;
window.updateDetailPanel = updateDetailPanel;
window.createNewOrder = createNewOrder;
window.showPickupQueue = showPickupQueue;
window.showUnassignedOrders = showUnassignedOrders;
window.openQuickMenu = openQuickMenu;
window.viewOrders = viewOrders;
window.moveTable = moveTable;

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

// 주문 소스 텍스트 변환
function getOrderSourceText(source) {
  const sourceMap = {
    'TLL': 'TLL 주문',
    'POS': 'POS 주문',
    'POS_TLL': 'POS+TLL'
  };
  return sourceMap[source] || source;
}
