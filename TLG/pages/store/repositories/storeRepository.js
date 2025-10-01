
// 매장 레포지토리 - 데이터 접근 계층
export const storeRepository = {
  /**
   * 매장 평점 정보 조회
   */
  async fetchStoreRating(storeId) {
    const response = await fetch(`/api/stores/${storeId}/rating`);
    
    if (!response.ok) {
      throw new Error(`매장 평점 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '매장 평점 조회 실패');
    }

    return {
      ratingAverage: data.ratingAverage || 0,
      reviewCount: data.reviewCount || 0
    };
  },

  /**
   * 프로모션 데이터 조회
   */
  async fetchPromotions(storeId) {
    const response = await fetch(`/api/stores/${storeId}/promotions`);
    
    if (!response.ok) {
      throw new Error(`프로모션 데이터 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '프로모션 데이터 조회 실패');
    }

    return data;
  },

  /**
   * 상위 사용자 데이터 조회
   */
  async fetchTopUsers(storeId) {
    const response = await fetch(`/api/stores/${storeId}/top-users`);
    
    if (!response.ok) {
      throw new Error(`상위 사용자 데이터 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '상위 사용자 데이터 조회 실패');
    }

    return data;
  },

  /**
   * 매장 상세 정보 조회
   */
  async fetchStoreDetail(storeId) {
    const response = await fetch(`/api/stores/${storeId}`);
    
    if (!response.ok) {
      throw new Error(`매장 상세 정보 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '매장 상세 정보 조회 실패');
    }

    return data.store;
  },

  /**
   * 매장 메뉴 데이터 조회
   */
  async fetchStoreMenu(storeId) {
    const response = await fetch(`/api/stores/${storeId}/menu`);
    
    if (!response.ok) {
      throw new Error(`매장 메뉴 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '매장 메뉴 조회 실패');
    }

    return data.menu || [];
  },

  /**
   * 매장 리뷰 데이터 조회
   */
  async fetchStoreReviews(storeId, limit = 10) {
    const response = await fetch(`/api/stores/${storeId}/reviews?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`매장 리뷰 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '매장 리뷰 조회 실패');
    }

    return data.reviews || [];
  }
};

// 전역 등록
window.storeRepository = storeRepository;
