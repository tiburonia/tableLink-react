
// 안정적인 KDS 시스템 v2.0
console.log('🚀 KDS 시스템 v2.0 로드 시작');

// 글로벌 변수
let currentStoreId = null;
let refreshInterval = null;
let orders = [];

// KDS 메인 렌더링 함수
async function renderKDS() {
  const main = document.getElementById('main');

  try {
    console.log('📟 KDS 페이지 로딩 시작');

    // URL에서 매장 ID 추출
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('storeId') || urlParams.get('store');

    if (!storeId || isNaN(parseInt(storeId))) {
      console.log('❌ 유효하지 않은 매장 ID');
      renderKDSStoreSelection();
      return;
    }

    currentStoreId = parseInt(storeId);
    console.log(`📟 KDS 매장 ID: ${currentStoreId}`);

    // 로딩 화면 먼저 표시
    showLoadingScreen();

    // KDS 메인 화면 렌더링
    await renderKDSMain(currentStoreId);

  } catch (error) {
    console.error('❌ KDS 페이지 로딩 실패:', error);
    renderKDSError();
  }
}

// 로딩 화면
function showLoadingScreen() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="kds-loading">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h2>📟 KDS 시스템 로딩 중...</h2>
        <p>매장 정보와 주문 데이터를 불러오고 있습니다.</p>
      </div>
    </div>

    <style>
      .kds-loading {
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .loading-content {
        text-align: center;
      }

      .loading-spinner {
        width: 60px;
        height: 60px;
        border: 4px solid rgba(79, 195, 247, 0.3);
        border-top: 4px solid #4fc3f7;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
}

// KDS 메인 화면 렌더링
async function renderKDSMain(storeId) {
  console.log(`📟 KDS 매장 ${storeId} 메인 화면 렌더링`);

  try {
    // 매장 정보 조회
    console.log(`🔍 매장 ${storeId} 정보 조회 중...`);
    const storeResponse = await fetch(`/api/kds/store/${storeId}`);

    if (!storeResponse.ok) {
      throw new Error('매장 정보 조회 실패');
    }

    const storeData = await storeResponse.json();

    if (!storeData.success || !storeData.store) {
      throw new Error('매장 정보를 찾을 수 없습니다');
    }

    const store = storeData.store;
    console.log(`✅ 매장 정보 조회 완료: ${store.name}`);

    // KDS 화면 렌더링
    renderKDSInterface(store);

    // 주문 데이터 초기 로딩
    await loadKDSOrders(storeId);

    // 자동 새로고침 설정 (30초마다)
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
      loadKDSOrders(storeId, false); // 조용한 새로고침
    }, 30000);

    console.log('✅ KDS 메인 화면 렌더링 완료');

  } catch (error) {
    console.error('❌ KDS 메인 화면 렌더링 실패:', error);
    renderKDSError();
  }
}

