
/**
 * 주문 진행 상황 모니터링 화면
 * - 현재 진행 중인 주문 세션 실시간 모니터링
 * - 추가 주문 기능
 * - 세션 종료 기능
 * - TLL/POS 결제 모니터링
 */

async function renderProcessingOrder(orderId) {
  try {
    console.log('📋 주문 진행 상황 화면 렌더링:', orderId);

    const main = document.getElementById('main');
    
    // 로딩 상태 표시
    main.innerHTML = `
      <div class="processing-order-container">
        <div class="processing-header">
          <button id="backBtn" class="header-back-btn">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>🍽️ 주문 진행 현황</h1>
            <p class="header-subtitle">실시간 주문 모니터링</p>
          </div>
        </div>

        <div class="loading-section">
          <div class="loading-spinner"></div>
          <p>주문 정보를 불러오는 중...</p>
        </div>
      </div>

      ${getProcessingOrderStyles()}
    `;

    // 주문 데이터 로드
    const orderData = await loadOrderData(orderId);
    
    if (!orderData) {
      showErrorState('주문 정보를 찾을 수 없습니다');
      return;
    }

    // 세션이 종료된 주문인지 확인
    if (orderData.status === 'CLOSED' || orderData.session_ended) {
      showSessionEndedState(orderData);
      return;
    }

    // 실제 UI 렌더링
    renderProcessingOrderUI(orderData);

    // 실시간 업데이트 시작
    startRealTimeUpdates(orderId);

  } catch (error) {
    console.error('❌ 주문 진행 상황 화면 오류:', error);
    showErrorState('주문 진행 상황을 불러올 수 없습니다');
  }
}

// 주문 데이터 로드
async function loadOrderData(orderId) {
  try {
    const response = await fetch(`/api/orders/processing/${orderId}`);
    
    if (!response.ok) {
      throw new Error('주문 데이터 로드 실패');
    }

    const data = await response.json();
    return data.success ? data.order : null;

  } catch (error) {
    console.error('❌ 주문 데이터 로드 실패:', error);
    return null;
  }
}

// 주문 진행 UI 렌더링
function renderProcessingOrderUI(orderData) {
  const main = document.getElementById('main');
  
  main.innerHTML = `
    <div class="processing-order-container">
      <!-- 헤더 -->
      <div class="processing-header">
        <button id="backBtn" class="header-back-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
        </button>
        <div class="header-info">
          <h1>🍽️ ${orderData.storeName}</h1>
          <p class="header-subtitle">테이블 ${orderData.tableNumber} • ${formatOrderTime(orderData.createdAt)}</p>
        </div>
        <div class="header-actions">
          <button id="endSessionBtn" class="end-session-btn">
            🔚 식사 종료
          </button>
        </div>
      </div>

      <div class="processing-content">
        <!-- 주문 요약 섹션 -->
        <div class="order-summary-section">
          <div class="summary-card">
            <div class="summary-header">
              <h3>📊 주문 요약</h3>
              <div class="order-status status-${orderData.status.toLowerCase()}">
                ${getStatusText(orderData.status)}
              </div>
            </div>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-label">총 주문</span>
                <span class="stat-value">${orderData.totalOrders}건</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">총 결제</span>
                <span class="stat-value">${orderData.totalAmount.toLocaleString()}원</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">진행시간</span>
                <span class="stat-value" id="elapsedTime">${getElapsedTime(orderData.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 실시간 티켓 현황 -->
        <div class="tickets-section">
          <div class="section-header">
            <h3>🎫 실시간 주방 현황</h3>
            <button class="refresh-btn" onclick="refreshTickets()">🔄</button>
          </div>
          <div id="ticketsGrid" class="tickets-grid">
            ${renderTicketsGrid(orderData.tickets)}
          </div>
        </div>

        <!-- 결제 내역 섹션 -->
        <div class="payments-section">
          <div class="section-header">
            <h3>💳 결제 내역</h3>
            <div class="payment-summary">
              총 ${orderData.payments.length}건 • ${orderData.totalAmount.toLocaleString()}원
            </div>
          </div>
          <div class="payments-list">
            ${renderPaymentsList(orderData.payments)}
          </div>
        </div>

        <!-- 추가 주문 섹션 -->
        <div class="add-order-section">
          <button id="addOrderBtn" class="add-order-btn">
            ➕ 추가 주문하기
          </button>
        </div>
      </div>
    </div>

    ${getProcessingOrderStyles()}
  `;

  // 이벤트 리스너 등록
  setupEventListeners(orderData);
}

