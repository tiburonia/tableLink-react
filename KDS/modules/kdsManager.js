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

        // UI 렌더링 (Grid 레이아웃 포함)
        console.log('🎨 KDS UI 렌더링 시작');
        
        if (window.KDSUIRenderer && typeof window.KDSUIRenderer.render === 'function') {
          // 메인 UI 구조 렌더링 (헤더, 탭, 그리드 컨테이너)
          KDSUIRenderer.render(storeId);
          console.log('✅ KDS 메인 UI 구조 렌더링 완료');
          
          // 초기에는 빈 그리드 렌더링
          if (typeof window.KDSUIRenderer.renderKDSGrid === 'function') {
            window.KDSUIRenderer.renderKDSGrid([]);
            console.log('✅ KDS 빈 그리드 렌더링 완료');
          }
        } else {
          console.error('❌ KDSUIRenderer.render 함수를 찾을 수 없습니다');
          throw new Error('KDS UI 렌더러를 찾을 수 없습니다');
        }

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

        // 티켓 카드 렌더링 (Grid에 맞게)
        // KDSUIRenderer.renderKDSGrid에서 처리하도록 변경
        if (window.KDSUIRenderer && typeof window.KDSUIRenderer.renderKDSGrid === 'function') {
          window.KDSUIRenderer.renderKDSGrid(tickets);
        }


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

      // 티켓 필터링 (Grid 재렌더링 포함)
      this.filterTickets();
    },

    /**
     * 티켓 필터링
     */
    filterTickets() {
      const currentTab = KDSState.currentTab;
      let tickets;

      if (currentTab === 'active') {
        tickets = KDSState.getActiveTickets();
      } else {
        tickets = KDSState.getCompletedTickets();
      }

      // Grid 재렌더링
      if (window.KDSUIRenderer && typeof window.KDSUIRenderer.renderKDSGrid === 'function') {
        window.KDSUIRenderer.renderKDSGrid(tickets);
      }

      console.log(`🔍 필터링 완료: ${currentTab} 탭, ${tickets.length}개 티켓 표시`);
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

      // 2. UI 업데이트 (Grid 내에서 카드 업데이트)
      if (window.KDSUIRenderer && typeof window.KDSUIRenderer.updateTicketCard === 'function') {
        window.KDSUIRenderer.updateTicketCard(ticketId, ticket);
      }
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

      // UI 반영 (Grid 내에서 카드 업데이트)
      if (window.KDSUIRenderer && typeof window.KDSUIRenderer.updateTicketCard === 'function') {
        window.KDSUIRenderer.updateTicketCard(ticketId, ticket);
      }
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

      // UI 복구 (Grid 내에서 카드 업데이트)
      if (window.KDSUIRenderer && typeof window.KDSUIRenderer.updateTicketCard === 'function') {
        window.KDSUIRenderer.updateTicketCard(ticketId, ticket);
      }
    },

    /**
     * 주문 완료 - 개별 카드 직접 제거 (즉시 삭제)
     */
    async markComplete(ticketId) {
      try {
        console.log(`✅ 티켓 ${ticketId} 완료 요청 - 개별 카드 직접 제거`);

        // 1. 사운드 재생
        if (window.KDSSoundManager) {
          window.KDSSoundManager.playOrderCompleteSound();
        }

        // 2. 즉시 UI에서 개별 카드 제거 (DOM 직접 조작)
        this.removeCardFromUI(ticketId);

        // 3. 상태에서 제거
        KDSState.removeTicket(ticketId);

        // 4. 카운트 업데이트
        if (window.KDSUIRenderer && typeof window.KDSUIRenderer.updateTicketCounts === 'function') {
          window.KDSUIRenderer.updateTicketCounts();
        }

        console.log(`✅ 티켓 ${ticketId} UI에서 즉시 제거 완료`);

        // 5. 백그라운드에서 서버 API 호출
        setTimeout(async () => {
          try {
            const result = await KDSAPIService.markComplete(ticketId);
            if (result.success) {
              console.log(`✅ 서버 완료 처리 성공: ${ticketId}`);
            } else {
              console.warn(`⚠️ 서버 완료 처리 실패 (UI는 이미 삭제됨): ${result.error}`);
            }
          } catch (serverError) {
            console.warn(`⚠️ 서버 API 호출 실패 (UI는 이미 삭제됨):`, serverError);
          }
        }, 100);

      } catch (error) {
        console.error('❌ 완료 처리 실패:', error);
        
        // 에러가 발생해도 강제로 개별 카드 제거
        this.removeCardFromUI(ticketId);
        KDSState.removeTicket(ticketId);
        
        if (window.KDSUIRenderer && typeof window.KDSUIRenderer.updateTicketCounts === 'function') {
          window.KDSUIRenderer.updateTicketCounts();
        }
        
        console.log(`🚨 에러 발생했지만 강제로 카드 제거 완료: ${ticketId}`);
      }
    },

    /**
     * UI에서 개별 카드 직접 제거
     */
    removeCardFromUI(ticketId) {
      try {
        // 1. 해당 티켓 카드 찾기
        const cardElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
        
        if (cardElement) {
          // 2. 부모 슬롯 찾기
          const slotElement = cardElement.closest('.grid-slot');
          
          if (slotElement) {
            // 3. 슬롯 번호 가져오기
            const slotNumber = slotElement.dataset.slot;
            
            // 4. 애니메이션 효과와 함께 제거
            cardElement.style.transition = 'all 0.3s ease';
            cardElement.style.transform = 'scale(0.8)';
            cardElement.style.opacity = '0';
            
            setTimeout(() => {
              // 5. 빈 슬롯으로 교체
              if (slotElement && slotNumber) {
                slotElement.innerHTML = `
                  <div class="empty-slot">
                    <div class="slot-number">${slotNumber}</div>
                    <div class="slot-text">대기중</div>
                  </div>
                `;
                console.log(`🗑️ 티켓 ${ticketId} 카드를 슬롯 ${slotNumber}에서 제거하고 빈 슬롯으로 교체`);
              }
            }, 300);
            
            return true;
          }
        }
        
        console.warn(`⚠️ 티켓 ${ticketId} 카드를 DOM에서 찾을 수 없음`);
        return false;
        
      } catch (error) {
        console.error('❌ 개별 카드 제거 실패:', error);
        return false;
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
      alert('설정 화면 (구현 예정)');
      console.log('⚙️ 설정 화면 요청');
    },

    /**
     * 모든 주문 보기
     */
    showAllOrders() {
      const allOrders = KDSState.getAllTickets();
      console.log('📋 모든 주문 보기:', allOrders.length + '개');

      // 임시로 콘솔에 출력
      console.table(allOrders.map(order => ({
        ID: order.check_id || order.id,
        테이블: order.table_number,
        상태: order.status,
        생성시간: order.created_at
      })));

      alert(`총 ${allOrders.length}개의 주문이 있습니다. (콘솔 참조)`);
    },

    /**
     * 새로고침 - 상태 기반 로딩 (Grid 레이아웃 적용)
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

        // 기존 카드 제거 (Grid 컨테이너 비우기)
        if (window.KDSUIRenderer && typeof window.KDSUIRenderer.clearGrid === 'function') {
          window.KDSUIRenderer.clearGrid();
        }

        // 상태 초기화
        KDSState.tickets.clear();

        // 데이터 다시 로드 (모든 상태 로드 후 프론트에서 필터링)
        const tickets = await KDSAPIService.loadInitialData(KDSState.storeId);

        console.log(`🔄 새로고침: ${tickets.length}개 티켓 로드`);

        // 모든 티켓을 상태에 저장 (탭별 필터링은 getActiveTickets/getCompletedTickets에서 처리)
        tickets.forEach(ticket => {
          const actualStatus = (ticket.status || '').toUpperCase();
          const ticketId = ticket.ticket_id || ticket.check_id || ticket.id;

          console.log(`📋 티켓 ${ticketId} 상태: ${actualStatus}`);

          // DB 상태를 정확히 보존하여 저장
          const normalizedTicket = {
            ...ticket,
            status: actualStatus,
            ticket_id: ticketId,
            check_id: ticketId,
            id: ticket.id || ticketId
          };

          // 아이템들도 티켓 상태에 맞춰 동기화
          if (normalizedTicket.items && actualStatus === 'COOKING') {
            normalizedTicket.items = normalizedTicket.items.map(item => ({
              ...item,
              status: 'COOKING',
              item_status: 'COOKING'
            }));
          }

          KDSState.setTicket(ticketId, normalizedTicket);
        });

        // 현재 탭에 맞는 티켓들만 Grid에 렌더링
        this.filterTickets(); // 현재 탭 기준으로 필터링된 렌더링

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
     * 정리 작업
     */
    cleanup() {
      if (window.KDSWebSocket) {
        window.KDSWebSocket.disconnect();
      }

      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }

      console.log('🧹 KDS 관리자 정리 완료');
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
     * 티켓 ID로 티켓 찾기 (여러 형태의 ID 지원) - 개선된 버전
     */
    _findTicketById(ticketId) {
      console.log(`🔍 티켓 검색 시작: ${ticketId} (타입: ${typeof ticketId})`);
      console.log(`🔍 현재 저장된 티켓 수: ${KDSState.tickets.size}`);

      // 디버깅: 현재 저장된 모든 티켓 키 출력
      const allKeys = Array.from(KDSState.tickets.keys());
      console.log(`🔍 저장된 모든 티켓 키:`, allKeys);

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

      // 3. 모든 티켓을 순회하면서 ID 필드들로 찾기 (개선된 로직)
      console.log(`🔍 전체 순회 검색 시작 (검색 대상: ${ticketId}, ${numericId}, ${stringId})`);

      for (const [key, ticketData] of KDSState.tickets.entries()) {
        console.log(`🔍 티켓 ${key} 검사:`, {
          stored_key: key,
          ticket_id: ticketData.id,
          check_id: ticketData.check_id,
          ticket_id_field: ticketData.ticket_id,
          order_id: ticketData.order_id
        });

        // ID 필드들을 안전하게 처리
        const idFields = [
          ticketData.id,
          ticketData.check_id,
          ticketData.ticket_id,
          ticketData.order_id
        ].filter(id => id != null); // null/undefined 제거

        // 각 ID 필드를 문자열과 숫자로 변환하여 비교
        for (const idField of idFields) {
          const idAsString = String(idField);
          const idAsNumber = parseInt(idField);

          if (idField === ticketId ||
              idAsString === String(ticketId) ||
              idAsNumber === numericId ||
              idField === numericId ||
              idField === stringId) {
            console.log(`✅ ID 필드 매칭 성공: 키=${key}, 필드=${idField}, 검색=${ticketId}`);
            return ticketData;
          }
        }
      }

      // 4. 최후의 수단: Map의 values()를 이용한 검색
      console.log(`🔍 values() 기반 최후 검색 시도`);

      for (const ticketData of KDSState.tickets.values()) {
        if (ticketData && (
            ticketData.id == ticketId ||
            ticketData.check_id == ticketId ||
            ticketData.ticket_id == ticketId ||
            ticketData.order_id == ticketId
          )) {
          console.log(`✅ values() 검색으로 티켓 발견:`, ticketData.id || ticketData.check_id);
          return ticketData;
        }
      }

      console.warn(`❌ 티켓을 찾을 수 없음: ${ticketId}`);
      console.warn(`❌ 검색 시도한 형태들:`, {
        original: ticketId,
        numeric: numericId,
        string: stringId,
        type: typeof ticketId
      });

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