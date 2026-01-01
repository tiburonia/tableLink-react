const bcrypt = require('bcryptjs');
const authRepository = require('../repositories/authRepository');
const { generateTokenPair } = require('../../utils/jwtUtils');

/**
 * TLM 인증 서비스 - 회원가입/로그인 비즈니스 로직
 */
class MerchantAuthService {
  /**
   * 이메일 중복 확인
   */
  async checkEmailAvailability(email) {
    const exists = await authRepository.checkEmailExists(email);
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
   * 회원가입 (bcrypt 해싱 적용)
   */
  async signup(signupData) {
    const { email, password, name, phone } = signupData;

    // 유효성 검사
    if (!email || !password) {
      throw new Error('이메일과 비밀번호는 필수입니다');
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('올바른 이메일 형식이 아닙니다');
    }

    // 비밀번호 길이 검사
    if (password.length < 8) {
      throw new Error('비밀번호는 최소 8자 이상이어야 합니다');
    }

    // 이메일 중복 확인
    const emailExists = await authRepository.checkEmailExists(email);
    if (emailExists) {
      throw new Error('이미 사용 중인 이메일입니다');
    }

    // 전화번호 중복 확인 (전화번호가 제공된 경우)
    if (phone) {
      const phoneExists = await authRepository.checkPhoneExists(phone);
      if (phoneExists) {
        throw new Error('이미 사용 중인 전화번호입니다');
      }
    }

    // 비밀번호 해싱 (bcrypt 사용)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 회원 생성
    const member = await authRepository.createMember({
      email,
      password_hash: passwordHash,
      name: name || null,
      phone: phone || null
    });

    // 민감 정보 제외하고 반환
    return {
      id: member.id,
      email: member.email,
      name: member.name,
      phone: member.phone,
      created_at: member.created_at
    };
  }

  /**
   * 로그인 (bcrypt 검증)
   */
  async login(email, password) {
    // 유효성 검사
    if (!email || !password) {
      throw new Error('이메일과 비밀번호를 입력해주세요');
    }

    // 회원 조회
    const member = await authRepository.findByEmail(email);
    if (!member) {
      throw new Error('이메일 또는 비밀번호가 일치하지 않습니다');
    }

    // 비밀번호 검증 (bcrypt 사용)
    const isPasswordValid = await bcrypt.compare(password, member.password_hash);
    if (!isPasswordValid) {
      throw new Error('이메일 또는 비밀번호가 일치하지 않습니다');
    }

    // 마지막 로그인 시간 업데이트
    await authRepository.updateLastLogin(member.id);

    // JWT 토큰 생성
    const tokens = generateTokenPair({
      id: member.id,
      email: member.email,
      type: 'merchant' // TLM 유저임을 표시
    });

    // 민감 정보 제외하고 반환
    return {
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        phone: member.phone,
        email_verified: member.email_verified,
        phone_verified: member.phone_verified,
        last_login_at: member.last_login_at
      },
      tokens
    };
  }

  /**
   * ID로 회원 조회
   */
  async getMemberById(id) {
    const member = await authRepository.findById(id);
    if (!member) {
      throw new Error('회원을 찾을 수 없습니다');
    }
    return member;
  }
}

module.exports = new MerchantAuthService();
