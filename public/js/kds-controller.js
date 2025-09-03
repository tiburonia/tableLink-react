/**
 * Simple KDS Controller v2.0
 * 책임: KDS 전체 흐름 제어, 실시간 업데이트 관리
 */

window.SimpleKDS = {
  storeId: null,
  eventSource: null,
  updateInterval: null,

  // KDS 시스템 초기화
  init: function(storeId) {
    this.storeId = storeId;
    console.log(`🚀 Simple KDS 시작 - 매장 ${storeId}`);

    // UI 렌더링
    window.KDSUIRenderer.renderMainScreen(storeId);

    // 실시간 연결 설정
    this.setupRealtime();

    // 주기적 업데이트 (백업용)
    this.setupPeriodicUpdate();

    console.log('✅ Simple KDS 초기화 완료');
  },

  // 실시간 연결 설정
  setupRealtime: function() {
    try {
      this.eventSource = new EventSource(`/api/kds/stream/${this.storeId}`);

      this.eventSource.onopen = () => {
        console.log('📡 KDS 실시간 연결 성공');
        this.updateConnectionStatus(true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 KDS 실시간 데이터:', data);

          if (data.type !== 'connected') {
            this.handleRealtimeUpdate(data);
          }
        } catch (error) {
          console.error('❌ 실시간 데이터 처리 실패:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ KDS 실시간 연결 오류:', error);
        this.updateConnectionStatus(false);

        // 3초 후 재연결 시도
        setTimeout(() => {
          if (this.eventSource.readyState === EventSource.CLOSED) {
            this.setupRealtime();
          }
        }, 3000);
      };

    } catch (error) {
      console.error('❌ 실시간 연결 설정 실패:', error);
      this.updateConnectionStatus(false);
    }
  },

  // 실시간 업데이트 처리
  handleRealtimeUpdate: function(data) {
    switch (data.type) {
      case 'new_order':
      case 'item_status_change':
        // 화면 새로고침
        window.kdsRefresh();
        break;

      default:
        console.log('🔄 알 수 없는 실시간 이벤트:', data.type);
    }

    this.updateLastUpdateTime();
  },

  // 주기적 업데이트 설정 (백업용)
  setupPeriodicUpdate: function() {
    // 30초마다 자동 새로고침
    this.updateInterval = setInterval(() => {
      window.kdsRefresh();
    }, 30000);
  },

  // 연결 상태 업데이트
  updateConnectionStatus: function(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
      if (connected) {
        statusElement.textContent = '연결됨';
        statusElement.className = 'status-connected';
      } else {
        statusElement.textContent = '연결 끊김';
        statusElement.className = 'status-disconnected';
      }
    }
  },

  // 마지막 업데이트 시간 표시
  updateLastUpdateTime: function() {
    const updateElement = document.getElementById('lastUpdate');
    if (updateElement) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ko-KR');
      updateElement.textContent = `마지막 업데이트: ${timeString}`;
    }
  },

  // 정리
  cleanup: function() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('🧹 KDS 정리 완료');
  }
};

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  window.SimpleKDS.cleanup();
});

console.log('✅ Simple KDS Controller v2.0 로드 완료');