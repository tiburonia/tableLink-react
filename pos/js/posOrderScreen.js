/**
 * POS 주문 화면 (OK POS 스타일 - 2분할 구조)
 * 모듈 분리 후 메인 화면 관리자
 */

// 모듈 의존성 체크
if (typeof OrderDataManager === 'undefined') {
    console.error('❌ OrderDataManager 모듈이 로드되지 않았습니다');
}
if (typeof OrderUIRenderer === 'undefined') {
    console.error('❌ OrderUIRenderer 모듈이 로드되지 않았습니다');
}
if (typeof OrderModificationManager === 'undefined') {
    console.error('❌ OrderModificationManager 모듈이 로드되지 않았습니다');
}

// 전역 스코프에서 POSOrderScreen 객체 정의
const POSOrderScreen = {
    currentTable: null,
    currentOrders: [],
    menuData: [],
    cart: [], // 프론트엔드 카트 시스템
    selectedPaymentMethod: "card",
    currentSession: null, // 현재 활성 세션 정보
    sessionItems: [], // 현재 세션의 주문 아이템
    selectedOrder: null, // 선택된 주문 (수정용)

    /**
     * 주문 화면 렌더링
     */
    async render(storeId, storeInfo, tableNumber) {
        try {
            console.log(`🛒 주문 화면 렌더링 - 테이블 ${tableNumber}`);

            // Store ID와 Table Number를 여러 방식으로 저장 (호환성 보장)
            this.currentStoreId = parseInt(storeId);
            this.currentTableNumber = parseInt(tableNumber);
            this.currentTable = parseInt(tableNumber);

            // POSCore에도 저장
            if (typeof POSCore !== "undefined") {
                POSCore.storeId = parseInt(storeId);
                POSCore.tableNumber = parseInt(tableNumber);
            }

            console.log("📋 POS 주문 화면 초기화:", {
                storeId: this.currentStoreId,
                tableNumber: this.currentTableNumber,
                currentTable: this.currentTable,
            });

            // 기존 주문 로드 (통합 처리 완료까지 대기)
            await this.loadCurrentOrders(storeId, tableNumber);

            // 메뉴 데이터 로드
            await this.loadMenuData(storeId);

            // 세션 정보 로드 (기존 주문이 있으면 세션 정보도 함께)
            await this.loadSessionData();

            console.log("✅ 모든 데이터 로드 완료 - 렌더링 직전 상태:", {
                통합된주문수: this.currentOrders.length,
                카트아이템수: this.cart.length,
                현재주문상세: this.currentOrders
                    .map((order) => `${order.menuName} x${order.quantity}`)
                    .join(", "),
            });

            // 모든 데이터 로드 완료 후 화면 렌더링
            const main = document.getElementById("posMain");
            main.innerHTML = `
                ${this.renderHeader(storeInfo, tableNumber)}
                ${this.renderMainLayout()}
            `;

            console.log(
                "🎨 최초 렌더링 완료 - 통합된 주문 데이터로 화면 표시:",
                {
                    통합된주문수: this.currentOrders.length,
                    카트아이템수: this.cart.length,
                    실제렌더링된HTML포함여부:
                        document.querySelector(".pos-order-table") !== null,
                },
            );

            // 이벤트 리스너 설정
            this.setupEventListeners();
        } catch (error) {
            console.error("❌ 주문 화면 렌더링 실패:", error);
            POSCore.showError("주문 화면을 불러올 수 없습니다.");
        }
    },

    /**
     * 헤더 렌더링 - UI 렌더러로 위임
     */
    renderHeader(storeInfo, tableNumber) {
        return OrderUIRenderer.renderHeader(storeInfo, tableNumber);
    },

    /**
     * 메인 레이아웃 - UI 렌더러로 위임
     */
    renderMainLayout() {
        return OrderUIRenderer.renderMainLayout();
    },

    /**
     * 주문 내역 섹션 - UI 렌더러로 위임
     */
    renderOrderSection() {
        return OrderUIRenderer.renderOrderSection();
    },

    /**
     * POS 주문 아이템 렌더링 - UI 렌더러로 위임
     */
    renderPOSOrderItemsModern() {
        return OrderUIRenderer.renderPOSOrderItemsModern();
    },

    /**
     * POS 주문 아이템 렌더링 (기존 호환성용) - UI 렌더러로 위임
     */
    renderPOSOrderItems() {
        return OrderUIRenderer.renderPOSOrderItems();
    },

    /**
     * TLL 주문 아이템 렌더링 - UI 렌더러로 위임
     */
    renderTLLOrderItemsModern() {
        return OrderUIRenderer.renderTLLOrderItemsModern();
    },

    /**
     * TLL 주문 아이템 렌더링 (기존 호환성용) - UI 렌더러로 위임
     */
    renderTLLOrderItems() {
        return OrderUIRenderer.renderTLLOrderItems();
    },

    /**
     * 결제/계산 섹션 - UI 렌더러로 위임
     */
    renderPaymentSection() {
        return OrderUIRenderer.renderPaymentSection();
    },

    /**
     * 메뉴 선택 섹션 - UI 렌더러로 위임
     */
    renderMenuSection() {
        return OrderUIRenderer.renderMenuSection();
    },

    /**
     * 메뉴 카테고리 렌더링 - UI 렌더러로 위임
     */
    renderMenuCategories() {
        return OrderUIRenderer.renderMenuCategories();
    },

    /**
     * 메뉴 그리드 렌더링 - UI 렌더러로 위임
     */
    renderMenuGrid(selectedCategory = null) {
        return OrderUIRenderer.renderMenuGrid(selectedCategory);
    },

    /**
     * 결제 수단 섹션 - UI 렌더러로 위임
     */
    renderPaymentMethodSection() {
        return OrderUIRenderer.renderPaymentMethodSection();
    },

    /**
     * TLL 사용자 정보 렌더링 - UI 렌더러로 위임
     */
    renderTLLUserInfo() {
        return OrderUIRenderer.renderTLLUserInfo();
    },

    /**
     * TLL 연동 버튼 렌더링 - UI 렌더러로 위임
     */
    renderTLLConnectionButton() {
        return OrderUIRenderer.renderTLLConnectionButton();
    },

    /**
     * TLL 주문의 is_mixed 상태 확인 (첫 번째 주문 기준)
     */
    checkTLLOrderMixedStatus() {
        if (!this.tllOrders || this.tllOrders.length === 0) {
            console.log('🔍 TLL 주문 없음, is_mixed: false');
            return false;
        }

        // TLL 주문에서 is_mixed 상태 확인 (첫 번째 주문의 상태 사용)
        const firstTLLOrder = this.tllOrders[0];
        const isMixed = Boolean(firstTLLOrder.is_mixed);

        console.log(`🔍 TLL 주문 is_mixed 상태 확인:`, {
            orderId: firstTLLOrder.order_id,
            is_mixed_raw: firstTLLOrder.is_mixed,
            is_mixed_boolean: isMixed,
            total_orders: this.tllOrders.length
        });

        return isMixed;
    },

    /**
     * TLL 주문의 is_mixed 상태를 실제 API에서 다시 조회하여 is_mixed 상태 업데이트
     */
    async refreshTLLOrderMixedStatus() {
        // 이미 새로고침 중이면 대기
        if (this._refreshingTLLStatus) {
            console.log('🔄 TLL 상태 새로고침이 이미 진행 중, 대기...');
            return this.checkTLLOrderMixedStatus();
        }

        try {
            this._refreshingTLLStatus = true;

            if (!this.tllOrders || this.tllOrders.length === 0) {
                return false;
            }

            const orderId = this.tllOrders[0].order_id;

            console.log(`🔍 TLL 주문 ${orderId}의 is_mixed 상태 새로고침`);

            const response = await fetch(`/api/pos/orders/${orderId}/mixed-status`);

            if (!response.ok) {
                console.warn(`⚠️ TLL 주문 상태 조회 실패 (${response.status})`);
                return this.checkTLLOrderMixedStatus(); // 기존 값 사용
            }

            const data = await response.json();

            if (data.success) {
                // TLL 주문 데이터의 is_mixed 상태 업데이트
                if (this.tllOrders && this.tllOrders.length > 0) {
                    this.tllOrders.forEach(order => {
                        if (order.order_id === orderId) {
                            order.is_mixed = data.is_mixed;
                        }
                    });
                }

                console.log(`✅ TLL 주문 ${orderId} is_mixed 상태 업데이트: ${data.is_mixed}`);

                // UI 업데이트는 새로고침 완료 후에만 실행
                setTimeout(() => {
                    this.updateTLLConnectionButton(data.is_mixed);
                }, 100);

                return data.is_mixed;
            } else {
                console.warn(`⚠️ TLL 주문 상태 응답 실패: ${data.error}`);
                return this.checkTLLOrderMixedStatus(); // 기존 값 사용
            }

        } catch (error) {
            console.error('❌ TLL 주문 상태 새로고침 실패:', error);
            return this.checkTLLOrderMixedStatus(); // 기존 값 사용
        } finally {
            this._refreshingTLLStatus = false;
        }
    },

    /**
     * TLL 연동 버튼 UI 업데이트 (중복 업데이트 방지)
     */
    updateTLLConnectionButton(isMixed) {
        const tllConnectBtn = document.querySelector('.tll-action-btn.tll-connect');

        if (!tllConnectBtn) {
            console.log('⚠️ TLL 연동 버튼을 찾을 수 없음');
            return;
        }

        // 현재 버튼 상태와 새 상태가 같으면 업데이트 하지 않음
        const currentMixed = tllConnectBtn.getAttribute('data-mixed') === 'true';
        if (currentMixed === isMixed) {
            console.log(`ℹ️ TLL 버튼 상태 동일함 (is_mixed: ${isMixed}), 업데이트 건너뜀`);
            return;
        }

        // 업데이트 진행 중 플래그 설정
        if (tllConnectBtn.dataset.updating === 'true') {
            console.log('🔄 TLL 버튼 업데이트가 이미 진행 중, 건너뜀');
            return;
        }

        tllConnectBtn.dataset.updating = 'true';

        if (isMixed) {
            tllConnectBtn.classList.add('disabled');
            tllConnectBtn.disabled = true;
            tllConnectBtn.setAttribute('data-mixed', 'true');
            tllConnectBtn.innerHTML = `
                <span class="btn-icon">✅</span>
                <span class="btn-text">TLL 연동 완료</span>
            `;
            // 비활성화된 버튼에서 onclick 이벤트 제거
            tllConnectBtn.removeAttribute('onclick');
            tllConnectBtn.onclick = null;
            console.log('✅ TLL 연동 버튼 비활성화 (is_mixed: true)');
        } else {
            tllConnectBtn.classList.remove('disabled');
            tllConnectBtn.disabled = false;
            tllConnectBtn.setAttribute('data-mixed', 'false');
            tllConnectBtn.innerHTML = `
                <span class="btn-icon">🔗</span>
                <span class="btn-text">TLL 연동</span>
            `;
            // 활성화된 버튼에 onclick 이벤트 재설정
            tllConnectBtn.setAttribute('onclick', 'POSOrderScreen.enableTLLConnection()');
            tllConnectBtn.onclick = () => POSOrderScreen.enableTLLConnection();
            console.log('🔗 TLL 연동 버튼 활성화 (is_mixed: false)');
        }

        // 업데이트 완료 후 플래그 해제
        setTimeout(() => {
            tllConnectBtn.dataset.updating = 'false';
        }, 100);
    },

    /**
     * 기존 주문 로드 - OrderDataManager로 위임
     */
    async loadCurrentOrders(storeId, tableNumber) {
        try {
            console.log(`🔍 POS 주문 로드 시작: 매장 ${storeId}, 테이블 ${tableNumber}`);

            // 기존 데이터 완전 초기화 (중복 방지)
            this.currentOrders = [];

            // OrderDataManager를 통해 데이터 로드
            this.currentOrders = await OrderDataManager.loadCurrentOrders(storeId, tableNumber);

            // TLL 주문 로드
            await this.loadTLLOrders(storeId, tableNumber);
        } catch (error) {
            console.error("❌ 기존 주문 로드 실패:", error);
            this.currentOrders = [];
        }
    },

    /**
     * 주문 아이템 통합 처리 - OrderDataManager로 위임
     */
    consolidateOrderItems(unpaidItems) {
        return OrderDataManager.consolidateOrderItems(unpaidItems);
    },

    /**
     * TLL 주문 로드 - OrderDataManager로 위임
     */
    async loadTLLOrders(storeId, tableNumber) {
        try {
            console.log(`🔍 TLL 주문 로드 시작: 매장 ${storeId}, 테이블 ${tableNumber}`);

            const { tllOrders, tllUserInfo } = await OrderDataManager.loadTLLOrders(storeId, tableNumber);

            this.tllOrders = tllOrders;
            this.tllUserInfo = tllUserInfo;

            // TLL 주문이 로드되면 is_mixed 상태를 확인 (UI 업데이트는 렌더링 후에만)
            if (this.tllOrders && this.tllOrders.length > 0) {
                const isMixed = this.checkTLLOrderMixedStatus();
                console.log(`🔍 TLL 주문 로드 후 is_mixed 상태: ${isMixed}`);

                // 캐시된 상태만 업데이트, UI 업데이트는 별도로 처리
                this._cachedTLLMixedStatus = isMixed;
            } else {
                // TLL 주문이 없으면 캐시 초기화
                this._cachedTLLMixedStatus = false;
                this.updateTLLConnectionButton(false); // 주문 없을 시 버튼 초기화
            }

            console.log(`✅ TLL 주문 ${this.tllOrders.length}개 로드 완료`);
            console.log(`👤 TLL 사용자 정보:`, this.tllUserInfo?.name || "없음");

        } catch (error) {
            console.error("❌ TLL 주문 로드 실패:", error);
            this.tllOrders = [];
            this.tllUserInfo = null;
            this.updateTLLConnectionButton(false); // 에러 발생 시 버튼 초기화
        }
    },

    /**
     * 메뉴 데이터 로드 - OrderDataManager로 위임
     */
    async loadMenuData(storeId) {
        try {
            this.menuData = await OrderDataManager.loadMenuData(storeId);
            console.log(`✅ 메뉴 ${this.menuData.length}개 로드`);
        } catch (error) {
            console.error("❌ 메뉴 데이터 로드 실패:", error);
            this.menuData = this.getDefaultMenu();
        }
    },

    /**
     * 카테고리 선택
     */
    selectCategory(category) {
        document.querySelectorAll(".category-tab").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.category === category);
        });

        document.getElementById("menuGrid").innerHTML =
            this.renderMenuGrid(category);
    },

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

        // 1. 먼저 TLL 연동 주문 여부를 즉시 확인
        const isTLLIntegration = await this.checkTLLIntegrationImmediate();

        if (isTLLIntegration) {
            console.log('🔗 TLL 연동 주문 감지됨 - POSTLLPaymentModal 직접 호출');

            // TLL 연동이면 바로 POSTLLPaymentModal 호출
            if (typeof POSTLLPaymentModal !== 'undefined') {
                await POSTLLPaymentModal.show();
                return; // 일반 결제 모달로 진행하지 않음
            } else {
                console.error('❌ POSTLLPaymentModal을 찾을 수 없습니다');
                alert('TLL 연동 결제 모달을 불러올 수 없습니다.');
                return;
            }
        }

        console.log('ℹ️ 일반 POS 주문 - 기본 결제 모달 호출');

        // 2. 일반 주문인 경우 기존 통합 모달 호출
        await this.showUnifiedPaymentModal(method);
    },

    /**
     * 통합 결제 모달 표시 (TLL 연동 감지 포함)
     */
    async showUnifiedPaymentModal(method = null) {
        try {
            console.log(`🔍 통합 결제 모달 표시 시작 (method: ${method})`);

            // POSPaymentModal 존재 확인
            if (typeof POSPaymentModal === 'undefined') {
                console.error('❌ POSPaymentModal을 찾을 수 없습니다');
                alert('결제 모달을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
                return;
            }

            // 결제 모달 표시 (내부에서 TLL 연동 감지 수행)
            await POSPaymentModal.show(method);

        } catch (error) {
            console.error('❌ 결제 모달 표시 실패:', error);

            // 폴백: 기존 직접 결제 방식 사용
            console.log('🔄 폴백: 기존 결제 방식 사용');
            if (method) {
                await this.processPaymentFallback(method);
            } else {
                alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
            }
        }
    },

    /**
     * 폴백용 직접 결제 처리 (TLL 연동 감지 포함)
     */
    async processPaymentFallback(method) {
        try {
            console.log(`💳 폴백 ${method} 결제 처리 시작`);

            if (!this.currentStoreId || !this.currentTableNumber) {
                alert("매장 또는 테이블 정보가 없습니다.");
                return;
            }

            // 1. 활성 주문 조회
            const activeOrderResponse = await fetch(
                `/api/pos/stores/${this.currentStoreId}/table/${this.currentTableNumber}/active-order`,
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

            // 2. TLL 연동 여부 확인
            const isTLLIntegration = await this.checkTLLIntegrationFallback(orderId);

            if (isTLLIntegration) {
                console.log('🔗 TLL 연동 주문 감지 - TLL 전용 모달로 전환');

                if (typeof POSTLLPaymentModal !== 'undefined') {
                    await POSTLLPaymentModal.show();
                    return;
                } else {
                    console.error('❌ POSTLLPaymentModal을 찾을 수 없습니다');
                    alert('TLL 연동 결제 모달을 불러올 수 없습니다.');
                    return;
                }
            }

            // 3. 일반 POS 결제 진행
            const unpaidResponse = await fetch(
                `/api/pos-payment/unpaid-tickets/${orderId}`,
            );
            const unpaidData = await unpaidResponse.json();

            if (!unpaidData.success || unpaidData.totalTickets === 0) {
                alert("결제할 미지불 티켓이 없습니다.");
                return;
            }

            // 간단한 결제 확인
            if (!confirm(
                `${method.toUpperCase()} 결제를 진행하시겠습니까?\n` +
                `결제 금액: ${unpaidData.totalAmount.toLocaleString()}원\n` +
                `처리할 티켓: ${unpaidData.totalTickets}개`
            )) {
                return;
            }

            // 4. 결제 처리 (비회원 기본)
            const paymentResponse = await fetch("/api/pos-payment/process-with-customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderId,
                    paymentMethod: method.toUpperCase(),
                    amount: unpaidData.totalAmount,
                    storeId: this.currentStoreId,
                    tableNumber: this.currentTableNumber,
                    customerType: 'guest' // 폴백에서는 기본적으로 비회원 처리
                }),
            });

            const paymentResult = await paymentResponse.json();

            if (paymentResult.success) {
                alert(`${method.toUpperCase()} 결제가 완료되었습니다!\n금액: ${paymentResult.amount.toLocaleString()}원`);

                // 화면 새로고침 및 테이블맵 이동
                await this.refreshOrders();
                setTimeout(() => {
                    POSCore.showTableMap();
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
     * TLL 연동을 즉시 감지하는 메서드 (selectPaymentMethod 전용)
     */
    async checkTLLIntegrationImmediate() {
        try {
            const storeId = this.currentStoreId;
            const tableNumber = this.currentTableNumber;

            if (!storeId || !tableNumber) {
                console.warn('⚠️ 매장 ID 또는 테이블 번호가 없음');
                return false;
            }

            console.log(`🔍 TLL 연동 즉시 감지 시작: 매장=${storeId}, 테이블=${tableNumber}`);

            // 1. 활성 주문 조회
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

            // 2. 테이블 상태 확인 (POI=SPOI 여부)
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

            const { processing_order_id, spare_processing_order_id, isTLLMixedOrder } = tableStatusData.table;

            // POI = SPOI = 현재 주문 ID 확인
            const isSharedOrder = (
                processing_order_id !== null &&
                spare_processing_order_id !== null &&
                parseInt(processing_order_id) === parseInt(spare_processing_order_id) &&
                parseInt(processing_order_id) === parseInt(orderId)
            );

            console.log(`📊 테이블 상태 즉시 확인:`, {
                processing_order_id,
                spare_processing_order_id,
                current_order_id: orderId,
                isSharedOrder,
                isTLLMixedOrder
            });

            if (!isSharedOrder) {
                console.log('ℹ️ TLL 연동 주문이 아님 (POI≠SPOI 또는 주문 ID 불일치)');
                return false;
            }

            // 3. TLL 연동 결제 유효성 확인
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

            console.log(`🔍 TLL 연동 유효성 즉시 확인:`, {
                isTLLIntegration: validationData.isTLLIntegration,
                canProcessPOSPayment: validationData.canProcessPOSPayment,
                hasPOSUnpaidTickets: validationData.hasPOSUnpaidTickets,
                hasTLLPaidTickets: validationData.hasTLLPaidTickets,
                canProcessTLLPayment
            });

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
            // 테이블 상태 확인
            const tableStatusResponse = await fetch(
                `/api/pos/stores/${this.currentStoreId}/table/${this.currentTableNumber}/status`
            );

            if (!tableStatusResponse.ok) {
                return false;
            }

            const tableStatusData = await tableStatusResponse.json();

            if (!tableStatusData.success || !tableStatusData.table) {
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
                return false;
            }

            // TLL 연동 유효성 확인
            const validationResponse = await fetch(
                `/api/pos-payment-tll/validate/${orderId}?storeId=${this.currentStoreId}&tableNumber=${this.currentTableNumber}`
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
     * 메뉴 카드 클릭 시 주문수정 모드 자동 활성화 및 +수정 처리
     */
    async addToOrder(
        menuId,
        menuName,
        price,
        storeId = null,
        cookStation = null,
    ) {
        try {
            console.log(`🎯 메뉴 카드 클릭: ${menuName} (주문수정 모드 처리)`);

            // 주문수정 상태 확인 및 자동 활성화
            const isEditModeActive = this.pendingModifications.length > 0 || this.selectedOrder;

            if (!isEditModeActive) {
                console.log(`📝 주문수정 모드 자동 활성화: ${menuName} 클릭`);
                this.showToast(`📝 주문수정 모드 활성화: ${menuName} +1개 추가`);
            } else {
                console.log(`✅ 주문수정 모드 이미 활성화됨: ${menuName} +1개 추가`);
                this.showToast(`➕ ${menuName} +1개 추가됨`);
            }

            // 현재 해당 메뉴의 원본 수량 확인
            let originalQuantity = 0;
            const existingOrder = this.currentOrders.find(order => 
                (order.menuId === parseInt(menuId) || order.id === parseInt(menuId)) && 
                order.menuName === menuName && 
                !order.isCart && !order.isNewMenu
            );

            if (existingOrder) {
                originalQuantity = existingOrder.quantity;
            } else {
                // 기존 주문에 없는 새로운 메뉴라면 원본 수량은 0
                originalQuantity = 0;
            }

            // 기존 수정사항에서 해당 메뉴 찾기
            const existingModification = this.pendingModifications.find(mod => 
                mod.menuId === parseInt(menuId) && mod.menuName === menuName
            );

            let newQuantity;
            if (existingModification) {
                // 기존 수정사항이 있으면 1개 증가
                newQuantity = existingModification.newQuantity + 1;
                console.log(`🔄 기존 수정사항 업데이트: ${menuName} (${existingModification.newQuantity} → ${newQuantity})`);
            } else {
                // 새로운 수정사항이면 원본 수량 + 1
                newQuantity = originalQuantity + 1;
                console.log(`➕ 새로운 수정사항 생성: ${menuName} (${originalQuantity} → ${newQuantity})`);
            }

            // 수정사항을 누적 배열에 추가/업데이트
            this.addToPendingModifications(
                parseInt(menuId), 
                menuName, 
                originalQuantity, 
                newQuantity, 
                'plus'
            );

            // UI에서 해당 메뉴가 이미 표시되어 있다면 업데이트
            let existingRow = document.querySelector(`.pos-order-table tr[data-menu-id="${menuId}"]`);

            if (existingRow) {
                // 기존 메뉴 행이 있는 경우 수량 업데이트
                this.updateOrderRowDisplay(existingRow, newQuantity, 'plus');
                console.log(`🔄 기존 메뉴 행 수량 업데이트: ${menuName} → ${newQuantity}개`);

                // 해당 행을 선택 상태로 만들기
                document.querySelectorAll('.pos-order-table tr').forEach(row => {
                    row.classList.remove('selected', 'order-row-selected');
                });
                existingRow.classList.add('order-row', 'selected');

                // 선택된 주문 정보 업데이트
                this.selectedOrder = {
                    orderId: existingRow.dataset.orderId,
                    menuId: parseInt(menuId),
                    menuName: menuName,
                    quantity: newQuantity,
                    originalQuantity: originalQuantity,
                    rowElement: existingRow,
                    modified: true
                };

            } else {
                // 새로운 메뉴인 경우 임시로 currentOrders에 추가하여 UI에 표시
                const newMenuItem = {
                    id: `temp_${Date.now()}`, // 임시 ID
                    menuId: parseInt(menuId),
                    menuName: menuName,
                    price: price,
                    quantity: newQuantity, // 수정된 수량으로 표시
                    cookingStatus: "PENDING",
                    originalQuantity: 0, // 새 메뉴이므로 원본 수량은 0
                };

                this.currentOrders.push(newMenuItem);

                // UI 즉시 업데이트
                const posOrderList = document.getElementById("posOrderList");
                if (posOrderList) {
                    posOrderList.innerHTML = OrderUIRenderer.renderPOSOrderItemsModern();
                }

                console.log(`➕ 새 메뉴 임시 추가: ${menuName} (수량: ${newQuantity})`);

                // 새로 추가된 메뉴를 자동으로 선택된 상태로 만들기
                setTimeout(() => {
                    const newMenuRow = document.querySelector(`.pos-order-table tr[data-menu-id="${menuId}"]`);
                    if (newMenuRow) {
                        // 기존 선택 해제
                        document.querySelectorAll('.pos-order-table tr').forEach(row => {
                            row.classList.remove('selected', 'order-row-selected');
                        });

                        // 새 메뉴 선택 (기존 order-row selected 클래스 사용)
                        newMenuRow.classList.add('order-row', 'selected');

                        // OrderModificationManager의 selectedOrder 설정
                        OrderModificationManager.selectedOrder = {
                            orderId: newMenuItem.id,
                            menuId: parseInt(menuId),
                            menuName: menuName,
                            quantity: newQuantity,
                            originalQuantity: 0, // 새 메뉴이므로 원본 수량은 0
                            rowElement: newMenuRow,
                            modified: true
                        };

                        // 로컬 selectedOrder도 동기화
                        this.selectedOrder = OrderModificationManager.selectedOrder;

                        console.log(`✅ 새 메뉴 자동 선택: ${menuName} (수량: ${newQuantity})`);
                    }
                }, 100); // DOM 업데이트 후 실행
            }

            // 수정사항 요약 업데이트
            this.updatePendingModificationsSummary();

            // 편집 모드 UI 업데이트
            this.updateEditModeUI(true);

            this.showToast(`${menuName} 수정내역에 추가됨 (+1개, 총 ${newQuantity}개)`);

            console.log(`📈 수정내역 누적 완료: ${menuName} (원본: ${originalQuantity} → 새로운: ${newQuantity})`);

        } catch (error) {
            console.error("❌ 주문 추가 실패:", error);
            alert(`주문 추가 중 오류가 발생했습니다: ${error.message}`);
        }
    },

    /**
     * 주문 목록 새로고침 (결제 완료 후 확실한 데이터 갱신)
     */
    async refreshOrders() {
        console.log("🔄 주문 새로고침 시작 - 기존 데이터 초기화");

        // 기존 데이터 완전 초기화
        this.currentOrders = [];
        this.cart = []; // 카트 비우기
        this.tllOrders = [];
        this.tllUserInfo = null;
        this.pendingModifications = []; // 수정사항도 초기화
        this.selectedOrder = null; // 선택된 주문도 초기화

        // 새로운 데이터 로드
        if (POSCore.storeId && this.currentTable) {
            console.log(
                `📡 새 데이터 로드: 매장 ${POSCore.storeId}, 테이블 ${this.currentTable}`,
            );
            await this.loadCurrentOrders(POSCore.storeId, this.currentTable);
        }

        // UI 업데이트
        const posOrderList = document.getElementById("posOrderList");
        if (posOrderList) {
            posOrderList.innerHTML = OrderUIRenderer.renderPOSOrderItemsModern();
            console.log(
                `✅ POS 주문 목록 UI 업데이트 완료: ${this.currentOrders.length}개 주문`,
            );
        }

        // TLL 주문 목록 업데이트
        const tllOrderList = document.getElementById("tllOrderList");
        if (tllOrderList) {
            tllOrderList.innerHTML = OrderUIRenderer.renderTLLOrderItemsModern();
        }

        // 주문 대시보드 업데이트 (카운트 반영)
        this.updateOrderDashboard();

        // 결제 섹션 업데이트
        const paymentSection = document.querySelector(".payment-section");
        if (paymentSection) {
            const newPaymentSection = document.createElement("div");
            newPaymentSection.innerHTML = this.renderPaymentSection();
            paymentSection.replaceWith(newPaymentSection.firstElementChild);
        }

        // 편집 모드 UI 초기화
        this.updateEditModeUI(false);

        console.log(
            `✅ 주문 새로고침 완료 - POS: ${this.currentOrders.length}개, TLL: ${this.tllOrders?.length || 0}개`,
        );
    },

    /**
     * 결제 모달 표시 (기존 호환성용)
     */
    showPaymentModal() {
        console.log("✨ 기존 결제 모달 표시 (통합 결제 모달로 리다이렉트)");
        // 무한 재귀 방지: 직접 통합 결제 모달 함수 호출
        return this.showUnifiedPaymentModal(this.selectedPaymentMethod || "card");
    },

    /**
     * 결제 모달 숨기기
     */
    hidePaymentModal() {
        const modal = document.getElementById("paymentModal");
        if (modal) {
            modal.querySelector(".modal-content").style.transform =
                "translateY(20px)";
            modal.style.backgroundColor = "rgba(0,0,0,0)";
            setTimeout(() => {
                modal.remove();
            }, 300); // 모달 애니메이션 시간과 일치
        }
    },

    /**
     * 결제 모달 상세 정보 렌더링
     */
    renderPaymentDetails() {
        const cartTotal = this.cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
        );
        const subtotal = cartTotal;
        const discount = 0; // TLL 할인 로직 추가 예정
        const total = subtotal - discount;

        return `
            <div class="payment-details-container">
                <div class="payment-summary-modal">
                    <div class="summary-row">
                        <span>소계:</span>
                        <span class="amount">${subtotal.toLocaleString()}원</span>
                    </div>
                    <div class="summary-row discount">
                        <span>할인:</span>
                        <span class="amount">-${discount.toLocaleString()}원</span>
                    </div>
                    <div class="summary-row total">
                        <span>받을 금액:</span>
                        <span class="amount">${total.toLocaleString()}원</span>
                    </div>
                </div>

                <div class="payment-input-section">
                    <label for="paymentMethodSelect">결제 수단:</label>
                    <select id="paymentMethodSelect" onchange="POSOrderScreen.updateSelectedPaymentMethod(this.value)">
                        <option value="card" ${this.selectedPaymentMethod === "card" ? "selected" : ""}>카드</option>
                        <option value="cash" ${this.selectedPaymentMethod === "cash" ? "selected" : ""}>현금</option>
                        <option value="mixed" ${this.selectedPaymentMethod === "mixed" ? "selected" : ""}>복합결제</option>
                    </select>
                </div>

                <div class="payment-input-section">
                    <span>받은 금액:</span>
                    <input type="number" id="receivedAmount" placeholder="0" value="${this.selectedPaymentMethod === "cash" ? total : ""}" />
                    <span>거스름돈:</span>
                    <span id="changeAmount" class="amount">${this.selectedPaymentMethod === "cash" ? (total > 0 ? "0원" : "0원") : "0원"}</span>
                </div>

                <div class="modal-order-list">
                    <h4>주문 내역</h4>
                    <ul>
                        ${this.cart
                            .map(
                                (item) => `
                            <li>${item.name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString()}원</li>
                        `,
                            )
                            .join("")}
                    </ul>
                </div>
            </div>
        `;
    },

    /**
     * 결제 모달에서 결제 수단 변경 시
     */
    updateSelectedPaymentMethod(method) {
        this.selectedPaymentMethod = method;
        const modalBody = document.querySelector("#paymentModal .modal-body");
        if (modalBody) {
            modalBody.innerHTML = this.renderPaymentDetails();
        }
    },

    /**
     * 결제 모달에서 결제 완료 버튼 클릭 시
     */
    confirmPayment() {
        console.log(`✅ 결제 완료 버튼 클릭: ${this.selectedPaymentMethod}`);

        // 실제 결제 처리는 processPayment 함수에서 수행
        // this.processPayment(this.selectedPaymentMethod); // 기존 방식
        this.showPaymentModal(this.selectedPaymentMethod); // 통합 모달 호출

        // 모달 닫기
        this.hidePaymentModal();
    },

    /**
     * 토스트 메시지 표시
     */
    showToast(message) {
        const toast = document.createElement("div");
        toast.className = "toast-message";
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("show");
        }, 100);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    },

    /**
     * 유틸리티 함수들
     */
    getStatusText(status) {
        const statusMap = {
            PENDING: "대기",
            COOKING: "조리중",
            READY: "완료",
            SERVED: "서빙완료",
            COMPLETED: "완료",
            CANCELLED: "취소됨",
            CART: "카트",
        };
        return statusMap[status] || "대기";
    },

    /**
     * 카트 비우기
     */
    clearCart() {
        this.cart = [];
        // this.updateCartDisplay(); // 카트 비워졌으므로 UI 업데이트 불필요
        this.showToast("카트가 비워졌습니다");
    },

    /**
     * 조리 스테이션 텍스트 반환
     */
    getCookStationText(cookStation) {
        const stationMap = {
            KITCHEN: "주방",
            DRINK: "음료",
            DESSERT: "디저트",
            SIDE: "사이드",
        };
        return stationMap[cookStation] || "주방";
    },

    /**
     * 메뉴 이름으로 조리 스테이션 조회 (실제 데이터 사용)
     */
    getCookStationByMenu(menuName) {
        console.log(`🔍 cook_station 조회: ${menuName}`);

        // 1. 메뉴 데이터에서 해당 메뉴의 cook_station 찾기
        if (this.menuData && Array.isArray(this.menuData)) {
            const menuItem = this.menuData.find(menu => 
                menu.name && menu.name.trim() === menuName.trim()
            );

            if (menuItem && menuItem.cook_station) {
                console.log(`✅ 메뉴 데이터에서 cook_station 발견: ${menuName} → ${menuItem.cook_station}`);
                return menuItem.cook_station;
            }

            // cook_station이 없으면 category 필드 사용 (호환성)
            if (menuItem && menuItem.category) {
                console.log(`✅ 메뉴 데이터에서 category 사용: ${menuName} → ${menuItem.category}`);
                return menuItem.category;
            }
        }

        // 2. 현재 주문에서 해당 메뉴의 cook_station 찾기
        if (this.currentOrders && Array.isArray(this.currentOrders)) {
            const orderItem = this.currentOrders.find(order => 
                order.menuName && order.menuName.trim() === menuName.trim()
            );

            if (orderItem && orderItem.cookStation) {
                console.log(`✅ 현재 주문에서 cook_station 발견: ${menuName} → ${orderItem.cookStation}`);
                return orderItem.cookStation;
            }
        }

        // 3. 폴백: 키워드 기반 추정 (기존 로직)
        console.log(`⚠️ 실제 데이터에서 cook_station을 찾을 수 없어 키워드 기반 추정 사용: ${menuName}`);

        const menuNameLower = menuName.toLowerCase();

        // 음료 관련 키워드
        const drinkKeywords = ['콜라', '사이다', '음료', '주스', '커피', '차', '라떼', '아메리카노', '물', '맥주', '소주', 'drink', 'coffee', 'tea', 'juice', 'cola', 'beer'];
        if (drinkKeywords.some(keyword => menuNameLower.includes(keyword.toLowerCase()))) {
            return 'DRINK';
        }

        // 디저트 관련 키워드
        const dessertKeywords = ['케이크', '아이스크림', '빙수', '떡', '과자', 'cake', 'ice', 'dessert'];
        if (dessertKeywords.some(keyword => menuNameLower.includes(keyword.toLowerCase()))) {
            return 'DESSERT';
        }

        // 사이드 관련 키워드
        const sideKeywords = ['샐러드', '김치', '반찬', '무', '피클', 'side', 'salad'];
        if (sideKeywords.some(keyword => menuNameLower.includes(keyword.toLowerCase()))) {
            return 'SIDE';
        }

        // 기본값은 주방
        console.log(`🏠 기본값 사용: ${menuName} → KITCHEN`);
        return 'KITCHEN';
    },

    /**
     * 주문 탭 전환
     */
    switchOrderTab(tabType) {
        // 탭 버튼 활성화 상태 변경
        document.querySelectorAll(".order-tab").forEach((tab) => {
            tab.classList.toggle("active", tab.dataset.tab === tabType);
        });

        // 컨텐츠 영역 표시/숨김
        document.querySelectorAll(".order-content").forEach((content) => {
            content.classList.toggle(
                "active",
                content.id === `${tabType}OrderContent`,
            );
        });
    },

    /**
     * 주문 편집 (추후 구현)
     */
    editOrder(orderId) {
        alert("주문 편집 기능은 추후 구현 예정입니다.");
    },

    /**
     * TLL 주문 새로고침
     */
    async refreshTLLOrders() {
        try {
            console.log("🔄 TLL 주문 새로고침 시작");
            console.log(
                `📍 현재 정보: 매장 ${POSCore.storeId}, 테이블 ${this.currentTable}`,
            );

            if (!POSCore.storeId || !this.currentTable) {
                console.error("❌ 매장 ID 또는 테이블 정보가 없습니다");
                this.showToast("매장 또는 테이블 정보가 없습니다");
                return;
            }

            await this.loadTLLOrders(POSCore.storeId, this.currentTable);

            // UI 업데이트
            const tllOrderList = document.getElementById("tllOrderList");
            if (tllOrderList) {
                tllOrderList.innerHTML = OrderUIRenderer.renderTLLOrderItemsModern();
                console.log(
                    `✅ TLL 주문 목록 UI 업데이트: ${this.tllOrders?.length || 0}개 주문`,
                );
            }

            // 대시보드 카드 업데이트
            this.updateOrderDashboard();

            // 결제 섹션 업데이트 (사용자 정보 반영)
            const paymentSection = document.querySelector(".payment-section");
            if (paymentSection) {
                const newPaymentSection = document.createElement("div");
                newPaymentSection.innerHTML = this.renderPaymentSection();
                paymentSection.replaceWith(newPaymentSection.firstElementChild);
                console.log("✅ 결제 섹션 업데이트 완료");

                // 버튼 상태 재동기화 (중복 방지)
                if (this.tllOrders && this.tllOrders.length > 0) {
                    const isMixed = this.checkTLLOrderMixedStatus();
                    this._cachedTLLMixedStatus = isMixed;

                    // 약간의 지연을 두고 UI 업데이트 (DOM 안정성 보장)
                    setTimeout(() => {
                        this.updateTLLConnectionButton(isMixed);
                    }, 150);
                } else {
                    this._cachedTLLMixedStatus = false;
                    setTimeout(() => {
                        this.updateTLLConnectionButton(false);
                    }, 150);
                }
            }

            this.showToast(
                `TLL 주문 새로고침 완료 (${this.tllOrders?.length || 0}개)`,
            );
        } catch (error) {
            console.error("❌ TLL 주문 새로고침 실패:", error);
            this.showToast(
                "TLL 주문 새로고침에 실패했습니다: " + error.message,
            );
        }
    },

    /**
     * 주문 대시보드 업데이트 (확실한 카운트 반영)
     */
    updateOrderDashboard() {
        const posOrders = this.currentOrders.filter(
            (order) => !order.sessionId,
        );
        const tllOrderCount = this.tllOrders?.length || 0;

        console.log(
            `📊 대시보드 업데이트: POS ${posOrders.length}개, TLL ${tllOrderCount}개`,
        );

        // 카운트 업데이트
        const posCard = document.querySelector(".pos-card .count");
        const tllCard = document.querySelector(".tll-card .count");
        const totalCard = document.querySelector(".total-card .count");

        if (posCard) {
            posCard.textContent = `${posOrders.length}건`;
            console.log(`✅ POS 카드 카운트 업데이트: ${posOrders.length}건`);
        }
        if (tllCard) {
            tllCard.textContent = `${tllOrderCount}건`;
            console.log(`✅ TLL 카드 카운트 업데이트: ${tllOrderCount}건`);
        }
        if (totalCard) {
            totalCard.textContent = `${posOrders.length + tllOrderCount}건`;
            console.log(
                `✅ 전체 카드 카운트 업데이트: ${posOrders.length + tllOrderCount}건`,
            );
        }

        // 탭 텍스트 업데이트 (강제 업데이트)
        const posTab = document.querySelector('.order-tab[data-tab="pos"]');
        const tllTab = document.querySelector('.order-tab[data-tab="tll"]');

        if (posTab) {
            posTab.textContent = `💻 POS 주문 (${posOrders.length})`;
            console.log(`✅ POS 탭 텍스트 업데이트: ${posOrders.length}개`);
        }
        if (tllTab) {
            tllTab.textContent = `📱 TLL 주문 (${tllOrderCount})`;
            console.log(`✅ TLL 탭 텍스트 업데이트: ${tllOrderCount}개`);
        }

        // 헤더의 주문 카운트도 업데이트 (있다면)
        const headerOrderCount = document.querySelector(".header-order-count");
        if (headerOrderCount) {
            headerOrderCount.textContent = `${posOrders.length + tllOrderCount}`;
        }
    },

    getMenuIcon(category) {
        const icons = {
            찌개류: "🍲",
            구이류: "🥩",
            밥류: "🍚",
            면류: "🍜",
            음료: "🥤",
            기타: "🍽️",
        };
        return icons[category] || "🍽️";
    },

    getPaymentMethodName() {
        const names = {
            cash: "현금",
            card: "카드",
            mixed: "복합결제",
            tlpay: "TL Pay",
            simple: "간편결제",
        };
        return names[this.selectedPaymentMethod] || "카드";
    },

    getDefaultMenu() {
        return [
            { id: 1, name: "김치찌개", price: 8000, category: "찌개류" },
            { id: 2, name: "된장찌개", price: 7000, category: "찌개류" },
            { id: 3, name: "불고기", price: 15000, category: "구이류" },
            { id: 4, name: "비빔밥", price: 9000, category: "밥류" },
            { id: 5, name: "콜라", price: 2000, category: "음료" },
            { id: 6, name: "사이다", price: 2000, category: "음료" },
        ];
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 받은 금액 입력 시 거스름돈 계산
        const receivedInput = document.getElementById("receivedAmount");
        if (receivedInput) {
            receivedInput.addEventListener("input", (e) => {
                const received = parseInt(e.target.value) || 0;
                // 현재 결제할 총 금액 (카트 아이템 기준)
                const total = this.cart.reduce(
                    (sum, order) => sum + order.price * order.quantity,
                    0,
                );
                const change = Math.max(0, received - total);

                const changeElement = document.getElementById("changeAmount");
                if (changeElement) {
                    changeElement.textContent = change.toLocaleString() + "원";
                    changeElement.className = `amount change-amount ${change > 0 ? "positive" : ""}`;
                }
            });
        }
    },

    // --- 세션 관리 관련 함수 ---

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
            // 서버에 세션 종료 요청
            const response = await fetch(
                `/api/orders/${this.currentSession.orderId}/end-session`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const result = await response.json();

            if (result.success) {
                console.log(
                    `✅ 세션 종료 완료: 주문 ${this.currentSession.orderId}`,
                );

                // 로컬 세션 정보 초기화
                this.currentSession = null;
                this.sessionItems = [];

                // 테이블 상태 업데이트
                this.updateTableStatus(this.currentTableNumber, "available");
            } else {
                console.error("❌ 세션 종료 실패:", result.error);
            }
        } catch (error) {
            console.error("❌ 세션 종료 요청 실패:", error);
        }
    },

    /**
     * 세션 데이터 로드 - OrderDataManager로 위임
     */
    async loadSessionData() {
        if (!this.currentTable) return; // 테이블이 선택되지 않았으면 로드 안함

        try {
            const { currentSession, sessionItems } = await OrderDataManager.loadSessionData(
                POSCore.storeId, 
                this.currentTable
            );

            this.currentSession = currentSession;
            this.sessionItems = sessionItems;

            if (currentSession) {
                console.log("✅ 세션 데이터 로드:", currentSession);
                // 테이블 상태 업데이트 (예: 'occupied')
                this.updateTableStatus(this.currentTable, "occupied");
            } else {
                // 테이블 상태 업데이트 (예: 'available')
                this.updateTableStatus(this.currentTable, "available");
            }
        } catch (error) {
            console.error("❌ 세션 데이터 로드 실패:", error);
            this.currentSession = null;
            this.sessionItems = [];
        }
    },

    /**
     * 테이블 상태 업데이트
     */
    updateTableStatus(tableNumber, status) {
        // 테이블맵 화면이 있다면 해당 테이블 상태 업데이트
        if (
            window.POSTableMap &&
            typeof window.POSTableMap.updateTableStatus === "function"
        ) {
            window.POSTableMap.updateTableStatus(tableNumber, status);
        }

        console.log(`🍽️ 테이블 ${tableNumber} 상태 업데이트: ${status}`);
    },

    /**
     * TLL 연동 활성화
     */
    async enableTLLConnection() {
        try {
            if (!this.tllOrders || this.tllOrders.length === 0) {
                alert('연동할 TLL 주문이 없습니다.');
                return;
            }

            // 실시간 상태 체크
            const currentMixedStatus = await this.refreshTLLOrderMixedStatus();
            if (currentMixedStatus) {
                alert('이미 연동이 활성화된 주문입니다.');
                return;
            }

            // 첫 번째 TLL 주문에서 orderId 가져오기
            const orderId = this.tllOrders[0].order_id;

            if (!orderId) {
                console.error('❌ TLL 주문 ID를 찾을 수 없습니다');
                alert('TLL 주문 정보를 찾을 수 없습니다.');
                return;
            }

            const confirmMessage =
                `TLL 연동을 활성화하시겠습니까?

• 활성화 후 이 테이블에서 POS 주문을 추가하면
• 기존 TLL 주문과 합쳐져서 하나의 계산서로 처리됩니다
• 주문 ID: ${orderId}`;

            if (!confirm(confirmMessage)) {
                return;
            }

            console.log(`🔗 TLL 연동 활성화 요청: 주문 ID ${orderId}`);

            const response = await fetch(`/api/pos/orders/${orderId}/enable-mixed`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'TLL 연동 활성화 실패');
            }

            const result = await response.json();
            console.log('✅ TLL 연동 활성화 완료:', result);

            // 성공 메시지
            alert(`✅ TLL 연동이 활성화되었습니다.
주문 ID: ${orderId}`);

            // TLL 주문 데이터의 is_mixed 상태 업데이트
            if (this.tllOrders && this.tllOrders.length > 0) {
                this.tllOrders.forEach(order => {
                    if (order.order_id === orderId) {
                        order.is_mixed = true;
                    }
                });
            }

            // 캐시 상태 즉시 업데이트
            this._cachedTLLMixedStatus = true;

            // UI 즉시 업데이트
            this.updateTLLConnectionButton(true);

            // 전체 새로고침 (UI 중복 업데이트 방지)
            setTimeout(async () => {
                await this.refreshOrders();
            }, 200);

        } catch (error) {
            console.error('❌ TLL 연동 활성화 실패:', error);
            alert(`TLL 연동 활성화 중 오류가 발생했습니다:\n${error.message}`);
        }
    },

    /**
     * TLL 세션 종료
     */
    async endTLLSession() {
        try {
            // 활성 TLL 주문이 있는지 확인
            if (!this.tllOrders || this.tllOrders.length === 0) {
                alert("종료할 TLL 세션이 없습니다.");
                return;
            }

            // 첫 번째 TLL 주문에서 orderId 가져오기
            const orderId = this.tllOrders[0].order_id;

            if (!orderId) {
                console.error("❌ TLL 주문 ID를 찾을 수 없습니다");
                alert("TLL 주문 정보를 찾을 수 없습니다.");
                return;
            }

            const confirmMessage =
                `TLL 세션을 종료하시겠습니까?

• 사용자: ${this.tllUserInfo?.name || "게스트"}
• 주문 수: ${this.tllOrders.length}개
• 주문 ID: ${orderId}`;

            if (!confirm(confirmMessage)) {
                return;
            }

            console.log(`🔚 TLL 세션 종료 요청: 주문 ID ${orderId}`);

            const response = await fetch(`/api/orders/${orderId}/end-session`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "TLL 세션 종료 실패");
            }

            const result = await response.json();
            console.log("✅ TLL 세션 종료 완료:", result);

            // 성공 메시지
            alert(`✅ TLL 세션이 종료되었습니다.
주문 ID: ${orderId}`);

            // TLL 관련 데이터 초기화
            this.tllOrders = [];
            this.tllUserInfo = null;

            // TLL 주문 새로고침 실행
            await this.refreshTLLOrders();

            // UI 업데이트
            await this.refreshOrders();

            // 화면 새로고침으로 완전 초기화
            await this.render(
                this.currentStoreId,
                { name: "매장" },
                this.currentTableNumber,
            );

            // 테이블맵으로 자동 전환
            setTimeout(() => {
                POSCore.showTableMap();
            }, 1500);
        } catch (error) {
            console.error("❌ TLL 세션 종료 실패:", error);
            alert(`TLL 세션 종료 중 오류가 발생했습니다:\n${error.message}`);
        }
    },

    // 기타 기능들 (임시 구현)
    showKitchenDisplay() {
        alert("주방출력 기능 (추후 구현)");
    },
    showSalesStatus() {
        alert("매출현황 기능 (추후 구현)");
    },
    showNotifications() {
        alert("알림 기능 (추후 구현)");
    },
    changeQuantity(orderId, change) {
        alert("수량변경 기능 (추후 구현)");
    },
    removeOrder(orderId) {
        alert("주문삭제 기능 (추후 구현)");
    },
    cancelAllOrders() {
        alert("전체취소 기능 (추후 구현)");
    },
    cancelSelectedOrders() {
        // 누적된 수정사항이 있으면 모든 수정사항 취소
        if (this.pendingModifications.length > 0) {
            OrderModificationManager.cancelAllPendingModifications();
            return;
        }

        // 단일 선택된 주문이 있으면 해당 주문 편집 취소
        if (this.selectedOrder) {
            this.cancelOrderEdit();
            return;
        }

        // 임시 ID를 가진 행들이 있으면 제거
        const tempRows = document.querySelectorAll('.pos-order-table tr[data-order-id^="temp_"]');
        if (tempRows.length > 0) {
            console.log(`🗑️ ${tempRows.length}개 임시 메뉴 행 제거`);
            tempRows.forEach(row => row.remove());

            // currentOrders에서도 임시 추가된 항목들 제거
            if (this.currentOrders) {
                const originalLength = this.currentOrders.length;
                this.currentOrders = this.currentOrders.filter(order => 
                    !String(order.id).startsWith('temp_')
                );
                const removedCount = originalLength - this.currentOrders.length;
                if (removedCount > 0) {
                    console.log(`🗑️ currentOrders에서 ${removedCount}개 임시 항목 제거`);
                }
            }

            // UI 새로고침
            setTimeout(() => {
                this.refreshOrders();
            }, 100);

            return;
        }

        // 아무것도 선택되지 않은 경우
        alert("취소할 선택된 주문이 없습니다.");
    },


    // 새로운 결제 기능들
    showOrderHistory() {
        alert("주문 내역 관리 기능 (추후 구현)");
    },
    showDutchPay() {
        alert("더치페이 기능 (추후 구현)");
    },
    showReceiptManagement() {
        alert("영수증 관리 기능 (추후 구현)");
    },

    // 컨트롤 바 기능들은 위에서 이미 구현됨

    /**
     * 다중 주문 수정 누적 시스템 - OrderModificationManager로 위임
     */
    get pendingModifications() {
        return OrderModificationManager.pendingModifications;
    },

    set pendingModifications(value) {
        OrderModificationManager.pendingModifications = value;
    },

    /**
     * 주문 행 선택 및 수정 기능 - OrderModificationManager로 위임
     */
    toggleOrderRowSelection(orderId, menuName, quantity) {
        return OrderModificationManager.toggleOrderRowSelection(orderId, menuName, quantity);
    },

    /**
     * 편집 모드 UI 상태 업데이트 - OrderModificationManager로 위임
     */
    updateEditModeUI(isEditMode) {
        return OrderModificationManager.updateEditModeUI(isEditMode);
    },

    /**
     * 편집 모드 표시기 표시 - OrderModificationManager로 위임
     */
    showEditModeIndicator() {
        return OrderModificationManager.showEditModeIndicator();
    },

    /**
     * 편집 모드 표시기 숨김 - OrderModificationManager로 위임
     */
    hideEditModeIndicator() {
        return OrderModificationManager.hideEditModeIndicator();
    },

    /**
     * 선택된 주문의 수량 감소 - OrderModificationManager로 위임
     */
    minusQuantityFromSelected() {
        return OrderModificationManager.minusQuantityFromSelected();
    },

    /**
     * 선택된 주문의 수량 증가 - OrderModificationManager로 위임
     */
    addQuantityToSelected() {
        return OrderModificationManager.addQuantityToSelected();
    },

    /**
     * 주문 행 화면 업데이트 - OrderModificationManager로 위임
     */
    updateOrderRowDisplay(rowElement, newQuantity, action) {
        return OrderModificationManager.updateOrderRowDisplay(rowElement, newQuantity, action);
    },

    /**
     * 수정사항을 누적 배열에 추가/업데이트 - OrderModificationManager로 위임
     */
    addToPendingModifications(menuId, menuName, originalQuantity, newQuantity, actionType = 'auto') {
        return OrderModificationManager.addToPendingModifications(menuId, menuName, originalQuantity, newQuantity, actionType);
    },

    /**
     * 메뉴 ID로 단가 조회
     */
    getMenuPrice(menuId) {
        // 현재 주문에서 해당 메뉴의 단가 찾기
        const orderItem = this.currentOrders.find(order => 
            (order.menuId === parseInt(menuId) || order.id === parseInt(menuId)) && !order.isCart
        );

        if (orderItem) {
            return orderItem.price;
        }

        // 메뉴 데이터에서 찾기
        const menuItem = this.menuData.find(menu => menu.id === parseInt(menuId));
        if (menuItem) {
            return menuItem.price;
        }

        console.warn(`⚠️ 메뉴 ${menuId}의 단가를 찾을 수 없음, 기본값 0 사용`);
        return 0;
    },

    /**
     * 수정사항 요약 표시 업데이트 - OrderModificationManager로 위임
     */
    updatePendingModificationsSummary() {
        return OrderModificationManager.updatePendingModificationsSummary();
    },

    /**
     * 모든 누적된 수정사항 취소 - OrderModificationManager로 위임
     */
    cancelAllPendingModifications() {
        return OrderModificationManager.cancelAllPendingModifications();
    },

    /**
     * 모든 누적된 수정사항 확정 - OrderModificationManager로 위임
     */
    async confirmAllPendingModifications() {
        return OrderModificationManager.confirmAllPendingModifications();
    },

    /**
     * 수정사항을 증가/감소로 분류 - OrderModificationManager로 위임
     */
    categorizeModifications() {
        return OrderModificationManager.categorizeModifications();
    },

    /**
     * 감소 수정 처리 - OrderModificationManager로 위임
     */
    async processDecreaseModification(modification) {
        return OrderModificationManager.processDecreaseModification(modification);
    },

    /**
     * 증가 수정 처리 - OrderModificationManager로 위임
     */
    async processIncreaseModifications(increaseModifications) {
        return OrderModificationManager.processIncreaseModifications(increaseModifications);
    },

    /**
     * 메뉴 ID로 조리스테이션 조회
     */
    getMenuCookStation(menuId) {
        // 현재 주문에서 해당 메뉴의 조리스테이션 찾기
        const orderItem = this.currentOrders.find(order => 
            (order.menuId === parseInt(menuId) || order.id === parseInt(menuId)) && !order.isCart
        );

        if (orderItem) {
            return orderItem.cookStation || 'KITCHEN';
        }

        // 메뉴 데이터에서 찾기
        const menuItem = this.menuData.find(menu => menu.id === parseInt(menuId));
        if (menuItem) {
            return menuItem.cook_station || menuItem.category || 'KITCHEN';
        }

        console.warn(`⚠️ 메뉴 ${menuId}의 조리스테이션을 찾을 수 없음, 기본값 KITCHEN 사용`);
        return 'KITCHEN';
    },

    /**
     * 주문 수정 확정 (API 호출)
     */
    async confirmOrderEdit() {
        if (!this.selectedOrder || !this.selectedOrder.modified) {
            console.log('ℹ️ 수정할 내용이 없습니다.');
            return this.confirmOrder(); // 일반 주문 확정으로 진행
        }

        try {
            const { menuId, menuName, quantity: newQuantity, originalQuantity } = this.selectedOrder;

            console.log(`🔧 주문 수정 확정 시작:`, {
                menuId,
                menuName,
                newQuantity,
                originalQuantity,
                storeId: this.currentStoreId,
                tableNumber: this.currentTableNumber
            });

            // 기본 정보 검증
            if (!this.currentStoreId || !this.currentTableNumber) {
                throw new Error('매장 정보 또는 테이블 정보가 없습니다.');
            }

            // 원본 수량 확인 (저장된 값 또는 DB에서 조회)
            const finalOriginalQuantity = originalQuantity !== undefined ? originalQuantity : this.getOriginalQuantity(menuId);

            if (finalOriginalQuantity === null || finalOriginalQuantity === undefined || finalOriginalQuantity <= 0) {
                throw new Error(`유효하지 않은 원본 수량입니다: ${finalOriginalQuantity}`);
            }

            // 수량 변화가 없으면 취소
            if (finalOriginalQuantity === newQuantity) {
                console.log('ℹ️ 수량 변화가 없어서 수정을 취소합니다.');
                this.cancelOrderEdit();
                return;
            }

            console.log(`🔧 주문 수정 확정: ${menuName} (${finalOriginalQuantity} → ${newQuantity})`);

            // 확인 메시지
            let confirmMessage;
            if (newQuantity === 0) {
                confirmMessage = `${menuName}을(를) 완전히 삭제하시겠습니까?`;
            } else if (newQuantity < finalOriginalQuantity) {
                const decreaseAmount = finalOriginalQuantity - newQuantity;
                confirmMessage = `${menuName}의 수량을 ${decreaseAmount}개 감소시켜 ${finalOriginalQuantity}개에서 ${newQuantity}개로 변경하시겠습니까?`;
            } else {
                confirmMessage = `${menuName}의 수량을 ${finalOriginalQuantity}개에서 ${newQuantity}개로 변경하시겠습니까?`;
            }

            if (!confirm(confirmMessage)) {
                console.log('🚫 사용자가 주문 수정을 취소했습니다.');
                return;
            }

            // 다중 수량 감소 처리 - 여러 번 API 호출
            let remainingQuantity = finalOriginalQuantity;
            let successCount = 0;
            const targetQuantity = newQuantity;

            console.log(`🔄 다중 수량 감소 시작: ${finalOriginalQuantity} → ${targetQuantity}`);

            while (remainingQuantity > targetQuantity && remainingQuantity > 0) {
                try {
                    const requestData = {
                        storeId: parseInt(this.currentStoreId),
                        tableNumber: parseInt(this.currentTableNumber),
                        menuId: parseInt(menuId),
                        menuName: menuName,
                        currentQuantity: remainingQuantity
                    };

                    console.log(`📤 수량 감소 API 호출 (${remainingQuantity} → ${remainingQuantity - 1}):`, requestData);

                    const response = await fetch('/api/pos/orders/modify-quantity', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestData),
                    });

                    if (!response.ok) {
                        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.error || errorMessage;
                        } catch (parseError) {
                            console.warn('⚠️ 에러 응답 파싱 실패:', parseError);
                        }
                        throw new Error(errorMessage);
                    }

                    const result = await response.json();
                    console.log(`✅ 수량 감소 완료 (${remainingQuantity} → ${remainingQuantity - 1}):`, result);

                    remainingQuantity--;
                    successCount++;

                    // 과도한 API 호출 방지를 위한 짧은 지연
                    if (remainingQuantity > targetQuantity) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                } catch (stepError) {
                    console.error(`❌ 수량 감소 실패 (${remainingQuantity}개 처리 중):`, stepError);
                    throw new Error(`${successCount}번 성공 후 실패: ${stepError.message}`);
                }
            }

            console.log(`✅ 전체 주문 수정 완료: ${successCount}번 수량 감소 성공`);

            // 성공 메시지
            let successMessage;
            if (targetQuantity === 0) {
                successMessage = `${menuName}이(가) 완전히 삭제되었습니다.`;
            } else {
                const decreaseAmount = finalOriginalQuantity - targetQuantity;
                successMessage = `${menuName}의 수량이 ${decreaseAmount}개 감소되어 ${targetQuantity}개로 변경되었습니다.`;
            }

            this.showToast(successMessage);

            // 편집 모드 해제
            this.selectedOrder = null;
            this.updateEditModeUI(false);

            // 주문 목록 새로고침
            console.log('🔄 주문 목록 새로고침 시작...');
            await this.refreshOrders();
            console.log('✅ 주문 목록 새로고침 완료');

        } catch (error) {
            console.error('❌ 주문 수정 실패:', error);
            console.error('❌ 에러 스택:', error.stack);

            // 사용자에게 친화적인 에러 메시지 제공
            let userMessage = '주문 수정 중 오류가 발생했습니다.';
            if (error.message.includes('원본 수량')) {
                userMessage = '주문 정보를 찾을 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.';
            } else if (error.message.includes('HTTP 4')) {
                userMessage = '잘못된 요청입니다. 주문 정보를 확인해주세요.';
            } else if (error.message.includes('HTTP 5')) {
                userMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            } else if (error.message.includes('번 성공 후 실패')) {
                userMessage = `수량 수정이 부분적으로 완료되었습니다. ${error.message}`;
            }

            alert(`${userMessage}\n\n기술적 오류: ${error.message}`);
        }
    },

    /**
     * 원본 수량 가져오기 (수정 전 DB 기준)
     */
    getOriginalQuantity(menuId) {
        console.log(`🔍 원본 수량 조회: menuId=${menuId}, currentOrders 개수=${this.currentOrders.length}`);

        if (!this.currentOrders || this.currentOrders.length === 0) {
            console.warn('⚠️ currentOrders가 비어있음');
            return null;
        }

        // 다양한 방식으로 매칭 시도
        let originalOrder = null;
        const targetMenuId = parseInt(menuId);

        // 1차 시도: menuId 기준
        originalOrder = this.currentOrders.find(order => 
            order.menuId === targetMenuId && !order.isCart
        );

        // 2차 시도: id 기준  
        if (!originalOrder) {
            originalOrder = this.currentOrders.find(order => 
                order.id === targetMenuId && !order.isCart
            );
        }

        // 3차 시도: menu_id 기준 (백엔드 필드명)
        if (!originalOrder) {
            originalOrder = this.currentOrders.find(order => 
                order.menu_id === targetMenuId && !order.isCart
            );
        }

        if (originalOrder) {
            console.log(`✅ 원본 수량 발견: ${originalOrder.menuName || originalOrder.menu_name} = ${originalOrder.quantity}개`);
            return originalOrder.quantity;
        } else {
            console.error(`❌ 원본 수량을 찾을 수 없음: menuId=${menuId}`);
            console.log('📋 현재 주문 목록:', this.currentOrders.map(order => ({
                id: order.id,
                menuId: order.menuId,
                menu_id: order.menu_id,
                menuName: order.menuName || order.menu_name,
                quantity: order.quantity,
                isCart: order.isCart
            })));
            return null;
        }
    },

    /**
     * 주문 수정 취소
     */
    cancelOrderEdit() {
        if (!this.selectedOrder) return;

        console.log('🚫 주문 수정 취소');

        // pending-addition이나 new-menu-item인 경우 행 자체를 제거
        if (this.selectedOrder.rowElement && 
            (this.selectedOrder.rowElement.classList.contains('pending-addition') || 
             this.selectedOrder.rowElement.classList.contains('new-menu-item'))) {

            console.log('🗑️ pending/new-menu 행 제거:', this.selectedOrder.menuName);
            this.selectedOrder.rowElement.remove();

            // currentOrders에서도 해당 항목 제거
            if (this.currentOrders) {
                const originalLength = this.currentOrders.length;
                this.currentOrders = this.currentOrders.filter(order => 
                    !(order.isNewMenu || order.isPendingAddition || order.id === this.selectedOrder.orderId)
                );
                const removedCount = originalLength - this.currentOrders.length;
                if (removedCount > 0) {
                    console.log(`🗑️ currentOrders에서 ${removedCount}개 임시 항목 제거`);
                }
            }
        } else {
            // 일반 주문인 경우 화면상 변경사항 복원
            const quantityDisplay = this.selectedOrder.rowElement.querySelector('.quantity-display');
            if (quantityDisplay) {
                const originalQuantity = this.getOriginalQuantity(this.selectedOrder.menuId);
                quantityDisplay.textContent = originalQuantity;
                quantityDisplay.classList.remove('modified');
            }

            // 행 스타일 복원
            this.selectedOrder.rowElement.classList.remove('will-be-removed', 'selected');
        }

        // 편집 모드 해제
        this.selectedOrder = null;
        this.updateEditModeUI(false);

        // UI 새로고침 (pending/new-menu 항목이 제거된 경우)
        setTimeout(() => {
            this.refreshOrders();
        }, 100);
    },

    /**
     * confirmOrder 메서드 수정 (다중 편집 모드 감지)
     */
    async confirmOrder() {
        // 다중 수정사항이 있는 경우 다중 수정 확정으로 처리
        if (this.pendingModifications.length > 0) {
            return this.confirmAllPendingModifications();
        }

        // 단일 편집 모드인 경우 기존 수정 확정으로 처리
        if (this.selectedOrder && this.selectedOrder.modified) {
            return this.confirmOrderEdit();
        }

        // 수정사항이 없으면 알림
        alert("주문할 내용이 없습니다. 메뉴를 선택해주세요.");
        return;
    },
};

// 전역 함수로 등록
window.POSOrderScreen = POSOrderScreen;