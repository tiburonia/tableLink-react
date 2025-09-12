/**
 * 토스페이먼츠 결제 성공 처리 페이지
 */

console.log('📱 결제 성공 페이지 로드');

// URL 파라미터 파싱
function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const params = {
    paymentKey: urlParams.get('paymentKey'),
    orderId: urlParams.get('orderId'),
    amount: urlParams.get('amount')
  };

  console.log('🔍 URL 파라미터:', params);
  return params;
}

// TableLink 메인으로 이동
function goBack() {
  console.log('🔄 TableLink 메인으로 이동');

  if (window.opener) {
    // 새 창에서 열린 경우
    window.opener.location.href = '/';
    window.close();
  } else {
    // 같은 창에서 리다이렉트된 경우
    window.location.href = '/';
  }
}

// 에러 표시
function showError(message) {
  console.error('❌ 결제 처리 실패:', message);
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="status-icon error">❌</div>
    <h1>결제 처리 실패</h1>
    <p class="error-message">${message}</p>
    <div class="payment-info">
      <div class="info-item">
        <span class="label">오류 시간:</span>
        <span class="value">${new Date().toLocaleString()}</span>
      </div>
    </div>
    <button class="btn secondary" onclick="goBack()">TableLink로 돌아가기</button>
  `;
}

// 성공 표시
function showSuccess(orderData) {
  console.log('✅ 결제 성공 표시:', orderData);
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="status-icon success">✅</div>
    <h1>결제 완료!</h1>
    <div class="order-status">
      <div class="status-icon">🎉</div>
      <div>
        <h3>주문이 성공적으로 처리되었습니다!</h3>
        <p>매장에서 음식을 준비 중입니다.</p>
      </div>
    </div>
    <div class="payment-info">
      <div class="info-item">
        <span class="label">매장명:</span>
        <span class="value">${orderData.storeName || '알 수 없음'}</span>
      </div>
      <div class="info-item">
        <span class="label">테이블:</span>
        <span class="value">${orderData.tableNumber || '알 수 없음'}</span>
      </div>
      <div class="info-item">
        <span class="label">주문번호:</span>
        <span class="value">${orderData.orderId || '알 수 없음'}</span>
      </div>
      <div class="info-item">
        <span class="label">결제금액:</span>
        <span class="value">${parseInt(orderData.finalTotal || orderData.amount || 0).toLocaleString()}원</span>
      </div>
    </div>
    <button class="btn primary" onclick="goBack()">TableLink로 돌아가기</button>
  `;
}

// 메인 처리 함수
async function handlePaymentSuccess() {
  try {
    console.log('🔄 새로운 결제 시스템 - 성공 처리 함수 시작');

    const urlParams = getUrlParams();
    const { paymentKey, orderId, amount } = urlParams;

    console.log('📝 결제 성공 파라미터:', { paymentKey, orderId, amount });

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      throw new Error('필수 결제 정보가 누락되었습니다.');
    }

    // 서버에 결제 승인 요청
    console.log('🔑 서버에 결제 승인 요청 시작');

    const response = await fetch('/api/toss/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '결제 승인 실패');
    }

    const result = await response.json();
    console.log('✅ 결제 승인 API 응답 성공:', result);

    // 성공 화면 표시
    const displayOrderInfo = {
      orderId: result.orderId || orderId,
      storeName: result.storeName || '알 수 없음',
      tableNumber: result.tableNumber || '알 수 없음',
      finalTotal: result.finalTotal || amount,
      amount: amount
    };

    showSuccess(displayOrderInfo);

  } catch (error) {
    console.error('❌ 결제 성공 처리 중 오류:', error);
    showError(error.message || '결제 처리 중 오류가 발생했습니다.');
  }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 결제 성공 페이지 로드 완료 - 새로운 시스템');
  handlePaymentSuccess();
});

console.log('✅ 새로운 결제 성공 처리 모듈 로드 완료');