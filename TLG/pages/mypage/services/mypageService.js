/**
 * MyPage Service
 * 마이페이지 비즈니스 로직 - 데이터 가공 및 처리
 */

import { mypageRepository } from '../repositories/mypageRepository.js';

export const mypageService = {
  /**
   * 마이페이지 데이터 로드
   */
  async loadMypageData(userPk) {
    try {
      const data = await mypageRepository.getUserMypageData(userPk);

      // 단골 등급 정보 가져오기
      const regularSummary = await this.getRegularSummary(userPk);

      return {
        userInfo: data.userInfo,
        orders: data.orders || [],
        reviews: data.reviews || [],
        regularSummary: regularSummary,
        stats: {
          totalOrders: data.orders?.length || 0,
          totalReviews: data.reviews?.length || 0
        }
      };
    } catch (error) {
      console.error('❌ loadMypageData 실패:', error);
      throw error;
    }
  },

  /**
   * 단골 등급 요약 정보 가져오기
   */
  async getRegularSummary(userPk) {
    try {
      const response = await fetch(`/api/regular-levels/summary/${userPk}`);
      if (!response.ok) {
        throw new Error('단골 정보 조회 실패');
      }
      const data = await response.json();
      return data.summary || {
        topLevelName: '신규고객',
        topLevel: 'BRONZE',
        totalPoints: 0,
        totalCoupons: 0
      };
    } catch (error) {
      console.error('❌ 단골 등급 정보 조회 실패:', error);
      return {
        topLevelName: '신규고객',
        topLevel: 'BRONZE',
        totalPoints: 0,
        totalCoupons: 0
      };
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