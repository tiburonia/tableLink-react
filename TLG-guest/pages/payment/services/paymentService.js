/**
 * 결제 페이지 Service (비회원 TLL)
 * - 주문 생성
 * - 결제 처리
 */

export const paymentService = {
    /**
     * 비회원 주문 생성
     */
    async createGuestOrder(storeId, tableNumber, cart) {
        try {
            const sessionId = localStorage.getItem('guestSessionId');
            
            if (!sessionId) {
                throw new Error('세션이 만료되었습니다');
            }

            const response = await fetch('/api/guest/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId,
                    storeId,
                    tableNumber,
                    items: cart.map(item => ({
                        menuId: item.id,
                        menuName: item.name,
                        quantity: item.quantity,
                        unitPrice: item.price
                    }))
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || '주문 생성에 실패했습니다');
            }

            return {
                success: true,
                orderId: data.orderId,
                totalAmount: data.totalAmount
            };

        } catch (error) {
            console.error('❌ 주문 생성 실패:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * 결제 처리
     */
    async processPayment(orderId, amount) {
        try {
            const response = await fetch('/api/guest/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId,
                    amount,
                    paymentMethod: 'CARD'
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || '결제 처리에 실패했습니다');
            }

            return {
                success: true,
                paymentId: data.paymentId
            };

        } catch (error) {
            console.error('❌ 결제 처리 실패:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * 주문 완료 처리
     */
    completeOrder() {
        // 세션 및 장바구니 초기화
        localStorage.removeItem('guestSessionId');
        localStorage.removeItem('guestStoreId');
        localStorage.removeItem('guestTableNumber');
        localStorage.removeItem('guestCart');
    }
};
