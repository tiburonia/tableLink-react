/**
 * MyPage Service
 * 마이페이지 비즈니스 로직 - 데이터 가공 및 처리
 */

import type { MyPageData, RegularSummary } from '../types'

export const mypageService = {
  /**
   * 마이페이지 데이터 로드
   */
  async loadMypageData(userPk: number): Promise<MyPageData> {
    try {
      const response = await fetch(`/api/auth/users/${userPk}/mypage`)

      if (!response.ok) {
        throw new Error('마이페이지 데이터 조회 실패')
      }

      const result = await response.json()
      const data = result.data

      // 단골 등급 정보 가져오기
      const regularSummary = await this.getRegularSummary(userPk)

      return {
        userInfo: data.userInfo,
        orders: data.orders || [],
        reviews: data.reviews || [],
        regularSummary: regularSummary,
        stats: {
          totalOrders: data.orders?.length || 0,
          totalReviews: data.reviews?.length || 0,
        },
      }
    } catch (error) {
      console.error('❌ loadMypageData 실패:', error)
      throw error
    }
  },

  /**
   * 단골 등급 요약 정보 가져오기
   */
  async getRegularSummary(userPk: number): Promise<RegularSummary> {
    try {
      const response = await fetch(`/api/regular-levels/summary/${userPk}`)
      if (!response.ok) {
        throw new Error('단골 정보 조회 실패')
      }
      const data = await response.json()
      return (
        data.summary || {
          topLevelName: '신규고객',
          topLevel: 'BRONZE',
          totalPoints: 0,
          totalCoupons: 0,
        }
      )
    } catch (error) {
      console.error('❌ 단골 등급 정보 조회 실패:', error)
      return {
        topLevelName: '신규고객',
        topLevel: 'BRONZE',
        totalPoints: 0,
        totalCoupons: 0,
      }
    }
  },
}
