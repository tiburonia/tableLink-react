import { get, post } from '../core/http.js';

export const orderRepo = {
  list: () => get('/api/orders'),
  
  detail: (id) => get(`/api/orders/${id}`),
  
  create: (orderData) => post('/api/orders', orderData),
  
  cancel: (id) => post(`/api/orders/${id}/cancel`, {}),
  
  status: (id) => get(`/api/orders/${id}/status`),
  
  history: (page = 1, limit = 10) => 
    get(`/api/orders/history?page=${page}&limit=${limit}`),
  
  preparePayment: (storeId, items, totalAmount) => 
    post('/api/orders/prepare-payment', { storeId, items, totalAmount })
};
