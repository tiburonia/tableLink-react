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

    // 성공/실패 URL 설정 (Replit 환경에 맞는 올바른 URL 형식)
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Replit 환경에서는 포트가 있을 때만 포트 포함
    const baseUrl = port && port !== '80' && port !== '443' 
      ? `${protocol}//${hostname}:${port}` 
      : `${protocol}//${hostname}`;
    
    const successUrl = `${baseUrl}/toss-success.html`;
    const failUrl = `${baseUrl}/toss-fail.html`;
    
    console.log('🔗 토스페이먼츠 URL 설정:', { baseUrl, successUrl, failUrl });

    // URL 유효성 검증
    try {
      new URL(successUrl);
      new URL(failUrl);
    } catch (error) {
      throw new Error(`올바르지 않은 URL 형식입니다: ${error.message}`);
    }

    // 전화번호 정규화 및 검증
    let validPhone = null;
    if (paymentData.customerMobilePhone) {
      // 숫자만 추출
      const phoneDigits = paymentData.customerMobilePhone.replace(/\D/g, '');
      
      // 010으로 시작하는 11자리인지 확인
      if (phoneDigits.length === 11 && phoneDigits.startsWith('010')) {
        validPhone = `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 7)}-${phoneDigits.slice(7, 11)}`;
      }
    }

    console.log('📱 전화번호 검증:', {
      original: paymentData.customerMobilePhone,
      valid: validPhone
    });

    // 결제 공통 옵션 (전화번호가 유효하지 않으면 제외)
    const paymentOptions = {
      amount: paymentData.amount,
      orderId: paymentData.orderId,
      orderName: paymentData.orderName,
      customerName: paymentData.customerName || '고객',
      customerEmail: paymentData.customerEmail || 'guest@tablelink.com',
      successUrl: successUrl,
      failUrl: failUrl,
    };

    // 유효한 전화번호가 있을 때만 추가
    if (validPhone) {
      paymentOptions.customerMobilePhone = validPhone;
    }

    console.log('💳 토스페이먼츠 결제 옵션:', paymentOptions);

    let result;

    // 결제 수단별 처리 (현재 창에서 직접 리다이렉트)
    switch (paymentMethod) {
      case '카드':
        // requestPayment는 현재 창에서 리다이렉트되므로 await 불가
        toss.requestPayment('카드', paymentOptions);
        return { success: true, redirecting: true };

      case '계좌이체':
        // 퀵계좌이체 (간편결제)
        toss.requestPayment('계좌이체', paymentOptions);
        return { success: true, redirecting: true };

      case '가상계좌':
        // 가상계좌는 입금 기한 설정 가능
        const virtualAccountOptions = {
          ...paymentOptions,
          validHours: 24 // 24시간 후 만료
        };
        toss.requestPayment('가상계좌', virtualAccountOptions);
        return { success: true, redirecting: true };

      case '휴대폰':
        toss.requestPayment('휴대폰', paymentOptions);
        return { success: true, redirecting: true };

      case '간편결제':
        // 간편결제 (페이코, 삼성페이 등)
        toss.requestPayment('간편결제', paymentOptions);
        return { success: true, redirecting: true };

      case '문화상품권':
        toss.requestPayment('문화상품권', paymentOptions);
        return { success: true, redirecting: true };

      case '도서문화상품권':
        toss.requestPayment('도서문화상품권', paymentOptions);
        return { success: true, redirecting: true };

      case '게임문화상품권':
        toss.requestPayment('게임문화상품권', paymentOptions);
        return { success: true, redirecting: true };

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

    // 토스페이먼츠 특정 오류 메시지 처리
    let errorMessage = error.message || `${paymentMethod} 결제 처리 중 오류가 발생했습니다.`;
    
    // 토스페이먼츠 에러 코드별 처리
    if (error.code === 'INCORRECT_SUCCESS_URL_FORMAT') {
      errorMessage = '결제 완료 페이지 URL 형식이 올바르지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.';
    } else if (error.code === 'INCORRECT_FAIL_URL_FORMAT') {
      errorMessage = '결제 실패 페이지 URL 형식이 올바르지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.';
    } else if (errorMessage.includes('전화번호') || errorMessage.includes('phone') || errorMessage.includes('Phone')) {
      errorMessage = '전화번호 형식에 문제가 있습니다. 마이페이지에서 전화번호를 확인해주세요.';
    } else if (errorMessage.includes('customerMobilePhone')) {
      errorMessage = '고객 전화번호 정보에 문제가 있습니다. 다시 시도해주세요.';
    } else if (errorMessage.includes('successUrl') || errorMessage.includes('Success URL')) {
      errorMessage = '결제 완료 페이지 URL 설정에 문제가 있습니다. 페이지를 새로고침 후 다시 시도해주세요.';
    } else if (errorMessage.includes('failUrl') || errorMessage.includes('Fail URL')) {
      errorMessage = '결제 실패 페이지 URL 설정에 문제가 있습니다. 페이지를 새로고침 후 다시 시도해주세요.';
    }

    console.error(`❌ 토스페이먼츠 ${paymentMethod} 결제 실패 상세:`, {
      code: error.code,
      message: error.message,
      data: error.data
    });

    return {
      success: false,
      message: errorMessage
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