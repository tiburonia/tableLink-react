/**
 * Regular Service - 단골/즐겨찾기 API 서비스
 * 
 * FSD 원칙: features 레이어에서 유저 행동에 필요한 API 서비스 관리
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const regularService = {
  async getRegularStoresData() {
    try {
      // 로컬 스토리지에서 사용자 정보 가져오기
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        throw new Error('로그인이 필요합니다')
      }

      const user = JSON.parse(userStr)
      const userId = user.user_pk

      // API 호출 (임시로 목업 데이터 반환)
      // TODO: 실제 API 엔드포인트로 교체
      const response = await fetch(`${API_BASE_URL}/regular/${userId}`)
      
      if (!response.ok) {
        // API가 아직 없으므로 목업 데이터 반환
        return this.getMockData()
      }

      const data = await response.json()
      return {
        success: true,
        summary: data.summary,
        stores: data.stores,
        favoriteStores: data.favoriteStores,
        error: undefined,
      }
    } catch (error) {
      console.error('Regular data fetch error:', error)
      // 에러 발생 시 목업 데이터 반환
      return this.getMockData()
    }
  },

  getMockData() {
    return {
      success: true,
      error: undefined,
      summary: {
        totalPoints: 15420,
        totalCoupons: 8,
        unwrittenReviews: 3,
        totalStores: 12,
      },
      stores: [
        {
          storeId: 1,
          storeName: '맛있는 한식당',
          level: 'GOLD',
          points: 5420,
          visitCount: 23,
          lastVisit: '2일 전',
          category: '한식',
        },
        {
          storeId: 2,
          storeName: '행복한 카페',
          level: 'SILVER',
          points: 3200,
          visitCount: 15,
          lastVisit: '5일 전',
          category: '카페',
        },
        {
          storeId: 3,
          storeName: '신선한 일식',
          level: 'PLATINUM',
          points: 6800,
          visitCount: 31,
          lastVisit: '1일 전',
          category: '일식',
        },
      ],
      favoriteStores: [
        {
          storeId: 4,
          storeName: '즐겨찾는 레스토랑',
          category: '양식',
          rating: 4.8,
          distance: '350m',
        },
        {
          storeId: 5,
          storeName: '단골 카페',
          category: '카페',
          rating: 4.5,
          distance: '520m',
        },
      ],
    }
  },
}
