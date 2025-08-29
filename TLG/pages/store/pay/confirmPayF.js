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
      await import('/TLG/pages/store/pay/tossPayments.js');

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
      couponDiscount: couponDiscount || 0
    };

    console.log('💾 주문 데이터 sessionStorage 저장:', pendingOrderData);
    sessionStorage.setItem('pendingOrderData', JSON.stringify(pendingOrderData));

    // 토스페이먼츠 결제창 호출 (현재 창에서 리다이렉트)
    const paymentResult = await window.requestTossPayment({
      amount: finalAmount,
      orderId: orderId,
      orderName: `${orderData.store} 주문`,
      customerName: userInfo.name || '게스트',
      customerEmail: userInfo.email || 'guest@tablelink.com',
      customerMobilePhone: userInfo.phone || ''
    }, paymentMethod);

    if (!paymentResult.success) {
      throw new Error(paymentResult.message || '토스페이먼츠 결제 실패');
    }

    console.log('✅ 토스페이먼츠 결제 리다이렉트 시작:', paymentResult);

    // 결제창으로 리다이렉트되므로 여기서는 더 이상 처리하지 않음
    return { success: true, redirecting: true, message: '결제창으로 이동 중입니다.' };
  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);

    // 결제 실패 UI 모듈 동적 로드 및 렌더링
    handlePaymentFailure(error, orderData, currentOrder, store);
  }
}

// 결제 실패 처리 함수
async function handlePaymentFailure(error, orderData, currentOrder, store) {
  try {
    // 결제 실패 UI 모듈 동적 로드
    if (!window.renderPaymentFailure) {
      console.log('🔄 결제 실패 UI 모듈 로드 중...');
      await import('/TLG/pages/store/pay/paymentFailureUI.js');
    }

    // 결제 실패 UI 렌더링
    if (typeof window.renderPaymentFailure === 'function') {
      window.renderPaymentFailure(error, orderData, currentOrder, store);
    } else {
      throw new Error('결제 실패 UI 모듈을 로드할 수 없습니다');
    }
  } catch (loadError) {
    console.error('❌ 결제 실패 UI 로드 실패:', loadError);

    // 폴백: 기본 에러 알림
    alert('결제 처리 중 오류가 발생했습니다: ' + error.message);

    // 주문 화면으로 돌아가기
    if (typeof renderOrderScreen === 'function') {
      renderOrderScreen(store, orderData.tableNum);
    } else if (typeof renderMap === 'function') {
      renderMap();
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