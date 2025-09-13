/**
 * KDS UI 렌더링 모듈
 * - UI 컴포넌트 렌더링
 * - 티켓 카드 관리
 * - 상태별 스타일링
 */

(function() {
  'use strict';

  console.log('🎨 KDS UI 렌더러 모듈 로드');

  // =================== UI 렌더링 ===================
  window.KDSUIRenderer = {
    /**
     * 메인 KDS 화면 렌더링
     */
    render(storeId) {
      const main = document.getElementById('main') || document.body;

      main.innerHTML = `
        <div class="kds-container">
          ${this.renderHeader()}
          ${this.renderTabBar()}
          ${this.renderMainContent()}
          ${this.renderFloatingControls()}
        </div>
        ${this.renderStyles()}
      `;

      this.setupEventListeners();
    },

    /**
     * 헤더 렌더링
     */
    renderHeader() {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      return `
        <header class="kds-header">
          <div class="header-left">
            <div class="current-time">${timeString}</div>
            <div class="store-info">매장 ${KDSState.storeId}</div>
          </div>

          <div class="header-center">
            <h1 class="kds-title">
              <span class="title-icon">🍳</span>
              Kitchen Display System
            </h1>
          </div>

          <div class="header-right">
            <div id="connectionStatus" class="connection-status disconnected">연결 안됨</div>
            <button class="settings-btn" onclick="KDSManager.showSettings()">
              <span>⚙️</span>
            </button>
            <button class="refresh-btn" onclick="KDSManager.refresh()">
              <span>🔄</span>
            </button>
          </div>
        </header>
      `;
    },

    /**
     * 탭 바 렌더링
     */
    renderTabBar() {
      return `
        <div class="kds-tabs">
          <button class="tab-btn ${KDSState.currentTab === 'active' ? 'active' : ''}" 
                  data-tab="active" onclick="KDSManager.switchTab('active')">
            <span class="tab-icon">🔥</span>
            <span class="tab-text">진행중 주문</span>
            <span class="tab-count" id="activeCount">0</span>
          </button>

          <button class="tab-btn ${KDSState.currentTab === 'completed' ? 'active' : ''}" 
                  data-tab="completed" onclick="KDSManager.switchTab('completed')">
            <span class="tab-icon">✅</span>
            <span class="tab-text">완료된 주문</span>
            <span class="tab-count" id="completedCount">0</span>
          </button>
        </div>
      `;
    },

    /**
     * 메인 콘텐츠 렌더링
     */
    renderMainContent() {
      return `
        <main class="kds-main">
          <div class="tickets-grid" id="ticketsGrid">
            <div class="empty-state" id="emptyState">
              <div class="empty-icon">🍽️</div>
              <h3>주문이 없습니다</h3>
              <p>새로운 주문을 기다리고 있습니다...</p>
            </div>
          </div>
        </main>
      `;
    },

    /**
     * 플로팅 컨트롤 렌더링
     */
    renderFloatingControls() {
      return `
        <div class="floating-controls">
          <button class="control-btn" onclick="KDSManager.clearCompleted()" title="완료된 주문 정리">
            <span>🗑️</span>
          </button>
          <button class="control-btn" onclick="KDSManager.toggleSound()" title="사운드 켜기/끄기">
            <span id="soundIcon">🔊</span>
          </button>
        </div>
      `;
    },

    /**
     * 연결 상태 업데이트
     */
    updateConnectionStatus(connected) {
      const statusElement = document.getElementById('connectionStatus');
      if (statusElement) {
        statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        statusElement.textContent = connected ? '연결됨' : '연결 안됨';
      }
    },

    /**
     * 티켓 카드 추가
     */
    addTicketCard(ticket) {
      // 안전한 티켓 ID 추출
      const ticketId = this._extractTicketId(ticket);
      const grid = document.getElementById('ticketsGrid');
      const emptyState = document.getElementById('emptyState');

      if (emptyState) {
        emptyState.style.display = 'none';
      }

      const cardHTML = this.createTicketCardHTML(ticket);
      const cardElement = document.createElement('div');
      cardElement.innerHTML = cardHTML;
      const card = cardElement.firstElementChild;

      // data-ticket-id 속성 설정
      card.dataset.ticketId = ticketId;

      // 애니메이션 효과
      card.style.transform = 'scale(0.8)';
      card.style.opacity = '0';

      grid.appendChild(card);

      // 애니메이션 실행
      requestAnimationFrame(() => {
        card.style.transition = 'all 0.3s ease';
        card.style.transform = 'scale(1)';
        card.style.opacity = '1';
      });

      this.updateTicketCounts();
    },

    /**
     * 티켓 카드 HTML 생성 - DB 실제 상태 기반 렌더링
     */
    createTicketCardHTML(ticket) {
      const elapsedTime = this.getElapsedTime(ticket.created_at);
      const statusClass = this.getStatusClass(ticket.status);
      const progressPercent = this.calculateProgress(ticket.items);

      // 실제 DB 상태 기반으로 UI 결정 (정규화)
      const dbStatus = (ticket.status || '').toUpperCase();
      const isPending = dbStatus === 'PENDING';
      const isCooking = dbStatus === 'COOKING';
      const isDone = dbStatus === 'DONE' || dbStatus === 'COMPLETED';

      console.log(`🎨 티켓 ${ticket.ticket_id || ticket.check_id} DB 상태 기반 렌더링: ${dbStatus} (Pending: ${isPending}, Cooking: ${isCooking}, Done: ${isDone})`);

      // 상태별 UI 스타일 결정
      let elapsedTimeStyle = '';
      let progressFillStyle = 'background: linear-gradient(90deg, #3498db, #2ecc71);';
      let cardExtraStyle = '';
      let statusDisplayText = dbStatus;
      let statusBadgeColor = '#95a5a6';

      if (isCooking) {
        elapsedTimeStyle = 'background: #ff6b6b; color: white; font-weight: 700; animation: pulse 2s infinite; border: 2px solid #e74c3c;';
        progressFillStyle = 'background: linear-gradient(90deg, #ff6b6b, #ee5a52); animation: progressPulse 3s infinite;';
        cardExtraStyle = 'border: 3px solid #e74c3c; box-shadow: 0 8px 30px rgba(231, 76, 60, 0.4);';
        statusBadgeColor = '#e74c3c';
        statusDisplayText = 'COOKING';
      } else if (isPending) {
        elapsedTimeStyle = 'background: #f39c12; color: white; font-weight: 600; border: 1px solid #e67e22;';
        cardExtraStyle = 'border: 2px solid #f39c12;';
        statusBadgeColor = '#f39c12';
        statusDisplayText = 'PENDING';
      } else if (isDone) {
        elapsedTimeStyle = 'background: #27ae60; color: white; font-weight: 600;';
        cardExtraStyle = 'border: 2px solid #27ae60; opacity: 0.8;';
        statusBadgeColor = '#27ae60';
        statusDisplayText = 'DONE';
      }

      // 버튼 상태 결정 - DB 상태에 정확히 매핑
      const startButtonDisabled = isCooking || isDone;
      const completeButtonDisabled = !isCooking;

      const startButtonStyle = startButtonDisabled ? 
        'opacity: 0.3; cursor: not-allowed; background: #95a5a6; transform: none; pointer-events: none;' : 
        'opacity: 1; cursor: pointer; background: #f39c12; transform: scale(1); pointer-events: auto;';

      const completeButtonStyle = completeButtonDisabled ? 
        'opacity: 0.3; cursor: not-allowed; background: #95a5a6; animation: none; border: 1px solid #95a5a6; font-weight: 400; pointer-events: none;' : 
        'opacity: 1; cursor: pointer; background: linear-gradient(135deg, #27ae60, #229954); animation: buttonReady 2s infinite; border: 2px solid #27ae60; font-weight: 700; pointer-events: auto;';

      const startButtonText = isCooking ? '조리중' : '조리 시작';

      return `
        <div class="ticket-card ${statusClass}" data-status="${dbStatus}" data-db-status="${dbStatus}" style="${cardExtraStyle}">
          <div class="ticket-header">
            <div class="ticket-info">
              <span class="table-number">${ticket.table_number || ticket.table_num || 'N/A'}</span>
              <span class="elapsed-time" style="${elapsedTimeStyle}">${elapsedTime}</span>
              <span class="ticket-status" style="font-size: 12px; padding: 4px 8px; border-radius: 8px; background: ${statusBadgeColor}; color: white; font-weight: 600;">${statusDisplayText}</span>
            </div>
            <div class="ticket-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%; ${progressFillStyle}"></div>
              </div>
              <span class="progress-text">${Math.round(progressPercent)}%</span>
            </div>
          </div>

          <div class="ticket-body">
            <div class="order-items">
              ${ticket.items ? ticket.items.map(item => this.createItemHTML(item, isCooking, dbStatus)).join('') : ''}
            </div>
          </div>

          <div class="ticket-footer">
            <div class="ticket-actions">
              <button class="action-btn start-btn" onclick="KDSManager.startCooking('${ticket.check_id || ticket.ticket_id || ticket.id}')"
                      ${startButtonDisabled ? 'disabled' : ''} style="${startButtonStyle}">
                <span>🔥</span> ${startButtonText}
              </button>
              <button class="action-btn complete-btn" onclick="KDSManager.markComplete('${ticket.check_id || ticket.ticket_id || ticket.id}')"
                      ${completeButtonDisabled ? 'disabled' : ''} style="${completeButtonStyle}">
                <span>✅</span> 완료
              </button>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * 아이템 HTML 생성 - 상태 기반 개선
     */
    createItemHTML(item, isCooking = false, ticketStatus = 'PENDING') {
      // 실제 아이템 상태 또는 티켓 상태에 따른 상태 결정
      let actualStatus;
      if (ticketStatus === 'COOKING') {
        actualStatus = 'COOKING';
      } else {
        actualStatus = item.status || item.item_status || 'PENDING';
      }

      const statusIcon = this.getItemStatusIcon(actualStatus);
      const statusClass = this.getItemStatusClass(actualStatus);
      const itemName = item.menuName || item.menu_name || '메뉴명 없음';
      const quantity = item.quantity || 1;

      // 상태별 스타일 적용
      let itemExtraStyle = '';
      if (actualStatus === 'COOKING') {
        itemExtraStyle = 'background: linear-gradient(135deg, #fdedec, #f8d7da); border: 2px solid #e74c3c; animation: itemPulse 3s infinite;';
      } else if (actualStatus === 'PENDING') {
        itemExtraStyle = 'background: linear-gradient(135deg, #fef9e7, #fdf2e9); border: 1px solid #f39c12;';
      }

      return `
        <div class="order-item ${statusClass}" data-item-id="${item.id}" data-status="${actualStatus}" style="${itemExtraStyle}">
          <div class="item-info">
            <span class="item-quantity">×${quantity}</span>
            <span class="item-name">${itemName}</span>
            ${item.cook_station ? `<span class="cook-station">${item.cook_station}</span>` : ''}
          </div>
          <div class="item-status">
            <button class="status-btn" onclick="KDSManager.toggleItemStatus('${item.id}', '${actualStatus}')">
              <span class="status-icon">${statusIcon}</span>
            </button>
          </div>
        </div>
      `;
    },

    /**
     * 아이템 상태 업데이트
     */
    updateItemStatus(ticketId, itemId, status) {
      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!card) return;

      const item = card.querySelector(`[data-item-id="${itemId}"]`);
      if (!item) return;

      item.className = `order-item ${this.getItemStatusClass(status)}`;

      const statusIcon = item.querySelector('.status-icon');
      if (statusIcon) {
        statusIcon.textContent = this.getItemStatusIcon(status);
      }

      this.updateTicketProgress(ticketId);
    },

    /**
     * 티켓 카드 업데이트
     */
    updateTicketCard(ticket) {
      const ticketId = this._extractTicketId(ticket);
      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!card) return;

      card.className = `ticket-card ${this.getStatusClass(ticket.status)}`;
      this.updateTicketProgress(ticketId);
      this.updateTicketButtons(card, ticket);
    },

    /**
     * 티켓 카드 제거
     */
    removeTicketCard(ticketId) {
      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!card) return;

      card.style.transition = 'all 0.3s ease';
      card.style.transform = 'scale(0.8)';
      card.style.opacity = '0';

      setTimeout(() => {
        card.remove();
        this.updateTicketCounts();
        this.checkEmptyState();
      }, 300);
    },

    /**
     * UI에서 티켓 제거 (별칭 메서드)
     */
    removeTicketFromUI(ticketId) {
      console.log(`🗑️ UI에서 티켓 ${ticketId} 제거`);
      this.removeTicketCard(ticketId);
    },

    /**
     * 티켓 진행률 업데이트
     */
    updateTicketProgress(ticketId) {
      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!card) return;

      const ticket = KDSState.getTicket(ticketId);
      if (!ticket || !ticket.items) return;

      const progressPercent = this.calculateProgress(ticket.items);

      const progressFill = card.querySelector('.progress-fill');
      const progressText = card.querySelector('.progress-text');

      if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
      }

      if (progressText) {
        progressText.textContent = `${Math.round(progressPercent)}%`;
      }

      const completeBtn = card.querySelector('.complete-btn');
      if (completeBtn) {
        completeBtn.disabled = progressPercent < 100;
      }
    },

    /**
     * 티켓 버튼 상태 업데이트
     */
    updateTicketButtons(card, ticket) {
      console.log(`🎨 버튼 상태 업데이트 시작: ${ticket.status}, 카드:`, card);

      const startBtn = card.querySelector('.start-btn');
      const completeBtn = card.querySelector('.complete-btn');

      console.log(`🔍 버튼 요소 찾기 결과 - 시작:`, !!startBtn, `완료:`, !!completeBtn);

      if (startBtn) {
        const isCookingOrDone = ['COOKING', 'cooking', 'DONE', 'done', 'completed'].includes(ticket.status);

        console.log(`🎨 조리 시작 버튼 상태 변경: ${ticket.status} -> ${isCookingOrDone ? '비활성화' : '활성화'}`);

        startBtn.disabled = isCookingOrDone;

        if (isCookingOrDone) {
          startBtn.style.setProperty('opacity', '0.3', 'important');
          startBtn.style.setProperty('cursor', 'not-allowed', 'important');
          startBtn.style.setProperty('background', '#95a5a6', 'important');
          startBtn.style.setProperty('transform', 'none', 'important');
          startBtn.innerHTML = '🔥 조리중';
          startBtn.setAttribute('disabled', 'true');
          console.log(`🎨 조리 시작 버튼 비활성화 완료`);
        } else {
          startBtn.style.setProperty('opacity', '1', 'important');
          startBtn.style.setProperty('cursor', 'pointer', 'important');
          startBtn.style.setProperty('background', '#f39c12', 'important');
          startBtn.style.setProperty('transform', 'scale(1)', 'important');
          startBtn.innerHTML = '<span>🔥</span> 조리 시작';
          startBtn.removeAttribute('disabled');
          console.log(`🎨 조리 시작 버튼 활성화 완료`);
        }
      } else {
        console.warn(`⚠️ 조리 시작 버튼을 찾을 수 없음`);
      }

      if (completeBtn) {
        const isCooking = ['COOKING', 'cooking'].includes(ticket.status);

        console.log(`🎨 완료 버튼 상태 변경: ${ticket.status} -> ${isCooking ? '활성화' : '비활성화'}`);

        completeBtn.disabled = !isCooking;

        if (isCooking) {
          completeBtn.style.setProperty('opacity', '1', 'important');
          completeBtn.style.setProperty('cursor', 'pointer', 'important');
          completeBtn.style.setProperty('background', 'linear-gradient(135deg, #27ae60, #229954)', 'important');
          completeBtn.style.setProperty('animation', 'buttonReady 2s infinite', 'important');
          completeBtn.style.setProperty('border', '2px solid #27ae60', 'important');
          completeBtn.style.setProperty('font-weight', '700', 'important');
          completeBtn.innerHTML = '<span>✅</span> 완료';
          completeBtn.removeAttribute('disabled');
          console.log(`🎨 완료 버튼 활성화 완료`);
        } else {
          completeBtn.style.setProperty('opacity', '0.3', 'important');
          completeBtn.style.setProperty('cursor', 'not-allowed', 'important');
          completeBtn.style.setProperty('background', '#95a5a6', 'important');
          completeBtn.style.setProperty('animation', 'none', 'important');
          completeBtn.style.setProperty('border', '1px solid #95a5a6', 'important');
          completeBtn.style.setProperty('font-weight', '400', 'important');
          completeBtn.innerHTML = '<span>✅</span> 완료';
          completeBtn.setAttribute('disabled', 'true');
          console.log(`🎨 완료 버튼 비활성화 완료`);
        }
      } else {
        console.warn(`⚠️ 완료 버튼을 찾을 수 없음`);
      }

      console.log(`✅ 버튼 상태 업데이트 완료: ${ticket.status}`);
    },

    /**
     * 티켓을 조리 중 상태로 UI 업데이트 - 통합 메서드
     */
    updateTicketToCookingState(ticketId, ticket) {
      console.log(`🎨 티켓 ${ticketId} 조리 상태로 UI 업데이트`);

      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!card) {
        console.warn(`⚠️ 티켓 카드를 찾을 수 없음: ${ticketId}`);
        return;
      }

      // 1. 카드 전체 스타일 업데이트
      card.className = `ticket-card ${this.getStatusClass('COOKING')}`;

      // 2. 조리 중 특별 스타일 적용
      this._applyCookingStyles(card);

      // 3. 버튼 상태 업데이트
      this._updateButtonsForCooking(card);

      // 4. 개별 아이템 상태 업데이트
      if (ticket.items) {
        ticket.items.forEach(item => {
          this._updateItemToCookingState(card, item.id);
        });
      }

      // 5. 강조 애니메이션
      this._playStartCookingAnimation(card);

      console.log(`✅ 티켓 ${ticketId} 조리 상태 UI 업데이트 완료`);
    },

    /**
     * 조리 중 스타일 적용
     */
    _applyCookingStyles(card) {
      // 경과 시간 스타일
      const elapsedTime = card.querySelector('.elapsed-time');
      if (elapsedTime) {
        Object.assign(elapsedTime.style, {
          background: '#ff6b6b',
          color: 'white',
          fontWeight: '700',
          animation: 'pulse 2s infinite',
          border: '2px solid #e74c3c'
        });
      }

      // 진행률 바 스타일
      const progressFill = card.querySelector('.progress-fill');
      if (progressFill) {
        Object.assign(progressFill.style, {
          background: 'linear-gradient(90deg, #ff6b6b, #ee5a52)',
          animation: 'progressPulse 3s infinite'
        });
      }

      // 카드 테두리 및 그림자
      Object.assign(card.style, {
        border: '3px solid #e74c3c',
        boxShadow: '0 8px 30px rgba(231, 76, 60, 0.4)'
      });
    },

    /**
     * 조리 중 상태 버튼 업데이트
     */
    _updateButtonsForCooking(card) {
      const startBtn = card.querySelector('.start-btn');
      const completeBtn = card.querySelector('.complete-btn');

      // 조리 시작 버튼 비활성화
      if (startBtn) {
        startBtn.disabled = true;
        startBtn.innerHTML = '🔥 조리중';
        Object.assign(startBtn.style, {
          opacity: '0.3',
          cursor: 'not-allowed',
          background: '#95a5a6',
          transform: 'none'
        });
      }

      // 완료 버튼 활성화
      if (completeBtn) {
        completeBtn.disabled = false;
        completeBtn.innerHTML = '<span>✅</span> 완료';
        Object.assign(completeBtn.style, {
          opacity: '1',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #27ae60, #229954)',
          animation: 'buttonReady 2s infinite',
          border: '2px solid #27ae60',
          fontWeight: '700'
        });
        completeBtn.removeAttribute('disabled');
      }
    },

    /**
     * 개별 아이템을 조리 중 상태로 업데이트
     */
    _updateItemToCookingState(card, itemId) {
      const itemElement = card.querySelector(`[data-item-id="${itemId}"]`);
      if (!itemElement) return;

      itemElement.className = `order-item ${this.getItemStatusClass('COOKING')}`;

      // 조리 중 아이템 특별 스타일
      Object.assign(itemElement.style, {
        background: 'linear-gradient(135deg, #fdedec, #f8d7da)',
        border: '2px solid #e74c3c',
        animation: 'itemPulse 3s infinite'
      });

      // 상태 아이콘 업데이트
      const statusIcon = itemElement.querySelector('.status-icon');
      if (statusIcon) {
        statusIcon.textContent = '🔥';
      }
    },

    /**
     * 조리 시작 애니메이션
     */
    _playStartCookingAnimation(card) {
      // 일시적인 강조 효과
      card.style.transform = 'scale(1.02)';
      card.style.transition = 'transform 0.3s ease';

      setTimeout(() => {
        card.style.transform = 'scale(1)';
      }, 300);
    },

    /**
     * 진행률 계산
     */
    calculateProgress(items) {
      if (!items || items.length === 0) return 0;

      const completedItems = items.filter(item => 
        item.status === 'ready' || item.status === 'served' || 
        item.item_status === 'ready' || item.item_status === 'served'
      ).length;

      return (completedItems / items.length) * 100;
    },

    /**
     * 상태별 클래스 반환
     */
    getStatusClass(status) {
      switch (status?.toUpperCase()) {
        case 'ORDERED':
        case 'PENDING': return 'status-pending';
        case 'PREPARING':
        case 'COOKING': return 'status-cooking status-cooking-active';
        case 'READY':
        case 'DONE':
        case 'COMPLETED': return 'status-completed';
        default: return 'status-pending';
      }
    },

    /**
     * 아이템 상태별 클래스 반환
     */
    getItemStatusClass(status) {
      switch (status?.toUpperCase()) {
        case 'ORDERED':
        case 'PENDING': return 'item-pending';
        case 'PREPARING':
        case 'COOKING': return 'item-cooking';
        case 'READY': return 'item-ready';
        case 'DONE': return 'item-ready';
        case 'SERVED': return 'item-served';
        default: return 'item-pending';
      }
    },

    /**
     * 아이템 상태별 아이콘 반환
     */
    getItemStatusIcon(status) {
      switch (status?.toUpperCase()) {
        case 'ORDERED':
        case 'PENDING': return '⏳';
        case 'PREPARING':
        case 'COOKING': return '🔥';
        case 'READY': return '✅';
        case 'DONE': return '✅';
        case 'SERVED': return '🍽️';
        default: return '⏳';
      }
    },

    /**
     * 경과 시간 계산
     */
    getElapsedTime(createdAt) {
      const now = new Date();
      const created = new Date(createdAt);
      const diffMs = now - created;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 60) {
        return `${diffMins}분`;
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}시간 ${mins}분`;
      }
    },

    /**
     * 티켓 수 업데이트
     */
    updateTicketCounts() {
      const activeTickets = KDSState.getActiveTickets();
      const completedTickets = KDSState.getCompletedTickets();

      const activeCountElement = document.getElementById('activeCount');
      const completedCountElement = document.getElementById('completedCount');

      if (activeCountElement) {
        activeCountElement.textContent = activeTickets.length;
      }

      if (completedCountElement) {
        completedCountElement.textContent = completedTickets.length;
      }
    },

    /**
     * 빈 상태 확인 및 표시
     */
    checkEmptyState() {
      const ticketsGrid = document.getElementById('ticketsGrid');
      const emptyState = document.getElementById('emptyState');

      if (!ticketsGrid || !emptyState) return;

      const visibleTickets = ticketsGrid.querySelectorAll('.ticket-card:not([style*="display: none"])');

      if (visibleTickets.length === 0) {
        emptyState.style.display = 'flex';
      } else {
        emptyState.style.display = 'none';
      }
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
      // 시간 업데이트
      setInterval(() => {
        const timeElement = document.querySelector('.current-time');
        if (timeElement) {
          const now = new Date();
          timeElement.textContent = now.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
        }

        // 경과 시간 업데이트
        document.querySelectorAll('.elapsed-time').forEach(element => {
          const card = element.closest('.ticket-card');
          const ticketId = card?.dataset.ticketId;
          const ticket = KDSState.getTicket(ticketId);

          if (ticket) {
            element.textContent = this.getElapsedTime(ticket.created_at);
          }
        });
      }, 60000); // 1분마다
    },

    /**
     * CSS 스타일 렌더링
     */
    renderStyles() {
      return `
        <style>
          /* 전체 레이아웃 */
          .kds-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100vh;
            background: #f5f7fa;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            overflow: hidden;
          }

          /* 헤더 */
          .kds-header {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            flex-shrink: 0;
          }

          .header-left {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .current-time {
            font-size: 24px;
            font-weight: 700;
            color: #ecf0f1;
          }

          .store-info {
            font-size: 14px;
            color: #bdc3c7;
          }

          .header-center {
            flex: 1;
            text-align: center;
          }

          .kds-title {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }

          .title-icon {
            font-size: 32px;
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .connection-status {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .connection-status.connected {
            background: #27ae60;
            color: white;
          }

          .connection-status.disconnected {
            background: #e74c3c;
            color: white;
          }

          .settings-btn, .refresh-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 12px;
            padding: 12px;
            color: white;
            cursor: pointer;
            font-size: 18px;
            transition: background 0.3s ease;
          }

          .settings-btn:hover, .refresh-btn:hover {
            background: rgba(255,255,255,0.3);
          }

          /* 탭 바 */
          .kds-tabs {
            background: white;
            padding: 0 30px;
            display: flex;
            border-bottom: 2px solid #ecf0f1;
            flex-shrink: 0;
          }

          .tab-btn {
            background: none;
            border: none;
            padding: 20px 30px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 16px;
            font-weight: 600;
            color: #7f8c8d;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
          }

          .tab-btn.active {
            color: #2c3e50;
            border-bottom-color: #3498db;
          }

          .tab-btn:hover {
            color: #2c3e50;
            background: #f8f9fa;
          }

          .tab-icon {
            font-size: 20px;
          }

          .tab-count {
            background: #3498db;
            color: white;
            border-radius: 12px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 700;
            min-width: 20px;
            text-align: center;
          }

          .tab-btn.active .tab-count {
            background: #e74c3c;
          }

          /* 메인 영역 */
          .kds-main {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
            overflow-x: hidden;
          }

          /* 티켓 그리드 */
          .tickets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 25px;
            align-items: start;
          }

          /* 빈 상태 */
          .empty-state {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px 20px;
            color: #95a5a6;
            text-align: center;
          }

          .empty-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }

          .empty-state h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
            color: #7f8c8d;
          }

          .empty-state p {
            margin: 0;
            font-size: 16px;
          }

          /* 티켓 카드 */
          .ticket-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            overflow: hidden;
            transition: all 0.3s ease;
            border-left: 6px solid #bdc3c7;
          }

          .ticket-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          }

          /* 상태별 색상 */
          .ticket-card.status-pending {
            border-left-color: #f39c12;
          }

          .ticket-card.status-cooking {
            border-left-color: #e74c3c;
            animation: pulse 2s infinite;
            box-shadow: 0 4px 20px rgba(231, 76, 60, 0.3);
          }

          .ticket-card.status-cooking-active {
            border: 3px solid #e74c3c !important;
            box-shadow: 0 8px 30px rgba(231, 76, 60, 0.4) !important;
          }

          .ticket-card.status-cooking-active .elapsed-time {
            background: #ff6b6b !important;
            color: white !important;
            font-weight: 700 !important;
            animation: pulse 2s infinite !important;
            border: 2px solid #e74c3c !important;
          }

          .ticket-card.status-cooking-active .progress-fill {
            background: linear-gradient(90deg, #ff6b6b, #ee5a52) !important;
            animation: progressPulse 3s infinite !important;
          }

          .ticket-card.status-completed {
            border-left-color: #27ae60;
          }

          @keyframes pulse {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
            }
            50% { 
              opacity: 0.9; 
              transform: scale(1.02);
            }
          }

          /* 조리 중 아이템 스타일 강화 */
          .order-item.item-cooking {
            background: linear-gradient(135deg, #fdedec, #f8d7da);
            border: 2px solid #e74c3c;
            animation: itemPulse 3s infinite;
          }

          @keyframes itemPulse {
            0%, 100% { border-color: #e74c3c; }
            50% { border-color: #ff6b6b; }
          }

          /* 완료 버튼 활성화 스타일 */
          .complete-btn:not(:disabled) {
            background: linear-gradient(135deg, #27ae60, #229954);
            animation: buttonReady 2s infinite;
          }

          @keyframes buttonReady {
            0%, 100% { 
              box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
              transform: scale(1);
            }
            50% { 
              box-shadow: 0 6px 20px rgba(39, 174, 96, 0.5);
              transform: scale(1.05);
            }
          }

          @keyframes progressPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }

          /* 티켓 헤더 */
          .ticket-header {
            padding: 20px 25px 15px;
            border-bottom: 1px solid #ecf0f1;
          }

          .ticket-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }

          .table-number {
            font-size: 24px;
            font-weight: 700;
            color: #2c3e50;
          }

          .elapsed-time {
            font-size: 16px;
            color: #e74c3c;
            font-weight: 600;
            background: #fdedec;
            padding: 6px 12px;
            border-radius: 12px;
          }

          .ticket-progress {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .progress-bar {
            flex: 1;
            height: 8px;
            background: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3498db, #2ecc71);
            border-radius: 4px;
            transition: width 0.5s ease;
          }

          .progress-text {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
            min-width: 40px;
          }

          /* 티켓 바디 */
          .ticket-body {
            padding: 20px 25px;
          }

          .order-items {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .order-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border-radius: 12px;
            transition: all 0.3s ease;
          }

          .order-item.item-pending {
            background: #fdf6e3;
            border: 1px solid #f39c12;
          }

          .order-item.item-cooking {
            background: #fdedec;
            border: 1px solid #e74c3c;
          }

          .order-item.item-ready {
            background: #eafaf1;
            border: 1px solid #27ae60;
          }

          .order-item.item-served {
            background: #f8f9fa;
            border: 1px solid #95a5a6;
            opacity: 0.7;
          }

          .item-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .item-quantity {
            background: #3498db;
            color: white;
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 700;
            min-width: 30px;
            text-align: center;
          }

          .item-name {
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
          }

          .status-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 20px;
            padding: 8px;
            border-radius: 8px;
            transition: background 0.3s ease;
          }

          .status-btn:hover {
            background: rgba(52, 152, 219, 0.1);
          }

          /* 티켓 푸터 */
          .ticket-footer {
            padding: 15px 25px 20px;
            border-top: 1px solid #ecf0f1;
          }

          .ticket-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .action-btn {
            flex: 1;
            min-width: 100px;
            padding: 12px 16px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }

          .start-btn {
            background: #f39c12;
            color: white;
          }

          .start-btn:hover:not(:disabled) {
            background: #e67e22;
          }

          .complete-btn {
            background: #27ae60;
            color: white;
          }

          .complete-btn:hover:not(:disabled) {
            background: #229954;
          }

          .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* 플로팅 컨트롤 */
          .floating-controls {
            position: fixed;
            bottom: 30px;
            right: 30px;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .control-btn {
            width: 60px;
            height: 60px;
            border: none;
            border-radius: 50%;
            background: #3498db;
            color: white;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(52, 152, 219, 0.3);
            transition: all 0.3s ease;
          }

          .control-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(52, 152, 219, 0.4);
          }

          /* 반응형 */
          @media (max-width: 1200px) {
            .tickets-grid {
              grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
              gap: 20px;
            }

            .kds-header {
              padding: 15px 20px;
            }

            .kds-main {
              padding: 20px;
            }
          }

          @media (max-width: 768px) {
            .kds-header {
              flex-direction: column;
              gap: 15px;
              text-align: center;
            }

            .header-left,
            .header-right {
              order: 2;
            }

            .header-center {
              order: 1;
            }

            .kds-title {
              font-size: 24px;
            }

            .tickets-grid {
              grid-template-columns: 1fr;
              gap: 15px;
            }

            .kds-tabs {
              padding: 0 20px;
            }

            .tab-btn {
              padding: 15px 20px;
              font-size: 14px;
            }

            .floating-controls {
              bottom: 20px;
              right: 20px;
            }

            .control-btn {
              width: 50px;
              height: 50px;
              font-size: 20px;
            }
          }
        </style>
      `;
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
    }
  };

  console.log('✅ KDS UI 렌더러 모듈 로드 완료');
})();