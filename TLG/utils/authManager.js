/**
 * 사용자 인증 관리 유틸리티
 */

// 사용자 정보를 안전하게 가져오는 함수
export function getUserInfoSafely() {
  try {
    // 쿠키에서 userInfo 찾기
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

    if (userInfoCookie) {
      const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
      return JSON.parse(userInfoValue);
    }

    // localStorage 확인
    const localStorageUserInfo = localStorage.getItem('userInfo');
    if (localStorageUserInfo) {
      return JSON.parse(localStorageUserInfo);
    }

    // window.userInfo 확인
    if (window.userInfo && window.userInfo.id) {
      return window.userInfo;
    }

    return null;
  } catch (error) {
    console.error('❌ 사용자 정보 파싱 오류:', error);
    return null;
  }
}

// 사용자 정보를 안전하게 가져오는 함수

// 인증 관리자 - 앱 초기화 및 사용자 상태 관리
console.log('🔧 AuthManager 로드 시작');

// 전역 사용자 정보
window.userInfo = null;

// 쿠키에서 사용자 정보 가져오기
function getCookieUserInfo() {
  try {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'userInfo') {
        return JSON.parse(decodeURIComponent(value));
      }
    }
    return null;
  } catch (error) {
    console.error('❌ 쿠키 파싱 실패:', error);
    return null;
  }
}

// 앱 초기화 함수
function initializeApp() {
  console.log('🚀 앱 초기화 시작');

  try {
    // 1. 쿠키에서 사용자 정보 확인 (우선순위)
    let savedUserInfo = getCookieUserInfo();

    // 2. 쿠키에 없으면 localStorage에서 확인 (백업)
    if (!savedUserInfo) {
      try {
        const localStorageUserInfo = localStorage.getItem('userInfo');
        if (localStorageUserInfo) {
          savedUserInfo = JSON.parse(localStorageUserInfo);
          console.log('📦 localStorage에서 사용자 정보 복원');
        }
      } catch (error) {
        console.warn('⚠️ localStorage 사용자 정보 파싱 실패:', error);
        localStorage.removeItem('userInfo');
      }
    }

    if (savedUserInfo && savedUserInfo.id) {
      window.userInfo = savedUserInfo;
      console.log('✅ 저장된 사용자 정보 복원:', savedUserInfo.name || savedUserInfo.id);

      // localStorage와 쿠키 동기화
      try {
        localStorage.setItem('userInfo', JSON.stringify(savedUserInfo));
        console.log('🔄 localStorage 동기화 완료');
      } catch (error) {
        console.warn('⚠️ localStorage 동기화 실패:', error);
      }

      // 사용자가 로그인되어 있으면 메인 화면으로
      console.log('🏠 로그인 상태 확인됨 - 메인 화면으로 이동');
      if (typeof renderMap === 'function') {
        renderMap();
      } else {
        console.warn('⚠️ renderMap 함수를 찾을 수 없음 - 로그인 화면으로');
        if (typeof renderLogin === 'function') {
          renderLogin();
        }
      }
    } else {
      console.log('ℹ️ 저장된 사용자 정보 없음 - 로그인 화면 표시');
      // 기존 잘못된 데이터 정리
      clearUserInfo();

      if (typeof renderLogin === 'function') {
        renderLogin();
      }
    }

    console.log('✅ 앱 초기화 완료');

  } catch (error) {
    console.error('❌ 앱 초기화 실패:', error);

    // 실패 시 사용자 정보 정리하고 로그인 화면으로 폴백
    clearUserInfo();
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
    // localStorage에 저장
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    console.log('💾 사용자 정보 localStorage 저장 완료');

    // 쿠키에도 저장 (7일 만료)
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `userInfo=${encodeURIComponent(JSON.stringify(userInfo))}; expires=${expires.toUTCString()}; path=/`;
    console.log('🍪 사용자 정보 쿠키 저장 완료');

  } catch (error) {
    console.error('❌ 사용자 정보 저장 실패:', error);
  }
}

// 사용자 로그아웃 처리 (내부용)
function clearUserInfo() {
  console.log('🪚 사용자 정보 정리');

  window.userInfo = null;

  try {
    // localStorage 완전 초기화 (모든 데이터 삭제)
    localStorage.clear();
    console.log('🗑️ localStorage 완전 초기화 완료');
  } catch (error) {
    console.error('❌ localStorage 정리 실패:', error);
  }

  try {
    // 쿠키 삭제 (만료일을 과거로 설정)
    document.cookie = 'userInfo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    console.log('🗑️ 쿠키 사용자 정보 삭제 완료');
  } catch (error) {
    console.error('❌ 쿠키 정리 실패:', error);
  }
}

// 통합 로그아웃 함수 (UI용)
function logOutF() {
  console.log('🚪 사용자 로그아웃 처리 시작');

  // userInfo 객체가 존재하는 경우 개별 속성 초기화
  if (typeof userInfo !== 'undefined' && userInfo !== null) {
    userInfo.id = "";
    userInfo.pw = "";
    userInfo.name = "";
    userInfo.phone = "";
    userInfo.email = "";
    userInfo.address = "";
    userInfo.birth = "";
    userInfo.gender = "";
    userInfo.point = 0;
    userInfo.totalCost = 0;
    userInfo.realCost = 0;
    userInfo.orderList = [];
    userInfo.reservationList = [];
    userInfo.coupons = { unused: [], used: [] };
    userInfo.favorites = [];
    console.log('🧹 지역 userInfo 객체 초기화 완료');
  }

  // 전역 사용자 정보 완전 초기화
  clearUserInfo();

  console.log('✅ 로그아웃 처리 완료');
  alert('로그아웃 완료');

  // 로그인 화면으로 이동
  try {
    if (typeof renderLogin === 'function') {
      renderLogin();
      console.log('🔄 로그인 화면으로 이동 완료');
    } else {
      console.error('❌ renderLogin 함수를 찾을 수 없음');
      window.location.reload();
    }
  } catch (error) {
    console.error('❌ 로그인 화면 이동 실패:', error);
    window.location.reload();
  }
}

// 로그인 상태 확인
function isLoggedIn() {
  return window.userInfo && window.userInfo.id;
}

// 결제 완료 후 postMessage 리스너 추가
window.addEventListener('message', function(event) {
  // 보안을 위해 동일한 origin에서 온 메시지만 처리
  if (event.origin !== window.location.origin) {
    return;
  }

  console.log('📨 메시지 수신:', event.data);

  if (event.data.type === 'PAYMENT_SUCCESS_REDIRECT' || 
      event.data.type === 'PAYMENT_FAILURE_REDIRECT' || 
      event.data.type === 'PAYMENT_REDIRECT') {

    if (event.data.action === 'navigate' && event.data.url) {
      console.log('🔄 결제 완료 후 리다이렉트:', event.data.url);

      if (event.data.url === '/mypage') {
        // 마이페이지로 이동
        if (typeof renderMyPage === 'function') {
          renderMyPage();
        } else {
          window.location.href = '/mypage';
        }
      } else if (event.data.url === '/') {
        // 메인으로 이동
        if (typeof renderMap === 'function') {
          renderMap();
        } else {
          window.location.href = '/';
        }
      }
    }
  }
});

// 전역 함수로 내보내기
window.initializeApp = initializeApp;
window.setUserInfo = setUserInfo;
window.clearUserInfo = clearUserInfo;
window.logOutF = logOutF;  // 통합 로그아웃 함수 추가
window.isLoggedIn = isLoggedIn;

console.log('✅ AuthManager 로드 완료 - 통합 로그아웃 함수 포함');