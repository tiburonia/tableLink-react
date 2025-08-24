
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
    
    // URL에서 매장 ID 추출
    const urlParts = window.location.pathname.split('/');
    const storeId = urlParts[2]; // /pos/:storeId
    
    if (storeId) {
      console.log(`📟 URL에서 매장 ID 감지: ${storeId}`);
      await loadStoreById(storeId);
    } else {
      // 매장 정보 로드
      await loadStoreData();
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
          <select id="tableSelect" onchange="selectTable(this.value)">
            <option value="">테이블을 선택하세요</option>
          </select>
        </div>
        
        <div class="order-list" id="orderList">
          <div class="empty-order">주문할 메뉴를 선택해주세요</div>
        </div>
        
        <div class="order-summary" id="orderSummary" style="display: none;">
          <div class="summary-row">
            <span>총 수량:</span>
            <span id="totalItems">0개</span>
          </div>
          <div class="summary-row">
            <span>소계:</span>
            <span id="subtotal">0원</span>
          </div>
          <div class="summary-row total">
            <span>총 금액:</span>
            <span id="totalAmount">0원</span>
          </div>
        </div>
        
        <div class="order-actions">
          <button onclick="clearOrder()" class="clear-btn">전체 삭제</button>
          <button onclick="processPayment()" id="payBtn" class="pay-btn" disabled>결제하기</button>
        </div>
      </div>
    </div>
  `;
}

// 매장 선택
async function selectStore() {
  try {
    console.log('🏪 매장 선택 모달 표시');
    
    const response = await fetch('/api/stores');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('매장 목록 조회 실패');
    }
    
    const stores = data.stores;
    
    // 매장 선택 모달 생성
    const modal = document.createElement('div');
    modal.className = 'store-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>매장 선택</h3>
          <button onclick="closeStoreModal()" class="close-btn">×</button>
        </div>
        <div class="store-list">
          ${stores.map(store => `
            <div class="store-item" onclick="chooseStore(${store.id}, '${store.name}', '${store.category}')">
              <div class="store-name">${store.name}</div>
              <div class="store-category">${store.category}</div>
              <div class="store-status ${store.isOpen ? 'open' : 'closed'}">
                ${store.isOpen ? '영업중' : '영업종료'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
  } catch (error) {
    console.error('❌ 매장 선택 실패:', error);
    showError('매장 목록을 불러오는데 실패했습니다.');
  }
}

// 매장 선택 완료
async function chooseStore(storeId, storeName, storeCategory) {
  try {
    console.log(`🏪 매장 선택: ${storeName} (ID: ${storeId})`);
    
    // 매장 정보 저장
    currentStore = { id: storeId, name: storeName, category: storeCategory };
    
    // UI 업데이트
    document.getElementById('storeName').textContent = storeName;
    document.getElementById('storeCategory').textContent = storeCategory;
    
    // 매장 상세 정보 로드
    await loadStoreDetails(storeId);
    
    // 모달 닫기
    closeStoreModal();
    
    console.log('✅ 매장 선택 완료');
    
  } catch (error) {
    console.error('❌ 매장 선택 실패:', error);
    showError('매장 정보를 불러오는데 실패했습니다.');
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
    allMenus = store.menu || [];
    
    // 메뉴 카테고리 생성
    createMenuCategories();
    
    // 메뉴 표시
    displayMenus();
    
    // 테이블 목록 로드
    loadTables(store.tables || []);
    
  } catch (error) {
    console.error('❌ 매장 상세 정보 로드 실패:', error);
    throw error;
  }
}

// 메뉴 카테고리 생성
function createMenuCategories() {
  const categoriesDiv = document.getElementById('menuCategories');
  
  // 고유 카테고리 추출
  const uniqueCategories = [...new Set(allMenus.map(menu => menu.category || '기타'))];
  categories = ['all', ...uniqueCategories];
  
  categoriesDiv.innerHTML = categories.map(category => `
    <button class="category-btn ${category === selectedCategory ? 'active' : ''}" 
            onclick="selectCategory('${category}')">
      ${category === 'all' ? '전체' : category}
    </button>
  `).join('');
}

// 카테고리 선택
function selectCategory(category) {
  selectedCategory = category;
  
  // 카테고리 버튼 활성화 상태 업데이트
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // 메뉴 표시
  displayMenus();
}

// 메뉴 표시
function displayMenus() {
  const menuGrid = document.getElementById('menuGrid');
  
  let filteredMenus = allMenus;
  if (selectedCategory !== 'all') {
    filteredMenus = allMenus.filter(menu => (menu.category || '기타') === selectedCategory);
  }
  
  if (filteredMenus.length === 0) {
    menuGrid.innerHTML = '<div class="no-menu">해당 카테고리에 메뉴가 없습니다</div>';
    return;
  }
  
  menuGrid.innerHTML = filteredMenus.map(menu => `
    <div class="menu-item ${!menu.isAvailable ? 'disabled' : ''}" 
         onclick="${menu.isAvailable ? `addToOrder('${menu.name}', ${menu.price})` : ''}">
      <div class="menu-image">🍽️</div>
      <div class="menu-info">
        <div class="menu-name">${menu.name}</div>
        <div class="menu-price">${menu.price?.toLocaleString()}원</div>
        <div class="menu-desc">${menu.description || ''}</div>
      </div>
    </div>
  `).join('');
}

