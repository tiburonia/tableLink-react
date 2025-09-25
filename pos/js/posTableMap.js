/**
 * POS 테이블맵 화면 (OK POS 스타일)
 */

const POSTableMap = {
    /**
     * 테이블맵 화면 렌더링
     */
    async render(storeId, storeInfo) {
        try {
            console.log("🗺️ 테이블맵 화면 렌더링");

            // 테이블 정보 로드
            const tables = await this.loadTables(storeId);

            const main = document.getElementById("posMain");
            main.innerHTML = `
                ${this.renderTopBar(storeInfo)}
                ${this.renderMainContent(tables)}
            `;

            // 실시간 업데이트 시작
            this.startRealtimeUpdates(storeId);

            // 시간 업데이트 시작
            this.startTimeUpdate();
        } catch (error) {
            console.error("❌ 테이블맵 렌더링 실패:", error);
            POSCore.showError("테이블맵을 불러올 수 없습니다.");
        }
    },

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
     * 테이블 카드 렌더링 (교차 주문 지원)
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
     * 점유된 테이블 내용 렌더링 (교차 주문 지원)
     */
    renderOccupiedContent(table) {
        if (table.hasCrossOrders) {
            // 교차 주문인 경우
            return this.renderCrossOrderContent(table);
        } else {
            // 단일 주문인 경우 (기존 로직)
            const orderItemsHTML = this.renderReceiptOrderItems(
                table.orderItems || [],
            );
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
     * 교차 주문 컨텐츠 렌더링 (TLL 연동 교차주문 지원)
     */
    renderCrossOrderContent(table) {
        // TLL 연동 교차주문인지 확인
        const isTLLMixedOrder = table.orderItems.some(item => 
            item.order_type === 'tll_mixed' || item.order_type === 'pos_mixed'
        );

        if (isTLLMixedOrder) {
            // TLL 연동 교차주문을 위한 파라미터 구성
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
        console.log(`🔗 TLL 연동 교차주문 파라미터 준비: 테이블 ${table.tableNumber}`, {
            원본orderItems: table.orderItems?.length || 0,
            orderItems: table.orderItems
        });

        // orderItems가 없거나 비어있는 경우 처리
        if (!table.orderItems || table.orderItems.length === 0) {
            console.warn(`⚠️ TLL 연동 교차주문 - orderItems가 비어있음: 테이블 ${table.tableNumber}`);
            return {
                ...table,
                mainOrder: { sourceSystem: 'TLL', totalAmount: 0, openedAt: table.occupiedSince },
                spareOrder: { sourceSystem: 'POS', totalAmount: 0, openedAt: table.occupiedSince },
                orderItems: [],
                isTLLMixed: true
            };
        }

        // ticket_source별로 아이템 분리
        const tllItems = table.orderItems.filter(item => item.ticket_source === 'TLL');
        const posItems = table.orderItems.filter(item => item.ticket_source === 'POS');

        console.log(`🔗 TLL 연동 교차주문 아이템 분리: 테이블 ${table.tableNumber}`, {
            TLL아이템: tllItems.length,
            POS아이템: posItems.length,
            tllItems: tllItems,
            posItems: posItems
        });

        // 각 소스별 금액 계산
        const tllAmount = tllItems.reduce((sum, item) => sum + (item.totalPrice || item.total_price || 0), 0);
        const posAmount = posItems.reduce((sum, item) => sum + (item.totalPrice || item.total_price || 0), 0);

        // 가짜 mainOrder와 spareOrder 생성 (기존 함수와 호환되도록)
        const mockMainOrder = {
            sourceSystem: 'TLL',
            totalAmount: tllAmount,
            openedAt: table.occupiedSince
        };

        const mockSpareOrder = {
            sourceSystem: 'POS',
            totalAmount: posAmount,
            openedAt: table.occupiedSince
        };

        // 아이템들을 main/spare 타입으로 변환 및 중복 제거
        const consolidatedTllItems = this.consolidateOrderItems(tllItems.map(item => ({
            menu_name: item.menuName || item.menu_name || '메뉴명 없음',
            unit_price: item.price || item.unit_price || item.totalPrice || item.total_price || 0,
            quantity: item.quantity || 1,
            cook_station: item.cook_station || 'KITCHEN'
        })));

        const consolidatedPosItems = this.consolidateOrderItems(posItems.map(item => ({
            menu_name: item.menuName || item.menu_name || '메뉴명 없음',
            unit_price: item.price || item.unit_price || item.totalPrice || item.total_price || 0,
            quantity: item.quantity || 1,
            cook_station: item.cook_station || 'KITCHEN'
        })));

        const convertedTllItems = consolidatedTllItems.map(item => ({
            orderType: 'main',
            menuName: item.menuName,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
            ticket_source: 'TLL'
        }));

        const convertedPosItems = consolidatedPosItems.map(item => ({
            orderType: 'spare',
            menuName: item.menuName,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
            ticket_source: 'POS'
        }));

        const result = {
            ...table,
            mainOrder: mockMainOrder,
            spareOrder: mockSpareOrder,
            orderItems: [...convertedTllItems, ...convertedPosItems],
            // TLL 연동임을 표시하는 플래그 추가
            isTLLMixed: true
        };

        console.log(`✅ TLL 연동 교차주문 파라미터 준비 완료: 테이블 ${table.tableNumber}`, {
            총아이템수: result.orderItems.length,
            TLL금액: tllAmount,
            POS금액: posAmount,
            변환된아이템: result.orderItems.map(item => ({ 
                name: item.menuName, 
                type: item.orderType, 
                source: item.ticket_source 
            }))
        });

        return result;
    },

    /**
     * 일반 교차주문 컨텐츠 렌더링 (TLL 연동 교차주문도 지원)
     */
    renderRegularCrossOrderContent(table) {
        const mainOrder = table.mainOrder;
        const spareOrder = table.spareOrder;

        // TLL 연동 교차주문인지 확인
        const isTLLMixed = table.isTLLMixed || false;

        // 메인 주문 정보
        const mainSourceText = mainOrder?.sourceSystem === 'TLL' ? "TLL" : "POS";
        const mainTime = this.formatOccupiedTime(mainOrder?.openedAt);

        // 보조 주문 정보
        const spareSourceText = spareOrder?.sourceSystem === 'TLL' ? "TLL" : "POS";
        const spareTime = this.formatOccupiedTime(spareOrder?.openedAt);

        // 주문별 아이템 분리
        const mainItems = table.orderItems.filter(item => item.orderType === 'main' || !item.orderType);
        const spareItems = table.orderItems.filter(item => item.orderType === 'spare');

        // TLL 연동인 경우 다른 스타일과 제목 사용
        const cardClass = isTLLMixed ? "receipt-card tll-mixed-order" : "receipt-card cross-order";
        const subtitle = isTLLMixed ? "🔗 TLL연동" : "교차 주문";
        const totalClass = isTLLMixed ? "receipt-total tll-mixed-total" : "receipt-total cross-total";
        
        // TLL 연동인 경우 배지 스타일 변경
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
                    <!-- 메인 주문 (TLL) -->
                    <div class="cross-order-section ${isTLLMixed ? 'tll-section' : 'main-order'}">
                        <div class="cross-order-header">
                            <span class="${mainBadgeClass}">${mainSourceText}</span>
                            <span class="order-amount">${(mainOrder?.totalAmount || 0).toLocaleString()}원</span>
                        </div>
                        <div class="cross-order-items">
                            ${this.renderCrossOrderItems(mainItems, 2)}
                        </div>
                    </div>

                    <!-- 구분선 (양쪽 모두 주문이 있을 때만 표시) -->
                    ${mainItems.length > 0 && spareItems.length > 0 ? '<div class="cross-order-divider"></div>' : ''}

                    <!-- 보조 주문 (POS) -->
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

        // 메뉴별로 수량 통합 (중복 제거)
        const consolidatedItems = this.consolidateOrderItems(orderItems);
        
        const displayItems = consolidatedItems.slice(0, maxItems);
        const hasMore = consolidatedItems.length > maxItems;

        const itemsHTML = displayItems
            .map((item) => {
                const truncatedName = this.truncateMenuName(item.menuName, 6);
                return `
                <div class="cross-order-item">
                    <span class="item-name">${truncatedName}</span>
                    <span class="item-quantity">×${item.quantity}</span>
                </div>
            `;
            })
            .join("");

        const moreHTML = hasMore
            ? `<div class="cross-order-item more">외 ${consolidatedItems.length - maxItems}개</div>`
            : "";

        return itemsHTML + moreHTML;
    },

    /**
     * 주문 아이템 목록 렌더링 (격자 형태)
     */
    renderOrderItemsList(orderItems) {
        if (!orderItems || orderItems.length === 0) {
            return "";
        }

        // 최대 4개 아이템 표시 (격자에 맞게)
        const displayItems = orderItems.slice(0, 4);
        const hasMore = orderItems.length > 4;

        const itemsHTML = displayItems
            .map((item) => {
                const truncatedName = this.truncateMenuName(item.menuName, 6);
                return `
                <div class="order-item-grid">
                    <span class="item-name">${truncatedName}</span>
                    <span class="item-quantity">${item.quantity}개</span>
                </div>
            `;
            })
            .join("");

        const moreHTML = hasMore
            ? `
            <div class="order-item-grid more-items">
                <span class="item-name">외 ${orderItems.length - 4}개</span>
                <span class="item-quantity"></span>
            </div>
        `
            : "";

        return `
            <div class="order-items-grid">
                ${itemsHTML}
                ${moreHTML}
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

        // 최대 3개 아이템 표시
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
            ? `
            <div class="receipt-item receipt-more">
                <div class="receipt-item-name">외 ${orderItems.length - 3}개</div>
                <div class="receipt-item-qty"></div>
            </div>
        `
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
                    <button class="side-btn" onclick="POSTableMap.moveTable()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">
                        이동
                    </button>
                    <button class="side-btn" onclick="POSTableMap.splitTable()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">
                        분할
                    </button>
                    <button class="side-btn" onclick="POSTableMap.groupTable()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">
                        단체
                    </button>
                </div>

                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">영수증/출력</h3>
                    <button class="side-btn" onclick="POSTableMap.receiptManagement()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">
                        영수증<br>관리
                    </button>
                    <button class="side-btn" onclick="POSTableMap.reprintReceipt()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">
                        재출력
                    </button>
                </div>

                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">현황/시스템</h3>
                    <button class="side-btn" onclick="POSTableMap.showSalesStatus()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">
                        판매<br>현황
                    </button>
                    <button class="side-btn" onclick="POSTableMap.showSettings()" style="width: 100%; background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-align: center; transition: all 0.2s;">
                        ⚙️ 설정
                    </button>
                </div>

                <div>
                    <h3 style="font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">시스템</h3>
                    <button class="side-btn logout-btn" onclick="POSTableMap.logout()" style="width: 100%; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; text-align: center; transition: all 0.2s;">
                        🚪 종료
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * 테이블 정보 로드 (교차 주문 지원)
     */
    async loadTables(storeId) {
        try {
            // 테이블 기본 정보 조회
            const tablesResponse = await fetch(`/api/tables/stores/${storeId}`);
            const tablesData = await tablesResponse.json();

            if (
                !tablesData.success ||
                !tablesData.tables ||
                tablesData.tables.length === 0
            ) {
                console.log("❌ 등록된 테이블이 없습니다.");
                return [];
            }

            // 활성 주문 정보 조회 (교차 주문 포함)
            const ordersResponse = await fetch(
                `/api/pos/stores/${storeId}/orders/active`,
            );
            const ordersData = await ordersResponse.json();

            // 각 테이블별 주문 정보 처리
            const tablesWithDetails = await Promise.all(
                tablesData.tables.map(async (dbTable) => {
                    // 해당 테이블의 모든 주문 찾기 (메인 + 보조)
                    const tableOrders = ordersData.success
                        ? ordersData.activeOrders.filter(
                              (order) => order.tableNumber === dbTable.tableNumber,
                          )
                        : [];

                    // 교차 주문 여부 확인 (물리적 분리 + 논리적 혼합 + TLL 연동 혼합)
                    const hasPhysicalCrossOrders = tableOrders.length > 1;
                    const hasLogicalMixedOrder = tableOrders.some(order => order.is_mixed === true);

                    // TLL 연동 교차주문 확인 (processing_order_id = spare_processing_order_id인 경우)
                    let hasTLLMixedOrder = false;
                    let tableStatusData = null;
                    
                    try {
                        // store_tables에서 해당 테이블의 주문 ID 상태 확인 (실제 DB의 ID 사용)
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

                                if (hasTLLMixedOrder) {
                                    console.log(`🔗 TLL 연동 교차주문 감지: 테이블 ${dbTable.tableNumber}, 주문 ID ${processing_order_id}`);
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`⚠️ 테이블 ${dbTable.tableNumber} TLL 연동 상태 확인 실패:`, error.message);
                    }

                    const hasCrossOrders = hasPhysicalCrossOrders || hasLogicalMixedOrder || hasTLLMixedOrder;

                    console.log(`🔍 테이블 ${dbTable.tableNumber} 교차주문 확인:`, {
                        물리적교차: hasPhysicalCrossOrders,
                        논리적혼합: hasLogicalMixedOrder,
                        TLL연동혼합: hasTLLMixedOrder,
                        최종판정: hasCrossOrders,
                        주문수: tableOrders.length,
                        혼합주문: tableOrders.filter(o => o.is_mixed).map(o => o.order_id)
                    });

                    const mainOrder = tableOrders.find(order => order.orderType === 'main');
                    const spareOrder = tableOrders.find(order => order.orderType === 'spare');

                    // 기본적으로 메인 주문 정보 사용, 없으면 첫 번째 주문
                    const primaryOrder = mainOrder || tableOrders[0];

                    let allOrderItems = [];
                    let totalAmount = 0;
                    let totalItemCount = 0;

                    // TLL 연동 교차주문 특별 처리
                    if (hasTLLMixedOrder) {
                        console.log(`🔗 TLL 연동 교차주문 아이템 로드: 테이블 ${dbTable.tableNumber}`);
                        
                        try {
                            // 해당 주문의 모든 티켓과 아이템 조회 (정확한 테이블 ID 사용)
                            const mixedOrderResponse = await fetch(
                                `/api/pos/stores/${storeId}/table/${dbTable.id}/mixed-order-items`,
                            );
                            
                            if (mixedOrderResponse.ok) {
                                const mixedOrderData = await mixedOrderResponse.json();
                                
                                if (mixedOrderData.success && mixedOrderData.orderItems) {
                                    // source별로 아이템 분리
                                    const tllItems = mixedOrderData.orderItems.filter(item => item.ticket_source === 'TLL');
                                    const posItems = mixedOrderData.orderItems.filter(item => item.ticket_source === 'POS');
                                    
                                    console.log(`🔗 TLL 연동 교차주문 아이템 분리: 테이블 ${dbTable.tableNumber}, TLL ${tllItems.length}개, POS ${posItems.length}개`);
                                    
                                    // TLL 아이템 처리
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
                                    
                                    // POS 아이템 처리
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
                                    
                                    console.log(`✅ TLL 연동 교차주문 데이터 처리 완료: 테이블 ${dbTable.tableNumber}, 총 ${totalItemCount}개 아이템, ${totalAmount}원`);
                                }
                            }
                        } catch (error) {
                            console.error(`❌ TLL 연동 교차주문 아이템 로드 실패: 테이블 ${dbTable.tableNumber}`, error);
                            // 에러 시 기존 로직으로 fallback
                            allOrderItems = [];
                            totalAmount = 0;
                            totalItemCount = 0;
                        }
                    } else {
                        // 기존 교차주문 또는 일반 주문 처리
                        for (const order of tableOrders) {
                            try {
                                let orderItems = [];

                                if (order.sourceSystem === 'TLL') {
                                    // TLL 주문의 경우 TLL 주문 API 사용
                                    console.log(`📱 TLL 주문 아이템 조회: 테이블 ${dbTable.tableNumber} (ID: ${dbTable.id}), 주문 ${order.checkId}`);
                                    const tllItemsResponse = await fetch(
                                        `/api/pos/stores/${storeId}/table/${dbTable.id}/tll-orders`,
                                    );
                                    const tllItemsData = await tllItemsResponse.json();

                                    if (tllItemsData.success && tllItemsData.tllOrders) {
                                        // 해당 주문의 아이템만 필터링
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
                                    // POS 주문의 경우 기존 로직 사용
                                    const itemsResponse = await fetch(
                                        `/api/pos/stores/${storeId}/table/${dbTable.id}/order-items`,
                                    );
                                    const itemsData = await itemsResponse.json();

                                    if (itemsData.success && itemsData.orderItems) {
                                        // 해당 주문의 아이템만 필터링
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
                                    error,
                                );
                            }
                        }
                    }

                    // 메뉴별로 수량 통합 (교차 주문의 경우 구분 표시)
                    const consolidatedItems = hasCrossOrders 
                        ? this.consolidateOrderItemsWithType(allOrderItems)
                        : this.consolidateOrderItems(allOrderItems);

                    return {
                        tableNumber: dbTable.tableNumber,
                        capacity: dbTable.capacity || 4,
                        isActive: dbTable.isActive !== false,
                        isOccupied: tableOrders.length > 0,
                        totalAmount: totalAmount,
                        orderCount: totalItemCount,
                        isFromTLG: primaryOrder?.sourceSystem === "TLL",
                        occupiedSince: primaryOrder?.openedAt,
                        checkId: primaryOrder?.checkId,
                        orderItems: consolidatedItems,
                        // 교차 주문 관련 정보 추가
                        hasCrossOrders: hasCrossOrders,
                        mainOrder: mainOrder,
                        spareOrder: spareOrder,
                        allOrders: tableOrders
                    };
                }),
            );

            // 테이블 번호순으로 정렬
            tablesWithDetails.sort((a, b) => a.tableNumber - b.tableNumber);

            console.log(
                `✅ 실제 테이블 ${tablesWithDetails.length}개 로드 완료 (교차 주문 지원)`,
            );
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
     * 테이블 상태 클래스 반환 (TLL 연동 교차 주문 지원)
     */
    getTableStatusClass(table) {
        if (!table.isOccupied) return "status-empty";
        
        // TLL 연동 교차주문 확인
        const isTLLMixedOrder = table.orderItems && table.orderItems.some(item => 
            item.order_type === 'tll_mixed' || item.order_type === 'pos_mixed'
        );
        
        if (isTLLMixedOrder) return "status-tll-mixed-order";
        if (table.hasCrossOrders) return "status-cross-order";
        if (table.isFromTLG) return "status-tlg";
        return "status-occupied";
    },

    /**
     * 테이블 상태 아이콘 반환
     */
    getTableStatusIcon(table) {
        if (!table.isOccupied) return "🪑";
        if (table.isFromTLG) return "📱";
        return "🍽️";
    },

    /**
     * 테이블 상태 텍스트 반환
     */
    getTableStatusText(table) {
        if (!table.isOccupied) return "빈자리";
        if (table.isFromTLG) return "TLG 주문";
        return `주문중 (${table.orderCount}개)`;
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
     * TLL 연동 여부 확인
     */
    async checkTLLIntegration(storeId, tableNumber) {
        try {
            const response = await fetch(
                `/api/tables/stores/${storeId}/table/${tableNumber}/tll-status`,
            );
            const data = await response.json();

            return data.success ? data.hasTLLIntegration : false;
        } catch (error) {
            console.error("❌ TLL 연동 상태 확인 실패:", error);
            return false; // 에러 시 비연동으로 간주
        }
    },

    /**
     * 테이블 선택
     */
    async selectTable(tableNumber) {
        try {
            console.log(`🪑 테이블 ${tableNumber} 선택`);

            // TLL 연동 여부 확인
            const hasTLLIntegration = await this.checkTLLIntegration(
                POSCore.storeId,
                tableNumber,
            );

            if (!hasTLLIntegration) {
                console.log(
                    `📱 테이블 ${tableNumber}은 TLL 미연동 - 비회원 POS 주문 모드`,
                );

                POSCore.showOrderScreen(tableNumber);

                return;
            }

            // TLL 연동된 테이블 - 기존 로직
            const response = await fetch(
                `/api/pos/stores/${POSCore.storeId}/table/${tableNumber}/session-status`,
            );
            const data = await response.json();

            if (data.success && data.hasActiveSession) {
                // 활성 세션이 있으면 주문 화면으로
                POSCore.showOrderScreen(tableNumber);
            } else {
                // 빈 테이블이면 새 세션 시작
                await this.startNewSession(tableNumber);
            }
        } catch (error) {
            console.error("❌ 테이블 선택 실패:", error);
            alert("테이블 정보를 불러올 수 없습니다.");
        }
    },

    /**
     * 새 세션 시작
     */
    async startNewSession(tableNumber) {
        try {
            const response = await fetch(
                `/api/pos/stores/${POSCore.storeId}/table/${tableNumber}/acquire-lock`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lockBy: "POS",
                        lockDuration: 1800000,
                    }), // 30분
                },
            );

            if (response.ok) {
                POSCore.showOrderScreen(tableNumber);
            } else {
                const errorData = await response.json();
                alert(errorData.error || "테이블을 사용할 수 없습니다.");
            }
        } catch (error) {
            console.error("❌ 새 세션 시작 실패:", error);
            alert("세션을 시작할 수 없습니다.");
        }
    },

    /**
     * 실시간 업데이트 시작 (SSE 방식)
     */
    startRealtimeUpdates(storeId) {
        this.initSSE(storeId);
    },

    /**
     * SSE 연결 초기화
     */
    initSSE(storeId) {
        try {
            console.log(`📡 POS SSE 연결 시작: 매장 ${storeId}`);

            // 기존 SSE 연결이 있으면 종료
            if (this.sseConnection) {
                this.sseConnection.close();
                this.sseConnection = null;
            }

            // 새 SSE 연결 생성
            this.sseConnection = new EventSource(`/api/sse/pos/${storeId}`);

            // 연결 성공
            this.sseConnection.onopen = () => {
                console.log(`✅ POS SSE 연결 성공: 매장 ${storeId}`);
            };

            // 메시지 수신
            this.sseConnection.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📡 POS SSE 메시지 수신:', data.type);

                    switch (data.type) {
                        case 'connected':
                            console.log('🔗 POS SSE 연결 확인:', data.topic);
                            break;
                        case 'heartbeat':
                            // 하트비트는 로그 생략
                            break;
                        case 'table_update':
                            this.handleTableUpdate(data.data);
                            break;
                        default:
                            console.log('📨 POS SSE 기타 메시지:', data);
                    }
                } catch (error) {
                    console.error('❌ POS SSE 메시지 파싱 실패:', error);
                }
            };

            // 연결 오류
            this.sseConnection.onerror = (error) => {
                console.error('❌ POS SSE 연결 오류:', error);

                // 3초 후 재연결 시도
                setTimeout(() => {
                    if (this.sseConnection && this.sseConnection.readyState === EventSource.CLOSED) {
                        console.log('🔄 POS SSE 재연결 시도...');
                        this.initSSE(storeId);
                    }
                }, 3000);
            };

            // 연결 종료
            this.sseConnection.addEventListener('close', () => {
                console.log('📡 POS SSE 연결 종료');
            });

        } catch (error) {
            console.error('❌ POS SSE 초기화 실패:', error);

            // 폴백: 30초 후 재시도
            setTimeout(() => {
                this.initSSE(storeId);
            }, 30000);
        }
    },

    /**
     * 테이블 업데이트 처리
     */
    async handleTableUpdate(updateData) {
        try {
            console.log(`🔄 테이블 업데이트 수신: ${updateData.tables?.length || 0}개 테이블`);

            // 전체 테이블 데이터 다시 로드 (기존 로직 유지)
            const tables = await this.loadTables(updateData.storeId);
            this.updateTableGrid(tables);

        } catch (error) {
            console.error('❌ 테이블 업데이트 처리 실패:', error);
        }
    },

    /**
     * SSE 연결 종료
     */
    closeSSE() {
        if (this.sseConnection) {
            this.sseConnection.close();
            this.sseConnection = null;
            console.log('📡 POS SSE 연결 수동 종료');
        }
    },

    /**
     * 테이블 그리드 업데이트
     */
    updateTableGrid(tables) {
        const tableGrid = document.getElementById("tableGrid");
        if (tableGrid) {
            tableGrid.innerHTML = tables
                .map((table) => this.renderTableCard(table))
                .join("");
        }
    },

    /**
     * 시간 업데이트 시작
     */
    startTimeUpdate() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });

            const timeElement = document.getElementById("currentTime");
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    },

    // 기타 기능들 (추후 구현)
    showOrderStatus() {
        alert("주문현황 기능 (추후 구현)");
    },
    showSalesStatus() {
        alert("판매현황 기능 (추후 구현)");
    },
    showNotifications() {
        alert("알림 기능 (추후 구현)");
    },
    moveTable() {
        alert("테이블 이동 기능 (추후 구현)");
    },
    splitTable() {
        alert("테이블 분할 기능 (추후 구현)");
    },
    groupTable() {
        alert("단체 테이블 기능 (추후 구현)");
    },
    receiptManagement() {
        alert("영수증 관리 기능 (추후 구현)");
    },
    reprintReceipt() {
        alert("재출력 기능 (추후 구현)");
    },
    showSettings() {
        alert("설정 기능 (추후 구현)");
    },
    logout() {
        if (confirm("POS를 종료하시겠습니까?")) {
            // SSE 연결 정리
            this.closeSSE();
            window.location.href = "/";
        }
    },
};

// 전역 함수로 등록
window.POSTableMap = POSTableMap;