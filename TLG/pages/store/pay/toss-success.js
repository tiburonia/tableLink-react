/**
 * 토스페이먼츠 결제 성공 처리 페이지
 */

console.log('📱 결제 성공 페이지 로드');

// URL 파라미터 추출 (주문 정보 포함)
function getUrlParams() {
  console.log('🔍 URL 파라미터 추출 시작');
  const urlParams = new URLSearchParams(window.location.search);
  const params = {
    // 토스페이먼츠 기본 파라미터
    paymentKey: urlParams.get('paymentKey'),
    orderId: urlParams.get('orderId'),
    amount: urlParams.get('amount'),
    // 주문 정보 파라미터
    userId: urlParams.get('userId'),
    storeId: urlParams.get('storeId'),
    storeName: urlParams.get('storeName'),
    tableNumber: urlParams.get('tableNumber'),
    usedPoint: urlParams.get('usedPoint'),
    couponDiscount: urlParams.get('couponDiscount'),
    paymentMethod: urlParams.get('paymentMethod'),
    orderDataJson: urlParams.get('orderDataJson')
  };
  
  // orderData JSON 파싱
  if (params.orderDataJson) {
    try {
      params.orderData = JSON.parse(params.orderDataJson);
    } catch (error) {
      console.warn('⚠️ orderData JSON 파싱 실패:', error);
      params.orderData = null;
    }
  }
  
  console.log('✅ URL 파라미터 추출 완료:', {
    ...params,
    orderDataJson: params.orderDataJson ? 'JSON 데이터 존재' : '없음'
  });
  return params;
}

// TableLink로 돌아가기
function goBack() {
  console.log('🔙 TableLink로 돌아가기');
  window.location.href = '/';
}

// 상태 표시
function showStatus(message) {
  console.log('⏳ 상태 표시:', message);
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="status-icon">⏳</div>
    <h1>${message}</h1>
    <div class="loading-spinner"></div>
  `;
}

// 오류 표시
function showError(message) {
  console.error('❌ 오류 표시:', message);
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="status-icon">❌</div>
    <h1>결제 처리 실패</h1>
    <p class="error-message">${message}</p>
    <button class="btn" onclick="goBack()">TableLink로 돌아가기</button>
  `;
}

