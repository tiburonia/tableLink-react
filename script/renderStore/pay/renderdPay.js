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

  // 결제 준비 화면 렌더링
  main.innerHTML = `
    <h2>결제 확인</h2>
    <p><strong>매장:</strong> ${orderData.store}</p>
    <p><strong>결제금액:</strong> ${orderData.total.toLocaleString()}원</p>
    <p><strong>현재 포인트:</strong> ${userInfo.point.toLocaleString()}원</p>
    <label>포인트 사용:
      <input type="number" id="usePoint" min="0" max="${userInfo.point}" value="0">
    </label><br><br>
    <p id="finalAmount">최종 결제금액: ${orderData.total.toLocaleString()}원</p>
    <p id="pointEarned">적립 예정 포인트: ${Math.floor(orderData.total * 0.1).toLocaleString()}원</p>
    <br>
    <button id="confirmPay">결제 확정</button>
    <button id="cancelPay">취소</button>
  `;

  const usePointInput = document.getElementById('usePoint');
  const finalAmount = document.getElementById('finalAmount');
  const pointEarned = document.getElementById('pointEarned');
  const plusPoint = Math.floor(orderData.total * 0.1)
  

  // 포인트 입력 시 실시간 계산
  usePointInput.addEventListener('keyup', () => {
    const usePoint = Math.min(Number(usePointInput.value) || 0, userInfo.point, orderData.total);
    const final = Math.max(orderData.total - usePoint, 0);
    const earned = Math.floor(orderData.total*0.1);
    finalAmount.textContent = `최종 결제금액: ${final.toLocaleString()}원`;
    pointEarned.textContent = `적립 예정 포인트: ${earned.toLocaleString()}원`;
  });

  // 이벤트 등록
  document.getElementById('confirmPay').addEventListener('click', () => {
    const usePoint = Number(usePointInput.value) || 0;
    confirmPay(orderData, usePoint, store, currentOrder, plusPoint);
  });

  document.getElementById('cancelPay').addEventListener('click', () => {
    renderOrderScreen(store);
  });
}
