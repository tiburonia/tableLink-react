/**
 * QR Controller - UI와 Service 연결
 */

import { qrService } from '../services/qrService'

interface Store {
  id: string
  name: string
  category?: string
  address?: string
}

interface QRScanResult {
  store: Store
  tableNumber?: number
}

export class QRController {
  private selectedStore: Store | null = null

  /**
   * 매장 검색 처리
   */
  async handleSearch(query: string, onResults: (stores: Store[]) => void) {
    try {
      const stores = await qrService.searchStores(query, 20)
      onResults(stores)
    } catch (error) {
      console.error('❌ 매장 검색 실패:', error)
      onResults([])
    }
  }

  /**
   * 매장 선택 처리
   */
  async handleStoreSelect(storeId: string) {
    try {
      const data = await qrService.getTables(storeId)
      this.selectedStore = data.store || null
      return data.tables || []
    } catch (error) {
      console.error('❌ 매장 선택 실패:', error)
      throw error
    }
  }

  /**
   * QR 코드 스캔 처리
   */
  async handleQRScan(qrData: string, onSuccess: (data: QRScanResult) => void) {
    try {
      const parsed = qrService.parseQRCode(qrData)
      if (parsed) {
        const store = await qrService.getStoreInfo(parsed.storeId, 0)
        if (store) {
          onSuccess({ store, tableNumber: parsed.tableNumber })
        }
      }
    } catch (error) {
      console.error('❌ QR 스캔 처리 실패:', error)
      throw error
    }
  }

  /**
   * 선택된 매장 정보
   */
  getSelectedStore() {
    return this.selectedStore
  }
}

export const qrController = new QRController()
