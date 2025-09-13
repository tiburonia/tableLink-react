
/**
 * KDS 메인 관리자 모듈
 * - 전체 시스템 조율
 * - 사용자 액션 처리
 * - 모듈 간 통신
 */

(function() {
  'use strict';

  console.log('🎯 KDS 관리자 모듈 로드');

  // =================== 메인 KDS 매니저 ===================
  window.KDSManager = {
    /**
     * KDS 시스템 초기화
     */
    async initialize(storeId) {
      try {
        console.log(`🍳 KDS 시스템 초기화 - 매장 ${storeId}`);

        // 상태 초기화
        KDSState.initialize(storeId);

        // UI 렌더링
        KDSUIRenderer.render(storeId);

        // 사운드 초기화
        KDSSoundManager.initialize();

        // 초기 데이터 로드
        const tickets = await KDSAPIService.loadInitialData(storeId);

        // 티켓 데이터 저장
        tickets.forEach(ticket => {
          KDSState.setTicket(ticket.check_id || ticket.id, ticket);
        });

        // 티켓 카드 렌더링
        tickets.forEach(ticket => {
          KDSUIRenderer.addTicketCard(ticket);
        });

        // WebSocket 연결
        await KDSWebSocket.connect(storeId);

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
        const ticket = KDSState.getTicket(ticketId);

        if (!ticket) return;

        let shouldShow = false;

        if (KDSState.currentTab === 'active') {
          shouldShow = ticket.status !== 'completed' && ticket.status !== 'served';
        } else if (KDSState.currentTab === 'completed') {
          shouldShow = ticket.status === 'completed' || ticket.status === 'served';
        }

        card.style.display = shouldShow ? 'block' : 'none';
      });

      KDSUIRenderer.checkEmptyState();
    },

    /**
     * 조리 시작
     */
    async startCooking(ticketId) {
      try {
        console.log(`🔥 티켓 ${ticketId} 조리 시작 요청`);

        // 즉시 UI 업데이트 (낙관적 업데이트)
        const ticket = KDSState.getTicket(ticketId);
        if (ticket) {
          ticket.status = 'COOKING';
          if (ticket.items) {
            ticket.items.forEach(item => {
              item.status = 'COOKING';
              item.item_status = 'COOKING';
            });
          }
          KDSUIRenderer.updateTicketCookingState(ticketId, 'COOKING');
        }

        const result = await KDSAPIService.startCooking(ticketId);

        if (result.success) {
          console.log('✅ 조리 시작 성공:', result.message);
          KDSSoundManager.playItemCompleteSound();

          // 서버 응답 후 최종 확인 업데이트
          if (ticket) {
            KDSUIRenderer.updateTicketCookingState(ticketId, 'COOKING');
          }
        } else {
          // 실패 시 원래 상태로 복구
          if (ticket) {
            ticket.status = 'PENDING';
            if (ticket.items) {
              ticket.items.forEach(item => {
                item.status = 'PENDING';
                item.item_status = 'PENDING';
              });
            }
            KDSUIRenderer.updateTicketCard(ticket);
          }
          throw new Error(result.error);
        }

      } catch (error) {
        console.error('❌ 조리 시작 실패:', error);
        this.showError('조리 시작 처리 중 오류가 발생했습니다: ' + error.message);
      }
    },

    /**
     * 주문 완료
     */
    async markComplete(ticketId) {
      try {
        console.log(`✅ 티켓 ${ticketId} 완료 요청`);

        const result = await KDSAPIService.markComplete(ticketId);

        if (result.success) {
          console.log('✅ 완료 처리 성공:', result.message);
          // WebSocket으로 처리되므로 여기서는 사운드만 재생
          KDSSoundManager.playOrderCompleteSound();
        } else {
          throw new Error(result.error);
        }

      } catch (error) {
        console.error('❌ 완료 처리 실패:', error);
        this.showError('완료 처리 중 오류가 발생했습니다: ' + error.message);
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
          KDSWebSocket.updateItemStatus(itemId, status);
        } else {
          // HTTP API로 백업
          await KDSAPIService.updateItemStatus(itemId, status);
        }

      } catch (error) {
        console.error('❌ 아이템 상태 업데이트 실패:', error);
        throw error;
      }
    },

    /**
     * 완료된 주문 정리
     */
    clearCompleted() {
      console.log('ℹ️ 완료된 주문은 자동으로 제거됩니다');
    },

    /**
     * 사운드 토글
     */
    toggleSound() {
      KDSSoundManager.toggleSound();
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
        const tickets = await KDSAPIService.loadInitialData(KDSState.storeId);

        // 기존 카드 제거
        document.querySelectorAll('.ticket-card').forEach(card => card.remove());

        // 상태 초기화
        KDSState.tickets.clear();

        // 새 데이터로 렌더링
        tickets.forEach(ticket => {
          KDSState.setTicket(ticket.check_id || ticket.id, ticket);
          KDSUIRenderer.addTicketCard(ticket);
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
      KDSState.cleanup();
      KDSWebSocket.disconnect();
    },

    /**
     * 오류 표시
     */
    showError(message) {
      // 간단한 오류 표시 (추후 토스트나 모달로 개선 가능)
      alert(message);
    }
  };

  console.log('✅ KDS 관리자 모듈 로드 완료');
})();
