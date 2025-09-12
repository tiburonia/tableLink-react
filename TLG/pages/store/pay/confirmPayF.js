
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

    // 1. 서버에 결제 준비 요청 (/api/toss/prepare)
    console.log('📋 서버에 결제 준비 요청 시작');
    
    const prepareData = {
      userId: userInfo.id,
      storeId: orderData.storeId || store?.id || store?.store_id,
      storeName: orderData.storeName || orderData.store || store?.name,
      tableNumber: orderData.tableNum || 1,
      orderData: {
        items: orderData.items || currentOrder || [],
        total: orderData.total || finalAmount,
        storeName: orderData.storeName || orderData.store || store?.name
      },
      amount: parseInt(finalAmount),
      usedPoint: parseInt(pointsUsed) || 0,
      couponDiscount: parseInt(couponDiscount) || 0,
      paymentMethod: paymentMethod || '카드'
    };

    console.log('📤 결제 준비 데이터:', prepareData);

    const prepareResponse = await fetch('/api/toss/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prepareData)
    });

    if (!prepareResponse.ok) {
      const errorData = await prepareResponse.json();
      throw new Error(errorData.error || '결제 준비 실패');
    }

    const prepareResult = await prepareResponse.json();
    const orderId = prepareResult.orderId;

    console.log('✅ 결제 준비 완료, orderId:', orderId);

    // 2. 토스페이먼츠 결제 요청 (orderId만 URL에 포함)
    console.log('💳 토스페이먼츠 결제 요청 - 결제 방법:', paymentMethod);
    
    const paymentResult = await window.requestTossPayment({
      amount: finalAmount,
      orderId: orderId,
      orderName: `${orderData.storeName || orderData.store} 주문`,
      customerName: userInfo.name || '고객',
      customerEmail: userInfo.email || 'customer@tablelink.com',
      successUrl: `${window.location.origin}/toss-success.html`,
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
