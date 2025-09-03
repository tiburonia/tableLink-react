
/**
 * KDS UI 렌더링 모듈
 * 책임: 화면 렌더링, 사용자 인터페이스 요소 관리
 */

class KDSUIRenderer {
    constructor() {
        this.clockInterval = null;
    }
    
    renderStationTabs(stations, currentStationId) {
        const container = document.getElementById('stationTabs');
        if (!container) return;
        
        if (!stations || stations.length === 0) {
            container.innerHTML = '<div class="no-stations">스테이션 정보를 불러오는 중...</div>';
            return;
        }
        
        const tabsHTML = stations.map(station => `
            <button 
                class="station-tab ${station.id === currentStationId ? 'active' : ''}"
                onclick="kdsController.selectStation(${station.id})"
            >
                <span class="station-name">${station.name}</span>
                <span class="ticket-count">${station.active_tickets || 0}</span>
                ${station.is_expo ? '<span class="expo-badge">EXPO</span>' : ''}
            </button>
        `).join('');
        
        container.innerHTML = tabsHTML;
    }
    
    renderTickets(tickets) {
        const container = document.getElementById('ticketsContainer');
        if (!container) return;
        
        console.log('🎫 티켓 렌더링:', tickets?.length || 0, '개');
        
        // 티켓이 없을 때도 빈 프레임 표시
        if (!tickets || tickets.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }
        
        const ticketsHTML = tickets.map(ticket => this.renderSingleTicket(ticket)).join('');
        container.innerHTML = ticketsHTML;
    }
    
