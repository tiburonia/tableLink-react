import { useState, useEffect } from 'react'
import { storeService } from '@/shared/api'
import type { Store } from '@/pages/Main/types'

export const useStoreData = (storeId: string | undefined) => {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const loadStoreData = async () => {
      if (!storeId) {
        setError('매장 ID가 없습니다.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const user = localStorage.getItem('user')
        const userPk = user ? JSON.parse(user).user_pk : 0
        
        const result = await storeService.getStoreById(storeId, userPk)

        console.log('🔍 API 응답:', result)

        if (result.success && result.store) {
          console.log('✅ 매장 데이터:', result.store)
          setStore(result.store)
          setIsFavorite(result.store.isFavorite || false)
        } else {
          console.error('❌ 매장 로딩 실패:', result.message)
          setError(result.message || '매장 정보를 불러올 수 없습니다.')
        }
      } catch (err) {
        console.error('매장 데이터 로딩 실패:', err)
        setError('매장 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadStoreData()
  }, [storeId])

  const toggleFavorite = async () => {
    if (!store) return

    try {
      const user = localStorage.getItem('user')
      if (!user) {
        alert('로그인이 필요합니다.')
        return
      }

      // const userPk = JSON.parse(user).user_pk
      
      // TODO: 실제 API 호출
      // const result = await storeService.toggleFavorite(store.id, userPk)
      
      // 임시로 상태만 변경
      setIsFavorite(!isFavorite)
      
      if (store) {
        setStore({
          ...store,
          favoriteCount: isFavorite 
            ? (store.favoriteCount || 0) - 1 
            : (store.favoriteCount || 0) + 1
        })
      }
    } catch (err) {
      console.error('즐겨찾기 토글 실패:', err)
      alert('즐겨찾기 처리 중 오류가 발생했습니다.')
    }
  }

  const refetch = async () => {
    if (!storeId) return
    
    setLoading(true)
    const user = localStorage.getItem('user')
    const userPk = user ? JSON.parse(user).user_pk : 0
    
    const result = await storeService.getStoreById(storeId, userPk)
    
    if (result.success && result.store) {
      setStore(result.store)
      setIsFavorite(result.store.isFavorite || false)
    }
    
    setLoading(false)
  }

  return {
    store,
    loading,
    error,
    isFavorite,
    toggleFavorite,
    refetch
  }
}
