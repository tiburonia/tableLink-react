/**
 * NotificationPage - 알림 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { useNotificationPage } from '@/features/notification';
import { BottomNavigation } from '@/widgets/Layout';
import {
  NotificationHeader,
  NotificationList,
  EmptyState,
  LoadingState,
  ErrorState,
} from './ui';
import styles from './NotificationPage.module.css';

export const NotificationPage = () => {
  // Hook에서 모든 상태와 로직을 가져옴
  const {
    currentTab,
    notifications,
    unreadCount,
    isLoading,
    error,
    tabs,
    handleTabChange,
    handleMarkAllAsRead,
    handleNotificationRead,
    refetch,
  } = useNotificationPage();

  if (isLoading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <NotificationHeader
          unreadCount={unreadCount}
          currentTab={currentTab}
          tabs={tabs}
          onMarkAllAsRead={handleMarkAllAsRead}
          onTabChange={handleTabChange}
        />

        <div className={styles.content}>
          {notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <NotificationList
              notifications={notifications}
              onNotificationRead={handleNotificationRead}
            />
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};
