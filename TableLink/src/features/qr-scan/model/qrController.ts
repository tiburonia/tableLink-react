/**
 * QR Controller - 컨트롤러 로직
 * 
 * FSD 원칙: 유저 행동과 서비스 로직을 연결
 */

import { qrService } from './qrService'

interface Store {
  id: string
  name: string
  category?: string
  address?: string
}

interface Table {
  id: number
  tableName: string
  isOccupied: boolean
  status: string
}

class QRController {
  /**
   * 매장 검색 핸들러
   */
  async handleSearch(
    query: string, 
    onResults: (stores: Store[]) => void
  ): Promise<void> {
    try {
      const stores = await qrService.searchStores(query)
      onResults(stores as Store[])
    } catch (error) {
      console.error('❌ 매장 검색 실패:', error)
      onResults([])
    }
  }

  /**
   * 매장 선택 핸들러
   */
  async handleStoreSelect(storeId: string): Promise<Table[]> {
    try {
      const result = await qrService.getTables(storeId)
      return result.tables as Table[]
    } catch (error) {
      console.error('❌ 테이블 조회 실패:', error)
      return []
    }
  }
}

export const qrController = new QRController()