// KDS 인터페이스 렌더링
function renderKDSInterface(store) {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div class="kds-system">
      <!-- 헤더 -->
      <header class="kds-header">
        <div class="store-info">
          <h1>📟 ${store.name}</h1>
          <div class="current-time" id="currentTime"></div>
        </div>

        <div class="stats">
          <div class="stat pending">
            <span class="count" id="pendingCount">0</span>
            <span class="label">대기</span>
          </div>
          <div class="stat cooking">
            <span class="count" id="cookingCount">0</span>
            <span class="label">조리중</span>
          </div>
          <div class="stat ready">
            <span class="count" id="readyCount">0</span>
            <span class="label">완료</span>
          </div>
        </div>

        <div class="controls">
          <button onclick="refreshKDS()" class="refresh-btn" id="refreshBtn">
            🔄 새로고침
          </button>
          <div class="status-indicator" id="statusIndicator">
            <span class="indicator online"></span>
            <span>연결됨</span>
          </div>
        </div>
      </header>

      <!-- 메인 컨텐츠 -->
      <main class="kds-content">
        <div class="orders-container">
          <div class="orders-grid" id="ordersGrid">
            <!-- 주문 카드들이 여기에 동적으로 생성됩니다 -->
          </div>

          <div class="empty-state" id="emptyState" style="display: none;">
            <div class="empty-icon">📋</div>
            <h2>처리할 주문이 없습니다</h2>
            <p>새로운 주문이 들어오면 여기에 표시됩니다.</p>
            <button onclick="refreshKDS()" class="retry-btn">다시 확인</button>
          </div>

          <div class="error-state" id="errorState" style="display: none;">
            <div class="error-icon">❌</div>
            <h2>데이터 로딩 실패</h2>
            <p id="errorMessage">네트워크 연결을 확인하고 다시 시도해주세요.</p>
            <button onclick="refreshKDS()" class="retry-btn">다시 시도</button>
          </div>
        </div>
      </main>

      <!-- 하단 상태바 -->
      <footer class="kds-footer">
        <div class="footer-left">
          <span>KDS v2.0 | 매장: ${store.name} (ID: ${store.id})</span>
        </div>
        <div class="footer-right">
          <span id="lastUpdate">마지막 업데이트: 로딩 중...</span>
        </div>
      </footer>
    </div>

    ${generateKDSStyles()}
  `;

  // 시간 업데이트 시작
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  console.log('✅ KDS 인터페이스 렌더링 완료');
}

// KDS 스타일 생성
function generateKDSStyles() {
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .kds-system {
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #0f1419 0%, #1a1a2e 50%, #16213e 100%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .kds-header {
        background: rgba(255, 255, 255, 0.1);
        padding: 20px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid rgba(79, 195, 247, 0.3);
        backdrop-filter: blur(15px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .store-info h1 {
        margin: 0 0 5px 0;
        font-size: 26px;
        font-weight: 700;
        color: #4fc3f7;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .current-time {
        font-size: 14px;
        color: #b0bec5;
        font-family: 'Courier New', monospace;
        letter-spacing: 1px;
      }

      .stats {
        display: flex;
        gap: 25px;
      }

      .stat {
        text-align: center;
        background: rgba(255, 255, 255, 0.1);
        padding: 18px 25px;
        border-radius: 16px;
        min-width: 90px;
        border: 2px solid transparent;
        transition: all 0.3s ease;
      }

      .stat.pending { border-color: #ff9800; }
      .stat.cooking { border-color: #f44336; }
      .stat.ready { border-color: #4caf50; }

      .stat .count {
        display: block;
        font-size: 32px;
        font-weight: 900;
        font-family: 'Courier New', monospace;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .stat.pending .count { color: #ffab40; }
      .stat.cooking .count { color: #ef5350; animation: pulse 1.5s infinite; }
      .stat.ready .count { color: #66bb6a; }

      .stat .label {
        font-size: 11px;
        color: #90a4ae;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-top: 4px;
      }

      .controls {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .refresh-btn {
        background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 14px;
        box-shadow: 0 4px 15px rgba(79, 195, 247, 0.3);
      }

      .refresh-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4);
      }

      .refresh-btn:active {
        transform: translateY(0px);
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #b0bec5;
      }

      .indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4caf50;
        animation: blink 2s infinite;
      }

      .indicator.online { background: #4caf50; }
      .indicator.offline { background: #f44336; }

      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.5; }
      }

      .kds-content {
        flex: 1;
        overflow: auto;
        padding: 25px;
        background: rgba(0, 0, 0, 0.1);
      }

      .orders-container {
        max-width: 1600px;
        margin: 0 auto;
      }

      .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 25px;
        padding-bottom: 20px;
      }

      .order-card {
        background: rgba(255, 255, 255, 0.12);
        border-radius: 20px;
        padding: 28px;
        border: 3px solid transparent;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        backdrop-filter: blur(15px);
        position: relative;
        overflow: hidden;
      }

      .order-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #4fc3f7, #29b6f6);
        opacity: 0.7;
      }

      .order-card:hover {
        transform: translateY(-6px) scale(1.02);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
      }

      .order-card.pending {
        border-color: #ff9800;
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 255, 255, 0.12) 100%);
      }

      .order-card.cooking {
        border-color: #f44336;
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(255, 255, 255, 0.12) 100%);
        animation: cookingPulse 2s infinite;
      }

      .order-card.ready {
        border-color: #4caf50;
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(255, 255, 255, 0.12) 100%);
      }

      .order-card.completed {
        border-color: #9c27b0;
        background: linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(255, 255, 255, 0.12) 100%);
        opacity: 0.7;
      }

      @keyframes cookingPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.9; transform: scale(1.01); }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .order-number {
        font-size: 22px;
        font-weight: 800;
        color: #4fc3f7;
        font-family: 'Courier New', monospace;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .order-time {
        font-size: 13px;
        color: #90a4ae;
        font-family: 'Courier New', monospace;
        text-align: right;
      }

      .elapsed-time {
        font-size: 11px;
        color: #ff9800;
        margin-top: 2px;
      }

      .order-meta {
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
      }

      .customer-name {
        font-size: 17px;
        font-weight: 700;
        margin-bottom: 6px;
        color: #e0e0e0;
      }

      .table-info {
        font-size: 14px;
        color: #b0bec5;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .source-badge {
        background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .source-badge.pos {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      }

      .order-items {
        margin-bottom: 24px;
      }

      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        margin-bottom: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        border-left: 4px solid #4fc3f7;
        transition: all 0.3s ease;
      }

      .item:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateX(5px);
      }

      .item-info {
        flex: 1;
      }

      .item-name {
        font-weight: 700;
        margin-bottom: 4px;
        color: #e0e0e0;
        font-size: 15px;
      }

      .item-options {
        font-size: 12px;
        color: #90a4ae;
      }

      .item-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .item-quantity {
        background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(79, 195, 247, 0.3);
      }

      .item-status {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 8px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .item-status.queued { background: #ff9800; color: white; }
      .item-status.cooking { background: #f44336; color: white; }
      .item-status.ready { background: #4caf50; color: white; }
      .item-status.served { background: #9c27b0; color: white; }

      .order-actions {
        display: flex;
        gap: 10px;
      }

      .action-btn {
        flex: 1;
        padding: 16px 20px;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        font-size: 13px;
        letter-spacing: 0.8px;
        position: relative;
        overflow: hidden;
      }

      .action-btn:hover {
        transform: translateY(-3px);
      }

      .action-btn:active {
        transform: translateY(-1px);
      }

      .start-cooking-btn {
        background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
      }

      .complete-btn {
        background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
      }

      .serve-btn {
        background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3);
      }

      .completed-badge {
        text-align: center;
        padding: 16px;
        color: #4caf50;
        font-weight: 700;
        font-size: 16px;
        background: rgba(76, 175, 80, 0.2);
        border-radius: 12px;
        border: 2px solid #4caf50;
      }

      .empty-state, .error-state {
        text-align: center;
        padding: 80px 40px;
        color: #78909c;
        max-width: 500px;
        margin: 0 auto;
      }

      .empty-icon, .error-icon {
        font-size: 64px;
        margin-bottom: 20px;
      }

      .empty-state h2, .error-state h2 {
        margin-bottom: 16px;
        color: #90a4ae;
        font-size: 24px;
      }

      .empty-state p, .error-state p {
        margin-bottom: 24px;
        font-size: 16px;
        line-height: 1.5;
      }

      .retry-btn {
        background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
      }

      .retry-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4);
      }

      .kds-footer {
        background: rgba(0, 0, 0, 0.4);
        padding: 18px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 13px;
        color: #90a4ae;
      }

      .orders-container::-webkit-scrollbar {
        width: 10px;
      }

      .orders-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
      }

      .orders-container::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
        border-radius: 5px;
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(79, 195, 247, 0.3);
        border-top: 4px solid #4fc3f7;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
}

// 현재 시간 업데이트
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
      second: '2-digit',
      hour12: false
    });
    timeElement.textContent = timeString;
  }
}

// 주문 데이터 로딩
async function loadKDSOrders(storeId, showLoading = true) {
  try {
    console.log(`📟 매장 ${storeId} 주문 데이터 로딩 (조용한 새로고침: ${!showLoading})`);

    if (showLoading) {
      setLoadingState(true);
    }

    const response = await fetch(`/api/kds/orders/${storeId}`);

    if (!response.ok) {
      throw new Error(`주문 데이터 조회 실패: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      orders = data.orders || [];
      updateKDSOrderCards(orders);
      updateOrderCounts(orders);
      updateLastUpdateTime();
      hideErrorState();
      console.log(`✅ 주문 데이터 로딩 완료 (${orders.length}개)`);
    } else {
      throw new Error(data.error || '데이터 조회 실패');
    }

  } catch (error) {
    console.error('❌ 주문 데이터 로딩 실패:', error);
    showErrorState(error.message);
  } finally {
    if (showLoading) {
      setLoadingState(false);
    }
  }
}

