
/**
 * POS 결제 모달 모듈
 * - API 기반 결제 처리
 * - 실시간 결제 데이터 조회
 * - 결제 완료 후 화면 업데이트
 */

const POSPaymentModal = {
    currentPaymentData: null,
    isProcessing: false,

    /**
     * 결제 모달 표시
     */
    async show(paymentData) {
        console.log('💳 결제 모달 표시:', paymentData);

        if (!paymentData) {
            console.error('❌ 결제 데이터가 없습니다');
            alert('결제 정보를 불러올 수 없습니다.');
            return;
        }

        this.currentPaymentData = paymentData;

        // 모달 HTML 생성
        const modalHTML = this.createModalHTML(paymentData);
        
        // 기존 모달 제거
        this.hide();
        
        // 새 모달 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 애니메이션과 함께 표시
        setTimeout(() => {
            const modal = document.getElementById('posPaymentModal');
            if (modal) {
                modal.classList.add('show');
            }
        }, 10);

        // 이벤트 리스너 설정
        this.setupEventListeners();
    },

    /**
     * 모달 HTML 생성
     */
    createModalHTML(data) {
        return `
            <div id="posPaymentModal" class="pos-payment-modal">
                <div class="modal-backdrop" onclick="POSPaymentModal.hide()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>💳 결제 처리</h3>
                        <button class="close-btn" onclick="POSPaymentModal.hide()">×</button>
                    </div>

                    <div class="modal-body">
                        <div class="payment-summary">
                            <div class="summary-row">
                                <span>매장:</span>
                                <span>매장 ${data.storeId}</span>
                            </div>
                            <div class="summary-row">
                                <span>테이블:</span>
                                <span>테이블 ${data.tableNumber}</span>
                            </div>
                            <div class="summary-row">
                                <span>결제할 티켓:</span>
                                <span>${data.itemCount}개</span>
                            </div>
                            <div class="summary-row total">
                                <span>총 결제 금액:</span>
                                <span class="amount">${data.totalAmount.toLocaleString()}원</span>
                            </div>
                        </div>

                        <div class="payment-methods">
                            <h4>결제 수단 선택</h4>
                            <div class="method-buttons">
                                <button class="method-btn" data-method="CARD" onclick="POSPaymentModal.selectMethod('CARD')">
                                    💳 카드 결제
                                </button>
                                <button class="method-btn" data-method="CASH" onclick="POSPaymentModal.selectMethod('CASH')">
                                    💵 현금 결제
                                </button>
                            </div>
                        </div>

                        <div class="payment-details" id="paymentDetails" style="display: none;">
                            <div class="cash-payment" id="cashPayment" style="display: none;">
                                <h4>현금 결제</h4>
                                <div class="input-group">
                                    <label>받은 금액:</label>
                                    <input type="number" id="receivedAmount" placeholder="받은 금액 입력" />
                                </div>
                                <div class="change-display">
                                    <span>거스름돈: </span>
                                    <span id="changeAmount">0원</span>
                                </div>
                            </div>

                            <div class="card-payment" id="cardPayment" style="display: none;">
                                <h4>카드 결제</h4>
                                <p>카드 결제를 진행합니다.</p>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="cancel-btn" onclick="POSPaymentModal.hide()">취소</button>
                        <button class="confirm-btn" id="confirmPaymentBtn" onclick="POSPaymentModal.processPayment()" disabled>
                            결제 진행
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 결제 수단 선택
     */
    selectMethod(method) {
        console.log(`💳 결제 수단 선택: ${method}`);

        // 모든 버튼 비활성화
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 선택된 버튼 활성화
        const selectedBtn = document.querySelector(`[data-method="${method}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        // 결제 상세 영역 표시
        const detailsDiv = document.getElementById('paymentDetails');
        const cashDiv = document.getElementById('cashPayment');
        const cardDiv = document.getElementById('cardPayment');
        const confirmBtn = document.getElementById('confirmPaymentBtn');

        detailsDiv.style.display = 'block';

        if (method === 'CASH') {
            cashDiv.style.display = 'block';
            cardDiv.style.display = 'none';
            confirmBtn.disabled = true; // 받은 금액 입력 후 활성화
        } else if (method === 'CARD') {
            cashDiv.style.display = 'none';
            cardDiv.style.display = 'block';
            confirmBtn.disabled = false;
        }

        this.currentPaymentData.selectedMethod = method;
    },

    /**
     * 결제 처리
     */
    async processPayment() {
        if (this.isProcessing) {
            console.log('⚠️ 이미 결제 처리 중');
            return;
        }

        const method = this.currentPaymentData.selectedMethod;
        if (!method) {
            alert('결제 수단을 선택해주세요.');
            return;
        }

        // 현금 결제인 경우 받은 금액 확인
        if (method === 'CASH') {
            const receivedAmount = parseInt(document.getElementById('receivedAmount').value || 0);
            if (receivedAmount < this.currentPaymentData.totalAmount) {
                alert('받은 금액이 부족합니다.');
                return;
            }
        }

        this.isProcessing = true;

        try {
            console.log(`💳 ${method} 결제 처리 시작`);

            // 결제 버튼 비활성화
            const confirmBtn = document.getElementById('confirmPaymentBtn');
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.textContent = '결제 처리 중...';
            }

            // 결제 API 호출
            const response = await fetch('/api/pos-payment/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: this.currentPaymentData.orderId,
                    paymentMethod: method,
                    amount: this.currentPaymentData.totalAmount,
                    storeId: this.currentPaymentData.storeId,
                    tableNumber: this.currentPaymentData.tableNumber
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ 결제 완료:', result);

                // 성공 메시지 표시
                alert(`${method === 'CARD' ? '카드' : '현금'} 결제가 완료되었습니다!\n결제 금액: ${result.amount.toLocaleString()}원`);

                // 모달 닫기
                this.hide();

                // POSOrderScreen 새로고침 (결제 완료 후 데이터 업데이트)
                if (typeof POSOrderScreen !== 'undefined' && POSOrderScreen.refreshOrders) {
                    await POSOrderScreen.refreshOrders();
                }

                // 페이지 새로고침 (완전한 데이터 동기화)
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

            } else {
                throw new Error(result.error || '결제 처리 실패');
            }

        } catch (error) {
            console.error('❌ 결제 처리 실패:', error);
            alert(`결제 처리 중 오류가 발생했습니다:\n${error.message}`);
        } finally {
            this.isProcessing = false;

            // 결제 버튼 복원
            const confirmBtn = document.getElementById('confirmPaymentBtn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = '결제 진행';
            }
        }
    },

    /**
     * 모달 닫기
     */
    hide() {
        const modal = document.getElementById('posPaymentModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
        
        this.currentPaymentData = null;
        this.isProcessing = false;
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 받은 금액 입력 시 거스름돈 계산
        const receivedInput = document.getElementById('receivedAmount');
        if (receivedInput) {
            receivedInput.addEventListener('input', (e) => {
                const received = parseInt(e.target.value) || 0;
                const total = this.currentPaymentData.totalAmount;
                const change = Math.max(0, received - total);

                const changeElement = document.getElementById('changeAmount');
                if (changeElement) {
                    changeElement.textContent = change.toLocaleString() + '원';
                    
                    if (change < 0) {
                        changeElement.style.color = '#e74c3c';
                    } else {
                        changeElement.style.color = '#27ae60';
                    }
                }

                // 받은 금액이 충분하면 결제 버튼 활성화
                const confirmBtn = document.getElementById('confirmPaymentBtn');
                if (confirmBtn) {
                    confirmBtn.disabled = received < total;
                }
            });
        }

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }
};

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .pos-payment-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .pos-payment-modal.show {
        opacity: 1;
    }

    .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
    }

    .close-btn:hover {
        background: #f3f4f6;
    }

    .modal-body {
        padding: 24px;
    }

    .payment-summary {
        background: #f8fafc;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
    }

    .summary-row.total {
        font-weight: 700;
        font-size: 16px;
        padding-top: 8px;
        border-top: 1px solid #e5e7eb;
        margin-top: 8px;
    }

    .summary-row .amount {
        color: #059669;
    }

    .payment-methods h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
    }

    .method-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 24px;
    }

    .method-btn {
        padding: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s;
    }

    .method-btn:hover {
        border-color: #3b82f6;
    }

    .method-btn.active {
        border-color: #3b82f6;
        background: #eff6ff;
        color: #1d4ed8;
    }

    .payment-details {
        background: #f8fafc;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
    }

    .payment-details h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
    }

    .input-group {
        margin-bottom: 12px;
    }

    .input-group label {
        display: block;
        margin-bottom: 4px;
        font-size: 14px;
        font-weight: 500;
    }

    .input-group input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
    }

    .change-display {
        font-size: 16px;
        font-weight: 600;
        color: #27ae60;
    }

    .modal-footer {
        display: flex;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid #e5e7eb;
    }

    .cancel-btn, .confirm-btn {
        flex: 1;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .cancel-btn {
        background: #f3f4f6;
        color: #374151;
    }

    .cancel-btn:hover {
        background: #e5e7eb;
    }

    .confirm-btn {
        background: #3b82f6;
        color: white;
    }

    .confirm-btn:hover:not(:disabled) {
        background: #2563eb;
    }

    .confirm-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
    }
`;

document.head.appendChild(style);

// 전역 등록
window.POSPaymentModal = POSPaymentModal;

console.log('✅ POSPaymentModal 모듈 로드 완료');
