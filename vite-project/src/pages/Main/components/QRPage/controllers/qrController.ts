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
  private searchTimeout: NodeJS.Timeout | null = null

  /**
   * 매장 검색 처리
   */
  async handleSearch(query: string, onResults: (stores: Store[]) => void) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }

    if (query.length < 2) {
      onResults([])
      return
    }

    this.searchTimeout = setTimeout(async () => {
      const stores = await qrService.searchStores(query)
      onResults(stores)
    }, 300)
  }

  /**
   * 매장 선택 처리
   */
  async handleStoreSelect(storeId: string, onSuccess: (store: Store) => void) {
    try {
      const store = await qrService.getStoreInfo(storeId)
      if (store) {
        this.selectedStore = store
        onSuccess(store)
      }
    } catch (error) {
      console.error('❌ 매장 선택 실패:', error)
      throw error
    }
  }

  /**
   * 테이블 목록 가져오기
   */
  async getTables() {
    return await qrService.getTables()
  }

  /**
   * QR 코드 스캔 처리
   */
  async handleQRScan(qrData: string, onSuccess: (data: QRScanResult) => void) {
    try {
      const parsed = qrService.parseQRCode(qrData)
      if (parsed) {
        const store = await qrService.getStoreInfo(parsed.storeId)
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
