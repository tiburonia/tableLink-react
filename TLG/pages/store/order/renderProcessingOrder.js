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

    // 현재 주문 ID 저장 (추가 주문에서 사용)
    window.currentOrderId = orderId;

    const main = document.getElementById('main');

    // 로딩 상태 표시
    main.innerHTML = `
      <div class="processing-order-container">
        <div class="processing-header">
          <button id="backBtn" class="header-back-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>주문 현황</h1>
            <p class="header-subtitle">실시간 모니터링</p>
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
    console.log('📋 주문 데이터 로드 시작:', orderId);

    const response = await fetch(`/api/orders/processing/${orderId}`);

    if (!response.ok) {
      throw new Error(`주문 데이터 로드 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('📋 API 응답 전체 데이터:', data);

    if (!data.success) {
      throw new Error(data.error || '주문 데이터 조회 실패');
    }

    const orderData = data.order;
    console.log('📋 파싱된 주문 데이터:', {
      id: orderData.id,
      storeName: orderData.storeName,
      tableNumber: orderData.tableNumber,
      ticketCount: orderData.tickets?.length || 0,
      tickets: orderData.tickets
    });

    // 각 티켓의 아이템 정보 상세 로그
    if (orderData.tickets && orderData.tickets.length > 0) {
      orderData.tickets.forEach((ticket, index) => {
        const ticketId = ticket.ticket_id || ticket.id;
        const itemsArray = ticket.items;

        console.log(`🎫 티켓 ${index + 1} (ID: ${ticketId}):`, {
          ticket_id: ticketId,
          order_id: ticket.order_id,
          status: ticket.status,
          itemsCount: itemsArray?.length || 0,
          itemsType: Array.isArray(itemsArray) ? 'array' : typeof itemsArray,
          rawItems: itemsArray
        });

        if (itemsArray && Array.isArray(itemsArray) && itemsArray.length > 0) {
          itemsArray.forEach((item, itemIndex) => {
            console.log(`  🍽️ 아이템 ${itemIndex + 1}:`, {
              id: item.id,
              name: item.menu_name || item.name,
              quantity: item.quantity,
              station: item.cook_station,
              status: item.status,
              rawItem: item
            });
          });
        } else {
          console.warn(`  ⚠️ 티켓 ${ticketId}에 아이템이 없습니다:`, {
            itemsProvided: !!itemsArray,
            itemsType: typeof itemsArray,
            itemsLength: itemsArray?.length,
            isArray: Array.isArray(itemsArray)
          });
        }
      });
    } else {
      console.warn('⚠️ 주문에 티켓이 없습니다:', {
        ticketsProvided: !!orderData.tickets,
        ticketsType: typeof orderData.tickets,
        ticketsLength: orderData.tickets?.length
      });
    }

    return orderData;

  } catch (error) {
    console.error('❌ 주문 데이터 로드 실패:', error);
    return null;
  }
}

