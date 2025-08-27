
// 테이블 맵 렌더링 모듈

// 홈 모드 전환
function switchHomeMode(mode) {
  window.homeMode = mode;
  
  // 버튼 활성화 상태 변경
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[onclick="switchHomeMode('${mode}')"]`)?.classList.add('active');

  if (mode === 'table_map') {
    renderTableMap();
  } else if (mode === 'order_list') {
    renderOrderList();
  }
}

// 테이블 맵 렌더링
function renderTableMap() {
  const mainContainer = document.querySelector('.pos-main-content');
  if (!mainContainer) return;

  mainContainer.innerHTML = `
    <div class="table-map-view">
      <!-- 왼쪽 테이블 맵 -->
      <section class="table-map-section">
        <div class="section-header">
          <h3>🗺️ 테이블 맵</h3>
          <button class="refresh-btn" onclick="refreshTableMap()" title="새로고침">
            🔄
          </button>
        </div>
        <div class="table-grid" id="tableGrid">
          ${renderTableItems()}
        </div>
      </section>

      <!-- 오른쪽 세부 패널 -->
      <aside class="detail-panel">
        <div class="panel-header">
          <h3 id="panelTitle">테이블을 선택하세요</h3>
          <button class="close-panel-btn" onclick="closeDetailPanel()" title="패널 닫기">
            ✕
          </button>
        </div>
        <div class="panel-content" id="panelContent">
          <div class="select-table-message">
            테이블을 클릭하여 주문 관리를 시작하세요
          </div>
        </div>
      </aside>
    </div>

    <style>
      .table-map-view {
        display: flex;
        height: 100%;
        gap: 20px;
      }

      .table-map-section {
        flex: 1;
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .section-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .refresh-btn {
        padding: 8px 12px;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .refresh-btn:hover {
        background: #e2e8f0;
      }

      .table-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 16px;
        max-height: calc(100vh - 280px);
        overflow-y: auto;
      }

      .table-item {
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .table-item:hover {
        border-color: #3b82f6;
        background: #f8fafc;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      }

      .table-item.selected {
        border-color: #3b82f6;
        background: #eff6ff;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .table-item.occupied {
        border-color: #ef4444;
        background: #fef2f2;
      }

      .table-item.occupied:hover {
        border-color: #dc2626;
        background: #fee2e2;
      }

      .table-number {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 4px;
      }

      .table-status {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .table-status.available {
        background: #dcfce7;
        color: #166534;
      }

      .table-status.occupied {
        background: #fee2e2;
        color: #dc2626;
      }

      .table-seats {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 10px;
        background: #f1f5f9;
        color: #64748b;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 600;
      }

      .detail-panel {
        width: 350px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 180px);
      }

      .panel-header {
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .panel-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      .close-panel-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #64748b;
        padding: 4px;
        border-radius: 4px;
      }

      .close-panel-btn:hover {
        background: #f1f5f9;
      }

      .panel-content {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
      }

      .select-table-message {
        text-align: center;
        color: #9ca3af;
        font-size: 14px;
        padding: 40px 20px;
        line-height: 1.6;
      }

      .table-status-section {
        margin-bottom: 20px;
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
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
        font-weight: 600;
      }

      .status-indicator.available {
        background: #dcfce7;
        color: #166534;
      }

      .status-indicator.occupied {
        background: #fee2e2;
        color: #dc2626;
      }

      .table-control-actions {
        display: flex;
        gap: 8px;
      }

      .table-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 20px;
      }

      .action-btn {
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .action-btn.primary {
        background: #3b82f6;
        color: white;
      }

      .action-btn.primary:hover {
        background: #2563eb;
      }

      .action-btn.warning {
        background: #f59e0b;
        color: white;
      }

      .action-btn.warning:hover {
        background: #d97706;
      }

      .action-btn.warning:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .action-btn:not(.primary):not(.warning) {
        background: #f1f5f9;
        color: #64748b;
        border: 1px solid #e2e8f0;
      }

      .action-btn:not(.primary):not(.warning):hover {
        background: #e2e8f0;
      }

      .pending-orders-section,
      .completed-orders-section {
        margin-bottom: 20px;
      }

      .pending-orders-section h4,
      .completed-orders-section h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .scrollable-section {
        max-height: 200px;
        overflow-y: auto;
      }

      .order-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
      }

      .order-item.pending-order {
        border-left: 4px solid #f59e0b;
      }

      .order-item.completed-order {
        border-left: 4px solid #10b981;
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .order-info {
        flex: 1;
      }

      .customer-name {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        display: block;
        margin-bottom: 2px;
      }

      .order-time {
        font-size: 11px;
        color: #64748b;
        margin-right: 6px;
      }

      .source-badge {
        font-size: 9px;
        padding: 2px 4px;
        border-radius: 8px;
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
        border-radius: 4px;
      }

      .order-amount.pending {
        background: #fef3c7;
        color: #d97706;
      }

      .order-amount.completed {
        background: #dcfce7;
        color: #166534;
      }

      .order-details {
        margin-bottom: 8px;
      }

      .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 2px 0;
        font-size: 12px;
      }

      .menu-name {
        flex: 1;
        color: #374151;
        font-weight: 500;
      }

      .menu-quantity {
        background: #e2e8f0;
        color: #64748b;
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 600;
        margin: 0 4px;
      }

      .menu-price {
        color: #059669;
        font-weight: 600;
      }

      .order-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .status-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-badge.pending {
        background: #fef3c7;
        color: #d97706;
      }

      .status-badge.completed {
        background: #dcfce7;
        color: #166534;
      }

      .payment-checkbox {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        font-weight: 500;
      }

      .payment-checkbox input[type="checkbox"] {
        width: 12px;
        height: 12px;
      }

      .payment-badge {
        font-size: 10px;
        color: #059669;
        font-weight: 600;
      }

      .no-orders {
        text-align: center;
        color: #9ca3af;
        font-size: 13px;
        padding: 20px;
      }

      .no-items {
        text-align: center;
        color: #9ca3af;
        font-size: 11px;
        padding: 8px;
      }
    </style>
  `;
}

// 테이블 아이템들 렌더링
function renderTableItems() {
  if (!window.allTables || window.allTables.length === 0) {
    return '<div class="no-tables">테이블 정보가 없습니다</div>';
  }

  return window.allTables.map(table => `
    <div class="table-item ${table.isOccupied ? 'occupied' : 'available'}" 
         onclick="selectTable(${table.tableNumber})" 
         data-table="${table.tableNumber}">
      <div class="table-seats">${table.seats || 4}석</div>
      <div class="table-number">테이블 ${table.tableNumber}</div>
      <div class="table-status ${table.isOccupied ? 'occupied' : 'available'}">
        ${table.isOccupied ? '사용중' : '이용가능'}
      </div>
    </div>
  `).join('');
}

// 주문 목록 렌더링 (향후 확장용)
function renderOrderList() {
  const mainContainer = document.querySelector('.pos-main-content');
  if (!mainContainer) return;

  mainContainer.innerHTML = `
    <div class="order-list-view">
      <div class="order-list-header">
        <h3>📋 주문 목록</h3>
        <div class="order-filters">
          <button class="filter-btn active" data-filter="all">전체</button>
          <button class="filter-btn" data-filter="pending">대기중</button>
          <button class="filter-btn" data-filter="completed">완료</button>
        </div>
      </div>
      <div class="order-list-content">
        <div class="coming-soon">
          주문 목록 기능 개발 예정
        </div>
      </div>
    </div>

    <style>
      .order-list-view {
        background: white;
        border-radius: 12px;
        padding: 20px;
        height: 100%;
      }

      .order-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .order-list-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .order-filters {
        display: flex;
        gap: 8px;
      }

      .filter-btn {
        padding: 6px 12px;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .filter-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .coming-soon {
        text-align: center;
        color: #9ca3af;
        font-size: 16px;
        padding: 60px 20px;
      }
    </style>
  `;
}

// 테이블 선택
function selectTable(tableNumber) {
  // 기존 선택 해제
  document.querySelectorAll('.table-item').forEach(item => {
    item.classList.remove('selected');
  });

  // 새 테이블 선택
  const tableItem = document.querySelector(`[data-table="${tableNumber}"]`);
  if (tableItem) {
    tableItem.classList.add('selected');
  }

  window.currentTable = tableNumber;
  window.updateDetailPanel(tableNumber);
}

// 테이블 점유/해제
async function occupyTable(tableNumber) {
  try {
    const response = await fetch(`/api/tables/occupy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: window.currentStore.id,
        tableNumber: parseInt(tableNumber),
        source: 'POS'
      })
    });

    const result = await response.json();
    if (result.success) {
      showPOSNotification(`테이블 ${tableNumber}이 점유되었습니다.`, 'success');
      await refreshTableMap();
      if (window.currentTable) {
        window.updateDetailPanel(window.currentTable);
      }
    } else {
      alert('테이블 점유 실패: ' + result.error);
    }
  } catch (error) {
    console.error('테이블 점유 실패:', error);
    alert('테이블 점유 중 오류가 발생했습니다.');
  }
}

async function releaseTable(tableNumber) {
  try {
    const response = await fetch(`/api/tables/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: window.currentStore.id,
        tableNumber: parseInt(tableNumber),
        source: 'POS'
      })
    });

    const result = await response.json();
    if (result.success) {
      showPOSNotification(`테이블 ${tableNumber}이 해제되었습니다.`, 'success');
      await refreshTableMap();
      if (window.currentTable) {
        window.updateDetailPanel(window.currentTable);
      }
    } else {
      alert('테이블 해제 실패: ' + result.error);
    }
  } catch (error) {
    console.error('테이블 해제 실패:', error);
    alert('테이블 해제 중 오류가 발생했습니다.');
  }
}

// 전역 함수 등록
window.switchHomeMode = switchHomeMode;
window.renderTableMap = renderTableMap;
window.renderOrderList = renderOrderList;
window.renderTableItems = renderTableItems;
window.selectTable = selectTable;
window.occupyTable = occupyTable;
window.releaseTable = releaseTable;
