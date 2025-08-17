function renderCart(cart) {
  const main = document.getElementById('main');
  main.innerHTML = `<h2>🛒 장바구니</h2><br>`;

  if (!cart || !cart.order || Object.keys(cart.order).length === 0) {
    main.innerHTML += `<p>장바구니가 비어있습니다.</p>`;
    
    return;
  }

  let total = 0;

  for (const item in cart.order) {
    const qty = cart.order[item];
    const menu = cart.store.menu.find(m => m.name === item);
    const price = menu.price * qty;
    total += price;

    main.innerHTML += `
      <p><strong>${item}</strong> - ${qty}개 (${price.toLocaleString()}원)</p>
    `;
  }

  main.innerHTML += `
    <hr>
    <p><strong>총 결제 금액: ${total.toLocaleString()}원</strong></p>
    <button onclick="renderPay(savedCart.order, savedCart.store)">결제하기</button>
    <button onclick="renderMain()">돌아가기</button>
  `;

}
