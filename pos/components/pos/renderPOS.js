// POS 시스템 상태 (OKPOS 구조 기반)
let currentStore = null;
let currentTable = null;
let allMenus = [];
let categories = [];
let selectedCategory = 'all';
let allTables = [];
let currentOrder = []; // 현재 테이블 주문 내역
let pendingOrder = []; // 확정되지 않은 임시 주문 내역
let confirmedOrder = []; // 확정된 주문 내역
let selectedItems = []; // 선택된 주문 아이템들
let isOrderProcessing = false;
let currentView = 'table-map'; // 'table-map' 또는 'order'
let inputMode = 'quantity'; // 'quantity', 'amount', 'received'
let currentInput = '';
let hasUnconfirmedChanges = false; // 미확정 변경사항 여부

// 추가된 상태 관리 변수들
let orderSession = null; // 현재 주문 세션 정보
let realTimeOrderUpdates = new Map(); // 실시간 주문 업데이트 관리
let tableTimers = new Map(); // 테이블별 타이머 관리
let soundSettings = {
  newOrder: true,
  paymentComplete: true,
  errorAlert: true
}; // 사운드 설정
let autoRefreshInterval = null; // 자동 새로고침 인터벌

// 주문 수정 관리 상태 초기화 (전역 변수는 이미 선언됨)
let originalOrder = []; // 원본 주문 상태 저장

// 📦 임시 주문 세션 관리 함수들 (최상단으로 이동)
function saveTemporaryOrderToSession() {
  if (!window.currentTable || !window.currentStore) return;
  
  try {
    const sessionKey = `pos_temp_order_${window.currentStore.id}_${window.currentTable}`;
    const tempData = {
      pendingOrder: window.pendingOrder || [],
      tableNumber: window.currentTable,
      storeId: window.currentStore.id,
      lastModified: new Date().toISOString(),
      hasUnconfirmedChanges: window.hasUnconfirmedChanges
    };
    
    sessionStorage.setItem(sessionKey, JSON.stringify(tempData));
    console.log(`💾 임시 주문 세션 저장: 테이블 ${window.currentTable}, ${window.pendingOrder?.length || 0}개 아이템`);
  } catch (error) {
    console.error('❌ 임시 주문 세션 저장 실패:', error);
  }
}

