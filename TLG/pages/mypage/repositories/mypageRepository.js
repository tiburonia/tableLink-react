/**
 * MyPage Repository
 * 마이페이지 데이터 계층 - API 호출 담당
 */

export const mypageRepository = {
  /**
   * 마이페이지 통합 데이터 조회
   * @param {number} userId - users.id (PK 값)
   */
  async getMypageData(userId) {
    try {
      const response = await fetch(`/api/auth/users/${userId}/mypage`);

      if (!response.ok) {
        throw new Error('마이페이지 데이터 조회 실패');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ getMypageData 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자 정보 조회
   */
  async getUserInfo(userId) {
    try {
      const response = await fetch('/api/auth/users/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('❌ getUserInfo 실패:', error);
      throw error;
    }
  },

  /**
   * 주문에 대한 리뷰 존재 여부 확인
   */
  async checkOrderHasReview(orderId) {
    try {
      const response = await fetch(`/api/reviews/order/${orderId}/exists`);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error('❌ checkOrderHasReview 실패:', error);
      return false;
    }
  }
};