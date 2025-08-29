
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '결제 승인 요청 실패');
      }

      const result = await response.json();
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
