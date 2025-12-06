/**
 * 주문 결제 관리 모듈
 * - 결제 수단 선택
 * - 결제 모달 관리
 * - TLL 연동 결제 처리
 */

const OrderPaymentManager = {
    selectedPaymentMethod: "card",
    selectedCustomerType: "guest",
    currentPaymentData: null,
    selectedMember: null,
    foundMember: null,

    /**
     * 결제 수단 선택 및 결제 처리 시작
     */
    async selectPaymentMethod(method) {
        console.log(`💳 결제 수단 선택: ${method} - 우측 패널에 결제 UI 렌더링`);

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

        console.log('ℹ️ 일반 POS 결제 - 우측 패널에 결제 UI 렌더링');
        await this.showPaymentPanel(method);
    },

    /**
     * 우측 패널에 결제 UI 렌더링
     */
    async showPaymentPanel(method = null) {
        try {
            console.log('🔄 결제 패널 렌더링 시작');

            const storeId = window.POSCore?.storeId || window.POSOrderScreen?.currentStoreId;
            const tableNumber = window.POSCore?.tableNumber || window.POSOrderScreen?.currentTableNumber;

            if (!storeId || !tableNumber) {
                console.error('❌ 매장 ID 또는 테이블 번호를 찾을 수 없습니다');
                alert('매장 또는 테이블 정보를 찾을 수 없습니다.');
                return;
            }

            // 결제 정보 로드
            const paymentInfo = await this.loadPaymentInfo(storeId, tableNumber);

            if (!paymentInfo) {
                alert('결제할 주문이 없습니다.');
                return;
            }

            this.currentPaymentData = paymentInfo;

            // 우측 패널 업데이트
            const rightPanel = document.getElementById('rightPanel');
            if (rightPanel) {
                rightPanel.innerHTML = window.OrderUIRenderer.renderPaymentPanel(paymentInfo);
                console.log('✅ 결제 패널 렌더링 완료');
            }

        } catch (error) {
            console.error('❌ 결제 패널 표시 실패:', error);
            alert('결제 화면을 불러올 수 없습니다: ' + error.message);
        }
    },

    /**
     * 결제 패널 취소
     */
    cancelPaymentPanel() {
        console.log('🚫 결제 패널 취소');

        const rightPanel = document.getElementById('rightPanel');
        if (rightPanel) {
            rightPanel.innerHTML = `
                ${window.OrderUIRenderer.renderMenuSection()}
                ${window.OrderUIRenderer.renderPaymentMethodSection()}
            `;
        }

        this.currentPaymentData = null;
        this.selectedCustomerType = "guest";
        this.selectedMember = null;
        this.foundMember = null;
    },

    

    /**
     * 패널에서 결제 수단 선택
     */
    selectPaymentMethodInPanel(method) {
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === method);
        });

        const confirmBtn = document.querySelector('.confirm-payment-btn .btn-text');
        if (confirmBtn) {
            confirmBtn.textContent = method === 'CARD' ? '카드결제 진행' : '현금결제 진행';
        }
    },

    /**
     * 패널에서 회원 조회 (조회만 하고 자동 연동하지 않음)
     */
    async searchMemberInPanel() {
        const phoneInput = document.getElementById('memberPhoneInputPanel');
        const memberDisplay = document.getElementById('memberDisplayPanel');

        const phoneNumber = phoneInput.value.trim();
        if (!phoneNumber) {
            alert('전화번호를 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(`/api/users/search-by-phone?phone=${encodeURIComponent(phoneNumber)}`);
            const data = await response.json();

            if (data.success && data.user) {
                // 임시로 찾은 회원 정보 저장 (아직 연동 안 됨)
                this.foundMember = data.user;
                // 연동되지 않은 상태로 카드 표시
                memberDisplay.innerHTML = window.OrderUIRenderer.renderMemberCard(data.user, false);
                memberDisplay.style.display = 'block';
                console.log('✅ 회원 조회 성공 (연동 대기 중):', data.user);
            } else {
                this.foundMember = null;
                memberDisplay.style.display = 'none';
                alert('회원을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('❌ 회원 조회 실패:', error);
            this.foundMember = null;
            memberDisplay.style.display = 'none';
            alert('회원 조회 중 오류가 발생했습니다.');
        }
    },

    /**
     * 회원 연동 (사용자가 명시적으로 선택)
     */
    linkMember() {
        if (!this.foundMember) {
            alert('연동할 회원 정보가 없습니다.');
            return;
        }

        this.selectedMember = this.foundMember;
        this.selectedCustomerType = 'member';

        const memberDisplay = document.getElementById('memberDisplayPanel');
        memberDisplay.innerHTML = window.OrderUIRenderer.renderMemberCard(this.selectedMember, true);
        
        console.log('✅ 회원 연동 완료:', this.selectedMember);
        alert(`${this.selectedMember.name}님으로 회원 연동되었습니다.`);
    },

    /**
     * 회원 연동 해제
     */
    unlinkMember() {
        this.selectedMember = null;
        this.selectedCustomerType = 'guest';

        const memberDisplay = document.getElementById('memberDisplayPanel');
        const phoneInput = document.getElementById('memberPhoneInputPanel');
        
        if (this.foundMember) {
            // 조회된 회원 정보는 유지하되 연동만 해제
            memberDisplay.innerHTML = window.OrderUIRenderer.renderMemberCard(this.foundMember, false);
        } else {
            memberDisplay.style.display = 'none';
            phoneInput.value = '';
        }

        console.log('✅ 회원 연동 해제');
    },

    /**
     * 회원 검색 취소
     */
    cancelMemberSearch() {
        this.foundMember = null;
        this.selectedMember = null;
        this.selectedCustomerType = 'guest';

        const memberDisplay = document.getElementById('memberDisplayPanel');
        const phoneInput = document.getElementById('memberPhoneInputPanel');
        
        memberDisplay.style.display = 'none';
        phoneInput.value = '';

        console.log('✅ 회원 검색 취소');
    },

    /**
     * 회원 카드 렌더링
     */
    renderMemberCard(user) {
        return `
            <div class="member-card-panel">
                <div class="member-info">
                    <strong>${user.name || '회원'}</strong>
                    <span>${user.phone}</span>
                </div>
                <div class="member-points">
                    보유 포인트: ${(user.point || 0).toLocaleString()}P
                </div>
            </div>
        `;
    },

    /**
     * 패널에서 결제 확정
     */
    async confirmPaymentInPanel() {
        try {
            if (!this.currentPaymentData) {
                alert('결제 정보가 없습니다.');
                return;
            }

            const { orderId, totalAmount, storeId, tableNumber } = this.currentPaymentData;

            let memberPhone = null;
            let memberId = null;

            // 회원 연동 여부 확인
            if (this.selectedMember) {
                // 회원으로 연동되어 있음
                this.selectedCustomerType = 'member';
                memberPhone = this.selectedMember.phone;
                memberId = this.selectedMember.id;
            } else if (this.foundMember) {
                // 회원을 조회했지만 연동하지 않음
                alert('회원 정보를 조회했지만 연동되지 않았습니다.\n"이 회원으로 연동" 버튼을 클릭하거나, 비회원으로 진행하려면 "취소"를 누르세요.');
                return;
            } else {
                // 비회원 결제
                this.selectedCustomerType = 'guest';
            }

            const customerType = this.selectedCustomerType === 'member' ? '회원' : '비회원';
            const phoneInfo = this.selectedCustomerType === 'member' 
                ? `회원: ${memberPhone}` 
                : '비회원';

            if (!confirm(`${customerType} 카드결제를 진행하시겠습니까?\n결제 금액: ${totalAmount.toLocaleString()}원\n${phoneInfo}`)) {
                return;
            }

            // 버튼 비활성화
            const confirmBtn = document.querySelector('.confirm-payment-btn');
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<span class="btn-text">처리중...</span>';
            }

            // 결제 처리
            const response = await fetch('/api/pos-payment/process-with-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    paymentMethod: 'CARD',
                    amount: totalAmount,
                    storeId,
                    tableNumber,
                    customerType: this.selectedCustomerType,
                    guestPhone: null, // 비회원은 전화번호 없음
                    memberPhone,
                    memberId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '결제 처리 실패');
            }

            const result = await response.json();

            if (result.success) {
                alert(`결제가 완료되었습니다!\n결제 금액: ${result.amount.toLocaleString()}원`);

                // 패널 닫기
                this.cancelPaymentPanel();

                // POS 화면 새로고침
                if (typeof POSOrderScreen !== 'undefined') {
                    POSOrderScreen.currentOrders = [];
                    POSOrderScreen.cart = [];
                    if (POSOrderScreen.refreshOrders) {
                        await POSOrderScreen.refreshOrders();
                    }
                }

                // 테이블 맵으로 이동
                if (typeof POSCore !== 'undefined' && POSCore.showTableMap) {
                    setTimeout(() => POSCore.showTableMap(), 2000);
                }
            } else {
                throw new Error(result.error || '결제 처리 실패');
            }

        } catch (error) {
            console.error('❌ 결제 처리 실패:', error);
            alert('결제 처리 중 오류가 발생했습니다: ' + error.message);

            const confirmBtn = document.querySelector('.confirm-payment-btn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = `
                    <span class="btn-text">카드결제 진행</span>
                    <span class="btn-amount">${this.currentPaymentData.totalAmount.toLocaleString()}원</span>
                `;
            }
        }
    },

    /**
     * 결제 정보 로드
     */
    async loadPaymentInfo(storeId, tableNumber) {
        try {
            const activeOrderResponse = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/active-order`);
            if (!activeOrderResponse.ok) return null;

            const activeOrderData = await activeOrderResponse.json();
            if (!activeOrderData.success || !activeOrderData.hasActiveOrder) return null;

            const orderId = activeOrderData.orderId;

            const unpaidResponse = await fetch(`/api/pos-payment/unpaid-tickets/${orderId}`);
            if (!unpaidResponse.ok) return null;

            const unpaidData = await unpaidResponse.json();
            if (!unpaidData.success || unpaidData.totalTickets === 0) return null;

            return {
                totalAmount: unpaidData.totalAmount,
                itemCount: unpaidData.totalTickets,
                storeId: parseInt(storeId),
                tableNumber: parseInt(tableNumber),
                orderId: orderId
            };
        } catch (error) {
            console.error('❌ 결제 정보 로드 실패:', error);
            return null;
        }
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