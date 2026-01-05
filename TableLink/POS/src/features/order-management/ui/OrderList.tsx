import { OrderCard } from '@/entities/order'
import type { Order } from '@/entities/order'
import styles from './OrderList.module.css'

interface OrderListProps {
  orders: Order[]
  onStatusChange?: (orderId: number, status: string) => void
  onCancel?: (orderId: number) => void
}

export function OrderList({ orders, onStatusChange, onCancel }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📝</span>
        <p>주문 내역이 없습니다</p>
      </div>
    )
  }

  // 최신 주문이 위로 오도록 정렬
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className={styles.list}>
      {sortedOrders.map((order) => (
        <OrderCard
          key={order.order_id}
          order={order}
          onStatusChange={onStatusChange}
          onCancel={onCancel}
        />
      ))}
    </div>
  )
}
