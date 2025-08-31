// KRP 주방 프린터 시뮬레이터
let krpSocket = null;
let currentStoreId = null;
let currentOrders = [];

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

    // 주문 데이터 로딩
    await loadKRPOrders(storeId);

    // WebSocket 연결 설정
    setupKRPWebSocket(storeId);

  } catch (error) {
    console.error('❌ KRP 시스템 초기화 실패:', error);
    renderKRPError();
  }
}

// KRP 컴포넌트 렌더링
function renderKRPComponent() {
  console.log('🖨️ KRP 컴포넌트 렌더링 시작');

  return `
    <div class="krp-container">
      <div class="krp-header">
        <h1>🍳 주방 주문서 출력기 (Kitchen Receipt Printer)</h1>
        <div class="store-info">
          <span class="store-name">매장: ${window.currentStore?.name || '선택된 매장 없음'}</span>
          <span class="store-id">ID: ${window.selectedStoreId || '?'}</span>
          <div class="connection-status">
            <span id="krpConnectionStatus" class="connection-indicator offline">연결 대기중</span>
          </div>
        </div>
      </div>

      <div class="krp-controls">
        <button onclick="loadRecentOrders()" class="load-orders-btn">📋 최근 주문 불러오기</button>
        <button onclick="printSampleReceipt()" class="sample-print-btn">🖨️ 샘플 출력</button>
        <button onclick="clearAllReceipts()" class="clear-btn">🗑️ 전체 삭제</button>
        <button onclick="toggleAutoMode()" id="autoModeBtn" class="auto-mode-btn">🔄 자동모드 OFF</button>
      </div>

      <div class="orders-section">
        <h3>📋 최근 주문 목록</h3>
        <div id="ordersListContainer">
          <p class="no-orders">주문을 불러오려면 '최근 주문 불러오기' 버튼을 클릭하세요.</p>
        </div>
      </div>

      <div class="receipts-section">
        <h3>🖨️ 출력된 주문서</h3>
        <div id="kitchenReceipts" class="receipts-container">
          <!-- 출력된 영수증들이 여기에 표시됩니다 -->
        </div>
      </div>
    </div>
  `;
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
              <div class="status-count" id="pendingCount">0</div>
              <div class="status-label">대기중</div>
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
          <button class="refresh-btn" onclick="refreshKRPData()">🔄</button>
          <button class="settings-btn" onclick="showKRPSettings()">⚙️</button>
        </div>
      </header>

      <!-- 메인 컨텐츠 -->
      <main class="krp-main">
        <!-- 주문 목록 -->
        <section class="orders-section">
          <div class="section-header">
            <h2>📋 출력 대기 주문</h2>
            <button class="test-print-btn" onclick="testPrint()">🖨️ 테스트 출력</button>
          </div>
          <div class="orders-grid" id="ordersGrid">
            <!-- 주문 카드들이 여기에 렌더링됩니다 -->
          </div>
        </section>

        <!-- 출력된 영수증들 -->
        <section class="receipts-section">
          <div class="section-header">
            <h2>📄 출력된 영수증</h2>
            <button class="clear-receipts-btn" onclick="clearReceipts()">🗑️ 모두 지우기</button>
          </div>
          <div class="receipts-container" id="receiptsContainer">
            <!-- 출력된 영수증들이 여기에 쌓입니다 -->
          </div>
        </section>
      </main>

      <!-- 로딩 오버레이 -->
      <div class="loading-overlay" id="loadingOverlay" style="display: none;">
        <div class="loading-spinner"></div>
        <div class="loading-text">주문 데이터 로딩 중...</div>
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

      .refresh-btn, .settings-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
      }

      .refresh-btn:hover, .settings-btn:hover {
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

      .test-print-btn, .clear-receipts-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .test-print-btn:hover {
        background: #2563eb;
      }

      .clear-receipts-btn {
        background: #ef4444;
      }

      .clear-receipts-btn:hover {
        background: #dc2626;
      }

      /* 주문 그리드 */
      .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
        max-height: calc(100vh - 200px);
        overflow-y: auto;
      }

      .order-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 2px solid transparent;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .order-card:hover {
        border-color: #e67e22;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .order-number {
        font-size: 18px;
        font-weight: 800;
        color: #e67e22;
      }

      .order-time {
        font-size: 12px;
        color: #64748b;
      }

      .order-table {
        font-size: 14px;
        font-weight: 600;
        color: #1a202c;
        margin-bottom: 12px;
      }

      .order-items {
        margin-bottom: 16px;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 14px;
      }

      .print-btn {
        width: 100%;
        background: #e67e22;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .print-btn:hover {
        background: #d35400;
      }

      /* 영수증 컨테이너 */
      .receipts-container {
        max-height: calc(100vh - 200px);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-right: 8px;
      }

      /* 영수증 스타일 */
      .receipt {
        background: white;
        border: 2px dashed #64748b;
        border-radius: 8px;
        padding: 16px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: printSlide 0.5s ease-out;
        max-width: 280px;
      }

      @keyframes printSlide {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .receipt-header {
        text-align: center;
        margin-bottom: 12px;
        border-bottom: 1px dashed #64748b;
        padding-bottom: 8px;
      }

      .receipt-title {
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 4px;
      }

      .receipt-items {
        margin: 12px 0;
      }

      .receipt-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }

      .receipt-footer {
        border-top: 1px dashed #64748b;
        padding-top: 8px;
        margin-top: 12px;
        text-align: center;
        font-size: 11px;
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

        .receipts-container {
          max-height: 400px;
        }
      }

      @media (max-width: 768px) {
        .krp-header {
          flex-direction: column;
          gap: 16px;
          padding: 16px;
        }

        .orders-grid {
          grid-template-columns: 1fr;
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

// KRP 주문 데이터 로딩
async function loadKRPOrders(storeId) {
  try {
    console.log(`📋 KRP - 매장 ${storeId} 주문 데이터 로딩`);

    showLoading(true);

    const response = await fetch(`/api/krp?storeId=${storeId}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error('주문 데이터 조회 실패');
    }

    const data = await response.json();

    if (data.success) {
      currentOrders = data.orders || [];
      renderOrderCards();
      updateOrderCounts();
      console.log(`✅ KRP - ${currentOrders.length}개 주문 로딩 완료`);
    } else {
      throw new Error(data.error || '주문 데이터 조회 실패');
    }

  } catch (error) {
    console.error('❌ KRP 주문 데이터 로딩 실패:', error);
    showNotification('주문 데이터를 불러올 수 없습니다', 'error');
  } finally {
    showLoading(false);
  }
}

// 주문 카드 렌더링
function renderOrderCards() {
  const ordersGrid = document.getElementById('ordersGrid');
  if (!ordersGrid) return;

  if (currentOrders.length === 0) {
    ordersGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <h3>출력 대기 중인 주문이 없습니다</h3>
        <p>새로운 주문이 들어오면 여기에 표시됩니다</p>
      </div>
    `;
    return;
  }

  const cardsHTML = currentOrders.map(order => {
    const orderTime = new Date(order.created_at);
    const timeString = orderTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsHTML = order.items.map(item => `
      <div class="order-item">
        <span>${item.quantity}x ${item.menu_name}</span>
        ${item.options ? `<small>${item.options}</small>` : ''}
      </div>
    `).join('');

    return `
      <div class="order-card" onclick="printOrder(${order.id})">
        <div class="order-header">
          <div class="order-number">#${order.id}</div>
          <div class="order-time">${timeString}</div>
        </div>
        <div class="order-table">테이블 ${order.table_number} | ${order.customer_name || '손님'}</div>
        <div class="order-items">
          ${itemsHTML}
        </div>
        <button class="print-btn" onclick="event.stopPropagation(); printOrder(${order.id})">
          🖨️ 출력하기
        </button>
      </div>
    `;
  }).join('');

  ordersGrid.innerHTML = cardsHTML;
}

// 주문 출력 처리
async function printOrder(orderId) {
  try {
    console.log(`🖨️ 주문 ${orderId} 출력 요청`);

    const response = await fetch('/api/krp/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: currentStoreId,
        orderId: orderId
      })
    });

    const result = await response.json();

    if (result.success) {
      // 로컬에서도 바로 영수증 출력
      displayReceipt(result.order);

      // 주문 목록에서 제거
      currentOrders = currentOrders.filter(order => order.id !== orderId);
      renderOrderCards();
      updateOrderCounts();

      showNotification(`주문 #${orderId} 출력 완료`, 'success');
    } else {
      throw new Error(result.error || '출력 실패');
    }

  } catch (error) {
    console.error('❌ 주문 출력 실패:', error);
    showNotification('주문 출력에 실패했습니다', 'error');
  }
}

