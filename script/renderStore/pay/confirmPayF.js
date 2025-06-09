function confirmPay(orderData, usedPoint, store, currentOrder, finalTotal, selectedCouponId) {
  const maxPoint = Math.min(userInfo.point, orderData.total);
  const appliedPoint = Math.min(usedPoint, maxPoint);
  const realTotal = finalTotal - appliedPoint;

  // userInfo 업데이트
  userInfo.point -= appliedPoint;
  userInfo.totalCost += orderData.total; // 총 주문 금액은 할인 전 기준
  userInfo.realCost += realTotal;
  const earnedPoint = Math.floor((orderData.total - (orderData.total - realTotal - appliedPoint)) * 0.1);
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
    userInfo.coupons.unused.push(createCoupon("welcome"));
    alert('첫 주문시 10% 할인 쿠폰이 발급되었습니다');
  }

  // 주문 내역 업데이트
  const orderRecord = {
    ...orderData,
    total: finalTotal,
    usedPoint: appliedPoint,
    couponUsed: selectedCouponId || null
  };
  userInfo.orderList.push(orderRecord);
  users[userInfo.id] = { ...userInfo };

  alert(`결제가 완료되었습니다.\n최종 금액: ${finalTotal.toLocaleString()}원\n포인트 사용: ${appliedPoint.toLocaleString()}원\n적립 포인트: ${earnedPoint.toLocaleString()}원`);

  // 초기화
  for (const key in currentOrder) delete currentOrder[key];
  renderStore(store);
}
