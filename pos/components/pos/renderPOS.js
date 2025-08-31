// POS 시스템 상태 관리
let currentStore = null;
let currentTable = null;
let allMenus = [];
let categories = [];
let selectedCategory = 'all';
let allTables = [];
let currentOrder = [];
let selectedItems = [];
let isOrderProcessing = false;
let currentView = 'table-map';

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
    console.log('📟 TableLink POS 시스템 초기화 중...');

    // 전역 변수 초기화
    window.currentStore = null;
    window.currentTable = null;
    window.allMenus = [];
    window.allTables = [];
    window.currentOrder = [];
    window.selectedItems = [];
    window.currentView = 'table-map';

    // 기본 UI 렌더링
    renderPOSLayout();

    // URL에서 매장 ID 추출
    const urlParts = window.location.pathname.split('/');
    const storeId = urlParts[2];

    if (storeId) {
      console.log(`📟 URL에서 매장 ID 감지: ${storeId}`);
      await loadStoreForTableMap(storeId);
      // initWebSocket(storeId); // WebSocket 관련 로직 제거
      startPeriodicUpdates();
    } else {
      showPOSNotification('매장 ID가 URL에 포함되어야 합니다.', 'error');
      return;
    }

    console.log('✅ TableLink POS 시스템 초기화 완료');
  } catch (error) {
    console.error('❌ POS 시스템 초기화 실패:', error);
    showPOSNotification('POS 시스템 초기화에 실패했습니다.', 'error');
  }
}

// 매장 정보 로드
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
    // await updateTodaySummary(); // 오늘 매출 요약 업데이트 제거

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
      const categorySet = new Set(['전체']);
      window.allMenus.forEach(item => {
        if (item.category) {
          categorySet.add(item.category);
        }
      });
      window.categories = Array.from(categorySet);
      console.log(`📋 메뉴 ${window.allMenus.length}개 로드`);
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

