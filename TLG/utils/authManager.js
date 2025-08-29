
// 로그인 상태 확인 및 사용자 정보 쿠키 로드
function checkLoginStatus() {
  try {
    const userInfoCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('userInfo='));

    if (userInfoCookie) {
      const userInfoString = decodeURIComponent(userInfoCookie.split('=')[1]);
      window.userInfo = JSON.parse(userInfoString);
      console.log('✅ 쿠키에서 사용자 정보 로드 완료:', window.userInfo);
      return true;
    } else {
      console.log('ℹ️ 로그인 상태가 아님');
      return false;
    }
  } catch (error) {
    console.error('❌ 사용자 정보 로드 실패:', error);
    return false;
  }
}

// 토스페이먼츠 결제 성공 처리
function handleTossPaymentSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentKey = urlParams.get('paymentKey');
  const orderId = urlParams.get('orderId');
  const amount = urlParams.get('amount');

  if (paymentKey && orderId && amount) {
    console.log('✅ 토스페이먼츠 결제 성공 감지:', { paymentKey, orderId, amount });

    // confirmPay 모듈 동적 로드 및 실행
    import('/TLG/pages/store/pay/confirmPayF.js')
      .then(() => {
        if (typeof window.confirmPay === 'function') {
          // URL 파라미터를 이용한 결제 확인 처리
          const paymentResult = {
            paymentKey: paymentKey,
            orderId: orderId,
            method: 'TRANSFER'
          };

          // sessionStorage에서 주문 데이터 복구
          const pendingData = sessionStorage.getItem('pendingOrderData');
          if (pendingData) {
            const orderInfo = JSON.parse(pendingData);
            window.confirmPay(paymentResult, orderInfo.finalTotal, orderInfo.selectedCouponId, orderInfo.couponDiscount);
          } else {
            console.error('❌ 저장된 주문 데이터를 찾을 수 없습니다');
            alert('결제 정보를 찾을 수 없습니다. 메인 화면으로 이동합니다.');
            if (typeof renderMap === 'function') {
              renderMap();
            }
          }
        }
      })
      .catch(error => {
        console.error('❌ confirmPay 모듈 로드 실패:', error);
        alert('결제 처리 중 오류가 발생했습니다. 메인 화면으로 이동합니다.');
        if (typeof renderMap === 'function') {
          renderMap();
        }
      });

    return true;
  }
  return false;
}

// 앱 초기화 함수
function initializeApp() {
  // 토스페이먼츠 결제 성공 처리 우선 확인
  if (handleTossPaymentSuccess()) {
    return; // 결제 성공 처리 중이면 다른 로직 실행 안함
  }

  // 일반적인 로그인 상태 확인 후 적절한 화면 렌더링
  if (checkLoginStatus()) {
    // 로그인 상태면 지도 화면으로
    if (typeof renderMap === 'function') {
      renderMap();
    } else {
      console.error('❌ renderMap 함수를 찾을 수 없음');
    }
  } else {
    // 로그인하지 않은 상태면 로그인 화면으로
    if (typeof renderLogin === 'function') {
      renderLogin();
    } else {
      console.error('❌ renderLogin 함수를 찾을 수 없음');
    }
  }
}

// URL 파라미터 기반 리다이렉션 처리
function handleUrlRedirection() {
  // 로그인 상태 체크
  checkLoginStatus();

  // URL 파라미터 확인하여 리다이렉션 처리
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('redirect');

  if (redirect && window.userInfo) {
    console.log('🔗 URL 파라미터 리다이렉션:', redirect);

    // URL에서 파라미터 제거
    window.history.replaceState({}, document.title, window.location.pathname);

    setTimeout(() => {
      if (redirect === 'map' && typeof renderMap === 'function') {
        renderMap();
      } else if (redirect === 'mypage' && typeof renderMyPage === 'function') {
        renderMyPage();
      }
    }, 500);
  }
}

// 전역 함수로 설정
window.checkLoginStatus = checkLoginStatus;
window.handleTossPaymentSuccess = handleTossPaymentSuccess;
window.initializeApp = initializeApp;
window.handleUrlRedirection = handleUrlRedirection;
