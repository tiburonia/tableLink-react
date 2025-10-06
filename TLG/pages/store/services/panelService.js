// 패널 서비스 - 비즈니스 로직 및 계산
let panelRepository;

try {
  const repoModule = await import('../repositories/panelRepository.js');
  panelRepository = repoModule.panelRepository;
} catch (error) {
  console.warn('⚠️ panelRepository 모듈 임포트 실패:', error);
}

export const panelService = {
  // 패널 상태 관리
  state: {
    isDragging: false,
    startY: 0,
    currentY: 0,
    initialScrollTop: 0
  },

  /**
   * 패널 높이 계산
   */
  calculatePanelHeight(elements) {
    const vh = window.innerHeight;
    const top = panelRepository.getPanelTop(elements.panel);
    const bottomBarHeight = elements.bottomBar ? elements.bottomBar.offsetHeight : 70;
    const handleHeight = elements.panelHandle ? elements.panelHandle.offsetHeight : 24;
    const panelPadding = 0;

    return vh - top - bottomBarHeight - handleHeight - panelPadding;
  },

  /**
   * 컨텐츠 최소 높이 계산
   */
  calculateContentMinHeight(elements, containerHeight) {
    if (!elements.storeNavBar) return 400;

    const navBarOffset = elements.storeNavBar.offsetTop;
    return navBarOffset > 0 ? (containerHeight + navBarOffset) : 400;
  },

  /**
   * 패널 상태 판단 (확장/축소)
   */
  getPanelState(top) {
    return {
      isExpanded: top <= 85,
      isCollapsed: top > 85
    };
  },

  /**
   * 드래그 거리 계산
   */
  calculateDragDelta(currentY, startY) {
    return startY - currentY;
  },

  /**
   * 새로운 패널 위치 계산 (드래그 중)
   */
  calculateNewTopWhileDragging(deltaY, currentTop, isExpanded, isCollapsed) {
    if (isExpanded && deltaY < 0) {
      // 확장 상태에서 아래로 드래그 (위치값 증가)
      return Math.max(85, Math.min(200, 85 - deltaY));
    } else if (isCollapsed && deltaY > 0) {
      // 축소 상태에서 위로 드래그 (위치값 감소)
      return Math.max(85, Math.min(200, 200 - deltaY));
    }
    return null; // 스크롤 허용
  },

  /**
   * 드래그 종료 후 최종 위치 결정
   */
  calculateFinalPosition(deltaY) {
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      return deltaY > 0 ? 85 : 200; // 확장(85px) or 축소(200px)
    }

    return null; // 유지
  },

  /**
   * 휠 스크롤 방향 처리
   */
  handleWheelScroll(deltaY, panelState, scrollTop) {
    // 아래로 스크롤 (확장)
    if (deltaY > 0 && panelState.isCollapsed) {
      return { action: 'expand', preventScroll: true };
    }

    // 위로 스크롤 (축소)
    if (deltaY < 0 && panelState.isExpanded && scrollTop <= 0) {
      return { action: 'collapse', preventScroll: true };
    }

    return { action: 'scroll', preventScroll: false };
  },

  /**
   * 드래그 상태 초기화
   */
  resetDragState() {
    this.state.isDragging = false;
    this.state.startY = 0;
    this.state.currentY = 0;
    this.state.initialScrollTop = 0;
  },

  /**
   * 드래그 시작
   */
  startDrag(clientY, scrollTop) {
    this.state.isDragging = true;
    this.state.startY = clientY;
    this.state.initialScrollTop = scrollTop;
  },

  /**
   * 드래그 중
   */
  isDragActive() {
    return this.state.isDragging;
  }
};

// 전역 등록
window.panelService = panelService;