// 로딩 상태 설정
function setLoadingState(isLoading) {
  const refreshBtn = document.getElementById('refreshBtn');
  const indicator = document.querySelector('.indicator');

  if (refreshBtn) {
    refreshBtn.disabled = isLoading;
    refreshBtn.textContent = isLoading ? '⏳ 로딩...' : '🔄 새로고침';
  }

  if (indicator) {
    indicator.className = isLoading ? 'indicator offline' : 'indicator online';
  }
}

// 에러 상태 표시
function showErrorState(errorMessage) {
  const ordersGrid = document.getElementById('ordersGrid');
  const emptyState = document.getElementById('emptyState');
  const errorState = document.getElementById('errorState');
  const errorMessageEl = document.getElementById('errorMessage');

  if (ordersGrid) ordersGrid.style.display = 'none';
  if (emptyState) emptyState.style.display = 'none';
  if (errorState) {
    errorState.style.display = 'block';
    if (errorMessageEl) {
      errorMessageEl.textContent = errorMessage;
    }
  }

  const indicator = document.querySelector('.indicator');
  if (indicator) {
    indicator.className = 'indicator offline';
  }
}

// 에러 상태 숨기기
function hideErrorState() {
  const errorState = document.getElementById('errorState');
  if (errorState) {
    errorState.style.display = 'none';
  }
}

