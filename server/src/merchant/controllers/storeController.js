const storeService = require('../services/storeService');

/**
 * TLM Store 컨트롤러 - HTTP 요청/응답 처리
 */
class MerchantStoreController {
  /**
   * 매장 등록
   * POST /api/merchants/stores
   */
  async createStore(req, res, next) {
    try {
      const { memberId } = req.body; // 로그인된 회원 ID
      const storeData = req.body;

      if (!memberId) {
        return res.status(400).json({
          success: false,
          error: '회원 정보가 필요합니다 (memberId)',
        });
      }

      if (!storeData.name) {
        return res.status(400).json({
          success: false,
          error: '매장명이 필요합니다',
        });
      }

      const result = await storeService.createStore(memberId, storeData);

      res.status(201).json({
        success: true,
        message: '매장이 성공적으로 등록되었습니다',
        data: result,
      });
    } catch (error) {
      console.error('매장 등록 에러:', error);
      next(error);
    }
  }

  /**
   * 메뉴 추가
   * POST /api/merchants/stores/:storeId/menu
   */
  async addMenuItem(req, res, next) {
    try {
      const { storeId } = req.params;
      const menuItem = req.body;

      if (!menuItem.name || !menuItem.price) {
        return res.status(400).json({
          success: false,
          error: '메뉴명과 가격이 필요합니다',
        });
      }

      const result = await storeService.addMenuItem(parseInt(storeId), menuItem);

      res.status(201).json({
        success: true,
        message: '메뉴가 추가되었습니다',
        data: result,
      });
    } catch (error) {
      console.error('메뉴 추가 에러:', error);
      next(error);
    }
  }

  /**
   * 메뉴 일괄 추가
   * POST /api/merchants/stores/:storeId/menu/bulk
   */
  async addMenuItems(req, res, next) {
    try {
      const { storeId } = req.params;
      const { menuItems } = req.body;

      if (!menuItems || !Array.isArray(menuItems) || menuItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: '메뉴 목록이 필요합니다',
        });
      }

      const results = await storeService.addMenuItems(parseInt(storeId), menuItems);

