import { apiClient } from '@/shared/api'
import type { Order, TableOrders, CartItem } from '../model'

export const orderApi = {
  getTableOrders: async (
    storeId: number,
    tableNumber: number
  ): Promise<TableOrders> => {
    return apiClient.get<TableOrders>(
      `/stores/${storeId}/tables/${tableNumber}/orders`
    )
  },

  getOrder: async (orderId: number): Promise<Order> => {
    return apiClient.get<Order>(`/orders/${orderId}`)
  },

  createOrder: async (
    storeId: number,
    tableNumber: number,
    items: CartItem[]
  ): Promise<Order> => {
    return apiClient.post<Order>(`/stores/${storeId}/orders`, {
      tableNumber,
      items,
      source: 'POS',
    })
  },

  addItemsToOrder: async (
    orderId: number,
    items: CartItem[]
  ): Promise<Order> => {
    return apiClient.post<Order>(`/orders/${orderId}/items`, { items })
  },

  updateOrderStatus: async (
    orderId: number,
    status: string
  ): Promise<Order> => {
    return apiClient.patch<Order>(`/orders/${orderId}/status`, { status })
  },

  cancelOrder: async (orderId: number, reason?: string): Promise<void> => {
    return apiClient.delete(`/orders/${orderId}`, { reason })
  },

  cancelOrderItem: async (
    orderId: number,
    orderItemId: number,
    reason?: string
  ): Promise<Order> => {
    return apiClient.delete<Order>(
      `/orders/${orderId}/items/${orderItemId}`,
      { reason }
    )
  },

  updateOrderItemQuantity: async (
    orderId: number,
    orderItemId: number,
    quantity: number
  ): Promise<Order> => {
    return apiClient.patch<Order>(
      `/orders/${orderId}/items/${orderItemId}`,
      { quantity }
    )
  },
}
