
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
      const grid = document.getElementById('ticketsGrid');
      const emptyState = document.getElementById('emptyState');

      if (emptyState) {
        emptyState.style.display = 'none';
      }

      const cardHTML = this.createTicketCardHTML(ticket);
      const cardElement = document.createElement('div');
      cardElement.innerHTML = cardHTML;
      const card = cardElement.firstElementChild;

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
     * 티켓 카드 HTML 생성
     */
    createTicketCardHTML(ticket) {
      const elapsedTime = this.getElapsedTime(ticket.created_at);
      const statusClass = this.getStatusClass(ticket.status);
      const progressPercent = this.calculateProgress(ticket.items);

      return `
        <div class="ticket-card ${statusClass}" data-ticket-id="${ticket.check_id || ticket.id}">
          <div class="ticket-header">
            <div class="ticket-info">
              <span class="table-number">${ticket.table_number || 'N/A'}</span>
              <span class="elapsed-time">${elapsedTime}</span>
            </div>
            <div class="ticket-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <span class="progress-text">${Math.round(progressPercent)}%</span>
            </div>
          </div>

          <div class="ticket-body">
            <div class="order-items">
              ${ticket.items.map(item => this.createItemHTML(item)).join('')}
            </div>
          </div>

          <div class="ticket-footer">
            <div class="ticket-actions">
              <button class="action-btn start-btn" onclick="KDSManager.startCooking('${ticket.check_id || ticket.id}')"
                      ${ticket.status === 'cooking' || ticket.status === 'done' ? 'disabled' : ''}>
                <span>🔥</span> 조리 시작
              </button>
              <button class="action-btn complete-btn" onclick="KDSManager.markComplete('${ticket.check_id || ticket.id}')"
                      ${ticket.status !== 'cooking' ? 'disabled' : ''}>
                <span>✅</span> 완료
              </button>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * 아이템 HTML 생성
     */
    createItemHTML(item) {
      const statusIcon = this.getItemStatusIcon(item.status);
      const statusClass = this.getItemStatusClass(item.status);
      const itemName = item.menuName || item.menu_name || '메뉴명 없음';
      const quantity = item.quantity || 1;

      return `
        <div class="order-item ${statusClass}" data-item-id="${item.id}">
          <div class="item-info">
            <span class="item-quantity">×${quantity}</span>
            <span class="item-name">${itemName}</span>
            ${item.cook_station ? `<span class="cook-station">${item.cook_station}</span>` : ''}
          </div>
          <div class="item-status">
            <button class="status-btn" onclick="KDSManager.toggleItemStatus('${item.id}', '${item.status || 'pending'}')">
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
      const card = document.querySelector(`[data-ticket-id="${ticket.ticket_id || ticket.id}"]`);
      if (!card) return;

      card.className = `ticket-card ${this.getStatusClass(ticket.status)}`;
      this.updateTicketProgress(ticket.ticket_id || ticket.id);
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
      const startBtn = card.querySelector('.start-btn');
      const completeBtn = card.querySelector('.complete-btn');

      console.log(`🎨 버튼 상태 업데이트: ${ticket.status}`);

      if (startBtn) {
        const isCookingOrDone = ticket.status === 'COOKING' || ticket.status === 'cooking' || 
                               ticket.status === 'DONE' || ticket.status === 'done' ||
                               ticket.status === 'completed';
        
        startBtn.disabled = isCookingOrDone;

        if (isCookingOrDone) {
          startBtn.style.opacity = '0.3';
          startBtn.style.cursor = 'not-allowed';
          startBtn.style.background = '#95a5a6';
          startBtn.style.transform = 'none';
          startBtn.textContent = '🔥 조리중';
          console.log(`🎨 조리 시작 버튼 비활성화`);
        } else {
          startBtn.style.opacity = '1';
          startBtn.style.cursor = 'pointer';
          startBtn.style.background = '#f39c12';
          startBtn.style.transform = 'scale(1)';
          startBtn.innerHTML = '<span>🔥</span> 조리 시작';
        }
      }

      if (completeBtn) {
        const isCooking = ticket.status === 'COOKING' || ticket.status === 'cooking';
        completeBtn.disabled = !isCooking;

        if (isCooking) {
          completeBtn.style.opacity = '1';
          completeBtn.style.cursor = 'pointer';
          completeBtn.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
          completeBtn.style.animation = 'buttonReady 2s infinite';
          completeBtn.style.border = '2px solid #27ae60';
          completeBtn.style.fontWeight = '700';
          completeBtn.innerHTML = '<span>✅</span> 완료';
          console.log(`🎨 완료 버튼 활성화`);
        } else {
          completeBtn.style.opacity = '0.3';
          completeBtn.style.cursor = 'not-allowed';
          completeBtn.style.background = '#95a5a6';
          completeBtn.style.animation = 'none';
          completeBtn.style.border = '1px solid #95a5a6';
          completeBtn.style.fontWeight = '400';
          completeBtn.innerHTML = '<span>✅</span> 완료';
        }
      }

      console.log(`✅ 버튼 상태 업데이트 완료`);
    },

    /**
     * 티켓 조리 상태 UI 업데이트
     */
    updateTicketCookingState(ticketId, status) {
      console.log(`🎨 티켓 ${ticketId} 조리 상태 UI 업데이트 시작: ${status}`);
      
      const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (!card) {
        console.warn(`⚠️ 티켓 카드를 찾을 수 없음: ${ticketId}`);
        return;
      }

      // 카드 전체 스타일 업데이트
      const newClass = `ticket-card ${this.getStatusClass(status)}`;
      card.className = newClass;
      console.log(`🎨 카드 클래스 업데이트: ${newClass}`);

      // 경과 시간 스타일 업데이트
      const elapsedTime = card.querySelector('.elapsed-time');
      if (elapsedTime) {
        if (status === 'COOKING') {
          elapsedTime.style.background = '#ff6b6b';
          elapsedTime.style.color = 'white';
          elapsedTime.style.fontWeight = '700';
          elapsedTime.style.animation = 'pulse 2s infinite';
          elapsedTime.style.border = '2px solid #e74c3c';
          console.log(`🎨 경과 시간 조리 중 스타일 적용`);
        } else {
          elapsedTime.style.background = '#fdedec';
          elapsedTime.style.color = '#e74c3c';
          elapsedTime.style.fontWeight = '600';
          elapsedTime.style.animation = 'none';
          elapsedTime.style.border = 'none';
        }
      }

      // 진행률 바 스타일 업데이트
      const progressFill = card.querySelector('.progress-fill');
      if (progressFill) {
        if (status === 'COOKING') {
          progressFill.style.background = 'linear-gradient(90deg, #ff6b6b, #ee5a52)';
          progressFill.style.animation = 'progressPulse 3s infinite';
          console.log(`🎨 진행률 바 조리 중 스타일 적용`);
        } else {
          progressFill.style.background = 'linear-gradient(90deg, #3498db, #2ecc71)';
          progressFill.style.animation = 'none';
        }
      }

      // 개별 아이템 상태 업데이트
      const ticket = KDSState.getTicket(ticketId);
      if (ticket && ticket.items) {
        console.log(`🎨 ${ticket.items.length}개 아이템 상태 업데이트`);
        ticket.items.forEach((item, index) => {
          this.updateItemStatus(ticketId, item.id, status);
          console.log(`🎨 아이템 ${index + 1} 상태 업데이트: ${item.id} -> ${status}`);
        });
      }

      // 버튼 상태 업데이트
      this.updateTicketButtons(card, { status });

      // 추가 시각적 효과
      if (status === 'COOKING') {
        card.style.border = '3px solid #e74c3c';
        card.style.boxShadow = '0 8px 30px rgba(231, 76, 60, 0.4)';
        
        // 일시적인 강조 효과
        card.style.transform = 'scale(1.02)';
        setTimeout(() => {
          card.style.transform = 'scale(1)';
        }, 300);
      } else {
        card.style.border = 'none';
        card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
      }

      console.log(`✅ 티켓 ${ticketId} UI 업데이트 완료: ${status}`);
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
        case 'COOKING': return 'status-cooking';
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

      const activeCount = document.getElementById('activeCount');
      const completedCount = document.getElementById('completedCount');

      if (activeCount) activeCount.textContent = activeTickets.length;
      if (completedCount) completedCount.textContent = completedTickets.length;
    },

    /**
     * 빈 상태 확인
     */
    checkEmptyState() {
      const grid = document.getElementById('ticketsGrid');
      const emptyState = document.getElementById('emptyState');
      const cards = grid.querySelectorAll('.ticket-card');

      if (emptyState) {
        emptyState.style.display = cards.length === 0 ? 'flex' : 'none';
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
    }
  };

  console.log('✅ KDS UI 렌더러 모듈 로드 완료');
})();
