/**
 * KDS Core v3.0 - WebSocket 전용 버전
 * SSE 제거하고 완전한 WebSocket 기반으로 변경
 */

class KDSCore {
  constructor(config = {}) {
    this.config = {
      storeId: config.storeId || 330,
      apiBase: config.apiBase || '/api/kds',
      pollingInterval: config.pollingInterval || 3000,
      reconnectDelay: config.reconnectDelay || 2000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      debug: config.debug || false,
      ...config
    };

    this.state = {
      tickets: new Map(),
      stations: new Map(),
      dashboard: {},
      filter: { status: 'ALL', station: 'ALL' },
      isConnected: false,
      retryCount: 0
    };

    this.wsConnection = null;
    this.pollingTimer = null;
    this.eventHandlers = new Map();

    console.log('🚀 KDS Core v3.0 초기화 (WebSocket 전용) - 매장:', this.config.storeId);
  }

  // =================== 이벤트 시스템 ===================
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`❌ 이벤트 핸들러 오류 (${event}):`, error);
      }
    });
  }

  // =================== 초기화 ===================
  async initialize() {
    try {
      console.log('🔄 KDS Core 초기화 시작...');

      // 초기 데이터 로드
      await Promise.all([
        this.fetchStations(),
        this.fetchTickets(),
        this.fetchDashboard()
      ]);

      // WebSocket 연결
      this.connectWebSocket();

      // 폴링 백업 시작
      this.startPolling();

      console.log('✅ KDS Core 초기화 완료');
      this.emit('initialized');

    } catch (error) {
      console.error('❌ KDS Core 초기화 실패:', error);
      this.emit('error', error);
      throw error;
    }
  }

  // =================== API 호출 ===================
  async fetchStations() {
    try {
      const response = await fetch(`${this.config.apiBase}/stations/${this.config.storeId}`);
      if (!response.ok) throw new Error(`스테이션 조회 실패: ${response.status}`);

      const data = await response.json();

      if (data.success && data.stations) {
        this.state.stations.clear();
        data.stations.forEach(station => {
          this.state.stations.set(station.name, station);
        });

        console.log(`✅ 스테이션 로드: ${data.stations.length}개`);
        this.emit('stations_updated', this.getStations());
      }

      return data.stations || [];
    } catch (error) {
      console.error('❌ 스테이션 조회 실패:', error);
      this.emit('error', error);
      return [];
    }
  }

  async fetchTickets() {
    try {
      const params = new URLSearchParams();
      if (this.state.filter.station && this.state.filter.station !== 'ALL') {
        params.append('station', this.state.filter.station);
      }

      const url = `${this.config.apiBase}/tickets/${this.config.storeId}?${params}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`티켓 조회 실패: ${response.status}`);

      const data = await response.json();

      if (data.success && data.tickets) {
        this.state.tickets.clear();
        data.tickets.forEach(ticket => {
          this.state.tickets.set(ticket.ticket_id, ticket);
        });

        console.log(`✅ 티켓 로드: ${data.tickets.length}개`);
        this.emit('tickets_updated', this.getTickets());
      }

      return data.tickets || [];
    } catch (error) {
      console.error('❌ 티켓 조회 실패:', error);
      this.emit('error', error);
      return [];
    }
  }

  async fetchDashboard() {
    try {
      const response = await fetch(`${this.config.apiBase}/dashboard/${this.config.storeId}`);
      if (!response.ok) throw new Error(`대시보드 조회 실패: ${response.status}`);

      const data = await response.json();

      if (data.success && data.dashboard) {
        this.state.dashboard = data.dashboard;
        console.log('✅ 대시보드 로드 완료');
        this.emit('dashboard_updated', this.getDashboard());
      }

      return data.dashboard || {};
    } catch (error) {
      console.error('❌ 대시보드 조회 실패:', error);
      this.emit('error', error);
      return {};
    }
  }

  // =================== 티켓 액션 ===================
  async updateTicketStatus(ticketId, status, itemId = null) {
    try {
      const payload = {
        status: status,
        store_id: this.config.storeId
      };

      if (itemId) {
        payload.item_id = itemId;
      }

      const response = await fetch(`${this.config.apiBase}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`상태 업데이트 실패: ${response.status}`);

      const data = await response.json();
      console.log('✅ 상태 업데이트 완료:', data);

      // 로컬 상태 즉시 업데이트
      await this.fetchTickets();

      return data;
    } catch (error) {
      console.error('❌ 상태 업데이트 실패:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async hideTicket(ticketId) {
    try {
      const response = await fetch(`${this.config.apiBase}/tickets/${ticketId}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: this.config.storeId })
      });

      if (!response.ok) throw new Error(`티켓 숨김 실패: ${response.status}`);

      const data = await response.json();
      console.log('✅ 티켓 숨김 완료:', data);

      // 로컬에서 즉시 제거
      this.state.tickets.delete(ticketId);
      this.emit('tickets_updated', this.getTickets());

      return data;
    } catch (error) {
      console.error('❌ 티켓 숨김 실패:', error);
      this.emit('error', error);
      throw error;
    }
  }

  // =================== 필터링 ===================
  setFilter(filter) {
    this.state.filter = { ...this.state.filter, ...filter };
    console.log('🔍 필터 설정:', this.state.filter);

    // 필터 변경시 즉시 데이터 새로고침
    this.fetchTickets();
    this.emit('filter_changed', this.state.filter);
  }

  getTickets(filter = {}) {
    const currentFilter = { ...this.state.filter, ...filter };
    let tickets = Array.from(this.state.tickets.values());

    // 상태 필터링
    if (currentFilter.status && currentFilter.status !== 'ALL') {
      tickets = tickets.filter(ticket => ticket.status === currentFilter.status);
    }

    // 스테이션 필터링
    if (currentFilter.station && currentFilter.station !== 'ALL') {
      tickets = tickets.filter(ticket =>
        ticket.items && ticket.items.some(item => item.cook_station === currentFilter.station)
      );
    }

    return tickets.sort((a, b) => {
      // 상태별 정렬 (COOKING > PENDING > DONE)
      const statusOrder = { 'COOKING': 1, 'PENDING': 2, 'DONE': 3 };
      const statusCompare = statusOrder[a.status] - statusOrder[b.status];

      if (statusCompare !== 0) {
        return statusCompare;
      }

      // 생성 시간순
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }

  getStations() {
    return Array.from(this.state.stations.values());
  }

  getDashboard() {
    return { ...this.state.dashboard };
  }

  getTicket(ticketId) {
    return this.state.tickets.get(ticketId) || null;
  }

  // =================== WebSocket 연결 ===================
  connectWebSocket() {
    try {
      if (this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
      }

      // Socket.IO 체크
      if (typeof io === 'undefined') {
        console.error('❌ Socket.IO 라이브러리가 로드되지 않음');
        this.emit('ws_error', new Error('Socket.IO 라이브러리 없음'));
        return;
      }

      const socketUrl = window.location.origin;
      console.log('🔌 KDS WebSocket 연결 시도:', socketUrl);

      this.wsConnection = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionDelay: this.config.reconnectDelay,
        maxReconnectionAttempts: this.config.maxReconnectAttempts
      });

      this.wsConnection.on('connect', () => {
        console.log('✅ KDS WebSocket 연결 성공:', this.wsConnection.id);
        this.state.isConnected = true;
        this.state.retryCount = 0;
        this.emit('ws_connected');

        // KDS 룸 조인
        this.wsConnection.emit('join-kds', this.config.storeId);
      });

      this.wsConnection.on('joined-kds', (data) => {
        console.log('🏪 KDS 룸 조인 완료:', data);
      });

      this.wsConnection.on('kds-update', (data) => {
        console.log('📨 KDS 업데이트 수신:', data);
        this.handleWebSocketMessage(data);
      });

      this.wsConnection.on('disconnect', (reason) => {
        console.log('🔌 KDS WebSocket 연결 끊김:', reason);
        this.state.isConnected = false;
        this.emit('ws_disconnected', reason);
      });

      this.wsConnection.on('connect_error', (error) => {
        console.error('❌ KDS WebSocket 연결 오류:', error);
        this.state.isConnected = false;
        this.emit('ws_error', error);
      });

      this.wsConnection.on('reconnect', (attemptNumber) => {
        console.log('🔄 KDS WebSocket 재연결 성공:', attemptNumber);
        this.state.isConnected = true;
        this.state.retryCount = 0;
        this.emit('ws_reconnected', attemptNumber);
      });

      this.wsConnection.on('reconnect_failed', () => {
        console.error('❌ KDS WebSocket 재연결 실패');
        this.state.isConnected = false;
        this.emit('ws_reconnect_failed');
      });

    } catch (error) {
      console.error('❌ WebSocket 연결 설정 실패:', error);
      this.emit('ws_error', error);
    }
  }

  handleWebSocketMessage(data) {
    try {
      if (!data || data.storeId !== this.config.storeId) {
        return;
      }

      console.log('📨 WebSocket 메시지 처리:', data.type, data.data);

      switch (data.type) {
        case 'new_ticket':
          console.log('🆕 새 티켓 알림');
          this.fetchTickets();
          this.fetchDashboard();
          this.emit('new_ticket', data.data);
          break;

        case 'status_updated':
          console.log('🔄 상태 업데이트 알림');
          this.fetchTickets();
          this.fetchDashboard();
          this.emit('status_updated', data.data);
          break;

        case 'ticket_hidden':
          console.log('👁️ 티켓 숨김 알림');
          if (data.data.ticket_id) {
            this.state.tickets.delete(data.data.ticket_id);
            this.emit('tickets_updated', this.getTickets());
          }
          break;

        default:
          console.log('📨 알 수 없는 메시지 타입:', data.type);
      }
    } catch (error) {
      console.error('❌ WebSocket 메시지 처리 실패:', error);
      this.emit('error', error);
    }
  }

  // =================== 폴링 백업 ===================
  startPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }

    this.pollingTimer = setInterval(async () => {
      try {
        // WebSocket 연결이 끊어졌을 때만 폴링으로 데이터 업데이트
        if (!this.state.isConnected) {
          console.log('🔄 폴링으로 데이터 업데이트 (WebSocket 끊어짐)');
          await Promise.all([
            this.fetchTickets(),
            this.fetchDashboard()
          ]);
        }
      } catch (error) {
        console.error('❌ 폴링 업데이트 실패:', error);
      }
    }, this.config.pollingInterval);
  }

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  // =================== 정리 ===================
  destroy() {
    console.log('🧹 KDS Core 정리 중...');

    // WebSocket 연결 정리
    if (this.wsConnection) {
      this.wsConnection.emit('leave-kds', this.config.storeId);
      this.wsConnection.close();
      this.wsConnection = null;
    }

    // 폴링 정리
    this.stopPolling();

    // 상태 초기화
    this.state.tickets.clear();
    this.state.stations.clear();
    this.state.dashboard = {};
    this.state.isConnected = false;

    // 이벤트 핸들러 정리
    this.eventHandlers.clear();

    console.log('✅ KDS Core 정리 완료');
  }

  // =================== 상태 확인 ===================
  getConnectionStatus() {
    return {
      connected: this.state.isConnected,
      retryCount: this.state.retryCount,
      storeId: this.config.storeId
    };
  }

  // =================== 디버그 ===================
  getDebugInfo() {
    return {
      config: this.config,
      state: {
        ticketCount: this.state.tickets.size,
        stationCount: this.state.stations.size,
        filter: this.state.filter,
        isConnected: this.state.isConnected,
        retryCount: this.state.retryCount
      },
      connection: this.getConnectionStatus()
    };
  }
}

// 전역 등록
window.KDSCore = KDSCore;
console.log('✅ KDS Core v3.0 클래스 등록 완료 (WebSocket 전용)');