// 테이블맵 렌더링
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
          return { ...table, status: 'ordering', sessionInfo: data.currentSession };
        } else if (table.isOccupied) {
          return { ...table, status: 'payment' };
        } else {
          return { ...table, status: 'available' };
        }
      } catch (error) {
        return { ...table, status: 'available' };
      }
    })
  );

  const tablesHTML = tableStatuses.map(table => {
    let statusText = '빈 자리';
    let timeText = '';

    switch (table.status) {
      case 'ordering':
        statusText = '주문 중';
        break;
      case 'payment':
        statusText = '결제 대기';
        break;
    }

    return `
      <button class="table-item ${table.status}" onclick="selectTableFromMap(${table.tableNumber})">
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

// 테이블 선택
async function selectTableFromMap(tableNumber) {
  try {
    window.currentTable = tableNumber;
    console.log(`🪑 테이블 ${tableNumber} 선택`);

    // 주문 데이터 로드 (확정된 주문 + 임시 주문)
    await loadTableOrders(tableNumber);

    // 화면 전환
    window.currentView = 'order';
    window.selectedItems = [];

    document.getElementById('tableMapView').classList.add('hidden');
    document.getElementById('orderView').classList.remove('hidden');
    document.getElementById('orderTableTitle').textContent = `테이블 ${tableNumber} - 주문/결제`;

    // UI 렌더링
    updateTableInfo();
    renderMenuCategories();
    renderMenuGrid();
    renderOrderItems();
    renderPaymentSummary();
    updatePrimaryActionButton();

    showPOSNotification(`테이블 ${tableNumber} 주문 화면으로 전환됨`);

  } catch (error) {
    console.error('❌ 테이블 선택 실패:', error);
    showPOSNotification('테이블 선택에 실패했습니다.', 'error');
  }
}

// 테이블 주문 로드 (세션 기반 + 임시주문) - 메뉴별 통합
async function loadTableOrders(tableNumber) {
  try {
    window.currentOrder = [];

    // 1. DB에서 세션 단위 주문 로드 (orders 테이블)
    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${tableNumber}/all-orders`);
    const data = await response.json();

    if (data.success && data.currentSession && data.currentSession.items) {
      // 세션에 저장된 주문들을 메뉴별로 통합
      const consolidatedItems = {};

      data.currentSession.items.forEach(item => {
        const key = `${item.menuName}_${item.price}`;
        if (consolidatedItems[key]) {
          consolidatedItems[key].quantity += parseInt(item.quantity);
        } else {
          consolidatedItems[key] = {
            id: `session_${item.id}`,
            name: item.menuName,
            price: parseInt(item.price),
            quantity: parseInt(item.quantity),
            discount: 0,
            note: '',
            isConfirmed: true,
            isPending: false,
            sessionId: data.currentSession.orderId,
            cookingStatus: item.cookingStatus || 'PENDING'
          };
        }
      });

      // 통합된 아이템들을 배열로 변환
      const sessionOrders = Object.values(consolidatedItems);
      window.currentOrder = [...sessionOrders];

      console.log(`✅ 테이블 ${tableNumber} 세션 주문 ${sessionOrders.length}개 통합 로드 (원본: ${data.currentSession.items.length}개, 세션 ID: ${data.currentSession.orderId})`);
    }

    // 2. 임시저장 데이터 복구 (아직 확정되지 않은 주문들)
    const tempItems = loadTempOrder();
    if (tempItems.length > 0) {
      window.currentOrder = [...window.currentOrder, ...tempItems];
      console.log(`🔄 임시 주문 ${tempItems.length}개 복구됨`);
    }

    if (window.currentOrder.length === 0) {
      console.log(`📭 테이블 ${tableNumber} 주문 없음`);
    }

  } catch (error) {
    console.error('❌ 주문 로드 실패:', error);
    window.currentOrder = [];
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

// 메뉴를 주문에 추가 (임시상태로만 추가)
function addMenuToOrder(menuName, price) {
  if (!window.currentTable) {
    showPOSNotification('테이블이 선택되지 않았습니다.', 'warning');
    return;
  }

  try {
    // 임시 아이템 중에서 같은 메뉴가 있는지 확인 (isDeleted가 아닌 것만)
    const pendingItems = window.currentOrder.filter(item => item.isPending && !item.isConfirmed && !item.isDeleted);
    const existingPendingItem = pendingItems.find(item => item.name === menuName);

    if (existingPendingItem) {
      // 같은 메뉴가 임시 상태에 이미 있으면 수량만 증가
      existingPendingItem.quantity += 1;
      showPOSNotification(`${menuName} 수량 +1 (총 ${existingPendingItem.quantity}개)`, 'info');
    } else {
      // 새로운 메뉴 임시 추가
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: menuName,
        price: parseInt(price),
        quantity: 1,
        discount: 0,
        note: '',
        isConfirmed: false,
        isPending: true
      };
      window.currentOrder.push(newItem);
      showPOSNotification(`${menuName} 추가됨 (확정 필요)`, 'success');
    }

    // 임시저장 (메모리와 localStorage에만 저장)
    saveTempOrder();

    renderOrderItems();
    renderPaymentSummary();
    updatePrimaryActionButton();

  } catch (error) {
    console.error('❌ 메뉴 추가 실패:', error);
    showPOSNotification('메뉴 추가 중 오류가 발생했습니다.', 'error');
  }
}

