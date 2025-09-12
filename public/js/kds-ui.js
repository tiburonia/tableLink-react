
/**
 * KDS UI 렌더링 모듈 v3.0
 * 책임: 현대적 UI 렌더링, 사용자 상호작용, 애니메이션
 */

window.KDSUI = {
  // 현재 상태
  currentStationId: 'all',
  currentStatus: null,
  isCompactMode: false,
  
  // 초기화
  init(containerId = 'app') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`컨테이너를 찾을 수 없습니다: ${containerId}`);
    }
    
    console.log('🎨 KDS UI v3.0 초기화');
    this.setupEventListeners();
  },

  // 메인 UI 렌더링
  renderMainInterface(storeId) {
    this.container.innerHTML = `
      <div class="kds-app">
        <!-- 헤더 -->
        <header class="kds-header">
          <div class="kds-header-left">
            <div class="kds-logo">
              <span class="logo-icon">🍳</span>
              <h1>TableLink KDS</h1>
            </div>
            <div class="store-badge">
              <span class="badge-label">매장</span>
              <span class="badge-value" id="storeName">${storeId}</span>
            </div>
          </div>
          
          <div class="kds-header-center">
            <div class="dashboard-summary" id="dashboardSummary">
              <div class="summary-item">
                <span class="summary-value" id="pendingCount">-</span>
                <span class="summary-label">대기</span>
              </div>
              <div class="summary-item cooking">
                <span class="summary-value" id="cookingCount">-</span>
                <span class="summary-label">조리중</span>
              </div>
              <div class="summary-item done">
                <span class="summary-value" id="doneCount">-</span>
                <span class="summary-label">완료</span>
              </div>
            </div>
          </div>
          
          <div class="kds-header-right">
            <div class="status-indicators">
              <div class="connection-status" id="connectionStatus">
                <span class="status-dot"></span>
                <span class="status-text">연결중...</span>
              </div>
              <div class="current-time" id="currentTime">--:--</div>
            </div>
            
            <div class="header-controls">
              <button class="control-btn compact-toggle" id="compactToggle" title="컴팩트 모드">
                📱
              </button>
              <button class="control-btn refresh-btn" id="refreshBtn" title="새로고침">
                🔄
              </button>
              <button class="control-btn settings-btn" id="settingsBtn" title="설정">
                ⚙️
              </button>
            </div>
          </div>
        </header>

        <!-- 스테이션 탭 -->
        <nav class="station-tabs" id="stationTabs">
          <div class="tabs-container">
            <button class="station-tab active" data-station="all">
              <span class="tab-icon">📋</span>
              <span class="tab-label">전체</span>
              <span class="tab-counter" id="counter-all">0</span>
            </button>
          </div>
        </nav>

        <!-- 필터 바 -->
        <div class="filter-bar" id="filterBar">
          <div class="filter-group">
            <button class="filter-btn active" data-status="">전체</button>
            <button class="filter-btn" data-status="PENDING">대기중</button>
            <button class="filter-btn" data-status="COOKING">조리중</button>
            <button class="filter-btn" data-status="DONE">완료</button>
          </div>
        </div>

        <!-- 메인 컨텐츠 -->
        <main class="kds-main" id="kdsMain">
          <div class="loading-overlay" id="loadingOverlay">
            <div class="loading-spinner"></div>
            <p>KDS 시스템 로딩 중...</p>
          </div>
          
          <div class="tickets-grid" id="ticketsGrid">
            <!-- 티켓들이 여기에 렌더링됩니다 -->
          </div>
          
          <div class="empty-state" id="emptyState" style="display: none;">
            <div class="empty-icon">📋</div>
            <h3>주문 대기 중</h3>
            <p>새로운 주문이 들어오면 자동으로 표시됩니다</p>
          </div>
        </main>

        <!-- 알림 토스트 -->
        <div class="toast-container" id="toastContainer"></div>
      </div>
    `;

    this.startClock();
  },

  // 스테이션 탭 렌더링
  renderStationTabs(stations) {
    const tabsContainer = document.querySelector('#stationTabs .tabs-container');
    
    let tabsHTML = `
      <button class="station-tab ${this.currentStationId === 'all' ? 'active' : ''}" data-station="all">
        <span class="tab-icon">📋</span>
        <span class="tab-label">전체</span>
        <span class="tab-counter" id="counter-all">0</span>
      </button>
    `;

    stations.forEach(station => {
      const isActive = this.currentStationId === station.id.toString();
      const stationIcon = this.getStationIcon(station);
      
      tabsHTML += `
        <button class="station-tab ${isActive ? 'active' : ''} ${station.is_expo ? 'expo' : ''}" 
                data-station="${station.id}">
          <span class="tab-icon">${stationIcon}</span>
          <span class="tab-label">${station.name}</span>
          <span class="tab-counter" id="counter-${station.id}">0</span>
        </button>
      `;
    });

    tabsContainer.innerHTML = tabsHTML;
  },

  // 티켓 그리드 렌더링
  renderTickets(tickets) {
    const grid = document.getElementById('ticketsGrid');
    const emptyState = document.getElementById('emptyState');
    const loadingOverlay = document.getElementById('loadingOverlay');

    loadingOverlay.style.display = 'none';

    if (tickets.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    grid.style.display = 'grid';

    const ticketsHTML = tickets.map(ticket => this.renderTicketCard(ticket)).join('');
    grid.innerHTML = ticketsHTML;

    // 애니메이션 트리거
    requestAnimationFrame(() => {
      grid.querySelectorAll('.ticket-card').forEach((card, index) => {
        setTimeout(() => card.classList.add('animate-in'), index * 50);
      });
    });
  },

  // 개별 티켓 카드 렌더링
  renderTicketCard(ticket) {
    const statusClass = this.getStatusClass(ticket.ticket_status);
    const urgencyClass = this.getUrgencyClass(ticket.elapsed_seconds);
    const sourceIcon = ticket.source_system === 'TLL' ? '📱' : '🖥️';
    const elapsedTime = this.formatElapsedTime(ticket.elapsed_seconds);
    
    let itemsHTML = '';
    if (Array.isArray(ticket.items)) {
      itemsHTML = ticket.items.map(item => `
        <div class="ticket-item">
          <div class="item-main">
            <span class="menu-name">${this.escapeHtml(item.menu_name)}</span>
            <span class="quantity">×${item.quantity}</span>
          </div>
          ${item.options ? `
            <div class="item-options">${this.renderItemOptions(item.options)}</div>
          ` : ''}
          ${item.special_requests ? `
            <div class="item-requests">📝 ${this.escapeHtml(item.special_requests)}</div>
          ` : ''}
        </div>
      `).join('');
    }

    return `
      <div class="ticket-card ${statusClass} ${urgencyClass}" data-ticket-id="${ticket.ticket_id}">
        <!-- 티켓 헤더 -->
        <div class="ticket-header">
          <div class="ticket-info">
            <div class="ticket-number">#${ticket.ticket_id}</div>
            <div class="table-info">
              <span class="table-number">T${ticket.table_number}</span>
              <span class="customer-name">${this.escapeHtml(ticket.customer_name)}</span>
            </div>
          </div>
          <div class="ticket-meta">
            <span class="source-badge">
              ${sourceIcon}
            </span>
            <span class="course-badge">C${ticket.course_no || 1}</span>
          </div>
        </div>

        <!-- 티켓 아이템들 -->
        <div class="ticket-items">
          ${itemsHTML}
        </div>

        <!-- 티켓 상태 및 액션 -->
        <div class="ticket-footer">
          <div class="status-info">
            <span class="status-badge">${this.getStatusText(ticket.ticket_status)}</span>
            ${elapsedTime ? `
              <span class="elapsed-time">
                <span class="time-icon">⏱️</span>
                ${elapsedTime}
              </span>
            ` : ''}
          </div>
          
          <div class="ticket-actions">
            ${this.renderTicketActions(ticket)}
          </div>
        </div>
      </div>
    `;
  },

  // 티켓 액션 버튼 렌더링
  renderTicketActions(ticket) {
    const { ticket_status: status, ticket_id: id } = ticket;

    switch (status) {
      case 'PENDING':
        return `
          <button class="action-btn primary" onclick="KDSUI.handleTicketAction(${id}, 'start')">
            🔥 시작
          </button>
          <button class="action-btn danger" onclick="KDSUI.handleTicketAction(${id}, 'cancel')">
            ❌ 취소
          </button>
        `;

      case 'COOKING':
        return `
          <button class="action-btn success" onclick="KDSUI.handleTicketAction(${id}, 'done')">
            ✅ 완료
          </button>
          <button class="action-btn danger" onclick="KDSUI.handleTicketAction(${id}, 'cancel')">
            ❌ 취소
          </button>
        `;

      case 'DONE':
        return `
          <button class="action-btn serve" onclick="KDSUI.handleTicketAction(${id}, 'serve')">
            🍽️ 서빙
          </button>
          <button class="action-btn secondary" onclick="KDSUI.handleTicketAction(${id}, 'recall')">
            🔄 회수
          </button>
        `;

      default:
        return '';
    }
  },

  // 대시보드 업데이트
  updateDashboard(dashboard) {
    document.getElementById('pendingCount').textContent = dashboard.pending_count || 0;
    document.getElementById('cookingCount').textContent = dashboard.cooking_count || 0;
    document.getElementById('doneCount').textContent = dashboard.done_count || 0;
  },

  // 스테이션 카운터 업데이트
  updateStationCounts(counts) {
    // 전체 카운터
    const totalTickets = Object.values(counts).reduce((sum, count) => sum + count.total, 0);
    const allCounter = document.getElementById('counter-all');
    if (allCounter) {
      allCounter.textContent = totalTickets;
      allCounter.className = `tab-counter ${totalTickets > 0 ? 'has-items' : ''}`;
    }

    // 개별 스테이션 카운터
    Object.entries(counts).forEach(([stationId, count]) => {
      const counter = document.getElementById(`counter-${stationId}`);
      if (counter) {
        counter.textContent = count.total;
        counter.className = `tab-counter ${count.total > 0 ? 'has-items' : ''}`;
      }
    });
  },

  // 연결 상태 업데이트
  updateConnectionStatus(state) {
    const statusElement = document.getElementById('connectionStatus');
    const statusDot = statusElement.querySelector('.status-dot');
    const statusText = statusElement.querySelector('.status-text');

    statusElement.className = `connection-status ${state}`;
    
    switch (state) {
      case 'connected':
        statusText.textContent = '연결됨';
        break;
      case 'connecting':
        statusText.textContent = '연결중...';
        break;
      case 'disconnected':
        statusText.textContent = '연결 끊김';
        break;
    }
  },

  // 스테이션 전환
  switchStation(stationId) {
    this.currentStationId = stationId;
    
    // 탭 활성화
    document.querySelectorAll('.station-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.station === stationId);
    });

    this.emit('station_changed', stationId);
  },

  // 필터 전환
  switchFilter(status) {
    this.currentStatus = status || null;
    
    // 필터 버튼 활성화
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === (status || ''));
    });

    this.emit('filter_changed', status);
  },

  // 티켓 액션 처리
  async handleTicketAction(ticketId, action) {
    try {
      // UI 비활성화
      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (card) {
        card.classList.add('processing');
      }

      // 확인 다이얼로그 (취소의 경우)
      if (action === 'cancel') {
        const confirmed = confirm('정말 이 티켓을 취소하시겠습니까?');
        if (!confirmed) {
          if (card) card.classList.remove('processing');
          return;
        }
      }

      this.emit('ticket_action', { ticketId, action });
      
    } catch (error) {
      console.error('❌ 티켓 액션 처리 실패:', error);
      this.showToast('작업 처리 중 오류가 발생했습니다', 'error');
      
      // UI 복구
      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (card) {
        card.classList.remove('processing');
      }
    }
  },

  // 토스트 알림 표시
  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    
    // 컨테이너가 없으면 콘솔에만 메시지 출력
    if (!container) {
      console.log(`🍞 Toast (${type}):`, message);
      return;
    }
    
    const toast = document.createElement('div');
    
    const icons = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };

    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${this.escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // 애니메이션
    requestAnimationFrame(() => toast.classList.add('show'));

    // 자동 제거
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('hide');
        setTimeout(() => {
          if (toast.parentElement) {
            toast.remove();
          }
        }, 300);
      }
    }, duration);
  },

  // 로딩 상태 표시/숨김
  showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  },

  // 시계 시작
  startClock() {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ko-KR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const timeElement = document.getElementById('currentTime');
      if (timeElement) {
        timeElement.textContent = timeString;
      }
    };

    updateTime();
    setInterval(updateTime, 1000);
  },

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 스테이션 탭 클릭
    document.addEventListener('click', (e) => {
      if (e.target.closest('.station-tab')) {
        const stationId = e.target.closest('.station-tab').dataset.station;
        this.switchStation(stationId);
      }
    });

    // 필터 버튼 클릭
    document.addEventListener('click', (e) => {
      if (e.target.closest('.filter-btn')) {
        const status = e.target.closest('.filter-btn').dataset.status;
        this.switchFilter(status);
      }
    });

    // 새로고침 버튼
    document.addEventListener('click', (e) => {
      if (e.target.closest('#refreshBtn')) {
        this.emit('refresh_requested');
      }
    });

    // 컴팩트 모드 토글
    document.addEventListener('click', (e) => {
      if (e.target.closest('#compactToggle')) {
        this.toggleCompactMode();
      }
    });

    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            this.emit('refresh_requested');
            break;
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
            e.preventDefault();
            const tabs = document.querySelectorAll('.station-tab');
            const index = parseInt(e.key) - 1;
            if (tabs[index]) {
              const stationId = tabs[index].dataset.station;
              this.switchStation(stationId);
            }
            break;
        }
      }
    });
  },

  // 컴팩트 모드 토글
  toggleCompactMode() {
    this.isCompactMode = !this.isCompactMode;
    document.body.classList.toggle('compact-mode', this.isCompactMode);
    
    const toggle = document.getElementById('compactToggle');
    if (toggle) {
      toggle.textContent = this.isCompactMode ? '🖥️' : '📱';
    }
  },

  // 유틸리티 함수들
  getStationIcon(station) {
    const icons = {
      'KITCHEN': '🍳',
      'BEVERAGE': '🥤',
      'DESSERT': '🍰',
      'EXPO': '🍽️'
    };
    return icons[station.code] || '🏪';
  },

  getStatusClass(status) {
    const classes = {
      'PENDING': 'status-pending',
      'COOKING': 'status-cooking', 
      'DONE': 'status-done',
      'SERVED': 'status-served',
      'CANCELED': 'status-canceled'
    };
    return classes[status] || '';
  },

  getUrgencyClass(elapsedSeconds) {
    if (!elapsedSeconds) return '';
    
    const minutes = elapsedSeconds / 60;
    if (minutes > 30) return 'urgent-critical';
    if (minutes > 15) return 'urgent-high';
    if (minutes > 10) return 'urgent-medium';
    return '';
  },

  getStatusText(status) {
    const texts = {
      'PENDING': '대기중',
      'COOKING': '조리중',
      'DONE': '완료',
      'SERVED': '서빙완료',
      'CANCELED': '취소됨'
    };
    return texts[status] || status;
  },

  formatElapsedTime(seconds) {
    if (!seconds || seconds < 0) return '';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins === 0) {
      return `${secs}초`;
    } else {
      return `${mins}분 ${secs}초`;
    }
  },

  renderItemOptions(options) {
    if (!options) return '';
    
    if (typeof options === 'string') {
      return this.escapeHtml(options);
    }
    
    if (typeof options === 'object') {
      return Object.entries(options)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    
    return '';
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // 이벤트 시스템
  listeners: new Set(),

  on(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  emit(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ UI 이벤트 콜백 실행 실패:', error);
      }
    });
  }
};

console.log('✅ KDS UI v3.0 모듈 로드 완료');
