
/**
 * TLL 주문 화면 렌더링 (현재 DB 스키마에 맞게 수정)
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
      // 현재 스키마의 users.user_id는 문자열이므로 그대로 사용
      requestBody.user_id = userInfo.id;
    } else {
      requestBody.guest_phone = userInfo.phone || '010-0000-0000';
    }

    console.log('🔄 TLL 체크 생성 요청:', requestBody);

    const checkResponse = await fetch('/api/tll/checks/from-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      throw new Error(errorData.error || '체크 생성 실패');
    }

    const checkResult = await checkResponse.json();
    const checkId = checkResult.check_id;

    console.log('✅ TLL 체크 생성 완료:', checkId);

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
      <div class="tll-order-screen">
        <div class="order-header">
          <button class="back-btn" onclick="TLL()">
            ← 매장 선택으로 돌아가기
          </button>
          <div class="store-info">
            <h2>${store.name}</h2>
            <p>${finalTableName}</p>
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
            <div class="cart-total">
              <span>총 금액: <strong id="totalAmount">0원</strong></span>
            </div>
            <button class="order-btn" id="orderBtn" disabled onclick="processTLLOrder()">
              주문하기
            </button>
          </div>
        </div>
      </div>

      <style>
        .tll-order-screen {
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
        }

        .back-btn:hover {
          background: #5a6268;
        }

        .store-info h2 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .store-info p {
          margin: 0;
          color: #666;
          font-size: 14px;
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
        }

        .menu-item:hover {
          border-color: #007bff;
          box-shadow: 0 2px 8px rgba(0,123,255,0.15);
        }

        .menu-item h4 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 16px;
        }

        .menu-item p {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
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
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }

        .cart-item:last-child {
          border-bottom: none;
        }

        .cart-item-info {
          flex: 1;
        }

        .cart-item-name {
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
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
          width: 30px;
          height: 30px;
          border: 1px solid #ddd;
          background: #f8f9fa;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quantity-btn:hover {
          background: #e9ecef;
        }

        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity {
          min-width: 30px;
          text-align: center;
          font-weight: bold;
        }

        .cart-total {
          text-align: right;
          padding: 15px 0;
          border-top: 2px solid #eee;
          margin-bottom: 15px;
        }

        .cart-total span {
          font-size: 18px;
        }

        .order-btn {
          width: 100%;
          background: #28a745;
          color: white;
          border: none;
          padding: 15px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }

        .order-btn:hover:not(:disabled) {
          background: #218838;
        }

        .order-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .order-content {
            grid-template-columns: 1fr;
          }

          .menu-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;

    // 전역 변수 설정
    window.currentTLLOrder = {
      checkId: checkId,
      storeId: store.id,
      storeName: store.name,
      tableName: finalTableName,
      tableNumber: finalTableNumber,
      cart: []
    };

    // 메뉴 클릭 이벤트 설정
    setupMenuEvents();

    console.log('✅ TLL 주문 화면 렌더링 완료');

  } catch (error) {
    console.error('❌ TLL 주문 화면 로드 실패:', error);
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
    <div class="menu-item" onclick="addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})">
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
  const cartItems = document.getElementById('cartItems');
  const totalAmount = document.getElementById('totalAmount');
  const orderBtn = document.getElementById('orderBtn');

  if (!window.currentTLLOrder || window.currentTLLOrder.cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">메뉴를 선택해주세요</p>';
    totalAmount.textContent = '0원';
    orderBtn.disabled = true;
    return;
  }

  let total = 0;
  const cartHTML = window.currentTLLOrder.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${item.price.toLocaleString()}원</div>
        </div>
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
          <button class="quantity-btn" onclick="removeFromCart('${item.id}')" style="margin-left: 10px; background: #dc3545; color: white;">×</button>
        </div>
      </div>
    `;
  }).join('');

  cartItems.innerHTML = cartHTML;
  totalAmount.textContent = total.toLocaleString() + '원';
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

// TLL 주문 처리
window.processTLLOrder = async function() {
  try {
    if (!window.currentTLLOrder || window.currentTLLOrder.cart.length === 0) {
      alert('주문할 메뉴를 선택해주세요.');
      return;
    }

    const orderBtn = document.getElementById('orderBtn');
    orderBtn.disabled = true;
    orderBtn.textContent = '주문 처리 중...';

    // 주문 아이템 변환
    const items = window.currentTLLOrder.cart.map(item => ({
      menu_name: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      options: {},
      notes: ''
    }));

    // 총액 계산
    const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    console.log('🛒 TLL 주문 전송:', { checkId: window.currentTLLOrder.checkId, items, totalAmount });

    // TLL 주문 API 호출
    const orderResponse = await fetch('/api/tll/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        check_id: window.currentTLLOrder.checkId,
        items: items,
        payment_method: 'TOSS'
      })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(errorData.error || '주문 처리 실패');
    }

    const orderResult = await orderResponse.json();
    console.log('✅ TLL 주문 생성 완료:', orderResult);

    // 결제 처리
    if (orderResult.payment_required) {
      await processTLLPayment(window.currentTLLOrder.checkId, totalAmount);
    } else {
      alert('주문이 완료되었습니다!');
      renderMap();
    }

  } catch (error) {
    console.error('❌ TLL 주문 처리 실패:', error);
    alert('주문 처리 중 오류가 발생했습니다: ' + error.message);

    const orderBtn = document.getElementById('orderBtn');
    orderBtn.disabled = false;
    orderBtn.textContent = '주문하기';
  }
};

// TLL 결제 처리
async function processTLLPayment(checkId, amount) {
  try {
    console.log('💳 TLL 결제 처리 시작:', { checkId, amount });

    // 토스페이먼츠 모듈 확인
    if (!window.requestTossPayment) {
      console.log('🔄 토스페이먼츠 모듈 로드 중...');
      await import('/TLG/pages/store/pay/tossPayments.js');

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!window.requestTossPayment) {
        throw new Error('토스페이먼츠 모듈을 로드할 수 없습니다.');
      }
    }

    const userInfo = getUserInfo();
    const orderId = `TLL_${checkId}_${Date.now()}`;

    // TLL 주문 정보 임시 저장
    sessionStorage.setItem('tllPendingOrder', JSON.stringify({
      checkId: checkId,
      orderId: orderId,
      amount: amount,
      timestamp: Date.now()
    }));

    // 토스페이먼츠 결제 요청
    const paymentResult = await window.requestTossPayment({
      amount: amount,
      orderId: orderId,
      orderName: `${window.currentTLLOrder.storeName} - ${window.currentTLLOrder.tableName}`,
      customerName: userInfo.name || '고객',
      customerEmail: userInfo.email || 'customer@tablelink.com'
    }, 'CARD');

    if (!paymentResult.success) {
      throw new Error(paymentResult.message || '결제에 실패했습니다.');
    }

  } catch (error) {
    console.error('❌ TLL 결제 처리 실패:', error);
    alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
  }
}

// 메뉴 이벤트 설정
function setupMenuEvents() {
  // 이미 함수들이 window 객체에 등록되어 있으므로 추가 설정 불필요
  console.log('✅ TLL 메뉴 이벤트 설정 완료');
}

// 사용자 정보 가져오기 (기존 함수 재사용)
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

console.log('✅ TLL 주문 화면 모듈 로드 완료');
