/**
 * 토스페이먼츠 SDK 통합 모듈 (완전 재작성)
 * 단순하고 안정적인 결제 처리
 */

let tossPayments = null;

// 토스페이먼츠 SDK 초기화
async function initTossPayments() {
  if (tossPayments) return tossPayments;

  try {
    // SDK 로드
    if (!window.TossPayments) {
      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1/payment';
      script.async = true;
      document.head.appendChild(script);

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'));
      });
    }

    // 클라이언트 키 가져오기
    const response = await fetch('/api/toss/client-key');
    const data = await response.json();

    if (!data.success || !data.clientKey) {
      throw new Error('토스페이먼츠 클라이언트 키를 가져올 수 없습니다.');
    }

    tossPayments = window.TossPayments(data.clientKey);
    console.log('✅ 토스페이먼츠 SDK 초기화 완료');
    return tossPayments;

  } catch (error) {
    console.error('❌ 토스페이먼츠 초기화 실패:', error);
    throw error;
  }
}

/**
 * 토스페이먼츠 결제 요청
 */
async function requestTossPayment(paymentData, paymentMethod = '카드') {
  try {
    console.log('💳 토스페이먼츠 결제 시작:', { paymentData, paymentMethod });

    const toss = await initTossPayments();
    const baseUrl = window.location.origin;

    // 결제 옵션 구성
    const paymentOptions = {
      amount: paymentData.amount,
      orderId: paymentData.orderId,
      orderName: paymentData.orderName,
      customerName: paymentData.customerName || '고객',
      customerEmail: paymentData.customerEmail || 'customer@tablelink.com',
      successUrl: `${baseUrl}/toss-success.html`,
      failUrl: `${baseUrl}/toss-fail.html`
    };

    console.log('🔄 결제 요청 옵션:', paymentOptions);

    // 결제 수단별 처리
    let result;
    switch (paymentMethod) {
      case '카드':
        result = await toss.requestPayment('카드', paymentOptions);
        break;
      case '계좌이체':
        result = await toss.requestPayment('계좌이체', paymentOptions);
        break;
      case '가상계좌':
        result = await toss.requestPayment('가상계좌', {
          ...paymentOptions,
          validHours: 24
        });
        break;
      default:
        throw new Error(`지원하지 않는 결제 수단: ${paymentMethod}`);
    }

    console.log('✅ 토스페이먼츠 결제 요청 성공:', result);
    return { success: true, data: result };

  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 실패:', error);
    return { success: false, error: error.message };
  }
};

// 전역 함수로 등록
window.initTossPayments = initTossPayments;

console.log('✅ 토스페이먼츠 모듈 전역 등록 완료');