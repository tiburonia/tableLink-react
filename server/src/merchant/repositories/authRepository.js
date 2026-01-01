const pool = require('../../db/pool');

/**
 * TLM 인증 레포지토리 - members 테이블 접근
 */
class MerchantAuthRepository {
  /**
   * 이메일 존재 확인
   */
  async checkEmailExists(email) {
    const result = await pool.query(`
      SELECT id FROM members WHERE email = $1
    `, [email]);

    return result.rows.length > 0;
  }

  /**
   * 전화번호 존재 확인
   */
  async checkPhoneExists(phone) {
    const result = await pool.query(`
      SELECT id FROM members WHERE phone = $1
    `, [phone]);

    return result.rows.length > 0;
  }

  /**
   * 회원 생성 (bcrypt 해시 비밀번호 저장)
   */
  async createMember(memberData) {
    const result = await pool.query(`
      INSERT INTO members (
        email, password_hash, name, phone
      ) VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, phone, created_at
    `, [
      memberData.email,
      memberData.password_hash,
      memberData.name,
      memberData.phone
    ]);

    return result.rows[0];
  }

  /**
   * 이메일로 회원 조회 (로그인용)
   */
  async findByEmail(email) {
    const result = await pool.query(`
      SELECT 
        id, email, password_hash, name, phone,
        email_verified, phone_verified, last_login_at,
        created_at, updated_at
      FROM members 
      WHERE email = $1
    `, [email]);

    return result.rows[0] || null;
  }

  /**
   * ID로 회원 조회
   */
  async findById(id) {
    const result = await pool.query(`
      SELECT 
        id, email, name, phone,
        email_verified, phone_verified, last_login_at,
        created_at, updated_at
      FROM members 
      WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
  }

  /**
   * 마지막 로그인 시간 업데이트
   */
  async updateLastLogin(id) {
    const result = await pool.query(`
      UPDATE members 
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, name, last_login_at
    `, [id]);

    return result.rows[0];
  }
}

module.exports = new MerchantAuthRepository();
