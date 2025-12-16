
/**
 * 토스페이먼츠 유틸리티 함수 (완전 재작성)
 */

window.tossPaymentUtils = {
  // 결제 승인
  async confirmPayment(paymentKey, orderId, amount) {
    console.log('🔑 토스페이먼츠 결제 승인 요청:', { paymentKey, orderId, amount });
    
    try {
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
        // 이미 처리된 결제인 경우 성공으로 처리
        if (result.error && result.error.includes('이미 처리된 결제')) {
          console.log('⚠️ 이미 처리된 결제 - 성공으로 처리');
          return { 
            success: true, 
            data: { paymentKey, orderId, amount, alreadyProcessed: true }
          };
        }
        throw new Error(result.error || '결제 승인 요청 실패');
      }

      console.log('✅ 토스페이먼츠 결제 승인 성공:', result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ 토스페이먼츠 결제 승인 실패:', error);
      return { success: false, error: error.message };
    }
  },

  // URL 파라미터 파싱
  getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      paymentKey: params.get('paymentKey'),
      orderId: params.get('orderId'),
      amount: params.get('amount')
    };
  }
};

console.log('✅ 토스페이먼츠 유틸리티 로드 완료');
