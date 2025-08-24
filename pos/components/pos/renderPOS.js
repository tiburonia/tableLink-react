
// POS 시스템 상태
let currentStore = null;
let currentTable = null;
let currentOrder = [];
let allMenus = [];
let categories = [];
let selectedCategory = 'all';

// POS 시스템 초기화
async function renderPOS() {
  try {
    console.log('📟 POS 시스템 초기화 중...');
    
    // 기본 UI 렌더링
    renderPOSLayout();
    
    // 매장 정보 로드
    await loadStoreData();
    
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
      <!-- 왼쪽 메뉴 패널 -->
      <div class="menu-panel">
        <div class="menu-header">
          <h1>🍽️ TableLink POS</h1>
          <p>포스기 시스템</p>
        </div>
        
        <div class="store-info">
          <div>
            <span id="storeName">매장을 선택해주세요</span>
            <span id="storeCategory" style="margin-left: 15px; opacity: 0.8;"></span>
          </div>
          <button onclick="selectStore()" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
            매장 선택
          </button>
        </div>
        
        <div class="menu-categories" id="menuCategories">
          <button class="category-btn active" onclick="selectCategory('all')">전체</button>
        </div>
        
        <div class="menu-grid" id="menuGrid">
          <div class="loading">매장을 선택하여 메뉴를 불러오세요</div>
        </div>
      </div>
      
      <!-- 오른쪽 주문 패널 -->
      <div class="order-panel">
        <div class="order-header">
          <h2>📋 주문 내역</h2>
        </div>
        
        <div class="table-selector">
          <span>테이블 선택:</span>
          <select id="tableSelect" class="table-select" onchange="selectTable(this.value)">
            <option value="">테이블을 선택하세요</option>
          </select>
        </div>
        
        <div class="order-list" id="orderList">
          <div class="empty-order">
            <h3>주문 내역이 없습니다</h3>
            <p>메뉴를 선택해주세요</p>
          </div>
        </div>
        
        <div class="order-summary" id="orderSummary" style="display: none;">
          <div class="summary-row">
            <span>주문 수량:</span>
            <span id="totalItems">0개</span>
          </div>
          <div class="summary-row">
            <span>주문 금액:</span>
            <span id="subtotal">0원</span>
          </div>
          <div class="total-row">
            <span>총 금액:</span>
            <span id="totalAmount">0원</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <button class="btn btn-clear" onclick="clearOrder()">전체 삭제</button>
          <button class="btn btn-pay" id="payBtn" onclick="processPayment()" disabled>결제하기</button>
        </div>
      </div>
    </div>
  `;
}

// 매장 선택
async function selectStore() {
  try {
    console.log('🏪 매장 선택 창 열기');
    
    // 간단한 매장 선택을 위해 기본 매장 사용
    const storeId = prompt('매장 ID를 입력하세요 (예: 4549):');
    if (!storeId) return;
    
    console.log(`📍 매장 ${storeId} 정보 로드 중...`);
    
    const response = await fetch(`/api/stores/${storeId}`);
    if (!response.ok) throw new Error('매장 정보를 불러올 수 없습니다');
    
    const data = await response.json();
    currentStore = data.store;
    
    // UI 업데이트
    document.getElementById('storeName').textContent = currentStore.name;
    document.getElementById('storeCategory').textContent = currentStore.category;
    
    // 메뉴 및 테이블 정보 로드
    await loadMenuData();
    await loadTableData();
    
    console.log(`✅ 매장 선택 완료: ${currentStore.name}`);
    
  } catch (error) {
    console.error('❌ 매장 선택 실패:', error);
    showError('매장 정보를 불러오는데 실패했습니다.');
  }
}

// 매장 데이터 로드
async function loadStoreData() {
  // 기본적으로 빈 상태로 시작
  console.log('📊 매장 데이터 로드 대기 중...');
}

// 메뉴 데이터 로드
async function loadMenuData() {
  try {
    if (!currentStore) return;
    
    console.log(`🍽️ 매장 ${currentStore.id} 메뉴 로드 중...`);
    
    allMenus = currentStore.menu || [];
    
    // 카테고리 추출
    const categorySet = new Set(['all']);
    allMenus.forEach(menu => {
      if (menu.category) categorySet.add(menu.category);
    });
    categories = Array.from(categorySet);
    
    // 카테고리 버튼 렌더링
    renderCategories();
    
    // 메뉴 그리드 렌더링
    renderMenuGrid();
    
    console.log(`✅ 메뉴 ${allMenus.length}개 로드 완료`);
    
  } catch (error) {
    console.error('❌ 메뉴 로드 실패:', error);
    showError('메뉴를 불러오는데 실패했습니다.');
  }
}

// 테이블 데이터 로드
async function loadTableData() {
  try {
    if (!currentStore) return;
    
    console.log(`🪑 매장 ${currentStore.id} 테이블 정보 로드 중...`);
    
    const tableSelect = document.getElementById('tableSelect');
    tableSelect.innerHTML = '<option value="">테이블을 선택하세요</option>';
    
    if (currentStore.tables && currentStore.tables.length > 0) {
      currentStore.tables.forEach(table => {
        const option = document.createElement('option');
        option.value = table.tableNumber;
        option.textContent = `${table.tableName} (${table.seats}석)${table.isOccupied ? ' - 사용중' : ''}`;
        option.disabled = table.isOccupied;
        tableSelect.appendChild(option);
      });
    }
    
    console.log(`✅ 테이블 ${currentStore.tables?.length || 0}개 로드 완료`);
    
  } catch (error) {
    console.error('❌ 테이블 로드 실패:', error);
    showError('테이블 정보를 불러오는데 실패했습니다.');
  }
}

// 카테고리 렌더링
function renderCategories() {
  const categoriesContainer = document.getElementById('menuCategories');
  
  categoriesContainer.innerHTML = categories.map(category => `
    <button class="category-btn ${category === selectedCategory ? 'active' : ''}" 
            onclick="selectCategory('${category}')">
      ${category === 'all' ? '전체' : category}
    </button>
  `).join('');
}

// 메뉴 그리드 렌더링
function renderMenuGrid() {
  const menuGrid = document.getElementById('menuGrid');
  
  let filteredMenus = allMenus;
  if (selectedCategory !== 'all') {
    filteredMenus = allMenus.filter(menu => menu.category === selectedCategory);
  }
  
  if (filteredMenus.length === 0) {
    menuGrid.innerHTML = '<div class="loading">메뉴가 없습니다</div>';
    return;
  }
  
  menuGrid.innerHTML = filteredMenus.map(menu => `
    <div class="menu-item" onclick="addToOrder('${menu.name}', ${menu.price})">
      <div class="menu-item-name">${menu.name}</div>
      <div class="menu-item-price">${menu.price?.toLocaleString()}원</div>
      ${menu.description ? `<div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">${menu.description}</div>` : ''}
    </div>
  `).join('');
}

// 카테고리 선택
function selectCategory(category) {
  selectedCategory = category;
  renderCategories();
  renderMenuGrid();
}

// 테이블 선택
function selectTable(tableNumber) {
  currentTable = tableNumber;
  console.log(`🪑 테이블 선택: ${tableNumber}`);
  updateOrderSummary();
}

// 주문에 메뉴 추가
function addToOrder(menuName, price) {
  console.log(`➕ 메뉴 추가: ${menuName} (${price}원)`);
  
  const existingItem = currentOrder.find(item => item.name === menuName);
  
  if (existingItem) {
    existingItem.quantity += 1;
    existingItem.totalPrice = existingItem.price * existingItem.quantity;
  } else {
    currentOrder.push({
      name: menuName,
      price: price,
      quantity: 1,
      totalPrice: price
    });
  }
  
  renderOrderList();
  updateOrderSummary();
}

// 주문 목록 렌더링
function renderOrderList() {
  const orderList = document.getElementById('orderList');
  
  if (currentOrder.length === 0) {
    orderList.innerHTML = `
      <div class="empty-order">
        <h3>주문 내역이 없습니다</h3>
        <p>메뉴를 선택해주세요</p>
      </div>
    `;
    return;
  }
  
  orderList.innerHTML = currentOrder.map((item, index) => `
    <div class="order-item">
      <div class="item-details">
        <div class="item-name">${item.name}</div>
        <div class="item-price">${item.price.toLocaleString()}원</div>
      </div>
      <div class="quantity-controls">
        <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
        <span style="margin: 0 10px; font-weight: bold;">${item.quantity}</span>
        <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
        <button class="remove-btn" onclick="removeFromOrder(${index})">삭제</button>
      </div>
    </div>
  `).join('');
}

// 수량 변경
function updateQuantity(index, change) {
  const item = currentOrder[index];
  item.quantity += change;
  
  if (item.quantity <= 0) {
    removeFromOrder(index);
    return;
  }
  
  item.totalPrice = item.price * item.quantity;
  renderOrderList();
  updateOrderSummary();
}

// 주문에서 제거
function removeFromOrder(index) {
  currentOrder.splice(index, 1);
  renderOrderList();
  updateOrderSummary();
}

// 주문 요약 업데이트
function updateOrderSummary() {
  const orderSummary = document.getElementById('orderSummary');
  const payBtn = document.getElementById('payBtn');
  
  if (currentOrder.length === 0) {
    orderSummary.style.display = 'none';
    payBtn.disabled = true;
    return;
  }
  
  orderSummary.style.display = 'block';
  
  const totalItems = currentOrder.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = currentOrder.reduce((sum, item) => sum + item.totalPrice, 0);
  
  document.getElementById('totalItems').textContent = `${totalItems}개`;
  document.getElementById('subtotal').textContent = `${totalAmount.toLocaleString()}원`;
  document.getElementById('totalAmount').textContent = `${totalAmount.toLocaleString()}원`;
  
  payBtn.disabled = !currentTable || currentOrder.length === 0;
}

// 전체 삭제
function clearOrder() {
  if (currentOrder.length === 0) return;
  
  if (confirm('모든 주문을 삭제하시겠습니까?')) {
    currentOrder = [];
    renderOrderList();
    updateOrderSummary();
    console.log('🗑️ 전체 주문 삭제 완료');
  }
}

// 결제 처리
async function processPayment() {
  try {
    if (!currentStore || !currentTable || currentOrder.length === 0) {
      alert('매장, 테이블, 주문 정보를 모두 확인해주세요.');
      return;
    }
    
    console.log('💳 결제 처리 시작');
    
    const totalAmount = currentOrder.reduce((sum, item) => sum + item.totalPrice, 0);
    
    const orderData = {
      userId: 'pos_order', // POS 주문 임시 사용자
      storeId: currentStore.id,
      storeName: currentStore.name,
      tableNumber: currentTable,
      orderData: {
        items: currentOrder.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: totalAmount,
        storeName: currentStore.name,
        tableNumber: currentTable
      },
      usedPoint: 0,
      finalTotal: totalAmount,
      selectedCouponId: null,
      couponDiscount: 0
    };
    
    const response = await fetch('/api/orders/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`결제 완료!\n주문번호: ${result.result.orderId}\n총 금액: ${totalAmount.toLocaleString()}원`);
      
      // 주문 초기화
      currentOrder = [];
      currentTable = null;
      document.getElementById('tableSelect').value = '';
      renderOrderList();
      updateOrderSummary();
      
      console.log('✅ 결제 완료:', result.result.orderId);
    } else {
      throw new Error(result.error || '결제 실패');
    }
    
  } catch (error) {
    console.error('❌ 결제 실패:', error);
    alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
  }
}

// 에러 표시
function showError(message) {
  const main = document.getElementById('main');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.textContent = message;
  main.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// 전역 함수 등록
window.renderPOS = renderPOS;
window.selectStore = selectStore;
window.selectCategory = selectCategory;
window.selectTable = selectTable;
window.addToOrder = addToOrder;
window.updateQuantity = updateQuantity;
window.removeFromOrder = removeFromOrder;
window.clearOrder = clearOrder;
window.processPayment = processPayment;
