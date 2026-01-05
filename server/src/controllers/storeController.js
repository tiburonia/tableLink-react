const storeService = require("../services/storeService");
const userService = require("../services/userService")

/**
 * 매장 컨트롤러 - HTTP 요청/응답 처리
 */
class StoreController {
  /**
   * 매장 기본 정보 조회 (userId 선택적)
   */
  async getStoreInfo(req, res, next) {
    try {
      const { storeId } = req.params;
      const { userId } = req.query;

      // userId가 없어도 매장 정보는 조회 가능
      const store = await storeService.getStoreInfo(storeId, userId || null);
      
      // userId가 있을 때만 user 정보 조회
      if (userId) {
        const user = await userService.getUserStoreInfo(storeId, userId);
        res.json({
          success: true,
          store: store,
          user: user || null,
        });
      } else {
        // userId 없으면 user 필드 제외
        res.json({
          success: true,
          store: store,
        });
      }
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
   * 오늘의 가게 추천 (요일 기반)
   * GET /api/stores/recommend/today?limit=5
   * 요일에 따라 t값 (월=1 ~ 일=7) 결정, id % t === 0 인 매장 랜덤 반환
   */
  async getRecommendToday(req, res, next) {
    try {
      const { limit = 5 } = req.query;

      const result = await storeService.getRecommendToday(parseInt(limit));

      res.json({
        success: true,
        dayOfWeek: result.dayOfWeek,
        t: result.t,
        items: result.items,
        count: result.items.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 카테고리별 추천 매장
   * GET /api/stores/recommend/category?category=korean&limit=6
   */
  async getRecommendByCategory(req, res, next) {
    try {
      const { category, limit = 6 } = req.query;

      if (!category) {
        return res.status(400).json({
          success: false,
          error: '카테고리가 필요합니다.'
        });
      }

      const result = await storeService.getRecommendByCategory(category, parseInt(limit));

      res.json({
        success: true,
        category,
        items: result.items,
        count: result.items.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 위치 기반 추천 매장
   * GET /api/stores/recommend/nearby?lat=37.5665&lng=126.9780&radius=1000&limit=6
   */
  async getRecommendNearby(req, res, next) {
    try {
      const { lat, lng, radius = 1000, limit = 6 } = req.query;

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
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: parseInt(radius),
        items: result.items,
        count: result.items.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 테이블 목록 조회
   */
  async getStoreTables(req, res, next) {
    try {
      const { storeId } = req.params;

      const tables = await storeService.getStoreTables(storeId);

      res.json({
        success: true,
        tables: tables,
        count: tables.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 단골 등급 조회
   */
  async getStorePromotions(req, res, next) {
    try {
      const { storeId } = req.params;

      const promotions = await storeService.getStorePromotions(storeId);

      res.json({
        success: true,
        promotions: promotions,
        count: promotions.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 사진 조회
   */
  async getStorePhotos(req, res, next) {
    try {
      const { storeId } = req.params;

      const photos = await storeService.getStorePhotos(storeId);

      res.json({
        success: true,
        photos: photos,
        count: photos.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 사진 업로드
   */
  async uploadStorePhoto(req, res, next) {
    try {
      const { storeId } = req.params;
      const { photo_url, description } = req.body;

      if (!photo_url) {
        return res.status(400).json({
          success: false,
          error: '사진 URL이 필요합니다.'
        });
      }

      const photo = await storeService.uploadStorePhoto(storeId, photo_url, description);

      res.json({
        success: true,
        photo: photo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 사진 삭제
   */
  async deleteStorePhoto(req, res, next) {
    try {
      const { storeId, photoId } = req.params;

      await storeService.deleteStorePhoto(storeId, photoId);

      res.json({
        success: true,
        message: '사진이 삭제되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoreController();