// 영수증 화면 출력
function displayReceipt(order) {
  const receiptsContainer = document.getElementById('receiptsContainer');
  if (!receiptsContainer) return;

  const orderTime = new Date(order.created_at);
  const timeString = orderTime.toLocaleString('ko-KR');

  const itemsHTML = order.items.map(item => `
    <div class="receipt-item">
      <span>${item.quantity}x ${item.menu_name}</span>
      ${item.options ? `<div style="font-size: 10px; color: #666;">${item.options}</div>` : ''}
    </div>
  `).join('');

  const receipt = document.createElement('div');
  receipt.className = 'receipt';
  receipt.innerHTML = `
    <div class="receipt-header">
      <div class="receipt-title">🍴 주방 주문서</div>
      <div>TableLink KRP</div>
    </div>

    <div style="margin: 8px 0;">
      <strong>주문번호: #${order.id}</strong><br>
      <strong>테이블: ${order.table_number}</strong><br>
      고객: ${order.customer_name || '손님'}
    </div>

    <div style="border-top: 1px dashed #666; margin: 8px 0; padding-top: 8px;">
      ${itemsHTML}
    </div>

    <div class="receipt-footer">
      ${timeString}<br>
      주방에서 조리 시작하세요
    </div>
  `;

  receiptsContainer.insertBefore(receipt, receiptsContainer.firstChild);

  // 스크롤을 맨 위로
  receiptsContainer.scrollTop = 0;
}

