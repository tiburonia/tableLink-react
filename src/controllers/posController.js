const orderService = require('../services/orderService');
const tableService = require('../services/tableService');
const storeService = require('../services/storeService');

/**
 * POS 컨트롤러 - HTTP 요청/응답 처리
 */
class POSController {
  /**
   * POS 전용 매장 정보 조회
   */
  async getPOSStoreInfo(req, res, next) {
    try {
      const { storeId } = req.params;
      const store = await storeService.getPOSStoreInfo(storeId);

      res.json({
        success: true,
        store: store
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

      console.log(`🔍 POS TLL 주문 조회: 매장 ${storeId}, 테이블 ${tableNumber}`);

      const result = await orderService.getTLLOrders(parseInt(storeId), parseInt(tableNumber));

      // TLL 주문을 사용자별로 그룹핑
      const tllOrdersRaw = result.tllOrders;
      const tllOrders = tllOrdersRaw.map(group => {
        const isGuest = !group.userId;
        return {
          customerType: isGuest ? 'guest' : 'member',
          userId: group.userId || null,
          userName: group.userName || null,
          guestId: group.guestId || null,
          guestName: group.guestName || null,
          orders: group.orders,
          orderId: group.orders[0]?.order_id
        };
      });

      res.json({
        success: true,
        tllOrders: tllOrders,
        groupCount: result.groupCount
      });
    } catch (error) {
      console.error('❌ POS TLL 주문 조회 실패:', error);
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

  /**
   * 매장의 모든 테이블과 진행 중인 주문 통합 조회 (테이블맵용)
   */
  async getStoreTablesWithOrders(req, res, next) {
    try {
      const { storeId } = req.params;
      const tables = await tableService.getStoreTablesWithOrders(parseInt(storeId));

      res.json({
        success: true,
        tables,
        count: tables.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new POSController();