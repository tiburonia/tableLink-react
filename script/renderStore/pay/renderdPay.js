function renderPay(currentOrder, store) {
  // 주문 데이터 준비
  let total = 0;
  const items = [];
  for (const name in currentOrder) {
    const qty = currentOrder[name];
    const menu = store.menu.find(m => m.name === name);
    const price = menu.price * qty;
    total += price;
    items.push({ name, qty, price });
  }

  const orderData = {
    store: store.name || store.title || '알 수 없는 매장',
    date: new Date().toLocaleString(),
    items,
    total
  };

  // 렌더링
  main.innerHTML = `
    <h2>결제 확인</h2>
    <p><strong>매장:</strong> ${orderData.store}</p>
    <p><strong>결제금액:</strong> ${orderData.total.toLocaleString()}원</p>
    <p><strong>현재 포인트:</strong> ${userInfo.point.toLocaleString()}원</p>
    <label>포인트 사용:
      <input type="number" id="usePoint" min="0" max="${userInfo.point}" value="0">
    </label><br><br>
    <div id="couponList"></div><br>
    <p id="finalAmount">최종 결제금액: ${orderData.total.toLocaleString()}원</p>
    <p id="pointEarned">적립 예정 포인트: ${Math.floor(orderData.total * 0.1).toLocaleString()}원</p><br>
    <hr>
    <br>
    <p id="discountAmount">할인된 금액: 0원</p>
    <button id="confirmPay">결제 확정</button>
    <button id="cancelPay">취소</button>
  `;

  // 요소 선택
  const usePointInput = document.getElementById('usePoint');
  const finalAmount = document.getElementById('finalAmount');
  const pointEarned = document.getElementById('pointEarned');
  const couponList = document.getElementById('couponList');
  const discountAmount = document.getElementById('discountAmount');



  // 쿠폰 리스트 렌더링
  let select = null;
  if (userInfo.coupons.unused.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = '보유한 쿠폰이 없습니다.';
    couponList.appendChild(empty);
  } else {
    const label = document.createElement('label');
    label.textContent = '쿠폰 선택: ';
    select = document.createElement('select');
    select.id = 'selectedCoupon';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '사용하지 않음';
    select.appendChild(defaultOption);

    userInfo.coupons.unused
      .filter(c => new Date(c.validUntil) >= new Date())
      .forEach(coupon => {
        const option = document.createElement('option');
        option.value = coupon.id;
        option.textContent = `
        ${coupon.name} (${coupon.discountValue}${coupon.discountType === 'percent' ? '%' : '원'})`;
        select.appendChild(option);
      });

    label.appendChild(select);
    couponList.appendChild(label);
  }

  // 할인 계산 함수
  function calculateBestPayment(orderTotal, coupon, userPoint, enteredPoint) {
    enteredPoint = Math.min(enteredPoint, userPoint, orderTotal);
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
    const selectedCoupon = userInfo.coupons.unused.find(c => c.id == selectedCouponId);

    const result = calculateBestPayment(orderData.total, selectedCoupon, userInfo.point, enteredPoint);

    // 실시간 반영
    finalAmount.textContent = `최종 결제금액: ${result.final.toLocaleString()}원`;
    pointEarned.textContent = `적립 예정 포인트: ${Math.floor(orderData.total * 0.1).toLocaleString()}원`;

    // 💡 여기 추가된 부분
    const totalDiscount = result.couponDiscount + result.appliedPoint;
    discountAmount.textContent = `할인된 금액: ${totalDiscount.toLocaleString()}원`;
  }


  // 이벤트 등록
  usePointInput.addEventListener('keyup', updateFinalAmount);
  document.getElementById('selectedCoupon')?.addEventListener('change', updateFinalAmount);

  //결제 확정시 쿠폰도 같이 넘기기
  document.getElementById('confirmPay').addEventListener('click', () => {
    const enteredPoint = Number(usePointInput.value) || 0;
    const selectedCouponId = document.getElementById('selectedCoupon')?.value;
    const selectedCoupon = userInfo.coupons.unused.find(c => c.id == selectedCouponId);
    const result = calculateBestPayment(orderData.total, selectedCoupon, userInfo.point, enteredPoint);

    confirmPay(
      orderData,
      result.appliedPoint,
      store,
      currentOrder,
      result.final,
      selectedCoupon?.id || null,
      result.couponDiscount
    );


  })


  const cancelPay = document.getElementById('cancelPay');
  cancelPay.addEventListener('click', () => {
    renderOrderScreen(store);
  })

  // 최초 1회 초기 계산
  updateFinalAmount();


}
