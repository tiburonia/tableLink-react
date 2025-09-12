/**
 * KDS 핵심 데이터 관리 모듈 v3.0
 * 책임: 데이터 로딩, API 통신, 실시간 연결 관리, 상태 관리
 */

// 중복 로딩 방지
if (window.KDSCore) {
  console.log('⚠️ KDSCore가 이미 로드됨');
} else {

class KDSCore {
  constructor(storeId) {
    this.storeId = storeId;
    this.stations = new Map();
    this.tickets = new Map();
    this.dashboard = {};
    this.eventSource = null;
    this.lastUpdate = 0;
    this.connectionState = 'disconnected';
    this.updateCallbacks = new Set();
    this.retryCount = 0;
    this.maxRetries = 5;

    console.log(`🚀 KDS Core v3.0 초기화 - 매장 ${storeId}`);
  }

  // 상태 변경 이벤트 구독
  onUpdate(callback) {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  // 상태 변경 알림
  emit(event, data) {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ 이벤트 콜백 실행 실패:', error);
      }
    });
  }

  // 스테이션 데이터 로드
  async loadStations() {
    try {
      const response = await fetch(`/api/kds/stations?store_id=${this.storeId}`);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // JSON 파싱 실패 시 기본 에러 메시지 사용
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();

      if (data.success) {
        this.stations.clear();
        data.stations.forEach(station => {
          this.stations.set(station.id, station);
        });

        this.emit('stations_loaded', Array.from(this.stations.values()));
        return Array.from(this.stations.values());
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('❌ 스테이션 로딩 실패:', error);
      this.emit('error', { type: 'load_stations', error });
      throw error;
    }
  }

  // 티켓 데이터 로드
  async loadTickets(stationId = 'all', status = null) {
    try {
      let url = `/api/kds/tickets?store_id=${this.storeId}`;
      if (stationId !== 'all') url += `&station_id=${stationId}`;
      if (status) url += `&status=${status}`;

      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // JSON 파싱 실패 시 기본 에러 메시지 사용
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();

      if (data.success) {
        // 티켓 맵 업데이트
        if (stationId === 'all') {
          this.tickets.clear();
        }

        data.tickets.forEach(ticket => {
          this.tickets.set(ticket.ticket_id, ticket);
        });

        this.lastUpdate = data.timestamp;
        this.emit('tickets_loaded', {
          tickets: Array.from(this.tickets.values()),
          stationId,
          status
        });

        return Array.from(this.tickets.values());
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('❌ 티켓 로딩 실패:', error);
      this.emit('error', { type: 'load_tickets', error });
      throw error;
    }
  }

  // 대시보드 데이터 로드
  async loadDashboard() {
    try {
      const response = await fetch(`/api/kds/dashboard?store_id=${this.storeId}`);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // JSON 파싱 실패 시 기본 에러 메시지 사용
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();

      if (data.success) {
        this.dashboard = data.dashboard;
        this.emit('dashboard_loaded', this.dashboard);
        return this.dashboard;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('❌ 대시보드 로딩 실패:', error);
      this.emit('error', { type: 'load_dashboard', error });
      throw error;
    }
  }

  // 티켓 상태 변경
  async updateTicketStatus(ticketId, action, reason = null) {
    try {
      const response = await fetch(`/api/kds/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          reason,
          actor_type: 'USER',
          actor_id: 'kds_user'
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // JSON 파싱 실패 시 기본 에러 메시지 사용
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();

      if (data.success) {
        // 로컬 상태 업데이트
        const ticket = this.tickets.get(parseInt(ticketId));
        if (ticket) {
          ticket.ticket_status = data.data.new_status;
          ticket.updated_at = new Date().toISOString();
          this.tickets.set(parseInt(ticketId), ticket);
        }

        this.emit('ticket_updated', {
          ticketId: parseInt(ticketId),
          action,
          oldStatus: data.data.old_status,
          newStatus: data.data.new_status
        });

        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('❌ 티켓 상태 변경 실패:', error);
      this.emit('error', { 
        type: 'update_ticket_status', 
        error,
        ticketId,
        action 
      });
      throw error;
    }
  }

  // 실시간 연결 설정
  setupRealtime() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    console.log('🔌 KDS 실시간 연결 시작...');
    this.connectionState = 'connecting';
    this.emit('connection_state', 'connecting');

    this.eventSource = new EventSource(`/api/kds/stream/${this.storeId}`);

    this.eventSource.onopen = () => {
      console.log('✅ KDS 실시간 연결 성공');
      this.connectionState = 'connected';
      this.retryCount = 0;
      this.emit('connection_state', 'connected');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 KDS 실시간 데이터:', data);

        this.handleRealtimeMessage(data);
      } catch (error) {
        console.error('❌ 실시간 데이터 처리 실패:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('❌ KDS 실시간 연결 오류:', error);
      this.connectionState = 'disconnected';
      this.emit('connection_state', 'disconnected');

      // 재연결 시도
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);

        console.log(`🔄 ${delay/1000}초 후 재연결 시도... (${this.retryCount}/${this.maxRetries})`);

        setTimeout(() => {
          if (this.connectionState === 'disconnected') {
            this.setupRealtime();
          }
        }, delay);
      }
    };
  }

  // 실시간 메시지 처리
  handleRealtimeMessage(data) {
    switch (data.type) {
      case 'connected':
        console.log('✅ KDS 실시간 연결 확인');
        break;

      case 'keepalive':
        // keepalive는 무시
        break;

      case 'new_tickets':
        console.log('🎫 새 티켓 알림:', data);
        this.emit('new_tickets', data);
        // 자동 새로고침
        this.loadTickets();
        break;

      case 'ticket_status_change':
        console.log('🔄 티켓 상태 변경 알림:', data);

        // 로컬 상태 업데이트
        const ticket = this.tickets.get(data.ticket_id);
        if (ticket) {
          ticket.ticket_status = data.new_status;
          ticket.updated_at = new Date().toISOString();
          this.tickets.set(data.ticket_id, ticket);
        }

        this.emit('ticket_status_changed', data);
        break;

      case 'error':
        console.error('❌ 서버 에러:', data.message);
        this.emit('error', { type: 'server_error', error: data });
        break;

      default:
        console.log('📨 알 수 없는 실시간 메시지:', data.type);
        this.emit('unknown_message', data);
    }
  }

  // 필터링된 티켓 조회
  getFilteredTickets(stationId = 'all', status = null) {
    let tickets = Array.from(this.tickets.values());

    if (stationId !== 'all') {
      tickets = tickets.filter(ticket => ticket.station_id === parseInt(stationId));
    }

    if (status) {
      tickets = tickets.filter(ticket => ticket.ticket_status === status);
    }

    // 정렬: 상태별, 코스별, 시간별
    tickets.sort((a, b) => {
      // 1. 상태 우선순위
      const statusOrder = { 'COOKING': 1, 'PENDING': 2, 'DONE': 3 };
      const statusDiff = (statusOrder[a.ticket_status] || 4) - (statusOrder[b.ticket_status] || 4);
      if (statusDiff !== 0) return statusDiff;

      // 2. 코스 번호
      const courseDiff = (a.course_no || 1) - (b.course_no || 1);
      if (courseDiff !== 0) return courseDiff;

      // 3. 발행 시간
      return new Date(a.fired_at || a.created_at) - new Date(b.fired_at || b.created_at);
    });

    return tickets;
  }

  // 스테이션별 티켓 수 집계
  getStationCounts() {
    const counts = {};

    this.stations.forEach(station => {
      counts[station.id] = {
        total: 0,
        pending: 0,
        cooking: 0,
        done: 0
      };
    });

    this.tickets.forEach(ticket => {
      const stationId = ticket.station_id;
      if (counts[stationId]) {
        counts[stationId].total++;

        const status = ticket.ticket_status.toLowerCase();
        if (counts[stationId][status] !== undefined) {
          counts[stationId][status]++;
        }
      }
    });

    return counts;
  }

  // 전체 새로고침
  async refresh() {
    try {
      this.emit('refresh_start');

      await Promise.all([
        this.loadStations(),
        this.loadTickets(),
        this.loadDashboard()
      ]);

      this.emit('refresh_complete');
      console.log('✅ KDS 데이터 새로고침 완료');
    } catch (error) {
      console.error('❌ KDS 새로고침 실패:', error);
      this.emit('refresh_error', error);
      throw error;
    }
  }

  // 정리
  destroy() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.updateCallbacks.clear();
    this.stations.clear();
    this.tickets.clear();

    console.log('🧹 KDS Core 정리 완료');
  }

  // 연결 상태 조회
  getConnectionState() {
    return this.connectionState;
  }

  // 상태 요약
  getSummary() {
    return {
      storeId: this.storeId,
      connectionState: this.connectionState,
      stationCount: this.stations.size,
      ticketCount: this.tickets.size,
      lastUpdate: this.lastUpdate,
      dashboard: this.dashboard
    };
  }
}

window.KDSCore = KDSCore;
console.log('✅ KDS Core v3.0 클래스 등록 완료');

} // 중복 로딩 방지 닫기