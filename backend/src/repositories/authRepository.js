
const pool = require('../db/pool');

/**
 * 인증 레포지토리 - 회원가입/로그인 데이터 접근
 */
class AuthRepository {
  /**
   * 아이디 존재 확인
   */
  async checkUserIdExists(userId) {
    const result = await pool.query(`
      SELECT user_id FROM users WHERE user_id = $1
    `, [userId]);

    return result.rows.length > 0;
  }

  /**
   * 전화번호 존재 확인
   */
  async checkPhoneExists(phone) {
    const result = await pool.query(`
      SELECT user_id FROM users WHERE phone = $1
    `, [phone]);

    return result.rows.length > 0;
  }

  /**
   * 사용자 생성
   */
  async createUser(userData) {
    const result = await pool.query(`
      INSERT INTO users (
        user_id, user_pw, name, phone, 
        email, address, birth, gender
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, name, phone
    `, [
      userData.user_id,
      userData.user_pw,
      userData.name,
      userData.phone,
      null, null, null, null
    ]);

    return result.rows[0];
  }

  /**
   * 사용자 조회 (user_id로)
   */
  async getUserByUserId(userId) {
    const result = await pool.query(`
      SELECT * FROM users WHERE user_id = $1
    `, [userId]);

    return result.rows[0];
  }
}

module.exports = new AuthRepository();
