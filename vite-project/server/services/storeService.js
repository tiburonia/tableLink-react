const storeRepository = require('../repositories/storeRepository');

const storeService = {
  getAllStores: async () => {
    return await storeRepository.findAll();
  },

  getStoreById: async (id) => {
    const store = await storeRepository.findById(id);
    if (!store) {
      throw { status: 404, message: '매장을 찾을 수 없습니다' };
    }
    return store;
  },

  getStoresByCategory: async (category) => {
    return await storeRepository.findByCategory(category);
  },

  getNearbyStores: async (latitude, longitude, radius = 5) => {
    if (!latitude || !longitude) {
      throw { status: 400, message: '위도, 경도는 필수입니다' };
    }
    return await storeRepository.findNearby(longitude, latitude, radius);
  },

  searchStores: async (query) => {
    if (!query) {
      throw { status: 400, message: '검색어는 필수입니다' };
    }
    return await storeRepository.search(query);
  },

  createStore: async (storeData) => {
    const { name, address, latitude, longitude } = storeData;
    if (!name || !address || latitude === undefined || longitude === undefined) {
      throw { status: 400, message: '필수 항목: name, address, latitude, longitude' };
    }
    return await storeRepository.create(storeData);
  },

  updateStore: async (id, updates) => {
    if (Object.keys(updates).length === 0) {
      throw { status: 400, message: '업데이트할 항목이 없습니다' };
    }
    const store = await storeRepository.update(id, updates);
    if (!store) {
      throw { status: 404, message: '매장을 찾을 수 없습니다' };
    }
    return store;
  },

  deleteStore: async (id) => {
    const result = await storeRepository.delete(id);
    if (!result) {
      throw { status: 404, message: '매장을 찾을 수 없습니다' };
    }
    return { success: true, id: result.id };
  },
};

module.exports = storeService;
