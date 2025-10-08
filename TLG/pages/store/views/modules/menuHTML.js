
/**
 * 메뉴 HTML 렌더링 모듈
 */

export const menuHTML = {
  /**
   * 메뉴 리스트 렌더링
   */
  renderMenuHTML(store) {
    if (!store.menu || store.menu.length === 0) {
      return this.renderEmptyMenu();
    }

    // 메뉴 데이터 정규화
    let menuData = store.menu;
    if (typeof menuData === 'string') {
      try {
        menuData = JSON.parse(menuData);
      } catch (e) {
        console.error('❌ 메뉴 JSON 파싱 실패:', e);
        return this.renderEmptyMenu();
      }
    }

    if (!Array.isArray(menuData)) {
      menuData = [menuData];
    }

    // 카테고리별로 그룹화
    const groupedMenu = this.groupByCategory(menuData);

    return `
      <div class="menu-container">
        ${Object.keys(groupedMenu).map(category => `
          <div class="menu-category">
            <h4 class="category-title">${category || '기본 메뉴'}</h4>
            <div class="menu-items-grid">
              ${groupedMenu[category].map(item => this.renderMenuItem(item)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 개별 메뉴 아이템 렌더링
   */
  renderMenuItem(item) {
    const price = item.price ? `${parseInt(item.price).toLocaleString()}원` : '가격 문의';
    const imageSrc = item.image_url || '/TableLink.png';
    const isAvailable = item.is_available !== false;

    return `
      <div class="menu-item ${!isAvailable ? 'unavailable' : ''}">
        <div class="menu-image-wrapper">
          <img src="${imageSrc}" alt="${item.name}" class="menu-image" loading="lazy">
          ${!isAvailable ? '<div class="soldout-badge">품절</div>' : ''}
        </div>
        <div class="menu-info">
          <h5 class="menu-name">${item.name}</h5>
          ${item.description ? `<p class="menu-description">${item.description}</p>` : ''}
          <div class="menu-footer">
            <span class="menu-price">${price}</span>
            ${item.is_popular ? '<span class="popular-badge">인기</span>' : ''}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 카테고리별 그룹화
   */
  groupByCategory(menuData) {
    const grouped = {};
    
    menuData.forEach(item => {
      const category = item.category || '기타';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  },

  /**
   * 빈 메뉴 렌더링
   */
  renderEmptyMenu() {
    return `
      <div class="empty-menu-state">
        <span class="empty-menu-icon">🍽️</span>
        <p class="empty-menu-text">등록된 메뉴가 없습니다</p>
      </div>
    `;
  },

  /**
   * 스타일 정의
   */
  getStyles() {
    return `
      <style>
        .menu-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .menu-category {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .category-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          padding-bottom: 8px;
        }

        .menu-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .menu-item {
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          transition: all 0.2s;
          cursor: pointer;
        }

        .menu-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
        }

        .menu-item.unavailable {
          opacity: 0.6;
          filter: grayscale(0.5);
          cursor: not-allowed;
        }

        .menu-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 75%;
          overflow: hidden;
          background: #f1f5f9;
        }

        .menu-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .soldout-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(239, 68, 68, 0.95);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .menu-info {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .menu-name {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .menu-description {
          margin: 0;
          font-size: 12px;
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
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .menu-price {
          font-size: 14px;
          font-weight: 700;
          color: #0ea5e9;
        }

        .popular-badge {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
        }

        .empty-menu-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 12px;
        }

        .empty-menu-icon {
          font-size: 48px;
          opacity: 0.5;
        }

        .empty-menu-text {
          margin: 0;
          font-size: 14px;
          color: #94a3b8;
        }

        @media (max-width: 480px) {
          .menu-items-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.menuHTML = menuHTML;

console.log('✅ menuHTML 모듈 로드 완료');
