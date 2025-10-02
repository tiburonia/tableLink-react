
/**
 * MyPage Repository
 * 마이페이지 데이터 계층 - API 호출 담당
 */

export const mypageRepository = {
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
   * 주문 내역 조회
   */
  async getOrders(userId, limit = 3) {
    try {
      const response = await fetch(`/api/orders/users/${userId}?limit=${limit}`);
      
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
        return { total: 0, reviews: [] };
      }

      const data = await response.json();
      return {
        total: data.total || 0,
        reviews: data.reviews || []
      };
    } catch (error) {
      console.error('❌ getReviews 실패:', error);
      return { total: 0, reviews: [] };
    }
  },

  /**
   * 즐겨찾기 매장 조회
   */
  async getFavoriteStores(userId) {
    try {
      const response = await fetch(`/api/auth/users/favorites/${userId}`);
      
      if (!response.ok) {
        console.warn('⚠️ 즐겨찾기 조회 실패');
        return [];
      }

      const data = await response.json();
      return data.stores || [];
    } catch (error) {
      console.error('❌ getFavoriteStores 실패:', error);
      return [];
    }
  },

  /**
   * 단골 레벨 조회
   */
  async getRegularLevels(userId) {
    try {
      const response = await fetch(`/api/regular-levels/user/${userId}?limit=3`);
      
      if (!response.ok) {
        console.warn('⚠️ 단골 레벨 조회 실패');
        return [];
      }

      const data = await response.json();
      return data.regularStores || [];
    } catch (error) {
      console.error('❌ getRegularLevels 실패:', error);
      return [];
    }
  },

  /**
   * 포인트 조회
   */
  async getStorePoints(userId) {
    try {
      const response = await fetch(`/api/regular-levels/user/${userId}/all-points`);
      
      if (!response.ok) {
        console.warn('⚠️ 포인트 조회 실패');
        return [];
      }

      const data = await response.json();
      return data.storePoints || [];
    } catch (error) {
      console.error('❌ getStorePoints 실패:', error);
      return [];
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
