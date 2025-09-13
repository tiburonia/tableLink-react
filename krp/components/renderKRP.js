
// KRP 주방 영수증 프린터 시뮬레이터 (출력 전용)
let krpSocket = null;
let currentStoreId = null;
let printQueue = [];
let selectedOrder = null;

// KRP 시스템 초기화
async function renderKRP(storeId) {
  try {
    console.log(`🖨️ KRP 시스템 초기화 - 매장 ID: ${storeId}`);

    currentStoreId = storeId;

    // 매장 정보 조회
    const storeResponse = await fetch(`/api/stores/${storeId}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!storeResponse.ok) {
      throw new Error('매장 정보 조회 실패');
    }

    const storeData = await storeResponse.json();

    if (!storeData.success || !storeData.store) {
      throw new Error('매장 정보를 찾을 수 없습니다');
    }

    const store = storeData.store;
    console.log('✅ KRP 매장 정보 로드 완료:', store.name);

    // KRP 화면 렌더링
    renderKRPInterface(store);

    // 출력 대기 목록 로딩
    await loadPrintQueue(storeId);

    // WebSocket 연결 설정
    setupKRPWebSocket(storeId);

  } catch (error) {
    console.error('❌ KRP 시스템 초기화 실패:', error);
    renderKRPError();
  }
}

// KRP 인터페이스 렌더링
function renderKRPInterface(store) {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div class="krp-system">
      <!-- 상단 헤더 -->
      <header class="krp-header">
        <div class="header-left">
          <div class="store-info">
            <h1 class="store-name">🖨️ ${store.name} - 주방 프린터</h1>
            <div class="current-time" id="currentTime">2024.01.27 22:31:45</div>
          </div>
        </div>

        <div class="header-center">
          <div class="print-status">
            <div class="status-item">
              <div class="status-count" id="queueCount">0</div>
              <div class="status-label">출력 대기</div>
            </div>
            <div class="status-item">
              <div class="status-count" id="printedCount">0</div>
              <div class="status-label">출력완료</div>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="connection-status">
            <div class="sync-indicator" id="syncIndicator"></div>
            <span id="syncTime">연결 중...</span>
          </div>
          <button class="refresh-btn" onclick="refreshPrintQueue()">🔄</button>
          <button class="test-btn" onclick="testPrint()">🧪</button>
        </div>
      </header>

      <!-- 메인 컨텐츠 -->
      <main class="krp-main">
        <!-- 출력 대기 목록 -->
        <section class="queue-section">
          <div class="section-header">
            <h2>📋 출력 대기 목록</h2>
            <div class="queue-controls">
              <button class="auto-print-btn" id="autoPrintBtn" onclick="toggleAutoPrint()">
                🔄 자동출력 OFF
              </button>
            </div>
          </div>
          <div class="print-queue" id="printQueue">
            <!-- 출력 대기 주문들이 여기에 렌더링됩니다 -->
          </div>
        </section>

        <!-- 주문서 프리뷰 -->
        <section class="preview-section">
          <div class="section-header">
            <h2>📄 주문서 프리뷰</h2>
            <div class="preview-controls">
              <button class="print-complete-btn" id="printCompleteBtn" onclick="completePrint()" disabled>
                ✅ 출력 완료
              </button>
              <button class="reprint-btn" id="reprintBtn" onclick="reprintOrder()" disabled>
                🔄 재출력
              </button>
            </div>
          </div>
          <div class="receipt-preview" id="receiptPreview">
            <div class="no-selection">
              <div class="no-selection-icon">📄</div>
              <p>출력할 주문을 선택하세요</p>
            </div>
          </div>
        </section>
      </main>

      <!-- 로딩 오버레이 -->
      <div class="loading-overlay" id="loadingOverlay" style="display: none;">
        <div class="loading-spinner"></div>
        <div class="loading-text">데이터 로딩 중...</div>
      </div>
    </div>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: #f8fafc;
        color: #1a202c;
        overflow-x: hidden;
      }

      .krp-system {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      /* 헤더 스타일 */
      .krp-header {
        background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
        color: white;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 20px rgba(230, 126, 34, 0.3);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .store-name {
        font-size: 24px;
        font-weight: 800;
        margin-bottom: 4px;
      }

      .current-time {
        font-size: 14px;
        opacity: 0.9;
        font-weight: 500;
      }

      .print-status {
        display: flex;
        gap: 32px;
      }

      .status-item {
        text-align: center;
      }

      .status-count {
        font-size: 28px;
        font-weight: 800;
        line-height: 1;
      }

      .status-label {
        font-size: 12px;
        opacity: 0.9;
        margin-top: 4px;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .connection-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }

      .sync-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        animation: pulse 2s infinite;
      }

      .sync-indicator.inactive {
        background: #ef4444;
        animation: none;
      }

      .refresh-btn, .test-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
      }

      .refresh-btn:hover, .test-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* 메인 컨텐츠 */
      .krp-main {
        flex: 1;
        padding: 24px;
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 24px;
        min-height: calc(100vh - 80px);
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .section-header h2 {
        font-size: 18px;
        font-weight: 700;
        color: #1a202c;
      }

      .queue-controls {
        display: flex;
        gap: 12px;
      }

      .auto-print-btn {
        background: #6b7280;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .auto-print-btn.active {
        background: #10b981;
      }

      .preview-controls {
        display: flex;
        gap: 12px;
      }

      .print-complete-btn, .reprint-btn {
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .print-complete-btn {
        background: #10b981;
        color: white;
      }

      .print-complete-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .reprint-btn {
        background: #3b82f6;
        color: white;
      }

      .reprint-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      /* 출력 대기 목록 */
      .print-queue {
        max-height: calc(100vh - 200px);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .queue-item {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .queue-item:hover {
        border-color: #e67e22;
        transform: translateY(-1px);
      }

      .queue-item.selected {
        border-color: #e67e22;
        background: #fef7ed;
      }

      .queue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .order-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .order-number {
        font-size: 16px;
        font-weight: 800;
        color: #e67e22;
      }

      .order-table {
        font-size: 14px;
        font-weight: 600;
        color: #1a202c;
      }

      .order-time {
        font-size: 12px;
        color: #64748b;
      }

      .order-items {
        font-size: 13px;
        color: #64748b;
        line-height: 1.4;
      }

      .order-total {
        font-size: 14px;
        font-weight: 700;
        color: #1a202c;
        margin-top: 8px;
      }

      /* 주문서 프리뷰 */
      .receipt-preview {
        background: white;
        border: 2px dashed #64748b;
        border-radius: 12px;
        padding: 20px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.6;
        max-height: calc(100vh - 200px);
        overflow-y: auto;
      }

      .no-selection {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
      }

      .no-selection-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .receipt-header {
        text-align: center;
        margin-bottom: 16px;
        border-bottom: 1px dashed #64748b;
        padding-bottom: 12px;
      }

      .receipt-title {
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 8px;
      }

      .receipt-store {
        font-size: 14px;
        margin-bottom: 4px;
      }

      .receipt-order-info {
        margin: 16px 0;
        border-bottom: 1px dashed #64748b;
        padding-bottom: 12px;
      }

      .receipt-items {
        margin: 16px 0;
      }

      .receipt-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding: 4px 0;
      }

      .item-left {
        flex: 1;
      }

      .item-name {
        font-weight: bold;
        margin-bottom: 2px;
      }

      .item-details {
        font-size: 12px;
        color: #64748b;
      }

      .item-price {
        font-weight: bold;
        text-align: right;
      }

      .receipt-total {
        border-top: 2px solid #1a202c;
        padding-top: 12px;
        margin-top: 16px;
        text-align: right;
      }

      .total-amount {
        font-size: 18px;
        font-weight: bold;
      }

      .receipt-footer {
        border-top: 1px dashed #64748b;
        padding-top: 12px;
        margin-top: 16px;
        text-align: center;
        font-size: 12px;
        color: #64748b;
      }

      /* 로딩 오버레이 */
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top: 4px solid #e67e22;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }

      .loading-text {
        font-size: 16px;
        color: #64748b;
        font-weight: 600;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* 반응형 디자인 */
      @media (max-width: 1024px) {
        .krp-main {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }

      @media (max-width: 768px) {
        .krp-header {
          flex-direction: column;
          gap: 16px;
          padding: 16px;
        }

        .print-status {
          gap: 16px;
        }
      }
    </style>
  `;

  // 시간 업데이트 시작
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
}

// 시간 업데이트
function updateCurrentTime() {
  const timeElement = document.getElementById('currentTime');
  if (timeElement) {
    const now = new Date();
    const timeString = now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    timeElement.textContent = timeString;
  }
}

// 출력 대기 목록 로딩
async function loadPrintQueue(storeId) {
  try {
    console.log(`📋 출력 대기 목록 로딩 - 매장 ${storeId}`);

    showLoading(true);

    const response = await fetch(`/api/krp?storeId=${storeId}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error('출력 대기 목록 조회 실패');
    }

    const data = await response.json();

    if (data.success) {
      printQueue = data.orders || [];
      renderPrintQueue();
      updateQueueCounts();
      console.log(`✅ 출력 대기 목록 로딩 완료: ${printQueue.length}개`);
    } else {
      throw new Error(data.error || '출력 대기 목록 조회 실패');
    }

  } catch (error) {
    console.error('❌ 출력 대기 목록 로딩 실패:', error);
    showNotification('출력 대기 목록을 불러올 수 없습니다', 'error');
  } finally {
    showLoading(false);
  }
}

// 출력 대기 목록 렌더링
function renderPrintQueue() {
  const queueElement = document.getElementById('printQueue');
  if (!queueElement) return;

  if (printQueue.length === 0) {
    queueElement.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #64748b;">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <h3>출력 대기 중인 주문이 없습니다</h3>
        <p>새로운 주문이 들어오면 여기에 표시됩니다</p>
      </div>
    `;
    return;
  }

  const queueHTML = printQueue.map(order => {
    const orderTime = new Date(order.created_at);
    const timeString = orderTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsText = order.items.slice(0, 3).map(item => 
      `${item.quantity}x ${item.menuName}`
    ).join(', ');

    const moreItems = order.items.length > 3 ? ` 외 ${order.items.length - 3}개` : '';

    return `
      <div class="queue-item ${selectedOrder?.ticket_id === order.ticket_id ? 'selected' : ''}" 
           onclick="selectOrder(${order.ticket_id})">
        <div class="queue-header">
          <div class="order-info">
            <div class="order-number">#${order.ticket_id}</div>
            <div class="order-table">테이블 ${order.table_number}</div>
          </div>
          <div class="order-time">${timeString}</div>
        </div>
        <div class="order-items">${itemsText}${moreItems}</div>
        <div class="order-total">합계: ${order.total_amount.toLocaleString()}원</div>
      </div>
    `;
  }).join('');

  queueElement.innerHTML = queueHTML;
}

// 주문 선택
function selectOrder(ticketId) {
  selectedOrder = printQueue.find(order => order.ticket_id === ticketId);
  
  if (!selectedOrder) return;

  console.log(`📄 주문 선택: 티켓 ${ticketId}`);

  // 대기 목록에서 선택 표시
  renderPrintQueue();

  // 프리뷰 렌더링
  renderReceiptPreview(selectedOrder);

  // 버튼 활성화
  document.getElementById('printCompleteBtn').disabled = false;
  document.getElementById('reprintBtn').disabled = false;
}

// 주문서 프리뷰 렌더링
function renderReceiptPreview(order) {
  const previewElement = document.getElementById('receiptPreview');
  if (!previewElement) return;

  const orderTime = new Date(order.created_at);
  const timeString = orderTime.toLocaleString('ko-KR');

  const itemsHTML = order.items.map(item => `
    <div class="receipt-item">
      <div class="item-left">
        <div class="item-name">${item.quantity}x ${item.menuName}</div>
        ${item.options && Object.keys(item.options).length > 0 ? 
          `<div class="item-details">${JSON.stringify(item.options)}</div>` : ''}
      </div>
      <div class="item-price">${item.totalPrice.toLocaleString()}원</div>
    </div>
  `).join('');

  previewElement.innerHTML = `
    <div class="receipt-header">
      <div class="receipt-title">🍴 주방 주문서</div>
      <div class="receipt-store">TableLink Kitchen</div>
    </div>

    <div class="receipt-order-info">
      <strong>주문번호: #${order.ticket_id}</strong><br>
      <strong>테이블: ${order.table_number}</strong><br>
      고객: ${order.customer_name}<br>
      ${timeString}
    </div>

    <div class="receipt-items">
      ${itemsHTML}
    </div>

    <div class="receipt-total">
      <div class="total-amount">합계: ${order.total_amount.toLocaleString()}원</div>
    </div>

    <div class="receipt-footer">
      주방에서 조리를 시작하세요<br>
      TableLink KRP System
    </div>
  `;
}

// 출력 완료 처리
async function completePrint() {
  if (!selectedOrder) return;

  try {
    console.log(`✅ 출력 완료 처리: 티켓 ${selectedOrder.ticket_id}`);

    const response = await fetch('/api/krp/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: currentStoreId,
        orderId: selectedOrder.order_id,
        ticketId: selectedOrder.ticket_id
      })
    });

    const result = await response.json();

    if (result.success) {
      // 대기 목록에서 제거
      printQueue = printQueue.filter(order => order.ticket_id !== selectedOrder.ticket_id);
      
      // 선택 초기화
      selectedOrder = null;

      // UI 업데이트
      renderPrintQueue();
      updateQueueCounts();

      // 프리뷰 초기화
      document.getElementById('receiptPreview').innerHTML = `
        <div class="no-selection">
          <div class="no-selection-icon">📄</div>
          <p>출력할 주문을 선택하세요</p>
        </div>
      `;

      // 버튼 비활성화
      document.getElementById('printCompleteBtn').disabled = true;
      document.getElementById('reprintBtn').disabled = true;

      showNotification(`주문 #${result.order.ticket_id} 출력이 완료되었습니다`, 'success');

    } else {
      throw new Error(result.error || '출력 완료 처리 실패');
    }

  } catch (error) {
    console.error('❌ 출력 완료 처리 실패:', error);
    showNotification('출력 완료 처리에 실패했습니다', 'error');
  }
}

