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

        <!-- 실시간 주문 현황 -->
        <div class="order-status-section">
          <!-- TLL 주문 섹션 (항상 표시) -->
          <div class="order-subsection tll-subsection">
            <div class="subsection-header">
              <div class="subsection-title">
                <span class="status-icon">✅</span>
                <h4>온라인 주문 (TLL)</h4>
                <span class="order-type-badge tll-badge">결제완료</span>
              </div>
              <div class="subsection-status">총 ${tllTickets.length}건</div>
            </div>
            <div id="tllTicketsGrid" class="tickets-grid tll-grid">
              ${renderTicketsGrid(tllTickets, 'TLL')}
            </div>
          </div>

          <!-- POS 주문 섹션 (POS 주문이 있을 때만 표시) -->
          ${hasAnyPosTickets ? `
            <div class="order-subsection pos-subsection">
              <div class="subsection-header">
                <div class="subsection-title">
                  <span class="status-icon">🛒</span>
                  <h4>매장 주문 (POS)</h4>
                  <span class="order-type-badge pos-badge">현장주문</span>
                </div>
                <div class="subsection-status">총 ${posTickets.length}건</div>
              </div>

              <!-- 미결제 POS 주문 -->
              ${unpaidPosTickets.length > 0 ? `
                <div class="pos-payment-section unpaid-section">
                  <div class="payment-status-header">
                    <span class="payment-status-icon">⏳</span>
                    <h5>결제 대기 중</h5>
                    <span class="payment-count">${unpaidPosTickets.length}건</span>
                  </div>
                  <div class="tickets-grid pos-unpaid-grid">
                    ${renderTicketsGrid(unpaidPosTickets, 'POS', 'UNPAID')}
                  </div>
                </div>
              ` : ''}

              <!-- 결제완료 POS 주문 -->
              ${paidPosTickets.length > 0 ? `
                <div class="pos-payment-section paid-section">
                  <div class="payment-status-header">
                    <span class="payment-status-icon">💳</span>
                    <h5>결제 완료</h5>
                    <span class="payment-count">${paidPosTickets.length}건</span>
                  </div>
                  <div class="tickets-grid pos-paid-grid">
                    ${renderTicketsGrid(paidPosTickets, 'POS', 'PAID')}
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}
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

