import type { Store } from '@/pages/Main/types'

const API_BASE = 'https://stunning-broccoli-7vwxrrpqr7vj29pj-5000.app.github.dev'

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export const storeService = {
  /**
   * 모든 매장 목록 조회
   */
  getAllStores: async (): Promise<{ success: boolean; stores: Store[]; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/stores/all`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await safeJson(res)
      if (!res.ok) {
        return { success: false, stores: [], message: data?.error || '매장 목록 조회 실패' }
      }
      return { success: true, stores: data.stores || [] }
    } catch (err) {
      console.error('storeService.getAllStores error', err)
      return { success: false, stores: [], message: '서버 연결 실패' }
    }
  },

  /**
   * 매장 검색
   */
  searchStores: async (query: string, limit = 20): Promise<{ success: boolean; stores: Store[]; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/stores/search?query=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await safeJson(res)
      if (!res.ok) {
        return { success: false, stores: [], message: data?.error || '매장 검색 실패' }
      }
      return { success: true, stores: data.stores || [] }
    } catch (err) {
      console.error('storeService.searchStores error', err)
      return { success: false, stores: [], message: '서버 연결 실패' }
    }
  },

  /**
   * 특정 매장 상세 정보 조회
   */
  getStoreById: async (id: string, userPk: number): Promise<{ success: boolean; store: Store | null; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/stores/${id}?userId=${userPk}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await safeJson(res)
      if (!res.ok) {
        return { success: false, store: null, message: data?.error || '매장 조회 실패' }
      }
      
      // 서버 응답 구조: { success: true, store: {...}, user: {...} }
      const storeData = data.store
      
      // 서버 필드명을 클라이언트 타입에 맞게 매핑
      const mappedStore: Store = {
        // 기본 정보
        id: String(storeData.id),
        name: storeData.name,
        is_open: storeData.is_open,
        store_tel_number: storeData.store_tel_number,
        rating_average: storeData.rating_average,
        review_count: storeData.review_count,
        
        // 위치 정보
        sido: storeData.sido,
        sigungu: storeData.sigungu,
        eupmyeondong: storeData.eupmyeondong,
        full_address: storeData.full_address,
        lng: storeData.lng,
        lat: storeData.lat,
        
        // 상세 데이터
        menu: storeData.menu,
        tables: storeData.tables,
        reviews: storeData.reviews,
        promotions: storeData.promotions,
        amenities: storeData.amenities,
        
        // 카운트 정보
        menuCount: storeData.menuCount,
        tableCount: storeData.tableCount,
        reviewCount: storeData.reviewCount,
        promotionCount: storeData.promotionCount,
        tableStatusSummary: storeData.tableStatusSummary,
        
        // 레거시 필드 (하위 호환성)
        phone: storeData.store_tel_number?.toString(),
        rating: storeData.rating_average,
        address: storeData.full_address,
        latitude: storeData.lat,
        longitude: storeData.lng,
        favoriteCount: 0,
        isFavorite: data.user?.isFavorite || false,
        region: {
          sido: storeData.sido,
          sigungu: storeData.sigungu,
          eupmyeondong: storeData.eupmyeondong
        }
      }
      
      console.log('📦 매장 데이터 매핑 완료:', mappedStore)
      
      return { success: true, store: mappedStore }
    } catch (err) {
      console.error('storeService.getStoreById error', err)
      return { success: false, store: null, message: '서버 연결 실패' }
    }
  },
}
