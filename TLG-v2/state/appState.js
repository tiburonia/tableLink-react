import { createStore } from './createStore.js';
import { getItem, setItem } from '../core/storage.js';

const store = createStore({
  user: null,
  location: null,
  cart: {},
  selectedStore: null,
  isAuthenticated: false
});

export const appState = {
  subscribe: store.subscribe,
  get: store.get,
  set: store.set,
  
  async hydrate() {
    const saved = getItem('tlg_state');
    if (saved) {
      store.set(saved);
    }
    
    const user = getItem('tlg_user');
    if (user) {
      store.set({ user, isAuthenticated: true });
    }
  },
  
  persist() {
    setItem('tlg_state', store.get());
  },
  
  setUser(user) {
    store.set({ user, isAuthenticated: !!user });
    if (user) {
      setItem('tlg_user', user);
    }
    this.persist();
  },
  
  clearUser() {
    store.set({ user: null, isAuthenticated: false });
    setItem('tlg_user', null);
    this.persist();
  },
  
  setLocation(location) {
    store.set({ location });
    this.persist();
  },
  
  setCart(cart) {
    store.set({ cart });
    this.persist();
  },
  
  addToCart(menuId, quantity = 1) {
    const state = store.get();
    const cart = { ...state.cart };
    cart[menuId] = (cart[menuId] || 0) + quantity;
    store.set({ cart });
    this.persist();
  },
  
  removeFromCart(menuId) {
    const state = store.get();
    const cart = { ...state.cart };
    delete cart[menuId];
    store.set({ cart });
    this.persist();
  },
  
  clearCart() {
    store.set({ cart: {} });
    this.persist();
  }
};
