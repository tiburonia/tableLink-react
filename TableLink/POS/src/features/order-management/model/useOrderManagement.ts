import { useCallback, useState } from 'react'
import { usePosStore } from '@/shared/stores'
import { orderApi } from '@/entities/order'
import type { CartItem, Order } from '@/entities/order'

export function useOrderManagement() {
  const currentOrders = usePosStore((state) => state.currentOrders)
  const cart = usePosStore((state) => state.cart)
  const setCurrentOrders = usePosStore((state) => state.setCurrentOrders)
  const clearCart = usePosStore((state) => state.clearCart)
  const setError = usePosStore((state) => state.setError)

  const [orderLoading, setOrderLoading] = useState(false)

  const fetchTableOrders = useCallback(async (storeId: number, tableNumber: number) => {
    setOrderLoading(true)
    try {
      const data = await orderApi.getTableOrders(storeId, tableNumber)
      setCurrentOrders(data.orders)
      return data
    } catch (error) {
      setError(error instanceof Error ? error.message : '주문 정보를 불러오는데 실패했습니다.')
      return null
    } finally {
      setOrderLoading(false)
    }
  }, []) // Zustand actions are stable

  const createOrder = useCallback(async (
    storeId: number,
    tableNumber: number,
    items: CartItem[]
  ): Promise<Order | null> => {
    if (items.length === 0) {
      setError('주문할 메뉴가 없습니다.')
      return null
    }

    setOrderLoading(true)
    try {
      const order = await orderApi.createOrder(storeId, tableNumber, items)
      clearCart()
      // 주문 후 테이블 주문 목록 갱신
      await fetchTableOrders(storeId, tableNumber)
      return order
    } catch (error) {
      setError(error instanceof Error ? error.message : '주문에 실패했습니다.')
      return null
    } finally {
      setOrderLoading(false)
    }
  }, [fetchTableOrders]) // fetchTableOrders is stable due to empty deps

  const updateOrderStatus = useCallback(async (
    orderId: number,
    status: string
  ): Promise<boolean> => {
    setOrderLoading(true)
    try {
      await orderApi.updateOrderStatus(orderId, status)
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : '주문 상태 변경에 실패했습니다.')
      return false
    } finally {
      setOrderLoading(false)
    }
  }, []) // Zustand actions are stable

  const cancelOrder = useCallback(async (
    orderId: number,
    reason?: string
  ): Promise<boolean> => {
    setOrderLoading(true)
    try {
      await orderApi.cancelOrder(orderId, reason)
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : '주문 취소에 실패했습니다.')
      return false
    } finally {
      setOrderLoading(false)
    }
  }, []) // Zustand actions are stable

  const getTotalAmount = useCallback(() => {
    return currentOrders.reduce((sum, order) => sum + order.total_amount, 0)
  }, [currentOrders])

  const getUnpaidAmount = useCallback(() => {
    return currentOrders.reduce(
      (sum, order) => sum + (order.total_amount - order.paid_amount),
      0
    )
  }, [currentOrders])

  const getPendingOrders = useCallback(() => {
    return currentOrders.filter((order) => order.status === 'pending')
  }, [currentOrders])

  return {
    currentOrders,
    cart,
    orderLoading,
    fetchTableOrders,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getTotalAmount,
    getUnpaidAmount,
    getPendingOrders,
  }
}
