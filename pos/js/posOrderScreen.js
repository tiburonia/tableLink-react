
/**
 * POS 주문 화면 (OK POS 스타일)
 */

const POSOrderScreen = {
    currentTable: null,
    currentOrders: [],
    menuData: [],
    cart: [],
    
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
                ${this.renderTopBar(storeInfo, tableNumber)}
                ${this.renderMainContent()}
            `;
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ 주문 화면 렌더링 실패:', error);
            POSCore.showError('주문 화면을 불러올 수 없습니다.');
        }
    },
    
    /**
     * 상단바 렌더링
     */
    renderTopBar(storeInfo, tableNumber) {
        return `
            <div class="pos-top-bar order-screen">
                <div class="top-bar-left">
                    <button class="back-btn" onclick="POSCore.showTableMap()">
                        ← 테이블맵
                    </button>
                    <div class="order-info">
                        <span class="store-name">${storeInfo.name}</span>
                        <span class="separator">|</span>
                        <span class="table-name">테이블 ${tableNumber}</span>
                    </div>
                </div>
                
                <div class="top-bar-right">
                    <button class="top-btn" onclick="POSOrderScreen.showTableInfo()">
                        📋 테이블정보
                    </button>
                    <button class="top-btn" onclick="POSOrderScreen.printKitchen()">
                        🖨️ 주방출력
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * 메인 컨텐츠 렌더링
     */
    renderMainContent() {
        return `
            <div class="pos-order-main">
                <!-- 좌측: 주문 내역 -->
                <div class="order-section">
                    <div class="order-header">
                        <h3>주문 내역</h3>
                        <div class="order-actions">
                            <button class="action-btn" onclick="POSOrderScreen.addOrder()" id="addOrderBtn" disabled>
                                추가주문
                            </button>
                            <button class="action-btn payment-btn" onclick="POSOrderScreen.goToPayment()" id="paymentBtn" disabled>
                                결제
                            </button>
                        </div>
                    </div>
                    
                    <div class="orders-table" id="ordersTable">
                        ${this.renderOrdersTable()}
                    </div>
                </div>
                
                <!-- 중앙: 메뉴 선택 -->
                <div class="menu-section">
                    <div class="menu-header">
                        <div class="menu-categories" id="menuCategories">
                            ${this.renderMenuCategories()}
                        </div>
                    </div>
                    
                    <div class="menu-grid" id="menuGrid">
                        ${this.renderMenuGrid()}
                    </div>
                </div>
                
                <!-- 우측: 장바구니 -->
                <div class="cart-section">
                    <div class="cart-header">
                        <h3>선택 메뉴</h3>
                        <div class="cart-total" id="cartTotal">0원</div>
                    </div>
                    
                    <div class="cart-items" id="cartItems">
                        ${this.renderCartItems()}
                    </div>
                    
                    <div class="cart-actions">
                        <button class="cart-btn clear-btn" onclick="POSOrderScreen.clearCart()">
                            전체삭제
                        </button>
                        <button class="cart-btn add-btn" onclick="POSOrderScreen.addToOrder()" id="addToOrderBtn" disabled>
                            추가하기
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * 기존 주문 로드
     */
    async loadCurrentOrders(storeId, tableNumber) {
        try {
            const response = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/all-orders`);
            const data = await response.json();
            
            if (data.success && data.currentSession) {
                this.currentOrders = data.currentSession.items || [];
            } else {
                this.currentOrders = [];
            }
            
            console.log(`✅ 기존 주문 ${this.currentOrders.length}개 로드`);
            
        } catch (error) {
            console.error('❌ 기존 주문 로드 실패:', error);
            this.currentOrders = [];
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
                this.menuData = data.menu || [];
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
     * 주문 테이블 렌더링
     */
    renderOrdersTable() {
        if (this.currentOrders.length === 0) {
            return `
                <div class="empty-orders">
                    <div class="empty-icon">🍽️</div>
                    <p>주문 내역이 없습니다</p>
                </div>
            `;
        }
        
        return `
            <table class="orders-list">
                <thead>
                    <tr>
                        <th>메뉴명</th>
                        <th>단가</th>
                        <th>수량</th>
                        <th>금액</th>
                        <th>상태</th>
                        <th>출처</th>
                        <th>액션</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.currentOrders.map(order => `
                        <tr data-order-id="${order.id}">
                            <td class="menu-name">${order.menuName}</td>
                            <td class="unit-price">${order.price.toLocaleString()}원</td>
                            <td class="quantity">
                                <div class="quantity-controls">
                                    <button onclick="POSOrderScreen.changeQuantity(${order.id}, -1)">-</button>
                                    <span>${order.quantity}</span>
                                    <button onclick="POSOrderScreen.changeQuantity(${order.id}, 1)">+</button>
                                </div>
                            </td>
                            <td class="total-price">${(order.price * order.quantity).toLocaleString()}원</td>
                            <td class="cooking-status">
                                <span class="status-badge status-${order.cookingStatus?.toLowerCase() || 'pending'}">
                                    ${this.getStatusText(order.cookingStatus)}
                                </span>
                            </td>
                            <td class="source">
                                ${order.sessionId ? '📱' : '💻'}
                            </td>
                            <td class="actions">
                                <button onclick="POSOrderScreen.removeOrder(${order.id})" class="remove-btn">삭제</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },
    
    /**
     * 메뉴 카테고리 렌더링
     */
    renderMenuCategories() {
        const categories = [...new Set(this.menuData.map(menu => menu.category || '일반'))];
        
        return categories.map((category, index) => `
            <button class="category-btn ${index === 0 ? 'active' : ''}" 
                    data-category="${category}"
                    onclick="POSOrderScreen.selectCategory('${category}')">
                ${category}
            </button>
        `).join('');
    },
    
    /**
     * 메뉴 그리드 렌더링
     */
    renderMenuGrid(selectedCategory = null) {
        const categories = [...new Set(this.menuData.map(menu => menu.category || '일반'))];
        const activeCategory = selectedCategory || categories[0];
        
        const filteredMenu = this.menuData.filter(menu => 
            (menu.category || '일반') === activeCategory
        );
        
        return filteredMenu.map(menu => `
            <div class="menu-item" onclick="POSOrderScreen.addToCart(${menu.id}, '${menu.name}', ${menu.price})">
                <div class="menu-info">
                    <div class="menu-name">${menu.name}</div>
                    <div class="menu-price">${menu.price.toLocaleString()}원</div>
                </div>
                <div class="menu-action">
                    <button class="add-menu-btn">+</button>
                </div>
            </div>
        `).join('');
    },
    
    /**
     * 장바구니 아이템 렌더링
     */
    renderCartItems() {
        if (this.cart.length === 0) {
            return `
                <div class="empty-cart">
                    <div class="empty-icon">🛒</div>
                    <p>메뉴를 선택해주세요</p>
                </div>
            `;
        }
        
        return this.cart.map(item => `
            <div class="cart-item" data-menu-id="${item.id}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price.toLocaleString()}원</div>
                </div>
                <div class="cart-item-controls">
                    <button onclick="POSOrderScreen.changeCartQuantity(${item.id}, -1)">-</button>
                    <span class="cart-quantity">${item.quantity}</span>
                    <button onclick="POSOrderScreen.changeCartQuantity(${item.id}, 1)">+</button>
                    <button onclick="POSOrderScreen.removeFromCart(${item.id})" class="remove-cart-btn">×</button>
                </div>
            </div>
        `).join('');
    },
    
    /**
     * 카테고리 선택
     */
    selectCategory(category) {
        // 카테고리 버튼 활성화
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        // 메뉴 그리드 업데이트
        document.getElementById('menuGrid').innerHTML = this.renderMenuGrid(category);
    },
    
    /**
     * 장바구니에 추가
     */
    addToCart(menuId, menuName, price) {
        const existingItem = this.cart.find(item => item.id === menuId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: menuId,
                name: menuName,
                price: price,
                quantity: 1
            });
        }
        
        this.updateCartDisplay();
    },
    
    /**
     * 장바구니 표시 업데이트
     */
    updateCartDisplay() {
        // 장바구니 아이템 업데이트
        document.getElementById('cartItems').innerHTML = this.renderCartItems();
        
        // 총액 계산
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('cartTotal').textContent = total.toLocaleString() + '원';
        
        // 버튼 상태 업데이트
        const addToOrderBtn = document.getElementById('addToOrderBtn');
        addToOrderBtn.disabled = this.cart.length === 0;
    },
    
    /**
     * 장바구니 수량 변경
     */
    changeCartQuantity(menuId, change) {
        const item = this.cart.find(item => item.id === menuId);
        if (item) {
            item.quantity = Math.max(1, item.quantity + change);
            this.updateCartDisplay();
        }
    },
    
    /**
     * 장바구니에서 제거
     */
    removeFromCart(menuId) {
        this.cart = this.cart.filter(item => item.id !== menuId);
        this.updateCartDisplay();
    },
    
    /**
     * 장바구니 전체 삭제
     */
    clearCart() {
        if (this.cart.length > 0 && confirm('장바구니를 비우시겠습니까?')) {
            this.cart = [];
            this.updateCartDisplay();
        }
    },
    
    /**
     * 주문에 추가
     */
    async addToOrder() {
        if (this.cart.length === 0) return;
        
        try {
            const response = await fetch('/api/pos/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: POSCore.storeId,
                    tableNumber: this.currentTable,
                    items: this.cart,
                    totalAmount: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    orderType: 'POS'
                })
            });
            
            if (response.ok) {
                // 장바구니 초기화
                this.cart = [];
                this.updateCartDisplay();
                
                // 주문 목록 새로고침
                await this.loadCurrentOrders(POSCore.storeId, this.currentTable);
                document.getElementById('ordersTable').innerHTML = this.renderOrdersTable();
                
                // 버튼 상태 업데이트
                this.updateOrderButtons();
                
                alert('주문이 추가되었습니다.');
            } else {
                const errorData = await response.json();
                alert(errorData.error || '주문 추가에 실패했습니다.');
            }
            
        } catch (error) {
            console.error('❌ 주문 추가 실패:', error);
            alert('주문 추가 중 오류가 발생했습니다.');
        }
    },
    
    /**
     * 결제 화면으로 이동
     */
    goToPayment() {
        if (this.currentOrders.length === 0) {
            alert('결제할 주문이 없습니다.');
            return;
        }
        
        const orderData = {
            items: this.currentOrders,
            total: this.currentOrders.reduce((sum, order) => sum + (order.price * order.quantity), 0)
        };
        
        POSCore.showPaymentScreen(this.currentTable, orderData);
    },
    
    /**
     * 버튼 상태 업데이트
     */
    updateOrderButtons() {
        const addOrderBtn = document.getElementById('addOrderBtn');
        const paymentBtn = document.getElementById('paymentBtn');
        
        if (addOrderBtn) addOrderBtn.disabled = this.currentOrders.length === 0;
        if (paymentBtn) paymentBtn.disabled = this.currentOrders.length === 0;
    },
    
    /**
     * 상태 텍스트 반환
     */
    getStatusText(status) {
        const statusMap = {
            'PENDING': '대기',
            'COOKING': '조리중',
            'READY': '완료',
            'SERVED': '서빙완료'
        };
        return statusMap[status] || '대기';
    },
    
    /**
     * 기본 메뉴 데이터
     */
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
        this.updateCartDisplay();
        this.updateOrderButtons();
    },
    
    // 기타 기능들 (추후 구현)
    showTableInfo() { alert('테이블정보 기능 (추후 구현)'); },
    printKitchen() { alert('주방출력 기능 (추후 구현)'); },
    changeQuantity(orderId, change) { alert('수량변경 기능 (추후 구현)'); },
    removeOrder(orderId) { alert('주문삭제 기능 (추후 구현)'); }
};

// 전역 함수로 등록
window.POSOrderScreen = POSOrderScreen;
