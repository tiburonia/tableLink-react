
/**
 * POS 테이블맵 화면 (OK POS 스타일)
 */

const POSTableMap = {
    
    /**
     * 테이블맵 화면 렌더링
     */
    async render(storeId, storeInfo) {
        try {
            console.log('🗺️ 테이블맵 화면 렌더링');
            
            // 테이블 정보 로드
            const tables = await this.loadTables(storeId);
            
            const main = document.getElementById('posMain');
            main.innerHTML = `
                ${this.renderTopBar(storeInfo)}
                ${this.renderMainContent(tables)}
                ${this.renderSidePanel()}
            `;
            
            // 실시간 업데이트 시작
            this.startRealtimeUpdates(storeId);
            
            // 시간 업데이트 시작
            this.startTimeUpdate();
            
        } catch (error) {
            console.error('❌ 테이블맵 렌더링 실패:', error);
            POSCore.showError('테이블맵을 불러올 수 없습니다.');
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
            <div class="pos-main-content">
                <div class="table-grid" id="tableGrid">
                    ${tables.map(table => this.renderTableCard(table)).join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * 테이블 카드 렌더링
     */
    renderTableCard(table) {
        const statusClass = this.getTableStatusClass(table);
        const statusIcon = this.getTableStatusIcon(table);
        
        return `
            <div class="table-card ${statusClass}" 
                 data-table-number="${table.tableNumber}"
                 onclick="POSTableMap.selectTable(${table.tableNumber})">
                
                <div class="table-header">
                    <span class="table-number">${table.tableNumber}</span>
                    ${table.isFromTLG ? '<span class="tlg-badge">📱</span>' : ''}
                </div>
                
                <div class="table-icon">
                    ${statusIcon}
                </div>
                
                <div class="table-status">
                    ${this.getTableStatusText(table)}
                </div>
                
                ${table.isOccupied ? `
                    <div class="table-info">
                        <div class="occupied-time">${this.formatOccupiedTime(table.occupiedSince)}</div>
                        <div class="table-amount">${(table.totalAmount || 0).toLocaleString()}원</div>
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    /**
     * 사이드 패널 렌더링
     */
    renderSidePanel() {
        return `
            <div class="pos-side-panel">
                <div class="side-panel-section">
                    <h3>테이블 관리</h3>
                    <button class="side-btn" onclick="POSTableMap.mergeTable()">
                        🔗 합석
                    </button>
                    <button class="side-btn" onclick="POSTableMap.splitTable()">
                        ✂️ 분리
                    </button>
                    <button class="side-btn" onclick="POSTableMap.moveTable()">
                        🔄 이동
                    </button>
                </div>
                
                <div class="side-panel-section">
                    <h3>출력/리포트</h3>
                    <button class="side-btn" onclick="POSTableMap.reprintReceipt()">
                        🖨️ 재출력
                    </button>
                    <button class="side-btn" onclick="POSTableMap.showDailySales()">
                        📈 일일매출
                    </button>
                    <button class="side-btn" onclick="POSTableMap.showReport()">
                        📊 판매현황
                    </button>
                </div>
                
                <div class="side-panel-section">
                    <h3>시스템</h3>
                    <button class="side-btn" onclick="POSTableMap.showSettings()">
                        ⚙️ 설정
                    </button>
                    <button class="side-btn logout-btn" onclick="POSTableMap.logout()">
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
            
            if (!tablesData.success || !tablesData.tables || tablesData.tables.length === 0) {
                console.log('❌ 등록된 테이블이 없습니다.');
                return [];
            }
            
            // 활성 주문 정보 조회
            const ordersResponse = await fetch(`/api/pos/stores/${storeId}/orders/active`);
            const ordersData = await ordersResponse.json();
            
            // 실제 DB 테이블만 처리
            const tables = tablesData.tables.map(dbTable => {
                const activeOrder = ordersData.success ? 
                    ordersData.activeOrders.find(order => order.tableNumber === dbTable.tableNumber) : null;
                
                return {
                    tableNumber: dbTable.tableNumber,
                    capacity: dbTable.capacity || 4,
                    isActive: dbTable.isActive !== false,
                    isOccupied: !!activeOrder,
                    totalAmount: activeOrder?.totalAmount || 0,
                    orderCount: activeOrder?.itemCount || 0,
                    isFromTLG: activeOrder?.sourceSystem === 'TLL',
                    occupiedSince: activeOrder?.openedAt,
                    checkId: activeOrder?.checkId
                };
            });
            
            // 테이블 번호순으로 정렬
            tables.sort((a, b) => a.tableNumber - b.tableNumber);
            
            console.log(`✅ 실제 테이블 ${tables.length}개 로드 완료`);
            return tables;
            
        } catch (error) {
            console.error('❌ 테이블 정보 로드 실패:', error);
            return [];
        }
    },
    
    /**
     * 테이블 상태 클래스 반환
     */
    getTableStatusClass(table) {
        if (!table.isOccupied) return 'status-empty';
        if (table.isFromTLG) return 'status-tlg';
        return 'status-occupied';
    },
    
    /**
     * 테이블 상태 아이콘 반환
     */
    getTableStatusIcon(table) {
        if (!table.isOccupied) return '🪑';
        if (table.isFromTLG) return '📱';
        return '🍽️';
    },
    
    /**
     * 테이블 상태 텍스트 반환
     */
    getTableStatusText(table) {
        if (!table.isOccupied) return '빈자리';
        if (table.isFromTLG) return 'TLG 주문';
        return `주문중 (${table.orderCount}개)`;
    },
    
    /**
     * 점유 시간 포맷
     */
    formatOccupiedTime(occupiedSince) {
        if (!occupiedSince) return '';
        
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
     * 테이블 선택
     */
    async selectTable(tableNumber) {
        try {
            console.log(`🪑 테이블 ${tableNumber} 선택`);
            
            // 테이블 상세 정보 확인
            const response = await fetch(`/api/pos/stores/${POSCore.storeId}/table/${tableNumber}/session-status`);
            const data = await response.json();
            
            if (data.success && data.hasActiveSession) {
                // 활성 세션이 있으면 주문 화면으로
                POSCore.showOrderScreen(tableNumber);
            } else {
                // 빈 테이블이면 새 세션 시작
                await this.startNewSession(tableNumber);
            }
            
        } catch (error) {
            console.error('❌ 테이블 선택 실패:', error);
            alert('테이블 정보를 불러올 수 없습니다.');
        }
    },
    
    /**
     * 새 세션 시작
     */
    async startNewSession(tableNumber) {
        try {
            const response = await fetch(`/api/pos/stores/${POSCore.storeId}/table/${tableNumber}/acquire-lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lockBy: 'POS', lockDuration: 1800000 }) // 30분
            });
            
            if (response.ok) {
                POSCore.showOrderScreen(tableNumber);
            } else {
                const errorData = await response.json();
                alert(errorData.error || '테이블을 사용할 수 없습니다.');
            }
            
        } catch (error) {
            console.error('❌ 새 세션 시작 실패:', error);
            alert('세션을 시작할 수 없습니다.');
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
                console.error('❌ 실시간 업데이트 실패:', error);
            }
        }, 30000);
    },
    
    /**
     * 테이블 그리드 업데이트
     */
    updateTableGrid(tables) {
        const tableGrid = document.getElementById('tableGrid');
        if (tableGrid) {
            tableGrid.innerHTML = tables.map(table => this.renderTableCard(table)).join('');
        }
    },
    
    /**
     * 시간 업데이트 시작
     */
    startTimeUpdate() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const timeElement = document.getElementById('currentTime');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    },
    
    // 기타 기능들 (추후 구현)
    showOrderStatus() { alert('주문현황 기능 (추후 구현)'); },
    showSalesStatus() { alert('매출현황 기능 (추후 구현)'); },
    showNotifications() { alert('알림 기능 (추후 구현)'); },
    mergeTable() { alert('합석 기능 (추후 구현)'); },
    splitTable() { alert('분리 기능 (추후 구현)'); },
    moveTable() { alert('이동 기능 (추후 구현)'); },
    reprintReceipt() { alert('재출력 기능 (추후 구현)'); },
    showDailySales() { alert('일일매출 기능 (추후 구현)'); },
    showReport() { alert('판매현황 기능 (추후 구현)'); },
    showSettings() { alert('설정 기능 (추후 구현)'); },
    logout() { 
        if (confirm('POS를 종료하시겠습니까?')) {
            window.location.href = '/';
        }
    }
};

// 전역 함수로 등록
window.POSTableMap = POSTableMap;
