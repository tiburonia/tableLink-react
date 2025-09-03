
/**
 * KDS 핵심 데이터 관리 모듈
 * 책임: 데이터 로딩, 상태 관리, API 통신
 */

class KDSDataManager {
    constructor(storeId) {
        this.storeId = storeId;
        this.stations = [];
        this.tickets = [];
        this.lastUpdate = 0;
        this.eventSource = null;
    }
    
    async loadStations() {
        try {
            const response = await fetch(`/api/kds/stations?store_id=${this.storeId}`);
            const data = await response.json();
            
            if (data.success) {
                this.stations = data.stations;
                return this.stations;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ 스테이션 로딩 실패:', error);
            throw error;
        }
    }
    
    async loadTickets(stationId = null, isExpoMode = false) {
        try {
            const endpoint = isExpoMode 
                ? `/api/kds/expo?store_id=${this.storeId}&updated_since=${this.lastUpdate}`
                : `/api/kds/tickets?store_id=${this.storeId}&station_id=${stationId}&updated_since=${this.lastUpdate}`;
            
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (data.success) {
                if (isExpoMode) {
                    return data.expo_items;
                } else {
                    this.tickets = data.tickets;
                    this.lastUpdate = data.timestamp;
                    return this.tickets;
                }
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ 티켓 로딩 실패:', error);
            throw error;
        }
    }
    
    async updateItemStatus(itemId, action, notes = null) {
        try {
            const response = await fetch(`/api/kds/items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, notes })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ 아이템 상태 변경 실패:', error);
            throw error;
        }
    }
    
    async updateTicketStatus(ticketId, action) {
        try {
            const response = await fetch(`/api/kds/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ 티켓 상태 변경 실패:', error);
            throw error;
        }
    }
    
    setupRealtime(onUpdate) {
        if (this.eventSource) {
            this.eventSource.close();
        }
        
        this.eventSource = new EventSource(`/api/kds/stream/${this.storeId}`);
        
        this.eventSource.onopen = () => {
            console.log('🔌 KDS 실시간 연결 성공');
        };
        
        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'update') {
                    onUpdate(data);
                }
            } catch (error) {
                console.error('❌ 실시간 데이터 처리 실패:', error);
            }
        };
        
        this.eventSource.onerror = () => {
            console.error('❌ KDS 실시간 연결 실패');
            setTimeout(() => this.setupRealtime(onUpdate), 5000);
        };
    }
    
    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
        }
    }
}

window.KDSDataManager = KDSDataManager;
