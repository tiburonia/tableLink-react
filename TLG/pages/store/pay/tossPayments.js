
/**
 * 토스페이먼츠 Payment Widget 통합 모듈 (SPA 최적화)
 */

let paymentWidget = null;

async function initTossPaymentWidget() {
  if (paymentWidget) return paymentWidget;

  try {
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

    // 클라이언트 키 가져오기
    const response = await fetch('/api/toss/client-key');
    const data = await response.json();

    if (!data.clientKey) {
      throw new Error('토스페이먼츠 클라이언트 키를 가져올 수 없습니다.');
    }

    // Payment Widget 초기화 (페이지 리다이렉트 없이 현재 창에서 처리)
    paymentWidget = window.TossPayments(data.clientKey);
    
    console.log('✅ 토스페이먼츠 Payment Widget 초기화 완료');
    return paymentWidget;

  } catch (error) {
    console.error('❌ 토스페이먼츠 Payment Widget 초기화 실패:', error);
    throw error;
  }
}

/**
 * Payment Widget 방식으로 결제 처리 (SPA 구조)
 */
async function requestTossPayment(paymentData, paymentMethod = '카드') {
  try {
    console.log('💳 토스페이먼츠 Payment Widget 결제 요청:', paymentData, '결제수단:', paymentMethod);

    const widget = await initTossPaymentWidget();

    // Payment Widget은 자체적으로 결제 성공/실패를 처리하므로
    // 콜백 함수를 통해 SPA에서 직접 처리
    const result = await new Promise((resolve, reject) => {
      const paymentOptions = {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        customerMobilePhone: paymentData.customerMobilePhone,
        // SPA 방식: 성공/실패 시 현재 창에서 콜백 처리
        successCallback: async (result) => {
          console.log('✅ Payment Widget 결제 성공:', result);
          
          // 결제 승인 처리
          const confirmResult = await confirmPaymentInSPA(
            result.paymentKey, 
            result.orderId, 
            paymentData.amount
          );
          
          if (confirmResult.success) {
            resolve({
              success: true,
              paymentKey: result.paymentKey,
              orderId: result.orderId,
              method: paymentMethod,
              confirmResult: confirmResult
            });
          } else {
            reject(new Error(confirmResult.error || '결제 승인에 실패했습니다.'));
          }
        },
        failCallback: (error) => {
          console.error('❌ Payment Widget 결제 실패:', error);
          
          if (error.code === 'USER_CANCEL') {
            resolve({
              success: false,
              message: '결제를 취소했습니다.',
              cancelled: true
            });
          } else {
            reject(new Error(error.message || `${paymentMethod} 결제 처리 중 오류가 발생했습니다.`));
          }
        }
      };

      // 결제 수단별 처리
      switch (paymentMethod) {
        case '카드':
          widget.requestPayment('카드', paymentOptions);
          break;
        case '계좌이체':
          widget.requestPayment('계좌이체', paymentOptions);
          break;
        case '가상계좌':
          paymentOptions.validHours = 24;
          widget.requestPayment('가상계좌', paymentOptions);
          break;
        case '휴대폰':
          widget.requestPayment('휴대폰', paymentOptions);
          break;
        default:
          reject(new Error(`지원하지 않는 결제 수단입니다: ${paymentMethod}`));
      }
    });

    return result;

  } catch (error) {
    console.error(`❌ 토스페이먼츠 Payment Widget ${paymentMethod} 결제 실패:`, error);
    
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

console.log('✅ 토스페이먼츠 Payment Widget 모듈 로드 완료 (SPA 최적화)');
