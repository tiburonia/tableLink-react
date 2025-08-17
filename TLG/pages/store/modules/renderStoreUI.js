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
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/TLG/styles/renderStoreUI.css';
    document.head.appendChild(link);
    return ''; // Return empty string as styles are now in an external file
  }
};