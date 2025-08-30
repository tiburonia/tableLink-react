
// POS 시스템 상태 (테이블맵 중심)
let currentStore = null;
let currentTable = null;
let allMenus = [];
let categories = [];
let selectedCategory = 'all';
let allTables = [];
let currentOrder = []; // 현재 테이블 주문 내역
let isOrderProcessing = false;
let currentView = 'table-map'; // 'table-map' 또는 'order'

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

// POS 시스템 초기화 (테이블맵 중심)
async function renderPOS() {
  try {
    console.log('📟 TableLink POS 시스템 초기화 중... (테이블맵 중심)');

    // 전역 변수 초기화
    window.currentStore = null;
    window.currentTable = null;
    window.allMenus = [];
    window.allTables = [];
    window.currentOrder = [];
    window.currentView = 'table-map';

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

    console.log('✅ TableLink POS 시스템 초기화 완료 (테이블맵 모드)');
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
    console.log(`🪑 테이블 ${tableNumber} 선택 - 주문 화면으로 전환`);

    window.currentTable = tableNumber;
    window.currentView = 'order';

    // 화면 전환
    document.getElementById('tableMapView').classList.add('hidden');
    document.getElementById('orderView').classList.remove('hidden');

    // 주문 화면 헤더 업데이트
    document.getElementById('orderTableTitle').textContent = `테이블 ${tableNumber} - 주문/결제`;

    // 기존 주문 세션 로드
    await loadTableSession(tableNumber);

    // 메뉴 카테고리 및 그리드 렌더링
    renderOrderCategories();
    renderOrderMenus();

    showPOSNotification(`테이블 ${tableNumber} 주문 화면으로 전환됨`);

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
      window.currentOrder = data.currentSession.items.map(item => ({
        name: item.menuName,
        price: parseInt(item.price),
        quantity: parseInt(item.quantity)
      }));

      console.log(`✅ 테이블 ${tableNumber} 기존 세션 로드: ${window.currentOrder.length}개 아이템`, window.currentOrder);
      updateOrderStatus(`기존 세션 (${window.currentOrder.length}개)`, 'ordering');
    } else {
      // 새 세션
      console.log(`🆕 테이블 ${tableNumber} 새 주문 세션 시작`);
      updateOrderStatus('새 주문', 'available');
    }

    renderCurrentOrder();
    updateOrderButtons();

  } catch (error) {
    console.error('❌ 테이블 세션 로드 실패:', error);
    window.currentOrder = [];
    renderCurrentOrder();
    updateOrderButtons();
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

// 주문 화면 카테고리 렌더링
function renderOrderCategories() {
  const categoryTabs = document.getElementById('orderCategoryTabs');
  if (!categoryTabs) return;

  const tabsHTML = window.categories.map(category => {
    const isActive = (category === '전체' && selectedCategory === 'all') || (category === selectedCategory);
    const categoryKey = category === '전체' ? 'all' : category;
    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

    return `
      <button class="category-tab ${isActive ? 'active' : ''}" 
              onclick="selectOrderCategory('${categoryKey}')"
              style="${isActive ? `background: ${color}; color: white; border-color: ${color};` : `border-color: ${color}; color: ${color};`}">
        ${category}
      </button>
    `;
  }).join('');

  categoryTabs.innerHTML = tabsHTML;
}

// 주문 화면 카테고리 선택
function selectOrderCategory(category) {
  selectedCategory = category;
  renderOrderCategories();
  renderOrderMenus();
}

// 주문 화면 메뉴 렌더링
function renderOrderMenus() {
  const menuGrid = document.getElementById('orderMenuGrid');
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
    <button class="menu-item" onclick="addMenuToOrder('${item.name}', ${item.price})">
      <div class="menu-item-name">${item.name}</div>
      <div class="menu-item-price">₩${item.price.toLocaleString()}</div>
    </button>
  `).join('');

  menuGrid.innerHTML = menusHTML;
}

// 메뉴를 주문에 추가
function addMenuToOrder(menuName, price) {
  if (!window.currentTable) {
    showPOSNotification('테이블이 선택되지 않았습니다.', 'warning');
    return;
  }

  // 전역 변수 초기화 확인
  if (!window.currentOrder) {
    window.currentOrder = [];
  }

  // 기존 아이템 확인
  const existingItem = window.currentOrder.find(item => item.name === menuName);

  if (existingItem) {
    existingItem.quantity += 1;
    console.log(`📦 메뉴 수량 증가: ${menuName} (${existingItem.quantity}개)`);
  } else {
    const newItem = {
      name: menuName,
      price: parseInt(price),
      quantity: 1
    };
    window.currentOrder.push(newItem);
    console.log(`📦 새 메뉴 추가: ${menuName} - ₩${price.toLocaleString()}`);
  }

  // UI 업데이트
  renderCurrentOrder();
  updateOrderButtons();
  updateOrderStatus('주문 작성 중', 'ordering');

  // 시각적 피드백
  if (event && event.target) {
    const button = event.target.closest('.menu-item');
    if (button) {
      button.style.transform = 'scale(0.95)';
      button.style.background = '#e0f2fe';
      setTimeout(() => {
        button.style.transform = '';
        button.style.background = '';
      }, 200);
    }
  }

  // 디버깅용 로그
  console.log(`✅ 현재 주문 상태 (테이블 ${window.currentTable}):`, window.currentOrder);
  showPOSNotification(`${menuName} 추가됨 (${window.currentOrder.reduce((sum, item) => sum + item.quantity, 0)}개)`, 'success');
}

// 현재 주문 내역 렌더링
function renderCurrentOrder() {
  const orderList = document.getElementById('currentOrderList');
  if (!orderList) {
    console.warn('⚠️ currentOrderList 엘리먼트를 찾을 수 없습니다');
    return;
  }

  // 안전성 검사
  if (!window.currentOrder || !Array.isArray(window.currentOrder)) {
    window.currentOrder = [];
  }

  if (window.currentOrder.length === 0) {
    orderList.innerHTML = `
      <div class="empty-order">
        <div class="empty-icon">📝</div>
        <p>메뉴를 선택해주세요</p>
      </div>
    `;
  } else {
    const itemsHTML = window.currentOrder.map((item, index) => {
      const price = parseInt(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const total = price * quantity;
      
      return `
        <div class="order-item">
          <div class="order-item-info">
            <div class="order-item-name">${item.name || '메뉴명 없음'}</div>
            <div class="order-item-price">₩${total.toLocaleString()}</div>
          </div>
          <div class="quantity-controls">
            <button class="qty-btn" onclick="changeOrderQuantity(${index}, -1)">-</button>
            <span class="qty-display">${quantity}</span>
            <button class="qty-btn" onclick="changeOrderQuantity(${index}, 1)">+</button>
          </div>
        </div>
      `;
    }).join('');

    orderList.innerHTML = itemsHTML;
  }

  updateOrderTotals();
  console.log(`🔄 주문 내역 렌더링 완료: ${window.currentOrder.length}개 아이템`);
}

// 주문 수량 변경
function changeOrderQuantity(index, change) {
  const item = window.currentOrder[index];
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    window.currentOrder.splice(index, 1);
  }

  renderCurrentOrder();
  updateOrderButtons();

  if (window.currentOrder.length === 0) {
    updateOrderStatus('새 주문', 'available');
  }
}

// 주문 합계 업데이트
function updateOrderTotals() {
  const totalAmount = window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQuantity = window.currentOrder.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmountElement = document.getElementById('orderTotalAmount');
  const totalQuantityElement = document.getElementById('totalQuantity');

  if (totalAmountElement) {
    totalAmountElement.textContent = `₩${totalAmount.toLocaleString()}`;
  }
  if (totalQuantityElement) {
    totalQuantityElement.textContent = `${totalQuantity}개`;
  }
}

// 주문 관련 버튼 상태 업데이트
function updateOrderButtons() {
  const hasItems = window.currentOrder.length > 0;

  // 주문 액션 버튼들
  const holdBtn = document.querySelector('.hold-btn');
  const clearBtn = document.querySelector('.clear-btn');
  const sendKitchenBtn = document.querySelector('.send-kitchen');

  if (holdBtn) holdBtn.disabled = !hasItems;
  if (clearBtn) clearBtn.disabled = !hasItems;
  if (sendKitchenBtn) sendKitchenBtn.disabled = !hasItems;

  // 결제 버튼들
  const paymentButtons = document.querySelectorAll('.payment-btn');
  paymentButtons.forEach(btn => {
    btn.disabled = !hasItems;
  });
}

// 테이블맵으로 돌아가기
function returnToTableMap() {
  console.log('🔄 테이블맵으로 복귀');

  window.currentView = 'table-map';
  window.currentTable = null;
  window.currentOrder = [];
  selectedCategory = 'all';

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
    renderCurrentOrder();
    updateOrderButtons();
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

// 테이블 결제 처리
async function processTablePayment(paymentMethod) {
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

// 전역 함수로 노출
window.renderPOS = renderPOS;
window.selectTableFromMap = selectTableFromMap;
window.returnToTableMap = returnToTableMap;
window.selectOrderCategory = selectOrderCategory;
window.addMenuToOrder = addMenuToOrder;
window.changeOrderQuantity = changeOrderQuantity;
window.clearOrder = clearOrder;
window.holdOrder = holdOrder;
window.sendToKitchen = sendToKitchen;
window.processTablePayment = processTablePayment;
window.showReservations = showReservations;
window.showDeliveryOrders = showDeliveryOrders;
window.showDailyStats = showDailyStats;
window.showKitchenStatus = showKitchenStatus;
window.showPOSSettings = showPOSSettings;
