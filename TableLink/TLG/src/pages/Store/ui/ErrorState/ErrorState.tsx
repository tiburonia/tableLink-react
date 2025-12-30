import { useNavigate } from 'react-router-dom'
import styles from './ErrorState.module.css'

interface ErrorStateProps {
  error: string
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  const navigate = useNavigate()
  
  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>오류가 발생했습니다</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={() => navigate('/')} className={styles.backButton}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