    renderEmptyState() {
        return `
            <div class="empty-tickets-state">
                <div class="empty-ticket-card">
                    <div class="empty-ticket-header">
                        <span class="empty-table">대기 중...</span>
                        <span class="empty-time">--:--</span>
                    </div>
                    <div class="empty-ticket-body">
                        <p class="empty-message">새 주문을 기다리고 있습니다</p>
                        <div class="empty-animation">
                            <div class="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSingleTicket(ticket) {
        const items = ticket.items || [];
        const hasItems = items.length > 0;
        
        // 티켓 메인 상태 판단
        const mainStatus = this.getTicketMainStatus(ticket);
        const timeLabel = this.formatTicketTime(ticket);
        const sourceLabel = ticket.source_system === 'TLL' ? 'TLL' : 'POS';
        
        return `
            <div class="ticket-card ${mainStatus.toLowerCase()} ${ticket.source_system.toLowerCase()}" 
                 data-ticket-id="${ticket.ticket_id}">
                
                <div class="ticket-header">
                    <div class="ticket-info">
                        <span class="table-number">테이블 ${ticket.table_number || '?'}</span>
                        <span class="source-badge ${ticket.source_system.toLowerCase()}">${sourceLabel}</span>
                    </div>
                    <div class="ticket-time">${timeLabel}</div>
                </div>
                
                <div class="ticket-status-bar ${mainStatus.toLowerCase()}">
                    <span class="status-text">${this.getStatusText(mainStatus)}</span>
                    <div class="priority-indicator priority-${ticket.priority || 1}">
                        ${'★'.repeat(ticket.priority || 1)}
                    </div>
                </div>
                
                <div class="ticket-items">
                    ${hasItems ? items.map(item => this.renderTicketItem(item)).join('') : 
                      '<div class="no-items">아이템 로딩 중...</div>'}
                </div>
                
                <div class="ticket-actions">
                    <button class="quick-action-btn ${mainStatus.toLowerCase()}"
                            onclick="kdsController.quickAction(${ticket.ticket_id})">
                        ${this.getQuickActionText(mainStatus)}
                    </button>
                    
                    <div class="ticket-controls">
                        <button onclick="kdsController.ticketAction(${ticket.ticket_id}, 'raise_priority')"
                                class="priority-btn" title="우선순위 올리기">🔥</button>
                        <button onclick="kdsController.ticketAction(${ticket.ticket_id}, 'hold_all')"
                                class="hold-btn" title="보류">⏸️</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderTicketItem(item) {
        const statusClass = item.kds_status ? item.kds_status.toLowerCase() : 'pending';
        const options = item.options && Object.keys(item.options).length > 0 
            ? Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(', ')
            : '';
        
        return `
            <div class="ticket-item ${statusClass}" data-item-id="${item.item_id}">
                <div class="item-main">
                    <span class="item-name">${item.menu_name}</span>
                    <span class="item-quantity">×${item.quantity}</span>
                    <span class="item-status ${statusClass}">${this.getItemStatusText(item.kds_status)}</span>
                </div>
                
                ${options ? `<div class="item-options">${options}</div>` : ''}
                ${item.notes ? `<div class="item-notes">📝 ${item.notes}</div>` : ''}
                
                <div class="item-actions">
                    <button onclick="kdsController.itemQuickAction(${item.item_id})" 
                            class="item-quick-btn ${statusClass}">
                        ${this.getItemQuickActionText(item.kds_status)}
                    </button>
                </div>
            </div>
        `;
    }
    
    renderExpoView(expoItems) {
        const container = document.getElementById('ticketsContainer');
        if (!container) return;
        
        if (!expoItems || expoItems.length === 0) {
            container.innerHTML = this.renderEmptyExpoState();
            return;
        }
        
        const expoHTML = expoItems.map(checkGroup => `
            <div class="expo-check-group" data-check-id="${checkGroup.check_id}">
                <div class="expo-check-header">
                    <span class="check-table">테이블 ${checkGroup.table_number}</span>
                    <span class="check-customer">${checkGroup.customer_name || '고객'}</span>
                    <button onclick="kdsController.completeOrder(${checkGroup.check_id})" 
                            class="complete-order-btn">서빙 완료</button>
                </div>
                
                <div class="expo-items">
                    ${checkGroup.items.map(item => `
                        <div class="expo-item ${item.kds_status?.toLowerCase() || 'done'}"
                             data-item-id="${item.item_id}">
                            <span class="expo-item-name">${item.menu_name}</span>
                            <span class="expo-item-quantity">×${item.quantity}</span>
                            <span class="expo-item-station">[${item.station_name}]</span>
                            <button onclick="kdsController.itemAction(${item.item_id}, 'served')"
                                    class="expo-serve-btn">서빙</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = expoHTML;
    }
    
    renderEmptyExpoState() {
        return `
            <div class="empty-expo-state">
                <div class="empty-expo-card">
                    <h3>🍽️ EXPO 대기 중</h3>
                    <p>서빙 준비된 주문이 없습니다</p>
                    <div class="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
    }
    
    getTicketMainStatus(ticket) {
        if (!ticket.items || ticket.items.length === 0) {
            return 'PENDING';
        }
        
        const statuses = ticket.items.map(item => item.kds_status);
        
        if (statuses.every(status => status === 'DONE' || status === 'EXPO')) {
            return 'DONE';
        } else if (statuses.some(status => status === 'COOKING')) {
            return 'COOKING';
        } else {
            return 'PENDING';
        }
    }
    
    getStatusText(status) {
        const statusMap = {
            'PENDING': '대기 중',
            'COOKING': '조리 중',
            'DONE': '완료',
            'READY': '픽업 대기',
            'EXPO': '서빙 대기'
        };
        return statusMap[status] || status;
    }
    
    getItemStatusText(status) {
        const statusMap = {
            'PENDING': '대기',
            'COOKING': '조리중',
            'DONE': '완료',
            'EXPO': '서빙대기',
            'SERVED': '서빙됨',
            'HOLD': '보류',
            'CANCELED': '취소'
        };
        return statusMap[status] || status;
    }
    
    getQuickActionText(status) {
        const actionMap = {
            'PENDING': '조리 시작',
            'COOKING': '조리 완료',
            'DONE': '서빙 준비',
            'READY': '픽업'
        };
        return actionMap[status] || '액션';
    }
    
    getItemQuickActionText(status) {
        const actionMap = {
            'PENDING': '시작',
            'COOKING': '완료',
            'DONE': '준비',
            'EXPO': '서빙'
        };
        return actionMap[status] || '액션';
    }
    
    formatTicketTime(ticket) {
        try {
            const time = ticket.fired_at || ticket.created_at;
            if (!time) return '--:--';
            
            const date = new Date(time);
            return date.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '--:--';
        }
    }
    
    startClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);
    }
    
    updateClock() {
        const clockElement = document.getElementById('currentTime');
        if (clockElement) {
            const now = new Date();
            clockElement.textContent = now.toLocaleTimeString('ko-KR');
        }
    }
    
    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
            statusElement.textContent = isConnected ? '연결됨' : '연결 끊김';
        }
    }
    
    showError(message) {
        const container = document.getElementById('ticketsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-card">
                        <h3>❌ 오류 발생</h3>
                        <p>${message}</p>
                        <button onclick="kdsController.loadTickets()" class="retry-btn">다시 시도</button>
                    </div>
                </div>
            `;
        }
    }
    
    showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : 'success'}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 애니메이션 효과
        setTimeout(() => toast.classList.add('show'), 10);
        
        // 3초 후 제거
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
    
    destroy() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
    }
}

window.KDSUIRenderer = KDSUIRenderer;
