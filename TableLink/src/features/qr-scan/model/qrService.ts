/**
 * QR Service - 비즈니스 로직
 * 
 * FSD 원칙: features 레이어에서 유저 행동에 필요한 서비스 로직 관리
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
  async searchStores(query: string, limit = 20): Promise<Store[]> {
    try {
      const result = await storeService.searchStores(query, limit)
      
      if (result.success && result.stores) {
        return result.stores
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
  async getStoreInfo(storeId: string, userPk: number): Promise<Store | null> {
    try {
      const result = await storeService.getStoreById(storeId, userPk)
      
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
  async getTables(storeId: string) {
    try {
      const response = await fetch(`/api/tables/stores/${storeId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        tables: data.tables || [],
        store: data.store || null
      }
    } catch (error) {
      console.error('❌ 테이블 정보 조회 실패:', error)
      return {
        tables: [],
        store: null
      }
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
