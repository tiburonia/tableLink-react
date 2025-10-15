
import { OrderService } from './services/orderService.js';

/**
 * 비회원 전용 주문 화면 렌더링
 */
export async function renderGuestOrderScreen(store, tableName, tableNumber) {
  try {
    console.log('🎫 비회원 주문 화면 로드:', { store: store.id, table: tableName, tableNum: tableNumber });

    const finalTableNumber = parseInt(tableNumber) || 1;
    const finalTableName = tableName || `${finalTableNumber}번 테이블`;

    console.log(`🔍 최종 테이블 정보: ${finalTableName} (번호: ${finalTableNumber})`);

    // 메뉴 데이터 로드
    const menuData = await OrderService.loadMenuData(store.id);
    const menuByCategory = OrderService.groupMenuByCategory(menuData);

    // 비회원 주문 상태 초기화
    window.currentGuestOrder = {
      storeId: store.id,
      storeName: store.name || '매장',
      tableName: finalTableName,
      tableNumber: finalTableNumber,
      cart: [],
      isGuest: true
    };

    window.currentMenuData = menuData;

    console.log('🏪 비회원 주문 초기화 완료:', window.currentGuestOrder);

    // UI 렌더링
    renderGuestOrderHTML(store, finalTableName, finalTableNumber, menuByCategory);

    // 이벤트 리스너 설정
    setupGuestOrderEvents();

  } catch (error) {
    console.error('❌ 비회원 주문 화면 로드 실패:', error);
    alert('주문 화면을 불러올 수 없습니다.');
  }
}

/**
 * 비회원 주문 HTML 렌더링
 */
function renderGuestOrderHTML(store, tableName, tableNumber, menuByCategory) {
  const main = document.getElementById('main');
  if (!main) {
    console.error('❌ main 요소를 찾을 수 없습니다');
    return;
  }

  const categories = Object.keys(menuByCategory);

  main.innerHTML = `
    <div class="guest-order-screen">
      <!-- 헤더 -->
      <div class="order-header">
        <button class="order-back-btn" id="guestBackBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="order-info">
          <h1>${store.name || '매장'}</h1>
          <p>${tableName}</p>
        </div>
        <button class="cart-btn" id="guestCartBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM1 2v2h2l3.6 7.59-1.35 2.41C5.08 14.42 5.37 15 6 15h12v-2H6l1.1-2h7.45c.75 0 1.42-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
          </svg>
          <span class="cart-badge" id="cartCount">0</span>
        </button>
      </div>

      <!-- 카테고리 탭 -->
      ${categories.length > 1 ? `
        <div class="category-tabs">
          ${categories.map((cat, idx) => `
            <button class="category-btn ${idx === 0 ? 'active' : ''}" data-category="${cat}">
              ${cat}
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- 메뉴 그리드 -->
      <div class="menu-content">
        <div class="menu-grid" id="menuGrid">
          ${renderMenuItems(menuByCategory[categories[0]] || [])}
        </div>
      </div>

      <!-- 장바구니 패널 -->
      <div class="cart-panel" id="cartPanel">
        <div class="cart-header">
          <h3>장바구니</h3>
          <button class="cart-close-btn" id="cartCloseBtn">✕</button>
        </div>
        <div class="cart-items" id="cartItems">
          <div class="empty-cart">
            <div class="empty-icon">🛒</div>
            <p>장바구니가 비어있습니다</p>
          </div>
        </div>
        <div class="cart-footer">
          <div class="cart-total">
            <span>총 금액</span>
            <strong id="cartTotal">₩0</strong>
          </div>
          <button class="checkout-btn" id="checkoutBtn" disabled>
            결제하기
          </button>
        </div>
      </div>

      <!-- 오버레이 -->
      <div class="cart-overlay" id="cartOverlay"></div>
    </div>

    ${getGuestOrderStyles()}
  `;
}

/**
 * 메뉴 아이템 렌더링
 */
function renderMenuItems(menuData) {
  if (!menuData || menuData.length === 0) {
    return `
      <div class="empty-menu">
        <p>메뉴가 없습니다</p>
      </div>
    `;
  }

  return menuData.map(menu => `
    <div class="menu-card" data-menu-id="${menu.id}" data-menu-name="${escapeHtml(menu.name)}" data-price="${menu.price}">
      <div class="menu-image">
        <div class="menu-placeholder">🍽️</div>
      </div>
      <div class="menu-info">
        <h4>${escapeHtml(menu.name)}</h4>
        <p class="menu-price">₩${menu.price.toLocaleString()}</p>
        ${menu.cook_station ? `<span class="cook-badge">${menu.cook_station}</span>` : ''}
      </div>
      <button class="add-menu-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </div>
  `).join('');
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

/**
 * 비회원 주문 이벤트 설정
 */
function setupGuestOrderEvents() {
  // 뒤로가기
  const backBtn = document.getElementById('guestBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (typeof window.renderGuestTLL === 'function') {
        window.renderGuestTLL();
      }
    });
  }

  // 카트 토글
  const cartBtn = document.getElementById('guestCartBtn');
  if (cartBtn) {
    cartBtn.addEventListener('click', toggleCart);
  }

  // 카트 닫기
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  if (cartCloseBtn) {
    cartCloseBtn.addEventListener('click', closeCart);
  }

  const cartOverlay = document.getElementById('cartOverlay');
  if (cartOverlay) {
    cartOverlay.addEventListener('click', closeCart);
  }

  // 카테고리 전환
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const category = e.target.dataset.category;
      switchCategory(category);
    });
  });

  // 메뉴 추가 (이벤트 위임)
  const menuGrid = document.getElementById('menuGrid');
  if (menuGrid) {
    menuGrid.addEventListener('click', (e) => {
      const menuCard = e.target.closest('.menu-card');
      if (menuCard) {
        const menuId = parseInt(menuCard.dataset.menuId);
        const menuName = menuCard.dataset.menuName;
        const price = parseInt(menuCard.dataset.price);
        
        console.log('🛒 메뉴 추가:', { menuId, menuName, price });
        addToCart(menuId, menuName, price);
      }
    });
  }

  // 결제 버튼
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', proceedToPayment);
  }
}

