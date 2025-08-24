
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
        <div class="store-info">
          <h1>📟 ${store.name} - 주방 디스플레이</h1>
          <div class="header-controls">
            <div class="current-time" id="currentTime"></div>
            <button id="refreshBtn" class="refresh-btn">🔄 새로고침</button>
            <button id="settingsBtn" class="settings-btn">⚙️</button>
            <button id="backToLogin" class="back-btn">← 로그인</button>
          </div>
        </div>
      </div>

      <!-- 주문 상태 섹션 -->
      <div class="orders-grid">
        <!-- 긴급 주문 -->
        <div class="order-section urgent-section">
          <div class="section-header urgent-header">
            <h2>🚨 긴급 주문</h2>
            <span class="order-count" id="urgentCount">0</span>
          </div>
          <div class="orders-list" id="urgentOrders">
            <div class="no-orders">현재 긴급 주문이 없습니다</div>
          </div>
        </div>

        <!-- 대기 중인 주문 -->
        <div class="order-section pending-section">
          <div class="section-header pending-header">
            <h2>📋 대기 주문</h2>
            <span class="order-count" id="pendingCount">0</span>
          </div>
          <div class="orders-list" id="pendingOrders">
            <div class="no-orders">현재 대기 중인 주문이 없습니다</div>
          </div>
        </div>

        <!-- 조리 중인 주문 -->
        <div class="order-section cooking-section">
          <div class="section-header cooking-header">
            <h2>🍳 조리 중</h2>
            <span class="order-count" id="cookingCount">0</span>
          </div>
          <div class="orders-list" id="cookingOrders">
            <div class="no-orders">현재 조리 중인 주문이 없습니다</div>
          </div>
        </div>

        <!-- 완료된 주문 -->
        <div class="order-section completed-section">
          <div class="section-header completed-header">
            <h2>✅ 완료</h2>
            <span class="order-count" id="completedCount">0</span>
          </div>
          <div class="orders-list" id="completedOrders">
            <div class="no-orders">완료된 주문이 없습니다</div>
          </div>
        </div>
      </div>

      <!-- 주문 상세 모달 -->
      <div id="orderDetailModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>주문 상세 정보</h3>
            <button class="close-btn" onclick="closeOrderDetail()">×</button>
          </div>
          <div class="modal-body" id="orderDetailContent">
            <!-- 주문 상세 내용이 여기에 표시됩니다 -->
          </div>
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
        overflow-x: auto;
      }

      .kds-container {
        min-height: 100vh;
        padding: 20px;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      }

      .kds-header {
        background: #2d2d2d;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .store-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }

      .store-info h1 {
        font-size: 28px;
        font-weight: 700;
        color: #4fc3f7;
        margin: 0;
      }

      .header-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .current-time {
        background: #333;
        padding: 8px 16px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 16px;
        color: #4fc3f7;
        min-width: 200px;
        text-align: center;
      }

      .refresh-btn, .settings-btn, .back-btn {
        background: #4fc3f7;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .refresh-btn:hover, .settings-btn:hover {
        background: #29b6f6;
        transform: translateY(-1px);
      }

      .back-btn {
        background: #666;
      }

      .back-btn:hover {
        background: #777;
      }

      .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 24px;
        margin-top: 24px;
      }

      .order-section {
        background: #2d2d2d;
        border-radius: 16px;
        padding: 0;
        box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2);
        border: 2px solid transparent;
        transition: all 0.3s ease;
        min-height: 400px;
        display: flex;
        flex-direction: column;
      }

      .urgent-section {
        border-color: #f44336;
        background: linear-gradient(135deg, #2d2d2d 0%, #3d1a1a 100%);
      }

      .pending-section {
        border-color: #ff9800;
        background: linear-gradient(135deg, #2d2d2d 0%, #3d2f1a 100%);
      }

      .cooking-section {
        border-color: #2196f3;
        background: linear-gradient(135deg, #2d2d2d 0%, #1a2f3d 100%);
      }

      .completed-section {
        border-color: #4caf50;
        background: linear-gradient(135deg, #2d2d2d 0%, #1a3d1a 100%);
      }

      .section-header {
        padding: 20px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px 16px 0 0;
      }

      .urgent-header {
        background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      }

      .pending-header {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      }

      .cooking-header {
        background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      }

      .completed-header {
        background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
      }

      .section-header h2 {
        font-size: 20px;
        font-weight: 700;
        margin: 0;
        color: white;
      }

      .order-count {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 700;
        min-width: 30px;
        text-align: center;
      }

      .orders-list {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        max-height: 500px;
      }

      .no-orders {
        text-align: center;
        color: #888;
        font-style: italic;
        padding: 40px 20px;
        font-size: 16px;
      }

      .order-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .order-card:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .order-number {
        font-size: 18px;
        font-weight: 700;
        color: #4fc3f7;
      }

      .order-time {
        font-size: 12px;
        color: #aaa;
        font-family: 'Courier New', monospace;
      }

      .order-items {
        margin-bottom: 12px;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .order-item:last-child {
        border-bottom: none;
      }

      .item-name {
        font-weight: 500;
        color: #fff;
      }

      .item-quantity {
        background: #4fc3f7;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .order-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }

      .action-btn {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .start-cooking-btn {
        background: #2196f3;
        color: white;
      }

      .complete-btn {
        background: #4caf50;
        color: white;
      }

      .cancel-btn {
        background: #f44336;
        color: white;
      }

      .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }

      .modal-content {
        background: #2d2d2d;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: #4fc3f7;
        color: white;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
      }

      .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .modal-body {
        padding: 24px;
        overflow-y: auto;
        max-height: 60vh;
      }

      @media (max-width: 768px) {
        .orders-grid {
          grid-template-columns: 1fr;
        }

        .store-info {
          flex-direction: column;
          align-items: flex-start;
        }

        .store-info h1 {
          font-size: 24px;
        }

        .header-controls {
          width: 100%;
          justify-content: space-between;
        }
      }

      @media (max-width: 480px) {
        .kds-container {
          padding: 12px;
        }

        .kds-header {
          padding: 16px;
        }

        .orders-grid {
          gap: 16px;
        }

        .order-section {
          min-height: 300px;
        }
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
  const refreshBtn = document.getElementById('refreshBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const backToLogin = document.getElementById('backToLogin');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      console.log('🔄 수동 새로고침 실행');
      loadKDSOrders(store.id);
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      console.log('⚙️ KDS 설정 (미구현)');
      alert('설정 기능은 곧 추가될 예정입니다.');
    });
  }

  if (backToLogin) {
    backToLogin.addEventListener('click', () => {
      window.location.href = '/';
    });
  }
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

// KDS 주문 데이터 로딩
async function loadKDSOrders(storeId) {
  try {
    console.log('📋 KDS 주문 데이터 로딩 시작:', storeId);
    
    const response = await fetch(`/api/stores/${storeId}/orders?status=all`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error('주문 데이터 조회 실패');
    }

    const data = await response.json();
    
    if (data.success && data.orders) {
      console.log('✅ KDS 주문 데이터 수신:', data.orders.length, '개');
      displayKDSOrders(data.orders);
    } else {
      console.log('📋 주문 데이터가 없습니다');
      displayKDSOrders([]);
    }
    
  } catch (error) {
    console.error('❌ KDS 주문 데이터 로딩 실패:', error);
    displayKDSOrders([]);
  }
}

// KDS 주문 표시
function displayKDSOrders(orders) {
  // 주문을 상태별로 분류
  const categorizedOrders = {
    urgent: [],
    pending: [],
    cooking: [],
    completed: []
  };

  const now = new Date();
  
  orders.forEach(order => {
    const orderTime = new Date(order.created_at || order.order_date);
    const timeDiff = (now - orderTime) / (1000 * 60); // 분 단위
    
    // 20분 이상 된 주문은 긴급으로 분류
    if (timeDiff > 20 && (order.status === 'pending' || order.status === 'cooking')) {
      categorizedOrders.urgent.push(order);
    } else {
      switch (order.status) {
        case 'pending':
          categorizedOrders.pending.push(order);
          break;
        case 'cooking':
          categorizedOrders.cooking.push(order);
          break;
        case 'completed':
          categorizedOrders.completed.push(order);
          break;
        default:
          categorizedOrders.pending.push(order);
      }
    }
  });

  // 각 섹션별로 주문 표시
  displayOrderSection('urgentOrders', 'urgentCount', categorizedOrders.urgent, 'urgent');
  displayOrderSection('pendingOrders', 'pendingCount', categorizedOrders.pending, 'pending');
  displayOrderSection('cookingOrders', 'cookingCount', categorizedOrders.cooking, 'cooking');
  displayOrderSection('completedOrders', 'completedCount', categorizedOrders.completed, 'completed');
  
  console.log('✅ KDS 주문 표시 완료:', {
    urgent: categorizedOrders.urgent.length,
    pending: categorizedOrders.pending.length,
    cooking: categorizedOrders.cooking.length,
    completed: categorizedOrders.completed.length
  });
}

// 주문 섹션 표시
function displayOrderSection(containerId, countId, orders, status) {
  const container = document.getElementById(containerId);
  const countElement = document.getElementById(countId);
  
  if (!container || !countElement) return;
  
  // 주문 개수 업데이트
  countElement.textContent = orders.length;
  
  if (orders.length === 0) {
    container.innerHTML = `<div class="no-orders">현재 ${getStatusText(status)} 주문이 없습니다</div>`;
    return;
  }
  
  // 주문 카드 생성
  const ordersHTML = orders.map(order => createOrderCard(order, status)).join('');
  container.innerHTML = ordersHTML;
}

// 주문 카드 생성
function createOrderCard(order, status) {
  const orderTime = new Date(order.created_at || order.order_date);
  const timeString = orderTime.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // 주문 항목 파싱
  let orderItems = [];
  try {
    if (typeof order.order_items === 'string') {
      orderItems = JSON.parse(order.order_items);
    } else if (Array.isArray(order.order_items)) {
      orderItems = order.order_items;
    }
  } catch (error) {
    console.error('주문 항목 파싱 실패:', error);
  }
  
  const itemsHTML = orderItems.map(item => `
    <div class="order-item">
      <span class="item-name">${item.name || '알 수 없는 메뉴'}</span>
      <span class="item-quantity">${item.quantity || 1}개</span>
    </div>
  `).join('');
  
  const actionsHTML = createOrderActions(order, status);
  
  return `
    <div class="order-card" onclick="showOrderDetail(${order.id})">
      <div class="order-header">
        <span class="order-number">#${order.id}</span>
        <span class="order-time">${timeString}</span>
      </div>
      <div class="order-items">
        ${itemsHTML || '<div class="order-item"><span class="item-name">주문 정보 없음</span></div>'}
      </div>
      ${actionsHTML}
    </div>
  `;
}

// 주문 액션 버튼 생성
function createOrderActions(order, status) {
  const storeId = window.currentStoreId;
  
  switch (status) {
    case 'urgent':
    case 'pending':
      return `
        <div class="order-actions">
          <button class="action-btn start-cooking-btn" onclick="event.stopPropagation(); updateOrderStatus(${order.id}, ${storeId}, 'cooking')">
            🍳 조리 시작
          </button>
          <button class="action-btn cancel-btn" onclick="event.stopPropagation(); updateOrderStatus(${order.id}, ${storeId}, 'cancelled')">
            ❌ 취소
          </button>
        </div>
      `;
    case 'cooking':
      return `
        <div class="order-actions">
          <button class="action-btn complete-btn" onclick="event.stopPropagation(); updateOrderStatus(${order.id}, ${storeId}, 'completed')">
            ✅ 완료
          </button>
        </div>
      `;
    case 'completed':
      return `
        <div class="order-actions">
          <small style="color: #4caf50;">완료된 주문</small>
        </div>
      `;
    default:
      return '';
  }
}

// 상태 텍스트 반환
function getStatusText(status) {
  switch (status) {
    case 'urgent': return '긴급';
    case 'pending': return '대기 중인';
    case 'cooking': return '조리 중인';
    case 'completed': return '완료된';
    default: return '';
  }
}

// 주문 상태 업데이트
async function updateOrderStatus(orderId, storeId, newStatus) {
  try {
    console.log(`🔄 주문 ${orderId} 상태를 ${newStatus}로 변경 시도`);
    
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus,
        storeId: storeId
      })
    });
    
    if (!response.ok) {
      throw new Error('주문 상태 업데이트 실패');
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ 주문 ${orderId} 상태 변경 완료: ${newStatus}`);
      // 주문 목록 새로고침
      await loadKDSOrders(storeId);
    } else {
      throw new Error(result.error || '상태 업데이트 실패');
    }
    
  } catch (error) {
    console.error('❌ 주문 상태 업데이트 실패:', error);
    alert('주문 상태 변경에 실패했습니다.');
  }
}

// 주문 상세 보기
function showOrderDetail(orderId) {
  console.log('📋 주문 상세 보기:', orderId);
  // 주문 상세 모달 구현 (추후)
  alert(`주문 #${orderId} 상세 정보\n(상세 모달은 곧 구현될 예정입니다)`);
}

// 주문 상세 모달 닫기
function closeOrderDetail() {
  const modal = document.getElementById('orderDetailModal');
  if (modal) {
    modal.style.display = 'none';
  }
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
window.closeOrderDetail = closeOrderDetail;
window.updateOrderStatus = updateOrderStatus;

console.log('✅ KDS 시스템 로드 완료');
