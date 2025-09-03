// 간단하고 안정적인 KDS 시스템
console.log('🚀 Simple KDS 시스템 로드 시작');

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

    console.log(`📟 KDS 매장 ID: ${storeId}`);
    window.currentStoreId = parseInt(storeId);

    // KDS 메인 화면 렌더링
    await renderKDSMain(storeId);

  } catch (error) {
    console.error('❌ KDS 페이지 로딩 실패:', error);
    renderKDSError();
  }
}

// KDS 메인 화면 렌더링
async function renderKDSMain(storeId) {
  console.log(`📟 KDS 매장 ${storeId} 메인 화면 렌더링`);

  try {
    // 매장 정보 조회
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

    // 주문 데이터 로딩
    await loadKDSOrders(storeId);

    // 30초마다 자동 새로고침
    setInterval(() => {
      loadKDSOrders(storeId);
    }, 30000);

  } catch (error) {
    console.error('❌ KDS 메인 화면 렌더링 실패:', error);
    renderKDSError();
  }
}

// KDS 인터페이스 렌더링
function renderKDSInterface(store) {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div class="simple-kds">
      <!-- 헤더 -->
      <header class="kds-header">
        <div class="store-info">
          <h1>${store.name}</h1>
          <div class="current-time" id="currentTime"></div>
        </div>

        <div class="stats">
          <div class="stat">
            <span class="count" id="pendingCount">0</span>
            <span class="label">대기</span>
          </div>
          <div class="stat">
            <span class="count" id="cookingCount">0</span>
            <span class="label">조리중</span>
          </div>
          <div class="stat">
            <span class="count" id="readyCount">0</span>
            <span class="label">완료</span>
          </div>
        </div>

        <div class="controls">
          <button onclick="refreshKDS()" class="refresh-btn">🔄 새로고침</button>
        </div>
      </header>

      <!-- 메인 컨텐츠 -->
      <main class="kds-content">
        <div class="orders-grid" id="ordersGrid">
          <!-- 주문 카드들이 여기에 동적으로 생성됩니다 -->
        </div>

        <div class="empty-state" id="emptyState" style="display: none;">
          <h2>📋 처리할 주문이 없습니다</h2>
          <p>새로운 주문이 들어오면 여기에 표시됩니다.</p>
        </div>
      </main>

      <!-- 하단 상태바 -->
      <footer class="kds-footer">
        <div class="status">
          <span>KDS v1.0 | 매장: ${store.name}</span>
        </div>
        <div class="last-update">
          <span id="lastUpdate">마지막 업데이트: 방금 전</span>
        </div>
      </footer>
    </div>

    <style>
      .simple-kds {
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
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
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
      }

      .store-info h1 {
        margin: 0 0 5px 0;
        font-size: 24px;
        font-weight: 700;
        color: #4fc3f7;
      }

      .current-time {
        font-size: 14px;
        color: #b0bec5;
        font-family: 'Courier New', monospace;
      }

      .stats {
        display: flex;
        gap: 30px;
      }

      .stat {
        text-align: center;
        background: rgba(255, 255, 255, 0.1);
        padding: 15px 20px;
        border-radius: 12px;
        min-width: 80px;
      }

      .stat .count {
        display: block;
        font-size: 28px;
        font-weight: 800;
        color: #81c784;
        font-family: 'Courier New', monospace;
      }

      .stat .label {
        font-size: 12px;
        color: #b0bec5;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .refresh-btn {
        background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .refresh-btn:hover {
        transform: translateY(-2px);
      }

      .kds-content {
        flex: 1;
        overflow: auto;
        padding: 20px;
      }

      .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
      }

      .order-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .order-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .order-card.pending {
        border-color: #ff9800;
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
      }

      .order-card.cooking {
        border-color: #f44336;
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
        animation: pulse 2s infinite;
      }

      .order-card.ready {
        border-color: #4caf50;
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .order-number {
        font-size: 20px;
        font-weight: 800;
        color: #4fc3f7;
        font-family: 'Courier New', monospace;
      }

      .order-time {
        font-size: 12px;
        color: #b0bec5;
        font-family: 'Courier New', monospace;
      }

      .order-meta {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .customer-name {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .table-info {
        font-size: 14px;
        color: #b0bec5;
      }

      .order-items {
        margin-bottom: 20px;
      }

      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        border-left: 4px solid #4fc3f7;
      }

      .item-name {
        font-weight: 600;
        margin-bottom: 2px;
      }

      .item-options {
        font-size: 12px;
        color: #b0bec5;
      }

      .item-quantity {
        background: #4fc3f7;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
      }

      .order-actions {
        display: flex;
        gap: 8px;
      }

      .action-btn {
        flex: 1;
        padding: 12px 16px;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.5px;
      }

      .action-btn:hover {
        transform: translateY(-1px);
      }

      .start-cooking-btn {
        background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
        color: white;
      }

      .complete-btn {
        background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
        color: white;
      }

      .serve-btn {
        background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
        color: white;
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #b0bec5;
      }

      .empty-state h2 {
        margin-bottom: 16px;
        color: #78909c;
      }

      .kds-footer {
        background: rgba(0, 0, 0, 0.3);
        padding: 15px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 14px;
        color: #b0bec5;
      }

      .orders-grid::-webkit-scrollbar {
        width: 8px;
      }

      .orders-grid::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }

      .orders-grid::-webkit-scrollbar-thumb {
        background: rgba(79, 195, 247, 0.6);
        border-radius: 4px;
      }
    </style>
  `;

  // 시간 업데이트 시작
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  console.log('✅ KDS 인터페이스 렌더링 완료');
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
async function loadKDSOrders(storeId) {
  try {
    console.log(`📟 매장 ${storeId} 주문 데이터 로딩`);

    const response = await fetch(`/api/kds/orders/${storeId}`);

    if (!response.ok) {
      throw new Error('주문 데이터 조회 실패');
    }

    const data = await response.json();

    if (data.success) {
      updateKDSOrderCards(data.orders);
      updateOrderCounts(data.orders);
      updateLastUpdateTime();
      console.log(`✅ 주문 데이터 로딩 완료 (${data.orders.length}개)`);
    } else {
      throw new Error(data.error || '데이터 조회 실패');
    }

  } catch (error) {
    console.error('❌ 주문 데이터 로딩 실패:', error);
    showErrorMessage();
  }
}

// 주문 카드 업데이트
function updateKDSOrderCards(orders) {
  const ordersGrid = document.getElementById('ordersGrid');
  const emptyState = document.getElementById('emptyState');

  if (!ordersGrid) return;

  ordersGrid.innerHTML = '';

  if (orders.length === 0) {
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

  const statusClass = order.cookingStatus?.toLowerCase() || 'pending';

  const card = document.createElement('div');
  card.className = `order-card ${statusClass}`;
  card.dataset.orderId = order.id;

  const itemsHTML = order.items?.map(item => `
    <div class="item">
      <div class="item-info">
        <div class="item-name">${item.menu_name}</div>
        ${item.options ? `<div class="item-options">${item.options}</div>` : ''}
      </div>
      <div class="item-quantity">×${item.quantity}</div>
    </div>
  `).join('') || '';

  const statusTexts = {
    'pending': '대기중',
    'cooking': '조리중', 
    'ready': '완료',
    'completed': '서빙완료'
  };

  card.innerHTML = `
    <div class="order-header">
      <div class="order-number">#${order.id}</div>
      <div class="order-time">${timeString}</div>
    </div>

    <div class="order-meta">
      <div class="customer-name">${order.customerName || '손님'}</div>
      <div class="table-info">
        ${order.table_number ? `테이블 ${order.table_number}` : '포장'} • 
        ${order.source === 'TLL' ? '📱 앱' : '🔴 POS'}
      </div>
    </div>

    <div class="order-items">
      ${itemsHTML}
    </div>

    <div class="order-actions">
      ${generateActionButtons(order)}
    </div>
  `;

  return card;
}

// 액션 버튼 생성
function generateActionButtons(order) {
  const status = order.cookingStatus;

  if (status === 'COMPLETED') {
    return '<div style="text-align: center; color: #4caf50; font-weight: 600;">✅ 서빙 완료</div>';
  }

  let buttons = [];

  if (status === 'PENDING' || !status) {
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
      hour12: false
    });
    lastUpdateEl.textContent = `마지막 업데이트: ${timeString}`;
  }
}

// 새로고침
function refreshKDS() {
  console.log('🔄 KDS 수동 새로고침');
  if (window.currentStoreId) {
    loadKDSOrders(window.currentStoreId);
  }
}

// 조리 시작
async function startCooking(orderId) {
  try {
    const response = await fetch(`/api/kds/orders/${orderId}/start-cooking`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      showNotification('조리를 시작했습니다', 'success');
      refreshKDS();
    } else {
      showNotification('조리 시작 실패: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('❌ 조리 시작 실패:', error);
    showNotification('조리 시작 중 오류가 발생했습니다', 'error');
  }
}

// 조리 완료
async function completeOrder(orderId) {
  try {
    const response = await fetch(`/api/kds/orders/${orderId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      showNotification('조리가 완료되었습니다', 'success');
      refreshKDS();
    } else {
      showNotification('조리 완료 실패: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('❌ 조리 완료 실패:', error);
    showNotification('조리 완료 중 오류가 발생했습니다', 'error');
  }
}

// 서빙 완료
async function serveOrder(orderId) {
  try {
    showNotification('서빙이 완료되었습니다', 'success');
    refreshKDS();
  } catch (error) {
    console.error('❌ 서빙 완료 실패:', error);
    showNotification('서빙 완료 중 오류가 발생했습니다', 'error');
  }
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
    top: 20px;
    right: 20px;
    background: ${typeColors[type] || typeColors.info};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s ease-out;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// 매장 선택 화면
function renderKDSStoreSelection() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: #4fc3f7;">📟 KDS</h1>
      <p style="margin: 20px 0; color: #b0bec5; font-size: 1.2rem;">매장을 선택하세요</p>

      <div style="margin: 30px 0; max-width: 400px; width: 100%;">
        <input 
          type="number" 
          id="storeIdInput" 
          placeholder="매장 ID를 입력하세요 (예: 1)" 
          style="width: 100%; padding: 16px; font-size: 18px; border: 2px solid #4fc3f7; border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; text-align: center; margin-bottom: 16px;"
          onkeypress="if(event.key === 'Enter') { enterKDSStore(); }"
        />
        <button 
          onclick="enterKDSStore()" 
          style="width: 100%; background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%); color: white; border: none; padding: 16px 32px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;"
        >
          🚀 KDS 접속
        </button>
      </div>

      <div style="margin: 20px 0; color: #78909c; font-size: 14px;">
        <p>📝 사용법: kds.html?storeId=1</p>
      </div>
    </div>
  `;
}

// 에러 화면
function renderKDSError() {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: #f44336;">❌ KDS 로딩 실패</h1>
      <p style="margin: 20px 0; color: #b0bec5; font-size: 1.2rem;">시스템 오류가 발생했습니다.</p>
      <button onclick="window.location.reload()" style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border: none; padding: 16px 32px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 2rem;">
        🔄 새로고침
      </button>
    </div>
  `;
}

// 에러 메시지 표시
function showErrorMessage() {
  const ordersGrid = document.getElementById('ordersGrid');
  const emptyState = document.getElementById('emptyState');

  if (ordersGrid) {
    ordersGrid.innerHTML = '';
  }

  if (emptyState) {
    emptyState.innerHTML = `
      <h2>❌ 데이터 로딩 실패</h2>
      <p>네트워크 연결을 확인하고 다시 시도해주세요.</p>
      <button onclick="refreshKDS()" style="background: #4fc3f7; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 16px;">
        다시 시도
      </button>
    `;
    emptyState.style.display = 'block';
  }
}

// KDS 매장 접속
function enterKDSStore() {
  const storeIdInput = document.getElementById('storeIdInput');
  const storeId = parseInt(storeIdInput.value);

  if (!storeId || isNaN(storeId) || storeId <= 0) {
    alert('올바른 매장 ID를 입력해주세요.');
    storeIdInput.focus();
    return;
  }

  console.log(`🚀 매장 ${storeId} KDS 접속`);
  const newUrl = `${window.location.pathname}?storeId=${storeId}`;
  window.location.href = newUrl;
}

// CSS 애니메이션
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// 전역 함수로 노출
window.renderKDS = renderKDS;
window.enterKDSStore = enterKDSStore;
window.startCooking = startCooking;
window.completeOrder = completeOrder;
window.serveOrder = serveOrder;
window.refreshKDS = refreshKDS;

console.log('✅ Simple KDS 시스템 로드 완료');