/**
 * KDS 메인 컨트롤러 v3.0
 * 책임: KDS 전체 흐름 제어, 데이터와 UI 연결, 상태 관리
 */

window.KDSController = {
  // 상태
  storeId: null,
  core: null,
  ui: null,
  isInitialized: false,

  // 초기화
  async init(storeId) {
    try {
      this.storeId = storeId;
      console.log(`🚀 KDS Controller v3.0 초기화 - 매장 ${storeId}`);

      // 코어 초기화
      this.core = new KDSCore();
      const coreSuccess = await this.core.initialize(storeId);

      if (!coreSuccess) {
        throw new Error('KDS Core 초기화 실패');
      }

      // UI 초기화
      this.ui = new KDSUI();
      const uiSuccess = await this.ui.initialize('app', this.core);

      if (!uiSuccess) {
        throw new Error('KDS UI 초기화 실패');
      }

      // 초기 데이터 로드
      await this.loadInitialData();

      // 시간 업데이트 시작
      this.ui.startTimeUpdate();

      this.isInitialized = true;
      console.log('✅ KDS Controller 초기화 완료');

    } catch (error) {
      console.error('❌ KDS Controller 초기화 실패:', error);
      this.showError('KDS 시스템 초기화에 실패했습니다: ' + error.message);
      throw error;
    }
  },

  // 초기 데이터 로드
  async loadInitialData() {
    try {
      console.log('🔄 KDS 초기 데이터 로드 시작');
      
      // 순차적으로 데이터 로드 (안정성)
      const stations = await this.core.fetchStations();
      console.log('✅ 스테이션 로드 완료:', stations.length, '개');
      
      const tickets = await this.core.fetchTickets();
      console.log('✅ 티켓 로드 완료:', tickets.length, '개');
      
      const dashboard = await this.core.fetchDashboard();
      console.log('✅ 대시보드 로드 완료');

      // UI 업데이트
      if (this.ui) {
        this.ui.renderStationTabs(stations);
        this.updateTicketDisplay();
        this.ui.updateDashboard(dashboard);
      }

      console.log('✅ KDS 초기 데이터 로드 완료');

    } catch (error) {
      console.error('❌ 초기 데이터 로드 실패:', error);
      this.showError('초기 데이터 로드 실패: ' + error.message);
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

      case 'new_ticket':
        console.log('🎫🚨 새 티켓 알림 처리:', data);
        console.log('📋 주문 상세 정보:', {
          티켓ID: data.ticket_id || data.id,
          매장ID: data.store_id,
          테이블: data.table_label || data.table_number,
          주문시간: data.created_at || new Date().toISOString(),
          아이템: data.items || []
        });
        
        if (this.ui && this.ui.showNotification) {
          this.ui.showNotification('🍽️ 새로운 주문이 접수되었습니다!', 'success');
        }
        this.playNotificationSound('new_order');
        // 티켓 목록 즉시 업데이트
        this.updateTicketDisplay();
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
      if (!this.core) {
        throw new Error('KDS Core가 초기화되지 않았습니다');
      }

      await this.core.fetchTickets();
      await this.core.fetchDashboard();

      if (this.ui && this.ui.showNotification) {
        this.ui.showNotification('데이터를 새로고침했습니다', 'success');
      }
    } catch (error) {
      console.error('❌ 새로고침 실패:', error);
      this.showError('새로고침에 실패했습니다: ' + error.message);
    }
  },

  // 에러 표시
  showError(message) {
    if (this.ui && this.ui.showNotification) {
      this.ui.showNotification(message, 'error');
    } else {
      // UI가 초기화되지 않은 경우 콘솔과 alert 사용
      console.error('❌ KDS 오류:', message);
      alert(message);
    }
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
      coreStatus: this.core?.getStatus(),
      uiStatus: {
        initialized: !!this.ui,
        currentFilter: this.ui?.currentFilter
      }
    };
  },

  // 정리
  destroy() {
    if (this.core) {
      this.core.destroy();
      this.core = null;
    }

    this.ui = null;
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