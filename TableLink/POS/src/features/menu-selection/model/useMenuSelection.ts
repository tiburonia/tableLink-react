import { useCallback, useState } from 'react'
import { usePosStore } from '@/shared/stores'
import { menuApi } from '@/entities/menu'
import type { Category } from '@/entities/menu'

export function useMenuSelection() {
  const categories = usePosStore((state) => state.categories)
  const menuItems = usePosStore((state) => state.menuItems)
  const selectedCategory = usePosStore((state) => state.selectedCategory)
  const setCategories = usePosStore((state) => state.setCategories)
  const setMenuItems = usePosStore((state) => state.setMenuItems)
  const setSelectedCategory = usePosStore((state) => state.setSelectedCategory)
  const setLoading = usePosStore((state) => state.setLoading)
  const setError = usePosStore((state) => state.setError)

  const [menuLoading, setMenuLoading] = useState(false)

  const fetchCategories = useCallback(async (storeId: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await menuApi.getCategories(storeId)
      setCategories(data)
      // 첫 번째 카테고리 자동 선택
      if (data.length > 0) {
        setSelectedCategory(data[0].category_id)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '카테고리를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, []) // Zustand actions are stable

  const fetchMenuItems = useCallback(async (storeId: number) => {
    setMenuLoading(true)
    try {
      const data = await menuApi.getMenuItems(storeId)
      setMenuItems(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : '메뉴를 불러오는데 실패했습니다.')
    } finally {
      setMenuLoading(false)
    }
  }, []) // Zustand actions are stable

  const handleCategorySelect = useCallback((categoryId: number) => {
    setSelectedCategory(categoryId)
  }, []) // Zustand actions are stable

  const getMenuItemsByCategory = useCallback((categoryId: number | null) => {
    if (!categoryId) return menuItems
    return menuItems.filter((item) => item.category_id === categoryId)
  }, [menuItems])

  const getAvailableMenuItems = useCallback((categoryId: number | null) => {
    const items = getMenuItemsByCategory(categoryId)
    return items.filter((item) => item.is_available && !item.is_soldout)
  }, [getMenuItemsByCategory])

  const getCategoryById = useCallback((categoryId: number): Category | undefined => {
    return categories.find((cat) => cat.category_id === categoryId)
  }, [categories])

  return {
    categories,
    menuItems,
    selectedCategory,
    menuLoading,
    fetchCategories,
    fetchMenuItems,
    handleCategorySelect,
    getMenuItemsByCategory,
    getAvailableMenuItems,
    getCategoryById,
  }
}
