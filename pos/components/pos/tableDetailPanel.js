// 포스 테이블 상세 정보 패널 UI 모듈

// 테이블 상세 패널 렌더링
async function renderTableDetailPanel(tableNumber) {
  const detailPanel = document.getElementById('detailPanel');

  if (!detailPanel) {
    console.error('❌ detailPanel 요소를 찾을 수 없습니다');
    return;
  }

  // 패널 헤더 업데이트
  updatePanelHeader(tableNumber);

  // 로딩 상태 표시
  showLoadingState();

  try {
    // 테이블 데이터 로드
    const tableData = await loadTableDetailData(tableNumber);

    // UI 렌더링
    renderTableContent(tableNumber, tableData);

    // 이벤트 리스너 등록
    attachTableDetailEvents(tableNumber);

  } catch (error) {
    console.error('❌ 테이블 상세 정보 로드 실패:', error);
    showErrorState();
  }
}

// 패널 헤더 업데이트
function updatePanelHeader(tableNumber) {
  const panelTitle = document.getElementById('panelTitle');
  if (panelTitle) {
    panelTitle.innerHTML = `
      <div class="panel-title-container">
        <span class="table-icon">🪑</span>
        <span class="table-title">테이블 ${tableNumber}</span>
        <button class="refresh-btn" onclick="refreshTableData(${tableNumber})" title="새로고침">
          🔄
        </button>
      </div>
    `;
  }
}

// 로딩 상태 표시
function showLoadingState() {
  const panelContent = document.getElementById('panelContent');
  if (panelContent) {
    panelContent.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">테이블 정보를 불러오는 중...</div>
      </div>
    `;
  }
}

// 에러 상태 표시
function showErrorState() {
  const panelContent = document.getElementById('panelContent');
  if (panelContent) {
    panelContent.innerHTML = `
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <div class="error-text">테이블 정보를 불러오는데 실패했습니다.</div>
        <button class="retry-btn" onclick="renderTableDetailPanel(window.currentTable)">
          다시 시도
        </button>
      </div>
    `;
  }
}

// 테이블 콘텐츠 렌더링
function renderTableContent(tableNumber, data) {
  const panelContent = document.getElementById('panelContent');
  if (!panelContent) return;

  const { table, pendingOrders, completedOrders, tllOrder } = data;
  const isOccupied = table.isOccupied || pendingOrders.length > 0;
  const hasPendingOrders = pendingOrders.length > 0;
  const hasCompletedOrders = completedOrders.length > 0;

  panelContent.innerHTML = `
    ${TableStatusUI.render(tableNumber, table, isOccupied)}
    ${TableActionsUI.render(tableNumber, isOccupied, hasPendingOrders, hasCompletedOrders)}
    ${TLLInfoUI.render(tllOrder)}
    ${PendingOrdersUI.render(pendingOrders)}
    ${CompletedOrdersUI.render(completedOrders)}
    ${getTableDetailStyles()}
  `;
}

// 테이블 데이터 로드
async function loadTableDetailData(tableNumber) {
  try {
    // 현재 테이블 상태 확인
    const currentTable = window.allTables?.find(t => t.tableNumber == tableNumber);

    // API 요청들을 병렬로 처리
    const [allOrdersResponse, tllOrderResponse] = await Promise.all([
      fetch(`/api/pos/stores/${window.currentStore?.id}/table/${tableNumber}/all-orders`),
      fetch(`/api/pos/stores/${window.currentStore?.id}/table/${tableNumber}/orders`)
    ]);

    const allOrdersData = await allOrdersResponse.json();
    const tllOrderData = await tllOrderResponse.json();

    // new logic: get current session
    let currentSession = null;
    if (allOrdersData.success && allOrdersData.currentSession) {
      const sessionItems = allOrdersData.currentSession.items.map(item => ({
        menuName: item.menuName,
        quantity: item.quantity,
        price: item.price,
        cookingStatus: item.cookingStatus
      }));

      currentSession = {
        ...allOrdersData.currentSession,
        items: sessionItems,
        sessionStarted: allOrdersData.currentSession.startedAt,
        totalAmount: allOrdersData.currentSession.totalAmount
      };
    }

    return {
      table: currentTable || { tableNumber, isOccupied: false },
      pendingOrders: allOrdersData.success ? allOrdersData.pendingOrders : [],
      completedOrders: allOrdersData.success ? allOrdersData.completedOrders : [],
      tllOrder: tllOrderData.success ? tllOrderData.tllOrder : null,
      currentSession: currentSession // Add currentSession to the data
    };

  } catch (error) {
    console.error('❌ 테이블 데이터 로드 실패:', error);
    throw error;
  }
}

// 테이블 상태 UI 모듈
const TableStatusUI = {
  render(tableNumber, table, isOccupied) {
    const occupiedTime = table.occupiedSince ? this.formatTimeSince(table.occupiedSince) : '';

    return `
      <div class="table-status-section">
        <div class="status-header">
          <h4>📊 테이블 상태</h4>
          <div class="status-badge ${isOccupied ? 'occupied' : 'available'}">
            ${isOccupied ? '🔴 사용중' : '🟢 이용가능'}
          </div>
        </div>

        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">테이블 번호</span>
            <span class="status-value table-number">T${tableNumber}</span>
          </div>
          <div class="status-item">
            <span class="status-label">좌석 수</span>
            <span class="status-value">${table.seats || 4}석</span>
          </div>
          ${occupiedTime ? `
            <div class="status-item timer-item">
              <span class="status-label">사용 시간</span>
              <span class="status-value timer">${occupiedTime}</span>
            </div>
          ` : ''}
          <div class="status-item">
            <span class="status-label">상태</span>
            <span class="status-value ${isOccupied ? 'busy' : 'free'}">
              ${isOccupied ? '바쁨' : '여유'}
            </span>
          </div>
        </div>
      </div>
    `;
  },

  formatTimeSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}시간 ${diffMinutes % 60}분`;
  }
};

