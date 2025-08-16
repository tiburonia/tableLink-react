
async function renderOrderScreen(store, tableNum, opts = {}) {
  // 주문 상태
  let currentOrder = {};

  // 렌더
  main.innerHTML = `
    <div class="order-container">
      <div class="order-header">
        <button id="orderBackBtn" class="header-back-btn" aria-label="뒤로가기">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
        </button>
        <div class="header-info">
          <h1>${store.name}</h1>
          <div class="store-details">
            <span class="table-info">테이블 ${tableNum}</span>
            <span class="store-category">${store.category}</span>
            ${store.distance ? `<span class="store-distance">${store.distance}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="order-content">
        <!-- 메뉴 섹션 -->
        <div class="menu-section">
          <div class="section-header">
            <h2>🍽️ 메뉴</h2>
            <span class="menu-count">${store.menu ? store.menu.length : 0}개</span>
          </div>
          <div id="menuList" class="menu-grid"></div>
        </div>

        <!-- 장바구니 섹션 -->
        <div class="cart-section" id="cartSection" style="display: none;">
          <div class="section-header">
            <h2>🛒 장바구니</h2>
            <span id="cartItemCount" class="cart-count">0개</span>
          </div>
          <div id="cartList" class="cart-content"></div>
        </div>

        <!-- 액션 버튼 -->
        <div class="action-buttons">
          <button id="orderPayBtn" class="action-btn primary" disabled>
            <span class="btn-icon">💳</span>
            <div class="btn-content">
              <span class="btn-label">결제하기</span>
              <span id="totalAmountBtn" class="btn-amount">0원</span>
            </div>
          </button>
          <div class="secondary-actions">
            <button id="orderCartSaveBtn" class="action-btn secondary" disabled>
              <span class="btn-icon">💾</span>
              <span>장바구니 저장</span>
            </button>
            <button id="orderCancelBtn" class="action-btn secondary">
              <span class="btn-icon">↩️</span>
              <span>뒤로가기</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <style>
      .order-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        padding-bottom: 120px;
      }

      .order-header {
        background: white;
        padding: 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .header-back-btn {
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

      .header-back-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .header-back-btn:active {
        transform: scale(0.95);
      }

      .header-info {
        flex: 1;
      }

      .header-info h1 {
        margin: 0 0 4px 0;
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }

      .store-details {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .table-info {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
      }

      .store-category,
      .store-distance {
        color: #64748b;
        font-size: 13px;
        font-weight: 500;
      }

      .order-content {
        padding: 20px 16px;
        max-width: 600px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .menu-section,
      .cart-section {
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

      .section-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .menu-count,
      .cart-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .menu-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .menu-item-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
      }

      .menu-item-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
      }

      .menu-item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .menu-item-info {
        flex: 1;
      }

      .menu-item-name {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 4px;
        line-height: 1.3;
      }

      .menu-item-price {
        font-size: 15px;
        font-weight: 600;
        color: #3b82f6;
      }

      .menu-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .qty-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        background: white;
        padding: 4px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .qty-btn {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: #f8fafc;
        color: #475569;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .qty-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .qty-btn:active {
        transform: scale(0.95);
      }

      .qty-display {
        min-width: 30px;
        text-align: center;
        font-weight: 600;
        color: #1e293b;
        font-size: 15px;
      }

      .add-to-cart-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        opacity: 0.4;
        transform: scale(0.9);
      }

      .add-to-cart-btn.active {
        opacity: 1;
        transform: scale(1);
      }

      .add-to-cart-btn.active:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 12px rgba(59, 130, 246, 0.3);
      }

      .add-to-cart-btn.active:active {
        transform: translateY(0);
      }

      .cart-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .cart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8fafc;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }

      .cart-item-info {
        flex: 1;
      }

      .cart-item-name {
        font-size: 15px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2px;
      }

      .cart-item-qty {
        font-size: 13px;
        color: #64748b;
      }

      .cart-item-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .cart-qty-controls {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .cart-qty-btn {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 4px;
        background: #e2e8f0;
        color: #475569;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .cart-qty-btn:hover {
        background: #cbd5e1;
      }

      .cart-item-price {
        font-weight: 700;
        color: #3b82f6;
        font-size: 15px;
        min-width: 80px;
        text-align: right;
      }

      .cart-total {
        margin-top: 16px;
        padding: 16px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        border-radius: 10px;
        border: 2px solid #cbd5e1;
        text-align: center;
      }

      .cart-total-label {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 4px;
      }

      .cart-total-amount {
        font-size: 22px;
        font-weight: 800;
        color: #1e293b;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .action-buttons {
        position: sticky;
        bottom: 0;
        background: white;
        padding: 16px;
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
        margin: 0 -16px -120px -16px;
      }

      .action-btn {
        width: 100%;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .action-btn.primary {
        padding: 16px 24px;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        font-size: 16px;
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
        margin-bottom: 12px;
      }

      .action-btn.primary:disabled {
        background: #e2e8f0;
        color: #94a3b8;
        box-shadow: none;
        cursor: not-allowed;
        transform: none;
      }

      .action-btn.primary:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
      }

      .action-btn.primary:not(:disabled):active {
        transform: translateY(0);
      }

      .btn-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .btn-label {
        font-size: 14px;
        opacity: 0.9;
      }

      .btn-amount {
        font-size: 18px;
        font-weight: 800;
      }

      .btn-icon {
        font-size: 20px;
      }

      .secondary-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .action-btn.secondary {
        padding: 12px 16px;
        background: white;
        color: #475569;
        border: 2px solid #e2e8f0;
        font-size: 14px;
      }

      .action-btn.secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .action-btn.secondary:not(:disabled):hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        color: #334155;
      }

      @media (max-width: 480px) {
        .order-header {
          padding: 16px 12px;
        }
        
        .order-content {
          padding: 16px 12px;
        }
        
        .menu-section,
        .cart-section {
          padding: 16px;
        }
        
        .header-info h1 {
          font-size: 20px;
        }
        
        .action-buttons {
          margin: 0 -12px -120px -12px;
        }
      }
    </style>
  `;

  // 메뉴 리스트 렌더링
  const menuList = document.getElementById('menuList');
  if (store.menu && Array.isArray(store.menu)) {
    store.menu.forEach((menu, index) => {
      const card = document.createElement('div');
      card.className = 'menu-item-card';

      let qty = 0;
      const menuId = `menu-${index}`;

      card.innerHTML = `
        <div class="menu-item-header">
          <div class="menu-item-info">
            <div class="menu-item-name">${menu.name}</div>
            <div class="menu-item-price">${menu.price.toLocaleString()}원</div>
          </div>
        </div>
        <div class="menu-controls">
          <div class="qty-controls">
            <button class="qty-btn minus-btn" data-menu="${menuId}">−</button>
            <span class="qty-display" id="qty-${menuId}">0</span>
            <button class="qty-btn plus-btn" data-menu="${menuId}">+</button>
          </div>
          <button class="add-to-cart-btn" id="add-${menuId}" data-menu="${menuId}">
            장바구니에 추가
          </button>
        </div>
      `;

      // 수량 조절 이벤트
      const minusBtn = card.querySelector('.minus-btn');
      const plusBtn = card.querySelector('.plus-btn');
      const qtyDisplay = card.querySelector('.qty-display');
      const addBtn = card.querySelector('.add-to-cart-btn');

      const updateQtyDisplay = () => {
        qtyDisplay.textContent = qty;
        if (qty > 0) {
          addBtn.classList.add('active');
        } else {
          addBtn.classList.remove('active');
        }
      };

      minusBtn.addEventListener('click', () => {
        if (qty > 0) {
          qty--;
          updateQtyDisplay();
        }
      });

      plusBtn.addEventListener('click', () => {
        if (qty < 99) {
          qty++;
          updateQtyDisplay();
        }
      });

      // 장바구니 추가 이벤트
      addBtn.addEventListener('click', () => {
        if (qty === 0) return;
        
        if (currentOrder[menu.name]) {
          currentOrder[menu.name] += qty;
        } else {
          currentOrder[menu.name] = qty;
        }
        
        qty = 0;
        updateQtyDisplay();
        renderCart();
        
        // 성공 피드백
        addBtn.textContent = '추가됨! ✓';
        setTimeout(() => {
          addBtn.textContent = '장바구니에 추가';
        }, 1000);
      });

      menuList.appendChild(card);
    });
  }

  // 장바구니 렌더링
  function renderCart() {
    const cartList = document.getElementById('cartList');
    const cartSection = document.getElementById('cartSection');
    const cartItemCount = document.getElementById('cartItemCount');
    const orderPayBtn = document.getElementById('orderPayBtn');
    const orderCartSaveBtn = document.getElementById('orderCartSaveBtn');
    const totalAmountBtn = document.getElementById('totalAmountBtn');

    cartList.innerHTML = '';
    let total = 0;
    let itemCount = 0;
    let hasOrder = false;

    Object.keys(currentOrder).forEach(itemName => {
      const menu = store.menu.find(m => m.name === itemName);
      if (!menu) return;
      
      const qty = currentOrder[itemName];
      const price = menu.price * qty;
      total += price;
      itemCount += qty;
      hasOrder = true;

      // 장바구니 아이템
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';

      itemDiv.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-name">${itemName}</div>
          <div class="cart-item-qty">수량: ${qty}개</div>
        </div>
        <div class="cart-item-controls">
          <div class="cart-qty-controls">
            <button class="cart-qty-btn minus" data-item="${itemName}">−</button>
            <button class="cart-qty-btn plus" data-item="${itemName}">+</button>
          </div>
          <div class="cart-item-price">${price.toLocaleString()}원</div>
        </div>
      `;

      // 수량 조절 이벤트
      itemDiv.querySelector('.minus').addEventListener('click', () => {
        if (currentOrder[itemName] > 1) {
          currentOrder[itemName]--;
        } else {
          delete currentOrder[itemName];
        }
        renderCart();
      });

      itemDiv.querySelector('.plus').addEventListener('click', () => {
        currentOrder[itemName]++;
        renderCart();
      });

      cartList.appendChild(itemDiv);
    });

    // 장바구니 표시/숨김
    if (hasOrder) {
      cartSection.style.display = 'block';
      cartItemCount.textContent = `${itemCount}개`;
      
      // 총액 표시
      const totalDiv = document.createElement('div');
      totalDiv.className = 'cart-total';
      totalDiv.innerHTML = `
        <div class="cart-total-label">총 결제금액</div>
        <div class="cart-total-amount">${total.toLocaleString()}원</div>
      `;
      cartList.appendChild(totalDiv);
      
      orderPayBtn.disabled = false;
      orderCartSaveBtn.disabled = false;
      totalAmountBtn.textContent = `${total.toLocaleString()}원`;
    } else {
      cartSection.style.display = 'none';
      orderPayBtn.disabled = true;
      orderCartSaveBtn.disabled = true;
      totalAmountBtn.textContent = '0원';
    }
  }

  // 초기 렌더링
  renderCart();

  // 이벤트 리스너
  document.getElementById('orderPayBtn').addEventListener('click', () => {
    if (Object.keys(currentOrder).length === 0) {
      alert('장바구니가 비어있습니다!');
      return;
    }
    renderPay(currentOrder, store, tableNum);
  });

  document.getElementById('orderCartSaveBtn').addEventListener('click', async () => {
    if (Object.keys(currentOrder).length === 0) {
      alert('장바구니가 비어있습니다!');
      return;
    }

    try {
      const cartData = {
        userId: userInfo?.id,
        storeId: store.id,
        storeName: store.name,
        tableNum: tableNum,
        order: currentOrder,
        savedAt: new Date().toISOString()
      };

      const response = await fetch('/api/cart/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData)
      });

      if (response.ok) {
        if (typeof saveCartBtn === 'function') {
          saveCartBtn(currentOrder, store, tableNum);
        }
        alert('장바구니가 저장되었습니다!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '장바구니 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('장바구니 저장 오류:', error);
      if (typeof saveCartBtn === 'function') {
        saveCartBtn(currentOrder, store, tableNum);
        alert('장바구니가 로컬에 저장되었습니다!');
      } else {
        alert('장바구니 저장에 실패했습니다.');
      }
    }
  });

  document.getElementById('orderCancelBtn').addEventListener('click', () => {
    renderStore(store);
  });

  document.getElementById('orderBackBtn').addEventListener('click', () => {
    renderStore(store);
  });
}

window.renderOrderScreen = renderOrderScreen;