// 테이블 목록 로드
function loadTables(tables) {
  const tableSelect = document.getElementById('tableSelect');
  
  tableSelect.innerHTML = '<option value="">테이블을 선택하세요</option>';
  
  tables.forEach(table => {
    const option = document.createElement('option');
    option.value = table.tableNumber;
    option.textContent = `${table.tableName} (${table.seats}석) ${table.isOccupied ? '[사용중]' : ''}`;
    option.disabled = table.isOccupied;
    tableSelect.appendChild(option);
  });
}

// 테이블 선택
function selectTable(tableNumber) {
  currentTable = tableNumber;
  console.log(`🪑 테이블 선택: ${tableNumber}`);
  updateOrderSummary();
}

// 주문에 메뉴 추가
function addToOrder(menuName, menuPrice) {
  console.log(`➕ 메뉴 추가: ${menuName} (${menuPrice}원)`);
  
  // 기존 항목 찾기
  const existingItem = currentOrder.find(item => item.name === menuName);
  
  if (existingItem) {
    existingItem.quantity += 1;
    existingItem.totalPrice = existingItem.price * existingItem.quantity;
  } else {
    currentOrder.push({
      name: menuName,
      price: menuPrice,
      quantity: 1,
      totalPrice: menuPrice
    });
  }
  
  renderOrderList();
  updateOrderSummary();
}

// 주문 목록 렌더링
function renderOrderList() {
  const orderList = document.getElementById('orderList');
  
  if (currentOrder.length === 0) {
    orderList.innerHTML = '<div class="empty-order">주문할 메뉴를 선택해주세요</div>';
    return;
  }
  
  orderList.innerHTML = currentOrder.map((item, index) => `
    <div class="order-item">
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-price">${item.price.toLocaleString()}원</div>
      </div>
      <div class="item-controls">
        <button onclick="changeQuantity(${index}, -1)" class="qty-btn">-</button>
        <span class="quantity">${item.quantity}</span>
        <button onclick="changeQuantity(${index}, 1)" class="qty-btn">+</button>
        <button onclick="removeItem(${index})" class="remove-btn">삭제</button>
      </div>
    </div>
  `).join('');
}

// 수량 변경
function changeQuantity(index, change) {
  const item = currentOrder[index];
  item.quantity += change;
  
  if (item.quantity <= 0) {
    currentOrder.splice(index, 1);
  } else {
    item.totalPrice = item.price * item.quantity;
  }
  
  renderOrderList();
  updateOrderSummary();
}

// 아이템 제거
function removeItem(index) {
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
      userId: 'pos-user', // POS 전용 사용자
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
    
    if (!result.success) {
      throw new Error(result.error || '결제 실패');
    }
    
    console.log('✅ 결제 성공:', result);
    
    // 성공 메시지 표시
    alert(`결제가 완료되었습니다!\n주문번호: ${result.result.orderId}\n총 금액: ${totalAmount.toLocaleString()}원`);
    
    // 주문 초기화
    currentOrder = [];
    currentTable = null;
    document.getElementById('tableSelect').value = '';
    renderOrderList();
    updateOrderSummary();
    
  } catch (error) {
    console.error('❌ 결제 실패:', error);
    alert('결제에 실패했습니다: ' + error.message);
  }
}

// 매장 선택 모달 닫기
function closeStoreModal() {
  const modal = document.querySelector('.store-modal');
  if (modal) {
    modal.remove();
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
    
    // 매장 정보 설정
    currentStore = { 
      id: parseInt(storeId), 
      name: store.name, 
      category: store.category || '기타' 
    };
    
    // UI 업데이트
    document.getElementById('storeName').textContent = store.name;
    document.getElementById('storeCategory').textContent = store.category || '기타';
    
    // 매장 상세 정보 로드
    await loadStoreDetails(storeId);
    
    console.log(`✅ 매장 ${store.name} 로드 완료`);
    
  } catch (error) {
    console.error('❌ 매장 직접 로드 실패:', error);
    showError('매장 정보를 불러오는데 실패했습니다.');
  }
}

// 초기 매장 데이터 로드
async function loadStoreData() {
  // 현재는 매장 선택 버튼을 통해 로드하므로 별도 처리 없음
  console.log('📊 POS 시스템 준비 완료');
}

// 에러 표시
function showError(message) {
  alert(message);
}

// 전역 함수들을 window 객체에 등록
window.renderPOS = renderPOS;
window.selectStore = selectStore;
window.chooseStore = chooseStore;
window.closeStoreModal = closeStoreModal;
window.selectCategory = selectCategory;
window.selectTable = selectTable;
window.addToOrder = addToOrder;
window.changeQuantity = changeQuantity;
window.removeItem = removeItem;
window.clearOrder = clearOrder;
window.processPayment = processPayment;