// 테이블 액션 UI 모듈
const TableActionsUI = {
  render(tableNumber, isOccupied, hasPendingOrders, hasCompletedOrders) {
    return `
      <div class="table-actions-section">
        <h4>🎛️ 테이블 관리</h4>
        <div class="action-grid">
          <button class="action-btn primary" onclick="openAddOrderModal('${tableNumber}')">
            <span class="btn-icon">📦</span>
            <span class="btn-text">주문 추가</span>
          </button>

          ${hasPendingOrders ? `
            <button class="action-btn success pulse" onclick="openPaymentModal('${tableNumber}')">
              <span class="btn-icon">💳</span>
              <span class="btn-text">결제 처리</span>
            </button>
          ` : ''}

          <button class="action-btn ${isOccupied ? 'warning' : 'secondary'}" onclick="${isOccupied ? 'releaseTable' : 'occupyTable'}('${tableNumber}')">
            <span class="btn-icon">${isOccupied ? '🔓' : '🔒'}</span>
            <span class="btn-text">${isOccupied ? '테이블 해제' : '테이블 점유'}</span>
          </button>

          <button class="action-btn" onclick="moveTableOrders('${tableNumber}')"
                  ${!hasPendingOrders && !hasCompletedOrders ? 'disabled' : ''}>
            <span class="btn-icon">🔄</span>
            <span class="btn-text">테이블 이동</span>
          </button>
        </div>
      </div>
    `;
  }
};

