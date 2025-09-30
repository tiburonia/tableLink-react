
// 모듈 임포트 (조건부)
let mapPanelService, mapPanelView;

try {
  const serviceModule = await import('../services/mapPanelService.js');
  const viewModule = await import('../views/mapPanelView.js');
  mapPanelService = serviceModule.mapPanelService;
  mapPanelView = viewModule.mapPanelView;
} catch (error) {
  console.warn('⚠️ mapPanel 모듈 임포트 실패:', error);
  mapPanelService = window.mapPanelService;
  mapPanelView = window.mapPanelView;
}

/**
 * 지도 패널 컨트롤러 - 패널 이벤트 처리 및 흐름 제어
 */
export const mapPanelController = {
  // 상태 관리
  state: {
    map: null,
    isExpanded: false,
    currentStores: [],
    activeFilters: {},
    dragState: {
      isDragging: false,
      startY: 0,
      startHeight: 60
    }
  },

  /**
   * 패널 초기화
   */
  async initializePanel(map) {
    console.log('🔧 지도 패널 컨트롤러 초기화');

    this.state.map = map;

    try {
      // UI 렌더링
      mapPanelView.renderPanelUI();

      // 이벤트 설정
      this.setupPanelEvents();
      this.setupFilterEvents();
      this.setupDragEvents();

      // 지도와 연동
      this.connectToMap(map);

      console.log('✅ 지도 패널 컨트롤러 초기화 완료');
    } catch (error) {
      console.error('❌ 지도 패널 초기화 실패:', error);
    }
  },

  /**
   * 패널 기본 이벤트 설정
   */
  setupPanelEvents() {
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    
    if (filterToggleBtn) {
      filterToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleFilterToggle();
      });
    }

    console.log('✅ 패널 기본 이벤트 설정 완료');
  },

  /**
   * 필터 이벤트 설정
   */
  setupFilterEvents() {
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleFilterChange(tab);
      });
    });

    console.log('✅ 필터 이벤트 설정 완료');
  },

  /**
   * 드래그 이벤트 설정
   */
  setupDragEvents() {
    const panelHandle = document.getElementById('panelHandle');
    const storePanel = document.getElementById('storePanel');

    if (!panelHandle || !storePanel) return;

    // 마우스 이벤트
    panelHandle.addEventListener('mousedown', (e) => {
      this.startDrag(e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.state.dragState.isDragging) {
        this.handleDrag(e.clientY);
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.state.dragState.isDragging) {
        this.endDrag();
      }
    });

    // 터치 이벤트
    panelHandle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startDrag(e.touches[0].clientY);
    });

    panelHandle.addEventListener('touchmove', (e) => {
      if (this.state.dragState.isDragging) {
        e.preventDefault();
        this.handleDrag(e.touches[0].clientY);
      }
    });

    panelHandle.addEventListener('touchend', (e) => {
      if (this.state.dragState.isDragging) {
        e.preventDefault();
        this.endDrag();
      }
    });

    console.log('✅ 드래그 이벤트 설정 완료');
  },

  /**
   * 필터 토글 처리
   */
  handleFilterToggle() {
    const filterContainer = document.getElementById('filterContainer');
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const storeListContainer = document.getElementById('storeListContainer');

    const isExpanded = filterToggleBtn.classList.contains('expanded');

    if (isExpanded) {
      filterContainer.classList.add('collapsed');
      filterToggleBtn.classList.remove('expanded');
      storeListContainer.classList.add('filter-collapsed');
    } else {
      filterContainer.classList.remove('collapsed');
      filterToggleBtn.classList.add('expanded');
      storeListContainer.classList.remove('filter-collapsed');
    }

    console.log('🔄 필터 토글:', isExpanded ? '접힘' : '펼침');
  },

  /**
   * 필터 변경 처리
   */
  async handleFilterChange(clickedTab) {
    const filterType = clickedTab.getAttribute('data-type');
    const filterValue = clickedTab.getAttribute('data-filter');

    // 같은 타입의 다른 탭 비활성화
    document.querySelectorAll(`.filter-tab[data-type="${filterType}"]`)
      .forEach(tab => tab.classList.remove('active'));

    // 클릭된 탭 활성화
    clickedTab.classList.add('active');

    // 현재 활성 필터 상태 업데이트
    this.updateActiveFilters();

    // 필터링 적용
    await this.applyCurrentFilters();

    console.log('🔍 필터 변경:', filterType, '=', filterValue);
  },

  /**
   * 드래그 시작
   */
  startDrag(startY) {
    const storePanel = document.getElementById('storePanel');
    const currentHeight = parseInt(storePanel.style.height) || 
                        (storePanel.classList.contains('collapsed') ? 60 : 630);

    this.state.dragState = {
      isDragging: true,
      startY: startY,
      startHeight: currentHeight
    };

    storePanel.style.transition = 'none';
    document.body.style.userSelect = 'none';
  },

  /**
   * 드래그 처리
   */
  handleDrag(currentY) {
    const storePanel = document.getElementById('storePanel');
    const deltaY = currentY - this.state.dragState.startY;
    let newHeight = this.state.dragState.startHeight - deltaY;

    // 높이 제한
    newHeight = Math.max(60, Math.min(630, newHeight));

    storePanel.style.height = `${newHeight}px`;

    // 클래스 상태 업데이트
    if (newHeight <= 70) {
      storePanel.classList.add('collapsed');
      storePanel.classList.remove('expanded');
    } else if (newHeight >= 620) {
      storePanel.classList.add('expanded');
      storePanel.classList.remove('collapsed');
    } else {
      storePanel.classList.remove('collapsed', 'expanded');
    }
  },

  /**
   * 드래그 종료
   */
  endDrag() {
    const storePanel = document.getElementById('storePanel');
    const currentHeight = parseInt(storePanel.style.height);

    this.state.dragState.isDragging = false;
    storePanel.style.transition = 'height 0.3s cubic-bezier(.68,-0.55,.27,1.55)';
    document.body.style.userSelect = '';

    // 스냅 처리
    const midPoint = 300;
    if (currentHeight < midPoint) {
      storePanel.style.height = '60px';
      storePanel.classList.add('collapsed');
      storePanel.classList.remove('expanded');
      this.state.isExpanded = false;
    } else {
      storePanel.style.height = '630px';
      storePanel.classList.add('expanded');
      storePanel.classList.remove('collapsed');
      this.state.isExpanded = true;
    }
  },

  /**
   * 지도와 연동
   */
  connectToMap(map) {
    if (!map) return;

    let updateTimer = null;

    const handleMapChange = () => {
      if (updateTimer) clearTimeout(updateTimer);
      
      updateTimer = setTimeout(async () => {
        try {
          await this.rebuildStorePanel();
        } catch (error) {
          console.error('❌ 패널 업데이트 실패:', error);
        }
      }, 300);
    };

    // 지도 이벤트 리스너 등록
    kakao.maps.event.addListener(map, 'dragend', handleMapChange);
    kakao.maps.event.addListener(map, 'zoom_changed', handleMapChange);
    kakao.maps.event.addListener(map, 'idle', handleMapChange);

    // 초기 패널 구성
    this.rebuildStorePanel();

    console.log('🔗 지도와 패널 연동 완료');
  },

  /**
   * 패널 완전 재구성
   */
  async rebuildStorePanel() {
    console.log('🔄 패널 완전 재구성 시작');

    try {
      // 로딩 상태 표시
      mapPanelView.showLoading();

      // 매장 데이터 조회
      const stores = await mapPanelService.getViewportStores(this.state.map);
      
      if (stores.length === 0) {
        mapPanelView.showEmptyState(this.state.map.getLevel());
        return;
      }

      // 상태 업데이트
      this.state.currentStores = stores;

      // UI 업데이트
      mapPanelView.renderStoreList(stores);

      // 필터 적용
      await this.applyCurrentFilters();

      console.log(`✅ 패널 재구성 완료: ${stores.length}개 매장`);

    } catch (error) {
      console.error('❌ 패널 재구성 실패:', error);
      mapPanelView.showError(error.message);
    }
  },

  /**
   * 현재 활성 필터 상태 업데이트
   */
  updateActiveFilters() {
    this.state.activeFilters = {};
    
    document.querySelectorAll('.filter-tab.active').forEach(tab => {
      const type = tab.getAttribute('data-type');
      const filterValue = tab.getAttribute('data-filter');
      if (filterValue !== 'all') {
        this.state.activeFilters[type] = filterValue;
      }
    });
  },

  /**
   * 현재 필터 적용
   */
  async applyCurrentFilters() {
    const filteredStores = mapPanelService.applyFilters(
      this.state.currentStores, 
      this.state.activeFilters
    );
    
    mapPanelView.updateStoreVisibility(filteredStores);
    
    console.log(`🔍 필터 적용: ${filteredStores.length}개 매장 표시`);
  },

  /**
   * 필터 초기화
   */
  resetFilters() {
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.remove('active');
    });

    document.querySelectorAll('.filter-tab[data-filter="all"]').forEach(tab => {
      tab.classList.add('active');
    });

    this.state.activeFilters = {};
    this.applyCurrentFilters();

    console.log('🔄 필터 초기화 완료');
  },

  /**
   * 상태 초기화
   */
  reset() {
    console.log('🔄 지도 패널 컨트롤러 초기화');
    
    this.state.map = null;
    this.state.isExpanded = false;
    this.state.currentStores = [];
    this.state.activeFilters = {};
    this.state.dragState = {
      isDragging: false,
      startY: 0,
      startHeight: 60
    };
  }
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapPanelController = mapPanelController;
}
