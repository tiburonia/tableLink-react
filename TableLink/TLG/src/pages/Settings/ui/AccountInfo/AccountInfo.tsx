import styles from './AccountInfo.module.css'

interface AccountInfoProps {
  displayName: string
  email: string
  phone: string
  isEmailVerified: boolean
  onEditField: (field: string) => void
}

const ArrowIcon = () => (
  <svg className={styles.arrowIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M7 15L12 10L7 5"
      stroke="#86868b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const AccountInfo = ({
  displayName,
  email,
  phone,
  isEmailVerified,
  onEditField,
}: AccountInfoProps) => {

  return (
    <section className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>계정 정보</h2>
      </div>
      <div className={styles.accountInfoList}>
        {/* 닉네임 */}
        <div className={styles.infoRow} onClick={() => onEditField('nickname')}>
          <span className={styles.infoLabel}>닉네임</span>
          <div className={styles.infoValueContainer}>
            <span className={styles.infoValue}>{displayName}</span>
            <ArrowIcon />
          </div>
        </div>

        {/* 이메일 */}
        <div className={styles.infoRow} onClick={() => onEditField('email')}>
          <span className={styles.infoLabel}>이메일</span>
          <div className={styles.infoValueContainer}>
            <span className={styles.infoValue}>{email || '등록된 이메일 없음'}</span>
            {isEmailVerified && <span className={styles.verifiedBadge}>인증 완료</span>}
            <ArrowIcon />
          </div>
        </div>

        {/* 휴대폰번호 */}
        <div className={styles.infoRow} onClick={() => onEditField('phone')}>
          <span className={styles.infoLabel}>휴대폰번호</span>
          <div className={styles.infoValueContainer}>
            <span className={styles.infoValue}>{phone || '등록된 번호 없음'}</span>
            <ArrowIcon />
          </div>
        </div>

        {/* 비밀번호 */}
        <div className={styles.infoRow} onClick={() => onEditField('password')}>
          <span className={styles.infoLabel}>비밀번호</span>
          <div className={styles.infoValueContainer}>
            <span className={`${styles.infoValue} ${styles.passwordText}`}>
              새로운 비밀번호로 변경 가능
            </span>
            <ArrowIcon />
          </div>
        </div>
      </div>
    </section>
  )
}
