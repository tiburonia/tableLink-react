/**
 * Order Entity - 주문 도메인 타입 정의
 */

export interface Order {
  id: number
  userId: number
  storeId: number
  storeName?: string
  tableNumber?: number
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  paymentMethod?: PaymentMethod
  paymentStatus?: PaymentStatus
  notes?: string
  createdAt: string
  updatedAt?: string
  completedAt?: string
}

export type OrderStatus = 
  | 'pending'      // 대기중
  | 'confirmed'    // 확인됨
  | 'preparing'    // 준비중
  | 'ready'        // 준비완료
  | 'completed'    // 완료
  | 'cancelled'    // 취소됨

export type PaymentMethod = 
  | 'card'         // 카드
  | 'cash'         // 현금
  | 'toss'         // 토스페이
  | 'kakao'        // 카카오페이

export type PaymentStatus = 
  | 'pending'      // 대기중
  | 'completed'    // 완료
  | 'failed'       // 실패
  | 'refunded'     // 환불됨

export interface OrderItem {
  id: number
  orderId: number
  menuId: number
  menuName: string
  quantity: number
  price: number
  subtotal: number
  options?: OrderItemOption[]
}

export interface OrderItemOption {
  name: string
  value: string
  price: number
}

export interface OrderSummary {
  orderId: number
  storeName: string
  totalAmount: number
  status: OrderStatus
  createdAt: string
}