// 성공 표시
function showSuccess(orderData) {
  console.log('✅ 성공 표시:', orderData);
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="status-icon">✅</div>
    <h1>결제 완료!</h1>
    <div class="order-info">
      <h3>주문 정보</h3>
      <p><strong>매장:</strong> ${orderData.storeName || '알 수 없음'}</p>
      <p><strong>테이블:</strong> ${orderData.tableNumber || '알 수 없음'}</p>
      <p><strong>주문번호:</strong> ${orderData.orderId || '알 수 없음'}</p>
      <p><strong>결제금액:</strong> ${parseInt(orderData.finalTotal || orderData.amount || 0).toLocaleString()}원</p>
    </div>
    <button class="btn" onclick="goBack()">TableLink로 돌아가기</button>
  `;
}

// 메인 처리 함수
async function handlePaymentSuccess() {
  try {
    console.log('🔄 결제 성공 처리 함수 시작');

    const urlParams = getUrlParams();
    const { paymentKey, orderId, amount } = urlParams;
    console.log('📋 추출된 파라미터:', { paymentKey, orderId, amount });

    if (!paymentKey || !orderId || !amount) {
      console.error('❌ 필수 파라미터 누락:', { paymentKey: !!paymentKey, orderId: !!orderId, amount: !!amount });
      throw new Error('결제 정보가 올바르지 않습니다.');
    }

    console.log('🔄 TLL 결제 성공 처리 시작:', { paymentKey, orderId, amount });
    showStatus('결제 승인 처리 중');

    // 1. 주문 정보 통합 처리 (URL 파라미터 우선, 저장된 데이터 폴백)
    console.log('📋 주문 정보 통합 처리 시작...');
    
    let orderInfo = {};

    // URL 파라미터에서 주문 정보 추출
    if (urlParams.userId && urlParams.storeId) {
      console.log('✅ URL 파라미터에서 주문 정보 발견');
      orderInfo = {
        userId: urlParams.userId,
        storeId: parseInt(urlParams.storeId),
        storeName: urlParams.storeName,
        tableNumber: parseInt(urlParams.tableNumber) || 1,
        orderData: urlParams.orderData || { items: [] },
        usedPoint: parseInt(urlParams.usedPoint) || 0,
        couponDiscount: parseInt(urlParams.couponDiscount) || 0,
        paymentMethod: urlParams.paymentMethod || '카드'
      };
      console.log('📋 URL에서 추출한 주문 정보:', orderInfo);
    } else {
      // 폴백: 전역 객체 또는 sessionStorage에서 시도
      console.warn('⚠️ URL 파라미터에 주문 정보 없음, 저장된 데이터에서 시도');
      
      if (window.tablelink && window.tablelink.pendingPaymentData) {
        orderInfo = window.tablelink.pendingPaymentData;
        console.log('📦 전역 객체에서 데이터 복구:', orderInfo);
      } else {
        const sessionData = sessionStorage.getItem('pendingOrderData');
        if (sessionData) {
          try {
            orderInfo = JSON.parse(sessionData);
            console.log('📦 sessionStorage에서 데이터 복구:', orderInfo);
          } catch (error) {
            console.error('❌ sessionStorage 파싱 실패:', error);
          }
        }
      }
    }

    // 2. API 호출 전 로그
    console.log('🚀 API 호출 준비 중...');
    console.log('📤 전송할 데이터 준비:', {
      paymentKey,
      orderId,
      amount,
      userId: orderInfo.userId,
      storeId: orderInfo.storeId,
      storeName: orderInfo.storeName,
      tableNumber: orderInfo.tableNumber,
      orderData: orderInfo.orderData ? '객체 존재' : '없음',
      usedPoint: orderInfo.usedPoint,
      selectedCouponId: orderInfo.selectedCouponId,
      couponDiscount: orderInfo.couponDiscount,
      paymentMethod: orderInfo.paymentMethod
    });

    // 3. 결제 승인 API 호출
    console.log('📡 API 호출 시작: /api/toss/confirm');

    const response = await fetch('/api/toss/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount),
        userId: orderInfo.userId,
        storeId: orderInfo.storeId,
        storeName: orderInfo.storeName,
        tableNumber: orderInfo.tableNumber,
        orderData: orderInfo.orderData,
        usedPoint: orderInfo.usedPoint || 0,
        selectedCouponId: orderInfo.selectedCouponId,
        couponDiscount: orderInfo.couponDiscount || 0,
        paymentMethod: orderInfo.paymentMethod || '카드'
      })
    });

    console.log('📡 API 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API 응답 오류:', errorData);
      throw new Error(errorData.error || `서버 오류 (${response.status})`);
    }

    const result = await response.json();
    console.log('✅ API 응답 성공:', result);

    // 4. 성공 화면 표시
    const displayOrderInfo = {
      storeName: orderInfo.storeName || '매장',
      tableNumber: orderInfo.tableNumber || '테이블',
      orderId: orderId,
      amount: amount,
      finalTotal: amount
    };

    console.log('🎉 결제 성공 처리 완료');
    showSuccess(displayOrderInfo);

    // 5. 전역 객체 정리
    if (window.tablelink && window.tablelink.pendingPaymentData) {
      delete window.tablelink.pendingPaymentData;
      console.log('🧹 전역 객체 정리 완료');
    }

    // sessionStorage 정리
    sessionStorage.removeItem('pendingOrderData');

  } catch (error) {
    console.error('❌ TLL 결제 성공 처리 실패:', error);
    showError(error.message || '결제 처리 중 오류가 발생했습니다');
  }
}

// 페이지 로드 시 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handlePaymentSuccess);
} else {
  handlePaymentSuccess();
}