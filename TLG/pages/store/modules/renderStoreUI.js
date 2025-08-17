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
      <div id="TLR" class="tlr-container premium-table-card">
        <div class="card-gradient-bg"></div>
        
        <div class="tlr-header-new">
          <div class="status-indicator-wrapper">
            <div class="status-pulse ${store.isOpen ? 'active' : 'inactive'}"></div>
            <div class="tlr-title-section">
              <h3 class="tlr-main-title">테이블 현황</h3>
              <div class="tlr-status-badge ${store.isOpen ? 'open' : 'closed'}" id="tableStatusBadge">
                ${store.isOpen ? '실시간 업데이트 중' : '운영중지'}
              </div>
            </div>
          </div>
          <div class="refresh-indicator" id="refreshIndicator">
            <span class="refresh-icon">🔄</span>
          </div>
        </div>

        <div class="table-visual-summary">
          <div class="visual-stats-row">
            <div class="visual-stat-item occupied">
              <div class="visual-icon">🔴</div>
              <div class="visual-data">
                <span class="visual-number" id="occupiedTablesVisual">-</span>
                <span class="visual-label">사용중</span>
              </div>
            </div>
            <div class="visual-stat-item available">
              <div class="visual-icon">🟢</div>
              <div class="visual-data">
                <span class="visual-number" id="availableTablesVisual">-</span>
                <span class="visual-label">이용가능</span>
              </div>
            </div>
            <div class="visual-stat-item total">
              <div class="visual-icon">⚪</div>
              <div class="visual-data">
                <span class="visual-number" id="totalTablesVisual">-</span>
                <span class="visual-label">전체</span>
              </div>
            </div>
          </div>
        </div>

        <div class="occupancy-visualization">
          <div class="occupancy-header">
            <span class="occupancy-title">좌석 사용률</span>
            <div class="occupancy-percentage-wrapper">
              <span class="occupancy-percentage" id="occupancyRateNew">-%</span>
              <div class="percentage-trend" id="occupancyTrend">
                <span class="trend-icon">📈</span>
              </div>
            </div>
          </div>
          
          <div class="occupancy-progress-container">
            <div class="occupancy-track">
              <div class="occupancy-fill" id="occupancyFillNew"></div>
              <div class="occupancy-glow" id="occupancyGlow"></div>
            </div>
            <div class="occupancy-markers">
              <span class="marker low">25%</span>
              <span class="marker mid">50%</span>
              <span class="marker high">75%</span>
            </div>
          </div>
          
          <div class="seats-breakdown">
            <div class="seats-info">
              <span class="seats-used" id="usedSeatsCount">-</span>
              <span class="seats-separator">/</span>
              <span class="seats-total" id="totalSeatsCount">-</span>
              <span class="seats-label">좌석</span>
            </div>
            <div class="seats-visual" id="seatsVisual">
              <!-- 좌석 아이콘들이 동적으로 생성됩니다 -->
            </div>
          </div>
        </div>

        <div class="quick-actions-row">
          <button class="action-btn layout-btn" onclick="renderTableLayout(${JSON.stringify(store).replace(/"/g, '&quot;')})">
            <span class="action-icon">🗺️</span>
            <span class="action-text">배치도</span>
          </button>
          <button class="action-btn refresh-btn" id="manualRefreshBtn">
            <span class="action-icon">🔄</span>
            <span class="action-text">새로고침</span>
          </button>
          <button class="action-btn reserve-btn" onclick="renderReservationScreen(${JSON.stringify(store).replace(/"/g, '&quot;')})">
            <span class="action-icon">📅</span>
            <span class="action-text">예약</span>
          </button>
        </div>
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

        /* 새로운 프리미엄 테이블 현황 스타일 */
        .premium-table-card {
          position: relative;
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.8);
          overflow: hidden;
        }

        .card-gradient-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          opacity: 0.03;
          z-index: 0;
        }

        .tlr-header-new {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .status-indicator-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .status-pulse {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
          position: relative;
        }

        .status-pulse.active {
          background: #10b981;
          animation: pulse-active 2s infinite;
        }

        .status-pulse.inactive {
          background: #ef4444;
          animation: pulse-inactive 2s infinite;
        }

        @keyframes pulse-active {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
            transform: scale(1.1);
          }
        }

        @keyframes pulse-inactive {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
            transform: scale(1.1);
          }
        }

        .tlr-title-section {
          flex: 1;
        }

        .tlr-main-title {
          font-size: 18px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }

        .tlr-status-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 12px;
          text-transform: none;
          letter-spacing: 0.3px;
          display: inline-block;
        }

        .tlr-status-badge.open {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #166534;
          border: 1px solid #a7f3d0;
        }

        .tlr-status-badge.closed {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #dc2626;
          border: 1px solid #fca5a5;
        }

        .refresh-indicator {
          background: rgba(59, 130, 246, 0.1);
          padding: 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .refresh-indicator:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: scale(1.05);
        }

        .refresh-icon {
          font-size: 14px;
          animation: rotate 2s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* 시각적 통계 섹션 */
        .table-visual-summary {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 20px;
          border: 1px solid #e2e8f0;
        }

        .visual-stats-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .visual-stat-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 8px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .visual-stat-item.occupied {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 1px solid #fca5a5;
        }

        .visual-stat-item.available {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          border: 1px solid #a7f3d0;
        }

        .visual-stat-item.total {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
        }

        .visual-stat-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .visual-icon {
          font-size: 18px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .visual-data {
          text-align: center;
        }

        .visual-number {
          display: block;
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          line-height: 1;
          margin-bottom: 2px;
        }

        .visual-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* 사용률 시각화 */
        .occupancy-visualization {
          background: white;
          border-radius: 16px;
          padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #f3f4f6;
        }

        .occupancy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .occupancy-title {
          font-size: 14px;
          font-weight: 700;
          color: #374151;
        }

        .occupancy-percentage-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .occupancy-percentage {
          font-size: 18px;
          font-weight: 800;
          color: #3b82f6;
        }

        .percentage-trend {
          padding: 4px;
          border-radius: 6px;
          background: rgba(34, 197, 94, 0.1);
        }

        .trend-icon {
          font-size: 12px;
        }

        .occupancy-progress-container {
          position: relative;
          margin-bottom: 12px;
        }

        .occupancy-track {
          position: relative;
          width: 100%;
          height: 12px;
          background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%);
          border-radius: 6px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .occupancy-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%);
          border-radius: 6px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          width: 0%;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
        }

        .occupancy-glow {
          position: absolute;
          top: -2px;
          left: 0;
          height: 16px;
          background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%);
          border-radius: 8px;
          width: 0%;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          filter: blur(2px);
        }

        .occupancy-markers {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          padding: 0 2px;
        }

        .marker {
          font-size: 9px;
          color: #9ca3af;
          font-weight: 500;
          position: relative;
        }

        .marker::before {
          content: '';
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 1px;
          height: 4px;
          background: #d1d5db;
        }

        /* 좌석 분석 */
        .seats-breakdown {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }

        .seats-info {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-weight: 600;
        }

        .seats-used {
          font-size: 16px;
          color: #ef4444;
        }

        .seats-separator {
          font-size: 14px;
          color: #9ca3af;
        }

        .seats-total {
          font-size: 16px;
          color: #6b7280;
        }

        .seats-label {
          font-size: 12px;
          color: #9ca3af;
          margin-left: 4px;
        }

        .seats-visual {
          display: flex;
          gap: 2px;
          flex-wrap: wrap;
          max-width: 120px;
        }

        .seat-icon {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          transition: all 0.2s ease;
        }

        .seat-icon.occupied {
          background: #ef4444;
          box-shadow: 0 0 4px rgba(239, 68, 68, 0.4);
        }

        .seat-icon.available {
          background: #10b981;
          box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
        }

        /* 액션 버튼들 */
        .quick-actions-row {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .action-btn {
          flex: 1;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .action-btn:hover {
          background: #f8fafc;
          border-color: #3b82f6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .action-btn.layout-btn:hover {
          border-color: #8b5cf6;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
        }

        .action-btn.refresh-btn:hover {
          border-color: #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }

        .action-btn.reserve-btn:hover {
          border-color: #f59e0b;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
        }

        .action-icon {
          font-size: 16px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .action-text {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
        }

        .action-btn:hover .action-text {
          color: #374151;
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