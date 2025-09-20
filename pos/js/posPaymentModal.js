
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
    show(paymentData) {
        this.currentPaymentData = paymentData;
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
        document.getElementById('closePaymentModal').addEventListener('click', () => {
            this.hide();
        });

        document.getElementById('cancelPayment').addEventListener('click', () => {
            this.hide();
        });

        // 모달 외부 클릭 시 닫기
        document.getElementById('posPaymentModal').addEventListener('click', (e) => {
            if (e.target.id === 'posPaymentModal') {
                this.hide();
            }
        });

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
                document.getElementById('receivedAmount').value = amount;
                this.calculateChange();
            });
        });

        // 결제 확인
        document.getElementById('confirmPayment').addEventListener('click', () => {
            this.processPayment();
        });

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
        const received = parseInt(document.getElementById('receivedAmount').value) || 0;
        const total = this.currentPaymentData.totalAmount;
        const change = Math.max(0, received - total);

        const changeElement = document.getElementById('changeAmount');
        changeElement.textContent = change.toLocaleString() + '원';
        changeElement.style.color = change >= 0 ? '#059669' : '#dc2626';
    },

    /**
     * 결제 처리
     */
    async processPayment() {
        try {
            const selectedMethod = document.querySelector('.payment-method-btn.active').dataset.method;
            const { totalAmount, storeId, tableNumber } = this.currentPaymentData;

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

            // 기존 POS 결제 로직 호출
            if (typeof POSOrderScreen !== 'undefined' && POSOrderScreen.processPayment) {
                await POSOrderScreen.processPayment(selectedMethod);
            } else {
                // 직접 결제 API 호출
                await this.callPaymentAPI(selectedMethod);
            }

            // 성공 시 모달 닫기
            this.hide();

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
    }
};

// 전역으로 등록
window.POSPaymentModal = POSPaymentModal;
