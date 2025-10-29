
// CSS 파일 import
const storeCSSLink = document.createElement("link");
storeCSSLink.rel = "stylesheet";
storeCSSLink.href = "/TLG/pages/store/views/storeCSS/store.css";
if (!document.querySelector('link[href="/TLG/pages/store/views/storeCSS/store.css"]')) {
  document.head.appendChild(storeCSSLink);
}

const storePanelCSSLink = document.createElement("link");
storePanelCSSLink.rel = "stylesheet";
storePanelCSSLink.href = "/TLG/pages/store/views/storeCSS/storePanel.css";
if (!document.querySelector('link[href="/TLG/pages/store/views/storeCSS/storePanel.css"]')) {
  document.head.appendChild(storePanelCSSLink);
}

export const storeView = {
  /**
   * 메인 매장 HTML 렌더링
   */
  renderStoreHTML(store) {
    const main = document.getElementById("main");
    const displayRating = store.ratingAverage
      ? parseFloat(store.ratingAverage).toFixed(1)
      : "0.0";

    // 직접 import한 모듈들을 사용하여 렌더링
    main.innerHTML = `
    <div class="store-fixed-header">
      <button id="backBtn" class="header-btn" data-action="back-to-map" aria-label="뒤로가기">
        <span class="header-btn-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg></span>
      </button>

      <button id="TLL" class="header-btn" data-action="start-tll" aria-label="QR결제">
        <span class="header-btn-ico"><img width="30" height="30" src="https://img.icons8.com/external-tanah-basah-glyph-tanah-basah/30/external-qr-metaverse-tanah-basah-glyph-tanah-basah.png" alt="external-qr-metaverse-tanah-basah-glyph-tanah-basah"></span>
      </button>
    </div>

    <header id="storeHeader">
      <div class="imgWrapper">
        <img src="TableLink.png" alt="메뉴이미지" />
        <div class="header-overlay"></div>
      </div>
    </header>

    <div id="storePanel" class="collapsed" style="top: 200px; background: white;">
      <div id="panelHandle"></div>
      <div id="storePanelContainer">

        <div id="storeInfoContainer">
          <div class="storeInfo">
            <!-- 이벤트 뱃지 영역 -->
            <div class="store-badge-section">
              <div class="badge-left">
                ${store.hasPromotion !== false ? '<span class="event-badge">🎁 첫 방문 할인</span>' : ''}
                ${store.isNew ? '<span class="event-badge new">✨ 신규 오픈</span>' : ''}
              </div>
              <button class="store-story-btn" onclick="renderStoreFeed(${store.id})">
                <span class="story-icon">📖</span>
                <span class="story-text">매장 스토리</span>
              </button>
            </div>

            <!-- 카테고리 경로 -->
            <div class="store-breadcrumb">
              <span class="breadcrumb-item">${store.region?.sido || '서울'}</span>
              <span class="breadcrumb-separator">›</span>
              <span class="breadcrumb-item">${store.region?.sigungu || store.region?.eupmyeondong || '강남구'}</span>
              <span class="breadcrumb-separator">›</span>
              <span class="breadcrumb-item">${store.category || '한식'}</span>
            </div>

            <!-- 매장명과 즐겨찾기 -->
            <div class="store-name-row">
              <h1 id="storeName" class="store-main-title">${store.name}</h1>
              <button id="favoriteBtn" class="favorite-btn-v2" aria-label="즐겨찾기">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>

            <!-- 별점 및 리뷰 강조 영역 -->
            <div class="rating-emphasis-section">
              <div class="rating-display">
                <span class="star-icon">⭐</span>
                <span id="reviewScore" class="rating-score">${displayRating}</span>
                <span class="rating-divider">/</span>
                <span class="rating-max">5.0</span>
              </div>
              <button id="reviewLink" class="review-count-link" data-action="show-all-reviews">
                리뷰 ${store.reviewCount || 0}개
                <span class="chevron-icon">›</span>
              </button>
            </div>

            <!-- 한줄 소개 (감성적 캐치프레이즈) -->
            <div class="store-catchphrase">
              ${store.description || store.catchphrase || '신선한 재료로 정성껏 준비한 특별한 맛을 경험해보세요'}
            </div>

            <div class="store-additional-info-section"></div>

          </div>
        </div>

        <div id="storeNavBar" class="modern-nav">
          <button class="nav-btn" data-tab="home">
            <span class="nav-ico">🏠</span>
            <span class="nav-label">홈</span>
          </button>
          <button class="nav-btn" data-tab="regular">
            <span class="nav-ico">🍽️</span>
            <span class="nav-label">단골혜택</span>
          </button>
          <button class="nav-btn" data-tab="menu">
            <span class="nav-ico">🍽️</span>
            <span class="nav-label">메뉴</span>
          </button>
          <button class="nav-btn" data-tab="review">
            <span class="nav-ico">💬</span>
            <span class="nav-label">리뷰</span>
          </button>
          <button class="nav-btn" data-tab="info">
            <span class="nav-ico">ℹ️</span>
            <span class="nav-label">매장정보</span>
          </button>
        </div>

        <div id="storeContent" >
          <!-- 초기 로딩 스켈레톤 또는 빈 상태 -->
          <div class="home-tab-loading">로딩 중...</div>
        </div>

      </div>
    </div>

    <footer id="storeBottomBarWrapper">
      <nav id="storeBottomBar">
        <button id="telephone" class="btm-btn phone-btn" aria-label="전화">
          <span class="btm-btn-ico">📞</span>
        </button>
        <button id="order" class="btm-btn order-btn">
          <span class="order-text">포장·예약하기</span>
          <span class="order-arrow">→</span>
        </button>
      </nav>
    </footer>


    `;
  },





  /**
   * 오류 메시지 표시
   */
  showError(message) {
    const main = document.getElementById("main");
    if (main) {
      main.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <h2>🚫 매장을 불러올 수 없습니다</h2>
          <p style="color: #999; margin: 10px 0;">${message}</p>
          <button data-action="back-to-map" style="
            padding: 10px 20px;
            background: #297efc;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          ">지도로 돌아가기</button>
        </div>
      `;
    }
  },


};

// 전역 등록
window.storeView = storeView;