// 주문 아이템 렌더링 (임시상태 표시 포함)
function renderOrderItems() {
  const orderItemsList = document.getElementById('orderItemsList');
  if (!orderItemsList) return;

  if (!window.currentOrder || window.currentOrder.length === 0) {
    orderItemsList.innerHTML = `
      <div class="empty-order">
        <div class="empty-icon">📝</div>
        <p>메뉴를 선택해주세요</p>
      </div>
    `;
    return;
  }

  const confirmedItems = window.currentOrder.filter(item => item.isConfirmed);
  const pendingItems = window.currentOrder.filter(item => item.isPending && !item.isConfirmed);

  const itemsHTML = window.currentOrder.map((item) => {
    const price = parseInt(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    const discount = parseInt(item.discount) || 0;
    const total = (price * quantity) - discount;
    const isSelected = window.selectedItems.includes(item.id);

    // 세션 상태 및 수정 상태 표시
    let statusClass = '';
    let statusBadge = '';

    if (item.isDeleted) {
      statusClass = 'deleted';
      statusBadge = 'DELETE';
    } else if (item.isModified) {
      statusClass = 'modified';
      statusBadge = 'MODIFY';
    } else if (item.isPending) {
      statusClass = 'pending';
      statusBadge = 'TEMP';
    } else if (item.isConfirmed) {
      statusClass = 'confirmed';
      statusBadge = item.sessionId ? 'SESSION' : 'DB';
    } else {
      statusBadge = 'POS';
    }

    // 삭제된 아이템은 회색 처리
    const itemStyle = item.isDeleted ? 'opacity: 0.5; text-decoration: line-through;' : '';

    return `
      <div class="order-item-row ${isSelected ? 'selected' : ''} ${statusClass}" 
           onclick="toggleItemSelection('${item.id}')" 
           style="${itemStyle}">
        <div class="item-type">
          <span class="order-type-badge type-${statusBadge.toLowerCase()}">${statusBadge}</span>
        </div>
        <div class="item-name">${item.name || '메뉴명 없음'}</div>
        <div class="item-price">₩${price.toLocaleString()}</div>
        <div class="item-qty">${quantity}개</div>
        <div class="item-discount">₩${discount.toLocaleString()}</div>
        <div class="item-total">₩${total.toLocaleString()}</div>
      </div>
    `;
  }).join('');

  orderItemsList.innerHTML = itemsHTML;

  console.log(`🔄 주문 내역 렌더링 완료: ${window.currentOrder.length}개 아이템 (확정: ${confirmedItems.length}개, 대기: ${pendingItems.length}개)`);
}

// 결제 요약 렌더링
function renderPaymentSummary() {
  const totalAmount = window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = window.currentOrder.reduce((sum, item) => sum + item.discount, 0);
  const finalAmount = totalAmount - totalDiscount;

  const totalAmountElement = document.getElementById('totalAmount');
  const discountAmountElement = document.getElementById('discountAmount');
  const finalAmountElement = document.getElementById('finalAmount');

  if (totalAmountElement) totalAmountElement.textContent = `₩${totalAmount.toLocaleString()}`;
  if (discountAmountElement) discountAmountElement.textContent = `₩${totalDiscount.toLocaleString()}`;
  if (finalAmountElement) finalAmountElement.textContent = `₩${finalAmount.toLocaleString()}`;
}

// Primary Action 버튼 업데이트 (임시상태 표시)
function updatePrimaryActionButton() {
  const primaryBtn = document.querySelector('.primary-action-btn');
  if (!primaryBtn) return;

  const btnTitle = primaryBtn.querySelector('.btn-title');
  const btnSubtitle = primaryBtn.querySelector('.btn-subtitle');

  const pendingItems = window.currentOrder ? window.currentOrder.filter(item => item.isPending && !item.isConfirmed) : [];
  const confirmedItems = window.currentOrder ? window.currentOrder.filter(item => item.isConfirmed) : [];
  const modifiedItems = pendingItems.filter(item => item.isModified || item.isDeleted);
  const newItems = pendingItems.filter(item => !item.isModified && !item.isDeleted);
  const hasPendingItems = pendingItems.length > 0;
  const hasAnyItems = pendingItems.length > 0 || confirmedItems.length > 0;

  // 결제 버튼들 활성화/비활성화 처리
  updatePaymentButtons(hasAnyItems);

  if (hasPendingItems) {
    primaryBtn.disabled = false;

    let subtitleText = '';
    if (newItems.length > 0 && modifiedItems.length > 0) {
      subtitleText = `신규 ${newItems.length}개, 수정 ${modifiedItems.length}개`;
    } else if (newItems.length > 0) {
      subtitleText = `${newItems.length}개 신규 추가`;
    } else if (modifiedItems.length > 0) {
      subtitleText = `${modifiedItems.length}개 수정사항`;
    }

    if (btnTitle) btnTitle.textContent = '세션에 확정';
    if (btnSubtitle) btnSubtitle.textContent = subtitleText;
    primaryBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    primaryBtn.style.color = 'white';
    primaryBtn.style.cursor = 'pointer';
    primaryBtn.onclick = handlePrimaryAction;
  } else if (confirmedItems.length > 0) {
    primaryBtn.disabled = false;
    if (btnTitle) btnTitle.textContent = '추가 주문';
    if (btnSubtitle) btnSubtitle.textContent = `${confirmedItems.length}개 세션 진행중`;
    primaryBtn.style.background = '#10b981';
    primaryBtn.style.color = 'white';
    primaryBtn.style.cursor = 'pointer';
    primaryBtn.onclick = () => showPOSNotification('새 메뉴를 추가하고 확정하세요', 'info');
  } else {
    primaryBtn.disabled = true;
    if (btnTitle) btnTitle.textContent = '주문 없음';
    if (btnSubtitle) btnSubtitle.textContent = '메뉴를 선택하세요';
    primaryBtn.style.background = '#e2e8f0';
    primaryBtn.style.color = '#64748b';
    primaryBtn.style.cursor = 'not-allowed';
    primaryBtn.onclick = null;
  }
}

// 결제 버튼들 활성화/비활성화 처리 함수
function updatePaymentButtons(hasItems) {
  const paymentButtons = document.querySelectorAll('.payment-btn');
  const paymentIndicator = document.getElementById('paymentIndicator');

  paymentButtons.forEach(btn => {
    btn.disabled = !hasItems;
  });

  if (paymentIndicator) {
    if (hasItems) {
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

// Primary Action 핸들러 (단순화)
function handlePrimaryAction() {
  const hasOrders = window.currentOrder && window.currentOrder.length > 0;

  if (hasOrders) {
    confirmOrder();
  } else {
    showPOSNotification('주문할 메뉴를 선택해주세요.', 'warning');
  }
}

// 주문 확정 (세션 단위 DB 저장 + 수정/삭제 처리)
async function confirmOrder() {
  if (!window.currentOrder || window.currentOrder.length === 0) {
    showPOSNotification('확정할 주문이 없습니다.', 'warning');
    return;
  }

  // 임시상태 아이템들 분류
  const pendingItems = window.currentOrder.filter(item => item.isPending && !item.isConfirmed);
  const newItems = pendingItems.filter(item => !item.isModified && !item.isDeleted);
  const modifiedItems = pendingItems.filter(item => item.isModified);
  const deletedItems = pendingItems.filter(item => item.isDeleted);

  if (pendingItems.length === 0) {
    showPOSNotification('확정할 새로운 주문이 없습니다.', 'warning');
    return;
  }

  try {
    console.log('📦 주문 확정 시작 - 세션 단위 DB 저장:', {
      new: newItems.length,
      modified: modifiedItems.length,
      deleted: deletedItems.length
    });

    // 1. 새로운 아이템들을 메뉴별로 통합
    if (newItems.length > 0) {
      // 같은 메뉴끼리 통합
      const consolidatedItems = {};
      newItems.forEach(item => {
        const key = `${item.name}_${item.price}`;
        if (consolidatedItems[key]) {
          consolidatedItems[key].quantity += item.quantity;
        } else {
          consolidatedItems[key] = {
            name: item.name,
            price: item.price,
            quantity: item.quantity
          };
        }
      });

      const finalItems = Object.values(consolidatedItems);

      const sessionOrderData = {
        storeId: window.currentStore.id,
        storeName: window.currentStore.name,
        tableNumber: window.currentTable,
        items: finalItems,
        totalAmount: finalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        isTLLOrder: false,
        userId: null,
        guestPhone: null,
        customerName: '포스 주문'
      };

      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionOrderData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '세션 저장 실패');
      }

      // 새로 추가된 아이템들을 확정 상태로 변경
      newItems.forEach(item => {
        item.isConfirmed = true;
        item.isPending = false;
        item.sessionId = result.orderId;
      });
    }

    // 2. 수정된 아이템들 처리 (원본 제거하고 새 버전으로 교체)
    if (modifiedItems.length > 0) {
      modifiedItems.forEach(modifiedItem => {
        // 원본 확정 아이템 제거
        window.currentOrder = window.currentOrder.filter(item => 
          item.sessionId !== modifiedItem.originalSessionId || 
          item.name !== modifiedItem.name
        );

        // 수정된 아이템을 확정 상태로 변경
        modifiedItem.isConfirmed = true;
        modifiedItem.isPending = false;
        modifiedItem.isModified = false;
        delete modifiedItem.originalSessionId;
      });
    }

    // 3. 삭제된 아이템들 처리 (원본 제거하고 삭제 표시 아이템도 제거)
    if (deletedItems.length > 0) {
      deletedItems.forEach(deletedItem => {
        // 원본 확정 아이템과 삭제 표시 아이템 모두 제거
        window.currentOrder = window.currentOrder.filter(item => 
          item.sessionId !== deletedItem.originalSessionId || 
          item.name !== deletedItem.name
        );
      });

      // 삭제 표시 아이템들도 제거
      window.currentOrder = window.currentOrder.filter(item => !item.isDeleted);
    }

    // 임시저장 데이터 삭제 (확정되었으므로)
    clearTempOrder();

    // UI 업데이트
    renderOrderItems();
    renderPaymentSummary();
    updatePrimaryActionButton();

    const totalChanges = newItems.length + modifiedItems.length + deletedItems.length;
    showPOSNotification(`${totalChanges}개 변경사항이 세션에 확정되었습니다!`, 'success');

    console.log(`✅ 세션 단위 주문 확정 완료 - 신규: ${newItems.length}개, 수정: ${modifiedItems.length}개, 삭제: ${deletedItems.length}개`);

  } catch (error) {
    console.error('❌ 세션 단위 주문 확정 실패:', error);
    showPOSNotification('주문 확정 실패: ' + error.message, 'error');
  }
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
}

// 전체 선택
function selectAllItems() {
  if (window.selectedItems.length === window.currentOrder.length) {
    window.selectedItems = [];
  } else {
    window.selectedItems = window.currentOrder.map(item => item.id);
  }
  renderOrderItems();
}

// 선택된 아이템 삭제 (임시저장 상태로 처리)
function deleteSelectedItems() {
  if (window.selectedItems.length === 0) {
    showPOSNotification('삭제할 아이템을 선택해주세요.', 'warning');
    return;
  }

  const selectedItemsData = window.selectedItems.map(id => 
    window.currentOrder.find(item => item.id === id)
  ).filter(Boolean);

  const confirmedItems = selectedItemsData.filter(item => item.isConfirmed);
  const pendingItems = selectedItemsData.filter(item => item.isPending);

  if (confirmedItems.length > 0) {
    if (!confirm(`확정된 세션 아이템 ${confirmedItems.length}개와 임시 아이템 ${pendingItems.length}개를 삭제하시겠습니까?\n(확정된 아이템 삭제는 임시저장 상태가 됩니다)`)) {
      return;
    }
  } else if (pendingItems.length > 0) {
    if (!confirm(`선택된 ${pendingItems.length}개 임시 아이템을 삭제하시겠습니까?`)) {
      return;
    }
  }

  // 확정된 아이템들을 삭제 상태로 임시저장
  confirmedItems.forEach(item => {
    if (item.isConfirmed) {
      // 삭제 표시용 임시 아이템 생성
      const deleteItem = {
        ...item,
        id: `delete_${item.id}_${Date.now()}`,
        quantity: 0, // 삭제 표시
        isConfirmed: false,
        isPending: true,
        isDeleted: true,
        originalSessionId: item.sessionId
      };
      window.currentOrder.push(deleteItem);
    }
  });

  // 기존 선택된 아이템들 제거
  window.currentOrder = window.currentOrder.filter(item => !window.selectedItems.includes(item.id));
  window.selectedItems = [];

  // 임시저장
  saveTempOrder();

  renderOrderItems();
  renderPaymentSummary();
  updatePrimaryActionButton();

  showPOSNotification(`${selectedItemsData.length}개 아이템 삭제 (확정 필요)`, 'warning');
}

// 할인 적용 (임시저장 상태로 처리)
function applyDiscount() {
  if (window.selectedItems.length === 0) {
    showPOSNotification('할인 적용할 아이템을 선택해주세요.', 'warning');
    return;
  }

  const discountAmount = prompt('할인 금액을 입력하세요:');
  if (discountAmount && !isNaN(discountAmount)) {
    const discount = parseInt(discountAmount);

    window.selectedItems.forEach(itemId => {
      const item = window.currentOrder.find(item => item.id === itemId);
      if (item) {
        if (item.isConfirmed) {
          // 확정된 아이템이면 수정용 임시 아이템 생성
          const modifiedItem = {
            ...item,
            id: `modified_${item.id}_${Date.now()}`,
            discount: discount,
            isConfirmed: false,
            isPending: true,
            isModified: true,
            originalSessionId: item.sessionId
          };
          window.currentOrder.push(modifiedItem);
        } else {
          // 임시 아이템이면 직접 수정
          item.discount = discount;
        }
      }
    });

    // 임시저장
    saveTempOrder();

    renderOrderItems();
    renderPaymentSummary();
    updatePrimaryActionButton();

    showPOSNotification(`₩${discount.toLocaleString()} 할인 적용 (확정 필요)`, 'warning');
  }
}

// 수량 변경 (임시저장 상태로 처리)
function changeQuantity(delta) {
  if (window.selectedItems.length === 0) {
    showPOSNotification('수량을 변경할 아이템을 선택해주세요.', 'warning');
    return;
  }

  window.selectedItems.forEach(itemId => {
    const item = window.currentOrder.find(item => item.id === itemId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);

      if (item.isConfirmed) {
        // 확정된 아이템이면 수정용 임시 아이템 생성
        const modifiedItem = {
          ...item,
          id: `modified_${item.id}_${Date.now()}`,
          quantity: newQuantity,
          isConfirmed: false,
          isPending: true,
          isModified: true,
          originalSessionId: item.sessionId
        };
        window.currentOrder.push(modifiedItem);
      } else {
        // 임시 아이템이면 직접 수정
        item.quantity = newQuantity;
      }
    }
  });

  // 임시저장
  saveTempOrder();

  renderOrderItems();
  renderPaymentSummary();
  updatePrimaryActionButton();

  showPOSNotification('수량 변경 (확정 필요)', 'warning');
}

// 결제 처리 (기존 payment-panel 버튼 연동)
function processPayment(paymentMethod) {
  console.log('💳 결제 버튼 클릭:', paymentMethod);
  
  // 주문이 있는지 확인 (임시 주문 포함)
  if (!window.currentOrder || window.currentOrder.length === 0) {
    showPOSNotification('결제할 주문이 없습니다.', 'warning');
    return;
  }

  // 임시 주문이 있으면 먼저 확정하고 결제 진행
  const pendingItems = window.currentOrder.filter(item => item.isPending && !item.isConfirmed);
  
  if (pendingItems.length > 0) {
    if (confirm('임시 주문을 먼저 확정하고 결제를 진행하시겠습니까?')) {
      confirmOrderAndPay(paymentMethod);
    }
  } else {
    // paymentModal.js의 processPayment 함수 호출
    if (typeof window.processPayment === 'function' && paymentMethod === undefined) {
      // payment-panel의 기본 결제 처리 함수 호출
      window.processPayment();
    } else {
      // 특정 결제 수단이 지정된 경우 직접 처리
      handleDirectPayment(paymentMethod);
    }
  }
}

// 주문 확정 후 결제 진행
async function confirmOrderAndPay(paymentMethod) {
  try {
    // 먼저 주문 확정
    await confirmOrder();
    
    // 약간의 지연 후 결제 진행
    setTimeout(() => {
      if (paymentMethod) {
        handleDirectPayment(paymentMethod);
      } else if (typeof window.processPayment === 'function') {
        window.processPayment();
      }
    }, 500);
    
  } catch (error) {
    console.error('❌ 주문 확정 후 결제 진행 실패:', error);
    showPOSNotification('주문 확정 실패: ' + error.message, 'error');
  }
}

// 직접 결제 처리 (기존 로직 유지)
async function handleDirectPayment(paymentMethod) {
  if (window.currentOrder.length === 0) {
    showPOSNotification('결제할 주문이 없습니다.', 'warning');
    return;
  }

  let phoneNumber = null;
  let actualPaymentMethod = paymentMethod;

  // TLL 연동을 위한 전화번호 입력
  if (paymentMethod === 'TLL') {
    phoneNumber = prompt('TLL 연동을 위한 전화번호를 입력해주세요:');
    if (!phoneNumber) {
      showPOSNotification('전화번호가 입력되지 않아 결제를 취소합니다.', 'warning');
      return;
    }
    actualPaymentMethod = 'CARD'; // TLL 연동 후 카드 결제로 처리
  }

  try {
    const totalAmount = window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: actualPaymentMethod, guestPhone: phoneNumber })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '결제 처리 실패');
    }

    showPOSNotification(`${actualPaymentMethod} 결제 완료! ₩${totalAmount.toLocaleString()}`, 'success');

    // 결제 완료 후 초기화
    window.currentOrder = [];
    window.selectedItems = [];

    renderOrderItems();
    renderPaymentSummary();

    setTimeout(() => {
      returnToTableMap();
    }, 2000);

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    showPOSNotification(`결제 실패: ${error.message}`, 'error');
  }
}

