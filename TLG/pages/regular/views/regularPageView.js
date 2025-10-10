
/**
 * 단골매장 페이지 View
 * UI 렌더링
 */

export const regularPageView = {
  /**
   * 메인 페이지 렌더링
   */
  render(data) {
    const { summary, stores } = data;

    return `
      <div class="regular-page-container">
        ${this.renderHeader(summary)}
        ${this.renderSummarySection(summary)}
        ${this.renderStoresList(stores)}
        ${this.renderBenefitSection(summary)}
        ${this.renderFooterCTA()}
        ${this.renderBottomNav()}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 헤더 영역
   */
  renderHeader(summary) {
    return `
      <header class="regular-header">
        <div class="header-top">
          <div class="header-left">
            <h1 class="page-title">❤️ 단골매장</h1>
          </div>
          <div class="header-right">
            <button class="icon-btn" id="sortBtn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="icon-btn" id="searchBtn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <p class="header-subtitle">총 단골 ${summary?.totalStores || 0}곳 | 최근 방문 ${summary?.lastVisit || '-'}</p>
      </header>
    `;
  },

  /**
   * 요약 배너
   */
  renderSummarySection(summary) {
    return `
      <section class="summary-section">
        <div class="summary-card">
          <div class="summary-item">
            <div class="summary-icon">👑</div>
            <div class="summary-content">
              <p class="summary-label">내 단골 등급</p>
              <p class="summary-value">${summary?.topLevelName || '-'}</p>
            </div>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-item">
            <div class="summary-icon">💰</div>
            <div class="summary-content">
              <p class="summary-label">누적 포인트</p>
              <p class="summary-value">${(summary?.totalPoints || 0).toLocaleString()}P</p>
            </div>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-item">
            <div class="summary-icon">🎟️</div>
            <div class="summary-content">
              <p class="summary-label">보유 쿠폰</p>
              <p class="summary-value">${summary?.totalCoupons || 0}장</p>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 매장 리스트
   */
  renderStoresList(stores) {
    if (!stores || stores.length === 0) {
      return `
        <section class="stores-section">
          <div class="empty-state">
            <div class="empty-icon">🏪</div>
            <h3>단골 매장이 없어요</h3>
            <p>자주 가는 매장을 단골로 등록해보세요!</p>
          </div>
        </section>
      `;
    }

    return `
      <section class="stores-section">
        <h2 class="section-title">내 단골 매장</h2>
        <div class="stores-list">
          ${stores.map(store => this.renderStoreCard(store)).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 매장 카드
   */
  renderStoreCard(store) {
    const levelColor = window.regularPageService?.getLevelColor(store.level) || '#64748b';
    const levelIcon = window.regularPageService?.getLevelIcon(store.level) || '🏅';

    return `
      <div class="store-card" onclick="goToStore(${store.storeId})">
        <div class="store-header">
          <div class="store-info">
            <h3 class="store-name">${store.storeName}</h3>
            <div class="store-meta">
              <span class="store-category">${store.category}</span>
              <span class="store-level-badge" style="background: ${levelColor}">
                ${levelIcon} ${store.levelName}
              </span>
            </div>
          </div>
        </div>

        <div class="store-body">
          <div class="store-details">
            <p class="store-address">📍 ${store.address} · ${store.distance}</p>
            <p class="store-visit">🕒 마지막 주문: ${store.lastVisit}</p>
          </div>

          <div class="store-benefits">
            <div class="benefit-item">
              <span class="benefit-icon">💰</span>
              <span class="benefit-text">${store.points.toLocaleString()}P</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🎟️</span>
              <span class="benefit-text">쿠폰 ${store.coupons}장</span>
            </div>
            ${store.hasUnwrittenReview ? `
              <div class="benefit-item review-reminder">
                <span class="benefit-icon">✍️</span>
                <span class="benefit-text">리뷰 작성하기</span>
              </div>
            ` : ''}
          </div>

          ${store.recentReview ? `
            <div class="recent-review">
              <span class="review-icon">💬</span>
              <p class="review-text">"${store.recentReview}"</p>
            </div>
          ` : ''}

          <div class="store-actions">
            <button class="action-btn primary" onclick="event.stopPropagation(); orderFromStore(${store.storeId})">
              주문하기
            </button>
            ${store.hasUnwrittenReview ? `
              <button class="action-btn secondary" onclick="event.stopPropagation(); writeReview(${store.storeId})">
                리뷰 남기기
              </button>
            ` : `
              <button class="action-btn secondary" onclick="event.stopPropagation(); viewCoupons(${store.storeId})">
                쿠폰보기
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 혜택 요약 섹션
   */
  renderBenefitSection(summary) {
    return `
      <section class="benefit-section">
        <h2 class="section-title">내 혜택 한눈에</h2>
        <div class="benefit-grid">
          <div class="benefit-card" onclick="viewPointHistory()">
            <div class="benefit-card-icon">💳</div>
            <h3>포인트 내역</h3>
            <p>매장별 적립/사용 확인</p>
          </div>
          <div class="benefit-card" onclick="viewAllCoupons()">
            <div class="benefit-card-icon">🎟️</div>
            <h3>보유 쿠폰</h3>
            <p>${summary?.totalCoupons || 0}장 사용 가능</p>
          </div>
          <div class="benefit-card" onclick="viewUnwrittenReviews()">
            <div class="benefit-card-icon">✍️</div>
            <h3>미작성 리뷰</h3>
            <p>${summary?.unwrittenReviews || 0}곳 리뷰 쓰고 쿠폰받기</p>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 하단 고정 CTA
   */
  renderFooterCTA() {
    return `
      <footer class="footer-cta">
        <button class="cta-btn outline" onclick="viewAllRegularStores()">
          모든 단골 보기
        </button>
        <button class="cta-btn filled" onclick="goToCoupons()">
          내 쿠폰함 바로가기
        </button>
      </footer>
    `;
  },

  /**
   * 바텀 네비게이션
   */
  renderBottomNav() {
    return `
      <nav class="bottom-nav-bar">
        <button onclick="renderSubMain()" class="nav-item">
          <span class="nav-icon">
            <img width="26" height="26" src="https://img.icons8.com/external-solid-adri-ansyah/26/external-home-essentials-ui-solid-adri-ansyah.png" alt="home"/>
          </span>
          <span class="nav-label">홈</span>
        </button>
        <button onclick="TLL()" class="nav-item">
          <span class="nav-icon">
            <img width="30" height="30" src="https://img.icons8.com/external-tanah-basah-glyph-tanah-basah/30/external-qr-metaverse-tanah-basah-glyph-tanah-basah.png" alt="qr"/>
          </span>
          <span class="nav-label">QR 주문</span>
        </button>
        <button onclick="renderMap()" class="nav-item">
          <span class="nav-icon">
            <img width="26" height="26" src="https://img.icons8.com/ios-filled/26/marker.png" alt="map"/>
          </span>
          <span class="nav-label">내주변</span>
        </button>
        <button class="nav-item active">
          <span class="nav-icon">
            <img width="30" height="30" src="https://img.icons8.com/pastel-glyph/30/shop--v2.png" alt="regular"/>
          </span>
          <span class="nav-label">단골매장</span>
        </button>
        <button onclick="renderMyPage()" class="nav-item">
          <span class="nav-icon">
            <img width="30" height="30" src="https://img.icons8.com/ios-filled/30/more.png" alt="more"/>
          </span>
          <span class="nav-label">더보기</span>
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
        .regular-page-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, #fff5eb 0%, #fef3e2 100%);
          overflow-y: auto;
          padding-bottom: 140px;
        }

        /* 헤더 */
        .regular-header {
          background: white;
          padding: 60px 20px 20px 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .page-title {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #1f2937;
        }

        .header-right {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-btn:active {
          transform: scale(0.95);
          background: #e5e7eb;
        }

        .header-subtitle {
          margin: 0;
          font-size: 14px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* 요약 섹션 */
        .summary-section {
          padding: 20px;
        }

        .summary-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 16px rgba(255, 138, 0, 0.1);
        }

        .summary-item {
          flex: 1;
          text-align: center;
        }

        .summary-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .summary-label {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 600;
        }

        .summary-value {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #FF8A00;
        }

        .summary-divider {
          width: 1px;
          height: 40px;
          background: #e5e7eb;
        }

        /* 매장 리스트 */
        .stores-section {
          padding: 0 20px 20px 20px;
        }

        .section-title {
          margin: 0 0 16px 0;
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }

        .stores-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .store-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: all 0.2s;
        }

        .store-card:active {
          transform: scale(0.98);
        }

        .store-header {
          margin-bottom: 16px;
        }

        .store-name {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .store-meta {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .store-category {
          padding: 4px 8px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
        }

        .store-level-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .store-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .store-address,
        .store-visit {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
        }

        .store-benefits {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #fef3e2;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #FF8A00;
        }

        .benefit-item.review-reminder {
          background: #fef2f2;
          color: #dc2626;
        }

        .recent-review {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 12px;
          border-left: 3px solid #FF8A00;
        }

        .review-icon {
          font-size: 16px;
        }

        .review-text {
          margin: 0;
          font-size: 14px;
          color: #4b5563;
          font-style: italic;
          line-height: 1.5;
        }

        .store-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .action-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: #FF8A00;
          color: white;
        }

        .action-btn.primary:active {
          background: #e67a00;
        }

        .action-btn.secondary {
          background: #f3f4f6;
          color: #6b7280;
        }

        .action-btn.secondary:active {
          background: #e5e7eb;
        }

        /* 혜택 섹션 */
        .benefit-section {
          padding: 20px;
        }

        .benefit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .benefit-card {
          background: white;
          border-radius: 12px;
          padding: 16px 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .benefit-card:active {
          transform: scale(0.95);
        }

        .benefit-card-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .benefit-card h3 {
          margin: 0 0 4px 0;
          font-size: 13px;
          font-weight: 700;
          color: #1f2937;
        }

        .benefit-card p {
          margin: 0;
          font-size: 11px;
          color: #9ca3af;
        }

        /* 하단 CTA */
        .footer-cta {
          position: fixed;
          bottom: 72px;
          left: 0;
          right: 0;
          padding: 12px 20px;
          background: white;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          gap: 12px;
          z-index: 99;
        }

        .cta-btn {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cta-btn.outline {
          background: white;
          border: 2px solid #FF8A00;
          color: #FF8A00;
        }

        .cta-btn.outline:active {
          background: #fff5eb;
        }

        .cta-btn.filled {
          background: #FF8A00;
          border: none;
          color: white;
        }

        .cta-btn.filled:active {
          background: #e67a00;
        }

        /* 바텀 네비게이션 */
        .bottom-nav-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          display: flex;
          justify-content: space-around;
          padding: 8px 0 12px 0;
          border-top: 1px solid #f3f4f6;
          box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
          z-index: 1000;
        }

        .nav-item {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 6px 12px;
          flex: 1;
          transition: all 0.2s;
        }

        .nav-item.active .nav-label {
          color: #FF8A00;
          font-weight: 700;
        }

        .nav-label {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
          color: #9ca3af;
        }

        /* 반응형 */
        @media (max-width: 480px) {
          .benefit-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;
  }
};

window.regularPageView = regularPageView;
console.log('✅ regularPageView 모듈 로드 완료');
