  function confirmPay(orderData, usedPoint, store, currentOrder, finalTotal, selectedCouponId, couponDiscount)
 {
  const maxPoint = Math.min(userInfo.point, orderData.total);
  const appliedPoint = Math.min(usedPoint, maxPoint);
  const realTotal = orderData.total - couponDiscount - appliedPoint;

  // userInfo 업데이트
  userInfo.point -= appliedPoint;
  userInfo.totalCost += orderData.total; // 총 주문 금액은 할인 전 기준
  userInfo.realCost += realTotal;
  const earnedPoint = Math.floor((orderData.total) * 0.1);
  userInfo.point += earnedPoint;

  // 사용한 쿠폰 이동 처리
  if (selectedCouponId) {
    const idx = userInfo.coupons.unused.findIndex(c => c.id == selectedCouponId);
    if (idx !== -1) {
      const usedCoupon = userInfo.coupons.unused.splice(idx, 1)[0];
      userInfo.coupons.used.push(usedCoupon);
    }
  }

  // 첫 주문 시 웰컴 쿠폰 발급
  if (userInfo.orderList.length === 0) {
    const coupon = createCoupon("welcome");
    if (coupon) {
      userInfo.coupons.unused.push(coupon);
      alert('첫 주문시 10% 할인 쿠폰이 발급되었습니다');
    }
  }


  // 주문 내역 업데이트
   const orderRecord = {
     ...orderData,                       // store, date, items 등 포함
     total: orderData.total,            // 원가
     usedPoint: appliedPoint,           // 사용한 포인트
     couponDiscount: couponDiscount,    // 쿠폰으로 할인된 금액
     totalDiscount: appliedPoint + couponDiscount,
     couponUsed: selectedCouponId || null, // 사용한 쿠폰 ID
     realTotal: realTotal,              // 최종 결제 금액
     earnedPoint: earnedPoint,          // 적립된 포인트
     paymentStrategy: (couponDiscount > 0 || appliedPoint > 0)
       //↑ 쿠폰 우선/포인트 우선 판단 (추후 데이터 분석/로깅용)
       ? (couponDiscount >= appliedPoint ? "couponFirst" : "pointFirst")
       : "none"
   };

  userInfo.orderList.push(orderRecord);
  users[userInfo.id] = { ...userInfo };

  alert(`결제가 완료되었습니다.\n최종 금액: ${finalTotal.toLocaleString()}원\n포인트 사용: ${appliedPoint.toLocaleString()}원\n적립 포인트: ${earnedPoint.toLocaleString()}원\n할인된 금액:${(appliedPoint + couponDiscount ).toLocaleString()}원 `);
  // 사용 쿠폰 alert추가 필요

  // 초기화
  for (const key in currentOrder) delete currentOrder[key];
  renderStore(store);
}
