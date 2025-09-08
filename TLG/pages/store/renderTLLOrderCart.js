
/**
 * TLL 장바구니 기반 주문 화면 (DB 체크 생성 없이 클라이언트에서만 관리)
 */
window.renderTLLOrderCart = async function(store, tableName, tableNumber) {
  try {
    console.log('🛒 TLL 장바구니 주문 화면 로드:', { store: store.name, table: tableName, tableNum: tableNumber });

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

    // 메뉴 데이터 로드
    let menuData = [];
    try {
      if (store.menu && Array.isArray(store.menu)) {
        menuData = store.menu;
      } else {
        console.log('🔄 매장 메뉴 데이터 로드 중...');
        const menuResponse = await fetch(`/api/stores/${store.id}/menu`);
        if (menuResponse.ok) {
          const menuResult = await menuResponse.json();
          menuData = menuResult.menu || [];
        } else {
          console.warn('⚠️ 메뉴 데이터 로드 실패, 기본 메뉴 사용');
          menuData = getDefaultMenu();
        }
      }
    } catch (menuError) {
      console.warn('⚠️ 메뉴 로드 오류:', menuError);
      menuData = getDefaultMenu();
    }

    // 주문 화면 렌더링
    const main = document.getElementById('main');
    if (!main) {
      console.error('❌ main 요소를 찾을 수 없습니다');
      return;
    }

    main.innerHTML = `
      <div class="tll-cart-screen">
        <div class="order-header">
          <button class="back-btn" onclick="TLL()">
            ← 매장 선택으로 돌아가기
          </button>
          <div class="store-info">
            <h2>${store.name}</h2>
            <p>${finalTableName}</p>
            <div class="order-type-badge">
              <span class="badge-icon">📱</span>
              QR 주문
            </div>
          </div>
        </div>

        <div class="order-content">
          <div class="menu-section">
            <h3>메뉴 선택</h3>
            <div class="menu-grid" id="menuGrid">
              ${renderMenuItems(menuData)}
            </div>
          </div>

          <div class="cart-section">
            <h3>주문 내역</h3>
            <div class="cart-items" id="cartItems">
              <p class="empty-cart">메뉴를 선택해주세요</p>
            </div>
            <div class="cart-summary">
              <div class="cart-total">
                <span>총 금액: <strong id="totalAmount">0원</strong></span>
              </div>
              <div class="order-note">
                <textarea id="orderNote" placeholder="주문 요청사항을 입력해주세요 (선택사항)" maxlength="200"></textarea>
              </div>
            </div>
            <button class="proceed-btn" id="proceedBtn" disabled onclick="proceedToPayment()">
              <span class="btn-icon">💳</span>
              결제하기
            </button>
          </div>
        </div>
      </div>

      <style>
        .tll-cart-screen {
          min-height: 100vh;
          background: #f8f9fa;
          padding: 20px;
        }

        .order-header {
          max-width: 1200px;
          margin: 0 auto 20px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .back-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .back-btn:hover {
          background: #5a6268;
        }

        .store-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .store-info h2 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 24px;
        }

        .store-info p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .order-type-badge {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .badge-icon {
          font-size: 16px;
        }

        .order-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        .menu-section, .cart-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .menu-section h3, .cart-section h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 20px;
          font-weight: 600;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          max-height: 600px;
          overflow-y: auto;
        }

        .menu-item {
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .menu-item:hover {
          border-color: #007bff;
          box-shadow: 0 4px 12px rgba(0,123,255,0.15);
          transform: translateY(-2px);
        }

        .menu-item h4 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }

        .menu-item p {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.4;
        }

        .menu-item .price {
          color: #007bff;
          font-weight: bold;
          font-size: 16px;
        }

        .cart-items {
          min-height: 200px;
          margin-bottom: 20px;
        }

        .empty-cart {
          text-align: center;
          color: #999;
          padding: 40px 0;
          font-style: italic;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #eee;
        }

        .cart-item:last-child {
          border-bottom: none;
        }

        .cart-item-info {
          flex: 1;
        }

        .cart-item-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
          font-size: 16px;
        }

        .cart-item-price {
          color: #666;
          font-size: 14px;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .quantity-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #ddd;
          background: #f8f9fa;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transition: all 0.2s;
        }

        .quantity-btn:hover {
          background: #e9ecef;
          border-color: #adb5bd;
        }

        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity {
          min-width: 30px;
          text-align: center;
          font-weight: bold;
          font-size: 16px;
        }

        .remove-btn {
          background: #dc3545 !important;
          color: white !important;
          border-color: #dc3545 !important;
          margin-left: 5px;
        }

        .remove-btn:hover {
          background: #c82333 !important;
          border-color: #bd2130 !important;
        }

        .cart-summary {
          border-top: 2px solid #eee;
          padding-top: 20px;
        }

        .cart-total {
          text-align: right;
          margin-bottom: 15px;
        }

        .cart-total span {
          font-size: 18px;
        }

        .order-note {
          margin-bottom: 20px;
        }

        .order-note textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          resize: vertical;
          min-height: 60px;
          font-family: inherit;
          font-size: 14px;
        }

        .order-note textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .proceed-btn {
          width: 100%;
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          border: none;
          padding: 16px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .proceed-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #218838, #1fa57a);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40,167,69,0.3);
        }

        .proceed-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-icon {
          font-size: 18px;
        }

        @media (max-width: 768px) {
          .order-content {
            grid-template-columns: 1fr;
          }

          .menu-grid {
            grid-template-columns: 1fr;
          }

          .store-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .order-type-badge {
            align-self: flex-end;
          }
        }
      </style>
    `;

    // 전역 변수 설정 (체크 ID 없이 장바구니만 관리)
    window.currentTLLCart = {
      storeId: store.id,
      storeName: store.name,
      tableName: finalTableName,
      tableNumber: finalTableNumber,
      cart: [],
      userInfo: userInfo
    };

    // 메뉴 클릭 이벤트 설정
    setupCartEvents();

    console.log('✅ TLL 장바구니 주문 화면 렌더링 완료');

  } catch (error) {
    console.error('❌ TLL 장바구니 주문 화면 로드 실패:', error);
    alert('주문 화면 로드에 실패했습니다: ' + error.message);
    TLL();
  }
};

