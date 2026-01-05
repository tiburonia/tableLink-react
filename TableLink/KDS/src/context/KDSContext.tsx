/**
 * KDS 상태 관리 Context
 * - 중앙 집중식 상태 관리
 * - 티켓 데이터 관리
 * - 연결 상태 관리
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Ticket, TabType } from '../types';

// 상태 타입
interface KDSState {
  storeId: string | null;
  currentTab: TabType;
  tickets: Map<string, Ticket>;
  isConnected: boolean;
  soundEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

// 액션 타입
type KDSAction =
  | { type: 'INITIALIZE'; payload: { storeId: string } }
  | { type: 'SET_TAB'; payload: TabType }
  | { type: 'SET_TICKET'; payload: { ticketId: string; ticket: Ticket } }
  | { type: 'SET_TICKETS'; payload: Ticket[] }
  | { type: 'REMOVE_TICKET'; payload: string }
  | { type: 'UPDATE_TICKET'; payload: { ticketId: string; updates: Partial<Ticket> } }
  | { type: 'CLEAR_TICKETS' }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// 초기 상태
const initialState: KDSState = {
  storeId: null,
  currentTab: 'active',
  tickets: new Map(),
  isConnected: false,
  soundEnabled: true,
  isLoading: false,
  error: null,
};

// 티켓 ID 추출 헬퍼
export function extractTicketId(ticket: Ticket): string {
  return String(
    ticket.check_id ||
    ticket.ticket_id ||
    ticket.id ||
    ticket.order_id ||
    `unknown_${Date.now()}`
  );
}

// 리듀서
function kdsReducer(state: KDSState, action: KDSAction): KDSState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...initialState,
        storeId: action.payload.storeId,
        soundEnabled: !localStorage.getItem('kds-sound-disabled'),
      };

    case 'SET_TAB':
      return { ...state, currentTab: action.payload };

    case 'SET_TICKET': {
      const newTickets = new Map(state.tickets);
      newTickets.set(action.payload.ticketId, action.payload.ticket);
      return { ...state, tickets: newTickets };
    }

    case 'SET_TICKETS': {
      const newTickets = new Map<string, Ticket>();
      action.payload.forEach((ticket) => {
        const ticketId = extractTicketId(ticket);
        newTickets.set(ticketId, ticket);
      });
      return { ...state, tickets: newTickets };
    }

    case 'REMOVE_TICKET': {
      const newTickets = new Map(state.tickets);
      newTickets.delete(action.payload);
      return { ...state, tickets: newTickets };
    }

    case 'UPDATE_TICKET': {
      const newTickets = new Map(state.tickets);
      const existingTicket = newTickets.get(action.payload.ticketId);
      if (existingTicket) {
        newTickets.set(action.payload.ticketId, {
          ...existingTicket,
          ...action.payload.updates,
        });
      }
      return { ...state, tickets: newTickets };
    }

    case 'CLEAR_TICKETS':
      return { ...state, tickets: new Map() };

    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };

    case 'TOGGLE_SOUND': {
      const newSoundEnabled = !state.soundEnabled;
      localStorage.setItem('kds-sound-disabled', newSoundEnabled ? '' : 'true');
      return { ...state, soundEnabled: newSoundEnabled };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

// Context 타입
interface KDSContextType {
  state: KDSState;
  dispatch: React.Dispatch<KDSAction>;
  // 헬퍼 함수들
  getActiveTickets: () => Ticket[];
  getCompletedTickets: () => Ticket[];
  getAllTickets: () => Ticket[];
  getTicket: (ticketId: string) => Ticket | undefined;
  findTicketById: (ticketId: string) => Ticket | null;
}

// Context 생성
const KDSContext = createContext<KDSContextType | null>(null);

// Provider 컴포넌트
interface KDSProviderProps {
  children: ReactNode;
}

export function KDSProvider({ children }: KDSProviderProps) {
  const [state, dispatch] = useReducer(kdsReducer, initialState);

  // 활성 티켓 조회
  const getActiveTickets = useCallback((): Ticket[] => {
    return Array.from(state.tickets.values()).filter((ticket) => {
      const status = (ticket.status || '').toUpperCase();
      return !['DONE', 'COMPLETED', 'SERVED'].includes(status);
    });
  }, [state.tickets]);

  // 완료된 티켓 조회
  const getCompletedTickets = useCallback((): Ticket[] => {
    return Array.from(state.tickets.values()).filter((ticket) => {
      const status = (ticket.status || '').toUpperCase();
      return ['DONE', 'COMPLETED', 'SERVED'].includes(status);
    });
  }, [state.tickets]);

  // 모든 티켓 조회
  const getAllTickets = useCallback((): Ticket[] => {
    return Array.from(state.tickets.values());
  }, [state.tickets]);

  // 특정 티켓 조회
  const getTicket = useCallback(
    (ticketId: string): Ticket | undefined => {
      return state.tickets.get(ticketId);
    },
    [state.tickets]
  );

  // 여러 형태의 ID로 티켓 찾기
  const findTicketById = useCallback(
    (ticketId: string): Ticket | null => {
      // 1. 직접 키로 찾기
      let ticket = state.tickets.get(ticketId);
      if (ticket) return ticket;

      // 2. 문자열/숫자 변환해서 찾기
      const numericId = parseInt(ticketId);
      const stringId = String(ticketId);

      ticket = state.tickets.get(String(numericId)) || state.tickets.get(stringId);
      if (ticket) return ticket;

      // 3. 모든 티켓을 순회하면서 ID 필드들로 찾기
      for (const ticketData of state.tickets.values()) {
        const idFields = [
          ticketData.id,
          ticketData.check_id,
          ticketData.ticket_id,
          ticketData.order_id,
        ].filter((id) => id != null);

        for (const idField of idFields) {
          const idAsString = String(idField);
          const idAsNumber = parseInt(String(idField));

          if (
            idField === ticketId ||
            idAsString === String(ticketId) ||
            idAsNumber === numericId ||
            idField === numericId ||
            idField === stringId
          ) {
            return ticketData;
          }
        }
      }

      return null;
    },
    [state.tickets]
  );

  const value: KDSContextType = {
    state,
    dispatch,
    getActiveTickets,
    getCompletedTickets,
    getAllTickets,
    getTicket,
    findTicketById,
  };

  return <KDSContext.Provider value={value}>{children}</KDSContext.Provider>;
}

// Custom Hook
export function useKDS(): KDSContextType {
  const context = useContext(KDSContext);
  if (!context) {
    throw new Error('useKDS must be used within a KDSProvider');
  }
  return context;
}

export { KDSContext };
