/**
 * POS Store - Zustand Store for FSD Architecture
 */

import { create } from 'zustand'
import type { ViewType, OrderTabType } from '../types'
import type { Table } from '../../entities/table'
import type { Category, MenuItem } from '../../entities/menu'
import type { Order, CartItem } from '../../entities/order'

// =================== Store State ===================

interface POSState {
  // 뷰 관리
  currentView: ViewType
  orderTab: OrderTabType
  
  // 테이블 관련
  tables: Table[]
  selectedTable: number | null
  
  // 메뉴 관련
  categories: Category[]
  menuItems: MenuItem[]
  selectedCategory: number | null
  
  // 주문 관련
  currentOrders: Order[]
  cart: CartItem[]
  
  // 로딩/에러
  isLoading: boolean
  error: string | null
  
  // WebSocket
  isConnected: boolean
}

interface POSActions {
  // 뷰
  setCurrentView: (view: ViewType) => void
  setOrderTab: (tab: OrderTabType) => void
  
  // 테이블
  setTables: (tables: Table[]) => void
  selectTable: (tableNumber: number | null) => void
  
  // 메뉴
  setCategories: (categories: Category[]) => void
  setMenuItems: (items: MenuItem[]) => void
  setSelectedCategory: (categoryId: number | null) => void
  
  // 주문
  setCurrentOrders: (orders: Order[]) => void
  addToCart: (item: CartItem) => void
  updateCartItemQuantity: (menuId: number, quantity: number) => void
  removeFromCart: (menuId: number) => void
  clearCart: () => void
  
  // 상태
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setConnected: (connected: boolean) => void
  
  // 리셋
  reset: () => void
}

const initialState: POSState = {
  currentView: 'table',
  orderTab: 'all',
  tables: [],
  selectedTable: null,
  categories: [],
  menuItems: [],
  selectedCategory: null,
  currentOrders: [],
  cart: [],
  isLoading: false,
  error: null,
  isConnected: false,
}

export const usePosStore = create<POSState & POSActions>((set) => ({
  ...initialState,

  // 뷰
  setCurrentView: (view) => set({ currentView: view }),
  setOrderTab: (tab) => set({ orderTab: tab }),

  // 테이블
  setTables: (tables) => set({ tables }),
  selectTable: (tableNumber) => set({ selectedTable: tableNumber }),

  // 메뉴
  setCategories: (categories) => set({ categories }),
  setMenuItems: (items) => set({ menuItems: items }),
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),

  // 주문
  setCurrentOrders: (orders) => set({ currentOrders: orders }),
  
  addToCart: (item) =>
    set((state) => {
      const existingIndex = state.cart.findIndex(
        (cartItem) => cartItem.menu_id === item.menu_id
      )
      if (existingIndex >= 0) {
        const newCart = [...state.cart]
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + item.quantity,
        }
        return { cart: newCart }
      }
      return { cart: [...state.cart, item] }
    }),

  updateCartItemQuantity: (menuId, quantity) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.menu_id === menuId ? { ...item, quantity } : item
      ),
    })),

  removeFromCart: (menuId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.menu_id !== menuId),
    })),

  clearCart: () => set({ cart: [] }),

  // 상태
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setConnected: (connected) => set({ isConnected: connected }),

  // 리셋
  reset: () => set(initialState),
}))
