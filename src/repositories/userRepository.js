
const pool = require('../db/pool');

/**
 * 유저 레포지토리 - 유저 정보 관련 데이터베이스 접근
 */
class UserRepository {

  /**
   * 유저 정보 조회 (pk값으로)
   */
    async getUserById(userId) {
      const result = await pool.query(`
        SELECT * FROM users WHERE id = $1
      `, [userId])

      return result.rows[0];
    }
  
}

module.export = new UserRepository()