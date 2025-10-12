
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
                let totalItemCount = 0;
                let tllOrder = null;
                let posOrder = null;
                let tllAmount = 0;
                let posAmount = 0;

                table.orders.forEach(order => {
                    let orderTotalAmount = 0;
                    
                    Object.entries(order.items).forEach(([menuName, quantity]) => {
                        // 기본 단가 설정 (실제로는 메뉴 정보에서 가져와야 함)
                        const estimatedPrice = 18000; // 치킨 평균 가격
                        const itemTotal = estimatedPrice * quantity;
                        orderTotalAmount += itemTotal;
                        
                        allOrderItems.push({
                            menuName: menuName,
                            menu_name: menuName,
                            quantity: quantity,
                            orderType: order.source === 'TLL' ? 'main' : 'spare',
                            order_type: order.source === 'TLL' ? 'main' : 'spare',
                            ticket_source: order.source,
                            price: estimatedPrice,
                            unit_price: estimatedPrice,
                            totalPrice: itemTotal,
                            total_price: itemTotal
                        });
                        totalItemCount += quantity;
                    });

                    // source별 주문 구분 및 금액 계산
                    if (order.source === 'TLL') {
                        tllAmount += orderTotalAmount;
                        tllOrder = {
                            sourceSystem: 'TLL',
                            openedAt: order.createdAt,
                            items: order.items,
                            totalAmount: orderTotalAmount
                        };
                    } else if (order.source === 'POS') {
                        posAmount += orderTotalAmount;
                        posOrder = {
                            sourceSystem: 'POS',
                            openedAt: order.createdAt,
                            items: order.items,
                            totalAmount: orderTotalAmount
                        };
                    }
                });

                // 교차주문인 경우 타입별로 통합
                const consolidatedItems = hasCrossOrders 
                    ? this.consolidateOrderItemsWithType(allOrderItems)
                    : this.consolidateOrderItems(allOrderItems);

                const primaryOrder = table.orders[0];
                const totalAmount = tllAmount + posAmount;

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
                    mainOrder: tllOrder || posOrder, // TLL 우선, 없으면 POS
                    spareOrder: tllOrder && posOrder ? posOrder : null, // 양쪽 다 있을 때만 설정
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
            const key = `${item.menu_name}_${item.unit_price}_${item.order_type || 'main'}_${item.ticket_source || 'UNKNOWN'}`;

            if (consolidated[key]) {
                consolidated[key].quantity += item.quantity;
                consolidated[key].totalPrice = (consolidated[key].totalPrice || 0) + (item.totalPrice || item.total_price || 0);
            } else {
                consolidated[key] = {
                    menuName: item.menu_name,
                    price: item.unit_price,
                    quantity: item.quantity,
                    cookStation: item.cook_station || "KITCHEN",
                    orderType: item.order_type || 'main',
                    ticket_source: item.ticket_source || 'UNKNOWN',
                    totalPrice: item.totalPrice || item.total_price || (item.unit_price * item.quantity)
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
