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
            ${this.renderLoyaltyLevelHTML()}
            ${this.renderPromotionCardHTML(store)}
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
      <div class="promotion-card modern-gradient-card promotion-theme">
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
      <div class="loyalty-levels-grid">
        <!-- 실제 데이터가 loadLoyaltyData 함수에서 여기에 동적으로 삽입됩니다 -->
        <div class="loyalty-loading-placeholder loyalty-theme">
          <div class="loading-spinner">⏳</div>
          <div class="loading-text">단골 등급 정보 로딩 중...</div>
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
          padding: 28px 24px 24px 24px;
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .store-header-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .score-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .rating-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(145deg, #fff7ed 0%, #fed7aa 100%);
          padding: 8px 12px;
          border-radius: 16px;
          border: 1px solid rgba(251, 191, 36, 0.2);
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.15);
        }

        #reviewStar {
          font-size: 22px;
          color: #f59e0b;
          filter: drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3));
        }

        #reviewScore {
          font-weight: 800;
          font-size: 18px;
          color: #92400e;
          letter-spacing: -0.02em;
        }

        .review-link {
          color: #3b82f6;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 10px;
          transition: all 0.3s ease;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .review-link:hover {
          background: rgba(59, 130, 246, 0.15);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .favorite-btn {
          border: none;
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          font-size: 26px;
          color: #ef4444;
          cursor: pointer;
          padding: 10px;
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .favorite-btn:hover {
          background: linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%);
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
        }

        #storeName {
          font-size: 32px;
          font-weight: 900;
          color: #111827;
          margin: 0 0 16px 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
          background: linear-gradient(135deg, #1f2937 0%, #4b5563 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .store-status-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .store-status {
          font-size: 13px;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .store-status.open {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #166534;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .store-status.closed {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .store-category-tag {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          color: #4b5563;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 14px;
          border: 1px solid rgba(107, 114, 128, 0.2);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        }

        /* 테이블 현황 스타일 */
        .tlr-container {
          padding: 20px;
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.06),
            0 1px 2px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .tlr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .tlr-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 17px;
          font-weight: 700;
          color: #1f2937;
          letter-spacing: -0.02em;
        }

        .tlr-icon {
          font-size: 20px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .tlr-status-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 16px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .tlr-status-badge.busy {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }

        .tlr-status-badge.full {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        .tlr-status-badge.closed {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
        }

        .tlr-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .stat-card {
          background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          padding: 16px 12px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.6);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-card:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.12),
            0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .stat-card.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.25);
        }

        .stat-card.success {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 20px rgba(17, 153, 142, 0.25);
        }

        .stat-card.info {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.25);
        }

        .stat-card.warning {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.25);
        }

        .stat-value {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          opacity: 0.9;
          letter-spacing: 0.02em;
        }

        .usage-rate-container {
          background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .usage-rate-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .usage-percentage {
          color: #667eea;
          font-weight: 700;
          font-size: 15px;
        }

        .usage-rate-bar {
          width: 100%;
          height: 8px;
          background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 100%);
          border-radius: 4px;
          overflow: hidden;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .usage-rate-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          width: 0%;
          box-shadow: 0 0 8px rgba(102, 126, 234, 0.4);
        }

        .modern-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-size: 15px;
          font-weight: 700;
          padding: 16px 24px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          letter-spacing: 0.02em;
          box-shadow: 
            0 4px 16px rgba(102, 126, 234, 0.3),
            0 1px 2px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .modern-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .modern-btn:hover::before {
          left: 100%;
        }

        .modern-btn:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 32px rgba(102, 126, 234, 0.4),
            0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .modern-btn:active {
          transform: translateY(0);
        }

        /* 네비게이션 바 */
        .modern-nav {
          margin: 0;
          width: 100%;
          border-radius: 0;
          border: none;
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          display: flex;
          justify-content: space-between;
          padding: 0;
          margin-bottom: 20px;
          gap: 0;
          position: sticky;
          top: 0;
          z-index: 5;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          backdrop-filter: blur(20px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .nav-btn {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: #6b7280;
          padding: 18px 0 14px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 3px solid transparent;
          font-weight: 600;
        }

        .nav-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(145deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .nav-btn:hover::before {
          opacity: 1;
        }

        .nav-btn:hover {
          color: #374151;
          transform: translateY(-1px);
        }

        .nav-btn .nav-ico {
          font-size: 22px;
          margin-bottom: 2px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
          transition: all 0.3s ease;
        }

        .nav-btn:hover .nav-ico {
          transform: scale(1.1);
        }

        .nav-btn.active {
          color: #3b82f6;
          font-weight: 700;
          border-bottom: 3px solid #3b82f6;
          background: linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%);
          box-shadow: inset 0 2px 4px rgba(59, 130, 246, 0.1);
        }

        .nav-btn.active .nav-ico {
          transform: scale(1.15);
          color: #2563eb;
        }

        /* 리뷰 프리뷰 */
        .review-preview {
          padding: 20px;
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 17px;
          font-weight: 800;
          color: #1f2937;
          margin: 0;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title::before {
          content: '💬';
          font-size: 18px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .modern-text-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          padding: 8px 14px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .modern-text-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }

        .review-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .modern-review {
          background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .modern-review::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .modern-review:hover::before {
          opacity: 1;
        }

        .modern-review:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .review-user {
          font-size: 14px;
          color: #3b82f6;
          font-weight: 700;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 4px 10px;
          border-radius: 10px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .review-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .review-score {
          font-size: 13px;
          color: #f59e0b;
          font-weight: 700;
          background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
          padding: 4px 8px;
          border-radius: 8px;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .review-date {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .review-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.5);
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        /* 프로모션 카드 */
        .modern-gradient-card {
          background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 18px;
          color: white;
          box-shadow: 
            0 12px 40px rgba(102, 126, 234, 0.3),
            0 4px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.15);
          position: relative;
          overflow: hidden;
        }

        .modern-gradient-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .promotion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .promotion-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .promotion-emoji {
          font-size: 20px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        .promotion-badge.live {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 800;
          animation: pulse 2s infinite;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.3);
          letter-spacing: 0.5px;
        }

        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.05);
          }
        }

        .promotion-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .promotion-item {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: all 0.3s ease;
        }

        .promotion-item:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: translateY(-1px);
        }

        .promotion-item.featured {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .promotion-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .promotion-icon {
          font-size: 20px;
          width: 32px;
          text-align: center;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        .promotion-name {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }

        .promotion-desc {
          font-size: 12px;
          opacity: 0.85;
          line-height: 1.3;
        }

        .promotion-discount {
          background: rgba(255, 255, 255, 0.25);
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          letter-spacing: -0.01em;
        }

        .promotion-tag {
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          color: #8b6914;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          letter-spacing: 0.5px;
        }

        .promotion-detail-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          position: relative;
          z-index: 1;
          overflow: hidden;
        }

        .promotion-detail-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .promotion-detail-btn:hover::before {
          left: 100%;
        }

        .promotion-detail-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
          padding: 8px 6px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-size: 10px;
          flex: 1;
        }

        .benefit-icon {
          font-size: 14px;
        }

        .benefit-text {
          text-align: center;
          line-height: 1.2;
        }

        /* 로딩 플레이스홀더 스타일 */
        .loyalty-loading-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          margin: 24px 0;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-radius: 12px;
          color: #64748b;
          text-align: center;
        }

        .loading-spinner {
          font-size: 24px;
          margin-bottom: 8px;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          font-size: 14px;
          opacity: 0.9;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .promotion-loading-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          margin: 24px 0;
          background: linear-gradient(135deg, #fef3f2 0%, #fee2e2 100%);
          border-radius: 12px;
          color: #64748b;
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