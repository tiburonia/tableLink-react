
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
        const posOrders = window.POSOrderScreen?.currentOrders?.filter(order => !order.sessionId) || [];

        console.log("🎨 렌더링 시점 데이터 확인:", {
            전체주문수: window.POSOrderScreen?.currentOrders?.length || 0,
            POS주문수: posOrders.length,
            렌더링데이터: posOrders.map((order, index) => ({
                인덱스: index,
                메뉴명: order.menuName,
                수량: order.quantity,
                단가: order.price,
                관련티켓수: order.ticketIds?.length || 1,
                통합상태: order.ticketIds?.length > 1 ? "다중티켓통합됨" : "단일티켓",
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
                .map(order => `
                    <tr class="order-row" 
                        data-order-id="${order.id}" 
                        data-menu-id="${order.menuId || order.id}"
                        onclick="OrderModificationManager.toggleOrderRowSelection('${order.id}', '${order.menuName}', ${order.quantity})"
                        style="cursor: pointer;">
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
                `)
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
     * TLL 주문 아이템 렌더링 (주문자별 좌우 분할 레이아웃)
     */
    renderTLLOrderItemsModern() {
        const tllOrderGroups = window.POSOrderScreen?.tllOrders || [];

        if (!tllOrderGroups || tllOrderGroups.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📱</div>
                    <h4>TLL 주문이 없습니다</h4>
                    <p>고객이 앱에서 주문하면 여기에 표시됩니다</p>
                </div>
            `;
        }

        // 주문자별 그룹 렌더링
        return tllOrderGroups.map(group => {
            const userName = group.userName || '게스트';
            const userPhone = group.guestPhone || group.userId || '-';
            const orders = group.orders || [];
            
            // 동일 메뉴 통합 처리 (메뉴명 + 단가 기준)
            const consolidatedOrders = this.consolidateTLLOrders(orders);
            
            // 총 금액 계산
            const totalAmount = consolidatedOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);

            return `
                <div class="tll-order-group">
                    <!-- 왼쪽: 메뉴 리스트 -->
                    <div class="tll-order-items">
                        ${consolidatedOrders.map(order => `
                            <div class="tll-order-item">
                                <div class="item-menu">
                                    <span class="menu-name">${order.menu_name}</span>
                                    <span class="menu-price">${(order.unit_price || 0).toLocaleString()}원</span>
                                </div>
                                <div class="item-qty">×${order.quantity || 0}</div>
                                <div class="item-total">${(order.total_price || 0).toLocaleString()}원</div>
                                <div class="item-status">
                                    <span class="status-badge status-${(order.item_status || 'PENDING').toLowerCase()}">
                                        ${this.getStatusText(order.item_status)}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                        <div class="tll-order-subtotal">
                            <span class="subtotal-label">소계</span>
                            <span class="subtotal-amount">${totalAmount.toLocaleString()}원</span>
                        </div>
                    </div>
                    
                    <!-- 오른쪽: 사용자 정보 (메뉴 리스트 높이만큼 자동 확장) -->
                    <div class="tll-order-user">
                        <div class="user-badge">📱 TLL</div>
                        <div class="user-name">${userName}</div>
                        <div class="user-phone">${userPhone}</div>
                        <div class="user-total">
                            <div class="total-label">주문 금액</div>
                            <div class="total-amount">${totalAmount.toLocaleString()}원</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * TLL 주문 아이템 통합 처리
     * 동일 메뉴명 + 단가를 가진 아이템들을 하나로 합침
     */
    consolidateTLLOrders(orders) {
        const consolidationMap = new Map();

        orders.forEach(order => {
            // 메뉴명 + 단가를 키로 사용
            const key = `${order.menu_name}_${order.unit_price}`;

            if (consolidationMap.has(key)) {
                // 기존 아이템에 수량과 총액 누적
                const existing = consolidationMap.get(key);
                existing.quantity += (order.quantity || 0);
                existing.total_price += (order.total_price || 0);
            } else {
                // 새로운 아이템 추가 (복사본 생성)
                consolidationMap.set(key, {
                    id: order.id,
                    menu_name: order.menu_name,
                    quantity: order.quantity || 0,
                    unit_price: order.unit_price || 0,
                    total_price: order.total_price || 0,
                    item_status: order.item_status || 'PENDING',
                    cook_station: order.cook_station,
                    order_id: order.order_id,
                    paid_status: order.paid_status
                });
            }
        });

        // Map을 배열로 변환하여 반환
        return Array.from(consolidationMap.values());
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
     * 로딩 상태 HTML 생성
     */
    getLoadingHTML() {details">
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