/**
 * 카테고리 전환
 */
function switchCategory(category) {
  const menuData = window.currentMenuData || [];
  const filtered = category === 'all' 
    ? menuData 
    : menuData.filter(item => item.category === category);
  
  const menuGrid = document.getElementById('menuGrid');
  if (menuGrid) {
    menuGrid.innerHTML = renderMenuItems(filtered);
  }

  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
}

/**
 * 카트 토글
 */
function toggleCart() {
  const cartPanel = document.getElementById('cartPanel');
  const cartOverlay = document.getElementById('cartOverlay');
  
  if (cartPanel && cartOverlay) {
    const isOpen = cartPanel.classList.contains('open');
    if (isOpen) {
      closeCart();
    } else {
      cartPanel.classList.add('open');
      cartOverlay.classList.add('open');
    }
  }
}

/**
 * 카트 닫기
 */
function closeCart() {
  const cartPanel = document.getElementById('cartPanel');
  const cartOverlay = document.getElementById('cartOverlay');
  
  if (cartPanel) cartPanel.classList.remove('open');
  if (cartOverlay) cartOverlay.classList.remove('open');
}

/**
 * 장바구니 추가
 */
function addToCart(menuId, menuName, price) {
  const cart = window.currentGuestOrder.cart;
  const existingItem = cart.find(item => item.menuId === menuId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      menuId,
      menuName,
      price,
      quantity: 1
    });
  }

  updateCartUI();
  console.log('✅ 장바구니 업데이트:', cart);
}

/**
 * 수량 변경
 */
function updateQuantity(menuId, change) {
  const cart = window.currentGuestOrder.cart;
  const item = cart.find(item => item.menuId === menuId);

  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(menuId);
    } else {
      updateCartUI();
    }
  }
}

/**
 * 장바구니 아이템 제거
 */
function removeFromCart(menuId) {
  const cart = window.currentGuestOrder.cart;
  const index = cart.findIndex(item => item.menuId === menuId);
  
  if (index > -1) {
    cart.splice(index, 1);
    updateCartUI();
  }
}

/**
 * 장바구니 UI 업데이트
 */
function updateCartUI() {
  const cart = window.currentGuestOrder.cart;
  const cartItems = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (!cartItems) return;

  // 장바구니 개수 업데이트
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCount) {
    cartCount.textContent = totalCount;
    cartCount.style.display = totalCount > 0 ? 'flex' : 'none';
  }

  // 장바구니 아이템 렌더링
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>장바구니가 비어있습니다</p>
      </div>
    `;
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (cartTotal) cartTotal.textContent = '₩0';
    return;
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${escapeHtml(item.menuName)}</h4>
        <p class="cart-item-price">₩${item.price.toLocaleString()}</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn minus" onclick="window.updateGuestQuantity(${item.menuId}, -1)">-</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn plus" onclick="window.updateGuestQuantity(${item.menuId}, 1)">+</button>
      </div>
    </div>
  `).join('');

  if (cartTotal) {
    cartTotal.textContent = `₩${totalAmount.toLocaleString()}`;
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = false;
  }
}