      res.status(201).json({
        success: true,
        message: `${results.length}개의 메뉴가 추가되었습니다`,
        data: results,
      });
    } catch (error) {
      console.error('메뉴 일괄 추가 에러:', error);
      next(error);
    }
  }

  /**
   * 내 매장 목록 조회
   * GET /api/merchants/stores?memberId=xxx
   */
  async getMyStores(req, res, next) {
    try {
      const { memberId } = req.query;

      if (!memberId) {
        return res.status(400).json({
          success: false,
          error: '회원 정보가 필요합니다 (memberId)',
        });
      }

      const stores = await storeService.getMyStores(memberId);

      res.json({
        success: true,
        stores: stores,
        count: stores.length,
      });
    } catch (error) {
      console.error('매장 목록 조회 에러:', error);
      next(error);
    }
  }

  /**
   * 매장 상세 조회
   * GET /api/merchants/stores/:storeId
   */
  async getStoreDetail(req, res, next) {
    try {
      const { storeId } = req.params;

      const store = await storeService.getStoreDetail(parseInt(storeId));

      res.json({
        success: true,
        store: store,
      });
    } catch (error) {
      console.error('매장 상세 조회 에러:', error);
      next(error);
    }
  }

  /**
   * 메뉴 목록 조회
   * GET /api/merchants/stores/:storeId/menu
   */
  async getMenuItems(req, res, next) {
    try {
      const { storeId } = req.params;

      const menus = await storeService.getMenuItems(parseInt(storeId));

      res.json({
        success: true,
        menus: menus,
        count: menus.length,
      });
    } catch (error) {
      console.error('메뉴 목록 조회 에러:', error);
      next(error);
    }
  }

  /**
   * 메뉴 수정
   * PUT /api/merchants/stores/:storeId/menu/:menuId
   */
  async updateMenuItem(req, res, next) {
    try {
      const { storeId, menuId } = req.params;
      const menuData = req.body;

      if (!menuData.name || menuData.price === undefined) {
        return res.status(400).json({
          success: false,
          error: '메뉴명과 가격이 필요합니다',
        });
      }

      const result = await storeService.updateMenuItem(
        parseInt(storeId),
        parseInt(menuId),
        menuData
      );

      res.json({
        success: true,
        message: '메뉴가 수정되었습니다',
        data: result,
      });
    } catch (error) {
      console.error('메뉴 수정 에러:', error);
      next(error);
    }
  }

  /**
   * 메뉴 삭제
   * DELETE /api/merchants/stores/:storeId/menu/:menuId
   */
  async deleteMenuItem(req, res, next) {
    try {
      const { storeId, menuId } = req.params;

      await storeService.deleteMenuItem(parseInt(storeId), parseInt(menuId));

      res.json({
        success: true,
        message: '메뉴가 삭제되었습니다',
      });
    } catch (error) {
      console.error('메뉴 삭제 에러:', error);
      next(error);
    }
  }

  // ========== 테이블 관리 API ==========

  /**
   * 테이블 목록 조회
   * GET /api/merchants/stores/:storeId/tables
   */
  async getTables(req, res, next) {
    try {
      const { storeId } = req.params;

      const tables = await storeService.getTables(parseInt(storeId));

      res.json({
        success: true,
        tables: tables,
        count: tables.length,
      });
    } catch (error) {
      console.error('테이블 목록 조회 에러:', error);
      next(error);
    }
  }

  /**
   * 테이블 추가
   * POST /api/merchants/stores/:storeId/tables
   */
  async addTable(req, res, next) {
    try {
      const { storeId } = req.params;
      const tableData = req.body;

      if (!tableData.table_name) {
        return res.status(400).json({
          success: false,
          error: '테이블명이 필요합니다',
        });
      }

      const result = await storeService.addTable(parseInt(storeId), tableData);

      res.status(201).json({
        success: true,
        message: '테이블이 추가되었습니다',
        data: result,
      });
    } catch (error) {
      console.error('테이블 추가 에러:', error);
      next(error);
    }
  }

  /**
   * 테이블 수정
   * PUT /api/merchants/stores/:storeId/tables/:tableId
   */
  async updateTable(req, res, next) {
    try {
      const { storeId, tableId } = req.params;
      const tableData = req.body;

      if (!tableData.table_name) {
        return res.status(400).json({
          success: false,
          error: '테이블명이 필요합니다',
        });
      }

      const result = await storeService.updateTable(
        parseInt(storeId),
        parseInt(tableId),
        tableData
      );

      res.json({
        success: true,
        message: '테이블이 수정되었습니다',
        data: result,
      });
    } catch (error) {
      console.error('테이블 수정 에러:', error);
      next(error);
    }
  }

  /**
   * 테이블 삭제
   * DELETE /api/merchants/stores/:storeId/tables/:tableId
   */
  async deleteTable(req, res, next) {
    try {
      const { storeId, tableId } = req.params;

      await storeService.deleteTable(parseInt(storeId), parseInt(tableId));

      res.json({
        success: true,
        message: '테이블이 삭제되었습니다',
      });
    } catch (error) {
      console.error('테이블 삭제 에러:', error);
      next(error);
    }
  }

  /**
   * 테이블 상태 변경
   * PATCH /api/merchants/stores/:storeId/tables/:tableId/status
   */
  async updateTableStatus(req, res, next) {
    try {
      const { storeId, tableId } = req.params;
      const { status } = req.body;

      if (!status || !['AVAILABLE', 'OCCUPIED', 'RESERVED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: '유효한 상태값이 필요합니다 (AVAILABLE, OCCUPIED, RESERVED)',
        });
      }

      const result = await storeService.updateTableStatus(
        parseInt(storeId),
        parseInt(tableId),
        status
      );

      res.json({
        success: true,
        message: `테이블 상태가 ${status}로 변경되었습니다`,
        data: result,
      });
    } catch (error) {
      console.error('테이블 상태 변경 에러:', error);
      next(error);
    }
  }
}

module.exports = new MerchantStoreController();
