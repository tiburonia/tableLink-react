export const OrderView = {
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  renderOrderHTML(store, tableName, tableNumber, menuByCategory) {
    const main = document.getElementById('main');
    if (!main) {
      console.error('❌ main 요소를 찾을 수 없습니다');
      return;
    }

    main.innerHTML = `
      <div class="tll-order-screen">
        ${this.renderHeader(store, tableName)}
        ${this.renderContent(menuByCategory)}
        ${this.renderCartPanel()}
        ${this.renderOverlay()}
      </div>
      ${this.getStyles()}
    `;
  },

  renderHeader(store, tableName) {
    return `
      <div class="tll-header">
        <button class="back-btn" id="backBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
          뒤로
        </button>
        <div class="store-info">
          <h1>${store.name}</h1>
          <p>${tableName}</p>
        </div>
        <div class="cart-indicator" id="cartIndicator">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM1 2v2h2l3.6 7.59-1.35 2.41C5.08 14.42 5.37 15 6 15h12v-2H6l1.1-2h7.45c.75 0 1.42-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
          </svg>
          <span id="cartCount">0</span>
        </div>
      </div>
    `;
  },

  renderContent(menuByCategory) {
    return `
      <div class="tll-content">
        <div class="category-tabs" id="categoryTabs">
          ${this.renderCategoryTabs(menuByCategory)}
        </div>
        <div class="menu-container" id="menuContainer">
          ${this.renderMenuContent(menuByCategory)}
        </div>
      </div>
    `;
  },

  renderCategoryTabs(menuByCategory) {
    const categories = Object.keys(menuByCategory);

    if (categories.length <= 1) {
      return '';
    }

    return categories.map((category, index) => `
      <button class="category-tab ${index === 0 ? 'active' : ''}" 
              data-category="${category}">
        ${category}
      </button>
    `).join('');
  },

  renderMenuContent(menuByCategory) {
    return Object.entries(menuByCategory).map(([category, items], index) => `
      <div class="menu-category ${index === 0 ? 'active' : ''}" data-category="${category}">
        <div class="menu-grid">
          ${items.map(item => this.renderMenuItem(item)).join('')}
        </div>
      </div>
    `).join('');
  },

  renderMenuItem(item) {
    const menuId = item.id || item.menuId;
    const cookStation = item.cook_station || 'KITCHEN';
    const itemPrice = item.price || 0;
    
    return `
      <div class="menu-item" 
           data-menu-id="${menuId}"
           data-menu-name="${this.escapeHtml(item.name)}"
           data-menu-price="${itemPrice}"
           data-cook-station="${cookStation}">
        <div class="menu-info">
          <h4>${this.escapeHtml(item.name)}</h4>
          <p>${this.escapeHtml(item.description || '')}</p>
          <div class="menu-price">${itemPrice.toLocaleString()}원</div>
          <div class="cook-station-badge">${cookStation}</div>
        </div>
        <button class="add-btn">+</button>
      </div>
    `;
  },

  renderCartPanel() {
    return `
      <div class="cart-panel" id="cartPanel">
        <div class="cart-handle" id="cartHandle">
          <div class="handle-bar"></div>
        </div>
        <div class="cart-content" id="cartContent">
          <div class="cart-header">
            <h3>주문 내역</h3>
            <span class="cart-total" id="cartTotal">0원</span>
          </div>
          <div class="cart-items" id="cartItems">
            ${this.renderEmptyCart()}
          </div>
          <button class="order-btn" id="orderBtn" disabled>
            주문하기
          </button>
        </div>
      </div>
    `;
  },

  renderOverlay() {
    return `<div class="cart-overlay" id="cartOverlay"></div>`;
  },

  renderEmptyCart() {
    return `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>메뉴를 선택해주세요</p>
      </div>
    `;
  },

  updateCartDisplay(cart, totalAmount) {
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    const cartItems = document.getElementById('cartItems');
    const orderBtn = document.getElementById('orderBtn');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = `${totalAmount.toLocaleString()}원`;

    if (cartItems) {
      if (cart.length === 0) {
        cartItems.innerHTML = this.renderEmptyCart();
      } else {
        cartItems.innerHTML = cart.map(item => this.renderCartItem(item)).join('');
      }
    }

    if (orderBtn) {
      orderBtn.disabled = cart.length === 0;
    }
  },

  renderCartItem(item) {
    const itemTotal = item.price * item.quantity;
    return `
      <div class="cart-item" data-menu-id="${item.id}">
        <div class="item-info">
          <h4>${this.escapeHtml(item.name)}</h4>
          <div class="item-price">${item.price.toLocaleString()}원 × ${item.quantity} = ${itemTotal.toLocaleString()}원</div>
        </div>
        <div class="quantity-controls">
          <button class="qty-btn qty-decrease" data-action="decrease">−</button>
          <span class="quantity">${item.quantity}</span>
          <button class="qty-btn qty-increase" data-action="increase">+</button>
          <button class="remove-btn" data-action="remove">×</button>
        </div>
      </div>
    `;
  },

  switchCategory(category) {
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });

    document.querySelectorAll('.menu-category').forEach(categoryDiv => {
      categoryDiv.classList.toggle('active', categoryDiv.dataset.category === category);
    });
  },

  toggleCart() {
    const cartPanel = document.getElementById('cartPanel');
    const cartOverlay = document.getElementById('cartOverlay');

    if (cartPanel.classList.contains('open')) {
      this.closeCart();
    } else {
      cartPanel.classList.add('open');
      cartOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeCart() {
    const cartPanel = document.getElementById('cartPanel');
    const cartOverlay = document.getElementById('cartOverlay');

    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  },

  getStyles() {
    return `
      <style>
        .tll-order-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          max-width: 390px;
          max-height: 760px;
          margin: 0 auto;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1000;
        }

        .tll-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: white;
          padding: 12px 16px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 48px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .back-btn {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px;
          border-radius: 6px;
          font-size: 14px;
          transition: background 0.2s;
        }

        .back-btn:hover {
          background: #f1f3f5;
        }

        .store-info {
          flex: 1;
          text-align: center;
          margin: 0 16px;
        }

        .store-info h1 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          line-height: 1.2;
        }

        .store-info p {
          margin: 2px 0 0 0;
          font-size: 12px;
          color: #666;
        }

        .cart-indicator {
          position: relative;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .cart-indicator:hover {
          background: #f1f3f5;
        }

        .cart-indicator span {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #ff4757;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 600;
          min-width: 16px;
          text-align: center;
          line-height: 1.2;
        }

        .tll-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .category-tabs {
          padding: 8px 16px;
          background: white;
          border-bottom: 1px solid #f1f3f5;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .category-tabs::-webkit-scrollbar {
          display: none;
        }

        .category-tab {
          background: #f8f9fa;
          border: none;
          border-radius: 16px;
          padding: 6px 12px;
          font-size: 12px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .category-tab.active {
          background: #007bff;
          color: white;
        }

        .menu-container {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }

        .menu-category {
          display: none;
        }

        .menu-category.active {
          display: block;
        }

        .menu-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .menu-item {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .menu-item:hover {
          border-color: #007bff;
          box-shadow: 0 4px 12px rgba(0,123,255,0.1);
        }

        .menu-info {
          flex: 1;
          min-width: 0;
        }

        .menu-info h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          line-height: 1.3;
        }

        .menu-info p {
          margin: 0 0 6px 0;
          font-size: 12px;
          color: #666;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .menu-price {
          font-size: 14px;
          font-weight: 700;
          color: #007bff;
        }

        .cook-station-badge {
          display: inline-block;
          background: #f8f9fa;
          color: #666;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 8px;
          margin-top: 4px;
          border: 1px solid #e9ecef;
        }

        .add-btn {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px;
          flex-shrink: 0;
        }

        .add-btn:hover {
          background: #0056b3;
          transform: scale(1.05);
        }

        .cart-panel {
          position: fixed;
          bottom: -100%;
          left: 0;
          width: 100%;
          max-width: 390px;
          height: 60%;
          background: white;
          border-radius: 16px 16px 0 0;
          box-shadow: 0 -8px 32px rgba(0,0,0,0.15);
          transition: bottom 0.3s ease;
          z-index: 1010;
          display: flex;
          flex-direction: column;
        }

        .cart-panel.open {
          bottom: 0;
        }

        .cart-handle {
          padding: 8px 0;
          display: flex;
          justify-content: center;
          cursor: pointer;
          background: white;
          border-radius: 16px 16px 0 0;
        }

        .handle-bar {
          width: 40px;
          height: 4px;
          background: #dee2e6;
          border-radius: 2px;
        }

        .cart-content {
          flex: 1;
          padding: 0 16px 16px 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f3f5;
          margin-bottom: 12px;
        }

        .cart-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .cart-total {
          font-size: 16px;
          font-weight: 700;
          color: #007bff;
        }

        .cart-items {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .empty-cart {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 120px;
          color: #999;
          text-align: center;
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f8f9fa;
        }

        .cart-item:last-child {
          border-bottom: none;
        }

        .item-info h4 {
          margin: 0 0 4px 0;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          line-height: 1.3;
        }

        .item-price {
          font-size: 12px;
          color: #666;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qty-btn {
          width: 24px;
          height: 24px;
          border: 1px solid #dee2e6;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 0.2s;
        }

        .qty-btn:hover {
          background: #f8f9fa;
        }

        .quantity {
          min-width: 20px;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
        }

        .remove-btn {
          width: 24px;
          height: 24px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: #c82333;
        }

        .order-btn {
          width: 100%;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: auto;
        }

        .order-btn:hover:not(:disabled) {
          background: #218838;
        }

        .order-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .cart-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.3);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 1005;
        }

        .cart-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        @media (max-height: 600px) {
          .cart-panel {
            height: 70%;
          }
        }

        @media (max-width: 360px) {
          .tll-header {
            padding: 10px 12px;
          }

          .menu-container {
            padding: 12px;
          }

          .cart-content {
            padding: 0 12px 12px 12px;
          }
        }
      </style>
    `;
  }
};
