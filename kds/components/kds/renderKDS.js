// KDS 메인 렌더링 함수
async function renderKDS() {
  const main = document.getElementById('main');

  try {
    console.log('📟 KDS 페이지 로딩 시작');

    // URL에서 매장 ID 추출
    const urlPath = window.location.pathname;
    const pathSegments = urlPath.split('/');
    console.log('🔍 URL 경로 분석:', pathSegments);

    let storeId = null;

    if (pathSegments[1] === 'kds' && pathSegments[2]) {
      storeId = parseInt(pathSegments[2]);
      console.log('🎯 경로에서 매장 ID 추출:', storeId);
    }

    if (!storeId || isNaN(storeId)) {
      console.log('❌ 유효하지 않은 매장 ID, 매장 선택 화면으로 이동');
      renderKDSStoreSelection();
      return;
    }

    console.log('📟 KDS 페이지 진입, 매장 ID:', storeId);

    // 전역 매장 ID 설정
    window.currentStoreId = storeId;

    // KDS 메인 화면 렌더링
    await renderKDSMain(storeId);

  } catch (error) {
    console.error('❌ KDS 페이지 로딩 실패:', error);
    renderKDSError();
  }
}

// KDS 메인 화면 렌더링
async function renderKDSMain(storeId) {
  console.log('📟 KDS 메인 함수 호출됨');
  console.log('📟 KDS 매장 ID:', storeId, '(타입:', typeof storeId, ')');

  const main = document.getElementById('main');

  try {
    // 매장 정보 조회
    console.log('🔍 KDS - 매장', storeId, '정보 조회 시작');
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
    console.log('✅ KDS 매장 정보 조회 완료:', store.name);

    // KDS 화면 렌더링
    renderKDSInterface(store);

    // 주문 데이터 로딩
    await loadKDSOrders(storeId);

    // 자동 새로고침 설정
    setupKDSAutoRefresh(storeId);

  } catch (error) {
    console.error('❌ KDS 메인 화면 렌더링 실패:', error);
    renderKDSError();
  }
}

