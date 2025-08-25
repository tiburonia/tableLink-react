
// 세부 패널 관리 모듈

// 세부 패널 업데이트
async function updateDetailPanel(tableNumber) {
  const panelTitle = document.getElementById('panelTitle');
  const panelContent = document.getElementById('panelContent');

  panelTitle.textContent = `테이블 ${tableNumber}`;

  // 로딩 상태 표시
  panelContent.innerHTML = `
    <div class="loading-message">
      테이블 정보를 불러오는 중...
    </div>
  `;

  try {
    // 현재 테이블 상태 확인
    const currentTable = window.allTables.find(t => t.tableNumber == tableNumber);
    const isOccupied = currentTable ? currentTable.isOccupied : false;

    // 통합 주문 조회 (메모리 + DB)
    const allOrdersResponse = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${tableNumber}/all-orders`);
    const allOrdersData = await allOrdersResponse.json();

    let pendingOrder = null;
    let completedOrders = [];

    if (allOrdersData.success) {
      pendingOrder = allOrdersData.pendingOrder;
      completedOrders = allOrdersData.completedOrders || [];
      console.log(`📊 테이블 ${tableNumber} 주문 조회: 미결제 ${pendingOrder ? 1 : 0}개, 완료 ${completedOrders.length}개`);
    }

    panelContent.innerHTML = `
      <div class="table-status-section">
        <div class="table-status-header">
          <h4>테이블 상태</h4>
          <div class="status-indicator ${isOccupied || pendingOrder ? 'occupied' : 'available'}">
            ${isOccupied || pendingOrder ? '🔴 사용중' : '🟢 이용가능'}
          </div>
        </div>

        <div class="table-control-actions">
          ${isOccupied ? 
            `<button class="action-btn warning" onclick="releaseTable('${tableNumber}')">
              테이블 해제
            </button>` :
            `<button class="action-btn primary" onclick="occupyTable('${tableNumber}')">
              테이블 점유
            </button>`
          }
        </div>
      </div>

      <div class="table-actions">
        <button class="action-btn primary" onclick="addOrder()">주문 추가</button>
        <button class="action-btn" onclick="viewOrders()">주문 내역</button>
        <button class="action-btn" onclick="moveTable()">테이블 이동</button>
        <button class="action-btn warning" onclick="processPayment()" ${!pendingOrder && completedOrders.length === 0 ? 'disabled' : ''}>결제 처리</button>
      </div>

      <!-- 미결제 주문 -->
      ${pendingOrder ? `
        <div class="pending-orders-section">
          <h4>🔄 미결제 주문 (결제 대기중)</h4>
          <div class="pending-order-card">
            <div class="order-item pending-order">
              <div class="order-header">
                <div class="order-info">
                  <span class="customer-name">👤 ${pendingOrder.customerName || '포스 주문'}</span>
                  <span class="order-time">${formatOrderTime(pendingOrder.createdAt)}</span>
                  ${pendingOrder.isTLLOrder ? '<span class="tll-badge">TLL 연동</span>' : '<span class="pos-badge">POS</span>'}
                </div>
                <div class="order-amount pending">₩${pendingOrder.totalAmount.toLocaleString()}</div>
              </div>

              <div class="order-details">
                ${pendingOrder.items.map(item => `
                  <div class="menu-item">
                    <span class="menu-name">${item.name}</span>
                    <span class="menu-quantity">x${item.quantity || 1}</span>
                    <span class="menu-price">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                  </div>
                `).join('')}
              </div>

              <div class="order-status">
                <span class="status-badge pending">결제 대기</span>
                <button class="btn btn-small btn-warning" onclick="processPayment()">결제하기</button>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- 완료된 주문 -->
      <div class="completed-orders-section">
        <h4>${completedOrders.length > 0 ? `✅ 완료된 주문 (${completedOrders.length}개)` : '주문 없음'}</h4>
        <div class="order-items scrollable-section">
          ${completedOrders.length > 0 ? 
            completedOrders.map(order => `
              <div class="order-item completed-order">
                <div class="order-header">
                  <div class="order-info">
                    <span class="customer-name">👤 ${order.customerName}</span>
                    <span class="order-time">${formatOrderTime(order.orderDate)}</span>
                    <span class="source-badge ${order.orderSource?.toLowerCase() || 'pos'}">${getOrderSourceText(order.orderSource || 'POS')}</span>
                  </div>
                  <div class="order-amount completed">₩${order.finalAmount.toLocaleString()}</div>
                </div>

                <div class="order-details">
                  ${order.orderData && order.orderData.items ? 
                    order.orderData.items.map(item => `
                      <div class="menu-item">
                        <span class="menu-name">${item.name}</span>
                        <span class="menu-quantity">x${item.quantity || 1}</span>
                        <span class="menu-price">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                      </div>
                    `).join('') : 
                    '<div class="no-items">주문 상세 정보 없음</div>'
                  }
                </div>

                <div class="order-status">
                  <span class="status-badge completed">결제 완료</span>
                  <span class="payment-badge">💳 ${order.paymentStatus === 'completed' ? '결제됨' : '미결제'}</span>
                </div>
              </div>
            `).join('') :
            (!pendingOrder ? `<div class="no-orders">테이블이 비어있습니다</div>` : '')
          }
        </div>
      </div>

      ${getDetailPanelStyles()}
    `;

  } catch (error) {
    console.error('❌ 테이블 정보 로드 실패:', error);
    panelContent.innerHTML = `
      <div class="error-message">
        테이블 정보를 불러오는데 실패했습니다.
      </div>
    `;
  }
}

// 시간 포맷팅 함수
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

// 주문 소스 텍스트 변환
function getOrderSourceText(source) {
  const sourceMap = {
    'TLL': 'TLL 주문',
    'POS': 'POS 주문',
    'POS_TLL': 'POS+TLL'
  };
  return sourceMap[source] || source;
}

// detail panel 스타일
function getDetailPanelStyles() {
  return `
    <style>
      .table-status-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .table-status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .table-status-header h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .status-indicator {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-indicator.occupied {
        background: #fef2f2;
        color: #dc2626;
      }

      .status-indicator.available {
        background: #f0fdf4;
        color: #16a34a;
      }

      .table-control-actions {
        display: flex;
        gap: 8px;
      }

      .table-actions {
        margin-bottom: 16px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .pending-orders-section, .completed-orders-section {
        margin-bottom: 20px;
      }

      .pending-orders-section h4 {
        color: #d97706;
        background: #fef3c7;
        padding: 8px 12px;
        border-radius: 6px;
        margin-bottom: 12px;
        border: 1px solid #fed7aa;
      }

      .completed-orders-section h4 {
        color: #059669;
        background: #ecfdf5;
        padding: 8px 12px;
        border-radius: 6px;
        margin-bottom: 12px;
        border: 1px solid #bbf7d0;
      }

      .scrollable-section {
        max-height: 300px;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .scrollable-section::-webkit-scrollbar {
        width: 6px;
      }

      .scrollable-section::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }

      .scrollable-section::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      .scrollable-section::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      .order-item {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 12px;
      }

      .order-info {
        flex: 1;
        min-width: 0;
      }

      .customer-name {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 4px;
        display: block;
      }

      .order-time {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .order-amount {
        font-size: 16px;
        font-weight: 800;
        padding: 6px 10px;
        border-radius: 6px;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .order-amount.pending {
        color: #d97706;
        background: #fef3c7;
        border: 1px solid #fed7aa;
      }

      .order-amount.completed {
        color: #059669;
        background: #ecfdf5;
        border: 1px solid #bbf7d0;
      }

      .order-details {
        background: #f8fafc;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
      }

      .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        font-size: 13px;
        border-bottom: 1px solid #f1f5f9;
        gap: 8px;
      }

      .menu-item:last-child {
        border-bottom: none;
      }

      .menu-name {
        flex: 1;
        color: #374151;
        font-weight: 600;
        min-width: 0;
        word-break: break-word;
      }

      .menu-quantity {
        color: #6b7280;
        background: #e2e8f0;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        min-width: 24px;
        text-align: center;
        flex-shrink: 0;
      }

      .menu-price {
        color: #059669;
        font-weight: 700;
        font-size: 13px;
        min-width: 60px;
        text-align: right;
        flex-shrink: 0;
      }

      .order-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
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

      .btn-small {
        padding: 4px 8px;
        font-size: 11px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
      }

      .btn-warning {
        background: #f59e0b;
        color: white;
      }

      .tll-badge, .pos-badge, .source-badge {
        font-size: 9px;
        padding: 2px 4px;
        border-radius: 8px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-left: 6px;
      }

      .tll-badge {
        background: #3b82f6;
        color: white;
      }

      .pos-badge {
        background: #10b981;
        color: white;
      }

      .source-badge.tll {
        background: #3b82f6;
        color: white;
      }

      .source-badge.pos {
        background: #10b981;
        color: white;
      }

      .payment-badge {
        font-size: 9px;
        background: #f3f4f6;
        color: #374151;
        padding: 2px 4px;
        border-radius: 8px;
        margin-left: 6px;
      }

      .no-orders, .no-items {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 24px;
        background: #f8fafc;
        border-radius: 8px;
        border: 2px dashed #cbd5e1;
        margin: 12px 0;
      }

      .loading-message, .error-message {
        text-align: center;
        color: #64748b;
        padding: 32px 20px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        font-size: 14px;
      }

      .error-message {
        color: #dc2626;
        background: #fef2f2;
        border-color: #fecaca;
      }
    </style>
  `;
}

// 전역 함수 등록
window.updateDetailPanel = updateDetailPanel;
window.formatOrderTime = formatOrderTime;
window.getOrderSourceText = getOrderSourceText;
