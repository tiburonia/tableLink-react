
/**
 * 토스페이먼츠 SDK 통합 모듈
 * 현재 DB 구조를 건드리지 않고 PG 결제만 추가
 */

// 토스페이먼츠 SDK 로드
let tossPayments = null;

async function initTossPayments() {
  if (tossPayments) return tossPayments;

  // 토스페이먼츠 SDK 동적 로드
  if (!window.TossPayments) {
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment-widget';
    script.async = true;
    document.head.appendChild(script);

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
    });
  }

  // 클라이언트 키로 초기화 (환경변수에서 가져옴)
  const clientKey = await fetch('/api/toss/client-key')
    .then(res => res.json())
    .then(data => data.clientKey);

  tossPayments = window.TossPayments(clientKey);
  return tossPayments;
}

/**
 * 토스페이먼츠 결제 요청
 * @param {Object} paymentData - 결제 정보
 * @returns {Promise<Object>} 결제 결과
 */
async function requestTossPayment(paymentData) {
  try {
    const toss = await initTossPayments();

    const result = await toss.requestPayment('카드', {
      amount: paymentData.amount,
      orderId: paymentData.orderId,
      orderName: paymentData.orderName,
      customerName: paymentData.customerName,
      customerEmail: paymentData.customerEmail,
      customerMobilePhone: paymentData.customerMobilePhone,
      successUrl: window.location.origin + '/api/toss/success',
      failUrl: window.location.origin + '/api/toss/fail',
    });

    return {
      success: true,
      paymentKey: result.paymentKey,
      orderId: result.orderId,
      method: result.method
    };

  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 실패:', error);
    return {
      success: false,
      message: error.message || '결제 처리 중 오류가 발생했습니다.'
    };
  }
}

// 전역 함수로 등록
window.requestTossPayment = requestTossPayment;
