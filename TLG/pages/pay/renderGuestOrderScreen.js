
import { OrderView } from './views/orderView.js';
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

    // UI 렌더링
    OrderView.renderOrderHTML(store, finalTableName, finalTableNumber, menuByCategory);

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

    // 이벤트 리스너 설정
    setupGuestOrderEvents();

  } catch (error) {
    console.error('❌ 비회원 주문 화면 로드 실패:', error);
    alert('주문 화면을 불러올 수 없습니다.');
  }
}

/**
 * 비회원 주문 이벤트 설정
 */
function setupGuestOrderEvents() {
  // 뒤로가기
  const backBtn = document.querySelector('.order-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (typeof window.renderGuestTLL === 'function') {
        window.renderGuestTLL();
      }
    });
  }

  // 카테고리 전환
  window.switchCategory = (category) => {
    const menuData = window.currentMenuData || [];
    const filtered = category === 'all' 
      ? menuData 
      : menuData.filter(item => item.category === category);
    
    renderMenuItems(filtered);
    updateCategoryButtons(category);
  };

  // 카트 토글
  window.toggleCart = () => {
    const cartPanel = document.getElementById('cartPanel');
    if (cartPanel) {
      cartPanel.classList.toggle('active');
    }
  };

  // 카트 닫기
  window.closeCart = () => {
    const cartPanel = document.getElementById('cartPanel');
    if (cartPanel) {
      cartPanel.classList.remove('active');
    }
  };

  // 장바구니 추가
  window.addToCart = (menuId, menuName, price) => {
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
    console.log('🛒 장바구니 추가:', { menuName, cart });
  };

  // 수량 변경
  window.updateQuantity = (menuId, change) => {
    const cart = window.currentGuestOrder.cart;
    const item = cart.find(item => item.menuId === menuId);

    if (item) {
      item.quantity += change;
      if (item.quantity <= 0) {
        window.removeFromCart(menuId);
      } else {
        updateCartUI();
      }
    }
  };

  // 장바구니 아이템 제거
  window.removeFromCart = (menuId) => {
    const cart = window.currentGuestOrder.cart;
    const index = cart.findIndex(item => item.menuId === menuId);
    
    if (index > -1) {
      cart.splice(index, 1);
      updateCartUI();
    }
  };

  // 결제 진행
  window.proceedToPayment = async () => {
    const cart = window.currentGuestOrder.cart;

    if (cart.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }

    try {
      // 비회원 주문 생성 로직
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
  };
}

/**
 * 메뉴 아이템 렌더링
 */
function renderMenuItems(menuData) {
  const menuGrid = document.getElementById('menuGrid');
  if (!menuGrid) return;

  if (menuData.length === 0) {
    menuGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
        <p style="color: #9CA3AF;">메뉴가 없습니다</p>
      </div>
    `;
    return;
  }

  menuGrid.innerHTML = menuData.map(menu => `
    <div class="menu-card" onclick="addToCart(${menu.id}, '${menu.name}', ${menu.price})">
      <div class="menu-card-image">
        <div class="menu-placeholder">🍽️</div>
      </div>
      <div class="menu-card-body">
        <h4 class="menu-name">${menu.name}</h4>
        <p class="menu-price">₩${menu.price.toLocaleString()}</p>
      </div>
    </div>
  `).join('');
}

/**
 * 카테고리 버튼 업데이트
 */
function updateCategoryButtons(activeCategory) {
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === activeCategory);
  });
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
        <h4>${item.menuName}</h4>
        <p class="cart-item-price">₩${item.price.toLocaleString()}</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn minus" onclick="updateQuantity(${item.menuId}, -1)">-</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn plus" onclick="updateQuantity(${item.menuId}, 1)">+</button>
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

// 전역 함수로 등록
window.renderGuestOrderScreen = renderGuestOrderScreen;
console.log('✅ renderGuestOrderScreen 전역 함수 등록 완료');
