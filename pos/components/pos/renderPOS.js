// POS 시스템 상태
let currentStore = null;
let currentTable = null;
let allMenus = [];
let categories = [];
let selectedCategory = 'all';
let allTables = [];
let currentOrder = []; // 현재 주문 내역
let isOrderProcessing = false;

// 카테고리별 색상 코드
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

// POS 시스템 초기화
async function renderPOS() {
  try {
    console.log('📟 POS 시스템 초기화 중...');

    // 전역 변수 초기화
    window.currentStore = null;
    window.currentTable = null;
    window.allMenus = [];
    window.allTables = [];
    window.currentOrder = [];

    // 기본 UI 렌더링
    renderPOSLayout();

    // URL에서 매장 ID 추출
    const urlParts = window.location.pathname.split('/');
    const storeId = urlParts[2];

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
    console.log(`📍 매장 ID ${storeId}로 직접 로드`);

    // 매장 정보 로드
    const storeResponse = await fetch(`/api/stores/${storeId}`);
    const storeData = await storeResponse.json();

    if (!storeData.success) {
      throw new Error('매장 정보를 불러올 수 없습니다.');
    }

    // 매장 설정
    window.currentStore = storeData.store;
    document.getElementById('storeName').textContent = `${storeData.store.name} (ID: ${storeData.store.id})`;

    // 메뉴와 테이블 로드
    await Promise.all([
      loadStoreMenus(storeId),
      loadStoreTables(storeId)
    ]);

    // UI 렌더링
    renderCategories();
    renderMenus();
    renderTableGrid();
    updateTodaySummary();

    console.log(`✅ 매장 ${storeData.store.name} 로드 완료`);
    showPOSNotification(`${storeData.store.name} POS 시스템 준비 완료`);

  } catch (error) {
    console.error('❌ 매장 로드 실패:', error);
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

// 카테고리 탭 렌더링
function renderCategories() {
  const categoryTabs = document.getElementById('categoryTabs');
  if (!categoryTabs) return;

  const tabsHTML = window.categories.map(category => {
    const isActive = category === '전체' && selectedCategory === 'all' || category === selectedCategory;
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
  renderCategories();
  renderMenus();
}

// 메뉴 그리드 렌더링 (대형 버튼)
function renderMenus() {
  const menuGrid = document.getElementById('menuGrid');
  if (!menuGrid) return;

  let filteredMenus = window.allMenus;

  // 카테고리 필터링
  if (selectedCategory !== 'all') {
    filteredMenus = window.allMenus.filter(item => item.category === selectedCategory);
  }

  if (filteredMenus.length === 0) {
    menuGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 40px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🍽️</div>
        <p>해당 카테고리에 메뉴가 없습니다.</p>
      </div>
    `;
    return;
  }

  const menusHTML = filteredMenus.map(item => `
    <button class="menu-item" onclick="addToOrder('${item.name}', ${item.price})">
      <div class="menu-item-name">${item.name}</div>
      <div class="menu-item-price">₩${item.price.toLocaleString()}</div>
    </button>
  `).join('');

  menuGrid.innerHTML = menusHTML;
}

// 주문에 메뉴 추가
function addToOrder(menuName, price) {
  if (!window.currentTable) {
    showPOSNotification('먼저 테이블을 선택해주세요.', 'warning');
    return;
  }

  // 기존 아이템 확인
  const existingItem = window.currentOrder.find(item => item.name === menuName);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    window.currentOrder.push({
      name: menuName,
      price: price,
      quantity: 1
    });
  }

  renderOrderItems();
  updateOrderSummary();
  updatePaymentButtons();

  // 시각적 피드백
  const button = event.target.closest('.menu-item');
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = '';
  }, 100);
}

// 주문 내역 렌더링
function renderOrderItems() {
  const orderItems = document.getElementById('orderItems');
  if (!orderItems) return;

  if (window.currentOrder.length === 0) {
    orderItems.innerHTML = `
      <div class="empty-order">
        <div class="empty-icon">📝</div>
        <p>메뉴를 선택해주세요</p>
      </div>
    `;
    return;
  }

  const itemsHTML = window.currentOrder.map((item, index) => `
    <div class="order-item">
      <div class="order-item-info">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-price">₩${(item.price * item.quantity).toLocaleString()}</div>
      </div>
      <div class="quantity-controls">
        <button class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
      </div>
    </div>
  `).join('');

  orderItems.innerHTML = itemsHTML;
}

// 수량 변경
function changeQuantity(index, change) {
  const item = window.currentOrder[index];
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    window.currentOrder.splice(index, 1);
  }

  renderOrderItems();
  updateOrderSummary();
  updatePaymentButtons();
}

// 주문 요약 업데이트
function updateOrderSummary() {
  const totalAmount = window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = window.currentOrder.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmountElement = document.getElementById('totalAmount');
  const itemCountElement = document.getElementById('itemCount');

  if (totalAmountElement) {
    totalAmountElement.textContent = `₩${totalAmount.toLocaleString()}`;
  }
  if (itemCountElement) {
    itemCountElement.textContent = itemCount;
  }

  // 주문 컨트롤 버튼 상태 업데이트
  const holdBtn = document.querySelector('.hold-btn');
  const clearBtn = document.querySelector('.clear-btn');

  if (holdBtn && clearBtn) {
    const hasItems = window.currentOrder.length > 0;
    holdBtn.disabled = !hasItems;
    clearBtn.disabled = !hasItems;
  }
}

// 결제 버튼 상태 업데이트
function updatePaymentButtons() {
  const paymentButtons = document.querySelectorAll('.payment-btn');
  const hasItems = window.currentOrder.length > 0;
  const hasTable = !!window.currentTable;

  paymentButtons.forEach(btn => {
    btn.disabled = !(hasItems && hasTable);
  });
}

// 테이블 그리드 렌더링
function renderTableGrid() {
  const tableGrid = document.getElementById('tableGrid');
  if (!tableGrid) return;

  if (window.allTables.length === 0) {
    tableGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 20px; font-size: 12px;">
        테이블 정보 없음
      </div>
    `;
    return;
  }

  const tablesHTML = window.allTables.slice(0, 12).map(table => {
    const isSelected = window.currentTable === table.tableNumber;
    const statusClass = isSelected ? 'selected' : (table.isOccupied ? 'occupied' : 'available');

    return `
      <button class="table-card ${statusClass}" onclick="selectTable(${table.tableNumber})">
        <div>T${table.tableNumber}</div>
        <div style="font-size: 10px; margin-top: 4px;">
          ${table.isOccupied ? '사용중' : '빈테이블'}
        </div>
      </button>
    `;
  }).join('');

  tableGrid.innerHTML = tablesHTML;
}

// 테이블 선택
function selectTable(tableNumber) {
  window.currentTable = tableNumber;
  document.getElementById('currentTableNumber').textContent = tableNumber;

  renderTableGrid();
  updatePaymentButtons();

  // 해당 테이블의 주문 정보 로드
  loadTableOrders(tableNumber);

  showPOSNotification(`테이블 ${tableNumber} 선택됨`);
}

// 테이블 주문 정보 로드
async function loadTableOrders(tableNumber) {
  try {
    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${tableNumber}/all-orders`);
    const data = await response.json();

    if (data.success && data.currentSession) {
      // 기존 세션이 있는 경우 주문 내역 로드
      window.currentOrder = data.currentSession.items.map(item => ({
        name: item.menuName,
        price: item.price,
        quantity: item.quantity
      }));

      renderOrderItems();
      updateOrderSummary();
      updatePaymentButtons();

      showPOSNotification(`테이블 ${tableNumber}의 기존 주문을 불러왔습니다.`);
    }
  } catch (error) {
    console.error('❌ 테이블 주문 로드 실패:', error);
  }
}

// 전체 주문 삭제
function clearCurrentOrder() {
  if (window.currentOrder.length === 0) return;

  if (confirm('현재 주문 내역을 모두 삭제하시겠습니까?')) {
    window.currentOrder = [];
    renderOrderItems();
    updateOrderSummary();
    updatePaymentButtons();
    showPOSNotification('주문 내역이 삭제되었습니다.');
  }
}

// 주문 보류
function holdCurrentOrder() {
  if (window.currentOrder.length === 0) return;

  showPOSNotification('주문 보류 기능은 향후 구현 예정입니다.', 'info');
}

// 결제 처리
async function processPayment(paymentMethod) {
  if (isOrderProcessing) return;
  if (window.currentOrder.length === 0) {
    showPOSNotification('결제할 주문이 없습니다.', 'warning');
    return;
  }
  if (!window.currentTable) {
    showPOSNotification('테이블을 선택해주세요.', 'warning');
    return;
  }

  isOrderProcessing = true;

  try {
    // 1. 주문 추가
    const orderData = {
      storeId: window.currentStore.id,
      storeName: window.currentStore.name,
      tableNumber: window.currentTable,
      items: window.currentOrder,
      totalAmount: window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0),
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
    const paymentData = {
      paymentMethod: paymentMethod,
      guestPhone: null // 향후 고객 정보 입력 기능 추가 가능
    };

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
    showPOSNotification(`💳 ${getPaymentMethodName(paymentMethod)} 결제 완료: ₩${totalAmount.toLocaleString()}`);

    // 주문 초기화
    window.currentOrder = [];
    window.currentTable = null;
    document.getElementById('currentTableNumber').textContent = '선택';

    renderOrderItems();
    updateOrderSummary();
    updatePaymentButtons();
    renderTableGrid();
    updateTodaySummary();

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    showPOSNotification(`결제 실패: ${error.message}`, 'error');
  } finally {
    isOrderProcessing = false;
  }
}

// 결제 방법 이름 변환
function getPaymentMethodName(method) {
  const names = {
    'CARD': '카드',
    'CASH': '현금',
    'MOBILE': '간편결제'
  };
  return names[method] || method;
}

// 오늘 매출 요약 업데이트
async function updateTodaySummary() {
  try {
    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/stats`);
    const data = await response.json();

    if (data.success) {
      const summary = document.getElementById('todaySummary');
      if (summary) {
        summary.textContent = `오늘 매출: ₩${data.stats.totalRevenue.toLocaleString()} | 주문: ${data.stats.orderCount}건`;
      }
    }
  } catch (error) {
    console.error('❌ 매출 요약 업데이트 실패:', error);
  }
}

// 테이블 선택기 표시
function showTableSelector() {
  // 기존 테이블 그리드에서 선택하도록 안내
  showPOSNotification('우측 테이블 현황에서 테이블을 선택해주세요.', 'info');
}

// 일일 매출 요약 표시
function showDailySummary() {
  showPOSNotification('매출 요약 기능은 향후 구현 예정입니다.', 'info');
}

// 테이블 이동 모달
function showTableMoveModal() {
  showPOSNotification('테이블 이동 기능은 향후 구현 예정입니다.', 'info');
}

// 분할 결제
function showSplitPayment() {
  showPOSNotification('분할 결제 기능은 향후 구현 예정입니다.', 'info');
}

// 주문 내역 표시
function showOrderHistory() {
  showPOSNotification('주문 내역 기능은 향후 구현 예정입니다.', 'info');
}

// 전역 함수로 노출
window.renderPOS = renderPOS;
window.selectCategory = selectCategory;
window.addToOrder = addToOrder;
window.changeQuantity = changeQuantity;
window.clearCurrentOrder = clearCurrentOrder;
window.holdCurrentOrder = holdCurrentOrder;
window.processPayment = processPayment;
window.selectTable = selectTable;
window.showTableSelector = showTableSelector;
window.showDailySummary = showDailySummary;
window.showTableMoveModal = showTableMoveModal;
window.showSplitPayment = showSplitPayment;
window.showOrderHistory = showOrderHistory;