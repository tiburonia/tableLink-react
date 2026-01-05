/**
 * Table Entity - API
 */

import { apiClient } from '@/shared/api'
import type { Table } from '../model'

interface TablesResponse {
  success: boolean
  tables: Table[]
  count: number
}

export const tableApi = {
  /**
   * 매장의 전체 테이블 및 주문 정보 조회 (테이블맵용)
   */
  getStoreTables: async (storeId: number): Promise<Table[]> => {
    const response = await apiClient.get<TablesResponse>(`/api/pos/store/${storeId}/tables`)
    return response.tables
  },

  /**
   * 특정 테이블 상태 조회
   */
  getTableStatus: async (storeId: number, tableNumber: number) => {
    return apiClient.get(`/api/pos/stores/${storeId}/table/${tableNumber}/status`)
  },
}
