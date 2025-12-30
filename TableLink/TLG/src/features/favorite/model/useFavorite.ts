/**
 * Favorite Feature - 즐겨찾기 기능
 */

import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function useFavorite(storeId: number, initialState = false) {
  const [isFavorite, setIsFavorite] = useState(initialState)
  const [isLoading, setIsLoading] = useState(false)

  const toggleFavorite = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}/favorite`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to toggle favorite')

      const { isFavorite: newState } = await response.json()
      setIsFavorite(newState)

      return { success: true, isFavorite: newState }
    } catch (error) {
      console.error('Toggle favorite error:', error)
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isFavorite,
    isLoading,
    toggleFavorite,
  }
}