// 재출력 처리
async function reprintOrder() {
  if (!selectedOrder) return;

  try {
    console.log(`🔄 재출력 처리: 티켓 ${selectedOrder.ticket_id}`);

    const response = await fetch(`/api/krp/reprint/${selectedOrder.ticket_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: currentStoreId
      })
    });

    const result = await response.json();

    if (result.success) {
      showNotification(`주문 #${selectedOrder.ticket_id} 재출력이 요청되었습니다`, 'info');
      
      // 대기 목록 새로고침
      await loadPrintQueue(currentStoreId);

    } else {
      throw new Error(result.error || '재출력 요청 실패');
    }

  } catch (error) {
    console.error('❌ 재출력 처리 실패:', error);
    showNotification('재출력 요청에 실패했습니다', 'error');
  }
}

// 자동 출력 토글
let autoPrintEnabled = false;
function toggleAutoPrint() {
  autoPrintEnabled = !autoPrintEnabled;
  const btn = document.getElementById('autoPrintBtn');
  
  if (btn) {
    btn.textContent = autoPrintEnabled ? '🔄 자동출력 ON' : '🔄 자동출력 OFF';
    btn.classList.toggle('active', autoPrintEnabled);
  }

  console.log(`🔄 자동 출력 모드: ${autoPrintEnabled ? 'ON' : 'OFF'}`);
  showNotification(`자동 출력 모드가 ${autoPrintEnabled ? '활성화' : '비활성화'}되었습니다`, 'info');
}

