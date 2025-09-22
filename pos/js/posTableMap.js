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
                    <div class="table-grid" id="tableGrid" style="display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(5, 1fr); gap: 16px; width: 100%;  aspect-ratio: 1;">
                        ${tables.map((table) => this.renderTableCard(table)).join("")}
                    </div>
                </div>
                ${this.renderSidePanel()}
            </div>
        `;
    },

    /**
     * 테이블 카드 렌더링 (OK POS 스타일)
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
     * 점유된 테이블 내용 렌더링 (영수증 스타일)
     */
    renderOccupiedContent(table) {
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
     * 테이블 정보 로드
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

            // 활성 주문 정보 조회
            const ordersResponse = await fetch(
                `/api/pos/stores/${storeId}/orders/active`,
            );
            const ordersData = await ordersResponse.json();

            // 각 테이블별 주문 아이템 상세 정보 로드
            const tablesWithDetails = await Promise.all(
                tablesData.tables.map(async (dbTable) => {
                    const activeOrder = ordersData.success
                        ? ordersData.activeOrders.find(
                              (order) =>
                                  order.tableNumber === dbTable.tableNumber,
                          )
                        : null;

                    let orderItems = [];
                    if (activeOrder) {
                        try {
                            if (activeOrder.sourceSystem === 'TLL') {
                                // TLL 주문의 경우 TLL 주문 API 사용
                                console.log(`📱 TLL 주문 아이템 조회: 테이블 ${dbTable.tableNumber}`);
                                const tllItemsResponse = await fetch(
                                    `/api/pos/stores/${storeId}/table/${dbTable.tableNumber}/tll-orders`,
                                );
                                const tllItemsData = await tllItemsResponse.json();

                                if (tllItemsData.success && tllItemsData.tllOrders) {
                                    // TLL 주문 데이터를 POS 형식으로 변환 후 수량 통합
                                    const convertedItems = tllItemsData.tllOrders.map(item => ({
                                        id: item.id,
                                        menu_id: item.menu_id || item.id,
                                        menu_name: item.menu_name,
                                        unit_price: item.unit_price,
                                        quantity: item.quantity,
                                        total_price: item.total_price,
                                        cook_station: item.cook_station || 'KITCHEN',
                                        item_status: item.item_status || 'READY'
                                    }));

                                    const consolidatedItems = this.consolidateOrderItems(convertedItems);
                                    orderItems = consolidatedItems;
                                    console.log(`✅ TLL 주문 아이템 통합 완료: ${convertedItems.length}개 → ${consolidatedItems.length}개`);
                                }
                            } else {
                                // POS 주문의 경우 기존 로직 사용
                                const itemsResponse = await fetch(
                                    `/api/pos/stores/${storeId}/table/${dbTable.tableNumber}/order-items`,
                                );
                                const itemsData = await itemsResponse.json();

                                if (itemsData.success && itemsData.orderItems) {
                                    // 메뉴별로 수량 통합
                                    const consolidatedItems =
                                        this.consolidateOrderItems(
                                            itemsData.orderItems,
                                        );
                                    orderItems = consolidatedItems;
                                }
                            }
                        } catch (error) {
                            console.error(
                                `❌ 테이블 ${dbTable.tableNumber} 주문 아이템 로드 실패:`,
                                error,
                            );
                        }
                    }

                    return {
                        tableNumber: dbTable.tableNumber,
                        capacity: dbTable.capacity || 4,
                        isActive: dbTable.isActive !== false,
                        isOccupied: !!activeOrder,
                        totalAmount: activeOrder?.totalAmount || 0,
                        orderCount: activeOrder?.itemCount || 0,
                        isFromTLG: activeOrder?.sourceSystem === "TLL",
                        occupiedSince: activeOrder?.openedAt,
                        checkId: activeOrder?.checkId,
                        orderItems: orderItems, // 주문 아이템 상세 정보 추가
                    };
                }),
            );

            // 테이블 번호순으로 정렬
            tablesWithDetails.sort((a, b) => a.tableNumber - b.tableNumber);

            console.log(
                `✅ 실제 테이블 ${tablesWithDetails.length}개 로드 완료 (상세 정보 포함)`,
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
     * 테이블 상태 클래스 반환
     */
    getTableStatusClass(table) {
        if (!table.isOccupied) return "status-empty";
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
     * 실시간 업데이트 시작
     */
    startRealtimeUpdates(storeId) {
        // 30초마다 테이블 상태 업데이트
        setInterval(async () => {
            try {
                const tables = await this.loadTables(storeId);
                this.updateTableGrid(tables);
            } catch (error) {
                console.error("❌ 실시간 업데이트 실패:", error);
            }
        }, 30000);
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
            window.location.href = "/";
        }
    },
};

// 전역 함수로 등록
window.POSTableMap = POSTableMap;