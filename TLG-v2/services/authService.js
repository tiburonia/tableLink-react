import { userRepo } from '../repositories/userRepo.js';
import { appState } from '../state/appState.js';
import { setItem, removeItem } from '../core/storage.js';

export const authService = {
  async login(email, password) {
    const result = await userRepo.login(email, password);
    if (result?.user) {
      appState.setUser(result.user);
      if (result.token) {
        setItem('tlg_token', result.token);
      }
    }
    return result;
  },
  
  async signup(userData) {
    const result = await userRepo.signup(userData);
    if (result?.user) {
      appState.setUser(result.user);
      if (result.token) {
        setItem('tlg_token', result.token);
      }
    }
    return result;
  },
  
  async logout() {
    try {
      await userRepo.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      appState.clearUser();
      removeItem('tlg_token');
      appState.clearCart();
    }
  },
  
  isAuthenticated() {
    const state = appState.get();
    return state.isAuthenticated;
  },
  
  getCurrentUser() {
    const state = appState.get();
    return state.user;
  },
  
  async fetchProfile() {
    const profile = await userRepo.profile();
    if (profile?.user) {
      appState.setUser(profile.user);
    }
    return profile;
  }
};