// 티켓 그리드 렌더링
function renderTicketsGrid(tickets) {
  if (!tickets || tickets.length === 0) {
    return `
      <div class="no-tickets">
        <div class="no-tickets-icon">🍽️</div>
        <p>아직 조리 중인 주문이 없습니다</p>
      </div>
    `;
  }

  return tickets.map(ticket => `
    <div class="ticket-card status-${ticket.status.toLowerCase()}">
      <div class="ticket-header">
        <span class="ticket-id">#${ticket.id}</span>
        <span class="ticket-status">${getStatusText(ticket.status)}</span>
      </div>
      <div class="ticket-items">
        ${ticket.items.slice(0, 2).map(item => `
          <div class="ticket-item">
            <span class="item-name">${item.name}</span>
            <span class="item-quantity">×${item.quantity}</span>
          </div>
        `).join('')}
        ${ticket.items.length > 2 ? `<div class="more-items">+${ticket.items.length - 2}개 더</div>` : ''}
      </div>
      <div class="ticket-time">${formatOrderTime(ticket.createdAt)}</div>
    </div>
  `).join('');
}

// 결제 내역 렌더링
function renderPaymentsList(payments) {
  return payments.map(payment => `
    <div class="payment-item">
      <div class="payment-info">
        <div class="payment-method">
          ${getPaymentMethodIcon(payment.method)} ${payment.method}
        </div>
        <div class="payment-time">${formatOrderTime(payment.createdAt)}</div>
      </div>
      <div class="payment-amount">
        ${payment.amount.toLocaleString()}원
      </div>
    </div>
  `).join('');
}

// 이벤트 리스너 설정
function setupEventListeners(orderData) {
  // 뒤로 가기
  document.getElementById('backBtn').addEventListener('click', () => {
    if (window.previousScreen === 'renderNotification') {
      renderNotification();
    } else {
      renderMyPage();
    }
  });

  // 세션 종료
  document.getElementById('endSessionBtn').addEventListener('click', () => {
    showEndSessionConfirm(orderData.id);
  });

  // 추가 주문
  document.getElementById('addOrderBtn').addEventListener('click', () => {
    addNewOrder(orderData.storeId, orderData.tableNumber);
  });
}

