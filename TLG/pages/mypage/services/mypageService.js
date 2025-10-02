/**
 * MyPage Service
 * 마이페이지 비즈니스 로직 - 데이터 가공 및 처리
 */

import { mypageRepository } from '../repositories/mypageRepository.js';

export const mypageService = {
  /**
   * 마이페이지 전체 데이터 로드 (통합 API 사용)
   * @param {number} userId - users.id (PK 값)
   */
  async loadMypageData(userId) {
    try {
      console.log('📖 마이페이지 통합 데이터 로드 시작 (PK):', userId);

      // 통합 API 한 번 호출로 모든 데이터 조회
      const data = await mypageRepository.getMypageData(userId);

      console.log('✅ 마이페이지 통합 데이터 로드 완료');

      return {
        userInfo: data.userInfo,
        orders: data.recentOrders,
        reviews: data.reviews.items,
        reviewTotal: data.reviews.total,
        favoriteStores: data.favoriteStores,
        regularLevels: data.regularLevels,
        storePoints: [], // 보유포인트는 보류
        stats: data.stats
      };
    } catch (error) {
      console.error('❌ loadMypageData 실패:', error);
      throw error;
    }
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