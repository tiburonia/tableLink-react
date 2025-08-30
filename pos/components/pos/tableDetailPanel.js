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

  const { table, currentSession, completedTLLOrders, tllOrder } = data;
  const isOccupied = table.isOccupied || !!currentSession;
  const hasActiveSession = !!currentSession;
  const hasCompletedOrders = completedTLLOrders.length > 0;

  console.log(`🎨 테이블 ${tableNumber} UI 렌더링:`, {
    isOccupied,
    hasActiveSession,
    hasCompletedOrders,
    sessionItemCount: currentSession?.itemCount || 0
  });

  panelContent.innerHTML = `
    ${TableStatusUI.render(tableNumber, table, isOccupied)}
    ${TableActionsUI.render(tableNumber, isOccupied, hasActiveSession, hasCompletedOrders)}
    ${CurrentSessionUI.render(currentSession, tllOrder)}
    ${CompletedOrdersUI.render(completedTLLOrders)}
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

    console.log(`🔍 테이블 ${tableNumber} 데이터 로드:`, {
      success: allOrdersData.success,
      currentSession: allOrdersData.currentSession,
      completedTLLOrders: allOrdersData.completedTLLOrders?.length || 0
    });

    return {
      table: currentTable || { tableNumber, isOccupied: false },
      currentSession: allOrdersData.success ? allOrdersData.currentSession : null,
      completedTLLOrders: allOrdersData.success ? allOrdersData.completedTLLOrders : [],
      tllOrder: tllOrderData.success ? tllOrderData.tllOrder : null
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

// 현재 세션 UI 모듈 (개선된 버전)
const CurrentSessionUI = {
  render(currentSession, tllOrder = null) {
    // POS 세션과 TLL 주문 상태 확인
    const hasPOSSession = currentSession && currentSession.items && currentSession.items.length > 0;
    const hasTLLOrder = tllOrder && tllOrder.finalAmount;

    // 둘 다 없으면 빈 상태 표시
    if (!hasPOSSession && !hasTLLOrder) {
      return `
        <div class="session-section">
          <div class="section-header">
            <h4>📦 현재 세션</h4>
          </div>
          <div class="empty-session">
            <div class="empty-icon">📭</div>
            <p class="empty-text">진행 중인 주문이 없습니다</p>
            <p class="empty-hint">주문 추가 버튼을 눌러 새 주문을 시작하세요</p>
          </div>
        </div>
      `;
    }

    // TLL 주문 아이템 파싱
    let tllItems = [];
    if (hasTLLOrder && tllOrder.orderData) {
      try {
        const orderData = typeof tllOrder.orderData === 'string' 
          ? JSON.parse(tllOrder.orderData) 
          : tllOrder.orderData;
        tllItems = orderData.items || [];
      } catch (error) {
        console.error('TLL 주문 데이터 파싱 실패:', error);
        tllItems = [];
      }
    }

    // 통계 계산
    const posItemCount = hasPOSSession ? currentSession.itemCount : 0;
    const tllItemCount = tllItems.length;
    const totalItemCount = posItemCount + tllItemCount;

    const posAmount = hasPOSSession ? currentSession.totalAmount : 0;
    const tllAmount = hasTLLOrder ? tllOrder.finalAmount : 0;
    const totalAmount = posAmount + tllAmount;

    return `
      <div class="session-section">
        <div class="section-header">
          <h4>📦 현재 세션</h4>
          <div class="session-summary">
            <span class="item-count">${totalItemCount}개</span>
            <span class="total-amount">₩${totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div class="session-container">
          ${hasPOSSession ? this.renderPOSSession(currentSession) : ''}
          ${hasTLLOrder ? this.renderTLLSession(tllOrder, tllItems) : ''}
        </div>
      </div>
    `;
  },

  renderPOSSession(session) {
    return `
      <div class="session-card pos-session">
        <div class="session-card-header">
          <div class="session-info">
            <span class="session-type">🏪 POS 주문</span>
            <span class="session-status active">진행중</span>
          </div>
          <div class="session-amount">₩${session.totalAmount.toLocaleString()}</div>
        </div>

        <div class="session-items">
          ${session.items.map(item => `
            <div class="session-item">
              <div class="item-details">
                <span class="item-name">${item.menuName}</span>
                <span class="item-quantity">×${item.quantity}</span>
              </div>
              <div class="item-status">
                <span class="status-indicator ${item.cookingStatus.toLowerCase()}">
                  ${this.getStatusIcon(item.cookingStatus)}
                </span>
                <span class="status-text">${this.getStatusText(item.cookingStatus)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderTLLSession(tllOrder, items) {
    const customerInfo = tllOrder.isGuest 
      ? `👤 ${tllOrder.customerName}` 
      : `👨‍💼 ${tllOrder.customerName}`;

    return `
      <div class="session-card tll-session">
        <div class="session-card-header">
          <div class="session-info">
            <span class="session-type">📱 TLL 주문</span>
            <span class="session-status completed">결제완료</span>
          </div>
          <div class="session-amount">₩${tllOrder.finalAmount.toLocaleString()}</div>
        </div>

        <div class="customer-info">
          <span class="customer-name">${customerInfo}</span>
          ${tllOrder.phone ? `<span class="customer-phone">📞 ${this.formatPhone(tllOrder.phone)}</span>` : ''}
        </div>

        <div class="session-items">
          ${items.map(item => `
            <div class="session-item">
              <div class="item-details">
                <span class="item-name">${item.name}</span>
                <span class="item-quantity">×${item.quantity || 1}</span>
              </div>
              <div class="item-status">
                <span class="status-indicator completed">✅</span>
                <span class="status-text">결제완료</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  formatPhone(phone) {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  },

  getStatusIcon(status) {
    const icons = {
      'PENDING': '⏳',
      'COOKING': '🍳',
      'COMPLETED': '✅',
      'SERVED': '🍽️'
    };
    return icons[status] || '⏳';
  },

  getStatusText(status) {
    const statusMap = {
      'PENDING': '대기중',
      'COOKING': '조리중',
      'COMPLETED': '완료',
      'SERVED': '서빙완료'
    };
    return statusMap[status] || status;
  }
};

// 완료된 TLL 주문 UI 모듈
const CompletedOrdersUI = {
  render(completedTLLOrders) {
    const hasOrders = completedTLLOrders.length > 0;

    return `
      <div class="completed-tll-orders-section">
        <div class="section-header">
          <h4>🔗 최근 TLL 결제내역</h4>
          ${hasOrders ? `<span class="order-count-badge">${completedTLLOrders.length}</span>` : ''}
        </div>
        <div class="orders-container ${completedTLLOrders.length > 2 ? 'scrollable-tll' : ''}">
          ${hasOrders ?
            completedTLLOrders.map(order => this.renderTLLOrderCard(order)).join('') :
            '<div class="no-tll-orders">최근 TLL 결제내역이 없습니다</div>'
          }
        </div>
      </div>
    `;
  },

  renderTLLOrderCard(order) {
    const orderData = typeof order.orderData === 'string' ? JSON.parse(order.orderData) : order.orderData;
    const items = orderData?.items || [];
    const paymentTime = new Date(order.orderDate);

    return `
      <div class="tll-order-card" data-order-id="${order.id}">
        <div class="tll-order-header">
          <div class="customer-info">
            <span class="customer-icon">👤</span>
            <span class="customer-name">${order.customerName}</span>
            <span class="tll-badge">TLL</span>
          </div>
          <div class="payment-time">
            <span class="time-icon">🕐</span>
            ${this.formatTimeAgo(paymentTime)}
          </div>
        </div>

        <div class="tll-order-items collapsed" onclick="toggleTLLItems(this)">
          <div class="items-summary">
            <span class="items-text">${items.length}개 메뉴</span>
            <span class="expand-icon">▼</span>
          </div>
          <div class="items-detail">
            ${items.map(item => `
              <div class="tll-menu-item">
                <span class="menu-name">${item.name}</span>
                <span class="menu-quantity">×${item.quantity || 1}</span>
                <span class="menu-price">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="tll-order-footer">
          <div class="payment-amount">₩${order.finalAmount.toLocaleString()}</div>
          <div class="payment-status">
            <span class="status-icon">✅</span>
            결제완료
          </div>
        </div>
      </div>
    `;
  },

  formatTimeAgo(date) {
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5);
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

// 세션 아이템 토글
function toggleSessionItems(button) {
  const sessionCard = button.closest('.session-card');
  const itemsContainer = sessionCard.querySelector('.session-items');
  const toggleIcon = button.querySelector('.toggle-icon');

  itemsContainer.classList.toggle('collapsed');
  toggleIcon.textContent = itemsContainer.classList.contains('collapsed') ? '▼' : '▲';
}

// TLL 주문 아이템 토글
function toggleTLLItems(element) {
  const tllItems = element.closest('.tll-order-items');
  const expandIcon = tllItems.querySelector('.expand-icon');

  tllItems.classList.toggle('collapsed');
  expandIcon.textContent = tllItems.classList.contains('collapsed') ? '▼' : '▲';
}

// 주문 항목 토글 (하위호환)
function toggleOrderItems(element) {
  toggleTLLItems(element);
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
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .status-pending {
        background: #fef3c7;
        color: #92400e;
      }

      .status-cooking {
        background: #ddd6fe;
        color: #7c3aed;
      }

      .status-completed {
        background: #dcfce7;
        color: #166534;
      }

      /* 세션 액션 */
      .session-actions {
        display: flex;
        justify-content: center;
        padding: 16px 20px;
      }

      .session-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
        min-width: 120px;
      }

      .btn-payment {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      .btn-payment:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
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

      /* 현재 세션 스타일 (개선된 버전) */
      .session-section {
        margin-bottom: 20px;
        padding: 16px;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }

      .session-summary {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .item-count {
        background: #3b82f6;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
      }

      .total-amount {
        background: #10b981;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
      }

      .session-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 16px;
      }

      .session-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }

      .session-card.pos-session {
        border-left: 4px solid #f59e0b;
      }

      .session-card.tll-session {
        border-left: 4px solid #3b82f6;
      }

      .session-card-header {
        padding: 16px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .session-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .session-type {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }

      .session-status {
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .session-status.active {
        background: #fef3c7;
        color: #92400e;
      }

      .session-status.completed {
        background: #dcfce7;
        color: #166534;
      }

      .session-amount {
        font-size: 16px;
        font-weight: 700;
        color: #059669;
      }

      .customer-info {
        padding: 12px 16px;
        background: #f8fafc;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .customer-name {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }

      .customer-phone {
        font-size: 12px;
        color: #64748b;
      }

      .session-items {
        padding: 16px;
      }

      .session-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .session-item:last-child {
        border-bottom: none;
      }

      .item-details {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .item-name {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }

      .item-quantity {
        background: #e2e8f0;
        color: #64748b;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
      }

      .item-status {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .status-indicator {
        font-size: 14px;
      }

      .status-indicator.pending {
        color: #f59e0b;
      }

      .status-indicator.cooking {
        color: #8b5cf6;
      }

      .status-indicator.completed {
        color: #10b981;
      }

      .status-text {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
      }

      .empty-session {
        text-align: center;
        padding: 40px 20px;
        background: white;
        border-radius: 12px;
        border: 2px dashed #cbd5e1;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.6;
      }

      .empty-text {
        font-size: 16px;
        font-weight: 600;
        color: #64748b;
        margin-bottom: 8px;
      }

      .empty-hint {
        font-size: 14px;
        color: #94a3b8;
      }

      .session-card {
        background: white;
        margin: 16px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
      }

      .session-card.unified {
        border: 2px solid #6366f1; /* Unified session border */
      }

      .session-header {
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .session-info-left {
        flex: 1;
      }

      .customer-name, .session-time {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .customer-name {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .session-time {
        font-size: 13px;
        color: #64748b;
      }

      .customer-icon, .time-icon {
        font-size: 14px;
      }

      .session-amount {
        text-align: right;
      }

      .amount-label {
        display: block;
        font-size: 12px;
        color: #64748b;
        margin-bottom: 4px;
      }

      .amount-value {
        font-size: 20px;
        font-weight: 800;
        color: #059669;
      }

      .session-items-container {
        border-bottom: 1px solid #e2e8f0;
      }

      .items-header {
        padding: 16px 20px;
        background: #f8fafc;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
      }

      .items-title {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .items-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
      }

      .toggle-icon {
        font-size: 12px;
        color: #64748b;
        transition: transform 0.2s;
      }

      .session-items {
        padding: 0 20px 16px 20px;
      }

      .session-items.collapsed {
        display: none;
      }

      .session-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .session-item:last-child {
        border-bottom: none;
      }

      .item-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .item-name {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .item-qty {
        background: #e2e8f0;
        color: #64748b;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
      }

      .item-details {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .item-price {
        font-size: 14px;
        font-weight: 700;
        color: #059669;
      }

      .cooking-status {
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .status-pending {
        background: #fef3c7;
        color: #92400e;
      }

      .status-cooking {
        background: #ddd6fe;
        color: #7c3aed;
      }

      .status-completed {
        background: #dcfce7;
        color: #166534;
      }

      /* TLL 주문 아이템 그룹 */
      .item-group {
        margin-top: 16px;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .item-group:not(:last-child) {
        margin-bottom: 12px;
      }

      .pos-items {
        background: #fff;
      }

      .tll-items {
        background: #f0f9ff;
        border-color: #93c5fd;
      }

      .group-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;
      }

      .tll-items .group-header {
        border-bottom-color: #93c5fd;
      }

      .group-title {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }

      .pos-items .group-title {
        color: #4f46e5;
      }

      .group-amount {
        font-size: 13px;
        font-weight: 700;
        color: #64748b;
        margin-left: auto; /* Pushes amount to the right */
      }

      .pos-items .group-amount {
        color: #4338ca;
      }

      .tll-items .group-amount {
        color: #1e40af;
      }

      .payment-badge {
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .payment-badge.completed {
        background: #dcfce7;
        color: #166534;
      }

      /* TLL 메뉴 아이템 */
      .tll-item {
        background: #eef7ff;
        border-color: #93c5fd;
      }

      /* 완료된 TLL 주문 스타일 */
      .completed-tll-orders-section {
        margin-bottom: 20px;
        background: #fafafa;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
      }

      .order-count-badge {
        background: #3b82f6;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
      }

      .scrollable-tll {
        max-height: 300px;
        overflow-y: auto;
        padding-right: 4px;
      }

      .no-tll-orders {
        text-align: center;
        color: #94a3b8;
        font-style: italic;
        padding: 32px 20px;
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 8px;
        margin: 16px;
      }

      .tll-order-card {
        background: white;
        margin: 12px 16px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        overflow: hidden;
        transition: all 0.2s;
      }

      .tll-order-card:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transform: translateY(-1px);
      }

      .tll-order-header {
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #f1f5f9;
      }

      .tll-badge {
        background: #3b82f6;
        color: white;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        margin-left: 8px;
      }

      .payment-time {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #64748b;
      }

      .tll-order-items {
        background: #f8fafc;
        cursor: pointer;
      }

      .tll-order-items .items-summary {
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .tll-order-items.collapsed .items-detail {
        display: none;
      }

      .tll-order-items:not(.collapsed) .items-summary {
        border-bottom: 1px solid #e2e8f0;
      }

      .items-text {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .items-detail {
        padding: 0 16px 12px 16px;
      }

      .tll-menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 12px;
        border-bottom: 1px solid #f1f5f9;
      }

      .tll-menu-item:last-child {
        border-bottom: none;
      }

      .tll-order-footer {
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8fafc;
      }

      .payment-amount {
        font-size: 16px;
        font-weight: 700;
        color: #059669;
      }

      .payment-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #16a34a;
        font-weight: 600;
      }

      .status-icon {
        font-size: 14px;
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

        .session-header {
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }

        .session-actions {
          flex-direction: column;
        }

        .group-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .group-amount {
          margin-left: 0;
          margin-top: 4px;
        }
      }
    </style>
  `;
}

// 테이블 주문 로딩 상태 표시
function showTableOrdersLoading() {
  const panelContent = document.getElementById('panelContent');
  if (panelContent) {
    panelContent.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">주문 정보를 불러오는 중...</div>
      </div>
    `;
  }
}

// 테이블 주문 로드 (개선된 버전)
async function loadTableOrders(storeId, tableNumber) {
  try {
    console.log(`🔍 POS - 테이블 ${tableNumber} 주문 조회 시작`);

    // 로딩 상태 표시
    showTableOrdersLoading();

    const response = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/all-orders`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Assume data contains currentSession and completedTLLOrders

  } catch (error) {
    console.error(`❌ POS - 테이블 ${tableNumber} 주문 조회 실패:`, error);
    // 에러 상태 표시
    showErrorState(); // Re-use the general error state display
    throw error;
  }
}

// 전역 함수 등록
window.renderTableDetailPanel = renderTableDetailPanel;
window.refreshTableData = refreshTableData;
window.toggleOrderItems = toggleOrderItems;
window.toggleSessionItems = toggleSessionItems;
window.toggleTLLItems = toggleTLLItems;
window.openAddOrderModal = openAddOrderModal;
window.openPaymentModal = openPaymentModal;
window.processOrderPayment = processOrderPayment;
window.processSessionPayment = processSessionPayment;
window.moveTableOrders = moveTableOrders;
window.occupyTable = occupyTable;
window.releaseTable = releaseTable;
window.loadTableOrders = loadTableOrders; // Ensure this is globally available if needed elsewhere


console.log('✅ 개선된 테이블 상세 정보 패널 UI 모듈 로드 완료');