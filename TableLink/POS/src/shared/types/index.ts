/**
 * POS Shared Types
 */

// =================== 기본 타입 ===================

/** 현재 화면 뷰 타입 */
export type ViewType = 'table' | 'order' | 'payment'

/** 주문 탭 타입 */
export type OrderTabType = 'all' | 'pos' | 'tll'

/** 결제 방식 */
export type PaymentMethod = 'CARD' | 'CASH' | 'TOSS'

/** 고객 유형 */
export type CustomerType = 'guest' | 'member'

/** 주문 상태 */
export type OrderStatus = 'pending' | 'cooking' | 'completed' | 'cancelled'

/** 티켓 상태 */
export type TicketStatus = 'pending' | 'cooking' | 'completed' | 'cancelled'

// =================== API 응답 타입 ===================

/** API 기본 응답 */
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// =================== UI 상태 ===================

/** 알림 정보 */
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: Date
  isRead: boolean
}

/** 모달 상태 */
export interface ModalState {
  isOpen: boolean
  type?: 'payment' | 'confirm' | 'alert' | 'menu-detail'
  data?: unknown
}

/** 로딩 상태 */
export interface LoadingState {
  isLoading: boolean
  message?: string
}

/** 에러 상태 */
export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
}
