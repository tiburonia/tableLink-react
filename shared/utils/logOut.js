
// 통합 로그아웃 유틸리티
function logOut() {
  console.log('🚪 로그아웃 처리 시작');
  
  try {
    // localStorage 정리
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('currentStore');
    localStorage.removeItem('cart');
    
    // 쿠키 정리
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    console.log('✅ 로그아웃 완료');
    
    // 메인 페이지로 리다이렉트
    window.location.href = '/';
  } catch (error) {
    console.error('❌ 로그아웃 처리 중 오류:', error);
    window.location.href = '/';
  }
}

// POS 전용 로그아웃
function logoutPOS() {
  console.log('🚪 POS 로그아웃 처리');
  logOut();
}

// 전역 함수 등록
window.logOut = logOut;
window.logoutPOS = logoutPOS;
