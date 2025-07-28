
// 지도 패널 UI 렌더링 관리자
window.MapPanelUI = {
  renderPanelHTML() {
    return `
      <div id="storePanel" class="collapsed">
        <div id="panelHandle"></div>
        <div id="storeListContainer">
          <div class="loading-message" style="text-align: center; padding: 20px; color: #666;">
            <div class="loading-spinner" style="margin: 0 auto 10px auto; width: 30px; height: 30px; border: 3px solid #e0e0e0; border-top: 3px solid #297efc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            매장 정보를 불러오는 중...
          </div>
        </div>
      </div>
    `;
  },

  renderStoreCard(store, ratingData) {
    const rating = parseFloat(ratingData.ratingAverage).toFixed(1);
    const reviewCount = ratingData.reviewCount;

    return `
      <div class="storeCard">
        <div class="storeInfoBox">
          <div class="storeRatingBox">
            <div style="font-size: 12px; font-weight: bold; color: #f39c12;">★${rating}</div>
            <div style="font-size: 10px; color: #666;">(${reviewCount})</div>
          </div>
          <div class="storeTextBox">
            <div class="storeName">${store.name}</div>
            <div class="storeDistance">${store.category}</div>
          </div>
        </div>
        <div class="storeImageBox">
          <img src="TableLink.png" alt="가게 이미지" />
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
          background: #fff;
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          box-shadow: 0 -2px 14px rgba(30, 60, 120, 0.13);
          overflow: hidden;
          transition: height 0.3s cubic-bezier(.68,-0.55,.27,1.55);
          z-index: 1002;
          border: 1.1px solid #f1f2fb;
        }
        #storePanel.collapsed { height: 60px; }
        #storePanel.expanded { height: 630px; }
        #panelHandle {
          width: 44px;
          height: 7px;
          background: #e0e3f3;
          border-radius: 4px;
          margin: 10px auto 6px auto;
          cursor: pointer;
          opacity: 0.8;
        }

        /* 가게 목록 스크롤 영역 */
        #storeListContainer {
          height: calc(100% - 23px); /* 핸들 공간 빼고 */
          overflow-y: auto;
          padding: 8px 4px 20px 4px;
          box-sizing: border-box;
          /* 스크롤바 숨김 */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        #storeListContainer::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        /* 개별 가게 카드 */
        .storeCard {
          border-radius: 16px;
          padding: 14px 12px 11px 12px;
          margin-bottom: 13px;
          background: #fff;
          box-shadow: 0 1.5px 7px rgba(40,80,170,0.08);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.13s;
          border: 1.3px solid #e7eaf5;
          cursor: pointer;
        }
        .storeCard:active {
          box-shadow: 0 3px 13px rgba(40,110,255,0.11);
          border-color: #b7cdfa;
        }

        .storeInfoBox {
          display: flex;
          align-items: flex-start;
          margin-bottom: 7px;
        }
        .storeRatingBox {
          width: 48px;
          height: 48px;
          border-radius: 9px;
          background: #f5f7fb;
          margin-right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          color: #f8b900;
          box-shadow: 0 1px 3px rgba(180,170,110,0.04);
        }
        .storeTextBox {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .storeName {
          font-weight: bold;
          font-size: 16.5px;
          color: #23274c;
          margin-bottom: 3px;
          letter-spacing: -0.1px;
        }
        .storeDistance {
          font-size: 13.5px;
          color: #88a;
          font-weight: 500;
        }
        .storeImageBox {
          border-radius: 10px;
          height: 100px;
          margin-top: 8px;
          background: #f5f5f5;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .storeImageBox img {
          height: 100%;
          width: auto;
          object-fit: cover;
          border: none;
          max-width: 100%;
        }

        /* 카드 스타일 오버라이드 */
        .storeImageBox {
          border: 2px solid black;
          border-radius: 12px;
          height: 120px;
          margin-top: 8px;
          background: #f5f5f5;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .storeImageBox img {
          height: 100%;
          width: auto;
          object-fit: contain;
          border: none;
        }

        .storeCard {
          border: 2px solid black;
          border-radius: 16px;
          padding: 12px;
          margin-bottom: 12px;
          background: white;
          box-sizing: border-box;
        }

        .storeInfoBox {
          display: flex;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .storeRatingBox {
          width: 60px;
          height: 60px;
          border: 2px solid black;
          border-radius: 8px;
          box-sizing: border-box;
          margin-right: 8px;
        }

        .storeTextBox {
          flex-grow: 1;
        }

        .storeName {
          border: 2px solid black;
          padding: 4px 8px;
          margin-bottom: 4px;
          font-weight: bold;
          font-size: 15px;
        }

        .storeDistance {
          border: 2px solid black;
          padding: 4px 8px;
          font-size: 13px;
        }
      </style>
    `;
  }
};
