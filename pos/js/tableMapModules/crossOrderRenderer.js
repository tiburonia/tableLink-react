
/**
 * 교차주문 렌더링 담당 모듈
 */
const CrossOrderRenderer = {
    /**
     * 교차주문 컨텐츠 렌더링 (TLL 연동 교차주문 지원)
     */
    renderCrossOrderContent(table) {
        const isTLLMixedOrder = table.orderItems.some(item => 
            item.order_type === 'tll_mixed' || item.order_type === 'pos_mixed'
        );

        if (isTLLMixedOrder) {
            const tllMixedParams = this.prepareTLLMixedOrderParams(table);
            return this.renderRegularCrossOrderContent(tllMixedParams);
        } else {
            return this.renderRegularCrossOrderContent(table);
        }
    },

    /**
     * TLL 연동 교차주문을 위한 파라미터 준비
     */
    prepareTLLMixedOrderParams(table) {
        console.log(`🔗 TLL 연동 교차주문 파라미터 준비: 테이블 ${table.tableNumber}`);

        if (!table.orderItems || table.orderItems.length === 0) {
            return {
                ...table,
                mainOrder: { sourceSystem: 'TLL', totalAmount: 0, openedAt: table.occupiedSince },
                spareOrder: { sourceSystem: 'POS', totalAmount: 0, openedAt: table.occupiedSince },
                orderItems: [],
                isTLLMixed: true
            };
        }

        const tllTicketItems = table.orderItems.filter(item => item.ticket_source === 'TLL');
        const posTicketItems = table.orderItems.filter(item => item.ticket_source === 'POS');

        const tllAmount = tllTicketItems.reduce((sum, item) => {
            const price = item.totalPrice || item.total_price || (item.price || item.unit_price || 0) * (item.quantity || 1);
            return sum + price;
        }, 0);

        const posAmount = posTicketItems.reduce((sum, item) => {
            const price = item.totalPrice || item.total_price || (item.price || item.unit_price || 0) * (item.quantity || 1);
            return sum + price;
        }, 0);

        const mainOrder = {
            sourceSystem: 'TLL',
            totalAmount: tllAmount,
            openedAt: table.occupiedSince || new Date().toISOString()
        };

        const spareOrder = {
            sourceSystem: 'POS',
            totalAmount: posAmount,
            openedAt: table.occupiedSince || new Date().toISOString()
        };

        const convertedTllItems = tllTicketItems.map(item => ({
            orderType: 'main',
            menuName: item.menuName || item.menu_name || '메뉴명 없음',
            quantity: item.quantity || 1,
            price: item.price || item.unit_price || 0,
            totalPrice: item.totalPrice || item.total_price || (item.price || item.unit_price || 0) * (item.quantity || 1),
            ticket_source: 'TLL',
            cookStation: item.cook_station || 'KITCHEN'
        }));

        const convertedPosItems = posTicketItems.map(item => ({
            orderType: 'spare',
            menuName: item.menuName || item.menu_name || '메뉴명 없음',
            quantity: item.quantity || 1,
            price: item.price || item.unit_price || 0,
            totalPrice: item.totalPrice || item.total_price || (item.price || item.unit_price || 0) * (item.quantity || 1),
            ticket_source: 'POS',
            cookStation: item.cook_station || 'KITCHEN'
        }));

        return {
            ...table,
            mainOrder: mainOrder,
            spareOrder: spareOrder,
            orderItems: [...convertedTllItems, ...convertedPosItems],
            totalAmount: tllAmount + posAmount,
            isTLLMixed: true
        };
    },

    /**
     * 일반 교차주문 컨텐츠 렌더링
     */
    renderRegularCrossOrderContent(table) {
        if (!table.orderItems || table.orderItems.length === 0) {
            return `
                <div class="receipt-card cross-order">
                    <div class="receipt-header">
                        <div class="receipt-subtitle">교차 주문</div>
                    </div>
                    <div class="receipt-body">
                        <div class="cross-order-empty">주문 데이터를 불러오는 중...</div>
                    </div>
                </div>
            `;
        }

        const isTLLMixed = table.isTLLMixed || false;

        let mainOrder = table.mainOrder;
        let spareOrder = table.spareOrder;

        if (!mainOrder || !spareOrder) {
            if (isTLLMixed) {
                const tllItems = table.orderItems.filter(item => item.ticket_source === 'TLL');
                const posItems = table.orderItems.filter(item => item.ticket_source === 'POS');
                
                const tllAmount = tllItems.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity || 0), 0);
                const posAmount = posItems.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity || 0), 0);
                
                mainOrder = { sourceSystem: 'TLL', totalAmount: tllAmount, openedAt: table.occupiedSince };
                spareOrder = { sourceSystem: 'POS', totalAmount: posAmount, openedAt: table.occupiedSince };
            } else {
                const mainItems = table.orderItems.filter(item => 
                    item.orderType === 'main' || item.order_type === 'main' || (!item.orderType && !item.order_type)
                );
                const spareItems = table.orderItems.filter(item => 
                    item.orderType === 'spare' || item.order_type === 'spare'
                );
                
                const mainAmount = mainItems.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity || 0), 0);
                const spareAmount = spareItems.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity || 0), 0);
                
                mainOrder = { sourceSystem: 'POS', totalAmount: mainAmount, openedAt: table.occupiedSince };
                spareOrder = { sourceSystem: 'POS', totalAmount: spareAmount, openedAt: table.occupiedSince };
            }
        }

        let mainItems = [];
        let spareItems = [];

        if (isTLLMixed) {
            mainItems = table.orderItems.filter(item => 
                item.orderType === 'main' || item.ticket_source === 'TLL'
            );
            spareItems = table.orderItems.filter(item => 
                item.orderType === 'spare' || item.ticket_source === 'POS'
            );
        } else {
            mainItems = table.orderItems.filter(item => 
                item.orderType === 'main' || item.order_type === 'main' || (!item.orderType && !item.order_type)
            );
            spareItems = table.orderItems.filter(item => 
                item.orderType === 'spare' || item.order_type === 'spare'
            );
        }

        const mainSourceText = mainOrder?.sourceSystem === 'TLL' ? "TLL" : "POS";
        const mainTime = TableMapRenderer.formatOccupiedTime(mainOrder?.openedAt || table.occupiedSince);
        const spareSourceText = spareOrder?.sourceSystem === 'TLL' ? "TLL" : "POS";

        const cardClass = isTLLMixed ? "receipt-card tll-mixed-order" : "receipt-card cross-order";
        const subtitle = isTLLMixed ? "🔗 TLL연동 교차주문" : "교차 주문";
        const totalClass = isTLLMixed ? "receipt-total tll-mixed-total" : "receipt-total cross-total";
        
        const mainBadgeClass = isTLLMixed ? "order-badge tll-badge" : "order-badge main-badge";
        const spareBadgeClass = isTLLMixed ? "order-badge pos-badge" : "order-badge spare-badge";

        return `
            <div class="${cardClass}">
                <div class="receipt-header">
                    <div class="receipt-header-left">
                        <div class="receipt-subtitle">${subtitle}</div>
                    </div>
                    <div class="receipt-time">${mainTime}</div>
                </div>

                ${isTLLMixed ? `
                <div class="tll-mixed-notice">
                    <div class="mixed-notice-text">TLL + POS 연동주문</div>
                </div>
                ` : ''}

                <div class="receipt-body cross-order-body">
                    <div class="cross-order-section ${isTLLMixed ? 'tll-section' : 'main-order'}">
                        <div class="cross-order-header">
                            <span class="${mainBadgeClass}">${mainSourceText}</span>
                            <span class="order-amount">${(mainOrder?.totalAmount || 0).toLocaleString()}원</span>
                        </div>
                        <div class="cross-order-items">
                            ${mainItems.length > 0 ? this.renderCrossOrderItems(mainItems, 2) : '<div class="cross-order-empty">주문 없음</div>'}
                        </div>
                    </div>

                    ${mainItems.length > 0 && spareItems.length > 0 ? '<div class="cross-order-divider"></div>' : ''}

                    <div class="cross-order-section ${isTLLMixed ? 'pos-section' : 'spare-order'}">
                        <div class="cross-order-header">
                            <span class="${spareBadgeClass}">${spareSourceText}</span>
                            <span class="order-amount">${(spareOrder?.totalAmount || 0).toLocaleString()}원</span>
                        </div>
                        <div class="cross-order-items">
                            ${spareItems.length > 0 ? this.renderCrossOrderItems(spareItems, 2) : '<div class="cross-order-empty">추가 주문 대기중</div>'}
                        </div>
                    </div>
                </div>

                <div class="receipt-footer">
                    <div class="${totalClass}">
                        총 ${(table.totalAmount || 0).toLocaleString()}원
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 교차 주문용 아이템 렌더링
     */
    renderCrossOrderItems(orderItems, maxItems = 2) {
        if (!orderItems || orderItems.length === 0) {
            return `<div class="cross-order-empty">주문 없음</div>`;
        }

        const normalizedItems = orderItems.map(item => ({
            menuName: item.menuName || item.menu_name || '메뉴명 없음',
            quantity: item.quantity || 1,
            price: item.price || item.unit_price || 0,
            cookStation: item.cookStation || item.cook_station || 'KITCHEN'
        }));

        const consolidatedItems = TableMapDataProcessor.consolidateOrderItems(normalizedItems);
        const displayItems = consolidatedItems.slice(0, maxItems);
        const hasMore = consolidatedItems.length > maxItems;

        const itemsHTML = displayItems
            .map((item) => {
                const menuName = item.menuName || '메뉴명 없음';
                const quantity = item.quantity || 1;
                const truncatedName = TableMapRenderer.truncateMenuName(menuName, 6);
                return `
                <div class="cross-order-item">
                    <span class="item-name">${truncatedName}</span>
                    <span class="item-quantity">×${quantity}</span>
                </div>
            `;
            })
            .join("");

        const moreHTML = hasMore
            ? `<div class="cross-order-item more">외 ${consolidatedItems.length - maxItems}개</div>`
            : "";

        return itemsHTML + moreHTML;
    }
};

window.CrossOrderRenderer = CrossOrderRenderer;
