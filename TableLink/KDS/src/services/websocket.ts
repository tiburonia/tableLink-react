/**
 * KDS WebSocket 서비스
 * - WebSocket 연결/해제
 * - 실시간 이벤트 처리
 * - 티켓 생성/업데이트 처리
 */

import { io, Socket } from 'socket.io-client';
import type { Ticket, CookStation } from '../types';
import { extractTicketId } from '../context/KDSContext';

type KDSEventHandler = {
  onConnectionChange: (connected: boolean) => void;
  onTicketCreated: (ticket: Ticket) => void;
  onTicketUpdated: (ticket: Ticket) => void;
  onTicketRemoved: (ticketId: string) => void;
  onItemUpdated: (data: { ticketId: string; itemId: string; status: string }) => void;
};

class KDSWebSocketService {
  private socket: Socket | null = null;
  private storeId: string | null = null;
  private handlers: KDSEventHandler | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * 이벤트 핸들러 설정
   */
  setHandlers(handlers: KDSEventHandler) {
    this.handlers = handlers;
  }

  /**
   * 사용자 정보 가져오기
   */
  private getUserInfo() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * WebSocket 연결 초기화
   */
  async connect(storeId: string): Promise<Socket> {
    try {
      this.storeId = storeId;
      const userInfo = this.getUserInfo();

      // KDS는 익명 접속도 허용 (주방 직원용)
      const authData = {
        token: userInfo?.token || 'kds-anonymous-token',
        storeId: storeId,
        userId: userInfo?.id || `kds-user-${storeId}`,
        userType: userInfo?.id ? 'authenticated' : 'kds-anonymous',
      };

      console.log('🔌 KDS WebSocket 연결 시도:', authData);

      // Socket.IO 연결
      this.socket = io({
        path: '/socket.io',
        auth: authData,
      });

      this.setupEventListeners();

      return this.socket;
    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error);
      this.handlers?.onConnectionChange(false);
      throw error;
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ KDS WebSocket 연결됨');
      this.handlers?.onConnectionChange(true);

      // 매장별 룸 조인
      if (this.storeId) {
        this.socket?.emit('join-kds', this.storeId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ KDS WebSocket 연결 해제');
      this.handlers?.onConnectionChange(false);
    });

    // KDS 이벤트 리스너
    this.socket.on('kds-update', (data: any) => {
      console.log('📡 KDS 업데이트 수신:', data);

      if (data.data?.source === 'db_trigger') {
        this.handleDBNotification(data);
      } else {
        this.handleKDSUpdate(data);
      }
    });

    // 티켓 수정 이벤트
    this.socket.on('ticket-modified', (data: any) => {
      console.log('🔄 티켓 수정 이벤트 수신:', data);
      this.handleTicketModified(data);
    });

    // 티켓 취소 이벤트
    this.socket.on('ticket-canceled', (data: any) => {
      console.log('❌ 티켓 취소 이벤트 수신:', data);
      this.handleTicketCanceled(data);
    });

    this.socket.on('ticket.created', (ticket: Ticket) => {
      console.log('🎫 새 티켓 생성:', ticket);
      this.handleTicketCreated(ticket);
    });

    this.socket.on('item.updated', (data: any) => {
      console.log('🍽️ 아이템 업데이트:', data);
      this.handleItemUpdated(data);
    });

    this.socket.on('ticket.updated', (ticket: Ticket) => {
      console.log('🔄 티켓 업데이트:', ticket);
      this.handleTicketUpdated(ticket);
    });

    this.socket.on('ticket.hidden', (data: any) => {
      console.log('👻 티켓 숨김:', data);
      this.handleTicketHidden(data);
    });
  }

  /**
   * KDS 업데이트 처리
   */
  private handleKDSUpdate(data: any) {
    switch (data.type) {
      case 'item-status-update':
        this.handleItemUpdated(data.data);
        break;
      case 'new-order':
        console.log('🎫 새 주문 수신 (KDS 업데이트):', data.data);
        this.handleTicketCreated(data.data);
        break;
      case 'ticket_cooking_started':
        this.handleTicketCookingStarted(data.data);
        break;
      case 'ticket_completed':
        this.handleTicketCompleted(data.data);
        break;
      case 'order-complete':
        this.handleTicketUpdated(data.data);
        break;
    }
  }

  /**
   * DB 알림 처리
   */
  private handleDBNotification(data: any) {
    console.log('📡 DB 알림 처리:', data);
    // DB 트리거 기반 알림 처리
    if (data.type === 'new-order' && data.data) {
      this.handleTicketCreated(data.data);
    }
  }

  /**
   * 티켓 ID 추출
   */
  private extractTicketId(ticket: Ticket): string {
    return extractTicketId(ticket);
  }

  /**
   * 주방 아이템 필터링
   */
  private filterKitchenItems(items: any[]): any[] {
    const kitchenStations: CookStation[] = ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'];
    return (items || []).filter((item) => {
      const cookStation = item.cook_station || 'KITCHEN';
      return kitchenStations.includes(cookStation as CookStation);
    });
  }

