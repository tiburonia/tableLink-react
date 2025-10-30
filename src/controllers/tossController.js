const paymentService = require('../services/paymentService');
const regularService = require('../services/regularService');
const { validatePaymentData } = require('../utils/validation');

/**
 * 토스페이먼츠 컨트롤러
 * HTTP 요청/응답 처리만 담당
 */
class TossController {
  /**
   * 결제 준비
   */
  async prepare(req, res) {
    try {
      const { storeId, tableNumber, userPK, orderData, amount } = req.body;

      if (!storeId || !tableNumber || !orderData || !amount) {
        return res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다'
        });
      }

      const result = await paymentService.prepareTossPayment({
        storeId: parseInt(storeId),
        tableNumber: parseInt(tableNumber),
        userPK: userPK ?  parseInt(userPK) : null,
        orderData,
        amount: parseInt(amount)
      });

      res.json({
        success: true,
        orderId: result.orderId,
        message: '결제 준비가 완료되었습니다'
      });

    } catch (error) {
      console.error('❌ 결제 준비 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 클라이언트 키 반환
   */
  async getClientKey(req, res) {
    try {
      const clientKey = process.env.TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

      console.log('🔑 토스페이먼츠 클라이언트 키 요청 처리');

      res.json({
        success: true,
        clientKey: clientKey
      });
    } catch (error) {
      console.error('❌ 토스페이먼츠 클라이언트 키 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: '클라이언트 키 조회 실패'
      });
    }
  }

  /**
   * 결제 승인
   */
  async confirm(req, res) {
    try {
      const { paymentKey, orderId, amount } = req.body;

      console.log('🔄 토스페이먼츠 결제 승인 요청 - 필수 파라미터:', { paymentKey, orderId, amount });

      if (!paymentKey || !orderId || !amount) {
        console.error('❌ 필수 파라미터 누락:', { paymentKey: !!paymentKey, orderId: !!orderId, amount: !!amount });
        return res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다'
        });
      }

      const result = await paymentService.confirmTossPayment({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      });

      // 4. 단골 처리 (결제 성공 시)
      if (result.success && result.order) {
        try {
          await regularService.handleRegularAfterPayment({
            storeId: result.order.store_id,
            userId: result.order.user_pk,
            orderAmount: amount,
          });
        } catch (regularError) {
          console.error('⚠️ 단골 처리 중 에러 (결제는 성공):', regularError);
        }
      }

      res.json(result);

    } catch (error) {
      console.error('❌ 토스페이먼츠 결제 승인 실패:', error);

      // 이미 처리된 결제인 경우 성공으로 처리
      if (error.message && error.message.includes('이미 처리된 결제')) {
        return res.json({
          success: true,
          message: '이미 처리된 결제입니다',
          alreadyProcessed: true
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 비회원 TLL 결제 준비
   */
  async prepareGuest(req, res) {
    try {
      const { storeId, tableNumber, guestName, guestPhone, orderData, amount } = req.body;

      if (!storeId || !tableNumber || !guestName || !guestPhone || !orderData || !amount) {
        return res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다 (storeId, tableNumber, guestName, guestPhone, orderData, amount 필요)'
        });
      }

      const result = await paymentService.prepareGuestTLLPayment({
        storeId: parseInt(storeId),
        tableNumber: parseInt(tableNumber),
        guestName,
        guestPhone,
        orderData,
        amount: parseInt(amount)
      });

      res.json({
        success: true,
        orderId: result.orderId,
        message: '비회원 TLL 결제 준비가 완료되었습니다'
      });

    } catch (error) {
      console.error('❌ 비회원 TLL 결제 준비 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 비회원 TLL 결제 승인
   */
  async confirmGuest(req, res) {
    try {
      const { paymentKey, orderId, amount } = req.body;

      console.log('🔄 비회원 TLL 결제 승인 요청:', { paymentKey, orderId, amount });

      if (!paymentKey || !orderId || !amount) {
        return res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다'
        });
      }

      const result = await paymentService.confirmGuestTLLPayment({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ 비회원 TLL 결제 승인 실패:', error);

      if (error.message && error.message.includes('이미 처리된 결제')) {
        return res.json({
          success: true,
          message: '이미 처리된 결제입니다',
          alreadyProcessed: true
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new TossController();