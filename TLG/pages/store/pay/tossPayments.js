
/**
 * 토스페이먼츠 SDK 통합 모듈 (완전 재작성 - 통합 결제 시스템)
 */

let tossPayments = null;
let isInitialized = false;

// 토스페이먼츠 SDK 초기화
async function initTossPayments() {
  if (tossPayments && isInitialized) {
    console.log('✅ 토스페이먼츠 이미 초기화됨');
    return tossPayments;
  }

  try {
    console.log('🔄 토스페이먼츠 SDK 초기화 시작...');

    // SDK 로드
    if (!window.TossPayments) {
      console.log('📦 토스페이먼츠 SDK 스크립트 로드 중...');
      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1/payment';
      script.async = true;
      document.head.appendChild(script);

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'));
      });
      console.log('✅ 토스페이먼츠 SDK 스크립트 로드 완료');
    }

    // 클라이언트 키 가져오기 (재시도 로직 포함)
    console.log('🔑 토스페이먼츠 클라이언트 키 요청 중...');
    let clientKey = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (!clientKey && retryCount < maxRetries) {
      try {
        const response = await fetch('/api/toss/client-key', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success || !data.clientKey) {
          throw new Error('클라이언트 키 응답이 올바르지 않습니다.');
        }

        clientKey = data.clientKey;
        console.log('✅ 토스페이먼츠 클라이언트 키 획득 성공');
      } catch (error) {
        retryCount++;
        console.warn(`⚠️ 클라이언트 키 요청 실패 (${retryCount}/${maxRetries}):`, error.message);
        
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    if (!clientKey) {
      throw new Error('토스페이먼츠 클라이언트 키를 가져올 수 없습니다.');
    }

    tossPayments = window.TossPayments(clientKey);
    isInitialized = true;
    console.log('✅ 토스페이먼츠 SDK 초기화 완료');
    return tossPayments;

  } catch (error) {
    console.error('❌ 토스페이먼츠 초기화 실패:', error);
    isInitialized = false;
    throw error;
  }
}

/**
 * 토스페이먼츠 결제 요청 (통합)
 */
async function requestTossPayment(paymentData, paymentMethod = '카드') {
  try {
    console.log('💳 토스페이먼츠 결제 요청 시작:', { paymentData, paymentMethod });

    // 토스페이먼츠 초기화
    const toss = await initTossPayments();
    const baseUrl = window.location.origin;

    // 결제 옵션 구성
    const paymentOptions = {
      amount: parseInt(paymentData.amount),
      orderId: paymentData.orderId,
      orderName: paymentData.orderName || '주문',
      customerName: paymentData.customerName || '고객',
      customerEmail: paymentData.customerEmail || 'customer@tablelink.com',
      successUrl: `${baseUrl}/toss-success.html`,
      failUrl: `${baseUrl}/toss-fail.html`
    };

    console.log('🔄 결제 요청 옵션:', paymentOptions);

    // 결제 수단별 처리 - 토스페이먼츠 SDK 직접 호출
    const result = await toss.requestPayment(paymentMethod, paymentOptions);
    
    console.log('✅ 토스페이먼츠 결제 요청 성공:', result);
    return { success: true, data: result };

  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 실패:', error);
    
    // 사용자 취소 처리
    if (error.code === 'USER_CANCEL') {
      return { success: false, error: error.message, code: 'USER_CANCEL' };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * 결제 승인 처리 (통합)
 */
async function confirmTossPayment(paymentKey, orderId, amount) {
  try {
    console.log('🔑 토스페이먼츠 결제 승인 요청:', { paymentKey, orderId, amount });

    const response = await fetch('/api/toss/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '결제 승인 요청 실패');
    }

    console.log('✅ 토스페이먼츠 결제 승인 성공:', result);
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 승인 실패:', error);
    return { success: false, error: error.message };
  }
}

// 전역 함수로 등록
window.initTossPayments = initTossPayments;
window.requestTossPayment = requestTossPayment;
window.confirmTossPayment = confirmTossPayment;

console.log('✅ 토스페이먼츠 모듈 전역 등록 완료');
console.log('🔍 등록된 함수들:', {
  initTossPayments: typeof window.initTossPayments,
  requestTossPayment: typeof window.requestTossPayment,
  confirmTossPayment: typeof window.confirmTossPayment
});
