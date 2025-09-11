/**
 * 토스페이먼츠 결제 성공 처리 페이지
 */

console.log('📱 결제 성공 페이지 로드');

// URL 파라미터 추출
function getUrlParams() {
  console.log('🔍 URL 파라미터 추출 시작');
  const urlParams = new URLSearchParams(window.location.search);
  const params = {
    paymentKey: urlParams.get('paymentKey'),
    orderId: urlParams.get('orderId'),
    amount: urlParams.get('amount')
  };
  console.log('✅ URL 파라미터 추출 완료:', params);
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

    const { paymentKey, orderId, amount } = getUrlParams();
    console.log('📋 추출된 파라미터:', { paymentKey, orderId, amount });

    if (!paymentKey || !orderId || !amount) {
      console.error('❌ 필수 파라미터 누락:', { paymentKey: !!paymentKey, orderId: !!orderId, amount: !!amount });
      throw new Error('결제 정보가 올바르지 않습니다.');
    }

    console.log('🔄 TLL 결제 성공 처리 시작:', { paymentKey, orderId, amount });
    showStatus('결제 승인 처리 중');

    // 1. 전역 객체에서 주문 정보 가져오기
    console.log('📋 전역 객체에서 주문 정보 조회 시작...');
    console.log('🔍 window.tablelink 존재 여부:', !!window.tablelink);
    console.log('🔍 window.tablelink.pendingPaymentData 존재 여부:', !!(window.tablelink && window.tablelink.pendingPaymentData));

    let pendingOrderData = {};

    if (window.tablelink && window.tablelink.pendingPaymentData) {
      pendingOrderData = window.tablelink.pendingPaymentData;
      console.log('✅ 전역 객체에서 데이터 로드 성공:', pendingOrderData);
      console.log('🔍 로드된 데이터 상세 확인:', {
        userId: pendingOrderData.userId,
        storeId: pendingOrderData.storeId,
        storeName: pendingOrderData.storeName,
        tableNumber: pendingOrderData.tableNumber,
        hasOrderData: !!pendingOrderData.orderData,
        orderDataType: typeof pendingOrderData.orderData,
        orderDataKeys: pendingOrderData.orderData ? Object.keys(pendingOrderData.orderData) : 'none'
      });
    } else {
      // 폴백: sessionStorage에서 시도
      console.warn('⚠️ 전역 객체에 pendingPaymentData가 없음, sessionStorage에서 시도');
      const sessionData = sessionStorage.getItem('pendingOrderData');
      if (sessionData) {
        try {
          pendingOrderData = JSON.parse(sessionData);
          console.log('📦 sessionStorage에서 데이터 복구:', pendingOrderData);
        } catch (error) {
          console.error('❌ sessionStorage 파싱 실패:', error);
        }
      }
    }

    // 2. API 호출 전 로그
    console.log('🚀 API 호출 준비 중...');
    console.log('📤 전송할 데이터 준비:', {
      paymentKey,
      orderId,
      amount,
      userId: pendingOrderData.userId,
      storeId: pendingOrderData.storeId,
      storeName: pendingOrderData.storeName,
      tableNumber: pendingOrderData.tableNumber,
      orderData: pendingOrderData.orderData ? '객체 존재' : '없음',
      usedPoint: pendingOrderData.usedPoint,
      selectedCouponId: pendingOrderData.selectedCouponId,
      couponDiscount: pendingOrderData.couponDiscount,
      paymentMethod: pendingOrderData.paymentMethod
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
        userId: pendingOrderData.userId,
        storeId: pendingOrderData.storeId,
        storeName: pendingOrderData.storeName,
        tableNumber: pendingOrderData.tableNumber,
        orderData: pendingOrderData.orderData,
        usedPoint: pendingOrderData.usedPoint || 0,
        selectedCouponId: pendingOrderData.selectedCouponId,
        couponDiscount: pendingOrderData.couponDiscount || 0,
        paymentMethod: pendingOrderData.paymentMethod || '카드'
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
    const orderInfo = {
      storeName: pendingOrderData.storeName || '매장',
      tableNumber: pendingOrderData.tableNumber || '테이블',
      orderId: orderId,
      amount: amount,
      finalTotal: amount
    };

    console.log('🎉 결제 성공 처리 완료');
    showSuccess(orderInfo);

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