
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

        // 티켓 데이터 저장 (안전한 ID 추출)
        tickets.forEach(ticket => {
          const ticketId = this._extractSafeTicketId(ticket);
          
          // 정규화된 티켓 데이터 생성
          const normalizedTicket = {
            ...ticket,
            // 모든 ID 필드를 일관되게 설정
            id: ticket.id || ticketId,
            check_id: ticket.check_id || ticketId,
            ticket_id: ticket.ticket_id || ticketId
          };
          
          console.log(`📋 티켓 저장: ID=${ticketId}, 원본 ID들:`, {
            id: ticket.id,
            check_id: ticket.check_id,
            ticket_id: ticket.ticket_id,
            order_id: ticket.order_id
          });
          
          KDSState.setTicket(ticketId, normalizedTicket);
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
     * 조리 시작 - 개선된 티켓 ID 처리
     */
    async startCooking(ticketId) {
      console.log(`🔥 티켓 ${ticketId} 조리 시작 요청`);

      // 1. 중복 요청 방지
      if (this._processingTickets?.has(ticketId)) {
        console.warn(`⚠️ 티켓 ${ticketId} 이미 처리 중`);
        return;
      }

      // 처리 중인 티켓으로 마킹
      if (!this._processingTickets) {
        this._processingTickets = new Set();
      }
      this._processingTickets.add(ticketId);

      // 2. 티켓 찾기 (여러 가지 ID 형태로 시도)
      let ticket = this._findTicketById(ticketId);
      
      if (!ticket) {
        console.error(`❌ 티켓 ${ticketId}을 찾을 수 없음`);
        console.log(`🔍 현재 저장된 모든 티켓 ID:`, Array.from(KDSState.tickets.keys()));
        console.log(`🔍 현재 저장된 티켓 수:`, KDSState.tickets.size);
        
        // 모든 티켓 정보 출력 (디버깅용)
        KDSState.tickets.forEach((ticket, key) => {
          console.log(`📋 티켓 키: ${key}, ID 필드들:`, {
            id: ticket.id,
            check_id: ticket.check_id,
            ticket_id: ticket.ticket_id,
            order_id: ticket.order_id
          });
        });
        
        this._processingTickets.delete(ticketId);
        this.showError(`티켓 ${ticketId}을 찾을 수 없습니다. 페이지를 새로고침해주세요.`);
        return;
      }

      // 2. 현재 상태 백업 (실패 시 복구용)
      const originalTicketState = this._backupTicketState(ticket);

      try {
        // 3. UI 즉시 업데이트 (낙관적 업데이트)
        this._updateTicketToCookingState(ticketId, ticket);

        // 4. 서버 API 호출
        console.log(`🌐 티켓 ${ticketId} 서버 API 호출`);
        const result = await KDSAPIService.startCooking(ticketId);

        if (result.success) {
          console.log(`✅ 티켓 ${ticketId} 조리 시작 성공`);
          
          // 5. 성공 후 처리
          KDSSoundManager.playItemCompleteSound();
          
          // 서버 데이터로 최종 동기화 (필요시)
          if (result.data) {
            this._syncTicketWithServerData(ticketId, result.data);
          }

        } else {
          throw new Error(result.error || '조리 시작 실패');
        }

      } catch (error) {
        console.error(`❌ 티켓 ${ticketId} 조리 시작 실패:`, error);
        
        // 6. 실패 시 원래 상태로 복구
        this._restoreTicketState(ticketId, originalTicketState);
        
        this.showError(`조리 시작 중 오류가 발생했습니다: ${error.message}`);

      } finally {
        // 7. 처리 완료 마킹 해제
        this._processingTickets.delete(ticketId);
      }
    },

    /**
     * 티켓 상태 백업
     */
    _backupTicketState(ticket) {
      return {
        status: ticket.status,
        items: ticket.items ? ticket.items.map(item => ({
          id: item.id,
          status: item.status,
          item_status: item.item_status
        })) : []
      };
    },

    /**
     * 티켓을 조리 중 상태로 업데이트
     */
    _updateTicketToCookingState(ticketId, ticket) {
      console.log(`🎨 티켓 ${ticketId} COOKING 상태로 UI 업데이트`);

      // 1. 상태 데이터 업데이트
      ticket.status = 'COOKING';
      if (ticket.items) {
        ticket.items.forEach(item => {
          item.status = 'COOKING';
          item.item_status = 'COOKING';
        });
      }

      // 2. UI 업데이트
      KDSUIRenderer.updateTicketToCookingState(ticketId, ticket);
    },

    /**
     * 서버 데이터와 동기화
     */
    _syncTicketWithServerData(ticketId, serverData) {
      const ticket = KDSState.getTicket(ticketId);
      if (!ticket) return;

      // 서버에서 받은 데이터로 업데이트
      if (serverData.status) {
        ticket.status = serverData.status;
      }

      if (serverData.items) {
        serverData.items.forEach(serverItem => {
          const localItem = ticket.items?.find(item => item.id === serverItem.id);
          if (localItem) {
            localItem.status = serverItem.status || serverItem.item_status;
            localItem.item_status = serverItem.item_status || serverItem.status;
          }
        });
      }

      // UI 반영
      KDSUIRenderer.updateTicketCard(ticket);
    },

    /**
     * 티켓 상태 복구
     */
    _restoreTicketState(ticketId, originalState) {
      console.log(`🔄 티켓 ${ticketId} 원래 상태로 복구`);

      const ticket = KDSState.getTicket(ticketId);
      if (!ticket) return;

      // 원래 상태로 복구
      ticket.status = originalState.status;
      
      if (ticket.items && originalState.items) {
        ticket.items.forEach(item => {
          const originalItem = originalState.items.find(orig => orig.id === item.id);
          if (originalItem) {
            item.status = originalItem.status;
            item.item_status = originalItem.item_status;
          }
        });
      }

      // UI 복구
      KDSUIRenderer.updateTicketCard(ticket);
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
          
          // 즉시 UI에서 제거 (WebSocket 이벤트를 기다리지 않음)
          const ticket = KDSState.getTicket(ticketId);
          if (ticket) {
            ticket.status = 'completed';
            KDSSoundManager.playOrderCompleteSound();
            
            setTimeout(() => {
              KDSState.removeTicket(ticketId);
              KDSUIRenderer.removeTicketFromUI(ticketId);
              console.log(`🗑️ 완료된 티켓 ${ticketId} 즉시 제거`);
            }, 1000);
          }
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
     * 새로고침 - 상태 기반 로딩
     */
    async refresh() {
      try {
        console.log('🔄 KDS 새로고침 시작 - 상태 기반 로딩');

        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
          refreshBtn.style.transform = 'rotate(360deg)';
          setTimeout(() => {
            refreshBtn.style.transform = 'rotate(0deg)';
          }, 1000);
        }

        // 기존 카드 제거
        document.querySelectorAll('.ticket-card').forEach(card => card.remove());

        // 상태 초기화
        KDSState.tickets.clear();

        // 데이터 다시 로드 (PENDING, COOKING 상태만)
        const tickets = await KDSAPIService.loadInitialData(KDSState.storeId);

        console.log(`🔄 새로고침: ${tickets.length}개 티켓 로드 (DONE 상태 제외)`);

        // 상태별로 분류하여 렌더링
        tickets.forEach(ticket => {
          const status = (ticket.status || '').toUpperCase();
          
          // DONE 상태는 렌더링하지 않음
          if (status === 'DONE') {
            console.log(`⏭️ DONE 상태 티켓 ${ticket.ticket_id} 렌더링 스킵`);
            return;
          }

          console.log(`🎨 티켓 ${ticket.ticket_id} 상태 ${status}로 렌더링`);

          KDSState.setTicket(ticket.ticket_id || ticket.check_id, ticket);
          KDSUIRenderer.addTicketCard(ticket);
        });

        // 카운트 업데이트
        KDSUIRenderer.updateTicketCounts();
        KDSUIRenderer.checkEmptyState();

        console.log('✅ KDS 새로고침 완료 - 상태 기반 로딩');

      } catch (error) {
        console.error('❌ KDS 새로고침 실패:', error);
        alert('새로고침 중 오류가 발생했습니다: ' + error.message);
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
      // 처리 중인 티켓 목록 정리
      if (this._processingTickets) {
        this._processingTickets.clear();
      }
      
      KDSState.cleanup();
      KDSWebSocket.disconnect();
    },

    /**
     * 안전한 티켓 ID 추출 (초기화용)
     */
    _extractSafeTicketId(ticket) {
      // 우선순위: check_id > id > ticket_id > order_id
      return ticket.check_id || 
             ticket.id || 
             ticket.ticket_id || 
             ticket.order_id || 
             `unknown_${Date.now()}`;
    },

    /**
     * 티켓 ID로 티켓 찾기 (여러 형태의 ID 지원)
     */
    _findTicketById(ticketId) {
      // 1. 직접 키로 찾기
      let ticket = KDSState.getTicket(ticketId);
      if (ticket) {
        console.log(`✅ 직접 키로 티켓 찾음: ${ticketId}`);
        return ticket;
      }

      // 2. 문자열/숫자 변환해서 찾기
      const numericId = parseInt(ticketId);
      const stringId = String(ticketId);

      ticket = KDSState.getTicket(numericId) || KDSState.getTicket(stringId);
      if (ticket) {
        console.log(`✅ 형변환으로 티켓 찾음: ${numericId} / ${stringId}`);
        return ticket;
      }

      // 3. 모든 티켓을 순회하면서 ID 필드들로 찾기
      for (const [key, ticketData] of KDSState.tickets.entries()) {
        const ids = [
          ticketData.id,
          ticketData.check_id,
          ticketData.ticket_id,
          ticketData.order_id
        ].map(id => [id, parseInt(id), String(id)]).flat();

        if (ids.includes(ticketId) || ids.includes(numericId) || ids.includes(stringId)) {
          console.log(`✅ ID 필드로 티켓 찾음: ${key} (검색ID: ${ticketId})`);
          return ticketData;
        }
      }

      console.warn(`⚠️ 티켓을 찾을 수 없음: ${ticketId}`);
      return null;
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
