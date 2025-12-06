/**
 * 메뉴 탭 뷰 - UI 렌더링
 */

export const menuTabView = {
  /**
   * 메뉴 탭 렌더링
   */
  render(store) {
    if (!store.menu || store.menu.length === 0) {
      return this.renderEmptyState();
    }

    return `
      <div class="menu-tab-container">
        ${this.renderMenuHeader(store)}
        ${this.renderCategoryFilter(store)}
        ${this.renderMenuGrid(store)}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 메뉴 헤더 렌더링
   */
  renderMenuHeader(store) {
    const totalItems = store.menu.length;
    const categories = [...new Set(store.menu.map(item => item.category || '기타'))];

    return `
      <div class="menu-header">
        <div class="menu-header-content">
          <div class="menu-icon-badge">
            🍽️
          </div>
          <div class="menu-header-info">
            <h2 class="menu-title">메뉴판</h2>
            <p class="menu-subtitle">${totalItems}개 메뉴 · ${categories.length}개 카테고리</p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 카테고리 필터 렌더링
   */
  renderCategoryFilter(store) {
    const categories = ['전체', ...new Set(store.menu.map(item => item.category || '기타'))];

    return `
      <div class="category-filter">
        ${categories.map((category, index) => `
          <button 
            class="category-btn ${index === 0 ? 'active' : ''}" 
            data-action="filter-menu-category"
            data-category="${category}"
            data-store-id="${store.id}">
            ${category}
          </button>
        `).join('')}
      </div>
    `;
  },

  /**
   * 메뉴 그리드 렌더링
   */
  renderMenuGrid(store) {
    return `
      <div class="menu-grid" id="menuGrid">
        ${this.renderMenuItems(store.menu)}
      </div>
    `;
  },

  /**
   * 메뉴 아이템 렌더링
   */
  renderMenuItems(menuItems) {
    return menuItems.map(item => `
      <div class="menu-item" data-category="${item.category || '기타'}">
        <div class="menu-item-image">
          ${item.image_url 
            ? `<img src="${item.image_url}" alt="${item.name}" loading="lazy" onerror="this.src='/TableLink.png'">`
            : '<div class="menu-no-image">🍽️</div>'
          }
          ${item.is_popular ? '<span class="popular-badge">인기</span>' : ''}
          ${item.is_new ? '<span class="new-badge">NEW</span>' : ''}
        </div>
        <div class="menu-item-content">
          <h3 class="menu-item-name">${item.name}</h3>
          ${item.description ? `<p class="menu-item-description">${item.description}</p>` : ''}
          <div class="menu-item-footer">
            <span class="menu-item-price">${item.price.toLocaleString()}원</span>
            ${item.discount_rate ? `
              <span class="menu-item-discount">${item.discount_rate}% 할인</span>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },

  /**
   * 빈 상태 렌더링
   */
  renderEmptyState() {
    return `
      <div class="menu-empty-state">
        <div class="empty-icon">🍽️</div>
        <h3 class="empty-title">등록된 메뉴가 없습니다</h3>
        <p class="empty-description">매장에 메뉴가 추가되면 여기에 표시됩니다</p>
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 카테고리 필터링
   */
  filterByCategory(category, storeId) {
    const allButtons = document.querySelectorAll('.category-btn');
    const allMenuItems = document.querySelectorAll('.menu-item');

    // 버튼 활성화 상태 변경
    allButtons.forEach(btn => {
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 메뉴 아이템 필터링
    allMenuItems.forEach(item => {
      if (category === '전체' || item.dataset.category === category) {
        item.style.display = 'block';
        item.style.animation = 'fadeIn 0.3s ease-in';
      } else {
        item.style.display = 'none';
      }
    });
  },

  /**
   * 스타일 정의
   */
  getStyles() {
    return `
      <style>
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .menu-tab-container {
          padding: 0;
          background: #f8f9fa;
          min-height: 100vh;
        }

        /* 메뉴 헤더 */
        .menu-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 16px;
          color: white;
        }

        .menu-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .menu-icon-badge {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }

        .menu-header-info {
          flex: 1;
        }

        .menu-title {
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .menu-subtitle {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        /* 카테고리 필터 */
        .category-filter {
          display: flex;
          gap: 8px;
          padding: 16px;
          background: white;
          overflow-x: auto;
          scrollbar-width: none;
          border-bottom: 1px solid #e5e7eb;
        }

        .category-filter::-webkit-scrollbar {
          display: none;
        }

        .category-btn {
          padding: 8px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 20px;
          background: white;
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .category-btn:hover {
          border-color: #667eea;
          background: #f5f7ff;
        }

        .category-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        /* 메뉴 그리드 */
        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          padding: 16px;
        }

        .menu-item {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
          cursor: pointer;
        }

        .menu-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
        }

        .menu-item-image {
          position: relative;
          width: 100%;
          height: 140px;
          overflow: hidden;
          background: #f1f3f5;
        }

        .menu-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .menu-no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          background: linear-gradient(135deg, #f1f3f5 0%, #e5e7eb 100%);
        }

        .popular-badge,
        .new-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          color: white;
        }

        .popular-badge {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .new-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .menu-item-content {
          padding: 12px;
        }

        .menu-item-name {
          margin: 0 0 6px 0;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .menu-item-description {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #64748b;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }

        .menu-item-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .menu-item-price {
          font-size: 16px;
          font-weight: 700;
          color: #667eea;
        }

        .menu-item-discount {
          padding: 2px 6px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        /* 빈 상태 */
        .menu-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          padding: 40px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 80px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-title {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .empty-description {
          margin: 0;
          font-size: 14px;
          color: #64748b;
        }

        /* 반응형 */
        @media (max-width: 480px) {
          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 10px;
            padding: 12px;
          }

          .menu-item-image {
            height: 120px;
          }

          .menu-header {
            padding: 20px 12px;
          }

          .menu-icon-badge {
            width: 48px;
            height: 48px;
            font-size: 24px;
          }

          .menu-title {
            font-size: 20px;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.menuTabView = menuTabView;

console.log('✅ menuTabView 모듈 로드 완료');