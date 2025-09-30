
/**
 * 지도 패널 UI 렌더링 뷰
 * DOM 조작과 화면 렌더링만 담당
 */
export const mapPanelView = {
  /**
   * 패널 UI 렌더링
   */
  renderPanelUI() {
    if (document.getElementById('storePanel')) return;

    document.body.insertAdjacentHTML('beforeend', this.getPanelHTML());
    document.body.insertAdjacentHTML('beforeend', this.getPanelStyles());

    console.log('✅ 지도 패널 UI 렌더링 완료');
  },

  /**
   * 패널 HTML 구조
   */
  getPanelHTML() {
    return `
      <div id="storePanel" class="collapsed">
        <div id="panelHandle"></div>
        <button id="filterToggleBtn" class="filter-toggle-btn expanded">
          <span class="toggle-icon">▼</span>
        </button>
        <div id="filterContainer">
          <div class="filter-row">
            <div class="filter-label">카테고리</div>
            <div class="filter-tabs category-filter">
              <button class="filter-tab active" data-filter="all" data-type="category">전체</button>
              <button class="filter-tab" data-filter="한식" data-type="category">한식</button>
              <button class="filter-tab" data-filter="중식" data-type="category">중식</button>
              <button class="filter-tab" data-filter="일식" data-type="category">일식</button>
              <button class="filter-tab" data-filter="양식" data-type="category">양식</button>
              <button class="filter-tab" data-filter="카페" data-type="category">카페</button>
              <button class="filter-tab" data-filter="치킨" data-type="category">치킨</button>
            </div>
          </div>
          <div class="filter-row">
            <div class="filter-label">운영 상태</div>
            <div class="filter-tabs status-filter">
              <button class="filter-tab active" data-filter="all" data-type="status">전체</button>
              <button class="filter-tab" data-filter="open" data-type="status">운영중</button>
              <button class="filter-tab" data-filter="closed" data-type="status">운영중지</button>
            </div>
          </div>
          <div class="filter-row">
            <div class="filter-label">별점</div>
            <div class="filter-tabs rating-filter">
              <button class="filter-tab active" data-filter="all" data-type="rating">전체</button>
              <button class="filter-tab" data-filter="4+" data-type="rating">4점 이상</button>
              <button class="filter-tab" data-filter="3+" data-type="rating">3점 이상</button>
              <button class="filter-tab" data-filter="2+" data-type="rating">2점 이상</button>
            </div>
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

  /**
   * 매장 목록 렌더링
   */
  renderStoreList(stores) {
    const storeListContainer = document.getElementById('storeListContainer');
    if (!storeListContainer) return;

    storeListContainer.innerHTML = '';

    if (!stores || stores.length === 0) {
      this.showEmptyState();
      return;
    }

    const storeCards = stores
      .map(store => this.createStoreCard(store))
      .filter(card => card);

    storeListContainer.innerHTML = storeCards.join('');
    console.log(`✅ 매장 목록 렌더링 완료: ${storeCards.length}개`);
  },

  /**
   * 개별 매장 카드 생성
   */
  createStoreCard(store) {
    if (!store) return '';

    const storeId = store.id || store.store_id;
    const storeName = store.name || '매장명 없음';
    const storeCategory = store.category || '카테고리 없음';
    const rating = store.ratingAverage ? parseFloat(store.ratingAverage).toFixed(1) : '0.0';
    const reviewCount = store.reviewCount || 0;
    const isOpen = store.isOpen !== false;

    // renderStore 함수 호출을 위한 데이터 준비
    let storeDataForRender;
    try {
      const normalizedStore = { ...store, id: storeId, store_id: storeId };
      storeDataForRender = JSON.stringify(normalizedStore).replace(/"/g, '&quot;');
    } catch (error) {
      console.error('❌ 매장 카드 JSON 변환 실패:', error);
      const minimalStore = {
        id: storeId,
        store_id: storeId,
        name: storeName,
        category: storeCategory,
        isOpen: isOpen
      };
      storeDataForRender = JSON.stringify(minimalStore).replace(/"/g, '&quot;');
    }

    return `
      <div class="storeCard" 
           data-status="${isOpen ? 'true' : 'false'}" 
           data-category="${storeCategory}" 
           data-rating="${rating}" 
           onclick="renderStore(${storeDataForRender})">
        <div class="storeImageBox">
          <img src="TableLink.png" alt="가게 이미지" />
          <div class="storeStatus ${isOpen ? 'open' : 'closed'}">
            ${isOpen ? '🟢 운영중' : '🔴 운영중지'}
          </div>
        </div>
        <div class="storeInfoBox">
          <div class="storeHeader">
            <div class="storeName">${storeName}</div>
            <div class="storeRating">
              <span class="ratingStars">★</span>
              <span class="ratingValue">${rating}</span>
              <span class="reviewCount">(${reviewCount})</span>
            </div>
          </div>
          <div class="storeCategory">${storeCategory}</div>
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

  /**
   * 매장 표시 상태 업데이트 (필터링용)
   */
  updateStoreVisibility(visibleStores) {
    const allCards = document.querySelectorAll('.storeCard');
    const visibleStoreIds = new Set(visibleStores.map(store => store.id || store.store_id));

    allCards.forEach(card => {
      const storeData = this.getStoreDataFromCard(card);
      if (storeData && visibleStoreIds.has(storeData.id)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    console.log(`🔍 매장 표시 상태 업데이트: ${visibleStores.length}개 표시`);
  },

  /**
   * 카드에서 매장 데이터 추출
   */
  getStoreDataFromCard(card) {
    try {
      const onclickAttr = card.getAttribute('onclick');
      if (!onclickAttr) return null;

      const jsonMatch = onclickAttr.match(/renderStore\(([^)]+)\)/);
      if (!jsonMatch) return null;

      const jsonStr = jsonMatch[1].replace(/&quot;/g, '"');
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn('⚠️ 카드에서 매장 데이터 추출 실패:', error);
      return null;
    }
  },

  /**
   * 로딩 상태 표시
   */
  showLoading() {
    const storeListContainer = document.getElementById('storeListContainer');
    if (!storeListContainer) return;

    storeListContainer.innerHTML = `
      <div class="loading-message" style="text-align: center; padding: 20px; color: #666;">
        <div class="loading-spinner" style="margin: 0 auto 10px auto; width: 30px; height: 30px; border: 3px solid #e0e0e0; border-top: 3px solid #297efc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        뷰포트 매장을 불러오는 중...
      </div>
    `;
  },

  /**
   * 빈 상태 표시
   */
  showEmptyState(level = null) {
    const storeListContainer = document.getElementById('storeListContainer');
    if (!storeListContainer) return;

    storeListContainer.innerHTML = `
      <div class="empty-viewport-message" style="text-align: center; padding: 40px 20px; color: #666;">
        <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">현재 영역에 매장이 없습니다</div>
        <div style="font-size: 14px;">지도를 이동하거나 확대해보세요</div>
        ${level ? `<div style="font-size: 12px; color: #999; margin-top: 8px;">레벨: ${level}</div>` : ''}
      </div>
    `;
  },

  /**
   * 에러 상태 표시
   */
  showError(message) {
    const storeListContainer = document.getElementById('storeListContainer');
    if (!storeListContainer) return;

    storeListContainer.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 40px 20px; color: #dc2626;">
        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">패널 로딩 실패</div>
        <div style="font-size: 14px;">네트워크를 확인하고 다시 시도해주세요</div>
        <div style="font-size: 12px; color: #999; margin-top: 8px;">오류: ${message}</div>
      </div>
    `;
  },

  /**
   * CSS 스타일
   */
  getPanelStyles() {
    return `
      <style>
        /* 로딩 스피너 애니메이션 */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* 패널 */
        #storePanel {
          position: fixed;
          bottom: 46px;
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
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.3s ease;
        }

        #filterContainer.collapsed {
          max-height: 0;
          padding: 0 12px;
          overflow: hidden;
          border-bottom: none;
        }

        .filter-toggle-btn {
          position: absolute;
          top: 8px;
          right: 12px;
          background: rgba(102, 126, 234, 0.1);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .filter-toggle-btn:hover {
          background: rgba(102, 126, 234, 0.2);
          transform: scale(1.1);
        }

        .filter-toggle-btn .toggle-icon {
          font-size: 14px;
          transition: transform 0.3s ease;
        }

        .filter-toggle-btn.expanded .toggle-icon {
          transform: rotate(180deg);
        }

        .filter-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
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
          cursor: grab;
          opacity: 0.8;
          touch-action: none;
          user-select: none;
        }

        /* 가게 목록 스크롤 영역 */
        #storeListContainer {
          height: calc(100% - 170px);
          overflow-y: auto;
          padding: 8px 4px 20px 4px;
          box-sizing: border-box;
          transition: height 0.3s ease;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        #storeListContainer.filter-collapsed {
          height: calc(100% - 60px);
        }
        #storeListContainer::-webkit-scrollbar {
          display: none;
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
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapPanelView = mapPanelView;
}
