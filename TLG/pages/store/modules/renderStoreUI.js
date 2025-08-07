
// 매장 UI 렌더링 관리자 - 상업적 감성 디자인
window.StoreUIManager = {
  renderStoreHTML(store, displayRating) {
    const main = document.getElementById('main');

    main.innerHTML = `
      <button id="backBtn" class="header-btn premium-glass" onclick="renderMap().catch(console.error)" aria-label="뒤로가기">
        <span class="header-btn-ico glow-effect">⬅️</span>
      </button>
      <button id="TLL" class="header-btn premium-glass" aria-label="QR결제" onclick="TLL().catch(console.error)">
        <span class="header-btn-ico glow-effect">📱</span>
      </button>
      <header id="storeHeader">
        <div class="imgWrapper">
          <img src="TableLink.png" alt="메뉴이미지" />
          <div class="header-gradient-overlay"></div>
          <div class="floating-badge hot-badge">🔥 인기 매장</div>
        </div>
      </header>
      <div id="storePanel" class="collapsed premium-panel">
        <div id="panelHandle" class="premium-handle"></div>
        <div id="storePanelContainer">
          <div id="storeInfoContainer">
            <div class="storeInfo premium-store-info">
              <div class="store-header-section fade-up-animation">
                <div class="store-main-info">
                  <div class="score-row">
                    <div class="rating-container premium-rating">
                      <span id="reviewStar" class="star-glow">⭐</span>
                      <span id="reviewScore" class="rating-value">${displayRating}</span>
                      <span id="reviewLink" class="review-link premium-link pulse-animation">💌 후기 확인</span>
                    </div>
                    <button id="favoriteBtn" class="favorite-btn premium-heart">💖</button>
                  </div>
                  <h2 id="storeName" class="premium-store-name">${store.name}</h2>
                  <div class="store-status-container">
                    <span class="store-status premium-status ${store.isOpen ? 'open' : 'closed'}">
                      ${store.isOpen ? '✨ 지금 주문 가능!' : '💤 잠시 휴식중'}
                    </span>
                    <span class="store-category-tag premium-category">🍽️ 맛집</span>
                  </div>
                </div>
              </div>
            </div>
            ${this.renderPromotionCardHTML(store)}
            ${this.renderLoyaltyLevelHTML()}
            ${this.renderTableStatusHTML(store)}
            ${this.renderReviewPreviewHTML()}
          </div>
          <div id="storeNavBar" class="premium-nav">
            <button class="nav-btn premium-nav-btn" data-tab="menu">
              <span class="nav-ico glow-ico">🍽️</span>
              <span class="nav-label">메뉴</span>
              <div class="nav-ripple"></div>
            </button>
            <button class="nav-btn premium-nav-btn" data-tab="review">
              <span class="nav-ico glow-ico">💭</span>
              <span class="nav-label">후기</span>
              <div class="nav-ripple"></div>
            </button>
            <button class="nav-btn premium-nav-btn" data-tab="photo">
              <span class="nav-ico glow-ico">📸</span>
              <span class="nav-label">사진</span>
              <div class="nav-ripple"></div>
            </button>
            <button class="nav-btn premium-nav-btn" data-tab="info">
              <span class="nav-ico glow-ico">ℹ️</span>
              <span class="nav-label">정보</span>
              <div class="nav-ripple"></div>
            </button>
          </div>
          <div id="storeContent" class="premium-content"></div>
        </div>
      </div>
      <nav id="storeBottomBar" class="premium-bottom-bar">
        <button id="telephone" class="btm-btn phone-btn premium-phone" aria-label="전화">
          <span class="btm-btn-ico phone-pulse">📞</span>
        </button>
        <button id="order" class="btm-btn order-btn premium-order">
          <span class="order-text">🛒 지금 주문하기</span>
          <span class="order-arrow bounce-arrow">→</span>
        </button>
      </nav>
      ${this.getStoreStyles()}
    `;
  },

  renderTableStatusHTML(store) {
    return `
      <div id="TLR" class="tlr-container premium-table-card slide-up-animation">
        <div class="tlr-header">
          <div class="tlr-title premium-title">
            <span class="tlr-icon pulse-glow">🏪</span>
            <span>🔥 실시간 테이블 현황</span>
          </div>
          <div class="tlr-status-badge premium-badge ${store.isOpen ? 'live-badge' : 'closed'}" id="tableStatusBadge">
            ${store.isOpen ? '⚡ LIVE' : '💤 운영중지'}
          </div>
        </div>
        <div class="tlr-stats-grid premium-stats">
          <div class="stat-card premium-stat primary hover-lift">
            <div class="stat-value glow-number" id="totalTables">-</div>
            <div class="stat-label">총 테이블</div>
            <div class="stat-bg-icon">🏪</div>
          </div>
          <div class="stat-card premium-stat success hover-lift">
            <div class="stat-value glow-number" id="availableTables">-</div>
            <div class="stat-label">이용 가능</div>
            <div class="stat-bg-icon">✅</div>
          </div>
          <div class="stat-card premium-stat info hover-lift">
            <div class="stat-value glow-number" id="totalSeats">-</div>
            <div class="stat-label">총 좌석</div>
            <div class="stat-bg-icon">💺</div>
          </div>
          <div class="stat-card premium-stat warning hover-lift">
            <div class="stat-value glow-number" id="availableSeats">-</div>
            <div class="stat-label">잔여 좌석</div>
            <div class="stat-bg-icon">🎯</div>
          </div>
        </div>
        <div class="usage-rate-container premium-usage">
          <div class="usage-rate-header">
            <span>📊 테이블 사용률</span>
            <span class="usage-percentage premium-percentage" id="occupancyRate">-%</span>
          </div>
          <div class="usage-rate-bar premium-progress">
            <div class="usage-rate-fill animated-fill" id="usageRateFill"></div>
            <div class="progress-sparkle"></div>
          </div>
        </div>
        <button class="tlr-layout-btn premium-action-btn hover-glow" onclick="renderTableLayout(${JSON.stringify(store).replace(/"/g, '&quot;')})">
          <span class="btn-icon floating-icon">🗺️</span>
          <span>✨ 테이블 배치도 보기</span>
          <div class="btn-particles"></div>
        </button>
      </div>
    `;
  },

  renderReviewPreviewHTML() {
    return `
      <div id="reviewPreview" class="review-preview premium-review-card fade-up-animation">
        <div class="section-header premium-section-header">
          <h3 class="section-title premium-title">💬 고객 생생 후기</h3>
          <button class="see-more-btn premium-see-more hover-glow">전체보기 ✨</button>
        </div>
        <div id="reviewPreviewContent" class="review-content">
          <div class="review-card premium-review-item hover-lift">
            <div class="review-header">
              <span class="review-user premium-user">🎭 익명의 미식가</span>
              <div class="review-meta">
                <span class="review-score star-rating">⭐⭐⭐⭐⭐</span>
                <span class="review-date">1일 전</span>
              </div>
            </div>
            <div class="review-text premium-review-text">🔥 완전 대박! 이런 맛집이 있다니... 친구들에게 바로 추천했어요! 💕</div>
            <div class="review-tags">
              <span class="review-tag hot-tag">🔥 맛있어요</span>
              <span class="review-tag">🎉 재방문</span>
            </div>
          </div>
          <div class="review-card premium-review-item hover-lift">
            <div class="review-header">
              <span class="review-user premium-user">🍀 럭키가이</span>
              <div class="review-meta">
                <span class="review-score star-rating">⭐⭐⭐⭐</span>
                <span class="review-date">3일 전</span>
              </div>
            </div>
            <div class="review-text premium-review-text">⚡ 포장 주문 완전 빨라요! 바쁜 직장인에게 최고 👍</div>
            <div class="review-tags">
              <span class="review-tag speed-tag">⚡ 빨라요</span>
              <span class="review-tag">👍 추천</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderPromotionCardHTML(store) {
    return `
      <div class="promotion-card premium-promotion-card pulse-animation">
        <div class="promotion-header">
          <div class="promotion-title premium-promo-title">
            <span class="promotion-emoji sparkle-animation">🎁</span>
            <span>🎖️ 특별 혜택 대방출!</span>
          </div>
          <span class="promotion-badge live-promotion pulse-glow">🔥 HOT</span>
        </div>
        <div class="promotion-content">
          <div class="promotion-item featured premium-promo-item hover-glow">
            <div class="promotion-left">
              <span class="promotion-icon floating-icon">🎊</span>
              <div class="promotion-info">
                <div class="promotion-name premium-promo-name">💌 첫 방문 고객님께 특별 선물!</div>
                <div class="promotion-desc">✨ 지금 주문하면 10% 할인 + 무료 음료 증정</div>
              </div>
            </div>
            <div class="promotion-discount premium-discount glow-effect">10%</div>
          </div>
          <div class="promotion-item premium-promo-item hover-glow">
            <div class="promotion-left">
              <span class="promotion-icon floating-icon">👑</span>
              <div class="promotion-info">
                <div class="promotion-name premium-promo-name">🏆 VIP 단골 고객 혜택</div>
                <div class="promotion-desc">💎 레벨 3 이상 고객님께 5% 추가 할인</div>
              </div>
            </div>
            <div class="promotion-tag vip-tag glow-effect">VIP</div>
          </div>
        </div>
        <button class="promotion-detail-btn premium-detail-btn hover-lift">
          <span>🎁 더 많은 혜택 확인하기</span>
          <span class="arrow bounce-arrow">💫</span>
        </button>
      </div>
    `;
  },

  renderLoyaltyLevelHTML() {
    return `
      <div class="loyalty-card premium-loyalty-card slide-up-animation">
        <div class="loyalty-header">
          <div class="loyalty-title premium-loyalty-title">
            <span class="loyalty-crown sparkle-animation">👑</span>
            <span>💎 골드 등급 고객님!</span>
          </div>
          <div class="loyalty-level-badge premium-level-badge glow-effect">GOLD</div>
        </div>
        <div class="loyalty-greeting premium-greeting">
          🎖️ 골드 등급 고객님! 특별 쿠폰이 도착했어요 💌
        </div>
        <div class="loyalty-progress-section">
          <div class="progress-info premium-progress-info">
            <span class="current-level">🏆 Lv.3 골드 단골</span>
            <span class="next-level">✨ 플래티넘까지 3회</span>
          </div>
          <div class="loyalty-progress-bar premium-loyalty-progress">
            <div class="loyalty-progress-fill animated-progress" style="width: 75%;"></div>
            <div class="progress-sparkle moving-sparkle"></div>
          </div>
        </div>
        <div class="loyalty-benefits-grid premium-benefits">
          <div class="benefit-item premium-benefit hover-lift">
            <span class="benefit-icon floating-icon">🍹</span>
            <span class="benefit-text">무료 음료</span>
            <div class="benefit-glow"></div>
          </div>
          <div class="benefit-item premium-benefit hover-lift">
            <span class="benefit-icon floating-icon">⚡</span>
            <span class="benefit-text">우선 주문</span>
            <div class="benefit-glow"></div>
          </div>
          <div class="benefit-item premium-benefit hover-lift">
            <span class="benefit-icon floating-icon">🎂</span>
            <span class="benefit-text">생일 쿠폰</span>
            <div class="benefit-glow"></div>
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* 애니메이션 정의 */
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6); }
        }

        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 0.7; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }

        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes movingSparkle {
          0% { left: -10px; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }

        /* 애니메이션 클래스 */
        .fade-up-animation {
          animation: fadeUp 0.8s ease-out;
        }

        .slide-up-animation {
          animation: slideUp 0.8s ease-out;
        }

        .pulse-animation {
          animation: pulse 2s infinite;
        }

        .sparkle-animation {
          animation: sparkle 3s infinite;
        }

        .bounce-arrow {
          animation: bounce 1s infinite;
        }

        .floating-icon {
          animation: floating 2s ease-in-out infinite;
        }

        .glow-effect {
          animation: glow 2s infinite;
        }

        .pulse-glow {
          animation: pulse 1.5s infinite, glow 2s infinite;
        }

        .moving-sparkle {
          position: relative;
          overflow: hidden;
        }

        .moving-sparkle::after {
          content: '✨';
          position: absolute;
          top: -5px;
          animation: movingSparkle 3s infinite;
        }

        /* 헤더 스타일 */
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
          border-radius: 0 0 20px 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
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

        .header-gradient-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(transparent, rgba(0,0,0,0.3));
          pointer-events: none;
        }

        .floating-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 4px 15px rgba(238, 90, 36, 0.4);
          animation: pulse 2s infinite;
        }

        .hot-badge {
          animation: pulse 1.5s infinite, glow 2s infinite;
        }

        .premium-glass {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }

        .header-btn {
          position: absolute;
          top: 15px;
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 22px;
          font-size: 18px;
          cursor: pointer;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        #backBtn { left: 15px; }
        #TLL { right: 15px; }
        
        .header-btn:hover {
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }

        /* 패널 스타일 */
        .premium-panel {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 -15px 50px rgba(0, 0, 0, 0.2);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
          border-radius: 25px 25px 0 0;
        }
        
        .premium-panel.collapsed {
          top: 200px;
          bottom: 70px;
          height: calc(100vh - 270px);
        }
        
        .premium-panel.expanded {
          top: 0;
          bottom: 70px;
          height: calc(100vh - 70px);
          border-radius: 0;
          z-index: 99;
        }

        .premium-handle {
          width: 50px;
          height: 5px;
          background: linear-gradient(90deg, #d1d5db, #9ca3af);
          border-radius: 3px;
          margin: 15px auto 10px auto;
          cursor: grab;
          touch-action: none;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .premium-handle:hover {
          background: linear-gradient(90deg, #9ca3af, #6b7280);
          transform: scaleY(1.5);
        }

        #storePanelContainer {
          position: relative;
          height: calc(100% - 30px);
          overflow-y: auto;
          padding: 0 20px 100px 20px;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        
        #storePanelContainer::-webkit-scrollbar {
          width: 4px;
        }
        
        #storePanelContainer::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #667eea, #764ba2);
          border-radius: 2px;
        }

        /* 매장 정보 스타일 */
        .premium-store-info {
          padding: 25px 20px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.3);
        }

        .score-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .premium-rating {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .star-glow {
          font-size: 22px;
          color: #fbbf24;
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
          animation: pulse 2s infinite;
        }

        .rating-value {
          font-weight: 800;
          font-size: 20px;
          color: #111827;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .premium-link {
          color: #3b82f6;
          font-size: 14px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 12px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .premium-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        }

        .premium-heart {
          border: none;
          background: linear-gradient(135deg, #fecaca, #f87171);
          font-size: 24px;
          color: #dc2626;
          cursor: pointer;
          padding: 10px;
          border-radius: 50%;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(248, 113, 113, 0.3);
        }
        
        .premium-heart:hover {
          transform: scale(1.2) rotate(10deg);
          box-shadow: 0 8px 25px rgba(248, 113, 113, 0.5);
        }

        .premium-store-name {
          font-size: 32px;
          font-weight: 900;
          color: #111827;
          margin: 0 0 15px 0;
          letter-spacing: -0.8px;
          line-height: 1.1;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          background: linear-gradient(135deg, #111827, #374151);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .store-status-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .premium-status {
          font-size: 14px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 25px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .premium-status.open {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #166534;
          border: 2px solid #86efac;
        }

        .premium-status.closed {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #dc2626;
          border: 2px solid #fca5a5;
        }

        .premium-category {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          color: #6b7280;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 15px;
          border: 1px solid #d1d5db;
        }

        /* 테이블 현황 스타일 */
        .premium-table-card {
          padding: 25px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          margin-bottom: 20px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.3);
          position: relative;
          overflow: hidden;
        }

        .premium-table-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .tlr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .premium-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 19px;
          font-weight: 800;
          color: #111827;
          text-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .pulse-glow {
          font-size: 22px;
        }

        .premium-badge {
          font-size: 12px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .live-badge {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          animation: pulse 1.5s infinite;
        }

        .premium-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }

        .premium-stat {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border-radius: 16px;
          padding: 20px 15px;
          text-align: center;
          border: 2px solid transparent;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .premium-stat::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent, rgba(255,255,255,0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .hover-lift:hover::before {
          opacity: 1;
        }

        .premium-stat.primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: 2px solid #60a5fa;
        }

        .premium-stat.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: 2px solid #34d399;
        }

        .premium-stat.info {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: 2px solid #a78bfa;
        }

        .premium-stat.warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: 2px solid #fbbf24;
        }

        .glow-number {
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 6px;
          text-shadow: 0 0 10px rgba(255,255,255,0.5);
        }

        .stat-label {
          font-size: 13px;
          font-weight: 600;
          opacity: 0.9;
        }

        .stat-bg-icon {
          position: absolute;
          top: 10px;
          right: 15px;
          font-size: 24px;
          opacity: 0.3;
        }

        .premium-usage {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          border: 2px solid #e2e8f0;
        }

        .usage-rate-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #374151;
        }

        .premium-percentage {
          color: #3b82f6;
          font-weight: 800;
          font-size: 18px;
          text-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
        }

        .premium-progress {
          width: 100%;
          height: 12px;
          background: linear-gradient(90deg, #e5e7eb, #f3f4f6);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .animated-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%);
          border-radius: 6px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .animated-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .progress-sparkle {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          color: white;
          font-size: 10px;
          animation: sparkle 2s infinite;
        }

        .premium-action-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-size: 16px;
          font-weight: 700;
          padding: 18px 25px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .hover-glow:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
        }

        .btn-particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .premium-action-btn:hover .btn-particles {
          opacity: 1;
        }

        /* 네비게이션 바 */
        .premium-nav {
          margin: 0 -20px 20px -20px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          display: flex;
          justify-content: space-between;
          padding: 0;
          gap: 0;
          position: sticky;
          top: 0;
          z-index: 5;
          border-bottom: 3px solid #f3f4f6;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .premium-nav-btn {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: #6b7280;
          padding: 20px 0 15px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 4px solid transparent;
          overflow: hidden;
        }

        .premium-nav-btn:hover {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          color: #0369a1;
          transform: translateY(-2px);
        }

        .glow-ico {
          font-size: 22px;
          margin-bottom: 4px;
          transition: all 0.3s ease;
        }

        .premium-nav-btn:hover .glow-ico {
          transform: scale(1.2);
          filter: drop-shadow(0 0 8px rgba(3, 105, 161, 0.5));
        }

        .premium-nav-btn.active {
          color: #0369a1;
          font-weight: 700;
          border-bottom: 4px solid #0369a1;
          background: linear-gradient(135deg, #e0f2fe, #b0e7ff);
        }

        .nav-ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(3, 105, 161, 0.3);
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        }

        /* 리뷰 프리뷰 */
        .premium-review-card {
          padding: 25px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          margin-bottom: 20px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.3);
        }

        .premium-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .premium-see-more {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 12px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .premium-review-item {
          background: linear-gradient(135deg, #f8fafc, #ffffff);
          border-radius: 16px;
          padding: 20px;
          border: 2px solid #e2e8f0;
          margin-bottom: 15px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .premium-review-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.2);
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .premium-user {
          font-size: 15px;
          color: #3b82f6;
          font-weight: 700;
        }

        .review-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .star-rating {
          font-size: 14px;
          color: #fbbf24;
          filter: drop-shadow(0 1px 3px rgba(251, 191, 36, 0.3));
        }

        .review-date {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .premium-review-text {
          font-size: 15px;
          color: #374151;
          line-height: 1.6;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .review-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .review-tag {
          background: linear-gradient(135deg, #e0f2fe, #b0e7ff);
          color: #0369a1;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid #7dd3fc;
        }

        .hot-tag {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #dc2626;
          border: 1px solid #fca5a5;
          animation: pulse 2s infinite;
        }

        .speed-tag {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #d97706;
          border: 1px solid #fcd34d;
        }

        /* 프로모션 카드 */
        .premium-promotion-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 25px;
          margin-bottom: 20px;
          color: white;
          box-shadow: 0 20px 50px rgba(102, 126, 234, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .premium-promotion-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 3s infinite;
        }

        .promotion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .premium-promo-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 19px;
          font-weight: 800;
        }

        .live-promotion {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          padding: 6px 14px;
          border-radius: 15px;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }

        .promotion-content {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }

        .premium-promo-item {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .premium-promo-item.featured {
          background: rgba(255, 255, 255, 0.25);
          border: 2px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .premium-promo-item:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.25);
        }

        .promotion-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .premium-promo-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .promotion-desc {
          font-size: 13px;
          opacity: 0.9;
          font-weight: 500;
        }

        .premium-discount {
          background: rgba(255, 255, 255, 0.25);
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 900;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .vip-tag {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #92400e;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
        }

        .premium-detail-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 15px 20px;
          border-radius: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.3s ease;
          backdrop-filter: blur(20px);
        }

        .premium-detail-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        /* 단골 레벨 카드 */
        .premium-loyalty-card {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 20px;
          padding: 25px;
          margin-bottom: 20px;
          color: white;
          box-shadow: 0 20px 50px rgba(240, 147, 251, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .premium-loyalty-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 4s infinite;
        }

        .loyalty-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .premium-loyalty-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 19px;
          font-weight: 800;
        }

        .premium-level-badge {
          background: rgba(255, 255, 255, 0.25);
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 800;
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .premium-greeting {
          background: rgba(255, 255, 255, 0.15);
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-weight: 600;
          text-align: center;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .loyalty-progress-section {
          margin-bottom: 20px;
        }

        .premium-progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .current-level {
          font-weight: 700;
        }

        .next-level {
          opacity: 0.9;
          font-weight: 500;
        }

        .premium-loyalty-progress {
          width: 100%;
          height: 10px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .animated-progress {
          height: 100%;
          background: linear-gradient(90deg, #ffd700 0%, #ffed4e 100%);
          border-radius: 5px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .animated-progress::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          animation: shimmer 2s infinite;
        }

        .premium-benefits {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .premium-benefit {
          background: rgba(255, 255, 255, 0.15);
          padding: 15px 10px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .premium-benefit:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.25);
        }

        .benefit-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .premium-benefit:hover .benefit-glow {
          opacity: 1;
        }

        .benefit-icon {
          font-size: 20px;
        }

        .benefit-text {
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }

        .premium-content {
          margin: 0;
          padding: 25px;
          font-size: 16px;
          min-height: 100px;
          color: #374151;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          border: 1px solid rgba(255,255,255,0.3);
        }

        /* 하단 바 */
        .premium-bottom-bar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 70px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-top: 3px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          padding: 0 20px;
          box-sizing: border-box;
          gap: 20px;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.1);
        }

        .btm-btn {
          border: none;
          outline: none;
          font-family: inherit;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
        }

        .premium-phone {
          width: 50px;
          min-width: 50px;
          max-width: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          color: #0369a1;
          font-size: 20px;
          border: 3px solid #7dd3fc;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
        }

        .phone-pulse {
          animation: pulse 2s infinite;
        }

        .premium-phone:hover {
          background: linear-gradient(135deg, #e0f2fe, #b0e7ff);
          transform: scale(1.1) rotate(10deg);
          box-shadow: 0 10px 30px rgba(14, 165, 233, 0.4);
        }

        .premium-order {
          flex: 1;
          height: 50px;
          border-radius: 25px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 16px;
          letter-spacing: 0.3px;
          box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }

        .premium-order::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .premium-order:hover::before {
          left: 100%;
        }

        .premium-order:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
        }

        .order-text {
          font-weight: 700;
        }

        @media (max-width: 480px) {
          .premium-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .premium-benefits {
            gap: 8px;
          }
          
          .premium-benefit {
            padding: 12px 8px;
          }
          
          .benefit-text {
            font-size: 11px;
          }
          
          .premium-store-name {
            font-size: 28px;
          }
        }
      </style>`;
  }
};
