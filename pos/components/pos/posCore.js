
// POS 시스템 핵심 함수들 (누락된 기능 보완)

// 로그아웃 함수
function logOut() {
  if (confirm('정말 로그아웃하시겠습니까?')) {
    console.log('🚪 POS 시스템 로그아웃');
    
    // 현재 상태 초기화
    window.currentStore = null;
    window.currentTable = null;
    window.currentOrder = [];
    window.pendingOrder = [];
    window.confirmedOrder = [];
    
    // 메인 페이지로 이동
    window.location.href = '/';
  }
}

// 주문 통계 업데이트
function updateOrderStatistics() {
  try {
    const totalItems = window.currentOrder ? window.currentOrder.reduce((sum, item) => sum + item.quantity, 0) : 0;
    const totalAmount = window.currentOrder ? window.currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    
    console.log(`📊 주문 통계 업데이트: ${totalItems}개 아이템, ₩${totalAmount.toLocaleString()}`);
  } catch (error) {
    console.error('❌ 주문 통계 업데이트 실패:', error);
  }
}

// 웹소켓 초기화
function initWebSocket(storeId) {
  try {
    if (typeof window.initPOSWebSocket === 'function') {
      window.initPOSWebSocket(storeId);
    } else {
      console.log('💡 WebSocket 초기화 함수가 로드되지 않았습니다. posSocket.js를 확인하세요.');
    }
  } catch (error) {
    console.error('❌ WebSocket 초기화 실패:', error);
  }
}

// 기본 알림 함수 (posNotification.js 로드 전 대비)
if (typeof window.showPOSNotification !== 'function') {
  window.showPOSNotification = function(message, type = 'info') {
    console.log(`📢 POS 알림 (${type}): ${message}`);
    
    // 간단한 브라우저 알림
    if (type === 'error') {
      alert(`오류: ${message}`);
    } else if (type === 'warning') {
      alert(`경고: ${message}`);
    } else {
      console.log(`정보: ${message}`);
    }
  };
}

// 전역 함수로 노출
window.logOut = logOut;
window.updateOrderStatistics = updateOrderStatistics;
window.initWebSocket = initWebSocket;

console.log('✅ POS 핵심 함수 로드 완료');
