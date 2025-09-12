
/**
 * KDS Core v4.0 - Order Tickets 기반 시스템
 * 티켓 = 카드 1장, 아이템 = 카드 내부 줄, 상태 전환은 아이템 중심 → 티켓 자동 집계
 */

class KDSCore {
  constructor() {
    this.config = {
      storeId: null,
      pollingInterval: 3000,
      cleanupInterval: 180000, // 3분
      maxRetries: 3,
      apiBase: '/api/kds'
    };

    this.state = {
      tickets: new Map(),
      stations: new Map(),
      dashboard: {},
      isPolling: false,
      retryCount: 0,
      lastUpdate: null
    };

    this.eventHandlers = new Map();
    this.pollingTimer = null;
    this.cleanupTimer = null;
    this.sseConnection = null;

    console.log('🎫 KDS Core v4.0 초기화 완료');
  }

  // =================== 초기화 ===================
  async initialize(storeId, options = {}) {
    try {
      this.config.storeId = parseInt(storeId);
      Object.assign(this.config, options);

      console.log(`🚀 KDS Core 시작: 매장 ${this.config.storeId}`);

      // 초기 데이터 로드
      await this.loadInitialData();

      // 폴링 시작
      this.startPolling();

      // 실시간 연결 시도
      console.log('🔌 WebSocket 연결 시도 중...');
      this.connectWebSocket();

      // 자동 정리 타이머
      this.startCleanupTimer();

      // 연결 상태 주기적 확인
      this.startConnectionMonitor();

      this.emit('initialized', { storeId: this.config.storeId });

      console.log('✅ KDS Core 초기화 완료:', this.getStatus());
      return true;
    } catch (error) {
      console.error('❌ KDS Core 초기화 실패:', error);
      this.emit('error', error);
      return false;
    }
  }

  // =================== 데이터 로드 ===================
  async loadInitialData() {
    const promises = [
      this.fetchTickets(),
      this.fetchStations(),
      this.fetchDashboard()
    ];

    await Promise.allSettled(promises);
  }

