
// 포스 테이블 상세 정보 패널 UI 모듈

// 테이블 상세 패널 렌더링
async function renderTableDetailPanel(tableNumber) {
  const detailPanel = document.getElementById('detailPanel');
  
  if (!detailPanel) {
    console.error('❌ detailPanel 요소를 찾을 수 없습니다');
    return;
  }

  // 패널 헤더 업데이트
  const panelTitle = document.getElementById('panelTitle');
  if (panelTitle) {
    panelTitle.textContent = `테이블 ${tableNumber}`;
  }

  // 로딩 상태 표시
  const panelContent = document.getElementById('panelContent');
  if (panelContent) {
    panelContent.innerHTML = getLoadingTemplate();
  }

  try {
    // 테이블 데이터 로드
    const tableData = await loadTableDetailData(tableNumber);
    
    // UI 렌더링
    if (panelContent) {
      panelContent.innerHTML = getTableDetailTemplate(tableNumber, tableData);
      
      // 이벤트 리스너 등록
      attachTableDetailEvents(tableNumber);
    }
    
  } catch (error) {
    console.error('❌ 테이블 상세 정보 로드 실패:', error);
    if (panelContent) {
      panelContent.innerHTML = getErrorTemplate();
    }
  }
}

// 테이블 데이터 로드
async function loadTableDetailData(tableNumber) {
  try {
    // 현재 테이블 상태 확인
    const currentTable = window.allTables?.find(t => t.tableNumber == tableNumber);
    
    // 통합 주문 조회
    const allOrdersResponse = await fetch(`/api/pos/stores/${window.currentStore?.id}/table/${tableNumber}/all-orders`);
    const allOrdersData = await allOrdersResponse.json();

    // TLL 주문 정보 조회
    const tllOrderResponse = await fetch(`/api/pos/stores/${window.currentStore?.id}/table/${tableNumber}/orders`);
    const tllOrderData = await tllOrderResponse.json();

    return {
      table: currentTable || { tableNumber, isOccupied: false },
      pendingOrders: allOrdersData.success ? allOrdersData.pendingOrders : [],
      completedOrders: allOrdersData.success ? allOrdersData.completedOrders : [],
      tllOrder: tllOrderData.success ? tllOrderData.tllOrder : null
    };

  } catch (error) {
    console.error('❌ 테이블 데이터 로드 실패:', error);
    throw error;
  }
}

// 로딩 템플릿
function getLoadingTemplate() {
  return `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">테이블 정보를 불러오는 중...</div>
    </div>
  `;
}

// 에러 템플릿
function getErrorTemplate() {
  return `
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <div class="error-text">테이블 정보를 불러오는데 실패했습니다.</div>
      <button class="retry-btn" onclick="renderTableDetailPanel(window.currentTable)">다시 시도</button>
    </div>
  `;
}

// 테이블 상세 정보 템플릿
function getTableDetailTemplate(tableNumber, data) {
  const { table, pendingOrders, completedOrders, tllOrder } = data;
  const isOccupied = table.isOccupied || pendingOrders.length > 0;
  const hasPendingOrders = pendingOrders.length > 0;
  const hasCompletedOrders = completedOrders.length > 0;

  return `
    ${getTableStatusSection(tableNumber, table, isOccupied)}
    ${getTableActionsSection(tableNumber, isOccupied, hasPendingOrders, hasCompletedOrders)}
    ${getTLLInfoSection(tllOrder)}
    ${getPendingOrdersSection(pendingOrders)}
    ${getCompletedOrdersSection(completedOrders)}
    ${getTableDetailStyles()}
  `;
}

