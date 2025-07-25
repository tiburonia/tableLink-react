
async function renderOrderScreen(store, tableNum, opts = {}) {
  // 주문 상태
  let currentOrder = {};

  // 렌더
  main.innerHTML = `
    <div class="order-header">
      <button id="orderBackBtn" class="header-btn" aria-label="뒤로가기"><span class="header-btn-ico">⬅️</span></button>
      <h2>${store.name}</h2>
      <div class="order-info">
        <span>테이블 <b>${tableNum}</b></span>
        <span style="color:#888;font-size:14px;">${store.category} / ${store.distance}</span>
      </div>
    </div>
    <div class="order-body">
      <div id="menuList"></div>
      <div id="cartList"></div>
      <div class="order-btn-row">
        <button id="orderPayBtn" class="main-btn">결제하기</button>
        <button id="orderCartSaveBtn" class="main-btn sub">장바구니 저장</button>
        <button id="orderCancelBtn" class="main-btn sub">뒤로가기</button>
      </div>
    </div>
    <style>
      .order-header { display:flex; align-items:center; gap:18px; margin-bottom:10px; position:relative;}
      .order-header h2 { margin:0 0 0 2px; font-size:22px; font-weight:700;}
      .order-info { display:flex; flex-direction:column; gap:3px; margin-left:auto;}
      .header-btn { width:36px;height:36px; border-radius:50%;border:none;background:#f8fafd; color:#297efc;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(30,110,255,0.05);}
      .order-body { padding:18px 0 30px 0; }
      #menuList { margin-bottom:15px; }
      .menu-item-card { background:#fff; border-radius:11px; box-shadow:0 2px 10px rgba(40,110,255,0.06); padding:13px 14px 11px 15px; margin-bottom:10px; display:flex; align-items:center; gap:13px;}
      .menu-item-info { flex:1; }
      .menu-item-name { font-size:16px; font-weight:700; }
      .menu-item-price { font-size:15px; color:#297efc; font-weight:600; margin-left:6px;}
      .menu-qty-box { display:flex; align-items:center; gap:8px; }
      .menu-qty-btn { background:#f4f6fb; border:none; border-radius:5px; padding:3px 10px; font-size:17px; cursor:pointer;}
      .menu-add-btn { margin-left:13px; background:#297efc; color:#fff; border:none; border-radius:8px; padding:6px 13px; font-weight:600; cursor:pointer; transition:background 0.13s;}
      .menu-add-btn:active { background:#195fd1;}
      #cartList { margin:18px 0 10px 0; }
      .cart-item { background:#f8f9fb; border-radius:8px; padding:8px 13px 7px 13px; margin-bottom:6px; display:flex;align-items:center;gap:9px;}
      .cart-name { flex:1;font-size:15px; }
      .cart-qty-btn { background:#f1f3f7; border:none; border-radius:5px; padding:3px 9px; font-size:15px; cursor:pointer;}
      .cart-price { color:#297efc; font-size:15px; font-weight:600; min-width:80px; text-align:right;}
      .cart-total { margin:10px 0 4px 0; font-size:17px; font-weight:700; text-align:right;}
      .order-btn-row { display:flex; gap:9px; margin-top:8px;}
      .main-btn { flex:1; font-size:16px; padding:10px 0; border-radius:9px; border:none; font-weight:700; background:#297efc; color:#fff; cursor:pointer; transition:background 0.13s;}
      .main-btn.sub { background:#f6fafd; color:#297efc; border:1.2px solid #dbe7ff;}
      .main-btn:active { background:#195fd1;}
      @media (max-width:480px){ .order-body{padding:7px 0 18px 0;} }
    </style>
  `;

  // 렌더 메뉴 리스트
  const menuList = document.getElementById('menuList');
  if (store.menu && Array.isArray(store.menu)) {
    store.menu.forEach(menu => {
      // 메뉴 아이템 카드
      const card = document.createElement('div');
      card.className = 'menu-item-card';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'menu-item-info';
      infoDiv.innerHTML = `<span class="menu-item-name">${menu.name}</span>
        <span class="menu-item-price">${menu.price.toLocaleString()}원</span>`;

      // 수량 조절
      let qty = 0;
      const qtyBox = document.createElement('div');
      qtyBox.className = 'menu-qty-box';

      const minusBtn = document.createElement('button');
      minusBtn.className = 'menu-qty-btn';
      minusBtn.textContent = '➖';
      const plusBtn = document.createElement('button');
      plusBtn.className = 'menu-qty-btn';
      plusBtn.textContent = '➕';
      const qtyText = document.createElement('span');
      qtyText.textContent = '0';

      minusBtn.addEventListener('click', () => {
        if (qty > 0) qty--;
        qtyText.textContent = qty + '';
      });
      plusBtn.addEventListener('click', () => {
        if (qty < 99) qty++;
        qtyText.textContent = qty + '';
      });

      // 메뉴 추가 버튼
      const addBtn = document.createElement('button');
      addBtn.className = 'menu-add-btn';
      addBtn.textContent = '추가';

      addBtn.addEventListener('click', () => {
        if (qty === 0) return;
        if (currentOrder[menu.name]) {
          currentOrder[menu.name] += qty;
        } else {
          currentOrder[menu.name] = qty;
        }
        qty = 0;
        qtyText.textContent = '0';
        renderCart();
      });

      qtyBox.appendChild(minusBtn);
      qtyBox.appendChild(qtyText);
      qtyBox.appendChild(plusBtn);
      card.appendChild(infoDiv);
      card.appendChild(qtyBox);
      card.appendChild(addBtn);
      menuList.appendChild(card);
    });
  }

  // 렌더 카트(장바구니)
  function renderCart() {
    const cartList = document.getElementById('cartList');
    cartList.innerHTML = '';
    let total = 0;
    let hasOrder = false;
    Object.keys(currentOrder).forEach(itemName => {
      const menu = store.menu.find(m => m.name === itemName);
      if (!menu) return; // 메뉴를 찾을 수 없으면 스킵
      
      const qty = currentOrder[itemName];
      const price = menu.price * qty;
      total += price;
      hasOrder = true;

      // 카트 아이템 카드
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';

      const nameDiv = document.createElement('span');
      nameDiv.className = 'cart-name';
      nameDiv.textContent = `${itemName}`;

      // 수량 조절
      const minusBtn = document.createElement('button');
      minusBtn.className = 'cart-qty-btn';
      minusBtn.textContent = '➖';
      const plusBtn = document.createElement('button');
      plusBtn.className = 'cart-qty-btn';
      plusBtn.textContent = '➕';
      const qtyText = document.createElement('span');
      qtyText.textContent = qty + '';

      minusBtn.addEventListener('click', () => {
        if (currentOrder[itemName] > 1) {
          currentOrder[itemName]--;
        } else {
          delete currentOrder[itemName];
        }
        renderCart();
      });

      plusBtn.addEventListener('click', () => {
        currentOrder[itemName]++;
        renderCart();
      });

      const priceDiv = document.createElement('span');
      priceDiv.className = 'cart-price';
      priceDiv.textContent = `${price.toLocaleString()}원`;

      itemDiv.appendChild(nameDiv);
      itemDiv.appendChild(minusBtn);
      itemDiv.appendChild(qtyText);
      itemDiv.appendChild(plusBtn);
      itemDiv.appendChild(priceDiv);

      cartList.appendChild(itemDiv);
    });

    if (hasOrder) {
      const totalDiv = document.createElement('div');
      totalDiv.className = 'cart-total';
      totalDiv.innerHTML = `<hr style="margin:8px 0 10px 0;">총 결제금액 <b>${total.toLocaleString()}원</b>`;
      cartList.appendChild(totalDiv);
    }
  }
  renderCart();

  // 결제, 저장, 취소
  document.getElementById('orderPayBtn').addEventListener('click', () => {
    if (Object.keys(currentOrder).length === 0) {
      alert('장바구니가 비어있습니다!');
      return;
    }
    // 결제 flow로 넘김
    renderPay(currentOrder, store, tableNum);
  });

  document.getElementById('orderCartSaveBtn').addEventListener('click', async () => {
    if (Object.keys(currentOrder).length === 0) {
      alert('장바구니가 비어있습니다!');
      return;
    }

    try {
      // 장바구니 데이터를 서버에 저장
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
        // 로컬 savedCart도 업데이트 (기존 코드와의 호환성을 위해)
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
      // 서버 오류 시 로컬 저장으로 폴백
      if (typeof saveCartBtn === 'function') {
        saveCartBtn(currentOrder, store, tableNum);
        alert('장바구니가 로컬에 저장되었습니다!');
      } else {
        alert('장바구니 저장에 실패했습니다.');
      }
    }
  });

  document.getElementById('orderCancelBtn').addEventListener('click', () => {
    renderStore(store); // 매장 상세로 돌아가기
  });

  // 상단 뒤로가기 버튼
  document.getElementById('orderBackBtn').addEventListener('click', () => {
    renderStore(store);
  });
}

window.renderOrderScreen = renderOrderScreen;
