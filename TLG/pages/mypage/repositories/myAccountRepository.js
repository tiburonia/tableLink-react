
/**
 * Repository Layer: API 호출 전담
 * 순수하게 데이터만 가져오고, 변환은 Service에서 처리
 */

export const myAccountRepository = {
  // 사용자 기본 정보 조회
  async fetchUserInfo(userId) {
    try {
      const response = await fetch('/api/users/info', {
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
      console.error('❌ fetchUserInfo 에러:', error);
      throw error;
    }
  },

  // 주문 내역 조회
  async fetchOrders(userId, limit = 5) {
    try {
      const response = await fetch(`/api/orders/mypage/${userId}?limit=${limit}`);
      
      if (!response.ok) {
        console.warn('⚠️ 주문 내역 조회 실패');
        return [];
      }

      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error('❌ fetchOrders 에러:', error);
      return [];
    }
  },

  // 리뷰 내역 조회
  async fetchReviews(userId) {
    try {
      const response = await fetch(`/api/reviews/users/${userId}`);
      
      if (!response.ok) {
        console.warn('⚠️ 리뷰 내역 조회 실패');
        return [];
      }

      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('❌ fetchReviews 에러:', error);
      return [];
    }
  },

  // 매장 정보 조회 (개별)
  async fetchStoreInfo(storeId) {
    try {
      const response = await fetch(`/api/stores/${storeId}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.store;
    } catch (error) {
      console.error('❌ fetchStoreInfo 에러:', storeId, error);
      return null;
    }
  },

  // 모든 계정 데이터 통합 조회
  async fetchAllAccountData(userId) {
    try {
      const [userInfo, orders, reviews] = await Promise.all([
        this.fetchUserInfo(userId),
        this.fetchOrders(userId, 5),
        this.fetchReviews(userId)
      ]);

      return {
        userInfo,
        orders,
        reviews
      };
    } catch (error) {
      console.error('❌ fetchAllAccountData 에러:', error);
      throw error;
    }
  }
};

export default myAccountRepository;
