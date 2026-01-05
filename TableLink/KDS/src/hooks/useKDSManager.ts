/**
 * KDS (Kitchen Display System) 커스텀 Hook
 * - KDS 시스템 초기화 및 관리
 * - 액션 핸들러 제공
 */

import { useCallback, useEffect, useRef } from 'react';
import { useKDS, extractTicketId } from '../context/KDSContext';
import type { Ticket, TabType, CookStation, ItemStatus } from '../types';
import { kdsAPI } from '../services/api';
import { kdsWebSocket } from '../services/websocket';
import { kdsSoundManager } from '../services/sound';

interface UseKDSManagerOptions {
  storeId: string;
}

export function useKDSManager({ storeId }: UseKDSManagerOptions) {
  const { state, dispatch, getActiveTickets, getCompletedTickets, findTicketById } = useKDS();
  const processingTickets = useRef<Set<string>>(new Set());
  const autoRefreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // 주방 아이템 필터링
  const filterKitchenItems = useCallback((items: any[]): any[] => {
    const kitchenStations: CookStation[] = ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'];
    return (items || []).filter((item) => {
      const cookStation = item.cook_station || 'KITCHEN';
      return kitchenStations.includes(cookStation as CookStation);
    });
  }, []);

  // KDS 시스템 초기화
  const initialize = useCallback(async () => {
    try {
      console.log(`🍳 KDS 시스템 초기화 - 매장 ${storeId}`);
      dispatch({ type: 'SET_LOADING', payload: true });

      // 상태 초기화
      dispatch({ type: 'INITIALIZE', payload: { storeId } });

      // 사운드 초기화
      kdsSoundManager.initialize();

      // 초기 데이터 로드
      const tickets = await kdsAPI.loadInitialData(storeId);

      // 완료된 티켓 제외하고 저장
      const activeTickets = tickets.filter((ticket) => {
        const status = (ticket.status || '').toUpperCase();
        const isCompleted = ['DONE', 'COMPLETED', 'SERVED'].includes(status);

        if (isCompleted) {
          console.log(`🚫 완료된 티켓 제외: ${extractTicketId(ticket)}`);
          return false;
        }

        // 주방 아이템이 있는지 확인
        const kitchenItems = filterKitchenItems(ticket.items);
        if (kitchenItems.length === 0) {
          console.log(`🚫 주방 아이템 없는 티켓 제외: ${extractTicketId(ticket)}`);
          return false;
        }

        return true;
      });

      dispatch({ type: 'SET_TICKETS', payload: activeTickets });

      // WebSocket 연결
      kdsWebSocket.setHandlers({
        onConnectionChange: (connected) => {
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: connected });
        },
        onTicketCreated: (ticket) => {
          const ticketId = extractTicketId(ticket);
          dispatch({ type: 'SET_TICKET', payload: { ticketId, ticket } });
          kdsSoundManager.playNewOrderSound();
        },
        onTicketUpdated: (ticket) => {
          const ticketId = extractTicketId(ticket);
          dispatch({ type: 'SET_TICKET', payload: { ticketId, ticket } });
        },
        onTicketRemoved: (ticketId) => {
          dispatch({ type: 'REMOVE_TICKET', payload: ticketId });
        },
        onItemUpdated: ({ ticketId, itemId, status }) => {
          const ticket = findTicketById(ticketId);
          if (ticket && ticket.items) {
            const updatedItems = ticket.items.map((item) =>
              String(item.id) === itemId 
                ? { ...item, status: status as ItemStatus, item_status: status as ItemStatus } 
                : item
            );
            dispatch({
              type: 'UPDATE_TICKET',
              payload: { ticketId, updates: { items: updatedItems } },
            });
          }
        },
      });

      await kdsWebSocket.connect(storeId);

      // 주기적 동기화 시작
      kdsWebSocket.startPeriodicSync(storeId, 15000);

      // 자동 새로고침 설정 (5분)
      autoRefreshInterval.current = setInterval(() => {
        if (!state.isConnected) {
          console.log('🔄 WebSocket 연결 안됨, 자동 새로고침 실행');
          refresh();
        }
      }, 5 * 60 * 1000);

      dispatch({ type: 'SET_LOADING', payload: false });
      console.log('✅ KDS 시스템 초기화 완료');
    } catch (error) {
      console.error('❌ KDS 시스템 초기화 실패:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'KDS 시스템을 초기화할 수 없습니다',
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [storeId, dispatch, filterKitchenItems, findTicketById, state.isConnected]);

  // 탭 전환
  const switchTab = useCallback(
    (tab: TabType) => {
      dispatch({ type: 'SET_TAB', payload: tab });
    },
    [dispatch]
  );

  // 조리 시작
  const startCooking = useCallback(
    async (ticketId: string) => {
      console.log(`🔥 티켓 ${ticketId} 조리 시작 요청`);

      // 중복 요청 방지
      if (processingTickets.current.has(ticketId)) {
        console.warn(`⚠️ 티켓 ${ticketId} 이미 처리 중`);
        return;
      }

      processingTickets.current.add(ticketId);

      const ticket = findTicketById(ticketId);
      if (!ticket) {
        console.error(`❌ 티켓 ${ticketId}을 찾을 수 없음`);
        processingTickets.current.delete(ticketId);
        return;
      }

      // 원래 상태 백업
      const originalStatus = ticket.status;

      try {
        // 낙관적 업데이트
        const updatedItems = ticket.items?.map((item) => ({
          ...item,
          status: 'COOKING' as const,
          item_status: 'COOKING' as const,
        }));

        dispatch({
          type: 'UPDATE_TICKET',
          payload: {
            ticketId,
            updates: { status: 'COOKING', items: updatedItems },
          },
        });

        // 서버 API 호출
        const result = await kdsAPI.startCooking(ticketId);

        if (result.success) {
          console.log(`✅ 티켓 ${ticketId} 조리 시작 성공`);
          kdsSoundManager.playItemCompleteSound();
        } else {
          throw new Error(result.error || '조리 시작 실패');
        }
      } catch (error) {
        console.error(`❌ 티켓 ${ticketId} 조리 시작 실패:`, error);

        // 실패 시 원래 상태로 복구
        dispatch({
          type: 'UPDATE_TICKET',
          payload: { ticketId, updates: { status: originalStatus } },
        });

        alert(`조리 시작 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      } finally {
        processingTickets.current.delete(ticketId);
      }
    },
    [dispatch, findTicketById]
  );

  // 완료 처리
  const markComplete = useCallback(
    async (ticketId: string) => {
      try {
        console.log(`✅ 티켓 ${ticketId} 완료 요청`);

        // 사운드 재생
        kdsSoundManager.playOrderCompleteSound();

        // 상태에서 즉시 제거
        dispatch({ type: 'REMOVE_TICKET', payload: ticketId });

        // 백그라운드에서 서버 API 호출
        setTimeout(async () => {
          try {
            const result = await kdsAPI.markComplete(ticketId);
            if (result.success) {
              console.log(`✅ 서버 완료 처리 성공: ${ticketId}`);
            } else {
              console.warn(`⚠️ 서버 완료 처리 실패 (UI는 이미 처리됨): ${result.error}`);
            }
          } catch (serverError) {
            console.warn(`⚠️ 서버 API 호출 실패 (UI는 이미 처리됨):`, serverError);
          }
        }, 100);
      } catch (error) {
        console.error('❌ 완료 처리 실패:', error);
        dispatch({ type: 'REMOVE_TICKET', payload: ticketId });
      }
    },
    [dispatch]
  );

  // 출력 요청
  const printOrder = useCallback(
    async (ticketId: string) => {
      try {
        console.log(`🖨️ 주문서 출력 요청: ${ticketId}`);

        const result = await kdsAPI.updatePrintStatus(ticketId);

        if (result.success) {
          console.log(`✅ 출력 요청 성공: ${ticketId}`);
          kdsSoundManager.playPrintSound();
        } else {
          throw new Error(result.error || '출력 실패');
        }
      } catch (error) {
        console.error('❌ 주문서 출력 실패:', error);
        alert(`출력 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    },
    []
  );

  // 새로고침
  const refresh = useCallback(async () => {
    try {
      console.log('🔄 KDS 새로고침 시작');
      dispatch({ type: 'SET_LOADING', payload: true });

      // 상태 초기화
      dispatch({ type: 'CLEAR_TICKETS' });

      // 데이터 다시 로드
      const tickets = await kdsAPI.loadInitialData(storeId);

      // 완료된 티켓 제외
      const activeTickets = tickets.filter((ticket) => {
        const status = (ticket.status || '').toUpperCase();
        return !['DONE', 'COMPLETED', 'SERVED'].includes(status);
      });

      dispatch({ type: 'SET_TICKETS', payload: activeTickets });
      dispatch({ type: 'SET_LOADING', payload: false });

      console.log('✅ KDS 새로고침 완료');
    } catch (error) {
      console.error('❌ KDS 새로고침 실패:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      alert('새로고침 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  }, [storeId, dispatch]);

  // 설정 화면 표시
  const showSettings = useCallback(() => {
    alert('설정 화면 (구현 예정)');
    console.log('⚙️ 설정 화면 요청');
  }, []);

  // 사운드 토글
  const toggleSound = useCallback(() => {
    const enabled = kdsSoundManager.toggleSound();
    dispatch({ type: 'TOGGLE_SOUND' });
    return enabled;
  }, [dispatch]);

  // 정리 작업
  const cleanup = useCallback(() => {
    kdsWebSocket.disconnect();

    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }

    console.log('🧹 KDS 관리자 정리 완료');
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // 현재 탭에 맞는 티켓 반환
  const getCurrentTickets = useCallback((): Ticket[] => {
    return state.currentTab === 'active' ? getActiveTickets() : getCompletedTickets();
  }, [state.currentTab, getActiveTickets, getCompletedTickets]);

  return {
    // 상태
    state,
    currentTickets: getCurrentTickets(),

    // 초기화
    initialize,
    cleanup,

    // 액션
    switchTab,
    startCooking,
    markComplete,
    printOrder,
    refresh,
    showSettings,
    toggleSound,
  };
}

export default useKDSManager;