// 메뉴 아이템 렌더링
function renderMenuItems(menuData) {
  if (!menuData || menuData.length === 0) {
    return '<p style="text-align: center; color: #999;">메뉴 정보가 없습니다.</p>';
  }

  return menuData.map(item => `
    <div class="menu-item" onclick="addToTLLCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})">
      <h4>${item.name}</h4>
      <p>${item.description || ''}</p>
      <div class="price">${item.price.toLocaleString()}원</div>
    </div>
  `).join('');
}

// 기본 메뉴 데이터
function getDefaultMenu() {
  return [
    { id: '1', name: '김치찌개', description: '돼지고기와 김치가 들어간 찌개', price: 8000 },
    { id: '2', name: '된장찌개', description: '국산 콩으로 만든 된장찌개', price: 7000 },
    { id: '3', name: '불고기', description: '양념에 재운 소고기 불고기', price: 15000 },
    { id: '4', name: '비빔밥', description: '각종 나물이 들어간 비빔밥', price: 9000 },
    { id: '5', name: '냉면', description: '시원한 물냉면', price: 10000 }
  ];
}

// 장바구니에 추가
window.addToTLLCart = function(menuId, menuName, price) {
  if (!window.currentTLLCart) return;

  const existingItem = window.currentTLLCart.cart.find(item => item.id === menuId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    window.currentTLLCart.cart.push({
      id: menuId,
      name: menuName,
      price: price,
      quantity: 1
    });
  }

  updateTLLCartDisplay();
  console.log('🛒 TLL 장바구니에 추가:', menuName);
};

// 장바구니 표시 업데이트
function updateTLLCartDisplay() {
  const cartItems = document.getElementById('cartItems');
  const totalAmount = document.getElementById('totalAmount');
  const proceedBtn = document.getElementById('proceedBtn');

  if (!window.currentTLLCart || window.currentTLLCart.cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">메뉴를 선택해주세요</p>';
    totalAmount.textContent = '0원';
    proceedBtn.disabled = true;
    return;
  }

  let total = 0;
  const cartHTML = window.currentTLLCart.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${item.price.toLocaleString()}원 x ${item.quantity}</div>
        </div>
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateTLLQuantity('${item.id}', -1)">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="quantity-btn" onclick="updateTLLQuantity('${item.id}', 1)">+</button>
          <button class="quantity-btn remove-btn" onclick="removeFromTLLCart('${item.id}')">×</button>
        </div>
      </div>
    `;
  }).join('');

  cartItems.innerHTML = cartHTML;
  totalAmount.textContent = total.toLocaleString() + '원';
  proceedBtn.disabled = false;
}

// 수량 변경
window.updateTLLQuantity = function(menuId, change) {
  if (!window.currentTLLCart) return;

  const item = window.currentTLLCart.cart.find(item => item.id === menuId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromTLLCart(menuId);
  } else {
    updateTLLCartDisplay();
  }
};

// 장바구니에서 제거
window.removeFromTLLCart = function(menuId) {
  if (!window.currentTLLCart) return;

  window.currentTLLCart.cart = window.currentTLLCart.cart.filter(item => item.id !== menuId);
  updateTLLCartDisplay();
};

// 결제로 진행
window.proceedToPayment = async function() {
  try {
    if (!window.currentTLLCart || window.currentTLLCart.cart.length === 0) {
      alert('주문할 메뉴를 선택해주세요.');
      return;
    }

    console.log('💳 TLL 결제 진행:', window.currentTLLCart);

    // 결제 화면으로 이동 (renderTLLPay 함수 호출)
    await window.renderTLLPay(window.currentTLLCart);

  } catch (error) {
    console.error('❌ TLL 결제 진행 실패:', error);
    alert('결제 진행 중 오류가 발생했습니다: ' + error.message);
  }
};

// 이벤트 설정
function setupCartEvents() {
  console.log('✅ TLL 장바구니 이벤트 설정 완료');
}

// 사용자 정보 가져오기
function getUserInfo() {
  try {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

    if (userInfoCookie) {
      const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
      return JSON.parse(userInfoValue);
    }

    const localStorageUserInfo = localStorage.getItem('userInfo');
    if (localStorageUserInfo) {
      return JSON.parse(localStorageUserInfo);
    }

    if (window.userInfo && window.userInfo.id) {
      return window.userInfo;
    }

    return null;
  } catch (error) {
    console.error('❌ 사용자 정보 파싱 오류:', error);
    return null;
  }
}

console.log('✅ TLL 장바구니 주문 화면 모듈 로드 완료');
