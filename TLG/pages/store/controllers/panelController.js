
// 패널 컨트롤러 - 이벤트 처리 및 흐름 제어
let panelService, panelView;

try {
  const serviceModule = await import('../services/panelService.js');
  const viewModule = await import('../views/modules/panelView.js');
  panelService = serviceModule.panelService;
  panelView = viewModule.panelView;
} catch (error) {
  console.warn('⚠️ Panel 모듈 임포트 실패:', error);
}

export const panelController = {
  elements: null,

  /**
   * 패널 핸들링 초기화
   */
  initializePanelHandling() {
    console.log('🔧 패널 핸들링 초기화 시작...');
    
    this.elements = panelView.getPanelElements();

    if (!this.elements.panel || !this.elements.storePanelContainer) {
      console.warn('⚠️ 필수 패널 요소를 찾을 수 없습니다');
      return;
    }

    console.log('✅ 패널 요소 확인 완료');

    // 초기 설정
    panelView.applyInitialScrollSettings(this.elements.storePanelContainer);
    this.adjustLayout();

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // 초기 레이아웃 조정
    setTimeout(() => {
      this.adjustLayout();
      console.log('✅ 패널 핸들링 초기화 완료');
    }, 100);
  },

  /**
   * 레이아웃 조정
   */
  adjustLayout() {
    if (!this.elements) return;

    const panelHeight = panelService.calculatePanelHeight(this.elements);
    
    // 패널 컨테이너 높이 설정
    panelView.updatePanelHeight(this.elements.storePanelContainer, panelHeight);
    
    // 컨텐츠 최소 높이 설정
    if (this.elements.storeNavBar && this.elements.storeContent) {
      const containerHeight = this.elements.storePanelContainer.clientHeight;
      const minHeight = panelService.calculateContentMinHeight(this.elements, containerHeight);
      panelView.updateContentMinHeight(this.elements.storeContent, minHeight);
    }
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    window.addEventListener('resize', () => this.adjustLayout());
    this.elements.panel.addEventListener('transitionend', () => this.adjustLayout());
    
    this.setupWheelEvents();
    this.setupTouchEvents();
  },

  /**
   * 휠 이벤트 설정
   */
  setupWheelEvents() {
    this.elements.panel.addEventListener('wheel', (e) => {
      const top = panelView.getPanelTop(this.elements.panel);
      const panelState = panelService.getPanelState(top);
      const scrollTop = panelView.getScrollTop(this.elements.storePanelContainer);
      
      const result = panelService.handleWheelScroll(e.deltaY, panelState, scrollTop);
      
      if (result.preventScroll) {
        e.preventDefault();
        
        if (result.action === 'expand') {
          panelView.expandPanel(this.elements.panel);
          setTimeout(() => this.adjustLayout(), 30);
        } else if (result.action === 'collapse') {
          panelView.collapsePanel(this.elements.panel);
          setTimeout(() => this.adjustLayout(), 30);
        }
      }
    });
  },

  /**
   * 터치 이벤트 설정
   */
  setupTouchEvents() {
    // 터치 시작
    this.elements.panel.addEventListener('touchstart', (e) => {
      const scrollTop = panelView.getScrollTop(this.elements.storePanelContainer);
      panelService.startDrag(e.touches[0].clientY, scrollTop);
      panelView.disableTransition(this.elements.panel);
    });

    // 터치 이동
    this.elements.panel.addEventListener('touchmove', (e) => {
      if (!panelService.isDragActive()) return;

      const currentY = e.touches[0].clientY;
      panelService.state.currentY = currentY;
      const deltaY = panelService.calculateDragDelta(currentY, panelService.state.startY);
      const top = panelView.getPanelTop(this.elements.panel);
      const panelState = panelService.getPanelState(top);

      const newTop = panelService.calculateNewTopWhileDragging(
        deltaY, 
        top, 
        panelState.isExpanded, 
        panelState.isCollapsed
      );

      if (newTop !== null) {
        e.preventDefault();
        panelView.setPanelTop(this.elements.panel, newTop);
      }
    });

    // 터치 종료
    this.elements.panel.addEventListener('touchend', (e) => {
      if (!panelService.isDragActive()) return;
      
      const deltaY = panelService.calculateDragDelta(
        panelService.state.currentY || e.changedTouches[0].clientY, 
        panelService.state.startY
      );

      panelView.enableTransition(this.elements.panel);

      const finalPosition = panelService.calculateFinalPosition(deltaY);

      if (finalPosition !== null) {
        if (finalPosition === 75) {
          panelView.expandPanel(this.elements.panel);
        } else {
          panelView.collapsePanel(this.elements.panel);
        }
      } else {
        // 원래 상태 유지
        const currentTop = panelView.getPanelTop(this.elements.panel);
        if (currentTop < 137.5) {
          panelView.expandPanel(this.elements.panel);
        } else {
          panelView.collapsePanel(this.elements.panel);
        }
      }

      panelService.resetDragState();
      setTimeout(() => this.adjustLayout(), 100);
    });
  }
};

// 전역 등록
window.panelController = panelController;
