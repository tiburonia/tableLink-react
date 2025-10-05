/**
 * Repository Layer: 순수 API 호출만 담당
 */

export const myAccountRepository = {
  /**
   * 사용자 기본 정보 조회
   */
  async getUserInfo(userId) {
    try {
      const response = await fetch('/api/users/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`사용자 정보 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('❌ getUserInfo 실패:', error);
      throw error;
    }
  },

  /**
   * 주문 내역 조회
   */
  async getOrders(userId, limit = 5) {
    try {
      const response = await fetch(`/api/orders/mypage/${userId}?limit=${limit}`);

      if (!response.ok) {
        console.warn('⚠️ 주문 내역 조회 실패');
        return [];
      }

      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error('❌ getOrders 실패:', error);
      return [];
    }
  },

  /**
   * 리뷰 내역 조회
   */
  async getReviews(userId) {
    try {
      const response = await fetch(`/api/reviews/users/${userId}`);

      if (!response.ok) {
        console.warn('⚠️ 리뷰 내역 조회 실패');
        return [];
      }

      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('❌ getReviews 실패:', error);
      return [];
    }
  }
};

export default myAccountRepository;