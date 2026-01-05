import styles from './TableCard.module.css'
import type { Table } from '../model'

interface TableCardProps {
  table: Table
  onClick: (tableNumber: number) => void
}

export function TableCard({ table, onClick }: TableCardProps) {
  const {
    tableNumber,
    isOccupied,
    orders,
  } = table

  // 소스별 주문 확인
  const hasPOSOrders = orders.some((o) => o.source === 'POS')
  const hasTLLOrders = orders.some((o) => o.source === 'TLL')
  const hasOrders = orders.length > 0

  // 총 금액 계산
  const totalAmount = orders.reduce((sum, order) => {
    return sum + Object.values(order.items).reduce((itemSum, item) => itemSum + item.totalPrice, 0)
  }, 0)

  // 총 아이템 수 계산
  const orderCount = orders.reduce((sum, order) => {
    return sum + Object.values(order.items).reduce((itemSum, item) => itemSum + item.quantity, 0)
  }, 0)

  // 최신 주문 시간
  const lastOrderTime = orders
    .filter((o) => o.createdAt)
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0]?.createdAt

  const getStatusClass = () => {
    if (hasTLLOrders && hasPOSOrders) return 'combined'
    if (hasTLLOrders) return 'tll'
    if (hasPOSOrders) return 'pos'
    return 'empty'
  }

  const getStatusText = () => {
    if (hasTLLOrders && hasPOSOrders) return 'POS + TLL'
    if (hasTLLOrders) return 'TLL 주문'
    if (hasPOSOrders) return 'POS 주문'
    return '빈 테이블'
  }

  const getStatusIcon = () => {
    if (hasTLLOrders && hasPOSOrders) return '🔗'
    if (hasTLLOrders) return '📱'
    if (hasPOSOrders) return '🍽️'
    return '🪑'
  }

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const statusClass = getStatusClass()

  return (
    <div
      className={`${styles.card} ${styles[statusClass]}`}
      onClick={() => onClick(tableNumber)}
    >
      <div className={styles.tableNumber}>
        <span className={styles.number}>{tableNumber}</span>
        <span className={styles.label}>번</span>
      </div>

      <div className={styles.status}>
        <span className={styles.statusIcon}>{getStatusIcon()}</span>
        <span className={styles.statusText}>{getStatusText()}</span>
      </div>

      {(hasOrders || isOccupied) && (
        <div className={styles.orderInfo}>
          <div className={styles.orderCount}>
            <span className={styles.countValue}>{orderCount}</span>
            <span className={styles.countLabel}>건</span>
          </div>
          <div className={styles.orderAmount}>
            {totalAmount.toLocaleString()}원
          </div>
        </div>
      )}

      {hasOrders && (
        <div className={styles.orderSources}>
          {hasPOSOrders && <span className={`${styles.badge} ${styles.posBadge}`}>POS</span>}
          {hasTLLOrders && <span className={`${styles.badge} ${styles.tllBadge}`}>TLL</span>}
        </div>
      )}

      {lastOrderTime && (
        <div className={styles.lastOrderTime}>
          {formatTime(lastOrderTime)}
        </div>
      )}

      <div className={`${styles.indicator} ${styles[`${statusClass}Indicator`]}`} />
    </div>
  )
}
