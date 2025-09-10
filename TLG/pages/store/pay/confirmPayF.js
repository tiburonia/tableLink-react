
/**
 * 결제 확인 처리 모듈 (완전 재작성)
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
  console.log('💳 결제 확인 처리 시작');

  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.id) {
    throw new Error('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
  }

  try {
    // 토스페이먼츠 모듈 로드
    if (!window.requestTossPayment) {
      console.log('🔄 토스페이먼츠 모듈 로드 중...');
      await import('/TLG/pages/store/pay/tossPayments.js');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!window.requestTossPayment) {
        throw new Error('토스페이먼츠 모듈을 로드할 수 없습니다.');
      }
    }

    // 주문 ID 생성
    const orderId = `TLL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 주문 데이터 저장 (결제 성공 후 사용)
    const orderInfo = {
      userId: userInfo.id,
      storeId: orderData.storeId,
      storeName: orderData.store,
      tableNumber: orderData.tableNum,
      orderData: orderData,
      usedPoint: pointsUsed || 0,
      finalTotal: finalAmount,
      selectedCouponId: couponId,
      couponDiscount: couponDiscount || 0,
      paymentMethod: paymentMethod,
      orderId: orderId
    };

    console.log('💾 주문 정보 저장:', orderInfo);
    sessionStorage.setItem('pendingOrderData', JSON.stringify(orderInfo));

    // 토스페이먼츠 결제 요청
    console.log('💳 토스페이먼츠 결제 요청 - 결제 방법:', paymentMethod);
    
    const paymentResult = await window.requestTossPayment({
      amount: finalAmount,
      orderId: orderId,
      orderName: `${orderData.storeName || orderData.store} 주문`,
      customerName: userInfo.name || '고객',
      customerEmail: userInfo.email || 'customer@tablelink.com'
    }, paymentMethod);

    console.log('✅ 토스페이먼츠 결제 결과:', paymentResult);

    if (!paymentResult.success) {
      throw new Error(paymentResult.message || '결제에 실패했습니다.');
    }

  } catch (error) {
    console.error('❌ 결제 처리 중 오류:', error);
    alert(`결제 실패: ${error.message}`);
  }
}

// 결제 성공 후 처리 (toss-success.html에서 호출)
async function processPaymentSuccess(paymentKey, orderId, amount) {
  try {
    console.log('🔄 결제 성공 후 처리 시작');

    // 1. 토스페이먼츠 결제 승인
    const confirmResponse = await fetch('/api/toss/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) })
    });

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      throw new Error(errorData.error || '결제 승인 실패');
    }

    const confirmResult = await confirmResponse.json();
    console.log('✅ 결제 승인 완료:', confirmResult);

    // 2. 주문 처리
    const pendingOrderData = JSON.parse(sessionStorage.getItem('pendingOrderData') || '{}');
    
    if (!pendingOrderData.userId) {
      throw new Error('주문 정보를 찾을 수 없습니다.');
    }

    const orderResponse = await fetch('/api/orders/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: pendingOrderData.userId,
        storeId: pendingOrderData.storeId,
        storeName: pendingOrderData.storeName,
        tableNumber: pendingOrderData.tableNumber,
        orderData: pendingOrderData.orderData,
        usedPoint: pendingOrderData.usedPoint,
        finalTotal: pendingOrderData.finalTotal,
        selectedCouponId: pendingOrderData.selectedCouponId,
        couponDiscount: pendingOrderData.couponDiscount,
        pgPaymentKey: paymentKey,
        pgOrderId: orderId,
        pgPaymentMethod: pendingOrderData.paymentMethod || 'CARD'
      })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(errorData.error || '주문 처리 실패');
    }

    const orderResult = await orderResponse.json();
    console.log('✅ 주문 처리 완료:', orderResult);

    // 3. 성공 페이지 표시
    sessionStorage.removeItem('pendingOrderData');
    return { success: true, data: { ...orderResult, pendingOrderData } };

  } catch (error) {
    console.error('❌ 결제 후 처리 실패:', error);
    return { success: false, error: error.message };
  }
}

// 전역 함수로 등록
window.confirmPay = confirmPay;
window.processPaymentSuccess = processPaymentSuccess;

console.log('✅ 결제 확인 모듈 로드 완료');
