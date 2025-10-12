/**
 * 테이블 렌더링 담당 모듈 (통합 버전)
 * - API 응답 데이터를 직접 사용
 * - 교차주문/일반주문 통합 처리
 */
const TableMapRenderer = {
    /**
     * 상단바 렌더링
     */
    renderTopBar(storeInfo) {
        return `
            <div class="pos-top-bar">
                <div class="top-bar-left">
                    <div class="store-info">
                        <span class="store-name">${storeInfo.name}</span>
                        <span class="separator">|</span>
                        <span class="employee-name">매니저</span>
                    </div>
                </div>

                <div class="top-bar-center">
                    <div class="current-time" id="currentTime">2024.01.27 (토) 22:31:45</div>
                </div>

                <div class="top-bar-right">
                    <button class="top-btn" onclick="POSTableMap.showOrderStatus()">📊 주문현황</button>
                    <button class="top-btn" onclick="POSTableMap.showSalesStatus()">💰 매출현황</button>
                    <button class="top-btn notification-btn" onclick="POSTableMap.showNotifications()">
                        🔔 <span class="notification-count">3</span>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * 메인 컨텐츠 렌더링
     */
    renderMainContent(tables) {
        return `
            <div class="pos-main-content" style="display: flex; height: calc(100vh - 70px); padding: 20px; gap: 20px; align-items: center;">
                <div style="flex: 1; display: flex; justify-content: center; align-items: center;">
                    <div class="table-grid" id="tableGrid" style="display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(4, 1fr); gap: 16px; width: 100%; aspect-ratio: 1;">
                        ${tables.map(table => this.renderTableCard(table)).join("")}
                    </div>
                </div>
                ${this.renderSidePanel()}
            </div>
        `;
    },

    /**
     * 테이블 카드 렌더링 (통합)
     */
    renderTableCard(table) {
        const statusClass = this.getTableStatusClass(table);

        return `
            <div class="table-card ${statusClass}" 
                 data-table-number="${table.tableNumber}"
                 onclick="POSTableMap.selectTable(${table.tableNumber})">
                <div class="table-number-small">${table.tableNumber}</div>
                ${table.isOccupied ? this.renderOrderContent(table) : ''}
            </div>
        `;
    },

    /**
     * 주문 컨텐츠 렌더링 (교차주문/일반주문 통합)
     */
    renderOrderContent(table) {
        const { orders } = table;

        // 교차주문 여부 확인
        const hasTLLOrder = orders.some(o => o.source === 'TLL');
        const hasPOSOrder = orders.some(o => o.source === 'POS');
        const isCrossOrder = hasTLLOrder && hasPOSOrder;

        if (isCrossOrder) {
            return this.renderCrossOrderCard(table);
        } else {
            return this.renderSingleOrderCard(table);
        }
    },

    /**
     * 교차주문 카드 렌더링 (TLL + POS)
     */
    renderCrossOrderCard(table) {
        const tllOrders = table.orders.filter(o => o.source === 'TLL');
        const posOrders = table.orders.filter(o => o.source === 'POS');

        const tllAmount = this.calculateTotalAmount(tllOrders);
        const posAmount = this.calculateTotalAmount(posOrders);
        const totalAmount = tllAmount + posAmount;

        const time = this.formatOccupiedTime(table.orders[0]?.createdAt);

        return `
            <div class="receipt-card tll-mixed-order">
                <div class="receipt-header">
                    <div class="receipt-header-left">
                    </div>
                    <div class="receipt-time">${time}</div>
                </div>

                <div class="receipt-body cross-order-body">
                    <!-- TLL 섹션 -->
                    <div class="cross-order-section tll-section">
                        <div class="cross-order-header">
                            <span class="order-badge tll-badge">TLL</span>
                            <span class="order-amount">${tllAmount.toLocaleString()}원</span>
                        </div>
                        <div class="cross-order-items">
                            ${this.renderOrderItems(tllOrders, 2)}
                        </div>
                    </div>

                    <div class="cross-order-divider"></div>

                    <!-- POS 섹션 -->
                    <div class="cross-order-section pos-section">
                        <div class="cross-order-header">
                            <span class="order-badge pos-badge">POS</span>
                            <span class="order-amount">${posAmount.toLocaleString()}원</span>
                        </div>
                        <div class="cross-order-items">
                            ${this.renderOrderItems(posOrders, 2)}
                        </div>
                    </div>
                </div>

                <div class="receipt-footer">
                    <div class="receipt-total tll-mixed-total">
                        총 ${totalAmount.toLocaleString()}원
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 일반 주문 카드 렌더링 (TLL 또는 POS)
     */
    renderSingleOrderCard(table) {
        const order = table.orders[0];
        const source = order.source === 'TLL' ? 'TLL 주문' : 'POS 주문';
        const orderClass = order.source === 'TLL' ? 'tll-order' : 'pos-order';
        const time = this.formatOccupiedTime(order.createdAt);
        const totalAmount = this.calculateTotalAmount(table.orders);

        return `
            <div class="receipt-card ${orderClass}">
                <div class="receipt-header">
                    <div class="receipt-header-left">
                        <div class="receipt-subtitle">${source}</div>
                    </div>
                    <div class="receipt-time">${time}</div>
                </div>

                <div class="receipt-body">
                    ${this.renderOrderItems(table.orders, 3)}
                </div>

                <div class="receipt-footer">
                    <div class="receipt-total">
                        ${totalAmount.toLocaleString()}원
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 주문 아이템 렌더링 (API 데이터 직접 사용)
     */
    renderOrderItems(orders, maxItems = 3) {
        if (!orders || orders.length === 0) {
            return `<div class="receipt-empty"><div class="receipt-empty-text">주문 없음</div></div>`;
        }

        // 모든 주문의 아이템을 하나로 합침
        const allItems = [];
        orders.forEach(order => {
            Object.entries(order.items).forEach(([menuName, item]) => {
                allItems.push({
                    menuName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice
                });
            });
        });

        // 같은 메뉴 통합
        const consolidated = this.consolidateItems(allItems);
        const displayItems = consolidated.slice(0, maxItems);
        const hasMore = consolidated.length > maxItems;

        // 일반 주문과 교차주문에서 다른 스타일 적용
        const isCrossOrder = maxItems === 2;

        if (isCrossOrder) {
            const itemsHTML = displayItems
                .map(item => {
                    const name = this.truncateMenuName(item.menuName, 6);
                    return `
                        <div class="cross-order-item">
                            <span class="item-name">${name}</span>
                            <span class="item-quantity">×${item.quantity}</span>
                        </div>
                    `;
                })
                .join("");

            const moreHTML = hasMore
                ? `<div class="cross-order-item more">외 ${consolidated.length - maxItems}개</div>`
                : "";

            return itemsHTML + moreHTML;
        } else {
            const itemsHTML = displayItems
                .map(item => {
                    const name = this.truncateMenuName(item.menuName, 8);
                    return `
                        <div class="receipt-item">
                            <div class="receipt-item-name">${name}</div>
                            <div class="receipt-item-qty">× ${item.quantity}</div>
                        </div>
                    `;
                })
                .join("");

            const moreHTML = hasMore
                ? `<div class="receipt-item receipt-more">
                    <div class="receipt-item-name">외 ${consolidated.length - maxItems}개</div>
                    <div class="receipt-item-qty"></div>
                </div>`
                : "";

            return `<div class="receipt-items">${itemsHTML}${moreHTML}</div>`;
        }
    },

    /**
     * 아이템 통합 (같은 메뉴 합치기)
     */
    consolidateItems(items) {
        const map = new Map();

        items.forEach(item => {
            const key = item.menuName;

            if (map.has(key)) {
                const existing = map.get(key);
                existing.quantity += item.quantity;
                existing.totalPrice += item.totalPrice;
            } else {
                map.set(key, { ...item });
            }
        });

        return Array.from(map.values());
    },

    /**
     * 총 금액 계산
     */
    calculateTotalAmount(orders) {
        let total = 0;
        orders.forEach(order => {
            Object.values(order.items).forEach(item => {
                total += item.totalPrice;
            });
        });
        return total;
    },

    /**
     * 사이드 패널 렌더링
     */
    renderSidePanel() {
        return `
            <div style="width: 120px; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); padding: 20px; height: fit-content; flex-shrink: 0;">
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">테이블 관리</h3>
                    <button class="side-btn" onclick="POSTableMap.moveTable()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">이동</button>
                    <button class="side-btn" onclick="POSTableMap.splitTable()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">분할</button>
                    <button class="side-btn" onclick="POSTableMap.groupTable()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">단체</button>
                </div>

                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">영수증/출력</h3>
                    <button class="side-btn" onclick="POSTableMap.receiptManagement()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">영수증<br>관리</button>
                    <button class="side-btn" onclick="POSTableMap.reprintReceipt()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">재출력</button>
                </div>

                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">현황/시스템</h3>
                    <button class="side-btn" onclick="POSTableMap.showSalesStatus()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">판매<br>현황</button>
                    <button class="side-btn" onclick="POSTableMap.showSettings()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">⚙️ 설정</button>
                </div>

                <div>
                    <h3 style="font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">시스템</h3>
                    <button class="side-btn logout-btn" onclick="POSTableMap.logout()" style="width: 100%; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; text-align: center; transition: all 0.2s;">🚪 종료</button>
                </div>
            </div>
        `;
    },

    /**
     * 메뉴 이름 축약
     */
    truncateMenuName(menuName, maxLength) {
        if (!menuName) return "";
        if (menuName.length <= maxLength) return menuName;
        return menuName.substring(0, maxLength) + "...";
    },

    /**
     * 점유 시간 포맷
     */
    formatOccupiedTime(occupiedSince) {
        if (!occupiedSince) return "";

        const now = new Date();
        const occupied = new Date(occupiedSince);
        const diffMinutes = Math.floor((now - occupied) / (1000 * 60));

        if (diffMinutes < 60) {
            return `${diffMinutes}분`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            return `${hours}시간 ${minutes}분`;
        }
    },

    /**
     * 테이블 상태 클래스 반환
     */
    getTableStatusClass(table) {
        if (!table.isOccupied) return "status-empty";

        const hasTLLOrder = table.orders.some(o => o.source === 'TLL');
        const hasPOSOrder = table.orders.some(o => o.source === 'POS');
        const isCrossOrder = hasTLLOrder && hasPOSOrder;

        if (isCrossOrder) return "status-tll-mixed-order";
        if (table.orders[0]?.source === 'TLL') return "status-tlg";
        return "status-occupied";
    }
};

window.TableMapRenderer = TableMapRenderer;