// 티켓 그리드 렌더링 (order_tickets 단위)
// type 인자를 추가하여 POS/TLL 구분, paymentStatus 추가
function renderTicketsGrid(tickets, type, paymentStatus = null) {
  console.log(`🎫 renderTicketsGrid 호출 (${type}, ${paymentStatus}):`, {
    ticketsProvided: !!tickets,
    ticketCount: tickets?.length || 0,
    tickets: tickets
  });

  if (!tickets || tickets.length === 0) {
    const emptyMessage = type === 'TLL' ? 
      '온라인 주문이 없습니다' : 
      paymentStatus === 'UNPAID' ? '결제 대기 중인 주문이 없습니다' : '결제 완료된 주문이 없습니다';
    
    console.log(`🎫 (${type}) 티켓이 없어서 빈 상태 표시`);
    return `
      <div class="no-tickets ${type.toLowerCase()}-empty">
        <div class="no-tickets-icon">🍽️</div>
        <p>${emptyMessage}</p>
      </div>
    `;
  }

  return tickets.map((ticket, ticketIndex) => {
    const ticketId = ticket.ticket_id || ticket.id;
    const status = ticket.status || 'PENDING';
    const statusText = getTicketStatusText(status);
    const statusClass = status.toLowerCase();
    const paidStatus = ticket.paid_status || 'PAID';
    
    // 카드 클래스 조합
    let ticketTypeClass = type ? `${type.toLowerCase()}-card` : '';
    if (type === 'POS' && paymentStatus) {
      ticketTypeClass += ` pos-${paymentStatus.toLowerCase()}`;
    }

    console.log(`🎫 (${type}, ${paymentStatus}) 티켓 ${ticketIndex + 1} 렌더링:`, {
      ticketId: ticketId,
      status: status,
      paidStatus: paidStatus,
      itemsCount: ticket.items?.length || 0,
      rawItems: ticket.items
    });

    // 아이템 데이터 안전성 확인
    const safeItems = Array.isArray(ticket.items) ? ticket.items : [];
    console.log(`🎫 (${type}) 티켓 ${ticketId} 안전한 아이템:`, safeItems);

    return `
      <div class="ticket-card ${ticketTypeClass} status-${statusClass}" data-ticket-id="${ticketId}" data-payment-status="${paidStatus}">
        <div class="ticket-header">
          <span class="ticket-id">티켓 #${ticketId}</span>
          <div class="ticket-status-group">
            <span class="ticket-status ${statusClass}">${statusText}</span>
            ${type === 'POS' ? `<span class="payment-status ${paidStatus.toLowerCase()}">${getPaymentStatusText(paidStatus)}</span>` : ''}
          </div>
        </div>
        <div class="ticket-meta">
          <span class="ticket-order">주문 #${ticket.order_id}</span>
          <span class="ticket-batch">배치 ${ticket.batch_no || 1}</span>
          ${type === 'TLL' ? '<span class="ticket-source tll-source">온라인주문</span>' : '<span class="ticket-source pos-source">매장주문</span>'}
        </div>
        <div class="ticket-items">
          ${renderTicketItems(safeItems)}
        </div>
        <div class="ticket-footer">
          <div class="ticket-time">${formatOrderTime(ticket.created_at)}</div>
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

  console.log('🍽️ 표시할 아이템들:', { displayItems, remainingCount });

  return `
    ${displayItems.map((item, index) => {
      const itemName = item?.menu_name || item?.name || '메뉴';
      const quantity = item?.quantity || 1;
      const cookStation = item?.cook_station || 'KITCHEN';

      console.log(`🍽️ 아이템 ${index + 1}:`, { itemName, quantity, cookStation });

      return `
        <div class="ticket-item">
          <span class="item-name">${itemName}</span>
          <span class="item-quantity">×${quantity}</span>
          <span class="item-station">[${cookStation}]</span>
        </div>
      `;
    }).join('')}
    ${remainingCount > 0 ? `<div class="more-items">+${remainingCount}개 더</div>` : ''}
  `;
}

// 티켓 액션 버튼 렌더링
function renderTicketActions(ticketId, status, type, paidStatus = 'PAID') {
  const isPos = type === 'POS';
  const isTll = type === 'TLL';
  const isUnpaid = paidStatus === 'UNPAID';

  // 고객 관점에서는 직접 조작할 수 있는 액션이 제한적
  // 주로 상태 확인 및 문의 기능 제공
  
  switch (status) {
    case 'PENDING':
      if (isTll) {
        return `<span class="status-info">🕐 주문 접수됨</span>`;
      }
      if (isPos && isUnpaid) {
        return `<span class="status-info payment-required">💳 결제 필요</span>`;
      }
      if (isPos) {
        return `<span class="status-info">🕐 조리 대기 중</span>`;
      }
      return `<span class="status-info">🕐 주문 접수됨</span>`;
      
    case 'COOKING':
      if (isTll) {
        return `<span class="status-info cooking">🔥 조리 중</span>`;
      }
      if (isPos) {
        return `<span class="status-info cooking">🔥 조리 중</span>`;
      }
      return `<span class="status-info cooking">🔥 조리 중</span>`;
      
    case 'READY':
      if (isTll) {
        return `<span class="status-info ready">✅ 조리 완료</span>`;
      }
      if (isPos && isUnpaid) {
        return `<span class="status-info payment-required">💳 결제 후 수령</span>`;
      }
      if (isPos) {
        return `<span class="status-info ready">✅ 수령 가능</span>`;
      }
      return `<span class="status-info ready">✅ 조리 완료</span>`;
      
    case 'SERVED':
      return `<span class="status-info served">🎉 서빙 완료</span>`;
      
    default:
      return `<span class="status-info">${getTicketStatusText(status)}</span>`;
  }
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

// 결제 내역 렌더링 (payments.ticket_id 단위)
function renderPaymentsList(payments) {
  if (!payments || payments.length === 0) {
    return `
      <div class="no-payments">
        <div class="no-payments-icon">💳</div>
        <p>결제 내역이 없습니다</p>
      </div>
    `;
  }

  return payments.map(payment => {
    const ticketId = payment.ticket_id;
    const paymentId = payment.id || payment.payment_id;

    return `
      <div class="payment-item" data-payment-id="${paymentId}" data-ticket-id="${ticketId}">
        <div class="payment-header">
          <div class="payment-info">
            <div class="payment-method">
              ${getPaymentMethodIcon(payment.method || payment.payment_method)}
              ${payment.method || payment.payment_method || 'CARD'}
            </div>
            ${ticketId ? `<div class="payment-ticket">티켓 #${ticketId}</div>` : ''}
          </div>
          <div class="payment-amount">
            ${(payment.amount || 0).toLocaleString()}원
          </div>
        </div>
        <div class="payment-details">
          <div class="payment-time">${formatOrderTime(payment.created_at || payment.createdAt)}</div>
          <div class="payment-status status-${(payment.status || 'completed').toLowerCase()}">
            ${getPaymentStatusText(payment.status || 'completed')}
          </div>
          ${payment.payment_key ? `<div class="payment-key">결제키: ${payment.payment_key.slice(-8)}</div>` : ''}
        </div>
        <div class="payment-actions">
          <button class="action-btn receipt" onclick="viewPaymentReceipt('${paymentId}')">
            📄 영수증
          </button>
          ${payment.status === 'completed' ? `
            <button class="action-btn refund" onclick="requestRefund('${paymentId}')">
              🔄 환불
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// 결제 상태 텍스트 변환
function getPaymentStatusText(status) {
  const statusMap = {
    'PAID': '결제완료',
    'UNPAID': '결제대기',
    'completed': '완료',
    'pending': '대기중',
    'failed': '실패',
    'cancelled': '취소',
    'refunded': '환불완료'
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
      // 추가 주문에서 돌아온 경우 다시 처리 중인 주문 화면으로
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
    console.log(`➕ 추가 주문 요청 - 매장 ID: ${storeId}, 테이블: ${tableNumber}`);

    // 매장 정보 조회
    const storeInfo = await fetchStoreInfo(storeId);
    if (!storeInfo) {
      throw new Error('매장 정보를 조회할 수 없습니다');
    }

    console.log('🏪 매장 정보 조회 성공:', storeInfo.name);

    // renderOrderScreen 스크립트 로드 확인
    if (typeof renderOrderScreen !== 'function') {
      console.log('🔄 renderOrderScreen 스크립트 로드 시도...');

      try {
        const script = document.createElement('script');
        script.src = '/TLG/pages/store/renderOrderScreen.js';
        script.async = false;

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        // 로드 후 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100));

        if (typeof renderOrderScreen !== 'function') {
          throw new Error('renderOrderScreen 함수를 로드할 수 없습니다');
        }

        console.log('✅ renderOrderScreen 스크립트 로드 완료');

      } catch (scriptError) {
        console.error('❌ renderOrderScreen 스크립트 로드 실패:', scriptError);
        throw new Error('주문 화면을 로드할 수 없습니다');
      }
    }

    // 이전 화면 정보 저장 (처리 중인 주문 화면으로 돌아오기 위해)
    window.previousScreen = 'renderProcessingOrder';
    window.previousScreenParams = { orderId: window.currentOrderId };

    // renderOrderScreen으로 이동 (기존 세션 유지)
    console.log('🔄 주문 화면으로 이동 중...');
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
      store_id: data.store.id, // 호환성
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

  // POS와 TLL 주문 분리
  const posTickets = orderData.tickets.filter(ticket => ticket.source === 'POS');
  const tllTickets = orderData.tickets.filter(ticket => ticket.source === 'TLL');
  
  // POS 주문을 결제 상태별로 구분
  const unpaidPosTickets = posTickets.filter(ticket => ticket.paid_status === 'UNPAID');
  const paidPosTickets = posTickets.filter(ticket => ticket.paid_status === 'PAID');

  // TLL 티켓 그리드 업데이트
  const tllTicketsGrid = document.getElementById('tllTicketsGrid');
  if (tllTicketsGrid) {
    tllTicketsGrid.innerHTML = renderTicketsGrid(tllTickets, 'TLL');
  }

  // POS 미결제 티켓 그리드 업데이트
  const posUnpaidGrid = document.querySelector('.pos-unpaid-grid');
  if (posUnpaidGrid) {
    posUnpaidGrid.innerHTML = renderTicketsGrid(unpaidPosTickets, 'POS', 'UNPAID');
  }

  // POS 결제완료 티켓 그리드 업데이트
  const posPaidGrid = document.querySelector('.pos-paid-grid');
  if (posPaidGrid) {
    posPaidGrid.innerHTML = renderTicketsGrid(paidPosTickets, 'POS', 'PAID');
  }
}

// 티켓 액션 함수들
async function startTicketCooking(ticketId) {
  try {
    const response = await fetch(`/api/orders/tickets/${ticketId}/start-cooking`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      // UI 즉시 업데이트
      updateTicketCard(ticketId, 'COOKING');
      showSuccess('조리를 시작했습니다');
    } else {
      throw new Error(result.error || '조리 시작 실패');
    }
  } catch (error) {
    console.error('❌ 조리 시작 실패:', error);
    showError('조리 시작 중 오류가 발생했습니다');
  }
}

async function markTicketReady(ticketId) {
  try {
    const response = await fetch(`/api/orders/tickets/${ticketId}/ready`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      updateTicketCard(ticketId, 'READY');
      showSuccess('조리가 완료되었습니다');
    } else {
      throw new Error(result.error || '완료 처리 실패');
    }
  } catch (error) {
    console.error('❌ 완료 처리 실패:', error);
    showError('완료 처리 중 오류가 발생했습니다');
  }
}

async function markTicketServed(ticketId) {
  try {
    const response = await fetch(`/api/orders/tickets/${ticketId}/served`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      removeTicketCard(ticketId);
      showSuccess('서빙이 완료되었습니다');
    } else {
      throw new Error(result.error || '서빙 처리 실패');
    }
  } catch (error) {
    console.error('❌ 서빙 처리 실패:', error);
    showError('서빙 처리 중 오류가 발생했습니다');
  }
}

// 결제 액션 함수들
async function viewPaymentReceipt(paymentId) {
  try {
    const response = await fetch(`/api/payments/${paymentId}/receipt`);
    const result = await response.json();

    if (result.success) {
      // 영수증 모달 표시
      showReceiptModal(result.receipt);
    } else {
      throw new Error(result.error || '영수증 조회 실패');
    }
  } catch (error) {
    console.error('❌ 영수증 조회 실패:', error);
    showError('영수증을 조회할 수 없습니다');
  }
}

async function requestRefund(paymentId) {
  if (!confirm('정말로 환불을 진행하시겠습니까?')) return;

  try {
    const response = await fetch(`/api/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      updatePaymentCard(paymentId, 'refunded');
      showSuccess('환불이 요청되었습니다');
    } else {
      throw new Error(result.error || '환불 요청 실패');
    }
  } catch (error) {
    console.error('❌ 환불 요청 실패:', error);
    showError('환불 요청 중 오류가 발생했습니다');
  }
}

// UI 업데이트 함수들
function updateTicketCard(ticketId, status) {
  const ticketCard = document.querySelector(`[data-ticket-id="${ticketId}"]`);
  if (!ticketCard) return;

  // 상태 클래스 업데이트
  ticketCard.className = `ticket-card ${ticketCard.classList.contains('pos-card') ? 'pos-card' : ''} ${ticketCard.classList.contains('tll-card') ? 'tll-card' : ''} status-${status.toLowerCase()}`;


  // 상태 텍스트 업데이트
  const statusElement = ticketCard.querySelector('.ticket-status');
  if (statusElement) {
    statusElement.textContent = getTicketStatusText(status);
    statusElement.className = `ticket-status ${status.toLowerCase()}`;
  }

  // 액션 버튼 업데이트
  const actionsElement = ticketCard.querySelector('.ticket-actions');
  if (actionsElement) {
    // 현재 티켓의 타입을 알아내서 renderTicketActions에 전달해야 함
    const isPosCard = ticketCard.classList.contains('pos-card');
    const type = isPosCard ? 'POS' : 'TLL';
    actionsElement.innerHTML = renderTicketActions(ticketId, status, type);
  }
}


function removeTicketCard(ticketId) {
  const ticketCard = document.querySelector(`[data-ticket-id="${ticketId}"]`);
  if (ticketCard) {
    ticketCard.style.transition = 'all 0.3s ease';
    ticketCard.style.transform = 'scale(0.8)';
    ticketCard.style.opacity = '0';

    setTimeout(() => {
      ticketCard.remove();

      // 빈 상태 체크
      const ticketsGrid = document.getElementById('ticketsGrid');
      if (ticketsGrid && ticketsGrid.children.length === 0) {
        ticketsGrid.innerHTML = `
          <div class="no-tickets">
            <div class="no-tickets-icon">🍽️</div>
            <p>아직 조리 중인 주문이 없습니다</p>
          </div>
        `;
      }
    }, 300);
  }
}

function updatePaymentCard(paymentId, status) {
  const paymentCard = document.querySelector(`[data-payment-id="${paymentId}"]`);
  if (!paymentCard) return;

  const statusElement = paymentCard.querySelector('.payment-status');
  if (statusElement) {
    statusElement.textContent = getPaymentStatusText(status);
    statusElement.className = `payment-status status-${status.toLowerCase()}`;
  }
}

// 영수증 모달 표시
function showReceiptModal(receipt) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content receipt-modal">
      <div class="modal-header">
        <h3>📄 결제 영수증</h3>
        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="receipt-content">
        <div class="receipt-info">
          <p><strong>결제 ID:</strong> ${receipt.payment_id}</p>
          <p><strong>결제 방법:</strong> ${receipt.method}</p>
          <p><strong>결제 금액:</strong> ${receipt.amount.toLocaleString()}원</p>
          <p><strong>결제 시간:</strong> ${formatOrderTime(receipt.created_at)}</p>
          ${receipt.ticket_id ? `<p><strong>티켓 ID:</strong> ${receipt.ticket_id}</p>` : ''}
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn secondary" onclick="this.closest('.modal-overlay').remove()">
          닫기
        </button>
        <button class="btn primary" onclick="printReceipt('${receipt.payment_id}')">
          🖨️ 인쇄
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// 알림 함수들
function showSuccess(message) {
  // 간단한 성공 알림 (추후 토스트로 개선 가능)
  console.log('✅', message);
  alert(message);
}

function showError(message) {
  // 간단한 오류 알림 (추후 토스트로 개선 가능)
  console.error('❌', message);
  alert(message);
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
      /* 전체 컨테이너 */
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
        background: #f8fafc;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* 헤더 */
      .processing-header {
        height: 70px;
        background: #ffffff;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        border-bottom: 1px solid #f1f5f9;
        flex-shrink: 0;
        z-index: 100;
      }

      .header-back-btn {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        border: none;
        background: #f8fafc;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .header-back-btn:hover {
        background: #e2e8f0;
        color: #475569;
      }

      .header-info {
        flex: 1;
        min-width: 0;
      }

      .header-info h1 {
        margin: 0 0 2px 0;
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .header-subtitle {
        margin: 0;
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .header-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .end-session-btn {
        padding: 8px 14px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
      }

      .end-session-btn:hover {
        background: #dc2626;
        transform: translateY(-1px);
      }

      /* 컨텐츠 */
      .processing-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* 공통 섹션 */
      .order-summary-section,
      .order-status-section,
      .payments-section {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        border: 1px solid #f1f5f9;
      }

      /* 요약 섹션 */
      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .summary-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
      }

      .order-status {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-open { background: #dbeafe; color: #1e40af; }
      .status-cooking { background: #fed7aa; color: #c2410c; }
      .status-ready { background: #bbf7d0; color: #15803d; }
      .status-done { background: #e0e7ff; color: #6366f1; }
      .status-closed { background: #f3f4f6; color: #6b7280; }

      .summary-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .stat-item {
        text-align: center;
        padding: 16px 12px;
        background: #f8fafc;
        border-radius: 10px;
        border: 1px solid #f1f5f9;
      }

      .stat-label {
        display: block;
        font-size: 11px;
        color: #64748b;
        margin-bottom: 6px;
        font-weight: 500;
      }

      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
      }

      /* 주문 현황 섹션 */
      .order-status-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .order-subsection {
        background: #fcfcfd;
        border-radius: 10px;
        padding: 16px;
        border: 1px solid #e2e8f0;
      }

      .tll-subsection {
        border-left: 3px solid #10b981;
        background: linear-gradient(135deg, #f0fdf4 0%, #f0fdf9 100%);
      }

      .pos-subsection {
        border-left: 3px solid #f59e0b;
        background: linear-gradient(135deg, #fffbeb 0%, #fefce8 100%);
      }

      .subsection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 1px solid #f1f5f9;
      }

      .subsection-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .subsection-title h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
      }

      .status-icon {
        font-size: 16px;
      }

      .order-type-badge {
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .tll-badge {
        background: #dcfce7;
        color: #166534;
      }

      .pos-badge {
        background: #fef3c7;
        color: #92400e;
      }

      .subsection-status {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
      }

      /* POS 결제 섹션 */
      .pos-payment-section {
        margin-bottom: 16px;
      }

      .pos-payment-section:last-child {
        margin-bottom: 0;
      }

      .payment-status-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        padding: 10px 14px;
        border-radius: 8px;
        font-weight: 600;
      }

      .unpaid-section .payment-status-header {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
      }

      .paid-section .payment-status-header {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
      }

      .payment-status-icon {
        font-size: 14px;
      }

      .payment-status-header h5 {
        margin: 0;
        font-size: 13px;
      }

      .payment-count {
        margin-left: auto;
        background: rgba(255, 255, 255, 0.9);
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
      }

      /* 티켓 그리드 */
      .tickets-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .ticket-card {
        background: white;
        border-radius: 10px;
        padding: 14px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }

      .ticket-card:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      /* 티켓 타입별 스타일 */
      .ticket-card.pos-card {
        border-left: 3px solid #f59e0b;
        background: linear-gradient(135deg, #fffbeb 0%, white 100%);
      }

      .ticket-card.tll-card {
        border-left: 3px solid #10b981;
        background: linear-gradient(135deg, #f0fdf4 0%, white 100%);
      }

      /* 상태별 스타일 */
      .ticket-card.status-cooking {
        border-left-color: #ef4444;
        box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.1);
      }

      .ticket-card.status-ready {
        border-left-color: #22c55e;
        box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.1);
      }

      .ticket-card.pos-unpaid.status-ready {
        animation: payment-attention 3s ease-in-out infinite;
      }

      @keyframes payment-attention {
        0%, 100% { 
          box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.1);
        }
        50% { 
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
        }
      }

      /* 티켓 헤더 */
      .ticket-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }

      .ticket-id {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
      }

      .ticket-status-group {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .ticket-status {
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .ticket-status.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .ticket-status.cooking {
        background: #fee2e2;
        color: #dc2626;
      }

      .ticket-status.ready {
        background: #dcfce7;
        color: #166534;
      }

      .ticket-status.served {
        background: #f3f4f6;
        color: #6b7280;
      }

      /* 결제 상태 배지 */
      .payment-status {
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .payment-status.paid {
        background: #dcfce7;
        color: #166534;
      }

      .payment-status.unpaid {
        background: #fef3c7;
        color: #92400e;
      }

      /* 티켓 메타 정보 */
      .ticket-meta {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
        font-size: 10px;
        color: #64748b;
        flex-wrap: wrap;
      }

      .ticket-order,
      .ticket-batch {
        padding: 2px 6px;
        background: #f8fafc;
        border-radius: 4px;
        font-weight: 500;
      }

      .ticket-source {
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }

      .tll-source {
        background: #dbeafe;
        color: #1e40af;
      }

      .pos-source {
        background: #fef3c7;
        color: #92400e;
      }

      /* 티켓 아이템 */
      .ticket-items {
        margin-bottom: 12px;
      }

      .ticket-item {
        display: flex;
        justify-content: between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f8fafc;
        gap: 8px;
      }

      .ticket-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .item-name {
        flex: 1;
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
        line-height: 1.3;
      }

      .item-quantity {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        margin-right: 4px;
      }

      .item-station {
        font-size: 9px;
        color: #6366f1;
        background: #f0f4ff;
        padding: 2px 5px;
        border-radius: 4px;
        font-weight: 600;
      }

      .no-items {
        color: #9ca3af;
        font-size: 12px;
        text-align: center;
        padding: 8px;
        font-style: italic;
      }

      .more-items {
        color: #64748b;
        font-size: 11px;
        text-align: center;
        padding: 4px;
        font-weight: 500;
      }

      /* 티켓 푸터 */
      .ticket-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
      }

      .ticket-time {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
      }

      /* 상태 정보 */
      .status-info {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        display: inline-block;
      }

      .status-info.cooking {
        background: #fee2e2;
        color: #dc2626;
      }

      .status-info.ready {
        background: #dcfce7;
        color: #166534;
      }

      .status-info.served {
        background: #f3f4f6;
        color: #6b7280;
      }

      .status-info.payment-required {
        background: #fef3c7;
        color: #92400e;
        animation: payment-pulse 2s ease-in-out infinite;
      }

      @keyframes payment-pulse {
        0%, 100% {
          background: #fef3c7;
        }
        50% {
          background: #fde68a;
        }
      }

      /* 빈 상태 */
      .no-tickets {
        text-align: center;
        padding: 32px 16px;
        color: #9ca3af;
      }

      .no-tickets-icon {
        font-size: 40px;
        margin-bottom: 8px;
        opacity: 0.6;
      }

      .no-tickets p {
        font-size: 13px;
        margin: 0;
        font-weight: 500;
      }

      .pos-empty {
        border: 2px dashed #fbbf24;
        background: #fffbeb;
        border-radius: 8px;
      }

      .tll-empty {
        border: 2px dashed #34d399;
        background: #f0fdf4;
        border-radius: 8px;
      }

      /* 결제 내역 섹션 */
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }

      .section-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
      }

      .payment-summary {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .payments-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .payment-item {
        background: #f8fafc;
        border-radius: 8px;
        padding: 14px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
      }

      .payment-item:hover {
        border-color: #cbd5e1;
      }

      .payment-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .payment-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .payment-method {
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .payment-ticket {
        font-size: 10px;
        color: #6366f1;
        font-weight: 600;
        background: #f0f4ff;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
      }

      .payment-details {
        display: flex;
        gap: 10px;
        margin-bottom: 8px;
        font-size: 11px;
        color: #64748b;
        flex-wrap: wrap;
      }

      .payment-time {
        font-weight: 500;
      }

      .payment-key {
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 10px;
        color: #6b7280;
      }

      .payment-amount {
        font-size: 15px;
        font-weight: 700;
        color: #059669;
      }

      .payment-actions {
        display: flex;
        gap: 6px;
      }

      .action-btn {
        padding: 5px 10px;
        border: none;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .action-btn.receipt {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #e5e7eb;
      }

      .action-btn.refund {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .action-btn:hover {
        transform: translateY(-1px);
      }

      .no-payments {
        text-align: center;
        padding: 32px 16px;
        color: #9ca3af;
      }

      .no-payments-icon {
        font-size: 40px;
        margin-bottom: 8px;
        opacity: 0.6;
      }

      .no-payments p {
        font-size: 13px;
        margin: 0;
        font-weight: 500;
      }

      /* 추가 주문 섹션 */
      .add-order-section {
        display: flex;
        justify-content: center;
        padding: 16px 0 8px 0;
      }

      .add-order-btn {
        padding: 14px 28px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
      }

      .add-order-btn:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
      }

      /* 로딩, 종료, 에러 상태 */
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
        width: 32px;
        height: 32px;
        border: 3px solid #e2e8f0;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .ended-icon,
      .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.8;
      }

      .session-ended-content h2,
      .error-content h2 {
        color: #0f172a;
        margin-bottom: 8px;
        font-size: 20px;
        font-weight: 700;
      }

      .session-ended-content p,
      .error-content p {
        color: #64748b;
        margin-bottom: 24px;
        font-size: 14px;
        line-height: 1.5;
      }

      .ended-actions,
      .error-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .btn {
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 100px;
      }

      .btn.primary {
        background: #3b82f6;
        color: white;
      }

      .btn.primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }

      .btn.secondary {
        background: #f8fafc;
        color: #64748b;
        border: 1px solid #e2e8f0;
      }

      .btn.secondary:hover {
        background: #f1f5f9;
        color: #475569;
      }

      /* 모달 */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
      }

      .modal-content {
        background: white;
        border-radius: 16px;
        padding: 28px;
        max-width: 380px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid #f1f5f9;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .close-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: #f8fafc;
        border-radius: 8px;
        cursor: pointer;
        color: #64748b;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .close-btn:hover {
        background: #f1f5f9;
        color: #475569;
      }

      .modal-content h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
      }

      .modal-content p {
        margin: 0 0 20px 0;
        font-size: 14px;
        color: #64748b;
        line-height: 1.5;
      }

      .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
      }

      .receipt-modal {
        max-width: 400px;
      }

      .receipt-content {
        padding: 16px 0;
        text-align: left;
      }

      .receipt-info p {
        margin: 6px 0;
        padding: 6px 0;
        border-bottom: 1px solid #f8fafc;
        font-size: 13px;
        display: flex;
        justify-content: space-between;
      }

      .receipt-info strong {
        color: #0f172a;
        font-weight: 600;
      }

      /* 반응형 */
      @media (max-width: 480px) {
        .processing-header {
          padding: 12px 16px;
          height: 64px;
        }

        .processing-content {
          padding: 12px;
          gap: 12px;
        }

        .summary-stats {
          grid-template-columns: 1fr 1fr;
        }

        .stat-item:nth-child(3) {
          grid-column: 1 / -1;
        }

        .ended-actions,
        .error-actions {
          flex-direction: column;
        }

        .btn {
          width: 100%;
        }

        .modal-content {
          padding: 20px;
          margin: 16px;
        }
      }

      /* 스크롤바 커스텀 */
      .processing-content::-webkit-scrollbar {
        width: 4px;
      }

      .processing-content::-webkit-scrollbar-track {
        background: transparent;
      }

      .processing-content::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }

      .processing-content::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    </style>
  `;
}

// 전역으로 함수 노출
window.renderProcessingOrder = renderProcessingOrder;