// 대기 목록 카운트 업데이트
function updateQueueCounts() {
  const queueCountElement = document.getElementById('queueCount');
  const printedCountElement = document.getElementById('printedCount');

  if (queueCountElement) {
    queueCountElement.textContent = printQueue.length;
  }

  // 출력 완료 카운트는 간단하게 처리 (실제로는 DB에서 조회)
  if (printedCountElement && !window.krpPrintedCount) {
    window.krpPrintedCount = 0;
  }
}

// 테스트 출력
function testPrint() {
  const testOrder = {
    order_id: 'TEST-' + Date.now(),
    ticket_id: 'TEST-' + Date.now(),
    table_number: '테스트',
    customer_name: '테스트 고객',
    total_amount: 25000,
    created_at: new Date().toISOString(),
    items: [
      { menuName: '김치찌개', quantity: 2, totalPrice: 16000, options: {} },
      { menuName: '공기밥', quantity: 1, totalPrice: 2000, options: {} },
      { menuName: '계란말이', quantity: 1, totalPrice: 7000, options: {} }
    ]
  };

  selectedOrder = testOrder;
  renderReceiptPreview(testOrder);
  
  document.getElementById('printCompleteBtn').disabled = false;
  document.getElementById('reprintBtn').disabled = true;

  showNotification('테스트 주문서가 로드되었습니다', 'info');
}

