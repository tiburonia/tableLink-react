
/**
 * 토스페이먼츠 결제 성공 처리 페이지
 */

console.log('🔄 토스 결제 성공 페이지 로드');

// URL 파라미터 추출
function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    paymentKey: urlParams.get('paymentKey'),
    orderId: urlParams.get('orderId'),
    amount: urlParams.get('amount')
  };
}

// TableLink로 돌아가기
function goBack() {
  window.location.href = '/';
}

// 상태 표시
function showStatus(message) {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="status-icon">⏳</div>
    <h1>${message}</h1>
    <div class="loading-spinner"></div>
  `;
}

// 오류 표시
function showError(message) {
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
    const { paymentKey, orderId, amount } = getUrlParams();

    if (!paymentKey || !orderId || !amount) {
      throw new Error('결제 정보가 올바르지 않습니다.');
    }

    console.log('🔄 결제 성공 처리 시작:', { paymentKey, orderId, amount });
    showStatus('결제 승인 처리 중');

    // 1. sessionStorage에서 주문 정보 가져오기
    console.log('📋 sessionStorage에서 주문 정보 조회 중...');
    const pendingOrderDataStr = sessionStorage.getItem('pendingOrderData');
    
    console.log('📋 sessionStorage 원본 데이터:', pendingOrderDataStr);
    
    let pendingOrderData = {};
    if (pendingOrderDataStr) {
      try {
        pendingOrderData = JSON.parse(pendingOrderDataStr);
        console.log('✅ sessionStorage 파싱 성공:', pendingOrderData);
      } catch (parseError) {
        console.error('❌ sessionStorage 파싱 실패:', parseError);
        pendingOrderData = {};
      }
    } else {
      console.warn('⚠️ sessionStorage에 pendingOrderData가 없음');
    }

    // 2. 토스페이먼츠 결제 승인 API 호출 - 모든 필요한 데이터를 명시적으로 전달
    console.log('🔄 토스페이먼츠 결제 승인 API 호출 시작');
    console.log('📤 전송할 데이터:', {
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
      paymentMethod: pendingOrderData.paymentMethod
    });

    const confirmResponse = await fetch('/api/toss/confirm', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ 
        paymentKey, 
        orderId, 
        amount: parseInt(amount),
        // 추가 주문 정보 전달 - 모든 필드를 명시적으로 전달
        userId: pendingOrderData.userId || null,
        storeId: pendingOrderData.storeId || null,
        storeName: pendingOrderData.storeName || null,
        tableNumber: pendingOrderData.tableNumber || null,
        orderData: pendingOrderData.orderData || null,
        usedPoint: pendingOrderData.usedPoint || 0,
        selectedCouponId: pendingOrderData.selectedCouponId || null,
        couponDiscount: pendingOrderData.couponDiscount || 0,
        paymentMethod: pendingOrderData.paymentMethod || '카드'
      })
    });

    console.log('📨 API 응답 상태:', confirmResponse.status);

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      console.error('❌ API 응답 오류:', errorData);
      throw new Error(errorData.error || '결제 승인 실패');
    }

    const confirmResult = await confirmResponse.json();
    console.log('✅ 결제 승인 및 주문 생성 완료:', confirmResult);

    // 3. 세션 정리
    sessionStorage.removeItem('pendingOrderData');
    
    // 4. 성공 화면 표시
    showSuccess({
      storeName: pendingOrderData.storeName,
      tableNumber: pendingOrderData.tableNumber,
      orderId: orderId,
      finalTotal: pendingOrderData.finalTotal || amount,
      amount: amount
    });

    console.log('✅ 결제 성공 처리 완료');

  } catch (error) {
    console.error('❌ 결제 후 처리 실패:', error);
    showError(error.message || '결제 처리 중 오류가 발생했습니다.');
  }
}

// DOM 로드 후 실행
document.addEventListener('DOMContentLoaded', handlePaymentSuccess);

console.log('✅ 토스 결제 성공 페이지 스크립트 로드 완료');
