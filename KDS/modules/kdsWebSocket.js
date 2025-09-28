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

        // 티켓 수정 이벤트
        socket.on('ticket-modified', (data) => {
          console.log('🔄 티켓 수정 이벤트 수신:', data);
          this.handleTicketModified(data);
        });

        // 티켓 취소 이벤트
        socket.on('ticket-canceled', (data) => {
          console.log('❌ 티켓 취소 이벤트 수신:', data);
          this.handleTicketCanceled(data);
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
     * 새 티켓 생성 처리 - 전체 Grid 재렌더링으로 처리
     */
    handleTicketCreated(ticket) {
      const ticketId = this._extractTicketId(ticket);

      console.log(`🎫 새 티켓 생성 이벤트: ${ticketId} - 전체 Grid 재렌더링`);

      if (!ticketId) {
        console.warn('⚠️ 티켓 ID가 없음 - 티켓 생성 스킵');
        return;
      }

      // 중복 티켓 확인 - 재귀 방지
      const existingTicket = KDSState.getTicket(ticketId);
      if (existingTicket) {
        console.log(`ℹ️ 티켓 ${ticketId}는 이미 존재함 - 재귀 방지 모드로 업데이트 처리`);
        return this.handleTicketUpdated(ticket, true);
      }

      // 주방 관련 아이템만 필터링
      const kitchenItems = (ticket.items || []).filter(item => {
        const cookStation = item.cook_station || 'KITCHEN';
        return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
      });

      if (kitchenItems.length === 0) {
        console.log(`ℹ️ 티켓 ${ticketId}에 주방 아이템이 없음 - KDS 처리 스킵`);
        return;
      }

      // DB에서 온 실제 상태를 정규화하여 보존
      const actualStatus = (ticket.status || 'PENDING').toUpperCase();

      const normalizedTicket = {
        ...ticket,
        // ID 필드 정규화 (order_tickets.id 우선순위 보장)
        ticket_id: ticket.ticket_id || ticketId,
        check_id: ticket.check_id || ticketId,
        id: ticket.id || ticket.ticket_id || ticketId,
        batch_no: ticket.batch_no || 1,
        table_number: ticket.table_number || ticket.table_num || 'N/A',
        table_num: ticket.table_num || ticket.table_number || 'N/A',
        customer_name: ticket.customer_name || `테이블 ${ticket.table_number || ticket.table_num}`,
        items: kitchenItems,
        status: actualStatus,
        source: ticket.source || 'POS',
        created_at: ticket.created_at || new Date().toISOString()
      };

      // 아이템 상태 동기화
      normalizedTicket.items = normalizedTicket.items.map(item => ({
        ...item,
        status: actualStatus === 'COOKING' ? 'COOKING' : (item.status || 'PENDING'),
        item_status: actualStatus === 'COOKING' ? 'COOKING' : (item.item_status || 'PENDING'),
        cook_station: item.cook_station || 'KITCHEN',
        menuName: item.menuName || item.menu_name || '메뉴',
        quantity: item.quantity || 1
      }));

      // 상태에 티켓 저장
      KDSState.setTicket(ticketId, normalizedTicket);
      console.log(`💾 티켓 ${ticketId} 저장 완료 - ${kitchenItems.length}개 주방 아이템, 총 ${KDSState.tickets.size}개 티켓`);

      // 전체 Grid 재렌더링
      this._triggerFullGridRerender('new_ticket');

      // 사운드 재생
      if (window.KDSSoundManager) {
        window.KDSSoundManager.playNewOrderSound();
      }

      console.log(`✅ 새 티켓 ${ticketId} 처리 완료 - 전체 Grid 재렌더링됨`);
    },

    /**
     * HTML DOM에 새 티켓 카드 직접 추가
     */
    _addTicketCardToDOM(ticket) {
      try {
        const ticketId = this._extractTicketId(ticket);
        console.log(`🔍 새 티켓 ${ticketId} DOM 추가 시작`);

        const gridContainer = document.getElementById('kdsGrid');
        if (!gridContainer) {
          console.warn('⚠️ Grid 컨테이너를 찾을 수 없음');
          return false;
        }

        // 현재 그리드 상태 로깅
        const allSlots = Array.from(gridContainer.children);
        console.log(`🔍 현재 그리드 상태: 총 ${allSlots.length}개 슬롯`);

        allSlots.forEach((slot, index) => {
          const slotNumber = slot.dataset.slot;
          const isEmpty = slot.querySelector('.empty-slot') !== null;
          const hasCard = slot.querySelector('.order-card') !== null;
          console.log(`슬롯 ${slotNumber}: 빈슬롯=${isEmpty}, 카드있음=${hasCard}`);
        });

        // 주방 아이템 필터링
        const kitchenItems = (ticket.items || []).filter(item => {
          const cookStation = item.cook_station || 'KITCHEN';
          return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
        });

        console.log(`🔍 티켓 ${ticketId}: 전체 ${ticket.items?.length || 0}개 → 주방 ${kitchenItems.length}개 아이템`);

        if (kitchenItems.length === 0) {
          console.log(`ℹ️ 티켓 ${ticketId}에 주방 아이템이 없음 - HTML 추가 스킵`);
          return false;
        }

        // 1-9번 슬롯 중 빈 슬롯 찾기 (순차적으로)
        let emptySlot = null;
        for (let i = 1; i <= 9; i++) {
          const slot = allSlots.find(s => parseInt(s.dataset.slot) === i);
          if (slot && slot.querySelector('.empty-slot')) {
            emptySlot = slot;
            console.log(`🎯 빈 슬롯 발견: ${i}번 슬롯 사용`);
            break;
          }
        }

        if (!emptySlot) {
          console.log('⚠️ 1-9번 슬롯에 빈 공간이 없음 - 추가 불가');

          // 각 슬롯 상태 재확인
          for (let i = 1; i <= 9; i++) {
            const slot = allSlots.find(s => parseInt(s.dataset.slot) === i);
            if (slot) {
              const isEmpty = slot.querySelector('.empty-slot') !== null;
              const hasCard = slot.querySelector('.order-card') !== null;
              const cardTicketId = slot.querySelector('[data-ticket-id]')?.getAttribute('data-ticket-id');
              console.log(`슬롯 ${i} 상세: 빈슬롯=${isEmpty}, 카드=${hasCard}, 티켓ID=${cardTicketId}`);
            }
          }

          return false;
        }

        // 중복 티켓 확인
        const existingCard = gridContainer.querySelector(`[data-ticket-id="${ticketId}"]`);
        if (existingCard) {
          console.log(`⚠️ 티켓 ${ticketId} 카드가 이미 존재함 - 추가 중단`);
          return false;
        }

        // 카드 HTML 생성
        const cardHTML = window.KDSUIRenderer ?
          window.KDSUIRenderer.createOrderCardHTML(ticket) :
          this._createSimpleCardHTML(ticket);

        console.log(`🎨 티켓 ${ticketId} 카드 HTML 생성 완료 - 슬롯 ${emptySlot.dataset.slot}에 삽입`);

        // HTML 삽입
        emptySlot.innerHTML = cardHTML;

        // 삽입 후 검증
        const insertedCard = emptySlot.querySelector('.order-card');
        if (!insertedCard) {
          console.error(`❌ 티켓 ${ticketId} 카드 삽입 실패 - HTML이 제대로 삽입되지 않음`);
          return false;
        }

        // 애니메이션 효과
        insertedCard.style.opacity = '0';
        insertedCard.style.transform = 'scale(0.9)';

        requestAnimationFrame(() => {
          insertedCard.style.transition = 'all 0.3s ease';
          insertedCard.style.opacity = '1';
          insertedCard.style.transform = 'scale(1)';
        });

        console.log(`✅ 티켓 ${ticketId} HTML 슬롯 ${emptySlot.dataset.slot}에 성공적으로 추가`);

        // 추가 후 그리드 상태 확인
        setTimeout(() => {
          const finalSlots = Array.from(gridContainer.children);
          const occupiedCount = finalSlots.filter(slot =>
            parseInt(slot.dataset.slot) <= 9 && slot.querySelector('.order-card')
          ).length;
          console.log(`🔍 카드 추가 후 상태: 1-9번 슬롯 중 ${occupiedCount}개 점유`);
        }, 100);

        return true;

      } catch (error) {
        console.error('❌ HTML 카드 추가 실패:', error);
        return false;
      }
    },

    /**
     * 간단한 카드 HTML 생성 (백업용)
     */
    _createSimpleCardHTML(ticket) {
      const ticketId = this._extractTicketId(ticket);
      const kitchenItems = (ticket.items || []).filter(item => {
        const cookStation = item.cook_station || 'KITCHEN';
        return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
      });

      return `
        <div class="order-card" data-ticket-id="${ticketId}">
          <div class="card-header">
            <div class="table-info">
              <span class="table-number">테이블 ${ticket.table_number || 'N/A'}</span>
              <span class="ticket-id">#${ticketId}</span>
            </div>
            <div class="status-badge" style="background: #f39c12">대기</div>
          </div>
          <div class="card-body">
            <div class="order-items">
              ${kitchenItems.slice(0, 3).map(item => `
                <div class="order-item">
                  <span class="item-name">${item.menuName || item.menu_name || '메뉴'}</span>
                  <span class="item-quantity">×${item.quantity || 1}</span>
                </div>
              `).join('')}
              ${kitchenItems.length > 3 ? `<div class="more-items">+${kitchenItems.length - 3}개 더</div>` : ''}
            </div>
          </div>
          <div class="card-actions">
            <button class="action-btn start-btn" onclick="KDSManager.startCooking('${ticketId}')">
              🔥 시작
            </button>
            <button class="action-btn complete-btn" onclick="KDSManager.markComplete('${ticketId}')">
              ✅ 완료
            </button>
          </div>
        </div>
      `;
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
     * 티켓 조리 시작 처리 - 전체 Grid 재렌더링
     */
    handleTicketCookingStarted(data) {
      const ticketId = data.ticket_id;
      console.log(`🔥 WebSocket: 티켓 ${ticketId} 조리 시작 이벤트 - 전체 Grid 재렌더링`);

      const ticket = KDSState.getTicket(ticketId);
      if (!ticket) {
        console.warn(`⚠️ WebSocket: 티켓 ${ticketId}을 찾을 수 없음`);
        return;
      }

      // 상태 업데이트
      const oldStatus = ticket.status;
      ticket.status = 'COOKING';
      if (ticket.items) {
        ticket.items.forEach(item => {
          item.status = 'COOKING';
          item.item_status = 'COOKING';
        });
      }

      // 업데이트된 티켓 저장
      KDSState.setTicket(ticketId, ticket);

      console.log(`📊 티켓 ${ticketId} 상태 변경: ${oldStatus} → COOKING`);

      // 전체 Grid 재렌더링
      this._triggerFullGridRerender('cooking_started');

      // 사운드 재생
      if (window.KDSSoundManager) {
        window.KDSSoundManager.playItemCompleteSound();
      }

      console.log(`✅ 티켓 ${ticketId} 조리 시작 처리 완료`);
    },

    /**
     * 티켓 완료 처리 - COOKING 상태에서 완료된 경우 재배치 적용
     */
    handleTicketCompleted(data) {
      console.log('✅ 티켓 완료 이벤트 (DONE 상태):', data);

      const ticketId = data.ticket_id;
      const ticket = KDSState.getTicket(ticketId);

      if (!ticket) {
        console.log(`ℹ️ 티켓 ${ticketId}이 이미 제거됨 - WebSocket 이벤트 무시`);
        return;
      }

      // 현재 상태가 COOKING이었는지 확인
      const wasCooking = (ticket.status || '').toUpperCase() === 'COOKING';

      // 중복 제거 방지 - 이미 처리 중인 티켓인지 확인
      if (this._removingTickets && this._removingTickets.has(ticketId)) {
        console.log(`🔄 티켓 ${ticketId} 이미 제거 처리 중 - 중복 방지`);
        return;
      }

      // 제거 처리 중 마킹
      if (!this._removingTickets) {
        this._removingTickets = new Set();
      }
      this._removingTickets.add(ticketId);

      console.log(`🗑️ 티켓 ${ticketId} 완료 처리 - COOKING 상태였음: ${wasCooking}`);

      try {
        // 사운드 재생
        if (window.KDSSoundManager && !ticket._soundPlayed) {
          window.KDSSoundManager.playOrderCompleteSound();
          ticket._soundPlayed = true;
        }

        // 상태에서 제거
        KDSState.removeTicket(ticketId);

        // 전체 Grid 재렌더링 (모든 완료 이벤트에서)
        this._triggerFullGridRerender('ticket_completed');

        console.log(`✅ 티켓 ${ticketId} 완료 처리 완료 - 전체 Grid 재렌더링됨`);

      } finally {
        // 제거 처리 완료 - 마킹 해제 (지연 실행)
        setTimeout(() => {
          this._removingTickets.delete(ticketId);
        }, 1000);
      }
    },

    /**
     * 티켓 업데이트 처리 - 캔슬 티켓 반짝임 교체 및 실시간 업데이트 개선
     */
    async handleTicketUpdated(ticket, isRecursionPrevention = false) {
      const ticketId = ticket.ticket_id || ticket.check_id || ticket.id;
      const actualStatus = (ticket.status || '').toUpperCase();
      const batchNo = ticket.batch_no;
      const tableNumber = ticket.table_number;

      console.log(`🔄 티켓 업데이트 이벤트: ${ticketId}, 상태: ${actualStatus}, batch_no: ${batchNo}, 재귀방지: ${isRecursionPrevention}`);

      // 티켓 ID를 문자열로 변환 및 유효성 검사
      const ticketIdStr = String(ticketId);
      if (!ticketId || ticketIdStr === 'undefined' || ticketIdStr.startsWith('unknown_')) {
        console.warn(`⚠️ 유효하지 않은 티켓 ID: ${ticketId}`);

        // 테이블 번호가 있으면 해당 테이블의 실제 데이터 조회
        if (tableNumber && KDSState.storeId) {
          console.log(`🔍 테이블 ${tableNumber} 실제 티켓 데이터 조회 시도`);
          await this._fetchTableTickets(tableNumber);
        }
        return;
      }

      // 완료된 티켓은 즉시 제거 처리
      if (['DONE', 'COMPLETED', 'SERVED'].includes(actualStatus)) {
        console.log(`✅ WebSocket: 완료된 티켓 ${ticketIdStr} 감지 - 제거 및 재정렬`);
        return this.handleTicketCompleted({ ticket_id: ticketIdStr });
      }

      // 캔슬된 티켓 처리 - 반짝임 효과와 함께 교체
      if (['CANCELED', 'CANCELLED'].includes(actualStatus)) {
        console.log(`❌ 캔슬된 티켓 ${ticketIdStr} 처리 시작 - 반짝임 효과 적용`);
        return this.handleTicketCanceled(ticket);
      }

      const existingTicket = KDSState.getTicket(ticketIdStr);
      if (!existingTicket && !isRecursionPrevention) {
        console.log(`ℹ️ 기존 티켓이 없음 - 새 티켓으로 생성: ${ticketIdStr}`);

        // 티켓에 아이템 정보가 없으면 서버에서 조회
        if (!ticket.items || ticket.items.length === 0) {
          console.log(`🔍 티켓 ${ticketIdStr} 아이템 정보 없음 - 서버에서 조회`);
          await this._fetchTicketDetails(ticketIdStr, tableNumber);
          return;
        }

        return this.handleTicketCreated(ticket);
      } else if (!existingTicket && isRecursionPrevention) {
        console.log(`🔄 재귀 방지 모드 - 티켓 ${ticketIdStr} 직접 생성 처리`);
        
        // 주방 아이템 필터링
        const kitchenItems = (ticket.items || []).filter(item => {
          const cookStation = item.cook_station || 'KITCHEN';
          return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
        });

        if (kitchenItems.length === 0) {
          console.log(`ℹ️ 티켓 ${ticketIdStr}에 주방 아이템이 없음 - 처리 스킵`);
          return;
        }

        // 정규화된 티켓 직접 생성
        const normalizedTicket = {
          ...ticket,
          ticket_id: ticketIdStr,
          check_id: ticketIdStr,
          id: ticketIdStr,
          batch_no: batchNo || 1,
          table_number: tableNumber || ticket.table_num || 'N/A',
          table_num: ticket.table_num || tableNumber || 'N/A',
          customer_name: ticket.customer_name || `테이블 ${tableNumber || ticket.table_num}`,
          items: kitchenItems,
          status: actualStatus,
          source: ticket.source || 'POS',
          created_at: ticket.created_at || new Date().toISOString()
        };

        // 상태에 티켓 저장
        KDSState.setTicket(ticketIdStr, normalizedTicket);
        console.log(`💾 재귀 방지 모드 - 티켓 ${ticketIdStr} 직접 저장 완료`);

        // 전체 Grid 재렌더링
        this._triggerFullGridRerender('recursion_prevention_create');
        return;
      }

      // 버전 확인 (batch_no 변경 감지)
      const oldBatchNo = existingTicket.batch_no;
      const newBatchNo = ticket.batch_no || oldBatchNo;
      const batchChanged = oldBatchNo !== newBatchNo;

      // 기존 상태와 새 상태 비교
      const oldStatus = (existingTicket.status || 'PENDING').toUpperCase();
      const newStatus = (ticket.status || existingTicket.status || 'PENDING').toUpperCase();
      const statusChanged = oldStatus !== newStatus;

      console.log(`📊 티켓 ${ticketIdStr} 변경 감지:`, {
        status: `${oldStatus} → ${newStatus}`,
        batch: `${oldBatchNo} → ${newBatchNo}`,
        statusChanged,
        batchChanged
      });

      // 주방 아이템 필터링 및 검증
      const kitchenItems = (ticket.items || existingTicket.items || []).filter(item => {
        const cookStation = item.cook_station || 'KITCHEN';
        return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
      });

      // 업데이트된 티켓 데이터 생성
      const updatedTicket = {
        ...existingTicket,
        ...ticket,
        status: newStatus,
        batch_no: newBatchNo,
        items: kitchenItems,
        updated_at: ticket.updated_at || new Date().toISOString()
      };

      // 아이템들도 티켓 상태에 맞춰 동기화
      if (updatedTicket.items && newStatus === 'COOKING') {
        updatedTicket.items = updatedTicket.items.map(item => ({
          ...item,
          status: 'COOKING',
          item_status: 'COOKING'
        }));
      }

      // 아이템이 없는 경우 처리
      if (kitchenItems.length === 0) {
        console.log(`🍽️ 티켓 ${ticketIdStr}에 주방 아이템이 없음 - 제거 처리`);
        KDSState.removeTicket(ticketIdStr);
        this._triggerFullGridRerender('no_kitchen_items');
        return;
      }

      // 상태에 업데이트된 티켓 저장
      KDSState.setTicket(ticketIdStr, updatedTicket);

      // batch 변경 또는 상태 변경 시 반짝임 교체 효과
      if (batchChanged || statusChanged) {
        console.log(`✨ 티켓 ${ticketIdStr} 반짝임 교체 - batch변경: ${batchChanged}, 상태변경: ${statusChanged}`);
        this._triggerTicketSparkleUpdate(ticketIdStr, updatedTicket);
      } else {
        // 일반 업데이트
        this._triggerFullGridRerender('ticket_updated');
      }

      console.log(`✅ 티켓 ${ticketIdStr} 업데이트 처리 완료`);
    },

    /**
     * 캔슬된 티켓 처리 - 반짝임 효과 후 제거 또는 교체
     */
    handleTicketCanceled(ticket) {
      const ticketId = ticket.ticket_id || ticket.check_id || ticket.id;

      console.log(`❌ 캔슬된 티켓 ${ticketId} 처리 시작`);

      // 주방 아이템 필터링
      const kitchenItems = (ticket.items || []).filter(item => {
        const cookStation = item.cook_station || 'KITCHEN';
        return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
      });

      // 아이템이 전혀 없다면 그리드 업데이트
      if (kitchenItems.length === 0) {
        console.log(`🗑️ 캔슬된 티켓 ${ticketId} - 주방 아이템 없음, 완전 제거`);

        // 상태에서 제거
        KDSState.removeTicket(ticketId);

        // 즉시 반짝임 효과 후 제거
        this._triggerCanceledTicketRemoval(ticketId);

        return;
      }

      // 아이템이 있다면 업데이트된 티켓으로 교체
      console.log(`🔄 캔슬된 티켓 ${ticketId} - ${kitchenItems.length}개 주방 아이템 있음, 업데이트된 티켓으로 교체`);

      const updatedTicket = {
        ...ticket,
        items: kitchenItems,
        status: 'PENDING', // 캔슬 후 새로운 상태로 설정
        updated_at: new Date().toISOString()
      };

      // 상태에 업데이트된 티켓 저장
      KDSState.setTicket(ticketId, updatedTicket);

      // 반짝임 교체 효과
      this._triggerTicketSparkleUpdate(ticketId, updatedTicket);
    },

    /**
     * 티켓 반짝임 교체 효과
     */
    _triggerTicketSparkleUpdate(ticketId, updatedTicket) {
      console.log(`✨ 티켓 ${ticketId} 반짝임 교체 시작`);

      const cardElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!cardElement) {
        console.log(`ℹ️ 티켓 ${ticketId} 카드를 찾을 수 없음 - 전체 Grid 재렌더링`);
        this._triggerFullGridRerender('sparkle_fallback');
        return;
      }

      const slotElement = cardElement.closest('.grid-slot');
      if (!slotElement) {
        console.log(`ℹ️ 티켓 ${ticketId} 슬롯을 찾을 수 없음 - 전체 Grid 재렌더링`);
        this._triggerFullGridRerender('sparkle_fallback');
        return;
      }

      // 반짝임 효과 적용
      cardElement.style.transition = 'all 0.3s ease';
      cardElement.style.animation = 'sparkle 0.6s ease-in-out';

      // CSS 키프레임 추가 (한 번만)
      if (!document.getElementById('sparkle-keyframes')) {
        const style = document.createElement('style');
        style.id = 'sparkle-keyframes';
        style.textContent = `
          @keyframes sparkle {
            0% { transform: scale(1); box-shadow: 0 0 0 rgba(255, 215, 0, 0); }
            25% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
            50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(255, 215, 0, 1); }
            75% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
            100% { transform: scale(1); box-shadow: 0 0 0 rgba(255, 215, 0, 0); }
          }
        `;
        document.head.appendChild(style);
      }

      // 0.6초 후 새 카드로 교체
      setTimeout(() => {
        if (window.KDSUIRenderer && typeof window.KDSUIRenderer.createOrderCardHTML === 'function') {
          const newCardHTML = window.KDSUIRenderer.createOrderCardHTML(updatedTicket);

          // 페이드 아웃
          cardElement.style.opacity = '0';
          cardElement.style.transform = 'scale(0.9)';

          setTimeout(() => {
            // 새 카드 삽입
            slotElement.innerHTML = newCardHTML;

            // 페이드 인
            const newCard = slotElement.querySelector('.order-card');
            if (newCard) {
              newCard.style.opacity = '0';
              newCard.style.transform = 'scale(0.9)';

              requestAnimationFrame(() => {
                newCard.style.transition = 'all 0.3s ease';
                newCard.style.opacity = '1';
                newCard.style.transform = 'scale(1)';
              });
            }

            console.log(`✅ 티켓 ${ticketId} 반짝임 교체 완료`);
          }, 200);
        } else {
          // 백업: 전체 Grid 재렌더링
          console.log(`🔄 UI 렌더러 없음 - 전체 Grid 재렌더링으로 대체`);
          this._triggerFullGridRerender('sparkle_fallback');
        }
      }, 600);
    },

    /**
     * 캔슬된 티켓 제거 효과
     */
    _triggerCanceledTicketRemoval(ticketId) {
      console.log(`🗑️ 캔슬된 티켓 ${ticketId} 제거 효과 시작`);

      const cardElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!cardElement) {
        console.log(`ℹ️ 티켓 ${ticketId} 카드를 찾을 수 없음 - 전체 Grid 재렌더링`);
        this._triggerFullGridRerender('cancel_removal');
        return;
      }

      // 반짝임 + 페이드아웃 효과
      cardElement.style.transition = 'all 0.4s ease';
      cardElement.style.animation = 'cancelFlash 0.8s ease-in-out';

      // 캔슬 키프레임 추가
      if (!document.getElementById('cancel-keyframes')) {
        const style = document.createElement('style');
        style.id = 'cancel-keyframes';
        style.textContent = `
          @keyframes cancelFlash {
            0% { transform: scale(1); background-color: inherit; }
            25% { transform: scale(1.02); background-color: rgba(255, 0, 0, 0.2); }
            50% { transform: scale(1.05); background-color: rgba(255, 0, 0, 0.4); }
            75% { transform: scale(1.02); background-color: rgba(255, 0, 0, 0.2); }
            100% { transform: scale(0.8); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      // 0.8초 후 완전히 제거하고 Grid 업데이트
      setTimeout(() => {
        this._triggerFullGridRerender('cancel_complete');
        console.log(`✅ 캔슬된 티켓 ${ticketId} 제거 완료`);
      }, 800);
    },

    /**
     * 티켓 수정 처리 (WebSocket 이벤트)
     */
    handleTicketModified(data) {
      const ticketId = data.ticket_id;
      const batchNo = data.batch_no;
      const items = data.items || [];

      console.log(`🔄 티켓 수정 처리: ${ticketId}, batch_no: ${batchNo}, 아이템: ${items.length}개`);

      // 기존 티켓 조회
      const existingTicket = KDSState.getTicket(ticketId);

      // 수정된 티켓 데이터 생성
      const modifiedTicket = {
        ...existingTicket,
        ticket_id: ticketId,
        id: data.order_id || existingTicket?.id,
        check_id: ticketId,
        batch_no: batchNo,
        status: 'PENDING', // 수정 후 대기 상태
        items: items,
        updated_at: data.timestamp || new Date().toISOString()
      };

      // 아이템이 없으면 제거
      if (items.length === 0) {
        console.log(`🗑️ 수정된 티켓 ${ticketId}에 주방 아이템 없음 - 제거 처리`);
        KDSState.removeTicket(ticketId);
        this._triggerCanceledTicketRemoval(ticketId);
        return;
      }

      // 상태에 저장
      KDSState.setTicket(ticketId, modifiedTicket);

      // 반짝임 교체 효과
      console.log(`✨ 티켓 ${ticketId} 수정으로 인한 반짝임 교체`);
      this._triggerTicketSparkleUpdate(ticketId, modifiedTicket);
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
            `/api/kds/${storeId}/sync?lastSyncAt=${encodeURIComponent(lastSyncAt)}`
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

      // 데이터 검증
      if (!data || !data.data) {
        console.warn('⚠️ DB 알림 데이터가 비어있음:', data);
        return;
      }

      const { data: notificationData } = data;

      switch (data.type) {
        case 'db_order_change':
        case 'db_ticket_change':
          // 티켓 ID 검증
          const ticketId = notificationData.ticket_id || notificationData.id || notificationData.order_id;

          if (!ticketId) {
            console.warn('⚠️ DB 알림에서 티켓 ID를 찾을 수 없음:', notificationData);

            // 티켓 ID가 없으면 전체 데이터 새로고침 시도
            if (notificationData.table_number && KDSState.storeId) {
              console.log(`🔄 티켓 ID 없음 - 테이블 ${notificationData.table_number} 전체 새로고침 시도`);
              this._refreshTableData(notificationData.table_number);
            }
            return;
          }

          // 상태 검증 및 정규화
          const status = (notificationData.status || 'PENDING').toUpperCase();

          console.log(`🔄 DB 티켓 변경: ${ticketId}, 상태: ${status}`);

          this.handleTicketUpdated({
            ticket_id: ticketId,
            id: ticketId,
            check_id: ticketId,
            status: status,
            batch_no: notificationData.batch_no,
            table_number: notificationData.table_number,
            source: 'db_trigger'
          });
          break;

        case 'db_item_change':
          console.log('🍽️ DB 아이템 변경 처리:', notificationData);

          const itemTicketId = notificationData.ticket_id || notificationData.id;
          const itemId = notificationData.item_id;

          if (!itemTicketId || !itemId) {
            console.warn('⚠️ DB 아이템 변경에서 필수 ID 누락:', notificationData);
            return;
          }

          this.handleItemUpdated({
            ticket_id: itemTicketId,
            item_id: itemId,
            item_status: notificationData.item_status || 'PENDING',
            source: 'db_trigger'
          });
          break;

        case 'db_payment_change':
          // 결제 완료 이벤트는 로그만 남기고 KDS에서는 처리하지 않음
          console.log(`💳 결제 완료 알림 수신: 테이블 ${notificationData.table_number} (KDS 처리 생략)`);
          break;

        default:
          console.warn(`⚠️ 알 수 없는 DB 알림 타입: ${data.type}`);
      }
    },

    /**
     * 테이블 데이터 전체 새로고침
     */
    async _refreshTableData(tableNumber) {
      try {
        if (!KDSState.storeId || !tableNumber) return;

        console.log(`🔄 테이블 ${tableNumber} 데이터 새로고침 시작`);

        const response = await fetch(
          `/api/kds/${KDSState.storeId}/table/${tableNumber}/tickets`
        );

        if (!response.ok) {
          throw new Error(`테이블 데이터 조회 실패: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.tickets) {
          // 받은 티켓들을 처리
          result.tickets.forEach(ticket => {
            console.log(`🎫 테이블 ${tableNumber} 티켓 새로고침: ${ticket.ticket_id}`);
            this.handleTicketUpdated(ticket);
          });

          console.log(`✅ 테이블 ${tableNumber} 데이터 새로고침 완료: ${result.tickets.length}개 티켓`);
        }

      } catch (error) {
        console.warn(`⚠️ 테이블 ${tableNumber} 데이터 새로고침 실패:`, error);
      }
    },

    /**
     * 전체 Grid 재렌더링 트리거 (모든 이벤트 통합 처리)
     */
    _triggerFullGridRerender(reason = 'unknown') {
      console.log(`🔄 전체 Grid 재렌더링 트리거: ${reason}`);

      setTimeout(() => {
        if (window.KDSUIRenderer && typeof window.KDSUIRenderer.triggerGridReorder === 'function') {
          window.KDSUIRenderer.triggerGridReorder(reason);
        } else if (window.KDSUIRenderer && typeof window.KDSUIRenderer.renderKDSGrid === 'function') {
          // 백업: 직접 재렌더링
          const currentTickets = KDSState.currentTab === 'active' ?
            KDSState.getActiveTickets() : KDSState.getCompletedTickets();
          window.KDSUIRenderer.renderKDSGrid(currentTickets);
        }

        // 탭 카운트 업데이트
        if (window.KDSUIRenderer && typeof window.KDSUIRenderer.updateTicketCounts === 'function') {
          window.KDSUIRenderer.updateTicketCounts();
        }
      }, 100);
    },

    /**
     * 티켓 상세 정보 조회
     */
    async _fetchTicketDetails(ticketId, tableNumber) {
      try {
        if (!KDSState.storeId) {
          console.warn('⚠️ 매장 ID가 없어서 티켓 상세 조회 불가');
          return;
        }

        console.log(`🔍 티켓 ${ticketId} 상세 정보 조회 시작`);

        const response = await fetch(
          `/api/kds/tickets/${ticketId}/details?storeId=${KDSState.storeId}`
        );

        if (!response.ok) {
          throw new Error(`티켓 상세 조회 실패: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.ticket) {
          console.log(`✅ 티켓 ${ticketId} 상세 정보 조회 성공`);

          // 조회된 상세 정보로 티켓 생성 처리
          this.handleTicketCreated(result.ticket);
        } else {
          throw new Error('티켓 상세 정보가 없음');
        }

      } catch (error) {
        console.warn(`⚠️ 티켓 ${ticketId} 상세 정보 조회 실패:`, error);

        // 실패하면 테이블 전체 새로고침 시도
        if (tableNumber) {
          await this._fetchTableTickets(tableNumber);
        }
      }
    },

    /**
     * 테이블의 모든 티켓 조회
     */
    async _fetchTableTickets(tableNumber) {
      try {
        if (!KDSState.storeId || !tableNumber) return;

        console.log(`🔍 테이블 ${tableNumber} 모든 티켓 조회 시작`);

        const response = await fetch(
          `/api/kds/${KDSState.storeId}/table/${tableNumber}/tickets`
        );

        if (!response.ok) {
          throw new Error(`테이블 티켓 조회 실패: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.tickets) {
          console.log(`✅ 테이블 ${tableNumber} 티켓 조회 성공: ${result.tickets.length}개`);

          // 조회된 티켓들을 처리
          result.tickets.forEach(ticket => {
            // 주방 아이템이 있는 티켓만 처리
            const kitchenItems = (ticket.items || []).filter(item => {
              const cookStation = item.cook_station || 'KITCHEN';
              return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
            });

            if (kitchenItems.length > 0) {
              console.log(`🎫 테이블 ${tableNumber} 주방 티켓 처리: ${ticket.ticket_id} (${kitchenItems.length}개 아이템)`);
              this.handleTicketCreated({
                ...ticket,
                items: kitchenItems
              });
            } else {
              console.log(`ℹ️ 테이블 ${tableNumber} 티켓 ${ticket.ticket_id}에 주방 아이템 없음 - 스킵`);
            }
          });

          // 전체 Grid 재렌더링
          this._triggerFullGridRerender('table_tickets_refreshed');

        } else {
          console.log(`ℹ️ 테이블 ${tableNumber}에 활성 티켓이 없음`);
        }

      } catch (error) {
        console.warn(`⚠️ 테이블 ${tableNumber} 티켓 조회 실패:`, error);
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