// 주문 카드 업데이트
function updateKDSOrderCards(orders) {
  const ordersGrid = document.getElementById('ordersGrid');
  const emptyState = document.getElementById('emptyState');

  if (!ordersGrid) return;

  ordersGrid.style.display = 'grid';
  ordersGrid.innerHTML = '';

  if (orders.length === 0) {
    ordersGrid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  orders.forEach(order => {
    const orderCard = createOrderCard(order);
    ordersGrid.appendChild(orderCard);
  });

  console.log(`📟 주문 카드 업데이트 완료: ${orders.length}개`);
}

// 주문 카드 생성
function createOrderCard(order) {
  const orderTime = new Date(order.created_at);
  const timeString = orderTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // 경과 시간 계산
  const elapsed = Math.floor((Date.now() - orderTime.getTime()) / 60000);
  const elapsedText = elapsed < 60 ? `${elapsed}분 전` : `${Math.floor(elapsed/60)}시간 ${elapsed%60}분 전`;

  const statusClass = (order.cookingStatus || 'pending').toLowerCase();

  const card = document.createElement('div');
  card.className = `order-card ${statusClass}`;
  card.dataset.orderId = order.id;

  // 아이템 HTML 생성
  const itemsHTML = (order.items || []).map(item => `
    <div class="item">
      <div class="item-info">
        <div class="item-name">${item.menu_name || '메뉴'}</div>
        ${item.options ? `<div class="item-options">${item.options}</div>` : ''}
      </div>
      <div class="item-right">
        <div class="item-quantity">×${item.quantity || 1}</div>
        <div class="item-status ${item.status || 'queued'}">${getStatusText(item.status)}</div>
      </div>
    </div>
  `).join('');

  card.innerHTML = `
    <div class="order-header">
      <div class="order-number">#${order.id}</div>
      <div class="order-time">
        ${timeString}
        <div class="elapsed-time">${elapsedText}</div>
      </div>
    </div>

    <div class="order-meta">
      <div class="customer-name">${order.customerName || '손님'}</div>
      <div class="table-info">
        ${order.table_number ? `🏷️ 테이블 ${order.table_number}` : '📦 포장'}
        <span class="source-badge ${order.source === 'TLL' ? 'tll' : 'pos'}">
          ${order.source === 'TLL' ? '📱 TLL' : '🖥️ POS'}
        </span>
      </div>
    </div>

    <div class="order-items">
      ${itemsHTML || '<div class="item"><div class="item-info"><div class="item-name">주문 아이템 없음</div></div></div>'}
    </div>

    <div class="order-actions">
      ${generateActionButtons(order)}
    </div>
  `;

  return card;
}

// 상태 텍스트 변환
function getStatusText(status) {
  const statusMap = {
    'queued': '대기',
    'cooking': '조리중',
    'ready': '완료',
    'served': '서빙됨'
  };
  return statusMap[status] || '대기';
}

// 액션 버튼 생성
function generateActionButtons(order) {
  const status = order.cookingStatus;

  if (status === 'COMPLETED') {
    return '<div class="completed-badge">✅ 서빙 완료</div>';
  }

  let buttons = [];

  if (status === 'PENDING') {
    buttons.push(`
      <button class="action-btn start-cooking-btn" onclick="startCooking(${order.id})">
        🔥 조리 시작
      </button>
    `);
  }

  if (status === 'COOKING') {
    buttons.push(`
      <button class="action-btn complete-btn" onclick="completeOrder(${order.id})">
        ✅ 조리 완료
      </button>
    `);
  }

  if (status === 'READY') {
    buttons.push(`
      <button class="action-btn serve-btn" onclick="serveOrder(${order.id})">
        🍽️ 서빙 완료
      </button>
    `);
  }

  return buttons.join('');
}

// 주문 카운트 업데이트
function updateOrderCounts(orders) {
  const pendingCount = orders.filter(o => o.cookingStatus === 'PENDING').length;
  const cookingCount = orders.filter(o => o.cookingStatus === 'COOKING').length;
  const readyCount = orders.filter(o => o.cookingStatus === 'READY').length;

  const pendingEl = document.getElementById('pendingCount');
  const cookingEl = document.getElementById('cookingCount');
  const readyEl = document.getElementById('readyCount');

  if (pendingEl) pendingEl.textContent = pendingCount;
  if (cookingEl) cookingEl.textContent = cookingCount;
  if (readyEl) readyEl.textContent = readyCount;
}

// 마지막 업데이트 시간 갱신
function updateLastUpdateTime() {
  const lastUpdateEl = document.getElementById('lastUpdate');
  if (lastUpdateEl) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    lastUpdateEl.textContent = `마지막 업데이트: ${timeString}`;
  }
}

