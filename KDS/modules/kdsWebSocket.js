
/**
 * KDS WebSocket 관리 모듈
 * - WebSocket 연결/해제
 * - 실시간 이벤트 처리
 * - 티켓 생성/업데이트 처리
 */

(function() {
  'use strict';

  console.log('🔌 KDS WebSocket 모듈 로드');

  // =================== WebSocket 관리 ===================
  window.KDSWebSocket = {
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
          KDSState.setConnectionStatus(true);
          if (window.KDSUIRenderer) {
            window.KDSUIRenderer.updateConnectionStatus(true);
          }

          // 매장별 룸 조인
          socket.emit('join-kds', storeId);
        });

        socket.on('disconnect', () => {
          console.log('❌ KDS WebSocket 연결 해제');
          KDSState.setConnectionStatus(false);
          if (window.KDSUIRenderer) {
            window.KDSUIRenderer.updateConnectionStatus(false);
          }
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
        if (window.KDSUIRenderer) {
          window.KDSUIRenderer.updateConnectionStatus(false);
        }
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
      KDSState.setConnectionStatus(false);
      if (window.KDSUIRenderer) {
        window.KDSUIRenderer.updateConnectionStatus(false);
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
          console.log('🎫 새 주문 수신 (KDS 업데이트):', data.data);
          this.handleTicketCreated(data.data);
          break;
        case 'ticket_cooking_started':
          this.handleTicketCookingStarted(data.data);
          break;
        case 'ticket_completed':
          this.handleTicketCompleted(data.data);
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
      const ticketId = ticket.ticket_id || ticket.check_id || ticket.id;

      if (!ticketId) {
        console.warn('⚠️ 티켓 ID가 없음 - 티켓 생성 스킵');
        return;
      }

      if (KDSState.getTicket(ticketId)) {
        console.log(`ℹ️ 티켓 ${ticketId}는 이미 존재함 - 업데이트로 처리`);
        return this.handleTicketUpdated(ticket);
      }

      const normalizedTicket = {
        ...ticket,
        ticket_id: ticketId,
        check_id: ticketId,
        table_number: ticket.table_number || ticket.table_num || 'N/A',
        customer_name: ticket.customer_name || `테이블 ${ticket.table_number || ticket.table_num}`,
        items: ticket.items || [],
        status: ticket.status || 'pending',
        created_at: ticket.created_at || new Date().toISOString()
      };

      // 주방 아이템만 필터링
      const kitchenItems = normalizedTicket.items.filter(item => 
        item.cook_station === 'KITCHEN' || !item.cook_station
      );

      if (kitchenItems.length === 0) {
        console.log(`ℹ️ 티켓 ${ticketId}에 주방 아이템이 없음 - 스킵`);
        return;
      }

      normalizedTicket.items = kitchenItems;

      KDSState.setTicket(ticketId, normalizedTicket);
      
      if (window.KDSUIRenderer) {
        window.KDSUIRenderer.addTicketCard(normalizedTicket);
      }
      
      if (window.KDSSoundManager) {
        window.KDSSoundManager.playNewOrderSound();
      }

      console.log(`✅ 새 티켓 추가: ${ticketId} (${kitchenItems.length}개 아이템)`);
    },

    /**
     * 아이템 업데이트 처리
     */
    handleItemUpdated(data) {
      const ticketId = data.ticket_id;
      const ticket = KDSState.getTicket(ticketId);

      if (ticket && ticket.items) {
        const item = ticket.items.find(i => i.id === data.item_id);
        if (item) {
          item.item_status = data.item_status;
          if (window.KDSUIRenderer) {
            window.KDSUIRenderer.updateItemStatus(ticketId, data.item_id, data.item_status);
          }
          this.checkTicketCompletion(ticketId);
        }
      }
    },

    /**
     * 티켓 조리 시작 처리
     */
    handleTicketCookingStarted(data) {
      const ticketId = data.ticket_id;
      const ticket = KDSState.getTicket(ticketId);

      if (ticket) {
        ticket.status = 'COOKING';

        if (ticket.items) {
          ticket.items.forEach(item => {
            item.status = 'COOKING';
            item.item_status = 'COOKING';
          });
        }

        if (window.KDSUIRenderer) {
          window.KDSUIRenderer.updateTicketCard(ticket);
          window.KDSUIRenderer.updateTicketCookingState(ticketId, 'COOKING');
        }

        console.log(`🔥 티켓 ${ticketId} 조리 시작 완료 - UI 업데이트됨`);

        if (window.KDSSoundManager) {
          window.KDSSoundManager.playItemCompleteSound();
        }
      }
    },

    /**
     * 티켓 완료 처리
     */
    handleTicketCompleted(data) {
      const ticketId = data.ticket_id;

      KDSState.removeTicket(ticketId);

      if (window.KDSUIRenderer) {
        window.KDSUIRenderer.removeTicketCard(ticketId);
      }

      console.log(`✅ 티켓 ${ticketId} 완료 - UI에서 제거됨`);
      
      if (window.KDSSoundManager) {
        window.KDSSoundManager.playOrderCompleteSound();
      }
    },

    /**
     * 티켓 업데이트 처리
     */
    handleTicketUpdated(ticket) {
      const ticketId = ticket.ticket_id || ticket.id;
      const existingTicket = KDSState.getTicket(ticketId);
      const updatedTicket = { ...existingTicket, ...ticket };
      
      KDSState.setTicket(ticketId, updatedTicket);
      
      if (window.KDSUIRenderer) {
        window.KDSUIRenderer.updateTicketCard(updatedTicket);
      }
    },

    /**
     * 티켓 숨김 처리
     */
    handleTicketHidden(data) {
      const ticketId = data.ticket_id;
      KDSState.removeTicket(ticketId);
      
      if (window.KDSUIRenderer) {
        window.KDSUIRenderer.removeTicketCard(ticketId);
      }
    },

    /**
     * 티켓 완료 상태 확인
     */
    checkTicketCompletion(ticketId) {
      const ticket = KDSState.getTicket(ticketId);
      if (!ticket || !ticket.items) return;

      const allCompleted = ticket.items.every(item => 
        item.item_status === 'ready' || item.item_status === 'served'
      );

      if (allCompleted && ticket.status !== 'completed') {
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
      const ticket = KDSState.getTicket(ticketId);
      if (KDSState.socket && KDSState.isConnected && ticket) {
        KDSState.socket.emit('ticket:setStatus', {
          ticket_id: ticketId,
          next: newStatus,
          if_version: ticket.version
        });
      }
    },

    /**
     * 사용자 정보 가져오기
     */
    getUserInfo() {
      try {
        const cookies = document.cookie.split(';').map(cookie => cookie.trim());
        const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

        if (userInfoCookie) {
          const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
          const userInfo = JSON.parse(userInfoValue);
          console.log('✅ KDS 사용자 정보 확인:', userInfo.name || userInfo.id);
          return userInfo;
        }

        const localStorageUserInfo = localStorage.getItem('userInfo');
        if (localStorageUserInfo) {
          const userInfo = JSON.parse(localStorageUserInfo);
          console.log('✅ KDS 사용자 정보 확인 (localStorage):', userInfo.name || userInfo.id);
          return userInfo;
        }

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

  console.log('✅ KDS WebSocket 모듈 로드 완료');
})();
