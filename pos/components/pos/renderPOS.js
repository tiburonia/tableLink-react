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

    // 전역 변수 초기화
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
    console.log(`📍 매장 ID ${storeId} 테이블맵 데이터 로드`);

    // 매장 정보 로드
    const storeResponse = await fetch(`/api/stores/${storeId}`);
    const storeData = await storeResponse.json();

    if (!storeData.success) {
      throw new Error('매장 정보를 불러올 수 없습니다.');
    }

    // 매장 설정
    window.currentStore = storeData.store;
    document.getElementById('storeName').textContent = `${storeData.store.name}`;

    // 메뉴와 테이블 로드
    await Promise.all([
      loadStoreMenus(storeId),
      loadStoreTables(storeId)
    ]);

    // 테이블맵 렌더링
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

      // 카테고리 추출
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

  // 각 테이블의 현재 상태 조회
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

  // 활성 테이블 수 업데이트
  const activeTables = tableStatuses.filter(t => t.status !== 'available').length;
  const activeTablesElement = document.getElementById('activeTables');
  if (activeTablesElement) {
    activeTablesElement.textContent = `${activeTables}/${window.allTables.length}`;
  }
}

// 테이블맵에서 테이블 선택 → 주문 화면 전환
async function selectTableFromMap(tableNumber) {
  try {
    console.log(`🪑 테이블 ${tableNumber} 선택 - OKPOS 주문 화면으로 전환`);

    window.currentTable = tableNumber;
    window.currentView = 'order';
    window.selectedItems = [];
    window.inputMode = 'quantity';
    window.currentInput = '';

    // 화면 전환
    document.getElementById('tableMapView').classList.add('hidden');
    document.getElementById('orderView').classList.remove('hidden');

    // 주문 화면 헤더 업데이트
    document.getElementById('orderTableTitle').textContent = `테이블 ${tableNumber} - 주문/결제`;

    // POS + TLL 통합 주문 로드
    await loadMixedTableOrders(tableNumber);

    // 메뉴 카테고리 및 그리드 렌더링
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

    // 주문 배열 초기화
    window.currentOrder = [];

    if (data.success && data.currentSession && data.currentSession.items) {
      // 기존 세션이 있는 경우 주문 내역 로드
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
      // 새 세션
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

    // 상태별 색상
    const colors = {
      'available': '#10b981',
      'ordering': '#f59e0b',
      'payment': '#ef4444'
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

  // 카테고리 필터링
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

// 메뉴를 임시 주문에 추가 (확정 전 상태)
function addMenuToOrder(menuName, price) {
  if (!window.currentTable) {
    showPOSNotification('테이블이 선택되지 않았습니다.', 'warning');
    return;
  }

  // 메뉴 유효성 검증
  const menuItem = window.allMenus.find(menu => menu.name === menuName && menu.price === price);
  if (!menuItem) {
    showPOSNotification('유효하지 않은 메뉴입니다.', 'error');
    return;
  }

  // 전역 변수 안전성 초기화
  if (!window.pendingOrder || !Array.isArray(window.pendingOrder)) {
    window.pendingOrder = [];
  }
  if (!window.confirmedOrder || !Array.isArray(window.confirmedOrder)) {
    window.confirmedOrder = [];
  }
  if (!window.currentOrder || !Array.isArray(window.currentOrder)) {
    window.currentOrder = [];
  }

  try {
    // 기존 아이템 확인 및 추가 (임시 주문에서)
    const existingItemIndex = window.pendingOrder.findIndex(item => item.name === menuName);

    if (existingItemIndex !== -1) {
      // 수량 제한 검증 (최대 99개)
      if (window.pendingOrder[existingItemIndex].quantity >= 99) {
        showPOSNotification('메뉴 수량은 최대 99개까지 가능합니다.', 'warning');
        return;
      }

      window.pendingOrder[existingItemIndex].quantity += 1;
      console.log(`📦 임시 메뉴 수량 증가: ${menuName} (${window.pendingOrder[existingItemIndex].quantity}개)`);
    } else {
      const newItem = {
        id: generateOrderItemId(), // 고유 ID 생성
        name: menuName,
        price: parseInt(price),
        quantity: 1,
        discount: 0,
        note: '',
        addedAt: new Date().toISOString(),
        isConfirmed: false // 미확정 상태
      };
      window.pendingOrder.push(newItem);
      console.log(`📦 새 임시 메뉴 추가: ${menuName} - ₩${price.toLocaleString()}`);
    }

    // 변경사항 플래그 설정
    window.hasUnconfirmedChanges = true;

    // 통합된 주문 목록 생성 (확정 + 미확정)
    window.currentOrder = [...window.confirmedOrder, ...window.pendingOrder];

    // UI 업데이트
    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();
    updateOrderStatus('주문 작성 중 (미확정)', 'ordering');

    // 시각적 피드백 (개선된 애니메이션)
    if (event && event.target) {
      const button = event.target.closest('.menu-item-btn');
      if (button) {
        // 추가 성공 애니메이션
        button.classList.add('menu-added-animation');
        setTimeout(() => {
          button.classList.remove('menu-added-animation');
        }, 600);
      }
    }

    // 통계 업데이트
    updateOrderStatistics();

    console.log(`✅ 현재 임시 주문 상태 (테이블 ${window.currentTable}):`, window.pendingOrder);
    
    // 성공 알림 (수량 정보 포함)
    const totalItems = window.currentOrder.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    showPOSNotification(
      `${menuName} 임시 추가됨 (총 ${totalItems}개, ₩${totalAmount.toLocaleString()})`, 
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

  // 안전성 검사
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
    
    // 확정/미확정 상태 확인
    const isConfirmed = item.isConfirmed !== false;
    const statusClass = isConfirmed ? 'confirmed-item' : 'pending-item';
    const statusBadge = isConfirmed ? 
      '<span class="status-badge confirmed">확정</span>' : 
      '<span class="status-badge pending">대기</span>';

    return `
      <div class="order-item-row ${isSelected ? 'selected' : ''} ${item.isTLLOrder ? 'tll-item' : 'pos-item'} ${statusClass}" onclick="toggleItemSelection('${item.id}')">
        <div class="item-type">
          <span class="order-type-badge ${typeClass}">${orderType}</span>
          ${statusBadge}
        </div>
        <div class="item-name">
          ${item.name || '메뉴명 없음'}
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
    window.currentOrder = window.currentOrder.filter(item => !window.selectedItems.includes(item.id));
    window.selectedItems = [];
    renderOrderItems();
    renderPaymentSummary();
    updateButtonStates();

    if (window.currentOrder.length === 0) {
      updateOrderStatus('새 주문', 'available');
    }
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
    window.currentOrder.forEach(item => {
      if (window.selectedItems.includes(item.id)) {
        item.discount = discount;
      }
    });

    renderOrderItems();
    renderPaymentSummary();
    showPOSNotification(`₩${discount.toLocaleString()} 할인이 적용되었습니다.`);
  }
}

// 수량 변경
function changeQuantity(delta) {
  if (window.selectedItems.length === 0) {
    showPOSNotification('수량을 변경할 아이템을 선택해주세요.', 'warning');
    return;
  }

  window.currentOrder.forEach(item => {
    if (window.selectedItems.includes(item.id)) {
      item.quantity = Math.max(1, item.quantity + delta);
    }
  });

  renderOrderItems();
  renderPaymentSummary();
}

// 결제 요약 렌더링
function renderPaymentSummary() {
  const totalAmount = window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = window.currentOrder.reduce((sum, item) => sum + item.discount, 0);
  const finalAmount = totalAmount - totalDiscount;

  // 요소 업데이트
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

    // 기존 POS 세션 로드
    const posResponse = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${tableNumber}/all-orders`);
    const posData = await posResponse.json();

    // TLL 주문 로드
    const tllResponse = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${tableNumber}/tll-orders`);
    const tllData = await tllResponse.json();

    // 주문 배열 초기화
    window.currentOrder = [];

    // POS 주문 추가
    if (posData.success && posData.currentSession && posData.currentSession.items) {
      const posItems = posData.currentSession.items.map((item, index) => ({
        id: `pos-${index}`,
        name: item.menuName,
        price: parseInt(item.price),
        quantity: parseInt(item.quantity),
        discount: 0,
        note: '',
        isTLLOrder: false
      }));
      window.currentOrder.push(...posItems);
    }

    // TLL 주문 추가 (최근 2시간 내 완료된 주문)
    if (tllData.success && tllData.tllOrders) {
      const tllItems = tllData.tllOrders.flatMap((order, orderIndex) => {
        const orderData = typeof order.orderData === 'string' ? JSON.parse(order.orderData) : order.orderData;
        const items = orderData?.items || [];

        return items.map((item, itemIndex) => ({
          id: `tll-${orderIndex}-${itemIndex}`,
          name: item.name,
          price: parseInt(item.price),
          quantity: parseInt(item.quantity),
          discount: 0,
          note: `${order.customerName}님 주문`,
          isTLLOrder: true,
          tllOrderInfo: {
            customerName: order.customerName,
            paymentDate: order.paymentDate
          }
        }));
      });
      window.currentOrder.push(...tllItems);
    }

    console.log(`✅ 테이블 ${tableNumber} 통합 주문 로드 완료: POS ${posData.currentSession?.items?.length || 0}개, TLL ${tllData.tllOrders?.length || 0}개`);

  } catch (error) {
    console.error('❌ 통합 주문 로드 실패:', error);
    window.currentOrder = [];
  }
}

// 버튼 상태 업데이트
function updateButtonStates() {
  const hasItems = window.currentOrder.length > 0;
  const hasSelection = window.selectedItems.length > 0;

  // 주문 액션 버튼들
  const holdBtn = document.querySelector('.hold-btn');
  const clearBtn = document.querySelector('.clear-btn');
  const orderBtn = document.querySelector('.primary-order-btn');

  if (holdBtn) holdBtn.disabled = !hasItems;
  if (clearBtn) clearBtn.disabled = !hasItems;
  if (orderBtn) orderBtn.disabled = !hasItems;

  // 결제 버튼들
  const paymentButtons = document.querySelectorAll('.payment-btn');
  paymentButtons.forEach(btn => {
    btn.disabled = !hasItems;
  });
}

// 결제 처리 (OKPOS 방식)
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

    // 주문 데이터 변환
    const orderItems = window.currentOrder.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    // 1. 주문 추가
    const orderData = {
      storeId: window.currentStore.id,
      storeName: window.currentStore.name,
      tableNumber: window.currentTable,
      items: orderItems,
      totalAmount: window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity) - item.discount, 0),
      isTLLOrder: false
    };

    const orderResponse = await fetch('/api/pos/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const orderResult = await orderResponse.json();
    if (!orderResult.success) {
      throw new Error(orderResult.error || '주문 처리 실패');
    }

    // 2. 즉시 결제 처리
    const paymentData = { paymentMethod: paymentMethod };

    const paymentResponse = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const paymentResult = await paymentResponse.json();
    if (!paymentResult.success) {
      throw new Error(paymentResult.error || '결제 처리 실패');
    }

    // 성공 처리
    const totalAmount = orderData.totalAmount;
    const methodName = getPaymentMethodName(paymentMethod);

    showPOSNotification(`💳 ${methodName} 결제 완료: ₩${totalAmount.toLocaleString()}`);

    // 2초 후 테이블맵으로 자동 복귀
    setTimeout(() => {
      returnToTableMap();
    }, 2000);

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    showPOSNotification(`결제 실패: ${error.message}`, 'error');
    updateOrderStatus('결제 실패', 'payment');
  } finally {
    isOrderProcessing = false;
  }
}

// 주문 확정 함수 (임시 주문을 실제 주문으로 저장)
async function confirmPendingOrder() {
  if (isOrderProcessing) return;
  
  // 임시 주문이 있는지 확인
  if (!window.pendingOrder || window.pendingOrder.length === 0) {
    showPOSNotification('확정할 주문 항목이 없습니다.', 'warning');
    return;
  }
  
  if (!window.currentTable) {
    showPOSNotification('테이블을 선택해야 합니다.', 'warning');
    return;
  }

  isOrderProcessing = true;
  updateOrderStatus('주문 확정 중', 'ordering');

  try {
    console.log(`📋 테이블 ${window.currentTable} 임시 주문 확정 시작`);

    // 세션 상태 검증
    const sessionCheck = await validateTableSession(window.currentTable);
    if (!sessionCheck.canAddItems) {
      showPOSNotification(sessionCheck.message, 'warning');
      return;
    }

    // 주문 데이터 구성 (임시 주문만)
    const orderData = {
      storeId: window.currentStore.id,
      storeName: window.currentStore.name,
      tableNumber: window.currentTable,
      items: window.pendingOrder.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note
      })),
      isTLLOrder: false
    };

    // API 호출: 주문 저장
    const response = await fetch('/api/pos/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (result.success) {
      // 임시 주문을 확정 주문으로 이동
      window.pendingOrder.forEach(item => {
        item.isConfirmed = true;
        item.confirmedAt = new Date().toISOString();
      });
      
      window.confirmedOrder = [...window.confirmedOrder, ...window.pendingOrder];
      window.pendingOrder = []; // 임시 주문 비우기
      window.hasUnconfirmedChanges = false; // 변경사항 플래그 리셋

      // 통합된 주문 목록 업데이트
      window.currentOrder = [...window.confirmedOrder];

      showPOSNotification('주문이 성공적으로 확정되었습니다.', 'success');
      updateOrderStatus('주문 확정 완료', 'available');
      
      // UI 업데이트
      renderOrderItems();
      renderPaymentSummary();
      updateButtonStates();

      // 2초 후 테이블맵으로 자동 이동
      setTimeout(() => {
        returnToTableMap();
      }, 2000);
    } else {
      throw new Error(result.error || '주문 확정 실패');
    }

  } catch (error) {
    console.error('❌ 주문 확정 실패:', error);
    showPOSNotification(`주문 확정 실패: ${error.message}`, 'error');
    updateOrderStatus('주문 확정 실패', 'ordering');
  } finally {
    isOrderProcessing = false;
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

  window.currentView = 'table-map';
  window.currentTable = null;
  
  // 배열 안전 초기화
  window.currentOrder = [];
  window.pendingOrder = [];
  window.confirmedOrder = [];
  window.selectedItems = [];
  
  window.hasUnconfirmedChanges = false;
  selectedCategory = 'all';
  window.currentInput = '';

  // 화면 전환
  document.getElementById('orderView').classList.add('hidden');
  document.getElementById('tableMapView').classList.remove('hidden');

  // 테이블맵 새로고침
  renderTableMap();
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
  // 테이블맵 5초마다 업데이트
  setInterval(() => {
    if (window.currentView === 'table-map') {
      renderTableMap();
    }
  }, 5000);

  // 매출 요약 30초마다 업데이트
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

  // 카테고리 필터링
  if (selectedCategory !== 'all') {
    filteredMenus = window.allMenus.filter(item => item.category === selectedCategory);
  }

  // 검색어 필터링
  if (query && query.trim()) {
    const searchTerm = query.trim().toLowerCase();
    filteredMenus = filteredMenus.filter(item => 
      item.name.toLowerCase().includes(searchTerm)
    );
  }

  // 결과 렌더링
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

  // 주문 액션 버튼들
  const holdBtn = document.querySelector('.hold-btn');
  const clearBtn = document.querySelector('.clear-btn');
  const primaryActionBtn = document.querySelector('.primary-action-btn');

  if (holdBtn) holdBtn.disabled = !hasItems;
  if (clearBtn) clearBtn.disabled = !hasItems;
  
  // Primary Action 버튼 상태 및 텍스트 업데이트
  if (primaryActionBtn) {
    const btnTitle = primaryActionBtn.querySelector('.btn-title');
    const btnSubtitle = primaryActionBtn.querySelector('.btn-subtitle');
    
    if (hasUnconfirmed) {
      // 미확정 주문이 있는 경우
      primaryActionBtn.disabled = !hasPendingItems;
      if (btnTitle) btnTitle.textContent = '주문 확정';
      if (btnSubtitle) btnSubtitle.textContent = '테이블맵으로 이동';
      primaryActionBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    } else if (hasConfirmedItems) {
      // 확정된 주문만 있는 경우
      primaryActionBtn.disabled = false;
      if (btnTitle) btnTitle.textContent = '테이블맵 이동';
      if (btnSubtitle) btnSubtitle.textContent = '현재 화면 종료';
      primaryActionBtn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
    } else {
      // 주문이 없는 경우
      primaryActionBtn.disabled = true;
      if (btnTitle) btnTitle.textContent = '주문 없음';
      if (btnSubtitle) btnSubtitle.textContent = '메뉴를 선택하세요';
      primaryActionBtn.style.background = '#f1f5f9';
    }
  }

  // 결제 버튼들 (확정된 주문이 있어야 활성화)
  const paymentButtons = document.querySelectorAll('.payment-btn');
  paymentButtons.forEach(btn => {
    btn.disabled = !hasConfirmedItems;
  });

  // 결제 상태 표시 업데이트
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

// Primary Action 버튼 클릭 핸들러
function handlePrimaryAction() {
  const hasUnconfirmed = window.hasUnconfirmedChanges || (window.pendingOrder && window.pendingOrder.length > 0);
  const hasConfirmedItems = window.confirmedOrder && window.confirmedOrder.length > 0;

  if (hasUnconfirmed) {
    // 미확정 주문이 있는 경우 - 주문 확정 처리
    confirmPendingOrder();
  } else if (hasConfirmedItems) {
    // 확정된 주문만 있는 경우 - 테이블맵으로 이동
    returnToTableMap();
  } else {
    // 주문이 없는 경우
    showPOSNotification('주문할 메뉴를 선택해주세요.', 'warning');
  }
}

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
window.showKitchenStatus = showKitchenStatus;
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