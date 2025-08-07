
// 지도 패널 UI 렌더링 관리자
window.MapPanelUI = {
  renderPanelHTML() {
    return `
      <div id="storePanel" class="collapsed">
        <div id="panelHandle">
          <div class="handle-indicator"></div>
        </div>
        <div id="storeListContainer">
          <div class="panel-header">
            <h3 class="panel-title">
              <span class="title-icon">🏪</span>
              주변 매장
            </h3>
            <div class="panel-subtitle">터치하여 매장 정보를 확인하세요</div>
          </div>
          <div class="loading-message">
            <div class="loading-spinner-container">
              <div class="loading-spinner"></div>
              <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div class="loading-text">매장 정보를 불러오는 중...</div>
          </div>
        </div>
      </div>
    `;
  },

  renderStoreCard(store, ratingData) {
    const rating = parseFloat(ratingData.ratingAverage).toFixed(1);
    const reviewCount = ratingData.reviewCount;

    return `
      <div class="storeCard" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
        <div class="storeImageBox">
          <img src="TableLink.png" alt="가게 이미지" />
          <div class="storeStatus ${store.isOpen ? 'open' : 'closed'}">
            ${store.isOpen ? '🟢 운영중' : '🔴 운영중지'}
          </div>
        </div>
        <div class="storeInfoBox">
          <div class="storeHeader">
            <div class="storeName">${store.name}</div>
            <div class="storeRating">
              <span class="ratingStars">★</span>
              <span class="ratingValue">${rating}</span>
              <span class="reviewCount">(${reviewCount})</span>
            </div>
          </div>
          <div class="storeCategory">${store.category}</div>
          <div class="storeActions">
            <div class="actionButton primary">
              <span class="actionIcon">🍽️</span>
              <span class="actionText">메뉴보기</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getPanelStyles() {
    return `
      <style>
        /* 패널 */
        #storePanel {
          position: fixed;
          bottom: 66px;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          background: rgba(255, 255, 255, 0.98);
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          box-shadow: 0 -4px 25px rgba(20, 40, 90, 0.15), 0 -2px 10px rgba(70, 110, 180, 0.08);
          overflow: hidden;
          transition: height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          z-index: 1002;
          border: 1.5px solid rgba(230, 235, 250, 0.6);
          backdrop-filter: blur(10px);
        }
        #storePanel.collapsed { height: 65px; }
        #storePanel.expanded { height: 630px; }
        
        #panelHandle {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          cursor: pointer;
          padding: 12px 0 8px 0;
          transition: all 0.2s ease;
        }
        
        #panelHandle:hover {
          background: rgba(41, 126, 252, 0.05);
        }
        
        .handle-indicator {
          width: 48px;
          height: 5px;
          background: linear-gradient(90deg, #e2e6ee 0%, #c8d1e8 100%);
          border-radius: 3px;
          transition: all 0.3s ease;
        }
        
        #panelHandle:hover .handle-indicator {
          background: linear-gradient(90deg, #297efc 0%, #4a90fc 100%);
          width: 56px;
        }

        /* 패널 헤더 */
        .panel-header {
          padding: 16px 20px 8px 20px;
          border-bottom: 1px solid rgba(230, 235, 250, 0.8);
          background: rgba(248, 250, 254, 0.6);
          backdrop-filter: blur(5px);
        }
        
        .panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: -0.3px;
        }
        
        .title-icon {
          font-size: 20px;
        }
        
        .panel-subtitle {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }

        /* 가게 목록 스크롤 영역 */
        #storeListContainer {
          height: calc(100% - 44px); /* 핸들 공간 빼고 */
          overflow-y: auto;
          box-sizing: border-box;
          /* 스크롤바 숨김 */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        #storeListContainer::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        /* 로딩 스타일 */
        .loading-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          gap: 16px;
        }
        
        .loading-spinner-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(41, 126, 252, 0.1);
          border-top: 3px solid #297efc;
          border-radius: 50%;
          animation: spin 1.2s linear infinite;
        }
        
        .loading-dots {
          position: absolute;
          display: flex;
          gap: 4px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .loading-dots span {
          width: 4px;
          height: 4px;
          background: #297efc;
          border-radius: 50%;
          animation: loading-dots 1.4s ease-in-out infinite both;
        }
        
        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
        .loading-dots span:nth-child(3) { animation-delay: 0s; }
        
        .loading-text {
          font-size: 15px;
          color: #666;
          font-weight: 500;
          letter-spacing: -0.2px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes loading-dots {
          0%, 80%, 100% { 
            transform: scale(0);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }

        /* 개별 가게 카드 */
        .storeCard {
          border-radius: 18px;
          padding: 0;
          margin: 0 16px 16px 16px;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 3px 16px rgba(20, 40, 90, 0.08), 0 1px 6px rgba(70, 110, 180, 0.04);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
          border: 1px solid rgba(230, 235, 250, 0.5);
          cursor: pointer;
          overflow: hidden;
          backdrop-filter: blur(5px);
        }
        
        .storeCard:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 35px rgba(20, 40, 90, 0.15), 0 4px 15px rgba(70, 110, 180, 0.08);
          border-color: rgba(41, 126, 252, 0.3);
        }
        
        .storeCard:active {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 8px 25px rgba(20, 40, 90, 0.12), 0 2px 10px rgba(70, 110, 180, 0.06);
        }

        .storeImageBox {
          position: relative;
          height: 140px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .storeImageBox::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
          z-index: 1;
        }
        
        .storeImageBox img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: relative;
          z-index: 0;
        }
        
        .storeStatus {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(10px);
          z-index: 2;
        }
        
        .storeStatus.open {
          background: rgba(76, 175, 80, 0.9);
          color: white;
        }
        
        .storeStatus.closed {
          background: rgba(244, 67, 54, 0.9);
          color: white;
        }

        .storeInfoBox {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .storeHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        
        .storeName {
          font-weight: 700;
          font-size: 18px;
          color: #1a1a1a;
          letter-spacing: -0.3px;
          line-height: 1.3;
          flex: 1;
        }
        
        .storeRating {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        
        .ratingStars {
          font-size: 16px;
          color: #FFB000;
        }
        
        .ratingValue {
          font-weight: 700;
          font-size: 16px;
          color: #1a1a1a;
        }
        
        .reviewCount {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
        
        .storeCategory {
          font-size: 14px;
          color: #666;
          font-weight: 500;
          padding: 6px 12px;
          background: #f8f9fa;
          border-radius: 8px;
          display: inline-block;
          width: fit-content;
        }
        
        .storeActions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        
        .actionButton {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
          background: none;
        }
        
        .actionButton.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .actionButton.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .actionIcon {
          font-size: 16px;
        }
        
        .actionText {
          font-size: 13px;
        }
      </style>
    `;
  }
};
