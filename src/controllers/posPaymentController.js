
/**
 * POS 결제 컨트롤러
 * - POS 결제 관련 HTTP 요청/응답 처리
 * - paymentService로 비즈니스 로직 위임
 */

const paymentService = require('../services/paymentService');

class POSPaymentController {
  /**
   * POS 결제 처리 (회원/비회원 분기)
   */
  async processWithCustomer(req, res, next) {
    try {
      const {
        orderId,
        paymentMethod,
        amount,
        storeId,
        tableNumber,
        customerType,
        guestPhone,
        memberPhone,
        memberId
      } = req.body;

      console.log(`💳 POS 결제 컨트롤러: 회원/비회원 결제 요청`, {
        orderId,
        paymentMethod,
        amount,
        customerType
      });

      // 필수 값 검증
      if (!orderId || !paymentMethod || !amount || !customerType) {
        return res.status(400).json({
          success: false,
          error: '필수 정보가 누락되었습니다 (orderId, paymentMethod, amount, customerType 필요)'
        });
      }

      // 서비스 레이어로 위임
      const result = await paymentService.processPOSPaymentWithCustomer({
        orderId,
        paymentMethod,
        amount,
        storeId,
        tableNumber,
        customerType,
        guestPhone,
        memberPhone,
        memberId
      });

      res.json(result);

    } catch (error) {
      console.error('❌ POS 결제 컨트롤러 오류:', error);
      next(error);
    }
  }

  /**
   * 미지불 티켓 조회
   */
  async getUnpaidTickets(req, res, next) {
    try {
      const { orderId } = req.params;

      console.log(`🔍 미지불 티켓 조회: 주문 ${orderId}`);

      const result = await paymentService.getUnpaidTickets(parseInt(orderId));

      res.json({
        success: true,
        orderId: parseInt(orderId),
        ...result
      });

    } catch (error) {
      console.error('❌ 미지불 티켓 조회 실패:', error);
      next(error);
    }
  }

  /**
   * 주문 결제 상태 확인
   */
  async getPaymentStatus(req, res, next) {
    try {
      const { orderId } = req.params;

      console.log(`📊 결제 상태 확인: 주문 ${orderId}`);

      const result = await paymentService.getOrderPaymentStatus(parseInt(orderId));

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('❌ 결제 상태 확인 실패:', error);
      next(error);
    }
  }
}

module.exports = new POSPaymentController();
