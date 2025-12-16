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
      return { success: true, store: data }
    } catch (err) {
      console.error('storeService.getStoreById error', err)
      return { success: false, store: null, message: '서버 연결 실패' }
    }
  },
}
