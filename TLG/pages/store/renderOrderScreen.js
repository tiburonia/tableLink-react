
/**
 * TLL 주문 화면 렌더링 (현재 스키마에 맞게 완전 재구현)
 */
window.renderOrderScreen = async function(store, tableName, tableNumber) {
  try {
    console.log('🛒 TLL 주문 화면 로드:', { store: store.name, table: tableName, tableNum: tableNumber });

    // 사용자 정보 확인
    const userInfo = getUserInfo();
    if (!userInfo) {
      alert('로그인이 필요합니다.');
      renderLogin();
      return;
    }

    // 테이블 정보 정규화
    let finalTableNumber = parseInt(tableNumber) || 1;
    let finalTableName = tableName || `${finalTableNumber}번 테이블`;

    console.log(`🔍 TLL 최종 테이블 정보: ${finalTableName} (번호: ${finalTableNumber})`);

    // 메뉴 데이터 로드
    let menuData = [];
    try {
      console.log('🔄 매장 메뉴 데이터 로드 중...');
      const menuResponse = await fetch(`/api/stores/${store.id}/menu`);
      if (menuResponse.ok) {
        const menuResult = await menuResponse.json();
        if (menuResult.success) {
          menuData = menuResult.menu || [];
        }
      }
      
      if (menuData.length === 0) {
        console.warn('⚠️ 메뉴 데이터가 없어 기본 메뉴 사용');
        menuData = getDefaultMenu();
      }
    } catch (menuError) {
      console.warn('⚠️ 메뉴 로드 오류:', menuError);
      menuData = getDefaultMenu();
    }

    // 메뉴를 카테고리별로 그룹화
    const menuByCategory = groupMenuByCategory(menuData);

    // 주문 화면 렌더링
    renderOrderHTML(store, finalTableName, finalTableNumber, menuByCategory);

    // 전역 변수 설정 (장바구니 관리용)
    window.currentTLLOrder = {
      storeId: store.id,
      storeName: store.name,
      tableName: finalTableName,
      tableNumber: finalTableNumber,
      cart: [],
      userInfo: userInfo
    };

    // 이벤트 리스너 설정
    setupOrderEvents();

    console.log('✅ TLL 주문 화면 렌더링 완료');

  } catch (error) {
    console.error('❌ TLL 주문 화면 로드 실패:', error);
    alert('주문 화면 로드에 실패했습니다: ' + error.message);
    TLL();
  }
};

// 주문 화면 HTML 렌더링
function renderOrderHTML(store, tableName, tableNumber, menuByCategory) {
  const main = document.getElementById('main');
  if (!main) {
    console.error('❌ main 요소를 찾을 수 없습니다');
    return;
  }

  main.innerHTML = `
    <div class="tll-order-container">
      <!-- 헤더 -->
      <div class="order-header">
        <button class="back-btn" onclick="TLL()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
          뒤로가기
        </button>
        <div class="store-info">
          <h1>${store.name}</h1>
          <p class="table-info">${tableName}</p>
        </div>
      </div>

      <!-- 메인 컨텐츠 -->
      <div class="order-main">
        <!-- 메뉴 섹션 -->
        <div class="menu-section">
          <div class="menu-header">
            <h2>메뉴</h2>
            <div class="category-tabs" id="categoryTabs">
              ${renderCategoryTabs(menuByCategory)}
            </div>
          </div>
          <div class="menu-content" id="menuContent">
            ${renderMenuContent(menuByCategory)}
          </div>
        </div>

        <!-- 장바구니 섹션 -->
        <div class="cart-section">
          <div class="cart-header">
            <h2>주문 내역</h2>
            <span class="cart-count" id="cartCount">0</span>
          </div>
          <div class="cart-content" id="cartContent">
            <div class="empty-cart">
              <div class="empty-icon">🛒</div>
              <p>메뉴를 선택해주세요</p>
            </div>
          </div>
          <div class="cart-footer">
            <div class="total-price">
              <span>총 금액</span>
              <strong id="totalPrice">0원</strong>
            </div>
            <button class="order-btn" id="orderBtn" disabled onclick="proceedToPayment()">
              주문하기
            </button>
          </div>
        </div>
      </div>
    </div>

    ${getOrderScreenStyles()}
  `;
}

