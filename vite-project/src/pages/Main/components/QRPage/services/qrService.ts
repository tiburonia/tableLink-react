/**
 * QR Service - 비즈니스 로직
 */

import { storeService } from '@/shared/api'

interface Store {
  id: string
  name: string
  category?: string
  address?: string
  latitude?: number
  longitude?: number
}

export const qrService = {
  /**
   * 매장 검색
   */
  async searchStores(query: string): Promise<Store[]> {
    try {
      const result = await storeService.getAllStores()
      
      if (result.success && result.stores) {
        // 검색어로 필터링
        const filtered = result.stores.filter((store: Store) => 
          store.name?.toLowerCase().includes(query.toLowerCase())
        )
        return filtered
      }
      
      return []
    } catch (error) {
      console.error('❌ 매장 검색 실패:', error)
      return []
    }
  },

  /**
   * 매장 정보 조회
   */
  async getStoreInfo(storeId: string): Promise<Store | null> {
    try {
      const result = await storeService.getStoreById(storeId)
      
      if (result.success && result.store) {
        return result.store
      }
      
      return null
    } catch (error) {
      console.error('❌ 매장 정보 조회 실패:', error)
      return null
    }
  },

  /**
   * 테이블 정보 조회
   */
  async getTables() {
    try {
      // 실제 API가 있다면 여기서 호출
      // const result = await fetch(`/api/stores/${storeId}/tables`)
      
      // 임시로 기본 테이블 반환
      return Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        name: `${i + 1}번 테이블`,
        isOccupied: false
      }))
    } catch (error) {
      console.error('❌ 테이블 정보 조회 실패:', error)
      return []
    }
  },

  /**
   * QR 코드 파싱
   */
  parseQRCode(qrData: string): { storeId: string; tableNumber?: number } | null {
    try {
      // URL 형식: /p/{storeId}?table={tableNumber}
      const url = new URL(qrData, window.location.origin)
      const pathParts = url.pathname.split('/')
      const storeId = pathParts[2] // /p/{storeId}
      const tableNumber = url.searchParams.get('table')

      if (!storeId) return null

      return {
        storeId,
        tableNumber: tableNumber ? parseInt(tableNumber) : undefined
      }
    } catch (error) {
      console.error('❌ QR 코드 파싱 실패:', error)
      return null
    }
  }
}