/**
 * 결제 진행
 */
async function proceedToPayment() {
  const cart = window.currentGuestOrder.cart;

  if (cart.length === 0) {
    alert('장바구니가 비어있습니다.');
    return;
  }

  try {
    const orderData = {
      storeId: window.currentGuestOrder.storeId,
      tableNumber: window.currentGuestOrder.tableNumber,
      items: cart.map(item => ({
        menu_name: item.menuName,
        unit_price: item.price,
        quantity: item.quantity,
        options: {},
        notes: ''
      })),
      isGuest: true
    };

    console.log('💳 비회원 결제 진행:', orderData);

    // TODO: 비회원 결제 API 호출
    alert('비회원 결제 기능은 곧 구현됩니다.');

  } catch (error) {
    console.error('❌ 결제 진행 실패:', error);
    alert('결제를 진행할 수 없습니다.');
  }
}

/**
 * 스타일
 */
function getGuestOrderStyles() {
  return `
    <style>
      .guest-order-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        max-width: 390px;
        height: 100vh;
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .order-header {
        background: white;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }

      .order-back-btn {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: #1e293b;
        display: flex;
        align-items: center;
      }

      .order-info {
        flex: 1;
      }

      .order-info h1 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .order-info p {
        margin: 4px 0 0 0;
        font-size: 13px;
        color: #64748b;
      }

      .cart-btn {
        position: relative;
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: #1e293b;
      }

      .cart-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #ef4444;
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 11px;
        font-weight: 700;
        min-width: 18px;
        text-align: center;
        display: none;
      }

      .category-tabs {
        padding: 12px 20px;
        background: white;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        gap: 8px;
        overflow-x: auto;
      }

      .category-btn {
        background: #f1f5f9;
        border: none;
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        white-space: nowrap;
      }

      .category-btn.active {
        background: #3b82f6;
        color: white;
      }

      .menu-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
      }

      .menu-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }

      .menu-card:active {
        transform: scale(0.98);
      }

      .menu-image {
        width: 100%;
        height: 120px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .menu-placeholder {
        font-size: 48px;
      }

      .menu-info {
        padding: 12px;
      }

      .menu-info h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
      }

      .menu-price {
        margin: 0;
        font-size: 16px;
        font-weight: 800;
        color: #3b82f6;
      }

      .cook-badge {
        display: inline-block;
        margin-top: 8px;
        padding: 4px 8px;
        background: #f1f5f9;
        color: #64748b;
        font-size: 11px;
        border-radius: 6px;
        font-weight: 600;
      }

      .add-menu-btn {
        position: absolute;
        bottom: 12px;
        right: 12px;
        width: 36px;
        height: 36px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .cart-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        max-width: 390px;
        height: 60vh;
        background: white;
        border-radius: 24px 24px 0 0;
        box-shadow: 0 -8px 32px rgba(0,0,0,0.2);
        transform: translateY(100%);
        transition: transform 0.3s;
        display: flex;
        flex-direction: column;
        z-index: 1010;
      }

      .cart-panel.open {
        transform: translateY(0);
      }

      .cart-header {
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cart-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
      }

      .cart-close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #64748b;
      }

      .cart-items {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
      }

      .empty-cart {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #94a3b8;
      }

      .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .cart-item {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cart-item-info h4 {
        margin: 0 0 4px 0;
        font-size: 15px;
        font-weight: 700;
      }

      .cart-item-price {
        margin: 0;
        font-size: 14px;
        color: #64748b;
      }

      .cart-item-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .qty-btn {
        width: 32px;
        height: 32px;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
        color: #1e293b;
      }

      .qty-display {
        min-width: 24px;
        text-align: center;
        font-weight: 700;
      }

      .cart-footer {
        padding: 20px;
        border-top: 1px solid #e2e8f0;
      }

      .cart-total {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16px;
        font-size: 16px;
      }

      .cart-total strong {
        font-size: 20px;
        font-weight: 800;
        color: #3b82f6;
      }

      .checkout-btn {
        width: 100%;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 16px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
      }

      .checkout-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .cart-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s;
        z-index: 1005;
      }

      .cart-overlay.open {
        opacity: 1;
        visibility: visible;
      }
    </style>
  `;
}

// 전역 함수로 등록
window.renderGuestOrderScreen = renderGuestOrderScreen;
window.updateGuestQuantity = updateQuantity;

console.log('✅ renderGuestOrderScreen 전역 함수 등록 완료');
