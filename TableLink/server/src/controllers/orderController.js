
const orderService = require('../services/orderService');

/**
 * 주문 컨트롤러 - HTTP 요청/응답 처리
 */
class OrderController {
  /**
   * 매장별 일일 통계 조회
   */
  async getDailyStats(req, res, next) {
    try {
      const { storeId } = req.params;
      const { date = new Date().toISOString().split('T')[0] } = req.query;

      const stats = await orderService.getDailyStats(parseInt(storeId), date);

      res.json({
        success: true,
        stats,
        realTime: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 주문 상태 업데이트
   */
  async updateOrderStatus(req, res, next) {
    try {
      const { orderId, status, cookingStatus } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: '주문 ID가 필요합니다'
        });
      }

      const result = await orderService.updateOrderStatus(orderId, { status, cookingStatus });

      res.json({
        success: true,
        message: '주문 상태가 업데이트되었습니다',
        order: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 단일 주문 조회
   */
  async getOrderById(req, res, next) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrderById(parseInt(orderId));

      res.json({
        success: true,
        order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 주문 목록 조회
   */
  async getUserOrders(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0, status } = req.query;

      const orders = await orderService.getUserOrders(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        status
      });

      res.json({
        success: true,
        orders
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매장 주문 목록 조회
   */
  async getStoreOrders(req, res, next) {
    try {
      const { storeId } = req.params;
      const { limit = 50, offset = 0, status, cookingStatus, date } = req.query;

      const orders = await orderService.getStoreOrders(parseInt(storeId), {
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
        cookingStatus,
        date
      });

      res.json({
        success: true,
        orders
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 주문 삭제
   */
  async deleteOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      await orderService.deleteOrder(parseInt(orderId));

      res.json({
        success: true,
        message: '주문이 삭제되었습니다'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 주문 진행 상황 조회
   */
  async getOrderProgress(req, res, next) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrderProgress(parseInt(orderId));

      res.json({
        success: true,
        order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 현재 세션 정보 조회
   */
  async getCurrentSession(req, res, next) {
    try {
      const { storeId, tableNumber } = req.params;
      const session = await orderService.getCurrentSession(parseInt(storeId), parseInt(tableNumber));

      res.json({
        success: true,
        session
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 주문 세션 종료
   */
  async endSession(req, res, next) {
    try {
      const { orderId } = req.params;
      const result = await orderService.endSession(parseInt(orderId));

      res.json({
        success: true,
        message: '주문 세션이 종료되었습니다',
        orderId: parseInt(orderId),
        tableReleased: result.tableReleased
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * KDS 동기화
   */
  async syncKDS(req, res, next) {
    try {
      const { storeId } = req.params;
      const { lastSyncAt } = req.query;

      const changes = await orderService.syncKDS(parseInt(storeId), lastSyncAt);

      res.json({
        success: true,
        lastSyncAt: new Date().toISOString(),
        changes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 주문별 리뷰 상태 확인
   */
  async getReviewStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const hasReview = await orderService.getReviewStatus(parseInt(orderId));

      res.json({
        success: true,
        hasReview
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 비회원 POS 주문 생성
   */
  async createGuestPOSOrder(req, res, next) {
    try {
      const { storeId, tableNumber, orderItems, notes = '' } = req.body;

      if (!storeId || !tableNumber || !orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다'
        });
      }

      const result = await orderService.createGuestPOSOrder({
        storeId,
        tableNumber,
        orderItems,
        notes
      });

      res.json({
        success: true,
        order: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 일반 주문 생성
   */
  async createOrder(req, res, next) {
    try {
      const { storeId, tableNumber, items } = req.body;

      if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다'
        });
      }

      // 임시 주문 ID 생성 (실제로는 DB에 저장)
      const orderId = `ORD${Date.now()}`

      res.json({
        success: true,
        orderId,
        message: '주문이 접수되었습니다'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
