
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
      storeId: orderData.storeId || store?.id || store?.store_id,
      storeName: orderData.storeName || orderData.store || store?.name,
      tableNumber: orderData.tableNum || 1,
      orderData: {
        items: orderData.items || currentOrder || [],
        total: orderData.total || finalAmount,
        storeName: orderData.storeName || orderData.store || store?.name
      },
      usedPoint: parseInt(pointsUsed) || 0,
      finalTotal: parseInt(finalAmount),
      subtotal: parseInt(orderData.total || finalAmount),
      selectedCouponId: couponId || null,
      couponDiscount: parseInt(couponDiscount) || 0,
      paymentMethod: paymentMethod || '카드',
      orderId: orderId
    };

    // URL에 주문 정보를 쿼리 파라미터로 추가
    const orderParams = new URLSearchParams({
      userId: orderInfo.userId,
      storeId: orderInfo.storeId,
      storeName: orderInfo.storeName,
      tableNumber: orderInfo.tableNumber,
      usedPoint: orderInfo.usedPoint,
      couponDiscount: orderInfo.couponDiscount,
      paymentMethod: orderInfo.paymentMethod,
      orderDataJson: JSON.stringify(orderInfo.orderData)
    });

    console.log('💾 주문 정보 저장:', orderInfo);
    console.log('🔍 매장 정보 확인:', { store, storeId: orderData.storeId || store?.id });
    console.log('🔍 아이템 정보 확인:', { items: orderData.items || currentOrder });
    
    // 전역 객체와 sessionStorage 모두에 결제 데이터 저장 (이중 백업)
    if (!window.tablelink) {
      window.tablelink = {};
    }
    
    window.tablelink.pendingPaymentData = orderInfo;
    sessionStorage.setItem('pendingOrderData', JSON.stringify(orderInfo));
    
    console.log('✅ 전역 객체와 sessionStorage에 결제 데이터 저장 완료');
    console.log('🔍 저장된 데이터 확인:', {
      userId: orderInfo.userId,
      storeId: orderInfo.storeId,
      storeName: orderInfo.storeName,
      tableNumber: orderInfo.tableNumber,
      hasOrderData: !!orderInfo.orderData,
      orderDataType: typeof orderInfo.orderData,
      usedPoint: orderInfo.usedPoint,
      selectedCouponId: orderInfo.selectedCouponId,
      couponDiscount: orderInfo.couponDiscount,
      paymentMethod: orderInfo.paymentMethod,
      finalTotal: orderInfo.finalTotal
    });

    // 토스페이먼츠 결제 요청
    console.log('💳 토스페이먼츠 결제 요청 - 결제 방법:', paymentMethod);
    
    const paymentResult = await window.requestTossPayment({
      amount: finalAmount,
      orderId: orderId,
      orderName: `${orderData.storeName || orderData.store} 주문`,
      customerName: userInfo.name || '고객',
      customerEmail: userInfo.email || 'customer@tablelink.com',
      successUrl: `${window.location.origin}/toss-success.html?${orderParams.toString()}`,
      failUrl: `${window.location.origin}/toss-fail.html`
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

// processPaymentSuccess 함수는 toss-success.js에서 처리

// 전역 함수로 등록
window.confirmPay = confirmPay;

console.log('✅ 결제 확인 모듈 로드 완료');
