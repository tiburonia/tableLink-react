
/**
 * POS 메뉴 관리자
 * - 메뉴 선택 시 UI 변경
 * - 주문 추가 로직
 */

class POSMenuManager {
  constructor() {
    this.selectedMenu = null;
    this.init();
  }

  init() {
    console.log('🍽️ POS 메뉴 관리자 초기화');
  }

  renderMenus(menus) {
    const container = document.getElementById('menuContainer');
    if (!container) return;

    if (!menus || menus.length === 0) {
      container.innerHTML = `
        <div class="empty-menu">
          <div class="empty-icon">🍽️</div>
          <div class="empty-text">메뉴가 없습니다</div>
        </div>
      `;
      return;
    }

    const html = menus.map(menu => this.renderMenuItem(menu)).join('');
    container.innerHTML = html;
  }

  renderMenuItem(menu) {
    const isSelected = this.selectedMenu?.id === menu.id;
    
    return `
      <div class="menu-item ${isSelected ? 'selected' : ''}" 
           onclick="selectMenu(${menu.id})"
           data-menu-id="${menu.id}">
        
        <div class="menu-content">
          <div class="menu-info">
            <div class="menu-name">${menu.name}</div>
            <div class="menu-price">₩${menu.price.toLocaleString()}</div>
          </div>
          
          <div class="menu-actions">
            <button class="add-btn" onclick="event.stopPropagation(); addMenuItem(${JSON.stringify(menu).replace(/"/g, '&quot;')}, 1)">
              <span>➕</span>
            </button>
          </div>
        </div>
        
        ${isSelected ? '<div class="selection-border"></div>' : ''}
      </div>
    `;
  }

  selectMenu(menuId) {
    // 이전 선택 해제
    if (this.selectedMenu) {
      const prevElement = document.querySelector(`[data-menu-id="${this.selectedMenu.id}"]`);
      if (prevElement) {
        prevElement.classList.remove('selected');
        const border = prevElement.querySelector('.selection-border');
        if (border) border.remove();
      }
    }

    // 새 메뉴 선택
    const menus = window.currentMenus || [];
    this.selectedMenu = menus.find(m => m.id === menuId);
    
    if (this.selectedMenu) {
      const element = document.querySelector(`[data-menu-id="${menuId}"]`);
      if (element) {
        element.classList.add('selected');
        if (!element.querySelector('.selection-border')) {
          element.insertAdjacentHTML('beforeend', '<div class="selection-border"></div>');
        }
      }
      
      console.log('🎯 메뉴 선택:', this.selectedMenu.name);
      this.showMenuControls();
    }
  }

  showMenuControls() {
    const container = document.getElementById('menuControlsPanel');
    if (!container || !this.selectedMenu) return;

    container.innerHTML = `
      <div class="menu-controls-active">
        <div class="controls-header">
          <h3>${this.selectedMenu.name}</h3>
          <button class="close-controls" onclick="window.posMenuManager.clearMenuSelection()">×</button>
        </div>
        
        <div class="controls-body">
          <div class="price-display">₩${this.selectedMenu.price.toLocaleString()}</div>
          
          <div class="quantity-selector">
            <button onclick="addMenuItem(${JSON.stringify(this.selectedMenu).replace(/"/g, '&quot;')}, 1)">
              1개 추가
            </button>
            <button onclick="addMenuItem(${JSON.stringify(this.selectedMenu).replace(/"/g, '&quot;')}, 2)">
              2개 추가
            </button>
            <button onclick="addMenuItem(${JSON.stringify(this.selectedMenu).replace(/"/g, '&quot;')}, 3)">
              3개 추가
            </button>
          </div>
        </div>
      </div>
    `;
  }

  clearMenuSelection() {
    if (this.selectedMenu) {
      const element = document.querySelector(`[data-menu-id="${this.selectedMenu.id}"]`);
      if (element) {
        element.classList.remove('selected');
        const border = element.querySelector('.selection-border');
        if (border) border.remove();
      }
    }
    
    this.selectedMenu = null;
    
    const container = document.getElementById('menuControlsPanel');
    if (container) {
      container.innerHTML = '';
    }
  }

  injectStyles() {
    if (document.getElementById('posMenuStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'posMenuStyles';
    styles.textContent = `
      .menu-item {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }

      .menu-item:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      }

      .menu-item.selected {
        border-color: #10b981;
        background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
      }

      .menu-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .menu-name {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .menu-price {
        font-size: 18px;
        font-weight: 700;
        color: #10b981;
      }

      .add-btn {
        background: #10b981;
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
      }

      .add-btn:hover {
        background: #059669;
        transform: scale(1.1);
      }

      .selection-border {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 3px solid #10b981;
        border-radius: 12px;
        pointer-events: none;
        animation: pulse 2s infinite;
      }

      .menu-controls-active {
        background: white;
        border: 2px solid #3b82f6;
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
      }

      .controls-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;
      }

      .controls-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #3b82f6;
      }

      .price-display {
        font-size: 24px;
        font-weight: 700;
        color: #10b981;
        text-align: center;
        margin-bottom: 16px;
      }

      .quantity-selector {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .quantity-selector button {
        padding: 12px;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        background: white;
        color: #3b82f6;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .quantity-selector button:hover {
        background: #3b82f6;
        color: white;
      }
    `;

    document.head.appendChild(styles);
  }
}

// 전역 인스턴스 생성
window.posMenuManager = new POSMenuManager();
window.posMenuManager.injectStyles();

// 전역 함수
window.selectMenu = (menuId) => window.posMenuManager.selectMenu(menuId);

console.log('✅ POS 메뉴 관리자 로드 완료');
