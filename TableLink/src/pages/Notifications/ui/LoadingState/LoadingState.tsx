import styles from './LoadingState.module.css'

export const LoadingState = () => {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p className={styles.text}>알림을 불러오는 중...</p>
    </div>
  )
}
