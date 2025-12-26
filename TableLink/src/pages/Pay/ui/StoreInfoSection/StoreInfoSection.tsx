import styles from './StoreInfoSection.module.css'

interface StoreInfoSectionProps {
  storeName: string
  tableNumber: number
}

export const StoreInfoSection = ({ storeName, tableNumber }: StoreInfoSectionProps) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>📍 매장 정보</h2>
      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>매장명</span>
          <span className={styles.infoValue}>{storeName}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>테이블</span>
          <span className={styles.infoValue}>{tableNumber}번</span>
        </div>
      </div>
    </section>
  )
}
