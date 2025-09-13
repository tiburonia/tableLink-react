
/**
 * KDS 상태 관리 모듈
 * - 중앙 집중식 상태 관리
 * - 티켓 데이터 관리
 * - 연결 상태 관리
 */

(function() {
  'use strict';

  console.log('📊 KDS 상태 관리 모듈 로드');

  // =================== 상태 관리 ===================
  window.KDSState = {
    storeId: null,
    currentTab: 'active', // 'active' | 'completed'
    tickets: new Map(), // ticket_id -> ticket data
    socket: null,
    isConnected: false,
    selectedStations: ['KITCHEN', 'GRILL', 'FRY', 'DRINK', 'COLD_STATION'],
    autoRefreshInterval: null,

    /**
     * 상태 초기화
     */
    initialize(storeId) {
      this.storeId = storeId;
      this.currentTab = 'active';
      this.tickets.clear();
      this.socket = null;
      this.isConnected = false;
      this.autoRefreshInterval = null;
      console.log(`📊 KDS 상태 초기화 완료 - 매장 ${storeId}`);
    },

    /**
     * 티켓 추가/업데이트
     */
    setTicket(ticketId, ticketData) {
      this.tickets.set(ticketId, ticketData);
    },

    /**
     * 티켓 조회
     */
    getTicket(ticketId) {
      return this.tickets.get(ticketId);
    },

    /**
     * 티켓 제거
     */
    removeTicket(ticketId) {
      return this.tickets.delete(ticketId);
    },

    /**
     * 모든 티켓 조회
     */
    getAllTickets() {
      return Array.from(this.tickets.values());
    },

    /**
     * 활성 티켓 조회
     */
    getActiveTickets() {
      return this.getAllTickets().filter(ticket => 
        ticket.status !== 'completed' && ticket.status !== 'served'
      );
    },

    /**
     * 완료된 티켓 조회
     */
    getCompletedTickets() {
      return this.getAllTickets().filter(ticket => 
        ticket.status === 'completed' || ticket.status === 'served'
      );
    },

    /**
     * WebSocket 연결 상태 설정
     */
    setConnectionStatus(isConnected) {
      this.isConnected = isConnected;
    },

    /**
     * 정리
     */
    cleanup() {
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = null;
      }
      this.tickets.clear();
      this.socket = null;
      this.isConnected = false;
    }
  };

  console.log('✅ KDS 상태 관리 모듈 로드 완료');
})();
