import styles from './AmountSection.module.css'

interface AmountSectionProps {
  formattedAmount: string
}

export const AmountSection = ({ formattedAmount }: AmountSectionProps) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>💰 결제 금액</h2>
      <div className={styles.amountCard}>
        <div className={styles.amountRow}>
          <span className={styles.amountLabel}>주문 금액</span>
          <span className={styles.amountValue}>{formattedAmount}원</span>
        </div>
        <div className={styles.divider}></div>
        <div className={`${styles.amountRow} ${styles.totalRow}`}>
          <span className={styles.amountLabel}>총 결제 금액</span>
          <span className={`${styles.amountValue} ${styles.totalAmount}`}>
            {formattedAmount}원
          </span>
        </div>
      </div>
    </section>
  )
}
