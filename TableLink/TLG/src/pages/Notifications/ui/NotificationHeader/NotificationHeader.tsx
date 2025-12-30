import type { NotificationType } from '@/features/notification'
import styles from './NotificationHeader.module.css'

interface Tab {
  id: NotificationType
  icon: string
  label: string
}

interface NotificationHeaderProps {
  unreadCount: number
  currentTab: NotificationType
  tabs: Tab[]
  onMarkAllAsRead: () => void
  onTabChange: (tabId: NotificationType) => void
}

export const NotificationHeader = ({
  unreadCount,
  currentTab,
  tabs,
  onMarkAllAsRead,
  onTabChange,
}: NotificationHeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <h1 className={styles.pageTitle}>알림</h1>
        {unreadCount > 0 && (
          <button onClick={onMarkAllAsRead} className={styles.markAllReadBtn}>
            모두 읽음
          </button>
        )}
      </div>
      
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${currentTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>
    </header>
  )
}
