/**
 * 교차주문 렌더링 담당 모듈
 */
const CrossOrderRenderer = {
    /**
     * 교차주문 컨텐츠 렌더링
     */
    renderCrossOrderContent(table) {
        const tllItems = table.orderItems.filter(item => item.source === 'TLL');
        const posItems = table.orderItems.filter(item => item.source === 'POS');

        const tllAmount = tllItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const posAmount = posItems.reduce((sum, item) => sum + item.totalPrice, 0);

        const time = TableMapRenderer.formatOccupiedTime(table.occupiedSince);

        return `
            <div class="receipt-card tll-mixed-order">
                <div class="receipt-header">
                    <div class="receipt-header-left">
                        <div class="receipt-subtitle">🔗 TLL+POS 교차주문</div>
                    </div>
                    <div class="receipt-time">${time}</div>
                </div>

                <div class="receipt-body cross-order-body">
                    <div class="cross-order-section tll-section">
                        <div class="cross-order-header">
                            <span class="order-badge tll-badge">TLL</span>
                            <span class="order-amount">${tllAmount.toLocaleString()}원</span>
                        </div>
                        <div class="cross-order-items">
                            ${this.renderOrderItems(tllItems, 2)}
                        </div>
                    </div>

                    ${tllItems.length > 0 && posItems.length > 0 ? '<div class="cross-order-divider"></div>' : ''}

                    <div class="cross-order-section pos-section">
                        <div class="cross-order-header">
                            <span class="order-badge pos-badge">POS</span>
                            <span class="order-amount">${posAmount.toLocaleString()}원</span>
                        </div>
                        <div class="cross-order-items">
                            ${this.renderOrderItems(posItems, 2)}
                        </div>
                    </div>
                </div>

                <div class="receipt-footer">
                    <div class="receipt-total tll-mixed-total">
                        총 ${table.totalAmount.toLocaleString()}원
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 주문 아이템 렌더링
     */
    renderOrderItems(items, maxItems = 2) {
        if (!items || items.length === 0) {
            return `<div class="cross-order-empty">주문 없음</div>`;
        }

        const consolidated = TableMapDataProcessor.consolidateOrderItems(items);
        const displayItems = consolidated.slice(0, maxItems);
        const hasMore = consolidated.length > maxItems;

        const itemsHTML = displayItems
            .map(item => {
                const name = TableMapRenderer.truncateMenuName(item.menuName, 6);
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
    }
};

window.CrossOrderRenderer = CrossOrderRenderer;