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

          // DB 기반 알림인지 확인
          if (data.data?.source === 'db_trigger') {
            this.handleDBNotification(data);
          } else {
            this.handleKDSUpdate(data);
          }
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
     * 새 티켓 생성 처리 - 개별 그리드 칸 렌더링
     */
    handleTicketCreated(ticket) {
      const ticketId = this._extractTicketId(ticket);

      if (!ticketId) {
        console.warn('⚠️ 티켓 ID가 없음 - 티켓 생성 스킵');
        return;
      }

      // 중복 티켓 확인 - 이미 존재하면 업데이트로 처리
      const existingTicket = KDSState.getTicket(ticketId);
      if (existingTicket) {
        console.log(`ℹ️ 티켓 ${ticketId}는 이미 존재함 - 업데이트로 처리`);
        return this.handleTicketUpdated(ticket);
      }

      // DB에서 온 실제 상태를 정규화하여 보존
      const actualStatus = (ticket.status || 'PENDING').toUpperCase();

      const normalizedTicket = {
        ...ticket,
        ticket_id: ticketId,
        check_id: ticketId,
        id: ticket.id || ticketId,
        table_number: ticket.table_number || ticket.table_num || 'N/A',
        customer_name: ticket.customer_name || `테이블 ${ticket.table_number || ticket.table_num}`,
        items: ticket.items || [],
        status: actualStatus,
        created_at: ticket.created_at || new Date().toISOString()
      };

      // 모든 아이템을 저장 (프론트엔드에서 필터링)
      normalizedTicket.items = normalizedTicket.items.map(item => ({
        ...item,
        status: actualStatus === 'COOKING' ? 'COOKING' : (item.status || 'PENDING'),
        item_status: actualStatus === 'COOKING' ? 'COOKING' : (item.item_status || 'PENDING'),
        cook_station: item.cook_station || 'KITCHEN'
      }));

      console.log(`📋 새 티켓 ${ticketId}: 총 ${normalizedTicket.items.length}개 아이템 저장`);

      // 상태에 티켓 저장
      KDSState.setTicket(ticketId, normalizedTicket);

      // 개별 그리드 칸에 직접 렌더링
      if (window.KDSUIRenderer) {
        console.log(`🎨 티켓 ${ticketId} 개별 그리드 칸 렌더링`);
        this._renderTicketToEmptySlot(normalizedTicket);
      }

      // 사운드 재생
      if (window.KDSSoundManager) {
        window.KDSSoundManager.playNewOrderSound();
      }

      // 탭 카운트 업데이트
      if (window.KDSUIRenderer && typeof window.KDSUIRenderer.updateTicketCounts === 'function') {
        window.KDSUIRenderer.updateTicketCounts();
      }

      console.log(`✅ 새 티켓 개별 렌더링 완료: ${ticketId}`);
    },

    /**
     * 빈 슬롯에 티켓 직접 렌더링
     */
    _renderTicketToEmptySlot(ticket) {
      try {
        const gridContainer = document.getElementById('kdsGrid');
        if (!gridContainer) {
          console.warn('⚠️ Grid 컨테이너를 찾을 수 없음');
          return false;
        }

        // 1-9번 슬롯 중 빈 슬롯 찾기
        const emptySlot = Array.from(gridContainer.children)
          .find(slot => {
            const slotNumber = parseInt(slot.dataset.slot);
            return slotNumber <= 9 && slot.querySelector('.empty-slot');
          });

        if (!emptySlot) {
          console.log('ℹ️ 사용 가능한 빈 슬롯이 없음 (1-9번)');
          return false;
        }

        const slotNumber = emptySlot.dataset.slot;
        
        // 주방 아이템이 있는지 확인
        const kitchenItems = (ticket.items || []).filter(item => {
          const cookStation = item.cook_station || 'KITCHEN';
          return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
        });

        if (kitchenItems.length === 0) {
          console.log(`ℹ️ 티켓 ${ticket.ticket_id}에 주방 아이템이 없음 - 렌더링 스킵`);
          return false;
        }

        // 카드 HTML 생성
        const cardHTML = window.KDSUIRenderer.createOrderCardHTML(ticket);
        
        // 슬롯에 카드 직접 삽입
        emptySlot.innerHTML = cardHTML;

        // 애니메이션 효과
        const newCard = emptySlot.querySelector('.order-card');
        if (newCard) {
          newCard.style.opacity = '0';
          newCard.style.transform = 'scale(0.8)';

          setTimeout(() => {
            newCard.style.transition = 'all 0.3s ease';
            newCard.style.opacity = '1';
            newCard.style.transform = 'scale(1)';
          }, 100);
        }

        console.log(`✅ 티켓 ${ticket.ticket_id}을 슬롯 ${slotNumber}에 개별 렌더링 완료`);
        return true;

      } catch (error) {
        console.error('❌ 개별 슬롯 렌더링 실패:', error);
        return false;
      }
    },

    /**
     * 티켓 개별 슬롯에서 제거
     */
    _removeTicketFromSlot(ticketId) {
      try {
        const cardElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
        if (!cardElement) {
          console.log(`ℹ️ 티켓 ${ticketId} 카드를 찾을 수 없음`);
          return false;
        }

        const slotElement = cardElement.closest('.grid-slot');
        if (!slotElement) {
          console.warn(`⚠️ 티켓 ${ticketId}의 슬롯을 찾을 수 없음`);
          return false;
        }

        const slotNumber = slotElement.dataset.slot;

        // 애니메이션 효과
        cardElement.style.transition = 'all 0.3s ease';
        cardElement.style.transform = 'scale(0.8)';
        cardElement.style.opacity = '0';

        setTimeout(() => {
          // 빈 슬롯으로 교체
          if (parseInt(slotNumber) <= 9) { // 1-9번 슬롯만
            slotElement.innerHTML = `
              <div class="empty-slot">
                <div class="slot-number">${slotNumber}</div>
                <div class="slot-text">대기중</div>
              </div>
            `;
            console.log(`🗑️ 티켓 ${ticketId}을 슬롯 ${slotNumber}에서 제거하고 빈 슬롯으로 교체`);
          }
        }, 300);

        return true;

      } catch (error) {
        console.error('❌ 개별 슬롯에서 제거 실패:', error);
        return false;
      }
    },

    /**
     * 티켓 상태 변경 시 개별 슬롯 업데이트
     */
    _updateTicketSlot(ticket) {
      try {
        const ticketId = this._extractTicketId(ticket);
        const cardElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
        
        if (!cardElement) {
          console.log(`ℹ️ 티켓 ${ticketId} 카드를 찾을 수 없음`);
          return false;
        }

        const slotElement = cardElement.closest('.grid-slot');
        if (!slotElement) {
          console.warn(`⚠️ 티켓 ${ticketId}의 슬롯을 찾을 수 없음`);
          return false;
        }

        // 새 카드 HTML 생성
        const newCardHTML = window.KDSUIRenderer.createOrderCardHTML(ticket);
        
        // 슬롯 내용 교체
        slotElement.innerHTML = newCardHTML;

        console.log(`🔄 티켓 ${ticketId} 슬롯 개별 업데이트 완료`);
        return true;

      } catch (error) {
        console.error('❌ 개별 슬롯 업데이트 실패:', error);
        return false;
      }
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
     * 티켓 조리 시작 처리 - 개별 슬롯 업데이트
     */
    handleTicketCookingStarted(data) {
      const ticketId = data.ticket_id;
      console.log(`🔥 WebSocket: 티켓 ${ticketId} 조리 시작 이벤트 수신`);

      const ticket = KDSState.getTicket(ticketId);
      if (!ticket) {
        console.warn(`⚠️ WebSocket: 티켓 ${ticketId}을 찾을 수 없음`);
        return;
      }

      // 현재 처리 중인 티켓이면 WebSocket 이벤트 무시 (중복 방지)
      if (window.KDSManager?._processingTickets?.has(ticketId)) {
        console.log(`🔄 WebSocket: 티켓 ${ticketId} 이미 처리 중 - 이벤트 무시`);
        return;
      }

      // 상태 업데이트
      ticket.status = 'COOKING';
      if (ticket.items) {
        ticket.items.forEach(item => {
          item.status = 'COOKING';
          item.item_status = 'COOKING';
        });
      }

      // 개별 슬롯 업데이트
      const success = this._updateTicketSlot(ticket);
      
      if (success) {
        console.log(`✅ 티켓 ${ticketId} 개별 슬롯 조리 상태 업데이트 완료`);
      } else {
        console.warn(`⚠️ 티켓 ${ticketId} 개별 슬롯 업데이트 실패`);
      }

      // 사운드 재생
      if (window.KDSSoundManager) {
        window.KDSSoundManager.playItemCompleteSound();
      }
    },

    /**
     * 티켓 완료 처리 - 개별 슬롯에서 제거
     */
    handleTicketCompleted(data) {
      console.log('✅ 티켓 완료 이벤트 (DONE 상태):', data);

      const ticketId = data.ticket_id;
      const ticket = KDSState.getTicket(ticketId);

      if (!ticket) {
        console.log(`ℹ️ 티켓 ${ticketId}이 이미 제거됨 - WebSocket 이벤트 무시`);
        return;
      }

      console.log(`🗑️ 티켓 ${ticketId} 개별 슬롯에서 제거`);

      // 사운드 재생
      if (window.KDSSoundManager && !ticket._soundPlayed) {
        window.KDSSoundManager.playOrderCompleteSound();
        ticket._soundPlayed = true;
      }

      // 개별 슬롯에서 제거
      const success = this._removeTicketFromSlot(ticketId);
      
      if (success) {
        // 상태에서 제거
        KDSState.removeTicket(ticketId);
        
        // 탭 카운트 업데이트
        if (window.KDSUIRenderer && typeof window.KDSUIRenderer.updateTicketCounts === 'function') {
          window.KDSUIRenderer.updateTicketCounts();
        }
        
        console.log(`✅ 티켓 ${ticketId} 개별 슬롯 제거 완료`);
      } else {
        console.warn(`⚠️ 티켓 ${ticketId} 개별 슬롯 제거 실패`);
      }
    },

    /**
     * 티켓 업데이트 처리 - 개별 슬롯 업데이트
     */
    handleTicketUpdated(ticket) {
      const ticketId = ticket.ticket_id || ticket.check_id || ticket.id;
      const actualStatus = (ticket.status || '').toUpperCase();

      console.log(`🔄 티켓 업데이트 이벤트: ${ticketId}, 상태: ${actualStatus}`);

      // 완료된 티켓은 즉시 제거 처리
      if (['DONE', 'COMPLETED', 'SERVED'].includes(actualStatus)) {
        console.log(`✅ WebSocket: 완료된 티켓 ${ticketId} 감지 - 개별 슬롯에서 제거`);
        return this.handleTicketCompleted({ ticket_id: ticketId });
      }

      const existingTicket = KDSState.getTicket(ticketId);
      if (!existingTicket) {
        console.log(`ℹ️ 기존 티켓이 없음 - 새 티켓으로 생성: ${ticketId}`);
        return this.handleTicketCreated(ticket);
      }

      // DB 상태를 정확히 반영
      const normalizedStatus = (ticket.status || existingTicket.status || 'PENDING').toUpperCase();

      const updatedTicket = { 
        ...existingTicket, 
        ...ticket,
        status: normalizedStatus,
        updated_at: ticket.updated_at || new Date().toISOString()
      };

      // 아이템들도 티켓 상태에 맞춰 동기화
      if (updatedTicket.items && normalizedStatus === 'COOKING') {
        updatedTicket.items = updatedTicket.items.map(item => ({
          ...item,
          status: 'COOKING',
          item_status: 'COOKING'
        }));
      }

      // 상태에 업데이트된 티켓 저장
      KDSState.setTicket(ticketId, updatedTicket);

      // 개별 슬롯 업데이트
      const success = this._updateTicketSlot(updatedTicket);
      
      if (success) {
        console.log(`✅ 티켓 ${ticketId} 개별 슬롯 업데이트 완료 (상태: ${normalizedStatus})`);
      } else {
        console.warn(`⚠️ 티켓 ${ticketId} 개별 슬롯 업데이트 실패`);
      }

      // 탭 카운트 업데이트
      if (window.KDSUIRenderer && typeof window.KDSUIRenderer.updateTicketCounts === 'function') {
        window.KDSUIRenderer.updateTicketCounts();
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
     * 안전한 티켓 ID 추출
     */
    _extractTicketId(ticket) {
      // 우선순위: check_id > ticket_id > id > order_id
      return ticket.check_id || 
             ticket.ticket_id || 
             ticket.id || 
             ticket.order_id || 
             `unknown_${Date.now()}`;
    },

    /**
     * 주기적 동기화 시작
     */
    startPeriodicSync(storeId, intervalMs = 15000) {
      // 기존 동기화 타이머 정리
      if (KDSState.syncInterval) {
        clearInterval(KDSState.syncInterval);
      }

      let lastSyncAt = new Date().toISOString();

      KDSState.syncInterval = setInterval(async () => {
        try {
          // WebSocket 연결이 정상이면 동기화 생략
          if (KDSState.isConnected && KDSState.socket?.connected) {
            console.log('🔄 WebSocket 연결 정상 - 동기화 생략');
            return;
          }

          console.log('🔄 KDS 백업 동기화 시작');

          const response = await fetch(
            `/api/orders/kds/${storeId}/sync?lastSyncAt=${encodeURIComponent(lastSyncAt)}`
          );

          if (!response.ok) {
            throw new Error(`동기화 API 오류: ${response.status}`);
          }

          const syncData = await response.json();

          if (syncData.success) {
            // 업데이트된 티켓 처리
            syncData.changes.updated.forEach(ticket => {
              console.log(`🔄 동기화: 티켓 ${ticket.ticket_id} 업데이트`);
              this.handleTicketUpdated(ticket);
            });

            // 삭제된 티켓 처리
            syncData.changes.deleted.forEach(deletedTicket => {
              console.log(`🔄 동기화: 티켓 ${deletedTicket.ticket_id} 제거`);
              KDSState.removeTicket(deletedTicket.ticket_id);
              if (window.KDSUIRenderer) {
                window.KDSUIRenderer.removeTicketCard(deletedTicket.ticket_id);
              }
            });

            // 필터링 재적용
            if (window.KDSManager) {
              window.KDSManager.filterTickets();
            }

            lastSyncAt = syncData.timestamp;

            console.log(`✅ KDS 동기화 완료: ${syncData.stats.updated}개 업데이트, ${syncData.stats.deleted}개 삭제`);
          }

        } catch (error) {
          console.warn('⚠️ KDS 백업 동기화 실패:', error);
        }
      }, intervalMs);

      console.log(`✅ KDS 주기적 동기화 시작 (${intervalMs/1000}초 간격)`);
    },

    /**
     * 동기화 중지
     */
    stopPeriodicSync() {
      if (KDSState.syncInterval) {
        clearInterval(KDSState.syncInterval);
        KDSState.syncInterval = null;
        console.log('🔄 KDS 주기적 동기화 중지');
      }
    },

    /**
     * DB 기반 변경 감지 처리
     */
    handleDBNotification(data) {
      console.log('📡 DB 알림 수신:', data);

      switch (data.type) {
        case 'db_order_change':
        case 'db_ticket_change':
          this.handleTicketUpdated({
            ticket_id: data.data.ticket_id,
            status: data.data.status,
            source: 'db_trigger'
          });
          break;

        case 'db_item_change':
          this.handleItemUpdated({
            ticket_id: data.data.ticket_id,
            item_id: data.data.item_id,
            item_status: data.data.item_status,
            source: 'db_trigger'
          });
          break;

        case 'db_payment_change':
          // 결제 완료 시 해당 테이블의 모든 티켓 제거
          const tableTickets = KDSState.getAllTickets().filter(
            ticket => ticket.table_number === data.data.table_number
          );

          tableTickets.forEach(ticket => {
            KDSState.removeTicket(ticket.ticket_id || ticket.id);
            if (window.KDSUIRenderer) {
              window.KDSUIRenderer.removeTicketCard(ticket.ticket_id || ticket.id);
            }
          });

          console.log(`💳 결제 완료: 테이블 ${data.data.table_number} 티켓 ${tableTickets.length}개 제거`);
          break;
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