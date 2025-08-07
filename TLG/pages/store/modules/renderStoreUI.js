
// 매장 UI 렌더링 관리자
window.StoreUIManager = {
  renderStoreHTML(store, displayRating, reviewCount = 0) {
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
            <div class="store-main-header">
              <div class="header-left">
                <div class="rating-section">
                  <span id="reviewStar">★</span>
                  <span id="reviewScore">${displayRating}</span>
                  <span id="reviewLink" class="review-link">리뷰 보기 (${reviewCount})</span>
                </div>
                <h2 id="storeName">${store.name}</h2>
                <div class="status-tags">
                  <span class="store-status ${store.isOpen ? 'open' : 'closed'}">
                    ${store.isOpen ? '🟢 운영중' : '🔴 운영중지'}
                  </span>
                  <span class="category-tag">음식점</span>
                </div>
              </div>
              <div class="header-right">
                <button id="favoriteBtn" class="favorite-btn">♡</button>
                <div class="quick-stats">
                  <div class="quick-stat">
                    <span class="stat-number" id="quickAvailableTables">-</span>
                    <span class="stat-label">빈 테이블</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="promotion-section">
                <div class="section-header">
                  <div class="header-left">
                    <span class="section-icon">🎁</span>
                    <h3 class="section-title">혜택 정보</h3>
                  </div>
                  <span class="live-indicator">LIVE</span>
                </div>
                <div class="promotion-items">
                  <div class="promo-item">
                    <div class="promo-content">
                      <span class="promo-name">신규 고객 할인</span>
                      <span class="promo-desc">첫 주문 시</span>
                    </div>
                    <span class="promo-badge">10%</span>
                  </div>
                  <div class="promo-item">
                    <div class="promo-content">
                      <span class="promo-name">단골 추가 혜택</span>
                      <span class="promo-desc">VIP 등급 시</span>
                    </div>
                    <span class="promo-badge vip">VIP</span>
                  </div>
                </div>
              </div>
              
              <div class="loyalty-section">
                <div class="section-header">
                  <div class="header-left">
                    <span class="section-icon">👑</span>
                    <h3 class="section-title">단골 등급</h3>
                  </div>
                  <span class="level-badge">골드</span>
                </div>
                <div class="loyalty-content">
                  <div class="progress-container">
                    <div class="progress-info">
                      <span class="current-level">Lv.3</span>
                      <span class="next-level">→ Lv.4까지 3회 방문</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: 75%;"></div>
                    </div>
                  </div>
                  <div class="benefits-row">
                    <div class="benefit-item">
                      <span class="benefit-icon">🎁</span>
                      <span class="benefit-text">무료음료</span>
                    </div>
                    <div class="benefit-item">
                      <span class="benefit-icon">⚡</span>
                      <span class="benefit-text">우선주문</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="table-section">
                <div class="section-header">
                  <div class="header-left">
                    <span class="section-icon">🏪</span>
                    <h3 class="section-title">테이블 현황</h3>
                  </div>
                  <span class="status-indicator" id="miniTableStatusBadge">로딩중</span>
                </div>
                <div class="table-content">
                  <div class="table-stats">
                    <div class="stat-group">
                      <div class="stat-item total">
                        <span class="stat-number" id="miniTotalTables">-</span>
                        <span class="stat-label">전체</span>
                      </div>
                      <div class="stat-item available">
                        <span class="stat-number" id="miniAvailableTables">-</span>
                        <span class="stat-label">빈 테이블</span>
                      </div>
                      <div class="stat-item occupied">
                        <span class="stat-number" id="miniOccupiedTables">-</span>
                        <span class="stat-label">사용중</span>
                      </div>
                    </div>
                    <div class="usage-display">
                      <span class="usage-label">사용률</span>
                      <div class="usage-bar">
                        <div class="usage-fill" id="miniUsageFill"></div>
                      </div>
                      <span class="usage-percent" id="miniUsageRate">-%</span>
                    </div>
                  </div>
                  <button class="layout-btn" onclick="renderTableLayout(${JSON.stringify(store).replace(/"/g, '&quot;')})">
                    <span class="btn-icon">🗺️</span>
                    <span class="btn-text">테이블 배치도 보기</span>
                  </button>
                </div>
              </div>
              
              <div class="review-section">
                <div class="section-header">
                  <div class="header-left">
                    <span class="section-icon">💬</span>
                    <h3 class="section-title">리뷰</h3>
                  </div>
                  <button class="more-btn">전체보기</button>
                </div>
                <div class="review-content">
                  <div class="review-preview">
                    <div class="review-item">
                      <div class="reviewer-info">
                        <span class="reviewer-name">🐤 익명</span>
                        <span class="review-rating">★★★★★</span>
                      </div>
                      <p class="review-text">매장이 깔끔하고 음식도 맛있어요!</p>
                    </div>
                    <div class="review-item">
                      <div class="reviewer-info">
                        <span class="reviewer-name">🍙 user123</span>
                        <span class="review-rating">★★★★☆</span>
                      </div>
                      <p class="review-text">포장 주문했는데 빨리 나와서 좋았습니다</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="info-section">
                <div class="section-header">
                  <div class="header-left">
                    <span class="section-icon">ℹ️</span>
                    <h3 class="section-title">매장 정보</h3>
                  </div>
                </div>
                <div class="info-content">
                  <div class="info-items">
                    <div class="info-row">
                      <span class="info-label">📍 거리</span>
                      <span class="info-value">도보 3분</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">🕐 운영시간</span>
                      <span class="info-value">11:00-22:00</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">📞 주문</span>
                      <span class="info-value">전화주문 가능</span>
                    </div>
                    <div class="info-row special">
                      <span class="info-label">🔥 인기</span>
                      <span class="info-value">인기 매장</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
          overflow-y: auto;
          box-sizing: border-box;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 0 20px 100px 20px;
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
          border-radius: 12px 18px 14px 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.12);
          margin-bottom: 18px;
          border: 1px solid rgba(0,0,0,0.06);
          transform: rotate(0.2deg);
        }
        
        .modern-card:nth-child(even) {
          transform: rotate(-0.3deg);
          border-radius: 16px 12px 18px 14px;
        }
        
        .modern-card:nth-child(3n) {
          transform: rotate(0.1deg);
          border-radius: 15px 17px 13px 19px;
        }

        .store-main-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          background: white;
          margin-bottom: 8px;
        }

        .header-left {
          flex: 1;
        }

        .rating-section {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        #reviewStar {
          font-size: 18px;
          color: #fbbf24;
        }

        #reviewScore {
          font-weight: 700;
          font-size: 16px;
          color: #111827;
        }

        .review-link {
          color: #3b82f6;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 3px 6px;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .review-link:hover {
          background: #eff6ff;
        }

        #storeName {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 8px 0;
          letter-spacing: -0.3px;
          line-height: 1.2;
        }

        .status-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .store-status {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
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

        .category-tag {
          background: #f3f4f6;
          color: #6b7280;
          font-size: 10px;
          font-weight: 500;
          padding: 3px 6px;
          border-radius: 8px;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .favorite-btn {
          border: none;
          background: none;
          font-size: 20px;
          color: #ef4444;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .favorite-btn:hover {
          background: #fef2f2;
          transform: scale(1.05);
        }

        .quick-stats {
          display: flex;
          gap: 8px;
        }

        .quick-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 8px;
          background: #f0f9ff;
          border-radius: 8px;
          border: 1px solid #e0f2fe;
        }

        .stat-number {
          font-size: 16px;
          font-weight: 700;
          color: #0369a1;
        }

        .stat-label {
          font-size: 9px;
          color: #64748b;
          font-weight: 500;
        }

        /* 정보 그리드 레이아웃 */
        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 0 20px 24px 20px;
        }

        .info-grid > div {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.04);
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px 16px 20px;
          border-bottom: 1px solid #f1f3f4;
          background: #fafbfc;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-icon {
          font-size: 20px;
        }

        .section-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        /* 프로모션 섹션 */
        .live-indicator {
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
          animation: pulse 2s infinite;
        }

        .promotion-items {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .promo-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .promo-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .promo-name {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
        }

        .promo-desc {
          font-size: 13px;
          color: #6b7280;
        }

        .promo-badge {
          background: #3b82f6;
          color: white;
          font-size: 14px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 20px;
        }

        .promo-badge.vip {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        /* 단골 등급 섹션 */
        .level-badge {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 16px;
        }

        .loyalty-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .progress-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .current-level {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        .next-level {
          font-size: 13px;
          color: #6b7280;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .benefits-row {
          display: flex;
          gap: 12px;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f0f9ff;
          border-radius: 20px;
          border: 1px solid #bae6fd;
        }

        .benefit-icon {
          font-size: 16px;
        }

        .benefit-text {
          font-size: 13px;
          font-weight: 600;
          color: #0369a1;
        }

        /* 테이블 섹션 */
        .status-indicator {
          background: #10b981;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
        }

        .status-indicator.busy {
          background: #f59e0b;
        }

        .status-indicator.full {
          background: #ef4444;
        }

        .status-indicator.closed {
          background: #6b7280;
        }

        .table-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .table-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-group {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .stat-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .stat-item.total {
          background: #f0f9ff;
          border-color: #bae6fd;
        }

        .stat-item.available {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .stat-item.occupied {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .stat-number {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .stat-item.total .stat-number {
          color: #0369a1;
        }

        .stat-item.available .stat-number {
          color: #059669;
        }

        .stat-item.occupied .stat-number {
          color: #dc2626;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
        }

        .usage-display {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .usage-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          min-width: 50px;
        }

        .usage-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
          width: 0%;
        }

        .usage-percent {
          font-size: 14px;
          font-weight: 700;
          color: #3b82f6;
          min-width: 40px;
          text-align: right;
        }

        .layout-btn {
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

        .layout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-icon {
          font-size: 18px;
        }

        .btn-text {
          font-weight: 600;
        }

        /* 리뷰 섹션 */
        .more-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .more-btn:hover {
          background: #eff6ff;
        }

        .review-content {
          padding: 20px;
        }

        .review-preview {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .review-item {
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .reviewer-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .reviewer-name {
          font-size: 14px;
          font-weight: 600;
          color: #3b82f6;
        }

        .review-rating {
          font-size: 14px;
          color: #fbbf24;
        }

        .review-text {
          margin: 0;
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
        }

        /* 정보 섹션 */
        .info-content {
          padding: 20px;
        }

        .info-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .info-row.special {
          background: linear-gradient(135deg, #ff6366 0%, #ff9a56 100%);
          color: white;
          border: none;
        }

        .info-label {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
        }

        .info-row.special .info-label {
          color: white;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .info-row.special .info-value {
          color: white;
        }

        /* 테이블 현황 스타일 */
        .tlr-container {
          padding: 18px 22px 20px 18px;
        }

        .tlr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .tlr-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        .tlr-icon {
          font-size: 20px;
        }

        .tlr-status-badge {
          background: #10b981;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 16px;
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
          gap: 10px 14px;
          margin-bottom: 22px;
        }

        .stat-card {
          background: #f8fafc;
          border-radius: 10px 14px 12px 11px;
          padding: 15px 11px 17px 13px;
          text-align: center;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          transform: rotate(0.5deg);
        }
        
        .stat-card:nth-child(2) {
          transform: rotate(-0.8deg);
          border-radius: 13px 9px 15px 12px;
        }
        
        .stat-card:nth-child(3) {
          transform: rotate(0.3deg);
          border-radius: 11px 13px 10px 14px;
        }
        
        .stat-card:nth-child(4) {
          transform: rotate(-0.4deg);
          border-radius: 14px 10px 13px 11px;
        }

        .stat-card:hover {
          transform: translateY(-2px) rotate(0deg);
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
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
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 500;
          opacity: 0.9;
        }

        .usage-rate-container {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
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
          color: #3b82f6;
          font-weight: 700;
        }

        .usage-rate-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .usage-rate-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
          border-radius: 4px;
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
          padding: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .modern-text-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .modern-text-btn:hover {
          background: #eff6ff;
        }

        .review-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .modern-review {
          background: #f8fafc;
          border-radius: 10px 14px 11px 13px;
          padding: 15px 17px 16px 15px;
          border: 1px solid #e2e8f0;
          transform: rotate(0.2deg);
          margin: 10px 2px 14px 1px;
        }
        
        .modern-review:nth-child(even) {
          transform: rotate(-0.3deg);
          border-radius: 13px 10px 14px 11px;
          margin: 14px 1px 10px 2px;
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
          font-weight: 600;
        }

        .review-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .review-score {
          font-size: 13px;
          color: #fbbf24;
          font-weight: 600;
        }

        .review-date {
          font-size: 12px;
          color: #9ca3af;
        }

        .review-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
        }

        /* 프로모션 카드 */
        .modern-gradient-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          color: white;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
          border: none;
        }

        .promotion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .promotion-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
        }

        .promotion-emoji {
          font-size: 20px;
        }

        .promotion-badge.live {
          background: rgba(239, 68, 68, 0.9);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
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
          gap: 12px;
          margin-bottom: 16px;
        }

        .promotion-item {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px 14px 11px 13px;
          padding: 13px 15px 14px 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(10px);
          transform: rotate(0.3deg);
          margin: 8px 2px 12px 1px;
        }
        
        .promotion-item:nth-child(even) {
          transform: rotate(-0.4deg);
          border-radius: 13px 11px 14px 10px;
          margin: 12px 1px 8px 2px;
        }

        .promotion-item.featured {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .promotion-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .promotion-icon {
          font-size: 20px;
          width: 36px;
          text-align: center;
        }

        .promotion-name {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .promotion-desc {
          font-size: 13px;
          opacity: 0.9;
        }

        .promotion-discount {
          background: rgba(255, 255, 255, 0.2);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
        }

        .promotion-tag {
          background: rgba(251, 191, 36, 0.9);
          color: #92400e;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .promotion-detail-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 12px 16px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-size: 14px;
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
          margin-bottom: 16px;
        }

        .loyalty-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
        }

        .loyalty-crown {
          font-size: 20px;
        }

        .loyalty-level-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 6px 16px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 700;
          backdrop-filter: blur(10px);
        }

        .loyalty-progress-section {
          margin-bottom: 16px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .current-level {
          font-weight: 600;
        }

        .next-level {
          opacity: 0.9;
        }

        .modern-progress {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }

        .loyalty-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd700 0%, #ffed4e 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .loyalty-benefits-grid {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .benefit-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 11px 7px 13px 9px;
          border-radius: 8px 12px 9px 11px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          backdrop-filter: blur(10px);
          transform: rotate(0.6deg);
        }
        
        .benefit-item:nth-child(2) {
          transform: rotate(-0.5deg);
          border-radius: 11px 8px 12px 9px;
          padding: 13px 9px 11px 7px;
        }
        
        .benefit-item:nth-child(3) {
          transform: rotate(0.2deg);
          border-radius: 9px 11px 8px 12px;
        }

        .benefit-icon {
          font-size: 18px;
        }

        .benefit-text {
          font-size: 11px;
          font-weight: 500;
          text-align: center;
        }

        #storeContent {
          margin: 0;
          padding: 20px;
          font-size: 15px;
          min-height: 80px;
          color: #374151;
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        /* 하단 바 */
        #storeBottomBar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 70px;
          background: white;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          padding: 0 20px;
          box-sizing: border-box;
          gap: 16px;
        }

        .btm-btn {
          border: none;
          outline: none;
          font-family: inherit;
          transition: all 0.2s ease;
          cursor: pointer;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
        }

        .phone-btn {
          width: 50px;
          min-width: 50px;
          max-width: 50px;
          border-radius: 50%;
          background: #f0f9ff;
          color: #3b82f6;
          font-size: 20px;
          border: 2px solid #dbeafe;
          transition: all 0.2s ease;
        }

        .phone-btn:hover {
          background: #dbeafe;
          transform: scale(1.05);
        }

        .order-btn {
          flex: 1;
          height: 50px;
          border-radius: 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          font-size: 16px;
          letter-spacing: 0.2px;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .order-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .order-text {
          font-weight: 600;
        }

        .order-arrow {
          font-size: 18px;
          transition: transform 0.2s ease;
        }

        .order-btn:hover .order-arrow {
          transform: translateX(2px);
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
      </style>`;
  }
};
