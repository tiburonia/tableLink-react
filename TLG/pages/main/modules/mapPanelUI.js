// 지도 패널 UI 렌더링 관리자
window.MapPanelUI = {
  renderPanelHTML() {
    return `
      <div id="storePanel" class="collapsed">
        <div id="panelHandle"></div>
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

  renderStoreCard(store, ratingData) {
    const rating = parseFloat(ratingData.ratingAverage).toFixed(1);
    const reviewCount = ratingData.reviewCount;

    return `
      <div class="storeCard" data-status="${store.isOpen ? 'true' : 'false'}" data-category="${store.category}" data-rating="${rating}" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
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
        /* 로딩 스피너 애니메이션 */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

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
          display: flex;
          flex-direction: column;
          gap: 12px;
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
          cursor: grab; /* 드래그 가능한 커서 */
          opacity: 0.8;
        }

        /* 가게 목록 스크롤 영역 */
        #storeListContainer {
          height: calc(100% - 170px); /* 핸들 + 필터 공간 빼고 */
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
  },

  // 필터링 이벤트 설정 (패널 토글 없이 필터링만)
  setupFilterEvents() {
    const allFilterTabs = document.querySelectorAll('.filter-tab');

    allFilterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // 이벤트 전파 중지

        const clickedTab = e.target;
        const filterType = clickedTab.getAttribute('data-type');

        // 같은 타입의 다른 탭 비활성화
        document.querySelectorAll(`.filter-tab[data-type="${filterType}"]`).forEach(t => t.classList.remove('active'));

        // 클릭된 탭 활성화
        clickedTab.classList.add('active');

        // 필터링 실행 (패널 상태는 변경하지 않음)
        this.applyFilters();

        console.log('🔍 필터 변경됨:', filterType, '=', clickedTab.getAttribute('data-filter'));
      });
    });
  },

  // 현재 설정된 모든 필터 값에 따라 매장 필터링
  applyFilters() {
    const activeFilters = {};
    document.querySelectorAll('.filter-tab.active').forEach(tab => {
      const type = tab.getAttribute('data-type');
      const filterValue = tab.getAttribute('data-filter');
      if (filterValue !== 'all') {
        activeFilters[type] = filterValue;
      }
    });

    const storeCards = document.querySelectorAll('.storeCard');

    storeCards.forEach(card => {
      // data 속성에서 직접 값 가져오기
      const storeCategory = card.dataset.category;
      const storeStatus = card.dataset.status; // "true" 또는 "false" 문자열
      const storeRating = parseFloat(card.dataset.rating);

      let categoryMatch = true;
      let statusMatch = true;
      let ratingMatch = true;

      // 카테고리 필터
      if (activeFilters.category) {
        categoryMatch = storeCategory === activeFilters.category;
      }

      // 운영 상태 필터 - 정확한 문자열 비교
      if (activeFilters.status) {
        if (activeFilters.status === 'open') {
          statusMatch = storeStatus === 'true';
        } else if (activeFilters.status === 'closed') {
          statusMatch = storeStatus === 'false';
        }
      }

      // 별점 필터
      if (activeFilters.rating) {
        const requiredRating = parseFloat(activeFilters.rating.replace('+', ''));
        ratingMatch = !isNaN(storeRating) && storeRating >= requiredRating;
      }

      // 모든 조건 만족시 표시
      if (categoryMatch && statusMatch && ratingMatch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    // 필터링 결과 디버깅
    const visibleCards = document.querySelectorAll('.storeCard[style*="flex"], .storeCard:not([style*="none"])');
    console.log('🔍 필터링 적용:', activeFilters);
    console.log('📊 필터링 결과 - 총', visibleCards.length, '개 매장 표시');
    
    // 각 필터별 매칭 상태 디버깅
    if (Object.keys(activeFilters).length > 0) {
      console.log('🔍 필터별 상세 정보:');
      storeCards.forEach(card => {
        const cardCategory = card.dataset.category;
        const cardStatus = card.dataset.status;
        const cardRating = card.dataset.rating;
        const storeName = card.querySelector('.storeName')?.textContent || 'Unknown';
        
        console.log(`  - ${storeName}: 카테고리=${cardCategory}, 상태=${cardStatus}, 별점=${cardRating}`);
      });
    }
  },

  // 스토어 카드 렌더링 후 필터 이벤트 설정 및 초기화
  initializeFiltering() {
    setTimeout(() => {
      this.setupFilterEvents();
      // 초기 필터링 (모든 매장 표시)
      this.applyFilters();
    }, 100);
  },

  // 패널 드래그 기능 설정 (드래그로만 제어, 클릭 토글 완전 제거)
  setupPanelDrag() {
    const storePanel = document.getElementById('storePanel');
    const panelHandle = document.getElementById('panelHandle');
    let isDragging = false;
    let startY;
    let startHeight;
    let currentHeight = storePanel.classList.contains('collapsed') ? 60 : 630; // 초기 높이

    // 패널 상태 초기화 (DOM 로드 시)
    storePanel.style.height = `${currentHeight}px`;
    if (currentHeight === 60) storePanel.classList.add('collapsed');
    else storePanel.classList.add('expanded');

    // 핸들에서만 드래그 시작 (패널 클릭 토글 완전 제거)
    panelHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startY = e.clientY;
      startHeight = currentHeight;
      storePanel.style.transition = 'none'; // 드래그 중에는 transition 비활성화
      panelHandle.style.cursor = 'grabbing'; // 드래그 중 커서 변경
      document.body.style.userSelect = 'none'; // 드래그 중 텍스트 선택 방지
    });

    // 드래그 이벤트는 document에서 처리
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const deltaY = e.clientY - startY;
      let newHeight = startHeight - deltaY;

      // 최대/최소 높이 제한
      const maxHeight = 630;
      const minHeight = 60; // collapsed 상태 높이

      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      storePanel.style.height = `${newHeight}px`;
      currentHeight = newHeight;

      // 패널 상태 클래스 업데이트
      if (newHeight <= minHeight + 10) {
        storePanel.classList.add('collapsed');
        storePanel.classList.remove('expanded');
      } else if (newHeight >= maxHeight - 10) {
        storePanel.classList.add('expanded');
        storePanel.classList.remove('collapsed');
      } else {
        storePanel.classList.remove('collapsed', 'expanded');
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      storePanel.style.transition = 'height 0.3s cubic-bezier(.68,-0.55,.27,1.55)'; // transition 복구
      panelHandle.style.cursor = 'grab'; // 커서 복구
      document.body.style.userSelect = ''; // 텍스트 선택 방지 해제

      // 드래그 종료 후 높이에 따라 클래스 결정 및 고정
      const midPoint = 300; // 패널을 열거나 닫을 임계값

      if (currentHeight < midPoint) {
        storePanel.style.height = '60px';
        storePanel.classList.add('collapsed');
        storePanel.classList.remove('expanded');
        currentHeight = 60;
      } else {
        storePanel.style.height = '630px';
        storePanel.classList.add('expanded');
        storePanel.classList.remove('collapsed');
        currentHeight = 630;
      }
    });

    // 패널 전체에서 클릭 이벤트 완전 차단 (renderStore처럼)
    storePanel.addEventListener('click', (e) => {
      e.stopPropagation();
      // 클릭으로 인한 패널 토글 완전 방지
    });

    // 패널 전체에서 더블클릭도 차단
    storePanel.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    // 필터 컨테이너에서도 이벤트 전파 차단
    const filterContainer = document.getElementById('filterContainer');
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // 스토어 리스트 컨테이너에서도 이벤트 전파 차단
    const storeListContainer = document.getElementById('storeListContainer');
    if (storeListContainer) {
      storeListContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    console.log('✅ 지도 패널: 드래그 전용 모드로 설정 완료 (클릭 토글 비활성화)');
  },

  // 초기화 함수
  init() {
    // DOM이 준비되면 실행
    document.addEventListener('DOMContentLoaded', () => {
      // TODO: 실제 스토어 데이터와 평점 데이터 가져오는 로직 추가

      // 예시 데이터 (실제로는 API 호출 등으로 받아와야 함)
      const sampleStores = [
        { id: 1, name: "맛있는 식당", category: "한식", isOpen: true, rating: 4.5, reviews: 150 },
        { id: 2, name: "중화요리 명가", category: "중식", isOpen: false, rating: 4.2, reviews: 80 },
        { id: 3, name: "스시 🍣", category: "일식", isOpen: true, rating: 4.8, reviews: 200 },
        { id: 4, name: "이탈리아노", category: "양식", isOpen: true, rating: 3.9, reviews: 120 },
        { id: 5, name: "커피 한잔", category: "카페", isOpen: true, rating: 4.0, reviews: 50 },
        { id: 6, name: "치킨 마니아", category: "치킨", isOpen: false, rating: 3.5, reviews: 90 },
        { id: 7, name: "매콤한 떡볶이", category: "한식", isOpen: true, rating: 4.1, reviews: 110 },
        { id: 8, name: "프랑스 요리", category: "양식", isOpen: false, rating: 4.6, reviews: 75 },
        { id: 9, name: "라멘 세상", category: "일식", isOpen: true, rating: 4.3, reviews: 130 },
        { id: 10, name: "디저트 카페", category: "카페", isOpen: true, rating: 3.8, reviews: 60 },
      ];

      const sampleRatingData = sampleStores.map(store => ({
        storeId: store.id,
        ratingAverage: store.rating,
        reviewCount: store.reviews
      }));

      // 패널 HTML 렌더링
      document.body.insertAdjacentHTML('beforeend', this.renderPanelHTML());
      document.body.insertAdjacentHTML('beforeend', this.getPanelStyles());

      const storeListContainer = document.getElementById('storeListContainer');
      storeListContainer.innerHTML = ''; // 로딩 메시지 제거

      sampleStores.forEach((store, index) => {
        const ratingInfo = sampleRatingData.find(r => r.storeId === store.id);
        if (ratingInfo) {
          // store 객체에 isOpen, category, rating, reviews 정보를 직접 추가하거나,
          // renderStoreCard 함수 내에서 접근할 수 있도록 데이터를 구성해야 합니다.
          // 여기서는 renderStoreCard 함수가 store 객체와 ratingData를 받으므로 그대로 사용합니다.
          // ratingData에는 isOpen, category 등도 포함하도록 수정해야 할 수 있습니다.
          // 예시를 위해 store 객체 자체에 ratingInfo의 값을 통합합니다.
          const combinedStoreData = {
            ...store,
            isOpen: store.isOpen,
            category: store.category,
            rating: store.rating,
            reviews: store.reviews
          };
          storeListContainer.insertAdjacentHTML('beforeend', this.renderStoreCard(combinedStoreData, ratingInfo));
        }
      });

      // 필터링 및 드래그 이벤트 설정
      this.initializeFiltering();
      this.setupPanelDrag();
    });
  }
};

// 실제 사용 시 MapPanelUI.init(); 호출 필요
// window.MapPanelUI.init();