
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
          error: '전화번호를 입력해주세요' 
        });
      }

      if (!/^010-\d{4}-\d{4}$/.test(phone)) {
        return res.status(400).json({ 
          success: false, 
          error: '올바른 전화번호 형식이 아닙니다' 
        });
      }

      const available = await authService.checkPhoneAvailability(phone.trim());

      res.json({
        success: true,
        available,
        message: available ? '사용 가능한 전화번호입니다' : '이미 등록된 전화번호입니다'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 회원가입
   */
  async signup(req, res, next) {
    try {
      // React 앱 필드명 + 레거시 필드명 모두 지원
      const userId = req.body.id || req.body.userId;
      const password = req.body.pw || req.body.userPassword;
      const userName = req.body.name || req.body.userName;
      const userPhone = req.body.phone || req.body.userPhone;

      const newUser = await authService.signup({ 
        id: userId, 
        pw: password, 
        name: userName, 
        phone: userPhone 
      });

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
      // React 앱 필드명(userId, userPassword) + 레거시 필드명(id, pw) 모두 지원
      const userId = req.body.id || req.body.userId;
      const password = req.body.pw || req.body.userPassword;

      const user = await authService.login(userId, password);

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
}

module.exports = new AuthController();
