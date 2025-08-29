
// 토스페이먼츠 관련 유틸리티 함수들
window.tossPaymentUtils = {
    confirmPayment: async (paymentKey, orderId, amount) => {
        console.log('🔑 토스페이먼츠 결제 승인 요청:', { paymentKey, orderId, amount });
        
        try {
            const response = await fetch('/api/toss/confirm', {
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
    }
};
