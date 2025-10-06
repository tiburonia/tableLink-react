
/**
 * 알림 비즈니스 로직 서비스
 */
import { notificationRepository } from '../repositories/notificationRepository.js';

export const notificationService = {
  /**
   * 알림 목록 조회 및 가공
   */
  async getNotifications(userId, type = 'all') {
    try {
      const notifications = await notificationRepository.fetchNotifications(userId, type);

      return notifications.map(notification => ({
        ...notification,
        isRead: notification.isRead !== undefined ? notification.isRead : notification.is_read,
        createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(notification.created_at),
        metadata: typeof notification.metadata === 'string' 
          ? JSON.parse(notification.metadata) 
          : (notification.metadata || {}),
        enrichedData: notification.enrichedData || null
      }));
    } catch (error) {
      console.error('❌ 알림 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 알림 읽음 처리
   */
  async markNotificationAsRead(notificationId, userId) {
    try {
      await notificationRepository.markAsRead(notificationId, userId);
    } catch (error) {
      console.error('❌ 알림 읽음 처리 실패:', error);
      throw error;
    }
  },

  /**
   * 모든 알림 읽음 처리
   */
  async markAllNotificationsAsRead(userId) {
    try {
      await notificationRepository.markAllAsRead(userId);
    } catch (error) {
      console.error('❌ 전체 알림 읽음 처리 실패:', error);
      throw error;
    }
  },

  /**
   * 시간 포맷팅
   */
  formatTimeAgo(date) {
    const notificationDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now - notificationDate;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}분 전`;
    } else if (hours < 24) {
      return `${hours}시간 전`;
    } else {
      return `${days}일 전`;
    }
  },

  /**
   * 알림 타입별 아이콘
   */
  getNotificationIcon(type) {
    switch (type) {
      case 'order': return '🍽️';
      case 'payment': return '💳';
      case 'promotion': return '🎁';
      case 'system': return '⚙️';
      default: return '📢';
    }
  },

  /**
   * 알림 액션 정보 추출
   */
  getNotificationActionInfo(notification, metadata, enrichedData) {
    const actionInfo = {
      type: notification.type,
      orderId: enrichedData?.order?.id || metadata?.order_id,
      storeId: enrichedData?.store?.store_id || metadata?.store_id,
      storeName: enrichedData?.store?.name || metadata?.store_name,
      ticketId: enrichedData?.ticket?.ticket_id || metadata?.ticket_id,
      tableNumber: enrichedData?.order?.table_number || metadata?.table_number,
      amount: enrichedData?.order?.total_amount || enrichedData?.payment?.final_amount || metadata?.amount
    };

    return actionInfo;
  }
};
