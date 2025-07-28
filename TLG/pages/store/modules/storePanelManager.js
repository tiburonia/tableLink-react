
// 매장 패널 관리자
window.StorePanelManager = {
  initializePanelHandling() {
    const panel = document.getElementById('storePanel');
    const panelHandle = document.getElementById('panelHandle');
    const storePanelContainer = document.getElementById('storePanelContainer');
    const bottomBar = document.getElementById('storeBottomBar');
    const storeNavBar = document.getElementById('storeNavBar');
    const storeContent = document.getElementById('storeContent');

    if (!panel || !storePanelContainer) return;

    // 레이아웃 조정
    this.adjustLayout();

    // 이벤트 리스너 설정
    window.addEventListener('resize', () => this.adjustLayout());
    panel.addEventListener('transitionend', () => this.adjustLayout());
    
    // 휠/스크롤 이벤트 설정
    this.setupWheelEvents(panel, storePanelContainer);

    setTimeout(() => this.adjustLayout(), 0);
  },

  adjustLayout() {
    const panel = document.getElementById('storePanel');
    const storePanelContainer = document.getElementById('storePanelContainer');
    const bottomBar = document.getElementById('storeBottomBar');
    const panelHandle = document.getElementById('panelHandle');
    const storeNavBar = document.getElementById('storeNavBar');
    const storeContent = document.getElementById('storeContent');

    if (!panel || !storePanelContainer) return;

    const vh = window.innerHeight;
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const bottomBarHeight = bottomBar ? bottomBar.offsetHeight : 60;
    const handleHeight = panelHandle ? panelHandle.offsetHeight : 0;
    const panelPadding = 24;
    const panelHeight = vh - top - bottomBarHeight - handleHeight - panelPadding;
    storePanelContainer.style.height = `${panelHeight}px`;

    if (storeNavBar && storeContent) {
      const navBarOffset = storeNavBar.offsetTop;
      const containerHeight = storePanelContainer.clientHeight;
      // 네비가 top에 닿기 전까지만 min-height 확보
      storeContent.style.minHeight = navBarOffset > 0 ? (containerHeight + navBarOffset) + 'px' : '0px';
    }
  },

  setupWheelEvents(panel, storePanelContainer) {
    panel.addEventListener('wheel', (e) => {
      e.preventDefault();
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
      const isExpanded = top === 0;
      const isCollapsed = !isExpanded;

      // 아래로(내림)
      if (e.deltaY > 0) {
        if (isCollapsed) {
          panel.classList.remove('collapsed');
          panel.classList.add('expanded');
          panel.style.top = '0px';
          setTimeout(() => this.adjustLayout(), 30);
          return;
        }
        storePanelContainer.scrollTop += e.deltaY;
        return;
      }
      // 위로(올림)
      if (e.deltaY < 0) {
        if (isExpanded) {
          if (storePanelContainer.scrollTop > 0) {
            storePanelContainer.scrollTop += e.deltaY;
            return;
          }
          panel.classList.remove('expanded');
          panel.classList.add('collapsed');
          panel.style.top = '200px';
          setTimeout(() => this.adjustLayout(), 30);
          return;
        }
        // 접힌 상태면 아무 것도 안함
        return;
      }
    });
  }
};
