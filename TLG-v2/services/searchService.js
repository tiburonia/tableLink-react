import { storeRepo } from '../repositories/storeRepo.js';

export const searchService = {
  async combined(keyword, mapCenter) {
    const stores = await storeRepo.search(keyword);
    return {
      stores: stores?.stores ?? [],
      keyword
    };
  },
  
  async nearby(lat, lng, radius = 5000) {
    const data = await storeRepo.nearby(lat, lng, radius);
    return data?.stores ?? [];
  }
};
