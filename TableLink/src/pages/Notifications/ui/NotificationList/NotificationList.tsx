import { NotificationCard, type Notification } from '@/features/notification'
import styles from './NotificationList.module.css'

interface NotificationListProps {
  notifications: Notification[]
  onNotificationRead: (id: number) => void
}

export const NotificationList = ({
  notifications,
  onNotificationRead,
}: NotificationListProps) => {
  return (
    <div className={styles.content}>
      <div className={styles.list}>
        {notifications.map(notification => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onRead={() => onNotificationRead(notification.id)}
          />
        ))}
      </div>
    </div>
  )
}
