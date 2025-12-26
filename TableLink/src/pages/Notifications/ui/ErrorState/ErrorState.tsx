import styles from './ErrorState.module.css'

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <div className={styles.error}>
      <div className={styles.icon}>⚠️</div>
      <h3 className={styles.message}>{error}</h3>
      <button onClick={onRetry} className={styles.retryBtn}>
        다시 시도
      </button>
    </div>
  )
}
