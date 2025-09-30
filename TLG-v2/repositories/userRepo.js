import { get, post } from '../core/http.js';

export const userRepo = {
  login: (email, password) => post('/api/auth/login', { email, password }),
  
  signup: (userData) => post('/api/auth/signup', userData),
  
  logout: () => post('/api/auth/logout', {}),
  
  profile: () => get('/api/user/profile'),
  
  update: (userData) => post('/api/user/profile', userData),
  
  favorites: () => get('/api/user/favorites'),
  
  addFavorite: (storeId) => post('/api/user/favorites', { storeId }),
  
  removeFavorite: (storeId) => post('/api/user/favorites/remove', { storeId }),
  
  points: () => get('/api/user/points'),
  
  coupons: () => get('/api/user/coupons')
};