// 카테고리 탭 렌더링
function renderCategoryTabs(menuByCategory) {
  const categories = Object.keys(menuByCategory);
  
  if (categories.length <= 1) {
    return '';
  }

  return categories.map((category, index) => `
    <button class="category-tab ${index === 0 ? 'active' : ''}" 
            onclick="switchCategory('${category}')" 
            data-category="${category}">
      ${category}
    </button>
  `).join('');
}

// 메뉴 컨텐츠 렌더링
function renderMenuContent(menuByCategory) {
  return Object.entries(menuByCategory).map(([category, items], index) => `
    <div class="menu-category ${index === 0 ? 'active' : ''}" data-category="${category}">
      <div class="menu-grid">
        ${items.map(item => `
          <div class="menu-item" onclick="addToCart(${item.id}, '${escapeHtml(item.name)}', ${item.price})">
            <div class="menu-item-content">
              <h3 class="menu-name">${escapeHtml(item.name)}</h3>
              <p class="menu-description">${escapeHtml(item.description)}</p>
              <div class="menu-price">${item.price.toLocaleString()}원</div>
            </div>
            <button class="add-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5v14m7-7H5"/>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// 메뉴를 카테고리별로 그룹화
function groupMenuByCategory(menuData) {
  const grouped = {};
  
  menuData.forEach(item => {
    const category = item.category || '일반';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });

  // 카테고리가 없으면 기본 카테고리 생성
  if (Object.keys(grouped).length === 0) {
    grouped['일반'] = menuData;
  }

  return grouped;
}

// 카테고리 전환
window.switchCategory = function(category) {
  // 탭 활성화
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.category === category);
  });

  // 메뉴 카테고리 표시
  document.querySelectorAll('.menu-category').forEach(categoryDiv => {
    categoryDiv.classList.toggle('active', categoryDiv.dataset.category === category);
  });
};

// 장바구니에 추가
window.addToCart = function(menuId, menuName, price) {
  if (!window.currentTLLOrder) return;

  const existingItem = window.currentTLLOrder.cart.find(item => item.id === menuId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    window.currentTLLOrder.cart.push({
      id: menuId,
      name: menuName,
      price: price,
      quantity: 1
    });
  }

  updateCartDisplay();
  console.log('🛒 장바구니에 추가:', menuName);
};

