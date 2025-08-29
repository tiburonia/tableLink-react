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
 * 토스페이먼츠 결제 요청 (SPA 구조)
 * @param {Object} paymentData - 결제 정보
 * @param {string} paymentMethod - 결제 수단 ('카드', '계좌이체', '가상계좌')
 * @returns {Promise<Object>} 결제 결과
 */
async function requestTossPayment(paymentData, paymentMethod = '카드') {
  try {
    console.log('💳 토스페이먼츠 결제 요청 (SPA):', paymentData, '결제수단:', paymentMethod);

    const toss = await initTossPayments();

    // SPA 구조 - 직접 결제 진행 (URL 리다이렉트 없음)
    let result;

    // 결제 수단별 처리 (SPA 방식)
    switch (paymentMethod) {
      case '카드':
        result = await toss.requestPayment('카드', {
          amount: paymentData.amount,
          orderId: paymentData.orderId,
          orderName: paymentData.orderName,
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          customerMobilePhone: paymentData.customerMobilePhone,
        });
        break;

      case '계좌이체':
        result = await toss.requestPayment('계좌이체', {
          amount: paymentData.amount,
          orderId: paymentData.orderId,
          orderName: paymentData.orderName,
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          customerMobilePhone: paymentData.customerMobilePhone,
        });
        break;

      case '가상계좌':
        result = await toss.requestPayment('가상계좌', {
          amount: paymentData.amount,
          orderId: paymentData.orderId,
          orderName: paymentData.orderName,
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          customerMobilePhone: paymentData.customerMobilePhone,
          validHours: 24
        });
        break;

      case '휴대폰':
        result = await toss.requestPayment('휴대폰', {
          amount: paymentData.amount,
          orderId: paymentData.orderId,
          orderName: paymentData.orderName,
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          customerMobilePhone: paymentData.customerMobilePhone,
        });
        break;

      default:
        throw new Error(`지원하지 않는 결제 수단입니다: ${paymentMethod}`);
    }

    console.log(`✅ 토스페이먼츠 ${paymentMethod} 결제 성공:`, result);

    // SPA에서 직접 결제 승인 처리
    const confirmResult = await confirmPaymentInSPA(result.paymentKey, result.orderId, paymentData.amount);

    if (!confirmResult.success) {
      throw new Error(confirmResult.error || '결제 승인에 실패했습니다.');
    }

    return {
      success: true,
      paymentKey: result.paymentKey,
      orderId: result.orderId,
      method: result.method || paymentMethod,
      paymentMethod: paymentMethod,
      confirmResult: confirmResult
    };

  } catch (error) {
    console.error(`❌ 토스페이먼츠 ${paymentMethod} 결제 실패:`, error);

    if (error.code === 'USER_CANCEL') {
      return {
        success: false,
        message: '결제를 취소했습니다.',
        cancelled: true
      };
    }

    return {
      success: false,
      message: error.message || `${paymentMethod} 결제 처리 중 오류가 발생했습니다.`
    };
  }
}

/**
 * SPA 내에서 결제 승인 처리
 */
async function confirmPaymentInSPA(paymentKey, orderId, amount) {
  try {
    console.log('🔄 SPA 결제 승인 처리:', { paymentKey, orderId, amount });

    const confirmResponse = await fetch('/api/toss/success', {
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

    const confirmResult = await confirmResponse.json();

    if (!confirmResult.success) {
      throw new Error(confirmResult.error || '토스페이먼츠 결제 승인에 실패했습니다.');
    }

    console.log('✅ SPA 결제 승인 완료:', confirmResult);
    return confirmResult;

  } catch (error) {
    console.error('❌ SPA 결제 승인 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 전역 함수로 등록
window.requestTossPayment = requestTossPayment;

// 기존 결제 성공/실패 페이지 관련 유틸리티 함수는 SPA 구조에 맞게 수정하거나 제거
// window.tossPaymentUtils = {
//   // URL 파라미터 파싱
//   getUrlParams() {
//     const params = new URLSearchParams(window.location.search);
//     return {
//       paymentKey: params.get('paymentKey'),
//       orderId: params.get('orderId'),
//       amount: params.get('amount')
//     };
//   },

//   // 결제 승인 요청 (기존 방식)
//   async confirmPayment(paymentKey, orderId, amount) {
//     try {
//       const response = await fetch('/api/toss/success', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           paymentKey,
//           orderId,
//           amount: parseInt(amount)
//         })
//       });

//       return await response.json();
//     } catch (error) {
//       console.error('❌ 결제 승인 요청 실패:', error);
//       return {
//         success: false,
//         error: '결제 승인 처리 중 오류가 발생했습니다.'
//       };
//     }
//   }
// };

console.log('✅ 토스페이먼츠 SDK 모듈 로드 완료 (SPA 모드)');