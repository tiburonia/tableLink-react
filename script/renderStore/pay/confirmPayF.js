function confirmPay(orderData, usedPoint, store, currentOrder) {
  const maxPoint = Math.min(userInfo.point, orderData.total);
  const appliedPoint = Math.min(usedPoint, maxPoint);
  const finalTotal = Math.max(orderData.total, 0);
  const realTotal = finalTotal - appliedPoint


  // userInfo 업데이트
  userInfo.point -= appliedPoint;
  userInfo.totalCost += finalTotal;
  userInfo.point += Math.floor(finalTotal * 0.1);
  userInfo.realCost += realTotal
 

  // userInfo를 users에 업데이트
  users[userInfo.id].point = userInfo.point;
  users[userInfo.id].totalCost = userInfo.totalCost;
  users[userInfo.id].realCost = userInfo.realCost;


  // 주문 내역 업데이트
  users[userInfo.id].orderList.push({
    ...orderData,
    total: finalTotal,
    usedPoint: appliedPoint
  });

  alert(`결제가 완료되었습니다.\n최종 금액: ${finalTotal.toLocaleString()}원\n포인트 사용: ${appliedPoint.toLocaleString()}원`);

  // 초기화
  for (const key in currentOrder) delete currentOrder[key];
  renderStore(store);
}
