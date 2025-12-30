import styles from './LoadingState.module.css'

export const LoadingState = () => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p className={styles.loadingText}>결제 정보를 불러오는 중...</p>
    </div>
  )
}
