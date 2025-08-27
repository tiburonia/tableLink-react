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

// 세부 패널 업데이트 (새 테이블 상세 패널 모듈 사용)
async function updateDetailPanel(tableNumber) {
  window.currentTable = tableNumber;

  try {
    // 새로운 테이블 상세 패널 모듈을 사용하여 렌더링
    if (typeof renderTableDetailPanel === 'function') {
      await renderTableDetailPanel(tableNumber);
    } else {
      // 폴백: 기본 UI 렌더링
      await renderBasicTableDetail(tableNumber);
    }
  } catch (error) {
    console.error('❌ 테이블 상세 정보 로드 실패:', error);
    await renderBasicTableDetail(tableNumber);
  }
}

// 기본 테이블 상세 정보 렌더링 (폴백)
async function renderBasicTableDetail(tableNumber) {
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

    // 결제 완료 시 점유 상태 자동 해제 로직
    const processPaymentAndRelease = async (orderId) => {
      try {
        const response = await fetch(`/api/pos/stores/${currentStore.id}/orders/${orderId}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMethod: 'card' }) // 임시 결제 수단
        });
        const result = await response.json();

        if (result.success) {
          showPOSNotification('결제가 성공적으로 완료되었습니다.', 'success');
          // 결제 완료 후 테이블 점유 상태 해제
          await releaseTable(tableNumber);
          await refreshCurrentTableOrders(); // 상세 패널 업데이트
          await refreshTableMap(); // 테이블 맵 업데이트
        } else {
          showPOSNotification(`결제 실패: ${result.message}`, 'error');
        }
      } catch (error) {
        console.error('❌ 결제 처리 중 오류 발생:', error);
        showPOSNotification('결제 처리 중 오류가 발생했습니다.', 'error');
      }
    };

    panelContent.innerHTML = `
      <div class="table-status-section">
        <div class="table-status-header">
          <h4>📊 테이블 상태</h4>
          <div class="status-indicator ${isOccupied || pendingOrders.length > 0 ? 'occupied' : 'available'}">
            ${isOccupied || pendingOrders.length > 0 ? '🔴 사용중' : '🟢 이용가능'}
          </div>
        </div>

        <div class="table-actions">
          <button class="action-btn primary" onclick="addOrder()">
            📦 주문 추가
          </button>
          ${pendingOrders.length > 0 ? `
            <button class="action-btn success pulse" onclick="processPayment()">
              💳 결제 처리 (${pendingOrders.length}개)
            </button>
          ` : ''}
          <button class="action-btn secondary" onclick="refreshCurrentTableOrders()">
            🔄 새로고침
          </button>
        </div>
      </div>

      <!-- 미결제 주문 -->
      ${pendingOrders.length > 0 ? `
        <div class="pending-orders-section">
          <h4>🔄 미결제 주문 (${pendingOrders.length}개)</h4>
          <div class="order-items">
          ${pendingOrders.map(order => `
            <div class="order-item pending-order">
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
                      <span class="menu-quantity">×${item.quantity || 1}</span>
                      <span class="menu-price">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  `).join('') : ''
                }
              </div>

              <div class="order-actions">
                <span class="status-badge pending">결제 대기</span>
                <button class="btn-small btn-primary" onclick="processOrderPayment('${order.id}')">결제하기</button>
              </div>
            </div>
          `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 완료된 주문 -->
      <div class="completed-orders-section">
        <h4>${completedOrders.length > 0 ? `✅ 완료된 주문 (${completedOrders.length}개)` : '완료된 주문 없음'}</h4>
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
                        <span class="menu-quantity">×${item.quantity || 1}</span>
                        <span class="menu-price">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                      </div>
                    `).join('') : ''
                  }
                </div>

                <div class="order-actions">
                  <span class="status-badge completed">결제 완료</span>
                  <span class="payment-method">💳 카드</span>
                </div>
              </div>
            `).join('') : '<div class="no-orders">완료된 주문이 없습니다</div>'
          }
        </div>
      </div>

      ${getBasicDetailPanelStyles()}
    `;

    // 전역 함수 등록 (결제 처리 버튼 클릭 시 호출될 함수)
    window.processOrderPayment = processPaymentAndRelease;

  } catch (error) {
    console.error('❌ 테이블 상세 정보 로드 실패:', error);
    panelContent.innerHTML = `
      <div class="error-message">
        ⚠️ 테이블 정보를 불러오는데 실패했습니다.
        <button class="retry-btn" onclick="updateDetailPanel('${tableNumber}')">다시 시도</button>
      </div>
    `;
  }
}

// 기본 스타일 (폴백용)
function getBasicDetailPanelStyles() {
  return `
    <style>
      .table-status-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
      }

      .table-status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .table-status-header h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .status-indicator {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .status-indicator.occupied {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .status-indicator.available {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }

      .table-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
      }

      .action-btn {
        padding: 12px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        color: #374151;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .action-btn.primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        border-color: #3b82f6;
      }

      .action-btn.secondary {
        background: linear-gradient(135deg, #64748b, #475569);
        color: white;
        border-color: #64748b;
      }

      .action-btn.success {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border-color: #10b981;
      }

      .action-btn.pulse {
        animation: pulse-glow 2s infinite;
      }

      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      }

      .pending-orders-section, .completed-orders-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
      }

      .pending-orders-section h4, .completed-orders-section h4 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .order-items {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .order-item {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
      }

      .order-item.pending-order {
        border-left: 4px solid #f59e0b;
      }

      .order-item.completed-order {
        border-left: 4px solid #10b981;
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .order-info {
        flex: 1;
      }

      .customer-name {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
        margin-right: 8px;
      }

      .order-time {
        font-size: 11px;
        color: #64748b;
        margin-right: 8px;
      }

      .source-badge {
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .source-badge.tll {
        background: #3b82f6;
        color: white;
      }

      .source-badge.pos {
        background: #10b981;
        color: white;
      }

      .order-amount {
        font-size: 14px;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 8px;
      }

      .order-amount.pending {
        background: #fef3c7;
        color: #d97706;
      }

      .order-amount.completed {
        background: #ecfdf5;
        color: #059669;
      }

      .order-details {
        margin-bottom: 12px;
      }

      .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        font-size: 12px;
        border-bottom: 1px solid #f1f5f9;
      }

      .menu-item:last-child {
        border-bottom: none;
      }

      .menu-name {
        flex: 1;
        color: #374151;
        font-weight: 500;
      }

      .menu-quantity {
        background: #e2e8f0;
        color: #64748b;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 700;
        margin: 0 8px;
      }

      .menu-price {
        color: #059669;
        font-weight: 700;
        font-size: 11px;
      }

      .order-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .status-badge.completed {
        background: #dcfce7;
        color: #166534;
      }

      .payment-method {
        font-size: 10px;
        color: #64748b;
      }

      .btn-small {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .no-orders {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 32px 20px;
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 8px;
      }

      .loading-message, .error-message {
        text-align: center;
        color: #64748b;
        padding: 32px 20px;
        background: #f8fafc;
        border-radius: 8px;
      }

      .retry-btn {
        margin-top: 16px;
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }

      .retry-btn:hover {
        background: #2563eb;
      }

      .scrollable-section {
        max-height: 400px;
        overflow-y: auto;
      }
    </style>
  `;
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

// WebSocket 이벤트 리스너 설정
  setupWebSocketListeners();

  // 전역 함수들을 window 객체에 등록
  window.occupyTable = (tableNumber) => window.TableDetailPanel.occupyTable(tableNumber);
  window.releaseTable = (tableNumber) => window.TableDetailPanel.releaseTable(tableNumber);


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

// Dummy TableDetailPanel object for global functions to reference
// In a real scenario, this would be imported or defined elsewhere.
window.TableDetailPanel = {
  occupyTable: async function(tableNumber) {
    console.log(`Attempting to occupy table ${tableNumber}`);
    try {
      const response = await fetch(`/api/pos/stores/${currentStore.id}/tables/${tableNumber}/occupy`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        showPOSNotification(`테이블 ${tableNumber} 점유 상태로 변경되었습니다.`, 'success');
        await refreshTableMap(); // Refresh table map to show status change
        if (window.currentTable == tableNumber) {
          await updateDetailPanel(tableNumber); // Refresh detail panel if it's the current one
        }
      } else {
        throw new Error(data.message || '테이블 점유 상태 변경 실패');
      }
    } catch (error) {
      console.error('❌ 테이블 점유 실패:', error);
      showPOSNotification(`테이블 ${tableNumber} 점유 중 오류 발생: ${error.message}`, 'error');
    }
  },
  releaseTable: async function(tableNumber) {
    console.log(`Attempting to release table ${tableNumber}`);
    try {
      const response = await fetch(`/api/pos/stores/${currentStore.id}/tables/${tableNumber}/release`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        showPOSNotification(`테이블 ${tableNumber} 점유 상태가 해제되었습니다.`, 'success');
        await refreshTableMap(); // Refresh table map to show status change
        if (window.currentTable == tableNumber) {
          await updateDetailPanel(tableNumber); // Refresh detail panel if it's the current one
        }
      } else {
        throw new Error(data.message || '테이블 점유 상태 해제 실패');
      }
    } catch (error) {
      console.error('❌ 테이블 점유 해제 실패:', error);
      showPOSNotification(`테이블 ${tableNumber} 점유 해제 중 오류 발생: ${error.message}`, 'error');
    }
  }
};