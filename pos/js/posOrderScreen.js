/**
 * POS 주문 화면 (OK POS 스타일 - 2분할 구조)
 */

const POSOrderScreen = {
    currentTable: null,
    currentOrders: [],
    menuData: [],
    cart: [], // 프론트엔드 카트 시스템
    selectedPaymentMethod: 'card',
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
            if (typeof POSCore !== 'undefined') {
                POSCore.storeId = parseInt(storeId);
                POSCore.tableNumber = parseInt(tableNumber);
            }

            console.log('📋 POS 주문 화면 초기화:', {
                storeId: this.currentStoreId,
                tableNumber: this.currentTableNumber,
                currentTable: this.currentTable
            });

            // 기존 주문 로드
            await this.loadCurrentOrders(storeId, tableNumber);

            // 메뉴 데이터 로드
            await this.loadMenuData(storeId);

            // 세션 정보 로드 (기존 주문이 있으면 세션 정보도 함께)
            await this.loadSessionData();


            const main = document.getElementById('posMain');
            main.innerHTML = `
                ${this.renderHeader(storeInfo, tableNumber)}
                ${this.renderMainLayout()}
            `;

            // 이벤트 리스너 설정
            this.setupEventListeners();

        } catch (error) {
            console.error('❌ 주문 화면 렌더링 실패:', error);
            POSCore.showError('주문 화면을 불러올 수 없습니다.');
        }
    },

    /**
     * 헤더 렌더링 (전역 네비게이션)
     */
    renderHeader(storeInfo, tableNumber) {
        const currentTime = new Date().toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
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
        const posOrders = this.currentOrders.filter(order => !order.sessionId);
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
     * POS 주문 아이템 렌더링 (테이블 형식) - order_items 기준 수량 통합 표시
     */
    renderPOSOrderItemsModern() {
        const posOrders = this.currentOrders.filter(order => !order.sessionId);

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
        let tableBody = '';

        if (posOrders.length > 0) {
            tableBody = posOrders.map((order, index) => `
                <tr class="order-row ${order.isCart ? 'cart-item' : ''}" data-order-id="${order.id}" data-menu-name="${order.menuName}">
                    <td class="col-menu">
                        <div class="menu-info">
                            <strong>${order.menuName}</strong>
                            ${order.isCart ? '<span class="cart-badge">카트</span>' : ''}
                        </div>
                    </td>
                    <td class="col-price">
                        ${order.price.toLocaleString()}원
                    </td>
                    <td class="col-quantity">
                        <div class="quantity-control-table">
                            ${order.isCart ? `
                                <button class="qty-btn minus" onclick="POSOrderScreen.changeCartQuantity(${order.originalCartIndex}, -1)">
                                    −
                                </button>
                                <span class="quantity-display">${order.quantity}</span>
                                <button class="qty-btn plus" onclick="POSOrderScreen.changeCartQuantity(${order.originalCartIndex}, 1)">
                                    +
                                </button>
                            ` : `
                                <span class="quantity-display-integrated">${order.quantity}개</span>
                            `}
                        </div>
                    </td>
                    <td class="col-total">
                        <strong>${(order.price * order.quantity).toLocaleString()}원</strong>
                    </td>
                    <td class="col-status">
                        <span class="status-badge status-${order.cookingStatus?.toLowerCase() || 'pending'}">
                            ${this.getStatusText(order.cookingStatus)}
                        </span>
                    </td>
                </tr>
            `).join('');
        } else {
            // 빈 행들로 기본 프레임 유지 (10개 빈 행)
            for (let i = 0; i < 10; i++) {
                tableBody += `
                    <tr class="empty-row">
                        <td class="col-menu">
                            <div class="empty-placeholder">주문 대기 중...</div>
                        </td>
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

        this.tllOrders.forEach(order => {
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
                    order_id: order.order_id
                };
            }
        });

        const consolidatedOrdersList = Object.values(consolidatedOrders);

        return consolidatedOrdersList.map(order => `
            <div class="order-card tll-order-card" data-order-id="${order.order_id}">
                <div class="order-card-header">
                    <div class="menu-info">
                        <h5 class="menu-name">${order.menu_name}</h5>
                        <span class="menu-price">${order.unit_price.toLocaleString()}원</span>
                    </div>
                    <div class="order-status-group">
                        <span class="cook-station-badge station-${order.cook_station?.toLowerCase() || 'kitchen'}">
                            ${this.getCookStationText(order.cook_station)}
                        </span>
                        <span class="status-badge status-${order.item_status?.toLowerCase() || 'pending'}">
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
                        ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        `).join('');
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
        const cartTotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
        const categories = [...new Set(this.menuData.map(menu => menu.category || '일반'))];

        return categories.map((category, index) => `
            <button class="category-tab ${index === 0 ? 'active' : ''}"
                    data-category="${category}"
                    onclick="POSOrderScreen.selectCategory('${category}')">
                ${category}
            </button>
        `).join('');
    },

    /**
     * 메뉴 그리드 렌더링 (큰 버튼)
     */
    renderMenuGrid(selectedCategory = null) {
        const categories = [...new Set(this.menuData.map(menu => menu.category || '일반'))];
        const activeCategory = selectedCategory || categories[0];

        const filteredMenu = this.menuData.filter(menu =>
            (menu.category || '일반') === activeCategory
        );

        // 핫메뉴 우선 정렬
        const sortedMenu = filteredMenu.sort((a, b) => {
            if (a.isHot && !b.isHot) return -1;
            if (!a.isHot && b.isHot) return 1;
            return 0;
        });

        return sortedMenu.map(menu => `
            <div class="menu-card ${menu.isHot ? 'hot-menu' : ''}"
                 onclick="POSOrderScreen.addToCart(${menu.id}, '${menu.name}', ${menu.price})">
                ${menu.isHot ? '<div class="hot-badge">🔥 HOT</div>' : ''}
                <div class="menu-image">
                    ${this.getMenuIcon(menu.category)}
                </div>
                <div class="menu-info">
                    <div class="menu-name">${menu.name}</div>
                    <div class="menu-price">${menu.price.toLocaleString()}원</div>
                </div>
                <div class="add-btn">+</div>
            </div>
        `).join('');
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
                    <button class="payment-method-btn ${this.selectedPaymentMethod === 'card' ? 'active' : ''}" id="cardPaymentBtn"
                            onclick="POSOrderScreen.selectPaymentMethod('card')">
                        <div class="method-icon">💳</div>
                        <div class="method-name">카드</div>
                    </button>

                    <button class="payment-method-btn ${this.selectedPaymentMethod === 'cash' ? 'active' : ''}" id="cashPaymentBtn"
                            onclick="POSOrderScreen.selectPaymentMethod('cash')">
                        <div class="method-icon">💵</div>
                        <div class="method-name">현금</div>
                    </button>

                    <button class="payment-method-btn ${this.selectedPaymentMethod === 'mixed' ? 'active' : ''}"
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
                        <span class="detail-value">${this.tllUserInfo.name || '게스트'}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="detail-label">연락처:</span>
                        <span class="detail-value">${this.tllUserInfo.phone || this.tllUserInfo.guest_phone || '-'}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="detail-label">주문 시간:</span>
                        <span class="detail-value">${this.tllUserInfo.created_at ? new Date(this.tllUserInfo.created_at).toLocaleTimeString() : '-'}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="detail-label">포인트:</span>
                        <span class="detail-value">${(this.tllUserInfo.point || 0).toLocaleString()}P</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 기존 주문 로드 (DB에서 order_items 직접 로드, 수량 통합, UNPAID만)
     */
    async loadCurrentOrders(storeId, tableNumber) {
        try {
            console.log(`🔍 POS 주문 로드 시작: 매장 ${storeId}, 테이블 ${tableNumber}`);
            
            // POS 주문 로드 (order_items 기준, UNPAID 상태만)
            const response = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/order-items`);
            const data = await response.json();

            console.log(`📊 POS 주문 API 응답:`, {
                success: data.success,
                itemCount: data.orderItems?.length || 0,
                hasItems: !!(data.orderItems && data.orderItems.length > 0)
            });

            if (data.success && data.orderItems && data.orderItems.length > 0) {
                // 추가 필터링: 확실히 미지불 상태만 (PAID 상태 완전 배제)
                const unpaidItems = data.orderItems.filter(item => {
                    const isUnpaid = item.paid_status === 'UNPAID';
                    const isPaid = item.paid_status === 'PAID';
                    const isActiveOrder = item.order_status === 'OPEN';
                    const isActiveItem = !['CANCELLED', 'REFUNDED'].includes(item.item_status);
                    
                    // PAID 상태는 무조건 제외
                    if (isPaid) {
                        console.warn(`🚫 PAID 상태 아이템 제거:`, {
                            menu_name: item.menu_name,
                            paid_status: item.paid_status,
                            ticket_id: item.ticket_id
                        });
                        return false;
                    }
                    
                    const shouldInclude = isUnpaid && isActiveOrder && isActiveItem;
                    
                    if (!shouldInclude) {
                        console.log(`🚫 필터링된 아이템:`, {
                            menu_name: item.menu_name,
                            paid_status: item.paid_status,
                            order_status: item.order_status,
                            item_status: item.item_status,
                            reason: !isUnpaid ? 'not_unpaid' : !isActiveOrder ? 'closed_order' : 'inactive_item'
                        });
                    }
                    
                    return shouldInclude;
                });

                console.log(`📋 필터링 결과: ${data.orderItems.length}개 → ${unpaidItems.length}개 (미지불만)`);

                // order_items 기준으로 메뉴별 수량 통합 (updateCartDisplay와 동일한 로직 적용)
                const consolidatedOrders = {};

                unpaidItems.forEach(item => {
                    // 메뉴명과 단가를 기준으로 정확한 그룹핑 키 생성
                    const consolidationKey = `${item.menu_name.trim()}_${item.unit_price}`;
                    
                    if (consolidatedOrders[consolidationKey]) {
                        // 기존 아이템에 수량 추가 (updateCartDisplay와 동일)
                        consolidatedOrders[consolidationKey].quantity += item.quantity;
                        
                        // 최신 상태 정보로 업데이트
                        if (item.item_status !== 'PENDING') {
                            consolidatedOrders[consolidationKey].cookingStatus = item.item_status;
                        }
                        
                        console.log(`🔄 수량 통합: ${item.menu_name} (${consolidatedOrders[consolidationKey].quantity}개)`);
                    } else {
                        // 새로운 메뉴 아이템 생성 (updateCartDisplay 스타일과 일치)
                        consolidatedOrders[consolidationKey] = {
                            id: item.menu_id || item.id,
                            menuName: item.menu_name,
                            price: item.unit_price,
                            quantity: item.quantity,
                            cookingStatus: item.item_status || 'PENDING',
                            isCart: false, // 기존 주문은 카트가 아님
                            orderItemId: item.id,
                            ticketId: item.ticket_id,
                            cookStation: item.cook_station || 'KITCHEN'
                        };
                        console.log(`➕ 새 메뉴 추가: ${item.menu_name} (${item.quantity}개)`);
                    }
                });

                // 통합된 주문 배열 생성
                this.currentOrders = Object.values(consolidatedOrders);
                
                // 최초 로드 시에도 수량 통합된 상태를 명시적으로 로그
                console.log(`📊 최초 로드 수량 통합 결과:`, {
                    원본아이템수: unpaidItems.length,
                    통합후메뉴수: this.currentOrders.length,
                    통합된메뉴목록: this.currentOrders.map(order => ({
                        메뉴명: order.menuName,
                        통합수량: order.quantity,
                        단가: order.price,
                        상태: order.cookingStatus
                    }))
                });
                
                console.log(`✅ POS order_items 수량 통합 완료:`, {
                    원본아이템수: unpaidItems.length,
                    통합후메뉴수: this.currentOrders.length,
                    통합된메뉴들: this.currentOrders.map(item => `${item.menuName}(${item.quantity}개)`)
                });
                
            } else {
                this.currentOrders = [];
            }

            console.log(`✅ POS 미지불 주문 ${this.currentOrders.length}개 로드 완료 (order_items 기준 수량 통합)`);

            // TLL 주문 로드
            await this.loadTLLOrders(storeId, tableNumber);

        } catch (error) {
            console.error('❌ 기존 주문 로드 실패:', error);
            this.currentOrders = [];
        }
    },

    /**
     * TLL 주문 로드
     */
    async loadTLLOrders(storeId, tableNumber) {
        try {
            console.log(`🔍 TLL 주문 로드 시작: 매장 ${storeId}, 테이블 ${tableNumber}`);

            const url = `/api/pos/stores/${storeId}/table/${tableNumber}/tll-orders`;
            console.log(`📡 TLL 주문 API 호출: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API 요청 실패 (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            console.log(`📊 TLL 주문 API 응답:`, data);

            if (data.success) {
                this.tllOrders = data.tllOrders || [];
                this.tllUserInfo = data.userInfo || null;

                console.log(`✅ TLL 주문 ${this.tllOrders.length}개 로드 완료`);
                console.log(`👤 TLL 사용자 정보:`, this.tllUserInfo?.name || '없음');

                // TLL 주문 세부 정보 로깅
                if (this.tllOrders.length > 0) {
                    console.log(`📋 TLL 주문 첫 번째 아이템:`, this.tllOrders[0]);
                }
            } else {
                console.warn('⚠️ TLL 주문 API 응답이 실패 상태:', data.error);
                this.tllOrders = [];
                this.tllUserInfo = null;
            }

        } catch (error) {
            console.error('❌ TLL 주문 로드 실패:', error);
            console.error('❌ 에러 상세:', {
                message: error.message,
                stack: error.stack,
                storeId,
                tableNumber
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
                this.menuData = data.menu.map(menu => ({
                    ...menu,
                    isHot: Math.random() > 0.7 // 임시 핫메뉴 로직
                }));
            } else {
                this.menuData = this.getDefaultMenu();
            }

            console.log(`✅ 메뉴 ${this.menuData.length}개 로드`);

        } catch (error) {
            console.error('❌ 메뉴 데이터 로드 실패:', error);
            this.menuData = this.getDefaultMenu();
        }
    },

    /**
     * 카테고리 선택
     */
    selectCategory(category) {
        document.querySelectorAll('.category-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        document.getElementById('menuGrid').innerHTML = this.renderMenuGrid(category);
    },

    /**
     * 결제 수단 선택
     */
    selectPaymentMethod(method) {
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

        console.log(`💳 결제 방법 선택: ${method}`);

        // POSPaymentModal을 사용하여 결제 모달 표시
        this.showPOSPaymentModal(method);
    },

    /**
     * 장바구니에 추가 (프론트엔드 카트 관리)
     */
    async addToCart(menuId, menuName, price, storeId = null, cookStation = null) {
        try {
            // 파라미터로 받은 값들 우선 사용, 없으면 기본값 설정
            const finalStoreId = storeId || POSCore.storeId;

            let finalCookStation = cookStation;
            if (!finalCookStation) {
                // 메뉴 데이터에서 cook_station 정보 가져오기
                const menuItem = this.menuData.find(menu => menu.id === menuId);
                finalCookStation = menuItem?.cook_station || menuItem?.category || this.getCookStationByMenu(menuName);
            }

            // 기존 카트에서 같은 메뉴 찾기
            const existingItem = this.cart.find(item =>
                item.id === menuId && item.name === menuName && item.price === price
            );

            if (existingItem) {
                // 기존 아이템 수량 증가
                existingItem.quantity += 1;
                console.log(`🔄 카트 수량 증가: ${menuName} (${existingItem.quantity}개)`);
            } else {
                // 새 아이템 추가
                this.cart.push({
                    id: menuId,
                    menuId: menuId, // 명시적으로 menuId 필드 추가
                    name: menuName,
                    price: price,
                    quantity: 1,
                    store_id: finalStoreId, // 파라미터로 받은 매장 ID 사용
                    cook_station: finalCookStation // 파라미터로 받은 조리스테이션 사용
                });
                console.log(`➕ 카트 새 아이템 추가: ${menuName} (매장: ${finalStoreId}, 조리스테이션: ${finalCookStation})`);
            }

            // UI 업데이트 (테이블 선택 여부와 관계없이)
            await this.updateCartDisplay();
            this.showToast(`${menuName} 카트에 추가됨`);

        } catch (error) {
            console.error('❌ 카트 추가 실패:', error);
            // 에러가 발생해도 카트에는 추가되도록 처리
            console.log('⚠️ API 호출 실패했지만 카트 업데이트는 계속 진행');
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
            cookingStatus: 'CART',
            isCart: true,
            originalCartIndex: index
        }));

        // 기존 주문내역을 먼저 표시하고, 그 다음에 카트 아이템들 표시
        const allOrders = [...this.currentOrders, ...cartOrders];

        // tbody만 업데이트 (테이블 구조 유지)
        const posOrderTable = document.querySelector('.pos-order-table tbody');
        if (posOrderTable) {
            let tableBody = '';

            // 모든 주문 (기존 + 카트) 순차적 표시
            if (allOrders.length > 0) {
                tableBody = allOrders.map(order => `
                    <tr class="order-row ${order.isCart ? 'cart-item' : ''}" data-order-id="${order.id}">
                        <td class="col-menu">
                            <div class="menu-info">
                                <strong>${order.menuName}</strong>
                                ${order.isCart ? '<span class="cart-badge">카트</span>' : ''}
                            </div>
                        </td>
                        <td class="col-price">
                            ${order.price.toLocaleString()}원
                        </td>
                        <td class="col-quantity">
                            <div class="quantity-control-table">
                                ${order.isCart ? `
                                    <button class="qty-btn minus" onclick="POSOrderScreen.changeCartQuantity(${order.originalCartIndex}, -1)">
                                        −
                                    </button>
                                    <span class="quantity-display">${order.quantity}</span>
                                    <button class="qty-btn plus" onclick="POSOrderScreen.changeCartQuantity(${order.originalCartIndex}, 1)">
                                        +
                                    </button>
                                ` : `
                                    <span class="quantity-display-integrated">${order.quantity}개</span>
                                `}
                            </div>
                        </td>
                        <td class="col-total">
                            <strong>${(order.price * order.quantity).toLocaleString()}원</strong>
                        </td>
                        <td class="col-status">
                            <span class="status-badge status-${order.cookingStatus?.toLowerCase() || 'pending'}">
                                ${this.getStatusText(order.cookingStatus)}
                            </span>
                        </td>
                    </tr>
                `).join('');
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
        const paymentSection = document.querySelector('.payment-section');
        if (paymentSection) {
            const newPaymentSection = document.createElement('div');
            newPaymentSection.innerHTML = this.renderPaymentSection();
            paymentSection.replaceWith(newPaymentSection.firstElementChild);
        }
    },

    /**
     * 주문 새로고침
     */
    async refreshOrders() {
        await this.loadCurrentOrders(POSCore.storeId, this.currentTable);

        // 카트가 있으면 카트 표시, 없으면 기존 주문 표시
        if (this.cart.length > 0) {
            await this.updateCartDisplay();
        } else {
            const posOrderList = document.getElementById('posOrderList');
            if (posOrderList) {
                posOrderList.innerHTML = this.renderPOSOrderItemsModern();
            }
        }

        // 결제 섹션도 업데이트
        const paymentSection = document.querySelector('.payment-section');
        if (paymentSection) {
            const newPaymentSection = document.createElement('div');
            newPaymentSection.innerHTML = this.renderPaymentSection();
            paymentSection.replaceWith(newPaymentSection.firstElementChild);
        }
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
     * 비회원 POS 주문 지원
     */
    async confirmOrder() {
        if (this.cart.length === 0) {
            alert('주문할 메뉴가 없습니다.');
            return;
        }

        try {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            if (!confirm(`${this.cart.length}개 메뉴, 총 ${total.toLocaleString()}원을 비회원 주문하시겠습니까?`)) {
                return;
            }

            // 필수 정보 검증 및 설정
            const storeId = this.currentStoreId || POSCore.storeId;
            const tableNumber = this.currentTableNumber || this.currentTable;

            if (!storeId || !tableNumber) {
                alert('매장 ID 또는 테이블 번호가 설정되지 않았습니다.');
                console.error('❌ 필수 정보 누락:', { storeId, tableNumber });
                return;
            }

            console.log('📋 비회원 POS 주문 확정 시작:', {
                storeId: storeId,
                tableNumber: tableNumber,
                cartItems: this.cart.length,
                totalAmount: total,
                isGuestOrder: true
            });

            // 비회원 주문 전용 API 사용
            const response = await fetch('/api/pos/guest-orders/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: parseInt(storeId),
                    tableNumber: parseInt(tableNumber),
                    items: this.cart,
                    totalAmount: total
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '주문 확정 실패');
            }

            const result = await response.json();
            console.log('✅ POS 주문 확정 완료:', result);

            // 세션 정보 업데이트 (새 주문 ID로)
            this.currentSession = { orderId: result.orderId, tableNumber: this.currentTable, storeId: POSCore.storeId };
            this.sessionItems = this.cart.map(item => ({ ...item, ticketId: result.ticketId })); // 임시 ticketId

            // 카트 초기화
            this.cart = [];

            // 주문 목록 새로고침 (DB에서 최신 order_items 로드)
            await this.loadCurrentOrders(POSCore.storeId, this.currentTable);

            // tbody 업데이트 (카트 없이 기존 주문내역만 표시)
            const posOrderTable = document.querySelector('.pos-order-table tbody');
            if (posOrderTable) {
                let tableBody = '';

                if (this.currentOrders.length > 0) {
                    tableBody = this.currentOrders.map(order => `
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
                                    <span class="quantity-display-integrated">${order.quantity}개</span>
                                </div>
                            </td>
                            <td class="col-total">
                                <strong>${(order.price * order.quantity).toLocaleString()}원</strong>
                            </td>
                            <td class="col-status">
                                <span class="status-badge status-${order.cookingStatus?.toLowerCase() || 'pending'}">
                                    ${this.getStatusText(order.cookingStatus)}
                                </span>
                            </td>
                        </tr>
                    `).join('');
                }

                // 남은 빈 행들 추가
                const remainingRows = Math.max(0, 10 - this.currentOrders.length);
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
            const paymentSection = document.querySelector('.payment-section');
            if (paymentSection) {
                const newPaymentSection = document.createElement('div');
                newPaymentSection.innerHTML = this.renderPaymentSection();
                paymentSection.replaceWith(newPaymentSection.firstElementChild);
            }

            const orderType = result.isGuestOrder ? '비회원' : '일반';
            this.showToast(`${orderType} 주문이 확정되었습니다 (티켓 ID: ${result.ticketId})`);

        } catch (error) {
            console.error('❌ 비회원 주문 확정 실패:', error);
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
            const paymentBtns = document.querySelectorAll('.payment-method-btn');
            paymentBtns.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            });

            // 1. 현재 테이블의 미지불 티켓 조회 (storeId와 tableNumber 기반)
            if (!this.currentStoreId || !this.currentTableNumber) {
                alert('매장 또는 테이블 정보가 없습니다.');
                return;
            }

            // 먼저 현재 테이블의 활성 주문을 찾아서 orderId 확인
            const activeOrderResponse = await fetch(`/api/pos/stores/${this.currentStoreId}/table/${this.currentTableNumber}/active-order`);

            if (!activeOrderResponse.ok) {
                const errorText = await activeOrderResponse.text();
                console.error(`❌ 활성 주문 조회 실패 (${activeOrderResponse.status}):`, errorText);
                alert('활성 주문을 조회할 수 없습니다.');
                return;
            }

            const activeOrderData = await activeOrderResponse.json();
            console.log('📋 활성 주문 조회 응답:', activeOrderData);

            if (!activeOrderData.success || !activeOrderData.hasActiveOrder || !activeOrderData.orderId) {
                alert('결제할 활성 주문이 없습니다.');
                return;
            }

            const orderId = activeOrderData.orderId;
            console.log(`📋 결제 대상 주문 ID: ${orderId}`);

            // 2. 미지불 티켓 조회
            const unpaidResponse = await fetch(`/api/pos-payment/unpaid-tickets/${orderId}`);
            const unpaidData = await unpaidResponse.json();

            if (!unpaidData.success || unpaidData.totalTickets === 0) {
                alert('결제할 미지불 티켓이 없습니다.');
                return;
            }

            console.log(`📋 결제할 티켓: ${unpaidData.totalTickets}개, 총 금액: ${unpaidData.totalAmount}원`);

            // 3. 결제 처리 요청
            const paymentResponse = await fetch('/api/pos-payment/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: orderId,
                    paymentMethod: method.toUpperCase(),
                    amount: unpaidData.totalAmount,
                    storeId: this.currentStoreId,
                    tableNumber: this.currentTableNumber
                })
            });

            const paymentResult = await paymentResponse.json();

            if (paymentResult.success) {
                // 결제 성공
                console.log('✅ 결제 완료:', paymentResult);

                const methodName = method === 'card' ? '카드' : '현금';
                alert(`${methodName} 결제가 완료되었습니다!\n` +
                      `결제 금액: ${paymentResult.amount.toLocaleString()}원\n` +
                      `처리된 티켓: ${paymentResult.totalTicketsPaid}개`);

                // 장바구니 초기화
                this.clearCart();

                // 기존 주문 데이터 초기화 (캐시 제거)
                this.currentOrders = [];
                this.tllOrders = [];
                this.tllUserInfo = null;

                // 잠시 대기 후 강제 새로고침 (DB 업데이트 반영 시간)
                setTimeout(async () => {
                    console.log('🔄 결제 완료 후 강제 데이터 새로고침');
                    
                    // 화면 새로고침
                    await this.refreshOrders();

                    // 결제 완료 후 화면 재렌더링
                    await this.render(this.currentStoreId, { name: '매장' }, this.currentTableNumber);
                }, 1000);

            } else {
                throw new Error(paymentResult.error || '결제 처리 실패');
            }

        } catch (error) {
            console.error('❌ 결제 처리 실패:', error);
            alert(`결제 처리 중 오류가 발생했습니다:\n${error.message}`);
        } finally {
            // 결제 버튼 다시 활성화
            const paymentBtns = document.querySelectorAll('.payment-method-btn');
            paymentBtns.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });
        }
    },

    /**
     * POSPaymentModal을 사용한 결제 모달 표시 (API 기반)
     */
    async showPOSPaymentModal(method) {
        console.log('✨ POSPaymentModal 결제 모달 표시 (API 기반)');

        // POSPaymentModal 존재 확인
        if (typeof POSPaymentModal === 'undefined') {
            console.error('❌ POSPaymentModal이 로드되지 않았습니다');
            alert('결제 모달을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
            
            // 강제 새로고침
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            return;
        }

        // 필수 정보 검증
        if (!this.currentStoreId || !this.currentTableNumber) {
            console.error('❌ 매장 ID 또는 테이블 번호가 설정되지 않았습니다');
            alert('매장 또는 테이블 정보가 설정되지 않았습니다.');
            return;
        }

        try {
            // 로딩 표시
            const loadingIndicator = this.showLoadingIndicator('결제 정보를 불러오는 중...');

            // API 호출로 실제 결제 대상 내역 조회
            const paymentData = await this.fetchPaymentTargetData();

            // 로딩 표시 제거
            if (loadingIndicator) {
                loadingIndicator.remove();
            }

            if (!paymentData) {
                alert('결제할 내역이 없습니다.');
                return;
            }

            console.log('💳 API로부터 받은 결제 데이터:', paymentData);

            // POSPaymentModal 표시
            await POSPaymentModal.show(paymentData);

        } catch (error) {
            console.error('❌ 결제 정보 조회 실패:', error);
            alert(`결제 정보를 불러올 수 없습니다: ${error.message}`);
        }
    },

    /**
     * API 호출로 결제 대상 데이터 조회
     */
    async fetchPaymentTargetData() {
        console.log(`🔍 결제 대상 데이터 조회: 매장 ${this.currentStoreId}, 테이블 ${this.currentTableNumber}`);

        try {
            // 1. 현재 테이블의 활성 주문 조회
            const activeOrderResponse = await fetch(`/api/pos/stores/${this.currentStoreId}/table/${this.currentTableNumber}/active-order`);

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
            const orderItemsResponse = await fetch(`/api/pos/stores/${this.currentStoreId}/table/${this.currentTableNumber}/order-items`);

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
                storeId: this.currentStoreId,
                tableNumber: this.currentTableNumber,
                orderId: orderId,
                unpaidTickets: unpaidData.unpaidTickets,
                orderItems: orderItems,
                paymentMethod: method
            };

        } catch (error) {
            console.error('❌ 결제 대상 데이터 조회 실패:', error);
            throw error;
        }
    },

    /**
     * 로딩 표시기 생성
     */
    showLoadingIndicator(message) {
        const indicator = document.createElement('div');
        indicator.className = 'loading-indicator';
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

        const spinner = indicator.querySelector('.loading-spinner');
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
        if (!document.querySelector('#spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'spinner-styles';
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
        console.log('✨ 기존 결제 모달 표시 (POSPaymentModal로 리다이렉트)');
        this.showPOSPaymentModal(this.selectedPaymentMethod || 'card');
    },

    /**
     * 결제 모달 숨기기
     */
    hidePaymentModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.querySelector('.modal-content').style.transform = 'translateY(20px)';
            modal.style.backgroundColor = 'rgba(0,0,0,0)';
            setTimeout(() => {
                modal.remove();
            }, 300); // 모달 애니메이션 시간과 일치
        }
    },

    /**
     * 결제 모달 상세 정보 렌더링
     */
    renderPaymentDetails() {
        const cartTotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
                        <option value="card" ${this.selectedPaymentMethod === 'card' ? 'selected' : ''}>카드</option>
                        <option value="cash" ${this.selectedPaymentMethod === 'cash' ? 'selected' : ''}>현금</option>
                        <option value="mixed" ${this.selectedPaymentMethod === 'mixed' ? 'selected' : ''}>복합결제</option>
                    </select>
                </div>

                <div class="payment-input-section">
                    <span>받은 금액:</span>
                    <input type="number" id="receivedAmount" placeholder="0" value="${this.selectedPaymentMethod === 'cash' ? total : ''}" />
                    <span>거스름돈:</span>
                    <span id="changeAmount" class="amount">${this.selectedPaymentMethod === 'cash' ? (total > 0 ? '0원' : '0원') : '0원'}</span>
                </div>

                <div class="modal-order-list">
                    <h4>주문 내역</h4>
                    <ul>
                        ${this.cart.map(item => `
                            <li>${item.name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString()}원</li>
                        `).join('')}
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
        const modalBody = document.querySelector('#paymentModal .modal-body');
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
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
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
            'PENDING': '대기',
            'COOKING': '조리중',
            'READY': '완료',
            'SERVED': '서빙완료',
            'COMPLETED': '완료',
            'CANCELLED': '취소됨',
            'CART': '카트'
        };
        return statusMap[status] || '대기';
    },

    /**
     * 카트 비우기
     */
    clearCart() {
        this.cart = [];
        this.updateCartDisplay(); // 카트 표시 업데이트
        this.showToast('카트가 비워졌습니다');
    },

    /**
     * 조리 스테이션 텍스트 반환
     */
    getCookStationText(cookStation) {
        const stationMap = {
            'KITCHEN': '주방',
            'DRINK': '음료',
            'DESSERT': '디저트',
            'SIDE': '사이드'
        };
        return stationMap[cookStation] || '주방';
    },

    /**
     * 주문 탭 전환
     */
    switchOrderTab(tabType) {
        // 탭 버튼 활성화 상태 변경
        document.querySelectorAll('.order-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabType);
        });

        // 컨텐츠 영역 표시/숨김
        document.querySelectorAll('.order-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabType}OrderContent`);
        });
    },

    /**
     * 주문 편집 (추후 구현)
     */
    editOrder(orderId) {
        alert('주문 편집 기능은 추후 구현 예정입니다.');
    },

    /**
     * TLL 주문 새로고침
     */
    async refreshTLLOrders() {
        try {
            console.log('🔄 TLL 주문 새로고침 시작');
            console.log(`📍 현재 정보: 매장 ${POSCore.storeId}, 테이블 ${this.currentTable}`);

            if (!POSCore.storeId || !this.currentTable) {
                console.error('❌ 매장 ID 또는 테이블 정보가 없습니다');
                this.showToast('매장 또는 테이블 정보가 없습니다');
                return;
            }

            await this.loadTLLOrders(POSCore.storeId, this.currentTable);

            // UI 업데이트
            const tllOrderList = document.getElementById('tllOrderList');
            if (tllOrderList) {
                tllOrderList.innerHTML = this.renderTLLOrderItemsModern();
                console.log(`✅ TLL 주문 목록 UI 업데이트: ${this.tllOrders?.length || 0}개 주문`);
            }

            // 대시보드 카드 업데이트
            this.updateOrderDashboard();

            // 결제 섹션 업데이트 (사용자 정보 반영)
            const paymentSection = document.querySelector('.payment-section');
            if (paymentSection) {
                const newPaymentSection = document.createElement('div');
                newPaymentSection.innerHTML = this.renderPaymentSection();
                paymentSection.replaceWith(newPaymentSection.firstElementChild);
                console.log('✅ 결제 섹션 업데이트 완료');
            }

            this.showToast(`TLL 주문 새로고침 완료 (${this.tllOrders?.length || 0}개)`);

        } catch (error) {
            console.error('❌ TLL 주문 새로고침 실패:', error);
            this.showToast('TLL 주문 새로고침에 실패했습니다: ' + error.message);
        }
    },

    /**
     * 주문 대시보드 업데이트
     */
    updateOrderDashboard() {
        const posOrders = this.currentOrders.filter(order => !order.sessionId);
        const tllOrderCount = this.tllOrders?.length || 0;

        // 카운트 업데이트
        const posCard = document.querySelector('.pos-card .count');
        const tllCard = document.querySelector('.tll-card .count');
        const totalCard = document.querySelector('.total-card .count');

        if (posCard) posCard.textContent = `${posOrders.length}건`;
        if (tllCard) tllCard.textContent = `${tllOrderCount}건`;
        if (totalCard) totalCard.textContent = `${posOrders.length + tllOrderCount}건`;

        // 탭 텍스트 업데이트
        const posTab = document.querySelector('.order-tab[data-tab="pos"]');
        const tllTab = document.querySelector('.order-tab[data-tab="tll"]');

        if (posTab) posTab.textContent = `💻 POS 주문 (${posOrders.length})`;
        if (tllTab) tllTab.textContent = `📱 TLL 주문 (${tllOrderCount})`;
    },

    getMenuIcon(category) {
        const icons = {
            '찌개류': '🍲',
            '구이류': '🥩',
            '밥류': '🍚',
            '면류': '🍜',
            '음료': '🥤',
            '기타': '🍽️'
        };
        return icons[category] || '🍽️';
    },

    getPaymentMethodName() {
        const names = {
            'cash': '현금',
            'card': '카드',
            'mixed': '복합결제',
            'tlpay': 'TL Pay',
            'simple': '간편결제'
        };
        return names[this.selectedPaymentMethod] || '카드';
    },

    getDefaultMenu() {
        return [
            { id: 1, name: '김치찌개', price: 8000, category: '찌개류' },
            { id: 2, name: '된장찌개', price: 7000, category: '찌개류' },
            { id: 3, name: '불고기', price: 15000, category: '구이류' },
            { id: 4, name: '비빔밥', price: 9000, category: '밥류' },
            { id: 5, name: '콜라', price: 2000, category: '음료' },
            { id: 6, name: '사이다', price: 2000, category: '음료' }
        ];
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
                // 현재 결제할 총 금액 (카트 아이템 기준)
                const total = this.cart.reduce((sum, order) => sum + (order.price * order.quantity), 0);
                const change = Math.max(0, received - total);

                const changeElement = document.getElementById('changeAmount');
                if (changeElement) {
                    changeElement.textContent = change.toLocaleString() + '원';
                    changeElement.className = `amount change-amount ${change > 0 ? 'positive' : ''}`;
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
            console.log('종료할 세션이 없습니다.');
            return;
        }

        try {
            // 서버에 세션 종료 요청
            const response = await fetch(`/api/orders/${this.currentSession.orderId}/end-session`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ 세션 종료 완료: 주문 ${this.currentSession.orderId}`);

                // 로컬 세션 정보 초기화
                this.currentSession = null;
                this.sessionItems = [];

                // 테이블 상태 업데이트
                this.updateTableStatus(this.currentTableNumber, 'available');

            } else {
                console.error('❌ 세션 종료 실패:', result.error);
            }

        } catch (error) {
            console.error('❌ 세션 종료 요청 실패:', error);
        }
    },

    /**
     * 세션 데이터 로드 (주문 확인 시)
     */
    async loadSessionData() {
        if (!this.currentTable) return; // 테이블이 선택되지 않았으면 로드 안함

        try {
            const response = await fetch(`/api/orders/current-session/${POSCore.storeId}/${this.currentTable}`);
            const data = await response.json();

            if (data.success && data.session) {
                this.currentSession = data.session;
                this.sessionItems = data.session.orderItems || [];
                console.log('✅ 세션 데이터 로드:', this.currentSession);

                // 세션이 있으면 currentOrders에 세션 아이템들 반영
                this.currentOrders = this.sessionItems.map(item => ({
                    id: item.menu_id,
                    menuName: item.menu_name,
                    price: item.unit_price,
                    quantity: item.quantity,
                    cookingStatus: item.item_status,
                    isCart: false, // 세션 아이템은 카트가 아님
                    orderItemId: item.order_item_id,
                    ticketId: item.ticket_id
                }));

                // 테이블 상태 업데이트 (예: 'occupied')
                this.updateTableStatus(this.currentTable, 'occupied');
            } else {
                this.currentSession = null;
                this.sessionItems = [];
                // 테이블 상태 업데이트 (예: 'available')
                this.updateTableStatus(this.currentTable, 'available');
            }
        } catch (error) {
            console.error('❌ 세션 데이터 로드 실패:', error);
            this.currentSession = null;
            this.sessionItems = [];
        }
    },

    /**
     * 테이블 상태 업데이트
     */
    updateTableStatus(tableNumber, status) {
        // 테이블맵 화면이 있다면 해당 테이블 상태 업데이트
        if (window.POSTableMap && typeof window.POSTableMap.updateTableStatus === 'function') {
            window.POSTableMap.updateTableStatus(tableNumber, status);
        }

        console.log(`🍽️ 테이블 ${tableNumber} 상태 업데이트: ${status}`);
    },

    // 기타 기능들 (임시 구현)
    showKitchenDisplay() { alert('주방출력 기능 (추후 구현)'); },
    showSalesStatus() { alert('매출현황 기능 (추후 구현)'); },
    showNotifications() { alert('알림 기능 (추후 구현)'); },
    changeQuantity(orderId, change) { alert('수량변경 기능 (추후 구현)'); },
    removeOrder(orderId) { alert('주문삭제 기능 (추후 구현)'); },
    cancelAllOrders() { alert('전체취소 기능 (추후 구현)'); },
    cancelSelectedOrders() { alert('선택취소 기능 (추후 구현)'); },
    addToOrder() { alert('주문추가 기능 (추후 구현)'); },

    // 새로운 결제 기능들
    showOrderHistory() { alert('주문 내역 관리 기능 (추후 구현)'); },
    showDutchPay() { alert('더치페이 기능 (추후 구현)'); },
    showReceiptManagement() { alert('영수증 관리 기능 (추후 구현)'); },

    // 컨트롤 바 기능들
    addQuantityToSelected() {
        alert('선택된 주문의 수량 증가 기능 (추후 구현)');
    },
    minusQuantityFromSelected() {
        alert('선택된 주문의 수량 감소 기능 (추후 구현)');
    }
};

// 전역 함수로 등록
window.POSOrderScreen = POSOrderScreen;