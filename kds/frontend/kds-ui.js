
/**
 * KDS UI v4.0 - Order Tickets 기반 인터페이스
 * 그리드 카드 레이아웃, 아이템 중심 상태 변경
 */

class KDSUI {
  constructor() {
    this.core = null;
    this.container = null;
    this.currentFilter = {
      status: ['PENDING', 'COOKING'],
      station: null
    };

    this.sounds = {
      newTicket: null,
      statusChange: null,
      error: null
    };

    this.config = {
      cardColumns: 3,
      autoRefresh: true,
      soundEnabled: true,
      showElapsedTime: true
    };

    console.log('🎨 KDS UI v4.0 초기화 완료');
  }

  // =================== 초기화 ===================
  async initialize(containerId, kdsCore) {
    try {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`컨테이너를 찾을 수 없습니다: ${containerId}`);
      }

      this.core = kdsCore;

      // 이벤트 리스너 등록
      this.registerEventListeners();

      // 초기 UI 렌더링
      this.render();

      // 사운드 초기화
      this.initializeSounds();

      console.log('🎨 KDS UI 초기화 완료');
      return true;
    } catch (error) {
      console.error('❌ KDS UI 초기화 실패:', error);
      return false;
    }
  }

  // =================== 이벤트 리스너 ===================
  registerEventListeners() {
    // KDS Core 이벤트들
    this.core.on('tickets_updated', () => {
      this.renderTickets();
      this.updateStats();
    });

    this.core.on('stations_updated', () => {
      this.renderStationFilter();
    });

    this.core.on('dashboard_updated', (dashboard) => {
      this.renderDashboard(dashboard);
    });

    this.core.on('new_ticket', (data) => {
      console.log('🚨 새 주문 접수!', data);
      this.playSound('newTicket');
      this.showNotification('새 주문이 들어왔습니다!', 'info');
    });

    this.core.on('item_status_changed', (data) => {
      this.playSound('statusChange');
      this.showNotification(`${data.menu_name} 상태가 ${data.new_item_status}로 변경되었습니다`, 'success');
    });

    this.core.on('error', (error) => {
      this.playSound('error');
      this.showNotification(error.message, 'error');
    });

    this.core.on('max_retries_exceeded', (error) => {
      this.showNotification('연결에 문제가 발생했습니다. 페이지를 새로고침해주세요.', 'error');
    });
  }

  // =================== 렌더링 ===================
  render() {
    this.container.innerHTML = `
      <div class="kds-container">
        ${this.renderHeader()}
        ${this.renderControls()}
        ${this.renderMainContent()}
        ${this.renderNotificationArea()}
      </div>
    `;

    // 초기 데이터 로드
    this.renderTickets();
    this.renderStationFilter();
    this.renderDashboard(this.core.getDashboard());
  }

  renderHeader() {
    return `
      <header class="kds-header">
        <div class="header-left">
          <h1 class="kds-title">
            <span class="title-icon">🍳</span>
            Kitchen Display System
          </h1>
          <div class="store-info">
            <span class="store-id">매장 ${this.core.config.storeId}</span>
            <span class="current-time" id="currentTime">${new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="connection-status" id="connectionStatus">
            <span class="status-dot connecting"></span>
            <span class="status-text">연결 중...</span>
          </div>
        </div>
      </header>
    `;
  }

  renderControls() {
    return `
      <div class="kds-controls">
        <div class="filter-section">
          <div class="status-filters">
            <button class="filter-btn active" data-status="PENDING,COOKING" data-label="활성 주문">
              📋 활성 주문
            </button>
            <button class="filter-btn" data-status="PENDING" data-label="대기 중">
              ⏳ 대기 중
            </button>
            <button class="filter-btn" data-status="COOKING" data-label="조리 중">
              🔥 조리 중
            </button>
            <button class="filter-btn" data-status="DONE" data-label="완료됨">
              ✅ 완료됨
            </button>
          </div>
          <div class="station-filter">
            <select id="stationFilter">
              <option value="">모든 스테이션</option>
            </select>
          </div>
        </div>
        
        <div class="action-section">
          <button class="action-btn refresh-btn" id="refreshBtn">
            🔄 새로고침
          </button>
          <button class="action-btn cleanup-btn" id="cleanupBtn">
            🧹 화면 정리
          </button>
          <button class="action-btn settings-btn" id="settingsBtn">
            ⚙️ 설정
          </button>
        </div>
      </div>
    `;
  }

  renderMainContent() {
    return `
      <main class="kds-main">
        <div class="dashboard-section" id="dashboardSection">
          ${this.renderDashboardPlaceholder()}
        </div>
        <div class="tickets-section">
          <div class="tickets-header">
            <h2 id="ticketsTitle">주문 대기열</h2>
            <div class="tickets-count" id="ticketsCount">0개</div>
          </div>
          <div class="tickets-grid" id="ticketsGrid">
            ${this.renderLoadingTickets()}
          </div>
        </div>
      </main>
    `;
  }

  renderDashboardPlaceholder() {
    return `
      <div class="dashboard-grid">
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-info">
            <div class="stat-number" id="pendingCount">-</div>
            <div class="stat-label">대기 중</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-info">
            <div class="stat-number" id="cookingCount">-</div>
            <div class="stat-label">조리 중</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <div class="stat-number" id="doneCount">-</div>
            <div class="stat-label">완료</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-number" id="todayCount">-</div>
            <div class="stat-label">오늘 완료</div>
          </div>
        </div>
      </div>
    `;
  }

  renderLoadingTickets() {
    return `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">주문 정보를 불러오는 중...</div>
      </div>
    `;
  }

  renderNotificationArea() {
    return `
      <div class="notification-area" id="notificationArea"></div>
    `;
  }

  // =================== 티켓 렌더링 ===================
  renderTickets() {
    const tickets = this.core.getTickets(this.currentFilter);
    const ticketsGrid = document.getElementById('ticketsGrid');
    const ticketsCount = document.getElementById('ticketsCount');
    const ticketsTitle = document.getElementById('ticketsTitle');

    console.log('🎫 티켓 렌더링:', {
      totalTickets: tickets.length,
      filter: this.currentFilter,
      tickets: tickets
    });

    // 각 티켓의 세부 정보 출력
    tickets.forEach((ticket, index) => {
      console.log(`🍽️ 주문 #${ticket.ticket_id}:`, {
        테이블: ticket.table_label,
        상태: ticket.status,
        생성시간: ticket.created_at,
        경과시간: `${ticket.elapsed_minutes}분`,
        아이템수: ticket.items?.length || 0,
        아이템목록: ticket.items?.map(item => ({
          메뉴명: item.menu_name,
          수량: item.quantity,
          상태: item.item_status,
          조리스테이션: item.cook_station
        })) || []
      });
    });

    if (!ticketsGrid) return;

    // 제목과 카운트 업데이트
    const filterLabel = document.querySelector('.filter-btn.active')?.dataset.label || '전체';
    ticketsTitle.textContent = `${filterLabel} 주문`;
    ticketsCount.textContent = `${tickets.length}개`;

    if (tickets.length === 0) {
      ticketsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">표시할 주문이 없습니다</div>
          <div class="empty-subtitle">새로운 주문을 기다리는 중...</div>
        </div>
      `;
      return;
    }

    ticketsGrid.innerHTML = tickets.map(ticket => this.renderTicketCard(ticket)).join('');

    // 이벤트 리스너 추가
    this.attachTicketEventListeners();
  }

  renderTicketCard(ticket) {
    const statusClass = ticket.status.toLowerCase();
    const elapsedTime = ticket.elapsed_minutes || 0;
    const isUrgent = elapsedTime > 15;

    return `
      <div class="ticket-card ${statusClass} ${isUrgent ? 'urgent' : ''}" data-ticket-id="${ticket.ticket_id}">
        <div class="ticket-header">
          <div class="ticket-info">
            <span class="table-label">${ticket.table_label || '테이블'}</span>
            <span class="ticket-id">#${ticket.ticket_id}</span>
          </div>
          <div class="ticket-meta">
            <span class="ticket-time">${new Date(ticket.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
            ${elapsedTime > 0 ? `<span class="elapsed-time ${isUrgent ? 'urgent' : ''}">${elapsedTime}분</span>` : ''}
          </div>
        </div>

        <div class="ticket-status-bar">
          <span class="status-badge status-${statusClass}">${this.getStatusLabel(ticket.status)}</span>
          ${ticket.batch_no > 1 ? `<span class="batch-badge">배치 ${ticket.batch_no}</span>` : ''}
        </div>

        <div class="ticket-items">
          ${ticket.items.map(item => this.renderTicketItem(item)).join('')}
        </div>

        <div class="ticket-actions">
          ${this.renderTicketActions(ticket)}
        </div>
      </div>
    `;
  }

  renderTicketItem(item) {
    const statusClass = item.item_status.toLowerCase();
    
    return `
      <div class="ticket-item ${statusClass}" data-item-id="${item.id}">
        <div class="item-main">
          <div class="item-info">
            <span class="item-name">${item.menu_name}</span>
            <span class="item-quantity">×${item.quantity}</span>
          </div>
          <div class="item-actions">
            ${this.renderItemStatusButtons(item)}
          </div>
        </div>
        ${item.special_requests ? `<div class="item-notes">${item.special_requests}</div>` : ''}
        <div class="item-station">${item.cook_station || 'KITCHEN'}</div>
      </div>
    `;
  }

  renderItemStatusButtons(item) {
    const currentStatus = item.item_status;
    let buttons = [];

    switch (currentStatus) {
      case 'PENDING':
        buttons.push(`<button class="status-btn start-btn" data-action="start">조리 시작</button>`);
        buttons.push(`<button class="status-btn cancel-btn" data-action="cancel">취소</button>`);
        break;
      case 'COOKING':
        buttons.push(`<button class="status-btn finish-btn" data-action="finish">완료</button>`);
        buttons.push(`<button class="status-btn cancel-btn" data-action="cancel">취소</button>`);
        break;
      case 'DONE':
        buttons.push(`<button class="status-btn recall-btn" data-action="recall">되돌리기</button>`);
        break;
      case 'CANCELED':
        buttons.push(`<span class="status-text canceled">취소됨</span>`);
        break;
    }

    return buttons.join('');
  }

  renderTicketActions(ticket) {
    const actions = [];

    // 전체 조리 시작
    if (ticket.status === 'PENDING' || ticket.items.some(item => item.item_status === 'PENDING')) {
      actions.push(`
        <button class="ticket-action-btn start-all-btn" data-action="start-all">
          🔥 전체 조리 시작
        </button>
      `);
    }

    // 전체 완료
    if (ticket.status === 'COOKING' || ticket.items.some(item => item.item_status === 'COOKING')) {
      actions.push(`
        <button class="ticket-action-btn finish-all-btn" data-action="finish-all">
          ✅ 전체 완료
        </button>
      `);
    }

    // 프린트
    if (ticket.print_status === 'WAITING') {
      actions.push(`
        <button class="ticket-action-btn print-btn" data-action="print">
          🖨️ 프린트
        </button>
      `);
    }

    return actions.join('');
  }

  // =================== 이벤트 핸들링 ===================
  attachTicketEventListeners() {
    // 필터 버튼들
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        this.currentFilter.status = e.target.dataset.status.split(',');
        this.renderTickets();
      });
    });

    // 스테이션 필터
    const stationFilter = document.getElementById('stationFilter');
    if (stationFilter) {
      stationFilter.addEventListener('change', (e) => {
        this.currentFilter.station = e.target.value || null;
        this.renderTickets();
      });
    }

    // 새로고침 버튼
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
      this.core.fetchTickets();
      this.showNotification('새로고침 완료', 'success');
    });

    // 화면 정리 버튼
    document.getElementById('cleanupBtn')?.addEventListener('click', () => {
      this.core.cleanup();
    });

    // 아이템 상태 변경 버튼들
    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const itemElement = e.target.closest('.ticket-item');
        const itemId = parseInt(itemElement.dataset.itemId);
        const action = e.target.dataset.action;

        await this.handleItemAction(itemId, action, e.target);
      });
    });

    // 티켓 전체 액션 버튼들
    document.querySelectorAll('.ticket-action-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const ticketElement = e.target.closest('.ticket-card');
        const ticketId = parseInt(ticketElement.dataset.ticketId);
        const action = e.target.dataset.action;

        await this.handleTicketAction(ticketId, action, e.target);
      });
    });
  }

  async handleItemAction(itemId, action, buttonElement) {
    try {
      // 버튼 비활성화
      buttonElement.disabled = true;
      buttonElement.textContent = '처리 중...';

      let newStatus;
      switch (action) {
        case 'start':
          newStatus = 'COOKING';
          break;
        case 'finish':
          newStatus = 'DONE';
          break;
        case 'cancel':
          const reason = prompt('취소 사유를 입력하세요:', '주방에서 취소');
          if (!reason) return;
          newStatus = 'CANCELED';
          await this.core.updateItemStatus(itemId, newStatus, reason);
          return;
        case 'recall':
          newStatus = 'COOKING';
          break;
        default:
          throw new Error('알 수 없는 액션입니다');
      }

      await this.core.updateItemStatus(itemId, newStatus);

    } catch (error) {
      console.error('❌ 아이템 액션 처리 실패:', error);
      this.showNotification(error.message, 'error');
    } finally {
      // UI는 자동으로 업데이트되므로 버튼 복구는 불필요
    }
  }

  async handleTicketAction(ticketId, action, buttonElement) {
    try {
      // 버튼 비활성화
      buttonElement.disabled = true;
      buttonElement.textContent = '처리 중...';

      switch (action) {
        case 'start-all':
          await this.core.startCooking(ticketId);
          break;
        case 'finish-all':
          await this.core.finishCooking(ticketId);
          break;
        case 'print':
          await this.core.printTicket(ticketId);
          break;
        default:
          throw new Error('알 수 없는 액션입니다');
      }

    } catch (error) {
      console.error('❌ 티켓 액션 처리 실패:', error);
      this.showNotification(error.message, 'error');
    } finally {
      // UI는 자동으로 업데이트되므로 버튼 복구는 불필요
    }
  }

  // =================== 기타 렌더링 ===================
  renderStationTabs(stations) {
    console.log('🏪 스테이션 탭 렌더링:', stations);
    // 현재 간단한 필터로 구현되어 있어서 별도 처리 불필요
    this.renderStationFilter();
  }

  renderStationFilter() {
    const stationFilter = document.getElementById('stationFilter');
    if (!stationFilter) return;

    const stations = this.core.getStations();
    const currentValue = stationFilter.value;

    console.log('🏪 스테이션 필터 업데이트:', stations);

    stationFilter.innerHTML = `
      <option value="">모든 스테이션</option>
      ${stations.map(station => `
        <option value="${station.id}">${station.name} (${station.active_tickets})</option>
      `).join('')}
    `;

    stationFilter.value = currentValue;
  }

  renderDashboard(dashboard) {
    console.log('📊 대시보드 업데이트:', dashboard);
    document.getElementById('pendingCount').textContent = dashboard.pending_count || 0;
    document.getElementById('cookingCount').textContent = dashboard.cooking_count || 0;
    document.getElementById('doneCount').textContent = dashboard.done_count || 0;
    document.getElementById('todayCount').textContent = dashboard.served_today || 0;
  }

  updateDashboard(dashboard) {
    this.renderDashboard(dashboard);
  }

  updateStationCounts(stationCounts) {
    console.log('🏪 스테이션 카운트 업데이트:', stationCounts);
    // 스테이션별 카운트 정보 업데이트 로직
  }

  // =================== 유틸리티 ===================
  getStatusLabel(status) {
    const labels = {
      'PENDING': '대기 중',
      'COOKING': '조리 중',
      'DONE': '완료',
      'CANCELED': '취소됨'
    };
    return labels[status] || status;
  }

  showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notificationArea');
    if (!notificationArea) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <button class="notification-close">×</button>
    `;

    notificationArea.appendChild(notification);

    // 자동 제거
    setTimeout(() => {
      notification.remove();
    }, 5000);

    // 닫기 버튼
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
  }

  updateStats() {
    const tickets = this.core.getTickets();
    const stats = {
      total: tickets.length,
      pending: tickets.filter(t => t.status === 'PENDING').length,
      cooking: tickets.filter(t => t.status === 'COOKING').length,
      done: tickets.filter(t => t.status === 'DONE').length
    };

    // 연결 상태 업데이트
    const connectionStatus = document.getElementById('connectionStatus');
    const coreStatus = this.core.getStatus();
    
    if (connectionStatus) {
      const dot = connectionStatus.querySelector('.status-dot');
      const text = connectionStatus.querySelector('.status-text');
      
      if (coreStatus.sseConnected && coreStatus.isPolling) {
        dot.className = 'status-dot connected';
        text.textContent = '연결됨';
      } else {
        dot.className = 'status-dot disconnected';
        text.textContent = '연결 끊김';
      }
    }
  }

  // =================== 사운드 ===================
  initializeSounds() {
    try {
      // 사운드 파일들이 있다면 로드
      // this.sounds.newTicket = new Audio('/sounds/new-ticket.mp3');
      // this.sounds.statusChange = new Audio('/sounds/status-change.mp3');  
      // this.sounds.error = new Audio('/sounds/error.mp3');
    } catch (error) {
      console.warn('⚠️ 사운드 초기화 실패:', error);
    }
  }

  playSound(type) {
    if (!this.config.soundEnabled) return;
    
    try {
      if (this.sounds[type]) {
        this.sounds[type].play().catch(e => console.warn('사운드 재생 실패:', e));
      }
    } catch (error) {
      console.warn('⚠️ 사운드 재생 실패:', error);
    }
  }

  // =================== 시간 업데이트 ===================
  startTimeUpdate() {
    setInterval(() => {
      const timeElement = document.getElementById('currentTime');
      if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString('ko-KR');
      }
    }, 1000);
  }
}

// 전역 인스턴스
window.KDSUI = KDSUI;
console.log('✅ KDS UI v4.0 클래스 등록 완료');
