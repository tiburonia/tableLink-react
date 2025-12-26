/**
 * 결제 내역 리스트 컴포넌트
 */

import { getPaymentMethodIcon, formatOrderTime } from '../model'
import type { OrderPayment } from '../model'
import styles from './PaymentsList.module.css'

interface PaymentsListProps {
  payments: OrderPayment[]
  totalAmount: number
}

export const PaymentsList = ({ payments, totalAmount }: PaymentsListProps) => {
  if (payments.length === 0) {
    return (
      <div className={styles.paymentsSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>💳 결제 내역</h3>
          <div className={styles.paymentSummary}>총 0건 • 0원</div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💳</div>
          <p className={styles.emptyText}>결제 내역이 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.paymentsSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>💳 결제 내역</h3>
        <div className={styles.paymentSummary}>
          총 {payments.length}건 • {totalAmount.toLocaleString()}원
        </div>
      </div>

      <div className={styles.paymentsList}>
        {payments.map((payment) => (
          <div key={payment.id} className={styles.paymentCard}>
            <div className={styles.paymentInfo}>
              <div className={styles.paymentHeader}>
                <span className={styles.paymentIcon}>{getPaymentMethodIcon(payment.method)}</span>
                <span className={styles.paymentMethod}>{payment.method}</span>
              </div>
              <div className={styles.paymentTime}>{formatOrderTime(payment.createdAt)}</div>
            </div>
            <div className={styles.paymentAmount}>{payment.amount.toLocaleString()}원</div>
          </div>
        ))}
      </div>
    </div>
  )
}
