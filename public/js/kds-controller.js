
/**
 * KDS 메인 컨트롤러 v3.0
 * 책임: KDS 전체 흐름 제어, 데이터와 UI 연결, 상태 관리
 */

window.KDSController = {
  // 상태
  storeId: null,
  core: null,
  isInitialized: false,
  
  // 초기화
  async init(storeId) {
    try {
      this.storeId = storeId;
      console.log(`🚀 KDS Controller v3.0 초기화 - 매장 ${storeId}`);

      // UI 초기화
      KDSUI.init('app');
      KDSUI.renderMainInterface(storeId);

      // 코어 초기화
      this.core = new KDSCore(storeId);
      this.setupEventBindings();

      // 초기 데이터 로드
      KDSUI.showLoading(true);
      await this.loadInitialData();
      KDSUI.showLoading(false);

      // 실시간 연결 시작
      this.core.setupRealtime();

      this.isInitialized = true;
      console.log('✅ KDS Controller 초기화 완료');

    } catch (error) {
      console.error('❌ KDS Controller 초기화 실패:', error);
      KDSUI.showToast('KDS 시스템 초기화에 실패했습니다', 'error');
      throw error;
    }
  },

  // 초기 데이터 로드
  async loadInitialData() {
    try {
      // 병렬로 데이터 로드
      const [stations, tickets, dashboard] = await Promise.all([
        this.core.loadStations(),
        this.core.loadTickets(),
        this.core.loadDashboard()
      ]);

      // UI 업데이트
      KDSUI.renderStationTabs(stations);
      this.updateTicketDisplay();
      KDSUI.updateDashboard(dashboard);

    } catch (error) {
      console.error('❌ 초기 데이터 로드 실패:', error);
      throw error;
    }
  },

  // 이벤트 바인딩 설정
  setupEventBindings() {
    // 코어 이벤트 구독
    this.core.onUpdate((event, data) => {
      this.handleCoreEvent(event, data);
    });

    // UI 이벤트 구독
    KDSUI.on((event, data) => {
      this.handleUIEvent(event, data);
    });
  },

  // 코어 이벤트 처리
  handleCoreEvent(event, data) {
    console.log('📡 코어 이벤트:', event, data);

    switch (event) {
      case 'connection_state':
        KDSUI.updateConnectionStatus(data);
        break;

      case 'stations_loaded':
        KDSUI.renderStationTabs(data);
        break;

      case 'tickets_loaded':
        this.updateTicketDisplay();
        break;

      case 'dashboard_loaded':
        KDSUI.updateDashboard(data);
        break;

      case 'new_tickets':
        KDSUI.showToast('새로운 주문이 접수되었습니다!', 'success');
        this.playNotificationSound('new_order');
        break;

      case 'ticket_status_changed':
        KDSUI.showToast(
          `티켓 #${data.ticket_id}가 ${this.getStatusKorean(data.new_status)}되었습니다`,
          'info'
        );
        this.updateTicketDisplay();
        break;

      case 'ticket_updated':
        KDSUI.showToast(
          `티켓 #${data.ticketId} 상태가 변경되었습니다`,
          'success'
        );
        this.updateTicketDisplay();
        break;

      case 'error':
        this.handleError(data);
        break;

      case 'refresh_start':
        KDSUI.showLoading(true);
        break;

      case 'refresh_complete':
        KDSUI.showLoading(false);
        this.updateTicketDisplay();
        break;
    }
  },

  // UI 이벤트 처리
  async handleUIEvent(event, data) {
    console.log('🎨 UI 이벤트:', event, data);

    switch (event) {
      case 'station_changed':
        this.updateTicketDisplay();
        break;

      case 'filter_changed':
        this.updateTicketDisplay();
        break;

      case 'ticket_action':
        await this.handleTicketAction(data.ticketId, data.action);
        break;

      case 'refresh_requested':
        await this.refresh();
        break;
    }
  },

  // 티켓 액션 처리
  async handleTicketAction(ticketId, action) {
    try {
      console.log(`🎯 티켓 액션 실행: ${ticketId} -> ${action}`);

      let reason = null;
      if (action === 'cancel') {
        reason = prompt('취소 사유를 입력하세요:');
        if (reason === null) return; // 사용자가 취소
      }

      await this.core.updateTicketStatus(ticketId, action, reason);
      
      // 사운드 효과
      this.playActionSound(action);

    } catch (error) {
      console.error('❌ 티켓 액션 실패:', error);
      KDSUI.showToast(error.message || '작업 처리에 실패했습니다', 'error');
    }
  },

  // 티켓 표시 업데이트
  updateTicketDisplay() {
    const filteredTickets = this.core.getFilteredTickets(
      KDSUI.currentStationId,
      KDSUI.currentStatus
    );

    KDSUI.renderTickets(filteredTickets);

    // 카운터 업데이트
    const stationCounts = this.core.getStationCounts();
    KDSUI.updateStationCounts(stationCounts);
  },

  // 전체 새로고침
  async refresh() {
    try {
      await this.core.refresh();
      KDSUI.showToast('데이터를 새로고침했습니다', 'success');
    } catch (error) {
      console.error('❌ 새로고침 실패:', error);
      KDSUI.showToast('새로고침에 실패했습니다', 'error');
    }
  },

  // 에러 처리
  handleError(errorData) {
    console.error('❌ KDS 에러:', errorData);
    
    const errorMessages = {
      'load_stations': '스테이션 정보를 불러오는데 실패했습니다',
      'load_tickets': '티켓 정보를 불러오는데 실패했습니다',
      'load_dashboard': '대시보드 정보를 불러오는데 실패했습니다',
      'update_ticket_status': '티켓 상태 변경에 실패했습니다',
      'server_error': '서버 오류가 발생했습니다'
    };

    const message = errorMessages[errorData.type] || '알 수 없는 오류가 발생했습니다';
    KDSUI.showToast(message, 'error');
  },

  // 알림 사운드 재생
  playNotificationSound(type) {
    try {
      const sounds = {
        'new_order': [800, 150, 600, 150, 800, 150],
        'urgent': [1000, 100, 1000, 100, 1000, 100],
        'complete': [600, 200, 800, 200]
      };

      const sequence = sounds[type];
      if (!sequence) return;

      this.playBeepSequence(sequence);
    } catch (error) {
      // 사운드 재생 실패는 무시
    }
  },

  // 액션 사운드 재생
  playActionSound(action) {
    try {
      const sounds = {
        'start': [700, 100],
        'done': [800, 150, 1000, 150],
        'serve': [600, 100, 800, 100, 1000, 200],
        'cancel': [400, 200]
      };

      const sequence = sounds[action];
      if (sequence) {
        this.playBeepSequence(sequence);
      }
    } catch (error) {
      // 사운드 재생 실패는 무시
    }
  },

  // 비프음 시퀀스 재생
  playBeepSequence(sequence) {
    if (!window.AudioContext && !window.webkitAudioContext) {
      return; // 오디오 컨텍스트 미지원
    }

    const context = new (window.AudioContext || window.webkitAudioContext)();
    let time = context.currentTime;

    for (let i = 0; i < sequence.length; i += 2) {
      const frequency = sequence[i];
      const duration = sequence[i + 1] / 1000;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.setValueAtTime(frequency, time);
      gainNode.gain.setValueAtTime(0.1, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

      oscillator.start(time);
      oscillator.stop(time + duration);

      time += duration + 0.1; // 0.1초 간격
    }
  },

  // 상태 한국어 변환
  getStatusKorean(status) {
    const statusMap = {
      'PENDING': '대기 상태로',
      'COOKING': '조리 시작',
      'DONE': '조리 완료',
      'SERVED': '서빙 완료',
      'CANCELED': '취소'
    };
    return statusMap[status] || status;
  },

  // 상태 정보 조회
  getStatus() {
    return {
      storeId: this.storeId,
      isInitialized: this.isInitialized,
      connectionState: this.core?.getConnectionState(),
      summary: this.core?.getSummary()
    };
  },

  // 정리
  destroy() {
    if (this.core) {
      this.core.destroy();
      this.core = null;
    }
    
    this.isInitialized = false;
    console.log('🧹 KDS Controller 정리 완료');
  }
};

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  if (window.KDSController) {
    window.KDSController.destroy();
  }
});

console.log('✅ KDS Controller v3.0 로드 완료');
