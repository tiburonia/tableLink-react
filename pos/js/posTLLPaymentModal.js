
/**
 * TLL 연동 주문 전용 POS 결제 모달
 * - 회원/비회원 선택 불필요 (TLL에서 이미 처리됨)
 * - 카드결제만 지원
 * - 간소화된 UI
 */

const POSTLLPaymentModal = {
    currentPaymentData: null,
    isVisible: false,

    /**
     * TLL 연동 결제 모달 표시
     */
    async show() {
        console.log("🔗 TLL 연동 결제 모달 표시");

        const storeId = POSCore?.storeId || window.POSOrderScreen?.currentStoreId;
        const tableNumber = POSCore?.tableNumber || window.POSOrderScreen?.currentTableNumber;

        if (!storeId || !tableNumber) {
            console.error("❌ 매장 ID 또는 테이블 번호를 찾을 수 없습니다");
            alert("매장 또는 테이블 정보를 찾을 수 없습니다.");
            return;
        }

        // 초기 로딩 상태
        this.currentPaymentData = {
            totalAmount: 0,
            itemCount: 0,
            storeId: parseInt(storeId),
            tableNumber: parseInt(tableNumber),
            orderId: null,
            paymentMethod: "CARD", // TLL 연동은 카드결제만
            isLoading: true,
            isTLLIntegration: true
        };

        this.isVisible = true;
        this.render();
        this.setupEventListeners();

        // 실제 결제 정보 로드
        try {
            const actualPaymentInfo = await this.loadTLLPaymentInfo(storeId, tableNumber);
            
            if (actualPaymentInfo) {
                this.currentPaymentData = {
                    ...actualPaymentInfo,
                    paymentMethod: "CARD",
                    isLoading: false,
                    isTLLIntegration: true
                };
            } else {
                this.currentPaymentData = {
                    ...this.currentPaymentData,
                    isLoading: false,
                    hasError: true,
                    errorMessage: "TLL 연동 POS 결제할 내역이 없습니다."
                };
            }

            this.render();
            this.setupEventListeners();
        } catch (error) {
            console.error("❌ TLL 연동 결제 정보 로드 실패:", error);
            this.currentPaymentData = {
                ...this.currentPaymentData,
                isLoading: false,
                hasError: true,
                errorMessage: error.message
            };
            this.render();
            this.setupEventListeners();
        }
    },

    /**
     * 모달 숨김
     */
    hide() {
        const modal = document.getElementById("posTLLPaymentModal");
        if (modal) {
            modal.remove();
        }
        this.isVisible = false;
    },

    /**
     * 모달 렌더링
     */
    render() {
        const existingModal = document.getElementById("posTLLPaymentModal");
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement("div");
        modal.id = "posTLLPaymentModal";
        modal.className = "pos-tll-payment-modal-overlay";
        modal.innerHTML = this.getModalHTML();

        document.body.appendChild(modal);

        setTimeout(() => {
            modal.classList.add("show");
        }, 10);
    },

    /**
     * TLL 연동 전용 모달 HTML
     */
    getModalHTML() {
        if (!this.currentPaymentData) {
            return this.getErrorHTML();
        }

        if (this.currentPaymentData.isLoading) {
            return this.getLoadingHTML();
        }

        if (this.currentPaymentData.hasError) {
            return this.getErrorHTML();
        }

        const { totalAmount, itemCount, tableNumber } = this.currentPaymentData;

        return `
            <div class="pos-tll-payment-modal">
                <div class="modal-header">
                    <h2>🔗 TLL 연동 POS 결제</h2>
                    <button class="close-btn" id="closeTLLPaymentModal">×</button>
                </div>

                <div class="modal-body">
                    <!-- TLL 연동 안내 -->
                    <div class="tll-integration-notice">
                        <div class="notice-icon">🔗</div>
                        <div class="notice-content">
                            <h3>TLL 연동 주문</h3>
                            <p>고객이 TLL로 주문한 테이블에서 POS로 추가 주문한 내역을 결제합니다.</p>
                        </div>
                    </div>

                    <!-- 결제 요약 -->
                    <div class="payment-summary">
                        <div class="summary-row">
                            <span class="label">테이블</span>
                            <span class="value">${tableNumber}번</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">POS 추가 주문</span>
                            <span class="value">${itemCount}개 상품</span>
                        </div>
                        <div class="summary-row total">
                            <span class="label">결제 금액</span>
                            <span class="value">${totalAmount.toLocaleString()}원</span>
                        </div>
                    </div>

                    <!-- 결제 방식 (카드만) -->
                    <div class="payment-method-section">
                        <h3>결제 방식</h3>
                        <div class="tll-payment-method">
                            <div class="method-card active">
                                <div class="method-icon">💳</div>
                                <div class="method-info">
                                    <div class="method-name">카드결제</div>
                                    <div class="method-desc">TLL 연동 주문은 카드결제만 가능합니다</div>
                                </div>
                                <div class="method-status">선택됨</div>
                            </div>
                        </div>
                    </div>

                    <!-- 결제 안내 -->
                    <div class="payment-notice">
                        <div class="notice-item">
                            <span class="notice-icon">ℹ️</span>
                            <span class="notice-text">TLL 주문 부분은 이미 결제 완료된 상태입니다</span>
                        </div>
                        <div class="notice-item">
                            <span class="notice-icon">💳</span>
                            <span class="notice-text">POS 추가 주문 부분만 결제됩니다</span>
                        </div>
                        <div class="notice-item">
                            <span class="notice-icon">🔄</span>
                            <span class="notice-text">결제 완료 후 테이블이 정리됩니다</span>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="cancel-btn" id="cancelTLLPayment">취소</button>
                    <button class="confirm-btn" id="confirmTLLPayment">
                        <div class="btn-content">
                            <span class="btn-text">카드결제 진행</span>
                            <span class="btn-amount">${totalAmount.toLocaleString()}원</span>
                        </div>
                    </button>
                </div>
            </div>

            ${this.getTLLModalStyles()}
        `;
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 모달 닫기
        const closeBtn = document.getElementById("closeTLLPaymentModal");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => this.hide());
        }

        const cancelBtn = document.getElementById("cancelTLLPayment");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => this.hide());
        }

        // 결제 처리
        const confirmBtn = document.getElementById("confirmTLLPayment");
        if (confirmBtn) {
            confirmBtn.addEventListener("click", () => this.processTLLPayment());
        }

        // ESC 키로 모달 닫기
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.isVisible) {
                this.hide();
            }
        });
    },

    /**
     * TLL 연동 결제 처리
     */
    async processTLLPayment() {
        try {
            const { orderId, totalAmount, storeId, tableNumber } = this.currentPaymentData;

            if (!confirm(
                `TLL 연동 POS 카드결제를 진행하시겠습니까?\n` +
                `결제 금액: ${totalAmount.toLocaleString()}원\n` +
                `(TLL 주문은 이미 결제 완료 상태)`
            )) {
                return;
            }

            // 버튼 상태 변경
            const confirmBtn = document.getElementById("confirmTLLPayment");
            const originalHTML = confirmBtn.innerHTML;
            confirmBtn.innerHTML = `
                <div class="btn-content">
                    <span class="btn-text">처리중...</span>
                </div>
            `;
            confirmBtn.disabled = true;

            console.log("💳 TLL 연동 결제 API 호출:", {
                orderId,
                amount: totalAmount,
                storeId,
                tableNumber
            });

            // TLL 연동 전용 결제 API 호출
            const response = await fetch("/api/pos-payment-tll/process", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: orderId,
                    paymentMethod: "CARD",
                    amount: totalAmount,
                    storeId: storeId,
                    tableNumber: tableNumber,
                    customerType: "tll_integration", // 특별한 타입
                    isTLLIntegration: true
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log("✅ TLL 연동 결제 완료:", result);

                alert(
                    `TLL 연동 POS 결제가 완료되었습니다!\n` +
                    `결제 금액: ${result.amount.toLocaleString()}원\n` +
                    `처리된 POS 티켓: ${result.totalTicketsPaid}개\n` +
                    `테이블이 정리되었습니다.`
                );

                // POS 화면 데이터 새로고침
                if (typeof POSOrderScreen !== "undefined") {
                    console.log('🔄 TLL 연동 결제 완료 후 POS 데이터 새로고침');
                    POSOrderScreen.currentOrders = [];
                    POSOrderScreen.cart = [];
                    
                    if (POSOrderScreen.refreshOrders) {
                        await POSOrderScreen.refreshOrders();
                    }
                }

                this.hide();

                // 테이블 맵으로 이동
                if (typeof POSCore !== "undefined" && POSCore.showTableMap) {
                    setTimeout(() => {
                        POSCore.showTableMap();
                    }, 1500);
                }
            } else {
                throw new Error(result.error || "TLL 연동 결제 처리 실패");
            }

        } catch (error) {
            console.error("❌ TLL 연동 결제 실패:", error);
            alert("TLL 연동 결제 처리 중 오류가 발생했습니다: " + error.message);

            // 버튼 상태 복원
            const confirmBtn = document.getElementById("confirmTLLPayment");
            if (confirmBtn) {
                confirmBtn.innerHTML = originalHTML;
                confirmBtn.disabled = false;
            }
        }
    },

    /**
     * TLL 연동 결제 정보 로드
     */
    async loadTLLPaymentInfo(storeId, tableNumber) {
        try {
            // 활성 주문 조회
            const activeOrderResponse = await fetch(
                `/api/pos/stores/${storeId}/table/${tableNumber}/active-order`
            );

            if (!activeOrderResponse.ok) {
                return null;
            }

            const activeOrderData = await activeOrderResponse.json();
            if (!activeOrderData.success || !activeOrderData.hasActiveOrder) {
                return null;
            }

            const orderId = activeOrderData.orderId;

            // TLL 연동 여부 확인 및 POS 미지불 티켓 조회
            const tllValidationResponse = await fetch(
                `/api/pos-payment-tll/validate/${orderId}?storeId=${storeId}&tableNumber=${tableNumber}`
            );

            if (!tllValidationResponse.ok) {
                return null;
            }

            const tllValidationData = await tllValidationResponse.json();

            if (!tllValidationData.success || !tllValidationData.isTLLIntegration || !tllValidationData.canProcessPOSPayment) {
                return null;
            }

            console.log("✅ TLL 연동 결제 정보 확인:", {
                orderId,
                posUnpaidAmount: tllValidationData.posUnpaidAmount,
                posUnpaidTickets: tllValidationData.posUnpaidTickets
            });

            return {
                totalAmount: tllValidationData.posUnpaidAmount,
                itemCount: tllValidationData.posUnpaidTickets,
                storeId: parseInt(storeId),
                tableNumber: parseInt(tableNumber),
                orderId: orderId
            };

        } catch (error) {
            console.error("❌ TLL 연동 결제 정보 로드 실패:", error);
            return null;
        }
    },

    /**
     * 로딩 상태 HTML
     */
    getLoadingHTML() {
        return `
            <div class="pos-tll-payment-modal">
                <div class="modal-header">
                    <h2>🔗 TLL 연동 POS 결제</h2>
                    <button class="close-btn" id="closeTLLPaymentModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <h3>TLL 연동 결제 정보 확인 중...</h3>
                        <p>잠시만 기다려 주세요</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn" id="cancelTLLPayment">취소</button>
                </div>
            </div>
            ${this.getTLLModalStyles()}
        `;
    },

    /**
     * 에러 상태 HTML
     */
    getErrorHTML() {
        return `
            <div class="pos-tll-payment-modal">
                <div class="modal-header">
                    <h2>🔗 TLL 연동 POS 결제</h2>
                    <button class="close-btn" id="closeTLLPaymentModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>TLL 연동 결제 불가</h3>
                        <p>${this.currentPaymentData?.errorMessage || "TLL 연동 POS 결제 정보를 찾을 수 없습니다."}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn" id="cancelTLLPayment">닫기</button>
                </div>
            </div>
            ${this.getTLLModalStyles()}
        `;
    },

    /**
     * TLL 연동 모달 전용 스타일
     */
    getTLLModalStyles() {
        return `
            <style>
                .pos-tll-payment-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    backdrop-filter: blur(6px);
                }

                .pos-tll-payment-modal-overlay.show {
                    opacity: 1;
                }

                .pos-tll-payment-modal {
                    background: white;
                    border-radius: 24px;
                    width: 90%;
                    max-width: 480px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .pos-tll-payment-modal-overlay.show .pos-tll-payment-modal {
                    transform: scale(1);
                }

                .modal-header {
                    padding: 24px 24px 16px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    border-radius: 24px 24px 0 0;
                    color: white;
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 700;
                }

                .close-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    font-size: 24px;
                    color: white;
                    cursor: pointer;
                    padding: 8px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }

                .modal-body {
                    padding: 24px;
                }

                /* TLL 연동 안내 */
                .tll-integration-notice {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                    border: 2px solid #3b82f6;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .notice-icon {
                    font-size: 32px;
                    flex-shrink: 0;
                }

                .notice-content h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1e40af;
                }

                .notice-content p {
                    margin: 0;
                    color: #1e40af;
                    line-height: 1.5;
                    font-size: 14px;
                }

                /* 결제 요약 */
                .payment-summary {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    padding: 8px 0;
                }

                .summary-row:last-child {
                    margin-bottom: 0;
                }

                .summary-row.total {
                    border-top: 2px solid #cbd5e1;
                    margin-top: 16px;
                    padding-top: 16px;
                    font-weight: 700;
                    font-size: 18px;
                }

                .summary-row .label {
                    color: #64748b;
                    font-weight: 600;
                }

                .summary-row .value {
                    color: #1e293b;
                    font-weight: 600;
                }

                .summary-row.total .value {
                    color: #059669;
                    font-size: 20px;
                }

                /* 결제 방식 섹션 */
                .payment-method-section {
                    margin-bottom: 24px;
                }

                .payment-method-section h3 {
                    margin: 0 0 16px 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: #374151;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e5e7eb;
                }

                .tll-payment-method .method-card {
                    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
                    border: 2px solid #059669;
                    border-radius: 16px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .method-icon {
                    font-size: 32px;
                    flex-shrink: 0;
                }

                .method-info {
                    flex: 1;
                }

                .method-name {
                    font-size: 16px;
                    font-weight: 700;
                    color: #065f46;
                    margin-bottom: 4px;
                }

                .method-desc {
                    font-size: 14px;
                    color: #047857;
                }

                .method-status {
                    background: #059669;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }

                /* 결제 안내 */
                .payment-notice {
                    background: #fffbeb;
                    border: 1px solid #fbbf24;
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 8px;
                }

                .notice-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                    font-size: 14px;
                    color: #92400e;
                }

                .notice-item:last-child {
                    margin-bottom: 0;
                }

                .notice-item .notice-icon {
                    font-size: 16px;
                    flex-shrink: 0;
                }

                /* 버튼 */
                .modal-footer {
                    padding: 16px 24px 24px;
                    display: flex;
                    gap: 12px;
                    background: #f8fafc;
                    border-radius: 0 0 24px 24px;
                }

                .cancel-btn {
                    flex: 1;
                    padding: 16px 20px;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #f1f5f9;
                    color: #64748b;
                }

                .cancel-btn:hover {
                    background: #e2e8f0;
                    transform: translateY(-1px);
                }

                .confirm-btn {
                    flex: 2;
                    padding: 16px 20px;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                }

                .confirm-btn:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
                }

                .confirm-btn:disabled {
                    background: #d1d5db !important;
                    color: #9ca3af !important;
                    cursor: not-allowed !important;
                    transform: none !important;
                    box-shadow: none !important;
                }

                .btn-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .btn-amount {
                    font-size: 14px;
                    opacity: 0.9;
                }

                /* 로딩/에러 상태 */
                .loading-state,
                .error-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 40px;
                    text-align: center;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #e2e8f0;
                    border-top: 3px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }

                .error-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .loading-state h3,
                .error-state h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #374151;
                }

                .loading-state p,
                .error-state p {
                    margin: 0;
                    color: #6b7280;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* 반응형 */
                @media (max-width: 640px) {
                    .pos-tll-payment-modal {
                        width: 95%;
                        margin: 10px;
                    }

                    .modal-footer {
                        flex-direction: column;
                    }

                    .confirm-btn {
                        order: -1;
                    }
                }
            </style>
        `;
    }
};

// 전역 등록
window.POSTLLPaymentModal = POSTLLPaymentModal;

console.log("✅ TLL 연동 전용 결제 모달 로드 완료");
