
const bcrypt = require('bcryptjs');
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
   * 회원가입 (bcrypt 해싱 적용)
   */
  async signup(signupData) {
    // 새 필드명(user_id, user_pw) 또는 기존 필드명(id, pw) 모두 지원
    const userId = signupData.user_id || signupData.id;
    const userPw = signupData.user_pw || signupData.pw;
    const { name, phone } = signupData;

    // 유효성 검사
    if (!userId || !userPw) {
      throw new Error('아이디와 비밀번호는 필수입니다');
    }

    if (!/^[a-zA-Z0-9]{3,50}$/.test(userId)) {
      throw new Error('아이디는 3-50자의 영문과 숫자만 사용 가능합니다');
    }

    if (userPw.length < 4) {
      throw new Error('비밀번호는 최소 4자 이상이어야 합니다');
    }

    // name과 phone은 필수 (DB 스키마 NOT NULL)
    if (!name) {
      throw new Error('이름은 필수입니다');
    }

    if (!phone || !/^010-\d{4}-\d{4}$/.test(phone)) {
      throw new Error('전화번호 형식이 올바르지 않습니다 (010-0000-0000)');
    }

    // 아이디 중복 확인
    const userIdExists = await authRepository.checkUserIdExists(userId.trim());
    if (userIdExists) {
      throw new Error('이미 사용 중인 아이디입니다');
    }

    // 전화번호 중복 확인
    const phoneExists = await authRepository.checkPhoneExists(phone.trim());
    if (phoneExists) {
      throw new Error('이미 등록된 전화번호입니다');
    }

    // bcrypt로 비밀번호 해싱 (salt rounds: 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userPw, saltRounds);
    console.log(`🔐 비밀번호 해싱 완료 (salt rounds: ${saltRounds})`);

    const newUser = await authRepository.createUser({
      user_id: userId.trim(),
      user_pw: userPw.trim(),  // 호환성 유지 (기존 칼럼)
      password_hash: passwordHash,  // 해시된 비밀번호
      name: name.trim(),
      phone: phone.trim()
    });

    console.log(`✅ 새 사용자 가입: ${newUser.user_id} (${newUser.name})`);

    return {
      id: newUser.user_id,
      userId: newUser.id,
      name: newUser.name,
      phone: newUser.phone
    };
  }

  /**
   * 로그인 (bcrypt 비밀번호 검증)
   */
  async login(userId, password) {
    if (!userId || !password) {
      throw new Error('아이디와 비밀번호를 입력해주세요');
    }

    const user = await authRepository.getUserByUserId(userId);

    if (!user) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다');
    }

    // bcrypt 해시 비밀번호 검증 (password_hash 컬럼 우선 사용)
    let isPasswordValid = false;
    
    if (user.password_hash) {
      // 새로운 bcrypt 해시된 비밀번호로 검증
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // 기존 평문 비밀번호 검증 (레거시 호환)
      isPasswordValid = user.user_pw === password;
    }

    if (!isPasswordValid) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다');
    }

    console.log(`✅ 로그인 성공: ${user.name} (${user.user_id})`);

    // JWT 토큰 쌍 생성
    const tokens = generateTokenPair(user);

    return {
      user_id: user.user_id,
      uuid: user.uuid,
      user_pk: user.id,
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
