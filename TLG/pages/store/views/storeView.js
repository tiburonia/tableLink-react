// 매장 뷰 - UI 렌더링 전담 (직접 모듈 import)
import { tableStatusHTML } from "./modules/tableStatusHTML.js";
import { reviewPreviewHTML } from "./modules/reviewPreviewHTML.js";
import { promotionCardHTML } from "./modules/promotionCardHTML.js";
import { topUsersHTML } from "./modules/topUsersHTML.js";
import { loyaltyLevelHTML } from "./modules/loyaltyLevelHTML.js";
import { menuHTML } from "./modules/menuHTML.js";

// CSS 파일 import
const storeCSSLink = document.createElement("link");
storeCSSLink.rel = "stylesheet";
storeCSSLink.href = "/TLG/pages/store/views/storeCSS/store.css";
document.head.appendChild(storeCSSLink);

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
    <button id="backBtn" class="header-btn" data-action="back-to-map" aria-label="뒤로가기">
      <span class="header-btn-ico">⬅️</span>
    </button>

    <button id="TLL" class="header-btn" data-action="start-tll" aria-label="QR결제">
      <span class="header-btn-ico">📱</span>
    </button>

    <header id="storeHeader">
      <div class="imgWrapper">
        <img src="TableLink.png" alt="메뉴이미지" />
        <div class="header-overlay"></div>
      </div>
    </header>

    <div id="storePanel" class="collapsed" style="top: 200px">
      <div id="panelHandle"></div>
      <div id="storePanelContainer">

        <div id="storeInfoContainer">
          <div class="storeInfo">
            <div class="store-header-section">
              <div class="store-main-info">
                <div class="store-name-container" style="justify-content: center">
                <div id="storeName">${store.name}</div>
                <button id="favoriteBtn" class="favorite-btn">♡</button>
                </div>
                <div class="score-row">
                  <div class="rating-container">
                    <span id="reviewStar">★</span>
                    <span id="reviewScore">${displayRating}</span>
                    <span id="reviewLink" class="review-link">리뷰 보기</span>
                  </div>
                </div>


                <div class="store-status-container">
                  <span class="store-status ${store.isOpen ? "open" : "closed"}">
                    ${store.isOpen ? "🟢 운영중" : "🔴 운영중지"}
                  </span>
                  <span class="store-category-tag">음식점</span>
                </div>

              </div>
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

        <div id="storeContent">
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