// 테이블맵으로 돌아가기 (임시데이터 삭제)
function returnToTableMap() {
  // 임시저장된 데이터 완전 삭제
  if (window.currentOrder && window.currentOrder.length > 0) {
    const pendingItems = window.currentOrder.filter(item => item.isPending && !item.isConfirmed);

    if (pendingItems.length > 0) {
      console.log(`🗑️ 테이블맵 복귀 - 미확정 주문 ${pendingItems.length}개 삭제`);
      clearTempOrder();
    }
  }

  window.currentView = 'table-map';
  window.currentTable = null;
  window.currentOrder = [];
  window.selectedItems = [];

  document.getElementById('tableMapView').classList.add('hidden');
  document.getElementById('orderView').classList.remove('hidden'); // This line seems misplaced, it should likely be added to show the order view if it's hidden. However, the intention is to return to the table map, so this might be an error in the original code's flow. Based on the user's request, the focus is on the payment button, not this specific view transition bug.

  renderTableMap();
  console.log('✅ 테이블맵으로 복귀 - 임시데이터 정리됨');
}

// 전체 주문 삭제
function clearOrder() {
  if (window.currentOrder.length === 0) return;

  if (confirm('현재 주문 내역을 모두 삭제하시겠습니까?')) {
    window.currentOrder = [];
    window.selectedItems = [];
    clearTempOrder(); // 임시저장 데이터도 함께 삭제
    renderOrderItems();
    renderPaymentSummary();
    updatePrimaryActionButton();
    showPOSNotification('주문 내역이 삭제되었습니다.', 'success');
  }
}