// 주문 진행 UI 렌더링
function renderProcessingOrderUI(orderData) {
  const main = document.getElementById('main');

  // POS와 TLL 주문을 source로 구분
  const posTickets = orderData.tickets.filter(ticket => ticket.source === 'POS');
  const tllTickets = orderData.tickets.filter(ticket => ticket.source === 'TLL');

  // POS 주문을 결제 상태별로 구분
  const unpaidPosTickets = posTickets.filter(ticket => ticket.paid_status === 'UNPAID');
  const paidPosTickets = posTickets.filter(ticket => ticket.paid_status === 'PAID');

  const hasAnyPosTickets = posTickets.length > 0;

  main.innerHTML = `
    <div class="processing-order-container">
      <!-- 헤더 -->
      <div class="processing-header">
        <button id="backBtn" class="header-back-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <div class="header-info">
          <h1>${orderData.storeName}</h1>
          <p class="header-subtitle">테이블 ${orderData.tableNumber}</p>
        </div>
        <button id="endSessionBtn" class="end-session-btn">
          종료
        </button>
      </div>

      <div class="processing-content">
        <!-- 주문 요약 -->
        <div class="summary-card">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">총 주문</span>
              <span class="summary-value">${orderData.totalOrders}건</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">총 결제</span>
              <span class="summary-value">${orderData.totalAmount.toLocaleString()}원</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">진행시간</span>
              <span class="summary-value" id="elapsedTime">${getElapsedTime(orderData.createdAt)}</span>
            </div>
          </div>
        </div>

        <!-- 주문 현황 -->
        <div class="orders-section">
          <!-- TLL 주문 -->
          <div class="order-type-section">
            <div class="section-header">
              <div class="section-title">
                <span class="section-icon">🛒</span>
                <h3>온라인 주문</h3>
                <span class="order-count tll-count">${tllTickets.length}</span>
              </div>
              <span class="section-badge tll-badge">결제완료</span>
            </div>
            <div class="tickets-container">
              ${renderTicketsGrid(tllTickets, 'TLL')}
            </div>
          </div>

          <!-- POS 주문 (조건부 표시) -->
          ${hasAnyPosTickets ? `
            <div class="order-type-section">
              <div class="section-header">
                <div class="section-title">
                  <span class="section-icon">🏪</span>
                  <h3>매장 주문</h3>
                  <span class="order-count pos-count">${posTickets.length}</span>
                </div>
                <span class="section-badge pos-badge">현장주문</span>
              </div>

              ${unpaidPosTickets.length > 0 ? `
                <div class="payment-status-section unpaid">
                  <div class="payment-status-header">
                    <span class="payment-icon">⏳</span>
                    <span>결제 대기</span>
                    <span class="payment-count">${unpaidPosTickets.length}</span>
                  </div>
                  <div class="tickets-container">
                    ${renderTicketsGrid(unpaidPosTickets, 'POS', 'UNPAID')}
                  </div>
                </div>
              ` : ''}

              ${paidPosTickets.length > 0 ? `
                <div class="payment-status-section paid">
                  <div class="payment-status-header">
                    <span class="payment-icon">✅</span>
                    <span>결제 완료</span>
                    <span class="payment-count">${paidPosTickets.length}</span>
                  </div>
                  <div class="tickets-container">
                    ${renderTicketsGrid(paidPosTickets, 'POS', 'PAID')}
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- 결제 내역 -->
        ${orderData.payments.length > 0 ? `
          <div class="payments-section">
            <div class="section-header">
              <div class="section-title">
                <span class="section-icon">💳</span>
                <h3>결제 내역</h3>
                <span class="payment-total">${orderData.totalAmount.toLocaleString()}원</span>
              </div>
            </div>
            <div class="payments-list">
              ${renderPaymentsList(orderData.payments)}
            </div>
          </div>
        ` : ''}

        <!-- 추가 주문 버튼 -->
        <div class="action-section">
          <button id="addOrderBtn" class="add-order-btn">
            <span class="btn-icon">+</span>
            추가 주문하기
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
function renderTicketsGrid(tickets, type, paymentStatus = null) {
  console.log(`🎫 renderTicketsGrid 호출 (${type}, ${paymentStatus}):`, {
    ticketsProvided: !!tickets,
    ticketCount: tickets?.length || 0,
    tickets: tickets
  });

  if (!tickets || tickets.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-text">주문이 없습니다</p>
      </div>
    `;
  }

  return tickets.map((ticket, ticketIndex) => {
    const ticketId = ticket.ticket_id || ticket.id;
    const status = ticket.status || 'PENDING';
    const paidStatus = ticket.paid_status || 'PAID';

    console.log(`🎫 (${type}, ${paymentStatus}) 티켓 ${ticketIndex + 1} 렌더링:`, {
      ticketId: ticketId,
      status: status,
      paidStatus: paidStatus,
      itemsCount: ticket.items?.length || 0,
      rawItems: ticket.items
    });

    const safeItems = Array.isArray(ticket.items) ? ticket.items : [];

    return `
      <div class="ticket-card ${type.toLowerCase()} ${status.toLowerCase()}" 
           data-ticket-id="${ticketId}" 
           data-payment-status="${paidStatus}">
        <div class="ticket-header">
          <div class="ticket-info">
            <span class="ticket-id">#${ticketId}</span>
            <span class="ticket-batch">배치 ${ticket.batch_no || 1}</span>
          </div>
          <div class="ticket-status-group">
            <span class="status-badge ${status.toLowerCase()}">${getTicketStatusText(status)}</span>
            ${type === 'POS' && paymentStatus === 'UNPAID' ? 
              '<span class="payment-badge unpaid">결제대기</span>' : ''}
          </div>
        </div>

        <div class="ticket-items">
          ${renderTicketItems(safeItems)}
        </div>

        <div class="ticket-footer">
          <span class="ticket-time">${formatOrderTime(ticket.created_at)}</span>
          <div class="ticket-actions">
            ${renderTicketActions(ticketId, status, type, paidStatus)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 티켓 아이템 렌더링
function renderTicketItems(items) {
  console.log('🍽️ renderTicketItems 호출:', { items, itemCount: items?.length });

  if (!items || !Array.isArray(items) || items.length === 0) {
    console.warn('⚠️ 아이템 정보가 없거나 유효하지 않음:', items);
    return '<div class="no-items">아이템 정보 없음</div>';
  }

  const displayItems = items.slice(0, 3);
  const remainingCount = items.length - 3;

  return `
    <div class="items-list">
      ${displayItems.map((item, index) => {
        const itemName = item?.menu_name || item?.name || '메뉴';
        const quantity = item?.quantity || 1;

        return `
          <div class="item-row">
            <span class="item-name">${itemName}</span>
            <span class="item-quantity">×${quantity}</span>
          </div>
        `;
      }).join('')}
      ${remainingCount > 0 ? `
        <div class="more-items">+${remainingCount}개 더</div>
      ` : ''}
    </div>
  `;
}

// 티켓 액션 버튼 렌더링
function renderTicketActions(ticketId, status, type, paidStatus = 'PAID') {
  const isPos = type === 'POS';
  const isUnpaid = paidStatus === 'UNPAID';

  switch (status) {
    case 'PENDING':
      if (isPos && isUnpaid) {
        return `<span class="action-info warning">결제 필요</span>`;
      }
      return `<span class="action-info">주문 접수됨</span>`;

    case 'COOKING':
      return `<span class="action-info cooking">조리 중</span>`;

    case 'READY':
      if (isPos && isUnpaid) {
        return `<span class="action-info warning">결제 후 수령</span>`;
      }
      return `<span class="action-info ready">조리 완료</span>`;

    case 'SERVED':
      return `<span class="action-info served">서빙 완료</span>`;

    default:
      return `<span class="action-info">${getTicketStatusText(status)}</span>`;
  }
}

// 결제 내역 렌더링
function renderPaymentsList(payments) {
  if (!payments || payments.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">💳</div>
        <p class="empty-text">결제 내역이 없습니다</p>
      </div>
    `;
  }

  return payments.map(payment => {
    const paymentId = payment.id || payment.payment_id;

    return `
      <div class="payment-item" data-payment-id="${paymentId}">
        <div class="payment-info">
          <div class="payment-method">
            ${getPaymentMethodIcon(payment.method || payment.payment_method)}
            ${payment.method || payment.payment_method || 'CARD'}
          </div>
          <div class="payment-time">${formatOrderTime(payment.created_at || payment.createdAt)}</div>
        </div>
        <div class="payment-amount">
          ${(payment.amount || 0).toLocaleString()}원
        </div>
      </div>
    `;
  }).join('');
}

// 티켓 상태 텍스트 변환
function getTicketStatusText(status) {
  const statusMap = {
    'PENDING': '대기중',
    'COOKING': '조리중',
    'READY': '완료',
    'SERVED': '서빙완료',
    'CANCELLED': '취소됨'
  };
  return statusMap[status] || status;
}

// 이벤트 리스너 설정
function setupEventListeners(orderData) {
  // 뒤로 가기
  document.getElementById('backBtn').addEventListener('click', () => {
    if (window.previousScreen === 'renderNotification') {
      renderNotification();
    } else if (window.previousScreen === 'renderOrderScreen' && window.previousScreenParams) {
      renderProcessingOrder(window.previousScreenParams.orderId);
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
      <h3>식사를 종료하시겠습니까?</h3>
      <p>세션을 종료하면 더 이상 이 화면에 접근할 수 없습니다.</p>
      <div class="modal-actions">
        <button class="btn secondary" onclick="this.closest('.modal-overlay').remove()">
          취소
        </button>
        <button class="btn primary" onclick="endSession(${orderId})">
          종료
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
      document.querySelector('.modal-overlay')?.remove();
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
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <div class="header-info">
          <h1>식사 완료</h1>
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

  document.getElementById('backBtn').addEventListener('click', () => {
    renderMyPage();
  });
}

// 추가 주문 처리
async function addNewOrder(storeId, tableNumber) {
  try {
    console.log(`➕ 추가 주문 요청 - 매장 ID: ${storeId}, 테이블: ${tableNumber}`);

    const storeInfo = await fetchStoreInfo(storeId);
    if (!storeInfo) {
      throw new Error('매장 정보를 조회할 수 없습니다');
    }

    if (typeof renderOrderScreen !== 'function') {
      const script = document.createElement('script');
      script.src = '/TLG/pages/store/renderOrderScreen.js';
      script.async = false;

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      if (typeof renderOrderScreen !== 'function') {
        throw new Error('renderOrderScreen 함수를 로드할 수 없습니다');
      }
    }

    window.previousScreen = 'renderProcessingOrder';
    window.previousScreenParams = { orderId: window.currentOrderId };

    await renderOrderScreen(storeInfo, tableNumber, {
      continuingSession: true,
      previousOrderId: window.currentOrderId
    });

  } catch (error) {
    console.error('❌ 추가 주문 실패:', error);
    alert(`추가 주문 중 오류가 발생했습니다: ${error.message}`);
  }
}

// 매장 정보 조회 함수
async function fetchStoreInfo(storeId) {
  try {
    const response = await fetch(`/api/stores/${storeId}`);

    if (!response.ok) {
      throw new Error(`매장 정보 조회 실패: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.store) {
      throw new Error('매장 정보가 없습니다');
    }

    return {
      id: data.store.id,
      store_id: data.store.id,
      name: data.store.name,
      category: data.store.category,
      address: data.store.address || data.store.full_address,
      menu: data.store.menu || []
    };

  } catch (error) {
    console.error('❌ 매장 정보 조회 실패:', error);
    return null;
  }
}

// 실시간 업데이트 시작
function startRealTimeUpdates(orderId) {
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

  window.addEventListener('beforeunload', () => {
    clearInterval(updateInterval);
  });
}

// 처리 데이터 업데이트
function updateProcessingData(orderData) {
  const elapsedTimeElement = document.getElementById('elapsedTime');
  if (elapsedTimeElement) {
    elapsedTimeElement.textContent = getElapsedTime(orderData.createdAt);
  }

  // 각 섹션별 업데이트 로직 추가 가능
}

// 에러 상태 표시
function showErrorState(message) {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div class="processing-order-container">
      <div class="processing-header">
        <button id="backBtn" class="header-back-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <div class="header-info">
          <h1>오류 발생</h1>
        </div>
      </div>

      <div class="error-content">
        <div class="error-icon">⚠️</div>
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
      /* 기본 컨테이너 */
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
        background: #fafafa;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* 헤더 */
      .processing-header {
        background: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        border-bottom: 1px solid #f0f0f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .header-back-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: #f8f9fa;
        color: #495057;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .header-back-btn:hover {
        background: #e9ecef;
      }

      .header-info {
        flex: 1;
      }

      .header-info h1 {
        margin: 0 0 2px 0;
        font-size: 18px;
        font-weight: 600;
        color: #212529;
      }

      .header-subtitle {
        margin: 0;
        font-size: 14px;
        color: #6c757d;
      }

      .end-session-btn {
        padding: 8px 16px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .end-session-btn:hover {
        background: #c82333;
      }

      /* 콘텐츠 */
      .processing-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* 요약 카드 */
      .summary-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .summary-item {
        text-align: center;
      }

      .summary-label {
        display: block;
        font-size: 12px;
        color: #6c757d;
        margin-bottom: 4px;
      }

      .summary-value {
        display: block;
        font-size: 16px;
        font-weight: 600;
        color: #212529;
      }

      /* 주문 섹션 */
      .orders-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .order-type-section {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .section-header {
        padding: 16px 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-icon {
        font-size: 18px;
      }

      .section-title h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #212529;
      }

      .order-count {
        background: #007bff;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        min-width: 20px;
        text-align: center;
      }

      .tll-count {
        background: #28a745;
      }

      .pos-count {
        background: #fd7e14;
      }

      .section-badge {
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 500;
      }

      .tll-badge {
        background: #d4edda;
        color: #155724;
      }

      .pos-badge {
        background: #ffeaa7;
        color: #856404;
      }

      /* 결제 상태 섹션 */
      .payment-status-section {
        border-top: 1px solid #e9ecef;
      }

      .payment-status-header {
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
      }

      .payment-status-section.unpaid .payment-status-header {
        background: #fff3cd;
        color: #856404;
      }

      .payment-status-section.paid .payment-status-header {
        background: #d1ecf1;
        color: #0c5460;
      }

      .payment-icon {
        font-size: 16px;
      }

      .payment-count {
        margin-left: auto;
        background: rgba(255, 255, 255, 0.8);
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 12px;
      }

      /* 티켓 컨테이너 */
      .tickets-container {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* 티켓 카드 */
      .ticket-card {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 16px;
        transition: all 0.2s ease;
      }

      .ticket-card.tll {
        border-left: 4px solid #28a745;
      }

      .ticket-card.pos {
        border-left: 4px solid #fd7e14;
      }

      .ticket-card.cooking {
        border-left-color: #dc3545;
        background: #fff5f5;
      }

      .ticket-card.ready {
        border-left-color: #28a745;
        background: #f8fff8;
      }

      .ticket-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .ticket-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .ticket-id {
        font-size: 14px;
        font-weight: 600;
        color: #212529;
      }

      .ticket-batch {
        font-size: 12px;
        color: #6c757d;
      }

      .ticket-status-group {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
      }

      .status-badge.pending {
        background: #fff3cd;
        color: #856404;
      }

      .status-badge.cooking {
        background: #f8d7da;
        color: #721c24;
      }

      .status-badge.ready {
        background: #d4edda;
        color: #155724;
      }

      .status-badge.served {
        background: #e2e3e5;
        color: #383d41;
      }

      .payment-badge {
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 500;
      }

      .payment-badge.unpaid {
        background: #fff3cd;
        color: #856404;
      }

      /* 티켓 아이템 */
      .ticket-items {
        margin-bottom: 12px;
      }

      .items-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
      }

      .item-name {
        color: #212529;
        flex: 1;
      }

      .item-quantity {
        color: #6c757d;
        font-weight: 500;
      }

      .more-items {
        font-size: 12px;
        color: #6c757d;
        text-align: center;
        padding: 4px;
        background: #e9ecef;
        border-radius: 4px;
        margin-top: 4px;
      }

      .no-items {
        font-size: 12px;
        color: #6c757d;
        text-align: center;
        padding: 8px;
        background: #e9ecef;
        border-radius: 4px;
      }

      /* 티켓 푸터 */
      .ticket-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .ticket-time {
        font-size: 12px;
        color: #6c757d;
      }

      .ticket-actions {
        display: flex;
        gap: 8px;
      }

      .action-info {
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 500;
      }

      .action-info.warning {
        background: #fff3cd;
        color: #856404;
      }

      .action-info.cooking {
        background: #f8d7da;
        color: #721c24;
      }

      .action-info.ready {
        background: #d4edda;
        color: #155724;
      }

      .action-info.served {
        background: #e2e3e5;
        color: #383d41;
      }

      /* 결제 섹션 */
      .payments-section {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .payment-total {
        font-weight: 600;
        color: #28a745;
      }

      .payments-list {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .payment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .payment-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .payment-method {
        font-size: 14px;
        font-weight: 500;
        color: #212529;
      }

      .payment-time {
        font-size: 12px;
        color: #6c757d;
      }

      .payment-amount {
        font-size: 16px;
        font-weight: 600;
        color: #28a745;
      }

      /* 액션 섹션 */
      .action-section {
        padding: 16px 0;
        text-align: center;
      }

      .add-order-btn {
        width: 100%;
        padding: 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .add-order-btn:hover {
        background: #0056b3;
      }

      .btn-icon {
        font-size: 18px;
        font-weight: 400;
      }

      /* 빈 상태 */
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #6c757d;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      .empty-text {
        font-size: 14px;
        margin: 0;
      }

      /* 로딩 */
      .loading-section {
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
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* 종료 상태 */
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

      .ended-icon,
      .error-icon {
        font-size: 64px;
        margin-bottom: 20px;
      }

      .session-ended-content h2,
      .error-content h2 {
        color: #212529;
        margin-bottom: 12px;
        font-size: 20px;
        font-weight: 600;
      }

      .session-ended-content p,
      .error-content p {
        color: #6c757d;
        margin-bottom: 32px;
        font-size: 14px;
      }

      .ended-actions,
      .error-actions {
        display: flex;
        gap: 12px;
      }

      /* 버튼 */
      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn.primary {
        background: #007bff;
        color: white;
      }

      .btn.primary:hover {
        background: #0056b3;
      }

      .btn.secondary {
        background: #6c757d;
        color: white;
      }

      .btn.secondary:hover {
        background: #545b62;
      }

      /* 모달 */
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
        padding: 24px;
        max-width: 320px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      }

      .modal-content h3 {
        margin: 0 0 12px 0;
        font-size: 18px;
        font-weight: 600;
        color: #212529;
      }

      .modal-content p {
        margin: 0 0 20px 0;
        font-size: 14px;
        color: #6c757d;
      }

      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      /* 반응형 */
      @media (max-width: 480px) {
        .processing-header {
          padding: 12px 16px;
        }

        .processing-content {
          padding: 12px;
        }

        .summary-grid {
          grid-template-columns: repeat(2, 1fr);
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