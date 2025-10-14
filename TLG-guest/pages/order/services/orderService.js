/**
 * 메뉴 주문 페이지 Service (비회원 TLL)
 * - 매장 정보 조회
 * - 메뉴 목록 조회
 * - 장바구니 관리
 */

export const orderService = {
    /**
     * 매장 정보 조회
     */
    async getStoreInfo(storeId) {
        try {
            const response = await fetch(`/api/guest/stores/${storeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || '매장 정보를 불러올 수 없습니다');
            }

            return {
                success: true,
                store: data.store
            };

        } catch (error) {
            console.error('❌ 매장 정보 조회 실패:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * 메뉴 목록 조회
     */
    async getMenuList(storeId) {
        try {
            const response = await fetch(`/api/guest/stores/${storeId}/menus`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || '메뉴를 불러올 수 없습니다');
            }

            return {
                success: true,
                menus: data.menus
            };

        } catch (error) {
            console.error('❌ 메뉴 조회 실패:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * 장바구니 저장 (localStorage)
     */
    saveCart(cart) {
        try {
            localStorage.setItem('guestCart', JSON.stringify(cart));
            return { success: true };
        } catch (error) {
            console.error('❌ 장바구니 저장 실패:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * 장바구니 불러오기
     */
    loadCart() {
        try {
            const cartData = localStorage.getItem('guestCart');
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('❌ 장바구니 불러오기 실패:', error);
            return [];
        }
    },

    /**
     * 장바구니 초기화
     */
    clearCart() {
        try {
            localStorage.removeItem('guestCart');
            return { success: true };
        } catch (error) {
            console.error('❌ 장바구니 초기화 실패:', error);
            return { success: false, message: error.message };
        }
    }
};
