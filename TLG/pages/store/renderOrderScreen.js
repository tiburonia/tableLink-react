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
        <div class="order-content-inner">
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
            <div id="orderList" class="order-list-content"></div>
            <div class="order-total">
              <div class="total-label">총 주문금액</div>
              <div id="totalAmount" class="total-amount">0원</div>
            </div>
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
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        overflow: hidden;
      }

      /* 헤더 - 고정 높이 */
      .order-header {
        height: 80px;
        background: white;
        padding: 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
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

      /* 메인 콘텐츠 - 중간 유동 공간, 스크롤 가능 */
      .order-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 600px;
        margin: 0 auto;
        width: 100%;
      }

      .order-content-inner {
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding-bottom: 20px;
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

      .order-list-content {
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

      /* 푸터 - 고정 높이 */
      .bottom-actions {
        height: 120px;
        background: white;
        padding: 20px;
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 600px;
        margin: 0 auto;
        width: 100%;
        flex-shrink: 0;
      }

      .pay-btn {
        width: 100%;
        height: 60px;
        border: none;
        border-radius: 16px;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        font-size: 18px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
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
/**
 * TLL 주문 화면 렌더링 (새 스키마)
 */
window.renderOrderScreen = async function(store, tableName) {
  try {
    console.log('🛒 TLL 주문 화면 로드:', { store: store.name, table: tableName });

    // 사용자 정보 확인
    const userInfo = getUserInfo();
    if (!userInfo) {
      alert('로그인이 필요합니다.');
      renderLogin();
      return;
    }

    // QR 코드 생성 (테이블명에서 번호 추출)
    let tableNumber = tableName.replace(/[^0-9]/g, '');

    // 테이블명이 undefined이거나 비어있는 경우 처리
    if (!tableName || tableName === 'undefined') {
      tableName = '1번';
      console.warn('⚠️ 테이블명이 유효하지 않아 기본값 사용:', tableName);
    }

    // 테이블 번호가 없으면 테이블 이름에서 번호 추출 시도
    if (!tableNumber) {
      // "테이블 1", "1번 테이블", "1번" 등의 형태에서 번호 추출 시도
      const match = tableName.match(/(\d+)/);
      if (match) {
        tableNumber = match[1];
      } else {
        // 번호가 없으면 기본값 사용 (예: "VIP" -> "1")
        console.warn('⚠️ 테이블에서 번호를 추출할 수 없어 기본값 1 사용:', tableName);
        tableNumber = '1';
      }
    }

    const qrCode = `TABLE_${tableNumber}`;
    console.log(`📱 QR 코드 생성: ${qrCode} (테이블: ${tableName}, 번호: ${tableNumber})`);

    // 사용자 정보 검증 - 체크 제약조건 준수
    let requestBody = {
      qr_code: qrCode
    };

    // 회원이면 user_id 사용, 아니면 guest_phone 사용
    if (userInfo.id && userInfo.id !== 'guest') {
      requestBody.user_id = userInfo.id;
    } else if (userInfo.phone) {
      requestBody.guest_phone = userInfo.phone;
    } else {
      // 둘 다 없으면 기본 게스트 정보 생성
      requestBody.guest_phone = '010-0000-0000';
    }

    console.log('📝 TLL 체크 생성 요청:', requestBody);

    // TLL 체크 생성
    const checkResponse = await fetch('/api/tll/checks/from-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
        <div class="order-header">
          <button class="back-btn" onclick="renderMap()">← 돌아가기</button>
          <div class="store-info">
            <h2>${store.name}</h2>
            <p>${tableName} 테이블</p>
          </div>
        </div>

        <div class="menu-section">
          <h3>메뉴 선택</h3>
          <div id="menuList" class="menu-list">
            ${menu.map(item => `
              <div class="menu-item" data-menu='${JSON.stringify(item)}'>
                <div class="menu-info">
                  <h4>${item.name}</h4>
                  <p class="menu-price">₩${item.price.toLocaleString()}</p>
                  ${item.description ? `<p class="menu-desc">${item.description}</p>` : ''}
                </div>
                <div class="menu-actions">
                  <button class="add-btn" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                    + 담기
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="cart-section">
          <h3>주문 내역</h3>
          <div id="cartItems" class="cart-items"></div>
          <div class="cart-total">
            <span>총 주문금액: </span>
            <span id="totalAmount">₩0</span>
          </div>
          <button id="orderBtn" class="order-btn" disabled onclick="submitOrder()">
            주문하기
          </button>
        </div>
      </div>

      <style>
        .tll-order-screen {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .order-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }

        .back-btn {
          padding: 10px 20px;
          background: #f0f0f0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
        }

        .store-info h2 {
          margin: 0;
          color: #333;
        }

        .store-info p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 14px;
        }

        .menu-section {
          margin-bottom: 30px;
        }

        .menu-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .menu-item {
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 20px;
          background: white;
          transition: all 0.2s ease;
        }

        .menu-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .menu-info h4 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #333;
        }

        .menu-price {
          font-size: 16px;
          font-weight: bold;
          color: #e91e63;
          margin: 0 0 8px 0;
        }

        .menu-desc {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .add-btn {
          width: 100%;
          padding: 10px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 15px;
          transition: background 0.2s ease;
        }

        .add-btn:hover {
          background: #1976d2;
        }

        .cart-section {
          position: sticky;
          bottom: 0;
          background: white;
          padding: 20px;
          border-top: 2px solid #eee;
          border-radius: 12px 12px 0 0;
        }

        .cart-items {
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 15px;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .cart-item:last-child {
          border-bottom: none;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: bold;
          margin-bottom: 4px;
        }

        .item-price {
          color: #666;
          font-size: 14px;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .qty-btn {
          width: 30px;
          height: 30px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
        }

        .qty-btn:hover {
          background: #f0f0f0;
        }

        .quantity {
          min-width: 30px;
          text-align: center;
          font-weight: bold;
        }

        .remove-btn {
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          cursor: pointer;
          font-size: 12px;
        }

        .cart-total {
          text-align: right;
          font-size: 18px;
          font-weight: bold;
          margin: 15px 0;
          padding: 15px 0;
          border-top: 2px solid #eee;
        }

        .order-btn {
          width: 100%;
          padding: 15px;
          font-size: 18px;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .order-btn:enabled {
          background: #4caf50;
          color: white;
        }

        .order-btn:enabled:hover {
          background: #45a049;
        }

        .order-btn:disabled {
          background: #ccc;
          color: #666;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .menu-list {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;

    // 장바구니 상태 관리
    let cart = [];

    // 전역 함수들 등록
    window.addToCart = function(menuItem) {
      const existingIndex = cart.findIndex(item => item.id === menuItem.id);

      if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          ...menuItem,
          quantity: 1,
          totalPrice: menuItem.price
        });
      }

      updateCartDisplay();
      console.log('🛒 TLL 장바구니에 추가:', menuItem.name);
    };

    window.updateQuantity = function(menuId, change) {
      const itemIndex = cart.findIndex(item => item.id === menuId);
      if (itemIndex >= 0) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
          cart.splice(itemIndex, 1);
        } else {
          cart[itemIndex].totalPrice = cart[itemIndex].price * cart[itemIndex].quantity;
        }
        updateCartDisplay();
      }
    };

    window.removeFromCart = function(menuId) {
      cart = cart.filter(item => item.id !== menuId);
      updateCartDisplay();
      console.log('🗑️ TLL 장바구니에서 제거:', menuId);
    };

    function updateCartDisplay() {
      const cartItemsEl = document.getElementById('cartItems');
      const totalAmountEl = document.getElementById('totalAmount');
      const orderBtn = document.getElementById('orderBtn');

      if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">주문할 메뉴를 선택해주세요</p>';
        totalAmountEl.textContent = '₩0';
        orderBtn.disabled = true;
        return;
      }

      const cartHTML = cart.map(item => `
        <div class="cart-item">
          <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-price">₩${item.price.toLocaleString()} × ${item.quantity}</div>
          </div>
          <div class="quantity-controls">
            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
            <span class="quantity">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">삭제</button>
          </div>
        </div>
      `).join('');

      cartItemsEl.innerHTML = cartHTML;

      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      totalAmountEl.textContent = `₩${total.toLocaleString()}`;
      orderBtn.disabled = false;
    }

    window.submitOrder = async function() {
      try {
        if (cart.length === 0) {
          alert('주문할 메뉴를 선택해주세요.');
          return;
        }

        console.log('📝 TLL 주문 제출 시작:', cart);

        // 주문 아이템 변환
        const orderItems = cart.map(item => ({
          menu_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
          options: {},
          notes: ''
        }));

        // TLL 주문 생성 API 호출
        const orderResponse = await fetch('/api/tll/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

        // 결제 화면으로 이동
        const totalAmount = orderResult.total_amount;

        // 주문 정보 저장 (결제 완료 후 사용)
        sessionStorage.setItem('tllPendingOrder', JSON.stringify({
          checkId: checkId,
          storeId: store.id,
          storeName: store.name,
          tableNumber: tableNumber,
          tableName: tableName,
          items: cart,
          totalAmount: totalAmount
        }));

        // 토스페이먼츠 결제 시작
        if (typeof window.TossPayments !== 'undefined') {
          window.TossPayments.requestPayment('카드', {
            amount: totalAmount,
            orderId: `TLL_${checkId}_${Date.now()}`,
            orderName: `${store.name} - ${tableName}`,
            customerName: userInfo.name || '고객',
            customerEmail: userInfo.email || '',
            customerMobilePhone: userInfo.phone || '',
            successUrl: `${window.location.origin}/toss-success.html`,
            failUrl: `${window.location.origin}/toss-fail.html`
          });
        } else {
          throw new Error('토스페이먼츠 라이브러리가 로드되지 않았습니다');
        }

      } catch (error) {
        console.error('❌ TLL 주문 제출 실패:', error);
        alert('주문 처리 중 오류가 발생했습니다: ' + error.message);
      }
    };

    // 초기 장바구니 표시 업데이트
    updateCartDisplay();

    console.log('✅ TLL 주문 화면 렌더링 완료');

  } catch (error) {
    console.error('❌ TLL 주문 화면 로드 실패:', error);
    alert('주문 화면을 불러올 수 없습니다: ' + error.message);
    renderMap();
  }
};