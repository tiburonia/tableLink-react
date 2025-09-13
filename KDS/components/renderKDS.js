
/**
 * KDS (Kitchen Display System) 메인 컴포넌트
 * - 그리드 카드 기반 주문 관리
 * - WebSocket 실시간 업데이트
 * - 상태별 색상 구분
 * - 터치 친화적 UI
 */

(function() {
  'use strict';

  console.log('🍳 KDS 시스템 초기화 시작');

  // =================== 상태 관리 ===================
  const KDSState = {
    storeId: null,
    currentTab: 'active', // 'active' | 'completed'
    tickets: new Map(), // ticket_id -> ticket data
    socket: null,
    isConnected: false,
    selectedStations: ['KITCHEN', 'GRILL', 'FRY', 'DRINK', 'COLD_STATION'],
    autoRefreshInterval: null
  };

  // =================== WebSocket 관리 ===================
  const WebSocketManager = {
    /**
     * WebSocket 연결 초기화
     */
    async connect(storeId) {
      try {
        const userInfo = this.getUserInfo();
        
        // KDS는 익명 접속도 허용 (주방 직원용)
        const authData = {
          token: userInfo?.token || 'kds-anonymous-token',
          storeId: storeId,
          userId: userInfo?.id || `kds-user-${storeId}`,
          userType: userInfo?.id ? 'authenticated' : 'kds-anonymous'
        };

        console.log('🔌 KDS WebSocket 연결 시도:', authData);

        // Socket.IO 연결
        const socket = io({
          path: '/socket.io',
          auth: authData
        });

        socket.on('connect', () => {
          console.log('✅ KDS WebSocket 연결됨');
          KDSState.isConnected = true;
          this.updateConnectionStatus(true);
          
          // 매장별 룸 조인
          socket.emit('join-kds', storeId);
        });

        socket.on('disconnect', () => {
          console.log('❌ KDS WebSocket 연결 해제');
          KDSState.isConnected = false;
          this.updateConnectionStatus(false);
        });

        // KDS 이벤트 리스너
        socket.on('kds-update', (data) => {
          console.log('📡 KDS 업데이트 수신:', data);
          this.handleKDSUpdate(data);
        });

        socket.on('ticket.created', (ticket) => {
          console.log('🎫 새 티켓 생성:', ticket);
          this.handleTicketCreated(ticket);
        });

        socket.on('item.updated', (data) => {
          console.log('🍽️ 아이템 업데이트:', data);
          this.handleItemUpdated(data);
        });

        socket.on('ticket.updated', (ticket) => {
          console.log('🔄 티켓 업데이트:', ticket);
          this.handleTicketUpdated(ticket);
        });

        socket.on('ticket.hidden', (data) => {
          console.log('👻 티켓 숨김:', data);
          this.handleTicketHidden(data);
        });

        KDSState.socket = socket;
        return socket;

      } catch (error) {
        console.error('❌ WebSocket 연결 실패:', error);
        this.updateConnectionStatus(false);
        throw error;
      }
    },

    /**
     * WebSocket 연결 해제
     */
    disconnect() {
      if (KDSState.socket) {
        KDSState.socket.disconnect();
        KDSState.socket = null;
      }
      KDSState.isConnected = false;
      this.updateConnectionStatus(false);
    },

    /**
     * 연결 상태 UI 업데이트
     */
    updateConnectionStatus(connected) {
      const statusElement = document.getElementById('connectionStatus');
      if (statusElement) {
        statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        statusElement.textContent = connected ? '연결됨' : '연결 안됨';
      }
    },

    /**
     * KDS 업데이트 처리
     */
    handleKDSUpdate(data) {
      switch (data.type) {
        case 'item-status-update':
          this.handleItemUpdated(data.data);
          break;
        case 'new-order':
          this.handleTicketCreated(data.data);
          break;
        case 'order-complete':
          this.handleTicketUpdated(data.data);
          break;
      }
    },

    /**
     * 새 티켓 생성 처리
     */
    handleTicketCreated(ticket) {
      // 티켓 ID 정규화
      const ticketId = ticket.ticket_id || ticket.check_id || ticket.id;
      
      // 이미 존재하는 티켓인지 확인
      if (KDSState.tickets.has(ticketId)) {
        console.log(`🔄 기존 티켓 업데이트: ${ticketId}`);
        this.handleTicketUpdated(ticket);
        return;
      }

      const normalizedTicket = {
        ...ticket,
        ticket_id: ticketId,
        check_id: ticketId,
        table_number: ticket.table_number || 'N/A',
        items: ticket.items || [],
        status: ticket.status || 'pending',
        created_at: ticket.created_at || new Date().toISOString()
      };
      
      console.log(`🎫 새 티켓 생성 처리:`, normalizedTicket);
      
      KDSState.tickets.set(ticketId, normalizedTicket);
      UIRenderer.addTicketCard(normalizedTicket);
      SoundManager.playNewOrderSound();
      
      // 카운트 업데이트
      UIRenderer.updateTicketCounts();
      
      // 빈 상태 숨기기
      UIRenderer.checkEmptyState();
    },

    /**
     * 아이템 업데이트 처리
     */
    handleItemUpdated(data) {
      const ticketId = data.ticket_id;
      const ticket = KDSState.tickets.get(ticketId);
      
      if (ticket && ticket.items) {
        const item = ticket.items.find(i => i.id === data.item_id);
        if (item) {
          item.item_status = data.item_status;
          UIRenderer.updateItemStatus(ticketId, data.item_id, data.item_status);
          this.checkTicketCompletion(ticketId);
        }
      }
    },

    /**
     * 티켓 업데이트 처리
     */
    handleTicketUpdated(ticket) {
      const ticketId = ticket.ticket_id || ticket.id;
      KDSState.tickets.set(ticketId, { ...KDSState.tickets.get(ticketId), ...ticket });
      UIRenderer.updateTicketCard(ticket);
    },

    /**
     * 티켓 숨김 처리
     */
    handleTicketHidden(data) {
      const ticketId = data.ticket_id;
      KDSState.tickets.delete(ticketId);
      UIRenderer.removeTicketCard(ticketId);
    },

    /**
     * 티켓 완료 상태 확인
     */
    checkTicketCompletion(ticketId) {
      const ticket = KDSState.tickets.get(ticketId);
      if (!ticket || !ticket.items) return;

      const allCompleted = ticket.items.every(item => 
        item.item_status === 'ready' || item.item_status === 'served'
      );

      if (allCompleted && ticket.status !== 'completed') {
        // 티켓 완료 처리
        this.updateTicketStatus(ticketId, 'completed');
      }
    },

    /**
     * 아이템 상태 변경 요청
     */
    updateItemStatus(itemId, newStatus) {
      if (KDSState.socket && KDSState.isConnected) {
        KDSState.socket.emit('item:setStatus', {
          item_id: itemId,
          next: newStatus
        });
      }
    },

    /**
     * 티켓 상태 변경 요청
     */
    updateTicketStatus(ticketId, newStatus) {
      const ticket = KDSState.tickets.get(ticketId);
      if (KDSState.socket && KDSState.isConnected && ticket) {
        KDSState.socket.emit('ticket:setStatus', {
          ticket_id: ticketId,
          next: newStatus,
          if_version: ticket.version
        });
      }
    },

    /**
     * 티켓 숨김 요청
     */
    hideTicket(ticketId) {
      if (KDSState.socket && KDSState.isConnected) {
        KDSState.socket.emit('ticket:hide', {
          ticket_id: ticketId
        });
      }
    },

    /**
     * 사용자 정보 가져오기 (KDS용 - 선택적)
     */
    getUserInfo() {
      try {
        // 쿠키에서 조회
        const cookies = document.cookie.split(';').map(cookie => cookie.trim());
        const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

        if (userInfoCookie) {
          const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
          const userInfo = JSON.parse(userInfoValue);
          console.log('✅ KDS 사용자 정보 확인:', userInfo.name || userInfo.id);
          return userInfo;
        }

        // localStorage에서 조회
        const localStorageUserInfo = localStorage.getItem('userInfo');
        if (localStorageUserInfo) {
          const userInfo = JSON.parse(localStorageUserInfo);
          console.log('✅ KDS 사용자 정보 확인 (localStorage):', userInfo.name || userInfo.id);
          return userInfo;
        }

        // window 객체에서 조회
        if (window.userInfo?.id) {
          console.log('✅ KDS 사용자 정보 확인 (window):', window.userInfo.name || window.userInfo.id);
          return window.userInfo;
        }

        console.log('ℹ️ KDS 익명 모드로 실행 (사용자 정보 없음)');
        return null;
      } catch (error) {
        console.warn('⚠️ 사용자 정보 파싱 오류 (KDS 익명 모드로 계속):', error);
        return null;
      }
    }
  };

  // =================== API 서비스 ===================
  const APIService = {
    /**
     * 초기 데이터 로드
     */
    async loadInitialData(storeId) {
      try {
        console.log(`🔄 매장 ${storeId} KDS 데이터 로드 중...`);

        const response = await fetch(`/api/orders/kds/${storeId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log(`✅ KDS 데이터 로드 완료: ${data.orders?.length || 0}개 주문`);
          return data.orders || [];
        } else {
          throw new Error(data.error || 'KDS 데이터 로드 실패');
        }

      } catch (error) {
        console.error('❌ KDS 초기 데이터 로드 실패:', error);
        
        // 네트워크 오류인 경우 더 자세한 정보 제공
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
        }
        
        throw error;
      }
    },

    /**
     * 아이템 상태 업데이트 (HTTP 백업)
     */
    async updateItemStatus(itemId, status, kitchenNotes = null) {
      try {
        const response = await fetch(`/api/orders/kds/items/${itemId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: status,
            kitchenNotes: kitchenNotes
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        console.error('❌ 아이템 상태 업데이트 실패:', error);
        throw error;
      }
    }
  };

  // =================== 사운드 관리 ===================
  const SoundManager = {
    sounds: {
      newOrder: null,
      itemComplete: null,
      orderComplete: null
    },

    /**
     * 사운드 초기화
     */
    initialize() {
      // Web Audio API를 사용한 간단한 사운드
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('⚠️ 사운드 초기화 실패:', error);
      }
    },

    /**
     * 새 주문 사운드 (더 눈에 띄게)
     */
    playNewOrderSound() {
      // 사운드 비활성화 확인
      if (localStorage.getItem('kds-sound-disabled')) {
        console.log('🔇 사운드 비활성화됨');
        return;
      }

      // 더 눈에 띄는 새 주문 알림음
      this.playBeep(1000, 150);
      setTimeout(() => this.playBeep(800, 150), 200);
      setTimeout(() => this.playBeep(1000, 150), 400);
      
      console.log('🔊 새 주문 알림음 재생');
    },

    /**
     * 아이템 완료 사운드
     */
    playItemCompleteSound() {
      this.playBeep(600, 100);
    },

    /**
     * 주문 완료 사운드
     */
    playOrderCompleteSound() {
      this.playBeep(400, 300);
    },

    /**
     * 비프음 재생
     */
    playBeep(frequency, duration) {
      if (!this.audioContext) return;

      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
      } catch (error) {
        console.warn('⚠️ 사운드 재생 실패:', error);
      }
    }
  };

  // =================== UI 렌더링 ===================
  const UIRenderer = {
    /**
     * 메인 KDS 화면 렌더링
     */
    render(storeId) {
      const main = document.getElementById('main') || document.body;

      main.innerHTML = `
        <div class="kds-container">
          ${this.renderHeader()}
          ${this.renderTabBar()}
          ${this.renderMainContent()}
          ${this.renderFloatingControls()}
        </div>
        ${this.renderStyles()}
      `;

      this.setupEventListeners();
    },

    /**
     * 헤더 렌더링
     */
    renderHeader() {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      return `
        <header class="kds-header">
          <div class="header-left">
            <div class="current-time">${timeString}</div>
            <div class="store-info">매장 ${KDSState.storeId}</div>
          </div>
          
          <div class="header-center">
            <h1 class="kds-title">
              <span class="title-icon">🍳</span>
              Kitchen Display System
            </h1>
          </div>
          
          <div class="header-right">
            <div id="connectionStatus" class="connection-status disconnected">연결 안됨</div>
            <button class="settings-btn" onclick="KDSManager.showSettings()">
              <span>⚙️</span>
            </button>
            <button class="refresh-btn" onclick="KDSManager.refresh()">
              <span>🔄</span>
            </button>
          </div>
        </header>
      `;
    },

    /**
     * 탭 바 렌더링
     */
    renderTabBar() {
      return `
        <div class="kds-tabs">
          <button class="tab-btn ${KDSState.currentTab === 'active' ? 'active' : ''}" 
                  data-tab="active" onclick="KDSManager.switchTab('active')">
            <span class="tab-icon">🔥</span>
            <span class="tab-text">진행중 주문</span>
            <span class="tab-count" id="activeCount">0</span>
          </button>
          
          <button class="tab-btn ${KDSState.currentTab === 'completed' ? 'active' : ''}" 
                  data-tab="completed" onclick="KDSManager.switchTab('completed')">
            <span class="tab-icon">✅</span>
            <span class="tab-text">완료된 주문</span>
            <span class="tab-count" id="completedCount">0</span>
          </button>
        </div>
      `;
    },

    /**
     * 메인 콘텐츠 렌더링
     */
    renderMainContent() {
      return `
        <main class="kds-main">
          <div class="tickets-grid" id="ticketsGrid">
            <div class="empty-state" id="emptyState">
              <div class="empty-icon">🍽️</div>
              <h3>주문이 없습니다</h3>
              <p>새로운 주문을 기다리고 있습니다...</p>
            </div>
          </div>
        </main>
      `;
    },

    /**
     * 플로팅 컨트롤 렌더링
     */
    renderFloatingControls() {
      return `
        <div class="floating-controls">
          <button class="control-btn" onclick="KDSManager.clearCompleted()" title="완료된 주문 정리">
            <span>🗑️</span>
          </button>
          <button class="control-btn" onclick="KDSManager.toggleSound()" title="사운드 켜기/끄기">
            <span id="soundIcon">🔊</span>
          </button>
        </div>
      `;
    },

    /**
     * 티켓 카드 추가
     */
    addTicketCard(ticket) {
      const grid = document.getElementById('ticketsGrid');
      const emptyState = document.getElementById('emptyState');
      
      if (emptyState) {
        emptyState.style.display = 'none';
      }

      const cardHTML = this.createTicketCardHTML(ticket);
      const cardElement = document.createElement('div');
      cardElement.innerHTML = cardHTML;
      const card = cardElement.firstElementChild;
      
      // 애니메이션 효과
      card.style.transform = 'scale(0.8)';
      card.style.opacity = '0';
      
      grid.appendChild(card);
      
      // 애니메이션 실행
      requestAnimationFrame(() => {
        card.style.transition = 'all 0.3s ease';
        card.style.transform = 'scale(1)';
        card.style.opacity = '1';
      });

      this.updateTicketCounts();
    },

    /**
     * 티켓 카드 HTML 생성
     */
    createTicketCardHTML(ticket) {
      const elapsedTime = this.getElapsedTime(ticket.created_at);
      const statusClass = this.getStatusClass(ticket.status);
      const progressPercent = this.calculateProgress(ticket.items);

      return `
        <div class="ticket-card ${statusClass}" data-ticket-id="${ticket.check_id || ticket.id}">
          <div class="ticket-header">
            <div class="ticket-info">
              <span class="table-number">${ticket.table_number || 'N/A'}</span>
              <span class="elapsed-time">${elapsedTime}</span>
            </div>
            <div class="ticket-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <span class="progress-text">${Math.round(progressPercent)}%</span>
            </div>
          </div>

          <div class="ticket-body">
            <div class="order-items">
              ${ticket.items.map(item => this.createItemHTML(item)).join('')}
            </div>
          </div>

          <div class="ticket-footer">
            <div class="ticket-actions">
              <button class="action-btn start-btn" onclick="KDSManager.startCooking('${ticket.check_id || ticket.id}')"
                      ${ticket.status === 'preparing' ? 'disabled' : ''}>
                <span>🔥</span> 조리 시작
              </button>
              <button class="action-btn complete-btn" onclick="KDSManager.markComplete('${ticket.check_id || ticket.id}')"
                      ${progressPercent < 100 ? 'disabled' : ''}>
                <span>✅</span> 완료
              </button>
              <button class="action-btn hide-btn" onclick="KDSManager.hideTicket('${ticket.check_id || ticket.id}')">
                <span>👻</span> 숨김
              </button>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * 아이템 HTML 생성
     */
    createItemHTML(item) {
      const statusIcon = this.getItemStatusIcon(item.status);
      const statusClass = this.getItemStatusClass(item.status);
      const itemName = item.menuName || item.menu_name || '메뉴명 없음';
      const quantity = item.quantity || 1;

      return `
        <div class="order-item ${statusClass}" data-item-id="${item.id}">
          <div class="item-info">
            <span class="item-quantity">×${quantity}</span>
            <span class="item-name">${itemName}</span>
            ${item.cook_station ? `<span class="cook-station">${item.cook_station}</span>` : ''}
          </div>
          <div class="item-status">
            <button class="status-btn" onclick="KDSManager.toggleItemStatus('${item.id}', '${item.status || 'pending'}')">
              <span class="status-icon">${statusIcon}</span>
            </button>
          </div>
        </div>
      `;
    },

    /**
     * 아이템 상태 업데이트
     */
    updateItemStatus(ticketId, itemId, status) {
      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!card) return;

      const item = card.querySelector(`[data-item-id="${itemId}"]`);
      if (!item) return;

      // 상태 클래스 업데이트
      item.className = `order-item ${this.getItemStatusClass(status)}`;
      
      // 아이콘 업데이트
      const statusIcon = item.querySelector('.status-icon');
      if (statusIcon) {
        statusIcon.textContent = this.getItemStatusIcon(status);
      }

      // 티켓 진행률 업데이트
      this.updateTicketProgress(ticketId);
    },

    /**
     * 티켓 카드 업데이트
     */
    updateTicketCard(ticket) {
      const card = document.querySelector(`[data-ticket-id="${ticket.ticket_id || ticket.id}"]`);
      if (!card) return;

      // 상태 클래스 업데이트
      card.className = `ticket-card ${this.getStatusClass(ticket.status)}`;

      // 진행률 업데이트
      this.updateTicketProgress(ticket.ticket_id || ticket.id);

      // 버튼 상태 업데이트
      this.updateTicketButtons(card, ticket);
    },

    /**
     * 티켓 카드 제거
     */
    removeTicketCard(ticketId) {
      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!card) return;

      card.style.transition = 'all 0.3s ease';
      card.style.transform = 'scale(0.8)';
      card.style.opacity = '0';

      setTimeout(() => {
        card.remove();
        this.updateTicketCounts();
        this.checkEmptyState();
      }, 300);
    },

    /**
     * 티켓 진행률 업데이트
     */
    updateTicketProgress(ticketId) {
      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!card) return;

      const ticket = KDSState.tickets.get(ticketId);
      if (!ticket || !ticket.items) return;

      const progressPercent = this.calculateProgress(ticket.items);
      
      const progressFill = card.querySelector('.progress-fill');
      const progressText = card.querySelector('.progress-text');
      
      if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
      }
      
      if (progressText) {
        progressText.textContent = `${Math.round(progressPercent)}%`;
      }

      // 완료 버튼 활성화 상태
      const completeBtn = card.querySelector('.complete-btn');
      if (completeBtn) {
        completeBtn.disabled = progressPercent < 100;
      }
    },

    /**
     * 티켓 버튼 상태 업데이트
     */
    updateTicketButtons(card, ticket) {
      const startBtn = card.querySelector('.start-btn');
      const completeBtn = card.querySelector('.complete-btn');

      if (startBtn) {
        startBtn.disabled = ticket.status === 'preparing' || ticket.status === 'ready';
      }

      if (completeBtn) {
        const progress = this.calculateProgress(ticket.items);
        completeBtn.disabled = progress < 100;
      }
    },

    /**
     * 진행률 계산
     */
    calculateProgress(items) {
      if (!items || items.length === 0) return 0;

      const completedItems = items.filter(item => 
        item.status === 'ready' || item.status === 'served' || 
        item.item_status === 'ready' || item.item_status === 'served'
      ).length;

      return (completedItems / items.length) * 100;
    },

    /**
     * 상태별 클래스 반환
     */
    getStatusClass(status) {
      switch (status) {
        case 'ordered':
        case 'pending': return 'status-pending';
        case 'preparing': 
        case 'cooking': return 'status-cooking';
        case 'ready':
        case 'completed': return 'status-completed';
        default: return 'status-pending';
      }
    },

    /**
     * 아이템 상태별 클래스 반환
     */
    getItemStatusClass(status) {
      switch (status) {
        case 'ordered':
        case 'pending': return 'item-pending';
        case 'preparing':
        case 'cooking': return 'item-cooking';
        case 'ready': return 'item-ready';
        case 'served': return 'item-served';
        default: return 'item-pending';
      }
    },

    /**
     * 아이템 상태별 아이콘 반환
     */
    getItemStatusIcon(status) {
      switch (status) {
        case 'ordered':
        case 'pending': return '⏳';
        case 'preparing':
        case 'cooking': return '🔥';
        case 'ready': return '✅';
        case 'served': return '🍽️';
        default: return '⏳';
      }
    },

    /**
     * 경과 시간 계산
     */
    getElapsedTime(createdAt) {
      const now = new Date();
      const created = new Date(createdAt);
      const diffMs = now - created;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 60) {
        return `${diffMins}분`;
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}시간 ${mins}분`;
      }
    },

    /**
     * 티켓 수 업데이트
     */
    updateTicketCounts() {
      const activeTickets = Array.from(KDSState.tickets.values()).filter(t => 
        t.status !== 'completed' && t.status !== 'served'
      );
      const completedTickets = Array.from(KDSState.tickets.values()).filter(t => 
        t.status === 'completed' || t.status === 'served'
      );

      const activeCount = document.getElementById('activeCount');
      const completedCount = document.getElementById('completedCount');

      if (activeCount) activeCount.textContent = activeTickets.length;
      if (completedCount) completedCount.textContent = completedTickets.length;
    },

    /**
     * 빈 상태 확인
     */
    checkEmptyState() {
      const grid = document.getElementById('ticketsGrid');
      const emptyState = document.getElementById('emptyState');
      const cards = grid.querySelectorAll('.ticket-card');

      if (emptyState) {
        emptyState.style.display = cards.length === 0 ? 'flex' : 'none';
      }
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
      // 시간 업데이트
      setInterval(() => {
        const timeElement = document.querySelector('.current-time');
        if (timeElement) {
          const now = new Date();
          timeElement.textContent = now.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
        }

        // 경과 시간 업데이트
        document.querySelectorAll('.elapsed-time').forEach(element => {
          const card = element.closest('.ticket-card');
          const ticketId = card?.dataset.ticketId;
          const ticket = KDSState.tickets.get(ticketId);
          
          if (ticket) {
            element.textContent = this.getElapsedTime(ticket.created_at);
          }
        });
      }, 60000); // 1분마다
    },

    /**
     * CSS 스타일 렌더링
     */
    renderStyles() {
      return `
        <style>
          /* 전체 레이아웃 */
          .kds-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100vh;
            background: #f5f7fa;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            overflow: hidden;
          }

          /* 헤더 */
          .kds-header {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            flex-shrink: 0;
          }

          .header-left {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .current-time {
            font-size: 24px;
            font-weight: 700;
            color: #ecf0f1;
          }

          .store-info {
            font-size: 14px;
            color: #bdc3c7;
          }

          .header-center {
            flex: 1;
            text-align: center;
          }

          .kds-title {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }

          .title-icon {
            font-size: 32px;
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .connection-status {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .connection-status.connected {
            background: #27ae60;
            color: white;
          }

          .connection-status.disconnected {
            background: #e74c3c;
            color: white;
          }

          .settings-btn, .refresh-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 12px;
            padding: 12px;
            color: white;
            cursor: pointer;
            font-size: 18px;
            transition: background 0.3s ease;
          }

          .settings-btn:hover, .refresh-btn:hover {
            background: rgba(255,255,255,0.3);
          }

          /* 탭 바 */
          .kds-tabs {
            background: white;
            padding: 0 30px;
            display: flex;
            border-bottom: 2px solid #ecf0f1;
            flex-shrink: 0;
          }

          .tab-btn {
            background: none;
            border: none;
            padding: 20px 30px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 16px;
            font-weight: 600;
            color: #7f8c8d;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
          }

          .tab-btn.active {
            color: #2c3e50;
            border-bottom-color: #3498db;
          }

          .tab-btn:hover {
            color: #2c3e50;
            background: #f8f9fa;
          }

          .tab-icon {
            font-size: 20px;
          }

          .tab-count {
            background: #3498db;
            color: white;
            border-radius: 12px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 700;
            min-width: 20px;
            text-align: center;
          }

          .tab-btn.active .tab-count {
            background: #e74c3c;
          }

          /* 메인 영역 */
          .kds-main {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
            overflow-x: hidden;
          }

          /* 티켓 그리드 */
          .tickets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 25px;
            align-items: start;
          }

          /* 빈 상태 */
          .empty-state {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px 20px;
            color: #95a5a6;
            text-align: center;
          }

          .empty-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }

          .empty-state h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
            color: #7f8c8d;
          }

          .empty-state p {
            margin: 0;
            font-size: 16px;
          }

          /* 티켓 카드 */
          .ticket-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            overflow: hidden;
            transition: all 0.3s ease;
            border-left: 6px solid #bdc3c7;
          }

          .ticket-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          }

          /* 상태별 색상 */
          .ticket-card.status-pending {
            border-left-color: #f39c12;
          }

          .ticket-card.status-cooking {
            border-left-color: #e74c3c;
            animation: pulse 2s infinite;
          }

          .ticket-card.status-completed {
            border-left-color: #27ae60;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }

          /* 티켓 헤더 */
          .ticket-header {
            padding: 20px 25px 15px;
            border-bottom: 1px solid #ecf0f1;
          }

          .ticket-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }

          .table-number {
            font-size: 24px;
            font-weight: 700;
            color: #2c3e50;
          }

          .elapsed-time {
            font-size: 16px;
            color: #e74c3c;
            font-weight: 600;
            background: #fdedec;
            padding: 6px 12px;
            border-radius: 12px;
          }

          .ticket-progress {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .progress-bar {
            flex: 1;
            height: 8px;
            background: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3498db, #2ecc71);
            border-radius: 4px;
            transition: width 0.5s ease;
          }

          .progress-text {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
            min-width: 40px;
          }

          /* 티켓 바디 */
          .ticket-body {
            padding: 20px 25px;
          }

          .order-items {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .order-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border-radius: 12px;
            transition: all 0.3s ease;
          }

          .order-item.item-pending {
            background: #fdf6e3;
            border: 1px solid #f39c12;
          }

          .order-item.item-cooking {
            background: #fdedec;
            border: 1px solid #e74c3c;
          }

          .order-item.item-ready {
            background: #eafaf1;
            border: 1px solid #27ae60;
          }

          .order-item.item-served {
            background: #f8f9fa;
            border: 1px solid #95a5a6;
            opacity: 0.7;
          }

          .item-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .item-quantity {
            background: #3498db;
            color: white;
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 700;
            min-width: 30px;
            text-align: center;
          }

          .item-name {
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
          }

          .status-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 20px;
            padding: 8px;
            border-radius: 8px;
            transition: background 0.3s ease;
          }

          .status-btn:hover {
            background: rgba(52, 152, 219, 0.1);
          }

          /* 티켓 푸터 */
          .ticket-footer {
            padding: 15px 25px 20px;
            border-top: 1px solid #ecf0f1;
          }

          .ticket-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .action-btn {
            flex: 1;
            min-width: 100px;
            padding: 12px 16px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }

          .start-btn {
            background: #f39c12;
            color: white;
          }

          .start-btn:hover:not(:disabled) {
            background: #e67e22;
          }

          .complete-btn {
            background: #27ae60;
            color: white;
          }

          .complete-btn:hover:not(:disabled) {
            background: #229954;
          }

          .hide-btn {
            background: #95a5a6;
            color: white;
          }

          .hide-btn:hover {
            background: #7f8c8d;
          }

          .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* 플로팅 컨트롤 */
          .floating-controls {
            position: fixed;
            bottom: 30px;
            right: 30px;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .control-btn {
            width: 60px;
            height: 60px;
            border: none;
            border-radius: 50%;
            background: #3498db;
            color: white;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(52, 152, 219, 0.3);
            transition: all 0.3s ease;
          }

          .control-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(52, 152, 219, 0.4);
          }

          /* 반응형 */
          @media (max-width: 1200px) {
            .tickets-grid {
              grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
              gap: 20px;
            }

            .kds-header {
              padding: 15px 20px;
            }

            .kds-main {
              padding: 20px;
            }
          }

          @media (max-width: 768px) {
            .kds-header {
              flex-direction: column;
              gap: 15px;
              text-align: center;
            }

            .header-left,
            .header-right {
              order: 2;
            }

            .header-center {
              order: 1;
            }

            .kds-title {
              font-size: 24px;
            }

            .tickets-grid {
              grid-template-columns: 1fr;
              gap: 15px;
            }

            .kds-tabs {
              padding: 0 20px;
            }

            .tab-btn {
              padding: 15px 20px;
              font-size: 14px;
            }

            .floating-controls {
              bottom: 20px;
              right: 20px;
            }

            .control-btn {
              width: 50px;
              height: 50px;
              font-size: 20px;
            }
          }
        </style>
      `;
    }
  };

  // =================== 메인 KDS 매니저 ===================
  window.KDSManager = {
    /**
     * KDS 시스템 초기화
     */
    async initialize(storeId) {
      try {
        console.log(`🍳 KDS 시스템 초기화 - 매장 ${storeId}`);

        KDSState.storeId = storeId;

        // UI 렌더링
        UIRenderer.render(storeId);

        // 사운드 초기화
        SoundManager.initialize();

        // 초기 데이터 로드
        const tickets = await APIService.loadInitialData(storeId);
        
        // 티켓 데이터 저장
        tickets.forEach(ticket => {
          KDSState.tickets.set(ticket.check_id || ticket.id, ticket);
        });

        // 티켓 카드 렌더링
        tickets.forEach(ticket => {
          UIRenderer.addTicketCard(ticket);
        });

        // WebSocket 연결
        await WebSocketManager.connect(storeId);

        // 자동 새로고침 설정
        this.setupAutoRefresh();

        console.log('✅ KDS 시스템 초기화 완료');

      } catch (error) {
        console.error('❌ KDS 시스템 초기화 실패:', error);
        this.showError('KDS 시스템을 초기화할 수 없습니다: ' + error.message);
      }
    },

    /**
     * 탭 전환
     */
    switchTab(tab) {
      KDSState.currentTab = tab;
      
      // 탭 버튼 활성화
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });

      // 티켓 필터링
      this.filterTickets();
    },

    /**
     * 티켓 필터링
     */
    filterTickets() {
      const cards = document.querySelectorAll('.ticket-card');
      
      cards.forEach(card => {
        const ticketId = card.dataset.ticketId;
        const ticket = KDSState.tickets.get(ticketId);
        
        if (!ticket) return;

        let shouldShow = false;
        
        if (KDSState.currentTab === 'active') {
          shouldShow = ticket.status !== 'completed' && ticket.status !== 'served';
        } else if (KDSState.currentTab === 'completed') {
          shouldShow = ticket.status === 'completed' || ticket.status === 'served';
        }

        card.style.display = shouldShow ? 'block' : 'none';
      });

      UIRenderer.checkEmptyState();
    },

    /**
     * 조리 시작
     */
    async startCooking(ticketId) {
      try {
        const ticket = KDSState.tickets.get(ticketId);
        if (!ticket) return;

        // 모든 아이템을 조리 중으로 변경
        for (const item of ticket.items) {
          if (item.status === 'ordered' || item.status === 'pending') {
            await this.updateItemStatus(item.id, 'preparing');
          }
        }

        SoundManager.playItemCompleteSound();

      } catch (error) {
        console.error('❌ 조리 시작 실패:', error);
        this.showError('조리 시작 처리 중 오류가 발생했습니다.');
      }
    },

    /**
     * 주문 완료
     */
    async markComplete(ticketId) {
      try {
        const ticket = KDSState.tickets.get(ticketId);
        if (!ticket) return;

        // 모든 아이템을 완료로 변경
        for (const item of ticket.items) {
          if (item.status !== 'ready' && item.status !== 'served') {
            await this.updateItemStatus(item.id, 'ready');
          }
        }

        SoundManager.playOrderCompleteSound();

      } catch (error) {
        console.error('❌ 주문 완료 실패:', error);
        this.showError('주문 완료 처리 중 오류가 발생했습니다.');
      }
    },

    /**
     * 아이템 상태 토글
     */
    async toggleItemStatus(itemId, currentStatus) {
      try {
        let nextStatus;
        
        switch (currentStatus) {
          case 'ordered':
          case 'pending':
            nextStatus = 'preparing';
            break;
          case 'preparing':
            nextStatus = 'ready';
            break;
          case 'ready':
            nextStatus = 'served';
            break;
          default:
            return;
        }

        await this.updateItemStatus(itemId, nextStatus);

      } catch (error) {
        console.error('❌ 아이템 상태 변경 실패:', error);
        this.showError('아이템 상태 변경 중 오류가 발생했습니다.');
      }
    },

    /**
     * 아이템 상태 업데이트
     */
    async updateItemStatus(itemId, status) {
      try {
        // WebSocket으로 우선 시도
        if (KDSState.isConnected) {
          WebSocketManager.updateItemStatus(itemId, status);
        } else {
          // HTTP API로 백업
          await APIService.updateItemStatus(itemId, status);
        }

      } catch (error) {
        console.error('❌ 아이템 상태 업데이트 실패:', error);
        throw error;
      }
    },

    /**
     * 티켓 숨김
     */
    hideTicket(ticketId) {
      if (KDSState.isConnected) {
        WebSocketManager.hideTicket(ticketId);
      } else {
        // 로컬에서 즉시 제거
        UIRenderer.removeTicketCard(ticketId);
        KDSState.tickets.delete(ticketId);
      }
    },

    /**
     * 완료된 주문 정리
     */
    clearCompleted() {
      const completedTickets = Array.from(KDSState.tickets.values())
        .filter(ticket => ticket.status === 'completed' || ticket.status === 'served');

      completedTickets.forEach(ticket => {
        this.hideTicket(ticket.check_id || ticket.id);
      });
    },

    /**
     * 사운드 토글
     */
    toggleSound() {
      const icon = document.getElementById('soundIcon');
      // 사운드 설정 토글 로직 (로컬 저장소 활용)
      const soundEnabled = !localStorage.getItem('kds-sound-disabled');
      localStorage.setItem('kds-sound-disabled', soundEnabled ? 'true' : '');
      
      if (icon) {
        icon.textContent = soundEnabled ? '🔇' : '🔊';
      }
    },

    /**
     * 설정 화면 표시
     */
    showSettings() {
      alert('설정 기능은 추후 구현 예정입니다.');
    },

    /**
     * 새로고침
     */
    async refresh() {
      try {
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
          refreshBtn.style.transform = 'rotate(360deg)';
        }

        // 데이터 다시 로드
        const tickets = await APIService.loadInitialData(KDSState.storeId);
        
        // 기존 카드 제거
        document.querySelectorAll('.ticket-card').forEach(card => card.remove());
        
        // 상태 초기화
        KDSState.tickets.clear();
        
        // 새 데이터로 렌더링
        tickets.forEach(ticket => {
          KDSState.tickets.set(ticket.check_id || ticket.id, ticket);
          UIRenderer.addTicketCard(ticket);
        });

        setTimeout(() => {
          if (refreshBtn) {
            refreshBtn.style.transform = '';
          }
        }, 500);

      } catch (error) {
        console.error('❌ 새로고침 실패:', error);
        this.showError('데이터 새로고침 중 오류가 발생했습니다.');
      }
    },

    /**
     * 자동 새로고침 설정
     */
    setupAutoRefresh() {
      // 5분마다 자동 새로고침
      KDSState.autoRefreshInterval = setInterval(() => {
        if (!KDSState.isConnected) {
          console.log('🔄 WebSocket 연결 안됨, 자동 새로고침 실행');
          this.refresh();
        }
      }, 5 * 60 * 1000);
    },

    /**
     * 정리
     */
    cleanup() {
      if (KDSState.autoRefreshInterval) {
        clearInterval(KDSState.autoRefreshInterval);
      }
      
      WebSocketManager.disconnect();
    },

    /**
     * 오류 표시
     */
    showError(message) {
      // 간단한 오류 표시 (추후 토스트나 모달로 개선 가능)
      alert(message);
    }
  };

  // =================== 전역 KDS 함수 ===================
  window.renderKDS = async function(storeId) {
    console.log('🍳 KDS 렌더링 시작 - 매장:', storeId);

    try {
      if (!storeId) {
        throw new Error('매장 ID가 필요합니다');
      }

      await KDSManager.initialize(storeId);

    } catch (error) {
      console.error('❌ KDS 렌더링 실패:', error);
      
      // 오류 화면 렌더링
      const main = document.getElementById('main') || document.body;
      main.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 20px;">🚨</div>
          <h1 style="color: #e74c3c; margin-bottom: 10px;">KDS 시스템 오류</h1>
          <p style="color: #7f8c8d; margin-bottom: 30px;">${error.message}</p>
          <button onclick="location.reload()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer;">
            페이지 새로고침
          </button>
        </div>
      `;
    }
  };

  // 페이지 언로드 시 정리
  window.addEventListener('beforeunload', () => {
    KDSManager.cleanup();
  });

  console.log('✅ KDS 시스템 모듈 로드 완료');
})();