// 장바구니 표시 업데이트
function updateCartDisplay() {
  const cartContent = document.getElementById('cartContent');
  const cartCount = document.getElementById('cartCount');
  const totalPrice = document.getElementById('totalPrice');
  const orderBtn = document.getElementById('orderBtn');

  if (!window.currentTLLOrder || window.currentTLLOrder.cart.length === 0) {
    cartContent.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>메뉴를 선택해주세요</p>
      </div>
    `;
    cartCount.textContent = '0';
    totalPrice.textContent = '0원';
    orderBtn.disabled = true;
    return;
  }

  let total = 0;
  const totalItems = window.currentTLLOrder.cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartHTML = window.currentTLLOrder.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    return `
      <div class="cart-item">
        <div class="item-info">
          <h4 class="item-name">${escapeHtml(item.name)}</h4>
          <p class="item-price">${item.price.toLocaleString()}원</p>
        </div>
        <div class="quantity-controls">
          <button class="qty-btn minus" onclick="updateQuantity(${item.id}, -1)">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="qty-btn plus" onclick="updateQuantity(${item.id}, 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart(${item.id})">×</button>
        </div>
      </div>
    `;
  }).join('');

  cartContent.innerHTML = cartHTML;
  cartCount.textContent = totalItems.toString();
  totalPrice.textContent = total.toLocaleString() + '원';
  orderBtn.disabled = false;
}

// 수량 변경
window.updateQuantity = function(menuId, change) {
  if (!window.currentTLLOrder) return;

  const item = window.currentTLLOrder.cart.find(item => item.id === menuId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(menuId);
  } else {
    updateCartDisplay();
  }
};

// 장바구니에서 제거
window.removeFromCart = function(menuId) {
  if (!window.currentTLLOrder) return;

  window.currentTLLOrder.cart = window.currentTLLOrder.cart.filter(item => item.id !== menuId);
  updateCartDisplay();
};

// 결제로 진행
window.proceedToPayment = async function() {
  try {
    if (!window.currentTLLOrder || window.currentTLLOrder.cart.length === 0) {
      alert('주문할 메뉴를 선택해주세요.');
      return;
    }

    const orderBtn = document.getElementById('orderBtn');
    orderBtn.disabled = true;
    orderBtn.textContent = '처리 중...';

    // 총액 계산
    const totalAmount = window.currentTLLOrder.cart.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);

    console.log('💳 TLL 결제 진행:', { 
      store: window.currentTLLOrder.storeName, 
      table: window.currentTLLOrder.tableName,
      items: window.currentTLLOrder.cart.length,
      total: totalAmount 
    });

    // 결제 화면으로 이동 (renderPay 호출)
    if (typeof renderPay === 'function') {
      // 임시 체크 데이터 생성 (기존 시스템과 호환)
      const tempCheckData = {
        id: `TLL_${Date.now()}`,
        storeId: window.currentTLLOrder.storeId,
        storeName: window.currentTLLOrder.storeName,
        tableName: window.currentTLLOrder.tableName,
        tableNumber: window.currentTLLOrder.tableNumber,
        items: window.currentTLLOrder.cart,
        totalAmount: totalAmount,
        source: 'TLL'
      };

      // 세션에 임시 저장
      sessionStorage.setItem('tllOrderData', JSON.stringify(tempCheckData));
      
      // 결제 화면으로 이동
      renderPay(tempCheckData);
    } else {
      throw new Error('결제 시스템을 로드할 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 결제 진행 실패:', error);
    alert('결제 진행 중 오류가 발생했습니다: ' + error.message);

    const orderBtn = document.getElementById('orderBtn');
    orderBtn.disabled = false;
    orderBtn.textContent = '주문하기';
  }
};

// 이벤트 설정
function setupOrderEvents() {
  // 이미 window 객체에 함수들이 등록되어 있으므로 추가 설정 불필요
  console.log('✅ TLL 주문 이벤트 설정 완료');
}

// 기본 메뉴 데이터
function getDefaultMenu() {
  return [
    { id: 1, name: '김치찌개', description: '돼지고기와 김치가 들어간 찌개', price: 8000, category: '찌개' },
    { id: 2, name: '된장찌개', description: '국산 콩으로 만든 된장찌개', price: 7000, category: '찌개' },
    { id: 3, name: '불고기', description: '양념에 재운 소고기 불고기', price: 15000, category: '메인' },
    { id: 4, name: '비빔밥', description: '각종 나물이 들어간 비빔밥', price: 9000, category: '메인' },
    { id: 5, name: '냉면', description: '시원한 물냉면', price: 10000, category: '면' }
  ];
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 사용자 정보 가져오기
function getUserInfo() {
  try {
    // 쿠키에서 사용자 정보 확인
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

    if (userInfoCookie) {
      const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
      return JSON.parse(userInfoValue);
    }

    // localStorage에서 사용자 정보 확인
    const localStorageUserInfo = localStorage.getItem('userInfo');
    if (localStorageUserInfo) {
      return JSON.parse(localStorageUserInfo);
    }

    // 전역 변수에서 사용자 정보 확인
    if (window.userInfo && window.userInfo.id) {
      return window.userInfo;
    }

    return null;
  } catch (error) {
    console.error('❌ 사용자 정보 파싱 오류:', error);
    return null;
  }
}

// 스타일
function getOrderScreenStyles() {
  return `
    <style>
      .tll-order-container {
        min-height: 100vh;
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
      }

      .order-header {
        background: white;
        padding: 16px 20px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        align-items: center;
        gap: 16px;
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .back-btn {
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        padding: 8px;
        border-radius: 6px;
        transition: background 0.2s;
      }

      .back-btn:hover {
        background: #f8f9fa;
      }

      .store-info h1 {
        margin: 0;
        font-size: 20px;
        color: #333;
      }

      .table-info {
        margin: 0;
        color: #666;
        font-size: 14px;
      }

      .order-main {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 20px;
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
      }

      .menu-section {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }

      .menu-header {
        margin-bottom: 24px;
      }

      .menu-header h2 {
        margin: 0 0 16px 0;
        font-size: 24px;
        color: #333;
      }

      .category-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .category-tab {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 20px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        color: #666;
        transition: all 0.2s;
      }

      .category-tab.active {
        background: #007bff;
        border-color: #007bff;
        color: white;
      }

      .category-tab:hover:not(.active) {
        background: #e9ecef;
      }

      .menu-content {
        position: relative;
      }

      .menu-category {
        display: none;
      }

      .menu-category.active {
        display: block;
      }

      .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }

      .menu-item {
        border: 2px solid #e9ecef;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
      }

      .menu-item:hover {
        border-color: #007bff;
        box-shadow: 0 4px 12px rgba(0,123,255,0.15);
        transform: translateY(-2px);
      }

      .menu-item-content {
        flex: 1;
      }

      .menu-name {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .menu-description {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #666;
        line-height: 1.4;
      }

      .menu-price {
        font-size: 16px;
        font-weight: 700;
        color: #007bff;
      }

      .add-btn {
        background: #007bff;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        margin-left: 16px;
      }

      .add-btn:hover {
        background: #0056b3;
        transform: scale(1.1);
      }

      .cart-section {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
        height: fit-content;
        position: sticky;
        top: 100px;
      }

      .cart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .cart-header h2 {
        margin: 0;
        font-size: 20px;
        color: #333;
      }

      .cart-count {
        background: #007bff;
        color: white;
        border-radius: 12px;
        padding: 4px 12px;
        font-size: 14px;
        font-weight: 600;
      }

      .cart-content {
        flex: 1;
        min-height: 200px;
        margin-bottom: 20px;
      }

      .empty-cart {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #999;
        text-align: center;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .cart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid #f1f3f5;
      }

      .cart-item:last-child {
        border-bottom: none;
      }

      .item-info {
        flex: 1;
      }

      .item-name {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }

      .item-price {
        margin: 0;
        font-size: 12px;
        color: #666;
      }

      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .qty-btn {
        width: 28px;
        height: 28px;
        border: 1px solid #dee2e6;
        background: #f8f9fa;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.2s;
      }

      .qty-btn:hover {
        background: #e9ecef;
      }

      .quantity {
        min-width: 24px;
        text-align: center;
        font-weight: 600;
        font-size: 14px;
      }

      .remove-btn {
        width: 28px;
        height: 28px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        margin-left: 8px;
        transition: all 0.2s;
      }

      .remove-btn:hover {
        background: #c82333;
      }

      .cart-footer {
        border-top: 1px solid #e9ecef;
        padding-top: 20px;
      }

      .total-price {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        font-size: 18px;
      }

      .total-price strong {
        color: #007bff;
        font-size: 20px;
      }

      .order-btn {
        width: 100%;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 16px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .order-btn:hover:not(:disabled) {
        background: #218838;
        transform: translateY(-1px);
      }

      .order-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
      }

      @media (max-width: 1024px) {
        .order-main {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .cart-section {
          position: static;
        }
      }

      @media (max-width: 768px) {
        .order-main {
          padding: 16px;
        }

        .menu-section,
        .cart-section {
          padding: 16px;
        }

        .menu-grid {
          grid-template-columns: 1fr;
        }

        .menu-item {
          padding: 16px;
        }
      }
    </style>
  `;
}

console.log('✅ TLL 주문 화면 모듈 로드 완료 (새 버전)');
