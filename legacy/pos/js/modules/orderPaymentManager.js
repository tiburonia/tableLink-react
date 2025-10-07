
/**
 * 주문 결제 관리 모듈
 * - 결제 수단 선택
 * - 결제 모달 관리
 * - TLL 연동 결제 처리
 */

const OrderPaymentManager = {
    selectedPaymentMethod: "card",

    /**
     * 결제 수단 선택 및 결제 처리 시작
     */
    async selectPaymentMethod(method) {
        console.log(`💳 결제 수단 선택: ${method}`);

        this.selectedPaymentMethod = method;

        // 모든 버튼 비활성화
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 선택된 버튼 활성화
        const selectedBtn = document.getElementById(`${method}PaymentBtn`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        console.log(`✅ ${method} 결제 선택됨 - TLL 연동 우선 감지`);

        // TLL 연동 주문 여부를 즉시 확인
        const isTLLIntegration = await this.checkTLLIntegrationImmediate();

        if (isTLLIntegration) {
            console.log('🔗 TLL 연동 주문 감지됨 - POSTLLPaymentModal 직접 호출');

            if (typeof window.POSTLLPaymentModal !== 'undefined') {
                await window.POSTLLPaymentModal.show();
                return;
            } else {
                console.error('❌ POSTLLPaymentModal을 찾을 수 없습니다');
                alert('TLL 연동 결제 모달을 불러올 수 없습니다.');
                return;
            }
        }

        console.log('ℹ️ 일반 POS 주문 - 기본 결제 모달 호출');
        await this.showUnifiedPaymentModal(method);
    },

    /**
     * 통합 결제 모달 표시
     */
    async showUnifiedPaymentModal(method = null) {
        try {
            console.log(`🔍 통합 결제 모달 표시 시작 (method: ${method})`);

            if (typeof window.POSPaymentModal === 'undefined') {
                console.error('❌ POSPaymentModal을 찾을 수 없습니다');
                alert('결제 모달을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
                return;
            }

            await window.POSPaymentModal.show(method);

        } catch (error) {
            console.error('❌ 결제 모달 표시 실패:', error);

            console.log('🔄 폴백: 기존 결제 방식 사용');
            if (method) {
                await this.processPaymentFallback(method);
            } else {
                alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
            }
        }
    },

    /**
     * 폴백용 직접 결제 처리
     */
    async processPaymentFallback(method) {
        try {
            console.log(`💳 폴백 ${method} 결제 처리 시작`);

            const posOrderScreen = window.POSOrderScreen;
            if (!posOrderScreen?.currentStoreId || !posOrderScreen?.currentTableNumber) {
                alert("매장 또는 테이블 정보가 없습니다.");
                return;
            }

            // 활성 주문 조회
            const activeOrderResponse = await fetch(
                `/api/pos/stores/${posOrderScreen.currentStoreId}/table/${posOrderScreen.currentTableNumber}/active-order`
            );

            if (!activeOrderResponse.ok) {
                throw new Error('활성 주문을 조회할 수 없습니다');
            }

            const activeOrderData = await activeOrderResponse.json();
            if (!activeOrderData.success || !activeOrderData.hasActiveOrder) {
                alert("결제할 활성 주문이 없습니다.");
                return;
            }

            const orderId = activeOrderData.orderId;

            // TLL 연동 여부 확인
            const isTLLIntegration = await this.checkTLLIntegrationFallback(orderId);

            if (isTLLIntegration) {
                console.log('🔗 TLL 연동 주문 감지 - TLL 전용 모달로 전환');

                if (typeof window.POSTLLPaymentModal !== 'undefined') {
                    await window.POSTLLPaymentModal.show();
                    return;
                } else {
                    console.error('❌ POSTLLPaymentModal을 찾을 수 없습니다');
                    alert('TLL 연동 결제 모달을 불러올 수 없습니다.');
                    return;
                }
            }

            // 일반 POS 결제 진행
            const unpaidResponse = await fetch(`/api/pos-payment/unpaid-tickets/${orderId}`);
            const unpaidData = await unpaidResponse.json();

            if (!unpaidData.success || unpaidData.totalTickets === 0) {
                alert("결제할 미지불 티켓이 없습니다.");
                return;
            }

            if (!confirm(
                `${method.toUpperCase()} 결제를 진행하시겠습니까?\n` +
                `결제 금액: ${unpaidData.totalAmount.toLocaleString()}원\n` +
                `처리할 티켓: ${unpaidData.totalTickets}개`
            )) {
                return;
            }

            const paymentResponse = await fetch("/api/pos-payment/process-with-customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderId,
                    paymentMethod: method.toUpperCase(),
                    amount: unpaidData.totalAmount,
                    storeId: posOrderScreen.currentStoreId,
                    tableNumber: posOrderScreen.currentTableNumber,
                    customerType: 'guest'
                }),
            });

            const paymentResult = await paymentResponse.json();

            if (paymentResult.success) {
                alert(`${method.toUpperCase()} 결제가 완료되었습니다!\n금액: ${paymentResult.amount.toLocaleString()}원`);

                await posOrderScreen.refreshOrders();
                setTimeout(() => {
                    window.POSCore?.showTableMap();
                }, 2000);
            } else {
                throw new Error(paymentResult.error || "결제 처리 실패");
            }

        } catch (error) {
            console.error("❌ 폴백 결제 처리 실패:", error);
            alert("결제 처리 중 오류가 발생했습니다: " + error.message);
        }
    },

    /**
     * TLL 연동을 즉시 감지하는 메서드
     */
    async checkTLLIntegrationImmediate() {
        try {
            const posOrderScreen = window.POSOrderScreen;
            const storeId = posOrderScreen?.currentStoreId;
            const tableNumber = posOrderScreen?.currentTableNumber;

            if (!storeId || !tableNumber) {
                console.warn('⚠️ 매장 ID 또는 테이블 번호가 없음');
                return false;
            }

            console.log(`🔍 TLL 연동 즉시 감지 시작: 매장=${storeId}, 테이블=${tableNumber}`);

            // 활성 주문 조회
            const activeOrderResponse = await fetch(
                `/api/pos/stores/${storeId}/table/${tableNumber}/active-order`
            );

            if (!activeOrderResponse.ok) {
                console.warn('⚠️ 활성 주문 조회 실패');
                return false;
            }

            const activeOrderData = await activeOrderResponse.json();
            if (!activeOrderData.success || !activeOrderData.hasActiveOrder) {
                console.log('ℹ️ 활성 주문 없음');
                return false;
            }

            const orderId = activeOrderData.orderId;

            // 테이블 상태 확인
            const tableStatusResponse = await fetch(
                `/api/pos/stores/${storeId}/table/${tableNumber}/status`
            );

            if (!tableStatusResponse.ok) {
                console.warn('⚠️ 테이블 상태 확인 실패');
                return false;
            }

            const tableStatusData = await tableStatusResponse.json();

            if (!tableStatusData.success || !tableStatusData.table) {
                console.warn('⚠️ 테이블 정보가 없음');
                return false;
            }

            const { processing_order_id, spare_processing_order_id } = tableStatusData.table;

            // POI = SPOI = 현재 주문 ID 확인
            const isSharedOrder = (
                processing_order_id !== null &&
                spare_processing_order_id !== null &&
                parseInt(processing_order_id) === parseInt(spare_processing_order_id) &&
                parseInt(processing_order_id) === parseInt(orderId)
            );

            if (!isSharedOrder) {
                console.log('ℹ️ TLL 연동 주문이 아님 (POI≠SPOI 또는 주문 ID 불일치)');
                return false;
            }

            // TLL 연동 결제 유효성 확인
            const validationResponse = await fetch(
                `/api/pos-payment-tll/validate/${orderId}?storeId=${storeId}&tableNumber=${tableNumber}`
            );

            if (!validationResponse.ok) {
                console.warn('⚠️ TLL 연동 결제 유효성 확인 실패');
                return false;
            }

            const validationData = await validationResponse.json();
            const canProcessTLLPayment = (
                validationData.success &&
                validationData.isTLLIntegration &&
                validationData.canProcessPOSPayment &&
                validationData.hasPOSUnpaidTickets &&
                validationData.hasTLLPaidTickets
            );

            return canProcessTLLPayment;

        } catch (error) {
            console.error('❌ TLL 연동 즉시 감지 중 오류:', error);
            return false;
        }
    },

    /**
     * 폴백용 TLL 연동 확인
     */
    async checkTLLIntegrationFallback(orderId) {
        try {
            const posOrderScreen = window.POSOrderScreen;
            const tableStatusResponse = await fetch(
                `/api/pos/stores/${posOrderScreen.currentStoreId}/table/${posOrderScreen.currentTableNumber}/status`
            );

            if (!tableStatusResponse.ok) {
                return false;
            }

            const tableStatusData = await tableStatusResponse.json();

            if (!tableStatusData.success || !tableStatusData.table) {
                return false;
            }

            const { processing_order_id, spare_processing_order_id } = tableStatusData.table;

            const isSharedOrder = (
                processing_order_id !== null &&
                spare_processing_order_id !== null &&
                parseInt(processing_order_id) === parseInt(spare_processing_order_id) &&
                parseInt(processing_order_id) === parseInt(orderId)
            );

            if (!isSharedOrder) {
                return false;
            }

            const validationResponse = await fetch(
                `/api/pos-payment-tll/validate/${orderId}?storeId=${posOrderScreen.currentStoreId}&tableNumber=${posOrderScreen.currentTableNumber}`
            );

            if (!validationResponse.ok) {
                return false;
            }

            const validationData = await validationResponse.json();

            return (
                validationData.success &&
                validationData.isTLLIntegration &&
                validationData.canProcessPOSPayment
            );

        } catch (error) {
            console.warn('⚠️ TLL 연동 확인 중 오류:', error);
            return false;
        }
    },

    /**
     * 결제 모달 숨기기
     */
    hidePaymentModal() {
        const modal = document.getElementById("paymentModal");
        if (modal) {
            modal.querySelector(".modal-content").style.transform = "translateY(20px)";
            modal.style.backgroundColor = "rgba(0,0,0,0)";
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    },

    /**
     * 결제 수단 이름 반환
     */
    getPaymentMethodName() {
        const names = {
            cash: "현금",
            card: "카드",
            mixed: "복합결제",
            tlpay: "TL Pay",
            simple: "간편결제",
        };
        return names[this.selectedPaymentMethod] || "카드";
    }
};

// 전역으로 등록
window.OrderPaymentManager = OrderPaymentManager;
