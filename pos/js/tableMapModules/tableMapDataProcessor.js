
/**
 * 데이터 처리 및 로딩 담당 모듈
 */
const TableMapDataProcessor = {
    /**
     * 테이블 정보 로드 (교차 주문 지원)
     */
    async loadTables(storeId) {
        try {
            const tablesResponse = await fetch(`/api/tables/stores/${storeId}`);
            const tablesData = await tablesResponse.json();

            if (!tablesData.success || !tablesData.tables || tablesData.tables.length === 0) {
                console.log("❌ 등록된 테이블이 없습니다.");
                return [];
            }

            const ordersResponse = await fetch(`/api/pos/stores/${storeId}/orders/active`);
            const ordersData = await ordersResponse.json();

            const tablesWithDetails = await Promise.all(
                tablesData.tables.map(async (dbTable) => {
                    const tableOrders = ordersData.success
                        ? ordersData.activeOrders.filter((order) => order.tableNumber === dbTable.tableNumber)
                        : [];

                    const hasPhysicalCrossOrders = tableOrders.length > 1;
                    const hasLogicalMixedOrder = tableOrders.some(order => order.is_mixed === true);

                    let hasTLLMixedOrder = false;
                    let tableStatusData = null;
                    
                    try {
                        const tableStatusResponse = await fetch(`/api/pos/stores/${storeId}/table/${dbTable.id}/status`);
                        if (tableStatusResponse.ok) {
                            tableStatusData = await tableStatusResponse.json();
                            if (tableStatusData.success && tableStatusData.table) {
                                const { processing_order_id, spare_processing_order_id } = tableStatusData.table;
                                hasTLLMixedOrder = (
                                    processing_order_id !== null && 
                                    spare_processing_order_id !== null &&
                                    parseInt(processing_order_id) === parseInt(spare_processing_order_id)
                                );
                            }
                        }
                    } catch (error) {
                        console.warn(`⚠️ 테이블 ${dbTable.tableNumber} TLL 연동 상태 확인 실패:`, error.message);
                    }

                    const hasCrossOrders = hasPhysicalCrossOrders || hasLogicalMixedOrder || hasTLLMixedOrder;

                    const mainOrder = tableOrders.find(order => order.orderType === 'main');
                    const spareOrder = tableOrders.find(order => order.orderType === 'spare');

                    let processedMainOrder = mainOrder;
                    let processedSpareOrder = spareOrder;

                    if (hasPhysicalCrossOrders && !hasTLLMixedOrder) {
                        if (mainOrder) {
                            processedMainOrder = {
                                ...mainOrder,
                                sourceSystem: mainOrder.sourceSystem || 'POS',
                                totalAmount: mainOrder.totalAmount || 0,
                                openedAt: mainOrder.openedAt || new Date().toISOString()
                            };
                        }
                        if (spareOrder) {
                            processedSpareOrder = {
                                ...spareOrder,
                                sourceSystem: spareOrder.sourceSystem || 'POS',
                                totalAmount: spareOrder.totalAmount || 0,
                                openedAt: spareOrder.openedAt || new Date().toISOString()
                            };
                        }
                    }

                    const primaryOrder = mainOrder || tableOrders[0];

                    let allOrderItems = [];
                    let totalAmount = 0;
                    let totalItemCount = 0;

                    if (hasTLLMixedOrder) {
                        try {
                            const mixedOrderResponse = await fetch(
                                `/api/pos/stores/${storeId}/table/${dbTable.id}/mixed-order-items`
                            );
                            
                            if (mixedOrderResponse.ok) {
                                const mixedOrderData = await mixedOrderResponse.json();
                                
                                if (mixedOrderData.success && mixedOrderData.orderItems) {
                                    const tllItems = mixedOrderData.orderItems.filter(item => item.ticket_source === 'TLL');
                                    const posItems = mixedOrderData.orderItems.filter(item => item.ticket_source === 'POS');
                                    
                                    const tllOrderItems = tllItems.map(item => ({
                                        id: item.id,
                                        menuName: item.menu_name,
                                        price: item.unit_price,
                                        quantity: item.quantity,
                                        totalPrice: item.total_price,
                                        cookStation: item.cook_station || 'KITCHEN',
                                        orderType: 'tll_mixed',
                                        ticket_source: 'TLL'
                                    }));
                                    
                                    const posOrderItems = posItems.map(item => ({
                                        id: item.id,
                                        menuName: item.menu_name,
                                        price: item.unit_price,
                                        quantity: item.quantity,
                                        totalPrice: item.total_price,
                                        cookStation: item.cook_station || 'KITCHEN',
                                        orderType: 'pos_mixed',
                                        ticket_source: 'POS'
                                    }));
                                    
                                    allOrderItems = [...tllOrderItems, ...posOrderItems];
                                    totalAmount = mixedOrderData.totalAmount || 0;
                                    totalItemCount = allOrderItems.length;
                                }
                            }
                        } catch (error) {
                            console.error(`❌ TLL 연동 교차주문 아이템 로드 실패: 테이블 ${dbTable.tableNumber}`, error);
                            allOrderItems = [];
                            totalAmount = 0;
                            totalItemCount = 0;
                        }
                    } else {
                        for (const order of tableOrders) {
                            try {
                                let orderItems = [];

                                if (order.sourceSystem === 'TLL') {
                                    const tllItemsResponse = await fetch(
                                        `/api/pos/stores/${storeId}/table/${dbTable.id}/tll-orders`
                                    );
                                    const tllItemsData = await tllItemsResponse.json();

                                    if (tllItemsData.success && tllItemsData.tllOrders) {
                                        const orderSpecificItems = tllItemsData.tllOrders.filter(item => 
                                            item.order_id === order.checkId
                                        );

                                        const convertedItems = orderSpecificItems.map(item => ({
                                            id: item.id,
                                            menu_id: item.menu_id || item.id,
                                            menu_name: item.menu_name,
                                            unit_price: item.unit_price,
                                            quantity: item.quantity,
                                            total_price: item.total_price,
                                            cook_station: item.cook_station || 'KITCHEN',
                                            item_status: item.item_status || 'READY',
                                            order_type: order.orderType
                                        }));

                                        orderItems = convertedItems;
                                    }
                                } else {
                                    const itemsResponse = await fetch(
                                        `/api/pos/stores/${storeId}/table/${dbTable.id}/order-items`
                                    );
                                    const itemsData = await itemsResponse.json();

                                    if (itemsData.success && itemsData.orderItems) {
                                        const orderSpecificItems = itemsData.orderItems.filter(item => 
                                            item.order_id === order.checkId
                                        );

                                        orderItems = orderSpecificItems.map(item => ({
                                            ...item,
                                            order_type: order.orderType
                                        }));
                                    }
                                }

                                allOrderItems.push(...orderItems);
                                totalAmount += order.totalAmount || 0;
                                totalItemCount += order.itemCount || 0;

                            } catch (error) {
                                console.error(
                                    `❌ 테이블 ${dbTable.tableNumber} 주문 ${order.checkId} 아이템 로드 실패:`,
                                    error
                                );
                            }
                        }
                    }

                    const consolidatedItems = hasCrossOrders 
                        ? this.consolidateOrderItemsWithType(allOrderItems)
                        : this.consolidateOrderItems(allOrderItems);

                    return {
                        tableNumber: dbTable.tableNumber,
                        id: dbTable.id,
                        capacity: dbTable.capacity || 4,
                        isActive: dbTable.isActive !== false,
                        isOccupied: tableOrders.length > 0,
                        totalAmount: totalAmount,
                        orderCount: totalItemCount,
                        isFromTLG: primaryOrder?.sourceSystem === "TLL",
                        occupiedSince: primaryOrder?.openedAt,
                        checkId: primaryOrder?.checkId,
                        orderItems: consolidatedItems,
                        hasCrossOrders: hasCrossOrders,
                        mainOrder: processedMainOrder,
                        spareOrder: processedSpareOrder,
                        allOrders: tableOrders,
                        isTLLMixed: hasTLLMixedOrder
                    };
                })
            );

            tablesWithDetails.sort((a, b) => a.tableNumber - b.tableNumber);

            console.log(`✅ 실제 테이블 ${tablesWithDetails.length}개 로드 완료 (교차 주문 지원)`);
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
