/**
 * Store Entity API
 * 매장 관련 API 호출 함수들
 */

import type { Store, StoreMenu, StorePromotion } from '../model'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const storeApi = {
  /**
   * 매장 목록 조회
   */
  async getStores(params?: { 
    category?: string
    search?: string
    latitude?: number
    longitude?: number
  }): Promise<Store[]> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString()
    const response = await fetch(`${API_BASE_URL}/stores${queryString ? `?${queryString}` : ''}`)
    if (!response.ok) throw new Error('Failed to fetch stores')
    return response.json()
  },

  /**
   * 매장 상세 정보 조회
   */
  async getStoreById(storeId: number): Promise<Store> {
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}`)
    if (!response.ok) throw new Error('Failed to fetch store')
    return response.json()
  },

  /**
   * 매장 메뉴 조회
   */
  async getStoreMenus(storeId: number): Promise<StoreMenu[]> {
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}/menus`)
    if (!response.ok) throw new Error('Failed to fetch menus')
    return response.json()
  },

  /**
   * 매장 프로모션 조회
   */
  async getStorePromotions(storeId: number): Promise<StorePromotion[]> {
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}/promotions`)
    if (!response.ok) throw new Error('Failed to fetch promotions')
    return response.json()
  },

  /**
   * 매장 즐겨찾기 토글
   */
  async toggleFavorite(storeId: number): Promise<{ isFavorite: boolean }> {
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}/favorite`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to toggle favorite')
    return response.json()
  },
}
