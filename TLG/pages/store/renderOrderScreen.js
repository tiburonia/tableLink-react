/**
 * TLL 주문 화면 렌더링 (TLG 비율 390px × 760px 최적화)
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

    // 메뉴 데이터 로드 (새 스키마 대응)
    let menuData = [];
    try {
      console.log('🔄 매장 메뉴 데이터 로드 중...');
      const menuResponse = await fetch(`/api/stores/${store.id}/menu/tll`);
      if (menuResponse.ok) {
        const menuResult = await menuResponse.json();
        console.log('📋 메뉴 API 응답:', menuResult);

        if (menuResult.success && menuResult.menu) {
          menuData = menuResult.menu;
          console.log(`✅ 매장 ${store.id} 메뉴 ${menuData.length}개 로드 완료`);
        } else {
          console.warn('⚠️ API 응답에서 메뉴 데이터가 없음');
          menuData = [];
        }
      } else {
        console.warn('⚠️ 메뉴 API 호출 실패:', menuResponse.status);
        menuData = [];
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

    console.log('🏪 currentTLLOrder 초기화 완료:', window.currentTLLOrder);

    // 장바구니 초기 상태 확인
    if (!window.currentTLLOrder.cart) {
      console.warn('⚠️ cart 배열이 누락되어 재초기화');
      window.currentTLLOrder.cart = [];
    }

    // 이벤트 리스너 설정
    setupOrderEvents();

    console.log('✅ TLL 주문 화면 렌더링 완료');

  } catch (error) {
    console.error('❌ TLL 주문 화면 로드 실패:', error);
    alert('주문 화면 로드에 실패했습니다: ' + error.message);
    TLL();
  }
};

// 주문 화면 HTML 렌더링 (TLG 비율 최적화)
function renderOrderHTML(store, tableName, tableNumber, menuByCategory) {
  const main = document.getElementById('main');
  if (!main) {
    console.error('❌ main 요소를 찾을 수 없습니다');
    return;
  }

  main.innerHTML = `
    <div class="tll-order-screen">
      <!-- 헤더 (고정) -->
      <div class="tll-header">
        <button class="back-btn" onclick="TLL()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
          뒤로
        </button>
        <div class="store-info">
          <h1>${store.name}</h1>
          <p>${tableName}</p>
        </div>
        <div class="cart-indicator" onclick="toggleCart()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM1 2v2h2l3.6 7.59-1.35 2.41C5.08 14.42 5.37 15 6 15h12v-2H6l1.1-2h7.45c.75 0 1.42-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
          </svg>
          <span id="cartCount">0</span>
        </div>
      </div>

      <!-- 메뉴 컨텐츠 (스크롤) -->
      <div class="tll-content">
        <!-- 카테고리 탭 -->
        <div class="category-tabs" id="categoryTabs">
          ${renderCategoryTabs(menuByCategory)}
        </div>

        <!-- 메뉴 그리드 -->
        <div class="menu-container" id="menuContainer">
          ${renderMenuContent(menuByCategory)}
        </div>
      </div>

      <!-- 장바구니 패널 (하단 슬라이드) -->
      <div class="cart-panel" id="cartPanel">
        <div class="cart-handle" onclick="toggleCart()">
          <div class="handle-bar"></div>
        </div>
        <div class="cart-content" id="cartContent">
          <div class="cart-header">
            <h3>주문 내역</h3>
            <span class="cart-total" id="cartTotal">0원</span>
          </div>
          <div class="cart-items" id="cartItems">
            <div class="empty-cart">
              <div class="empty-icon">🛒</div>
              <p>메뉴를 선택해주세요</p>
            </div>
          </div>
          <button class="order-btn" id="orderBtn" disabled onclick="proceedToPayment()">
            주문하기
          </button>
        </div>
      </div>

      <!-- 오버레이 -->
      <div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
    </div>

    ${getTLLOrderStyles()}
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
          <div class="menu-item" onclick="addToCart('${item.id}', '${escapeHtml(item.name)}', ${item.price})">
            <div class="menu-info">
              <h4>${escapeHtml(item.name)}</h4>
              <p>${escapeHtml(item.description || '')}</p>
              <div class="menu-price">${item.price.toLocaleString()}원</div>
            </div>
            <button class="add-btn" onclick="event.stopPropagation(); addToCart('${item.id}', '${escapeHtml(item.name)}', ${item.price});">+</button>
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

// 장바구니 토글
window.toggleCart = function() {
  const cartPanel = document.getElementById('cartPanel');
  const cartOverlay = document.getElementById('cartOverlay');

  if (cartPanel.classList.contains('open')) {
    closeCart();
  } else {
    cartPanel.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
};

// 장바구니 닫기
window.closeCart = function() {
  const cartPanel = document.getElementById('cartPanel');
  const cartOverlay = document.getElementById('cartOverlay');

  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
};

// 장바구니에 추가
window.addToCart = function(menuId, menuName, price) {
  console.log('🛒 장바구니 추가 요청:', { menuId, menuName, price });

  // 전역 변수 존재 확인
  if (!window.currentTLLOrder) {
    console.error('❌ currentTLLOrder가 존재하지 않습니다');
    alert('주문 시스템 초기화 오류입니다. 페이지를 새로고침해주세요.');
    return;
  }

  // 장바구니 배열 존재 확인 및 초기화
  if (!window.currentTLLOrder.cart) {
    console.warn('⚠️ cart 배열이 초기화되지 않음, 새로 생성');
    window.currentTLLOrder.cart = [];
  }

  // 메뉴 ID와 가격 유효성 검사
  if (!menuId || !menuName || !price) {
    console.error('❌ 메뉴 정보가 유효하지 않습니다:', { menuId, menuName, price });
    alert('메뉴 정보에 오류가 있습니다.');
    return;
  }

  console.log('📝 장바구니 추가 전 상태:', {
    cartLength: window.currentTLLOrder.cart.length,
    cartItems: window.currentTLLOrder.cart
  });

  const existingItem = window.currentTLLOrder.cart.find(item => item.id === menuId);

  if (existingItem) {
    existingItem.quantity += 1;
    console.log('🔄 기존 아이템 수량 증가:', existingItem);
  } else {
    const newItem = {
      id: menuId,
      name: menuName,
      price: parseInt(price),
      quantity: 1
    };
    window.currentTLLOrder.cart.push(newItem);
    console.log('➕ 새 아이템 추가:', newItem);
  }

  console.log('📝 장바구니 추가 후 상태:', {
    cartLength: window.currentTLLOrder.cart.length,
    cartItems: window.currentTLLOrder.cart
  });

  // 장바구니 화면 업데이트
  try {
    updateCartDisplay();
    console.log('✅ 장바구니 화면 업데이트 완료');
  } catch (updateError) {
    console.error('❌ 장바구니 화면 업데이트 실패:', updateError);
  }

  // 장바구니 자동 열기 (첫 번째 아이템 추가시)
  if (window.currentTLLOrder.cart.length === 1 && window.currentTLLOrder.cart[0].quantity === 1) {
    setTimeout(() => {
      try {
        toggleCart();
      } catch (toggleError) {
        console.error('❌ 장바구니 자동 열기 실패:', toggleError);
      }
    }, 300);
  }

  console.log('🛒 장바구니에 추가 완료:', menuName, '총 아이템:', window.currentTLLOrder.cart.length);
};

// 장바구니 표시 업데이트
function updateCartDisplay() {
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const cartItems = document.getElementById('cartItems');
  const orderBtn = document.getElementById('orderBtn');

  if (!window.currentTLLOrder || window.currentTLLOrder.cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>메뉴를 선택해주세요</p>
      </div>
    `;
    cartCount.textContent = '0';
    cartTotal.textContent = '0원';
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
          <h4>${escapeHtml(item.name)}</h4>
          <div class="item-price">${item.price.toLocaleString()}원</div>
        </div>
        <div class="quantity-controls">
          <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
          <span class="quantity">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart(${item.id})">×</button>
        </div>
      </div>
    `;
  }).join('');

  cartItems.innerHTML = cartHTML;
  cartCount.textContent = totalItems.toString();
  cartTotal.textContent = total.toLocaleString() + '원';
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
    // 디버깅: 현재 상태 확인
    console.log('🔍 결제 진행 시 상태 확인:', {
      currentTLLOrder: window.currentTLLOrder,
      hasCart: window.currentTLLOrder?.cart,
      cartLength: window.currentTLLOrder?.cart?.length,
      cartItems: window.currentTLLOrder?.cart
    });

    // 전역 변수 존재 확인
    if (!window.currentTLLOrder) {
      console.error('❌ currentTLLOrder가 존재하지 않습니다');
      alert('주문 시스템에 오류가 있습니다. 페이지를 새로고침한 후 다시 시도해주세요.');
      return;
    }

    // 장바구니 배열 존재 및 내용 확인
    if (!window.currentTLLOrder.cart) {
      console.error('❌ cart 배열이 존재하지 않습니다');
      alert('장바구니가 초기화되지 않았습니다. 메뉴를 다시 선택해주세요.');
      return;
    }

    if (window.currentTLLOrder.cart.length === 0) {
      console.warn('⚠️ 장바구니가 비어있습니다');
      alert('주문할 메뉴를 선택해주세요.');
      return;
    }

    console.log('✅ 장바구니 검증 통과, 결제 진행');

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

    // 결제 화면으로 이동
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
  console.log('✅ TLL 주문 이벤트 설정 완료');
}

// 기본 메뉴 데이터 (새 스키마 형식)
function getDefaultMenu() {
  return [
    { id: 1, name: '김치찌개', description: '돼지고기와 김치가 들어간 찌개', price: 8000, category: '찌개류' },
    { id: 2, name: '된장찌개', description: '국산 콩으로 만든 된장찌개', price: 7000, category: '찌개류' },
    { id: 3, name: '불고기', description: '양념에 재운 소고기 불고기', price: 15000, category: '구이류' },
    { id: 4, name: '비빔밥', description: '각종 나물이 들어간 비빔밥', price: 9000, category: '밥류' },
    { id: 5, name: '냉면', description: '시원한 물냉면', price: 10000, category: '면류' },
    { id: 6, name: '공기밥', description: '갓 지은 따뜻한 쌀밥', price: 1000, category: '기타' }
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

// TLG 비율 최적화 스타일
function getTLLOrderStyles() {
  return `
    <style>
      .tll-order-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-width: 390px;
        max-height: 760px;
        margin: 0 auto;
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 1000;
      }

      /* 헤더 */
      .tll-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: white;
        padding: 12px 16px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 48px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }

      .back-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px;
        border-radius: 6px;
        font-size: 14px;
        transition: background 0.2s;
      }

      .back-btn:hover {
        background: #f1f3f5;
      }

      .store-info {
        flex: 1;
        text-align: center;
        margin: 0 16px;
      }

      .store-info h1 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        line-height: 1.2;
      }

      .store-info p {
        margin: 2px 0 0 0;
        font-size: 12px;
        color: #666;
      }

      .cart-indicator {
        position: relative;
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        transition: background 0.2s;
      }

      .cart-indicator:hover {
        background: #f1f3f5;
      }

      .cart-indicator span {
        position: absolute;
        top: 2px;
        right: 2px;
        background: #ff4757;
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: 600;
        min-width: 16px;
        text-align: center;
        line-height: 1.2;
      }

      /* 컨텐츠 영역 */
      .tll-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* 카테고리 탭 */
      .category-tabs {
        padding: 8px 16px;
        background: white;
        border-bottom: 1px solid #f1f3f5;
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .category-tabs::-webkit-scrollbar {
        display: none;
      }

      .category-tab {
        background: #f8f9fa;
        border: none;
        border-radius: 16px;
        padding: 6px 12px;
        font-size: 12px;
        color: #666;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .category-tab.active {
        background: #007bff;
        color: white;
      }

      /* 메뉴 컨테이너 */
      .menu-container {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }

      .menu-category {
        display: none;
      }

      .menu-category.active {
        display: block;
      }

      .menu-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .menu-item {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 14px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .menu-item:hover {
        border-color: #007bff;
        box-shadow: 0 4px 12px rgba(0,123,255,0.1);
      }

      .menu-info {
        flex: 1;
        min-width: 0;
      }

      .menu-info h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        line-height: 1.3;
      }

      .menu-info p {
        margin: 0 0 6px 0;
        font-size: 12px;
        color: #666;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .menu-price {
        font-size: 14px;
        font-weight: 700;
        color: #007bff;
      }

      .add-btn {
        background: #007bff;
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 16px;
        flex-shrink: 0;
      }

      .add-btn:hover {
        background: #0056b3;
        transform: scale(1.05);
      }

      /* 장바구니 패널 */
      .cart-panel {
        position: fixed;
        bottom: -100%;
        left: 0;
        width: 100%;
        max-width: 390px;
        height: 60%;
        background: white;
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -8px 32px rgba(0,0,0,0.15);
        transition: bottom 0.3s ease;
        z-index: 1010;
        display: flex;
        flex-direction: column;
      }

      .cart-panel.open {
        bottom: 0;
      }

      .cart-handle {
        padding: 8px 0;
        display: flex;
        justify-content: center;
        cursor: pointer;
        background: white;
        border-radius: 16px 16px 0 0;
      }

      .handle-bar {
        width: 40px;
        height: 4px;
        background: #dee2e6;
        border-radius: 2px;
      }

      .cart-content {
        flex: 1;
        padding: 0 16px 16px 16px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .cart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        border-bottom: 1px solid #f1f3f5;
        margin-bottom: 12px;
      }

      .cart-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .cart-total {
        font-size: 16px;
        font-weight: 700;
        color: #007bff;
      }

      .cart-items {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 16px;
      }

      .empty-cart {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 120px;
        color: #999;
        text-align: center;
      }

      .empty-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .cart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f8f9fa;
      }

      .cart-item:last-child {
        border-bottom: none;
      }

      .item-info h4 {
        margin: 0 0 4px 0;
        font-size: 13px;
        font-weight: 600;
        color: #333;
        line-height: 1.3;
      }

      .item-price {
        font-size: 12px;
        color: #666;
      }

      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .qty-btn {
        width: 24px;
        height: 24px;
        border: 1px solid #dee2e6;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        transition: all 0.2s;
      }

      .qty-btn:hover {
        background: #f8f9fa;
      }

      .quantity {
        min-width: 20px;
        text-align: center;
        font-size: 12px;
        font-weight: 600;
      }

      .remove-btn {
        width: 24px;
        height: 24px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.2s;
      }

      .remove-btn:hover {
        background: #c82333;
      }

      .order-btn {
        width: 100%;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 14px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: auto;
      }

      .order-btn:hover:not(:disabled) {
        background: #218838;
      }

      .order-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }

      /* 오버레이 */
      .cart-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.3);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1005;
      }

      .cart-overlay.open {
        opacity: 1;
        visibility: visible;
      }

      /* 반응형 (TLG 비율 유지) */
      @media (max-height: 600px) {
        .cart-panel {
          height: 70%;
        }
      }

      @media (max-width: 360px) {
        .tll-header {
          padding: 10px 12px;
        }

        .menu-container {
          padding: 12px;
        }

        .cart-content {
          padding: 0 12px 12px 12px;
        }
      }
    </style>
  `;
}

console.log('✅ TLL 주문 화면 모듈 로드 완료 (TLG 비율 최적화)');