function loadTemporaryOrderFromSession() {
  if (!window.currentTable || !window.currentStore) return false;
  
  try {
    const sessionKey = `pos_temp_order_${window.currentStore.id}_${window.currentTable}`;
    const tempDataString = sessionStorage.getItem(sessionKey);
    
    if (!tempDataString) {
      console.log('📭 저장된 임시 주문 없음');
      return false;
    }
    
    const tempData = JSON.parse(tempDataString);
    
    // 세션이 5분 이내인 경우에만 복원
    const lastModified = new Date(tempData.lastModified);
    const now = new Date();
    const diffMinutes = (now - lastModified) / (1000 * 60);
    
    if (diffMinutes > 5) {
      console.log('⏰ 임시 주문 세션 만료 (5분 초과)');
      clearTemporaryOrderFromSession();
      return false;
    }
    
    if (tempData.pendingOrder && tempData.pendingOrder.length > 0) {
      window.pendingOrder = tempData.pendingOrder;
      window.hasUnconfirmedChanges = tempData.hasUnconfirmedChanges;
      window.currentOrder = [...(window.confirmedOrder || []), ...window.pendingOrder];
      
      console.log(`🔄 임시 주문 세션 복원: ${window.pendingOrder.length}개 아이템`);
      showPOSNotification(`임시 저장된 주문 ${window.pendingOrder.length}개를 복원했습니다.`, 'info');
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ 임시 주문 세션 로드 실패:', error);
    return false;
  }
}

function clearTemporaryOrderFromSession() {
  if (!window.currentTable || !window.currentStore) return;
  
  try {
    const sessionKey = `pos_temp_order_${window.currentStore.id}_${window.currentTable}`;
    sessionStorage.removeItem(sessionKey);
    console.log(`🗑️ 임시 주문 세션 삭제: 테이블 ${window.currentTable}`);
  } catch (error) {
    console.error('❌ 임시 주문 세션 삭제 실패:', error);
  }
}

// 원본 주문 상태 저장 함수
function saveOriginalOrder() {
  if (window.confirmedOrder && Array.isArray(window.confirmedOrder)) {
    window.originalOrder = JSON.parse(JSON.stringify(window.confirmedOrder));
    console.log('💾 원본 주문 상태 저장 완료:', window.originalOrder.length, '개 아이템');
  } else {
    window.originalOrder = [];
  }
}

// 주문 확정 함수
function confirmOrder() {
  return confirmPendingOrder();
}

// 변경사항 되돌리기 함수
function revertChanges() {
  if (window.originalOrder && Array.isArray(window.originalOrder)) {
    window.confirmedOrder = JSON.parse(JSON.stringify(window.originalOrder));
    window.pendingOrder = [];
    window.hasUnconfirmedChanges = false;
    window.currentOrder = [...window.confirmedOrder];
    
    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();
    
    console.log('🔄 변경사항 되돌리기 완료');
    showPOSNotification('변경사항이 되돌려졌습니다.', 'info');
  }
}

// 주문 수정 추적 함수
function trackOrderModification(itemId, modificationType) {
  console.log(`📝 주문 수정 추적: ${itemId} - ${modificationType}`);
  window.hasUnconfirmedChanges = true;
}

// 주문 화면 업데이트 함수
function updateOrderDisplay() {
  renderOrderItems();
  renderPaymentSummary();
  updateButtonStates();
}

// Primary Action 버튼 업데이트 함수 - 개선된 버전
function updatePrimaryActionButton() {
  const primaryBtn = document.querySelector('.primary-action-btn');
  if (!primaryBtn) {
    console.warn('⚠️ Primary Action 버튼을 찾을 수 없습니다.');
    return;
  }

  const btnTitle = primaryBtn.querySelector('.btn-title');
  const btnSubtitle = primaryBtn.querySelector('.btn-subtitle');
  
  const hasConfirmed = window.confirmedOrder && window.confirmedOrder.length > 0;
  const hasPending = window.pendingOrder && window.pendingOrder.length > 0;
  const hasUnconfirmed = window.hasUnconfirmedChanges || hasPending;

  // 디버그 로그
  console.log('🔄 Primary 버튼 상태 업데이트:', {
    hasConfirmed,
    hasPending,
    hasUnconfirmed,
    confirmedCount: window.confirmedOrder?.length || 0,
    pendingCount: window.pendingOrder?.length || 0
  });

  if (hasUnconfirmed && hasPending) {
    // 미확정 주문이 있는 경우
    primaryBtn.disabled = false;
    if (btnTitle) btnTitle.textContent = '주문 확정';
    if (btnSubtitle) btnSubtitle.textContent = `${hasPending ? window.pendingOrder.length : 0}개 아이템 저장`;
    primaryBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    primaryBtn.style.color = 'white';
    primaryBtn.onclick = () => handlePrimaryAction();
    
  } else if (hasConfirmed && !hasUnconfirmed) {
    // 확정된 주문만 있는 경우
    primaryBtn.disabled = false;
    if (btnTitle) btnTitle.textContent = '테이블맵 이동';
    if (btnSubtitle) btnSubtitle.textContent = '주문 화면 종료';
    primaryBtn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
    primaryBtn.style.color = 'white';
    primaryBtn.onclick = () => handlePrimaryAction();
    
  } else {
    // 주문이 없는 경우
    primaryBtn.disabled = true;
    if (btnTitle) btnTitle.textContent = '주문 없음';
    if (btnSubtitle) btnSubtitle.textContent = '메뉴를 선택하세요';
    primaryBtn.style.background = '#e2e8f0';
    primaryBtn.style.color = '#64748b';
    primaryBtn.onclick = null;
  }

  // 접근성을 위한 aria 속성 업데이트
  primaryBtn.setAttribute('aria-disabled', primaryBtn.disabled);
  primaryBtn.setAttribute('title', btnSubtitle ? btnSubtitle.textContent : '');
}

// 고유 주문 아이템 ID 생성 함수
function generateOrderItemId() {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 카테고리별 색상 코드 (실제 POS 서비스 기준)
const CATEGORY_COLORS = {
  '커피': '#8B4513',
  '디저트': '#FF69B4',
  '치킨': '#FFA500',
  '피자': '#DC143C',
  '버거': '#228B22',
  '중식': '#FFD700',
  '한식': '#B22222',
  '일식': '#4169E1',
  '양식': '#9370DB',
  '분식': '#FF6347',
  '브런치': '#32CD32',
  '음료': '#1E90FF',
  '사이드': '#808080',
  'default': '#6B7280'
};

// POS 시스템 초기화 (OKPOS 구조 기반)
async function renderPOS() {
  try {
    console.log('📟 TableLink POS 시스템 초기화 중... (OKPOS 구조 기반)');

    // 전역 변수 안전 초기화
    window.currentStore = null;
    window.currentTable = null;
    window.allMenus = [];
    window.allTables = [];
    window.currentOrder = [];
    window.pendingOrder = [];
    window.confirmedOrder = [];
    window.selectedItems = [];
    window.currentView = 'table-map';
    window.inputMode = 'quantity';
    window.currentInput = '';
    window.hasUnconfirmedChanges = false;

    // 안전성 검사 및 기본값 설정
    if (!Array.isArray(window.currentOrder)) window.currentOrder = [];
    if (!Array.isArray(window.pendingOrder)) window.pendingOrder = [];
    if (!Array.isArray(window.confirmedOrder)) window.confirmedOrder = [];
    if (!Array.isArray(window.selectedItems)) window.selectedItems = [];

    // 기본 UI 렌더링
    renderPOSLayout();

    // URL에서 매장 ID 추출
    const urlParts = window.location.pathname.split('/');
    const storeId = urlParts[2];

    if (storeId) {
      console.log(`📟 URL에서 매장 ID 감지: ${storeId}`);
      await loadStoreForTableMap(storeId);
      initWebSocket(storeId);
      startPeriodicUpdates();
    } else {
      showPOSNotification('매장 ID가 URL에 포함되어야 합니다. (예: /pos/123)', 'error');
      return;
    }

    console.log('✅ TableLink POS 시스템 초기화 완료 (OKPOS 구조 모드)');
  } catch (error) {
    console.error('❌ POS 시스템 초기화 실패:', error);
    showPOSNotification('POS 시스템 초기화에 실패했습니다.', 'error');
  }
}

// 매장 정보 로드 (테이블맵 용)
async function loadStoreForTableMap(storeId) {
  try {
    const storeResponse = await fetch(`/api/stores/${storeId}`);
    const storeData = await storeResponse.json();

    if (!storeData.success) {
      throw new Error('매장 정보를 불러올 수 없습니다.');
    }

    window.currentStore = storeData.store;
    document.getElementById('storeName').textContent = `${storeData.store.name}`;

    await Promise.all([
      loadStoreMenus(storeId),
      loadStoreTables(storeId)
    ]);




    await renderTableMap();
    await updateTodaySummary();

    console.log(`✅ 매장 ${storeData.store.name} 테이블맵 로드 완료`);
    showPOSNotification(`${storeData.store.name} POS 시스템 준비 완료`);

  } catch (error) {
    console.error('❌ 매장 테이블맵 로드 실패:', error);
    showPOSNotification('매장 정보를 불러오는데 실패했습니다.', 'error');
  }
}

// 매장 메뉴 로드
async function loadStoreMenus(storeId) {
  try {
    const response = await fetch(`/api/pos/stores/${storeId}/menu`);
    const data = await response.json();

    if (data.success) {
      window.allMenus = data.menu || [];

      const categorySet = new Set(['전체']);
      window.allMenus.forEach(item => {
        if (item.category) {
          categorySet.add(item.category);
        }
      });

      window.categories = Array.from(categorySet);
      console.log(`📋 메뉴 ${window.allMenus.length}개, 카테고리 ${window.categories.length}개 로드`);
    }
  } catch (error) {
    console.error('❌ 메뉴 로드 실패:', error);
    window.allMenus = [];
    window.categories = ['전체'];
  }
}

// 매장 테이블 로드
async function loadStoreTables(storeId) {
  try {
    const response = await fetch(`/api/pos/stores/${storeId}/tables`);
    const data = await response.json();

    if (data.success) {
      window.allTables = data.tables || [];
      console.log(`🪑 테이블 ${window.allTables.length}개 로드`);
    }
  } catch (error) {
    console.error('❌ 테이블 로드 실패:', error);
    window.allTables = [];
  }
}

// 테이블맵 렌더링 (메인 화면)
async function renderTableMap() {
  const tableMapGrid = document.getElementById('tableMapGrid');
  if (!tableMapGrid) return;

  if (window.allTables.length === 0) {
    tableMapGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 60px; font-size: 16px;">
        <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">🪑</div>
        <p>테이블 정보가 없습니다.</p>
      </div>
    `;
    return;
  }

  const tableStatuses = await Promise.all(
    window.allTables.map(async (table) => {
      try {
        const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${table.tableNumber}/all-orders`);
        const data = await response.json();

        if (data.success && data.currentSession) {
          return {
            ...table,
            status: 'ordering',
            sessionInfo: data.currentSession
          };
        } else if (table.isOccupied) {
          return {
            ...table,
            status: 'payment'
          };
        } else {
          return {
            ...table,
            status: 'available'
          };
        }
      } catch (error) {
        console.error(`❌ 테이블 ${table.tableNumber} 상태 조회 실패:`, error);
        return {
          ...table,
          status: 'available'
        };
      }
    })
  );

  const tablesHTML = tableStatuses.map(table => {
    const statusClass = table.status;
    let statusText = '';
    let timeText = '';

    switch (table.status) {
      case 'available':
        statusText = '빈 자리';
        break;
      case 'ordering':
        statusText = '주문 중';
        if (table.sessionInfo?.sessionStarted) {
          const startTime = new Date(table.sessionInfo.sessionStarted);
          const elapsed = Math.floor((new Date() - startTime) / (1000 * 60));
          timeText = `${elapsed}분 전`;
        }
        break;
      case 'payment':
        statusText = '결제 대기';
        if (table.occupiedSince) {
          const occupiedTime = new Date(table.occupiedSince);
          const elapsed = Math.floor((new Date() - occupiedTime) / (1000 * 60));
          timeText = `${elapsed}분 전`;
        }
        break;
    }

    return `
      <button class="table-item ${statusClass}" onclick="selectTableFromMap(${table.tableNumber})">
        <div class="table-number">T${table.tableNumber}</div>
        <div class="table-status">${statusText}</div>
        ${timeText ? `<div class="table-time">${timeText}</div>` : ''}
      </button>
    `;
  }).join('');

  tableMapGrid.innerHTML = tablesHTML;

  const activeTables = tableStatuses.filter(t => t.status !== 'available').length;
  const activeTablesElement = document.getElementById('activeTables');
  if (activeTablesElement) {
    activeTablesElement.textContent = `${activeTables}/${window.allTables.length}`;
  }
}

// 테이블 선택 함수
async function selectTableFromMap(tableNumber) {
  window.currentTable = tableNumber;

  await loadMixedTableOrders(tableNumber);

  // 원본 주문 상태 저장
  window.saveOriginalOrder();

  updateTableInfo();
  updatePrimaryActionButton();

  try {
    console.log(`🪑 테이블 ${tableNumber} 선택 - OKPOS 주문 화면으로 전환`);

    window.currentView = 'order';
    window.selectedItems = [];
    window.inputMode = 'quantity';
    window.currentInput = '';

    // 📦 임시 주문 복원 시도
    const hasRestoredTemp = loadTemporaryOrderFromSession();
    if (hasRestoredTemp) {
      renderOrderItems();
      renderPaymentSummary();
      updateButtonStates();
      updateOrderStatus('임시 주문 복원됨 (미저장)', 'ordering');
    }

    document.getElementById('tableMapView').classList.add('hidden');
    document.getElementById('orderView').classList.remove('hidden');

    document.getElementById('orderTableTitle').textContent = `테이블 ${tableNumber} - 주문/결제`;

    renderMenuCategories();
    renderMenuGrid();

    showPOSNotification(`테이블 ${tableNumber} OKPOS 주문 화면으로 전환됨`);

  } catch (error) {
    console.error('❌ 테이블 선택 실패:', error);
    showPOSNotification('테이블 선택에 실패했습니다.', 'error');
  }
}

