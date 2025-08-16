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

        <!-- 주문 요약 -->
        <div id="orderSummary" class="order-summary" style="display: none;">
          <div class="section-header">
            <h2>📋 주문 내역</h2>
            <span id="orderItemCount" class="order-count">0개</span>
          </div>
          <div id="orderList" class="order-content"></div>
          <div class="order-total">
            <div class="total-label">총 주문금액</div>
            <div id="totalAmount" class="total-amount">0원</div>
          </div>
        </div>
      </div>

      <!-- 하단 고정 버튼 -->
      <div class="bottom-actions">
        <button id="orderPayBtn" class="pay-btn" disabled>
          <span class="btn-content">
            <span class="btn-icon">💳</span>
            <span class="btn-text">결제하기</span>
            <span id="totalAmountBtn" class="btn-amount">0원</span>
          </span>
        </button>
      </div>
    </div>

    <style>
      * {
        box-sizing: border-box;
      }

      .order-container {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        min-height: 100vh;
        overflow-y: auto;
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
        padding: 20px 16px 120px 16px; /* 하단 버튼 공간 확보 */
        max-width: 600px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
        overflow-y: auto;
      }

      .menu-section,
      .order-summary {
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
      .order-count {
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

      .add-btn {
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

      .add-btn.active {
        opacity: 1;
        transform: scale(1);
      }

      .add-btn.active:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 12px rgba(59, 130, 246, 0.3);
      }

      .add-btn.active:active {
        transform: translateY(0);
      }

      .order-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8fafc;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }

      .order-item-info {
        flex: 1;
      }

      .order-item-name {
        font-size: 15px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2px;
      }

      .order-item-qty {
        font-size: 13px;
        color: #64748b;
      }

      .order-item-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .order-qty-controls {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .order-qty-btn {
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

      .order-qty-btn:hover {
        background: #cbd5e1;
      }

      .order-item-price {
        font-weight: 700;
        color: #3b82f6;
        font-size: 15px;
        min-width: 80px;
        text-align: right;
      }

      .order-total {
        margin-top: 16px;
        padding: 16px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        border-radius: 10px;
        border: 2px solid #cbd5e1;
        text-align: center;
      }

      .total-label {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 4px;
      }

      .total-amount {
        font-size: 22px;
        font-weight: 800;
        color: #1e293b;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .bottom-actions {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        padding: 16px;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
        z-index: 1000;
      }

      .pay-btn {
        width: 100%;
        padding: 16px 24px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
      }

      .pay-btn:disabled {
        background: #e2e8f0;
        color: #94a3b8;
        box-shadow: none;
        cursor: not-allowed;
        transform: none;
      }

      .pay-btn:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
      }

      .pay-btn:not(:disabled):active {
        transform: translateY(0);
      }

      .btn-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .btn-text {
        flex: 1;
        text-align: center;
      }

      .btn-amount {
        font-weight: 800;
        font-size: 18px;
      }

      .btn-icon {
        font-size: 20px;
      }

      @media (max-width: 480px) {
        .order-header {
          padding: 16px 12px;
        }

        .order-content {
          padding: 16px 12px 120px 12px;
        }

        .menu-section,
        .order-summary {
          padding: 16px;
        }

        .header-info h1 {
          font-size: 20px;
        }

        .bottom-actions {
          padding: 12px;
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
          <button class="add-btn" id="add-${menuId}" data-menu="${menuId}">
            추가
          </button>
        </div>
      `;

      // 수량 조절 이벤트
      const minusBtn = card.querySelector('.minus-btn');
      const plusBtn = card.querySelector('.plus-btn');
      const qtyDisplay = card.querySelector('.qty-display');
      const addBtn = card.querySelector('.add-btn');

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

      // 주문에 추가 이벤트
      addBtn.addEventListener('click', () => {
        if (qty === 0) return;

        if (currentOrder[menu.name]) {
          currentOrder[menu.name] += qty;
        } else {
          currentOrder[menu.name] = qty;
        }

        qty = 0;
        updateQtyDisplay();
        renderOrder();

        // 성공 피드백
        addBtn.textContent = '추가됨! ✓';
        setTimeout(() => {
          addBtn.textContent = '추가';
        }, 1000);
      });

      menuList.appendChild(card);
    });
  }

  // 주문 내역 렌더링
  function renderOrder() {
    const orderList = document.getElementById('orderList');
    const orderSummary = document.getElementById('orderSummary');
    const orderItemCount = document.getElementById('orderItemCount');
    const orderPayBtn = document.getElementById('orderPayBtn');
    const totalAmountBtn = document.getElementById('totalAmountBtn');
    const totalAmount = document.getElementById('totalAmount');

    orderList.innerHTML = '';
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

      // 주문 아이템
      const itemDiv = document.createElement('div');
      itemDiv.className = 'order-item';

      itemDiv.innerHTML = `
        <div class="order-item-info">
          <div class="order-item-name">${itemName}</div>
          <div class="order-item-qty">수량: ${qty}개</div>
        </div>
        <div class="order-item-controls">
          <div class="order-qty-controls">
            <button class="order-qty-btn minus" data-item="${itemName}">−</button>
            <button class="order-qty-btn plus" data-item="${itemName}">+</button>
          </div>
          <div class="order-item-price">${price.toLocaleString()}원</div>
        </div>
      `;

      // 수량 조절 이벤트
      itemDiv.querySelector('.minus').addEventListener('click', () => {
        if (currentOrder[itemName] > 1) {
          currentOrder[itemName]--;
        } else {
          delete currentOrder[itemName];
        }
        renderOrder();
      });

      itemDiv.querySelector('.plus').addEventListener('click', () => {
        currentOrder[itemName]++;
        renderOrder();
      });

      orderList.appendChild(itemDiv);
    });

    // 주문 내역 표시/숨김
    if (hasOrder) {
      orderSummary.style.display = 'block';
      orderItemCount.textContent = `${itemCount}개`;
      totalAmount.textContent = `${total.toLocaleString()}원`;

      orderPayBtn.disabled = false;
      totalAmountBtn.textContent = `${total.toLocaleString()}원`;
    } else {
      orderSummary.style.display = 'none';
      orderPayBtn.disabled = true;
      totalAmountBtn.textContent = '0원';
    }
  }

  // 초기 렌더링
  renderOrder();

  // 이벤트 리스너
  document.getElementById('orderPayBtn').addEventListener('click', () => {
    if (Object.keys(currentOrder).length === 0) {
      alert('주문할 메뉴를 선택해주세요!');
      return;
    }
    renderPay(currentOrder, store, tableNum);
  });

  document.getElementById('orderBackBtn').addEventListener('click', () => {
    renderStore(store);
  });
}

window.renderOrderScreen = renderOrderScreen;