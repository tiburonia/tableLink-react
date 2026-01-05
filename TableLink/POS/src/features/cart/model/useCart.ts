import { useCallback } from 'react'
import { usePosStore } from '@/shared/stores'
import type { MenuItem } from '@/entities/menu'
import type { CartItem } from '@/entities/order'

export function useCart() {
  const cart = usePosStore((state) => state.cart)
  const addToCart = usePosStore((state) => state.addToCart)
  const updateCartItemQuantity = usePosStore((state) => state.updateCartItemQuantity)
  const removeFromCart = usePosStore((state) => state.removeFromCart)
  const clearCart = usePosStore((state) => state.clearCart)

  const handleAddItem = useCallback((item: MenuItem, quantity: number = 1) => {
    const cartItem: CartItem = {
      menu_id: item.menu_id,
      menu_name: item.menu_name,
      price: item.price,
      quantity,
    }
    addToCart(cartItem)
  }, []) // Zustand actions are stable

  const handleUpdateQuantity = useCallback((menuId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuId)
    } else {
      updateCartItemQuantity(menuId, quantity)
    }
  }, []) // Zustand actions are stable

  const handleRemoveItem = useCallback((menuId: number) => {
    removeFromCart(menuId)
  }, []) // Zustand actions are stable

  const handleClearCart = useCallback(() => {
    clearCart()
  }, []) // Zustand actions are stable

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const getCartItemCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const getCartItem = useCallback((menuId: number) => {
    return cart.find((item) => item.menu_id === menuId)
  }, [cart])

  return {
    cart,
    handleAddItem,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    getCartTotal,
    getCartItemCount,
    getCartItem,
  }
}
