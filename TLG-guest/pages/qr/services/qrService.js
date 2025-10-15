/**
 * QR 페이지 Service (비회원 TLL)
 * - 매장 정보 조회
 * - 비회원 세션 생성
 */

export const qrService = {
    /**
     * 테이블 정보 조회
     */
    async getTableInfo(storeId, tableNumber) {
        try {
            const response = await fetch(
                `/api/guest/stores/${storeId}/tables/${tableNumber}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || '테이블 정보를 불러올 수 없습니다');
            }

            return {
                success: true,
                table: data.table,
                store: data.store
            };

        } catch (error) {
            console.error('❌ 테이블 정보 조회 실패:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * 비회원 세션 생성
     */
    async createGuestSession(storeId, tableNumber) {
        try {
            const response = await fetch(
                `/api/guest/sessions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        storeId,
                        tableNumber
                    })
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || '세션 생성에 실패했습니다');
            }

            // 세션 ID를 localStorage에 저장
            localStorage.setItem('guestSessionId', data.sessionId);
            localStorage.setItem('guestStoreId', storeId);
            localStorage.setItem('guestTableNumber', tableNumber);

            return {
                success: true,
                sessionId: data.sessionId
            };

        } catch (error) {
            console.error('❌ 세션 생성 실패:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
};
