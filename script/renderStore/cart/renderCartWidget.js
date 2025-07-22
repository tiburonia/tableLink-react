function renderCartWidget() {
  const widget = document.getElementById('cartWidget');

  // 장바구니 비어 있으면 숨기기
  if (!savedCart.order || Object.keys(savedCart.order).length === 0) {
    widget.style.display = 'none';
    return;
  }

  const totalItems = Object.values(savedCart.order).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(savedCart.order).reduce((sum, [name, qty]) => {
    const item = savedCart.store.menu.find(m => m.name === name);
    return sum + (item.price * qty);
  }, 0);

  widget.textContent = `🛒 ${totalItems}개 | ${totalPrice.toLocaleString()}원`;
  widget.style.display = 'block';

  widget.onclick = () => renderCart(savedCart);
}
