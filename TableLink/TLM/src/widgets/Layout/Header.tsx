import styles from './Header.module.css'

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuButton} onClick={onToggleSidebar}>
          ☰
        </button>
        <h1 className={styles.title}>관리자 대시보드</h1>
      </div>
      
      <div className={styles.right}>
        <button className={styles.iconButton}>🔔</button>
        <div className={styles.profile}>
          <span className={styles.avatar}>👤</span>
          <span className={styles.name}>관리자</span>
        </div>
      </div>
    </header>
  )
}
