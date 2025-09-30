import { get } from '../core/http.js';

export const regionRepo = {
  provinces: () => get('/api/stores/regions/provinces'),
  
  cities: (p) => get(`/api/stores/regions/cities?province=${encodeURIComponent(p)}`),
  
  districts: (p, c) => 
    get(`/api/stores/regions/districts?province=${encodeURIComponent(p)}&city=${encodeURIComponent(c)}`),
  
  eupmyeondongCenter: (p, c, d) => 
    get(`/api/stores/eupmyeondong-center?sido=${encodeURIComponent(p)}&sigungu=${encodeURIComponent(c)}&eupmyeondong=${encodeURIComponent(d)}`)
};
