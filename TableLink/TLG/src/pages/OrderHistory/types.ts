/**
 * Order History Types
 */

export interface OrderItem {
  name: string
  qty?: number
  quantity?: number
  price?: number
}

export interface OrderData {
  items?: OrderItem[]
  store?: string
  totalAmount?: number
}

export interface Order {
  id: number | string
  order_date: string
  store_name?: string
  order_data?: OrderData
  total_amount?: number
  final_amount?: number
  hasReview?: boolean
  order_status?: string
}

export interface OrderStats {
  totalOrders: number
  thisMonthOrders: number
  totalAmount: number
}

export interface OrderHistoryData {
  orders: Order[]
  stats: OrderStats
}