// 테이블 세션 로드
async function loadTableSession(tableNumber) {
  try {
    console.log(`🔄 테이블 ${tableNumber} 세션 로드 시작`);

    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${tableNumber}/all-orders`);
    const data = await response.json();

    window.currentOrder = [];

    if (data.success && data.currentSession && data.currentSession.items) {
      window.currentOrder = data.currentSession.items.map((item, index) => ({
        id: index,
        name: item.menuName,
        price: parseInt(item.price),
        quantity: parseInt(item.quantity),
        discount: 0,
        note: ''
      }));

      console.log(`✅ 테이블 ${tableNumber} 기존 세션 로드: ${window.currentOrder.length}개 아이템`, window.currentOrder);
      updateOrderStatus(`기존 세션 (${window.currentOrder.length}개)`, 'ordering');
    } else {
      console.log(`🆕 테이블 ${tableNumber} 새 주문 세션 시작`);
      updateOrderStatus('새 주문', 'available');
    }

    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();

  } catch (error) {
    console.error('❌ 테이블 세션 로드 실패:', error);
    window.currentOrder = [];
    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();
    updateOrderStatus('로드 실패', 'available');
  }
}

// 주문 상태 업데이트
function updateOrderStatus(statusText, statusType) {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusTextElement = document.getElementById('statusText');

  if (statusIndicator && statusTextElement) {
    statusTextElement.textContent = statusText;

    const colors = {
      'available': '#10b981',
      'ordering': '#f59e0b',
      'payment': '#ef4444',
      'payment-complete': '#10b981'
    };

    statusIndicator.style.background = colors[statusType] || '#6b7280';
  }
}

// 메뉴 카테고리 렌더링
function renderMenuCategories() {
  const categoryTabs = document.getElementById('categoryTabs');
  if (!categoryTabs) return;

  const tabsHTML = window.categories.map(category => {
    const isActive = (category === '전체' && selectedCategory === 'all') || (category === selectedCategory);
    const categoryKey = category === '전체' ? 'all' : category;
    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

    return `
      <button class="category-tab ${isActive ? 'active' : ''}"
              onclick="selectCategory('${categoryKey}')"
              style="${isActive ? `background: ${color}; color: white; border-color: ${color};` : `border-color: ${color}; color: ${color};`}">
        ${category}
      </button>
    `;
  }).join('');

  categoryTabs.innerHTML = tabsHTML;
}

// 카테고리 선택
function selectCategory(category) {
  selectedCategory = category;
  renderMenuCategories();
  renderMenuGrid();
}

// 메뉴 그리드 렌더링
function renderMenuGrid() {
  const menuGrid = document.getElementById('menuGrid');
  if (!menuGrid) return;

  let filteredMenus = window.allMenus;

  if (selectedCategory !== 'all') {
    filteredMenus = window.allMenus.filter(item => item.category === selectedCategory);
  }

  if (filteredMenus.length === 0) {
    menuGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 40px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🍽️</div>
        <p>해당 카테고리에 메뉴가 없습니다.</p>
      </div>
    `;
    return;
  }

  const menusHTML = filteredMenus.map(item => `
    <button class="menu-item-btn" onclick="addMenuToOrder('${item.name}', ${item.price})">
      <div class="menu-item-name">${item.name}</div>
      <div class="menu-item-price">₩${item.price.toLocaleString()}</div>
    </button>
  `).join('');

  menuGrid.innerHTML = menusHTML;
}

// 메뉴를 임시 주문에 추가 (확정 전 상태) - DB 저장하지 않음
function addMenuToOrder(menuName, price) {
  if (!window.currentTable) {
    showPOSNotification('테이블이 선택되지 않았습니다.', 'warning');
    return;
  }

  const menuItem = window.allMenus.find(menu => menu.name === menuName && menu.price === price);
  if (!menuItem) {
    showPOSNotification('유효하지 않은 메뉴입니다.', 'error');
    return;
  }

  // 배열 초기화
  if (!window.pendingOrder || !Array.isArray(window.pendingOrder)) {
    console.log('🔧 pendingOrder 배열 초기화');
    window.pendingOrder = [];
  }
  if (!window.confirmedOrder || !Array.isArray(window.confirmedOrder)) {
    console.log('🔧 confirmedOrder 배열 초기화');
    window.confirmedOrder = [];
  }
  if (!window.currentOrder || !Array.isArray(window.currentOrder)) {
    console.log('🔧 currentOrder 배열 초기화');
    window.currentOrder = [];
  }
  if (!window.selectedItems || !Array.isArray(window.selectedItems)) {
    console.log('🔧 selectedItems 배열 초기화');
    window.selectedItems = [];
  }

  try {
    // 🚫 DB 저장하지 않고 브라우저 메모리에만 임시 보관
    const existingItemIndex = window.pendingOrder.findIndex(item => item.name === menuName);

    if (existingItemIndex !== -1) {
      if (window.pendingOrder[existingItemIndex].quantity >= 99) {
        showPOSNotification('메뉴 수량은 최대 99개까지 가능합니다.', 'warning');
        return;
      }

      window.pendingOrder[existingItemIndex].quantity += 1;
      console.log(`📦 임시 메뉴 수량 증가 (메모리만): ${menuName} (${window.pendingOrder[existingItemIndex].quantity}개)`);
    } else {
      const newItem = {
        id: generateOrderItemId(),
        name: menuName,
        price: parseInt(price),
        quantity: 1,
        discount: 0,
        note: '',
        addedAt: new Date().toISOString(),
        isConfirmed: false,
        isPending: true // 임시 상태 명시
      };
      window.pendingOrder.push(newItem);
      console.log(`📦 새 임시 메뉴 추가 (메모리만): ${menuName} - ₩${price.toLocaleString()}`);
    }

    // 임시 변경사항 플래그 설정
    window.hasUnconfirmedChanges = true;

    // 화면 표시용 currentOrder 업데이트
    window.currentOrder = [...window.confirmedOrder, ...window.pendingOrder];

    // 세션 스토리지에 임시 보관 (페이지 새로고침 대비)
    saveTemporaryOrderToSession();

    // UI 업데이트
    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();
    updateOrderStatus('임시 주문 작성 중 (미저장)', 'ordering');

    // 애니메이션 효과
    if (event && event.target) {
      const button = event.target.closest('.menu-item-btn');
      if (button) {
        button.classList.add('menu-added-animation');
        setTimeout(() => {
          button.classList.remove('menu-added-animation');
        }, 600);
      }
    }

    updateOrderStatistics();

    console.log(`✅ 현재 임시 주문 상태 (메모리에만 저장):`, window.pendingOrder);

    const totalItems = window.currentOrder.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    showPOSNotification(
      `${menuName} 임시 추가 (메모리에만 저장) - 총 ${totalItems}개, ₩${totalAmount.toLocaleString()}`,
      'info'
    );

  } catch (error) {
    console.error('❌ 메뉴 임시 추가 실패:', error);
    showPOSNotification('메뉴 임시 추가 중 오류가 발생했습니다.', 'error');
  }
}

