
/**
 * 주문 이벤트 관리 모듈
 * - 이벤트 리스너 설정
 * - 키보드 이벤트 처리
 * - UI 상호작용 이벤트
 */

const OrderEventManager = {
    /**
     * 모든 이벤트 리스너 설정
     */
    setupEventListeners() {
        this.setupPaymentEventListeners();
        this.setupKeyboardEventListeners();
        this.setupOrderEventListeners();
    },

    /**
     * 결제 관련 이벤트 리스너
     */
    setupPaymentEventListeners() {
        // 받은 금액 입력 시 거스름돈 계산
        const receivedInput = document.getElementById("receivedAmount");
        if (receivedInput) {
            receivedInput.addEventListener("input", (e) => {
                const received = parseInt(e.target.value) || 0;
                const total = window.POSOrderScreen?.cart?.reduce(
                    (sum, order) => sum + order.price * order.quantity,
                    0,
                ) || 0;
                const change = Math.max(0, received - total);

                const changeElement = document.getElementById("changeAmount");
                if (changeElement) {
                    changeElement.textContent = change.toLocaleString() + "원";
                    changeElement.className = `amount change-amount ${change > 0 ? "positive" : ""}`;
                }
            });
        }
    },

    /**
     * 키보드 이벤트 리스너
     */
    setupKeyboardEventListeners() {
        document.addEventListener("keydown", (e) => {
            // ESC 키로 편집 모드 취소
            if (e.key === "Escape") {
                if (window.POSOrderScreen?.selectedOrder) {
                    window.POSOrderScreen.cancelOrderEdit();
                }
            }

            // Enter 키로 주문 확정
            if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                window.POSOrderScreen?.confirmOrder();
            }

            // 숫자 키로 메뉴 선택 (1-9)
            if (e.key >= "1" && e.key <= "9" && !e.ctrlKey && !e.altKey) {
                const menuIndex = parseInt(e.key) - 1;
                this.selectMenuByIndex(menuIndex);
            }
        });
    },

    /**
     * 주문 관련 이벤트 리스너
     */
    setupOrderEventListeners() {
        // 주문 행 클릭 이벤트 위임
        document.addEventListener("click", (e) => {
            const orderRow = e.target.closest(".order-row");
            if (orderRow && orderRow.dataset.orderId) {
                const orderId = orderRow.dataset.orderId;
                const menuName = orderRow.querySelector(".menu-info strong")?.textContent || "";
                const quantity = parseInt(orderRow.querySelector(".quantity-display")?.textContent) || 0;
                
                if (window.OrderModificationManager) {
                    window.OrderModificationManager.toggleOrderRowSelection(orderId, menuName, quantity);
                }
            }
        });

        // 메뉴 카드 클릭 이벤트 위임
        document.addEventListener("click", (e) => {
            const menuCard = e.target.closest(".menu-card");
            if (menuCard && menuCard.onclick) {
                // onclick 이벤트가 이미 설정되어 있으면 실행하지 않음 (중복 방지)
                return;
            }
        });
    },

    /**
     * 인덱스로 메뉴 선택 (키보드 단축키용)
     */
    selectMenuByIndex(index) {
        const menuCards = document.querySelectorAll(".menu-card");
        if (menuCards[index]) {
            menuCards[index].click();
        }
    },

    /**
     * 이벤트 리스너 정리
     */
    cleanup() {
        // 필요한 경우 이벤트 리스너 제거
        document.removeEventListener("keydown", this.handleKeydown);
        document.removeEventListener("click", this.handleClick);
    }
};

// 전역으로 등록
window.OrderEventManager = OrderEventManager;
