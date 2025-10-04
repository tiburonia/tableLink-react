// 매장 레포지토리 - 데이터 접근 계층
export const storeRepository = {
  /**
   * @deprecated - stores 객체 사용으로 인해 더 이상 사용되지 않음
   */
  async fetchStoreRating(storeId) {
    console.warn('⚠️ fetchStoreRating는 더 이상 사용되지 않습니다. stores 객체를 사용하세요.');
    const store = window.stores?.[storeId];
    return {
      ratingAverage: store?.ratingAverage || 0,
      reviewCount: store?.reviewCount || 0
    };
  },

  /**
   * @deprecated - stores 객체 사용으로 인해 더 이상 사용되지 않음
   */
  async fetchPromotions(storeId) {
    console.warn('⚠️ fetchPromotions는 더 이상 사용되지 않습니다. stores 객체를 사용하세요.');
    const store = window.stores?.[storeId];
    return { promotions: store?.promotions || [] };
  },

  /**
   * @deprecated - stores 객체 사용으로 인해 더 이상 사용되지 않음
   */
  async fetchTopUsers(storeId) {
    console.warn('⚠️ fetchTopUsers는 더 이상 사용되지 않습니다. stores 객체를 사용하세요.');
    const store = window.stores?.[storeId];
    return { users: store?.topUsers || [] };
  },

  /**
   * 매장 목록 조회 (지도용)
   */
  async fetchStoresInBounds(bounds) {
    try {
      const params = new URLSearchParams({
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
        minLng: bounds.minLng,
        maxLng: bounds.maxLng
      });

      const response = await fetch(`/api/stores/bounds?${params}`);
      if (!response.ok) {
        throw new Error('매장 목록 조회 실패');
      }

      const data = await response.json();
      return data.stores || [];
    } catch (error) {
      console.error('❌ 매장 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 매장 상세 데이터 조회 (userId 포함)
   */
  async fetchStoreById(storeId, userId = null) {
    try {
      let apiUrl = `/api/stores/${storeId}`;
      if (userId) {
        apiUrl += `?userId=${userId}`;
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.store) {
        throw new Error(data.error || '매장 정보를 불러올 수 없습니다');
      }

      return data.store;
    } catch (error) {
      console.error(`❌ 매장 ${storeId} 조회 실패:`, error);
      throw error;
    }
  },

  /**
   * 매장 메뉴 조회 (stores 객체 사용)
   * @deprecated - storeTabService에서 stores 객체 직접 사용
   */
  async fetchStoreMenu(storeId) {
    console.warn('⚠️ fetchStoreMenu는 더 이상 사용되지 않습니다. stores 객체를 사용하세요.');
    const store = window.stores?.[storeId];
    return store?.menu || [];
  },

  /**
   * 매장 리뷰 조회 (stores 객체 사용)
   * @deprecated - storeTabService에서 stores 객체 직접 사용
   */
  async fetchStoreReviews(storeId) {
    console.warn('⚠️ fetchStoreReviews는 더 이상 사용되지 않습니다. stores 객체를 사용하세요.');
    const store = window.stores?.[storeId];
    return store?.reviews || [];
  },

  /**
   * 매장 프로모션 조회 (stores 객체 사용)
   * @deprecated - storeTabService에서 stores 객체 직접 사용
   */
  async fetchStorePromotions(storeId) {
    console.warn('⚠️ fetchStorePromotions는 더 이상 사용되지 않습니다. stores 객체를 사용하세요.');
    const store = window.stores?.[storeId];
    return store?.promotions || [];
  },

  };

// 전역 등록
window.storeRepository = storeRepository;