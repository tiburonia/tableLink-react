
/**
 * 공통 상수 정의
 */

// 주문 상태
export const ORDER_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
};

// 결제 상태
export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  REFUNDED: 'REFUNDED',
};

// 주문 아이템 상태
export const ITEM_STATUS = {
  PENDING: 'PENDING',
  COOKING: 'COOKING',
  READY: 'READY',
  SERVED: 'SERVED',
  CANCELLED: 'CANCELLED',
};

// 결제 수단
export const PAYMENT_METHOD = {
  CARD: 'CARD',
  CASH: 'CASH',
  TRANSFER: 'TRANSFER',
};

// 주문 소스
export const ORDER_SOURCE = {
  TLL: 'TLL',
  POS: 'POS',
  PHONE: 'PHONE',
  WALK_IN: 'WALK_IN',
};

// 조리 스테이션
export const COOK_STATION = {
  KITCHEN: 'KITCHEN',
  DRINK: 'DRINK',
  DESSERT: 'DESSERT',
  SIDE: 'SIDE',
};

// API 엔드포인트
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  STORES: '/api/stores',
  ORDERS: '/api/orders',
  PAYMENTS: '/api/payments',
  REVIEWS: '/api/reviews',
  USERS: '/api/users',
};
