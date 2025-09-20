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

// 티켓 그리드 렌더링 (order_tickets 단위)
function renderTicketsGrid(tickets) {
  console.log('🎫 renderTicketsGrid 호출:', {
    ticketsProvided: !!tickets,
    ticketCount: tickets?.length || 0,
    tickets: tickets
  });
  
  if (!tickets || tickets.length === 0) {
    console.log('🎫 티켓이 없어서 빈 상태 표시');
    return `
      <div class="no-tickets">
        <div class="no-tickets-icon">🍽️</div>
        <p>아직 조리 중인 주문이 없습니다</p>
      </div>
    `;
  }

  return tickets.map((ticket, ticketIndex) => {
    const ticketId = ticket.ticket_id || ticket.id;
    const status = ticket.status || 'PENDING';
    const statusText = getTicketStatusText(status);
    const statusClass = status.toLowerCase();
    
    console.log(`🎫 티켓 ${ticketIndex + 1} 렌더링:`, {
      ticketId: ticketId,
      status: status,
      itemsCount: ticket.items?.length || 0,
      rawItems: ticket.items
    });

    // 아이템 데이터 안전성 확인
    const safeItems = Array.isArray(ticket.items) ? ticket.items : [];
    console.log(`🎫 티켓 ${ticketId} 안전한 아이템:`, safeItems);

    return `
      <div class="ticket-card status-${statusClass}" data-ticket-id="${ticketId}">
        <div class="ticket-header">
          <span class="ticket-id">티켓 #${ticketId}</span>
          <span class="ticket-status ${statusClass}">${statusText}</span>
        </div>
        <div class="ticket-meta">
          <span class="ticket-order">주문 #${ticket.order_id}</span>
          <span class="ticket-batch">배치 ${ticket.batch_no || 1}</span>
        </div>
        <div class="ticket-items">
          ${renderTicketItems(safeItems)}
        </div>
        <div class="ticket-footer">
          <div class="ticket-time">${formatOrderTime(ticket.created_at)}</div>
          <div class="ticket-actions">
            ${renderTicketActions(ticketId, status)}
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
function renderTicketActions(ticketId, status) {
  switch (status) {
    case 'PENDING':
      return `<button class="action-btn start-cooking" onclick="startTicketCooking('${ticketId}')">조리 시작</button>`;
    case 'COOKING':
      return `<button class="action-btn mark-ready" onclick="markTicketReady('${ticketId}')">완료</button>`;
    case 'READY':
      return `<button class="action-btn served" onclick="markTicketServed('${ticketId}')">서빙 완료</button>`;
    default:
      return `<span class="status-text">${getTicketStatusText(status)}</span>`;
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

  // 티켓 그리드 업데이트
  const ticketsGrid = document.getElementById('ticketsGrid');
  if (ticketsGrid) {
    ticketsGrid.innerHTML = renderTicketsGrid(orderData.tickets);
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
  ticketCard.className = `ticket-card status-${status.toLowerCase()}`;

  // 상태 텍스트 업데이트
  const statusElement = ticketCard.querySelector('.ticket-status');
  if (statusElement) {
    statusElement.textContent = getTicketStatusText(status);
    statusElement.className = `ticket-status ${status.toLowerCase()}`;
  }

  // 액션 버튼 업데이트
  const actionsElement = ticketCard.querySelector('.ticket-actions');
  if (actionsElement) {
    actionsElement.innerHTML = renderTicketActions(ticketId, status);
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
        position: relative;
      }

      .ticket-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }

      .ticket-card.status-pending {
        border-left: 4px solid #f39c12;
      }

      .ticket-card.status-cooking {
        border-left: 4px solid #e74c3c;
        background: #fef7f7;
      }

      .ticket-card.status-ready {
        border-left: 4px solid #27ae60;
        background: #f7fef8;
      }

      .ticket-card.status-served {
        border-left: 4px solid #6c757d;
        background: #f8f9fa;
        opacity: 0.7;
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
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        margin-bottom: 12px;
        transition: all 0.2s ease;
      }

      .payment-item:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .payment-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .payment-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .payment-ticket {
        font-size: 12px;
        color: #6366f1;
        font-weight: 600;
        background: #f0f4ff;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
      }

      .payment-details {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
        font-size: 12px;
        color: #64748b;
      }

      .payment-status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }

      .payment-status.status-completed {
        background: #d1fae5;
        color: #059669;
      }

      .payment-status.status-pending {
        background: #fef3c7;
        color: #d97706;
      }

      .payment-status.status-refunded {
        background: #fee2e2;
        color: #dc2626;
      }

      .payment-key {
        font-family: monospace;
        font-size: 10px;
      }

      .payment-actions {
        display: flex;
        gap: 8px;
      }

      .action-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .action-btn.start-cooking {
        background: #3b82f6;
        color: white;
      }

      .action-btn.mark-ready {
        background: #10b981;
        color: white;
      }

      .action-btn.served {
        background: #6b7280;
        color: white;
      }

      .action-btn.receipt {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      }

      .action-btn.refund {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .ticket-meta {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 11px;
        color: #64748b;
      }

      .ticket-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
      }

      .item-station {
        font-size: 10px;
        color: #6366f1;
        background: #f0f4ff;
        padding: 1px 4px;
        border-radius: 3px;
      }

      .no-payments {
        text-align: center;
        padding: 40px 20px;
        color: #9ca3af;
      }

      .no-payments-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .receipt-modal {
        max-width: 400px;
        width: 90%;
      }

      .receipt-content {
        padding: 20px 0;
      }

      .receipt-info p {
        margin: 8px 0;
        padding: 4px 0;
        border-bottom: 1px solid #f3f4f6;
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