  async fetchTickets(status = 'PENDING,COOKING', station = null) {
    try {
      const params = new URLSearchParams({
        store_id: this.config.storeId,
        status: status
      });

      if (station) {
        params.append('station', station);
      }

      const response = await fetch(`${this.config.apiBase}/tickets?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // 기존 티켓 맵 업데이트
        const newTickets = new Map();
        
        data.tickets.forEach(ticket => {
          newTickets.set(ticket.ticket_id, {
            ...ticket,
            items: ticket.items || [],
            updated_at: new Date(ticket.created_at),
            elapsed_minutes: Math.floor(ticket.elapsed_seconds / 60)
          });
        });

        const oldTickets = new Map(this.state.tickets);
        this.state.tickets = newTickets;
        this.state.lastUpdate = new Date();

        // 변경 사항 감지 및 이벤트 발생
        this.detectChanges(oldTickets, newTickets);
        this.emit('tickets_updated', Array.from(newTickets.values()));

        this.state.retryCount = 0;
        return Array.from(newTickets.values());
      } else {
        throw new Error(data.message || '티켓 조회 실패');
      }
    } catch (error) {
      console.error('❌ 티켓 조회 실패:', error);
      this.handleError(error);
      return [];
    }
  }

  async fetchStations() {
    try {
      const response = await fetch(`${this.config.apiBase}/stations?store_id=${this.config.storeId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const stations = new Map();
        data.stations.forEach(station => {
          stations.set(station.id, station);
        });

        this.state.stations = stations;
        this.emit('stations_updated', Array.from(stations.values()));

        return Array.from(stations.values());
      } else {
        throw new Error(data.message || '스테이션 조회 실패');
      }
    } catch (error) {
      console.error('❌ 스테이션 조회 실패:', error);
      this.handleError(error);
      return [];
    }
  }

  async fetchDashboard() {
    try {
      const response = await fetch(`${this.config.apiBase}/dashboard?store_id=${this.config.storeId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        this.state.dashboard = data.dashboard;
        this.emit('dashboard_updated', data.dashboard);

        return data.dashboard;
      } else {
        throw new Error(data.message || '대시보드 조회 실패');
      }
    } catch (error) {
      console.error('❌ 대시보드 조회 실패:', error);
      this.handleError(error);
      return {};
    }
  }

  // =================== 상태 변경 ===================
  async updateItemStatus(itemId, newStatus, reason = null) {
    try {
      console.log(`🔄 아이템 ${itemId} 상태 변경: ${newStatus}`);

      const response = await fetch(`${this.config.apiBase}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_status: newStatus,
          actor_id: 'kds_user',
          reason: reason
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        this.emit('item_status_changed', data.data);
        
        // 즉시 해당 티켓 업데이트
        await this.refreshTicket(data.data.ticket_id);
        
        return data.data;
      } else {
        throw new Error(data.message || '아이템 상태 변경 실패');
      }
    } catch (error) {
      console.error('❌ 아이템 상태 변경 실패:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async updateTicketStatus(ticketId, newStatus, version = null, reason = null) {
    try {
      console.log(`🎫 티켓 ${ticketId} 상태 강제 변경: ${newStatus}`);

      const payload = {
        status: newStatus,
        actor_id: 'kds_user',
        reason: reason
      };

      if (version !== null) {
        payload.if_version = version;
      }

      const response = await fetch(`${this.config.apiBase}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('버전 충돌이 발생했습니다. 페이지를 새로고침하세요.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        this.emit('ticket_status_changed', data.data);
        
        // 즉시 해당 티켓 업데이트
        await this.refreshTicket(ticketId);
        
        return data.data;
      } else {
        throw new Error(data.message || '티켓 상태 변경 실패');
      }
    } catch (error) {
      console.error('❌ 티켓 상태 변경 실패:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async printTicket(ticketId) {
    try {
      console.log(`🖨️ 티켓 ${ticketId} 프린트 요청`);

      const response = await fetch(`${this.config.apiBase}/tickets/${ticketId}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actor_id: 'kds_user'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        this.emit('ticket_printed', data.data);
        
        // 즉시 해당 티켓 업데이트
        await this.refreshTicket(ticketId);
        
        return data.data;
      } else {
        throw new Error(data.message || '프린트 요청 실패');
      }
    } catch (error) {
      console.error('❌ 프린트 요청 실패:', error);
      this.emit('error', error);
      throw error;
    }
  }

  // =================== 편의 메서드 ===================
  async startCooking(ticketId) {
    const ticket = this.state.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('티켓을 찾을 수 없습니다');
    }

    // 모든 PENDING 아이템을 COOKING으로 변경
    const promises = ticket.items
      .filter(item => item.item_status === 'PENDING')
      .map(item => this.updateItemStatus(item.id, 'COOKING'));

    await Promise.all(promises);
  }

  async finishCooking(ticketId) {
    const ticket = this.state.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('티켓을 찾을 수 없습니다');
    }

    // 모든 COOKING 아이템을 DONE으로 변경
    const promises = ticket.items
      .filter(item => item.item_status === 'COOKING')
      .map(item => this.updateItemStatus(item.id, 'DONE'));

    await Promise.all(promises);
  }

  async cancelTicket(ticketId, reason = '주방에서 취소') {
    const ticket = this.state.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('티켓을 찾을 수 없습니다');
    }

    // 모든 활성 아이템을 CANCELED로 변경
    const promises = ticket.items
      .filter(item => ['PENDING', 'COOKING'].includes(item.item_status))
      .map(item => this.updateItemStatus(item.id, 'CANCELED', reason));

    await Promise.all(promises);
  }

  // =================== 조회 메서드 ===================
  getTickets(filter = {}) {
    let tickets = Array.from(this.state.tickets.values());

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      tickets = tickets.filter(ticket => statuses.includes(ticket.status));
    }

    if (filter.station) {
      tickets = tickets.filter(ticket => 
        ticket.items.some(item => item.cook_station === filter.station)
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

  // =================== 실시간 연결 ===================
  connectWebSocket() {
    try {
      // Socket.IO가 있으면 사용, 없으면 SSE 폴백
      if (typeof io !== 'undefined') {
        this.connectSocketIO();
      } else {
        console.log('📡 Socket.IO 없음 - SSE 연결 시도');
        this.connectSSE();
      }
    } catch (error) {
      console.error('❌ 실시간 연결 설정 실패:', error);
      this.connectSSE(); // SSE로 폴백
    }
  }

  connectSocketIO() {
    try {
      if (this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
      }

      const socketUrl = window.location.origin;
      console.log('🔌 KDS WebSocket 연결 시도:', socketUrl);
      
      this.wsConnection = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionDelay: 1000,
        maxReconnectionAttempts: 5
      });

      this.wsConnection.on('connect', () => {
        console.log('✅ KDS WebSocket 연결 성공:', this.wsConnection.id);
        this.emit('ws_connected');
        this.state.retryCount = 0;
        
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
        this.emit('ws_disconnected', reason);
      });

      this.wsConnection.on('connect_error', (error) => {
        console.error('❌ KDS WebSocket 연결 오류:', error);
        this.emit('ws_error', error);
        // WebSocket 실패 시 SSE로 폴백
        setTimeout(() => this.connectSSE(), 2000);
      });

    } catch (error) {
      console.error('❌ Socket.IO 연결 실패:', error);
      this.connectSSE();
    }
  }

