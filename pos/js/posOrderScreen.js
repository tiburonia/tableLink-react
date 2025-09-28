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
if (typeof OrderEventManager === 'undefined') {
    console.error('❌ OrderEventManager 모듈이 로드되지 않았습니다');
}
if (typeof OrderSessionManager === 'undefined') {
    console.error('❌ OrderSessionManager 모듈이 로드되지 않았습니다');
}
if (typeof OrderPaymentManager === 'undefined') {
    console.error('❌ OrderPaymentManager 모듈이 로드되지 않았습니다');
}
if (typeof OrderUtilityManager === 'undefined') {
    console.error('❌ OrderUtilityManager 모듈이 로드되지 않았습니다');
}
if (typeof OrderStateManager === 'undefined') {
    console.error('❌ OrderStateManager 모듈이 로드되지 않았습니다');
}

// 전역 스코프에서 POSOrderScreen 객체 정의
const POSOrderScreen = {
    // 기본 속성
    currentTable: null,
    currentOrders: [],
    menuData: [],
    cart: [],
    tllOrders: [],
    tllUserInfo: null,
    selectedOrder: null,

    // 모듈 위임 속성들
    get selectedPaymentMethod() {
        return OrderPaymentManager.selectedPaymentMethod;
    },
    set selectedPaymentMethod(value) {
        OrderPaymentManager.selectedPaymentMethod = value;
    },

    get currentSession() {
        return OrderSessionManager.currentSession;
    },

    get sessionItems() {
        return OrderSessionManager.sessionItems;
    },

    get pendingModifications() {
        // 하위 호환성을 위해 Map을 Array로 변환
        return Array.from(OrderModificationManager.pendingChanges.values());
    },
    set pendingModifications(value) {
        // 하위 호환성을 위해 Array를 Map으로 변환
        OrderModificationManager.pendingChanges.clear();
        if (Array.isArray(value)) {
            value.forEach(item => {
                if (item.menuName) {
                    OrderModificationManager.pendingChanges.set(item.menuName, item);
                }
            });
        }
    },

    /**
     * 주문 화면 렌더링
     */
    async render(storeId, storeInfo, tableNumber) {
        try {
            console.log(`🛒 주문 화면 렌더링 - 테이블 ${tableNumber}`);

            // Store ID와 Table Number 설정
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

            // 데이터 로드
            await this.loadCurrentOrders(storeId, tableNumber);
            await this.loadMenuData(storeId);
            await this.loadSessionData();

            console.log("✅ 모든 데이터 로드 완료 - 렌더링 직전 상태:", {
                통합된주문수: this.currentOrders.length,
                카트아이템수: this.cart.length,
                현재주문상세: this.currentOrders
                    .map((order) => `${order.menuName} x${order.quantity}`)
                    .join(", "),
            });

            // 화면 렌더링
            const main = document.getElementById("posMain");
            main.innerHTML = `
                ${this.renderHeader(storeInfo, tableNumber)}
                ${this.renderMainLayout()}
            `;

            console.log("🎨 최초 렌더링 완료");

            // 이벤트 리스너 설정
            OrderEventManager.setupEventListeners();

        } catch (error) {
            console.error("❌ 주문 화면 렌더링 실패:", error);
            POSCore.showError("주문 화면을 불러올 수 없습니다.");
        }
    },

    /**
     * UI 렌더링 메서드들 - OrderUIRenderer로 위임
     */
    renderHeader(storeInfo, tableNumber) {
        return OrderUIRenderer.renderHeader(storeInfo, tableNumber);
    },

    renderMainLayout() {
        return OrderUIRenderer.renderMainLayout();
    },

    renderOrderSection() {
        return OrderUIRenderer.renderOrderSection();
    },

    renderPOSOrderItemsModern() {
        return OrderUIRenderer.renderPOSOrderItemsModern();
    },

    renderTLLOrderItemsModern() {
        return OrderUIRenderer.renderTLLOrderItemsModern();
    },

    renderPaymentSection() {
        return OrderUIRenderer.renderPaymentSection();
    },

    renderMenuSection() {
        return OrderUIRenderer.renderMenuSection();
    },

    renderMenuCategories() {
        return OrderUIRenderer.renderMenuCategories();
    },

    renderMenuGrid(selectedCategory = null) {
        return OrderUIRenderer.renderMenuGrid(selectedCategory);
    },

    renderPaymentMethodSection() {
        return OrderUIRenderer.renderPaymentMethodSection();
    },

    renderTLLUserInfo() {
        return OrderUIRenderer.renderTLLUserInfo();
    },

    renderTLLConnectionButton() {
        return OrderUIRenderer.renderTLLConnectionButton();
    },

    /**
     * 데이터 로드 메서드들 - OrderDataManager로 위임
     */
    async loadCurrentOrders(storeId, tableNumber) {
        try {
            console.log(`🔍 POS 주문 로드 시작: 매장 ${storeId}, 테이블 ${tableNumber}`);

            this.currentOrders = [];
            this.currentOrders = await OrderDataManager.loadCurrentOrders(storeId, tableNumber);
            await this.loadTLLOrders(storeId, tableNumber);

        } catch (error) {
            console.error("❌ 기존 주문 로드 실패:", error);
            this.currentOrders = [];
        }
    },

    async loadTLLOrders(storeId, tableNumber) {
        try {
            console.log(`🔍 TLL 주문 로드 시작: 매장 ${storeId}, 테이블 ${tableNumber}`);

            const { tllOrders, tllUserInfo } = await OrderDataManager.loadTLLOrders(storeId, tableNumber);

            this.tllOrders = tllOrders;
            this.tllUserInfo = tllUserInfo;

            if (this.tllOrders && this.tllOrders.length > 0) {
                const isMixed = this.checkTLLOrderMixedStatus();
                console.log(`🔍 TLL 주문 로드 후 is_mixed 상태: ${isMixed}`);
                this._cachedTLLMixedStatus = isMixed;
            } else {
                this._cachedTLLMixedStatus = false;
                this.updateTLLConnectionButton(false);
            }

            console.log(`✅ TLL 주문 ${this.tllOrders.length}개 로드 완료`);

        } catch (error) {
            console.error("❌ TLL 주문 로드 실패:", error);
            this.tllOrders = [];
            this.tllUserInfo = null;
            this.updateTLLConnectionButton(false);
        }
    },

    async loadMenuData(storeId) {
        try {
            this.menuData = await OrderDataManager.loadMenuData(storeId);
            console.log(`✅ 메뉴 ${this.menuData.length}개 로드`);
        } catch (error) {
            console.error("❌ 메뉴 데이터 로드 실패:", error);
            this.menuData = OrderUtilityManager.getDefaultMenu();
        }
    },

    async loadSessionData() {
        if (!this.currentTable) return;

        try {
            const { currentSession, sessionItems } = await OrderSessionManager.loadSessionData(
                POSCore.storeId,
                this.currentTable
            );
            // 세션 데이터는 OrderSessionManager가 관리
        } catch (error) {
            console.error("❌ 세션 데이터 로드 실패:", error);
        }
    },

    /**
     * TLL 관련 메서드들
     */
    checkTLLOrderMixedStatus() {
        if (!this.tllOrders || this.tllOrders.length === 0) {
            console.log('🔍 TLL 주문 없음, is_mixed: false');
            return false;
        }

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

    async refreshTLLOrderMixedStatus() {
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
                return this.checkTLLOrderMixedStatus();
            }

            const data = await response.json();

            if (data.success) {
                if (this.tllOrders && this.tllOrders.length > 0) {
                    this.tllOrders.forEach(order => {
                        if (order.order_id === orderId) {
                            order.is_mixed = data.is_mixed;
                        }
                    });
                }

                console.log(`✅ TLL 주문 ${orderId} is_mixed 상태 업데이트: ${data.is_mixed}`);

                setTimeout(() => {
                    this.updateTLLConnectionButton(data.is_mixed);
                }, 100);

                return data.is_mixed;
            } else {
                console.warn(`⚠️ TLL 주문 상태 응답 실패: ${data.error}`);
                return this.checkTLLOrderMixedStatus();
            }

        } catch (error) {
            console.error('❌ TLL 주문 상태 새로고침 실패:', error);
            return this.checkTLLOrderMixedStatus();
        } finally {
            this._refreshingTLLStatus = false;
        }
    },

    updateTLLConnectionButton(isMixed) {
        const tllConnectBtn = document.querySelector('.tll-action-btn.tll-connect');

        if (!tllConnectBtn) {
            console.log('⚠️ TLL 연동 버튼을 찾을 수 없음');
            return;
        }

        const currentMixed = tllConnectBtn.getAttribute('data-mixed') === 'true';
        if (currentMixed === isMixed) {
            console.log(`ℹ️ TLL 버튼 상태 동일함 (is_mixed: ${isMixed}), 업데이트 건너뜀`);
            return;
        }

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
            tllConnectBtn.setAttribute('onclick', 'POSOrderScreen.enableTLLConnection()');
            tllConnectBtn.onclick = () => POSOrderScreen.enableTLLConnection();
            console.log('🔗 TLL 연동 버튼 활성화 (is_mixed: false)');
        }

        setTimeout(() => {
            tllConnectBtn.dataset.updating = 'false';
        }, 100);
    },

    /**
     * 주문 관련 메서드들 (단순화된 버전)
     */
    async addToOrder(menuId, menuName, price, storeId = null, cookStation = null) {
        try {
            console.log(`🎯 메뉴 추가: ${menuName} (ID: ${menuId})`);

            // OrderModificationManager의 통합 로직 사용
            OrderModificationManager.addMenuItem(menuId, menuName, price, 1);

            this.showToast(`${menuName} +1개 추가됨`);

        } catch (error) {
            console.error("❌ 주문 추가 실패:", error);
            this.showToast(`주문 추가 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    },

    /**
     * 주문 새로고침
     */
    async refreshOrders() {
        console.log("🔄 주문 새로고침 시작 - 기존 데이터 초기화");

        this.currentOrders = [];
        this.cart = [];
        this.tllOrders = [];
        this.tllUserInfo = null;
        this.pendingModifications = [];
        this.selectedOrder = null;

        if (POSCore.storeId && this.currentTable) {
            console.log(`📡 새 데이터 로드: 매장 ${POSCore.storeId}, 테이블 ${this.currentTable}`);
            await this.loadCurrentOrders(POSCore.storeId, this.currentTable);
        }

        // UI 업데이트
        const posOrderList = document.getElementById("posOrderList");
        if (posOrderList) {
            posOrderList.innerHTML = OrderUIRenderer.renderPOSOrderItemsModern();
            console.log(`✅ POS 주문 목록 UI 업데이트 완료: ${this.currentOrders.length}개 주문`);
        }

        const tllOrderList = document.getElementById("tllOrderList");
        if (tllOrderList) {
            tllOrderList.innerHTML = OrderUIRenderer.renderTLLOrderItemsModern();
        }

        this.updateOrderDashboard();

        const paymentSection = document.querySelector(".payment-section");
        if (paymentSection) {
            const newPaymentSection = document.createElement("div");
            newPaymentSection.innerHTML = this.renderPaymentSection();
            paymentSection.replaceWith(newPaymentSection.firstElementChild);
        }

        this.updateEditModeUI(false);

        console.log(`✅ 주문 새로고침 완료 - POS: ${this.currentOrders.length}개, TLL: ${this.tllOrders?.length || 0}개`);
    },

    /**
     * 대시보드 업데이트
     */
    updateOrderDashboard() {
        const posOrders = this.currentOrders.filter(order => !order.sessionId);
        const tllOrderCount = this.tllOrders?.length || 0;

        console.log(`📊 대시보드 업데이트: POS ${posOrders.length}개, TLL ${tllOrderCount}개`);

        const posCard = document.querySelector(".pos-card .count");
        const tllCard = document.querySelector(".tll-card .count");
        const totalCard = document.querySelector(".total-card .count");

        if (posCard) {
            posCard.textContent = `${posOrders.length}건`;
        }
        if (tllCard) {
            tllCard.textContent = `${tllOrderCount}건`;
        }
        if (totalCard) {
            totalCard.textContent = `${posOrders.length + tllOrderCount}건`;
        }

        const posTab = document.querySelector('.order-tab[data-tab="pos"]');
        const tllTab = document.querySelector('.order-tab[data-tab="tll"]');

        if (posTab) {
            posTab.textContent = `💻 POS 주문 (${posOrders.length})`;
        }
        if (tllTab) {
            tllTab.textContent = `📱 TLL 주문 (${tllOrderCount})`;
        }
    },

    /**
     * 카테고리 선택
     */
    selectCategory(category) {
        document.querySelectorAll(".category-tab").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.category === category);
        });

        document.getElementById("menuGrid").innerHTML = this.renderMenuGrid(category);
    },

    /**
     * TLL 주문 새로고침
     */
    async refreshTLLOrders() {
        try {
            console.log("🔄 TLL 주문 새로고침 시작");

            if (!POSCore.storeId || !this.currentTable) {
                console.error("❌ 매장 ID 또는 테이블 정보가 없습니다");
                OrderUtilityManager.showToast("매장 또는 테이블 정보가 없습니다");
                return;
            }

            await this.loadTLLOrders(POSCore.storeId, this.currentTable);

            const tllOrderList = document.getElementById("tllOrderList");
            if (tllOrderList) {
                tllOrderList.innerHTML = OrderUIRenderer.renderTLLOrderItemsModern();
                console.log(`✅ TLL 주문 목록 UI 업데이트: ${this.tllOrders?.length || 0}개 주문`);
            }

            this.updateOrderDashboard();

            const paymentSection = document.querySelector(".payment-section");
            if (paymentSection) {
                const newPaymentSection = document.createElement("div");
                newPaymentSection.innerHTML = this.renderPaymentSection();
                paymentSection.replaceWith(newPaymentSection.firstElementChild);

                if (this.tllOrders && this.tllOrders.length > 0) {
                    const isMixed = this.checkTLLOrderMixedStatus();
                    this._cachedTLLMixedStatus = isMixed;

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

            OrderUtilityManager.showToast(`TLL 주문 새로고침 완료 (${this.tllOrders?.length || 0}개)`);
        } catch (error) {
            console.error("❌ TLL 주문 새로고침 실패:", error);
            OrderUtilityManager.showToast("TLL 주문 새로고침에 실패했습니다: " + error.message);
        }
    },

    /**
     * 주문 탭 전환
     */
    switchOrderTab(tabType) {
        document.querySelectorAll(".order-tab").forEach((tab) => {
            tab.classList.toggle("active", tab.dataset.tab === tabType);
        });

        document.querySelectorAll(".order-content").forEach((content) => {
            content.classList.toggle("active", content.id === `${tabType}OrderContent`);
        });
    },

    /**
     * 결제 관련 메서드들 - OrderPaymentManager로 위임
     */
    async selectPaymentMethod(method) {
        return OrderPaymentManager.selectPaymentMethod(method);
    },

    async showUnifiedPaymentModal(method = null) {
        return OrderPaymentManager.showUnifiedPaymentModal(method);
    },

    showPaymentModal() {
        console.log("✨ 기존 결제 모달 표시 (통합 결제 모달로 리다이렉트)");
        return this.showUnifiedPaymentModal(this.selectedPaymentMethod || "card");
    },

    hidePaymentModal() {
        return OrderPaymentManager.hidePaymentModal();
    },

    /**
     * 세션 관리 메서드들 - OrderSessionManager로 위임
     */
    getCurrentSession() {
        return OrderSessionManager.getCurrentSession();
    },

    async endCurrentSession() {
        return OrderSessionManager.endCurrentSession();
    },

    async enableTLLConnection() {
        return OrderSessionManager.enableTLLConnection();
    },

    async endTLLSession() {
        return OrderSessionManager.endTLLSession();
    },

    /**
     * 수정 관리 메서드들 - OrderModificationManager로 위임 (통합 상태 관리 기반)
     */
    toggleOrderRowSelection(orderId, menuName, quantity) {
        return OrderModificationManager.toggleOrderRowSelection(orderId, menuName, quantity);
    },

    addQuantityToSelected() {
        return OrderModificationManager.addQuantityToSelected();
    },

    minusQuantityFromSelected() {
        return OrderModificationManager.minusQuantityFromSelected();
    },

    cancelAllChanges() {
        return OrderModificationManager.cancelAllChanges();
    },

    confirmAllChanges() {
        return OrderModificationManager.confirmAllChanges();
    },

    /**
     * 상태 관리자 상태 확인 메서드들
     */
    hasUnsavedChanges() {
        return OrderStateManager?.hasUnsavedChanges() || false;
    },

    isInEditMode() {
        return OrderStateManager?.isInEditMode() || false;
    },

    /**
     * 유틸리티 메서드들 - OrderUtilityManager로 위임
     */
    showToast(message, type = 'info') {
        return OrderUtilityManager.showToast(message, type);
    },

    getStatusText(status) {
        return OrderUtilityManager.getStatusText(status);
    },

    getCookStationText(cookStation) {
        return OrderUtilityManager.getCookStationText(cookStation);
    },

    getMenuIcon(category) {
        return OrderUtilityManager.getMenuIcon(category);
    },

    getCookStationByMenu(menuName) {
        return OrderUtilityManager.getCookStationByMenu(menuName);
    },

    getPaymentMethodName() {
        return OrderPaymentManager.getPaymentMethodName();
    },

    getDefaultMenu() {
        return OrderUtilityManager.getDefaultMenu();
    },

    /**
     * 헬퍼 메서드들
     */
    getMenuPrice(menuId) {
        const orderItem = this.currentOrders.find(order =>
            (order.menuId === parseInt(menuId) || order.id === parseInt(menuId)) && !order.isCart
        );

        if (orderItem) {
            return orderItem.price;
        }

        const menuItem = this.menuData.find(menu => menu.id === parseInt(menuId));
        if (menuItem) {
            return menuItem.price;
        }

        console.warn(`⚠️ 메뉴 ${menuId}의 단가를 찾을 수 없음, 기본값 0 사용`);
        return 0;
    },

    getMenuCookStation(menuId) {
        const orderItem = this.currentOrders.find(order =>
            (order.menuId === parseInt(menuId) || order.id === parseInt(menuId)) && !order.isCart
        );

        if (orderItem) {
            return orderItem.cookStation || 'KITCHEN';
        }

        const menuItem = this.menuData.find(menu => menu.id === parseInt(menuId));
        if (menuItem) {
            return menuItem.cook_station || menuItem.category || 'KITCHEN';
        }

        console.warn(`⚠️ 메뉴 ${menuId}의 조리스테이션을 찾을 수 없음, 기본값 KITCHEN 사용`);
        return 'KITCHEN';
    },

    getOriginalQuantity(menuId, menuName = null) {
        console.log(`🔍 원본 수량 조회: menuId=${menuId}, menuName="${menuName}", currentOrders 개수=${this.currentOrders.length}`);

        if (!this.currentOrders || this.currentOrders.length === 0) {
            console.warn('⚠️ currentOrders가 비어있음');
            return 0;
        }

        // OrderModificationManager의 통합된 로직 사용
        const existingOrder = OrderModificationManager.findExistingOrder(menuId, menuName);

        if (existingOrder) {
            console.log(`✅ 원본 수량 발견: ${existingOrder.menuName} = ${existingOrder.quantity}개`);
            return existingOrder.quantity;
        }

        console.log(`ℹ️ 원본 수량을 찾을 수 없음: menuId=${menuId}, menuName="${menuName}" - 새 메뉴로 간주`);
        return 0;
    },

    /**
     * 주문 확정 메서드 (단순화)
     */
    async confirmOrder() {
        if (OrderModificationManager.pendingChanges.size > 0) {
            return OrderModificationManager.confirmAllChanges();
        }

        alert("주문할 내용이 없습니다. 메뉴를 선택해주세요.");
        return;
    },



    /**
     * 기타 기능들
     */
    clearCart() {
        this.cart = [];
        OrderUtilityManager.showToast("카트가 비워졌습니다");
    },

    cancelSelectedOrders() {
        console.log('🚫 선택된 주문 취소 시작');

        // OrderModificationManager의 통합 취소 로직 사용
        if (OrderModificationManager.pendingChanges.size > 0 || OrderModificationManager.selectedOrder) {
            OrderModificationManager.cancelAllChanges();
            return;
        }

        // 취소할 것이 없음
        console.log('ℹ️ 취소할 선택된 주문이나 수정사항이 없음');
        OrderUtilityManager.showToast("취소할 내용이 없습니다");
    },

    // 임시 기능들
    showKitchenDisplay() {
        alert("주방출력 기능 (추후 구현)");
    },
    showSalesStatus() {
        alert("매출현황 기능 (추후 구현)");
    },
    showNotifications() {
        alert("알림 기능 (추후 구현)");
    },
    cancelAllOrders() {
        alert("전체취소 기능 (추후 구현)");
    },
    showOrderHistory() {
        alert("주문 내역 관리 기능 (추후 구현)");
    },
    showDutchPay() {
        alert("더치페이 기능 (추후 구현)");
    },
    showReceiptManagement() {
        alert("영수증 관리 기능 (추후 구현)");
    }
};

// 전역으로 등록
window.POSOrderScreen = POSOrderScreen;