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

  // userInfo 안전하게 가져오기 (다중 소스 체크)
  let userInfo = getUserInfoFromCookie();

  // 쿠키에서 실패시 다른 소스들 확인
  if (!userInfo || !userInfo.id) {
    // window.userInfo 확인
    if (window.userInfo && window.userInfo.id) {
      userInfo = window.userInfo;
      console.log('✅ window.userInfo에서 사용자 정보 복구');
    } else {
      console.error('❌ 모든 소스에서 사용자 정보 없음:', {
        cookies: document.cookie ? '존재함' : '없음',
        localStorage: localStorage.getItem('userInfo') ? '존재함' : '없음',
        windowUserInfo: window.userInfo ? '존재함' : '없음'
      });

      // 사용자에게 친화적인 메시지와 함께 로그인 유도
      alert('로그인 정보가 만료되었습니다. 다시 로그인해주세요.');

      // 로그인 페이지로 이동
      if (typeof renderLogin === 'function') {
        renderLogin();
      } else {
        window.location.reload();
      }

      throw new Error('로그인 정보를 찾을 수 없습니다.');
    }
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

    // 테이블 번호 정규화 처리
    const normalizedTableNumber = parseInt(orderData.tableNum) || parseInt(orderData.table) || orderData.tableNum || orderData.table;

    // 주문 데이터를 sessionStorage에 저장 (결제 성공 후 사용)
    const pendingOrderData = {
      userId: userInfo.id,
      storeId: orderData.storeId,
      storeName: orderData.store,
      tableNumber: normalizedTableNumber,
      orderData: {
        store: orderData.store,
        storeId: orderData.storeId,
        date: orderData.date,
        table: orderData.table,
        tableNum: normalizedTableNumber,
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

    // 사용자 정보 안전성 검증 (전화번호 유효성 추가 확인)
    let validPhone = null;
    if (userInfo.phone && userInfo.phone.trim()) {
      const phoneStr = userInfo.phone.trim();
      const phoneDigits = phoneStr.replace(/\D/g, '');

      // 유효한 전화번호 형식인지 확인
      if ((phoneDigits.length === 11 && phoneDigits.startsWith('010')) ||
          (phoneDigits.length >= 10 && phoneDigits.length <= 11 && phoneDigits.startsWith('01'))) {
        validPhone = phoneStr;
      }
    }

    const safeUserInfo = {
      name: userInfo.name || '고객',
      email: userInfo.email || 'guest@tablelink.com',
      phone: validPhone
    };

    console.log('👤 검증된 사용자 정보:', {
      name: safeUserInfo.name,
      email: safeUserInfo.email,
      hasPhone: !!safeUserInfo.phone
    });

    // 토스페이먼츠 결제 데이터 준비
    const tossPaymentData = {
      amount: finalAmount,
      orderId: orderId,
      orderName: `${orderData.store} 주문`,
      customerName: safeUserInfo.name,
      customerEmail: safeUserInfo.email
    };

    // 전화번호가 있을 때만 추가
    if (safeUserInfo.phone) {
      tossPaymentData.customerMobilePhone = safeUserInfo.phone;
    }

    // 토스페이먼츠 결제창 호출 (현재 창에서 리다이렉트)
    const paymentResult = await window.requestTossPayment(tossPaymentData, paymentMethod);

    if (!paymentResult.success) {
      throw new Error(paymentResult.message || '토스페이먼츠 결제 실패');
    }

    console.log('✅ 토스페이먼츠 결제 리다이렉트 시작:', paymentResult);

    // 🔄 성공 처리 및 리다이렉트
    console.log('✅ 결제 및 주문 완료 - 지도 화면으로 이동');

    // 지도 화면으로 리다이렉트
    window.location.href = '/?redirect=map';

    // 실제로는 결제창으로 리다이렉트되므로, 여기서는 더 이상 처리가 되지 않습니다.
    // 아래 코드는 이전 로직의 일부로, 새로운 SPA 구조에서는 불필요하여 주석 처리합니다.
    /*
    const result = paymentResult; // 실제 결제 성공 시 반환되는 객체 형태에 따라 수정 필요
    if (result.success) {
      console.log('✅ 결제 및 주문 완료 - 성공 페이지로 이동');

      // 성공 페이지로 리다이렉트 (URL에 결제 정보 포함)
      const successUrl = `/toss-success.html?paymentKey=${result.paymentKey}&orderId=${result.orderId}&amount=${result.amount}`;
      window.location.href = successUrl;
    } else {
      throw new Error(result.message || '결제 정보 처리 실패');
    }
    */

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