import { useMemo } from 'react'
import { NotificationCard, type Notification } from '@/features/notification'
import styles from './NotificationList.module.css'

interface NotificationListProps {
  notifications: Notification[]
  onNotificationRead: (id: number) => void
}

/**
 * 날짜를 한국어 형식으로 포맷 (예: "2025년 12월 26일")
 */
const formatDateLabel = (dateString: string): string => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // 날짜만 비교 (시간 제외)
  const isToday = date.toDateString() === today.toDateString()
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return '오늘'
  if (isYesterday) return '어제'

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 날짜 키 생성 (YYYY-MM-DD 형식)
 */
const getDateKey = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

/**
 * 알림을 날짜별로 그룹화 (최신순 정렬)
 */
const groupNotificationsByDate = (
  notifications: Notification[]
): { date: string; label: string; items: Notification[] }[] => {
  // 최신순 정렬
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // 날짜별 그룹화
  const grouped = sorted.reduce((acc, notification) => {
    const dateKey = getDateKey(notification.createdAt)
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(notification)
    return acc
  }, {} as Record<string, Notification[]>)

  // 날짜 키 기준 최신순 정렬 후 배열로 변환
  return Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .map(dateKey => ({
      date: dateKey,
      label: formatDateLabel(grouped[dateKey][0].createdAt),
      items: grouped[dateKey],
    }))
}

export const NotificationList = ({
  notifications,
  onNotificationRead,
}: NotificationListProps) => {
  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(notifications),
    [notifications]
  )

  return (
    <div className={styles.content}>
      {groupedNotifications.map(group => (
        <div key={group.date} className={styles.dateGroup}>
          <div className={styles.dateHeader}>
            <span className={styles.dateLabel}>{group.label}</span>
          </div>
          <div className={styles.list}>
            {group.items.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={() => onNotificationRead(notification.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
