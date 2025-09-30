export const ROUTES = {
  HOME: '',
  MAP: '',
  SEARCH: 'search',
  LOGIN: 'login',
  SIGNUP: 'signup',
  CART: 'cart',
  STORE: 'store',
  ORDER: 'order',
  MYPAGE: 'mypage'
};

export const API_BASE_URL = '/api';

export const STORAGE_KEYS = {
  USER: 'tlg_user',
  TOKEN: 'tlg_token',
  STATE: 'tlg_state',
  CART: 'tlg_cart',
  LOCATION: 'tlg_location'
};

export const EVENTS = {
  SEARCH: 'tlg:search',
  LOGIN: 'tlg:login',
  LOGOUT: 'tlg:logout',
  CART_ADD: 'tlg:cart:add',
  CART_REMOVE: 'tlg:cart:remove',
  CART_UPDATE: 'tlg:cart:update',
  CART_CLEAR: 'tlg:cart:clear',
  CART_ORDER: 'tlg:cart:order',
  LOCATION_CHANGE: 'tlg:location:change'
};

export const MAP_CONFIG = {
  DEFAULT_LAT: 37.5665,
  DEFAULT_LNG: 126.9780,
  DEFAULT_LEVEL: 3
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const PAYMENT_METHOD = {
  CARD: 'CARD',
  CASH: 'CASH',
  TOSS: 'TOSS'
};
