import styles from './FooterButtons.module.css'

interface FooterButtonsProps {
  onWithdraw: () => void
  onLogout: () => void
}

export const FooterButtons = ({ onWithdraw, onLogout }: FooterButtonsProps) => {
  return (
    <div className={styles.footerButtons}>
      <button className={styles.textButton} onClick={onWithdraw}>
        회원탈퇴
      </button>
      <button className={styles.textButton} onClick={onLogout}>
        로그아웃
      </button>
    </div>
  )
}
