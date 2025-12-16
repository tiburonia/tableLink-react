
// 패널 레포지토리 - DOM 접근 및 스타일 조작
export const panelRepository = {
  /**
   * 패널 DOM 요소 가져오기
   */
  getPanelElements() {
    return {
      panel: document.getElementById('storePanel'),
      panelHandle: document.getElementById('panelHandle'),
      storePanelContainer: document.getElementById('storePanelContainer'),
      bottomBar: document.getElementById('storeBottomBar'),
      storeNavBar: document.getElementById('storeNavBar'),
      storeContent: document.getElementById('storeContent')
    };
  },

  /**
   * 패널 높이 설정
   */
  setPanelContainerHeight(container, height) {
    if (container) {
      container.style.height = `${height}px`;
    }
  },

  /**
   * 스크롤 설정 강제 적용
   */
  forceScrollSettings(container) {
    if (!container) return;

    container.style.cssText += `
      overflow-y: scroll
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      overscroll-behavior: contain !important;
      scroll-behavior: smooth !important;
      will-change: scroll-position !important;
    `;
  },

  /**
   * 패널 위치 설정 (top만)
   */
  setPanelPosition(panel, top) {
    if (panel) {
      panel.style.top = `${top}px`;
    }
  },

  /**
   * 패널 위치 설정 (top + bottom)
   */
  setPanelPositionWithBottom(panel, top, bottom) {
    if (panel) {
      panel.style.top = `${top}px`;
      panel.style.bottom = `${bottom}px`;
    }
  },

  /**
   * 패널 클래스 토글
   */
  togglePanelClass(panel, className, add) {
    if (!panel) return;
    
    if (add) {
      panel.classList.add(className);
    } else {
      panel.classList.remove(className);
    }
  },

  /**
   * 패널 트랜지션 설정
   */
  setPanelTransition(panel, transition) {
    if (panel) {
      panel.style.transition = transition;
    }
  },

  /**
   * 컨텐츠 최소 높이 설정
   */
  setContentMinHeight(content, minHeight) {
    if (content) {
      content.style.minHeight = `${minHeight}px`;
    }
  },

  /**
   * 패널 현재 위치 가져오기
   */
  getPanelTop(panel) {
    if (!panel) return 0;
    return parseInt(window.getComputedStyle(panel).top, 10) || 0;
  },

  /**
   * 스크롤 위치 가져오기
   */
  getScrollTop(container) {
    if (!container) return 0;
    return container.scrollTop;
  },

  /**
   * body userSelect 설정
   */
  setBodyUserSelect(value) {
    document.body.style.userSelect = value;
  }
};

// 전역 등록
window.panelRepository = panelRepository;