// 새로고침
function refreshKDS() {
  console.log('🔄 KDS 수동 새로고침');
  if (currentStoreId) {
    loadKDSOrders(currentStoreId, true);
  }
}

// 조리 시작
async function startCooking(orderId) {
  try {
    console.log(`🔥 주문 ${orderId} 조리 시작 요청`);
    showButtonLoading(orderId, 'start');

    const response = await fetch(`/api/kds/orders/${orderId}/start-cooking`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    
    if (result.success) {
      showNotification('조리를 시작했습니다', 'success');
      await loadKDSOrders(currentStoreId, false);
    } else {
      showNotification('조리 시작 실패: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('❌ 조리 시작 실패:', error);
    showNotification('조리 시작 중 오류가 발생했습니다', 'error');
  } finally {
    hideButtonLoading(orderId);
  }
}

// 조리 완료
async function completeOrder(orderId) {
  try {
    console.log(`✅ 주문 ${orderId} 조리 완료 요청`);
    showButtonLoading(orderId, 'complete');

    const response = await fetch(`/api/kds/orders/${orderId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    
    if (result.success) {
      showNotification('조리가 완료되었습니다', 'success');
      await loadKDSOrders(currentStoreId, false);
    } else {
      showNotification('조리 완료 실패: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('❌ 조리 완료 실패:', error);
    showNotification('조리 완료 중 오류가 발생했습니다', 'error');
  } finally {
    hideButtonLoading(orderId);
  }
}

// 서빙 완료
async function serveOrder(orderId) {
  try {
    console.log(`🍽️ 주문 ${orderId} 서빙 완료 요청`);
    showButtonLoading(orderId, 'serve');

    const response = await fetch(`/api/kds/orders/${orderId}/serve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    
    if (result.success) {
      showNotification('서빙이 완료되었습니다', 'success');
      await loadKDSOrders(currentStoreId, false);
    } else {
      showNotification('서빙 완료 실패: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('❌ 서빙 완료 실패:', error);
    showNotification('서빙 완료 중 오류가 발생했습니다', 'error');
  } finally {
    hideButtonLoading(orderId);
  }
}

// 버튼 로딩 상태 표시
function showButtonLoading(orderId, actionType) {
  const card = document.querySelector(`[data-order-id="${orderId}"]`);
  if (!card) return;

  const actionButtons = card.querySelectorAll('.action-btn');
  actionButtons.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    if (btn.textContent.includes(getActionText(actionType))) {
      btn.innerHTML = '⏳ 처리 중...';
    }
  });
}

// 버튼 로딩 상태 숨기기
function hideButtonLoading(orderId) {
  // 새로고침으로 자동 해결됨
}

// 액션 텍스트 매핑
function getActionText(actionType) {
  const textMap = {
    'start': '조리 시작',
    'complete': '조리 완료', 
    'serve': '서빙 완료'
  };
  return textMap[actionType] || '';
}

// 알림 표시
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const typeColors = {
    'success': '#4caf50',
    'error': '#f44336', 
    'info': '#2196f3'
  };

  notification.style.cssText = `
    position: fixed;
    top: 30px;
    right: 30px;
    background: ${typeColors[type] || typeColors.info};
    color: white;
    padding: 20px 28px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    max-width: 350px;
    font-size: 14px;
    line-height: 1.4;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.4s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  }, 3000);
}

// 매장 선택 화면
function renderKDSStoreSelection() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="store-selection">
      <div class="selection-content">
        <h1>📟 KDS 시스템</h1>
        <p>Kitchen Display System</p>

        <div class="input-group">
          <input 
            type="number" 
            id="storeIdInput" 
            placeholder="매장 ID를 입력하세요" 
            onkeypress="if(event.key === 'Enter') { enterKDSStore(); }"
          />
          <button onclick="enterKDSStore()">🚀 접속</button>
        </div>

        <div class="help-text">
          <p>💡 팁: URL에 ?storeId=1 을 추가하면 바로 접속됩니다</p>
        </div>
      </div>

      <style>
        .store-selection {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0f1419 0%, #1a1a2e 50%, #16213e 100%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .selection-content {
          text-align: center;
          max-width: 500px;
          padding: 40px;
        }

        .selection-content h1 {
          font-size: 3rem;
          margin-bottom: 16px;
          color: #4fc3f7;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .selection-content p {
          font-size: 1.2rem;
          color: #90a4ae;
          margin-bottom: 40px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .input-group {
          margin: 40px 0;
          display: flex;
          gap: 12px;
        }

        .input-group input {
          flex: 1;
          padding: 18px 24px;
          font-size: 18px;
          border: 2px solid #4fc3f7;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .input-group input::placeholder {
          color: #90a4ae;
        }

        .input-group button {
          background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
          color: white;
          border: none;
          padding: 18px 32px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(79, 195, 247, 0.3);
        }

        .input-group button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4);
        }

        .help-text {
          color: #78909c;
          font-size: 14px;
          margin-top: 30px;
        }
      </style>
    </div>
  `;

  // 입력 포커스
  setTimeout(() => {
    const input = document.getElementById('storeIdInput');
    if (input) input.focus();
  }, 100);
}

// 에러 화면
function renderKDSError() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="error-screen">
      <div class="error-content">
        <div class="error-icon">💥</div>
        <h1>KDS 시스템 오류</h1>
        <p>시스템 로딩 중 오류가 발생했습니다.</p>
        
        <div class="error-actions">
          <button onclick="window.location.reload()" class="retry-btn">
            🔄 새로고침
          </button>
          <button onclick="renderKDSStoreSelection()" class="back-btn">
            ↩️ 매장 선택으로
          </button>
        </div>
      </div>

      <style>
        .error-screen {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .error-content {
          text-align: center;
          max-width: 500px;
          padding: 40px;
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .error-content h1 {
          font-size: 2rem;
          margin-bottom: 16px;
          color: #f44336;
        }

        .error-content p {
          color: #90a4ae;
          margin-bottom: 30px;
          font-size: 16px;
        }

        .error-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .retry-btn, .back-btn {
          background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .back-btn {
          background: linear-gradient(135deg, #90a4ae 0%, #78909c 100%);
        }

        .retry-btn:hover, .back-btn:hover {
          transform: translateY(-2px);
        }
      </style>
    </div>
  `;
}

// KDS 매장 접속
function enterKDSStore() {
  const storeIdInput = document.getElementById('storeIdInput');
  const storeId = parseInt(storeIdInput.value);

  if (!storeId || isNaN(storeId) || storeId <= 0) {
    showNotification('올바른 매장 ID를 입력해주세요', 'error');
    storeIdInput.focus();
    return;
  }

  console.log(`🚀 매장 ${storeId} KDS 접속`);
  const newUrl = `${window.location.pathname}?storeId=${storeId}`;
  window.location.href = newUrl;
}

// CSS 애니메이션 추가
const animations = document.createElement('style');
animations.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(animations);

// 전역 함수로 노출
window.renderKDS = renderKDS;
window.enterKDSStore = enterKDSStore;
window.startCooking = startCooking;
window.completeOrder = completeOrder;
window.serveOrder = serveOrder;
window.refreshKDS = refreshKDS;

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

console.log('✅ KDS 시스템 v2.0 로드 완료');
