
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
                        console.log(`🔗 TLL 연동 교차주문 아이템 로드: 테이블 ${dbTable.tableNumber}, POI=SPOI`);
                        try {
                            // 새로운 shared-order API 사용 (POI=SPOI 감지 및 source별 그룹핑)
                            const sharedOrderResponse = await fetch(
                                `/api/pos/stores/${storeId}/table/${dbTable.id}/shared-order`
                            );
                            
                            if (sharedOrderResponse.ok) {
                                const sharedOrderData = await sharedOrderResponse.json();
                                
                                if (sharedOrderData.success && sharedOrderData.isSharedOrder && sharedOrderData.sourceGroups) {
                                    console.log(`✅ POI=SPOI 확인됨: 테이블 ${dbTable.tableNumber}, 주문 ID ${sharedOrderData.sharedOrderId}`);
                                    
                                    // source별 그룹핑된 데이터를 orderItems로 변환
                                    const allItems = [];
                                    
                                    // TLL source 그룹 처리
                                    if (sharedOrderData.sourceGroups.TLL) {
                                        const tllItems = sharedOrderData.sourceGroups.TLL.items.map(item => ({
                                            id: item.id,
                                            menuName: item.menuName,
                                            menu_name: item.menuName, // 백엔드 호환성
                                            price: item.unitPrice,
                                            unit_price: item.unitPrice, // 백엔드 호환성
                                            quantity: item.quantity,
                                            totalPrice: item.totalPrice,
                                            total_price: item.totalPrice, // 백엔드 호환성
                                            cookStation: item.cookStation || 'KITCHEN',
                                            cook_station: item.cookStation || 'KITCHEN', // 백엔드 호환성
                                            orderType: 'tll_mixed',
                                            order_type: 'tll_mixed', // 백엔드 호환성
                                            ticket_source: 'TLL',
                                            ticket_id: item.ticketId
                                        }));
                                        allItems.push(...tllItems);
                                        
                                        // TLL 티켓 그룹핑
                                        const tllTickets = this.groupItemsByTicket(tllItems, 'TLL');
                                        processedMainOrder = {
                                            sourceSystem: 'TLL',
                                            totalAmount: sharedOrderData.sourceGroups.TLL.totalAmount || 0,
                                            openedAt: primaryOrder?.openedAt,
                                            tickets: tllTickets
                                        };
                                    }
                                    
                                    // POS source 그룹 처리
                                    if (sharedOrderData.sourceGroups.POS) {
                                        const posItems = sharedOrderData.sourceGroups.POS.items.map(item => ({
                                            id: item.id,
                                            menuName: item.menuName,
                                            menu_name: item.menuName, // 백엔드 호환성
                                            price: item.unitPrice,
                                            unit_price: item.unitPrice, // 백엔드 호환성
                                            quantity: item.quantity,
                                            totalPrice: item.totalPrice,
                                            total_price: item.totalPrice, // 백엔드 호환성
                                            cookStation: item.cookStation || 'KITCHEN',
                                            cook_station: item.cookStation || 'KITCHEN', // 백엔드 호환성
                                            orderType: 'pos_mixed',
                                            order_type: 'pos_mixed', // 백엔드 호환성
                                            ticket_source: 'POS',
                                            ticket_id: item.ticketId
                                        }));
                                        allItems.push(...posItems);
                                        
                                        // POS 티켓 그룹핑
                                        const posTickets = this.groupItemsByTicket(posItems, 'POS');
                                        processedSpareOrder = {
                                            sourceSystem: 'POS', 
                                            totalAmount: sharedOrderData.sourceGroups.POS.totalAmount || 0,
                                            openedAt: primaryOrder?.openedAt,
                                            tickets: posTickets
                                        };
                                    }
                                    
                                    allOrderItems = allItems;
                                    totalAmount = sharedOrderData.totalAmount || 0;
                                    totalItemCount = sharedOrderData.totalItemCount || allItems.length;
                                    
                                    console.log(`✅ TLL 연동 교차주문 데이터 처리 완료: 테이블 ${dbTable.tableNumber}, 총 ${totalItemCount}개 아이템, ${totalAmount}원`);
                                } else {
                                    console.warn(`⚠️ 공유 주문이 아님: 테이블 ${dbTable.tableNumber}`);
                                    allOrderItems = [];
                                    totalAmount = 0;
                                    totalItemCount = 0;
                                }
                            } else {
                                console.error(`❌ shared-order API 호출 실패: 테이블 ${dbTable.tableNumber}`, sharedOrderResponse.status);
                                allOrderItems = [];
                                totalAmount = 0;
                                totalItemCount = 0;
                            }
                        } catch (error) {
                            console.error(`❌ TLL 연동 교차주문 아이템 로드 실패: 테이블 ${dbTable.tableNumber}`, error);
                            allOrderItems = [];
                            totalAmount = 0;
                            totalItemCount = 0;
                        }
                    } else {
                        // 일반 교차주문 처리


                        ///////////////////////////////////////////////
                        for (const order of tableOrders) {
                            try {
                                let orderItems = [];
                                let orderTickets = [];

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
                                            order_type: order.orderType,
                                            ticket_id: item.ticket_id
                                        }));

                                        orderItems = convertedItems;
                                        orderTickets = this.groupItemsByTicket(orderSpecificItems, 'TLL');
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
                                        
                                        orderTickets = this.groupItemsByTicket(orderSpecificItems, 'POS');
                                    }
                                }

                                allOrderItems.push(...orderItems);
                                totalAmount += order.totalAmount || 0;
                                totalItemCount += order.itemCount || 0;

                                // 주문별 티켓 정보 저장
                                if (order.orderType === 'main') {
                                    processedMainOrder = {
                                        ...processedMainOrder,
                                        tickets: orderTickets
                                    };
                                } else if (order.orderType === 'spare') {
                                    processedSpareOrder = {
                                        ...processedSpareOrder,
                                        tickets: orderTickets
                                    };
                                }

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
                        // TLL 연동 교차주문 플래그 (POI=SPOI)
                        isSharedOrder: hasTLLMixedOrder,
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
