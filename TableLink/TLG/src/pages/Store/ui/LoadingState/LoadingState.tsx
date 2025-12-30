import styles from './LoadingState.module.css'

export const LoadingState = () => {
  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>매장 정보를 불러오는 중...</p>
        </div>
      </div>
    </div>
  )
}
