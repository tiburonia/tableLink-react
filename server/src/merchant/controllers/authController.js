const authService = require('../services/authService');

/**
 * TLM 인증 컨트롤러 - HTTP 요청/응답 처리
 */
class MerchantAuthController {
  /**
   * 회원가입
   * POST /api/merchants/auth/signup
   */
  async signup(req, res, next) {
    try {
      const { email, password, name, phone } = req.body;

      // 입력값 검증
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: '이메일과 비밀번호는 필수입니다'
        });
      }

      // 회원가입 처리
      const member = await authService.signup({
        email,
        password,
        name,
        phone
      });

      res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다',
        data: member
      });
    } catch (error) {
      // 비즈니스 로직 에러 처리
      if (error.message.includes('이미 사용 중인') || 
          error.message.includes('형식') ||
          error.message.includes('최소')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * 로그인
   * POST /api/merchants/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 입력값 검증
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: '이메일과 비밀번호를 입력해주세요'
        });
      }

      // 로그인 처리
      const result = await authService.login(email, password);

      res.json({
        success: true,
        message: '로그인에 성공했습니다',
        data: {
          member: result.member,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken
        }
      });
    } catch (error) {
      // 비즈니스 로직 에러 처리
      if (error.message.includes('일치하지 않습니다') || 
          error.message.includes('입력해주세요')) {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * 이메일 중복 체크
   * POST /api/merchants/auth/check-email
   */
  async checkEmail(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: '이메일을 입력해주세요'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: '올바른 이메일 형식이 아닙니다'
        });
      }

      const available = await authService.checkEmailAvailability(email.trim());

      res.json({
        success: true,
        available,
        message: available ? '사용 가능한 이메일입니다' : '이미 사용 중인 이메일입니다'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 전화번호 중복 체크
   * POST /api/merchants/auth/check-phone
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

      const available = await authService.checkPhoneAvailability(phone.trim());

      res.json({
        success: true,
        available,
        message: available ? '사용 가능한 전화번호입니다' : '이미 사용 중인 전화번호입니다'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MerchantAuthController();
