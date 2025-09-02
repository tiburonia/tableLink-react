// POS 메뉴 관리 모듈
import { POSStateManager } from './posStateManager.js';

// 카테고리별 색상 코드
const CATEGORY_COLORS = {
  '커피': '#8B4513',
  '디저트': '#FF69B4',
  '치킨': '#FFA500',
  '피자': '#DC143C',
  '버거': '#228B22',
  '중식': '#FFD700',
  '한식': '#B22222',
  '일식': '#4169E1',
  '양식': '#9370DB',
  '분식': '#FF6347',
  '브런치': '#32CD32',
  '음료': '#1E90FF',
  '사이드': '#808080',
  'default': '#6B7280'
};

export class POSMenuManager {
  // 메뉴 카테고리 렌더링
  static renderMenuCategories() {
    const categoryTabs = document.getElementById('categoryTabs');
    if (!categoryTabs) return;

    const categories = POSStateManager.getCategories();
    const selectedCategory = POSStateManager.getSelectedCategory();

    const tabsHTML = categories.map(category => {
      const isActive = (category === '전체' && selectedCategory === 'all') || (category === selectedCategory);
      const categoryKey = category === '전체' ? 'all' : category;
      const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

      return `
        <button class="category-tab ${isActive ? 'active' : ''}"
                onclick="selectCategory('${categoryKey}')"
                style="${isActive ? `background: ${color}; color: white; border-color: ${color};` : `border-color: ${color}; color: ${color};`}">
          ${category}
        </button>
      `;
    }).join('');

    categoryTabs.innerHTML = tabsHTML;
  }

  // 카테고리 선택
  static selectCategory(category) {
    POSStateManager.setSelectedCategory(category);
    this.renderMenuCategories();
    this.renderMenuGrid();
  }

  // 메뉴 그리드 렌더링
  static renderMenuGrid() {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    const allMenus = POSStateManager.getAllMenus() || [];
    const selectedCategory = POSStateManager.getSelectedCategory();

    // 메뉴 데이터 유효성 검사
    if (!Array.isArray(allMenus)) {
      console.warn('⚠️ 메뉴 데이터가 배열이 아님');
      menuGrid.innerHTML = '<p class="no-menu">메뉴를 불러올 수 없습니다</p>';
      return;
    }

    let filteredMenus = allMenus;
    if (selectedCategory && selectedCategory !== 'all') {
      filteredMenus = allMenus.filter(menu => menu && menu.category === selectedCategory);
    }

    if (filteredMenus.length === 0) {
      const message = selectedCategory === 'all' || !selectedCategory ?
        '등록된 메뉴가 없습니다' :
        '선택한 카테고리에 메뉴가 없습니다';
      menuGrid.innerHTML = `<p class="no-menu">${message}</p>`;
      return;
    }

    const menusHTML = filteredMenus.map(item => `
      <button class="menu-item-btn" onclick="addMenuToOrder('${item.name}', ${item.price})">
        <div class="menu-item-name">${item.name}</div>
        <div class="menu-item-price">₩${item.price.toLocaleString()}</div>
      </button>
    `).join('');

    menuGrid.innerHTML = menusHTML;
  }

  // 메뉴 검색
  static searchMenus(query) {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    const allMenus = POSStateManager.getAllMenus();
    const selectedCategory = POSStateManager.getSelectedCategory();

    let filteredMenus = allMenus;

    if (selectedCategory !== 'all') {
      filteredMenus = allMenus.filter(item => item.category === selectedCategory);
    }

    if (query && query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      filteredMenus = filteredMenus.filter(item =>
        item.name.toLowerCase().includes(searchTerm)
      );
    }

    if (filteredMenus.length === 0) {
      menuGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
          <p>${query ? `"${query}"에 대한 검색 결과가 없습니다.` : '해당 카테고리에 메뉴가 없습니다.'}</p>
        </div>
      `;
      return;
    }

    const menusHTML = filteredMenus.map(item => `
      <button class="menu-item-btn" onclick="addMenuToOrder('${item.name}', ${item.price})">
        <div class="menu-item-name">${item.name}</div>
        <div class="menu-item-price">₩${item.price.toLocaleString()}</div>
      </button>
    `).join('');

    menuGrid.innerHTML = menusHTML;
  }

  // 🍽️ 메뉴 카드 HTML 생성
  static createMenuCardHTML(menu) {
    const isAvailable = menu.is_available !== false;
    const formattedPrice = parseInt(menu.price).toLocaleString();

    return `
      <div class="menu-card ${!isAvailable ? 'unavailable' : ''}"
           data-menu-id="${menu.id}"
           onclick="window.addMenuWithFeedback('${menu.name.replace(/'/g, "\\'")}', ${menu.price}, '${menu.id}')">

        <div class="menu-image">
          ${menu.image_url ?
            `<img src="${menu.image_url}" alt="${menu.name}" loading="lazy">` :
            `<div class="no-image">🍽️</div>`
          }
          ${!isAvailable ? '<div class="unavailable-overlay">일시품절</div>' : ''}
        </div>

        <div class="menu-info">
          <h4 class="menu-name">${menu.name}</h4>
          <p class="menu-description">${menu.description || '맛있는 메뉴입니다'}</p>

          <div class="menu-footer">
            <span class="menu-price">₩${formattedPrice}</span>
            <button class="add-btn ${!isAvailable ? 'disabled' : ''}"
                    ${!isAvailable ? 'disabled' : ''}>
              <span class="add-icon">+</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}