// 주문 아이템 렌더링 (확정/미확정 상태 구분)
function renderOrderItems() {
  const orderItemsList = document.getElementById('orderItemsList');
  if (!orderItemsList) {
    console.warn('⚠️ orderItemsList 엘리먼트를 찾을 수 없습니다');
    return;
  }

  if (!window.currentOrder || !Array.isArray(window.currentOrder)) {
    window.currentOrder = [];
  }

  if (window.currentOrder.length === 0) {
    orderItemsList.innerHTML = `
      <div class="empty-order">
        <div class="empty-icon">📝</div>
        <p>메뉴를 선택해주세요</p>
      </div>
    `;
    return;
  }

  const itemsHTML = window.currentOrder.map((item, index) => {
    const price = parseInt(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    const discount = parseInt(item.discount) || 0;
    const total = (price * quantity) - discount;
    const isSelected = window.selectedItems.includes(item.id);
    const orderType = item.isTLLOrder ? 'TLL' : 'POS';
    const typeClass = item.isTLLOrder ? 'type-tll' : 'type-pos';

    const isConfirmed = item.isConfirmed !== false && !item.isPending;
    const isPending = item.isPending === true;
    const statusClass = isConfirmed ? 'confirmed-item' : 'pending-item';
    const statusBadge = isConfirmed ?
      '<span class="status-badge confirmed">확정됨</span>' :
      '<span class="status-badge pending">임시저장</span>';

    let modificationIndicator = '';
    if (item.isModified && item.originalId) {
      modificationIndicator = '<span class="modification-indicator" title="수정됨">✏️</span>';
    } else if (item.isDeleted) {
      modificationIndicator = '<span class="deletion-indicator" title="삭제 예정">🗑️</span>';
    } else if (!isConfirmed && !item.originalId) {
      modificationIndicator = '<span class="addition-indicator" title="추가됨">➕</span>';
    }

    return `
      <div class="order-item-row ${isSelected ? 'selected' : ''} ${item.isTLLOrder ? 'tll-item' : 'pos-item'} ${statusClass} ${item.isModified ? 'modified-item' : ''} ${item.isDeleted ? 'deleted-item' : ''}" onclick="toggleItemSelection('${item.id}')">
        <div class="item-type">
          <span class="order-type-badge ${typeClass}">${orderType}</span>
          ${statusBadge}
        </div>
        <div class="item-name">
          ${item.name || '메뉴명 없음'}
          ${modificationIndicator}
          ${!isConfirmed ? '<span class="pending-indicator">📝</span>' : ''}
        </div>
        <div class="item-price">₩${price.toLocaleString()}</div>
        <div class="item-qty">${quantity}개</div>
        <div class="item-discount">₩${discount.toLocaleString()}</div>
        <div class="item-total">₩${total.toLocaleString()}</div>
      </div>
    `;
  }).join('');

  orderItemsList.innerHTML = itemsHTML;
  console.log(`🔄 주문 내역 렌더링 완료: ${window.currentOrder.length}개 아이템 (확정: ${window.confirmedOrder?.length || 0}개, 대기: ${window.pendingOrder?.length || 0}개)`);
}

// 아이템 선택/해제
function toggleItemSelection(itemId) {
  const index = window.selectedItems.indexOf(itemId);
  if (index === -1) {
    window.selectedItems.push(itemId);
  } else {
    window.selectedItems.splice(index, 1);
  }
  renderOrderItems();
  updateButtonStates();
}

// 전체 선택
function selectAllItems() {
  if (window.selectedItems.length === window.currentOrder.length) {
    window.selectedItems = [];
  } else {
    window.selectedItems = window.currentOrder.map(item => item.id);
  }
  renderOrderItems();
  updateButtonStates();
}

// 선택된 아이템 삭제
function deleteSelectedItems() {
  if (window.selectedItems.length === 0) {
    showPOSNotification('삭제할 아이템을 선택해주세요.', 'warning');
    return;
  }

  if (confirm(`선택된 ${window.selectedItems.length}개 아이템을 삭제하시겠습니까?`)) {
    let hasConfirmedChanges = false;
    let hasPendingChanges = false;

    window.selectedItems.forEach(itemId => {
      const confirmedIndex = window.confirmedOrder.findIndex(item => item.id === itemId);
      const pendingIndex = window.pendingOrder.findIndex(item => item.id === itemId);

      if (confirmedIndex !== -1) {
        const deletedItem = { ...window.confirmedOrder[confirmedIndex] };
        deletedItem.isDeleted = true;
        deletedItem.isConfirmed = false;
        deletedItem.deletedAt = new Date().toISOString();

        window.pendingOrder.push(deletedItem);
        hasConfirmedChanges = true;
      } else if (pendingIndex !== -1) {
        window.pendingOrder.splice(pendingIndex, 1);
        hasPendingChanges = true;
      }
    });

    window.currentOrder = [...window.confirmedOrder, ...window.pendingOrder].filter(item => !item.isDeleted);

    if (hasConfirmedChanges || hasPendingChanges) {
      window.hasUnconfirmedChanges = true;
    }

    window.selectedItems = [];
    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();

    if (window.currentOrder.length === 0) {
      updateOrderStatus('새 주문', 'available');
    } else {
      updateOrderStatus('주문 수정 중 (미확정)', 'ordering');
    }

    showPOSNotification(`${window.selectedItems.length}개 아이템이 삭제 예정입니다. 확정 버튼을 눌러 적용하세요.`, 'warning');
  }
}

// 할인 적용
function applyDiscount() {
  if (window.selectedItems.length === 0) {
    showPOSNotification('할인 적용할 아이템을 선택해주세요.', 'warning');
    return;
  }

  const discountAmount = prompt('할인 금액을 입력하세요:');
  if (discountAmount && !isNaN(discountAmount)) {
    const discount = parseInt(discountAmount);
    let hasChanges = false;

    window.selectedItems.forEach(itemId => {
      const confirmedIndex = window.confirmedOrder.findIndex(item => item.id === itemId);
      const pendingIndex = window.pendingOrder.findIndex(item => item.id === itemId);

      if (confirmedIndex !== -1) {
        const originalItem = window.confirmedOrder[confirmedIndex];
        let pendingItem = window.pendingOrder.find(item => item.originalId === originalItem.id);

        if (!pendingItem) {
          pendingItem = {
            ...originalItem,
            id: generateOrderItemId(),
            originalId: originalItem.id,
            isModified: true,
            isConfirmed: false,
            modifiedAt: new Date().toISOString()
          };
          window.pendingOrder.push(pendingItem);
        }

        pendingItem.discount = discount;
        pendingItem.modifiedAt = new Date().toISOString();
        hasChanges = true;
      } else if (pendingIndex !== -1) {
        window.pendingOrder[pendingIndex].discount = discount;
        window.pendingOrder[pendingIndex].modifiedAt = new Date().toISOString();
        hasChanges = true;
      }
    });

    if (hasChanges) {
      window.hasUnconfirmedChanges = true;

      window.currentOrder = [...window.confirmedOrder];
      window.pendingOrder.forEach(pendingItem => {
        if (pendingItem.originalId) {
          const originalIndex = window.currentOrder.findIndex(item => item.id === pendingItem.originalId);
          if (originalIndex !== -1) {
            window.currentOrder[originalIndex] = pendingItem;
          }
        } else {
          window.currentOrder.push(pendingItem);
        }
      });

      updateOrderStatus('주문 수정 중 (미확정)', 'ordering');
      showPOSNotification(`₩${discount.toLocaleString()} 할인이 적용되었습니다. 확정 버튼을 눌러 적용하세요.`, 'info');
    }

    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();
  }
}

// 수량 변경
function changeQuantity(delta) {
  if (window.selectedItems.length === 0) {
    showPOSNotification('수량을 변경할 아이템을 선택해주세요.', 'warning');
    return;
  }

  let hasChanges = false;

  window.selectedItems.forEach(itemId => {
    const confirmedIndex = window.confirmedOrder.findIndex(item => item.id === itemId);
    const pendingIndex = window.pendingOrder.findIndex(item => item.id === itemId);

    if (confirmedIndex !== -1) {
      const originalItem = window.confirmedOrder[confirmedIndex];
      let pendingItem = window.pendingOrder.find(item => item.originalId === originalItem.id);

      if (!pendingItem) {
        pendingItem = {
          ...originalItem,
          id: generateOrderItemId(),
          originalId: originalItem.id,
          isModified: true,
          isConfirmed: false,
          modifiedAt: new Date().toISOString()
        };
        window.pendingOrder.push(pendingItem);
      }

      const newQuantity = Math.max(1, pendingItem.quantity + delta);
      if (newQuantity !== pendingItem.quantity) {
        pendingItem.quantity = newQuantity;
        pendingItem.modifiedAt = new Date().toISOString();
        hasChanges = true;
      }
    } else if (pendingIndex !== -1) {
      const newQuantity = Math.max(1, window.pendingOrder[pendingIndex].quantity + delta);
      if (newQuantity !== window.pendingOrder[pendingIndex].quantity) {
        window.pendingOrder[pendingIndex].quantity = newQuantity;
        window.pendingOrder[pendingIndex].modifiedAt = new Date().toISOString();
        hasChanges = true;
      }
    }
  });

  if (hasChanges) {
    window.hasUnconfirmedChanges = true;

    window.currentOrder = [...window.confirmedOrder];

    window.pendingOrder.forEach(pendingItem => {
      if (pendingItem.originalId) {
        const originalIndex = window.currentOrder.findIndex(item => item.id === pendingItem.originalId);
        if (originalIndex !== -1) {
          window.currentOrder[originalIndex] = pendingItem;
        }
      } else {
        window.currentOrder.push(pendingItem);
      }
    });

    updateOrderStatus('주문 수정 중 (미확정)', 'ordering');
    showPOSNotification('수량이 변경되었습니다. 확정 버튼을 눌러 적용하세요.', 'info');
  }

  renderOrderItems();
  renderPaymentSummary();
  updateButtonStates();
}

// 결제 요약 렌더링
function renderPaymentSummary() {
  const totalAmount = window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = window.currentOrder.reduce((sum, item) => sum + item.discount, 0);
  const finalAmount = totalAmount - totalDiscount;

  const totalAmountElement = document.getElementById('totalAmount');
  const discountAmountElement = document.getElementById('discountAmount');
  const finalAmountElement = document.getElementById('finalAmount');

  if (totalAmountElement) {
    totalAmountElement.textContent = `₩${totalAmount.toLocaleString()}`;
  }
  if (discountAmountElement) {
    discountAmountElement.textContent = `₩${totalDiscount.toLocaleString()}`;
  }
  if (finalAmountElement) {
    finalAmountElement.textContent = `₩${finalAmount.toLocaleString()}`;
  }
}

// TLL 주문과 POS 주문 통합 로드
async function loadMixedTableOrders(tableNumber) {
  try {
    console.log(`🔄 테이블 ${tableNumber} POS+TLL 주문 통합 로드`);

    window.currentOrder = [];
    window.confirmedOrder = [];
    window.pendingOrder = [];

    const posResponse = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${tableNumber}/all-orders`);

    if (!posResponse.ok) {
      console.warn(`⚠️ POS 주문 로드 실패: ${posResponse.status}`);
    } else {
      const posData = await posResponse.json();

      if (posData.success && posData.currentSession && posData.currentSession.items) {
        const posItems = posData.currentSession.items.map((item, index) => ({
          id: `pos-${index}`,
          name: item.menuName,
          price: parseInt(item.price),
          quantity: parseInt(item.quantity),
          discount: 0,
          note: '',
          isTLLOrder: false,
          isConfirmed: true
        }));
        window.confirmedOrder.push(...posItems);
        console.log(`✅ POS 확정 주문 ${posItems.length}개 로드`);
      }
    }

    try {
      const tllResponse = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${tableNumber}/orders`);

      if (tllResponse.ok) {
        const tllData = await tllResponse.json();

        if (tllData.success && tllData.tllOrder) {
          const orderData = typeof tllData.tllOrder.orderData === 'string' ?
            JSON.parse(tllData.tllOrder.orderData) : tllData.tllOrder.orderData;

          if (orderData && orderData.items) {
            const tllItems = orderData.items.map((item, itemIndex) => ({
              id: `tll-${itemIndex}`,
              name: item.name,
              price: parseInt(item.price),
              quantity: parseInt(item.quantity),
              discount: 0,
              note: `${tllData.tllOrder.customerName}님 TLL 주문`,
              isTLLOrder: true,
              isConfirmed: true,
              tllOrderInfo: {
                customerName: tllData.tllOrder.customerName,
                paymentDate: tllData.tllOrder.paymentDate
              }
            }));
            window.confirmedOrder.push(...tllItems);
            console.log(`✅ TLL 확정 주문 ${tllItems.length}개 로드`);
          }
        }
      }
    } catch (tllError) {
      console.warn('⚠️ TLL 주문 로드 실패:', tllError);
    }

    window.currentOrder = [...window.confirmedOrder, ...window.pendingOrder];

    console.log(`✅ 테이블 ${tableNumber} 통합 주문 로드 완료: 확정 ${window.confirmedOrder.length}개, 대기 ${window.pendingOrder.length}개`);

    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();

    if (window.confirmedOrder.length > 0) {
      updateOrderStatus(`기존 주문 (${window.confirmedOrder.length}개)`, 'ordering');
    } else {
      updateOrderStatus('새 주문', 'available');
    }

  } catch (error) {
    console.error('❌ 통합 주문 로드 실패:', error);
    window.currentOrder = [];
    window.confirmedOrder = [];
    window.pendingOrder = [];

    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();
    updateOrderStatus('로드 실패', 'available');
  }
}

