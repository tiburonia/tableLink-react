/**
 * POS 주문 화면 (OK POS 스타일 - 2분할 구조)
 */

const POSOrderScreen = {
    currentTable: null,
    currentOrders: [],
    menuData: [],
    cart: [], // 프론트엔드 카트 시스템
    selectedPaymentMethod: "card",
    currentSession: null, // 현재 활성 세션 정보
    sessionItems: [], // 현재 세션의 주문 아이템

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
     * 헤더 렌더링 (전역 네비게이션)
     */
    renderHeader(storeInfo, tableNumber) {
        const currentTime = new Date().toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
        });

        return `
            <div class="pos-header-expanded">
                <div class="header-left">
                    <button class="nav-btn back-btn" onclick="POSCore.showTableMap()">
                        ← 테이블맵
                    </button>
                    <div class="store-table-info">
                        <span class="store-name">${storeInfo.name}</span>
                        <span class="separator">|</span>
                        <span class="employee-name">매니저</span>
                        <span class="separator">|</span>
                        <span class="table-info">테이블 ${tableNumber}</span>
                    </div>
                </div>

                <div class="header-center">
                    <div class="current-time">${currentTime}</div>
                </div>

                <div class="header-right">
                    <button class="nav-btn" onclick="POSOrderScreen.showKitchenDisplay()">
                        🏪 주방출력
                    </button>
                    <button class="nav-btn" onclick="POSOrderScreen.showSalesStatus()">
                        💰 매출현황
                    </button>
                    <button class="nav-btn notification-btn" onclick="POSOrderScreen.showNotifications()">
                        🔔 <span class="notification-count">2</span>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * 메인 레이아웃 (2분할 구조)
     */
    renderMainLayout() {
        return `
            <div class="pos-main-layout">
                <!-- 좌측: 주문 관리 영역 -->
                <div class="left-panel">
                    ${this.renderOrderSection()}
                    ${this.renderPaymentSection()}
                </div>

                <!-- 우측: 메뉴 선택 영역 -->
                <div class="right-panel">
                    ${this.renderMenuSection()}
                    ${this.renderPaymentMethodSection()}
                </div>
            </div>
        `;
    },

    /**
     * 주문 내역 섹션 (카드 기반 모던 디자인)
     */
    renderOrderSection() {
        const posOrders = this.currentOrders.filter(
            (order) => !order.sessionId,
        );
        const tllOrderCount = this.tllOrders?.length || 0;

        return `
            <div class="order-section-modern">
                <!-- 주문 내역 탭 -->
                <div class="order-tabs">
                    <button class="order-tab active" data-tab="pos" onclick="POSOrderScreen.switchOrderTab('pos')">
                        💻 POS 주문 (${posOrders.length})
                    </button>
                    <button class="order-tab" data-tab="tll" onclick="POSOrderScreen.switchOrderTab('tll')">
                        📱 TLL 주문 (${tllOrderCount})
                    </button>
                </div>

                <!-- POS 주문 영역 -->
                <div class="order-content pos-content active" id="posOrderContent">
                    <div class="order-list-modern" id="posOrderList">
                        ${this.renderPOSOrderItemsModern()}
                    </div>
                </div>

                <!-- TLL 주문 영역 -->
                <div class="order-content tll-content" id="tllOrderContent">
                    <div class="tll-actions-bar">
                        <button class="refresh-btn" onclick="POSOrderScreen.refreshTLLOrders()" title="TLL 주문 새로고침">
                            <span class="refresh-icon">🔄</span>
                            새로고침
                        </button>
                    </div>
                    <div class="order-list-modern" id="tllOrderList">
                        ${this.renderTLLOrderItemsModern()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * POS 주문 아이템 렌더링 (테이블 형식)
     */
    renderPOSOrderItemsModern() {
        // 이미 통합된 데이터 사용 (재통합하지 않음)
        const posOrders = this.currentOrders.filter(
            (order) => !order.sessionId,
        );

        console.log("🎨 렌더링 시점 데이터 확인:", {
            전체주문수: this.currentOrders.length,
            POS주문수: posOrders.length,
            렌더링데이터: posOrders.map((order, index) => ({
                인덱스: index,
                메뉴명: order.menuName,
                수량: order.quantity,
                단가: order.price,
                관련티켓수: order.ticketIds?.length || 1,
                통합상태:
                    order.ticketIds?.length > 1 ? "다중티켓통합됨" : "단일티켓",
            })),
        });

        // 테이블 헤더는 항상 표시
        const tableHeader = `
            <table class="pos-order-table">
                <thead>
                    <tr>
                        <th class="col-menu">메뉴명</th>
                        <th class="col-price">단가</th>
                        <th class="col-quantity">수량</th>
                        <th class="col-total">합계</th>
                        <th class="col-status">상태</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // 주문이 있으면 주문 데이터, 없으면 빈 행들로 채움
        let tableBody = "";

        if (posOrders.length > 0) {
            tableBody = posOrders
                .map(
                    (order) => `
                <tr class="order-row ${order.isCart ? "cart-item" : ""}" data-order-id="${order.id}">
                    <td class="col-menu">
                        <div class="menu-info">
                            <strong>${order.menuName}</strong>
                            ${order.isCart ? '<span class="cart-badge">카트</span>' : ""}
                        </div>
                    </td>
                    <td class="col-price">
                        ${order.price.toLocaleString()}원
                    </td>
                    <td class="col-quantity">
                        <div class="quantity-control-table">
                            ${
                                order.isCart
                                    ? `
                                <button class="qty-btn minus" onclick="POSOrderScreen.changeCartQuantity(${order.originalCartIndex}, -1)">
                                    −
                                </button>
                                <span class="quantity-display">${order.quantity}</span>
                                <button class="qty-btn plus" onclick="POSOrderScreen.changeCartQuantity(${order.originalCartIndex}, 1)">
                                    +
                                </button>
                            `
                                    : `
                                <span class="quantity-display">${order.quantity}</span>
                            `
                            }
                        </div>
                    </td>
                    <td class="col-total">
                        <strong>${(order.price * order.quantity).toLocaleString()}원</strong>
                    </td>
                    <td class="col-status">
                        <span class="status-badge status-${order.cookingStatus?.toLowerCase() || "pending"}">
                            ${this.getStatusText(order.cookingStatus)}
                        </span>
                    </td>
                </tr>
            `,
                )
                .join("");
        } else {
            // 빈 행들로 기본 프레임 유지 (10개 빈 행)
            for (let i = 0; i < 10; i++) {
                tableBody += `
                    <tr class="empty-row">
                        <td class="col-menu"></td>
                        <td class="col-price"></td>
                        <td class="col-quantity"></td>
                        <td class="col-total"></td>
                        <td class="col-status"></td>
                    </tr>
                `;
            }
        }

        const tableFooter = `
                </tbody>
            </table>
        `;

        return tableHeader + tableBody + tableFooter;
    },

    /**
     * POS 주문 아이템 렌더링 (기존 호환성용)
     */
    renderPOSOrderItems() {
        return this.renderPOSOrderItemsModern();
    },

    /**
     * TLL 주문 아이템 렌더링 (모던 카드 스타일)
     */
    renderTLLOrderItemsModern() {
        if (!this.tllOrders || this.tllOrders.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📱</div>
                    <h4>TLL 주문이 없습니다</h4>
                    <p>고객이 앱에서 주문하면 여기에 표시됩니다</p>
                </div>
            `;
        }

        // 메뉴별로 수량 통합
        const consolidatedOrders = {};

        this.tllOrders.forEach((order) => {
            const key = `${order.menu_name}_${order.unit_price}`;
            if (consolidatedOrders[key]) {
                consolidatedOrders[key].quantity += order.quantity;
                consolidatedOrders[key].total_price += order.total_price;
            } else {
                consolidatedOrders[key] = {
                    menu_name: order.menu_name,
                    unit_price: order.unit_price,
                    quantity: order.quantity,
                    total_price: order.total_price,
                    item_status: order.item_status,
                    cook_station: order.cook_station,
                    order_id: order.order_id,
                };
            }
        });

        const consolidatedOrdersList = Object.values(consolidatedOrders);

        return consolidatedOrdersList
            .map(
                (order) => `
            <div class="order-card tll-order-card" data-order-id="${order.order_id}">
                <div class="order-card-header">
                    <div class="menu-info">
                        <h5 class="menu-name">${order.menu_name}</h5>
                        <span class="menu-price">${order.unit_price.toLocaleString()}원</span>
                    </div>
                    <div class="order-status-group">
                        <span class="cook-station-badge station-${order.cook_station?.toLowerCase() || "kitchen"}">
                            ${this.getCookStationText(order.cook_station)}
                        </span>
                        <span class="status-badge status-${order.item_status?.toLowerCase() || "pending"}">
                            ${this.getStatusText(order.item_status)}
                        </span>
                    </div>
                </div>

                <div class="order-card-body">
                    <div class="quantity-info">
                        <span class="quantity-label">주문 수량</span>
                        <span class="quantity-value">× ${order.quantity}</span>
                    </div>

                    <div class="total-info">
                        <span class="total-label">주문 금액</span>
                        <span class="total-value">${order.total_price.toLocaleString()}원</span>
                    </div>
                </div>

                <div class="order-card-footer">
                    <div class="tll-source-badge">
                        <span class="source-icon">📱</span>
                        <span>TLL 앱 주문</span>
                    </div>
                    <div class="order-time">
                        ${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                </div>
            </div>
        `,
            )
            .join("");
    },

    /**
     * TLL 주문 아이템 렌더링 (기존 호환성용)
     */
    renderTLLOrderItems() {
        return this.renderTLLOrderItemsModern();
    },

    /**
     * 결제/계산 섹션 (좌우 2분할)
     */
    renderPaymentSection() {
        // 카트 아이템들만 결제 계산에 포함
        const cartTotal = this.cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
        );
        const subtotal = cartTotal;
        const discount = 0; // TLL 할인 로직 추가 예정
        const total = subtotal - discount;

        return `
            <div class="payment-section">
                <div class="section-header">
                    <div class="payment-control-bar">
                        <button class="control-btn cancel-all" onclick="POSOrderScreen.cancelAllOrders()">
                            전체취소
                        </button>
                        <button class="control-btn cancel-selected" onclick="POSOrderScreen.cancelSelectedOrders()">
                            선택취소
                        </button>
                        <button class="control-btn quantity-add" onclick="POSOrderScreen.addQuantityToSelected()">
                            +
                        </button>
                        <button class="control-btn quantity-minus" onclick="POSOrderScreen.minusQuantityFromSelected()">
                            -
                        </button>
                    </div>
                </div>

                <div class="payment-content">
                    <!-- 좌측: 금액 계산 -->
                    <div class="payment-left">
                        <div class="payment-summary">
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
                            <div class="summary-row received">
                                <span>받은 금액:</span>
                                <input type="number" class="received-input" id="receivedAmount" placeholder="0" />
                            </div>
                            <div class="summary-row change">
                                <span>거스름돈:</span>
                                <span class="amount change-amount" id="changeAmount">0원</span>
                            </div>
                        </div>
                    </div>

                    <!-- 우측: TLL 사용자 정보 및 액션 버튼 -->
                    <div class="payment-right">
                        ${this.renderTLLUserInfo()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 메뉴 선택 섹션
     */
    renderMenuSection() {
        return `
            <div class="menu-section">
                <div class="section-header">
                    <h3>🍽️ 메뉴 선택</h3>
                    <div class="menu-categories" id="menuCategories">
                        ${this.renderMenuCategories()}
                    </div>
                </div>

                <div class="menu-grid" id="menuGrid">
                    ${this.renderMenuGrid()}
                </div>
            </div>
        `;
    },

    /**
     * 메뉴 카테고리 렌더링
     */
    renderMenuCategories() {
        const categories = [
            ...new Set(this.menuData.map((menu) => menu.category || "일반")),
        ];

        return categories
            .map(
                (category, index) => `
            <button class="category-tab ${index === 0 ? "active" : ""}"
                    data-category="${category}"
                    onclick="POSOrderScreen.selectCategory('${category}')">
                ${category}
            </button>
        `,
            )
            .join("");
    },

    /**
     * 메뉴 그리드 렌더링 (큰 버튼)
     */
    renderMenuGrid(selectedCategory = null) {
        const categories = [
            ...new Set(this.menuData.map((menu) => menu.category || "일반")),
        ];
        const activeCategory = selectedCategory || categories[0];

        const filteredMenu = this.menuData.filter(
            (menu) => (menu.category || "일반") === activeCategory,
        );

        // 핫메뉴 우선 정렬
        const sortedMenu = filteredMenu.sort((a, b) => {
            if (a.isHot && !b.isHot) return -1;
            if (!a.isHot && b.isHot) return 1;
            return 0;
        });

        return sortedMenu
            .map(
                (menu) => `
            <div class="menu-card ${menu.isHot ? "hot-menu" : ""}"
                 onclick="POSOrderScreen.addToCart(${menu.id}, '${menu.name}', ${menu.price})">
                ${menu.isHot ? '<div class="hot-badge">🔥 HOT</div>' : ""}
                <div class="menu-image">
                    ${this.getMenuIcon(menu.category)}
                </div>
                <div class="menu-info">
                    <div class="menu-name">${menu.name}</div>
                    <div class="menu-price">${menu.price.toLocaleString()}원</div>
                </div>
                <div class="add-btn">+</div>
            </div>
        `,
            )
            .join("");
    },

    /**
     * 결제 수단 섹션 (3열 2행 - 6개 기능)
     */
    renderPaymentMethodSection() {
        return `
            <div class="payment-method-section">
                <div class="section-header">
                    <h3>💳 결제 기능</h3>
                </div>

                <div class="payment-methods-grid">
                    <button class="payment-method-btn ${this.selectedPaymentMethod === "card" ? "active" : ""}" id="cardPaymentBtn"
                            onclick="POSOrderScreen.selectPaymentMethod('card')">
                        <div class="method-icon">💳</div>
                        <div class="method-name">카드</div>
                    </button>

                    <button class="payment-method-btn ${this.selectedPaymentMethod === "cash" ? "active" : ""}" id="cashPaymentBtn"
                            onclick="POSOrderScreen.selectPaymentMethod('cash')">
                        <div class="method-icon">💵</div>
                        <div class="method-name">현금</div>
                    </button>

                    <button class="payment-method-btn ${this.selectedPaymentMethod === "mixed" ? "active" : ""}"
                            onclick="POSOrderScreen.selectPaymentMethod('mixed')">
                        <div class="method-icon">🔄</div>
                        <div class="method-name">복합결제</div>
                    </button>

                    <button class="payment-method-btn"
                            onclick="POSOrderScreen.confirmOrder()">
                        <div class="method-icon">📋</div>
                        <div class="method-name">주문</div>
                    </button>

                    <button class="payment-method-btn"
                            onclick="POSOrderScreen.showDutchPay()">
                        <div class="method-icon">🤝</div>
                        <div class="method-name">더치페이</div>
                    </button>

                    <button class="payment-method-btn"
                            onclick="POSOrderScreen.showReceiptManagement()">
                        <div class="method-icon">🧾</div>
                        <div class="method-name">영수증관리</div>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * TLL 사용자 정보 렌더링
     */
    renderTLLUserInfo() {
        if (!this.tllUserInfo) {
            return `
                <div class="tll-user-info">
                    <div class="tll-user-header">
                        <span>📱 TLL 연동 정보</span>
                    </div>
                    <div class="no-tll-user">
                        <span>연동된 TLL 사용자 없음</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="tll-user-info">
                <div class="tll-user-header">
                    <span>📱 TLL 연동 사용자</span>
                </div>
                <div class="tll-user-details">
                    <div class="user-detail-row">
                        <span class="detail-label">이름:</span>
                        <span class="detail-value">${this.tllUserInfo.name || "게스트"}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="detail-label">연락처:</span>
                        <span class="detail-value">${this.tllUserInfo.phone || this.tllUserInfo.guest_phone || "-"}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="detail-label">주문 시간:</span>
                        <span class="detail-value">${this.tllUserInfo.created_at ? new Date(this.tllUserInfo.created_at).toLocaleTimeString() : "-"}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="detail-label">포인트:</span>
                        <span class="detail-value">${(this.tllUserInfo.point || 0).toLocaleString()}P</span>
                    </div>
                </div>
                <div class="tll-action-buttons">
                    ${this.renderTLLConnectionButton()}
                    <button class="tll-action-btn end-session" onclick="POSOrderScreen.endTLLSession()">
                        <span class="btn-icon">🔚</span>
                        <span class="btn-text">TLL 세션 종료</span>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * TLL 연동 버튼 렌더링
     */
    renderTLLConnectionButton() {
        // 현재 TLL 주문의 is_mixed 상태 확인
        const isMixed = this.checkTLLOrderMixedStatus();

        if (isMixed) {
            return `
                <button class="tll-action-btn tll-connect disabled" disabled>
                    <span class="btn-icon">✅</span>
                    <span class="btn-text">TLL 연동 완료</span>
                </button>
            `;
        } else {
            return `
                <button class="tll-action-btn tll-connect" onclick="POSOrderScreen.enableTLLConnection()">
                    <span class="btn-icon">🔗</span>
                    <span class="btn-text">TLL 연동</span>
                </button>
            `;
        }
    },

    /**
     * TLL 주문의 is_mixed 상태 확인
     */
    checkTLLOrderMixedStatus() {
        if (!this.tllOrders || this.tllOrders.length === 0) {
            return false;
        }

        // TLL 주문이 있으면 해당 주문의 is_mixed 상태를 확인 (추후 API에서 받아올 예정)
        // 현재는 임시로 false 반환
        return this.tllOrderMixedStatus || false;
    },

    /**
     * 기존 주문 로드 (DB에서 order_items 직접 로드, 수량 통합, UNPAID만)
     */
    async loadCurrentOrders(storeId, tableNumber) {
        try {
            console.log(
                `🔍 POS 주문 로드 시작: 매장 ${storeId}, 테이블 ${tableNumber}`,
            );

            // 기존 데이터 완전 초기화 (중복 방지)
            this.currentOrders = [];

            // POS 주문 로드 (order_items 기준, UNPAID 상태만)
            const response = await fetch(
                `/api/pos/stores/${storeId}/table/${tableNumber}/order-items`,
            );
            const data = await response.json();

            console.log(`📊 POS 주문 API 응답:`, {
                success: data.success,
                itemCount: data.orderItems?.length || 0,
                hasItems: !!(data.orderItems && data.orderItems.length > 0),
            });

            if (data.success && data.orderItems && data.orderItems.length > 0) {
                // 추가 필터링: 확실히 미지불 상태만 (PAID 상태 완전 배제)
                const unpaidItems = data.orderItems.filter((item) => {
                    const isUnpaid = item.paid_status === "UNPAID";
                    const isPaid = item.paid_status === "PAID";
                    const isActiveOrder = item.order_status === "OPEN";
                    const isActiveItem = !["CANCELLED", "REFUNDED"].includes(
                        item.item_status,
                    );

                    // PAID 상태는 무조건 제외
                    if (isPaid) {
                        console.warn(`🚫 PAID 상태 아이템 제거:`, {
                            menu_name: item.menu_name,
                            paid_status: item.paid_status,
                            ticket_id: item.ticket_id,
                        });
                        return false;
                    }

                    const shouldInclude =
                        isUnpaid && isActiveOrder && isActiveItem;

                    if (!shouldInclude) {
                        console.log(`🚫 필터링된 아이템:`, {
                            menu_name: item.menu_name,
                            paid_status: item.paid_status,
                            order_status: item.order_status,
                            item_status: item.item_status,
                            reason:
                                !isUnpaid
                                    ? "not_unpaid"
                                    : !isActiveOrder
                                      ? "closed_order"
                                      : "inactive_item",
                        });
                    }

                    return shouldInclude;
                });

                console.log(
                    `📋 필터링 결과: ${data.orderItems.length}개 → ${unpaidItems.length}개 (미지불만)`,
                );

                // 완전 통합 처리
                this.currentOrders = this.consolidateOrderItems(unpaidItems);

                console.log(`✅ 통합 완료 - 최종 결과:`, {
                    원본아이템수: unpaidItems.length,
                    통합후메뉴수: this.currentOrders.length,
                    통합데이터: this.currentOrders.map((order) => ({
                        메뉴명: order.menuName,
                        수량: order.quantity,
                        관련티켓수: order.ticketIds?.length || 1,
                    })),
                });
            } else {
                this.currentOrders = [];
                console.log(`ℹ️ 로드할 주문이 없음`);
            }

            // TLL 주문 로드
            await this.loadTLLOrders(storeId, tableNumber);
        } catch (error) {
            console.error("❌ 기존 주문 로드 실패:", error);
            this.currentOrders = [];
        }
    },

    /**
     * 주문 아이템 통합 처리 (중복 방지 강화)
     */
    consolidateOrderItems(unpaidItems) {
        console.log(
            `🔄 주문 아이템 통합 처리 시작: ${unpaidItems.length}개 아이템`,
        );

        const consolidatedOrders = {};
        const processedKeys = new Set(); // 중복 방지용

        unpaidItems.forEach((item, index) => {
            // 메뉴명과 단가만으로 통합 키 생성 (티켓 무관하게 통합)
            const consolidationKey = `${item.menu_name.trim()}_${item.unit_price}`;

            // 이미 처리된 키인지 확인
            if (processedKeys.has(consolidationKey)) {
                console.log(`🔄 기존 키에 수량 추가: ${consolidationKey}`);
                consolidatedOrders[consolidationKey].quantity += item.quantity;

                // 티켓 ID 중복 방지하면서 추가
                if (
                    !consolidatedOrders[consolidationKey].ticketIds.includes(
                        item.ticket_id,
                    )
                ) {
                    consolidatedOrders[consolidationKey].ticketIds.push(
                        item.ticket_id,
                    );
                }

                // 아이템 ID 추가
                consolidatedOrders[consolidationKey].orderItemIds.push(item.id);
            } else {
                // 새로운 통합 키 생성
                processedKeys.add(consolidationKey);
                consolidatedOrders[consolidationKey] = {
                    id: item.menu_id || item.id,
                    menuName: item.menu_name,
                    price: item.unit_price,
                    quantity: item.quantity,
                    cookingStatus: item.item_status || "PENDING",
                    isCart: false,
                    orderItemId: item.id,
                    orderItemIds: [item.id],
                    ticketId: item.ticket_id,
                    ticketIds: [item.ticket_id],
                    cookStation: item.cook_station || "KITCHEN",
                };

                console.log(
                    `➕ 새 통합 메뉴 생성: ${item.menu_name} (키: ${consolidationKey})`,
                );
            }
        });

        const consolidatedArray = Object.values(consolidatedOrders);

        // 최종 중복 검증
        const finalCheck = {};
        consolidatedArray.forEach((order) => {
            const checkKey = `${order.menuName}_${order.price}`;
            if (finalCheck[checkKey]) {
                console.error(`❌ 최종 검증에서 중복 발견: ${checkKey}`);
            } else {
                finalCheck[checkKey] = true;
            }
        });

        console.log(
            `✅ 통합 처리 완료: ${unpaidItems.length}개 → ${consolidatedArray.length}개`,
        );
        return consolidatedArray;
    },

    /**
     * TLL 주문 로드
     */
    async loadTLLOrders(storeId, tableNumber) {
        try {
            console.log(
                `🔍 TLL 주문 로드 시작: 매장 ${storeId}, 테이블 ${tableNumber}`,
            );

            const url = `/api/pos/stores/${storeId}/table/${tableNumber}/tll-orders`;
            console.log(`📡 TLL 주문 API 호출: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `API 요청 실패 (${response.status}): ${errorText}`,
                );
            }

            const data = await response.json();
            console.log(`📊 TLL 주문 API 응답:`, data);

            if (data.success) {
                this.tllOrders = data.tllOrders || [];
                this.tllUserInfo = data.userInfo || null;

                console.log(`✅ TLL 주문 ${this.tllOrders.length}개 로드 완료`);
                console.log(
                    `👤 TLL 사용자 정보:`,
                    this.tllUserInfo?.name || "없음",
                );

                // TLL 주문 세부 정보 로깅
                if (this.tllOrders.length > 0) {
                    console.log(
                        `📋 TLL 주문 첫 번째 아이템:`,
                        this.tllOrders[0],
                    );
                }
            } else {
                console.warn("⚠️ TLL 주문 API 응답이 실패 상태:", data.error);
                this.tllOrders = [];
                this.tllUserInfo = null;
            }
        } catch (error) {
            console.error("❌ TLL 주문 로드 실패:", error);
            console.error("❌ 에러 상세:", {
                message: error.message,
                stack: error.stack,
                storeId,
                tableNumber,
            });
            this.tllOrders = [];
            this.tllUserInfo = null;
        }
    },

    /**
     * 메뉴 데이터 로드
     */
    async loadMenuData(storeId) {
        try {
            const response = await fetch(`/api/pos/stores/${storeId}/menu`);
            const data = await response.json();

            if (data.success) {
                this.menuData = data.menu.map((menu) => ({
                    ...menu,
                    isHot: Math.random() > 0.7, // 임시 핫메뉴 로직
                }));
            } else {
                this.menuData = this.getDefaultMenu();
            }

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
     * 결제 수단 선택
     */
    selectPaymentMethod(method) {
        this.selectedPaymentMethod = method;

        // 모든 버튼 비활성화
        document.querySelectorAll(".payment-method-btn").forEach((btn) => {
            btn.classList.remove("active");
        });

        // 선택된 버튼 활성화
        const selectedBtn = document.getElementById(`${method}PaymentBtn`);
        if (selectedBtn) {
            selectedBtn.classList.add("active");
        }

        console.log(`💳 결제 방법 선택: ${method}`);

        // 약간의 지연을 두고 결제 모달 표시 (UI 업데이트 완료 대기)
        setTimeout(() => {
            this.showPOSPaymentModal(method);
        }, 50);
    },

    /**
     * 장바구니에 추가 (프론트엔드 카트 관리)
     */
    async addToCart(
        menuId,
        menuName,
        price,
        storeId = null,
        cookStation = null,
    ) {
        try {
            // 파라미터로 받은 값들 우선 사용, 없으면 기본값 설정
            const finalStoreId = storeId || POSCore.storeId;

            let finalCookStation = cookStation;
            if (!finalCookStation) {
                // 메뉴 데이터에서 cook_station 정보 가져오기
                const menuItem = this.menuData.find(
                    (menu) => menu.id === menuId,
                );
                finalCookStation =
                    menuItem?.cook_station ||
                    menuItem?.category ||
                    this.getCookStationByMenu(menuName);
            }

            // 기존 카트에서 같은 메뉴 찾기
            const existingItem = this.cart.find(
                (item) =>
                    item.id === menuId &&
                    item.name === menuName &&
                    item.price === price,
            );

            if (existingItem) {
                // 기존 아이템 수량 증가
                existingItem.quantity += 1;
                console.log(
                    `🔄 카트 수량 증가: ${menuName} (${existingItem.quantity}개)`,
                );
            } else {
                // 새 아이템 추가
                this.cart.push({
                    id: menuId,
                    menuId: menuId, // 명시적으로 menuId 필드 추가
                    name: menuName,
                    price: price,
                    quantity: 1,
                    store_id: finalStoreId, // 파라미터로 받은 매장 ID 사용
                    cook_station: finalCookStation, // 파라미터로 받은 조리스테이션 사용
                });
                console.log(
                    `➕ 카트 새 아이템 추가: ${menuName} (매장: ${finalStoreId}, 조리스테이션: ${finalCookStation})`,
                );
            }

            // UI 업데이트 (테이블 선택 여부와 관계없이)
            await this.updateCartDisplay();
            this.showToast(`${menuName} 카트에 추가됨`);
        } catch (error) {
            console.error("❌ 카트 추가 실패:", error);
            // 에러가 발생해도 카트에는 추가되도록 처리
            console.log("⚠️ API 호출 실패했지만 카트 업데이트는 계속 진행");
            this.showToast(`${menuName} 카트에 추가됨 (오프라인 모드)`);
        }
    },

    /**
     * 카트 표시 업데이트 (기존 주문내역 + 카트 순차적 표시)
     */
    async updateCartDisplay() {
        // 테이블이 선택된 경우에만 기존 주문내역 로드
        if (this.currentTable && POSCore.storeId) {
            await this.loadCurrentOrders(POSCore.storeId, this.currentTable);
        }

        // 기존 주문내역과 카트 아이템을 합쳐서 표시
        const cartOrders = this.cart.map((item, index) => ({
            id: `cart_${index}`,
            menuName: item.name,
            price: item.price,
            quantity: item.quantity,
            cookingStatus: "CART",
            isCart: true,
            originalCartIndex: index,
        }));

        // 기존 주문내역을 먼저 표시하고, 그 다음에 카트 아이템들 표시
        const allOrders = [...this.currentOrders, ...cartOrders];

        // tbody만 업데이트 (테이블 구조 유지)
        const posOrderTable = document.querySelector(".pos-order-table tbody");
        if (posOrderTable) {
            let tableBody = "";

            // 모든 주문 (기존 + 카트) 순차적 표시
            if (allOrders.length > 0) {
                tableBody = allOrders
                    .map(
                        (order) => `
                    <tr class="order-row ${order.isCart ? "cart-item" : ""}" data-order-id="${order.id}">
                        <td class="col-menu">
                            <div class="menu-info">
                                <strong>${order.menuName}</strong>
                                ${order.isCart ? '<span class="cart-badge">카트</span>' : ""}
                            </div>
                        </td>
                        <td class="col-price">
                            ${order.price.toLocaleString()}원
                        </td>
                        <td class="col-quantity">
                            <div class="quantity-control-table">
                                ${
                                    order.isCart
                                        ? `
                                    <button class="qty-btn minus" onclick="POSOrderScreen.changeCartQuantity(${order.originalCartIndex}, -1)">
                                        −
                                    </button>
                                    <span class="quantity-display">${order.quantity}</span>
                                    <button class="qty-btn plus" onclick="POSOrderScreen.changeCartQuantity(${order.originalCartIndex}, 1)">
                                        +
                                    </button>
                                `
                                        : `
                                    <span class="quantity-display">${order.quantity}</span>
                                `
                                }
                            </div>
                        </td>
                        <td class="col-total">
                            <strong>${(order.price * order.quantity).toLocaleString()}원</strong>
                        </td>
                        <td class="col-status">
                            <span class="status-badge status-${order.cookingStatus?.toLowerCase() || "pending"}">
                                ${this.getStatusText(order.cookingStatus)}
                            </span>
                        </td>
                    </tr>
                `,
                    )
                    .join("");
            }

            // 남은 빈 행들 추가 (총 10행 유지)
            const remainingRows = Math.max(0, 10 - allOrders.length);
            for (let i = 0; i < remainingRows; i++) {
                tableBody += `
                    <tr class="empty-row">
                        <td class="col-menu"></td>
                        <td class="col-price"></td>
                        <td class="col-quantity"></td>
                        <td class="col-total"></td>
                        <td class="col-status"></td>
                    </tr>
                `;
            }

            // tbody 내용만 업데이트
            posOrderTable.innerHTML = tableBody;
        }

        // 결제 섹션 업데이트 (카트 아이템들만 계산에 포함)
        const paymentSection = document.querySelector(".payment-section");
        if (paymentSection) {
            const newPaymentSection = document.createElement("div");
            newPaymentSection.innerHTML = this.renderPaymentSection();
            paymentSection.replaceWith(newPaymentSection.firstElementChild);
        }
    },

    /**
     * 주문 새로고침 (결제 완료 후 확실한 데이터 갱신)
     */
    async refreshOrders() {
        console.log("🔄 주문 새로고침 시작 - 기존 데이터 초기화");

        // 기존 데이터 완전 초기화
        this.currentOrders = [];
        this.cart = [];
        this.tllOrders = [];
        this.tllUserInfo = null;

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
            posOrderList.innerHTML = this.renderPOSOrderItemsModern();
            console.log(
                `✅ POS 주문 목록 UI 업데이트 완료: ${this.currentOrders.length}개 주문`,
            );
        }

        // TLL 주문 목록 업데이트
        const tllOrderList = document.getElementById("tllOrderList");
        if (tllOrderList) {
            tllOrderList.innerHTML = this.renderTLLOrderItemsModern();
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

        console.log(
            `✅ 주문 새로고침 완료 - POS: ${this.currentOrders.length}개, TLL: ${this.tllOrders?.length || 0}개`,
        );
    },

    /**
     * 카트 아이템 수량 변경
     */
    changeCartQuantity(cartIndex, change) {
        if (cartIndex < 0 || cartIndex >= this.cart.length) return;

        const item = this.cart[cartIndex];
        const newQuantity = item.quantity + change;

        if (newQuantity <= 0) {
            // 아이템 제거
            this.cart.splice(cartIndex, 1);
            console.log(`🗑️ 카트에서 제거: ${item.name}`);
        } else {
            // 수량 변경
            item.quantity = newQuantity;
            console.log(`🔄 카트 수량 변경: ${item.name} (${newQuantity}개)`);
        }

        this.updateCartDisplay();
    },

    /**
     * 카트 아이템 제거
     */
    removeCartItem(cartIndex) {
        if (cartIndex < 0 || cartIndex >= this.cart.length) return;

        const item = this.cart[cartIndex];
        this.cart.splice(cartIndex, 1);
        console.log(`🗑️ 카트에서 제거: ${item.name}`);

        this.updateCartDisplay();
        this.showToast(`${item.name} 제거됨`);
    },

    /**
     * 주문 확정 (카트 -> 서버 전송)
     * 비회원 POS 주문 지원 + TLL 연동 지원
     */
    async confirmOrder() {
        try {
            if (this.cart.length === 0) {
                alert("주문할 메뉴가 없습니다.");
                return;
            }

            const total = this.cart.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
            );

            // TLL 연동 상태 확인
            const hasTLLOrders = this.tllOrders && this.tllOrders.length > 0;
            const isTLLMixed = this.checkTLLOrderMixedStatus();

            let confirmMessage = `${this.cart.length}개 메뉴, 총 ${total.toLocaleString()}원을 주문하시겠습니까?`;

            if (hasTLLOrders && isTLLMixed) {
                confirmMessage = `${this.cart.length}개 메뉴, 총 ${total.toLocaleString()}원을 기존 TLL 주문에 추가하시겠습니까?\n\n` +
                               `• 기존 TLL 주문과 함께 하나의 계산서로 처리됩니다`;
            } else if (hasTLLOrders && !isTLLMixed) {
                confirmMessage = `${this.cart.length}개 메뉴, 총 ${total.toLocaleString()}원을 별도 주문으로 생성하시겠습니까?\n\n` +
                               `• TLL 주문과 별도의 계산서로 처리됩니다\n` +
                               `• TLL 연동을 원하시면 먼저 "TLL 연동" 버튼을 클릭하세요`;
            }

            if (!confirm(confirmMessage)) {
                return;
            }

            // 필수 정보 검증 및 설정
            const storeId = this.currentStoreId || POSCore.storeId;
            const tableNumber = this.currentTableNumber || this.currentTable;

            if (!storeId || !tableNumber) {
                alert("매장 ID 또는 테이블 번호가 설정되지 않았습니다.");
                console.error("❌ 필수 정보 누락:", { storeId, tableNumber });
                return;
            }

            console.log("📋 POS 주문 확정 시작:", {
                storeId: storeId,
                tableNumber: tableNumber,
                cartItems: this.cart.length,
                totalAmount: total,
                hasTLLOrders: hasTLLOrders,
                isTLLMixed: isTLLMixed,
            });

            // TLL 연동 상태에 따라 다른 API 사용
            let apiEndpoint = "/api/pos/guest-orders/confirm";
            let requestBody = {
                storeId: parseInt(storeId),
                tableNumber: parseInt(tableNumber),
                items: this.cart,
                totalAmount: total,
            };

            if (hasTLLOrders && isTLLMixed) {
                // TLL 연동된 경우: 기존 주문에 추가
                apiEndpoint = "/api/pos/orders/confirm";
                requestBody.mergeWithExisting = true;
                requestBody.existingOrderId = this.tllOrders[0].order_id;
                console.log("🔗 TLL 연동 주문으로 처리: 기존 주문에 추가");
            } else {
                // TLL 미연동 또는 TLL 없는 경우: 새 주문 생성
                console.log("📝 별도 POS 주문으로 처리");
            }

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "주문 확정 실패");
            }

            const result = await response.json();
            console.log("✅ POS 주문 확정 완료:", result);

            // 세션 정보 업데이트 (새 주문 ID로)
            this.currentSession = {
                orderId: result.orderId,
                tableNumber: this.currentTable,
                storeId: POSCore.storeId,
            };
            this.sessionItems = this.cart.map((item) => ({
                ...item,
                ticketId: result.ticketId,
            })); // 임시 ticketId

            // 카트 초기화
            this.cart = [];

            // 주문 목록 새로고침 (DB에서 최신 order_items 로드)
            await this.loadCurrentOrders(POSCore.storeId, this.currentTable);

            // tbody 업데이트 (카트 없이 기존 주문내역만 표시)
            const posOrderTable = document.querySelector(
                ".pos-order-table tbody",
            );
            if (posOrderTable) {
                let tableBody = "";

                if (this.currentOrders.length > 0) {
                    tableBody = this.currentOrders
                        .map(
                            (order) => `
                        <tr class="order-row" data-order-id="${order.id}">
                            <td class="col-menu">
                                <div class="menu-info">
                                    <strong>${order.menuName}</strong>
                                </div>
                            </td>
                            <td class="col-price">
                                ${order.price.toLocaleString()}원
                            </td>
                            <td class="col-quantity">
                                <div class="quantity-control-table">
                                    <span class="quantity-display">${order.quantity}</span>
                                </div>
                            </td>
                            <td class="col-total">
                                <strong>${(order.price * order.quantity).toLocaleString()}원</strong>
                            </td>
                            <td class="col-status">
                                <span class="status-badge status-${order.cookingStatus?.toLowerCase() || "pending"}">
                                    ${this.getStatusText(order.cookingStatus)}
                                </span>
                            </td>
                        </tr>
                    `,
                        )
                        .join("");
                }

                // 남은 빈 행들 추가
                const remainingRows = Math.max(
                    0,
                    10 - this.currentOrders.length,
                );
                for (let i = 0; i < remainingRows; i++) {
                    tableBody += `
                        <tr class="empty-row">
                            <td class="col-menu"></td>
                            <td class="col-price"></td>
                            <td class="col-quantity"></td>
                            <td class="col-total"></td>
                            <td class="col-status"></td>
                        </tr>
                    `;
                }

                posOrderTable.innerHTML = tableBody;
            }

            // 결제 섹션 업데이트
            const paymentSection = document.querySelector(".payment-section");
            if (paymentSection) {
                const newPaymentSection = document.createElement("div");
                newPaymentSection.innerHTML = this.renderPaymentSection();
                paymentSection.replaceWith(newPaymentSection.firstElementChild);
            }

            const orderType = result.isGuestOrder ? "비회원" : "일반";
            this.showToast(
                `${orderType} 주문이 확정되었습니다 (티켓 ID: ${result.ticketId})`,
            );

            console.log("✅ 주문 확정 후 화면 전환");
            // 주문 완료 후 테이블 맵 화면 전환
            setTimeout(() => {
                POSCore.showTableMap();
            }, 2000);
        } catch (error) {
            console.error("❌ 비회원 주문 확정 실패:", error);
            alert(`비회원 주문 확정 실패: ${error.message}`);
        }
    },

    /**
     * 결제 처리
     */
    async processPayment(method) {
        console.log(`💳 ${method} 결제 처리 시작`);

        try {
            // 결제 버튼 비활성화
            const paymentBtns = document.querySelectorAll(
                ".payment-method-btn",
            );
            paymentBtns.forEach((btn) => {
                btn.disabled = true;
                btn.style.opacity = "0.5";
            });

            // 1. 현재 테이블의 미지불 티켓 조회 (storeId와 tableNumber 기반)
            if (!this.currentStoreId || !this.currentTableNumber) {
                alert("매장 또는 테이블 정보가 없습니다.");
                return;
            }

            // 먼저 현재 테이블의 활성 주문을 찾아서 orderId 확인
            const activeOrderResponse = await fetch(
                `/api/pos/stores/${this.currentStoreId}/table/${this.currentTableNumber}/active-order`,
            );

            if (!activeOrderResponse.ok) {
                const errorText = await activeOrderResponse.text();
                console.error(
                    `❌ 활성 주문 조회 실패 (${activeOrderResponse.status}):`,
                    errorText,
                );
                alert("활성 주문을 조회할 수 없습니다.");
                return;
            }

            const activeOrderData = await activeOrderResponse.json();
            console.log("📋 활성 주문 조회 응답:", activeOrderData);

            if (
                !activeOrderData.success ||
                !activeOrderData.hasActiveOrder ||
                !activeOrderData.orderId
            ) {
                alert("결제할 활성 주문이 없습니다.");
                return;
            }

            const orderId = activeOrderData.orderId;
            console.log(`📋 결제 대상 주문 ID: ${orderId}`);

            // 2. 미지불 티켓 조회
            const unpaidResponse = await fetch(
                `/api/pos-payment/unpaid-tickets/${orderId}`,
            );
            const unpaidData = await unpaidResponse.json();

            if (!unpaidData.success || unpaidData.totalTickets === 0) {
                alert("결제할 미지불 티켓이 없습니다.");
                return;
            }

            console.log(
                `📋 결제할 티켓: ${unpaidData.totalTickets}개, 총 금액: ${unpaidData.totalAmount}원`,
            );

            // 3. 결제 처리 요청
            const paymentResponse = await fetch("/api/pos-payment/process", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: orderId,
                    paymentMethod: method.toUpperCase(),
                    amount: unpaidData.totalAmount,
                    storeId: this.currentStoreId,
                    tableNumber: this.currentTableNumber,
                }),
            });

            const paymentResult = await paymentResponse.json();

            if (paymentResult.success) {
                // 결제 성공
                console.log("✅ 결제 완료:", paymentResult);

                const methodName = method === "card" ? "카드" : "현금";
                alert(
                    `${methodName} 결제가 완료되었습니다!\n` +
                        `결제 금액: ${paymentResult.amount.toLocaleString()}원\n` +
                        `처리된 티켓: ${paymentResult.totalTicketsPaid}개`,
                );

                // 장바구니 초기화
                this.clearCart();

                // 기존 주문 데이터 초기화 (캐시 제거)
                this.currentOrders = [];
                this.tllOrders = [];
                this.tllUserInfo = null;

                // 잠시 대기 후 강제 새로고침 (DB 업데이트 반영 시간)
                setTimeout(async () => {
                    console.log("🔄 결제 완료 후 강제 데이터 새로고침");

                    // 화면 새로고침
                    await this.refreshOrders();

                    // 결제 완료 후 화면 재렌더링
                    await this.render(
                        this.currentStoreId,
                        { name: "매장" },
                        this.currentTableNumber,
                    );
                }, 1000);
            } else {
                throw new Error(paymentResult.error || "결제 처리 실패");
            }
        } catch (error) {
            console.error("❌ 결제 처리 실패:", error);
            alert(`결제 처리 중 오류가 발생했습니다:\n${error.message}`);
        } finally {
            // 결제 버튼 다시 활성화
            const paymentBtns = document.querySelectorAll(
                ".payment-method-btn",
            );
            paymentBtns.forEach((btn) => {
                btn.disabled = false;
                btn.style.opacity = "1";
            });
        }
    },

    /**
     * POSPaymentModal을 사용한 결제 모달 표시 (API 기반)
     */
    async showPOSPaymentModal(method) {
        console.log("✨ POSPaymentModal 결제 모달 표시 (API 기반)");

        // 필수 정보 검증
        if (!this.currentStoreId || !this.currentTableNumber) {
            console.error("❌ 매장 ID 또는 테이블 번호가 설정되지 않았습니다");
            alert("매장 또는 테이블 정보가 설정되지 않았습니다.");
            return;
        }

        try {
            // 즉시 POSPaymentModal 사용 가능 여부 확인
            const modalAvailability = this.checkPOSPaymentModalAvailability();

            if (modalAvailability.isAvailable) {
                console.log("✅ POSPaymentModal 즉시 사용 가능");
                await modalAvailability.modalRef.show(method);
                return;
            }

            // 사용 불가능한 경우 짧은 대기 시도
            console.log("🔄 POSPaymentModal 로딩 대기 시작");
            const waitResult = await this.waitForPOSPaymentModal(3000); // 3초 대기

            if (waitResult.success) {
                console.log("✅ 대기 후 POSPaymentModal 로드 완료");
                await waitResult.modalRef.show(method);
                return;
            }

            // 로딩 실패 시 상세 정보 출력 및 폴백 처리
            console.error(
                "❌ POSPaymentModal 로딩 최종 실패:",
                waitResult.details,
            );
            this.handlePaymentModalFailure(method);
        } catch (error) {
            console.error("❌ 결제 모달 표시 중 오류:", error);
            this.handlePaymentModalFailure(method, error);
        }
    },

    /**
     * POSPaymentModal 사용 가능 여부 즉시 확인
     */
    checkPOSPaymentModalAvailability() {
        const checks = [
            {
                name: "window.POSPaymentModal",
                ref: window.POSPaymentModal,
                hasShow: typeof window.POSPaymentModal?.show === "function",
            },
            {
                name: "globalThis.POSPaymentModal",
                ref: globalThis.POSPaymentModal,
                hasShow: typeof globalThis.POSPaymentModal?.show === "function",
            },
            {
                name: "global POSPaymentModal",
                ref:
                    typeof POSPaymentModal !== "undefined"
                        ? POSPaymentModal
                        : null,
                hasShow: typeof POSPaymentModal?.show === "function",
            },
        ];

        for (const check of checks) {
            if (check.ref && check.hasShow) {
                console.log(`✅ ${check.name}에서 POSPaymentModal 발견`);
                return {
                    isAvailable: true,
                    modalRef: check.ref,
                    source: check.name,
                };
            }
        }

        return {
            isAvailable: false,
            checks: checks.map((c) => ({
                name: c.name,
                exists: !!c.ref,
                hasShow: c.hasShow,
            })),
        };
    },

    /**
     * POSPaymentModal 로딩 대기
     */
    async waitForPOSPaymentModal(timeoutMs = 3000) {
        const startTime = Date.now();
        const checkInterval = 100;

        while (Date.now() - startTime < timeoutMs) {
            const availability = this.checkPOSPaymentModalAvailability();

            if (availability.isAvailable) {
                return {
                    success: true,
                    modalRef: availability.modalRef,
                    source: availability.source,
                    waitTime: Date.now() - startTime,
                };
            }

            await new Promise((resolve) => setTimeout(resolve, checkInterval));
        }

        return {
            success: false,
            details: {
                timeoutReached: true,
                waitTime: Date.now() - startTime,
                finalCheck: this.checkPOSPaymentModalAvailability(),
            },
        };
    },

    /**
     * 결제 모달 로딩 실패 처리
     */
    handlePaymentModalFailure(method, error = null) {
        console.log("🔄 결제 모달 실패 처리 시작");

        const errorMessage = error
            ? `결제 모달 오류: ${error.message}`
            : "결제 모달을 불러올 수 없습니다.";

        const userMessage = `${errorMessage}\n\n기본 결제 처리를 진행하시겠습니까?`;

        if (confirm(userMessage)) {
            console.log("🔄 사용자가 폴백 결제 처리 선택");
            this.processPayment(method.toLowerCase()).catch((fallbackError) => {
                console.error("❌ 폴백 결제 처리 실패:", fallbackError);
                alert(
                    `결제 처리 실패: ${fallbackError.message}\n\n시스템 관리자에게 문의하거나 페이지를 새로고침해주세요.`,
                );
            });
        } else {
            console.log("ℹ️ 사용자가 결제 취소 선택");
        }
    },

    /**
     * API 호출로 결제 대상 데이터 조회
     */
    async fetchPaymentTargetData(method = "card") {
        console.log(
            `🔍 결제 대상 데이터 조회: 매장 ${this.currentStoreId}, 테이블 ${this.currentTableNumber}`,
        );

        try {
            // 1. 현재 테이블의 활성 주문 조회
            const activeOrderResponse = await fetch(
                `/api/pos/stores/${this.currentStoreId}/table/${this.currentTableNumber}/active-order`,
            );

            if (!activeOrderResponse.ok) {
                console.warn("⚠️ 활성 주문 조회 실패");
                return null;
            }

            const activeOrderData = await activeOrderResponse.json();

            if (!activeOrderData.success || !activeOrderData.hasActiveOrder) {
                console.log("ℹ️ 활성 주문이 없습니다");
                return null;
            }

            const orderId = activeOrderData.orderId;

            // 2. 미지불 티켓 정보 조회
            const unpaidResponse = await fetch(
                `/api/pos-payment/unpaid-tickets/${orderId}`,
            );

            if (!unpaidResponse.ok) {
                throw new Error("미지불 티켓 조회 실패");
            }

            const unpaidData = await unpaidResponse.json();

            if (!unpaidData.success || unpaidData.totalTickets === 0) {
                console.log("ℹ️ 미지불 티켓이 없습니다");
                return null;
            }

            // 3. 주문 상세 정보 조회 (주문 아이템들)
            const orderItemsResponse = await fetch(
                `/api/pos/stores/${this.currentStoreId}/table/${this.currentTableNumber}/order-items`,
            );

            let orderItems = [];
            if (orderItemsResponse.ok) {
                const orderItemsData = await orderItemsResponse.json();
                if (orderItemsData.success && orderItemsData.orderItems) {
                    orderItems = orderItemsData.orderItems;
                }
            }

            console.log(
                `✅ 결제 대상 데이터 조회 완료: ${unpaidData.totalTickets}개 티켓, ${unpaidData.totalAmount}원`,
            );

            return {
                totalAmount: unpaidData.totalAmount,
                itemCount: unpaidData.totalTickets,
                storeId: this.currentStoreId,
                tableNumber: this.currentTableNumber,
                orderId: orderId,
                unpaidTickets: unpaidData.unpaidTickets,
                orderItems: orderItems,
                paymentMethod: method.toUpperCase(),
            };
        } catch (error) {
            console.error("❌ 결제 대상 데이터 조회 실패:", error);
            throw error;
        }
    },

    /**
     * 로딩 표시기 생성
     */
    showLoadingIndicator(message) {
        const indicator = document.createElement("div");
        indicator.className = "loading-indicator";
        indicator.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <span>${message}</span>
            </div>
        `;

        indicator.style.cssText = `
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

        const spinner = indicator.querySelector(".loading-spinner");
        if (spinner) {
            spinner.style.cssText = `
                width: 20px;
                height: 20px;
                border: 2px solid #ffffff40;
                border-top: 2px solid #ffffff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            `;
        }

        // 스피너 애니메이션 CSS 추가
        if (!document.querySelector("#spinner-styles")) {
            const style = document.createElement("style");
            style.id = "spinner-styles";
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(indicator);
        return indicator;
    },

    /**
     * 현재 주문 ID 가져오기
     */
    getCurrentOrderId() {
        // 현재 세션이 있으면 해당 주문 ID 사용
        if (this.currentSession && this.currentSession.orderId) {
            return this.currentSession.orderId;
        }

        // 기존 주문이 있으면 첫 번째 주문의 ID 사용 (임시)
        if (this.currentOrders.length > 0) {
            return this.currentOrders[0].orderItemId || null;
        }

        return null;
    },

    /**
     * 결제 모달 표시 (기존 호환성용)
     */
    showPaymentModal() {
        console.log("✨ 기존 결제 모달 표시 (POSPaymentModal로 리다이렉트)");
        this.showPOSPaymentModal(this.selectedPaymentMethod || "card");
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
        this.processPayment(this.selectedPaymentMethod);

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
        this.updateCartDisplay(); // 카트 표시 업데이트
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
                tllOrderList.innerHTML = this.renderTLLOrderItemsModern();
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
     * 세션 데이터 로드 (주문 확인 시)
     */
    async loadSessionData() {
        if (!this.currentTable) return; // 테이블이 선택되지 않았으면 로드 안함

        try {
            const response = await fetch(
                `/api/orders/current-session/${POSCore.storeId}/${this.currentTable}`,
            );
            const data = await response.json();

            if (data.success && data.session) {
                this.currentSession = data.session;
                this.sessionItems = data.session.orderItems || [];
                console.log("✅ 세션 데이터 로드:", this.currentSession);

                // 세션 정보는 별도로 저장 (currentOrders 덮어쓰지 않음)
                // currentOrders는 이미 consolidateOrderItems에서 통합 처리되었으므로 유지

                // 테이블 상태 업데이트 (예: 'occupied')
                this.updateTableStatus(this.currentTable, "occupied");
            } else {
                this.currentSession = null;
                this.sessionItems = [];
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

            // 첫 번째 TLL 주문에서 orderId 가져오기
            const orderId = this.tllOrders[0].order_id;

            if (!orderId) {
                console.error('❌ TLL 주문 ID를 찾을 수 없습니다');
                alert('TLL 주문 정보를 찾을 수 없습니다.');
                return;
            }

            const confirmMessage =
                `TLL 연동을 활성화하시겠습니까?\n\n` +
                `• 활성화 후 이 테이블에서 POS 주문을 추가하면\n` +
                `• 기존 TLL 주문과 합쳐져서 하나의 계산서로 처리됩니다\n` +
                `• 주문 ID: ${orderId}`;

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
            alert(`✅ TLL 연동이 활성화되었습니다.\n주문 ID: ${orderId}`);

            // 상태 업데이트
            this.tllOrderMixedStatus = true;

            // UI 새로고침
            await this.refreshOrders();

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
                `TLL 세션을 종료하시겠습니까?\n\n` +
                `• 사용자: ${this.tllUserInfo?.name || "게스트"}\n` +
                `• 주문 수: ${this.tllOrders.length}개\n` +
                `• 주문 ID: ${orderId}`;

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
            alert(`✅ TLL 세션이 종료되었습니다.\n주문 ID: ${orderId}`);

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
        alert("선택취소 기능 (추후 구현)");
    },
    addToOrder() {
        alert("주문추가 기능 (추후 구현)");
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

    // 컨트롤 바 기능들
    addQuantityToSelected() {
        alert("선택된 주문의 수량 증가 기능 (추후 구현)");
    },
    minusQuantityFromSelected() {
        alert("선택된 주문의 수량 감소 기능 (추후 구현)");
    },
};

// 전역 함수로 등록
window.POSOrderScreen = POSOrderScreen;