// KDS 인터페이스 렌더링
function renderKDSInterface(store) {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div class="kds-container">
      <!-- KDS 헤더 -->
      <div class="kds-header">
        <div class="header-left">
          <div class="date-time">
            <div class="date">27 Sep 2019</div>
            <div class="time" id="currentTime">10:31:35 PM</div>
          </div>
        </div>
        <div class="header-center">
          <div class="pagination">
            <button class="nav-btn">◀</button>
            <span class="page-info">Page 1 / 1</span>
            <button class="nav-btn">▶</button>
          </div>
        </div>
        <div class="header-right">
          <div class="control-buttons">
            <button class="ctrl-btn orders-btn">Orders</button>
            <button class="ctrl-btn functions-btn">Functions</button>
            <button class="ctrl-btn settings-btn">⚙</button>
            <button class="ctrl-btn exit-btn">✖</button>
          </div>
        </div>
      </div>

      <!-- 주문 그리드 -->
      <div class="orders-grid" id="ordersGrid">
        <!-- 주문 카드들이 여기에 동적으로 생성됩니다 -->
      </div>

      <!-- 하단 상태바 -->
      <div class="status-bar">
        <div class="status-left">
          <button class="status-btn">Filter - All Order</button>
        </div>
        <div class="status-center">
          <button class="status-btn">View By : GRILL</button>
        </div>
        <div class="status-right">
          <button class="status-btn">History</button>
          <div class="version">Version 6.4.36</div>
        </div>
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
        background: #1a1a1a;
        color: white;
        overflow: hidden;
      }

      .kds-container {
        width: 1920px;
        height: 1080px;
        background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 0;
        left: 0;
        transform-origin: top left;
        transform: scale(calc(100vw / 1920), calc(100vh / 1080));
      }

      /* 헤더 스타일 */
      .kds-header {
        height: 80px;
        background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
        border-bottom: 2px solid #555;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 30px;
      }

      .header-left .date-time {
        text-align: left;
      }

      .date {
        font-size: 16px;
        color: #ccc;
        margin-bottom: 2px;
      }

      .time {
        font-size: 20px;
        font-weight: bold;
        color: #fff;
        font-family: 'Courier New', monospace;
      }

      .header-center .pagination {
        display: flex;
        align-items: center;
        gap: 1.5vw;
        background: #666;
        padding: 0.8vh 1.5vw;
        border-radius: 6px;
      }

      .nav-btn {
        background: #555;
        border: none;
        color: white;
        padding: 0.8vh 1vw;
        border-radius: 4px;
        cursor: pointer;
        font-size: clamp(12px, 1vw, 14px);
      }

      .page-info {
        color: white;
        font-weight: bold;
        font-size: clamp(14px, 1.2vw, 16px);
        min-width: 5vw;
        text-align: center;
      }

      .header-right .control-buttons {
        display: flex;
        gap: 10px;
      }

      .ctrl-btn {
        background: #666;
        border: none;
        color: white;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .ctrl-btn:hover {
        background: #777;
      }

      .orders-btn { background: #4a90e2; }
      .functions-btn { background: #7b68ee; }
      .settings-btn { background: #666; }
      .exit-btn { background: #e74c3c; }

      /* 주문 그리드 */
      .orders-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 20px;
        padding: 20px;
        overflow: hidden;
      }

      /* 주문 카드 */
      .order-card {
        background: linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%);
        border: 2px solid #555;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .order-card:hover {
        border-color: #777;
        transform: translateY(-2px);
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .order-type {
        background: #4a90e2;
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }

      .order-time {
        color: #ccc;
        font-size: 14px;
        font-family: 'Courier New', monospace;
      }

      .order-number {
        font-size: 24px;
        font-weight: bold;
        color: #4a90e2;
        margin-bottom: 10px;
      }

      .order-status {
        font-size: clamp(13px, 1.2vw, 16px);
        font-weight: bold;
        margin-bottom: 1.2vh;
        padding: 0.8vh;
        border-radius: 6px;
        text-align: center;
      }

      .order-status.pending {
        background: #f39c12;
        color: white;
      }

      .order-status.cooking {
        background: #e74c3c;
        color: white;
      }

      .order-status.completed {
        background: #27ae60;
        color: white;
      }

      .order-items {
        flex: 1;
        margin-bottom: 1.2vh;
        overflow-y: auto;
      }

      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5vh 0;
        border-bottom: 1px solid #444;
        color: #ddd;
        font-size: clamp(11px, 1vw, 14px);
      }

      .qty {
        background: #666;
        color: white;
        padding: 0.2vh 0.6vw;
        border-radius: 12px;
        font-size: clamp(10px, 0.8vw, 12px);
        font-weight: bold;
      }

      .order-actions {
        display: flex;
        gap: 0.8vw;
      }

      .action-btn {
        flex: 1;
        padding: 1vh;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: clamp(11px, 1vw, 14px);
        font-weight: bold;
        transition: all 0.2s ease;
      }

      .start-btn {
        background: #27ae60;
        color: white;
      }

      .start-btn:hover {
        background: #229954;
      }

      .cancel-btn {
        background: #e74c3c;
        color: white;
      }

      .cancel-btn:hover {
        background: #c0392b;
      }

      .order-timer {
        position: absolute;
        top: 1.5vw;
        right: 1.5vw;
        background: #e74c3c;
        color: white;
        padding: 0.8vh 1vw;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
      }

      .timer-display {
        font-size: clamp(12px, 1.2vw, 16px);
      }

      /* 하단 상태바 */
      .status-bar {
        height: 6vh;
        min-height: 50px;
        background: linear-gradient(135deg, #7b68ee 0%, #6a5acd 100%);
        border-top: 2px solid #555;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2vw;
      }

      .status-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 1vh 1.5vw;
        border-radius: 6px;
        cursor: pointer;
        font-size: clamp(11px, 1vw, 14px);
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .status-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .status-right {
        display: flex;
        align-items: center;
        gap: 1.5vw;
      }

      .version {
        color: rgba(255, 255, 255, 0.8);
        font-size: clamp(10px, 0.8vw, 12px);
        font-family: 'Courier New', monospace;
      }

      /* 조리 중인 카드 특별 스타일 */
      .order-card[data-order-id="2"],
      .order-card[data-order-id="5"],
      .order-card[data-order-id="6"] {
        border-color: #e74c3c;
        background: linear-gradient(135deg, #4a2a2a 0%, #3a1a1a 100%);
      }

      .order-card[data-order-id="2"] .order-timer .timer-display,
      .order-card[data-order-id="5"] .order-timer .timer-display,
      .order-card[data-order-id="6"] .order-timer .timer-display {
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }

      /* 대기 중인 주문 스타일 */
      .order-card[data-order-id="1"],
      .order-card[data-order-id="3"],
      .order-card[data-order-id="4"] {
        border-color: #f39c12;
        background: linear-gradient(135deg, #3a3520 0%, #2a2510 100%);
      }
    </style>
  `;

  // 이벤트 리스너 설정
  setupKDSEventListeners(store);

  // 시간 업데이트 시작
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  console.log('✅ KDS 인터페이스 렌더링 완료');
}

// KDS 이벤트 리스너 설정
function setupKDSEventListeners(store) {
  // 주문 카드 클릭 이벤트
  document.querySelectorAll('.order-card').forEach(card => {
    card.addEventListener('click', function(e) {
      // Action buttons are not part of the order card click
      if (!e.target.classList.contains('action-btn') && !e.target.classList.contains('start-btn') && !e.target.classList.contains('cancel-btn')) {
        const orderId = this.dataset.orderId;
        showOrderDetail(orderId);
      }
    });
  });

  // 액션 버튼 이벤트
  document.querySelectorAll('.start-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const orderId = this.closest('.order-card').dataset.orderId;
      startCooking(orderId);
    });
  });

  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const orderId = this.closest('.order-card').dataset.orderId;
      cancelOrder(orderId);
    });
  });

  // 헤더 버튼 이벤트
  document.querySelector('.exit-btn')?.addEventListener('click', () => {
    window.location.href = '/';
  });

  document.querySelector('.settings-btn')?.addEventListener('click', () => {
    alert('설정 기능은 곧 추가될 예정입니다.');
  });
}

// 현재 시간 업데이트
function updateCurrentTime() {
  const timeElement = document.getElementById('currentTime');
  if (timeElement) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    timeElement.textContent = timeString;
  }
}

// 주문 데이터 로딩 (placeholder, actual implementation needed for dynamic data)
async function loadKDSOrders(storeId) {
  try {
    console.log(`📟 KDS - 매장 ${storeId} 주문 데이터 로딩 시작`);

    // Placeholder for actual API call to fetch orders
    // For now, we'll use the static data already in the HTML for demonstration
    // In a real application, this would fetch from `/api/orders/kds/${storeId}`

    // Example of how you might update if you had actual data:
    // const response = await fetch(`/api/orders/kds/${storeId}`);
    // if (!response.ok) throw new Error('주문 데이터 조회 실패');
    // const data = await response.json();
    // updateOrderCards(data.orders);
    // updateOrderCounts(data.orders);

    console.log(`✅ KDS 주문 데이터 로딩 완료 (using static data for now)`);

  } catch (error) {
    console.error('❌ KDS 주문 데이터 로딩 실패:', error);
  }
}

// 주문 카드 업데이트 (placeholder, as static data is used in renderKDSInterface)
function updateOrderCards(orders) {
  // This function would dynamically render order cards based on fetched data.
  // Currently, the cards are hardcoded in renderKDSInterface.
  console.log("updateOrderCards called, but using static data.");
}

// 주문 섹션 업데이트 (placeholder)
function updateOrderSection(containerId, orders, status) {
  // This function would dynamically render order cards based on fetched data.
  console.log(`updateOrderSection called for ${containerId}`);
}

// 주문 카운트 업데이트 (placeholder)
function updateOrderCounts(orders) {
  // This function would update the count display for each order status.
  console.log("updateOrderCounts called, but using static data.");
}

// 조리 시작
function startCooking(orderId) {
  console.log('🍳 조리 시작:', orderId);
  const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
  if (orderCard) {
    // UI 업데이트
    const status = orderCard.querySelector('.order-status');
    const actions = orderCard.querySelector('.order-actions');
    const orderHeader = orderCard.querySelector('.order-header');
    const orderItems = orderCard.querySelector('.order-items');

    status.textContent = 'Cooking in Progress';
    status.className = 'order-status cooking'; // Change status class for styling

    // 타이머 추가
    if (!orderCard.querySelector('.order-timer')) {
      const timer = document.createElement('div');
      timer.className = 'order-timer';
      timer.innerHTML = '<div class="timer-display">00:00</div>';
      orderCard.appendChild(timer);

      // Start the timer
      startTimer(orderId);
    }

    // 액션 버튼 숨김
    if (actions) {
      actions.style.display = 'none';
    }

    // 카드 스타일 변경 (adjust as needed)
    orderCard.style.borderColor = '#e74c3c'; // Red border for cooking
    orderCard.style.background = 'linear-gradient(135deg, #4a2a2a 0%, #3a1a1a 100%)'; // Dark red background

    // Ensure the order status is correctly styled for 'cooking'
    if (orderCard.querySelector('.order-status')) {
      orderCard.querySelector('.order-status').classList.add('cooking');
    }
  }
}

// 주문 취소
function cancelOrder(orderId) {
  console.log('❌주문 취소:', orderId);
  if (confirm('이 주문을 취소하시겠습니까?')) {
    const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
    if (orderCard) {
      // Dim the card and change status to "Cancelled"
      orderCard.style.opacity = '0.5';
      orderCard.style.filter = 'grayscale(100%)';

      const status = orderCard.querySelector('.order-status');
      if (status) {
        status.textContent = 'Cancelled';
        status.className = 'order-status'; // Reset classes
        // Apply a specific style for cancelled status if needed
        status.style.background = '#95a5a6'; // Grey background
      }

      const actions = orderCard.querySelector('.order-actions');
      if (actions) {
        actions.style.display = 'none'; // Hide action buttons
      }

      // Stop any running timer for this order
      const timerId = orderCard.dataset.timerId;
      if (timerId) {
        clearInterval(parseInt(timerId));
        delete orderCard.dataset.timerId;
      }
    }
  }
}

// 타이머 시작
function startTimer(orderId) {
  const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
  const timerDisplay = orderCard?.querySelector('.timer-display');

  if (!timerDisplay) return;

  let seconds = 0;
  const interval = setInterval(() => {
    seconds++;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Apply pulse animation if it's not already applied
    if (!timerDisplay.style.animation) {
        timerDisplay.style.animation = 'pulse 1s infinite';
    }
  }, 1000);

  // Store the interval ID on the card element
  if (orderCard) {
    orderCard.dataset.timerId = interval;
  }
}

// 주문 상세 보기
function showOrderDetail(orderId) {
  console.log('📋 주문 상세 보기:', orderId);
  alert(`주문 #${orderId} 상세 정보\n(상세 모달은 곧 구현될 예정입니다)`);
}

// KDS 자동 새로고침 설정
function setupKDSAutoRefresh(storeId) {
  // 30초마다 주문 데이터 새로고침
  setInterval(() => {
    console.log('🔄 KDS 자동 새로고침');
    loadKDSOrders(storeId);
  }, 30000);
}

// 매장 선택 화면 렌더링
function renderKDSStoreSelection() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div style="padding: 40px; text-align: center; background: #1a1a1a; color: white; min-height: 100vh;">
      <h1>📟 KDS - 매장을 선택하세요</h1>
      <p style="margin: 20px 0; color: #aaa;">올바른 매장 ID가 필요합니다.</p>
      <button onclick="window.location.href='/'" style="background: #4fc3f7; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        로그인 화면으로 돌아가기
      </button>
    </div>
  `;
}

// 에러 화면 렌더링
function renderKDSError() {
  const main = document.getElementById('main');

  main.innerHTML = `
    <div style="padding: 40px; text-align: center; background: #1a1a1a; color: white; min-height: 100vh;">
      <h1>❌ KDS 로딩 실패</h1>
      <p style="margin: 20px 0; color: #aaa;">매장 정보를 불러올 수 없습니다.</p>
      <button onclick="window.location.href='/'" style="background: #f44336; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        로그인 화면으로 돌아가기
      </button>
    </div>
  `;
}

// 전역 함수로 노출
window.renderKDS = renderKDS;
window.showOrderDetail = showOrderDetail;
window.startCooking = startCooking;
window.cancelOrder = cancelOrder;
window.loadKDSOrders = loadKDSOrders; // Added for potential external use or testing

console.log('✅ KDS 시스템 로드 완료');