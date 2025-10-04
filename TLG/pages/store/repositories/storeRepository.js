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

    return data.reviews || [];
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
   * 스토어 탭 데이터 API 호출 - 모든 탭 데이터를 한번에 가져오기
   */

  async fetchStoreTabData(storeId) {
    try {
      const response = await fetch(`/api/stores/${storeId}/tab-data`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tabData || {}
    } catch (error) {
      console.error(`❌ 매장 ${storeId} 탭 데이터 조회 실패:`, error);
      throw error;
    }
  },

  /**
   * 매장 메뉴 조회
   */
  async fetchStoreMenu(storeId) {
    try {
      const response = await fetch(`/api/stores/${storeId}/menu`);

      if (!response.ok) {
        console.warn('⚠️ 메뉴 조회 실패, 매장 데이터에서 추출');
        // 폴백: 매장 정보에서 메뉴 추출
        const storeData = await this.fetchStoreById(storeId);
        return storeData.menu || [];
      }

      const data = await response.json();
      return data.menu || data.data || [];
    } catch (error) {
      console.error('❌ 메뉴 조회 오류:', error);
      return [];
    }
  },

  /**
   * 매장 리뷰 조회
   */
  async fetchStoreReviews(storeId) {
    try {
      const response = await fetch(`/api/reviews/stores/${storeId}`);

      if (!response.ok) {
        throw new Error('리뷰 조회 실패');
      }

      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('❌ 리뷰 조회 오류:', error);
      return [];
    }
  },

  /**
   * 매장 프로모션 조회
   */
  async fetchStorePromotions(storeId) {
    try {
      const response = await fetch(`/api/stores/${storeId}/promotions`);

      if (!response.ok) {
        throw new Error('프로모션 조회 실패');
      }

      const data = await response.json();
      return data.promotions || [];
    } catch (error) {
      console.error('❌ 프로모션 조회 오류:', error);
      throw error;
    }
  }
};

// 전역 등록
window.storeRepository = storeRepository;