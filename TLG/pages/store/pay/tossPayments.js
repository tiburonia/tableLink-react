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
      try {
        // 결제 수단에 따른 요청
        const paymentMethodMap = {
          '카드': 'CARD',
          '계좌이체': 'TRANSFER',
          '가상계좌': 'VIRTUAL_ACCOUNT',
          '휴대폰': 'MOBILE_PHONE',
          '간편결제': 'EASY_PAY',
          '문화상품권': 'CULTURE_GIFT_CERTIFICATE',
          '도서문화상품권': 'BOOK_CULTURE_GIFT_CERTIFICATE',
          '게임문화상품권': 'GAME_CULTURE_GIFT_CERTIFICATE'
        };

        const tossPaymentMethod = paymentMethodMap[paymentMethod] || 'CARD';

        console.log('🔄 토스페이먼츠 결제 시작:', tossPaymentMethod);

        // amount 값 유효성 검사 및 정수 변환
        const validatedAmount = parseInt(paymentData.amount);
        if (!validatedAmount || validatedAmount <= 0) {
          throw new Error(`유효하지 않은 결제 금액입니다: ${paymentData.amount}`);
        }

        console.log('💳 토스페이먼츠 결제 요청 파라미터:', {
          method: tossPaymentMethod,
          amount: validatedAmount,
          orderId: paymentData.orderId,
          orderName: paymentData.orderName
        });

        // 토스페이먼츠 결제 요청
        widget.requestPayment({
          method: tossPaymentMethod,
          amount: validatedAmount,
          orderId: paymentData.orderId,
          orderName: paymentData.orderName,
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          customerMobilePhone: paymentData.customerMobilePhone,
          successUrl: window.location.origin + '/?payment=success',
          failUrl: window.location.origin + '/?payment=fail'
        }).then(async (paymentResult) => {
          console.log('✅ 토스페이먼츠 결제 성공:', paymentResult);

          // 결제 승인 처리
          try {
            const confirmResult = await confirmPaymentInSPA(
              paymentResult.paymentKey, 
              paymentResult.orderId, 
              parseInt(paymentData.amount)
            );

            if (confirmResult.success) {
              resolve({
                success: true,
                paymentKey: paymentResult.paymentKey,
                orderId: paymentResult.orderId,
                method: paymentMethod,
                confirmResult: confirmResult
              });
            } else {
              reject(new Error(confirmResult.message || '결제 승인 처리 실패'));
            }
          } catch (confirmError) {
            console.error('❌ 결제 승인 처리 중 오류:', confirmError);
            reject(confirmError);
          }

        }).catch((error) => {
          console.error('❌ 토스페이먼츠 결제 실패:', error);

          if (error.code === 'USER_CANCEL') {
            reject(new Error('결제가 취소되었습니다.'));
          } else {
            reject(new Error(error.message || '결제 처리 중 오류가 발생했습니다.'));
          }
        });

      } catch (error) {
        console.error('❌ 결제 요청 중 오류:', error);
        reject(error);
      }
    });

    return result;

  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 처리 실패:', error);
    throw error;
  }
}

/**
 * SPA 내에서 결제 승인 처리
 */
async function confirmPaymentInSPA(paymentKey, orderId, amount) {
  try {
    const validatedAmount = parseInt(amount);
    if (!validatedAmount || validatedAmount <= 0) {
      throw new Error(`유효하지 않은 승인 금액입니다: ${amount}`);
    }

    console.log('🔄 SPA 결제 승인 처리:', { paymentKey, orderId, amount: validatedAmount });

    const confirmResponse = await fetch('/api/toss/success', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: validatedAmount
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