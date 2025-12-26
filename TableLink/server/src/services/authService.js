
const userRepository = require('../repositories/userRepository');
const authRepository = require('../repositories/authRepository');
const { generateTokenPair } = require('../utils/jwtUtils');

/**
 * 인증 서비스 - 회원가입/로그인 비즈니스 로직
 */
class AuthService {
  /**
   * 아이디 중복 확인
   */
  async checkIdAvailability(userId) {
    const exists = await authRepository.checkUserIdExists(userId);
    return !exists;
  }

  /**
   * 전화번호 중복 확인
   */
  async checkPhoneAvailability(phone) {
    const exists = await authRepository.checkPhoneExists(phone);
    return !exists;
  }

  /**
   * 전화번호 존재 확인
   */
  async checkPhoneExists(phone) {
    return await authRepository.checkPhoneExists(phone);
  }

  /**
   * 회원가입
   */
  async signup(signupData) {
    const { id, pw, name, phone } = signupData;

    // 유효성 검사
    if (!id || !pw) {
      throw new Error('아이디와 비밀번호는 필수입니다');
    }

    if (!/^[a-zA-Z0-9]{3,20}$/.test(id)) {
      throw new Error('아이디는 3-20자의 영문과 숫자만 사용 가능합니다');
    }

    if (pw.length < 4) {
      throw new Error('비밀번호는 최소 4자 이상이어야 합니다');
    }

    if (phone && !/^010-\d{4}-\d{4}$/.test(phone)) {
      throw new Error('전화번호 형식이 올바르지 않습니다');
    }

    const newUser = await authRepository.createUser({
      user_id: id.trim(),
      user_pw: pw.trim(),
      name: name ? name.trim() : null,
      phone: phone ? phone.trim() : null
    });

    console.log(`✅ 새 사용자 가입: ${newUser.user_id} (${newUser.name || '익명'})`);

    return {
      id: newUser.user_id,
      userId: newUser.id,
      name: newUser.name,
      phone: newUser.phone
    };
  }

  /**
   * 로그인
   */
  async login(userId, password) {
    if (!userId || !password) {
      throw new Error('아이디와 비밀번호를 입력해주세요');
    }

    const user = await authRepository.getUserByUserId(userId);

    if (!user) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다');
    }

    if (user.user_pw !== password) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다');
    }

    console.log(`✅ 로그인 성공: ${user.name} (${user.user_id})`);

    // JWT 토큰 쌍 생성
    const tokens = generateTokenPair(user);

    return {
      id: user.user_id,
      userId: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      birth: user.birth,
      gender: user.gender,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * 사용자 정보 조회 (쿠폰 포함)
   */
  async getUserWithCoupons(userId) {
    const user = await authRepository.getUserByUserId(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    const coupons = await userRepository.getUserCoupons(user.id);

    return {
      id: user.user_id,
      userId: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      address: user.address || '',
      birth: user.birth || '',
      gender: user.gender || '',
      coupons,
      couponStats: {
        total: coupons.unused.length + coupons.used.length,
        unused: coupons.unused.length,
        used: coupons.used.length
      }
    };
  }

  /**
   * 게스트 주문을 회원 주문으로 전환
   */
  async convertGuestOrdersToUser(userId, phone) {
    // 하이픈 제거
    const cleanPhone = phone.replace(/[-\s]/g, '');
    
    const convertedCount = await authRepository.convertGuestOrdersToUser(userId, cleanPhone);
    
    if (convertedCount > 0) {
      console.log(`✅ 게스트 주문 전환 완료: ${convertedCount}개 주문이 회원 ${userId}로 연결됨 (전화번호: ${cleanPhone})`);
    }

    return convertedCount;
  }

  /**
   * 전화번호로 게스트 주문 조회
   */
  async getGuestOrdersByPhone(cleanPhone) {
    const guestOrders = await authRepository.getGuestOrdersByPhone(cleanPhone);
    return guestOrders;
  }
}

module.exports = new AuthService();
