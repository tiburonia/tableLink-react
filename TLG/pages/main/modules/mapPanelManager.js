
// 지도 패널 관리자
window.MapPanelManager = {
  initializePanelHandling() {
    const panel = document.getElementById('storePanel');
    const panelHandle = document.getElementById('panelHandle');
    
    if (!panel || !panelHandle) return;

    let isDragging = false;
    let startY = 0;
    let startTop = 0;

    // 패널 초기 상태 설정
    this.setPanelState('collapsed');

    // 터치/마우스 이벤트 설정
    this.setupPanelEvents(panel, panelHandle);
    
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', () => this.adjustPanelHeight());
    
    // 초기 높이 조정
    this.adjustPanelHeight();
  },

  setupPanelEvents(panel, panelHandle) {
    // 핸들 드래그 시작
    panelHandle.addEventListener('touchstart', (e) => this.handleDragStart(e, panel));
    panelHandle.addEventListener('mousedown', (e) => this.handleDragStart(e, panel));

    // 드래그 중
    document.addEventListener('touchmove', (e) => this.handleDragMove(e, panel));
    document.addEventListener('mousemove', (e) => this.handleDragMove(e, panel));

    // 드래그 종료
    document.addEventListener('touchend', (e) => this.handleDragEnd(e, panel));
    document.addEventListener('mouseup', (e) => this.handleDragEnd(e, panel));

    // 패널 클릭으로 확장/축소
    panelHandle.addEventListener('click', () => this.togglePanel(panel));

    // 패널 내부 스크롤 설정
    const storeListContainer = document.getElementById('storeListContainer');
    if (storeListContainer) {
      this.setupPanelScroll(storeListContainer, panel);
    }
  },

  handleDragStart(e, panel) {
    this.isDragging = true;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    this.startY = clientY;
    this.startTop = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    
    panel.style.transition = 'none';
    e.preventDefault();
  },

  handleDragMove(e, panel) {
    if (!this.isDragging) return;
    
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - this.startY;
    const newTop = Math.max(0, Math.min(window.innerHeight * 0.7, this.startTop + deltaY));
    
    panel.style.top = newTop + 'px';
    e.preventDefault();
  },

  handleDragEnd(e, panel) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    panel.style.transition = 'all 0.3s ease';
    
    const currentTop = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const threshold = window.innerHeight * 0.3;
    
    if (currentTop < threshold) {
      this.setPanelState('expanded', panel);
    } else {
      this.setPanelState('collapsed', panel);
    }
  },

  togglePanel(panel) {
    const isCollapsed = panel.classList.contains('collapsed');
    this.setPanelState(isCollapsed ? 'expanded' : 'collapsed', panel);
  },

  setPanelState(state, panel = document.getElementById('storePanel')) {
    if (!panel) return;
    
    panel.classList.remove('collapsed', 'expanded');
    panel.classList.add(state);
    
    if (state === 'collapsed') {
      panel.style.top = (window.innerHeight * 0.7) + 'px';
    } else {
      panel.style.top = '100px';
    }
    
    this.adjustPanelHeight();
  },

  adjustPanelHeight() {
    const panel = document.getElementById('storePanel');
    const storeListContainer = document.getElementById('storeListContainer');
    
    if (!panel || !storeListContainer) return;
    
    const panelTop = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const bottomBarHeight = 84;
    const panelHandleHeight = 32;
    const availableHeight = window.innerHeight - panelTop - bottomBarHeight - panelHandleHeight;
    
    storeListContainer.style.height = Math.max(200, availableHeight) + 'px';
  },

  setupPanelScroll(container, panel) {
    let isScrolling = false;
    
    container.addEventListener('touchstart', () => {
      isScrolling = false;
    });
    
    container.addEventListener('touchmove', (e) => {
      isScrolling = true;
      e.stopPropagation();
    });
    
    container.addEventListener('scroll', (e) => {
      e.stopPropagation();
    });

    // 휠 이벤트로 패널 제어
    container.addEventListener('wheel', (e) => {
      const atTop = container.scrollTop === 0;
      const atBottom = container.scrollTop >= container.scrollHeight - container.clientHeight;
      
      if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
        e.preventDefault();
        
        if (e.deltaY < 0 && panel.classList.contains('collapsed')) {
          this.setPanelState('expanded', panel);
        } else if (e.deltaY > 0 && panel.classList.contains('expanded')) {
          this.setPanelState('collapsed', panel);
        }
      }
    });
  },

  // 매장 리스트 렌더링
  renderStoreList(stores) {
    const storeListContainer = document.getElementById('storeListContainer');
    if (!storeListContainer) return;

    if (!stores || stores.length === 0) {
      storeListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #666;">
          <div style="font-size: 48px; margin-bottom: 16px;">🏪</div>
          <p>주변에 매장이 없습니다</p>
        </div>
      `;
      return;
    }

    const storeHTML = stores.map(store => `
      <div class="store-item" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
        <div class="store-info">
          <div class="store-header">
            <h3 class="store-name">${store.name}</h3>
            <div class="store-rating">
              <span class="rating-star">★</span>
              <span class="rating-value">${store.ratingAverage || '0.0'}</span>
            </div>
          </div>
          <div class="store-status ${store.isOpen ? 'open' : 'closed'}">
            ${store.isOpen ? '🟢 운영중' : '🔴 운영중지'}
          </div>
          <p class="store-address">${store.address || '주소 정보 없음'}</p>
        </div>
        <div class="store-arrow">→</div>
      </div>
    `).join('');

    storeListContainer.innerHTML = storeHTML;
  }
};
