
/**
 * SubMain Repository
 * 서브메인 데이터 조회 레이어
 */

export const subMainRepository = {
  /**
   * 즐겨찾기 매장 조회
   */
  async fetchFavorites(userId) {
    try {
      const response = await fetch(`/api/auth/users/favorites/${userId}`);
      if (!response.ok) throw new Error('즐겨찾기 조회 실패');
      const data = await response.json();
      return data.stores || [];
    } catch (error) {
      console.error('❌ 즐겨찾기 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 최근 방문 매장 조회
   */
  async fetchRecentStores(userId) {
    try {
      const response = await fetch(`/api/orders/users/${userId}?limit=5`);
      if (!response.ok) throw new Error('최근 방문 조회 실패');
      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error('❌ 최근 방문 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 주변 매장 조회
   */
  async fetchNearbyStores(params) {
    try {
      const { swLat, swLng, neLat, neLng, level } = params;
      const queryParams = new URLSearchParams({
        swLat: swLat || 37.5665,
        swLng: swLng || 126.9780,
        neLat: neLat || 37.5675,
        neLng: neLng || 126.9790,
        level: level || 5
      });
      
      const response = await fetch(`/api/stores/viewport?${queryParams}`);
      if (!response.ok) throw new Error('주변 매장 조회 실패');
      const data = await response.json();
      return data.stores || [];
    } catch (error) {
      console.error('❌ 주변 매장 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자 통계 조회
   */
  async fetchUserStats(userId) {
    try {
      const [ordersRes, reviewsRes, favoritesRes, pointsRes] = await Promise.allSettled([
        fetch(`/api/orders/users/${userId}?limit=1000`),
        fetch(`/api/reviews/users/${userId}`),
        fetch(`/api/auth/users/favorites/${userId}`),
        fetch(`/api/regular-levels/user/${userId}/all-points`)
      ]);

      const stats = {
        totalOrders: 0,
        totalReviews: 0,
        favorites: 0,
        totalPoints: 0
      };

      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const ordersData = await ordersRes.value.json();
        stats.totalOrders = ordersData.orders?.length || 0;
      }

      if (reviewsRes.status === 'fulfilled' && reviewsRes.value.ok) {
        const reviewsData = await reviewsRes.value.json();
        stats.totalReviews = reviewsData.total || 0;
      }

      if (favoritesRes.status === 'fulfilled' && favoritesRes.value.ok) {
        const favoritesData = await favoritesRes.value.json();
        stats.favorites = favoritesData.stores?.length || 0;
      }

      if (pointsRes.status === 'fulfilled' && pointsRes.value.ok) {
        const pointsData = await pointsRes.value.json();
        if (pointsData.success && pointsData.storePoints) {
          stats.totalPoints = pointsData.storePoints.reduce(
            (sum, store) => sum + (store.points || 0), 
            0
          );
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ 사용자 통계 조회 실패:', error);
      throw error;
    }
  }
};
