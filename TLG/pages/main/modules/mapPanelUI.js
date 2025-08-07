
// 지도 패널 UI 렌더링 관리자
window.MapPanelUI = {
  renderPanelHTML() {
    return `
      <div id="storePanel" class="collapsed">
        <div id="panelHandle"></div>
        <div id="filterContainer">
          <div class="filter-tabs">
            <button class="filter-tab active" data-filter="all">전체</button>
            <button class="filter-tab" data-filter="한식">한식</button>
            <button class="filter-tab" data-filter="중식">중식</button>
            <button class="filter-tab" data-filter="일식">일식</button>
            <button class="filter-tab" data-filter="양식">양식</button>
            <button class="filter-tab" data-filter="카페">카페</button>
            <button class="filter-tab" data-filter="치킨">치킨</button>
          </div>
        </div>
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

        /* 필터 컨테이너 */
        #filterContainer {
          padding: 8px 12px 0 12px;
          background: #fff;
          border-bottom: 1px solid #f1f2fb;
        }
        
        .filter-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .filter-tabs::-webkit-scrollbar {
          display: none;
        }
        
        .filter-tab {
          flex-shrink: 0;
          padding: 8px 16px;
          border: none;
          background: #f8f9fa;
          color: #666;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .filter-tab:hover {
          background: #e9ecef;
          color: #495057;
        }
        
        .filter-tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
        }
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
          height: calc(100% - 70px); /* 핸들 + 필터 공간 빼고 */
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
          border-radius: 20px;
          padding: 0;
          margin-bottom: 16px;
          background: #fff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          border: none;
          cursor: pointer;
          overflow: hidden;
        }
        
        .storeCard:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        
        .storeCard:active {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
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
},

  // 필터링 이벤트 설정
  setupFilterEvents() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        // 기존 활성 탭 제거
        filterTabs.forEach(t => t.classList.remove('active'));
        
        // 새 활성 탭 설정
        e.target.classList.add('active');
        
        // 필터링 실행
        const filter = e.target.getAttribute('data-filter');
        this.filterStores(filter);
      });
    });
  },

  // 매장 필터링
  filterStores(category) {
    const storeCards = document.querySelectorAll('.storeCard');
    
    storeCards.forEach(card => {
      const storeCategory = card.querySelector('.storeCategory')?.textContent;
      
      if (category === 'all' || storeCategory === category) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
    
    console.log(`🔍 매장 필터링: ${category === 'all' ? '전체' : category} 카테고리`);
  },

  // 스토어 카드 렌더링 후 필터 이벤트 설정
  initializeFiltering() {
    setTimeout(() => {
      this.setupFilterEvents();
    }, 100);
  }
};
