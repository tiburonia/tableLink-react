export function renderCartPage(root) {
  root.innerHTML = `
    <section class="cart-page">
      <div class="cart-page__header">
        <button id="backBtn" class="back-btn">←</button>
        <h1 class="cart-page__title">장바구니</h1>
        <button id="clearBtn" class="text-btn">전체삭제</button>
      </div>
      
      <div id="cartItems" class="cart-items">
        <div class="cart-page__empty">
          장바구니가 비어있습니다
        </div>
      </div>
      
      <div class="cart-page__footer">
        <div class="cart-summary">
          <div class="cart-summary__row">
            <span>총 수량</span>
            <span id="totalQuantity">0개</span>
          </div>
          <div class="cart-summary__row cart-summary__total">
            <span>총 금액</span>
            <span id="totalAmount">0원</span>
          </div>
        </div>
        <button id="orderBtn" class="btn-primary btn-block">
          주문하기
        </button>
      </div>
    </section>
  `;
  
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.hash = '#/';
  });
  
  document.getElementById('clearBtn').addEventListener('click', () => {
    const evt = new CustomEvent('tlg:cart:clear');
    window.dispatchEvent(evt);
  });
  
  document.getElementById('orderBtn').addEventListener('click', () => {
    const evt = new CustomEvent('tlg:cart:order');
    window.dispatchEvent(evt);
  });
}

export function renderCartItems(items) {
  const container = document.getElementById('cartItems');
  if (!container) return;
  
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="cart-page__empty">
        장바구니가 비어있습니다
      </div>
    `;
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div class="cart-item" data-menu-id="${item.menuId}">
      <div class="cart-item__info">
        <div class="cart-item__name">${item.menu?.name || '메뉴'}</div>
        <div class="cart-item__price">${(item.menu?.price || 0).toLocaleString()}원</div>
      </div>
      <div class="cart-item__actions">
        <button class="qty-btn" data-action="minus">-</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn" data-action="plus">+</button>
        <button class="remove-btn" data-action="remove">삭제</button>
      </div>
    </div>
  `).join('');
  
  container.querySelectorAll('.qty-btn, .remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const menuId = btn.closest('.cart-item').dataset.menuId;
      const action = btn.dataset.action;
      const evt = new CustomEvent('tlg:cart:update', { 
        detail: { menuId, action } 
      });
      window.dispatchEvent(evt);
    });
  });
  
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmt = items.reduce((sum, item) => 
    sum + (item.menu?.price || 0) * item.quantity, 0
  );
  
  document.getElementById('totalQuantity').textContent = `${totalQty}개`;
  document.getElementById('totalAmount').textContent = `${totalAmt.toLocaleString()}원`;
}
