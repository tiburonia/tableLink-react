import { appState } from '../state/appState.js';
import { storeRepo } from '../repositories/storeRepo.js';

export const cartService = {
  getCart() {
    const state = appState.get();
    return state.cart || {};
  },
  
  addItem(menuId, quantity = 1) {
    appState.addToCart(menuId, quantity);
  },
  
  removeItem(menuId) {
    appState.removeFromCart(menuId);
  },
  
  updateQuantity(menuId, quantity) {
    if (quantity <= 0) {
      this.removeItem(menuId);
      return;
    }
    const state = appState.get();
    const cart = { ...state.cart };
    cart[menuId] = quantity;
    appState.setCart(cart);
  },
  
  clear() {
    appState.clearCart();
  },
  
  getTotal() {
    const cart = this.getCart();
    return Object.keys(cart).reduce((sum, menuId) => {
      return sum + cart[menuId];
    }, 0);
  },
  
  async getCartWithDetails(storeId) {
    const cart = this.getCart();
    const menuData = await storeRepo.menu(storeId);
    const menus = menuData?.menus || [];
    
    return Object.keys(cart).map(menuId => {
      const menu = menus.find(m => m.id === parseInt(menuId));
      return {
        menuId: parseInt(menuId),
        quantity: cart[menuId],
        menu
      };
    }).filter(item => item.menu);
  }
};