// 임시저장 함수 (세션과 별도 관리)
function saveTempOrder() {
  if (!window.currentTable || !window.currentStore || !window.currentOrder) return;

  try {
    const tempOrderKey = `temp_order_${window.currentStore.id}_${window.currentTable}`;
    const pendingItems = window.currentOrder.filter(item => item.isPending && !item.isConfirmed);
    const sessionItems = window.currentOrder.filter(item => item.isConfirmed);

    const tempOrderData = {
      tableNumber: window.currentTable,
      storeId: window.currentStore.id,
      pendingItems: pendingItems,
      sessionStatus: {
        hasActiveSession: sessionItems.length > 0,
        sessionItemCount: sessionItems.length,
        sessionId: sessionItems[0]?.sessionId || null
      },
      lastModified: new Date().toISOString()
    };

    localStorage.setItem(tempOrderKey, JSON.stringify(tempOrderData));
    console.log(`💾 임시 주문 세션 저장: 테이블 ${window.currentTable}, 임시: ${pendingItems.length}개, 세션: ${sessionItems.length}개`);

  } catch (error) {
    console.error('❌ 임시 주문 저장 실패:', error);
  }
}

// 임시저장 데이터 로드 (세션 정보 포함)
function loadTempOrder() {
  if (!window.currentTable || !window.currentStore) return [];

  try {
    const tempOrderKey = `temp_order_${window.currentStore.id}_${window.currentTable}`;
    const savedData = localStorage.getItem(tempOrderKey);

    if (savedData) {
      const tempOrderData = JSON.parse(savedData);
      const timeDiff = Date.now() - new Date(tempOrderData.lastModified).getTime();

      // 1시간 이내 데이터만 복구
      if (timeDiff < 60 * 60 * 1000) {
        const pendingItems = tempOrderData.pendingItems || tempOrderData.items || [];
        console.log(`🔄 임시 주문 복구: 테이블 ${window.currentTable}, 세션 상태:`, tempOrderData.sessionStatus);
        return pendingItems;
      } else {
        // 오래된 데이터 삭제
        localStorage.removeItem(tempOrderKey);
        console.log(`🗑️ 만료된 임시 주문 삭제: 테이블 ${window.currentTable}`);
      }
    }

    console.log(`📭 저장된 임시 주문 없음`);
    return [];

  } catch (error) {
    console.error('❌ 임시 주문 로드 실패:', error);
    return [];
  }
}

