
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

    // 터치 이벤트 설정
    this.setupTouchEvents(panel, storePanelContainer);

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
    const bottomBarHeight = bottomBar ? bottomBar.offsetHeight : 70;
    const handleHeight = panelHandle ? panelHandle.offsetHeight : 24;
    const panelPadding = 0;
    
    // 패널 컨테이너 높이 계산
    const panelHeight = vh - top - bottomBarHeight - handleHeight - panelPadding;
    storePanelContainer.style.height = `${panelHeight}px`;

    // 스크롤 활성화 보장
    storePanelContainer.style.overflowY = 'auto';
    storePanelContainer.style.overflowX = 'hidden';
    storePanelContainer.style.webkitOverflowScrolling = 'touch';

    if (storeNavBar && storeContent) {
      const navBarOffset = storeNavBar.offsetTop;
      const containerHeight = storePanelContainer.clientHeight;
      // 네비가 top에 닿기 전까지만 min-height 확보
      storeContent.style.minHeight = navBarOffset > 0 ? (containerHeight + navBarOffset) + 'px' : '400px';
    }

    console.log(`📐 패널 레이아웃 조정: 높이 ${panelHeight}px, 상단 ${top}px`);
  },

  setupWheelEvents(panel, storePanelContainer) {
    panel.addEventListener('wheel', (e) => {
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
      const isExpanded = top === 0;
      const isCollapsed = !isExpanded;

      // 아래로(내림) - 패널 확장
      if (e.deltaY > 0) {
        if (isCollapsed) {
          e.preventDefault();
          panel.classList.remove('collapsed');
          panel.classList.add('expanded');
          panel.style.top = '0px';
          setTimeout(() => this.adjustLayout(), 30);
          return;
        }
        // 확장된 상태에서는 스크롤 허용
        return;
      }
      
      // 위로(올림) - 패널 축소 또는 스크롤
      if (e.deltaY < 0) {
        if (isExpanded) {
          // 스크롤이 맨 위에 있을 때만 패널 축소
          if (storePanelContainer.scrollTop <= 0) {
            e.preventDefault();
            panel.classList.remove('expanded');
            panel.classList.add('collapsed');
            panel.style.top = '200px';
            setTimeout(() => this.adjustLayout(), 30);
            return;
          }
          // 스크롤이 중간에 있으면 스크롤 허용
          return;
        }
      }
    });
  },

  setupTouchEvents(panel, storePanelContainer) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let initialScrollTop = 0;

    // 터치 시작
    panel.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      initialScrollTop = storePanelContainer.scrollTop;
      isDragging = true;
      panel.style.transition = 'none';
    });

    // 터치 이동
    panel.addEventListener('touchmove', (e) => {
      if (!isDragging) return;

      currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
      const isExpanded = top === 0;
      const isCollapsed = !isExpanded;

      // 확장된 상태에서 스크롤이 맨 위에 있고 위로 드래그하면 패널 축소
      if (isExpanded && initialScrollTop <= 0 && deltaY < 0) {
        e.preventDefault();
        const newTop = Math.max(0, Math.min(200, -deltaY));
        panel.style.top = `${newTop}px`;
        return;
      }

      // 축소된 상태에서 아래로 드래그하면 패널 확장
      if (isCollapsed && deltaY > 0) {
        e.preventDefault();
        const newTop = Math.max(0, 200 - deltaY);
        panel.style.top = `${newTop}px`;
        return;
      }
    });

    // 터치 종료
    panel.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      
      isDragging = false;
      const deltaY = startY - currentY;
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;

      panel.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

      // 드래그 거리에 따라 패널 상태 결정
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) {
          // 아래로 드래그 - 확장
          panel.classList.remove('collapsed');
          panel.classList.add('expanded');
          panel.style.top = '0px';
        } else {
          // 위로 드래그 - 축소
          panel.classList.remove('expanded');
          panel.classList.add('collapsed');
          panel.style.top = '200px';
        }
      } else {
        // 드래그 거리가 짧으면 원래 상태 유지
        if (top < 100) {
          panel.style.top = '0px';
        } else {
          panel.style.top = '200px';
        }
      }

      setTimeout(() => this.adjustLayout(), 100);
    });
  }
};