// TLL 정보 UI 모듈
const TLLInfoUI = {
  render(tllOrder) {
    if (!tllOrder) return '';

    return `
      <div class="tll-info-section">
        <h4>🔗 TLL 연동 정보</h4>
        <div class="tll-card">
          <div class="customer-avatar">
            ${tllOrder.isGuest ? '👤' : '👨‍💼'}
          </div>
          <div class="customer-details">
            <div class="customer-name">
              ${tllOrder.customerName}
              ${tllOrder.isGuest ?
                '<span class="customer-badge guest">게스트</span>' :
                '<span class="customer-badge member">회원</span>'
              }
            </div>
            ${tllOrder.phone ? `
              <div class="customer-phone">📞 ${this.formatPhoneNumber(tllOrder.phone)}</div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  formatPhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
};

// 미결제 주문 UI 모듈
const PendingOrdersUI = {
  render(pendingOrders) {
    // Removed the old logic for rendering individual pending orders
    // New logic will render the current session if available

    // Check if there's a current session available in the data
    const hasCurrentSession = window.currentSessionData && window.currentSessionData.currentSession;

    return `
      <div class="pending-orders-section">
        <div class="section-header">
          <h4>🔄 미결제 주문</h4>
        </div>
        <div class="orders-container">
          ${hasCurrentSession ? this.renderCurrentSession(window.currentSessionData.currentSession) : '<div class="no-active-session">활성 세션이 없습니다</div>'}
        </div>
      </div>
    `;
  },

  renderCurrentSession(session) {
    const items = session.items || [];

    return `
      <div class="current-session" data-session-id="${session.id}">
        <div class="session-header">
          <span class="session-title">📋 현재 세션</span>
          <span class="session-amount">₩${session.totalAmount.toLocaleString()}</span>
          <span class="session-status ${session.status.toLowerCase()}">${session.status}</span>
        </div>
        <div class="session-info">
          <span class="customer-name">${session.customerName || '포스 주문'}</span>
          <span class="session-time">시작: ${new Date(session.sessionStarted).toLocaleTimeString()}</span>
        </div>
        <div class="session-items">
          ${items.map(item => `
            <div class="session-item">
              <span class="item-name">${item.menuName}</span>
              <span class="item-qty">x${item.quantity}</span>
              <span class="item-price">₩${item.price.toLocaleString()}</span>
              <span class="cooking-status ${item.cookingStatus.toLowerCase()}">${item.cookingStatus}</span>
            </div>
          `).join('')}
        </div>
        <div class="session-actions">
           <button class="btn-small btn-primary" onclick="processSessionPayment('${session.id}')">
            결제하기
          </button>
        </div>
      </div>
    `;
  }
};

// 완료된 주문 UI 모듈
const CompletedOrdersUI = {
  render(completedOrders) {
    const hasOrders = completedOrders.length > 0;

    return `
      <div class="completed-orders-section">
        <h4>✅ 완료된 주문 ${hasOrders ? `(${completedOrders.length}개)` : ''}</h4>
        <div class="orders-container ${completedOrders.length > 3 ? 'scrollable' : ''}">
          ${hasOrders ?
            completedOrders.map(order => this.renderOrderCard(order)).join('') :
            '<div class="no-orders">완료된 주문이 없습니다</div>'
          }
        </div>
      </div>
    `;
  },

  renderOrderCard(order) {
    const orderData = typeof order.orderData === 'string' ? JSON.parse(order.orderData) : order.orderData;
    const items = orderData?.items || [];

    return `
      <div class="order-card completed" data-order-id="${order.id}">
        <div class="order-header">
          <div class="order-info">
            <div class="customer-info">
              <span class="customer-name">👤 ${order.customerName}</span>
              <span class="source-badge ${order.orderSource?.toLowerCase() || 'pos'}">
                ${OrderUtils.getOrderSourceText(order.orderSource || 'POS')}
              </span>
            </div>
            <div class="order-time">${OrderUtils.formatOrderTime(order.orderDate)}</div>
          </div>
          <div class="order-amount completed">₩${order.finalAmount.toLocaleString()}</div>
        </div>

        <div class="order-items collapsed" onclick="toggleOrderItems(this)">
          <div class="items-summary">
            ${items.length}개 메뉴 <span class="expand-icon">▼</span>
          </div>
          <div class="items-detail">
            ${items.map(item => `
              <div class="menu-item">
                <span class="menu-name">${item.name}</span>
                <span class="menu-quantity">×${item.quantity || 1}</span>
                <span class="menu-price">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="order-actions">
          <span class="status-badge completed">결제 완료</span>
          <span class="payment-method">💳 카드</span>
        </div>
      </div>
    `;
  }
};

// 주문 유틸리티 함수들
const OrderUtils = {
  formatOrderTime(orderDate) {
    const date = new Date(orderDate);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5);
  },

  getOrderSourceText(source) {
    const sourceMap = {
      'TLL': 'TLL',
      'POS': 'POS',
      'POS_TLL': 'POS+TLL'
    };
    return sourceMap[source] || source;
  }
};

// 이벤트 리스너 등록
function attachTableDetailEvents(tableNumber) {
  // 타이머 업데이트
  updateTimers();

  // 5초마다 타이머 업데이트
  if (window.tableTimerInterval) {
    clearInterval(window.tableTimerInterval);
  }

  window.tableTimerInterval = setInterval(updateTimers, 5000);

  console.log(`✅ 테이블 ${tableNumber} 상세 패널 이벤트 리스너 등록 완료`);
}

// 타이머 업데이트
function updateTimers() {
  const timerElements = document.querySelectorAll('.timer');
  timerElements.forEach(timer => {
    const table = window.allTables?.find(t => t.tableNumber == window.currentTable);
    if (table && table.occupiedSince) {
      timer.textContent = TableStatusUI.formatTimeSince(table.occupiedSince);
    }
  });
}

// 주문 항목 토글
function toggleOrderItems(element) {
  const orderItems = element.closest('.order-items');
  const expandIcon = orderItems.querySelector('.expand-icon');

  orderItems.classList.toggle('collapsed');
  expandIcon.textContent = orderItems.classList.contains('collapsed') ? '▼' : '▲';
}

// 테이블 데이터 새로고침
async function refreshTableData(tableNumber) {
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.style.animation = 'spin 1s linear infinite';
  }

  try {
    await renderTableDetailPanel(tableNumber);
    showPOSNotification('테이블 정보가 새로고침되었습니다', 'success');
  } catch (error) {
    showPOSNotification('새로고침에 실패했습니다', 'error');
  } finally {
    if (refreshBtn) {
      refreshBtn.style.animation = '';
    }
  }
}

// 액션 함수들
function openAddOrderModal(tableNumber) {
  window.currentTable = tableNumber;
  // Assuming addOrder function is defined elsewhere and handles session logic
  if (typeof addOrder === 'function') {
    addOrder();
  } else {
    console.log(`주문 추가 모달 열기 - 테이블 ${tableNumber}`);
  }
}

function openPaymentModal(tableNumber) {
  window.currentTable = tableNumber;
  // Assuming processPayment function is defined elsewhere
  if (typeof processPayment === 'function') {
    processPayment();
  } else {
    console.log(`결제 모달 열기 - 테이블 ${tableNumber}`);
  }
}

// Function to process payment for the entire session
function processSessionPayment(sessionId) {
  if (typeof processPayment === 'function') {
    // Pass the session ID to the payment processing function
    processPayment(sessionId).then(async () => {
      // After successful payment, potentially clear the session or update table status
      // This part depends on the backend implementation for session payment
      window.showPOSNotification('세션 결제가 완료되었습니다.', 'success');
      // Refresh the panel to reflect the closed session
      await renderTableDetailPanel(window.currentTable);
    });
  } else {
    console.log(`세션 ${sessionId} 결제 처리`);
  }
}


function processOrderPayment(orderId) {
  if (typeof processPayment === 'function') {
    processPayment([orderId]).then(async () => {
      // 결제 완료 후 테이블 점유 상태 자동 해제
      const tableNumber = window.currentTable;
      if (tableNumber) {
        await releaseTable(tableNumber);
      }
    });
  } else {
    console.log(`주문 ${orderId} 개별 결제 처리`);
  }
}

function moveTableOrders(tableNumber) {
  console.log(`테이블 ${tableNumber} 주문 이동`);
  showPOSNotification('테이블 이동 기능은 준비중입니다', 'info');
}

// 테이블 점유 함수
async function occupyTable(tableNumber) {
  try {
    console.log(`🔒 [POS] 테이블 ${tableNumber} 점유 요청`);

    const response = await fetch('/api/tables/occupy-manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: window.currentStore.id,
        tableName: `테이블 ${tableNumber}`,
        duration: 0
      })
    });

    const data = await response.json();

    if (data.success) {
      window.showPOSNotification(`테이블 ${tableNumber}이 점유 상태로 변경되었습니다.`, 'success');
      await window.loadTables();
      window.renderTableMap();
      renderTableDetailPanel(tableNumber); // 현재 패널 새로고침
    } else {
      window.showPOSNotification('오류: ' + data.error, 'error');
    }

  } catch (error) {
    console.error('❌ [POS] 테이블 점유 실패:', error);
    window.showPOSNotification('테이블 점유 실패', 'error');
  }
}

// 테이블 해제 함수
async function releaseTable(tableNumber) {
  try {
    console.log(`🔓 [POS] 테이블 ${tableNumber} 해제 요청`);

    // 테이블 상태 확인
    const tableData = window.allTables?.find(t => t.tableNumber == tableNumber);
    const hasOrders = tableData?.isOccupied || false;

    let confirmMessage = `테이블 ${tableNumber}을 해제하시겠습니까?`;
    if (hasOrders) {
      confirmMessage += `\n\n⚠️ 해제 시 해당 테이블의 모든 주문 정보가 숨겨집니다.`;
    }

    const confirmed = confirm(confirmMessage);
    if (!confirmed) {
      return;
    }

    const response = await fetch('/api/tables/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: window.currentStore.id,
        tableName: `테이블 ${tableNumber}`,
        isOccupied: false
      })
    });

    const data = await response.json();

    if (data.success) {
      window.showPOSNotification(`테이블 ${tableNumber}이 해제되었습니다.`, 'success');
      await window.loadTables();
      window.renderTableMap();
      renderTableDetailPanel(tableNumber); // 현재 패널 새로고침
    } else {
      window.showPOSNotification('오류: ' + data.error, 'error');
    }

  } catch (error) {
    console.error('❌ [POS] 테이블 해제 실패:', error);
    window.showPOSNotification('테이블 해제 실패', 'error');
  }
}


// 스타일
function getTableDetailStyles() {
  return `
    <style>
      /* 기본 컨테이너 */
      .loading-container, .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
      }

      .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f4f6;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-text, .error-text {
        color: #64748b;
        font-size: 14px;
      }

      .error-icon {
        font-size: 32px;
        margin-bottom: 12px;
      }

      .retry-btn {
        margin-top: 16px;
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .retry-btn:hover {
        background: #2563eb;
      }

      /* 패널 제목 */
      .panel-title-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .table-icon {
        font-size: 18px;
      }

      .table-title {
        font-size: 16px;
        font-weight: 600;
        flex: 1;
      }

      .refresh-btn {
        background: none;
        border: none;
        font-size: 14px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .refresh-btn:hover {
        background: #f1f5f9;
      }

      /* 섹션 스타일 */
      .table-status-section, .table-actions-section, .tll-info-section,
      .pending-orders-section, .completed-orders-section {
        margin-bottom: 20px;
        padding: 16px;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }

      .status-header, .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .table-actions-section h4, .tll-info-section h4,
      .pending-orders-section h4, .completed-orders-section h4 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      /* 상태 배지 */
      .status-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status-badge.occupied {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .status-badge.available {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }

      /* 상태 그리드 */
      .status-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .status-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .status-label {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status-value {
        font-size: 14px;
        color: #374151;
        font-weight: 600;
      }

      .status-value.table-number {
        color: #3b82f6;
        font-weight: 700;
      }

      .status-value.timer {
        color: #7c3aed;
        font-weight: 700;
      }

      .status-value.busy {
        color: #dc2626;
      }

      .status-value.free {
        color: #16a34a;
      }

      .timer-item {
        grid-column: 1 / -1;
      }

      /* 액션 그리드 */
      .action-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        color: #374151;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
        min-height: 48px;
      }

      .action-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .action-btn.primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        border-color: #3b82f6;
      }

      .action-btn.secondary {
        background: linear-gradient(135deg, #64748b, #475569);
        color: white;
        border-color: #64748b;
      }

      .action-btn.success {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border-color: #10b981;
      }

      .action-btn.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        border-color: #f59e0b;
      }

      .action-btn.pulse {
        animation: pulse-glow 2s infinite;
      }

      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      }

      .btn-icon {
        font-size: 16px;
      }

      .btn-text {
        font-size: 11px;
      }

      /* TLL 카드 */
      .tll-card {
        display: flex;
        align-items: center;
        gap: 12px;
        background: white;
        border: 1px dashed #8b5cf6;
        border-radius: 12px;
        padding: 16px;
      }

      .customer-avatar {
        font-size: 24px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f3f4f6;
        border-radius: 50%;
      }

      .customer-details {
        flex: 1;
      }

      .customer-name {
        font-weight: 600;
        color: #374151;
        margin-bottom: 4px;
      }

      .customer-badge {
        display: inline-block;
        margin-left: 8px;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .customer-badge.guest {
        background: #fbbf24;
        color: white;
      }

      .customer-badge.member {
        background: #3b82f6;
        color: white;
      }

      .customer-phone {
        font-size: 12px;
        color: #64748b;
      }

      /* 주문 섹션 헤더 */
      .orders-summary {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .order-count {
        background: #3b82f6;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 700;
      }

      .total-amount {
        background: #10b981;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 700;
      }

      /* 주문 컨테이너 */
      .orders-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .orders-container.scrollable {
        max-height: 400px;
        overflow-y: auto;
        padding-right: 4px;
      }

      .orders-container.scrollable::-webkit-scrollbar {
        width: 4px;
      }

      .orders-container.scrollable::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 2px;
      }

      .orders-container.scrollable::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }

      /* 주문 카드 */
      .order-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        transition: all 0.2s;
      }

      .order-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-1px);
      }

      .order-card.pending {
        border-left: 4px solid #f59e0b;
      }

      .order-card.completed {
        border-left: 4px solid #10b981;
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
        gap: 12px;
      }

      .order-info {
        flex: 1;
        min-width: 0;
      }

      .customer-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        flex-wrap: wrap;
      }

      .customer-name {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }

      .source-badge {
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .source-badge.tll {
        background: #3b82f6;
        color: white;
      }

      .source-badge.pos {
        background: #10b981;
        color: white;
      }

      .order-time {
        font-size: 11px;
        color: #64748b;
      }

      .order-amount {
        font-size: 15px;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 8px;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .order-amount.pending {
        background: #fef3c7;
        color: #d97706;
        border: 1px solid #fed7aa;
      }

      .order-amount.completed {
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #bbf7d0;
      }

      /* 주문 아이템 */
      .order-items {
        margin-bottom: 12px;
        background: #f8fafc;
        border-radius: 8px;
        padding: 12px;
        border: 1px solid #e2e8f0;
      }

      .order-items.collapsed .items-detail {
        display: none;
      }

      .order-items:not(.collapsed) .items-summary {
        display: none;
      }

      .items-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .expand-icon {
        font-size: 10px;
        transition: transform 0.2s;
      }

      .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        font-size: 12px;
        border-bottom: 1px solid #f1f5f9;
        gap: 8px;
      }

      .menu-item:last-child {
        border-bottom: none;
      }

      .menu-name {
        flex: 1;
        color: #374151;
        font-weight: 500;
        min-width: 0;
        word-break: break-word;
      }

      .menu-quantity {
        background: #e2e8f0;
        color: #64748b;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 700;
        min-width: 24px;
        text-align: center;
        flex-shrink: 0;
      }

      .menu-price {
        color: #059669;
        font-weight: 700;
        font-size: 11px;
        min-width: 60px;
        text-align: right;
        flex-shrink: 0;
      }

      /* 주문 액션 */
      .order-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .status-badge.completed {
        background: #dcfce7;
        color: #166534;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .payment-method {
        font-size: 10px;
        color: #64748b;
        font-weight: 500;
      }

      .btn-small {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }

      .no-orders {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 32px 20px;
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 8px;
      }

      /* Session specific styles */
      .current-session {
        background: #eef2ff;
        border: 1px solid #a5b4fc;
        border-left: 4px solid #6366f1;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 12px;
      }

      .session-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .session-title {
        font-size: 14px;
        font-weight: 700;
        color: #4f46e5;
      }

      .session-amount {
        font-size: 15px;
        font-weight: 700;
        color: #3b82f6;
      }

      .session-status {
        padding: 4px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .session-status.open {
        background: #dcfce7;
        color: #166534;
      }

      .session-status.closed {
        background: #fef3c7;
        color: #92400e;
      }

      .session-info {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 12px;
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }

      .customer-name {
        font-weight: 600;
        color: #374151;
      }

      .session-items {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed #c7d2fe;
      }

      .session-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        gap: 8px;
      }

      .item-name {
        flex: 1;
        color: #374151;
        font-weight: 500;
        min-width: 0;
        word-break: break-word;
      }

      .item-qty {
        background: #e2e8f0;
        color: #64748b;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 700;
      }

      .item-price {
        color: #059669;
        font-weight: 700;
        font-size: 11px;
        min-width: 60px;
        text-align: right;
      }

      .cooking-status {
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .cooking-status.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .cooking-status.completed {
        background: #dcfce7;
        color: #166534;
      }

      .no-active-session {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 32px 20px;
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 8px;
      }
      .session-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
      }

      /* 점유/해제 버튼 스타일 */
      .detail-action-btn.occupy {
        background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
        color: white;
      }

      .detail-action-btn.release {
        background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
        color: white;
      }

      /* 반응형 */
      @media (max-width: 768px) {
        .status-grid, .action-grid {
          grid-template-columns: 1fr;
        }

        .action-btn {
          padding: 16px;
        }

        .btn-text {
          font-size: 12px;
        }
      }
    </style>
  `;
}

// 전역 함수 등록
window.renderTableDetailPanel = renderTableDetailPanel;
window.refreshTableData = refreshTableData;
window.toggleOrderItems = toggleOrderItems;
window.openAddOrderModal = openAddOrderModal;
window.openPaymentModal = openPaymentModal;
window.processOrderPayment = processOrderPayment;
window.processSessionPayment = processSessionPayment; // Added for session payment
window.moveTableOrders = moveTableOrders;
window.occupyTable = occupyTable; // occupyTable 함수 전역 등록
window.releaseTable = releaseTable; // releaseTable 함수 전역 등록


console.log('✅ 개선된 테이블 상세 정보 패널 UI 모듈 로드 완료');