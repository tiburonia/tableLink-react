import styles from './OrderCard.module.css'
import type { Order } from '../model'

interface OrderCardProps {
  order: Order
  onStatusChange?: (orderId: number, status: string) => void
  onCancel?: (orderId: number) => void
}

export function OrderCard({ order, onStatusChange, onCancel }: OrderCardProps) {
  const {
    order_id,
    source,
    status,
    payment_status,
    items,
    total_amount,
    paid_amount,
    created_at,
  } = order

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return '대기중'
      case 'confirmed':
        return '확인됨'
      case 'preparing':
        return '조리중'
      case 'ready':
        return '완료'
      case 'served':
        return '서빙됨'
      case 'cancelled':
        return '취소됨'
      default:
        return status
    }
  }

  const getPaymentStatusText = () => {
    switch (payment_status) {
      case 'unpaid':
        return '미결제'
      case 'partial':
        return '부분결제'
      case 'paid':
        return '결제완료'
      case 'refunded':
        return '환불됨'
      default:
        return payment_status
    }
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const unpaidAmount = total_amount - paid_amount

  return (
    <div className={`${styles.card} ${styles[status]}`}>
      <div className={styles.header}>
        <div className={styles.sourceInfo}>
          <span className={`${styles.sourceBadge} ${styles[source.toLowerCase()]}`}>
            {source}
          </span>
          <span className={styles.orderId}>#{order_id}</span>
        </div>
        <span className={styles.time}>{formatTime(created_at)}</span>
      </div>

      <div className={styles.items}>
        {items.slice(0, 3).map((item) => (
          <div key={item.order_item_id} className={styles.item}>
            <span className={styles.itemName}>{item.menu_name}</span>
            <span className={styles.itemQuantity}>x{item.quantity}</span>
          </div>
        ))}
        {items.length > 3 && (
          <div className={styles.moreItems}>
            +{items.length - 3}개 더보기
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.amount}>
          <span className={styles.totalAmount}>
            {total_amount.toLocaleString()}원
          </span>
          {unpaidAmount > 0 && (
            <span className={styles.unpaidAmount}>
              (미결제: {unpaidAmount.toLocaleString()}원)
            </span>
          )}
        </div>

        <div className={styles.statusRow}>
          <span className={`${styles.statusBadge} ${styles[`status_${status}`]}`}>
            {getStatusText()}
          </span>
          <span className={`${styles.paymentBadge} ${styles[`payment_${payment_status}`]}`}>
            {getPaymentStatusText()}
          </span>
        </div>
      </div>

      {status !== 'cancelled' && status !== 'served' && (
        <div className={styles.actions}>
          {onStatusChange && status === 'pending' && (
            <button
              className={styles.confirmBtn}
              onClick={() => onStatusChange(order_id, 'confirmed')}
            >
              확인
            </button>
          )}
          {onCancel && payment_status !== 'paid' && (
            <button
              className={styles.cancelBtn}
              onClick={() => onCancel(order_id)}
            >
              취소
            </button>
          )}
        </div>
      )}
    </div>
  )
}
