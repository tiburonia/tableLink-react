/**
 * 주문 UI 렌더링 모듈
 * - 주문 목록 렌더링
 * - 메뉴 그리드 렌더링
 * - 결제 섹션 렌더링
 */

const OrderUIRenderer = {
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
        const posOrders = window.POSOrderScreen?.currentOrders?.filter(order => !order.sessionId) || [];
        const tllOrderCount = window.POSOrderScreen?.tllOrders?.length || 0;

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
        const posScreen = window.POSOrderScreen;
        if (!posScreen || !posScreen.currentOrders || posScreen.currentOrders.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🍽️</div>
                    <div class="empty-text">주문 내역이 없습니다</div>
                </div>
            `;
        }

        const htmlContent = posScreen.currentOrders
            .filter(order => !order.sessionId) // POS 주문만 표시 (TLL 주문 제외)
            .map(order => `
            <tr class="order-row"
                data-order-id="${order.id}"
                data-menu-id="${order.menuId || order.id}"
                onclick="OrderModificationManager.toggleOrderRowSelection('${order.id}', '${order.menuName}', ${order.quantity})">
                <td class="menu-name">${order.menuName}</td>
                <td class="quantity-display">${order.quantity}</td>
                <td class="price">${order.price?.toLocaleString() || '0'}원</td>
                <td class="subtotal">${((order.price || 0) * (order.quantity || 0)).toLocaleString()}원</td>
                <td class="status">
                    <span class="status-badge ${order.cookingStatus?.toLowerCase() || 'pending'}">${posScreen.getStatusText(order.cookingStatus)}</span>
                </td>
                <td class="cook-station">${posScreen.getCookStationText(order.cookStation)}</td>
            </tr>
        `)
            .join("");

        // 클릭 이벤트 리스너는 onclick 속성으로 처리되므로 별도 설정 불필요
        return htmlContent;
    },

    /**
     * TLL 주문 아이템 렌더링 (모던 카드 스타일)
     */
    renderTLLOrderItemsModern() {
        const tllOrders = window.POSOrderScreen?.tllOrders || [];

        if (!tllOrders || tllOrders.length === 0) {
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

        tllOrders.forEach((order) => {
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
            .map(order => `
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
        `)
            .join("");
    },

    /**
     * 결제/계산 섹션 (좌우 2분할)
     */
    renderPaymentSection() {
        // 카트 아이템들만 결제 계산에 포함
        const cart = window.POSOrderScreen?.cart || [];
        const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
                        <button class="control-btn quantity-add" onclick="OrderModificationManager.addQuantityToSelected()">
                            +
                        </button>
                        <button class="control-btn quantity-minus" onclick="OrderModificationManager.minusQuantityFromSelected()">
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
        const menuData = window.POSOrderScreen?.menuData || [];
        const categories = [...new Set(menuData.map((menu) => menu.category || "일반"))];

        return categories
            .map((category, index) => `
            <button class="category-tab ${index === 0 ? "active" : ""}"
                    data-category="${category}"
                    onclick="POSOrderScreen.selectCategory('${category}')">
                ${category}
            </button>
        `)
            .join("");
    },

    /**
     * 메뉴 그리드 렌더링 (큰 버튼)
     */
    renderMenuGrid(selectedCategory = null) {
        const menuData = window.POSOrderScreen?.menuData || [];
        const categories = [...new Set(menuData.map((menu) => menu.category || "일반"))];
        const activeCategory = selectedCategory || categories[0];

        const filteredMenu = menuData.filter(
            (menu) => (menu.category || "일반") === activeCategory
        );

        // 핫메뉴 우선 정렬
        const sortedMenu = filteredMenu.sort((a, b) => {
            if (a.isHot && !b.isHot) return -1;
            if (!a.isHot && b.isHot) return 1;
            return 0;
        });

        return sortedMenu
            .map(menu => `
            <div class="menu-card ${menu.isHot ? "hot-menu" : ""}"
                 onclick="POSOrderScreen.addToOrder('${menu.id}', '${menu.name}', ${menu.price})">
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
        `)
            .join("");
    },

    /**
     * 결제 수단 섹션 (3열 2행 - 6개 기능)
     */
    renderPaymentMethodSection() {
        const selectedPaymentMethod = window.POSOrderScreen?.selectedPaymentMethod || "card";

        return `
            <div class="payment-method-section">
                <div class="section-header">
                    <h3>💳 결제 기능</h3>
                </div>

                <div class="payment-methods-grid">
                    <button class="payment-method-btn ${selectedPaymentMethod === "card" ? "active" : ""}" id="cardPaymentBtn"
                            onclick="POSOrderScreen.selectPaymentMethod('card')">
                        <div class="method-icon">💳</div>
                        <div class="method-name">카드</div>
                    </button>

                    <button class="payment-method-btn ${selectedPaymentMethod === "cash" ? "active" : ""}" id="cashPaymentBtn"
                            onclick="POSOrderScreen.selectPaymentMethod('cash')">
                        <div class="method-icon">💵</div>
                        <div class="method-name">현금</div>
                    </button>

                    <button class="payment-method-btn ${selectedPaymentMethod === "mixed" ? "active" : ""}"
                            onclick="POSOrderScreen.selectPaymentMethod('mixed')">
                        <div class="method-icon">🔄</div>
                        <div class="method-name">복합결제</div>
                    </button>

                    <button class="payment-method-btn"
                            onclick="POSOrderScreen.confirmOrder()"
                            id="confirmOrder">
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
        const tllUserInfo = window.POSOrderScreen?.tllUserInfo;

        if (!tllUserInfo) {
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
                        <span class="detail-value">${tllUserInfo.name || "게스트"}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="detail-label">연락처:</span>
                        <span class="detail-value">${tllUserInfo.phone || tllUserInfo.guest_phone || "-"}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="detail-label">주문 시간:</span>
                        <span class="detail-value">${tllUserInfo.created_at ? new Date(tllUserInfo.created_at).toLocaleTimeString() : "-"}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="detail-label">포인트:</span>
                        <span class="detail-value">${(tllUserInfo.point || 0).toLocaleString()}P</span>
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
        const isMixed = window.POSOrderScreen?.checkTLLOrderMixedStatus() || false;

        if (isMixed) {
            return `
                <button class="tll-action-btn tll-connect disabled" disabled data-mixed="true">
                    <span class="btn-icon">✅</span>
                    <span class="btn-text">TLL 연동 완료</span>
                </button>
            `;
        } else {
            return `
                <button class="tll-action-btn tll-connect" onclick="POSOrderScreen.enableTLLConnection()" data-mixed="false">
                    <span class="btn-icon">🔗</span>
                    <span class="btn-text">TLL 연동</span>
                </button>
            `;
        }
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

    getCookStationText(cookStation) {
        const stationMap = {
            KITCHEN: "주방",
            DRINK: "음료",
            DESSERT: "디저트",
            SIDE: "사이드",
        };
        return stationMap[cookStation] || "주방";
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
    }
};

// 전역으로 등록
window.OrderUIRenderer = OrderUIRenderer;