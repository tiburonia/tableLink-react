/**
 * Store Menu Types
 * FSD: features/store-menu/model
 */

export interface MenuItemData {
  id: number
  name: string
  price: number
  description: string
  cookStation?: string
  image?: string
}

export interface MenuCategory {
  id: number
  name: string
  items: MenuItemData[]
}
