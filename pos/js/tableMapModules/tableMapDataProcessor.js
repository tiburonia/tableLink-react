/**
 * 데이터 처리 및 로딩 담당 모듈
 */
const TableMapDataProcessor = {
    /**
     * 테이블 정보 로드 (통합 API 사용)
     */
    async loadTables(storeId) {
        try {
            const response = await fetch(`/api/pos/store/${storeId}/tables`);
            const data = await response.json();

            if (!data.success || !data.tables || data.tables.length === 0) {
                console.log("❌ 등록된 테이블이 없습니다.");
                return [];
            }

            // API 응답을 테이블맵 형식으로 변환
            const tables = data.tables.map(table => {
                // 주문 아이템 파싱
                const orderItems = [];
                let totalAmount = 0;

                table.orders.forEach(order => {
                    Object.entries(order.items).forEach(([menuName, item]) => {
                        const quantity = typeof item === 'number' ? item : item.quantity;
                        const unitPrice = typeof item === 'object' ? item.unitPrice : 0;
                        const itemTotal = typeof item === 'object' ? item.totalPrice : 0;

                        orderItems.push({
                            menuName,
                            quantity,
                            price: unitPrice,
                            totalPrice: itemTotal,
                            source: order.source
                        });

                        totalAmount += itemTotal;
                    });
                });

                // 교차주문 여부 확인
                const hasCrossOrders = table.orders.length > 1;
                const tllOrder = table.orders.find(o => o.source === 'TLL');
                const posOrder = table.orders.find(o => o.source === 'POS');
                const isTLLMixed = hasCrossOrders && tllOrder && posOrder;

                return {
                    tableNumber: table.tableNumber,
                    id: table.id,
                    isOccupied: table.isOccupied,
                    totalAmount,
                    orderItems,
                    hasCrossOrders,
                    isTLLMixed,
                    isFromTLG: table.orders[0]?.source === 'TLL',
                    occupiedSince: table.orders[0]?.createdAt,
                    tllOrder,
                    posOrder
                };
            });

            tables.sort((a, b) => a.tableNumber - b.tableNumber);
            console.log(`✅ 테이블 ${tables.length}개 로드 완료`);
            return tables;
        } catch (error) {
            console.error("❌ 테이블 정보 로드 실패:", error);
            return [];
        }
    },

    /**
     * 주문 아이템 통합 (같은 메뉴 합치기)
     */
    consolidateOrderItems(items) {
        const map = new Map();

        items.forEach(item => {
            const key = `${item.menuName}_${item.source || 'UNKNOWN'}`;

            if (map.has(key)) {
                const existing = map.get(key);
                existing.quantity += item.quantity;
                existing.totalPrice += item.totalPrice;
            } else {
                map.set(key, { ...item });
            }
        });

        return Array.from(map.values());
    }
};

window.TableMapDataProcessor = TableMapDataProcessor;