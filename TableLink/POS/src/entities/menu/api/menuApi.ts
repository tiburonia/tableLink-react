import { apiClient } from '@/shared/api'
import type { Category, MenuItem } from '../model'

export const menuApi = {
  getCategories: async (storeId: number): Promise<Category[]> => {
    return apiClient.get<Category[]>(`/stores/${storeId}/categories`)
  },

  getMenuItems: async (storeId: number): Promise<MenuItem[]> => {
    return apiClient.get<MenuItem[]>(`/stores/${storeId}/menus`)
  },

  getMenuItemsByCategory: async (
    storeId: number,
    categoryId: number
  ): Promise<MenuItem[]> => {
    return apiClient.get<MenuItem[]>(
      `/stores/${storeId}/categories/${categoryId}/menus`
    )
  },

  getMenuItem: async (menuId: number): Promise<MenuItem> => {
    return apiClient.get<MenuItem>(`/menus/${menuId}`)
  },

  updateMenuAvailability: async (
    menuId: number,
    isAvailable: boolean
  ): Promise<void> => {
    return apiClient.patch(`/menus/${menuId}/availability`, { isAvailable })
  },

  updateMenuSoldout: async (
    menuId: number,
    isSoldout: boolean
  ): Promise<void> => {
    return apiClient.patch(`/menus/${menuId}/soldout`, { isSoldout })
  },
}
