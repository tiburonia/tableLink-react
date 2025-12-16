
const tableService = require('../services/tableService');

/**
 * 테이블 컨트롤러 - HTTP 요청/응답 처리
 */
class TableController {
  /**
   * 매장별 테이블 조회
   */
  async getStoreTablesByStoreId(req, res, next) {
    try {
      const { storeId } = req.params;

      const result = await tableService.getStoreTablesInfo(storeId);

      res.json({
        success: true,
        tables: result.tables,
        store: result.store
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * TLL 연동 상태 확인
   */
  async checkTLLIntegrationStatus(req, res, next) {
    try {
      const { storeId, tableNumber } = req.params;

      const result = await tableService.checkTLLStatus(storeId, tableNumber);

      res.json({
        success: true,
        storeId: parseInt(storeId),
        tableNumber: parseInt(tableNumber),
        hasTLLIntegration: result.hasTLLIntegration,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 테이블 점유 처리
   */
  async occupyTable(req, res, next) {
    try {
      const { storeId, tableNumber, userId, guestPhone, duration } = req.body;

      const result = await tableService.occupyTable({
        storeId,
        tableNumber,
        userId,
        guestPhone,
        duration
      });

      res.json({
        success: true,
        message: `테이블 ${tableNumber}번이 점유되었습니다`,
        checkId: result.checkId,
        occupiedSince: result.occupiedSince
      });
    } catch (error) {
      if (error.message === '이미 사용중인 테이블입니다') {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * 테이블 해제 처리
   */
  async releaseTable(req, res, next) {
    try {
      const { storeId, tableNumber } = req.body;

      const result = await tableService.releaseTable(storeId, tableNumber);

      res.json({
        success: true,
        message: `테이블 ${tableNumber}번이 해제되었습니다`,
        checkId: result.checkId
      });
    } catch (error) {
      if (error.message === '점유중인 체크를 찾을 수 없습니다') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = new TableController();
