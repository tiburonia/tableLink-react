/**
 * 주문 세션 관련 타입 정의
 */

export type OrderTicketStatus = 'PENDING' | 'COOKING' | 'READY' | 'SERVED' | 'CANCELLED'
export type OrderSessionStatus = 'OPEN' | 'COOKING' | 'READY' | 'DONE' | 'CLOSED'
export type PaymentStatus = 'PAID' | 'UNPAID' | 'COMPLETED' | 'completed' | 'pending' | 'failed' | 'cancelled' | 'refunded'
export type OrderSource = 'POS' | 'TLL'
export type PaymentMethod = 'TOSS' | 'CARD' | 'CASH' | 'MOBILE'

export interface OrderTicketItem {
  id: number
  menu_name: string
  name: string
  quantity: number
  unit_price: number
  cook_station?: string
  status?: string
  options?: any
}

export interface OrderTicket {
  ticket_id: number
  id: number
  order_id: number
  batch_no: number
  source: OrderSource
  paid_status: PaymentStatus
  status: OrderTicketStatus
  created_at: string
  items: OrderTicketItem[]
}

export interface OrderPayment {
  id: number
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  createdAt: string
  payment_key?: string
  ticket_ids: number[]
}

export interface OrderSessionData {
  id: number
  storeId: number
  storeName: string
  tableNumber: number
  session_status: OrderSessionStatus
  createdAt: string
  sessionEnded: boolean
  session_ended_at: string | null
  totalOrders: number
  totalAmount: number
  tickets: OrderTicket[]
  payments: OrderPayment[]
}

export interface OrderSessionResponse {
  success: boolean
  order?: OrderSessionData
  message?: string
}