// 테이블 상태 섹션
function getTableStatusSection(tableNumber, table, isOccupied) {
  const occupiedTime = table.occupiedSince ? formatTimeSince(table.occupiedSince) : '';
  
  return `
    <div class="table-status-section">
      <div class="status-header">
        <h4>테이블 상태</h4>
        <div class="status-badge ${isOccupied ? 'occupied' : 'available'}">
          ${isOccupied ? '🔴 사용중' : '🟢 이용가능'}
        </div>
      </div>
      
      <div class="status-details">
        <div class="status-row">
          <span class="label">테이블 번호:</span>
          <span class="value">T${tableNumber}</span>
        </div>
        <div class="status-row">
          <span class="label">좌석 수:</span>
          <span class="value">${table.seats || 4}석</span>
        </div>
        ${occupiedTime ? `
          <div class="status-row">
            <span class="label">사용 시간:</span>
            <span class="value timer">${occupiedTime}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// 테이블 액션 섹션
function getTableActionsSection(tableNumber, isOccupied, hasPendingOrders, hasCompletedOrders) {
  return `
    <div class="table-actions-section">
      <h4>테이블 관리</h4>
      <div class="action-buttons">
        <button class="action-btn primary" onclick="openAddOrderModal('${tableNumber}')">
          📦 주문 추가
        </button>
        
        ${isOccupied ? `
          <button class="action-btn warning" onclick="releaseTable('${tableNumber}')">
            🔓 테이블 해제
          </button>
        ` : `
          <button class="action-btn secondary" onclick="occupyTable('${tableNumber}')">
            🔒 테이블 점유
          </button>
        `}
        
        ${hasPendingOrders ? `
          <button class="action-btn success" onclick="openPaymentModal('${tableNumber}')">
            💳 결제 처리
          </button>
        ` : ''}
        
        <button class="action-btn" onclick="moveTableOrders('${tableNumber}')" 
                ${!hasPendingOrders && !hasCompletedOrders ? 'disabled' : ''}>
          🔄 테이블 이동
        </button>
      </div>
    </div>
  `;
}

// TLL 정보 섹션
function getTLLInfoSection(tllOrder) {
  if (!tllOrder) return '';
  
  return `
    <div class="tll-info-section">
      <h4>🔗 TLL 연동 정보</h4>
      <div class="tll-card">
        <div class="customer-info">
          <div class="customer-name">
            👤 ${tllOrder.customerName}
            ${tllOrder.isGuest ? '<span class="guest-badge">게스트</span>' : '<span class="member-badge">회원</span>'}
          </div>
          ${tllOrder.phone ? `
            <div class="customer-phone">📞 ${formatPhoneNumber(tllOrder.phone)}</div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// 미결제 주문 섹션
function getPendingOrdersSection(pendingOrders) {
  if (pendingOrders.length === 0) return '';
  
  return `
    <div class="pending-orders-section">
      <h4>🔄 미결제 주문 (${pendingOrders.length}개)</h4>
      <div class="orders-container">
        ${pendingOrders.map(order => getPendingOrderCard(order)).join('')}
      </div>
    </div>
  `;
}

// 완료된 주문 섹션
function getCompletedOrdersSection(completedOrders) {
  return `
    <div class="completed-orders-section">
      <h4>${completedOrders.length > 0 ? `✅ 완료된 주문 (${completedOrders.length}개)` : '완료된 주문 없음'}</h4>
      <div class="orders-container ${completedOrders.length > 3 ? 'scrollable' : ''}">
        ${completedOrders.length > 0 ? 
          completedOrders.map(order => getCompletedOrderCard(order)).join('') :
          '<div class="no-orders">완료된 주문이 없습니다</div>'
        }
      </div>
    </div>
  `;
}

// 미결제 주문 카드
function getPendingOrderCard(order) {
  const orderData = typeof order.orderData === 'string' ? JSON.parse(order.orderData) : order.orderData;
  const items = orderData?.items || [];
  
  return `
    <div class="order-card pending" data-order-id="${order.id}">
      <div class="order-header">
        <div class="order-info">
          <div class="customer-name">👤 ${order.customerName || '포스 주문'}</div>
          <div class="order-meta">
            <span class="order-time">${formatOrderTime(order.orderDate)}</span>
            <span class="source-badge ${order.orderSource?.toLowerCase() || 'pos'}">${getOrderSourceText(order.orderSource || 'POS')}</span>
          </div>
        </div>
        <div class="order-amount pending">₩${order.finalAmount.toLocaleString()}</div>
      </div>
      
      <div class="order-items">
        ${items.map(item => `
          <div class="menu-item">
            <span class="menu-name">${item.name}</span>
            <span class="menu-quantity">x${item.quantity || 1}</span>
            <span class="menu-price">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="order-actions">
        <span class="status-badge pending">결제 대기</span>
        <button class="btn-small btn-primary" onclick="processOrderPayment('${order.id}')">결제하기</button>
      </div>
    </div>
  `;
}

// 완료된 주문 카드
function getCompletedOrderCard(order) {
  const orderData = typeof order.orderData === 'string' ? JSON.parse(order.orderData) : order.orderData;
  const items = orderData?.items || [];
  
  return `
    <div class="order-card completed" data-order-id="${order.id}">
      <div class="order-header">
        <div class="order-info">
          <div class="customer-name">👤 ${order.customerName}</div>
          <div class="order-meta">
            <span class="order-time">${formatOrderTime(order.orderDate)}</span>
            <span class="source-badge ${order.orderSource?.toLowerCase() || 'pos'}">${getOrderSourceText(order.orderSource || 'POS')}</span>
          </div>
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
              <span class="menu-quantity">x${item.quantity || 1}</span>
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

// 이벤트 리스너 등록
function attachTableDetailEvents(tableNumber) {
  // 주문 항목 토글 이벤트는 인라인으로 처리됨
  console.log(`✅ 테이블 ${tableNumber} 상세 패널 이벤트 리스너 등록 완료`);
}

// 주문 항목 토글
function toggleOrderItems(element) {
  const orderItems = element.closest('.order-items');
  const expandIcon = orderItems.querySelector('.expand-icon');
  
  orderItems.classList.toggle('collapsed');
  expandIcon.textContent = orderItems.classList.contains('collapsed') ? '▼' : '▲';
}

// 시간 포맷팅 함수들
function formatOrderTime(orderDate) {
  const date = new Date(orderDate);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5);
}

function formatTimeSince(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}시간 ${diffMinutes % 60}분`;
}

function formatPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
}

// 주문 소스 텍스트 변환
function getOrderSourceText(source) {
  const sourceMap = {
    'TLL': 'TLL',
    'POS': 'POS',
    'POS_TLL': 'POS+TLL'
  };
  return sourceMap[source] || source;
}

// 액션 함수들
function openAddOrderModal(tableNumber) {
  window.currentTable = tableNumber;
  if (typeof addOrder === 'function') {
    addOrder();
  } else {
    console.log(`주문 추가 모달 열기 - 테이블 ${tableNumber}`);
  }
}

function openPaymentModal(tableNumber) {
  window.currentTable = tableNumber;
  if (typeof processPayment === 'function') {
    processPayment();
  } else {
    console.log(`결제 모달 열기 - 테이블 ${tableNumber}`);
  }
}

function processOrderPayment(orderId) {
  if (typeof processPayment === 'function') {
    processPayment([orderId]);
  } else {
    console.log(`주문 ${orderId} 개별 결제 처리`);
  }
}

function moveTableOrders(tableNumber) {
  console.log(`테이블 ${tableNumber} 주문 이동`);
  showPOSNotification('테이블 이동 기능은 준비중입니다', 'info');
}

// 스타일
function getTableDetailStyles() {
  return `
    <style>
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
      }

      .table-status-section, .table-actions-section, .tll-info-section,
      .pending-orders-section, .completed-orders-section {
        margin-bottom: 20px;
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .status-header, .table-actions-section h4, .tll-info-section h4,
      .pending-orders-section h4, .completed-orders-section h4 {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }

      .status-badge.occupied {
        background: #fef2f2;
        color: #dc2626;
      }

      .status-badge.available {
        background: #f0fdf4;
        color: #16a34a;
      }

      .status-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
      }

      .status-row .label {
        color: #64748b;
        font-weight: 500;
      }

      .status-row .value {
        color: #374151;
        font-weight: 600;
      }

      .status-row .timer {
        color: #7c3aed;
        font-weight: 700;
      }

      .action-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .action-btn {
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: white;
        color: #374151;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .action-btn:hover:not(:disabled) {
        background: #f8fafc;
      }

      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .action-btn.primary {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .action-btn.secondary {
        background: #64748b;
        color: white;
        border-color: #64748b;
      }

      .action-btn.success {
        background: #10b981;
        color: white;
        border-color: #10b981;
      }

      .action-btn.warning {
        background: #f59e0b;
        color: white;
        border-color: #f59e0b;
      }

      .tll-card {
        background: white;
        border: 1px solid #ddd6fe;
        border-radius: 8px;
        padding: 12px;
      }

      .customer-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .customer-name {
        font-weight: 600;
        color: #374151;
      }

      .guest-badge, .member-badge {
        display: inline-block;
        margin-left: 8px;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 600;
      }

      .guest-badge {
        background: #fbbf24;
        color: white;
      }

      .member-badge {
        background: #3b82f6;
        color: white;
      }

      .customer-phone {
        font-size: 12px;
        color: #64748b;
      }

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

      .order-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
        margin-bottom: 8px;
        gap: 12px;
      }

      .order-info {
        flex: 1;
        min-width: 0;
      }

      .customer-name {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 2px;
      }

      .order-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .order-time {
        font-size: 11px;
        color: #64748b;
      }

      .source-badge {
        padding: 2px 4px;
        border-radius: 6px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .source-badge.tll {
        background: #3b82f6;
        color: white;
      }

      .source-badge.pos {
        background: #10b981;
        color: white;
      }

      .order-amount {
        font-size: 14px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 6px;
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

      .order-items {
        margin-bottom: 8px;
        background: #f8fafc;
        border-radius: 6px;
        padding: 8px;
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
      }

      .expand-icon {
        font-size: 10px;
        transition: transform 0.2s;
      }

      .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
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
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        min-width: 20px;
        text-align: center;
        flex-shrink: 0;
      }

      .menu-price {
        color: #059669;
        font-weight: 600;
        font-size: 11px;
        min-width: 50px;
        text-align: right;
        flex-shrink: 0;
      }

      .order-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .status-badge {
        padding: 3px 6px;
        border-radius: 10px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .status-badge.completed {
        background: #dcfce7;
        color: #166534;
      }

      .payment-method {
        font-size: 10px;
        color: #64748b;
      }

      .btn-small {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;
        cursor: pointer;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .no-orders {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 20px;
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 6px;
      }
    </style>
  `;
}

// 전역 함수 등록
window.renderTableDetailPanel = renderTableDetailPanel;
window.toggleOrderItems = toggleOrderItems;
window.openAddOrderModal = openAddOrderModal;
window.openPaymentModal = openPaymentModal;
window.processOrderPayment = processOrderPayment;
window.moveTableOrders = moveTableOrders;

console.log('✅ 테이블 상세 정보 패널 UI 모듈 로드 완료');
