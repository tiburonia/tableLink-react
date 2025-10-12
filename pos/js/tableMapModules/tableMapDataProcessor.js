
/**
 * 데이터 처리 및 로딩 담당 모듈
 */
const TableMapDataProcessor = {
    /**
     * 테이블 정보 로드 (통합 API 사용)
     */
    async loadTables(storeId) {
        try {
            // 단일 API로 모든 테이블과 주문 정보 조회
            const response = await fetch(`/api/pos/store/${storeId}/tables`);
            const data = await response.json();

            if (!data.success || !data.tables || data.tables.length === 0) {
                console.log("❌ 등록된 테이블이 없습니다.");
                return [];
            }

            const tables = data.tables;

            // API 응답 데이터를 테이블맵 형식으로 변환
            const tablesWithDetails = tables.map(table => {
                const hasCrossOrders = table.orders.length > 1;
                const isTLLMixed = hasCrossOrders && 
                    table.orders.some(o => o.source === 'TLL') && 
                    table.orders.some(o => o.source === 'POS');

                // orders 배열을 orderItems 형식으로 변환
                const allOrderItems = [];
                let totalAmount = 0;
                let totalItemCount = 0;
                let mainOrder = null;
                let spareOrder = null;

                table.orders.forEach(order => {
                    Object.entries(order.items).forEach(([menuName, quantity]) => {
                        allOrderItems.push({
                            menu_name: menuName,
                            quantity: quantity,
                            order_type: order.source.toLowerCase()
                        });
                        totalItemCount += quantity;
                    });

                    // source별 주문 구분
                    if (order.source === 'TLL') {
                        mainOrder = {
                            sourceSystem: 'TLL',
                            openedAt: order.createdAt,
                            items: order.items
                        };
                    } else if (order.source === 'POS') {
                        spareOrder = {
                            sourceSystem: 'POS',
                            openedAt: order.createdAt,
                            items: order.items
                        };
                    }
                });

                const consolidatedItems = hasCrossOrders 
                    ? this.consolidateOrderItemsWithType(allOrderItems)
                    : this.consolidateOrderItems(allOrderItems);

                const primaryOrder = table.orders[0];

                return {
                    tableNumber: table.tableNumber,
                    id: table.id,
                    capacity: table.capacity,
                    isActive: table.status !== 'INACTIVE',
                    isOccupied: table.isOccupied,
                    totalAmount: totalAmount,
                    orderCount: totalItemCount,
                    isFromTLG: primaryOrder?.source === 'TLL',
                    occupiedSince: primaryOrder?.createdAt,
                    orderItems: consolidatedItems,
                    hasCrossOrders: hasCrossOrders,
                    isSharedOrder: isTLLMixed,
                    mainOrder: mainOrder,
                    spareOrder: spareOrder,
                    allOrders: table.orders,
                    isTLLMixed: isTLLMixed
                };
            });

            tablesWithDetails.sort((a, b) => a.tableNumber - b.tableNumber);

            console.log(`✅ 통합 API로 테이블 ${tablesWithDetails.length}개 로드 완료 (단일 요청)`);
            return tablesWithDetails;
        } catch (error) {
            console.error("❌ 테이블 정보 로드 실패:", error);
            return [];
        }
    },

    /**
     * 주문 아이템 통합 (메뉴명과 단가로 그룹화)
     */
    consolidateOrderItems(orderItems) {
        const consolidated = {};

        orderItems.forEach((item) => {
            const key = `${item.menu_name}_${item.unit_price}`;

            if (consolidated[key]) {
                consolidated[key].quantity += item.quantity;
            } else {
                consolidated[key] = {
                    menuName: item.menu_name,
                    price: item.unit_price,
                    quantity: item.quantity,
                    cookStation: item.cook_station || "KITCHEN",
                };
            }
        });

        return Object.values(consolidated);
    },

    /**
     * 교차 주문용 아이템 통합 (주문 타입별로 구분)
     */
    consolidateOrderItemsWithType(orderItems) {
        const consolidated = {};

        orderItems.forEach((item) => {
            const key = `${item.menu_name}_${item.unit_price}_${item.order_type || 'main'}`;

            if (consolidated[key]) {
                consolidated[key].quantity += item.quantity;
            } else {
                consolidated[key] = {
                    menuName: item.menu_name,
                    price: item.unit_price,
                    quantity: item.quantity,
                    cookStation: item.cook_station || "KITCHEN",
                    orderType: item.order_type || 'main'
                };
            }
        });

        return Object.values(consolidated);
    },

    /**
     * 티켓별 아이템 그룹핑
     */
    groupItemsByTicket(items, source) {
        const ticketGroups = {};
        
        items.forEach(item => {
            const ticketId = item.ticket_id;
            
            if (!ticketGroups[ticketId]) {
                ticketGroups[ticketId] = {
                    ticketId: ticketId,
                    source: source,
                    items: [],
                    totalAmount: 0,
                    itemCount: 0,
                    createdAt: item.created_at
                };
            }
            
            ticketGroups[ticketId].items.push(item);
            ticketGroups[ticketId].totalAmount += item.total_price || 0;
            ticketGroups[ticketId].itemCount += 1;
        });
        
        return Object.values(ticketGroups);
    },

    /**
     * TLL 연동 여부 확인
     */
    async checkTLLIntegration(storeId, tableNumber) {
        try {
            const response = await fetch(
                `/api/tables/stores/${storeId}/table/${tableNumber}/tll-status`
            );
            const data = await response.json();

            return data.success ? data.hasTLLIntegration : false;
        } catch (error) {
            console.error("❌ TLL 연동 상태 확인 실패:", error);
            return false;
        }
    }
};

window.TableMapDataProcessor = TableMapDataProcessor;
