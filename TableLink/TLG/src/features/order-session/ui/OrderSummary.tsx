/**
 * 주문 요약 카드 컴포넌트
 */

import { getSessionStatusText, getElapsedTime } from '../model'
import type { OrderSessionStatus } from '../model'
import styles from './OrderSummary.module.css'

interface OrderSummaryProps {
  status: OrderSessionStatus
  totalOrders: number
  totalAmount: number
  createdAt: string
}

export const OrderSummary = ({ status, totalOrders, totalAmount, createdAt }: OrderSummaryProps) => {
  const statusClass = `status${status.charAt(0) + status.slice(1).toLowerCase()}`

  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryHeader}>
        <h3 className={styles.summaryTitle}>📊 주문 요약</h3>
        <div className={`${styles.orderStatus} ${styles[statusClass]}`}>
          {getSessionStatusText(status)}
        </div>
      </div>

      <div className={styles.summaryStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>총 주문</span>
          <span className={styles.statValue}>{totalOrders}건</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>총 결제</span>
          <span className={styles.statValue}>{totalAmount.toLocaleString()}원</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>진행시간</span>
          <span className={styles.statValue}>{getElapsedTime(createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
