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
 * 토스페이먼츠 결제 요청 (Popup 방식)
 * @param {Object} paymentData - 결제 정보
 * @param {string} paymentMethod - 결제 수단 ('카드', '계좌이체', '가상계좌')
 * @returns {Promise<Object>} 결제 결과
 */
async function requestTossPayment(paymentData, paymentMethod = '카드') {
  try {
    console.log('💳 토스페이먼츠 결제 요청 (Popup 방식):', paymentData, '결제수단:', paymentMethod);

    const toss = await initTossPayments();
    const baseUrl = window.location.origin;

    // Payment 객체 생성 (customerKey 사용)
    const payment = toss.payment({
      customerKey: paymentData.customerKey || paymentData.orderId // orderId를 customerKey로 사용
    });

    // 결제 성공 후 처리할 콜백 함수 미리 등록
    const handlePaymentComplete = async (result) => {
      try {
        console.log('✅ 결제 완료 콜백 실행:', result);
        await processPaymentAndOrder(result.paymentKey, result.orderId, result.amount);
      } catch (error) {
        console.error('❌ 결제 후 처리 실패:', error);
        notifyPaymentResult(false, error.message);
      }
    };

    // 전역에 콜백 등록 (popup에서 접근 가능하도록)
    window.handleTossPaymentComplete = handlePaymentComplete;

    // 결제 요청 옵션
    const paymentOptions = {
      method: paymentMethod === '카드' ? 'CARD' : paymentMethod.toUpperCase(),
      amount: {
        currency: 'KRW',
        value: paymentData.amount
      },
      orderId: paymentData.orderId,
      orderName: paymentData.orderName,
      successUrl: `${baseUrl}/toss-success.html`,
      failUrl: `${baseUrl}/toss-fail.html`,
      customerEmail: paymentData.customerEmail,
      customerName: paymentData.customerName,
      customerMobilePhone: paymentData.customerMobilePhone
    };

    // 결제 수단별 추가 옵션
    if (paymentMethod === '카드') {
      paymentOptions.card = {
        flowMode: 'DEFAULT', // popup으로 열림
        useEscrow: false
      };
    } else if (paymentMethod === '계좌이체') {
      paymentOptions.transfer = {
        cashReceipt: {
          type: '소득공제'
        }
      };
    } else if (paymentMethod === '가상계좌') {
      paymentOptions.virtualAccount = {
        validHours: 24,
        cashReceipt: {
          type: '소득공제'
        }
      };
    }

    console.log('💳 토스페이먼츠 요청 옵션:', paymentOptions);

    // 결제 요청 실행
    const result = await payment.requestPayment(paymentOptions);

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

    // 사용자 취소인 경우
    if (error.code === 'USER_CANCEL' || error.message?.includes('사용자가 취소')) {
      return {
        success: false,
        message: '결제를 취소했습니다.',
        code: 'USER_CANCEL'
      };
    }

    // 기타 에러
    return {
      success: false,
      message: error.message || `${paymentMethod} 결제 처리 중 오류가 발생했습니다.`,
      code: error.code || 'PAYMENT_ERROR'
    };
  }
}

// 결제 성공 후 즉시 주문 처리
async function processPaymentAndOrder(paymentKey, orderId, amount) {
  try {
    console.log('🔄 결제 성공 후 즉시 주문 처리 시작');
    
    // 1. 토스페이먼츠 결제 승인
    const confirmResult = await window.tossPaymentUtils.confirmPayment(paymentKey, orderId, amount);
    
    if (!confirmResult.success) {
      throw new Error(confirmResult.error || '결제 승인 실패');
    }
    
    console.log('✅ 결제 승인 완료');
    
    // 2. 주문 처리
    const pendingOrderData = JSON.parse(sessionStorage.getItem('pendingOrderData') || '{}');
    
    if (!pendingOrderData.userId) {
      throw new Error('주문 정보를 찾을 수 없습니다.');
    }
    
    const orderResponse = await fetch('/api/orders/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...pendingOrderData,
        pgPaymentKey: paymentKey,
        pgOrderId: orderId,
        pgPaymentMethod: 'TOSS'
      })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(errorData.error || '주문 처리 실패');
    }

    const orderResult = await orderResponse.json();
    console.log('✅ 주문 처리 완료:', orderResult);
    
    // 3. 성공 알림 및 정리
    notifyPaymentResult(true, {
      orderId: orderId,
      amount: amount,
      storeName: pendingOrderData.storeName
    });
    
    // 저장된 데이터 정리
    sessionStorage.removeItem('pendingOrderData');
    sessionStorage.removeItem('paymentMethod');
    
  } catch (error) {
    console.error('❌ 결제 후 처리 실패:', error);
    notifyPaymentResult(false, error.message);
  }
}

// 결제 결과 알림
function notifyPaymentResult(success, data) {
  if (success) {
    alert(`결제가 완료되었습니다!\n주문번호: ${data.orderId}\n금액: ${parseInt(data.amount).toLocaleString()}원\n매장: ${data.storeName}`);
    
    // 메인 페이지로 이동
    if (window.renderSubMain) {
      window.renderSubMain();
    } else {
      location.reload();
    }
  } else {
    alert(`결제 처리 중 오류가 발생했습니다.\n${data}`);
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