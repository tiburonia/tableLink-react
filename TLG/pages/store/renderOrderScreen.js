
/**
 * TLL 주문 화면 렌더링 (개선된 UI 및 리팩토링된 구조)
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
    let finalTableNumber = tableNumber;
    let finalTableName = tableName;

    if (finalTableNumber) {
      finalTableName = finalTableName || `${finalTableNumber}번 테이블`;
    } else {
      if (!finalTableName || finalTableName === 'undefined') {
        finalTableName = '1번 테이블';
        finalTableNumber = 1;
        console.warn('⚠️ 테이블 정보가 유효하지 않아 기본값 사용');
      } else {
        const match = finalTableName.match(/(\d+)/);
        finalTableNumber = match ? parseInt(match[1]) : 1;
      }
    }

    finalTableNumber = parseInt(finalTableNumber) || 1;
    finalTableName = finalTableName || `${finalTableNumber}번 테이블`;

    console.log(`🔍 TLL 최종 테이블 정보: ${finalTableName} (번호: ${finalTableNumber})`);

    // TLL 체크 생성
    const qrCode = `TABLE_${finalTableNumber}`;
    let requestBody = { qr_code: qrCode };

    if (userInfo.id && userInfo.id !== 'guest') {
      requestBody.user_id = userInfo.id;
    } else if (userInfo.phone) {
      requestBody.guest_phone = userInfo.phone;
    } else {
      requestBody.guest_phone = '010-0000-0000';
    }

    console.log('📝 TLL 체크 생성 요청:', requestBody);

    const checkResponse = await fetch('/api/tll/checks/from-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      throw new Error(errorData.error || 'TLL 체크 생성 실패');
    }

    const checkData = await checkResponse.json();
    const checkId = checkData.check_id;
    console.log('✅ TLL 체크 생성 완료:', checkId);

    // 매장 메뉴 조회
    const menuResponse = await fetch(`/api/stores/${store.id}/menu`);
    if (!menuResponse.ok) {
      throw new Error('메뉴 조회 실패');
    }

    const menuData = await menuResponse.json();
    const menu = menuData.menu || menuData.menus || [];

    // UI 렌더링
    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="tll-order-screen">
        <!-- 헤더 -->
        <div class="order-header">
          <button class="back-btn" onclick="renderMap()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="header-info">
            <div class="store-info">
              <h1 class="store-name">${store.name}</h1>
              <div class="store-meta">
                <span class="table-badge">${finalTableName}</span>
                <span class="store-category">${store.category || '음식점'}</span>
              </div>
            </div>
          </div>
          <button class="help-btn" onclick="showOrderHelp()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M9.09 9A3 3 0 0 1 12 6C13.11 6 14 6.89 14 8C14 9.11 13.11 10 12 10H12V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- 메인 컨텐츠 -->
        <div class="order-content">
          <!-- 메뉴 섹션 -->
          <div class="menu-section">
            <div class="section-header">
              <div class="section-title">
                <span class="section-icon">🍽️</span>
                <h2>메뉴 선택</h2>
                <span class="menu-count">${menu.length}개</span>
              </div>
              <div class="view-toggle">
                <button class="view-btn active" data-view="grid">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                    <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                    <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                    <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </button>
                <button class="view-btn" data-view="list">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2"/>
                    <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/>
                    <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2"/>
                    <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" stroke-width="2"/>
                    <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" stroke-width="2"/>
                    <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </button>
              </div>
            </div>

            <div id="menuList" class="menu-list grid-view">
              ${menu.length > 0 ? renderMenuItems(menu) : '<div class="empty-menu">등록된 메뉴가 없습니다</div>'}
            </div>
          </div>
        </div>

        <!-- 하단 장바구니 플로팅 바 -->
        <div class="cart-floating-bar" id="cartFloatingBar" style="display: none;">
          <div class="cart-summary">
            <div class="cart-info">
              <span class="cart-count" id="cartCount">0</span>
              <span class="cart-total" id="cartTotal">₩0</span>
            </div>
            <button class="cart-toggle-btn" id="cartToggleBtn">
              <span class="toggle-text">장바구니 보기</span>
              <svg class="toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 장바구니 패널 -->
        <div class="cart-panel" id="cartPanel">
          <div class="cart-header">
            <div class="cart-title">
              <span class="cart-icon">🛒</span>
              <h3>주문 내역</h3>
              <span class="item-count" id="cartItemCount">0개</span>
            </div>
            <button class="cart-close-btn" id="cartCloseBtn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="cart-items" id="cartItems">
            <div class="empty-cart">
              <div class="empty-icon">🛒</div>
              <p>주문할 메뉴를 선택해주세요</p>
            </div>
          </div>

          <div class="cart-footer">
            <div class="total-section">
              <div class="total-row">
                <span class="total-label">총 주문금액</span>
                <span class="total-amount" id="totalAmount">₩0</span>
              </div>
            </div>
            <button class="order-btn" id="orderBtn" disabled>
              <span class="btn-icon">💳</span>
              <span class="btn-text">주문하기</span>
            </button>
          </div>
        </div>

        <!-- 오버레이 -->
        <div class="cart-overlay" id="cartOverlay"></div>
      </div>

      ${getOrderScreenStyles()}
    `;

    // 장바구니 상태 관리
    let cart = [];
    let cartVisible = false;

    // 메뉴 아이템 렌더링 함수
    function renderMenuItems(menuItems) {
      return menuItems.map((item, index) => `
        <div class="menu-item" data-menu-id="${item.id || index}">
          <div class="menu-image">
            <img src="${item.image || '/TableLink.png'}" alt="${item.name}" onerror="this.src='/TableLink.png'">
            <div class="menu-badge ${item.isPopular ? 'popular' : ''}" style="display: ${item.isPopular ? 'block' : 'none'}">인기</div>
          </div>
          <div class="menu-info">
            <h4 class="menu-name">${item.name}</h4>
            <p class="menu-description">${item.description || '맛있는 메뉴입니다'}</p>
            <div class="menu-price">₩${item.price.toLocaleString()}</div>
          </div>
          <div class="menu-actions">
            <div class="quantity-controls" style="display: none;">
              <button class="qty-btn minus" data-menu-id="${item.id || index}">−</button>
              <span class="quantity">1</span>
              <button class="qty-btn plus" data-menu-id="${item.id || index}">+</button>
            </div>
            <button class="add-btn" data-menu-id="${item.id || index}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              담기
            </button>
          </div>
        </div>
      `).join('');
    }

    // 장바구니 업데이트 함수
    function updateCart() {
      const cartCount = document.getElementById('cartCount');
      const cartTotal = document.getElementById('cartTotal');
      const cartItemCount = document.getElementById('cartItemCount');
      const totalAmount = document.getElementById('totalAmount');
      const cartItems = document.getElementById('cartItems');
      const orderBtn = document.getElementById('orderBtn');
      const cartFloatingBar = document.getElementById('cartFloatingBar');

      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      cartCount.textContent = totalItems;
      cartTotal.textContent = `₩${totalPrice.toLocaleString()}`;
      cartItemCount.textContent = `${totalItems}개`;
      totalAmount.textContent = `₩${totalPrice.toLocaleString()}`;

      if (totalItems > 0) {
        cartFloatingBar.style.display = 'block';
        orderBtn.disabled = false;
        
        cartItems.innerHTML = cart.map(item => `
          <div class="cart-item">
            <div class="item-info">
              <h4 class="item-name">${item.name}</h4>
              <p class="item-price">₩${item.price.toLocaleString()}</p>
            </div>
            <div class="item-controls">
              <div class="quantity-controls">
                <button class="qty-btn minus" data-cart-id="${item.id}">−</button>
                <span class="quantity">${item.quantity}</span>
                <button class="qty-btn plus" data-cart-id="${item.id}">+</button>
              </div>
              <button class="remove-btn" data-cart-id="${item.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.4477 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        `).join('');
      } else {
        cartFloatingBar.style.display = 'none';
        orderBtn.disabled = true;
        cartItems.innerHTML = `
          <div class="empty-cart">
            <div class="empty-icon">🛒</div>
            <p>주문할 메뉴를 선택해주세요</p>
          </div>
        `;
      }
    }

    // 메뉴 추가 함수
    function addToCart(menuId) {
      const menuItem = menu.find(item => (item.id || menu.indexOf(item)) == menuId);
      if (!menuItem) return;

      const existingItem = cart.find(item => item.id == menuId);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: menuId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1
        });
      }

      updateCart();
      showToast(`${menuItem.name}이(가) 장바구니에 추가되었습니다`);
    }

    // 이벤트 리스너 설정
    document.addEventListener('click', (e) => {
      // 메뉴 추가 버튼
      if (e.target.closest('.add-btn')) {
        const menuId = e.target.closest('.add-btn').dataset.menuId;
        addToCart(menuId);
      }

      // 장바구니 수량 조절
      if (e.target.closest('.qty-btn')) {
        const btn = e.target.closest('.qty-btn');
        const cartId = btn.dataset.cartId;
        const isPlus = btn.classList.contains('plus');
        
        const item = cart.find(item => item.id == cartId);
        if (item) {
          if (isPlus) {
            item.quantity += 1;
          } else {
            item.quantity -= 1;
            if (item.quantity <= 0) {
              cart = cart.filter(cartItem => cartItem.id != cartId);
            }
          }
          updateCart();
        }
      }

      // 장바구니 아이템 제거
      if (e.target.closest('.remove-btn')) {
        const cartId = e.target.closest('.remove-btn').dataset.cartId;
        cart = cart.filter(item => item.id != cartId);
        updateCart();
      }

      // 장바구니 토글
      if (e.target.closest('#cartToggleBtn')) {
        toggleCart();
      }

      // 장바구니 닫기
      if (e.target.closest('#cartCloseBtn') || e.target.closest('#cartOverlay')) {
        closeCart();
      }
    });

    // 장바구니 토글 함수
    function toggleCart() {
      cartVisible = !cartVisible;
      const cartPanel = document.getElementById('cartPanel');
      const cartOverlay = document.getElementById('cartOverlay');
      
      if (cartVisible) {
        cartPanel.classList.add('visible');
        cartOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
      } else {
        cartPanel.classList.remove('visible');
        cartOverlay.classList.remove('visible');
        document.body.style.overflow = '';
      }
    }

    function closeCart() {
      cartVisible = false;
      document.getElementById('cartPanel').classList.remove('visible');
      document.getElementById('cartOverlay').classList.remove('visible');
      document.body.style.overflow = '';
    }

    // 주문하기 버튼
    document.getElementById('orderBtn').addEventListener('click', async () => {
      if (cart.length === 0) {
        showToast('주문할 메뉴를 선택해주세요');
        return;
      }

      try {
        console.log('📝 TLL 주문 제출 시작:', cart);

        const orderItems = cart.map(item => ({
          menu_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
          options: {},
          notes: ''
        }));

        const orderResponse = await fetch('/api/tll/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            check_id: checkId,
            items: orderItems,
            payment_method: 'TOSS',
            toss_order_id: `TLL_${checkId}_${Date.now()}`
          })
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.error || 'TLL 주문 생성 실패');
        }

        const orderResult = await orderResponse.json();
        console.log('✅ TLL 주문 생성 성공:', orderResult);

        // 주문 정보 저장
        sessionStorage.setItem('tllPendingOrder', JSON.stringify({
          checkId: checkId,
          storeId: store.id,
          storeName: store.name,
          tableNumber: finalTableNumber,
          tableName: finalTableName,
          items: cart,
          totalAmount: orderResult.total_amount
        }));

        // 토스페이먼츠 결제 시작
        try {
          console.log('💳 토스페이먼츠 결제 시작...');
          
          // 토스페이먼츠 초기화 및 결제 요청
          const tossPayments = await window.initTossPayments();
          if (!tossPayments) {
            throw new Error('토스페이먼츠 SDK 초기화 실패');
          }

          console.log('🔄 토스페이먼츠 결제 요청 중...');
          
          const baseUrl = window.location.origin;
          const paymentOptions = {
            amount: orderResult.total_amount,
            orderId: `TLL_${checkId}_${Date.now()}`,
            orderName: `${store.name} - ${finalTableName}`,
            customerName: userInfo.name || '고객',
            customerEmail: userInfo.email || 'customer@tablelink.com',
            successUrl: `${baseUrl}/toss-success.html`,
            failUrl: `${baseUrl}/toss-fail.html`
          };

          console.log('💳 결제 옵션:', paymentOptions);

          // 실제 결제 요청
          await tossPayments.requestPayment('카드', paymentOptions);
          console.log('✅ 토스페이먼츠 결제 요청 완료 - 결제창으로 이동');

        } catch (paymentError) {
          console.error('❌ 토스페이먼츠 결제 실패:', paymentError);
          
          // 사용자 취소인 경우
          if (paymentError.code === 'USER_CANCEL') {
            showToast('결제가 취소되었습니다');
            return;
          }
          
          throw new Error(`결제 처리 실패: ${paymentError.message}`);
        }

      } catch (error) {
        console.error('❌ TLL 주문 제출 실패:', error);
        showToast('주문 처리 중 오류가 발생했습니다');
      }
    });

    // 전역 함수 등록
    window.showOrderHelp = function() {
      showToast('메뉴를 선택하고 장바구니에 담아 주문하세요');
    };

    // 토스트 메시지 함수
    function showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'toast-message';
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('show'), 100);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }

    console.log('✅ TLL 주문 화면 렌더링 완료');

  } catch (error) {
    console.error('❌ TLL 주문 화면 로드 실패:', error);
    alert('주문 화면을 불러올 수 없습니다: ' + error.message);
    renderMap();
  }
};

// 스타일 함수
function getOrderScreenStyles() {
  return `
    <style>
      .tll-order-screen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
      }

      /* 헤더 */
      .order-header {
        height: 80px;
        background: white;
        padding: 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        position: relative;
        z-index: 10;
      }

      .back-btn, .help-btn {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: none;
        background: #f1f5f9;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .back-btn:hover, .help-btn:hover {
        background: #e2e8f0;
        transform: scale(1.05);
      }

      .header-info {
        flex: 1;
        min-width: 0;
      }

      .store-name {
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px 0;
        line-height: 1.2;
      }

      .store-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .table-badge {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
      }

      .store-category {
        color: #64748b;
        font-size: 13px;
        font-weight: 500;
      }

      /* 메인 컨텐츠 */
      .order-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        padding-bottom: 100px;
      }

      .menu-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-icon {
        font-size: 20px;
      }

      .section-title h2 {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .menu-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .view-toggle {
        display: flex;
        gap: 4px;
        background: #f1f5f9;
        padding: 4px;
        border-radius: 8px;
      }

      .view-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: #64748b;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .view-btn.active {
        background: white;
        color: #3b82f6;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      /* 메뉴 리스트 */
      .menu-list {
        display: grid;
        gap: 16px;
      }

      .menu-list.grid-view {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }

      .menu-list.list-view {
        grid-template-columns: 1fr;
      }

      .menu-item {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
        position: relative;
      }

      .menu-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        border-color: #cbd5e1;
      }

      .menu-image {
        position: relative;
        height: 120px;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 12px;
      }

      .menu-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .menu-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #ef4444;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }

      .menu-info {
        margin-bottom: 12px;
      }

      .menu-name {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px 0;
        line-height: 1.3;
      }

      .menu-description {
        font-size: 13px;
        color: #64748b;
        margin: 0 0 8px 0;
        line-height: 1.4;
      }

      .menu-price {
        font-size: 16px;
        font-weight: 700;
        color: #3b82f6;
      }

      .menu-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .add-btn {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .add-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      /* 장바구니 플로팅 바 */
      .cart-floating-bar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 40px);
        max-width: 390px;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        border-radius: 16px;
        padding: 16px 20px;
        box-shadow: 0 8px 32px rgba(5, 150, 105, 0.3);
        z-index: 50;
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }

      .cart-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cart-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .cart-count {
        font-size: 12px;
        opacity: 0.9;
      }

      .cart-total {
        font-size: 18px;
        font-weight: 700;
      }

      .cart-toggle-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .cart-toggle-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* 장바구니 패널 */
      .cart-panel {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%) translateY(100%);
        width: 100%;
        max-width: 430px;
        height: 70vh;
        background: white;
        border-radius: 20px 20px 0 0;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
        z-index: 100;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
      }

      .cart-panel.visible {
        transform: translateX(-50%) translateY(0);
      }

      .cart-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 90;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .cart-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .cart-header {
        padding: 20px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cart-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .cart-icon {
        font-size: 20px;
      }

      .cart-title h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .item-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
      }

      .cart-close-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: #f1f5f9;
        color: #64748b;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .cart-close-btn:hover {
        background: #e2e8f0;
        color: #475569;
      }

      .cart-items {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .empty-cart {
        text-align: center;
        padding: 40px 20px;
        color: #64748b;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      .cart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: #f8fafc;
        border-radius: 12px;
        margin-bottom: 12px;
        border: 1px solid #e2e8f0;
      }

      .item-info {
        flex: 1;
        min-width: 0;
      }

      .item-name {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 4px 0;
      }

      .item-price {
        font-size: 14px;
        color: #64748b;
        margin: 0;
      }

      .item-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        background: white;
        padding: 4px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .qty-btn {
        width: 28px;
        height: 28px;
        border: none;
        background: #f8fafc;
        color: #475569;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .qty-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .quantity {
        min-width: 20px;
        text-align: center;
        font-weight: 600;
        color: #1e293b;
      }

      .remove-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: #fef2f2;
        color: #ef4444;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .remove-btn:hover {
        background: #fee2e2;
      }

      .cart-footer {
        padding: 20px;
        border-top: 1px solid #f1f5f9;
        background: white;
      }

      .total-section {
        margin-bottom: 16px;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8fafc;
        border-radius: 8px;
      }

      .total-label {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      }

      .total-amount {
        font-size: 20px;
        font-weight: 800;
        color: #1e293b;
      }

      .order-btn {
        width: 100%;
        height: 56px;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
      }

      .order-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
      }

      .order-btn:disabled {
        background: #e2e8f0;
        color: #94a3b8;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }

      .btn-icon {
        font-size: 18px;
      }

      /* 토스트 메시지 */
      .toast-message {
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .toast-message.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      /* 반응형 */
      @media (max-width: 768px) {
        .menu-list.grid-view {
          grid-template-columns: 1fr;
        }
        
        .cart-floating-bar {
          width: calc(100% - 20px);
          bottom: 10px;
        }
        
        .cart-panel {
          height: 80vh;
        }
      }

      @media (max-width: 480px) {
        .order-header {
          padding: 16px 12px;
        }
        
        .order-content {
          padding: 16px 12px;
        }
        
        .store-name {
          font-size: 20px;
        }
      }
    </style>
  `;
}
