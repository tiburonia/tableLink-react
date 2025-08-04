
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
          <img src="TableLink2.png" alt="메뉴이미지" />
        </div>
      </header>
      <div id="storePanel" class="collapsed">
        <div id="panelHandle"></div>
        <div id="storePanelContainer">
          <div id="storeInfoContainer">
            <div class="storeInfo">
              <div class="score-row">
                <span id="reviewStar">★</span>
                <span id="reviewScore">${displayRating}&nbsp<span id="reviewLink">></span></span> 
                <button id="favoriteBtn">♡</button>
              </div>
              <h2 id="storeName">${store.name}</h2>
              <div class="store-status-row">
                <span class="store-status ${store.isOpen ? 'open' : 'closed'}">${store.isOpen ? '🟢 운영중' : '🔴 운영중지'}</span>
              </div>
              <p class="store-desc">여기에 간단한 가게 소개 또는 태그</p>
            </div>
            ${this.renderTableStatusHTML(store)}
            ${this.renderReviewPreviewHTML()}
          </div>
          <div id="storeNavBar" class="no-padding">
            <button class="nav-btn" data-tab="menu">
              <span class="nav-ico">🍽️</span>
              <span class="nav-label">메뉴</span>
            </button>
            <button class="nav-btn" data-tab="review">
              <span class="nav-ico">💬</span>
              <span class="nav-label">리뷰</span>
            </button>
            <button class="nav-btn" data-tab="photo">
              <span class="nav-ico">🖼️</span>
              <span class="nav-label">사진</span>
            </button>
            <button class="nav-btn" data-tab="info">
              <span class="nav-ico">ℹ️</span>
              <span class="nav-label">매장 정보</span>
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
          포장·예약하기
        </button>
      </nav>
      ${this.getStoreStyles()}
    `;
  },

  renderEventHTML(store) {
    // TLR 이벤트 ex) 사장님 자율쿠폰 등등
  },

  renderTableStatusHTML(store) {
    return `
      <div id="TLR" class="tlr-container">
        <div class="tlr-header">
          <div class="tlr-title">🏪 테이블 현황</div>
          <div class="tlr-status-badge ${store.isOpen ? '' : 'closed'}" id="tableStatusBadge">${store.isOpen ? '로딩중...' : '운영중지'}</div>
        </div>
        <div class="tlr-info-grid">
          <div class="tlr-info-item">
            <div class="tlr-info-label">총 테이블</div>
            <div class="tlr-info-value" id="totalTables">-</div>
          </div>
          <div class="tlr-info-item">
            <div class="tlr-info-label">잔여 테이블</div>
            <div class="tlr-info-value" id="availableTables">-</div>
          </div>
          <div class="tlr-info-item">
            <div class="tlr-info-label">총 좌석</div>
            <div class="tlr-info-value" id="totalSeats">-</div>
          </div>
          <div class="tlr-info-item">
            <div class="tlr-info-label">잔여 좌석</div>
            <div class="tlr-info-value" id="availableSeats">-</div>
          </div>
          <div class="tlr-info-item">
            <div class="tlr-info-label">사용률</div>
            <div class="tlr-info-value" id="occupancyRate">-</div>
          </div>
        </div>
        <button class="tlr-layout-btn" onclick="renderTableLayout(${JSON.stringify(store).replace(/"/g, '&quot;')})">
          <span class="btn-icon">🗺️</span>
          테이블 배치 보기
        </button>
      </div>
    `;
  },

  renderReviewPreviewHTML() {
    return `
      <div id="reviewPreview" class="review-preview">
        <div class="review-title-row">
          <span class="review-title">리뷰 미리보기</span>
          <button class="see-more-btn">전체보기</button>
        </div>
        <div id="reviewPreviewContent">
          <div class="review-card">
            <span class="review-user">🐤 익명</span>
            <span class="review-score">★ 5</span>
            <span class="review-date">1일 전</span>
            <div class="review-text">매장이 깔끔하고 음식이 진짜 맛있었어요! 또 방문할게요.</div>
          </div>
          <div class="review-card">
            <span class="review-user">🍙 user123</span>
            <span class="review-score">★ 4</span>
            <span class="review-date">3일 전</span>
            <div class="review-text">포장 주문했는데 음식이 빨리 나왔어요. 추천!</div>
          </div>
        </div>
      </div>
    `;
  },

  getStoreStyles() {
    return `
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: 'Noto Sans KR', sans-serif;
          background: #f8f8f8;
          overflow: hidden;
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
        }

        #backBtn,
        #TLL {
          position: absolute;
          top: 10px;
          width: 30px;
          height: 30px;
          background: white;
          border: none;
          font-size: 20px;
          cursor: pointer;
          z-index: 1000;
        }
        #backBtn { left: 10px; }
        #TLL { right: 10px; }

        #storePanel {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          background: white;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
          z-index: 10;
        }
        #storePanel.collapsed {
          top: 200px;
          bottom: 60px;
          height: calc(100vh - 260px);
          border-radius: 16px 16px 0 0;
        }
        #storePanel.expanded {
          top: 0;
          bottom: 60px;
          height: calc(100vh - 60px);
          border-radius: 0;
          z-index: 99;
        }
        #panelHandle {
          width: 60px;
          height: 8px;
          background: #ccc;
          border-radius: 4px;
          margin: 12px auto;
          cursor: grab;
          touch-action: none;
        }
        #storePanelContainer {
          position: relative;
          height: calc(100% - 24px);
          overflow-y: auto;
          box-sizing: border-box;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 0 16px 80px 16px;
        }
        #storePanelContainer::-webkit-scrollbar { width: 6px; }
        #storePanelContainer::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

        .storeInfo,
        .review-preview {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          padding: 16px 14px 12px 14px;
          margin: 0 0 14px 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .score-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }
        #reviewStar {
          font-size: 20px;
          color: #ffc107;
          margin-right: 2px;
        }
        #reviewScore {
          font-weight: bold;
          font-size: 16px;
          color: #222;
        }
        #favoriteBtn {
          margin-left: 10px;
          border: none;
          background: none;
          font-size: 19px;
          color: #ff5777;
          cursor: pointer;
          transition: transform 0.15s;
        }
        #favoriteBtn:active {
          transform: scale(1.18);
        }
        #storeName {
          font-size: 22px;
          font-weight: 700;
          color: #111;
          margin: 6px 0 2px 0;
          letter-spacing: -0.5px;
        }
        .store-status-row {
          margin: 8px 0 4px 0;
          display: flex;
          align-items: center;
        }
        
        .store-status {
          font-size: 13px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        .store-status.open {
          background: #e8f5e8;
          color: #2e7d32;
          border: 1px solid #4caf50;
        }
        
        .store-status.closed {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #f44336;
        }

        .store-desc {
          font-size: 14px;
          color: #888;
          margin: 0 0 2px 1px;
        }

        .tlr-container {
          background: linear-gradient(135deg, #f8fafd 0%, #e8f4fd 100%);
          border: 1px solid #d4e8fc;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(41, 126, 252, 0.08);
        }

        .tlr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .tlr-title {
          font-size: 16px;
          font-weight: 700;
          color: #297efc;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tlr-status-badge {
          background: #4CAF50;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tlr-status-badge.busy {
          background: #FF9800;
        }

        .tlr-status-badge.full {
          background: #F44336;
        }

        .tlr-status-badge.closed {
          background: #666;
          color: white;
        }

        .tlr-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto auto;
          gap: 8px;
          margin-bottom: 14px;
        }

        .tlr-info-grid .tlr-info-item:nth-child(5) {
          grid-column: 1 / -1;
          max-width: 280px;
          margin: 0 auto;
        }

        .tlr-info-item {
          text-align: center;
          background: white;
          border-radius: 8px;
          padding: 10px 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .tlr-info-grid .tlr-info-item:nth-child(5) {
          padding: 12px 16px;
          background: linear-gradient(135deg, #297efc 0%, #36a1ff 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(41, 126, 252, 0.2);
        }

        .tlr-info-grid .tlr-info-item:nth-child(5) .tlr-info-label {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
        }

        .tlr-info-grid .tlr-info-item:nth-child(5) .tlr-info-value {
          color: white;
          font-size: 20px;
          font-weight: 800;
        }

        .tlr-info-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .tlr-info-value {
          font-size: 18px;
          font-weight: 700;
          color: #297efc;
        }

        .tlr-layout-btn {
          width: 100%;
          background: white;
          border: 2px solid #297efc;
          color: #297efc;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .tlr-layout-btn:hover {
          background: #297efc;
          color: white;
        }

        .btn-icon {
          font-size: 16px;
        }

        .review-preview {
          padding: 13px 14px 11px 14px;
          gap: 7px;
        }
        .review-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .review-title {
          font-size: 15px;
          font-weight: 600;
          color: #333;
        }
        .see-more-btn {
          font-size: 13px;
          color: #5599ee;
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 7px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .see-more-btn:hover {
          background: #f0f4ff;
        }
        .review-card {
          background: #f9f9fb;
          border-radius: 8px;
          padding: 10px 12px 9px 12px;
          margin-bottom: 3px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.01);
        }
        .review-user {
          font-size: 13px;
          color: #488;
          font-weight: 600;
          margin-right: 4px;
        }
        .review-score {
          font-size: 13px;
          color: #ffc107;
          font-weight: 600;
          margin-right: 4px;
        }
        .review-date {
          font-size: 12px;
          color: #aaa;
        }
        .review-text {
          font-size: 14px;
          color: #222;
          margin-top: 2px;
          line-height: 1.5;
        }

        #storeNavBar.no-padding {
          margin: 0;
          width: 100%;
          border-radius: 0;
          border-top: none;
          border-bottom: 1px solid #eee;
          background: #fff;
          display: flex;
          justify-content: space-between;
          padding: 0;
          margin-bottom: 8px;
          gap: 0;
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .nav-btn {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 15px;
          color: #666;
          padding: 14px 0 10px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          position: relative;
          cursor: pointer;
          transition: color 0.18s;
          border-bottom: 2.5px solid transparent;
        }
        .nav-btn:active {
          background: #f4f7ff;
        }
        .nav-btn .nav-ico {
          font-size: 18px;
          margin-bottom: 2px;
        }
        .nav-btn.active {
          color: #297efc;
          font-weight: 700;
          border-bottom: 2.5px solid #297efc;
          background: #f4f7ff;
        }

        #storeContent {
          margin: 0 0 0 0;
          padding: 14px 14px 8px 14px;
          font-size: 15px;
          min-height: 80px;
          color: #222;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.02);
        }

        #storeBottomBar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 64px;
          background: #fff;
          border-top: 1.5px solid #e2e6ee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          padding: 0 16px;
          box-sizing: border-box;
          gap: 0;
        }

        .btm-btn {
          border: none;
          outline: none;
          font-family: inherit;
          transition: background 0.12s, box-shadow 0.13s, color 0.12s;
          cursor: pointer;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          box-shadow: 0 1.5px 6px rgba(0,0,0,0.04);
          font-weight: 600;
        }

        .phone-btn {
          width: 48px;
          min-width: 48px;
          max-width: 48px;
          border-radius: 50%;
          background: #f6fafd;
          color: #2299fc;
          margin-right: 12px;
          font-size: 22px;
          box-shadow: 0 2px 8px rgba(34,153,252,0.06);
        }
        .phone-btn:active {
          background: #e4effd;
          color: #1657a0;
        }
        .btm-btn-ico {
          font-size: 23px;
          pointer-events: none;
          line-height: 1;
        }

        .order-btn {
          flex: 1;
          height: 44px;
          min-width: 0;
          border-radius: 13px;
          background: linear-gradient(90deg, #36a1ff 0%, #297efc 100%);
          color: #fff;
          margin-left: 0;
          font-size: 17px;
          letter-spacing: 0.2px;
          box-shadow: 0 2px 12px rgba(34,153,252,0.09);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .order-btn:active {
          background: linear-gradient(90deg, #297efc 0%, #36a1ff 100%);
          color: #e3f1ff;
        }
      </style>
    `;
  }
};
