
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="store-info">
          <h1>${store.name}</h1>
          <p>${tableName}</p>
        </div>
        <div class="cart-indicator" id="cartIndicator">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM1 2v2h2l3.6 7.59-1.35 2.41C5.08 14.42 5.37 15 6 15h12v-2H6l1.1-2h7.45c.75 0 1.42-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
          </svg>
          <span id="cartCount" class="cart-badge">0</span>
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
    if (categories.length <= 1) return '';

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
      <div class="menu-item" data-menu-id="${menuId}">
        <div class="menu-info">
          <h4>${this.escapeHtml(item.name)}</h4>
          <p class="menu-desc">${this.escapeHtml(item.description || '')}</p>
          <div class="menu-footer">
            <div class="menu-price">${itemPrice.toLocaleString()}원</div>
            <div class="cook-station-badge">${cookStation}</div>
          </div>
        </div>
        <button class="add-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
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
            <span>주문하기</span>
            <span id="orderBtnAmount" class="btn-amount">0원</span>
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
    const orderBtnAmount = document.getElementById('orderBtnAmount');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = `${totalAmount.toLocaleString()}원`;
    if (orderBtnAmount) orderBtnAmount.textContent = `${totalAmount.toLocaleString()}원`;

    if (cartItems) {
      cartItems.innerHTML = cart.length === 0 
        ? this.renderEmptyCart() 
        : cart.map(item => this.renderCartItem(item)).join('');
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
          <div class="item-price">${item.price.toLocaleString()}원</div>
        </div>
        <div class="quantity-controls">
          <button class="qty-btn qty-decrease" data-action="decrease">−</button>
          <span class="quantity">${item.quantity}</span>
          <button class="qty-btn qty-increase" data-action="increase">+</button>
          <button class="remove-btn" data-action="remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="item-total">${itemTotal.toLocaleString()}원</div>
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
          position: absolute;
          top: 50px;
          left: 0;
          width: 100%;
          height: calc(100% - 50px);
          max-width: 390px;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .tll-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: white;
          padding: 12px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          flex-shrink: 0;
        }

        .back-btn {
          background: #f8f9fa;
          border: none;
          color: #1e293b;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 10px;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #e2e8f0;
        }

        .store-info {
          flex: 1;
          text-align: center;
          margin: 0 16px;
        }

        .store-info h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .store-info p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .cart-indicator {
          position: relative;
          cursor: pointer;
          padding: 10px;
          border-radius: 10px;
          transition: background 0.2s;
        }

        .cart-indicator:hover {
          background: #f8f9fa;
        }

        .cart-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #ef4444;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 700;
          min-width: 18px;
          text-align: center;
        }

        .tll-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .category-tabs {
          padding: 12px 20px;
          background: white;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .category-tabs::-webkit-scrollbar {
          display: none;
        }

        .category-tab {
          background: #f8f9fa;
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .category-tab.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .menu-container {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
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
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .menu-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
          transform: translateY(-2px);
        }

        .menu-info {
          flex: 1;
          min-width: 0;
        }

        .menu-info h4 {
          margin: 0 0 6px 0;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .menu-desc {
          margin: 0 0 10px 0;
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .menu-footer {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .menu-price {
          font-size: 16px;
          font-weight: 800;
          color: #3b82f6;
        }

        .cook-station-badge {
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          color: #475569;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .add-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .add-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .cart-panel {
          position: fixed;
          bottom: -100%;
          left: 0;
          width: 100%;
          max-width: 390px;
          height: calc(65% - 13px);
          background: white;
          border-radius: 24px 24px 0 0;
          box-shadow: 0 -8px 32px rgba(0,0,0,0.2);
          transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1010;
          display: flex;
          flex-direction: column;
        }

        .cart-panel.open {
          bottom: 13px;
        }

        .cart-handle {
          padding: 12px 0;
          display: flex;
          justify-content: center;
          cursor: pointer;
          border-radius: 24px 24px 0 0;
        }

        .handle-bar {
          width: 40px;
          height: 4px;
          background: #cbd5e1;
          border-radius: 2px;
        }

        .cart-content {
          flex: 1;
          padding: 0 20px 20px 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
          margin-bottom: 16px;
        }

        .cart-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .cart-total {
          font-size: 18px;
          font-weight: 800;
          color: #3b82f6;
        }

        .cart-items {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 16px;
          -webkit-overflow-scrolling: touch;
        }

        .empty-cart {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 160px;
          color: #94a3b8;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-cart p {
          margin: 0;
          font-size: 15px;
          font-weight: 500;
        }

        .cart-item {
          background: linear-gradient(135deg, #ffffff, #f8fafc);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .item-info h4 {
          margin: 0 0 6px 0;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        .item-price {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .qty-btn {
          width: 32px;
          height: 32px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: #475569;
          transition: all 0.2s;
        }

        .qty-btn:hover {
          background: #f8f9fa;
          border-color: #cbd5e1;
        }

        .quantity {
          min-width: 28px;
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .remove-btn {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          margin-left: auto;
        }

        .remove-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .item-total {
          font-size: 16px;
          font-weight: 800;
          color: #3b82f6;
          text-align: right;
        }

        .order-btn {
          width: 100%;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 16px;
          padding: 18px 24px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
        }

        .order-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .order-btn:disabled {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-amount {
          font-size: 18px;
          font-weight: 800;
        }

        .cart-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.4);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 1005;
          backdrop-filter: blur(4px);
        }

        .cart-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        @media (max-height: 700px) {
          .cart-panel {
            height: 75%;
          }
        }

        @media (max-width: 360px) {
          .tll-header {
            padding: 12px 16px;
          }
          .menu-container {
            padding: 16px;
          }
        }
      </style>
    `;
  }
};
