/**
 * Table Entity - Types
 */

/**
 * 주문 아이템 정보
 */
export interface OrderItem {
  quantity: number
  unitPrice: number
  totalPrice: number
}

/**
 * 소스별 주문 정보 (POS/TLL)
 */
export interface SourceOrder {
  source: 'POS' | 'TLL' | string
  items: Record<string, OrderItem>
  createdAt?: string
}

/**
 * 테이블 정보 (서버 API 응답 형식)
 */
export interface Table {
  id: number
  tableNumber: number
  tableName: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | string
  isOccupied: boolean
  orders: SourceOrder[]
}
