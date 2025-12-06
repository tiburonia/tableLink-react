
/**
 * 알림 데이터 접근 레포지토리
 */
export const notificationRepository = {
  /**
   * 사용자 알림 목록 조회
   */
  async fetchNotifications(userId, type = 'all') {
    try {
      const url = `/api/notifications?userId=${userId}${type !== 'all' ? `&type=${type}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`알림 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error('❌ 알림 데이터 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 개별 알림 읽음 처리
   */
  async markAsRead(notificationId, userId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`알림 읽음 처리 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ 알림 읽음 처리 실패:', error);
      throw error;
    }
  },

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId) {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`전체 알림 읽음 처리 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ 전체 알림 읽음 처리 실패:', error);
      throw error;
    }
  }
};
