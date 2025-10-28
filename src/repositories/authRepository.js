
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

  /**
   * 게스트 주문을 회원 주문으로 전환
   */
  async convertGuestOrdersToUser(userId, cleanPhone) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. 해당 전화번호를 가진 게스트 찾기
      const guestResult = await client.query(`
        SELECT id FROM guests WHERE phone = $1
      `, [cleanPhone]);

      if (guestResult.rows.length === 0) {
        await client.query('COMMIT');
        console.log(`ℹ️ 전화번호 ${cleanPhone}에 해당하는 게스트가 없습니다`);
        return 0;
      }

      const guestId = guestResult.rows[0].id;

      // 2. 게스트 주문을 회원 주문으로 업데이트
      const updateResult = await client.query(`
        UPDATE orders
        SET user_id = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE guest_id = $2
        RETURNING id
      `, [userId, guestId]);

      await client.query('COMMIT');

      const convertedCount = updateResult.rows.length;
      console.log(`✅ ${convertedCount}개의 게스트 주문(guest_id: ${guestId})이 회원(user_id: ${userId})으로 전환되었습니다`);

      return convertedCount;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 게스트 주문 전환 실패:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 전화번호로 게스트 주문 조회
   */
  async getGuestOrdersByPhone(cleanPhone) {
    const result = await pool.query(`
      SELECT 
        o.id as order_id,
        o.created_at,
        o.total_price,
        s.name as store_name,
        s.id as store_id,
        COUNT(DISTINCT oi.id) as item_count,
        STRING_AGG(DISTINCT oi.menu_name, ', ') as menu_items
      FROM guests g
      INNER JOIN orders o ON o.guest_id = g.id
      LEFT JOIN stores s ON s.id = o.store_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE g.phone = $1
        AND o.status != 'CANCELLED'
      GROUP BY o.id, o.created_at, o.total_price, s.name, s.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [cleanPhone]);

    return result.rows;
  }
}

module.exports = new AuthRepository();
