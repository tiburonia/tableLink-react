import styles from './PayHeader.module.css'

interface PayHeaderProps {
  onBack: () => void
}

export const PayHeader = ({ onBack }: PayHeaderProps) => {
  return (
    <header className={styles.header}>
      <button className={styles.backButton} onClick={onBack}>
        ← 뒤로
      </button>
      <h1 className={styles.title}>결제하기</h1>
      <div className={styles.spacer}></div>
    </header>
  )
}
