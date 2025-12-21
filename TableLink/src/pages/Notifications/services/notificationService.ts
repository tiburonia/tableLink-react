/**
 * 알림 서비스
 */

export type NotificationType = 'order' | 'payment' | 'promotion' | 'system' | 'all';

export interface NotificationMetadata {
  order_id?: number;
  store_id?: number;
  store_name?: string;
  table_number?: string;
  ticket_id?: string;
  amount?: number;
}

export interface EnrichedData {
  order?: {
    id: number;
    table_number: string;
    total_amount: number;
  };
  store?: {
    store_id: number;
    name: string;
  };
  payment?: {
    final_amount: number;
  };
  ticket?: {
    ticket_id: string;
  };
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: NotificationMetadata;
  enrichedData?: EnrichedData;
}

export interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
}

/**
 * 알림 목록 조회
 */
export const getNotifications = async (
  userId: number,
  type: NotificationType = 'all'
): Promise<NotificationsResponse> => {
  try {
    const url = `/api/notifications?userId=${userId}${type !== 'all' ? `&type=${type}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('알림을 불러오는데 실패했습니다.');
    }

    const data = await response.json();
    
    // 서버 응답 데이터 정규화
    const processedNotifications = data.notifications.map((notification: unknown) => {
      const n = notification as Record<string, unknown>;
      return {
        ...(notification as object),
        isRead: n.isRead !== undefined ? n.isRead : n.is_read,
        createdAt: n.createdAt || n.created_at,
        metadata: typeof n.metadata === 'string'
          ? JSON.parse(n.metadata as string)
          : (n.metadata || {}),
        enrichedData: n.enrichedData || null
      } as Notification;
    });

    return {
      notifications: processedNotifications,
      totalCount: data.totalCount || processedNotifications.length,
      unreadCount: data.unreadCount || processedNotifications.filter((n: Notification) => !n.isRead).length
    };
  } catch (error) {
    console.error('알림 조회 오류:', error);
    return {
      notifications: [],
      totalCount: 0,
      unreadCount: 0
    };
  }
};

/**
 * 개별 알림 읽음 처리
 */
export const markAsRead = async (notificationId: number, userId: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('알림 읽음 처리 실패');
    }

    return true;
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    return false;
  }
};

/**
 * 모든 알림 읽음 처리
 */
export const markAllAsRead = async (userId: number): Promise<boolean> => {
  try {
    const response = await fetch('/api/notifications/mark-all-read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('모든 알림 읽음 처리 실패');
    }

    return true;
  } catch (error) {
    console.error('모든 알림 읽음 처리 오류:', error);
    return false;
  }
};

/**
 * 상대 시간 계산
 */
export const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
};

/**
 * 알림 타입별 아이콘
 */
export const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'order': return '🍽️';
    case 'payment': return '💳';
    case 'promotion': return '🎁';
    case 'system': return '⚙️';
    default: return '📢';
  }
};

/**
 * 알림 타입별 색상
 */
export const getNotificationColor = (type: string): string => {
  switch (type) {
    case 'order': return '#10b981';
    case 'payment': return '#3b82f6';
    case 'promotion': return '#f59e0b';
    case 'system': return '#6b7280';
    default: return '#8b5cf6';
  }
};
