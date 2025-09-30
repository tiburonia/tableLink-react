import { get } from '../core/http.js';

export const storeRepo = {
  search: (q) => get(`/api/stores/search?query=${encodeURIComponent(q)}`),
  
  rating: (id) => get(`/api/stores/${id}/rating`),
  
  byViewport: ({ sw, ne }) => get(`/api/stores/within?sw=${sw}&ne=${ne}`),
  
  detail: (id) => get(`/api/stores/${id}`),
  
  menu: (id) => get(`/api/stores/${id}/menu`),
  
  reviews: (id, page = 1, limit = 10) => 
    get(`/api/stores/${id}/reviews?page=${page}&limit=${limit}`),
  
  nearby: (lat, lng, radius = 5000) => 
    get(`/api/stores/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
};
