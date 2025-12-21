import styles from './SettingsHeader.module.css'

interface SettingsHeaderProps {
  onBack: () => void
}

export const SettingsHeader = ({ onBack }: SettingsHeaderProps) => {
  return (
    <header className={styles.settingsHeader}>
      <button className={styles.headerBackBtn} onClick={onBack} aria-label="뒤로가기">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <h1 className={styles.headerTitle}>내정보 관리</h1>
      <div className={styles.headerSpacer}></div>
    </header>
  )
}
