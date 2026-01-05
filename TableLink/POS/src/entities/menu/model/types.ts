export interface Category {
  category_id: number
  category_name: string
  display_order: number
}

export interface MenuItem {
  menu_id: number
  category_id: number
  menu_name: string
  price: number
  description?: string
  image_url?: string
  is_available: boolean
  is_soldout: boolean
  display_order: number
  options?: MenuOption[]
}

export interface MenuOption {
  option_id: number
  menu_id: number
  option_name: string
  price: number
  is_required: boolean
}

export interface MenuWithCategory extends MenuItem {
  category_name: string
}
