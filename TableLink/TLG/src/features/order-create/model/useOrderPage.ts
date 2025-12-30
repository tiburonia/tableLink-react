/**
 * useOrderPage - 주문 페이지 상태 및 로직 관리
 * 
 * FSD 원칙: 유저 행동 "메뉴 선택/장바구니 관리/주문하기"의 상태와 로직을 관리
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderService, type MenuItem, type CartItem, type StoreInfo } from './orderService'
import { orderController } from './orderController'

interface UseOrderPageParams {
  storeId: string | undefined
  tableNumber: string | null
}

export function useOrderPage({ storeId, tableNumber }: UseOrderPageParams) {
  const navigate = useNavigate()
  
  // 상태
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [menuList, setMenuList] = useState<MenuItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)

  // 유저 정보
  const user = localStorage.getItem('user')
  const userPk = user ? JSON.parse(user).user_pk : null

  // 매장 및 메뉴 로드
  const loadData = useCallback(async () => {
    if (!storeId) return

    setLoading(true)
    const storeIdNum = parseInt(storeId)
    const result = await orderService.getStoreAndMenu(storeIdNum)
    
    setStore(result.store)
    setMenuList(result.menu)
    setLoading(false)
  }, [storeId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 카테고리 목록 (cook_station 기준)
  const categories = useMemo(() => 
    ['all', ...Array.from(new Set(menuList.map(m => m.cook_station).filter(Boolean)))] as string[],
    [menuList]
  )

  // 필터링된 메뉴
  const filteredMenu = useMemo(() => 
    selectedCategory === 'all'
      ? menuList
      : menuList.filter(m => m.cook_station === selectedCategory),
    [menuList, selectedCategory]
  )

  // 장바구니에 추가
  const addToCart = useCallback((menu: MenuItem) => {
    orderController.addToCart(menu, setCartItems)
  }, [])

  // 수량 변경
  const updateQuantity = useCallback((menuId: number, change: number) => {
    orderController.updateQuantity(menuId, change, setCartItems)
  }, [])

  // 카테고리 변경
  const changeCategory = useCallback((category: string) => {
    setSelectedCategory(category)
    orderController.setCategory(category)
  }, [])

  // 장바구니 토글
  const toggleCart = useCallback((show?: boolean) => {
    setShowCart(prev => show !== undefined ? show : !prev)
  }, [])

  // 주문하기
  const submitOrder = useCallback(async () => {
    if (!storeId || !tableNumber || !store) {
      alert('매장 또는 테이블 정보가 없습니다')
      return
    }

    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다')
      return
    }

    try {
      navigate('/pay', {
        state: {
          userPk: userPk,
          storeId: parseInt(storeId),
          storeName: store.name,
          tableNumber: parseInt(tableNumber),
          items: cartItems,
        },
      })
    } catch (error) {
      console.error('주문 처리 실패:', error)
      alert('주문 처리 중 오류가 발생했습니다')
    }
  }, [storeId, tableNumber, store, cartItems, userPk, navigate])

  // 총액 계산
  const totals = orderController.calculateTotal()

  return {
    // 데이터
    store,
    menuList,
    filteredMenu,
    cartItems,
    categories,
    selectedCategory,
    showCart,
    loading,
    tableNumber,
    totals,
    // 액션
    addToCart,
    updateQuantity,
    changeCategory,
    toggleCart,
    submitOrder,
    goBack: () => navigate(-1),
  }
}
