
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
          <div class="summary-info">
            <div class="summary-row">DFC: 1163</div>
            <div class="summary-row">DFC SOLD: 1</div>
            <div class="summary-row">DFC COMBO: 1474</div>
            <div class="summary-row">DFC Meals & Total: 8</div>
            <div class="summary-row">8</div>
          </div>
        </div>
      </div>

      <!-- 주문 그리드 -->
      <div class="orders-grid" id="ordersGrid">
        <!-- 주문 카드 1 -->
        <div class="order-card pending" data-order-id="1">
          <div class="order-header">
            <div class="order-number">#101</div>
            <div class="order-type">Take Away</div>
          </div>
          <div class="order-time">12:45 PM</div>
          <div class="order-status pending">REGULAR</div>
          <div class="order-items">
            <div class="item">
              <span class="item-name">Chinese Fries</span>
              <span class="qty">1</span>
            </div>
            <div class="item">
              <span class="item-name">Rice</span>
              <span class="qty">1</span>
            </div>
            <div class="item">
              <span class="item-name">Modified Protein</span>
              <span class="qty">1</span>
            </div>
            <div class="item">
              <span class="item-name">Gravy</span>
              <span class="qty">1</span>
            </div>
          </div>
          <div class="order-actions">
            <button class="action-btn start-btn" onclick="startCooking(1)">Start</button>
            <button class="action-btn cancel-btn" onclick="cancelOrder(1)">Cancel</button>
          </div>
        </div>

        <!-- 주문 카드 2 (조리중) -->
        <div class="order-card cooking" data-order-id="2">
          <div class="order-header">
            <div class="order-number">#102</div>
            <div class="order-type">Take Away</div>
          </div>
          <div class="order-time">12:50 PM</div>
          <div class="order-status cooking">MEDIUM-C</div>
          <div class="order-items">
            <div class="item">
              <span class="item-name">Modified Protein</span>
              <span class="qty">1</span>
            </div>
            <div class="item">
              <span class="item-name">Gravy</span>
              <span class="qty">1</span>
            </div>
          </div>
          <div class="order-timer">
            <div class="timer-display">05:23</div>
          </div>
        </div>

        <!-- 주문 카드 3 -->
        <div class="order-card pending" data-order-id="3">
          <div class="order-header">
            <div class="order-number">#103</div>
            <div class="order-type">Dine In</div>
          </div>
          <div class="order-time">1:15 PM</div>
          <div class="order-status pending">LARGE SPECIAL COMBO LARGE</div>
          <div class="order-items">
            <div class="item">
              <span class="item-name">Chinese Fries</span>
              <span class="qty">2</span>
            </div>
            <div class="item">
              <span class="item-name">Rice</span>
              <span class="qty">2</span>
            </div>
            <div class="item">
              <span class="item-name">Modified Protein</span>
              <span class="qty">2</span>
            </div>
            <div class="item">
              <span class="item-name">Gravy</span>
              <span class="qty">2</span>
            </div>
          </div>
          <div class="order-actions">
            <button class="action-btn start-btn" onclick="startCooking(3)">Start</button>
            <button class="action-btn cancel-btn" onclick="cancelOrder(3)">Cancel</button>
          </div>
        </div>

        <!-- 주문 카드 4 -->
        <div class="order-card pending" data-order-id="4">
          <div class="order-header">
            <div class="order-number">#104</div>
            <div class="order-type">Take Away</div>
          </div>
          <div class="order-time">1:20 PM</div>
          <div class="order-status pending">HOT + SPICY - 1</div>
          <div class="order-items">
            <div class="item">
              <span class="item-name">Modified Protein</span>
              <span class="qty">1</span>
            </div>
            <div class="item">
              <span class="item-name">Modified Protein</span>
              <span class="qty">1</span>
            </div>
            <div class="item">
              <span class="item-name">Chinese Sauce</span>
              <span class="qty">1</span>
            </div>
          </div>
          <div class="order-actions">
            <button class="action-btn start-btn" onclick="startCooking(4)">Start</button>
            <button class="action-btn cancel-btn" onclick="cancelOrder(4)">Cancel</button>
          </div>
        </div>

        <!-- 주문 카드 5 (조리중) -->
        <div class="order-card cooking" data-order-id="5">
          <div class="order-header">
            <div class="order-number">#105</div>
            <div class="order-type">Dine In</div>
          </div>
          <div class="order-time">1:25 PM</div>
          <div class="order-status cooking">REGULAR - 1</div>
          <div class="order-items">
            <div class="item">
              <span class="item-name">Modified Protein</span>
              <span class="qty">1</span>
            </div>
            <div class="item">
              <span class="item-name">Chinese</span>
              <span class="qty">1</span>
            </div>
          </div>
          <div class="order-timer">
            <div class="timer-display">02:47</div>
          </div>
        </div>

        <!-- 주문 카드 6 (조리중) -->
        <div class="order-card cooking" data-order-id="6">
          <div class="order-header">
            <div class="order-number">#106</div>
            <div class="order-type">Take Away</div>
          </div>
          <div class="order-time">1:30 PM</div>
          <div class="order-status cooking">LARGE SPECIAL COMBO LARGE</div>
          <div class="order-items">
            <div class="item">
              <span class="item-name">Modified Protein</span>
              <span class="qty">2</span>
            </div>
            <div class="item">
              <span class="item-name">Chinese</span>
              <span class="qty">1</span>
            </div>
          </div>
          <div class="order-timer">
            <div class="timer-display">01:12</div>
          </div>
        </div>
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
        width: 1200px;
        height: 500px;
        background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
        display: flex;
        flex-direction: column;
        margin: 20px auto;
        border: 2px solid #444;
        border-radius: 8px;
      }

      /* 헤더 스타일 */
      .kds-header {
        height: 60px;
        background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
        border-bottom: 2px solid #555;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
      }

      .header-left .date-time {
        text-align: left;
      }

      .date {
        font-size: 12px;
        color: #ccc;
        margin-bottom: 2px;
      }

      .time {
        font-size: 14px;
        font-weight: bold;
        color: #fff;
        font-family: 'Courier New', monospace;
      }

      .header-center .pagination {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #666;
        padding: 8px 15px;
        border-radius: 6px;
      }

      .nav-btn {
        background: #555;
        border: none;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .page-info {
        color: white;
        font-weight: bold;
        font-size: 12px;
        min-width: 60px;
        text-align: center;
      }

      .header-right {
        display: flex;
        gap: 15px;
        align-items: center;
      }

      .control-buttons {
        display: flex;
        gap: 8px;
      }

      .ctrl-btn {
        background: #666;
        border: none;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
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

      .summary-info {
        font-size: 10px;
        color: #ccc;
        text-align: right;
      }

      .summary-row {
        margin-bottom: 1px;
      }

      /* 주문 그리드 */
      .orders-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 8px;
        padding: 10px;
        overflow: hidden;
      }

      /* 주문 카드 */
      .order-card {
        background: linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%);
        border: 2px solid #555;
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 11px;
      }

      .order-card:hover {
        border-color: #777;
        transform: translateY(-1px);
      }

      .order-card.pending {
        border-color: #f39c12;
        background: linear-gradient(135deg, #3a3520 0%, #2a2510 100%);
      }

      .order-card.cooking {
        border-color: #e74c3c;
        background: linear-gradient(135deg, #4a2a2a 0%, #3a1a1a 100%);
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .order-number {
        font-size: 16px;
        font-weight: bold;
        color: #4a90e2;
      }

      .order-type {
        background: #4a90e2;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
      }

      .order-time {
        color: #ccc;
        font-size: 11px;
        font-family: 'Courier New', monospace;
        margin-bottom: 8px;
      }

      .order-status {
        font-size: 11px;
        font-weight: bold;
        margin-bottom: 8px;
        padding: 6px;
        border-radius: 4px;
        text-align: center;
        word-wrap: break-word;
        line-height: 1.2;
      }

      .order-status.pending {
        background: #f39c12;
        color: white;
      }

      .order-status.cooking {
        background: #e74c3c;
        color: white;
      }

      .order-items {
        flex: 1;
        margin-bottom: 8px;
        overflow-y: auto;
      }

      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 0;
        border-bottom: 1px solid #444;
        color: #ddd;
        font-size: 10px;
      }

      .item:last-child {
        border-bottom: none;
      }

      .item-name {
        flex: 1;
        margin-right: 8px;
        word-wrap: break-word;
      }

      .qty {
        background: #666;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 9px;
        font-weight: bold;
        min-width: 20px;
        text-align: center;
      }

      .order-actions {
        display: flex;
        gap: 6px;
      }

      .action-btn {
        flex: 1;
        padding: 6px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
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
        top: 10px;
        right: 10px;
        background: #e74c3c;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
      }

      .timer-display {
        font-size: 11px;
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }

      /* 하단 상태바 */
      .status-bar {
        height: 40px;
        background: linear-gradient(135deg, #7b68ee 0%, #6a5acd 100%);
        border-top: 2px solid #555;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
      }

      .status-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .status-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .status-right {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .version {
        color: rgba(255, 255, 255, 0.8);
        font-size: 10px;
        font-family: 'Courier New', monospace;
      }

      /* 조리중인 카드 숨김 처리 */
      .order-card.cooking .order-actions {
        display: none;
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
      if (!e.target.classList.contains('action-btn') && !e.target.classList.contains('start-btn') && !e.target.classList.contains('cancel-btn')) {
        const orderId = this.dataset.orderId;
        showOrderDetail(orderId);
      }
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

// 주문 데이터 로딩
async function loadKDSOrders(storeId) {
  try {
    console.log(`📟 KDS - 매장 ${storeId} 주문 데이터 로딩 시작`);
    console.log(`✅ KDS 주문 데이터 로딩 완료 (더미 데이터 사용)`);
  } catch (error) {
    console.error('❌ KDS 주문 데이터 로딩 실패:', error);
  }
}

// 조리 시작
function startCooking(orderId) {
  console.log('🍳 조리 시작:', orderId);
  const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
  if (orderCard) {
    const status = orderCard.querySelector('.order-status');
    const actions = orderCard.querySelector('.order-actions');

    status.textContent = 'Cooking in Progress';
    status.className = 'order-status cooking';

    // 타이머 추가
    if (!orderCard.querySelector('.order-timer')) {
      const timer = document.createElement('div');
      timer.className = 'order-timer';
      timer.innerHTML = '<div class="timer-display">00:00</div>';
      orderCard.appendChild(timer);
      startTimer(orderId);
    }

    // 액션 버튼 숨김
    if (actions) {
      actions.style.display = 'none';
    }

    // 카드 스타일 변경
    orderCard.className = 'order-card cooking';
  }
}

// 주문 취소
function cancelOrder(orderId) {
  console.log('❌주문 취소:', orderId);
  if (confirm('이 주문을 취소하시겠습니까?')) {
    const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
    if (orderCard) {
      orderCard.style.opacity = '0.5';
      orderCard.style.filter = 'grayscale(100%)';

      const status = orderCard.querySelector('.order-status');
      if (status) {
        status.textContent = 'Cancelled';
        status.style.background = '#95a5a6';
      }

      const actions = orderCard.querySelector('.order-actions');
      if (actions) {
        actions.style.display = 'none';
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
  }, 1000);

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

console.log('✅ KDS 시스템 로드 완료');
