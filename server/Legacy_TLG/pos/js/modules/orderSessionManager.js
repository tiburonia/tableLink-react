/**
 * 주문 세션 관리 모듈
 * - 세션 생성/종료
 * - 테이블 상태 관리
 * - TLL 연동 관리
 */

const OrderSessionManager = {
    currentSession: null,
    sessionItems: [],

    /**
     * 세션 데이터 로드
     */
    async loadSessionData(storeId, tableNumber) {
        if (!tableNumber) return { currentSession: null, sessionItems: [] };

        try {
            const { currentSession, sessionItems } = await OrderDataManager.loadSessionData(storeId, tableNumber);

            this.currentSession = currentSession;
            this.sessionItems = sessionItems;

            if (currentSession) {
                console.log("✅ 세션 데이터 로드:", currentSession);
                this.updateTableStatus(tableNumber, "occupied");
            } else {
                this.updateTableStatus(tableNumber, "available");
            }

            return { currentSession, sessionItems };
        } catch (error) {
            console.error("❌ 세션 데이터 로드 실패:", error);
            this.currentSession = null;
            this.sessionItems = [];
            return { currentSession: null, sessionItems: [] };
        }
    },

    /**
     * 현재 세션 정보 가져오기
     */
    getCurrentSession() {
        return this.currentSession;
    },

    /**
     * 현재 세션 종료
     */
    async endCurrentSession() {
        if (!this.currentSession || !this.currentSession.orderId) {
            console.log("종료할 세션이 없습니다.");
            return;
        }

        try {
            const response = await fetch(
                `/api/orders/${this.currentSession.orderId}/end-session`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                }
            );

            const result = await response.json();

            if (result.success) {
                console.log(`✅ 세션 종료 완료: 주문 ${this.currentSession.orderId}`);

                this.currentSession = null;
                this.sessionItems = [];

                this.updateTableStatus(window.POSOrderScreen?.currentTableNumber, "available");
            } else {
                console.error("❌ 세션 종료 실패:", result.error);
            }
        } catch (error) {
            console.error("❌ 세션 종료 요청 실패:", error);
        }
    },

    /**
     * 사용자별 TLL 세션 종료
     */
    async endUserTLLSession(orderId, userName) {
        try {
            if (!orderId) {
                console.error("❌ TLL 주문 ID가 없습니다");
                alert("주문 정보를 찾을 수 없습니다.");
                return;
            }

            const confirmMessage = `${userName}님의 TLL 세션을 종료하시겠습니까?\n\n주문 ID: ${orderId}`;

            if (!confirm(confirmMessage)) {
                return;
            }

            console.log(`🔚 사용자별 TLL 세션 종료 요청: 주문 ID ${orderId}, 사용자: ${userName}`);

            const response = await fetch(`/api/orders/${orderId}/end-session`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "TLL 세션 종료 실패");
            }

            const result = await response.json();
            console.log("✅ 사용자별 TLL 세션 종료 완료:", result);

            alert(`✅ ${userName}님의 TLL 세션이 종료되었습니다.\n주문 ID: ${orderId}`);

            // TLL 주문만 새로고침 (render()가 내부에서 모든 데이터를 로드하므로 중복 제거)
            await window.POSOrderScreen?.refreshTLLOrders();

        } catch (error) {
            console.error("❌ 사용자별 TLL 세션 종료 실패:", error);
            alert(`TLL 세션 종료 중 오류가 발생했습니다:\n${error.message}`);
        }
    },

    /**
     * TLL 세션 종료 (전체)
     */
    async endTLLSession() {
        try {
            const posOrderScreen = window.POSOrderScreen;
            if (!posOrderScreen?.tllOrders || posOrderScreen.tllOrders.length === 0) {
                alert("종료할 TLL 세션이 없습니다.");
                return;
            }

            const orderId = posOrderScreen.tllOrders[0].order_id;
            if (!orderId) {
                console.error("❌ TLL 주문 ID를 찾을 수 없습니다");
                alert("TLL 주문 정보를 찾을 수 없습니다.");
                return;
            }

            const confirmMessage = `TLL 세션을 종료하시겠습니까?

• 사용자: ${posOrderScreen.tllUserInfo?.name || "게스트"}
• 주문 수: ${posOrderScreen.tllOrders.length}개
• 주문 ID: ${orderId}`;

            if (!confirm(confirmMessage)) {
                return;
            }

            console.log(`🔚 TLL 세션 종료 요청: 주문 ID ${orderId}`);

            const response = await fetch(`/api/orders/${orderId}/end-session`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "TLL 세션 종료 실패");
            }

            const result = await response.json();
            console.log("✅ TLL 세션 종료 완료:", result);

            alert(`✅ TLL 세션이 종료되었습니다.\n주문 ID: ${orderId}`);

            posOrderScreen.tllOrders = [];
            posOrderScreen.tllUserInfo = null;

            await posOrderScreen.refreshTLLOrders();
            await posOrderScreen.refreshOrders();

            await posOrderScreen.render(
                posOrderScreen.currentStoreId,
                { name: "매장" },
                posOrderScreen.currentTableNumber,
            );

            setTimeout(() => {
                window.POSCore?.showTableMap();
            }, 1500);

        } catch (error) {
            console.error("❌ TLL 세션 종료 실패:", error);
            alert(`TLL 세션 종료 중 오류가 발생했습니다:\n${error.message}`);
        }
    },

    /**
     * 테이블 상태 업데이트
     */
    updateTableStatus(tableNumber, status) {
        if (window.POSTableMap && typeof window.POSTableMap.updateTableStatus === "function") {
            window.POSTableMap.updateTableStatus(tableNumber, status);
        }

        console.log(`🍽️ 테이블 ${tableNumber} 상태 업데이트: ${status}`);
    }
};

// 전역으로 등록
window.OrderSessionManager = OrderSessionManager;