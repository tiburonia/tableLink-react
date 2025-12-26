import type { StoreContactInfo } from '../../model'
import styles from './StoreBasicInfo.module.css'

export const StoreBasicInfo = ({ phone, address, isOpen }: StoreContactInfo) => {
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>
        <span className={styles.titleIcon}>ℹ️</span>
        기본 정보
      </h3>
      <div className={styles.infoList}>
        {phone && (
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>📞</span>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>전화번호</span>
              <a href={`tel:${phone}`} className={`${styles.infoValue} ${styles.infoLink}`}>
                {phone}
              </a>
            </div>
          </div>
        )}
        
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>📍</span>
          <div className={styles.infoContent}>
            <span className={styles.infoLabel}>주소</span>
            <span className={styles.infoValue}>
              {address || '서울특별시 강남구 테헤란로 123'}
            </span>
          </div>
        </div>

        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>🕐</span>
          <div className={styles.infoContent}>
            <span className={styles.infoLabel}>영업 상태</span>
            <span className={`${styles.infoValue} ${isOpen ? styles.statusOpen : styles.statusClosed}`}>
              {isOpen ? '영업 중' : '영업 종료'}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
