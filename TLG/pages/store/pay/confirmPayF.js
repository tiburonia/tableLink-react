// 쿠키에서 userInfo를 가져오는 헬퍼 함수
function getUserInfoFromCookie() {
  try {
    // 쿠키에서 userInfo 찾기
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

    if (userInfoCookie) {
      const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
      return JSON.parse(userInfoValue);
    }

    // 쿠키에 없으면 localStorage 확인
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

async function confirmPay(orderData, pointsUsed, store, currentOrder, finalAmount, couponId = null, couponDiscount = 0, paymentMethod = '카드') {
  console.log('💳 결제 확인 처리 시작');
  console.log('주문 데이터:', orderData);
  console.log('사용 포인트:', pointsUsed);
  console.log('최종 금액:', finalAmount);
  console.log('쿠폰 ID:', couponId);
  console.log('쿠폰 할인:', couponDiscount);

  // userInfo 안전하게 가져오기 (쿠키 우선)
  const userInfo = getUserInfoFromCookie();
  if (!userInfo || !userInfo.id) {
    console.error('❌ 사용자 정보 없음:', {
      cookies: document.cookie,
      localStorage: localStorage.getItem('userInfo'),
      windowUserInfo: window.userInfo
    });
    throw new Error('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
  }

  console.log('✅ 사용자 정보 확인:', userInfo.id);

  try {
    // 토스페이먼츠 모듈 동적 로드
    if (!window.requestTossPayment) {
      console.log('🔄 토스페이먼츠 모듈 로드 중...');

      try {
        await import('/TLG/pages/store/pay/tossPayments.js');
        console.log('✅ 토스페이먼츠 모듈 import 완료');
      } catch (importError) {
        console.error('❌ 토스페이먼츠 모듈 import 실패:', importError);
        throw new Error('토스페이먼츠 모듈을 불러올 수 없습니다.');
      }

      // 모듈 로드 후 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!window.requestTossPayment) {
        throw new Error('토스페이먼츠 모듈을 로드할 수 없습니다.');
      }
      console.log('✅ 토스페이먼츠 모듈 로드 완료');
    }

    // 토스페이먼츠 결제 처리
    console.log('💳 토스페이먼츠 결제 시작');

    const orderId = `TLL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 주문 데이터를 sessionStorage에 저장 (결제 성공 후 사용)
    const pendingOrderData = {
      userId: userInfo.id,
      storeId: orderData.storeId,
      storeName: orderData.store,
      tableNumber: orderData.tableNum,
      orderData: {
        store: orderData.store,
        storeId: orderData.storeId,
        date: orderData.date,
        table: orderData.table,
        tableNum: orderData.tableNum,
        items: orderData.items,
        total: orderData.total
      },
      usedPoint: pointsUsed || 0,
      finalTotal: finalAmount,
      selectedCouponId: couponId,
      couponDiscount: couponDiscount || 0,
      paymentMethod: paymentMethod
    };

    console.log('💾 주문 데이터 sessionStorage 저장:', pendingOrderData);

    try {
      sessionStorage.setItem('pendingOrderData', JSON.stringify(pendingOrderData));
      console.log('✅ sessionStorage 저장 성공');
    } catch (storageError) {
      console.error('❌ sessionStorage 저장 실패:', storageError);
      // sessionStorage 실패 시 대안으로 window 객체에 저장
      window.pendingOrderData = pendingOrderData;
    }

    // 토스페이먼츠 결제 (SPA 방식)
    const paymentResult = await window.requestTossPayment({
      amount: finalAmount,
      orderId: orderId,
      orderName: `${orderData.store} 주문`,
      customerName: userInfo.name || '고객',
      customerEmail: userInfo.email || 'guest@tablelink.com',
      customerMobilePhone: userInfo.phone || undefined
    }, paymentMethod);

    if (!paymentResult.success) {
      // 결제 실패/취소 시 저장된 주문 데이터 삭제
      sessionStorage.removeItem('pendingOrderData');
      delete window.pendingOrderData;

      if (paymentResult.cancelled) {
        throw new Error('결제가 취소되었습니다.');
      } else {
        throw new Error(paymentResult.message || '결제 처리 중 오류가 발생했습니다.');
      }
    }

    console.log('✅ 토스페이먼츠 결제 및 승인 완료:', paymentResult);

    // 주문 처리 API 호출 (이미 PG 승인 완료된 상태)
    const response = await fetch('/api/orders/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userInfo.id,
        storeId: orderData.storeId,
        storeName: orderData.store,
        tableNumber: orderData.tableNum,
        orderData: {
          store: orderData.store,
          storeId: orderData.storeId,
          date: orderData.date,
          table: orderData.table,
          tableNum: orderData.tableNum,
          items: orderData.items,
          total: orderData.total
        },
        usedPoint: pointsUsed || 0,
        finalTotal: finalAmount,
        selectedCouponId: couponId,
        couponDiscount: couponDiscount || 0,
        // PG 결제 정보 (이미 승인 완료)
        pgPaymentKey: paymentResult.paymentKey,
        pgOrderId: paymentResult.orderId,
        pgPaymentMethod: paymentResult.method || 'CARD'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '주문 처리에 실패했습니다.');
    }

    const result = await response.json();
    console.log('✅ 결제 성공:', result);

    // 저장된 주문 데이터 정리
    sessionStorage.removeItem('pendingOrderData');
    delete window.pendingOrderData;

    // 결제 성공 UI 모듈 동적 로드 및 렌더링
    if (!window.renderPaymentSuccess) {
      console.log('🔄 결제 성공 UI 모듈 로드 중...');

      try {
        await import('/TLG/pages/store/pay/paymentSuccessUI.js');
        console.log('✅ 결제 성공 UI 모듈 import 완료');
      } catch (importError) {
        console.error('❌ 결제 성공 UI 모듈 import 실패:', importError);
        throw new Error('결제 성공 UI를 불러올 수 없습니다.');
      }
    }

    // 결제 성공 UI 렌더링
    if (typeof window.renderPaymentSuccess === 'function') {
      window.renderPaymentSuccess(orderData, paymentResult, userInfo);
    } else {
      console.error('❌ renderPaymentSuccess 함수를 찾을 수 없습니다');
      throw new Error('결제 성공 화면을 표시할 수 없습니다.');
    }

    console.log('✅ 결제 성공 페이지 렌더링 완료');

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);

    // 결제 실패 UI 모듈 동적 로드 및 렌더링
    handlePaymentFailure(error, orderData, currentOrder, store);
  }
}

// 결제 실패 처리 함수
async function handlePaymentFailure(error, orderData, currentOrder, store) {
  console.log('❌ 결제 실패 처리 시작:', error.message);

  try {
    // 결제 실패 UI 모듈 동적 로드
    if (!window.renderPaymentFailure) {
      console.log('🔄 결제 실패 UI 모듈 로드 중...');

      try {
        await import('/TLG/pages/store/pay/paymentFailureUI.js');
        console.log('✅ 결제 실패 UI 모듈 import 완료');
      } catch (importError) {
        console.error('❌ 결제 실패 UI 모듈 import 실패:', importError);
        // 폴백으로 paymentSuccessUI에서 실패 함수 로드 시도
        try {
          await import('/TLG/pages/store/pay/paymentSuccessUI.js');
          console.log('✅ 결제 실패 UI 모듈 폴백 import 완료');
        } catch (fallbackError) {
          console.error('❌ 결제 실패 UI 모듈 폴백 import도 실패:', fallbackError);
          throw new Error('결제 실패 UI를 불러올 수 없습니다.');
        }
      }
    }

    // 결제 실패 UI 렌더링
    if (typeof window.renderPaymentFailure === 'function') {
      window.renderPaymentFailure(error, orderData);
    } else {
      throw new Error('결제 실패 UI 함수를 찾을 수 없습니다');
    }
  } catch (loadError) {
    console.error('❌ 결제 실패 UI 로드 실패:', loadError);

    // 폴백: 기본 에러 알림
    alert('결제 처리 중 오류가 발생했습니다: ' + error.message);

    // 주문 화면으로 돌아가기
    try {
      if (typeof renderOrderScreen === 'function') {
        renderOrderScreen(store, orderData.tableNum);
      } else if (typeof renderMap === 'function') {
        renderMap();
      } else {
        window.location.href = '/';
      }
    } catch (redirectError) {
      console.error('❌ 화면 리다이렉트 실패:', redirectError);
      window.location.href = '/';
    }
  }
}

// 결제 성공 후 메시지 처리를 위한 이벤트 리스너 추가
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PAYMENT_SUCCESS') {
    console.log('💳 결제 성공 메시지 수신:', event.data);

    if (event.data.action === 'GO_TO_MAIN') {
      // 로그인 정보 유지하며 메인으로 이동
      if (typeof renderMap === 'function') {
        renderMap();
      } else {
        window.location.href = '/';
      }
    } else if (event.data.action === 'GO_TO_MYPAGE') {
      // 마이페이지로 이동
      if (typeof renderMyPage === 'function') {
        renderMyPage();
      } else {
        window.location.href = '/mypage';
      }
    }
  }
});

// 함수를 전역으로 등록
window.confirmPay = confirmPay;
window.handlePaymentFailure = handlePaymentFailure;

console.log('✅ confirmPay 및 결제 실패 처리 함수가 전역으로 등록되었습니다');