
/**
 * KDS UI 렌더링 모듈
 * 책임: 화면 렌더링, DOM 조작, 시각적 표현
 */

class KDSUIRenderer {
    constructor() {
        this.timeInterval = null;
    }
    
    renderStationTabs(stations, currentStation) {
        const tabsContainer = document.getElementById('stationTabs');
        
        const tabs = stations.map(station => {
            const isExpo = station.is_expo;
            const ticketCount = station.active_tickets || 0;
            const isActive = station.id === currentStation;
            
            return `
                <button 
                    class="station-tab ${isExpo ? 'expo' : ''} ${isActive ? 'active' : ''}" 
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
    
    renderTickets(tickets) {
        const mainContainer = document.getElementById('kdsMain');
        
        if (tickets.length === 0) {
            mainContainer.innerHTML = `
                <div class="loading">
                    <div style="font-size: 3rem;">🍽️</div>
                    현재 처리할 주문이 없습니다
                </div>
            `;
            return;
        }
        
        const sortedTickets = this.sortTicketsByStatus(tickets);
        const ticketsHtml = sortedTickets.map(ticket => this.renderTicket(ticket)).join('');
        
        mainContainer.innerHTML = `
            <div class="tickets-grid">
                ${ticketsHtml}
            </div>
        `;
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
                if (isReady) {
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
    
    updateConnectionStatus(isOnline) {
        const statusEl = document.getElementById('connectionStatus');
        if (isOnline) {
            statusEl.textContent = '정상 연결';
            statusEl.className = 'store-info-value connection-status online';
        } else {
            statusEl.textContent = '연결 실패';
            statusEl.className = 'store-info-value connection-status offline';
        }
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
    
    sortTicketsByStatus(tickets) {
        return tickets.sort((a, b) => {
            const statusOrder = { 'PENDING': 0, 'COOKING': 1, 'DONE': 2 };
            const aStatus = this.getTicketMainStatus(a);
            const bStatus = this.getTicketMainStatus(b);
            
            if (aStatus !== bStatus) {
                return (statusOrder[aStatus] || 99) - (statusOrder[bStatus] || 99);
            }
            
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            
            return new Date(a.created_at) - new Date(b.created_at);
        });
    }
    
    getTicketMainStatus(ticket) {
        const items = ticket.items || [];
        if (items.every(item => item.kds_status === 'DONE')) return 'DONE';
        if (items.some(item => item.kds_status === 'COOKING')) return 'COOKING';
        return 'PENDING';
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
    
    destroy() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }
}

window.KDSUIRenderer = KDSUIRenderer;
