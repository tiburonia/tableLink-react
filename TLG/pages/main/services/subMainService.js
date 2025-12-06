
/**
 * SubMain Service
 * 서브메인 비즈니스 로직 레이어
 */

import { subMainRepository } from '../repositories/subMainRepository.js';

export const subMainService = {
  /**
   * 즐겨찾기 및 최근 방문 매장 조회
   */
  async getFavoriteAndRecentStores(userId) {
    try {
      const [favorites, recentOrders] = await Promise.all([
        subMainRepository.fetchFavorites(userId),
        subMainRepository.fetchRecentStores(userId)
      ]);

      // 최근 방문을 매장 형태로 변환
      const recentStores = recentOrders.map(order => ({
        id: order.store_id,
        name: order.store_name || '매장명 없음',
        category: '기타',
        ratingAverage: '0.0',
        type: 'recent'
      }));

      // 즐겨찾기에 type 추가
      const favoriteStores = favorites.map(store => ({
        ...store,
        type: 'favorite'
      }));

      // 중복 제거
      const favoriteIds = new Set(favoriteStores.map(f => f.id));
      const uniqueRecent = recentStores.filter(store => !favoriteIds.has(store.id));

      return {
        favorites: favoriteStores,
        recent: uniqueRecent.slice(0, 3),
        combined: [...favoriteStores, ...uniqueRecent].slice(0, 6)
      };
    } catch (error) {
      console.error('❌ 즐겨찾기/최근방문 조회 실패:', error);
      return { favorites: [], recent: [], combined: [] };
    }
  },

  /**
   * 주변 매장 조회
   */
  async getNearbyStores(options = {}) {
    try {
      const { offset = 0, limit = 10 } = options;
      const stores = await subMainRepository.fetchNearbyStores(options);
      
      return {
        stores: stores || [],
        hasMore: (stores?.length || 0) >= limit
      };
    } catch (error) {
      console.error('❌ 주변 매장 조회 실패:', error);
      return { stores: [], hasMore: false };
    }
  },

  /**
   * 사용자 통계 조회
   */
  async getUserStatistics(userId) {
    try {
      return await subMainRepository.fetchUserStats(userId);
    } catch (error) {
      console.error('❌ 사용자 통계 조회 실패:', error);
      return {
        totalOrders: 0,
        totalReviews: 0,
        favorites: 0,
        totalPoints: 0
      };
    }
  },

  /**
   * 프로모션 데이터 조회 (임시)
   */
  async getPromotions() {
    try {
      // TODO: 실제 API 구현 시 교체
      return [
        {
          id: 1,
          title: '🎉 신규 회원 특별 혜택',
          description: '첫 주문 시 20% 할인 + 무료 배송',
          image: '/api/placeholder/300/120'
        }
      ];
    } catch (error) {
      console.error('❌ 프로모션 조회 실패:', error);
      return [];
    }
  }
};
