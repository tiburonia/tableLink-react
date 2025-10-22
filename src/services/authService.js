
const userRepository = require('../repositories/userRepository');
const authRepository = require('../repositories/authRepository');

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

    return {
      id: user.user_id,
      userId: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      birth: user.birth,
      gender: user.gender
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
}

module.exports = new AuthService();
