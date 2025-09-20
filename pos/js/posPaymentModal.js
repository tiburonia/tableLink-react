/**
 * POS 결제 모달 컴포넌트
 * 회원/비회원 구분 없이 사용 가능한 전역 모달
 */

const POSPaymentModal = {
    currentPaymentData: null,
    isVisible: false,

    /**
     * 결제 모달 표시
     */
    async show(paymentData) {
        console.log('🔍 결제 모달 표시 요청:', paymentData);

        if (!paymentData) {
            console.error('❌ 결제 데이터가 없습니다');
            alert('결제 정보를 불러올 수 없습니다.');
            return;
        }

        // 필수 필드 검증
        const requiredFields = ['totalAmount', 'itemCount', 'storeId', 'tableNumber'];
        const missingFields = requiredFields.filter(field => paymentData[field] === undefined || paymentData[field] === null);

        if (missingFields.length > 0) {
            console.error('❌ 필수 결제 데이터 누락:', missingFields, paymentData);
            alert('결제 정보가 완전하지 않습니다: ' + missingFields.join(', '));
            return;
        }

        // 데이터 유효성 재확인
        if (typeof paymentData.totalAmount !== 'number' || paymentData.totalAmount <= 0) {
            console.error('❌ 결제 금액이 유효하지 않습니다:', paymentData.totalAmount);
            alert('결제 금액이 유효하지 않습니다.');
            return;
        }

        // 현재 테이블의 실제 결제 정보 조회
        const actualPaymentInfo = await this.loadActualPaymentInfo(paymentData.storeId, paymentData.tableNumber);

        // 실제 결제 정보가 있으면 우선 사용, 없으면 전달받은 데이터 사용
        const finalPaymentData = actualPaymentInfo || {
            totalAmount: paymentData.totalAmount,
            itemCount: paymentData.itemCount,
            storeId: paymentData.storeId,
            tableNumber: paymentData.tableNumber,
            orderId: paymentData.orderId || null,
            paymentMethod: paymentData.paymentMethod || 'CARD'
        };

        // 모든 검증 통과 후 데이터 설정
        this.currentPaymentData = finalPaymentData;

        // 데이터 설정 확인
        if (!this.currentPaymentData || this.currentPaymentData.totalAmount <= 0) {
            console.error('❌ 유효하지 않은 결제 데이터:', this.currentPaymentData);
            alert('결제 정보가 유효하지 않습니다.');
            return;
        }

        console.log('✅ 결제 데이터 설정 완료:', this.currentPaymentData);

        this.isVisible = true;
        this.render();
        this.setupEventListeners();
    },

    /**
     * 결제 모달 숨김
     */
    hide() {
        const modal = document.getElementById('posPaymentModal');
        if (modal) {
            modal.remove();
        }
        this.isVisible = false;
        this.currentPaymentData = null;
    },

    /**
     * 모달 렌더링
     */
    render() {
        // 기존 모달이 있으면 제거
        this.hide();

        const modal = document.createElement('div');
        modal.id = 'posPaymentModal';
        modal.className = 'pos-payment-modal-overlay';
        modal.innerHTML = this.getModalHTML();

        document.body.appendChild(modal);

        // 애니메이션을 위한 지연
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    },

    /**
     * 모달 HTML 생성
     */
    getModalHTML() {
        if (!this.currentPaymentData) {
            console.error('❌ getModalHTML: currentPaymentData가 null입니다');
            return '<div class="error">결제 데이터를 불러올 수 없습니다.</div>';
        }

        const { totalAmount, itemCount, storeId, tableNumber } = this.currentPaymentData;

        return `
            <div class="pos-payment-modal">
                <div class="modal-header">
                    <h2>💳 결제 확인</h2>
                    <button class="close-btn" id="closePaymentModal">×</button>
                </div>

                <div class="modal-body">
                    <!-- 주문 요약 -->
                    <div class="payment-summary">
                        <div class="summary-row">
                            <span class="label">테이블</span>
                            <span class="value">${tableNumber}번</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">주문 수량</span>
                            <span class="value">${itemCount}개</span>
                        </div>
                        <div class="summary-row total">
                            <span class="label">결제 금액</span>
                            <span class="value">${totalAmount.toLocaleString()}원</span>
                        </div>
                    </div>

                    <!-- 결제 수단 선택 -->
                    <div class="payment-methods">
                        <h3>결제 수단 선택</h3>
                        <div class="method-buttons">
                            <button class="payment-method-btn active" data-method="CARD">
                                <div class="method-icon">💳</div>
                                <span>카드결제</span>
                            </button>
                            <button class="payment-method-btn" data-method="CASH">
                                <div class="method-icon">💵</div>
                                <span>현금결제</span>
                            </button>
                        </div>
                    </div>

                    <!-- 현금 결제 시 거스름돈 계산 -->
                    <div class="cash-section" id="cashSection" style="display: none;">
                        <h3>현금 결제</h3>
                        <div class="cash-input-group">
                            <label>받은 금액</label>
                            <input type="number" id="receivedAmount" placeholder="받은 금액 입력" min="${totalAmount}">
                            <div class="quick-amount-buttons">
                                <button class="quick-btn" data-amount="${totalAmount}">정확히</button>
                                <button class="quick-btn" data-amount="${Math.ceil(totalAmount / 10000) * 10000}">만원 단위</button>
                                <button class="quick-btn" data-amount="${totalAmount + 1000}">+1천원</button>
                                <button class="quick-btn" data-amount="${totalAmount + 5000}">+5천원</button>
                            </div>
                        </div>
                        <div class="change-display">
                            <span class="label">거스름돈</span>
                            <span class="value" id="changeAmount">0원</span>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="cancel-btn" id="cancelPayment">취소</button>
                    <button class="confirm-btn" id="confirmPayment">
                        <span id="paymentBtnText">카드결제 진행</span>
                        <span class="amount">${totalAmount.toLocaleString()}원</span>
                    </button>
                </div>
            </div>

            <style>
                .pos-payment-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .pos-payment-modal-overlay.show {
                    opacity: 1;
                }

                .pos-payment-modal {
                    background: white;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }

                .pos-payment-modal-overlay.show .pos-payment-modal {
                    transform: scale(1);
                }

                .modal-header {
                    padding: 24px 24px 16px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 700;
                    color: #1e293b;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 28px;
                    color: #64748b;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: #f1f5f9;
                    color: #374151;
                }

                .modal-body {
                    padding: 24px;
                }

                .payment-summary {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 24px;
                    border: 1px solid #e2e8f0;
                }

                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    font-size: 16px;
                }

                .summary-row:not(:last-child) {
                    border-bottom: 1px solid #e2e8f0;
                }

                .summary-row.total {
                    font-weight: 700;
                    font-size: 18px;
                    color: #1e293b;
                    border-top: 2px solid #3b82f6;
                    padding-top: 16px;
                    margin-top: 8px;
                }

                .payment-methods h3,
                .cash-section h3 {
                    margin: 0 0 16px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #374151;
                }

                .method-buttons {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .payment-method-btn {
                    flex: 1;
                    padding: 16px 12px;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    color: #64748b;
                }

                .payment-method-btn:hover {
                    border-color: #3b82f6;
                    background: #f8fafc;
                }

                .payment-method-btn.active {
                    border-color: #3b82f6;
                    background: #eff6ff;
                    color: #1d4ed8;
                }

                .method-icon {
                    font-size: 24px;
                }

                .cash-section {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                }

                .cash-input-group {
                    margin-bottom: 16px;
                }

                .cash-input-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #374151;
                }

                .cash-input-group input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 12px;
                }

                .cash-input-group input:focus {
                    outline: none;
                    border-color: #3b82f6;
                }

                .quick-amount-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .quick-btn {
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.2s;
                    color: #6b7280;
                }

                .quick-btn:hover {
                    background: #f3f4f6;
                    border-color: #9ca3af;
                }

                .change-display {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #d1d5db;
                    font-weight: 600;
                }

                .change-display .value {
                    color: #059669;
                    font-size: 16px;
                }

                .modal-footer {
                    padding: 16px 24px 24px;
                    display: flex;
                    gap: 12px;
                }

                .cancel-btn,
                .confirm-btn {
                    flex: 1;
                    padding: 16px 20px;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .cancel-btn {
                    background: #f1f5f9;
                    color: #64748b;
                }

                .cancel-btn:hover {
                    background: #e2e8f0;
                }

                .confirm-btn {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                }

                .confirm-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
                }

                .confirm-btn .amount {
                    font-size: 18px;
                    font-weight: 800;
                }
            </style>
        `;
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 모달 닫기
        const closeBtn = document.getElementById('closePaymentModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        const cancelBtn = document.getElementById('cancelPayment');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // 모달 외부 클릭 시 닫기
        const modal = document.getElementById('posPaymentModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'posPaymentModal') {
                    this.hide();
                }
            });
        }

        // 결제 수단 선택
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 모든 버튼 비활성화
                document.querySelectorAll('.payment-method-btn').forEach(b => {
                    b.classList.remove('active');
                });

                // 선택된 버튼 활성화
                btn.classList.add('active');

                const method = btn.dataset.method;
                this.handlePaymentMethodChange(method);
            });
        });

        // 현금 결제 관련 이벤트
        const receivedInput = document.getElementById('receivedAmount');
        if (receivedInput) {
            receivedInput.addEventListener('input', () => {
                this.calculateChange();
            });
        }

        // 빠른 금액 버튼
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                const receivedAmountInput = document.getElementById('receivedAmount');
                if (receivedAmountInput) {
                    receivedAmountInput.value = amount;
                    this.calculateChange();
                }
            });
        });

        // 결제 확인
        const confirmBtn = document.getElementById('confirmPayment');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.processPayment();
            });
        }

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    },

    /**
     * 결제 수단 변경 처리
     */
    handlePaymentMethodChange(method) {
        const cashSection = document.getElementById('cashSection');
        const paymentBtnText = document.getElementById('paymentBtnText');

        if (method === 'CASH') {
            cashSection.style.display = 'block';
            paymentBtnText.textContent = '현금결제 진행';
        } else {
            cashSection.style.display = 'none';
            paymentBtnText.textContent = '카드결제 진행';
        }
    },

    /**
     * 거스름돈 계산
     */
    calculateChange() {
        if (!this.currentPaymentData) {
            console.warn('⚠️ 결제 데이터가 없어 거스름돈을 계산할 수 없습니다');
            return;
        }

        const receivedInput = document.getElementById('receivedAmount');
        const changeElement = document.getElementById('changeAmount');

        if (!receivedInput || !changeElement) {
            console.warn('⚠️ 거스름돈 계산을 위한 DOM 요소를 찾을 수 없습니다');
            return;
        }

        const received = parseInt(receivedInput.value) || 0;
        const total = this.currentPaymentData.totalAmount;
        const change = Math.max(0, received - total);

        changeElement.textContent = change.toLocaleString() + '원';
        changeElement.style.color = change >= 0 ? '#059669' : '#dc2626';
    },

    /**
     * 결제 처리
     */
    async processPayment() {
        try {
            const selectedMethod = document.querySelector('.payment-method-btn.active').dataset.method;
            const { totalAmount, storeId, tableNumber, orderId } = this.currentPaymentData;

            // 현금 결제시 받은 금액 검증
            if (selectedMethod === 'CASH') {
                const receivedAmount = parseInt(document.getElementById('receivedAmount').value) || 0;
                if (receivedAmount < totalAmount) {
                    alert('받은 금액이 결제 금액보다 적습니다.');
                    return;
                }
            }

            // 결제 확인
            const methodName = selectedMethod === 'CARD' ? '카드' : '현금';
            if (!confirm(`${methodName} 결제를 진행하시겠습니까?\n결제 금액: ${totalAmount.toLocaleString()}원`)) {
                return;
            }

            // 로딩 상태로 변경
            const confirmBtn = document.getElementById('confirmPayment');
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<span>처리중...</span>';
            confirmBtn.disabled = true;

            // 직접 POS 결제 API 호출 (기존 결제 로직 사용)
            const paymentResult = await this.directProcessPayment(selectedMethod);

            if (paymentResult.success) {
                console.log('✅ 결제 완료:', paymentResult);

                const successMessage = `${methodName} 결제가 완료되었습니다!\n` +
                                     `결제 금액: ${paymentResult.amount.toLocaleString()}원\n` +
                                     `처리된 티켓: ${paymentResult.totalTicketsPaid}개`;
                alert(successMessage);

                // POS 화면 새로고침
                if (typeof POSOrderScreen !== 'undefined' && POSOrderScreen.refreshOrders) {
                    await POSOrderScreen.refreshOrders();
                }

                // 모달 닫기
                this.hide();
            } else {
                throw new Error(paymentResult.error || '결제 처리 실패');
            }

        } catch (error) {
            console.error('❌ 결제 처리 실패:', error);
            alert('결제 처리 중 오류가 발생했습니다: ' + error.message);

            // 버튼 상태 복원
            const confirmBtn = document.getElementById('confirmPayment');
            if (confirmBtn) {
                confirmBtn.innerHTML = originalText;
                confirmBtn.disabled = false;
            }
        }
    },

    /**
     * 직접 결제 처리 (기존 POS 결제 API 사용)
     */
    async directProcessPayment(paymentMethod) {
        const { orderId, totalAmount, storeId, tableNumber } = this.currentPaymentData;

        console.log(`💳 직접 결제 처리: 주문 ${orderId}, 방법: ${paymentMethod}, 금액: ${totalAmount}`);

        const response = await fetch('/api/pos-payment/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: orderId,
                paymentMethod: paymentMethod.toUpperCase(),
                amount: totalAmount,
                storeId: storeId,
                tableNumber: tableNumber
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
    },

    /**
     * 실제 결제 정보 로드 (서버에서 현재 상태 조회)
     */
    async loadActualPaymentInfo(storeId, tableNumber) {
        try {
            console.log(`📋 실제 결제 정보 조회: 매장 ${storeId}, 테이블 ${tableNumber}`);

            // 1. 현재 테이블의 활성 주문 조회
            const activeOrderResponse = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/active-order`);

            if (!activeOrderResponse.ok) {
                console.warn('⚠️ 활성 주문 조회 실패');
                return null;
            }

            const activeOrderData = await activeOrderResponse.json();

            if (!activeOrderData.success || !activeOrderData.hasActiveOrder) {
                console.log('ℹ️ 활성 주문이 없습니다');
                return null;
            }

            const orderId = activeOrderData.orderId;

            // 2. 미지불 티켓 정보 조회
            const unpaidResponse = await fetch(`/api/pos-payment/unpaid-tickets/${orderId}`);

            if (!unpaidResponse.ok) {
                console.warn('⚠️ 미지불 티켓 조회 실패');
                return null;
            }

            const unpaidData = await unpaidResponse.json();

            if (!unpaidData.success || unpaidData.totalTickets === 0) {
                console.log('ℹ️ 미지불 티켓이 없습니다');
                return null;
            }

            console.log(`✅ 실제 결제 정보 조회 완료: ${unpaidData.totalTickets}개 티켓, ${unpaidData.totalAmount}원`);

            return {
                totalAmount: unpaidData.totalAmount,
                itemCount: unpaidData.totalTickets,
                storeId: parseInt(storeId),
                tableNumber: parseInt(tableNumber),
                orderId: orderId,
                paymentMethod: 'CARD'
            };

        } catch (error) {
            console.error('❌ 실제 결제 정보 조회 실패:', error);
            return null;
        }
    },

    /**
     * 결제 API 직접 호출
     */
    async callPaymentAPI(paymentMethod) {
        const { storeId, tableNumber, totalAmount, orderId } = this.currentPaymentData;

        // 먼저 카트에 있는 주문들을 확정해야 하는지 확인
        if (typeof POSOrderScreen !== 'undefined' && POSOrderScreen.cart && POSOrderScreen.cart.length > 0) {
            console.log('📋 카트에 미확정 주문이 있음, 먼저 주문 확정 진행');
            await POSOrderScreen.confirmOrder();

            // 잠시 대기하여 주문 확정이 완료되도록 함
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 최신 주문 ID 가져오기
        let finalOrderId = orderId;
        if (!finalOrderId && typeof POSOrderScreen !== 'undefined') {
            // 현재 테이블의 활성 주문 조회
            const activeOrderResponse = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/active-order`);
            if (activeOrderResponse.ok) {
                const activeOrderData = await activeOrderResponse.json();
                if (activeOrderData.success && activeOrderData.orderId) {
                    finalOrderId = activeOrderData.orderId;
                }
            }
        }

        if (!finalOrderId) {
            throw new Error('결제할 주문을 찾을 수 없습니다.');
        }

        const response = await fetch('/api/pos-payment/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: finalOrderId,
                paymentMethod: paymentMethod,
                amount: totalAmount,
                storeId: storeId,
                tableNumber: tableNumber
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '결제 처리 실패');
        }

        const result = await response.json();
        console.log('✅ 결제 완료:', result);

        const methodName = paymentMethod === 'CARD' ? '카드' : '현금';
        alert(`${methodName} 결제가 완료되었습니다!\n결제 금액: ${totalAmount.toLocaleString()}원`);

        // 화면 새로고침 (POSOrderScreen이 있는 경우)
        if (typeof POSOrderScreen !== 'undefined') {
            if (POSOrderScreen.clearCart) {
                POSOrderScreen.clearCart();
            }
            if (POSOrderScreen.refreshOrders) {
                await POSOrderScreen.refreshOrders();
            }
        }

        return result;
    },

    /**
     * POSPaymentModal을 사용한 결제 모달 표시 (API 호출 기반)
     */
    async showPOSPaymentModal(method) {
        console.log('✨ POSPaymentModal 결제 모달 표시 (API 기반)');

        // 필수 정보 검증 - POSCore에서 정보 가져오기
        const storeId = this.currentStoreId || (typeof POSCore !== 'undefined' ? POSCore.storeId : null);
        const tableNumber = this.currentTableNumber || (typeof POSCore !== 'undefined' ? POSCore.tableNumber : null);

        if (!storeId || !tableNumber) {
            console.error('❌ 매장 ID 또는 테이블 번호가 설정되지 않았습니다');
            alert('매장 또는 테이블 정보가 설정되지 않았습니다.');
            return;
        }

        try {
            // 로딩 표시
            const loadingToast = this.showLoadingToast('결제 정보를 불러오는 중...');

            // API 호출로 실제 결제 대상 내역 조회
            const paymentData = await this.fetchPaymentTargetData(storeId, tableNumber);

            // 로딩 토스트 제거
            if (loadingToast) {
                loadingToast.remove();
            }

            if (!paymentData) {
                alert('결제할 내역이 없습니다.');
                return;
            }

            console.log('💳 API로부터 받은 결제 데이터:', paymentData);

            // POSPaymentModal 표시
            if (typeof POSPaymentModal !== 'undefined') {
                POSPaymentModal.show(paymentData);
            } else {
                console.error('❌ POSPaymentModal이 로드되지 않았습니다');
                alert('결제 모달을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
            }

        } catch (error) {
            console.error('❌ 결제 정보 조회 실패:', error);
            alert(`결제 정보를 불러올 수 없습니다: ${error.message}`);
        }
    },

    /**
     * API 호출로 결제 대상 데이터 조회
     */
    async fetchPaymentTargetData(storeId, tableNumber) {
        console.log(`🔍 결제 대상 데이터 조회: 매장 ${storeId}, 테이블 ${tableNumber}`);

        try {
            // 1. 현재 테이블의 활성 주문 조회
            const activeOrderResponse = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/active-order`);

            if (!activeOrderResponse.ok) {
                console.warn('⚠️ 활성 주문 조회 실패');
                return null;
            }

            const activeOrderData = await activeOrderResponse.json();

            if (!activeOrderData.success || !activeOrderData.hasActiveOrder) {
                console.log('ℹ️ 활성 주문이 없습니다');
                return null;
            }

            const orderId = activeOrderData.orderId;

            // 2. 미지불 티켓 정보 조회
            const unpaidResponse = await fetch(`/api/pos-payment/unpaid-tickets/${orderId}`);

            if (!unpaidResponse.ok) {
                throw new Error('미지불 티켓 조회 실패');
            }

            const unpaidData = await unpaidResponse.json();

            if (!unpaidData.success || unpaidData.totalTickets === 0) {
                console.log('ℹ️ 미지불 티켓이 없습니다');
                return null;
            }

            // 3. 주문 상세 정보 조회 (주문 아이템들)
            const orderItemsResponse = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/order-items`);

            let orderItems = [];
            if (orderItemsResponse.ok) {
                const orderItemsData = await orderItemsResponse.json();
                if (orderItemsData.success && orderItemsData.orderItems) {
                    orderItems = orderItemsData.orderItems;
                }
            }

            console.log(`✅ 결제 대상 데이터 조회 완료: ${unpaidData.totalTickets}개 티켓, ${unpaidData.totalAmount}원`);

            return {
                totalAmount: unpaidData.totalAmount,
                itemCount: unpaidData.totalTickets,
                storeId: parseInt(storeId),
                tableNumber: parseInt(tableNumber),
                orderId: orderId,
                unpaidTickets: unpaidData.unpaidTickets,
                orderItems: orderItems,
                paymentMethod: 'CARD'
            };

        } catch (error) {
            console.error('❌ 결제 대상 데이터 조회 실패:', error);
            throw error;
        }
    },

    /**
     * 로딩 토스트 표시
     */
    showLoadingToast(message) {
        const toast = document.createElement('div');
        toast.className = 'loading-toast';
        toast.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <span>${message}</span>
            </div>
        `;

        // 스타일 추가
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 16px;
            font-weight: 600;
        `;

        const loadingSpinner = toast.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.cssText = `
                width: 20px;
                height: 20px;
                border: 2px solid #ffffff40;
                border-top: 2px solid #ffffff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            `;
        }

        document.body.appendChild(toast);
        return toast;
    },
};

// 전역으로 등록
window.POSPaymentModal = POSPaymentModal;