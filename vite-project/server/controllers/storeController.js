const storeService = require('../services/storeService');

const storeController = {
  getAll: async (req, res) => {
    try {
      const stores = await storeService.getAllStores();
      res.json(stores);
    } catch (error) {
      console.error('❌ 매장 조회 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '매장 조회 실패' });
    }
  },

  getById: async (req, res) => {
    try {
      const store = await storeService.getStoreById(req.params.id);
      res.json(store);
    } catch (error) {
      console.error('❌ 매장 조회 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '매장 조회 실패' });
    }
  },

  getByCategory: async (req, res) => {
    try {
      const stores = await storeService.getStoresByCategory(req.params.category);
      res.json(stores);
    } catch (error) {
      console.error('❌ 카테고리별 매장 조회 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '카테고리별 매장 조회 실패' });
    }
  },

  getNearby: async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.query;
      const stores = await storeService.getNearbyStores(latitude, longitude, radius);
      res.json(stores);
    } catch (error) {
      console.error('❌ 근처 매장 조회 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '근처 매장 조회 실패' });
    }
  },

  search: async (req, res) => {
    try {
      const stores = await storeService.searchStores(req.query.query);
      res.json(stores);
    } catch (error) {
      console.error('❌ 매장 검색 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '매장 검색 실패' });
    }
  },

  create: async (req, res) => {
    try {
      const store = await storeService.createStore(req.body);
      res.status(201).json(store);
    } catch (error) {
      console.error('❌ 매장 생성 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '매장 생성 실패' });
    }
  },

  update: async (req, res) => {
    try {
      const store = await storeService.updateStore(req.params.id, req.body);
      res.json(store);
    } catch (error) {
      console.error('❌ 매장 업데이트 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '매장 업데이트 실패' });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await storeService.deleteStore(req.params.id);
      res.json(result);
    } catch (error) {
      console.error('❌ 매장 삭제 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '매장 삭제 실패' });
    }
  },
};

module.exports = storeController;
