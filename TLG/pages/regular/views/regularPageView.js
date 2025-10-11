/**
 * 단골매장 페이지 View (v3 - 하단 nav 전환)
 * UI 렌더링 - 단골/즐겨찾기 전환
 */

export const regularPageView = {
  /**
   * 메인 페이지 렌더링
   */
  render(data) {
    const { summary, stores, posts } = data;

    return `
      <div class="regular-page-container">
        ${this.renderHeader(summary)}
        ${this.renderStoreListContainer(stores)}
        ${this.renderBottomTabNav()}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 헤더 영역 - 심플하게
   */
  renderHeader(summary) {
    return `
      <header class="regular-header">
        <h1 class="page-title">내 매장</h1>
        <p class="header-subtitle">총 ${summary?.totalStores || 0}곳 · 최근 방문 ${summary?.lastVisit || '-'}</p>
      </header>
    `;
  },

  /**
   * 매장 리스트 컨테이너 (단골/즐겨찾기)
   */
  renderStoreListContainer(stores) {
    return `
      <main class="store-list-container">
        <div class="store-list regular-list active">
          ${stores && stores.length > 0 ? this.renderStoreCards(stores) : this.renderEmptyState('regular')}
        </div>
        <div class="store-list favorite-list">
          ${this.renderEmptyState('favorite')}
        </div>
      </main>
    `;
  },

  /**
   * 매장 카드 렌더링
   */
  renderStoreCards(stores) {
    return stores.map(store => this.renderStoreCard(store)).join('');
  },

  /**
   * 개별 매장 카드
   */
  renderStoreCard(store) {
    const levelColor = window.regularPageService?.getLevelColor(store.level) || '#64748b';
    const levelIcon = window.regularPageService?.getLevelIcon(store.level) || '🏅';

    return `
      <div class="store-card" onclick="goToStore(${store.storeId})">
        <div class="store-card-header">
          <div class="store-thumbnail" style="background: linear-gradient(135deg, ${levelColor}40, ${levelColor}20)">
            <span class="store-icon">${store.category === '카페' ? '☕' : store.category === '치킨' ? '🍗' : '🍜'}</span>
          </div>
          <div class="store-badge" style="background: ${levelColor}">
            ${levelIcon} ${store.levelName}
          </div>
        </div>

        <div class="store-card-body">
          <h3 class="store-name">${store.storeName}</h3>
          <p class="store-category">${store.category}</p>

          <div class="store-stats">
            <div class="stat-item">
              <span class="stat-label">포인트</span>
              <span class="stat-value">${store.points.toLocaleString()}P</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-label">쿠폰</span>
              <span class="stat-value">${store.coupons}장</span>
            </div>
          </div>

          <div class="store-meta">
            <span class="meta-text">🕒 ${store.lastVisit}</span>
            <span class="meta-text">📍 ${store.distance}</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Empty State
   */
  renderEmptyState(type) {
    const config = {
      regular: {
        icon: '❤️',
        title: '단골 매장이 없어요',
        description: '자주 가는 매장을 단골로 등록하고<br>특별한 혜택을 받아보세요!'
      },
      favorite: {
        icon: '⭐',
        title: '즐겨찾기한 매장이 없어요',
        description: '마음에 드는 매장을 즐겨찾기에 추가하고<br>빠르게 찾아보세요!'
      }
    };

    const { icon, title, description } = config[type];

    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <h3 class="empty-title">${title}</h3>
        <p class="empty-text">${description}</p>
        <button class="empty-btn" onclick="renderMap()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          매장 찾아보기
        </button>
      </div>
    `;
  },

  /**
   * 하단 탭 네비게이션
   */
  renderBottomTabNav() {
    return `
      <nav class="bottom-tab-nav">
        <button class="tab-btn active" data-tab="regular">
          <span class="tab-icon">❤️</span>
          <span class="tab-label">단골</span>
        </button>
        <button class="tab-btn" data-tab="favorite">
          <span class="tab-icon">⭐</span>
          <span class="tab-label">즐겨찾기</span>
        </button>
      </nav>
    `;
  },

  /**
   * 스타일
   */
  getStyles() {
    return `
      <style>
        * {
          box-sizing: border-box;
        }

        .regular-page-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          max-width: 430px;
          height: 100vh;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ===== 헤더 ===== */
        .regular-header {
          background: white;
          padding: 60px 20px 16px 20px;
          border-bottom: 1px solid #f3f4f6;
          text-align: center;
        }

        .page-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 800;
          color: #1f2937;
          letter-spacing: -0.02em;
        }

        .header-subtitle {
          margin: 0;
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* ===== 매장 리스트 컨테이너 ===== */
        .store-list-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          padding-bottom: 80px;
        }

        .store-list {
          display: none;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .store-list.active {
          display: grid;
        }

        /* ===== 매장 카드 ===== */
        .store-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .store-card:active {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .store-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .store-thumbnail {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .store-icon {
          font-size: 24px;
        }

        .store-badge {
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 10px;
          color: white;
          font-weight: 700;
        }

        .store-card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .store-name {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .store-category {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .store-stats {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-label {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        .stat-value {
          font-size: 13px;
          font-weight: 700;
          color: #FF8A00;
        }

        .stat-divider {
          width: 1px;
          height: 24px;
          background: #e5e7eb;
        }

        .store-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-text {
          font-size: 11px;
          color: #6b7280;
        }

        /* ===== Empty State ===== */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 20px;
          margin: 20px 0;
        }

        .empty-icon {
          font-size: 56px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .empty-text {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.6;
        }

        .empty-btn {
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          background: #FF8A00;
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .empty-btn:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(255, 138, 0, 0.3);
        }

        /* ===== 하단 탭 네비게이션 ===== */
        .bottom-tab-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          max-width: 430px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 40px;
          padding: 12px 0 16px 0;
          background: white;
          border-top: 1px solid #f3f4f6;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
          z-index: 100;
        }

        .tab-btn {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 8px 16px;
        }

        .tab-btn:active {
          transform: scale(0.95);
        }

        .tab-icon {
          font-size: 24px;
          transition: transform 0.2s;
        }

        .tab-label {
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-btn.active .tab-icon {
          transform: scale(1.1);
        }

        .tab-btn.active .tab-label {
          color: #1f2937;
          font-weight: 700;
        }

        /* 반응형 */
        @media (max-width: 380px) {
          .store-list {
            grid-template-columns: 1fr;
          }

          .page-title {
            font-size: 20px;
          }
        }
      </style>
    `;
  }
};

window.regularPageView = regularPageView;
console.log('✅ regularPageView v3 모듈 로드 완료 (하단 nav 전환)');