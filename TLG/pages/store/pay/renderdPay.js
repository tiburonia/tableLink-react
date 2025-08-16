function renderPay(currentOrder, store, tableNum) {
  console.log('💳 결제 화면 렌더링 시작 - 매장:', store, '테이블:', tableNum);

  // 매장 메뉴 데이터 안전하게 처리
  let menuData = [];
  if (store.menu && Array.isArray(store.menu)) {
    menuData = store.menu;
  } else if (typeof store.menu === 'string') {
    try {
      menuData = JSON.parse(store.menu);
    } catch (error) {
      console.warn('⚠️ 매장 메뉴 JSON 파싱 실패:', error);
      menuData = [];
    }
  }

  // 주문 데이터 준비
  let total = 0;
  const items = [];
  for (const name in currentOrder) {
    const qty = currentOrder[name];
    const menu = menuData.find(m => m.name === name);
    if (!menu) {
      console.warn(`⚠️ 메뉴 "${name}"를 찾을 수 없습니다`);
      continue;
    }
    const price = menu.price * qty;
    total += price;
    items.push({ name, qty, price: menu.price, totalPrice: price });
  }

  const orderData = {
    store: store.name,
    storeId: store.id,
    date: new Date().toLocaleString(),
    table: tableNum,
    tableNum: tableNum,
    items,
    total
  };

  console.log('💳 주문 데이터 준비 완료:', orderData);

  // HTML 렌더링
  main.innerHTML = `
    <div class="pay-header">
      <button id="payBackBtn" class="header-btn" aria-label="뒤로가기"><span class="header-btn-ico">⬅️</span></button>
      <h2>결제 확인</h2>
    </div>
    <div class="pay-info">
      <p><strong>매장:</strong> ${orderData.store}</p>
      <p><strong>테이블:</strong> ${orderData.table}</p>
      <div class="order-items">
        <h3>주문 내역</h3>
        ${items.map(item => `
          <div class="order-item">
            <span>${item.name} x ${item.qty}</span>
            <span>${item.totalPrice.toLocaleString()}원</span>
          </div>
        `).join('')}
      </div>
      <p><strong>결제금액:</strong> ${orderData.total.toLocaleString()}원</p>
      <p id="storePointDisplay"></p>
      <label>포인트 사용:
        <input type="number" id="usePoint" min="0" max="0" value="0">
      </label>
      <div id="couponList" style="margin:10px 0 0 0;"></div>
      <div class="pay-summary">
        <p id="finalAmount">최종 결제금액: ${orderData.total.toLocaleString()}원</p>
        <p id="pointEarned">적립 예정 포인트: ${Math.floor(orderData.total * 0.1).toLocaleString()}원</p>
        <p id="discountAmount">할인된 금액: 0원</p>
      </div>
      <div class="pay-btn-row">
        <button id="confirmPay" class="main-btn">결제 확정</button>
        <button id="cancelPay" class="main-btn sub">취소</button>
      </div>
    </div>
    <style>
      .pay-header { display:flex;align-items:center;gap:12px;margin-bottom:8px;}
      .pay-header h2 { font-size:21px; font-weight:700; margin:0;}
      .header-btn { width:36px;height:36px; border-radius:50%;border:none;background:#f8fafd; color:#297efc;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(30,110,255,0.05);}
      .pay-info { background:#fff;border-radius:14px;box-shadow:0 2px 14px rgba(30,110,255,0.06);padding:22px 16px 22px 16px;max-width:400px;margin:25px auto 0 auto;}
      .order-items { margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 8px; }
      .order-items h3 { margin: 0 0 10px 0; font-size: 16px; }
      .order-item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 14px; }
      .pay-summary p { font-size:15px; margin:7px 0;}
      .pay-btn-row { display:flex;gap:8px;margin-top:18px;}
      .main-btn { flex:1; font-size:16px; padding:10px 0; border-radius:9px; border:none; font-weight:700; background:#297efc; color:#fff; cursor:pointer; transition:background 0.13s;}
      .main-btn.sub { background:#f6fafd; color:#297efc; border:1.2px solid #dbe7ff;}
      .main-btn:active { background:#195fd1;}
      label { font-size:15px;margin-bottom:7px;display:block;}
      input[type="number"] { padding:3px 8px; border-radius:6px; border:1.2px solid #ddd;font-size:15px; margin-left:7px;}
    </style>
  `;

  // 요소 선택
  const usePointInput = document.getElementById('usePoint');
  const storePointDisplay = document.getElementById('storePointDisplay');
  const finalAmount = document.getElementById('finalAmount');
  const pointEarned = document.getElementById('pointEarned');
  const couponList = document.getElementById('couponList');
  const discountAmount = document.getElementById('discountAmount');

  // 매장별 포인트 조회 및 표시
  let storePoints = 0;
  try {
    const storePointsResponse = await fetch(`/api/regular-levels/user/${userInfo.id}/store/${store.id}/points`);
    if (storePointsResponse.ok) {
      const storePointsData = await storePointsResponse.json();
      storePoints = storePointsData.success ? (storePointsData.points || 0) : 0;
    }
  } catch (error) {
    console.error('매장별 포인트 조회 실패:', error);
  }

  // 포인트 사용 섹션
  storePointDisplay.innerHTML = `<p><strong>${store.name} 보유 포인트:</strong> ${storePoints.toLocaleString()}원</p>`;
  usePointInput.max = storePoints;
  usePointInput.placeholder = `사용할 포인트 (최대 ${storePoints})`;


  // 쿠폰 리스트 렌더링
  let select = null;
  if (!userInfo.coupons?.unused || userInfo.coupons.unused.length === 0) {
    couponList.innerHTML = `<p>보유한 쿠폰이 없습니다.</p>`;
  } else {
    const label = document.createElement('label');
    label.textContent = '쿠폰 선택: ';
    select = document.createElement('select');
    select.id = 'selectedCoupon';
    select.innerHTML = `<option value="">사용하지 않음</option>`;
    userInfo.coupons.unused
      .filter(c => new Date(c.validUntil) >= new Date())
      .forEach(coupon => {
        const option = document.createElement('option');
        option.value = coupon.id;
        option.textContent = `${coupon.name} (${coupon.discountValue}${coupon.discountType === 'percent' ? '%' : '원'})`;
        select.appendChild(option);
      });
    label.appendChild(select);
    couponList.appendChild(label);
  }

  // 할인 계산 함수
  function calculateBestPayment(orderTotal, coupon, userStorePoints, enteredPoint) {
    enteredPoint = Math.min(enteredPoint, userStorePoints, orderTotal);
    let discount1 = 0;
    if (coupon?.discountType === 'percent') {
      discount1 = Math.floor(orderTotal * (coupon.discountValue / 100));
    } else if (coupon?.discountType === 'fixed') {
      discount1 = coupon.discountValue;
    }
    const afterCoupon = Math.max(orderTotal - discount1, 0);
    const appliedPoint1 = Math.min(enteredPoint, afterCoupon);
    const final1 = Math.max(afterCoupon - appliedPoint1, 0);

    const afterPoint = Math.max(orderTotal - enteredPoint, 0);
    let discount2 = 0;
    if (coupon?.discountType === 'percent') {
      discount2 = Math.floor(afterPoint * (coupon.discountValue / 100));
    } else if (coupon?.discountType === 'fixed') {
      discount2 = coupon.discountValue;
    }
    const final2 = Math.max(afterPoint - discount2, 0);

    if (final1 < final2) {
      return {
        final: final1,
        appliedPoint: appliedPoint1,
        couponDiscount: discount1,
        strategy: 'couponFirst'
      };
    } else {
      return {
        final: final2,
        appliedPoint: enteredPoint,
        couponDiscount: discount2,
        strategy: 'pointFirst'
      };
    }
  }

  // 실시간 반영 함수
  function updateFinalAmount() {
    const enteredPoint = Number(usePointInput.value) || 0;
    const selectedCouponId = document.getElementById('selectedCoupon')?.value;
    const selectedCoupon = userInfo.coupons?.unused?.find(c => c.id == selectedCouponId);

    const result = calculateBestPayment(orderData.total, selectedCoupon, storePoints, enteredPoint);

    finalAmount.textContent = `최종 결제금액: ${result.final.toLocaleString()}원`;
    pointEarned.textContent = `적립 예정 포인트: ${Math.floor(orderData.total * 0.1).toLocaleString()}원`;

    const totalDiscount = result.couponDiscount + result.appliedPoint;
    discountAmount.textContent = `할인된 금액: ${totalDiscount.toLocaleString()}원`;
  }

  // 이벤트 등록
  usePointInput.addEventListener('input', updateFinalAmount);
  document.getElementById('selectedCoupon')?.addEventListener('change', updateFinalAmount);

  document.getElementById('confirmPay').addEventListener('click', async () => {
    const enteredPoint = Number(usePointInput.value) || 0;
    const selectedCouponId = document.getElementById('selectedCoupon')?.value;
    const selectedCoupon = userInfo.coupons?.unused?.find(c => c.id == selectedCouponId);

    const result = calculateBestPayment(orderData.total, selectedCoupon, storePoints, enteredPoint);

    await confirmPay(
      orderData,
      result.appliedPoint,
      store,
      currentOrder,
      result.final,
      selectedCoupon?.id || null,
      result.couponDiscount
    );
  });

  document.getElementById('cancelPay').addEventListener('click', () => {
    renderOrderScreen(store, tableNum);
  });

  document.getElementById('payBackBtn').addEventListener('click', () => {
    renderOrderScreen(store, tableNum);
  });

  // 최초 1회 초기 계산
  updateFinalAmount();
}

window.renderPay = renderPay;