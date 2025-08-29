
// 인증 관리자 - 앱 초기화 및 사용자 상태 관리
console.log('🔧 AuthManager 로드 시작');

// 전역 사용자 정보
window.userInfo = null;

// 앱 초기화 함수
function initializeApp() {
  console.log('🚀 앱 초기화 시작');
  
  try {
    // 1. 로컬 스토리지에서 사용자 정보 확인
    const savedUserInfo = localStorage.getItem('userInfo');
    
    if (savedUserInfo) {
      try {
        window.userInfo = JSON.parse(savedUserInfo);
        console.log('✅ 저장된 사용자 정보 복원:', window.userInfo?.name || window.userInfo?.id);
        
        // 사용자가 로그인되어 있으면 메인 화면으로
        if (typeof renderMap === 'function') {
          renderMap();
        } else {
          console.warn('⚠️ renderMap 함수를 찾을 수 없음 - 로그인 화면으로');
          if (typeof renderLogin === 'function') {
            renderLogin();
          }
        }
      } catch (parseError) {
        console.error('❌ 사용자 정보 파싱 실패:', parseError);
        localStorage.removeItem('userInfo');
        if (typeof renderLogin === 'function') {
          renderLogin();
        }
      }
    } else {
      console.log('ℹ️ 저장된 사용자 정보 없음 - 로그인 화면 표시');
      if (typeof renderLogin === 'function') {
        renderLogin();
      }
    }
    
    console.log('✅ 앱 초기화 완료');
    
  } catch (error) {
    console.error('❌ 앱 초기화 실패:', error);
    
    // 실패 시 로그인 화면으로 폴백
    if (typeof renderLogin === 'function') {
      renderLogin();
    }
  }
}

// 사용자 로그인 처리
function setUserInfo(userInfo) {
  console.log('👤 사용자 정보 설정:', userInfo?.name || userInfo?.id);
  
  window.userInfo = userInfo;
  
  try {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    console.log('💾 사용자 정보 로컬 스토리지 저장 완료');
  } catch (error) {
    console.error('❌ 사용자 정보 저장 실패:', error);
  }
}

// 사용자 로그아웃 처리
function clearUserInfo() {
  console.log('🚪 사용자 로그아웃 처리');
  
  window.userInfo = null;
  
  try {
    localStorage.removeItem('userInfo');
    console.log('🗑️ 로컬 스토리지 사용자 정보 삭제 완료');
  } catch (error) {
    console.error('❌ 로컬 스토리지 정리 실패:', error);
  }
}

// 로그인 상태 확인
function isLoggedIn() {
  return window.userInfo && window.userInfo.id;
}

// 전역 함수로 내보내기
window.initializeApp = initializeApp;
window.setUserInfo = setUserInfo;
window.clearUserInfo = clearUserInfo;
window.isLoggedIn = isLoggedIn;

console.log('✅ AuthManager 로드 완료 - initializeApp 함수 등록됨');
