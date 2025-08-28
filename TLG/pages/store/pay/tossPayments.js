
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
      script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'));
    });
  }

  // 클라이언트 키로 초기화
  try {
    const response = await fetch('/api/toss/client-key');
    const data = await response.json();
    
    if (!data.clientKey) {
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
 * @param {Object} paymentData - 결제 정보
 * @param {string} paymentMethod - 결제 수단 ('카드', '계좌이체', '가상계좌')
 * @returns {Promise<Object>} 결제 결과
 */
async function requestTossPayment(paymentData, paymentMethod = '카드') {
  try {
    console.log('💳 토스페이먼츠 결제 요청:', paymentData, '결제수단:', paymentMethod);
    
    const toss = await initTossPayments();

    // 성공/실패 URL 설정 (파라미터 중복 방지)
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/toss-success.html`;
    const failUrl = `${baseUrl}/toss-fail.html`;

    // 결제 공통 옵션
    const paymentOptions = {
      amount: paymentData.amount,
      orderId: paymentData.orderId,
      orderName: paymentData.orderName,
      customerName: paymentData.customerName,
      customerEmail: paymentData.customerEmail,
      customerMobilePhone: paymentData.customerMobilePhone,
      successUrl: successUrl,
      failUrl: failUrl,
    };

    let result;

    // 결제 수단별 처리
    switch (paymentMethod) {
      case '카드':
        result = await toss.requestPayment('카드', paymentOptions);
        break;
        
      case '계좌이체':
        // 퀵계좌이체 (간편결제)
        result = await toss.requestPayment('계좌이체', paymentOptions);
        break;
        
      case '가상계좌':
        // 가상계좌는 입금 기한 설정 가능
        const virtualAccountOptions = {
          ...paymentOptions,
          validHours: 24 // 24시간 후 만료
        };
        result = await toss.requestPayment('가상계좌', virtualAccountOptions);
        break;
        
      case '휴대폰':
        result = await toss.requestPayment('휴대폰', paymentOptions);
        break;
        
      case '간편결제':
        // 간편결제 (페이코, 삼성페이 등)
        result = await toss.requestPayment('간편결제', paymentOptions);
        break;
        
      case '문화상품권':
        result = await toss.requestPayment('문화상품권', paymentOptions);
        break;
        
      case '도서문화상품권':
        result = await toss.requestPayment('도서문화상품권', paymentOptions);
        break;
        
      case '게임문화상품권':
        result = await toss.requestPayment('게임문화상품권', paymentOptions);
        break;
        
      default:
        throw new Error(`지원하지 않는 결제 수단입니다: ${paymentMethod}`);
    }

    console.log(`✅ 토스페이먼츠 ${paymentMethod} 결제 요청 성공:`, result);

    return {
      success: true,
      paymentKey: result.paymentKey,
      orderId: result.orderId,
      method: result.method || paymentMethod,
      paymentMethod: paymentMethod
    };

  } catch (error) {
    console.error(`❌ 토스페이먼츠 ${paymentMethod} 결제 실패:`, error);
    
    if (error.code === 'USER_CANCEL') {
      return {
        success: false,
        message: '결제를 취소했습니다.'
      };
    }
    
    return {
      success: false,
      message: error.message || `${paymentMethod} 결제 처리 중 오류가 발생했습니다.`
    };
  }
}

// 전역 함수로 등록
window.requestTossPayment = requestTossPayment;

// 결제 성공/실패 페이지용 유틸리티
window.tossPaymentUtils = {
  // URL 파라미터 파싱
  getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      paymentKey: params.get('paymentKey'),
      orderId: params.get('orderId'),
      amount: params.get('amount')
    };
  },

  // 결제 승인 요청
  async confirmPayment(paymentKey, orderId, amount) {
    try {
      const response = await fetch('/api/toss/success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: parseInt(amount)
        })
      });

      return await response.json();
    } catch (error) {
      console.error('❌ 결제 승인 요청 실패:', error);
      return {
        success: false,
        error: '결제 승인 처리 중 오류가 발생했습니다.'
      };
    }
  }
};

console.log('✅ 토스페이먼츠 SDK 모듈 로드 완료');
