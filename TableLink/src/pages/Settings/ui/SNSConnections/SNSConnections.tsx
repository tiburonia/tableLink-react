import styles from './SNSConnections.module.css'

interface SNSConnectionsProps {
  connections: {
    kakao: boolean
    naver: boolean
    apple: boolean
  }
  onConnect: (snsType: string) => void
}

export const SNSConnections = ({ connections, onConnect }: SNSConnectionsProps) => {
  return (
    <section className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>SNS 연동</h2>
        <p className={styles.sectionSubtitle}>연동된 계정으로 로그인할 수 있어요</p>
      </div>
      <div className={styles.snsButtonsContainer}>
        <button
          className={`${styles.snsButton} ${styles.kakao} ${connections.kakao ? styles.connected : ''}`}
          onClick={() => onConnect('kakao')}
        >
          <div className={`${styles.snsIcon} ${styles.kakaoIcon}`}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#FEE500" />
              <path
                d="M16 8C11.029 8 7 11.134 7 15C7 17.395 8.604 19.484 11 20.71V24L14.29 22.35C14.85 22.45 15.42 22.5 16 22.5C20.971 22.5 25 19.366 25 15.5C25 11.634 20.971 8 16 8Z"
                fill="#3C1E1E"
              />
            </svg>
          </div>
          <span>카카오톡</span>
        </button>

        <button
          className={`${styles.snsButton} ${styles.naver} ${connections.naver ? styles.connected : ''}`}
          onClick={() => onConnect('naver')}
        >
          <div className={`${styles.snsIcon} ${styles.naverIcon}`}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#03C75A" />
              <path
                d="M18.5 16L13.5 9H9V23H13.5V16L18.5 23H23V9H18.5V16Z"
                fill="white"
              />
            </svg>
          </div>
          <span>네이버</span>
        </button>

        <button
          className={`${styles.snsButton} ${styles.apple} ${connections.apple ? styles.connected : ''}`}
          onClick={() => onConnect('apple')}
        >
          <div className={`${styles.snsIcon} ${styles.appleIcon}`}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#000000" />
              <path
                d="M21.3 16.9c0-2.4 2-3.6 2.1-3.6-1.2-1.7-3-1.9-3.6-1.9-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.8-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.9 1.2 1.9 2.6 3.3 2.5 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.2 3.2-2.4 1-1.4 1.4-2.8 1.4-2.8s-2.6-1-2.6-3.9zm-2.4-7.1c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.6.7-1.2 2-1 3.1 1.1.1 2.2-.5 2.9-1.4z"
                fill="white"
              />
            </svg>
          </div>
          <span>애플</span>
        </button>
      </div>
    </section>
  )
}
