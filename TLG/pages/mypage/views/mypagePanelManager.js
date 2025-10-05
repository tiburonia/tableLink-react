
/**
 * MyPage Panel Manager
 * 마이페이지 패널 드래그 및 레이아웃 관리
 */

export const mypagePanelManager = {
  /**
   * 패널 핸들링 설정
   */
  setup() {
    const panel = document.getElementById('mypagePanel');
    const panelHandle = document.getElementById('mypagePanelHandle');
    const panelContainer = document.getElementById('mypagePanelContainer');

    if (!panel || !panelContainer) {
      console.warn('⚠️ 마이페이지 패널 요소를 찾을 수 없습니다');
      return;
    }

    this.adjustPanelLayout();
    window.addEventListener('resize', () => this.adjustPanelLayout());
    panel.addEventListener('transitionend', () => this.adjustPanelLayout());

    this.setupWheelEvents(panel, panelContainer);
    this.setupTouchEvents(panel, panelContainer);

    setTimeout(() => this.adjustPanelLayout(), 0);

    console.log('✅ 마이페이지 패널 매니저 설정 완료');
  },

  /**
   * 패널 레이아웃 조정
   */
  adjustPanelLayout() {
    const panel = document.getElementById('mypagePanel');
    const panelContainer = document.getElementById('mypagePanelContainer');
    const bottomBar = document.getElementById('bottomBar');
    const panelHandle = document.getElementById('mypagePanelHandle');

    if (!panel || !panelContainer) return;

    const vh = window.innerHeight;
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const bottomBarHeight = bottomBar ? bottomBar.offsetHeight : 78;
    const handleHeight = panelHandle ? panelHandle.offsetHeight + 8 : 24;
    const isExpanded = top === 0;

    let panelHeight;
    if (isExpanded) {
      panelHeight = vh - bottomBarHeight - handleHeight;
      panelContainer.style.paddingBottom = '120px';
    } else {
      panelHeight = vh - top - bottomBarHeight - handleHeight;
      panelContainer.style.paddingBottom = '100px';
    }

    panelContainer.style.height = `${panelHeight}px`;
    panelContainer.style.maxHeight = `${panelHeight}px`;
    panelContainer.style.overflowY = 'auto';
    panelContainer.style.overflowX = 'hidden';
    panelContainer.style.webkitOverflowScrolling = 'touch';
  },

  /**
   * 휠 이벤트 설정
   */
  setupWheelEvents(panel, panelContainer) {
    panel.addEventListener('wheel', (e) => {
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
      const isExpanded = top === 0;
      const isCollapsed = !isExpanded;

      if (e.deltaY > 0) {
        if (isCollapsed) {
          e.preventDefault();
          panel.classList.remove('collapsed');
          panel.classList.add('expanded');
          panel.style.top = '0px';
          setTimeout(() => this.adjustPanelLayout(), 30);
          return;
        }
        return;
      }

      if (e.deltaY < 0) {
        if (isExpanded) {
          if (panelContainer.scrollTop <= 0) {
            e.preventDefault();
            panel.classList.remove('expanded');
            panel.classList.add('collapsed');
            panel.style.top = '100px';
            setTimeout(() => this.adjustPanelLayout(), 30);
            return;
          }
          return;
        }
      }
    });
  },

  /**
   * 터치 이벤트 설정
   */
  setupTouchEvents(panel, panelContainer) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let initialScrollTop = 0;

    panel.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      initialScrollTop = panelContainer.scrollTop;
      isDragging = true;
      panel.style.transition = 'none';
    });

    panel.addEventListener('touchmove', (e) => {
      if (!isDragging) return;

      currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
      const isExpanded = top === 0;
      const isCollapsed = !isExpanded;

      if (isExpanded && initialScrollTop <= 0 && deltaY < 0) {
        e.preventDefault();
        const newTop = Math.max(0, Math.min(100, -deltaY));
        panel.style.top = `${newTop}px`;
        return;
      }

      if (isCollapsed && deltaY > 0) {
        e.preventDefault();
        const newTop = Math.max(0, Math.min(100, 100 - deltaY));
        panel.style.top = `${newTop}px`;
        return;
      }
    });

    panel.addEventListener('touchend', (e) => {
      if (!isDragging) return;

      isDragging = false;
      const deltaY = startY - currentY;
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;

      panel.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) {
          panel.classList.remove('collapsed');
          panel.classList.add('expanded');
          panel.style.top = '0px';
        } else {
          panel.classList.remove('expanded');
          panel.classList.add('collapsed');
          panel.style.top = '100px';
        }
      } else {
        if (top < 50) {
          panel.classList.remove('collapsed');
          panel.classList.add('expanded');
          panel.style.top = '0px';
        } else {
          panel.classList.remove('expanded');
          panel.classList.add('collapsed');
          panel.style.top = '100px';
        }
      }

      setTimeout(() => this.adjustPanelLayout(), 30);
    });
  }
};