  /**
   * 새 티켓 생성 처리
   */
  private handleTicketCreated(ticket: Ticket) {
    const ticketId = this.extractTicketId(ticket);
    console.log(`🎫 새 티켓 생성 이벤트: ${ticketId}`);

    if (!ticketId) {
      console.warn('⚠️ 티켓 ID가 없음 - 티켓 생성 스킵');
      return;
    }

    // 주방 관련 아이템만 필터링
    const kitchenItems = this.filterKitchenItems(ticket.items || []);

    if (kitchenItems.length === 0) {
      console.log(`ℹ️ 티켓 ${ticketId}에 주방 아이템이 없음 - KDS 처리 스킵`);
      return;
    }

    // DB에서 온 실제 상태를 정규화하여 보존
    const actualStatus = (ticket.status || 'PENDING').toUpperCase();

    const normalizedTicket: Ticket = {
      ...ticket,
      ticket_id: ticket.ticket_id || ticketId,
      check_id: ticket.check_id || ticketId,
      id: ticket.id || ticket.ticket_id || ticketId,
      batch_no: ticket.batch_no || 1,
      table_number: ticket.table_number || ticket.table_num || 'N/A',
      table_num: ticket.table_num || ticket.table_number || 'N/A',
      customer_name: ticket.customer_name || `테이블 ${ticket.table_number || ticket.table_num}`,
      items: kitchenItems,
      status: actualStatus as any,
      source: ticket.source || 'POS',
      created_at: ticket.created_at || new Date().toISOString(),
    };

    this.handlers?.onTicketCreated(normalizedTicket);
  }

  /**
   * 티켓 업데이트 처리
   */
  private handleTicketUpdated(ticket: Ticket) {
    const ticketId = this.extractTicketId(ticket);
    console.log(`🔄 티켓 업데이트 처리: ${ticketId}`);
    this.handlers?.onTicketUpdated(ticket);
  }

  /**
   * 티켓 수정 처리
   */
  private handleTicketModified(data: any) {
    const ticketId = data.ticket_id || data.ticketId;
    if (ticketId) {
      console.log(`🔄 티켓 ${ticketId} 수정됨`);
      if (data.ticket) {
        this.handlers?.onTicketUpdated(data.ticket);
      }
    }
  }

  /**
   * 티켓 취소 처리
   */
  private handleTicketCanceled(data: any) {
    const ticketId = data.ticket_id || data.ticketId;
    if (ticketId) {
      console.log(`❌ 티켓 ${ticketId} 취소됨`);
      this.handlers?.onTicketRemoved(String(ticketId));
    }
  }

  /**
   * 티켓 조리 시작 처리
   */
  private handleTicketCookingStarted(data: any) {
    const ticketId = data.ticket_id || data.ticketId;
    console.log(`🔥 티켓 ${ticketId} 조리 시작됨`);
    if (data.ticket) {
      this.handlers?.onTicketUpdated(data.ticket);
    }
  }

  /**
   * 티켓 완료 처리
   */
  private handleTicketCompleted(data: any) {
    const ticketId = data.ticket_id || data.ticketId;
    console.log(`✅ 티켓 ${ticketId} 완료됨`);
    this.handlers?.onTicketRemoved(String(ticketId));
  }

  /**
   * 티켓 숨김 처리
   */
  private handleTicketHidden(data: any) {
    const ticketId = data.ticket_id || data.ticketId;
    console.log(`👻 티켓 ${ticketId} 숨김`);
    this.handlers?.onTicketRemoved(String(ticketId));
  }

  /**
   * 아이템 업데이트 처리
   */
  private handleItemUpdated(data: any) {
    const ticketId = data.ticket_id || data.ticketId;
    const itemId = data.item_id || data.itemId;
    const status = data.status || data.item_status;

    if (ticketId && itemId && status) {
      console.log(`🍽️ 아이템 업데이트: 티켓 ${ticketId}, 아이템 ${itemId} -> ${status}`);
      this.handlers?.onItemUpdated({ ticketId: String(ticketId), itemId: String(itemId), status });
    }
  }

  /**
   * 아이템 상태 업데이트 전송
   */
  updateItemStatus(itemId: string, status: string) {
    if (this.socket?.connected) {
      this.socket.emit('item-status-update', {
        itemId,
        status,
        storeId: this.storeId,
      });
    }
  }

  /**
   * 주기적 동기화 시작
   */
  startPeriodicSync(storeId: string, interval: number = 15000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.socket?.connected) {
        console.log('🔄 주기적 동기화 요청');
        this.socket.emit('kds-sync', { storeId });
      }
    }, interval);
  }

  /**
   * 주기적 동기화 중지
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect() {
    this.stopPeriodicSync();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers?.onConnectionChange(false);
    console.log('🔌 KDS WebSocket 연결 해제');
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// 싱글톤 인스턴스 내보내기
export const kdsWebSocket = new KDSWebSocketService();
export default kdsWebSocket;
