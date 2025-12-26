import styles from './EmptyState.module.css'

export const EmptyState = () => {
  return (
    <div className={styles.empty}>
      <div className={styles.icon}>🔔</div>
      <h3 className={styles.title}>알림이 없습니다</h3>
      <p className={styles.description}>새로운 알림이 도착하면 여기에 표시됩니다</p>
    </div>
  )
}
