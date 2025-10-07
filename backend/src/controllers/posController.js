
const orderService = require('../services/orderService');
const tableService = require('../services/tableService');

/**
 * POS 컨트롤러 - HTTP 요청/응답 처리
 */
class POSController {
  /**
   * 매장 메뉴 조회
   */
  async getStoreMenu(req, res, next) {
    try {
      const { storeId } = req.params;
      const menu = await orderService.getStoreMenu(storeId);
      
      res.json({
        success: true,
        menu: menu
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 테이블별 POS 주문 아이템 조회
   */
  async getTableOrderItems(req, res, next) {
    try {
      const { storeId, tableNumber } = req.params;
      const result = await orderService.getTableOrderItems(parseInt(storeId), parseInt(tableNumber));
      
      res.json({
        success: true,
        orderItems: result.orderItems,
        count: result.count
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 테이블별 TLL 주문 조회
   */
  async getTLLOrders(req, res, next) {
    try {
      const { storeId, tableNumber } = req.params;
      const result = await orderService.getTLLOrders(parseInt(storeId), parseInt(tableNumber));
      
      res.json({
        success: true,
        tllOrders: result.tllOrders,
        userInfo: result.userInfo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POS 주문 생성
   */
  async createOrder(req, res, next) {
    try {
      const { storeId, tableNumber, items, totalAmount, orderType } = req.body;
      const result = await orderService.createPOSOrder({
        storeId,
        tableNumber,
        items,
        totalAmount,
        orderType
      });

      res.json({
        success: true,
        orderId: result.orderId,
        ticketId: result.ticketId,
        message: '주문이 성공적으로 생성되었습니다'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch 알고리즘 주문 수정
   */
  async modifyBatch(req, res, next) {
    try {
      const { storeId, tableNumber, modifications } = req.body;
      const result = await orderService.modifyBatch({
        storeId,
        tableNumber,
        modifications
      });

      res.json({
        success: true,
        orderId: result.orderId,
        message: 'batch 알고리즘으로 주문 수정이 완료되었습니다',
        processed: result.processed
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * TLL 연동 활성화
   */
  async enableMixed(req, res, next) {
    try {
      const { orderId } = req.params;
      const result = await orderService.enableMixed(orderId);

      res.json({
        success: true,
        orderId: result.orderId,
        is_mixed: result.is_mixed,
        message: 'TLL 연동이 활성화되었습니다'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * TLL 주문 Mixed 상태 조회
   */
  async getMixedStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const result = await orderService.getMixedStatus(orderId);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 테이블 상태 조회
   */
  async getTableStatus(req, res, next) {
    try {
      const { storeId, tableNumber } = req.params;
      const result = await tableService.getTableStatus(parseInt(storeId), parseInt(tableNumber));

      res.json({
        success: true,
        table: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 활성 주문 조회
   */
  async getActiveOrders(req, res, next) {
    try {
      const { storeId } = req.params;
      const result = await orderService.getActiveOrders(parseInt(storeId));

      res.json({
        success: true,
        activeOrders: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 공유 주문 조회 (POI=SPOI)
   */
  async getSharedOrder(req, res, next) {
    try {
      const { storeId, tableId } = req.params;
      const result = await orderService.getSharedOrder(parseInt(storeId), parseInt(tableId));

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * TLL 연동 교차주문 아이템 조회
   */
  async getMixedOrderItems(req, res, next) {
    try {
      const { storeId, tableNumber } = req.params;
      const result = await orderService.getMixedOrderItems(parseInt(storeId), parseInt(tableNumber));

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 현재 테이블의 활성 주문 조회
   */
  async getActiveOrder(req, res, next) {
    try {
      const { storeId, tableNumber } = req.params;
      const result = await orderService.getActiveOrder(parseInt(storeId), parseInt(tableNumber));

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 세션 상태 확인
   */
  async getSessionStatus(req, res, next) {
    try {
      const { storeId, tableNumber } = req.params;
      const result = await orderService.getSessionStatus(parseInt(storeId), parseInt(tableNumber));

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new POSController();
