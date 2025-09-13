/**
 * KDS UI 렌더링 모듈 - 고정형 Grid 레이아웃
 * - 5열 × 2행 = 총 10칸 고정 그리드
 * - 최대 9개 주문 카드 + 1개 상태 칸
 * - 고정된 픽셀 크기와 자동 비율
 */

(function() {
  'use strict';

  console.log('🎨 KDS UI 렌더러 모듈 로드 (고정 Grid)');

  // =================== UI 렌더링 ===================
  window.KDSUIRenderer = {
    /**
     * 메인 KDS 화면 렌더링
     */
    render(storeId) {
      console.log('🎨 KDS UI 렌더링 시작 - 매장:', storeId);
      
      const main = document.getElementById('main') || document.body;
      
      // 기존 내용 완전히 제거
      main.innerHTML = '';
      
      // KDS UI 렌더링
      main.innerHTML = `
        <div class="kds-container">
          ${this.renderHeader()}
          ${this.renderTabBar()}
          ${this.renderMainContent()}
        </div>
        ${this.renderStyles()}
      `;

      // 이벤트 리스너 설정
      this.setupEventListeners();
      
      console.log('✅ KDS UI 렌더링 완료');
      
      // 로딩 화면이 남아있다면 제거
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen) {
        loadingScreen.remove();
        console.log('✅ 로딩 화면 제거 완료');
      }
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
     * 메인 콘텐츠 렌더링 - 고정 Grid
     */
    renderMainContent() {
      return `
        <main class="kds-main">
          <div class="kds-grid" id="kdsGrid">
            <!-- 고정 10칸 Grid - 동적으로 채워짐 -->
            ${this.renderEmptyGrid()}
          </div>
        </main>
      `;
    },

    /**
     * 빈 그리드 렌더링
     */
    renderEmptyGrid() {
      let gridHTML = '';
      for (let i = 1; i <= 10; i++) {
        gridHTML += `
          <div class="grid-slot" data-slot="${i}">
            <div class="empty-slot">
              <div class="slot-number">${i}</div>
              <div class="slot-text">대기중</div>
            </div>
          </div>
        `;
      }
      return gridHTML;
    },

    /**
     * 주문 목록으로 Grid 업데이트
     */
    renderKDSGrid(orders = []) {
      console.log(`🎨 Grid 렌더링 시작: ${orders.length}개 주문`);

      const grid = document.getElementById('kdsGrid');
      if (!grid) return;

      // Grid 초기화
      grid.innerHTML = '';

      const maxDisplayOrders = 9;
      const totalOrders = orders.length;

      // 1-9번 슬롯: 주문 카드 또는 빈 슬롯
      for (let i = 0; i < maxDisplayOrders; i++) {
        const slot = document.createElement('div');
        slot.className = 'grid-slot';
        slot.dataset.slot = i + 1;

        if (i < totalOrders) {
          // 주문 카드 렌더링
          slot.innerHTML = this.createOrderCardHTML(orders[i]);
        } else {
          // 빈 슬롯
          slot.innerHTML = this.createEmptySlotHTML(i + 1);
        }

        grid.appendChild(slot);
      }

      // 10번 슬롯: 설정 또는 남은 주문 개수
      const lastSlot = document.createElement('div');
      lastSlot.className = 'grid-slot';
      lastSlot.dataset.slot = '10';

      if (totalOrders <= maxDisplayOrders) {
        // 설정 버튼
        lastSlot.innerHTML = this.createSettingsSlotHTML();
      } else {
        // 남은 주문 개수
        const remainingCount = totalOrders - maxDisplayOrders;
        lastSlot.innerHTML = this.createMoreOrdersSlotHTML(remainingCount);
      }

      grid.appendChild(lastSlot);

      console.log(`✅ Grid 렌더링 완료: ${Math.min(totalOrders, maxDisplayOrders)}개 카드 + 1개 상태 슬롯`);
    },

    /**
     * 주문 카드 HTML 생성
     */
    createOrderCardHTML(order) {
      const elapsedTime = this.getElapsedTime(order.created_at);
      const statusClass = this.getStatusClass(order.status);
      const ticketId = this._extractTicketId(order);

      // DB 상태 기반으로 UI 결정
      const dbStatus = (order.status || '').toUpperCase();
      const isPending = dbStatus === 'PENDING';
      const isCooking = dbStatus === 'COOKING';
      const isDone = dbStatus === 'DONE' || dbStatus === 'COMPLETED';

      // 상태별 스타일
      let cardClass = 'order-card';
      let statusBadge = '대기';
      let statusColor = '#f39c12';

      if (isCooking) {
        cardClass += ' cooking';
        statusBadge = '조리중';
        statusColor = '#e74c3c';
      } else if (isDone) {
        cardClass += ' completed';
        statusBadge = '완료';
        statusColor = '#27ae60';
      }

      // 아이템 목록 생성
      const itemsHTML = order.items ? order.items.slice(0, 4).map(item => `
        <div class="order-item">
          <span class="item-name">${item.menuName || item.menu_name || '메뉴'}</span>
          <span class="item-quantity">×${item.quantity || 1}</span>
        </div>
      `).join('') : '';

      const moreItemsCount = order.items && order.items.length > 4 ? order.items.length - 4 : 0;

      return `
        <div class="${cardClass}" data-ticket-id="${ticketId}">
          <div class="card-header">
            <div class="table-info">
              <span class="table-number">테이블 ${order.table_number || 'N/A'}</span>
              <span class="ticket-id">#${ticketId}</span>
            </div>
            <div class="status-info">
              <span class="elapsed-time">${elapsedTime}</span>
              <span class="status-badge" style="background: ${statusColor}">${statusBadge}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="order-items">
              ${itemsHTML}
              ${moreItemsCount > 0 ? `<div class="more-items">+${moreItemsCount}개 더</div>` : ''}
            </div>
          </div>

          <div class="card-actions">
            <div class="action-top-row">
              <button class="action-btn start-btn" onclick="KDSManager.startCooking('${ticketId}')"
                      ${isCooking || isDone ? 'disabled' : ''}>
                🔥 ${isCooking ? '조리중' : '시작'}
              </button>
              <button class="action-btn complete-btn" onclick="KDSManager.markComplete('${ticketId}')"
                      ${isDone ? 'disabled' : ''}>
                ✅ 완료
              </button>
            </div>
            <div class="action-bottom-row">
              <button class="action-btn print-btn" onclick="KDSManager.printOrder('${ticketId}')">
                🖨️ 출력
              </button>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * 빈 슬롯 HTML 생성
     */
    createEmptySlotHTML(slotNumber) {
      return `
        <div class="empty-slot">
          <div class="slot-number">${slotNumber}</div>
          <div class="slot-text">대기중</div>
        </div>
      `;
    },

    /**
     * 설정 슬롯 HTML 생성
     */
    createSettingsSlotHTML() {
      return `
        <div class="settings-slot" onclick="KDSManager.showSettings()">
          <div class="settings-icon">⚙️</div>
          <div class="settings-text">설정</div>
        </div>
      `;
    },

    /**
     * 더 많은 주문 슬롯 HTML 생성
     */
    createMoreOrdersSlotHTML(count) {
      return `
        <div class="more-orders-slot" onclick="KDSManager.showAllOrders()">
          <div class="more-count">+${count}</div>
          <div class="more-text">더 보기</div>
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
     * 티켓 카드 추가 (Grid 전체 재렌더링)
     */
    addTicketCard(ticket) {
      console.log(`🎨 티켓 추가: ${this._extractTicketId(ticket)}`);
      const currentOrders = KDSState.getActiveTickets();
      this.renderKDSGrid(currentOrders);
      this.updateTicketCounts();
    },

    /**
     * 티켓 카드 제거 (개별 카드 직접 제거)
     */
    removeTicketCard(ticketId) {
      console.log(`🗑️ 티켓 개별 제거: ${ticketId}`);
      
      // 개별 카드 직접 제거
      if (window.KDSManager && typeof window.KDSManager.removeCardFromUI === 'function') {
        const success = window.KDSManager.removeCardFromUI(ticketId);
        
        if (success) {
          this.updateTicketCounts();
          console.log(`✅ 티켓 ${ticketId} 개별 제거 성공`);
          return;
        }
      }
      
      // 백업: Grid 재렌더링
      console.log(`🔄 개별 제거 실패, Grid 재렌더링으로 백업 처리`);
      const currentOrders = KDSState.getActiveTickets();
      this.renderKDSGrid(currentOrders);
      this.updateTicketCounts();
      this.checkEmptyState();
    },

    /**
     * 개별 카드 직접 제거 (DOM 조작)
     */
    removeCardDirectly(ticketId) {
      try {
        const cardElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
        
        if (cardElement) {
          const slotElement = cardElement.closest('.grid-slot');
          const slotNumber = slotElement?.dataset.slot;
          
          // 애니메이션 효과
          cardElement.style.transition = 'all 0.3s ease';
          cardElement.style.transform = 'scale(0.8)';
          cardElement.style.opacity = '0';
          
          setTimeout(() => {
            if (slotElement && slotNumber) {
              slotElement.innerHTML = this.createEmptySlotHTML(slotNumber);
              console.log(`🗑️ 슬롯 ${slotNumber}을 빈 슬롯으로 교체`);
            }
          }, 300);
          
          return true;
        }
        
        return false;
        
      } catch (error) {
        console.error('❌ 개별 카드 제거 실패:', error);
        return false;
      }
    },

    /**
     * Grid 완전 클리어
     */
    clearGrid() {
      const grid = document.getElementById('kdsGrid');
      if (grid) {
        grid.innerHTML = this.renderEmptyGrid();
        console.log('🧹 Grid 완전 클리어 완료');
      }
    },

    /**
     * 빈 상태 체크 및 처리
     */
    checkEmptyState() {
      const activeTickets = KDSState.getActiveTickets();
      if (activeTickets.length === 0) {
        console.log('📭 활성 티켓이 없음 - 빈 Grid 표시');
        this.clearGrid();
      }
    },

    /**
     * UI에서 티켓 제거 (별칭 메서드)
     */
    removeTicketFromUI(ticketId) {
      this.removeTicketCard(ticketId);
    },

    /**
     * 티켓 카드 업데이트 (Grid 전체 재렌더링)
     */
    updateTicketCard(ticket) {
      console.log(`🔄 티켓 업데이트: ${this._extractTicketId(ticket)}`);
      const currentOrders = KDSState.getActiveTickets();
      this.renderKDSGrid(currentOrders);
    },

    /**
     * 티켓을 조리 중 상태로 UI 업데이트
     */
    updateTicketToCookingState(ticketId, ticket) {
      console.log(`🎨 티켓 ${ticketId} 조리 상태로 UI 업데이트`);
      const currentOrders = KDSState.getActiveTickets();
      this.renderKDSGrid(currentOrders);
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
      }, 60000); // 1분마다
    },

    /**
     * CSS 스타일 렌더링 - 고정 Grid 레이아웃
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
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            flex-shrink: 0;
            height: 80px;
          }

          .header-left {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .current-time {
            font-size: 20px;
            font-weight: 700;
            color: #ecf0f1;
          }

          .store-info {
            font-size: 12px;
            color: #bdc3c7;
          }

          .header-center {
            flex: 1;
            text-align: center;
          }

          .kds-title {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }

          .title-icon {
            font-size: 28px;
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .connection-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
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

          .refresh-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 10px;
            padding: 10px;
            color: white;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s ease;
          }

          .refresh-btn:hover {
            background: rgba(255,255,255,0.3);
          }

          /* 탭 바 */
          .kds-tabs {
            background: white;
            padding: 0 30px;
            display: flex;
            border-bottom: 2px solid #ecf0f1;
            flex-shrink: 0;
            height: 60px;
          }

          .tab-btn {
            background: none;
            border: none;
            padding: 15px 25px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
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
            font-size: 16px;
          }

          .tab-count {
            background: #3498db;
            color: white;
            border-radius: 10px;
            padding: 3px 6px;
            font-size: 11px;
            font-weight: 700;
            min-width: 18px;
            text-align: center;
          }

          .tab-btn.active .tab-count {
            background: #e74c3c;
          }

          /* 메인 영역 */
          .kds-main {
            flex: 1;
            padding: 20px;
            overflow: hidden;
          }

          /* 고정 Grid 레이아웃 - 5열 × 2행 */
          .kds-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(2, 300px);
            gap: 10px;
            height: 100%;
            width: 100%;
          }

          /* Grid 슬롯 */
          .grid-slot {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: all 0.3s ease;
          }

          .grid-slot:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }

          /* 주문 카드 */
          .order-card {
            height: 100%;
            display: flex;
            flex-direction: column;
            border-left: 4px solid #f39c12;
            position: relative;
          }

          .order-card.cooking {
            border-left-color: #e74c3c;
            animation: pulse 2s infinite;
          }

          .order-card.completed {
            border-left-color: #27ae60;
            opacity: 0.8;
          }

          @keyframes pulse {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
            }
            50% { 
              opacity: 0.95; 
              transform: scale(1.01);
            }
          }

          /* 카드 헤더 */
          .card-header {
            padding: 12px;
            border-bottom: 1px solid #ecf0f1;
            flex-shrink: 0;
          }

          .table-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .table-number {
            font-size: 16px;
            font-weight: 700;
            color: #2c3e50;
          }

          .ticket-id {
            font-size: 12px;
            color: #7f8c8d;
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
          }

          .status-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .elapsed-time {
            font-size: 11px;
            color: #e74c3c;
            font-weight: 600;
          }

          .status-badge {
            font-size: 10px;
            color: white;
            padding: 3px 6px;
            border-radius: 6px;
            font-weight: 600;
          }

          /* 카드 바디 */
          .card-body {
            flex: 1;
            padding: 12px;
            overflow-y: auto;
          }

          .order-items {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .order-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            padding: 4px 0;
          }

          .item-name {
            font-weight: 600;
            color: #2c3e50;
            flex: 1;
            margin-right: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .item-quantity {
            background: #3498db;
            color: white;
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            min-width: 20px;
            text-align: center;
          }

          .more-items {
            font-size: 11px;
            color: #7f8c8d;
            text-align: center;
            padding: 4px;
            background: #f8f9fa;
            border-radius: 4px;
            margin-top: 4px;
          }

          /* 카드 액션 - 2:1 구조 */
          .card-actions {
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            border-top: 1px solid #ecf0f1;
            flex-shrink: 0;
          }

          .action-top-row {
            display: flex;
            gap: 6px;
          }

          .action-bottom-row {
            display: flex;
          }

          .action-btn {
            flex: 1;
            padding: 8px 4px;
            border: none;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
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

          .print-btn {
            background: #6c757d;
            color: white;
          }

          .print-btn:hover:not(:disabled) {
            background: #545b62;
          }

          .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* 빈 슬롯 */
          .empty-slot {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            color: #bdc3c7;
            border: 2px dashed #ecf0f1;
            border-radius: 12px;
          }

          .slot-number {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #d5d5d5;
          }

          .slot-text {
            font-size: 12px;
            font-weight: 500;
          }

          /* 설정 슬롯 */
          .settings-slot {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #74b9ff, #0984e3);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .settings-slot:hover {
            background: linear-gradient(135deg, #0984e3, #74b9ff);
            transform: scale(1.02);
          }

          .settings-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }

          .settings-text {
            font-size: 14px;
            font-weight: 600;
          }

          /* 더 많은 주문 슬롯 */
          .more-orders-slot {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #fd79a8, #e84393);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .more-orders-slot:hover {
            background: linear-gradient(135deg, #e84393, #fd79a8);
            transform: scale(1.02);
          }

          .more-count {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .more-text {
            font-size: 12px;
            font-weight: 600;
          }

          /* 반응형 */
          @media (max-width: 1400px) {
            .kds-grid {
              grid-template-rows: repeat(2, 280px);
              gap: 8px;
            }

            .kds-main {
              padding: 15px;
            }
          }

          @media (max-width: 1200px) {
            .kds-grid {
              grid-template-rows: repeat(2, 250px);
            }

            .card-header {
              padding: 10px;
            }

            .card-body {
              padding: 10px;
            }

            .table-number {
              font-size: 14px;
            }
          }
        </style>
      `;
    },

    /**
     * 안전한 티켓 ID 추출
     */
    _extractTicketId(ticket) {
      return ticket.check_id || 
             ticket.ticket_id || 
             ticket.id || 
             ticket.order_id || 
             `unknown_${Date.now()}`;
    }
  };

  console.log('✅ KDS UI 렌더러 모듈 로드 완료 (고정 Grid)');
})();