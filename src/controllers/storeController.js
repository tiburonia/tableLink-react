
const storeService = require('../services/storeService');

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
      const store = await storeService.getStoreInfo(storeId);
      
      res.json({
        success: true,
        store: store,
        userId: userId || null
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
        count: result.count
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
        menu: result.menu
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 평점 정보 조회
   */
  async getStoreRating(req, res, next) {
    try {
      const { storeId } = req.params;
      
      const rating = await storeService.getStoreRating(storeId);
      
      res.json({
        success: true,
        ratingAverage: rating.ratingAverage,
        reviewCount: rating.reviewCount
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 프로모션 조회
   */
  async getStorePromotions(req, res, next) {
    try {
      const { storeId } = req.params;
      
      const promotions = await storeService.getStorePromotions(storeId);
      
      res.json({
        success: true,
        promotions: promotions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 상위 사용자 조회
   */
  async getStoreTopUsers(req, res, next) {
    try {
      const { storeId } = req.params;
      
      const users = await storeService.getStoreTopUsers(storeId);
      
      res.json({
        success: true,
        users: users
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoreController();
