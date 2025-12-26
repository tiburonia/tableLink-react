/**
 * 검색 API 클라이언트
 */

import type { SearchResponse } from '../model'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const searchApi = {
  /**
   * 매장 검색
   */
  async searchStores(query: string): Promise<SearchResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/stores/search?query=${encodeURIComponent(query)}`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ 매장 검색 API 호출 실패:', error)
      throw error
    }
  },
}