// 테스트 출력
function testPrint() {
  const testOrder = {
    id: 'TEST-' + Date.now(),
    table_number: 'A-1',
    customer_name: '테스트',
    created_at: new Date().toISOString(),
    items: [
      { quantity: 2, menu_name: '김치찌개', options: '밥 추가' },
      { quantity: 1, menu_name: '불고기덮밥', options: null }
    ]
  };

  displayReceipt(testOrder);
  showNotification('테스트 출력 완료', 'success');
}

// 영수증 모두 지우기
function clearReceipts() {
  const receiptsContainer = document.getElementById('receiptsContainer');
  if (receiptsContainer) {
    receiptsContainer.innerHTML = '';
    showNotification('모든 영수증을 삭제했습니다', 'info');
  }
}

// 주문 카운트 업데이트
function updateOrderCounts() {
  const pendingCount = document.getElementById('pendingCount');
  const printedCount = document.getElementById('printedCount');

  if (pendingCount) {
    pendingCount.textContent = currentOrders.length;
  }

  if (printedCount) {
    const receipts = document.querySelectorAll('.receipt');
    printedCount.textContent = receipts.length;
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
      showNotification('⚠️ KRP 연결이 해제되었습니다', 'warning');
    });

    krpSocket.on('join-krp-room-success', (data) => {
      console.log(`✅ KRP 룸 참여 확인 - 매장 ${data.storeId}, 클라이언트: ${data.clientCount}개`);
    });

    // 실시간 출력 이벤트 수신
    krpSocket.on('krp-print', (printData) => {
      console.log('🖨️ 실시간 출력 이벤트 수신:', printData);

      if (printData.type === 'print-receipt' && printData.order) {
        displayReceipt(printData.order);

        // 주문 목록에서 제거
        currentOrders = currentOrders.filter(order => order.id !== printData.order.id);
        renderOrderCards();
        updateOrderCounts();

        showNotification(`새 주문서가 출력되었습니다: #${printData.order.id}`, 'info');
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

// 데이터 새로고침
async function refreshKRPData() {
  if (currentStoreId) {
    await loadKRPOrders(currentStoreId);
    showNotification('데이터를 새로고침했습니다', 'info');
  }
}

// KRP 설정
function showKRPSettings() {
  showNotification('KRP 설정 기능은 곧 구현될 예정입니다', 'info');
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
  notification.className = `notification notification-${type}`;
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

// KRP 초기화 (WebSocket 연동 포함)
function initializeKRP(storeId) {
  console.log(`🖨️ KRP 시스템 초기화 - 매장 ID: ${storeId}`);

  window.selectedStoreId = storeId;
  window.currentStore = { id: storeId };
  window.autoMode = false;
  window.krpOrders = [];
  window.krpSocket = null;

  // WebSocket 연결 초기화
  initializeKRPWebSocket(storeId);

  // 자동 새로고침 시작
  startAutoRefresh();
}

// KRP WebSocket 초기화
function initializeKRPWebSocket(storeId) {
  try {
    console.log(`🔌 KRP WebSocket 연결 시작... (매장 ID: ${storeId})`);

    if (window.krpSocket) {
      window.krpSocket.disconnect();
    }

    window.krpSocket = io({
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // 연결 성공
    window.krpSocket.on('connect', () => {
      console.log('✅ KRP WebSocket 연결 성공:', window.krpSocket.id);
      window.krpSocket.emit('join-krp-room', parseInt(storeId));
      updateKRPConnectionStatus(true);
    });

    // 연결 해제
    window.krpSocket.on('disconnect', (reason) => {
      console.log('❌ KRP WebSocket 연결 해제:', reason);
      updateKRPConnectionStatus(false);
    });

    // 재연결
    window.krpSocket.on('reconnect', () => {
      console.log('🔄 KRP WebSocket 재연결 성공');
      window.krpSocket.emit('join-krp-room', parseInt(storeId));
      updateKRPConnectionStatus(true);
    });

    // 새 주문 수신
    window.krpSocket.on('new-order', handleNewKRPOrder);

    // 주문 상태 변경 수신
    window.krpSocket.on('order-update', handleKRPOrderUpdate);

  } catch (error) {
    console.error('❌ KRP WebSocket 초기화 실패:', error);
    updateKRPConnectionStatus(false);
  }
}

// KRP 연결 상태 업데이트
function updateKRPConnectionStatus(isConnected) {
  const statusElement = document.getElementById('krpConnectionStatus');
  if (statusElement) {
    if (isConnected) {
      statusElement.textContent = '실시간 연결됨';
      statusElement.className = 'connection-indicator online';
    } else {
      statusElement.textContent = '연결 끊김';
      statusElement.className = 'connection-indicator offline';
    }
  }
}

// 새 주문 실시간 처리
function handleNewKRPOrder(data) {
  const { orderId, storeName, tableNumber, customerName, itemCount, totalAmount, source } = data;
  console.log(`🆕 KRP 새 주문 수신 - 주문 ${orderId}, 테이블 ${tableNumber}`);

  // 자동 모드인 경우 즉시 출력
  if (window.autoMode) {
    console.log('🔄 자동 모드 - 즉시 주문서 출력');
    printOrderReceipt({
      id: orderId,
      table_number: tableNumber,
      customer_name: customerName,
      total_amount: totalAmount,
      source: source,
      auto_printed: true
    });
  }

  // 주문 목록 새로고침
  loadRecentOrders();

  // 알림 표시
  showKRPNotification(`🆕 새 주문 접수!\n테이블 ${tableNumber} | ${customerName}\n₩${totalAmount.toLocaleString()}`, 'success');
}

// 주문 상태 업데이트 처리
function handleKRPOrderUpdate(data) {
  const { orderId, action, tableNumber } = data;
  console.log(`🔄 KRP 주문 업데이트 - 주문 ${orderId}, 액션: ${action}`);

  if (action === 'cooking-completed' || action === 'session-closed') {
    // 주문 목록에서 해당 주문 제거 또는 상태 업데이트
    loadRecentOrders();
  }
}

// 자동 모드 토글
function toggleAutoMode() {
  window.autoMode = !window.autoMode;
  const btn = document.getElementById('autoModeBtn');

  if (btn) {
    btn.textContent = window.autoMode ? '🔄 자동모드 ON' : '🔄 자동모드 OFF';
    btn.classList.toggle('active', window.autoMode);
  }

  const statusText = window.autoMode ? '활성화' : '비활성화';
  showKRPNotification(`🔄 자동 출력 모드 ${statusText}`, 'info');
  console.log(`🔄 KRP 자동 모드: ${window.autoMode ? 'ON' : 'OFF'}`);
}

// KRP 알림 시스템
function showKRPNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.krp-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `krp-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;

  // 스타일 추가
  if (!document.getElementById('krp-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'krp-notification-styles';
    style.textContent = `
      .krp-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 350px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        border-left: 4px solid #3b82f6;
        animation: slideInFromRight 0.3s ease-out;
      }
      .krp-notification.success { border-left-color: #10b981; }
      .krp-notification.warning { border-left-color: #f59e0b; }
      .krp-notification.error { border-left-color: #ef4444; }
      .notification-content {
        padding: 12px 16px;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      .notification-message {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
        color: #374151;
        white-space: pre-line;
      }
      .notification-close {
        background: none;
        border: none;
        font-size: 14px;
        cursor: pointer;
        color: #9ca3af;
        padding: 0;
      }
      @keyframes slideInFromRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // 4초 후 자동 제거
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 4000);
}


// 전역 함수 등록
window.renderKRPComponent = renderKRPComponent;
window.initializeKRP = initializeKRP;
window.loadRecentOrders = loadRecentOrders;
window.printOrderReceipt = printOrderReceipt;
window.printSampleReceipt = printSampleReceipt;
window.clearAllReceipts = clearAllReceipts;
window.startAutoRefresh = startAutoRefresh;
window.showKRPNotification = showKRPNotification;
window.toggleAutoMode = toggleAutoMode;
window.initializeKRPWebSocket = initializeKRPWebSocket;
window.handleNewKRPOrder = handleNewKRPOrder;
window.handleKRPOrderUpdate = handleKRPOrderUpdate;
window.updateKRPConnectionStatus = updateKRPConnectionStatus;

console.log('✅ KRP 컴포넌트 로드 완료 - WebSocket 실시간 연동 포함');