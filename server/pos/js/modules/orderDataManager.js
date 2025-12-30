
/**
 * 주문 데이터 관리 모듈
 * - 주문 데이터 로드/저장
 * - API 통신 처리
 * - 데이터 통합 및 변환
 */

const OrderDataManager = {
    /**
     * 기존 주문 로드 (DB에서 order_items 직접 로드, 수량 통합, UNPAID만)
     */
    async loadCurrentOrders(storeId, tableNumber) {
        try {
            console.log(`🔍 POS 주문 로드 시작: 매장 ${storeId}, 테이블 ${tableNumber}`);

            // POS 주문 로드 (order_items 기준, UNPAID 상태만)
            const response = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/order-items`);
            const data = await response.json();

            console.log(`📊 POS 주문 API 응답:`, {
                success: data.success,
                itemCount: data.orderItems?.length || 0,
                hasItems: !!(data.orderItems && data.orderItems.length > 0),
            });

            if (data.success && data.orderItems && data.orderItems.length > 0) {
                // 추가 필터링: 확실히 미지불 상태만 (PAID 상태 완전 배제)
                const unpaidItems = data.orderItems.filter((item) => {
                    const isUnpaid = item.paid_status === "UNPAID";
                    const isPaid = item.paid_status === "PAID";
                    const isActiveOrder = item.order_status === "OPEN";
                    const isActiveItem = !["CANCELLED", "REFUNDED"].includes(item.item_status);

                    // PAID 상태는 무조건 제외
                    if (isPaid) {
                        console.warn(`🚫 PAID 상태 아이템 제거:`, {
                            menu_name: item.menu_name,
                            paid_status: item.paid_status,
                            ticket_id: item.ticket_id,
                        });
                        return false;
                    }

                    const shouldInclude = isUnpaid && isActiveOrder && isActiveItem;

                    if (!shouldInclude) {
                        console.log(`🚫 필터링된 아이템:`, {
                            menu_name: item.menu_name,
                            paid_status: item.paid_status,
                            order_status: item.order_status,
                            item_status: item.item_status,
                            reason: !isUnpaid ? "not_unpaid" : !isActiveOrder ? "closed_order" : "inactive_item",
                        });
                    }

                    return shouldInclude;
                });

                console.log(`📋 필터링 결과: ${data.orderItems.length}개 → ${unpaidItems.length}개 (미지불만)`);

                // 완전 통합 처리
                const consolidatedOrders = this.consolidateOrderItems(unpaidItems);

                console.log(`✅ 통합 완료 - 최종 결과:`, {
                    원본아이템수: unpaidItems.length,
                    통합후메뉴수: consolidatedOrders.length,
                    통합데이터: consolidatedOrders.map((order) => ({
                        메뉴명: order.menuName,
                        수량: order.quantity,
                        관련티켓수: order.ticketIds?.length || 1,
                    })),
                });

                return consolidatedOrders;
            } else {
                console.log(`ℹ️ 로드할 주문이 없음`);
                return [];
            }
        } catch (error) {
            console.error("❌ 기존 주문 로드 실패:", error);
            return [];
        }
    },

    /**
     * 주문 아이템 통합 처리 (수량 누적 버그 수정)
     */
    consolidateOrderItems(unpaidItems) {
        console.log(`🔄 주문 아이템 통합 처리 시작: ${unpaidItems.length}개 아이템`);

        const consolidatedOrders = {};

        unpaidItems.forEach((item, index) => {
            // 메뉴명과 단가만으로 통합 키 생성 (티켓 무관하게 통합)
            const consolidationKey = `${item.menu_name.trim()}_${item.unit_price}`;
            
            // 아이템 수량 검증 (0 이하면 1로 보정)
            const itemQuantity = (item.quantity && item.quantity > 0) ? item.quantity : 1;
            
            console.log(`📋 아이템 처리 [${index + 1}/${unpaidItems.length}]: ${item.menu_name} (수량: ${itemQuantity}, 키: ${consolidationKey})`);

            if (consolidatedOrders[consolidationKey]) {
                // 기존 키에 수량 누적 (기존 수량 + 새로운 수량)
                const previousQuantity = consolidatedOrders[consolidationKey].quantity;
                consolidatedOrders[consolidationKey].quantity += itemQuantity;
                
                console.log(`🔄 기존 키에 수량 누적: ${consolidationKey} (${previousQuantity} + ${itemQuantity} = ${consolidatedOrders[consolidationKey].quantity})`);

                // 티켓 ID 중복 방지하면서 추가
                if (!consolidatedOrders[consolidationKey].ticketIds.includes(item.ticket_id)) {
                    consolidatedOrders[consolidationKey].ticketIds.push(item.ticket_id);
                    console.log(`📝 티켓 ID 추가: ${item.ticket_id}`);
                }

                // 아이템 ID 추가
                consolidatedOrders[consolidationKey].orderItemIds.push(item.id);
            } else {
                // 새로운 통합 키 생성 (수량을 정확히 itemQuantity로 설정)
                consolidatedOrders[consolidationKey] = {
                    id: item.menu_id || item.id,
                    menuId: item.menu_id || item.id, // menuId 필드 추가
                    menuName: item.menu_name,
                    price: item.unit_price,
                    quantity: itemQuantity, // 검증된 수량 사용
                    cookingStatus: item.item_status || "PENDING",
                    isCart: false,
                    orderItemId: item.id,
                    orderItemIds: [item.id],
                    ticketId: item.ticket_id,
                    ticketIds: [item.ticket_id],
                    cookStation: item.cook_station || "KITCHEN",
                };

                console.log(`➕ 새 통합 메뉴 생성: ${item.menu_name} (수량: ${itemQuantity}, 키: ${consolidationKey})`);
            }
        });

        const consolidatedArray = Object.values(consolidatedOrders);

        // 최종 검증 및 디버깅
        console.log(`🔍 통합 전후 비교:`);
        console.log(`   - 원본 아이템 총 수량: ${unpaidItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}개`);
        console.log(`   - 통합 후 총 수량: ${consolidatedArray.reduce((sum, order) => sum + order.quantity, 0)}개`);

        // 수량이 0 이하인 항목 제거
        const validatedArray = consolidatedArray.filter(order => {
            if (order.quantity <= 0) {
                console.warn(`⚠️ 수량이 0 이하인 메뉴 제거: ${order.menuName} (수량: ${order.quantity})`);
                return false;
            }
            return true;
        });

        console.log(`✅ 통합 처리 완료: ${unpaidItems.length}개 아이템 → ${validatedArray.length}개 메뉴`);
        console.log(`📊 최종 통합 결과:`, validatedArray.map(order => ({
            메뉴명: order.menuName,
            수량: order.quantity,
            단가: order.price,
            관련티켓수: order.ticketIds.length
        })));

        return validatedArray;
    },

    /**
     * TLL 주문 로드
     */
    async loadTLLOrders(storeId, tableNumber) {
        try {
            console.log(`🔍 TLL 주문 로드 시작: 매장 ${storeId}, 테이블 ${tableNumber}`);

            const url = `/api/pos/stores/${storeId}/table/${tableNumber}/tll-orders`;
            console.log(`📡 TLL 주문 API 호출: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API 요청 실패 (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            console.log(`📊 TLL 주문 API 응답:`, data);

            if (data.success) {
                const tllOrders = data.tllOrders || [];
                const tllUserInfo = data.userInfo || null;

                console.log(`✅ TLL 주문 ${tllOrders.length}개 로드 완료`);
                console.log(`👤 TLL 사용자 정보:`, tllUserInfo?.name || "없음");

                // TLL 주문 세부 정보 로깅
                if (tllOrders.length > 0) {
                    console.log(`📋 TLL 주문 첫 번째 아이템:`, tllOrders[0]);
                }

                return { tllOrders, tllUserInfo };
            } else {
                console.warn("⚠️ TLL 주문 API 응답이 실패 상태:", data.error);
                return { tllOrders: [], tllUserInfo: null };
            }
        } catch (error) {
            console.error("❌ TLL 주문 로드 실패:", error);
            console.error("❌ 에러 상세:", {
                message: error.message,
                stack: error.stack,
                storeId,
                tableNumber,
            });
            return { tllOrders: [], tllUserInfo: null };
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
                const menuData = data.menu.map((menu) => ({
                    ...menu,
                    isHot: Math.random() > 0.7, // 임시 핫메뉴 로직
                }));

                console.log(`✅ 메뉴 ${menuData.length}개 로드`);
                return menuData;
            } else {
                return this.getDefaultMenu();
            }
        } catch (error) {
            console.error("❌ 메뉴 데이터 로드 실패:", error);
            return this.getDefaultMenu();
        }
    },

    /**
     * 세션 데이터 로드
     */
    async loadSessionData(storeId, tableNumber) {
        if (!tableNumber) return null;

        try {
            const response = await fetch(`/api/orders/current-session/${storeId}/${tableNumber}`);
            const data = await response.json();

            if (data.success && data.session) {
                const currentSession = data.session;
                const sessionItems = data.session.orderItems || [];

                console.log("✅ 세션 데이터 로드:", currentSession);
                return { currentSession, sessionItems };
            } else {
                return { currentSession: null, sessionItems: [] };
            }
        } catch (error) {
            console.error("❌ 세션 데이터 로드 실패:", error);
            return { currentSession: null, sessionItems: [] };
        }
    },

    /**
     * TLL 주문의 is_mixed 상태를 실제 API에서 다시 조회
     */
    async refreshTLLOrderMixedStatus(orderId) {
        try {
            console.log(`🔍 TLL 주문 ${orderId}의 is_mixed 상태 새로고침`);

            const response = await fetch(`/api/pos/orders/${orderId}/mixed-status`);

            if (!response.ok) {
                console.warn(`⚠️ TLL 주문 상태 조회 실패 (${response.status})`);
                return false;
            }

            const data = await response.json();

            if (data.success) {
                console.log(`✅ TLL 주문 ${orderId} is_mixed 상태 업데이트: ${data.is_mixed}`);
                return data.is_mixed;
            } else {
                console.warn(`⚠️ TLL 주문 상태 응답 실패: ${data.error}`);
                return false;
            }
        } catch (error) {
            console.error('❌ TLL 주문 상태 새로고침 실패:', error);
            return false;
        }
    },

    /**
     * TLL 연동 활성화 API 호출
     */
    async enableTLLConnection(orderId) {
        try {
            console.log(`🔗 TLL 연동 활성화 요청: 주문 ID ${orderId}`);

            const response = await fetch(`/api/pos/orders/${orderId}/enable-mixed`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'TLL 연동 활성화 실패');
            }

            const result = await response.json();
            console.log('✅ TLL 연동 활성화 완료:', result);

            return { success: true, result };
        } catch (error) {
            console.error('❌ TLL 연동 활성화 실패:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * TLL 세션 종료 API 호출
     */
    async endTLLSession(orderId) {
        try {
            console.log(`🔚 TLL 세션 종료 요청: 주문 ID ${orderId}`);

            const response = await fetch(`/api/orders/${orderId}/end-session`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "TLL 세션 종료 실패");
            }

            const result = await response.json();
            console.log("✅ TLL 세션 종료 완료:", result);

            return { success: true, result };
        } catch (error) {
            console.error("❌ TLL 세션 종료 실패:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 주문 수량 수정 API 호출
     */
    

    /**
     * 기본 메뉴 데이터
     */
    getDefaultMenu() {
        return [
            { id: 1, name: "김치찌개", price: 8000, category: "찌개류" },
            { id: 2, name: "된장찌개", price: 7000, category: "찌개류" },
            { id: 3, name: "불고기", price: 15000, category: "구이류" },
            { id: 4, name: "비빔밥", price: 9000, category: "밥류" },
            { id: 5, name: "콜라", price: 2000, category: "음료" },
            { id: 6, name: "사이다", price: 2000, category: "음료" },
        ];
    }
};

// 전역으로 등록
window.OrderDataManager = OrderDataManager;
