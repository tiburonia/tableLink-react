
/**
 * 테이블 렌더링 담당 모듈
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
                    <button class="top-btn" onclick="POSTableMap.showOrderStatus()">
                        📊 주문현황
                    </button>
                    <button class="top-btn" onclick="POSTableMap.showSalesStatus()">
                        💰 매출현황
                    </button>
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
                    <div class="table-grid" id="tableGrid" style="display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(4, 1fr); gap: 16px; width: 100%;  aspect-ratio: 1;">
                        ${tables.map((table) => this.renderTableCard(table)).join("")}
                    </div>
                </div>
                ${this.renderSidePanel()}
            </div>
        `;
    },

    /**
     * 테이블 카드 렌더링
     */
    renderTableCard(table) {
        const statusClass = this.getTableStatusClass(table);

        return `
            <div class="table-card ${statusClass}" 
                 data-table-number="${table.tableNumber}"
                 onclick="POSTableMap.selectTable(${table.tableNumber})">

                <!-- 좌측 상단 테이블 번호 -->
                <div class="table-number-small">${table.tableNumber}</div>

                <!-- 중앙 아이콘 및 상태 텍스트 -->
                ${table.isOccupied ? this.renderOccupiedContent(table) : this.renderEmptyContent()}

            </div>
        `;
    },

    /**
     * 점유된 테이블 내용 렌더링
     */
    renderOccupiedContent(table) {
        if (table.hasCrossOrders) {
            return CrossOrderRenderer.renderCrossOrderContent(table);
        } else {
            const orderItemsHTML = this.renderReceiptOrderItems(table.orderItems || []);
            const sourceText = table.isFromTLG ? "TLL 주문" : "POS 주문";
            const occupiedTime = this.formatOccupiedTime(table.occupiedSince);
            const orderSourceClass = table.isFromTLG ? "tll-order" : "pos-order";

            return `
                <div class="receipt-card ${orderSourceClass}">
                    <div class="receipt-header">
                        <div class="receipt-header-left">
                            <div class="receipt-subtitle">${sourceText}</div>
                        </div>
                        <div class="receipt-time">${occupiedTime}</div>
                    </div>

                    <div class="receipt-body">
                        ${orderItemsHTML}
                    </div>

                    <div class="receipt-footer">
                        <div class="receipt-total">
                            ${(table.totalAmount || 0).toLocaleString()}원
                        </div>
                    </div>
                </div>
            `;
        }
    },

    /**
     * 빈 테이블 내용 렌더링
     */
    renderEmptyContent() {
        return ``;
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
     * 영수증 스타일 주문 아이템 렌더링
     */
    renderReceiptOrderItems(orderItems) {
        if (!orderItems || orderItems.length === 0) {
            return `
                <div class="receipt-empty">
                    <div class="receipt-empty-text">주문 없음</div>
                </div>
            `;
        }

        const displayItems = orderItems.slice(0, 3);
        const hasMore = orderItems.length > 3;

        const itemsHTML = displayItems
            .map((item) => {
                const truncatedName = this.truncateMenuName(item.menuName, 8);
                return `
                <div class="receipt-item">
                    <div class="receipt-item-name">${truncatedName}</div>
                    <div class="receipt-item-qty">× ${item.quantity}</div>
                </div>
            `;
            })
            .join("");

        const moreHTML = hasMore
            ? `<div class="receipt-item receipt-more">
                <div class="receipt-item-name">외 ${orderItems.length - 3}개</div>
                <div class="receipt-item-qty"></div>
            </div>`
            : "";

        return `
            <div class="receipt-items">
                ${itemsHTML}
                ${moreHTML}
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
        
        const isTLLMixedOrder = table.orderItems && table.orderItems.some(item => 
            item.order_type === 'tll_mixed' || item.order_type === 'pos_mixed'
        );
        
        if (isTLLMixedOrder) return "status-tll-mixed-order";
        if (table.hasCrossOrders) return "status-cross-order";
        if (table.isFromTLG) return "status-tlg";
        return "status-occupied";
    }
};

window.TableMapRenderer = TableMapRenderer;
