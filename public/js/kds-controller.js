/**
 * KDS 비즈니스 로직 컨트롤러
 * 책임: 사용자 상호작용 처리, 상태 변경 로직, 워크플로우 제어
 */

// 중복 로딩 방지
if (window.KDSController) {
  console.log('⚠️ KDSController 클래스가 이미 정의됨');
} else {

class KDSController {
    constructor(storeId) {
        this.storeId = storeId;
        this.currentStation = null;
        this.isExpoMode = false;
        this.dataManager = new KDSDataManager(storeId);
        this.uiRenderer = new KDSUIRenderer();
        this.autoRefreshInterval = null;
    }

    async init() {
        console.log('📟 KDS 컨트롤러 초기화 시작, 매장 ID:', this.storeId);

        try {
            console.log('🔄 스테이션 정보 로딩...');
            await this.loadStations();

            console.log('🔄 티켓 정보 로딩...');
            await this.loadTickets();

            console.log('🔄 실시간 연결 설정...');
            this.setupRealtime();

            console.log('🔄 시계 시작...');
            this.uiRenderer.startClock();

            console.log('🔄 자동 새로고침 설정...');
            this.setupAutoRefresh();

            console.log('✅ KDS 컨트롤러 초기화 완료');
        } catch (error) {
            console.error('❌ KDS 초기화 실패:', error);
            this.uiRenderer.showError(`KDS 시스템 초기화에 실패했습니다: ${error.message}`);
            throw error; // 상위로 에러 전파
        }
    }

    async loadStations() {
        try {
            const stations = await this.dataManager.loadStations();
            this.uiRenderer.renderStationTabs(stations, this.currentStation);

            // 첫 번째 스테이션을 기본으로 선택
            if (stations.length > 0 && !this.currentStation) {
                this.selectStation(stations[0].id);
            }

            // 매장 이름 업데이트
            const storeName = stations[0]?.store_id ? `매장 ${stations[0].store_id}` : '테스트 매장';
            document.getElementById('storeName').textContent = storeName;

        } catch (error) {
            console.error('❌ 스테이션 로딩 실패:', error);
            this.uiRenderer.showError('스테이션 정보를 불러올 수 없습니다.');
        }
    }

    selectStation(stationId) {
        this.currentStation = stationId;
        const station = this.dataManager.stations.find(s => s.id === stationId);
        this.isExpoMode = station?.is_expo || false;

        // UI 업데이트
        this.uiRenderer.renderStationTabs(this.dataManager.stations, this.currentStation);
        this.loadTickets();
    }

    async loadTickets() {
        try {
            if (this.isExpoMode) {
                const expoItems = await this.dataManager.loadTickets(null, true);
                this.uiRenderer.renderExpoView(expoItems);
            } else {
                const tickets = await this.dataManager.loadTickets(this.currentStation, false);
                this.uiRenderer.renderTickets(tickets);
            }

            this.uiRenderer.updateConnectionStatus(true);

        } catch (error) {
            console.error('❌ 티켓 로딩 실패:', error);
            this.uiRenderer.updateConnectionStatus(false);
            this.uiRenderer.showError('티켓 데이터를 불러올 수 없습니다.');
        }
    }

    // 빠른 액션 처리
    quickAction(ticketId) {
        const ticket = this.dataManager.tickets.find(t => t.ticket_id === ticketId);
        if (!ticket) return;

        const mainStatus = this.uiRenderer.getTicketMainStatus(ticket);

        switch (mainStatus) {
            case 'PENDING':
                this.ticketAction(ticketId, 'start_all');
                break;
            case 'COOKING':
                this.ticketAction(ticketId, 'complete_all');
                break;
            case 'DONE':
                if (this.isExpoMode) {
                    this.ticketAction(ticketId, 'bump');
                } else {
                    this.ticketAction(ticketId, 'expo_all');
                }
                break;
        }
    }

    itemQuickAction(itemId) {
        const allItems = this.dataManager.tickets.flatMap(t => t.items);
        const item = allItems.find(i => i.item_id === itemId);
        if (!item) return;

        switch (item.kds_status) {
            case 'PENDING':
                this.itemAction(itemId, 'start');
                break;
            case 'COOKING':
                this.itemAction(itemId, 'done');
                break;
            case 'DONE':
                if (this.isExpoMode) {
                    this.itemAction(itemId, 'served');
                } else {
                    this.itemAction(itemId, 'expo');
                }
                break;
        }
    }

    async itemAction(itemId, action, notes = null) {
        try {
            await this.dataManager.updateItemStatus(itemId, action, notes);
            console.log(`✅ 아이템 액션 완료: ${action}`);
            this.uiRenderer.showToast('아이템 상태가 변경되었습니다');
            setTimeout(() => this.loadTickets(), 500);
        } catch (error) {
            console.error('❌ 아이템 액션 실패:', error);
            this.uiRenderer.showToast('작업을 완료할 수 없습니다', true);
        }
    }

    async ticketAction(ticketId, action) {
        try {
            await this.dataManager.updateTicketStatus(ticketId, action);
            console.log(`✅ 티켓 액션 완료: ${action}`);
            this.uiRenderer.showToast('티켓 상태가 변경되었습니다');
            setTimeout(() => this.loadTickets(), 500);
        } catch (error) {
            console.error('❌ 티켓 액션 실패:', error);
            this.uiRenderer.showToast('작업을 완료할 수 없습니다', true);
        }
    }

    async completeOrder(checkId) {
        try {
            // 체크의 모든 아이템을 SERVED로 변경
            const orderItems = this.dataManager.tickets
                .filter(t => t.check_id === checkId)
                .flatMap(t => t.items)
                .filter(i => i.kds_status === 'DONE');

            for (const item of orderItems) {
                await this.itemAction(item.item_id, 'served');
            }

            this.uiRenderer.showToast(`테이블 ${checkId} 주문이 완료되었습니다`);
        } catch (error) {
            console.error('❌ 주문 완료 처리 실패:', error);
            this.uiRenderer.showToast('주문 완료 처리에 실패했습니다', true);
        }
    }

    setupRealtime() {
        this.dataManager.setupRealtime((data) => {
            console.log('📡 실시간 데이터:', data);

            // TLL 주문 생성 시 즉시 반영
            if (data.type === 'tll_order_created' || data.type === 'new_tickets') {
                console.log('🎯 새 주문 감지 - 즉시 티켓 로딩');
                this.loadTickets();

                // 토스트 알림
                if (data.type === 'tll_order_created') {
                    this.uiRenderer.showToast(`🔔 테이블 ${data.table_number || '?'}번 새 주문!`);
                }
            }

            // 일반 업데이트
            if (data.type === 'update' || data.type === 'item_status_change' || data.type === 'ticket_action') {
                this.loadTickets();
            }

            // 연결 상태 업데이트
            this.uiRenderer.updateConnectionStatus(true);
        });
    }

    setupAutoRefresh() {
        // 3초마다 자동 새로고침
        this.autoRefreshInterval = setInterval(() => {
            this.loadTickets();
            this.loadStations();
        }, 3000);
    }

    destroy() {
        this.dataManager.destroy();
        this.uiRenderer.destroy();

        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }
}

// 전역 컨트롤러 클래스 등록
window.KDSController = KDSController;
console.log('✅ KDSController 클래스 등록 완료');

} // 중복 로딩 방지 닫기