// 세션 종료 확인 다이얼로그
function showEndSessionConfirm(orderId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>🔚 식사를 종료하시겠습니까?</h3>
      <p>세션을 종료하면 더 이상 이 화면에 접근할 수 없습니다.</p>
      <div class="modal-actions">
        <button class="btn secondary" onclick="this.closest('.modal-overlay').remove()">
          취소
        </button>
        <button class="btn primary" onclick="endSession(${orderId})">
          식사 종료
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// 세션 종료 처리
async function endSession(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}/end-session`, {
      method: 'PUT'
    });

    const result = await response.json();

    if (result.success) {
      // 모달 닫기
      document.querySelector('.modal-overlay')?.remove();
      
      // 종료 완료 화면 표시
      showSessionEndedState({ id: orderId, sessionEnded: true });
      
    } else {
      throw new Error(result.error || '세션 종료 실패');
    }

  } catch (error) {
    console.error('❌ 세션 종료 실패:', error);
    alert('세션 종료 중 오류가 발생했습니다: ' + error.message);
  }
}

// 세션 종료 상태 표시
function showSessionEndedState(orderData) {
  const main = document.getElementById('main');
  
  main.innerHTML = `
    <div class="processing-order-container">
      <div class="processing-header">
        <button id="backBtn" class="header-back-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
        </button>
        <div class="header-info">
          <h1>🔚 식사 완료</h1>
          <p class="header-subtitle">주문 세션이 종료되었습니다</p>
        </div>
      </div>

      <div class="session-ended-content">
        <div class="ended-icon">🎉</div>
        <h2>식사를 완료하셨습니다!</h2>
        <p>즐거운 시간이 되셨길 바랍니다.</p>
        
        <div class="ended-actions">
          <button class="btn primary" onclick="renderMyPage()">
            마이페이지로
          </button>
          <button class="btn secondary" onclick="renderMap()">
            다른 매장 찾기
          </button>
        </div>
      </div>
    </div>

    ${getProcessingOrderStyles()}
  `;

  // 뒤로 가기 이벤트
  document.getElementById('backBtn').addEventListener('click', () => {
    renderMyPage();
  });
}

// 추가 주문 처리
async function addNewOrder(storeId, tableNumber) {
  try {
    // renderOrderScreen으로 이동 (기존 세션 유지)
    if (typeof renderOrderScreen === 'function') {
      await renderOrderScreen(storeId, tableNumber, { continuingSession: true });
    } else {
      console.warn('renderOrderScreen 함수를 찾을 수 없습니다');
      alert('추가 주문 기능을 사용할 수 없습니다');
    }

  } catch (error) {
    console.error('❌ 추가 주문 실패:', error);
    alert('추가 주문 중 오류가 발생했습니다');
  }
}

// 실시간 업데이트 시작
function startRealTimeUpdates(orderId) {
  // 30초마다 데이터 갱신
  const updateInterval = setInterval(async () => {
    try {
      const orderData = await loadOrderData(orderId);
      
      if (orderData && orderData.status !== 'CLOSED' && !orderData.session_ended) {
        updateProcessingData(orderData);
      } else {
        clearInterval(updateInterval);
        if (orderData && (orderData.status === 'CLOSED' || orderData.session_ended)) {
          showSessionEndedState(orderData);
        }
      }

    } catch (error) {
      console.warn('⚠️ 실시간 업데이트 실패:', error);
    }
  }, 30000);

  // 페이지 언로드 시 인터벌 정리
  window.addEventListener('beforeunload', () => {
    clearInterval(updateInterval);
  });
}

// 처리 데이터 업데이트
function updateProcessingData(orderData) {
  // 경과 시간 업데이트
  const elapsedTimeElement = document.getElementById('elapsedTime');
  if (elapsedTimeElement) {
    elapsedTimeElement.textContent = getElapsedTime(orderData.createdAt);
  }

  // 티켓 그리드 업데이트
  const ticketsGrid = document.getElementById('ticketsGrid');
  if (ticketsGrid) {
    ticketsGrid.innerHTML = renderTicketsGrid(orderData.tickets);
  }
}

// 유틸리티 함수들
function formatOrderTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function getElapsedTime(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else {
    return `${minutes}분`;
  }
}

function getStatusText(status) {
  const statusMap = {
    'OPEN': '진행중',
    'COOKING': '조리중',
    'READY': '완료',
    'DONE': '서빙완료',
    'CLOSED': '종료',
    'PENDING': '대기중'
  };
  
  return statusMap[status] || status;
}

function getPaymentMethodIcon(method) {
  const methodIcons = {
    'TOSS': '💳',
    'CARD': '💳',
    'CASH': '💵',
    'MOBILE': '📱'
  };
  
  return methodIcons[method] || '💳';
}

function refreshTickets() {
  // 티켓 새로고침 로직 (필요시 구현)
  console.log('🔄 티켓 새로고침');
}

// 에러 상태 표시
function showErrorState(message) {
  const main = document.getElementById('main');
  
  main.innerHTML = `
    <div class="processing-order-container">
      <div class="processing-header">
        <button id="backBtn" class="header-back-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
        </button>
        <div class="header-info">
          <h1>⚠️ 오류 발생</h1>
        </div>
      </div>

      <div class="error-content">
        <div class="error-icon">❌</div>
        <h2>문제가 발생했습니다</h2>
        <p>${message}</p>
        
        <div class="error-actions">
          <button class="btn primary" onclick="renderMyPage()">
            마이페이지로
          </button>
        </div>
      </div>
    </div>

    ${getProcessingOrderStyles()}
  `;

  document.getElementById('backBtn').addEventListener('click', () => {
    renderMyPage();
  });
}

// 스타일 정의
function getProcessingOrderStyles() {
  return `
    <style>
      .processing-order-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        overflow: hidden;
      }

      .processing-header {
        height: 80px;
        background: white;
        padding: 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        z-index: 100;
      }

      .header-back-btn {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: none;
        background: #f1f5f9;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .header-back-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .header-info {
        flex: 1;
      }

      .header-info h1 {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }

      .header-subtitle {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }

      .end-session-btn {
        padding: 8px 12px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .end-session-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }

      .processing-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .order-summary-section,
      .tickets-section,
      .payments-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
      }

      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .summary-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .order-status {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .status-open { background: #dbeafe; color: #1d4ed8; }
      .status-cooking { background: #fef3c7; color: #d97706; }
      .status-ready { background: #d1fae5; color: #059669; }
      .status-done { background: #e0e7ff; color: #6366f1; }
      .status-closed { background: #f3f4f6; color: #6b7280; }

      .summary-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .stat-item {
        text-align: center;
        padding: 16px 12px;
        background: #f8fafc;
        border-radius: 12px;
      }

      .stat-label {
        display: block;
        font-size: 12px;
        color: #64748b;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .refresh-btn {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: none;
        background: #f1f5f9;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .refresh-btn:hover {
        background: #e2e8f0;
        transform: rotate(90deg);
      }

      .tickets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 12px;
      }

      .ticket-card {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
      }

      .ticket-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }

      .ticket-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .ticket-id {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
      }

      .ticket-status {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 6px;
        background: #e2e8f0;
        color: #475569;
        font-weight: 600;
      }

      .ticket-items {
        margin-bottom: 8px;
      }

      .ticket-item {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: #475569;
        margin-bottom: 4px;
      }

      .item-name {
        flex: 1;
      }

      .item-quantity {
        color: #64748b;
        font-weight: 600;
      }

      .more-items {
        font-size: 12px;
        color: #9ca3af;
        font-style: italic;
      }

      .ticket-time {
        font-size: 11px;
        color: #9ca3af;
      }

      .no-tickets {
        text-align: center;
        padding: 40px 20px;
        color: #9ca3af;
      }

      .no-tickets-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .payments-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .payment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .payment-method {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2px;
      }

      .payment-time {
        font-size: 12px;
        color: #64748b;
      }

      .payment-amount {
        font-size: 16px;
        font-weight: 700;
        color: #059669;
      }

      .payment-summary {
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
      }

      .add-order-section {
        display: flex;
        justify-content: center;
        padding: 20px 0;
      }

      .add-order-btn {
        padding: 16px 32px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
      }

      .add-order-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
      }

      .loading-section,
      .session-ended-content,
      .error-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 40px 20px;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .ended-icon,
      .error-icon {
        font-size: 64px;
        margin-bottom: 20px;
      }

      .session-ended-content h2,
      .error-content h2 {
        color: #1e293b;
        margin-bottom: 12px;
        font-size: 24px;
        font-weight: 700;
      }

      .session-ended-content p,
      .error-content p {
        color: #64748b;
        margin-bottom: 32px;
        font-size: 16px;
      }

      .ended-actions,
      .error-actions {
        display: flex;
        gap: 16px;
      }

      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn.primary {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
      }

      .btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .btn.secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
      }

      .btn.secondary:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      }

      .modal-content h3 {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
      }

      .modal-content p {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #64748b;
      }

      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      @media (max-width: 480px) {
        .processing-header {
          padding: 16px 12px;
        }

        .processing-content {
          padding: 16px 12px;
        }

        .summary-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .tickets-grid {
          grid-template-columns: 1fr;
        }

        .ended-actions,
        .error-actions {
          flex-direction: column;
        }
      }
    </style>
  `;
}

// 전역으로 함수 노출
window.renderProcessingOrder = renderProcessingOrder;
