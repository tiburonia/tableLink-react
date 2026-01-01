const authService = require('../services/authService');

/**
 * 인증 컨트롤러 - HTTP 요청/응답 처리
 */
class AuthController {
  /**
   * 아이디 중복 체크
   */
  async checkId(req, res, next) {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: '아이디를 입력해주세요'
        });
      }

      if (!/^[a-zA-Z0-9]{3,20}$/.test(id)) {
        return res.status(400).json({
          success: false,
          error: '아이디는 3-20자의 영문과 숫자만 사용 가능합니다'
        });
      }

      const available = await authService.checkIdAvailability(id.trim());

      res.json({
        success: true,
        available,
        message: available ? '사용 가능한 아이디입니다' : '이미 사용 중인 아이디입니다'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 전화번호 중복 체크
   */
  async checkPhone(req, res, next) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: '전화번호가 필요합니다'
        });
      }

      // 하이픈 제거
      const cleanPhone = phone.replace(/[-\s]/g, '');
      console.log(`📱 전화번호 정규화: ${phone} → ${cleanPhone}`);

      // 전화번호 형식 검증 (숫자만 11자리)
      if (!/^\d{11}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          error: '올바른 전화번호 형식이 아닙니다 (11자리 숫자)'
        });
      }

      const exists = await authService.checkPhoneExists(cleanPhone);
      console.log(`✅ 전화번호 중복 체크 결과: ${cleanPhone} - ${exists ? '사용중' : '사용가능'}`);

      res.json({
        success: true,
        exists,
        available: !exists,
        message: exists ? '이미 사용 중인 전화번호입니다' : '사용 가능한 전화번호입니다'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 회원가입 (bcrypt 해싱은 서비스 레이어에서 처리)
   */
  async signup(req, res, next) {
    try {
      // 새 필드명(user_id, user_pw) 또는 기존 필드명(id, pw) 모두 지원
      const user_id = req.body.user_id || req.body.id;
      const user_pw = req.body.user_pw || req.body.pw;
      const { name, phone } = req.body;

      const newUser = await authService.signup({ user_id, user_pw, name, phone });

      // 전화번호가 있는 경우 게스트 주문을 회원 주문으로 전환
      if (phone) {
        await authService.convertGuestOrdersToUser(newUser.userId, phone);
      }

      res.json({
        success: true,
        message: '회원가입이 완료되었습니다',
        user: newUser
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 로그인
   */
  async login(req, res, next) {
    try {
      const { id, password } = req.body;

      const user = await authService.login(id, password);

      res.json({
        success: true,
        message: '로그인 성공',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 정보 조회 (쿠폰 포함)
   */
  async getUserWithCoupons(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await authService.getUserWithCoupons(userId);

      res.json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 전화번호로 게스트 주문 조회
   */
  async checkGuestOrders(req, res, next) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: '전화번호가 필요합니다'
        });
      }

      const cleanPhone = phone.replace(/[-\s]/g, '');

      if (!/^\d{11}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          error: '올바른 전화번호 형식이 아닙니다'
        });
      }

      const guestOrders = await authService.getGuestOrdersByPhone(cleanPhone);

      res.json({
        success: true,
        hasOrders: guestOrders.length > 0,
        orderCount: guestOrders.length,
        orders: guestOrders
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();