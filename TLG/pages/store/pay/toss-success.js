/**
 * 토스페이먼츠 결제 성공 페이지 처리
 */

// URL 파라미터 파싱
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    paymentKey: params.get('paymentKey'),
    orderId: params.get('orderId'),
    amount: params.get('amount')
  };
}

// 상태 표시
function showStatus(message, isLoading = true) {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="status-icon">${isLoading ? '⏳' : '✅'}</div>
    <h1>${message}</h1>
    ${isLoading ? '<p class="loading">처리 중입니다...</p>' : ''}
    <button class="btn" id="backBtn" onclick="goBack()">TableLink로 돌아가기</button>
  `;
}

// 에러 표시
function showError(message) {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="status-icon">❌</div>
    <h1>결제 실패</h1>
    <p class="error">${message}</p>
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
      <p><strong>매장:</strong> ${orderData.storeName}</p>
      <p><strong>테이블:</strong> ${orderData.tableNumber}</p>
      <p><strong>주문번호:</strong> ${orderData.orderId}</p>
      <p><strong>결제금액:</strong> ${parseInt(orderData.finalTotal).toLocaleString()}원</p>
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

    // confirmPayF.js의 processPaymentSuccess 함수 사용
    if (typeof window.processPaymentSuccess === 'function') {
      const result = await window.processPaymentSuccess(paymentKey, orderId, amount);

      if (result.success) {
        console.log('✅ 결제 처리 완료');
        showSuccess(result.data.pendingOrderData);
      } else {
        throw new Error(result.error);
      }
    } else {
      // 직접 처리
      const confirmResponse = await fetch('/api/toss/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) })
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || '결제 승인 실패');
      }

      console.log('✅ 결제 승인 완료');
      showStatus('결제가 완료되었습니다!', false);
    }

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    showError(error.message);
  }
}

// TableLink로 돌아가기
function goBack() {
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.location.href = '/';
      window.close();
    } else {
      window.location.href = '/';
    }
  } catch (e) {
    window.location.href = '/';
  }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  // confirmPayF.js 로드
  const script = document.createElement('script');
  script.src = '/TLG/pages/store/pay/confirmPayF.js';
  script.onload = () => {
    console.log('✅ confirmPayF.js 로드 완료');
    handlePaymentSuccess();
  };
  script.onerror = () => {
    console.warn('⚠️ confirmPayF.js 로드 실패, 직접 처리');
    handlePaymentSuccess();
  };
  document.head.appendChild(script);
});

console.log('✅ 토스페이먼츠 성공 페이지 로드 완료');