/**
 * POS 결제 모달 컴포넌트
 * 회원/비회원 구분 및 비회원 전화번호 입력 지원
 */

const POSPaymentModal = {
    currentPaymentData: null,
    isVisible: false,
    selectedCustomerType: 'guest', // 'member' 또는 'guest'
    guestPhoneNumber: '',

    /**
     * 결제 모달 표시
     */
    async show(paymentMethod = 'CARD') {
        console.log('🔍 결제 모달 표시 요청 (API 기반):', paymentMethod);

        // POSOrderScreen에서 현재 테이블 정보 가져오기
        const storeId = POSCore?.storeId || window.POSOrderScreen?.currentStoreId;
        const tableNumber = POSCore?.tableNumber || window.POSOrderScreen?.currentTableNumber;

        if (!storeId || !tableNumber) {
            console.error('❌ 매장 ID 또는 테이블 번호를 찾을 수 없습니다');
            alert('매장 또는 테이블 정보를 찾을 수 없습니다. 다시 시도해 주세요.');
            return;
        }

        // 초기 로딩 상태로 currentPaymentData 설정
        this.currentPaymentData = {
            totalAmount: 0,
            itemCount: 0,
            storeId: parseInt(storeId),
            tableNumber: parseInt(tableNumber),
            orderId: null,
            paymentMethod: paymentMethod,
            isLoading: true
        };

        this.isVisible = true;

        console.log('📋 초기 로딩 상태로 설정:', this.currentPaymentData);

        // 모달 먼저 렌더링 (로딩 상태로)
        this.render();
        this.setupEventListeners();

        // API 호출로 실제 결제 정보 로드
        try {
            console.log('📡 결제 대상 데이터 API 호출 시작');

            const actualPaymentInfo = await this.loadActualPaymentInfo(storeId, tableNumber);

            if (actualPaymentInfo) {
                // API로부터 받은 실제 데이터로 업데이트
                this.currentPaymentData = {
                    ...actualPaymentInfo,
                    paymentMethod: paymentMethod,
                    isLoading: false
                };

                console.log('✅ 실제 결제 정보 로드 완료:', this.currentPaymentData);
            } else {
                // API 응답이 없을 경우 (결제할 내역이 없음)
                this.currentPaymentData = {
                    ...this.currentPaymentData,
                    isLoading: false,
                    hasError: true,
                    errorMessage: '결제할 주문이 없습니다.'
                };

                console.log('ℹ️ 결제할 주문이 없음');
            }

            // 데이터 로드 후 모달 재렌더링
            this.render();
            this.setupEventListeners();

        } catch (error) {
            console.error('❌ 결제 정보 API 로드 실패:', error);

            this.currentPaymentData = {
                ...this.currentPaymentData,
                isLoading: false,
                hasError: true,
                errorMessage: error.message
            };

            // 에러 상태로 모달 재렌더링
            this.render();
            this.setupEventListeners();
        }
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
        // currentPaymentData는 null로 설정하지 않음 (재사용 가능하도록)
        this.selectedCustomerType = 'guest';
        this.guestPhoneNumber = '';
    },

    /**
     * 완전 초기화 (모달을 완전히 닫을 때 사용)
     */
    reset() {
        this.hide();
        this.currentPaymentData = null;
    },

    /**
     * 모달 렌더링
     */
    render() {
        // 기존 모달이 있으면 제거 (단, currentPaymentData는 유지)
        const existingModal = document.getElementById('posPaymentModal');
        if (existingModal) {
            existingModal.remove();
        }

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
            console.error('❌ getModalHTML: currentPaymentData가 null입니다', {
                isVisible: this.isVisible,
                callerStack: new Error().stack
            });
            return this.getErrorHTML();
        }

        // 로딩 상태 처리
        if (this.currentPaymentData.isLoading) {
            return this.getLoadingHTML();
        }

        // 에러 상태 처리
        if (this.currentPaymentData.hasError) {
            return this.getErrorHTML();
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

                    <!-- 고객 유형 선택 -->
                    <div class="customer-type-selection">
                        <h3>고객 유형 선택</h3>
                        <div class="type-buttons">
                            <button class="customer-type-btn ${this.selectedCustomerType === 'guest' ? 'active' : ''}" data-type="guest">
                                <div class="type-icon">👤</div>
                                <span>비회원</span>
                            </button>
                            <button class="customer-type-btn ${this.selectedCustomerType === 'member' ? 'active' : ''}" data-type="member">
                                <div class="type-icon">🎫</div>
                                <span>회원</span>
                            </button>
                        </div>
                    </div>

                    <!-- 비회원 전화번호 입력 (비회원 선택 시만 표시) -->
                    <div class="guest-info-section" id="guestInfoSection" style="${this.selectedCustomerType === 'guest' ? 'display: block;' : 'display: none;'}">
                        <h3>비회원 정보 (선택사항)</h3>
                        <div class="phone-input-group">
                            <label>전화번호</label>
                            <input type="tel" id="guestPhoneInput" placeholder="010-1234-5678 (선택사항)" 
                                   value="${this.guestPhoneNumber}" maxlength="13">
                            <div class="phone-help-text">
                                전화번호를 입력하시면 포인트 적립 및 주문 이력 관리가 가능합니다.
                            </div>
                        </div>
                    </div>

                    <!-- 회원 정보 입력 (회원 선택 시만 표시) -->
                    <div class="member-info-section" id="memberInfoSection" style="${this.selectedCustomerType === 'member' ? 'display: block;' : 'display: none;'}">
                        <h3>회원 정보</h3>
                        <div class="member-input-group">
                            <label>전화번호</label>
                            <input type="tel" id="memberPhoneInput" placeholder="010-1234-5678" maxlength="13">
                            <button class="member-search-btn" id="memberSearchBtn">회원 조회</button>
                        </div>
                        <div class="member-info-display" id="memberInfoDisplay" style="display: none;">
                            <div class="member-details">
                                <span class="member-name" id="memberName"></span>
                                <span class="member-points" id="memberPoints"></span>
                            </div>
                        </div>
                    </div>

                    <!-- 결제 수단 선택 -->
                    <div class="payment-methods">
                        <h3>결제 수단 선택</h3>
                        <div class="method-buttons">
                            <button class="payment-method-btn ${this.currentPaymentData.paymentMethod === 'CARD' ? 'active' : ''}" data-method="CARD">
                                <div class="method-icon">💳</div>
                                <span>카드결제</span>
                            </button>
                            <button class="payment-method-btn ${this.currentPaymentData.paymentMethod === 'CASH' ? 'active' : ''}" data-method="CASH">
                                <div class="method-icon">💵</div>
                                <span>현금결제</span>
                            </button>
                        </div>
                    </div>

                    <!-- 현금 결제 시 거스름돈 계산 -->
                    <div class="cash-section" id="cashSection" style="${this.currentPaymentData.paymentMethod === 'CASH' ? 'display: block;' : 'display: none;'}">
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
                        <span id="paymentBtnText">${this.currentPaymentData.paymentMethod === 'CARD' ? '카드결제 진행' : '현금결제 진행'}</span>
                        <span class="amount">${totalAmount.toLocaleString()}원</span>
                    </button>
                </div>
            </div>

            ${this.getModalStyles()}
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

        // 고객 유형 선택
        const customerTypeBtns = document.querySelectorAll('.customer-type-btn');
        customerTypeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 모든 버튼 비활성화
                customerTypeBtns.forEach(b => {
                    b.classList.remove('active');
                });

                // 선택된 버튼 활성화
                btn.classList.add('active');

                const type = btn.dataset.type;
                if (type) {
                    this.handleCustomerTypeChange(type);
                }
            });
        });

        // 결제 수단 선택
        const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
        paymentMethodBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 모든 버튼 비활성화
                paymentMethodBtns.forEach(b => {
                    b.classList.remove('active');
                });

                // 선택된 버튼 활성화
                btn.classList.add('active');

                const method = btn.dataset.method;
                if (method) {
                    this.handlePaymentMethodChange(method);
                }
            });
        });

        // 비회원 전화번호 입력
        const guestPhoneInput = document.getElementById('guestPhoneInput');
        if (guestPhoneInput) {
            guestPhoneInput.addEventListener('input', (e) => {
                this.guestPhoneNumber = this.formatPhoneNumber(e.target.value);
                e.target.value = this.guestPhoneNumber;
            });
        }

        // 회원 전화번호 입력
        const memberPhoneInput = document.getElementById('memberPhoneInput');
        if (memberPhoneInput) {
            memberPhoneInput.addEventListener('input', (e) => {
                e.target.value = this.formatPhoneNumber(e.target.value);
            });
        }

        // 회원 조회
        const memberSearchBtn = document.getElementById('memberSearchBtn');
        if (memberSearchBtn) {
            memberSearchBtn.addEventListener('click', () => {
                this.searchMember();
            });
        }

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

        // 재시도 버튼 (에러 상태일 때)
        const retryBtn = document.getElementById('retryLoadPayment');
        if (retryBtn) {
            retryBtn.addEventListener('click', async () => {
                console.log('🔄 결제 정보 재시도');

                // 로딩 상태로 변경
                this.currentPaymentData.isLoading = true;
                this.currentPaymentData.hasError = false;
                this.render();
                this.setupEventListeners();

                // API 재호출
                try {
                    const actualPaymentInfo = await this.loadActualPaymentInfo(
                        this.currentPaymentData.storeId, 
                        this.currentPaymentData.tableNumber
                    );

                    if (actualPaymentInfo) {
                        this.currentPaymentData = {
                            ...actualPaymentInfo,
                            paymentMethod: this.currentPaymentData.paymentMethod || 'CARD',
                            isLoading: false
                        };
                    } else {
                        this.currentPaymentData.isLoading = false;
                    }

                    this.render();
                    this.setupEventListeners();

                } catch (error) {
                    console.error('❌ 재시도 실패:', error);
                    this.currentPaymentData = {
                        ...this.currentPaymentData,
                        isLoading: false,
                        hasError: true,
                        errorMessage: error.message
                    };
                    this.render();
                    this.setupEventListeners();
                }
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
     * 고객 유형 변경 처리
     */
    handleCustomerTypeChange(type) {
        this.selectedCustomerType = type;

        const guestSection = document.getElementById('guestInfoSection');
        const memberSection = document.getElementById('memberInfoSection');

        if (type === 'guest') {
            guestSection.style.display = 'block';
            memberSection.style.display = 'none';
        } else {
            guestSection.style.display = 'none';
            memberSection.style.display = 'block';
        }
    },

    /**
     * 결제 수단 변경 처리
     */
    handlePaymentMethodChange(method) {
        const cashSection = document.getElementById('cashSection');
        const paymentBtnText = document.getElementById('paymentBtnText');

        if (cashSection) {
            if (method === 'CASH') {
                cashSection.style.display = 'block';
            } else {
                cashSection.style.display = 'none';
            }
        }

        if (paymentBtnText) {
            if (method === 'CASH') {
                paymentBtnText.textContent = '현금결제 진행';
            } else {
                paymentBtnText.textContent = '카드결제 진행';
            }
        }

        // currentPaymentData 업데이트
        if (this.currentPaymentData) {
            this.currentPaymentData.paymentMethod = method;
        }
    },

    /**
     * 전화번호 포맷팅
     */
    formatPhoneNumber(value) {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    },

    /**
     * 회원 조회
     */
    async searchMember() {
        const memberPhoneInput = document.getElementById('memberPhoneInput');
        const memberInfoDisplay = document.getElementById('memberInfoDisplay');
        const memberName = document.getElementById('memberName');
        const memberPoints = document.getElementById('memberPoints');

        const phoneNumber = memberPhoneInput.value.trim();
        if (!phoneNumber) {
            alert('전화번호를 입력해주세요.');
            return;
        }

        try {
            console.log('🔍 회원 조회 요청:', phoneNumber);

            // 회원 조회 API 호출 (실제 구현 필요)
            const response = await fetch(`/api/users/search-by-phone?phone=${encodeURIComponent(phoneNumber)}`);
            const data = await response.json();

            if (data.success && data.user) {
                memberName.textContent = data.user.name || '회원';
                memberPoints.textContent = `${(data.user.point || 0).toLocaleString()}P`;
                memberInfoDisplay.style.display = 'block';
                console.log('✅ 회원 조회 성공:', data.user);
            } else {
                memberInfoDisplay.style.display = 'none';
                alert('해당 전화번호로 등록된 회원을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('❌ 회원 조회 실패:', error);
            alert('회원 조회 중 오류가 발생했습니다.');
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
        const total = this.currentPaymentData.totalAmount || 0;
        const change = Math.max(0, received - total);

        changeElement.textContent = change.toLocaleString() + '원';
        if (changeElement.style) {
            changeElement.style.color = change >= 0 ? '#059669' : '#dc2626';
        }
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

            // 비회원 전화번호 검증 (선택사항이므로 빈 값도 허용)
            let guestPhone = null;
            if (this.selectedCustomerType === 'guest') {
                const phoneInput = document.getElementById('guestPhoneInput');
                if (phoneInput && phoneInput.value.trim()) {
                    guestPhone = phoneInput.value.trim();
                    // 전화번호 형식 검증
                    if (!/^010-\d{4}-\d{4}$/.test(guestPhone)) {
                        alert('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
                        return;
                    }
                }
            }

            // 회원 결제시 회원 정보 검증
            let memberPhone = null;
            if (this.selectedCustomerType === 'member') {
                const memberPhoneInput = document.getElementById('memberPhoneInput');
                const memberInfoDisplay = document.getElementById('memberInfoDisplay');

                if (!memberPhoneInput.value.trim()) {
                    alert('회원 전화번호를 입력해주세요.');
                    return;
                }

                if (memberInfoDisplay.style.display === 'none') {
                    alert('먼저 회원 조회를 진행해주세요.');
                    return;
                }

                memberPhone = memberPhoneInput.value.trim();
            }

            // 결제 확인
            const customerType = this.selectedCustomerType === 'member' ? '회원' : '비회원';
            const methodName = selectedMethod === 'CARD' ? '카드' : '현금';
            const phoneInfo = this.selectedCustomerType === 'member' ? 
                `회원 번호: ${memberPhone}` : 
                (guestPhone ? `전화번호: ${guestPhone}` : '전화번호 없음');

            if (!confirm(`${customerType} ${methodName} 결제를 진행하시겠습니까?\n` +
                        `결제 금액: ${totalAmount.toLocaleString()}원\n` +
                        `${phoneInfo}`)) {
                return;
            }

            // 로딩 상태로 변경
            const confirmBtn = document.getElementById('confirmPayment');
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<span>처리중...</span>';
            confirmBtn.disabled = true;

            // 결제 처리 API 호출
            const paymentResult = await this.processPaymentAPI(selectedMethod, guestPhone, memberPhone);

            if (paymentResult.success) {
                console.log('✅ 결제 완료:', paymentResult);

                const successMessage = `${customerType} ${methodName} 결제가 완료되었습니다!\n` +
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
     * 결제 처리 API 호출
     */
    async processPaymentAPI(paymentMethod, guestPhone, memberPhone) {
        const { orderId, totalAmount, storeId, tableNumber } = this.currentPaymentData;

        console.log(`💳 결제 처리 API 호출:`, {
            orderId,
            paymentMethod,
            amount: totalAmount,
            customerType: this.selectedCustomerType,
            guestPhone,
            memberPhone
        });

        const response = await fetch('/api/pos-payment/process-with-customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: orderId,
                paymentMethod: paymentMethod.toUpperCase(),
                amount: totalAmount,
                storeId: storeId,
                tableNumber: tableNumber,
                customerType: this.selectedCustomerType,
                guestPhone: guestPhone,
                memberPhone: memberPhone
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
    },

    /**
     * 로딩 상태 HTML 생성
     */
    getLoadingHTML() {
        return `
            <div class="pos-payment-modal">
                <div class="modal-header">
                    <h2>💳 결제 확인</h2>
                    <button class="close-btn" id="closePaymentModal">×</button>
                </div>

                <div class="modal-body">
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <h3>결제 정보를 불러오는 중입니다</h3>
                        <p>잠시만 기다려 주세요...</p>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="cancel-btn" id="cancelPayment">취소</button>
                </div>
            </div>

            ${this.getModalStyles()}
        `;
    },

    /**
     * 에러 상태 HTML 생성
     */
    getErrorHTML() {
        return `
            <div class="pos-payment-modal">
                <div class="modal-header">
                    <h2>💳 결제 확인</h2>
                    <button class="close-btn" id="closePaymentModal">×</button>
                </div>

                <div class="modal-body">
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3 class="error-title">결제 정보 로드 실패</h3>
                        <p class="error-message">
                            ${this.currentPaymentData.errorMessage || '결제 정보를 불러올 수 없습니다.'}
                        </p>
                        <button class="retry-btn" id="retryLoadPayment">다시 시도</button>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="cancel-btn" id="cancelPayment">취소</button>
                </div>
            </div>

            ${this.getModalStyles()}
        `;
    },

    /**
     * 모달 스타일 분리
     */
    getModalStyles() {
        return `
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
                    backdrop-filter: blur(4px);
                }

                .pos-payment-modal-overlay.show {
                    opacity: 1;
                }

                .pos-payment-modal {
                    background: white;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 520px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 20px 20px 0 0;
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
                    transform: scale(1.1);
                }

                .modal-body {
                    padding: 24px;
                    max-height: calc(90vh - 200px);
                    overflow-y: auto;
                }

                .modal-footer {
                    padding: 16px 24px 24px;
                    display: flex;
                    gap: 12px;
                    background: #f8fafc;
                    border-radius: 0 0 20px 20px;
                }

                /* 결제 요약 섹션 */
                .payment-summary {
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
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
                    color: #1e293b;
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

                /* 섹션 제목 */
                .customer-type-selection h3,
                .guest-info-section h3,
                .member-info-section h3,
                .payment-methods h3,
                .cash-section h3 {
                    margin: 0 0 16px 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: #374151;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e5e7eb;
                }

                /* 고객 유형 선택 */
                .customer-type-selection {
                    margin-bottom: 24px;
                }

                .type-buttons {
                    display: flex;
                    gap: 12px;
                }

                .customer-type-btn {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 20px 16px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 600;
                    color: #6b7280;
                }

                .customer-type-btn:hover {
                    border-color: #3b82f6;
                    background: #f0f9ff;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.15);
                }

                .customer-type-btn.active {
                    border-color: #3b82f6;
                    background: #dbeafe;
                    color: #1d4ed8;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                }

                .type-icon {
                    font-size: 32px;
                    margin-bottom: 4px;
                }

                /* 비회원/회원 정보 섹션 */
                .guest-info-section,
                .member-info-section {
                    margin-bottom: 24px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }

                .phone-input-group,
                .member-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .phone-input-group label,
                .member-input-group label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #374151;
                }

                .phone-input-group input,
                .member-input-group input {
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.2s;
                    background: white;
                }

                .phone-input-group input:focus,
                .member-input-group input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .phone-help-text {
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 4px;
                    line-height: 1.4;
                }

                .member-search-btn {
                    margin-top: 8px;
                    padding: 10px 16px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                }

                .member-search-btn:hover {
                    background: #2563eb;
                }

                .member-info-display {
                    margin-top: 12px;
                    padding: 12px;
                    background: #ecfdf5;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                }

                .member-details {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .member-name {
                    font-weight: 600;
                    color: #065f46;
                }

                .member-points {
                    font-size: 14px;
                    color: #059669;
                    font-weight: 600;
                }

                /* 결제 수단 선택 */
                .payment-methods {
                    margin-bottom: 24px;
                }

                .method-buttons {
                    display: flex;
                    gap: 12px;
                }

                .payment-method-btn {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 20px 16px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 600;
                    color: #6b7280;
                }

                .payment-method-btn:hover {
                    border-color: #059669;
                    background: #f0fdf4;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(5, 150, 105, 0.15);
                }

                .payment-method-btn.active {
                    border-color: #059669;
                    background: #dcfce7;
                    color: #065f46;
                    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
                }

                .method-icon {
                    font-size: 32px;
                    margin-bottom: 4px;
                }

                /* 현금 결제 섹션 */
                .cash-section {
                    margin-bottom: 24px;
                    padding: 20px;
                    background: #fefce8;
                    border: 1px solid #fde047;
                    border-radius: 12px;
                }

                .cash-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .cash-input-group label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #374151;
                }

                .cash-input-group input {
                    padding: 12px 16px;
                    border: 2px solid #fbbf24;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.2s;
                    background: white;
                }

                .cash-input-group input:focus {
                    outline: none;
                    border-color: #f59e0b;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
                }

                .quick-amount-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .quick-btn {
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #fbbf24;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    color: #92400e;
                    transition: all 0.2s;
                }

                .quick-btn:hover {
                    background: #fef3c7;
                    border-color: #f59e0b;
                }

                .change-display {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 16px;
                    padding: 12px;
                    background: white;
                    border: 1px solid #fbbf24;
                    border-radius: 8px;
                }

                .change-display .label {
                    font-weight: 600;
                    color: #92400e;
                }

                .change-display .value {
                    font-weight: 700;
                    font-size: 16px;
                    color: #059669;
                }

                /* 버튼 스타일 */
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
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .confirm-btn:hover {
                    background: linear-gradient(135deg, #047857 0%, #065f46 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(5, 150, 105, 0.35);
                }

                .confirm-btn:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .confirm-btn .amount {
                    font-size: 14px;
                    opacity: 0.9;
                }

                /* 로딩 상태 */
                .loading-state {
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

                .loading-state h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #374151;
                }

                .loading-state p {
                    margin: 0;
                    color: #6b7280;
                }

                /* 에러 상태 */
                .error-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 40px;
                    text-align: center;
                }

                .error-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .error-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #dc2626;
                    margin: 0 0 8px 0;
                }

                .error-message {
                    color: #6b7280;
                    margin: 0 0 20px 0;
                    line-height: 1.5;
                }

                .retry-btn {
                    padding: 12px 24px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                }

                .retry-btn:hover {
                    background: #2563eb;
                }

                /* 애니메이션 */
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* 스크롤바 스타일 */
                .pos-payment-modal::-webkit-scrollbar {
                    width: 6px;
                }

                .pos-payment-modal::-webkit-scrollbar-track {
                    background: #f1f5f9;
                }

                .pos-payment-modal::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }

                .pos-payment-modal::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                /* 반응형 디자인 */
                @media (max-width: 640px) {
                    .pos-payment-modal {
                        width: 95%;
                        margin: 10px;
                    }

                    .type-buttons,
                    .method-buttons {
                        flex-direction: column;
                    }

                    .customer-type-btn,
                    .payment-method-btn {
                        flex-direction: row;
                        justify-content: flex-start;
                        gap: 12px;
                        padding: 16px;
                    }

                    .type-icon,
                    .method-icon {
                        font-size: 24px;
                        margin-bottom: 0;
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
    }
};

// 전역으로 등록
window.POSPaymentModal = POSPaymentModal;

// 등록 확인 로그
console.log('✅ POSPaymentModal 전역 등록 완료:', {
    type: typeof POSPaymentModal,
    hasShow: typeof POSPaymentModal.show === 'function',
    timestamp: new Date().toISOString()
});