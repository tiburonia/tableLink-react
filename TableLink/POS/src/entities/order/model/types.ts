export type OrderSource = 'POS' | 'TLL'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export interface OrderItem {
  order_item_id: number
  menu_id: number
  menu_name: string
  quantity: number
  price: number
  total_price: number
  options?: OrderItemOption[]
  status: OrderStatus
}

export interface OrderItemOption {
  option_id: number
  option_name: string
  price: number
}

export interface Order {
  order_id: number
  table_number: number
  store_id: number
  source: OrderSource
  status: OrderStatus
  payment_status: PaymentStatus
  items: OrderItem[]
  total_amount: number
  paid_amount: number
  created_at: string
  updated_at: string
  confirmed_at?: string
  cancelled_at?: string
}

export interface TableOrders {
  tableNumber: number
  orders: Order[]
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
}

// Cart types for POS ordering
export interface CartItem {
  menu_id: number
  menu_name: string
  price: number
  quantity: number
  options?: CartItemOption[]
}

export interface CartItemOption {
  option_id: number
  option_name: string
  price: number
}