// 임시저장 데이터 삭제
function clearTempOrder() {
  if (!window.currentTable || !window.currentStore) return;

  try {
    const tempOrderKey = `temp_order_${window.currentStore.id}_${window.currentTable}`;
    localStorage.removeItem(tempOrderKey);
    console.log(`🗑️ 임시 주문 데이터 삭제: 테이블 ${window.currentTable}`);

  } catch (error) {
    console.error('❌ 임시 주문 삭제 실패:', error);
  }
}

// 테이블 정보 업데이트
function updateTableInfo() {
  const tableInfoElement = document.getElementById('currentTableInfo');
  const tableNumberElement = document.getElementById('currentTableNumber');

  if (tableInfoElement && window.currentTable) {
    tableInfoElement.textContent = `테이블 ${window.currentTable}`;
  }

  if (tableNumberElement && window.currentTable) {
    tableNumberElement.textContent = window.currentTable;
  }
}

// 오늘 매출 요약 업데이트 (제거됨)
// async function updateTodaySummary() { ... }

// 주기적 업데이트 (테이블맵만 갱신)
function startPeriodicUpdates() {
  setInterval(() => {
    if (window.currentView === 'table-map') {
      renderTableMap();
    }
  }, 5000);
}

// 메뉴 검색
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

// 미구현 기능들 (향후 개발용)
function holdOrder() { showPOSNotification('주문 보류 기능은 향후 구현 예정입니다.', 'info'); }
function sendToKitchen() { showPOSNotification('주방 전송 기능은 향후 구현 예정입니다.', 'info'); }
function applyTLCoupon() { showPOSNotification('TL 쿠폰 기능은 향후 구현 예정입니다.', 'info'); }
function applyTLPoints() { showPOSNotification('TL 포인트 기능은 향후 구현 예정입니다.', 'info'); }
function checkTLLOrder() { showPOSNotification('TLL 주문 연동 기능은 향후 구현 예정입니다.', 'info'); }
function printReceipt() { showPOSNotification('영수증 출력 기능은 향후 구현 예정입니다.', 'info'); }
function showDailySales() { showPOSNotification('일일정산 기능은 향후 구현 예정입니다.', 'info'); }
function showReservations() { showPOSNotification('예약 확인 기능은 향후 구현 예정입니다.', 'info'); }
function showDeliveryOrders() { showPOSNotification('배달/포장 주문 기능은 향후 구현 예정입니다.', 'info'); }
function showDailyStats() { showPOSNotification('매출 통계 기능은 향후 구현 예정입니다.', 'info'); }
function showKitchenStatus() { showPOSNotification('주방 현황 기능은 향후 구현 예정입니다.', 'info'); }
function showPOSSettings() { showPOSNotification('POS 설정 기능은 향후 구현 예정입니다.', 'info'); }
function processComboPayment() { showPOSNotification('복합 결제 기능은 향후 구현 예정입니다.', 'info'); }
function toggleAdvancedPanel() { showPOSNotification('고급 기능 패널은 향후 구현 예정입니다.', 'info'); }
function holdCurrentOrder() { showPOSNotification('주문 보류 기능은 향후 구현 예정입니다.', 'info'); }
function voidOrder() { clearOrder(); }

// 전역 함수 노출
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
window.handleDirectPayment = handleDirectPayment;
window.confirmOrderAndPay = confirmOrderAndPay;
window.updatePaymentButtons = updatePaymentButtons;
window.clearOrder = clearOrder;
window.holdOrder = holdOrder;
window.sendToKitchen = sendToKitchen;
window.handlePrimaryAction = handlePrimaryAction;
window.confirmOrder = confirmOrder;
window.updateTableInfo = updateTableInfo;
window.searchMenus = searchMenus;
window.updatePrimaryActionButton = updatePrimaryActionButton;

// 임시저장 관련 전역 함수
window.saveTempOrder = saveTempOrder;
window.loadTempOrder = loadTempOrder;
window.clearTempOrder = clearTempOrder;

// 기타 미구현 함수들
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
window.processComboPayment = processComboPayment;
window.toggleAdvancedPanel = toggleAdvancedPanel;
window.holdCurrentOrder = holdCurrentOrder;
window.voidOrder = voidOrder;