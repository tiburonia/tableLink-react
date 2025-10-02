
/**
 * 메뉴 탭 뷰 - UI 렌더링
 */

export const menuTabView = {
  /**
   * 메뉴 탭 렌더링
   */
  render(store, menuData) {
    if (!menuData || menuData.length === 0) {
      return this.renderEmptyState();
    }

    return `
      <div class="menu-tab-container">
        ${this.renderMenuCategories(menuData)}
      </div>
      ${this.getMenuTabStyles()}
    `;
  },

  /**
   * 메뉴 카테고리 렌더링
   */
  renderMenuCategories(menuData) {
    // 카테고리별로 그룹화
    const categories = this.groupByCategory(menuData);

    return Object.entries(categories).map(([category, items]) => `
      <div class="menu-category">
        <h3 class="category-title">
          <span class="category-icon">${this.getCategoryIcon(category)}</span>
          <span class="category-name">${category}</span>
          <span class="category-count">${items.length}개</span>
        </h3>
        <div class="menu-items-grid">
          ${items.map(item => this.renderMenuItem(item)).join('')}
        </div>
      </div>
    `).join('');
  },

  /**
   * 개별 메뉴 아이템 렌더링
   */
  renderMenuItem(item) {
    const price = (item.price || item.menu_price || 0).toLocaleString();
    const name = item.name || item.menu_name || '메뉴';
    const description = item.description || item.menu_description || '';
    const imageUrl = item.image_url || item.menu_image || '/TableLink.png';

    return `
      <div class="menu-item-card">
        <div class="menu-item-image">
          <img src="${imageUrl}" alt="${name}" onerror="this.src='/TableLink.png'">
        </div>
        <div class="menu-item-info">
          <h4 class="menu-item-name">${name}</h4>
          ${description ? `<p class="menu-item-description">${description}</p>` : ''}
          <div class="menu-item-footer">
            <span class="menu-item-price">${price}원</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 빈 상태 렌더링
   */
  renderEmptyState() {
    return `
      <div class="empty-menu-state">
        <div class="empty-icon">🍽️</div>
        <h3 class="empty-title">등록된 메뉴가 없습니다</h3>
        <p class="empty-description">매장에 문의해주세요</p>
      </div>
      ${this.getMenuTabStyles()}
    `;
  },

  /**
   * 카테고리별 그룹화
   */
  groupByCategory(menuData) {
    return menuData.reduce((acc, item) => {
      const category = item.category || item.menu_category || '기타';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  },

  /**
   * 카테고리 아이콘 가져오기
   */
  getCategoryIcon(category) {
    const iconMap = {
      '치킨': '🍗',
      '피자': '🍕',
      '한식': '🍚',
      '중식': '🥟',
      '일식': '🍱',
      '양식': '🍝',
      '분식': '🍜',
      '카페': '☕',
      '디저트': '🍰',
      '음료': '🥤'
    };
    return iconMap[category] || '🍽️';
  },

  /**
   * 스타일 정의
   */
  getMenuTabStyles() {
    return `
      <style>
        .menu-tab-container {
          padding: 20px 16px;
        }

        .menu-category {
          margin-bottom: 32px;
        }

        .category-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .category-icon {
          font-size: 20px;
        }

        .category-name {
          flex: 1;
        }

        .category-count {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        .menu-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
        }

        .menu-item-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .menu-item-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .menu-item-image {
          width: 100%;
          height: 140px;
          overflow: hidden;
          background: #f8fafc;
        }

        .menu-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .menu-item-info {
          padding: 12px;
        }

        .menu-item-name {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .menu-item-description {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #666;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .menu-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .menu-item-price {
          font-size: 16px;
          font-weight: 700;
          color: #3b82f6;
        }

        .empty-menu-state {
          padding: 80px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .empty-description {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        @media (max-width: 480px) {
          .menu-items-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
          }

          .menu-item-image {
            height: 120px;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.menuTabView = menuTabView;

console.log('✅ menuTabView 모듈 로드 완료');
