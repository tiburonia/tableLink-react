// 매장 UI 렌더링 관리자
window.StoreUIManager = {
  renderStoreHTML(store, displayRating) {
    const main = document.getElementById('main');

    main.innerHTML = `
      <button id="backBtn" class="header-btn" onclick="renderMap().catch(console.error)" aria-label="뒤로가기">
        <span class="header-btn-ico">⬅️</span>
      </button>
      <button id="TLL" class="header-btn" aria-label="QR결제" onclick="TLL().catch(console.error)">
        <span class="header-btn-ico">📱</span>
      </button>
      <header id="storeHeader">
        <div class="imgWrapper">
          <img src="TableLink.png" alt="메뉴이미지" />
          <div class="header-overlay"></div>
        </div>
      </header>
      <div id="storePanel" class="collapsed">
        <div id="panelHandle"></div>
        <div id="storePanelContainer">
          <div id="storeInfoContainer">
            <div class="storeInfo">
              <div class="store-header-section">
                <div class="store-main-info">
                  <div class="score-row">
                    <div class="rating-container">
                      <span id="reviewStar">★</span>
                      <span id="reviewScore">${displayRating}</span>
                      <span id="reviewLink" class="review-link">리뷰 보기</span>
                    </div>
                    <button id="favoriteBtn" class="favorite-btn">♡</button>
                  </div>
                  <h2 id="storeName">${store.name}</h2>
                  <div class="store-status-container">
                    <span class="store-status ${store.isOpen ? 'open' : 'closed'}">
                      ${store.isOpen ? '🟢 운영중' : '🔴 운영중지'}
                    </span>
                    <span class="store-category-tag">음식점</span>
                  </div>
                </div>
              </div>
            </div>
            ${this.renderPromotionCardHTML(store)}
            ${this.renderLoyaltyLevelHTML()}
            ${this.renderTableStatusHTML(store)}
            ${this.renderReviewPreviewHTML()}
          </div>
          <div id="storeNavBar" class="modern-nav">
            <button class="nav-btn" data-tab="menu">
              <span class="nav-ico">🍽️</span>
              <span class="nav-label">메뉴</span>
            </button>
            <button class="nav-btn" data-tab="review">
              <span class="nav-ico">💬</span>
              <span class="nav-label">리뷰</span>
            </button>
            <button class="nav-btn" data-tab="photo">
              <span class="nav-ico">📸</span>
              <span class="nav-label">사진</span>
            </button>
            <button class="nav-btn" data-tab="info">
              <span class="nav-ico">ℹ️</span>
              <span class="nav-label">정보</span>
            </button>
          </div>
          <div id="storeContent"></div>
        </div>
      </div>
      <nav id="storeBottomBar">
        <button id="telephone" class="btm-btn phone-btn" aria-label="전화">
          <span class="btm-btn-ico">📞</span>
        </button>
        <button id="order" class="btm-btn order-btn">
          <span class="order-text">포장·예약하기</span>
          <span class="order-arrow">→</span>
        </button>
      </nav>
      ${this.getStoreStyles()}
    `;
  },

  renderTableStatusHTML(store) {
    return `
      <div id="TLR" class="tlr-container modern-card">
        <div class="tlr-header">
          <div class="tlr-title">
            <span class="tlr-icon">🏪</span>
            <span>실시간 테이블 현황</span>
          </div>
          <div class="tlr-status-badge ${store.isOpen ? '' : 'closed'}" id="tableStatusBadge">
            ${store.isOpen ? '로딩중...' : '운영중지'}
          </div>
        </div>
        <div class="tlr-stats-grid">
          <div class="stat-card primary">
            <div class="stat-value" id="totalTables">-</div>
            <div class="stat-label">총 테이블</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value" id="availableTables">-</div>
            <div class="stat-label">이용 가능</div>
          </div>
          <div class="stat-card info">
            <div class="stat-value" id="totalSeats">-</div>
            <div class="stat-label">총 좌석</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value" id="availableSeats">-</div>
            <div class="stat-label">잔여 좌석</div>
          </div>
        </div>
        <div class="usage-rate-container">
          <div class="usage-rate-header">
            <span>테이블 사용률</span>
            <span class="usage-percentage" id="occupancyRate">-%</span>
          </div>
          <div class="usage-rate-bar">
            <div class="usage-rate-fill" id="usageRateFill"></div>
          </div>
        </div>
        <button class="tlr-layout-btn modern-btn" onclick="renderTableLayout(${JSON.stringify(store).replace(/"/g, '&quot;')})">
          <span class="btn-icon">🗺️</span>
          <span>테이블 배치도 보기</span>
        </button>
      </div>
    `;
  },

  renderReviewPreviewHTML() {
    return `
      <div id="reviewPreview" class="review-preview modern-card">
        <div class="section-header">
          <h3 class="section-title">최근 리뷰</h3>
          <button class="see-more-btn modern-text-btn">전체보기</button>
        </div>
        <div id="reviewPreviewContent" class="review-content">
          <div class="review-card modern-review">
            <div class="review-header">
              <span class="review-user">🐤 익명</span>
              <div class="review-meta">
                <span class="review-score">★ 5</span>
                <span class="review-date">1일 전</span>
              </div>
            </div>
            <div class="review-text">매장이 깔끔하고 음식이 진짜 맛있었어요! 또 방문할게요.</div>
          </div>
          <div class="review-card modern-review">
            <div class="review-header">
              <span class="review-user">🍙 user123</span>
              <div class="review-meta">
                <span class="review-score">★ 4</span>
                <span class="review-date">3일 전</span>
              </div>
            </div>
            <div class="review-text">포장 주문했는데 음식이 빨리 나왔어요. 추천!</div>
          </div>
        </div>
      </div>
    `;
  },

  renderPromotionCardHTML(store) {
    return `
      <div class="promotion-card modern-gradient-card">
        <div class="promotion-header">
          <div class="promotion-title">
            <span class="promotion-emoji">🎉</span>
            <span>진행중인 혜택</span>
          </div>
          <span class="promotion-badge live">LIVE</span>
        </div>
        <div class="promotion-content">
          <div class="promotion-item featured">
            <div class="promotion-left">
              <span class="promotion-icon">🎁</span>
              <div class="promotion-info">
                <div class="promotion-name">신규 방문 혜택</div>
                <div class="promotion-desc">첫 방문 시 10% 할인</div>
              </div>
            </div>
            <div class="promotion-discount">10%</div>
          </div>
          <div class="promotion-item">
            <div class="promotion-left">
              <span class="promotion-icon">⭐</span>
              <div class="promotion-info">
                <div class="promotion-name">단골 고객 혜택</div>
                <div class="promotion-desc">레벨 3 이상 5% 추가 할인</div>
              </div>
            </div>
            <div class="promotion-tag">VIP</div>
          </div>
        </div>
        <button class="promotion-detail-btn">
          <span>혜택 자세히 보기</span>
          <span class="arrow">→</span>
        </button>
      </div>
    `;
  },

  renderLoyaltyLevelHTML() {
    return `
      <div class="loyalty-card modern-gradient-card loyalty-theme">
        <div class="loyalty-header">
          <div class="loyalty-title">
            <span class="loyalty-crown">👑</span>
            <span>내 단골 등급</span>
          </div>
          <div class="loyalty-level-badge">골드</div>
        </div>
        <div class="loyalty-progress-section">
          <div class="progress-info">
            <span class="current-level">Lv.3 골드 단골</span>
            <span class="next-level">다음 등급까지 3회</span>
          </div>
          <div class="loyalty-progress-bar modern-progress">
            <div class="loyalty-progress-fill" style="width: 75%;"></div>
          </div>
        </div>
        <div class="loyalty-benefits-grid">
          <div class="benefit-item">
            <span class="benefit-icon">🎁</span>
            <span class="benefit-text">무료 음료</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">⚡</span>
            <span class="benefit-text">우선 주문</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🎂</span>
            <span class="benefit-text">생일 쿠폰</span>
          </div>
        </div>
      </div>
    `;
  },

  getStoreStyles() {
    return `
      <style>
        * {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
          background: #f8f9fa;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        #storeHeader {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 200px;
          background: white;
          z-index: 2;
          overflow: hidden;
        }

        .imgWrapper {
          width: 100%;
          height: 200px;
          overflow: hidden;
          position: relative;
        }

        .imgWrapper img {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-190px, -100px);
          filter: brightness(1.1) contrast(1.05);
        }

        .header-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(transparent, rgba(0,0,0,0.1));
          pointer-events: none;
        }

        #backBtn, #TLL {
          position: absolute;
          top: 15px;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: none;
          border-radius: 12px;
          font-size: 18px;
          cursor: pointer;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }

        #backBtn { left: 15px; }
        #TLL { right: 15px; }

        #backBtn:hover, #TLL:hover {
          background: white;
          transform: scale(1.05);
        }

        #storePanel {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          background: white;
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
        }

        #storePanel.collapsed {
          top: 200px;
          bottom: 70px;
          height: calc(100vh - 270px);
          border-radius: 20px 20px 0 0;
        }

        #storePanel.expanded {
          top: 0;
          bottom: 70px;
          height: calc(100vh - 70px);
          border-radius: 0;
          z-index: 99;
        }

        #panelHandle {
          width: 40px;
          height: 4px;
          background: #d1d5db;
          border-radius: 2px;
          margin: 12px auto 8px auto;
          cursor: grab;
          touch-action: none;
          transition: background 0.2s ease;
        }

        #panelHandle:hover {
          background: #9ca3af;
        }

        #storePanelContainer {
          position: relative;
          height: calc(100% - 24px);
          overflow-y: auto !important;
          overflow-x: hidden;
          box-sizing: border-box;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 0 20px 100px 20px;
          scroll-behavior: smooth;
          will-change: scroll-position;
        }

        #storePanelContainer::-webkit-scrollbar {
          width: 3px;
        }

        #storePanelContainer::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }

        .modern-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1);
          margin-bottom: 16px;
          border: 1px solid rgba(0,0,0,0.04);
        }

        .storeInfo {
          padding: 24px 20px 20px 20px;
        }

        .store-header-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .score-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .rating-container {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        #reviewStar {
          font-size: 20px;
          color: #fbbf24;
        }

        #reviewScore {
          font-weight: 700;
          font-size: 18px;
          color: #111827;
        }

        .review-link {
          color: #3b82f6;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .review-link:hover {
          background: #eff6ff;
        }

        .favorite-btn {
          border: none;
          background: none;
          font-size: 24px;
          color: #ef4444;
          cursor: pointer;
          padding: 8px;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .favorite-btn:hover {
          background: #fef2f2;
          transform: scale(1.1);
        }

        #storeName {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .store-status-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .store-status {
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .store-status.open {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .store-status.closed {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .store-category-tag {
          background: #f3f4f6;
          color: #6b7280;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 12px;
        }

        /* 테이블 현황 스타일 */
        .tlr-container {
          padding: 16px;
        }

        .tlr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .tlr-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }

        .tlr-icon {
          font-size: 18px;
        }

        .tlr-status-badge {
          background: #10b981;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tlr-status-badge.busy {
          background: #f59e0b;
        }

        .tlr-status-badge.full {
          background: #ef4444;
        }

        .tlr-status-badge.closed {
          background: #6b7280;
        }

        .tlr-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .stat-card {
          background: #f8fafc;
          border-radius: 10px;
          padding: 12px 8px;
          text-align: center;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .stat-card.primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
        }

        .stat-card.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
        }

        .stat-card.info {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
        }

        .stat-card.warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 2px;
        }

        .stat-label {
          font-size: 11px;
          font-weight: 500;
          opacity: 0.9;
        }

        .usage-rate-container {
          background: #f8fafc;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .usage-rate-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .usage-percentage {
          color: #3b82f6;
          font-weight: 700;
        }

        .usage-rate-bar {
          width: 100%;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .usage-rate-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
          width: 0%;
        }

        .modern-btn {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: none;
          color: white;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 20px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .modern-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        /* 네비게이션 바 */
        .modern-nav {
          margin: 0;
          width: 100%;
          border-radius: 0;
          border: none;
          background: white;
          display: flex;
          justify-content: space-between;
          padding: 0;
          margin-bottom: 16px;
          gap: 0;
          position: sticky;
          top: 0;
          z-index: 5;
          border-bottom: 1px solid #f3f4f6;
        }

        .nav-btn {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: #6b7280;
          padding: 16px 0 12px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 3px solid transparent;
        }

        .nav-btn:hover {
          background: #f9fafb;
          color: #374151;
        }

        .nav-btn .nav-ico {
          font-size: 20px;
          margin-bottom: 2px;
        }

        .nav-btn.active {
          color: #3b82f6;
          font-weight: 600;
          border-bottom: 3px solid #3b82f6;
          background: #eff6ff;
        }

        /* 리뷰 프리뷰 */
        .review-preview {
          padding: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .modern-text-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .modern-text-btn:hover {
          background: #eff6ff;
        }

        .review-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .modern-review {
          background: #f8fafc;
          border-radius: 10px;
          padding: 12px;
          border: 1px solid #e2e8f0;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .review-user {
          font-size: 13px;
          color: #3b82f6;
          font-weight: 600;
        }

        .review-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .review-score {
          font-size: 12px;
          color: #fbbf24;
          font-weight: 600;
        }

        .review-date {
          font-size: 11px;
          color: #9ca3af;
        }

        .review-text {
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
        }

        /* 프로모션 카드 */
        .modern-gradient-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 14px;
          color: white;
          box-shadow: 0 6px 24px rgba(102, 126, 234, 0.2);
          border: none;
        }

        .promotion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .promotion-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 16px;
          font-weight: 700;
        }

        .promotion-emoji {
          font-size: 18px;
        }

        .promotion-badge.live {
          background: rgba(239, 68, 68, 0.9);
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 700;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .promotion-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
        }

        .promotion-item {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(10px);
        }

        .promotion-item.featured {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .promotion-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .promotion-icon {
          font-size: 18px;
          width: 30px;
          text-align: center;
        }

        .promotion-name {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 3px;
        }

        .promotion-desc {
          font-size: 12px;
          opacity: 0.9;
        }

        .promotion-discount {
          background: rgba(255, 255, 255, 0.2);
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
        }

        .promotion-tag {
          background: rgba(251, 191, 36, 0.9);
          color: #92400e;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .promotion-detail-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 10px 14px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .promotion-detail-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        /* 단골 레벨 카드 */
        .loyalty-theme {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .loyalty-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .loyalty-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 16px;
          font-weight: 700;
        }

        .loyalty-crown {
          font-size: 18px;
        }

        .loyalty-level-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(10px);
        }

        .loyalty-progress-section {
          margin-bottom: 12px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 12px;
        }

        .current-level {
          font-weight: 600;
        }

        .next-level {
          opacity: 0.9;
        }

        .modern-progress {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          overflow: hidden;
        }

        .loyalty-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd700 0%, #ffed4e 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .loyalty-benefits-grid {
          display: flex;
          justify-content: space-between;
          gap: 6px;
        }

        .benefit-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 10px 6px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex: 1;
          backdrop-filter: blur(10px);
        }

        .benefit-icon {
          font-size: 16px;
        }

        .benefit-text {
          font-size: 10px;
          font-weight: 500;
          text-align: center;
        }

        /* 진행률 표시 */
      .level-progress {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }

      .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        margin-bottom: 6px;
        opacity: 0.9;
      }

      .progress-bar {
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 6px;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #66BB6A);
        transition: width 0.3s ease;
        border-radius: 3px;
      }

      .progress-text {
        font-size: 11px;
        opacity: 0.8;
        text-align: center;
      }

      /* 프로모션 관련 스타일 */
      .no-promotion {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0.7;
      }

      .no-promotion-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }

      .no-promotion-text {
        font-size: 14px;
        color: #666;
      }

      .promotion-more {
        margin-top: 8px;
        text-align: center;
      }

      .promotion-detail-btn {
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid rgba(102, 126, 234, 0.3);
        color: #667eea;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .promotion-detail-btn:hover {
        background: rgba(102, 126, 234, 0.2);
        border-color: rgba(102, 126, 234, 0.5);
      }

      /* 반응형 조정 */
      @media (max-width: 380px) {
        .loyalty-levels-grid {
          padding: 0 10px;
        }

        .loyalty-level-card {
          width: 100%;
          padding: 14px 16px;
          min-height: 65px;
        }

        .level-header {
          min-width: 110px;
          gap: 8px;
        }

        .level-icon {
          font-size: 20px;
        }

        .level-name {
          font-size: 13px;
        }

        .level-requirement {
          font-size: 10px;
        }

        .level-benefits {
          justify-content: center;
          gap: 4px;
        }

        .benefit-item {
          font-size: 10px;
          padding: 3px 6px;
        }

        .level-progress {
          margin-top: 8px;
          padding-top: 8px;
        }

        .progress-info {
          font-size: 11px;
        }

        .progress-text {
          font-size: 10px;
        }

        #storeBottomBar {
          padding: 0 16px;
        }

        .order-btn {
          margin-left: 12px;
        }

        .order-text {
          font-size: 15px;
        }
      }

      @media (max-width: 480px) {
        .tlr-stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .loyalty-benefits-grid {
          gap: 6px;
        }

        .benefit-item {
          padding: 10px 6px;
        }

        .benefit-text {
          font-size: 10px;
        }
      }

      /* 바텀바 스타일 */
      #storeBottomBar {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 70px;
        background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(250,252,255,0.95));
        border-top: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow:
          0 -8px 32px rgba(41, 126, 252, 0.08),
          0 -4px 16px rgba(0, 0, 0, 0.04),
          inset 0 1px 0 rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1000;
        padding: 0 20px;
        box-sizing: border-box;
        backdrop-filter: blur(20px);
      }

      .btm-btn {
        border: none;
        outline: none;
        font-family: inherit;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 600;
        border-radius: 12px;
      }

      .phone-btn {
        width: 48px;
        min-width: 48px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);
      }

      .phone-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.35);
      }

      .phone-btn:active {
        transform: translateY(0);
      }

      .btm-btn-ico {
        font-size: 18px;
      }

      .order-btn {
        flex: 1;
        margin-left: 16px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 0 24px;
        gap: 8px;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.25);
      }

      .order-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.35);
      }

      .order-btn:active {
        transform: translateY(0);
      }

      .order-text {
        font-size: 16px;
        font-weight: 700;
      }

      .order-arrow {
        font-size: 18px;
        margin-left: 4px;
      }

      @media (max-width: 380px) {
        #storeBottomBar {
          padding: 0 16px;
          height: 64px;
        }

        .order-btn {
          margin-left: 12px;
          padding: 0 20px;
        }

        .order-text {
          font-size: 15px;
        }

        .phone-btn {
          width: 44px;
          min-width: 44px;
          height: 44px;
        }

        .order-btn {
          height: 44px;
        }
      }
      </style>`;
  }
};