
console.log('🚀 TableLink KDS v3.0 시작');

class KDSSystem {
    constructor() {
        this.storeId = new URLSearchParams(window.location.search).get('storeId') || '1';
        this.currentStation = null;
        this.stations = [];
        this.tickets = [];
        this.isExpoMode = false;
        this.eventSource = null;
        this.lastUpdate = 0;
        this.timeInterval = null;
        
        this.init();
    }
    
    async init() {
        console.log('📟 KDS 초기화 시작, 매장 ID:', this.storeId);
        
        try {
            await this.loadStations();
            await this.loadTickets();
            this.setupRealtime();
            this.startClock();
            this.setupAutoRefresh();
            
            console.log('✅ KDS 초기화 완료');
        } catch (error) {
            console.error('❌ KDS 초기화 실패:', error);
            this.showError('KDS 시스템 초기화에 실패했습니다.');
        }
    }
    
    async loadStations() {
        try {
            const response = await fetch(`/api/kds/stations?store_id=${this.storeId}`);
            const data = await response.json();
            
            if (data.success) {
                this.stations = data.stations;
                this.renderStationTabs();
                
                // 첫 번째 스테이션을 기본으로 선택
                if (this.stations.length > 0) {
                    this.selectStation(this.stations[0].id);
                }
                
                // 매장 이름 업데이트
                const storeName = this.stations[0]?.store_id ? `매장 ${this.stations[0].store_id}` : '테스트 매장';
                document.getElementById('storeName').textContent = storeName;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ 스테이션 로딩 실패:', error);
            this.showError('스테이션 정보를 불러올 수 없습니다.');
        }
    }
    
    renderStationTabs() {
        const tabsContainer = document.getElementById('stationTabs');
        
        const tabs = this.stations.map(station => {
            const isExpo = station.is_expo;
            const ticketCount = station.active_tickets || 0;
            
            return `
                <button 
                    class="station-tab ${isExpo ? 'expo' : ''}" 
                    onclick="kds.selectStation(${station.id})"
                    data-station="${station.id}"
                >
                    ${station.name}
                    ${ticketCount > 0 ? `<span class="ticket-counter">${ticketCount}</span>` : ''}
                </button>
            `;
        }).join('');
        
        tabsContainer.innerHTML = tabs;
    }
    
    selectStation(stationId) {
        this.currentStation = stationId;
        this.isExpoMode = this.stations.find(s => s.id === stationId)?.is_expo || false;
        
        // 탭 활성화
        document.querySelectorAll('.station-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-station="${stationId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        this.loadTickets();
    }
    
    async loadTickets() {
        try {
            const endpoint = this.isExpoMode 
                ? `/api/kds/expo?store_id=${this.storeId}&updated_since=${this.lastUpdate}`
                : `/api/kds/tickets?store_id=${this.storeId}&station_id=${this.currentStation}&updated_since=${this.lastUpdate}`;
            
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (data.success) {
                if (this.isExpoMode) {
                    this.renderExpoView(data.expo_items);
                } else {
                    this.tickets = data.tickets;
                    this.renderTickets();
                }
                this.lastUpdate = data.timestamp;
                
                // 연결 상태 업데이트
                const statusEl = document.getElementById('connectionStatus');
                statusEl.textContent = '정상 연결';
                statusEl.className = 'store-info-value connection-status online';
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ 티켓 로딩 실패:', error);
            
            // 연결 상태 업데이트
            const statusEl = document.getElementById('connectionStatus');
            statusEl.textContent = '연결 실패';
            statusEl.className = 'store-info-value connection-status offline';
            
            this.showError('티켓 데이터를 불러올 수 없습니다.');
        }
    }
    
    renderTickets() {
        const mainContainer = document.getElementById('kdsMain');
        
        if (this.tickets.length === 0) {
            mainContainer.innerHTML = `
                <div class="loading">
                    <div style="font-size: 3rem;">🍽️</div>
                    현재 처리할 주문이 없습니다
                </div>
            `;
            return;
        }
        
        // 상태별로 티켓 정렬 (PENDING → COOKING → DONE)
        const sortedTickets = this.tickets.sort((a, b) => {
            const statusOrder = { 'PENDING': 0, 'COOKING': 1, 'DONE': 2 };
            const aStatus = this.getTicketMainStatus(a);
            const bStatus = this.getTicketMainStatus(b);
            
            if (aStatus !== bStatus) {
                return (statusOrder[aStatus] || 99) - (statusOrder[bStatus] || 99);
            }
            
            // 같은 상태면 우선순위순, 그 다음 생성시간순
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            
            return new Date(a.created_at) - new Date(b.created_at);
        });
        
        const ticketsHtml = sortedTickets.map(ticket => this.renderTicket(ticket)).join('');
        
        mainContainer.innerHTML = `
            <div class="tickets-grid">
                ${ticketsHtml}
            </div>
        `;
    }
    
    getTicketMainStatus(ticket) {
        const items = ticket.items || [];
        if (items.every(item => item.kds_status === 'DONE')) return 'DONE';
        if (items.some(item => item.kds_status === 'COOKING')) return 'COOKING';
        return 'PENDING';
    }
    
    renderTicket(ticket) {
        const elapsedTime = this.getElapsedTime(ticket.created_at);
        const isReady = ticket.ticket_status === 'READY';
        const isPriority = ticket.priority > 0;
        const mainStatus = this.getTicketMainStatus(ticket);
        
        const itemsHtml = ticket.items.map(item => this.renderTicketItem(item)).join('');
        
        return `
            <div class="ticket-card ${isPriority ? 'priority' : ''} ${isReady ? 'ready' : ''} ${mainStatus.toLowerCase()}" onclick="kds.quickAction(${ticket.ticket_id})">
                <div class="ticket-header">
                    <div class="ticket-info">
                        <div class="table-number">🪑 ${ticket.table_number}</div>
                        <div class="order-id">#${ticket.ticket_id.toString().padStart(3, '0')}</div>
                        ${ticket.customer_name ? `<div class="customer-name">${ticket.customer_name}</div>` : ''}
                        <div class="order-id">${ticket.source_system} | Course ${ticket.course_no}</div>
                        ${ticket.course_no > 1 ? '<div class="addon-badge">ADD-ON</div>' : ''}
                    </div>
                    <div class="ticket-time">
                        <div class="elapsed-time ${elapsedTime.class}">${elapsedTime.text}</div>
                        <div class="order-time">${new Date(ticket.created_at).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}</div>
                    </div>
                </div>
                
                <div class="ticket-items">
                    ${itemsHtml}
                </div>
                
                <div class="ticket-actions">
                    ${this.renderTicketActions(ticket)}
                </div>
            </div>
        `;
    }
    
    renderTicketItem(item) {
        const statusIcon = `<span class="status-icon ${item.kds_status.toLowerCase()}"></span>`;
        const options = item.options && Object.keys(item.options).length > 0 
            ? Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(' | ')
            : '';
        
        return `
            <div class="ticket-item ${item.kds_status.toLowerCase()}" onclick="event.stopPropagation(); kds.itemQuickAction(${item.item_id})">
                <div class="item-header">
                    <div class="item-name">
                        ${statusIcon}${item.menu_name}
                    </div>
                    <div class="item-quantity">×${item.quantity}</div>
                </div>
                ${options ? `<div class="item-options">🔧 ${options}</div>` : ''}
                ${item.notes ? `<div class="item-notes">⚠️ ${item.notes}</div>` : ''}
            </div>
        `;
    }
    
    renderTicketActions(ticket) {
        const mainStatus = this.getTicketMainStatus(ticket);
        const isReady = ticket.ticket_status === 'READY';
        
        let mainButton = '';
        let secondaryButtons = '';
        
        switch (mainStatus) {
            case 'PENDING':
                mainButton = `<button class="big-touch-btn main-action btn-start" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'start_all')">🔥 전체 조리 시작</button>`;
                secondaryButtons = `
                    <button class="big-touch-btn btn-priority" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'raise_priority')">⚡ 우선처리</button>
                    <button class="big-touch-btn btn-hold" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'hold_all')">⏸️ 전체보류</button>
                `;
                break;
                
            case 'COOKING':
                mainButton = `<button class="big-touch-btn main-action btn-done" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'complete_all')">✅ 전체 완료</button>`;
                secondaryButtons = `
                    <button class="big-touch-btn btn-priority" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'raise_priority')">⚡ 우선처리</button>
                    <button class="big-touch-btn btn-hold" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'hold_all')">⏸️ 전체보류</button>
                `;
                break;
                
            case 'DONE':
                if (this.isExpoMode || isReady) {
                    mainButton = `<button class="big-touch-btn main-action btn-bump" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'bump')">🎯 BUMP (서빙완료)</button>`;
                    secondaryButtons = `
                        <button class="big-touch-btn btn-expo" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'expo_all')">📤 EXPO 이동</button>
                        <button class="big-touch-btn btn-priority" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'raise_priority')">⚡ 우선처리</button>
                    `;
                } else {
                    mainButton = `<button class="big-touch-btn main-action btn-expo" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'expo_all')">📤 EXPO로 전송</button>`;
                    secondaryButtons = `
                        <button class="big-touch-btn btn-priority" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'raise_priority')">⚡ 우선처리</button>
                        <button class="big-touch-btn btn-cancel" onclick="event.stopPropagation(); kds.ticketAction(${ticket.ticket_id}, 'cancel_all')">❌ 주문취소</button>
                    `;
                }
                break;
        }
        
        return mainButton + secondaryButtons;
    }
    
    renderExpoView(expoItems) {
        const mainContainer = document.getElementById('kdsMain');
        
        if (expoItems.length === 0) {
            mainContainer.innerHTML = `
                <div class="loading">
                    <div style="font-size: 3rem;">📤</div>
                    픽업 대기중인 주문이 없습니다
                </div>
            `;
            return;
        }
        
        const ordersHtml = expoItems.map(order => {
            const readyItems = order.items.filter(item => item.kds_status === 'DONE');
            const totalItems = order.items.length;
            const allReady = readyItems.length === totalItems;
            
            return `
                <div class="expo-order ${allReady ? 'ready' : ''}">
                    <div class="expo-header">
                        <div>
                            <div class="table-number">🪑 테이블 ${order.table_number}</div>
                            ${order.customer_name ? `<div class="customer-name">${order.customer_name}</div>` : ''}
                        </div>
                        <div class="completion-status">
                            ${readyItems.length}/${totalItems} 완료
                        </div>
                    </div>
                    
                    <div class="ticket-items">
                        ${order.items.map(item => `
                            <div class="ticket-item ${item.kds_status.toLowerCase()}">
                                <div class="item-header">
                                    <div class="item-name">
                                        <span class="status-icon ${item.kds_status.toLowerCase()}"></span>
                                        ${item.menu_name}
                                        <span style="color: #9ca3af; font-size: 0.9rem;">(${item.station_name})</span>
                                    </div>
                                    <div class="item-quantity">×${item.quantity}</div>
                                </div>
                                ${item.kds_status === 'DONE' ? `
                                    <button class="big-touch-btn btn-bump" onclick="kds.itemAction(${item.item_id}, 'served')" style="margin-top: 1rem; width: 100%;">
                                        🎯 서빙완료
                                    </button>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    ${allReady ? `
                        <button class="big-touch-btn main-action btn-bump" onclick="kds.completeOrder(${order.check_id})" style="margin-top: 1rem;">
                            🎯 전체 서빙완료 (BUMP)
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        mainContainer.innerHTML = `
            <div class="expo-grid">
                ${ordersHtml}
            </div>
        `;
    }
    
    // 티켓 카드 클릭시 빠른 액션
    quickAction(ticketId) {
        const ticket = this.tickets.find(t => t.ticket_id === ticketId);
        if (!ticket) return;
        
        const mainStatus = this.getTicketMainStatus(ticket);
        
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
    
    // 아이템 클릭시 빠른 액션
    itemQuickAction(itemId) {
        const allItems = this.tickets.flatMap(t => t.items);
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
    
    async itemAction(itemId, action) {
        try {
            const response = await fetch(`/api/kds/items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ 아이템 액션 완료: ${action}`);
                this.showToast(`아이템 상태가 변경되었습니다`);
                setTimeout(() => this.loadTickets(), 500);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ 아이템 액션 실패:', error);
            this.showToast('작업을 완료할 수 없습니다', true);
        }
    }
    
    async ticketAction(ticketId, action) {
        try {
            const response = await fetch(`/api/kds/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ 티켓 액션 완료: ${action}`);
                this.showToast(`티켓 상태가 변경되었습니다`);
                setTimeout(() => this.loadTickets(), 500);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ 티켓 액션 실패:', error);
            this.showToast('작업을 완료할 수 없습니다', true);
        }
    }
    
    async completeOrder(checkId) {
        try {
            // 체크의 모든 아이템을 SERVED로 변경
            const orderItems = this.tickets
                .filter(t => t.check_id === checkId)
                .flatMap(t => t.items)
                .filter(i => i.kds_status === 'DONE');
            
            for (const item of orderItems) {
                await this.itemAction(item.item_id, 'served');
            }
            
            this.showToast(`테이블 ${checkId} 주문이 완료되었습니다`);
        } catch (error) {
            console.error('❌ 주문 완료 처리 실패:', error);
            this.showToast('주문 완료 처리에 실패했습니다', true);
        }
    }
    
    setupRealtime() {
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
                    console.log('📡 실시간 업데이트:', data);
                    this.loadTickets();
                    this.loadStations(); // 카운터 업데이트
                }
            } catch (error) {
                console.error('❌ 실시간 데이터 처리 실패:', error);
            }
        };
        
        this.eventSource.onerror = () => {
            console.error('❌ KDS 실시간 연결 실패');
            
            const statusEl = document.getElementById('connectionStatus');
            statusEl.textContent = '연결 실패';
            statusEl.className = 'store-info-value connection-status offline';
            
            // 자동 재연결
            setTimeout(() => {
                this.setupRealtime();
            }, 5000);
        };
    }
    
    setupAutoRefresh() {
        // 3초마다 자동 새로고침
        setInterval(() => {
            this.loadTickets();
            this.loadStations();
        }, 3000);
    }
    
    getElapsedTime(createdAt) {
        const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000 / 60);
        
        let className = '';
        if (elapsed > 15) className = 'danger';
        else if (elapsed > 10) className = 'warning';
        
        return {
            text: `${elapsed}분`,
            class: className
        };
    }
    
    startClock() {
        const updateTime = () => {
            const now = new Date();
            document.getElementById('currentTime').textContent = 
                now.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
        };
        
        updateTime();
        this.timeInterval = setInterval(updateTime, 1000);
    }
    
    showError(message) {
        document.getElementById('kdsMain').innerHTML = `
            <div class="error">
                ❌ ${message}
            </div>
        `;
    }
    
    showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${isError ? '#ef4444' : '#10b981'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            animation: slideDown 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }
}

// 전역 KDS 인스턴스
let kds;

document.addEventListener('DOMContentLoaded', () => {
    kds = new KDSSystem();
});

// 페이지 언로드시 정리
window.addEventListener('beforeunload', () => {
    if (kds) {
        kds.destroy();
    }
});
