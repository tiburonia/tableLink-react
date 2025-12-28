const storeService = require("../services/storeService");
const userService = require("../services/userService")

/**
 * 매장 컨트롤러 - HTTP 요청/응답 처리
 */
class StoreController {
  /**
   * 매장 기본 정보 조회 (userId 포함)
   */
  async getStoreInfo(req, res, next) {
    try {
      const { storeId } = req.params;
      const { userId } = req.query;

      // TODO: userId를 활용한 개인화된 매장 정보 조회 로직 구현 예정
      // 현재는 기본 매장 정보만 반환
      //userId없을경우 오류 발생.
      const store = await storeService.getStoreInfo(storeId, userId);
      const user = await userService.getUserStoreInfo(storeId, userId)

      res.json({
        success: true,
        store: store,
        user: user || null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 검색
   */
  async searchStores(req, res, next) {
    try {
      const { query, limit = 20 } = req.query;

      const result = await storeService.searchStores(query, limit);

      res.json({
        success: true,
        stores: result.stores,
        query: result.query,
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 메뉴 조회
   */
  async getStoreMenu(req, res, next) {
    try {
      const { storeId } = req.params;

      const result = await storeService.getStoreMenu(storeId);

      res.json({
        success: true,
        store: result.store,
        menu: result.menu,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 모든 매장 목록 조회 (지도용 - Legacy)
   */
  async getAllStores(req, res, next) {
    try {
      const stores = await storeService.getAllStores();

      res.json({
        success: true,
        stores: stores,
        count: stores.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 초기 로딩 (커서 기반 페이지네이션, id순)
   * GET /api/stores/initial?limit=20
   */
  async getInitialStores(req, res, next) {
    try {
      const { limit = 20 } = req.query;

      const result = await storeService.getInitialStores(parseInt(limit));

      res.json({
        success: true,
        items: result.items,
        nextCursor: result.nextCursor,
        hasNext: result.hasNext
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 추가 로딩 (커서 기반 페이지네이션, id순)
   * GET /api/stores/more?cursor=xxx&limit=20
   */
  async getMoreStores(req, res, next) {
    try {
      const { cursor, limit = 20 } = req.query;

      if (!cursor) {
        return res.status(400).json({
          success: false,
          error: '커서 정보가 필요합니다.'
        });
      }

      const result = await storeService.getMoreStores(cursor, parseInt(limit));

      res.json({
        success: true,
        items: result.items,
        nextCursor: result.nextCursor,
        hasNext: result.hasNext
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 카테고리 기준 추천
   * GET /api/stores/recommend/category?category=korean&limit=10
   */
  async getRecommendByCategory(req, res, next) {
    try {
      const { category, limit = 10 } = req.query;

      if (!category) {
        return res.status(400).json({
          success: false,
          error: '카테고리 정보가 필요합니다.'
        });
      }

      const result = await storeService.getRecommendByCategory(category, parseInt(limit));

      res.json({
        success: true,
        items: result.items,
        category: category,
        count: result.items.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 위치 기준 추천 (주변 매장)
   * GET /api/stores/recommend/nearby?lat=37.555&lng=126.970&radius=1000&limit=10
   */
  async getRecommendNearby(req, res, next) {
    try {
      const { lat, lng, radius = 1000, limit = 10 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: '위치 정보(lat, lng)가 필요합니다.'
        });
      }

      const result = await storeService.getRecommendNearby(
        parseFloat(lat),
        parseFloat(lng),
        parseInt(radius),
        parseInt(limit)
      );

      res.json({
        success: true,
        items: result.items,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        count: result.items.length
      });
    } catch (error) {
      next(error);
    }
  }

  
}

module.exports = new StoreController();
