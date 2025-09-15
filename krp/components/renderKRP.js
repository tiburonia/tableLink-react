
/**
 * KRP (주방 영수증 프린터) 시스템 - 리팩토링 버전
 * - 단일 주문서 표시 + 대기 큐 방식
 * - WebSocket 기반 실시간 처리
 * - 직관적인 주방 운영 경험 제공
 */

let krpSocket = null;
let currentStoreId = null;
let currentReceipt = null; // 현재 표시중인 주문서
let waitingQueue = []; // 대기 큐
let isProcessing = false; // 처리 중 플래그

// KRP 시스템 초기화
async function renderKRP(storeId) {
  try {
    console.log(`🖨️ KRP 시스템 초기화 - 매장 ID: ${storeId}`);

    currentStoreId = storeId;
    currentReceipt = null;
    waitingQueue = [];

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

    // 초기 로딩 제거 - WebSocket을 통한 실시간 출력 요청만 처리
    console.log('✅ KRP 초기화 완료 - WebSocket 실시간 출력 대기 중');

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
              <div class="status-label">대기 중</div>
            </div>
            <div class="status-item">
              <div class="status-indicator ${currentReceipt ? 'active' : ''}" id="printingIndicator"></div>
              <div class="status-label">출력 중</div>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="connection-status">
            <div class="sync-indicator" id="syncIndicator"></div>
            <span id="syncTime">연결 중...</span>
          </div>
          <button class="refresh-btn" onclick="refreshKRP()">🔄</button>
          <button class="test-btn" onclick="testKRP()">🧪</button>
        </div>
      </header>

      <!-- 메인 컨텐츠 -->
      <main class="krp-main">
        <!-- 메인 주문서 영역 -->
        <section class="main-receipt-area">
          <div class="receipt-container" id="receiptContainer">
            <div class="no-receipt">
              <div class="no-receipt-icon">📄</div>
              <h3>출력할 주문서 없음</h3>
              <p>새로운 출력 요청을 기다리는 중입니다</p>
            </div>
          </div>
        </section>

        <!-- 대기 큐 패널 -->
        <aside class="waiting-panel">
          <div class="panel-header">
            <h3>📋 대기 큐</h3>
            <span class="queue-badge" id="queueBadge">0</span>
          </div>
          <div class="waiting-list" id="waitingList">
            <div class="empty-queue">
              <p>대기 중인 주문 없음</p>
            </div>
          </div>
        </aside>
      </main>

      <!-- 로딩 오버레이 -->
      <div class="loading-overlay" id="loadingOverlay" style="display: none;">
        <div class="loading-spinner"></div>
        <div class="loading-text">처리 중...</div>
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
        background: #f1f5f9;
        color: #1e293b;
        overflow: hidden;
      }

      .krp-system {
        height: 100vh;
        display: flex;
        flex-direction: column;
      }

      /* 헤더 스타일 */
      .krp-header {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
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
        align-items: center;
      }

      .status-item {
        text-align: center;
      }

      .status-count {
        font-size: 28px;
        font-weight: 800;
        line-height: 1;
      }

      .status-indicator {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #6b7280;
        margin: 0 auto 4px;
        position: relative;
      }

      .status-indicator.active {
        background: #10b981;
        animation: pulse 2s infinite;
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
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 20px;
        padding: 20px;
        overflow: hidden;
      }

      /* 메인 주문서 영역 */
      .main-receipt-area {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .receipt-container {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        position: relative;
      }

      .no-receipt {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #64748b;
        text-align: center;
      }

      .no-receipt-icon {
        font-size: 80px;
        margin-bottom: 20px;
        opacity: 0.5;
      }

      .no-receipt h3 {
        font-size: 24px;
        margin-bottom: 8px;
        color: #475569;
      }

      .no-receipt p {
        font-size: 16px;
      }

      /* 주문서 스타일 */
      .receipt {
        font-family: 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.6;
        max-width: 400px;
        margin: 0 auto;
        border: 2px dashed #64748b;
        padding: 20px;
        border-radius: 12px;
        background: #fefefe;
        position: relative;
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

      .receipt-actions {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
      }

      .complete-btn {
        background: #dc2626;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 700;
        transition: all 0.2s ease;
      }

      .complete-btn:hover {
        background: #b91c1c;
        transform: translateY(-1px);
      }

      /* 대기 큐 패널 */
      .waiting-panel {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .panel-header {
        background: #f8fafc;
        padding: 16px 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .panel-header h3 {
        font-size: 18px;
        font-weight: 700;
      }

      .queue-badge {
        background: #dc2626;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
        min-width: 20px;
        text-align: center;
      }

      .waiting-list {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }

      .empty-queue {
        text-align: center;
        color: #64748b;
        padding: 40px 20px;
      }

      .queue-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .queue-item:hover {
        background: #e2e8f0;
        border-color: #cbd5e1;
      }

      .queue-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .queue-table {
        font-weight: 700;
        color: #dc2626;
      }

      .queue-time {
        font-size: 12px;
        color: #64748b;
      }

      .queue-summary {
        font-size: 12px;
        color: #475569;
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
        border-top: 4px solid #dc2626;
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
          grid-template-rows: 1fr 200px;
        }
      }
    </style>
  `;

  // 시간 업데이트 시작
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // 상태 UI 업데이트
  updateStatusUI();
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

// 초기 대기 큐 로딩 함수 제거 - WebSocket 실시간 전용

// KRP WebSocket 설정
function setupKRPWebSocket(storeId) {
  try {
    console.log(`🔌 KRP WebSocket 연결 시작 - 매장 ${storeId}`);

    // 기존 소켓 정리
    if (krpSocket) {
      console.log('🧹 기존 KRP WebSocket 연결 정리');
      krpSocket.disconnect();
      krpSocket = null;
    }

    krpSocket = io({
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    krpSocket.on('connect', () => {
      console.log('✅ KRP WebSocket 연결 성공:', krpSocket.id);
      
      // KDS 룸과 KRP 룸 모두 조인
      krpSocket.emit('join-kds', parseInt(storeId));
      krpSocket.emit('join-krp', parseInt(storeId));
      
      updateConnectionStatus(true);
      showNotification('🔌 KRP 실시간 연결 활성화', 'success');
      
      console.log(`🏪 KRP 룸 조인 완료: kds:${storeId}, krp:${storeId}`);
    });

    krpSocket.on('joined-kds', (data) => {
      console.log('✅ KDS 룸 조인 확인:', data);
    });

    krpSocket.on('joined-krp', (data) => {
      console.log('✅ KRP 룸 조인 확인:', data);
    });

    krpSocket.on('disconnect', (reason) => {
      console.log('❌ KRP WebSocket 연결 해제:', reason);
      updateConnectionStatus(false);
    });

    krpSocket.on('reconnect', () => {
      console.log('🔄 KRP WebSocket 재연결 성공');
      krpSocket.emit('join-kds', parseInt(storeId));
      krpSocket.emit('join-krp', parseInt(storeId));
      updateConnectionStatus(true);
    });

    // 새 출력 요청 수신 - 모든 가능한 이벤트명 지원
    const printEvents = ['krp:new-print', 'new-print', 'print-request'];
    
    printEvents.forEach(eventName => {
      krpSocket.on(eventName, (printData) => {
        console.log(`🖨️ 출력 요청 수신 (${eventName}):`, printData);
        console.log(`📄 출력 데이터: 티켓 ${printData.ticket_id}, 테이블 ${printData.table_number}, 소스: ${printData.source}`);
        
        // 데이터 유효성 검사
        if (!printData.ticket_id || !printData.table_number) {
          console.warn('⚠️ 출력 데이터가 불완전함:', printData);
          return;
        }

        // 즉시 처리
        handleNewPrintRequest(printData);
      });
    });

    // 일반 WebSocket 이벤트도 수신 (호환성)
    krpSocket.on('message', (data) => {
      console.log('📨 일반 메시지 수신:', data);
      
      if (data && data.type === 'new-print' && data.data) {
        console.log('🖨️ 일반 메시지에서 출력 요청 발견');
        handleNewPrintRequest(data.data);
      }
    });

    krpSocket.on('connect_error', (error) => {
      console.error('❌ KRP WebSocket 연결 에러:', error);
      updateConnectionStatus(false);
    });

    krpSocket.on('error', (error) => {
      console.error('❌ KRP WebSocket 일반 에러:', error);
    });

    // 연결 테스트 이벤트 수신
    krpSocket.on('krp:connection-test', (data) => {
      console.log('✅ KRP 연결 테스트 수신:', data);
      showNotification(`🔗 KRP 연결 확인: ${data.message}`, 'success');
    });

    // 모든 이벤트 수신 (디버깅용) - 강화된 로깅
    const originalOnevent = krpSocket.onevent;
    krpSocket.onevent = function(packet) {
      const args = packet.data || [];
      const eventName = args[0];
      const eventData = args[1];
      
      console.log(`🔍 KRP WebSocket 이벤트 수신:`, {
        type: packet.type,
        event: eventName,
        data: eventData,
        nsp: packet.nsp,
        timestamp: new Date().toISOString()
      });

      // 출력 관련 이벤트 특별 처리
      if (eventName && (eventName.includes('print') || eventName.includes('krp'))) {
        console.log(`🖨️ 출력 관련 이벤트 감지: ${eventName}`, eventData);
      }

      originalOnevent.call(this, packet);
    };

    // 연결 상태 주기적 확인
    setInterval(() => {
      if (krpSocket) {
        console.log(`🔍 KRP WebSocket 상태: 연결=${krpSocket.connected}, ID=${krpSocket.id}`);
        if (!krpSocket.connected) {
          console.warn('⚠️ KRP WebSocket 연결이 끊어짐 - 재연결 시도');
        }
      }
    }, 30000); // 30초마다 체크

  } catch (error) {
    console.error('❌ KRP WebSocket 설정 실패:', error);
    updateConnectionStatus(false);
  }
}

// 새 출력 요청 처리 - 핵심 로직 (즉시 처리)
function handleNewPrintRequest(printData) {
  console.log(`🎯 새 출력 요청 즉시 처리: 테이블 ${printData.table_number}, 티켓 ${printData.ticket_id}`);
  console.log(`⏰ 요청 시간: ${printData.timestamp || new Date().toISOString()}`);

  // 중복 방지 체크
  const isDuplicate = waitingQueue.some(item => item.ticket_id === printData.ticket_id) || 
                     (currentReceipt && currentReceipt.ticket_id === printData.ticket_id);

  if (isDuplicate) {
    console.log(`⚠️ 중복 출력 요청 무시: 티켓 ${printData.ticket_id}`);
    return;
  }

  // 현재 화면이 비어 있으면 즉시 메인 화면에 표시
  if (!currentReceipt) {
    console.log('📄 메인 화면이 비어있음 - 즉시 표시');
    displayMainReceipt(printData);
  } else {
    // 이미 주문서가 표시 중이면 대기 큐에 추가
    console.log('📝 메인 화면이 사용 중 - 대기 큐에 추가');
    waitingQueue.push(printData);
    updateWaitingList();
  }

  // 즉시 알림
  playPrintSound();
  showNotification(`🖨️ 새 출력: 테이블 ${printData.table_number}`, 'info');
  
  console.log(`✅ 출력 요청 처리 완료: 현재 메인 ${currentReceipt ? '사용중' : '비어있음'}, 대기 큐 ${waitingQueue.length}개`);
}

// 메인 화면에 주방서 표시
function displayMainReceipt(printData) {
  currentReceipt = printData;
  
  const container = document.getElementById('receiptContainer');
  if (!container) return;

  const orderTime = new Date(printData.created_at);
  const timeString = orderTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // 주방 관련 아이템만 필터링
  const kitchenItems = (printData.items || []).filter(item => {
    const cookStation = item.cook_station || 'KITCHEN';
    return ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'].includes(cookStation);
  });

  console.log(`🍳 KRP 아이템 필터링: 전체 ${printData.items?.length || 0}개 → 주방 ${kitchenItems.length}개`);

  // 주방 아이템이 없으면 음료만 있다는 안내
  if (kitchenItems.length === 0) {
    const drinkCount = (printData.items || []).filter(item => 
      (item.cook_station || 'KITCHEN') === 'DRINK'
    ).length;
    
    container.innerHTML = `
      <div class="no-receipt">
        <div class="no-receipt-icon">🥤</div>
        <h3>주방 조리 없음</h3>
        <p>이 주문은 음료만 ${drinkCount}개 있습니다</p>
        <div class="receipt-actions">
          <button class="complete-btn" onclick="completeCurrentReceipt()">
            ✅ 확인 완료
          </button>
        </div>
      </div>
    `;
    return;
  }

  const itemsHTML = kitchenItems.map(item => `
    <div class="receipt-item">
      <div class="item-left">
        <div class="item-name">${item.quantity || 1}x ${item.menuName || item.menu_name || '메뉴'}</div>
        <div class="item-details">[${item.cook_station || 'KITCHEN'}]</div>
        ${item.options && Object.keys(item.options).length > 0 ? 
          `<div class="item-details">${JSON.stringify(item.options)}</div>` : ''}
      </div>
      <div class="item-price">${(item.totalPrice || item.price || 0).toLocaleString()}원</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="receipt">
      <div class="receipt-header">
        <div class="receipt-title">🍴 주방 주문서</div>
        <div class="receipt-store">TableLink Kitchen</div>
      </div>

      <div class="receipt-order-info">
        <strong>주문번호: #${printData.ticket_id}</strong><br>
        <strong>테이블: ${printData.table_number}</strong><br>
        고객: ${printData.customer_name}<br>
        ${timeString}
      </div>

      <div class="receipt-items">
        ${itemsHTML}
      </div>

      <div class="receipt-total">
        <div class="total-amount">합계: ${printData.total_amount.toLocaleString()}원</div>
      </div>

      <div class="receipt-footer">
        주방에서 조리를 시작하세요<br>
        TableLink KRP System
      </div>

      <div class="receipt-actions">
        <button class="complete-btn" onclick="completeCurrentReceipt()">
          ✅ 완료 (화면에서 제거)
        </button>
      </div>
    </div>
  `;

  updateStatusUI();
  console.log(`✅ 메인 화면에 주문서 표시: 티켓 ${printData.ticket_id}`);
}

// 현재 주문서 완료 처리
function completeCurrentReceipt() {
  if (!currentReceipt) return;

  console.log(`✅ 주문서 완료: 티켓 ${currentReceipt.ticket_id}`);

  // 메인 화면 초기화
  currentReceipt = null;
  const container = document.getElementById('receiptContainer');
  if (container) {
    container.innerHTML = `
      <div class="no-receipt">
        <div class="no-receipt-icon">📄</div>
        <h3>출력할 주문서 없음</h3>
        <p>새로운 출력 요청을 기다리는 중입니다</p>
      </div>
    `;
  }

  // 대기 큐에서 다음 주문서 가져오기
  if (waitingQueue.length > 0) {
    const nextReceipt = waitingQueue.shift();
    console.log(`📄 다음 주문서 표시: 티켓 ${nextReceipt.ticket_id}`);
    
    setTimeout(() => {
      displayMainReceipt(nextReceipt);
      updateWaitingList();
    }, 500); // 약간의 딜레이로 자연스러운 전환
  }

  updateStatusUI();
  showNotification('주문서 처리 완료', 'success');
}

// 대기 목록 UI 업데이트
function updateWaitingList() {
  const listElement = document.getElementById('waitingList');
  const badgeElement = document.getElementById('queueBadge');
  
  if (!listElement || !badgeElement) return;

  badgeElement.textContent = waitingQueue.length;

  if (waitingQueue.length === 0) {
    listElement.innerHTML = `
      <div class="empty-queue">
        <p>대기 중인 주문 없음</p>
      </div>
    `;
    return;
  }

  const itemsHTML = waitingQueue.map((item, index) => {
    const orderTime = new Date(item.created_at);
    const timeString = orderTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemCount = item.items?.length || 0;

    return `
      <div class="queue-item" onclick="moveToMain(${index})">
        <div class="queue-item-header">
          <span class="queue-table">테이블 ${item.table_number}</span>
          <span class="queue-time">${timeString}</span>
        </div>
        <div class="queue-summary">
          #${item.ticket_id} • ${itemCount}개 메뉴 • ${item.total_amount.toLocaleString()}원
        </div>
      </div>
    `;
  }).join('');

  listElement.innerHTML = itemsHTML;
}

// 대기 큐에서 메인으로 이동
function moveToMain(index) {
  if (!waitingQueue[index]) return;

  // 현재 주문서가 있으면 대기 큐 맨 앞에 추가
  if (currentReceipt) {
    waitingQueue.unshift(currentReceipt);
  }

  // 선택된 주문서를 메인으로 이동
  const selectedReceipt = waitingQueue.splice(index, 1)[0];
  displayMainReceipt(selectedReceipt);
  updateWaitingList();

  console.log(`🔄 대기 큐에서 메인으로 이동: 티켓 ${selectedReceipt.ticket_id}`);
}

// 상태 UI 업데이트
function updateStatusUI() {
  const queueCountElement = document.getElementById('queueCount');
  const printingIndicatorElement = document.getElementById('printingIndicator');

  if (queueCountElement) {
    queueCountElement.textContent = waitingQueue.length;
  }

  if (printingIndicatorElement) {
    if (currentReceipt) {
      printingIndicatorElement.classList.add('active');
    } else {
      printingIndicatorElement.classList.remove('active');
    }
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

// 새로고침
function refreshKRP() {
  if (currentStoreId) {
    location.reload();
  }
}

// 테스트 기능 강화
function testKRP() {
  console.log('🧪 KRP 테스트 시작');
  
  // WebSocket 연결 상태 확인
  if (krpSocket) {
    console.log('📊 WebSocket 상태:', {
      connected: krpSocket.connected,
      id: krpSocket.id,
      rooms: krpSocket.rooms
    });
  } else {
    console.warn('⚠️ WebSocket이 초기화되지 않음');
  }

  const testData = {
    ticket_id: `TEST-${Date.now()}`,
    order_id: `TEST-ORDER-${Date.now()}`,
    table_number: '테스트',
    customer_name: '테스트 고객',
    total_amount: 25000,
    created_at: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    source: 'test_button',
    items: [
      { menuName: '김치찌개', quantity: 2, totalPrice: 16000, options: {} },
      { menuName: '공기밥', quantity: 1, totalPrice: 2000, options: {} },
      { menuName: '계란말이', quantity: 1, totalPrice: 7000, options: {} }
    ]
  };

  console.log('🧪 테스트 데이터 생성:', testData);
  
  // WebSocket이 연결되어 있으면 서버로도 테스트 전송
  if (krpSocket && krpSocket.connected) {
    console.log('📡 서버로 테스트 이벤트 전송');
    krpSocket.emit('krp-test', testData);
  }

  handleNewPrintRequest(testData);
  showNotification('🧪 테스트 주문서가 추가되었습니다', 'info');
  
  // 현재 상태 정보 출력
  console.log('📊 현재 KRP 상태:', {
    currentReceipt: currentReceipt ? currentReceipt.ticket_id : null,
    waitingQueue: waitingQueue.length,
    isProcessing: isProcessing
  });
}

// 사운드 재생
function playPrintSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D2u2IdBT2V2/LHdikELIHN8tp9MwgWa7zx6qNPFAtGn97xsnIdBjiS2+zBeyMFJHfH8N+NQQoUX7Pp66hVFApGnt7xuDMF=');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('사운드 재생 실패:', e));
  } catch (error) {
    console.log('사운드 재생 불가:', error);
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

// 전역 함수 등록
window.renderKRP = renderKRP;
window.completeCurrentReceipt = completeCurrentReceipt;
window.moveToMain = moveToMain;
window.refreshKRP = refreshKRP;
window.testKRP = testKRP;

console.log('✅ KRP 시스템 리팩토링 완료 - 단일 주문서 + 대기 큐 방식');
