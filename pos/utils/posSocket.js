
// POS WebSocket 관리 모듈
let posSocket = null;
let isWebSocketConnected = false;

// WebSocket 초기화
function initWebSocket(storeId) {
  try {
    console.log(`🔌 POS WebSocket 연결 시작... (매장 ID: ${storeId})`);

    posSocket = io({
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // 연결 성공
    posSocket.on('connect', () => {
      console.log('✅ POS WebSocket 연결 성공:', posSocket.id);
      isWebSocketConnected = true;
      posSocket.emit('join-pos-room', parseInt(storeId));
      updateConnectionStatus(true);
      showPOSNotification('🔌 실시간 연결 활성화');
    });

    // 연결 해제
    posSocket.on('disconnect', (reason) => {
      console.log('❌ POS WebSocket 연결 해제:', reason);
      isWebSocketConnected = false;
      updateConnectionStatus(false);
      showPOSNotification('⚠️ 실시간 연결 해제됨', 'warning');
    });

    // 재연결 시도
    posSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 POS WebSocket 재연결 성공:', attemptNumber);
      posSocket.emit('join-pos-room', parseInt(storeId));
      isWebSocketConnected = true;
      updateConnectionStatus(true);
      showPOSNotification('🔄 실시간 연결 복구');
    });

    // POS 룸 참여 확인
    posSocket.on('join-pos-room-success', (data) => {
      console.log(`✅ POS 룸 참여 확인 - 매장 ${data.storeId}, 클라이언트: ${data.clientCount}개`);
      showPOSNotification(`📡 매장 ${data.storeId} 실시간 연결 완료`);
    });

    // 실시간 업데이트 수신
    posSocket.on('pos-update', handlePOSRealTimeUpdate);
    posSocket.on('new-order', handleNewOrderNotification);
    posSocket.on('table-update', handleTableStatusUpdate);

    posSocket.on('connect_error', (error) => {
      console.error('❌ POS WebSocket 연결 에러:', error);
      showPOSNotification('⚠️ 실시간 연결 오류 발생', 'error');
    });

  } catch (error) {
    console.error('❌ POS WebSocket 초기화 실패:', error);
    updateConnectionStatus(false);
  }
}

// 연결 상태 업데이트
function updateConnectionStatus(isConnected) {
  const syncTime = document.getElementById('syncTime');
  const syncIndicator = document.getElementById('syncIndicator');

  if (syncTime && syncIndicator) {
    if (isConnected) {
      syncTime.textContent = '실시간 연결됨';
      syncIndicator.className = 'sync-indicator active';
    } else {
      syncTime.textContent = '연결 끊김';
      syncIndicator.className = 'sync-indicator inactive';
    }
  }
}

// 실시간 업데이트 처리
function handlePOSRealTimeUpdate(data) {
  const { type, storeId, timestamp, updateData } = data;
  console.log(`📡 POS 실시간 업데이트 처리: ${type}`);

  switch (type) {
    case 'order-update':
      refreshCurrentTableOrders();
      break;
    case 'table-update':
      refreshTableMap();
      break;
    case 'menu-update':
      loadStoreDetails(storeId);
      break;
    default:
      console.log('🔄 알 수 없는 업데이트 타입:', type);
  }
}

// 새 주문 알림 처리
function handleNewOrderNotification(data) {
  const { orderId, storeName, tableNumber, customerName, itemCount, totalAmount, source } = data;
  console.log(`🆕 새 주문 알림 수신 - 주문 ${orderId}, 테이블 ${tableNumber}`);

  showPOSNotification(
    `🆕 새 주문 접수! (${source})\n테이블 ${tableNumber} | ${customerName} | ${itemCount}개 메뉴\n₩${totalAmount.toLocaleString()}`, 
    'success'
  );

  if (window.currentTable && window.currentTable == tableNumber) {
    setTimeout(() => updateDetailPanel(window.currentTable), 500);
  }
  refreshTableMap();
}

// 테이블 상태 업데이트 처리
function handleTableStatusUpdate(data) {
  const { tableNumber, isOccupied, source, occupiedSince } = data;
  console.log(`🪑 테이블 ${tableNumber} 상태 변경: ${isOccupied ? '점유' : '해제'} (${source})`);

  refreshTableMap();
  if (window.currentTable && window.currentTable == tableNumber) {
    setTimeout(() => updateDetailPanel(window.currentTable), 500);
  }

  const statusText = isOccupied ? '점유됨' : '해제됨';
  const sourceText = source === 'TLL' ? 'TLL 주문' : source === 'TLM' ? 'TLM 관리' : 'POS';
  showPOSNotification(`🪑 테이블 ${tableNumber} ${statusText} (${sourceText})`, isOccupied ? 'warning' : 'success');
}

// 전역 함수 등록
window.initWebSocket = initWebSocket;
window.updateConnectionStatus = updateConnectionStatus;
window.handlePOSRealTimeUpdate = handlePOSRealTimeUpdate;
window.handleNewOrderNotification = handleNewOrderNotification;
window.handleTableStatusUpdate = handleTableStatusUpdate;
