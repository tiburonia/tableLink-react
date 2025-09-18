
/**
 * POS 주문 화면 (OK POS 스타일 - 2분할 구조)
 */

const POSOrderScreen = {
    currentTable: null,
    currentOrders: [],
    menuData: [],
    cart: [], // 프론트엔드 카트 시스템
    selectedPaymentMethod: 'card',
    
    /**
     * 주문 화면 렌더링
     */
    async render(storeId, storeInfo, tableNumber) {
        try {
            console.log(`🛒 주문 화면 렌더링 - 테이블 ${tableNumber}`);
            
            this.currentTable = tableNumber;
            
            // 기존 주문 로드
            await this.loadCurrentOrders(storeId, tableNumber);
            
            // 메뉴 데이터 로드
            await this.loadMenuData(storeId);
            
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
     * POS 주문 아이템 렌더링 (테이블 형식)
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
                        <th class="col-actions">액션</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // 주문이 있으면 주문 데이터, 없으면 빈 행들로 채움
        let tableBody = '';
        
        if (posOrders.length > 0) {
            tableBody = posOrders.map(order => `
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
                                <span class="quantity-display">${order.quantity}</span>
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
                    <td class="col-actions">
                        ${order.isCart ? `
                            <button class="action-btn remove-btn" onclick="POSOrderScreen.removeCartItem(${order.originalCartIndex})" title="삭제">
                                🗑️
                            </button>
                        ` : `
                            <button class="action-btn edit-btn" onclick="POSOrderScreen.editOrder(${order.id})" title="수정">
                                ✏️
                            </button>
                            <button class="action-btn remove-btn" onclick="POSOrderScreen.removeOrder(${order.id})" title="삭제">
                                🗑️
                            </button>
                        `}
                    </td>
                </tr>
            `).join('');
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
                        <td class="col-actions"></td>
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
        const subtotal = this.currentOrders.reduce((sum, order) => sum + (order.price * order.quantity), 0);
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
                    <button class="payment-method-btn ${this.selectedPaymentMethod === 'card' ? 'active' : ''}" 
                            onclick="POSOrderScreen.selectPaymentMethod('card')">
                        <div class="method-icon">💳</div>
                        <div class="method-name">카드</div>
                    </button>
                    
                    <button class="payment-method-btn ${this.selectedPaymentMethod === 'cash' ? 'active' : ''}" 
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
     * 기존 주문 로드 (POS + TLL 통합)
     */
    async loadCurrentOrders(storeId, tableNumber) {
        try {
            // POS 주문 로드
            const response = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/all-orders`);
            const data = await response.json();
            
            if (data.success && data.currentSession) {
                this.currentOrders = data.currentSession.items || [];
            } else {
                this.currentOrders = [];
            }
            
            console.log(`✅ POS 주문 ${this.currentOrders.length}개 로드`);
            
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
            const response = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/tll-orders`);
            const data = await response.json();
            
            if (data.success) {
                this.tllOrders = data.tllOrders || [];
                this.tllUserInfo = data.userInfo || null;
                
                console.log(`✅ TLL 주문 ${this.tllOrders.length}개 로드, 사용자 정보:`, this.tllUserInfo?.name || '없음');
            } else {
                this.tllOrders = [];
                this.tllUserInfo = null;
            }
            
        } catch (error) {
            console.error('❌ TLL 주문 로드 실패:', error);
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
        
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        event.currentTarget.classList.add('active');
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
            
            // UI 업데이트
            await this.updateCartDisplay();
            this.showToast(`${menuName} 카트에 추가됨`);
            
        } catch (error) {
            console.error('❌ 카트 추가 실패:', error);
            alert('카트 추가 중 오류가 발생했습니다.');
        }
    },
    
    
    /**
     * 카트 표시 업데이트
     */
    async updateCartDisplay() {
        // 현재 카트를 POS 주문으로 표시
        this.currentOrders = this.cart.map((item, index) => ({
            id: `cart_${index}`,
            menuName: item.name,
            price: item.price,
            quantity: item.quantity,
            cookingStatus: 'CART',
            isCart: true,
            originalCartIndex: index
        }));
        
        // UI 새로고침
        const posOrderList = document.getElementById('posOrderList');
        if (posOrderList) {
            posOrderList.innerHTML = this.renderPOSOrderItemsModern();
        }
        
        // 결제 섹션 업데이트
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
     */
    async confirmOrder() {
        if (this.cart.length === 0) {
            alert('주문할 메뉴가 없습니다.');
            return;
        }
        
        try {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            if (!confirm(`${this.cart.length}개 메뉴, 총 ${total.toLocaleString()}원을 주문하시겠습니까?`)) {
                return;
            }
            
            console.log('📋 POS 주문 확정 시작:', {
                storeId: POSCore.storeId,
                tableNumber: this.currentTable,
                cartItems: this.cart.length,
                totalAmount: total
            });
            
            // 서버에 주문 전송
            const response = await fetch('/api/pos/orders/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: POSCore.storeId,
                    tableNumber: this.currentTable,
                    items: this.cart,
                    totalAmount: total,
                    orderType: 'POS'
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '주문 확정 실패');
            }
            
            const result = await response.json();
            console.log('✅ POS 주문 확정 완료:', result);
            
            // 카트 초기화
            this.cart = [];
            
            // 주문 목록 새로고침
            await this.refreshOrders();
            
            this.showToast(`주문이 확정되었습니다 (티켓 ID: ${result.ticketId})`);
            
        } catch (error) {
            console.error('❌ 주문 확정 실패:', error);
            alert(`주문 확정 실패: ${error.message}`);
        }
    },
    
    /**
     * 결제 처리
     */
    async processPayment() {
        if (this.currentOrders.length === 0 && this.cart.length === 0) {
            alert('결제할 주문이 없습니다.');
            return;
        }
        
        // 카트에 아이템이 있으면 먼저 주문 확정 요청
        if (this.cart.length > 0) {
            alert('먼저 주문을 확정해주세요.');
            return;
        }
        
        const total = this.currentOrders.reduce((sum, order) => sum + (order.price * order.quantity), 0);
        
        if (confirm(`${total.toLocaleString()}원을 ${this.getPaymentMethodName()}로 결제하시겠습니까?`)) {
            alert('결제 처리 기능 구현 예정');
        }
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
        if (this.cart.length === 0) {
            alert('카트가 이미 비어있습니다.');
            return;
        }
        
        if (confirm('카트를 비우시겠습니까?')) {
            this.cart = [];
            this.updateCartDisplay();
            this.showToast('카트가 비워졌습니다');
        }
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
            console.log('🔄 TLL 주문 새로고침');
            await this.loadTLLOrders(POSCore.storeId, this.currentTable);
            
            // UI 업데이트
            const tllOrderList = document.getElementById('tllOrderList');
            if (tllOrderList) {
                tllOrderList.innerHTML = this.renderTLLOrderItemsModern();
            }

            // 대시보드 카드 업데이트
            this.updateOrderDashboard();

            // 결제 섹션 업데이트 (사용자 정보 반영)
            const paymentSection = document.querySelector('.payment-section');
            if (paymentSection) {
                const newPaymentSection = document.createElement('div');
                newPaymentSection.innerHTML = this.renderPaymentSection();
                paymentSection.replaceWith(newPaymentSection.firstElementChild);
            }

            this.showToast('TLL 주문이 새로고침되었습니다');
            
        } catch (error) {
            console.error('❌ TLL 주문 새로고침 실패:', error);
            this.showToast('TLL 주문 새로고침에 실패했습니다');
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
                const total = this.currentOrders.reduce((sum, order) => sum + (order.price * order.quantity), 0);
                const change = Math.max(0, received - total);
                
                const changeElement = document.getElementById('changeAmount');
                if (changeElement) {
                    changeElement.textContent = change.toLocaleString() + '원';
                    changeElement.className = `amount change-amount ${change > 0 ? 'positive' : ''}`;
                }
            });
        }
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
