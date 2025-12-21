
/**
 * 통합 로그아웃 유틸리티
 * POS, KDS, TLM, TLL 등 모든 시스템에서 사용
 */

// 로그아웃 함수
function logOut() {
  try {
    console.log('🚪 로그아웃 시작');

    // 1. localStorage 완전 초기화
    if (typeof Storage !== 'undefined') {
      localStorage.clear();
      console.log('🗑️ localStorage 완전 초기화 완료');
    }

    // 2. 세션 스토리지 초기화
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
      console.log('🗑️ sessionStorage 초기화 완료');
    }

    // 3. 쿠키 삭제
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
    console.log('🍪 쿠키 삭제 완료');

    // 4. WebSocket 연결 해제 (있는 경우)
    if (window.posSocket && window.posSocket.disconnect) {
      window.posSocket.disconnect();
      console.log('🔌 POS WebSocket 연결 해제');
    }
    if (window.kdsSocket && window.kdsSocket.disconnect) {
      window.kdsSocket.disconnect();
      console.log('🔌 KDS WebSocket 연결 해제');
    }

    // 5. 전역 상태 초기화
    window.currentUser = null;
    window.currentStore = null;
    window.currentTable = null;
    window.userLocation = null;
    window.allMenus = [];
    window.allTables = [];
    window.currentOrderItems = [];

    console.log('✅ 로그아웃 완료');

    // 6. 페이지 새로고침 또는 리다이렉트
    setTimeout(() => {
      window.location.reload();
    }, 100);

  } catch (error) {
    console.error('❌ 로그아웃 중 오류 발생:', error);
    // 오류가 발생해도 페이지 새로고침으로 강제 로그아웃
    window.location.reload();
  }
}

// 빠른 로그아웃 (확인 없이)
function quickLogOut() {
  logOut();
}

// 확인 후 로그아웃
function confirmLogOut() {
  if (confirm('정말 로그아웃하시겠습니까?')) {
    logOut();
  }
}

// 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.logOut = logOut;
  window.quickLogOut = quickLogOut;
  window.confirmLogOut = confirmLogOut;
}

// 모듈로도 export (ES6 환경에서 사용 가능)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    logOut,
    quickLogOut,
    confirmLogOut
  };
}
