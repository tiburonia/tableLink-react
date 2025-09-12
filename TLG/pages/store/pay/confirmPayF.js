/**
 * 결제 확인 처리 모듈 (새로운 prepare-confirm 시스템)
 */

// 사용자 정보 가져오기
function getUserInfo() {
  try {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

    if (userInfoCookie) {
      const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
      return JSON.parse(userInfoValue);
    }

    const localStorageUserInfo = localStorage.getItem('userInfo');
    if (localStorageUserInfo) {
      return JSON.parse(localStorageUserInfo);
    }

    if (window.userInfo && window.userInfo.id) {
      return window.userInfo;
    }

    return null;
  } catch (error) {
    console.error('❌ 사용자 정보 파싱 오류:', error);
    return null;
  }
}

// 메인 결제 확인 함수
async function confirmPay(orderData, pointsUsed, store, currentOrder, finalAmount, couponId = null, couponDiscount = 0, paymentMethod = '카드') {
  console.log('💳 새로운 결제 시스템 - 결제 확인 처리 시작');
  console.log('📋 결제 파라미터:', {
    orderData,
    pointsUsed,
    finalAmount,
    paymentMethod,
    storeName: store?.name || orderData?.storeName
  });

  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.id) {
    throw new Error('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
  }

  try {
    // 토스페이먼츠 모듈 로드 확인
    if (!window.requestTossPayment) {
      console.log('🔄 토스페이먼츠 모듈 로드 중...');
      await import('/TLG/pages/store/pay/tossPayments.js');

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!window.requestTossPayment) {
        throw new Error('토스페이먼츠 모듈을 로드할 수 없습니다.');
      }
    }

    // 1. /api/toss/prepare 요청으로 pending_payments에 저장
    console.log('🔄 결제 준비 요청 시작');

    // 데이터 타입 검증 및 변환
    const validUserId = parseInt(userInfo.id);
    const validStoreId = parseInt(store.id || store.store_id);
    const validTableNumber = parseInt(orderData.tableNum || 1); // orderData.tableNum이 없을 경우 기본값 1
    const validAmount = parseInt(finalAmount);
    const validPointsUsed = parseInt(pointsUsed) || 0;
    const validCouponDiscount = parseInt(couponDiscount) || 0;

    if (isNaN(validUserId) || isNaN(validStoreId) || isNaN(validTableNumber) || isNaN(validAmount)) {
      console.error('❌ 잘못된 결제 데이터:', {
        userId: userInfo.id,
        storeId: store.id || store.store_id,
        tableNum: orderData.tableNum,
        finalAmount: finalAmount
      });
      throw new Error('결제 데이터가 올바르지 않습니다');
    }

    console.log('✅ 결제 데이터 검증 완료:', {
      validUserId,
      validStoreId,
      validTableNumber,
      validAmount,
      validPointsUsed,
      validCouponDiscount
    });

    const prepareResponse = await fetch('/api/toss/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: validUserId,
        storeId: validStoreId,
        storeName: orderData.storeName || orderData.store || store?.name,
        tableNumber: validTableNumber,
        orderData: {
          items: orderData.items || currentOrder || [],
          total: orderData.total || finalAmount,
          storeName: orderData.storeName || orderData.store || store?.name
        },
        amount: validAmount,
        usedPoint: validPointsUsed,
        couponDiscount: validCouponDiscount,
        paymentMethod: paymentMethod || '카드'
      })
    });

    if (!prepareResponse.ok) {
      const errorData = await prepareResponse.json();
      throw new Error(errorData.error || '결제 준비 실패');
    }

    const prepareResult = await prepareResponse.json();
    const generatedOrderId = prepareResult.orderId;

    console.log('✅ 결제 준비 완료, orderId:', generatedOrderId);

    // 2. 토스페이먼츠 결제 요청 (orderId만 URL에 포함)
    console.log('💳 토스페이먼츠 결제 요청 - 결제 방법:', paymentMethod);

    const paymentResult = await window.requestTossPayment({
      amount: finalAmount,
      orderId: generatedOrderId,
      orderName: `${orderData.storeName || orderData.store || store?.name} 주문`,
      customerName: userInfo.name || '고객',
      customerEmail: userInfo.email || 'customer@tablelink.com',
      successUrl: `${window.location.origin}/toss-success.html`,
      failUrl: `${window.location.origin}/toss-fail.html`
    }, paymentMethod);

    console.log('✅ 토스페이먼츠 결제 결과:', paymentResult);

    if (!paymentResult.success) {
      throw new Error(paymentResult.error || '결제에 실패했습니다.');
    }

  } catch (error) {
    console.error('❌ 결제 처리 중 오류:', error);
    alert(`결제 실패: ${error.message}`);
    throw error;
  }
}

// 전역 함수로 등록
window.confirmPay = confirmPay;

console.log('✅ 새로운 결제 확인 모듈 로드 완료 - confirmPay 전역 등록:', typeof window.confirmPay);