// 버튼 상태 업데이트
function updateButtonStates() {
  const hasItems = window.currentOrder.length > 0;
  const hasSelection = window.selectedItems.length > 0;

  const holdBtn = document.querySelector('.hold-btn');
  const clearBtn = document.querySelector('.clear-btn');
  const orderBtn = document.querySelector('.primary-order-btn');

  if (holdBtn) holdBtn.disabled = !hasItems;
  if (clearBtn) clearBtn.disabled = !hasItems;
  if (orderBtn) orderBtn.disabled = !hasItems;

  const paymentButtons = document.querySelectorAll('.payment-btn');
  paymentButtons.forEach(btn => {
    btn.disabled = !hasItems;
  });
}

// 결제 처리 (개선된 안정성)
async function processPayment(paymentMethod) {
  if (isOrderProcessing) return;
  if (window.currentOrder.length === 0) {
    showPOSNotification('결제할 주문이 없습니다.', 'warning');
    return;
  }
  if (!window.currentTable) {
    showPOSNotification('테이블이 선택되지 않았습니다.', 'warning');
    return;
  }

  isOrderProcessing = true;
  updateOrderStatus('결제 처리 중', 'payment');

  try {
    console.log(`💳 테이블 ${window.currentTable} ${paymentMethod} 결제 시작`);

    const orderItems = window.currentOrder.map(item => ({
      name: item.name,
      price: parseInt(item.price),
      quantity: parseInt(item.quantity)
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (totalAmount <= 0) {
      throw new Error('결제 금액이 올바르지 않습니다.');
    }

    const sessionCheckResponse = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/session-status`);
    const sessionCheck = await sessionCheckResponse.json();

    if (!sessionCheck.success) {
      throw new Error('세션 상태 확인 실패');
    }

    const orderData = {
      storeId: window.currentStore.id,
      storeName: window.currentStore.name,
      tableNumber: window.currentTable,
      items: orderItems,
      totalAmount: totalAmount,
      isTLLOrder: false,
      userId: 'pos-user',
      customerName: '포스 주문'
    };

    console.log('📦 주문 데이터 전송:', orderData);

    const orderResponse = await fetch('/api/pos/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const orderResult = await orderResponse.json();
    if (!orderResult.success) {
      throw new Error(orderResult.error || '주문 처리 실패');
    }

    console.log('✅ 주문 등록 완료:', orderResult);

    let paymentResult;

    if (paymentMethod === 'CARD') {
      paymentResult = await processVANCardPayment(totalAmount);
    } else {
      paymentResult = await processBasicPayment(paymentMethod);
    }

    if (!paymentResult.success) {
      throw new Error(paymentResult.error || '결제 처리 실패');
    }

    const methodName = getPaymentMethodName(paymentMethod);
    showPOSNotification(`💳 ${methodName} 결제 완료!\n총 금액: ₩${totalAmount.toLocaleString()}`, 'success');

    window.currentOrder = [];
    window.pendingOrder = [];
    window.confirmedOrder = [];
    window.selectedItems = [];
    window.hasUnconfirmedChanges = false;

    updateOrderStatus('결제 완료', 'payment-complete');
    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();

    setTimeout(() => {
      returnToTableMap();
    }, 2000);

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    showPOSNotification(`결제 실패: ${error.message}`, 'error');
    updateOrderStatus('결제 실패', 'ordering');
  } finally {
    isOrderProcessing = false;
  }
}

// VAN 카드 결제 처리
async function processVANCardPayment(amount) {
  try {
    console.log('💳 VAN 카드 결제 시뮬레이션');

    const testCardData = {
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      cvc: '123'
    };

    const vanResponse = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/van-card-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount,
        cardNumber: testCardData.cardNumber,
        expiryDate: testCardData.expiryDate,
        cvc: testCardData.cvc
      })
    });

    const result = await vanResponse.json();

    if (!vanResponse.ok) {
      throw new Error(result.error || 'VAN 카드 결제 실패');
    }

    console.log('✅ VAN 카드 결제 성공:', result.vanResponse);

    return {
      success: true,
      data: result,
      approvalNumber: result.vanResponse?.approvalNumber
    };

  } catch (error) {
    console.error('❌ VAN 카드 결제 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 기본 결제 처리
async function processBasicPayment(paymentMethod) {
  try {
    console.log(`💰 ${paymentMethod} 결제 처리`);

    const paymentResponse = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethod: paymentMethod,
        guestPhone: null
      })
    });

    const result = await paymentResponse.json();

    if (!paymentResponse.ok) {
      throw new Error(result.error || '결제 처리 실패');
    }

    console.log('✅ 기본 결제 성공:', result);

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('❌ 기본 결제 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 미확정 주문을 확정하여 DB에 저장하는 함수 - 단순화된 버전
async function confirmPendingOrder() {
  if (!window.pendingOrder || window.pendingOrder.length === 0) {
    showPOSNotification('확정할 주문이 없습니다.', 'warning');
    return false;
  }

  if (!window.currentTable || !window.currentStore) {
    showPOSNotification('테이블과 매장 정보가 필요합니다.', 'error');
    return false;
  }

  try {
    console.log('📝 주문 확정 처리 시작 - 단순화된 로직');
    updateOrderStatus('주문 확정 중...', 'processing');

    // 대부분의 케이스는 새로운 아이템 추가이므로 단순화
    const orderData = {
      storeId: window.currentStore.id,
      storeName: window.currentStore.name,
      tableNumber: window.currentTable,
      items: window.pendingOrder.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount || 0,
        note: item.note || ''
      })),
      totalAmount: window.pendingOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      isTLLOrder: false,
      userId: 'pos-user',
      customerName: '포스 주문'
    };

    console.log('💾 주문 데이터 DB 저장 중:', orderData);

    const response = await fetch('/api/pos/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error('주문 DB 저장 실패: ' + result.error);
    }

    console.log(`✅ 주문 확정 완료 - Order ID: ${result.orderId}`);

    // 📡 KDS 실시간 전송
    if (global.kdsWebSocket) {
      global.kdsWebSocket.broadcast(window.currentStore.id, 'new-order', {
        orderId: result.orderId,
        storeName: window.currentStore.name,
        tableNumber: window.currentTable,
        customerName: '포스 주문',
        itemCount: window.pendingOrder.length,
        totalAmount: orderData.totalAmount,
        source: 'POS'
      });
    }

    // 로컬 상태 업데이트 - 단순화
    window.pendingOrder.forEach(item => {
      item.isConfirmed = true;
      item.isPending = false;
      item.confirmedAt = new Date().toISOString();
      window.confirmedOrder.push(item);
    });

    // 임시 상태 초기화
    window.pendingOrder = [];
    window.hasUnconfirmedChanges = false;
    window.currentOrder = [...window.confirmedOrder];

    // 세션 정리
    clearTemporaryOrderFromSession();

    // UI 업데이트
    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();
    updateOrderStatus(`주문 확정 완료 (${window.confirmedOrder.length}개)`, 'ordering');

    showPOSNotification(`${window.confirmedOrder.length}개 주문이 확정되어 주방으로 전송되었습니다!`, 'success');

    // 성공 시 사운드 재생
    if (typeof playNotificationSound === 'function') {
      playNotificationSound('newOrder');
    }

    return true;

  } catch (error) {
    console.error('❌ 주문 확정 실패:', error);
    updateOrderStatus('주문 확정 실패', 'error');
    showPOSNotification('주문 확정 중 오류가 발생했습니다: ' + error.message, 'error');
    
    // 실패 시 사운드 재생
    if (typeof playNotificationSound === 'function') {
      playNotificationSound('errorAlert');
    }

    return false;
  }
}

// 주문을 주방으로 저장 (레거시 함수 - 하위 호환성)
async function saveOrderToKitchen() {
  return await confirmPendingOrder();
}


// 결제 방법 이름 변환
function getPaymentMethodName(method) {
  const names = {
    'CARD': '신용카드',
    'CASH': '현금',
    'MOBILE': '간편결제',
    'TL_PAY': 'TL Pay'
  };
  return names[method] || method;
}

// 테이블맵으로 돌아가기
function returnToTableMap() {
  console.log('🔄 테이블맵으로 복귀');

  // 📦 임시 주문이 있으면 경고
  if (window.hasUnconfirmedChanges && window.pendingOrder && window.pendingOrder.length > 0) {
    const confirmLeave = confirm(
      `임시 저장된 주문 ${window.pendingOrder.length}개가 있습니다.\n` +
      `나가면 임시 주문은 자동 저장되며, 같은 테이블 재선택 시 복원됩니다.\n\n` +
      `정말 나가시겠습니까?`
    );
    
    if (!confirmLeave) {
      return; // 사용자가 취소하면 나가지 않음
    }
    
    // 임시 주문 세션에 저장
    saveTemporaryOrderToSession();
    showPOSNotification('임시 주문이 자동 저장되었습니다.', 'info');
  }

  // 테이블맵으로 이동
  window.currentView = 'table-map';
  const previousTable = window.currentTable;
  window.currentTable = null;

  // 메모리 상태 초기화
  window.currentOrder = [];
  window.pendingOrder = [];
  window.confirmedOrder = [];
  window.selectedItems = [];

  window.hasUnconfirmedChanges = false;
  selectedCategory = 'all';
  window.currentInput = '';

  document.getElementById('orderView').classList.add('hidden');
  document.getElementById('tableMapView').classList.remove('hidden');

  renderTableMap();
  
  console.log(`✅ 테이블 ${previousTable}에서 테이블맵으로 복귀 완료`);
}

// 전체 주문 삭제
function clearOrder() {
  if (window.currentOrder.length === 0) return;

  if (confirm('현재 주문 내역을 모두 삭제하시겠습니까?')) {
    window.currentOrder = [];
    window.selectedItems = [];
    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();
    updateOrderStatus('새 주문', 'available');
    showPOSNotification('주문 내역이 삭제되었습니다.');
  }
}

// 주문 보류
function holdOrder() {
  if (window.currentOrder.length === 0) return;
  showPOSNotification('주문 보류 기능은 향후 구현 예정입니다.', 'info');
}

// 주방으로 전송
function sendToKitchen() {
  if (window.currentOrder.length === 0) return;
  showPOSNotification('주방 전송 기능은 향후 구현 예정입니다.', 'info');
}

// TL 특화 기능들
function applyTLCoupon() {
  showPOSNotification('TL 쿠폰 기능은 향후 구현 예정입니다.', 'info');
}

function applyTLPoints() {
  showPOSNotification('TL 포인트 기능은 향후 구현 예정입니다.', 'info');
}

function checkTLLOrder() {
  showPOSNotification('TLL 주문 연동 기능은 향후 구현 예정입니다.', 'info');
}

function printReceipt() {
  showPOSNotification('영수증 출력 기능은 향후 구현 예정입니다.', 'info');
}

function showDailySales() {
  showPOSNotification('일일정산 기능은 향후 구현 예정입니다.', 'info');
}

// 오늘 매출 요약 업데이트
async function updateTodaySummary() {
  try {
    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/stats`);
    const data = await response.json();

    if (data.success) {
      const revenueElement = document.getElementById('todayRevenue');
      const ordersElement = document.getElementById('todayOrders');

      if (revenueElement) {
        revenueElement.textContent = `₩${data.stats.totalRevenue.toLocaleString()}`;
      }
      if (ordersElement) {
        ordersElement.textContent = `${data.stats.orderCount}건`;
      }
    }
  } catch (error) {
    console.error('❌ 매출 요약 업데이트 실패:', error);
  }
}

// 주기적 업데이트 시작
function startPeriodicUpdates() {
  setInterval(() => {
    if (window.currentView === 'table-map') {
      renderTableMap();
    }
  }, 5000);

  setInterval(() => {
    updateTodaySummary();
  }, 30000);
}

// 사이드 패널 기능들
function showReservations() {
  showPOSNotification('예약 확인 기능은 향후 구현 예정입니다.', 'info');
}

function showDeliveryOrders() {
  showPOSNotification('배달/포장 주문 기능은 향후 구현 예정입니다.', 'info');
}

function showDailyStats() {
  showPOSNotification('매출 통계 기능은 향후 구현 예정입니다.', 'info');
}

function showKitchenStatus() {
  showPOSNotification('주방 현황 기능은 향후 구현 예정입니다.', 'info');
}

function showPOSSettings() {
  showPOSNotification('POS 설정 기능은 향후 구현 예정입니다.', 'info');
}

// 메뉴 검색 기능
function searchMenus(query) {
  const menuGrid = document.getElementById('menuGrid');
  if (!menuGrid) return;

  let filteredMenus = window.allMenus;

  if (selectedCategory !== 'all') {
    filteredMenus = window.allMenus.filter(item => item.category === selectedCategory);
  }

  if (query && query.trim()) {
    const searchTerm = query.trim().toLowerCase();
    filteredMenus = filteredMenus.filter(item =>
      item.name.toLowerCase().includes(searchTerm)
    );
  }

  if (filteredMenus.length === 0) {
    menuGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 40px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
        <p>${query ? `"${query}"에 대한 검색 결과가 없습니다.` : '해당 카테고리에 메뉴가 없습니다.'}</p>
      </div>
    `;
    return;
  }

  const menusHTML = filteredMenus.map(item => `
    <button class="menu-item-btn" onclick="addMenuToOrder('${item.name}', ${item.price})">
      <div class="menu-item-name">${item.name}</div>
      <div class="menu-item-price">₩${item.price.toLocaleString()}</div>
    </button>
  `).join('');

  menuGrid.innerHTML = menusHTML;
}

// 복합 결제 처리
function processComboPayment() {
  showPOSNotification('복합 결제 기능은 향후 구현 예정입니다.', 'info');
}

// 고급 패널 토글
function toggleAdvancedPanel() {
  const grid = document.getElementById('advancedFunctionsGrid');
  const toggleBtn = document.getElementById('advancedToggle');

  if (grid && toggleBtn) {
    const isCollapsed = grid.classList.contains('collapsed');

    if (isCollapsed) {
      grid.classList.remove('collapsed');
      toggleBtn.innerHTML = '<span>▼</span>';
      toggleBtn.classList.remove('collapsed');
    } else {
      grid.classList.add('collapsed');
      toggleBtn.innerHTML = '<span>▶</span>';
      toggleBtn.classList.add('collapsed');
    }
  }
}

// 현재 주문 보류
function holdCurrentOrder() {
  if (window.currentOrder.length === 0) {
    showPOSNotification('보류할 주문이 없습니다.', 'warning');
    return;
  }

  showPOSNotification('주문 보류 기능은 향후 구현 예정입니다.', 'info');
}

// 주문 취소
function voidOrder() {
  if (window.currentOrder.length === 0) {
    showPOSNotification('취소할 주문이 없습니다.', 'warning');
    return;
  }

  if (confirm('현재 주문을 완전히 취소하시겠습니까?')) {
    clearOrder();
  }
}

// 버튼 상태 업데이트 (확정/미확정 상태 고려)
function updateButtonStates() {
  const hasItems = window.currentOrder && window.currentOrder.length > 0;
  const hasConfirmedItems = window.confirmedOrder && window.confirmedOrder.length > 0;
  const hasPendingItems = window.pendingOrder && window.pendingOrder.length > 0;
  const hasSelection = window.selectedItems && window.selectedItems.length > 0;
  const hasUnconfirmed = window.hasUnconfirmedChanges || hasPendingItems;

  const holdBtn = document.querySelector('.hold-btn');
  const clearBtn = document.querySelector('.clear-btn');
  const primaryActionBtn = document.querySelector('.primary-action-btn');

  if (holdBtn) holdBtn.disabled = !hasItems;
  if (clearBtn) clearBtn.disabled = !hasItems;

  if (primaryActionBtn) {
    const btnTitle = primaryActionBtn.querySelector('.btn-title');
    const btnSubtitle = primaryActionBtn.querySelector('.btn-subtitle');

    if (hasUnconfirmed) {
      primaryActionBtn.disabled = !hasPendingItems;
      if (btnTitle) btnTitle.textContent = '주문 확정';
      if (btnSubtitle) btnSubtitle.textContent = '변경사항 적용';
      primaryActionBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    } else if (hasConfirmedItems) {
      primaryActionBtn.disabled = false;
      if (btnTitle) btnTitle.textContent = '테이블맵 이동';
      if (btnSubtitle) btnSubtitle.textContent = '현재 화면 종료';
      primaryActionBtn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
    } else {
      primaryActionBtn.disabled = true;
      if (btnTitle) btnTitle.textContent = '주문 없음';
      if (btnSubtitle) btnSubtitle.textContent = '메뉴를 선택하세요';
      primaryActionBtn.style.background = '#f1f5f9';
    }
  }

  const cancelBtn = document.querySelector('.cancel-changes-btn');
  if (cancelBtn) {
    if (hasUnconfirmed) {
      cancelBtn.style.display = 'block';
      cancelBtn.disabled = false;
    } else {
      cancelBtn.style.display = 'none';
    }
  }

  const cancelPendingBtn = document.querySelector('.cancel-pending-btn');
  if (cancelPendingBtn) {
    if (hasPendingItems) {
      cancelPendingBtn.style.display = 'block';
      cancelPendingBtn.disabled = false;
    } else {
      cancelPendingBtn.style.display = 'none';
    }
  }

  const paymentButtons = document.querySelectorAll('.payment-btn');
  paymentButtons.forEach(btn => {
    btn.disabled = !hasConfirmedItems;
  });

  const paymentIndicator = document.getElementById('paymentIndicator');
  if (paymentIndicator) {
    if (hasUnconfirmed) {
      paymentIndicator.textContent = '주문 확정 필요';
      paymentIndicator.style.background = '#f59e0b';
      paymentIndicator.style.color = 'white';
    } else if (hasConfirmedItems) {
      paymentIndicator.textContent = '결제 가능';
      paymentIndicator.style.background = '#10b981';
      paymentIndicator.style.color = 'white';
    } else {
      paymentIndicator.textContent = '대기중';
      paymentIndicator.style.background = '#f3f4f6';
      paymentIndicator.style.color = '#6b7280';
    }
  }
}

// 주문 수정사항 취소 함수
function cancelOrderChanges() {
  if (!window.hasUnconfirmedChanges && (!window.pendingOrder || window.pendingOrder.length === 0)) {
    showPOSNotification('취소할 변경사항이 없습니다.', 'info');
    return;
  }

  if (confirm('모든 수정사항을 취소하고 이전 상태로 되돌리시겠습니까?')) {
    console.log('🔄 주문 수정사항 취소 처리');

    window.pendingOrder = [];
    window.hasUnconfirmedChanges = false;
    window.selectedItems = [];

    window.currentOrder = [...window.confirmedOrder];

    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();

    if (window.confirmedOrder.length > 0) {
      updateOrderStatus(`기존 주문 (${window.confirmedOrder.length}개)`, 'ordering');
    } else {
      updateOrderStatus('새 주문', 'available');
    }

    showPOSNotification('모든 수정사항이 취소되었습니다.', 'success');
    console.log('✅ 주문 수정사항 취소 완료');
  }
}

// Primary Action 핸들러 - 개선된 버전
function handlePrimaryAction() {
  const primaryBtn = document.querySelector('.primary-action-btn');
  if (!primaryBtn || primaryBtn.disabled) {
    console.log('⚠️ Primary 버튼이 비활성화되어 있습니다.');
    return;
  }

  const hasPending = window.pendingOrder && window.pendingOrder.length > 0;
  const hasConfirmed = window.confirmedOrder && window.confirmedOrder.length > 0;
  const hasUnconfirmed = window.hasUnconfirmedChanges || hasPending;

  console.log('🔄 Primary Action 실행:', {
    hasPending,
    hasConfirmed,
    hasUnconfirmed,
    pendingCount: window.pendingOrder?.length || 0,
    confirmedCount: window.confirmedOrder?.length || 0
  });

  if (hasUnconfirmed && hasPending) {
    // 미확정 주문이 있으면 확정 처리
    confirmPendingOrder();
  } else if (hasConfirmed && !hasUnconfirmed) {
    // 확정된 주문만 있으면 테이블맵으로 이동
    returnToTableMap();
  } else {
    console.warn('⚠️ Primary Action 조건이 맞지 않습니다.');
  }
}


// 미확정 주문 상태 표시 CSS 추가
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
.order-item.confirmed {
          background-color: #f0f9ff;
          border-left: 4px solid #3b82f6;
        }

        .order-item.pending {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
        }

        .order-item.modified {
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          animation: pulse 2s infinite;
        }

        .order-item.new-item {
          background-color: #f0fdf4;
          border-left: 4px solid #22c55e;
        }

        .modification-indicator, .new-indicator {
          margin-right: 4px;
          font-size: 12px;
        }

        .secondary-action-btn {
          padding: 12px 24px;
          border: 2px solid #6b7280;
          background: white;
          color: #374151;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin-left: 8px;
          transition: all 0.2s;
        }

        .secondary-action-btn:hover {
          background-color: #f9fafb;
          border-color: #4b5563;
        }

        .secondary-action-btn.cancel:hover {
          background-color: #fef2f2;
          border-color: #dc2626;
          color: #dc2626;
        }

        .primary-action-btn.modify-confirm {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
`;
document.head.appendChild(styleSheet);


// 전역 함수로 노출
window.renderPOS = renderPOS;
window.selectTableFromMap = selectTableFromMap;
window.returnToTableMap = returnToTableMap;
window.selectCategory = selectCategory;
window.addMenuToOrder = addMenuToOrder;
window.toggleItemSelection = toggleItemSelection;
window.selectAllItems = selectAllItems;
window.deleteSelectedItems = deleteSelectedItems;
window.applyDiscount = applyDiscount;
window.changeQuantity = changeQuantity;

window.processPayment = processPayment;
window.clearOrder = clearOrder;
window.holdOrder = holdOrder;
window.sendToKitchen = sendToKitchen;
window.applyTLCoupon = applyTLCoupon;
window.applyTLPoints = applyTLPoints;
window.checkTLLOrder = checkTLLOrder;
window.printReceipt = printReceipt;
window.showDailySales = showDailySales;
window.showReservations = showReservations;
window.showDeliveryOrders = showDeliveryOrders;
window.showDailyStats = showDailyStats;
window.showKitchenStatus = showPOSSettings;
window.showPOSSettings = showPOSSettings;
window.saveOrderToKitchen = saveOrderToKitchen;
window.confirmPendingOrder = confirmPendingOrder;
window.handlePrimaryAction = handlePrimaryAction;

// 새로 추가된 함수들
window.searchMenus = searchMenus;
window.processComboPayment = processComboPayment;
window.toggleAdvancedPanel = toggleAdvancedPanel;
window.holdCurrentOrder = holdCurrentOrder;
window.voidOrder = voidOrder;
window.cancelOrderChanges = cancelOrderChanges;

// 임시 주문 관리 함수들
window.saveTemporaryOrderToSession = saveTemporaryOrderToSession;
window.loadTemporaryOrderFromSession = loadTemporaryOrderFromSession;
window.clearTemporaryOrderFromSession = clearTemporaryOrderFromSession;
window.cancelAllPendingOrders = cancelAllPendingOrders;

// 주문 수정 관련 함수들을 전역으로 노출
window.confirmOrder = confirmOrder;
window.saveOriginalOrder = saveOriginalOrder;
window.revertChanges = revertChanges;
window.trackOrderModification = trackOrderModification;
window.updateOrderDisplay = updateOrderDisplay;
window.updatePrimaryActionButton = updatePrimaryActionButton;
window.originalOrder = [];

// 테이블 정보 업데이트 함수 (전역 스코프로 이동)
function updateTableInfo() {
  const tableInfoElement = document.getElementById('currentTableInfo');
  const tableNumberElement = document.getElementById('currentTableNumber');

  if (tableInfoElement && window.currentTable) {
    tableInfoElement.textContent = `테이블 ${window.currentTable}`;
  }

  if (tableNumberElement && window.currentTable) {
    tableNumberElement.textContent = window.currentTable;
  }

  // 테이블 상태 정보 업데이트
  const tableStatusElement = document.getElementById('tableStatus');
  if (tableStatusElement) {
    const hasOrders = window.currentOrder && window.currentOrder.length > 0;
    const hasConfirmed = window.confirmedOrder && window.confirmedOrder.length > 0;
    const hasPending = window.pendingOrder && window.pendingOrder.length > 0;

    let statusText = '빈 테이블';
    let statusClass = 'available';

    if (hasConfirmed && hasPending) {
      statusText = '주문 수정 중';
      statusClass = 'modifying';
    } else if (hasConfirmed) {
      statusText = '주문 확정됨';
      statusClass = 'confirmed';
    } else if (hasPending) {
      statusText = '주문 작성 중';
      statusClass = 'pending';
    }

    tableStatusElement.textContent = statusText;
    tableStatusElement.className = `table-status ${statusClass}`;
  }
}

// 전역으로 노출
window.updateTableInfo = updateTableInfo;

// 임시 주문 전체 취소 함수
function cancelAllPendingOrders() {
  if (!window.pendingOrder || window.pendingOrder.length === 0) {
    showPOSNotification('취소할 임시 주문이 없습니다.', 'info');
    return;
  }

  const pendingCount = window.pendingOrder.length;
  
  if (confirm(`임시 저장된 주문 ${pendingCount}개를 모두 취소하시겠습니까?\n(확정된 주문은 취소되지 않습니다)`)) {
    console.log(`🗑️ 임시 주문 ${pendingCount}개 전체 취소`);
    
    // 임시 주문만 제거
    window.pendingOrder = [];
    window.hasUnconfirmedChanges = false;
    window.selectedItems = [];
    
    // 현재 주문을 확정된 주문만으로 설정
    window.currentOrder = [...(window.confirmedOrder || [])];
    
    // 세션에서도 제거
    clearTemporaryOrderFromSession();
    
    // UI 업데이트
    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();
    
    if (window.confirmedOrder && window.confirmedOrder.length > 0) {
      updateOrderStatus(`확정된 주문 ${window.confirmedOrder.length}개만 유지`, 'ordering');
    } else {
      updateOrderStatus('주문 없음', 'available');
    }
    
    showPOSNotification(`임시 주문 ${pendingCount}개가 취소되었습니다.`, 'success');
  }
}