// 대기 목록 새로고침
async function refreshPrintQueue() {
  if (currentStoreId) {
    await loadPrintQueue(currentStoreId);
    showNotification('출력 대기 목록을 새로고침했습니다', 'info');
  }
}

// KRP WebSocket 설정
function setupKRPWebSocket(storeId) {
  try {
    console.log(`🔌 KRP WebSocket 연결 시작 - 매장 ${storeId}`);

    krpSocket = io({
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    krpSocket.on('connect', () => {
      console.log('✅ KRP WebSocket 연결 성공:', krpSocket.id);
      krpSocket.emit('join-krp-room', parseInt(storeId));
      updateConnectionStatus(true);
      showNotification('🔌 KRP 실시간 연결 활성화', 'success');
    });

    krpSocket.on('disconnect', (reason) => {
      console.log('❌ KRP WebSocket 연결 해제:', reason);
      updateConnectionStatus(false);
    });

    // 새 출력 요청 수신
    krpSocket.on('krp-print-request', (data) => {
      console.log('🖨️ 새 출력 요청 수신:', data);
      
      if (autoPrintEnabled) {
        // 자동 출력 모드인 경우 즉시 처리
        console.log('🔄 자동 출력 모드 - 즉시 처리');
      }
      
      // 대기 목록 새로고침
      loadPrintQueue(currentStoreId);
      showNotification(`새 출력 요청: 테이블 ${data.table_number}`, 'info');
    });

    // 출력 완료 알림 수신
    krpSocket.on('krp-print-completed', (data) => {
      console.log('✅ 출력 완료 알림 수신:', data);
      
      if (data.action === 'remove_from_queue') {
        // 다른 클라이언트에서 출력 완료한 경우 대기 목록에서 제거
        printQueue = printQueue.filter(order => order.ticket_id !== data.ticket_id);
        renderPrintQueue();
        updateQueueCounts();
      }
    });

    krpSocket.on('connect_error', (error) => {
      console.error('❌ KRP WebSocket 연결 에러:', error);
      updateConnectionStatus(false);
    });

  } catch (error) {
    console.error('❌ KRP WebSocket 설정 실패:', error);
    updateConnectionStatus(false);
  }
}

// 연결 상태 업데이트
function updateConnectionStatus(isConnected) {
  const syncIndicator = document.getElementById('syncIndicator');
  const syncTime = document.getElementById('syncTime');

  if (syncIndicator && syncTime) {
    if (isConnected) {
      syncIndicator.className = 'sync-indicator';
      syncTime.textContent = '실시간 연결됨';
    } else {
      syncIndicator.className = 'sync-indicator inactive';
      syncTime.textContent = '연결 끊김';
    }
  }
}

// 로딩 표시
function showLoading(show) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
  }
}

// 알림 표시
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `krp-notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-weight: 600;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// KRP 에러 화면 렌더링
function renderKRPError() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div style="padding: 40px; text-align: center; color: #ef4444;">
      <h2>❌ KRP 시스템 오류</h2>
      <p>KRP 시스템을 초기화할 수 없습니다.</p>
      <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
        다시 시도
      </button>
      <button onclick="history.back()" style="margin-top: 20px; margin-left: 10px; padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer;">
        돌아가기
      </button>
    </div>
  `;
}

// 전역 함수 등록
window.renderKRP = renderKRP;
window.selectOrder = selectOrder;
window.completePrint = completePrint;
window.reprintOrder = reprintOrder;
window.toggleAutoPrint = toggleAutoPrint;
window.testPrint = testPrint;
window.refreshPrintQueue = refreshPrintQueue;

console.log('✅ KRP 시스템 로드 완료 - 출력 전용 모드');
