
/**
 * MyPage Service
 * 마이페이지 비즈니스 로직 - 데이터 가공 및 처리
 */

import { mypageRepository } from '../repositories/mypageRepository.js';

export const mypageService = {
  /**
   * 마이페이지 전체 데이터 로드
   */
  async loadMypageData(userId) {
    try {
      console.log('📖 마이페이지 데이터 로드 시작:', userId);

      // 병렬로 모든 데이터 조회
      const [userInfo, orders, reviews, favoriteStores, regularLevels, storePoints] = await Promise.all([
        mypageRepository.getUserInfo(userId),
        mypageRepository.getOrders(userId, 3),
        mypageRepository.getReviews(userId),
        mypageRepository.getFavoriteStores(userId),
        mypageRepository.getRegularLevels(userId),
        mypageRepository.getStorePoints(userId)
      ]);

      // 통계 계산
      const stats = this.calculateStats(orders, reviews, favoriteStores);

      console.log('✅ 마이페이지 데이터 로드 완료');

      return {
        userInfo,
        orders,
        reviews: reviews.reviews,
        reviewTotal: reviews.total,
        favoriteStores,
        regularLevels,
        storePoints,
        stats
      };
    } catch (error) {
      console.error('❌ loadMypageData 실패:', error);
      throw error;
    }
  },

  /**
   * 통계 계산
   */
  calculateStats(orders, reviews, favoriteStores) {
    const totalOrders = orders.length;
    const totalReviews = reviews.total || 0;
    const favoriteCount = favoriteStores.length;

    return {
      totalOrders,
      totalReviews,
      favoriteCount
    };
  },

  /**
   * 주문 데이터에 리뷰 상태 추가
   */
  async enrichOrdersWithReviewStatus(orders) {
    try {
      const reviewStatuses = await Promise.all(
        orders.map(order => mypageRepository.checkOrderHasReview(order.id))
      );

      return orders.map((order, index) => ({
        ...order,
        hasReview: reviewStatuses[index]
      }));
    } catch (error) {
      console.error('❌ enrichOrdersWithReviewStatus 실패:', error);
      return orders;
    }
  },

  /**
   * VIP 등급 계산
   */
  calculateVipLevel(orderCount) {
    if (orderCount >= 50) return { level: 'DIAMOND', color: '#b9f2ff' };
    if (orderCount >= 30) return { level: 'PLATINUM', color: '#e5e4e2' };
    if (orderCount >= 15) return { level: 'GOLD', color: '#ffd700' };
    if (orderCount >= 5) return { level: 'SILVER', color: '#c0c0c0' };
    return { level: 'BRONZE', color: '#cd7f32' };
  }
};
