import { cartService } from '../services/cartService.js';
import { renderCartItems } from '../views/CartView.js';

export function addToCart(menuId, quantity = 1) {
  try {
    cartService.addItem(menuId, quantity);
    const cart = cartService.getCart();
    const total = cartService.getTotal();
    return { cart, total };
  } catch (error) {
    console.error('Failed to add to cart:', error);
    throw error;
  }
}

export function removeFromCart(menuId) {
  try {
    cartService.removeItem(menuId);
    const cart = cartService.getCart();
    const total = cartService.getTotal();
    return { cart, total };
  } catch (error) {
    console.error('Failed to remove from cart:', error);
    throw error;
  }
}

export function updateCartQuantity(menuId, quantity) {
  try {
    cartService.updateQuantity(menuId, quantity);
    const cart = cartService.getCart();
    const total = cartService.getTotal();
    return { cart, total };
  } catch (error) {
    console.error('Failed to update cart quantity:', error);
    throw error;
  }
}

export function clearCart() {
  try {
    cartService.clear();
    return { cart: {}, total: 0 };
  } catch (error) {
    console.error('Failed to clear cart:', error);
    throw error;
  }
}

export async function loadCartWithDetails(storeId) {
  try {
    const items = await cartService.getCartWithDetails(storeId);
    renderCartItems(items);
    return items;
  } catch (error) {
    console.error('Failed to load cart details:', error);
    throw error;
  }
}

export function getCartSummary() {
  const cart = cartService.getCart();
  const total = cartService.getTotal();
  return { cart, total };
}