  connectSSE() {
    try {
      if (this.sseConnection) {
        this.sseConnection.close();
        this.sseConnection = null;
      }

      console.log('📡 SSE 연결 시도 - 매장:', this.config.storeId);
      
      this.sseConnection = new EventSource(`${this.config.apiBase}/stream/${this.config.storeId}`);

      this.sseConnection.onopen = () => {
        console.log('✅ KDS SSE 연결 성공');
        this.emit('ws_connected');
        this.state.retryCount = 0;
      };

      this.sseConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 KDS SSE 메시지 수신:', data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ SSE 메시지 파싱 실패:', error);
        }
      };

      this.sseConnection.onerror = (error) => {
        console.error('❌ KDS SSE 연결 오류:', error);
        this.emit('ws_error', error);
        
        if (this.sseConnection.readyState === EventSource.CLOSED) {
          this.scheduleReconnect();
        }
      };

    } catch (error) {
      console.error('❌ SSE 연결 설정 실패:', error);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    this.state.retryCount++;
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 30000); // 최대 30초
    
    console.log(`🔄 KDS WebSocket 재연결 예약: ${delay}ms 후 (재시도 ${this.state.retryCount}회)`);
    
    setTimeout(() => {
      if (!this.wsConnection || !this.wsConnection.connected) {
        console.log('🔄 KDS WebSocket 재연결 시도...');
        this.connectWebSocket();
      }
    }, delay);
  }

  handleWebSocketMessage(data) {
    console.log('📨 KDS WebSocket 메시지 처리:', data);

    switch (data.type) {
      case 'new_ticket':
        console.log('🎫🔥 새 티켓 알림 수신:', data);
        console.log('🍽️ 주문 정보 상세:', {
          type: data.type,
          timestamp: new Date().toLocaleTimeString(),
          ticketData: data.data,
          storeId: this.config.storeId
        });
        
        // 새 주문 내역 강조 출력
        if (data.data) {
          console.group('🚨 새 주문 내역');
          console.log('티켓 ID:', data.data.ticket_id || data.data.id);
          console.log('테이블:', data.data.table_label || data.data.table_number);
          console.log('주문 시간:', data.data.created_at);
          console.log('주문 아이템:', data.data.items || []);
          console.groupEnd();
        }
        
        this.emit('new_ticket', data.data);
        // 즉시 티켓 목록 새로고림
        setTimeout(() => this.fetchTickets(), 500);
        break;

      case 'item_status_change':
        console.log('🔄 아이템 상태 변경 알림:', data);
        this.emit('item_updated', data.data);
        if (data.data.ticket_id) {
          this.refreshTicket(data.data.ticket_id);
        }
        break;

      case 'ticket_status_change':
        console.log('🎫 티켓 상태 변경 알림:', data);
        this.emit('ticket_updated', data.data);
        if (data.data.ticket_id) {
          this.refreshTicket(data.data.ticket_id);
        }
        break;

      default:
        console.log('🔔 KDS 기타 알림:', data);
        this.emit('notification', data);
    }
  }

  // =================== 폴링 관리 ===================
  startPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }

    this.state.isPolling = true;

    this.pollingTimer = setInterval(async () => {
      try {
        await this.fetchTickets();
        await this.fetchDashboard();
      } catch (error) {
        console.warn('⚠️ 폴링 중 오류:', error);
      }
    }, this.config.pollingInterval);

    console.log(`🔄 KDS 폴링 시작: ${this.config.pollingInterval}ms 간격`);
  }

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    this.state.isPolling = false;
    console.log('⏹️ KDS 폴링 중지');
  }

  // =================== 자동 정리 ===================
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        console.warn('⚠️ 자동 정리 중 오류:', error);
      }
    }, this.config.cleanupInterval);

    console.log(`🧹 KDS 자동 정리 시작: ${this.config.cleanupInterval / 1000}초 간격`);
  }

  async cleanup() {
    try {
      const response = await fetch(`${this.config.apiBase}/cleanup/${this.config.storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          minutes_threshold: 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hidden_tickets > 0) {
          console.log(`🧹 ${data.hidden_tickets}개 티켓이 자동 숨김 처리됨`);
          this.emit('cleanup_completed', data);
          
          // 티켓 목록 새로고침
          await this.fetchTickets();
        }
      }
    } catch (error) {
      console.warn('⚠️ 자동 정리 실패:', error);
    }
  }

  // =================== 유틸리티 ===================
  async refreshTicket(ticketId) {
    try {
      const tickets = await this.fetchTickets();
      const refreshedTicket = tickets.find(t => t.ticket_id === ticketId);
      
      if (refreshedTicket) {
        this.state.tickets.set(ticketId, refreshedTicket);
        this.emit('ticket_refreshed', refreshedTicket);
      }
    } catch (error) {
      console.warn('⚠️ 티켓 새로고침 실패:', error);
    }
  }

  detectChanges(oldTickets, newTickets) {
    // 새로 추가된 티켓
    for (const [id, ticket] of newTickets) {
      if (!oldTickets.has(id)) {
        this.emit('ticket_added', ticket);
      }
    }

    // 상태가 변경된 티켓
    for (const [id, newTicket] of newTickets) {
      const oldTicket = oldTickets.get(id);
      if (oldTicket && oldTicket.status !== newTicket.status) {
        this.emit('ticket_status_updated', {
          ticket_id: id,
          old_status: oldTicket.status,
          new_status: newTicket.status,
          ticket: newTicket
        });
      }
    }
  }

  handleError(error) {
    this.state.retryCount++;

    if (this.state.retryCount >= this.config.maxRetries) {
      console.error(`❌ 최대 재시도 횟수 초과 (${this.config.maxRetries}회)`);
      this.emit('max_retries_exceeded', error);
    } else {
      console.warn(`⚠️ 재시도 ${this.state.retryCount}/${this.config.maxRetries}: ${error.message}`);
    }
  }

  // =================== 이벤트 시스템 ===================
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      for (const handler of this.eventHandlers.get(event)) {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ 이벤트 핸들러 오류 (${event}):`, error);
        }
      }
    }
  }

  // =================== 연결 모니터링 ===================
  startConnectionMonitor() {
    // 30초마다 연결 상태 확인
    this.connectionMonitor = setInterval(() => {
      const status = this.getConnectionStatus();
      console.log('🔍 KDS 연결 상태 확인:', status);
      
      if (!status.sseConnected && this.config.storeId) {
        console.log('⚠️ SSE 연결이 끊어짐, 재연결 시도');
        this.connectSSE();
      }
    }, 30000);
  }

  getConnectionStatus() {
    return {
      wsConnected: this.wsConnection?.connected || false,
      wsId: this.wsConnection?.id,
      isPolling: this.state.isPolling,
      lastUpdate: this.state.lastUpdate,
      retryCount: this.state.retryCount,
      storeId: this.config.storeId
    };
  }

  // =================== 정리 ===================
  destroy() {
    console.log('🛑 KDS Core 종료 중...');

    this.stopPolling();

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor);
      this.connectionMonitor = null;
    }

    if (this.wsConnection) {
      this.wsConnection.emit('leave-kds', this.config.storeId);
      this.wsConnection.close();
      this.wsConnection = null;
    }

    this.eventHandlers.clear();
    this.state.tickets.clear();
    this.state.stations.clear();

    console.log('✅ KDS Core 정리 완료');
  }

  // =================== 상태 조회 ===================
  getStatus() {
    return {
      storeId: this.config.storeId,
      isPolling: this.state.isPolling,
      ticketCount: this.state.tickets.size,
      stationCount: this.state.stations.size,
      lastUpdate: this.state.lastUpdate,
      retryCount: this.state.retryCount,
      wsConnected: this.wsConnection?.connected || false
    };
  }
}

// 전역 인스턴스
window.KDSCore = KDSCore;
console.log('✅ KDS Core v4.0 클래스 등록 완료');
