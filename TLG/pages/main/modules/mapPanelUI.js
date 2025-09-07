// 지도 패널 UI 렌더링 관리자
window.MapPanelUI = {
  renderPanelHTML() {
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

        .storeStatus.cluster {
          background: rgba(41, 128, 185, 0.9);
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

        .clusterInfo {
          font-size: 13px;
          color: #fff;
          font-weight: 600;
          background: rgba(0,0,0,0.2);
          padding: 4px 8px;
          border-radius: 5px;
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

        .storeAddress {
          padding: 0 20px 20px 20px;
          font-size: 12px;
          color: #666;
          margin-top: -8px;
        }

        /* 클러스터 카드 스타일 */
        .cluster-card {
          background: #f0f4ff;
        }

        .cluster-card .storeHeader {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 12px 20px;
          border-radius: 12px 12px 0 0;
          margin: -1px -1px 0 -1px;
          color: white;
        }

        .cluster-card .storeName {
          color: white;
          font-weight: 700;
        }

        .cluster-card .storeCategory {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          font-weight: 600;
        }

        .cluster-card .actionButton.primary {
          background: white;
          color: #667eea;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .cluster-card .actionButton.primary:hover {
          transform: none;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .cluster-card .storeAddress {
          margin-top: 0;
          padding: 10px 20px 20px 20px;
          border-top: 1px dashed #c0caff;
        }

      </style>
    `;
  },

  // 필터링 이벤트 설정
  setupFilterEvents() {
    const allFilterTabs = document.querySelectorAll('.filter-tab');

    allFilterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const clickedTab = e.target;
        const filterType = clickedTab.getAttribute('data-type');

        // 같은 타입의 다른 탭 비활성화
        document.querySelectorAll(`.filter-tab[data-type="${filterType}"]`).forEach(t => t.classList.remove('active'));

        // 클릭된 탭 활성화
        clickedTab.classList.add('active');

        // 필터링 실행
        this.applyFilters();

        console.log('🔍 필터 변경됨:', filterType, '=', clickedTab.getAttribute('data-filter'));
      });
    });

    // 필터 토글 버튼 이벤트 설정
    this.setupFilterToggle();
  },

  // 필터 영역 토글 기능 설정
  setupFilterToggle() {
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterContainer = document.getElementById('filterContainer');
    const storeListContainer = document.getElementById('storeListContainer');

    if (!filterToggleBtn || !filterContainer || !storeListContainer) {
      console.warn('⚠️ 필터 토글 요소를 찾을 수 없습니다');
      return;
    }

    filterToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isExpanded = filterToggleBtn.classList.contains('expanded');

      if (isExpanded) {
        // 접기
        filterContainer.classList.add('collapsed');
        filterToggleBtn.classList.remove('expanded');
        storeListContainer.classList.add('filter-collapsed');
        console.log('📁 필터 영역 접힘');
      } else {
        // 펼치기
        filterContainer.classList.remove('collapsed');
        filterToggleBtn.classList.add('expanded');
        storeListContainer.classList.remove('filter-collapsed');
        console.log('📂 필터 영역 펼침');
      }
    });

    console.log('✅ 필터 토글 기능 설정 완료');
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
      const storeCategory = card.dataset.category;
      const storeStatus = card.dataset.status;
      const storeRating = parseFloat(card.dataset.rating);

      let categoryMatch = true;
      let statusMatch = true;
      let ratingMatch = true;

      // 카테고리 필터
      if (activeFilters.category) {
        categoryMatch = storeCategory === activeFilters.category;
      }

      // 운영 상태 필터
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

    // 필터링 결과 로깅
    const visibleCards = document.querySelectorAll('.storeCard[style*="flex"], .storeCard:not([style*="none"])');
    console.log('🔍 필터링 적용:', activeFilters);
    console.log('📊 필터링 결과 - 총', visibleCards.length, '개 매장 표시');
  },

  // 패널 드래그 기능 설정
  setupPanelDrag() {
    const storePanel = document.getElementById('storePanel');
    const panelHandle = document.getElementById('panelHandle');
    let isDragging = false;
    let startY;
    let startHeight;
    let currentHeight = storePanel.classList.contains('collapsed') ? 60 : 630;

    // 패널 상태 초기화
    storePanel.style.height = `${currentHeight}px`;
    if (currentHeight === 60) storePanel.classList.add('collapsed');
    else storePanel.classList.add('expanded');

    // 마우스 이벤트
    panelHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startY = e.clientY;
      startHeight = currentHeight;
      storePanel.style.transition = 'none';
      panelHandle.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const deltaY = e.clientY - startY;
      let newHeight = startHeight - deltaY;

      const maxHeight = 630;
      const minHeight = 60;

      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      storePanel.style.height = `${newHeight}px`;
      currentHeight = newHeight;

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
      storePanel.style.transition = 'height 0.3s cubic-bezier(.68,-0.55,.27,1.55)';
      panelHandle.style.cursor = 'grab';
      document.body.style.userSelect = '';

      const midPoint = 300;

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

    // 터치 이벤트
    panelHandle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startY = e.touches[0].clientY;
      startHeight = currentHeight;
      storePanel.style.transition = 'none';
      document.body.style.userSelect = 'none';
      console.log('📱 모바일 패널 드래그 시작:', startY);
    });

    panelHandle.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      let newHeight = startHeight - deltaY;

      const maxHeight = 630;
      const minHeight = 60;

      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      storePanel.style.height = `${newHeight}px`;
      currentHeight = newHeight;

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

    panelHandle.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      isDragging = false;
      storePanel.style.transition = 'height 0.3s cubic-bezier(.68,-0.55,.27,1.55)';
      document.body.style.userSelect = '';

      const midPoint = 300;

      if (currentHeight < midPoint) {
        storePanel.style.height = '60px';
        storePanel.classList.add('collapsed');
        storePanel.classList.remove('expanded');
        currentHeight = 60;
        console.log('📱 모바일 패널 접힘');
      } else {
        storePanel.style.height = '630px';
        storePanel.classList.add('expanded');
        storePanel.classList.remove('collapsed');
        currentHeight = 630;
        console.log('📱 모바일 패널 펼침');
      }
    });

    panelHandle.addEventListener('touchcancel', (e) => {
      if (!isDragging) return;
      isDragging = false;
      storePanel.style.transition = 'height 0.3s cubic-bezier(.68,-0.55,.27,1.55)';
      document.body.style.userSelect = '';
      console.log('📱 모바일 패널 드래그 취소');
    });

    // 이벤트 전파 차단
    storePanel.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    storePanel.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    const filterContainer = document.getElementById('filterContainer');
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    const storeListContainer = document.getElementById('storeListContainer');
    if (storeListContainer) {
      storeListContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    const filterToggleBtn = document.getElementById('filterToggleBtn');
    if (filterToggleBtn) {
      filterToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    console.log('✅ 지도 패널: 드래그 전용 모드로 설정 완료');
  },

  // 통합 클러스터 API 호출 (서버 구조에 맞게 수정)
  async loadViewportStores(map) {
    if (!map) {
      console.warn('⚠️ 지도 인스턴스가 없습니다');
      return [];
    }

    try {
      const bounds = map.getBounds();
      const level = map.getLevel();

      // bbox 형식으로 파라미터 구성 (서버가 기대하는 형식)
      const bbox = `${bounds.getSouthWest().getLng()},${bounds.getSouthWest().getLat()},${bounds.getNorthEast().getLng()},${bounds.getNorthEast().getLat()}`;

      const params = new URLSearchParams({
        level: level,
        bbox: bbox
      });

      console.log(`📱 통합 클러스터 API 호출: level=${level}, bbox=${bbox}`);

      const response = await fetch(`/api/stores/clusters?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 응답 오류:', response.status, errorText);
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '클러스터 데이터 조회 실패');
      }

      // 응답 데이터 정규화 (data 또는 features 둘 다 지원)
      const features = data.data || data.features || [];
      console.log(`✅ 클러스터/매장 ${features.length}개 로딩 완료 (타입: ${data.type}, 레벨: ${data.meta?.level})`);
      
      // 빈 결과 처리 최적화
      if (features.length === 0) {
        console.log(`📍 현재 뷰포트에 매장 데이터 없음 - 레벨: ${level}, bbox: ${bbox}`);
      }

      // 통합 API 응답을 기존 매장 구조로 변환
      const stores = features.map(feature => {
        if (feature.kind === 'individual') {
          // 개별 매장 데이터 변환
          return {
            id: feature.store_id || feature.id,
            name: feature.name || '매장명 없음',
            category: feature.category || '기타',
            address: `${feature.sido || ''} ${feature.sigungu || ''} ${feature.eupmyeondong || ''}`.trim() || '주소 정보 없음',
            ratingAverage: feature.rating_average ? parseFloat(feature.rating_average) : 0.0,
            reviewCount: feature.review_count || 0,
            favoriteCount: 0,
            isOpen: feature.is_open !== false,
            coord: { lat: feature.lat, lng: feature.lon },
            region: {
              sido: feature.sido,
              sigungu: feature.sigungu,
              eupmyeondong: feature.eupmyeondong
            }
          };
        } else if (feature.kind === 'cluster') {
          // 클러스터 데이터 변환 (서버 집계 데이터 활용)
          return {
            id: `cluster-${feature.lat}-${feature.lng}`,
            name: `${feature.store_count}개 매장 집합`,
            category: '매장 집합',
            address: feature.full_address || '지역 정보 없음',
            ratingAverage: parseFloat(feature.avg_rating) || 0.0,
            reviewCount: feature.total_reviews || 0,
            favoriteCount: 0,
            isOpen: true,
            coord: { lat: feature.lat, lng: feature.lng },
            isCluster: true,
            storeCount: feature.store_count || 0,
            openCount: feature.open_count || 0,
            closedCount: feature.closed_count || 0,
            categoryBreakdown: {
              korean: feature.korean_count || 0,
              chinese: feature.chinese_count || 0,
              japanese: feature.japanese_count || 0,
              western: feature.western_count || 0,
              cafe: feature.cafe_count || 0
            },
            dominantIcon: feature.dominant_category_icon || '🍽️'
          };
        }
        return null;
      }).filter(Boolean);

      return stores;
    } catch (error) {
      console.error('❌ 뷰포트 매장 데이터 로딩 실패:', error);
      throw error;
    }
  },

  // 뷰포트 기반 패널 완전 재구성
  async rebuildStorePanel(map) {
    const storeListContainer = document.getElementById('storeListContainer');
    if (!storeListContainer) return;

    const bounds = map.getBounds();
    const level = map.getLevel();
    console.log(`🔄 뷰포트 기반 패널 재구성 - 레벨: ${level}, 범위: (${bounds.getSouthWest().getLat()},${bounds.getSouthWest().getLng()}) ~ (${bounds.getNorthEast().getLat()},${bounds.getNorthEast().getLng()})`);

    // 기존 컨텐츠 제거
    storeListContainer.innerHTML = '';

    // 로딩 상태 표시
    storeListContainer.innerHTML = `
      <div class="loading-message" style="text-align: center; padding: 20px; color: #666;">
        <div class="loading-spinner" style="margin: 0 auto 10px auto; width: 30px; height: 30px; border: 3px solid #e0e0e0; border-top: 3px solid #297efc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        뷰포트 매장을 불러오는 중...
      </div>
    `;

    try {
      // 뷰포트 매장 데이터 새로 로딩
      const stores = await this.loadViewportStores(map);

      // 로딩 메시지 제거
      storeListContainer.innerHTML = '';

      if (stores.length === 0) {
        storeListContainer.innerHTML = `
          <div class="empty-viewport-message" style="text-align: center; padding: 40px 20px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">현재 영역에 매장이 없습니다</div>
            <div style="font-size: 14px;">지도를 이동하거나 확대해보세요</div>
            <div style="font-size: 12px; color: #999; margin-top: 8px;">레벨: ${level}</div>
          </div>
        `;
        return;
      }

      // 매장 카드 렌더링
      const cardFragments = stores
        .filter(store => store)
        .map(store => {
          try {
            return this.createStoreCard(store);
          } catch (error) {
            console.error(`❌ 매장 카드 렌더링 실패 (${store?.name || 'Unknown'}):`, error);
            return '';
          }
        })
        .filter(card => card);

      // 모든 카드를 한번에 DOM에 추가
      storeListContainer.innerHTML = cardFragments.join('');

      console.log(`✅ 뷰포트 기반 패널 완전 재구성 완료: ${cardFragments.length}개 매장 카드`);

      // 필터 상태 초기화 후 재적용
      this.resetFilters();
      this.applyFilters();

    } catch (error) {
      console.error('❌ 뷰포트 기반 패널 재구성 실패:', error);
      storeListContainer.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 40px 20px; color: #dc2626;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">패널 재구성 실패</div>
          <div style="font-size: 14px;">네트워크를 확인하고 다시 시도해주세요</div>
          <div style="font-size: 12px; color: #999; margin-top: 8px;">오류: ${error.message}</div>
        </div>
      `;
    }
  },

  // 지도 이벤트와 연동하여 패널 업데이트
  connectToMap(map) {
    if (!map) {
      console.warn('⚠️ 지도 인스턴스가 없어 패널 연동을 건너뜁니다');
      return;
    }

    console.log('🔗 지도와 패널 연동 시작 (뷰포트 기반 재구성)');

    // 디바운스용 타이머
    let updateTimer = null;

    // 뷰포트 기반 패널 완전 재구성 함수
    const rebuildPanelForViewport = () => {
      console.log('🔄 뷰포트 변경 - 패널 완전 재구성 시작');

      // 기존 타이머 정리
      if (updateTimer) {
        clearTimeout(updateTimer);
      }

      // 300ms 디바운스로 성능 최적화
      updateTimer = setTimeout(async () => {
        try {
          // 패널 완전 재구성
          await this.rebuildStorePanel(map);
          console.log('✅ 뷰포트 기반 패널 재구성 완료');
        } catch (error) {
          console.error('❌ 패널 재구성 실패:', error);
        }
      }, 300);
    };

    // 초기 패널 구성
    this.rebuildStorePanel(map);

    // 지도 이벤트 리스너 등록
    kakao.maps.event.addListener(map, 'dragend', rebuildPanelForViewport);
    kakao.maps.event.addListener(map, 'zoom_changed', rebuildPanelForViewport);
    kakao.maps.event.addListener(map, 'idle', () => {
      console.log('🗺️ 지도 idle - 최종 패널 재구성');
      rebuildPanelForViewport();
    });
  },

  // 매장 카드 생성 (클러스터 지원)
  createStoreCard(store) {
    const storeName = store?.name || '매장명 없음';
    const storeCategory = store?.category || '카테고리 없음';
    const rating = store?.ratingAverage ? parseFloat(store.ratingAverage).toFixed(1) : '0.0';
    const reviewCount = store?.reviewCount || 0;
    const storeAddress = store?.address || '주소 정보 없음';
    const isOpen = store?.isOpen !== false;

    // 클러스터 매장인지 확인
    const isCluster = store?.isCluster === true;

    // JSON 안전 처리
    const safeStoreData = JSON.stringify(store || {}).replace(/"/g, '&quot;');

    if (isCluster) {
      // 클러스터 카드 렌더링
      return `
        <div class="storeCard cluster-card" data-status="true" data-category="매장 집합" data-rating="0" onclick="MapPanelUI.handleClusterClick(${safeStoreData})">
          <div class="storeImageBox">
            <img src="TableLink.png" alt="클러스터 이미지" />
            <div class="storeStatus cluster">
              ${store.dominantIcon} ${store.storeCount}개 매장
            </div>
          </div>
          <div class="storeInfoBox">
            <div class="storeHeader">
              <div class="storeName">${storeName}</div>
              <div class="storeRating">
                <span class="clusterInfo">운영중 ${store.openCount}개</span>
              </div>
            </div>
            <div class="storeCategory">${storeCategory}</div>
            <div class="storeActions">
              <div class="actionButton primary">
                <span class="actionIcon">🔍</span>
                <span class="actionText">확대보기</span>
              </div>
            </div>
          </div>
          <div class="storeAddress">${storeAddress}</div>
        </div>
      `;
    }

    // 개별 매장 카드 렌더링
    return `
      <div class="storeCard" data-status="${isOpen ? 'true' : 'false'}" data-category="${storeCategory}" data-rating="${rating}" onclick="renderStore(${safeStoreData})">
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

  // 클러스터 클릭 시 처리 함수
  handleClusterClick(clusterData) {
    console.log('📍 클러스터 클릭됨:', clusterData);

    if (window.currentMap && clusterData.coord) {
      try {
        const position = new kakao.maps.LatLng(clusterData.coord.lat, clusterData.coord.lng);
        window.currentMap.setCenter(position);

        // 현재 레벨보다 2단계 확대
        const currentLevel = window.currentMap.getLevel();
        const newLevel = Math.max(1, currentLevel - 2);
        window.currentMap.setLevel(newLevel);

        console.log(`🔍 클러스터 확대: 레벨 ${currentLevel} → ${newLevel}`);
      } catch (error) {
        console.error('❌ 클러스터 확대 실패:', error);
      }
    }
  },

  // 필터 상태 초기화
  resetFilters() {
    // 모든 필터 탭을 '전체'로 초기화
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.remove('active');
    });

    // 각 필터 타입의 '전체' 탭을 활성화
    document.querySelectorAll('.filter-tab[data-filter="all"]').forEach(tab => {
      tab.classList.add('active');
    });

    console.log('🔄 필터 상태 초기화 완료');
  },

  // 필터링 이벤트 설정 및 초기화
  initializeFiltering() {
    setTimeout(() => {
      this.setupFilterEvents();
      this.applyFilters();
    }, 100);
  },

  // 호환성을 위한 updateStoreList 메서드
  async updateStoreList(map) {
    console.log('⚠️ updateStoreList 호출됨 - rebuildStorePanel로 리다이렉트');
    return await this.rebuildStorePanel(map);
  },

  // 수동 새로고침 메서드
  async refresh() {
    if (window.currentMap) {
      console.log('🔄 패널 수동 새로고침 - 뷰포트 기반 재구성');
      await this.rebuildStorePanel(window.currentMap);
    } else {
      console.warn('⚠️ 지도가 준비되지 않아 패널 새로고침을 건너뜁니다');
    }
  },

  // 초기화 함수
  init() {
    // 패널 DOM 및 스타일 렌더링
    if (!document.getElementById('storePanel')) {
      document.body.insertAdjacentHTML('beforeend', this.renderPanelHTML());
      document.body.insertAdjacentHTML('beforeend', this.getPanelStyles());
    }

    // 필터링 및 드래그 이벤트 설정
    this.initializeFiltering();
    this.setupPanelDrag();

    // 지도가 준비되면 연동
    const checkMapReady = () => {
      if (window.currentMap) {
        this.connectToMap(window.currentMap);
      } else {
        setTimeout(checkMapReady, 100);
      }
    };
    checkMapReady();
  }
};

// 실제 사용 시 MapPanelUI.init(); 호출 필요