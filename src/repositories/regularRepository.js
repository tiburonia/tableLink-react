
const pool = require('../db/pool');

/**
 * 단골 등급 관리 리포지토리
 */
class RegularRepository {
  constructor() {
    this.pool = pool;
  }
  /**
   * 매장-유저의 활성 단골 기록 조회
   */
  async findRegularByStoreAndUser(storeId, userId) {
    const result = await pool.query(`
      SELECT * FROM store_regular_customers 
      WHERE store_id = $1 AND user_id = $2 AND is_processing_level = TRUE
      ORDER BY created_at DESC
      LIMIT 1
    `, [storeId, userId]);

    return result.rows[0];
  }

  /**
   * 단골 통계 업데이트 (방문수, 누적금액)
   */
  async updateRegularStats(storeId, userId, orderAmount) {
    await pool.query(`
      UPDATE store_regular_customers
      SET visit_count = visit_count + 1,
          total_spent = total_spent + $3,
          last_visit = NOW(),
          updated_at = NOW()
      WHERE store_id = $1 AND user_id = $2 AND is_processing_level = TRUE
    `, [storeId, userId, orderAmount]);
  }

  /**
   * 다음 등급 조회
   */
  async findNextLevel(storeId, currentLevel) {
    const result = await pool.query(`
      SELECT 
        id,
        store_id,
        level,
        min_orders,
        min_spent,
        benefits,
        grade,
        condition_operator 
      FROM store_regular_levels
      WHERE store_id = $1 AND level != $2
      ORDER BY grade ASC, min_orders ASC, min_spent ASC
    `, [storeId, currentLevel]);

    // 현재 레벨보다 높은 조건의 다음 레벨 찾기
    const currentLevelData = await pool.query(`
      SELECT grade, min_orders, min_spent FROM store_regular_levels
      WHERE store_id = $1 AND level = $2
    `, [storeId, currentLevel]);

    if (currentLevelData.rows.length === 0) return null;

    const current = currentLevelData.rows[0];
    
    // grade가 더 높은 첫 번째 레벨 반환
    for (const level of result.rows) {
      if (level.grade > current.grade) {
        return level;
      }
    }

    return null;
  }

  /**
   * 등급 승급 조건 확인 (condition_operator 고려)
   */
  async checkLevelCondition(level, regular) {
    if (!level) return false;
    
    const { min_orders, min_spent, condition_operator } = level;
    const ordersCondition = regular.visit_count >= min_orders;
    const spentCondition = regular.total_spent >= min_spent;

    // condition_operator에 따라 AND/OR 조건 적용
    if (condition_operator === 'OR') {
      return ordersCondition || spentCondition;
    } else {
      // 기본값은 AND (condition_operator가 'AND'이거나 null인 경우)
      return ordersCondition && spentCondition;
    }
  }

  /**
   * 단골 등급 승급 - 기존 레코드 비활성화 및 새 레코드 생성
   */
  async promoteRegularLevel({ storeId, userId, nextLevel, currentRegular }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. 기존 레코드의 is_processing_level을 FALSE로 설정
      await client.query(`
        UPDATE store_regular_customers
        SET is_processing_level = FALSE,
            updated_at = NOW()
        WHERE store_id = $1 AND user_id = $2 AND is_processing_level = TRUE
      `, [storeId, userId]);

      // 2. 새 레코드 생성 (기존 통계 상속)
      await client.query(`
        INSERT INTO store_regular_customers 
        (store_id, user_id, level_id, visit_count, total_spent, last_visit, is_processing_level, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
      `, [
        storeId, 
        userId, 
        nextLevel.id,
        currentRegular.visit_count,
        currentRegular.total_spent,
        currentRegular.last_visit
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 매장의 최하위 등급 조회
   */
  async findLowestLevel(storeId) {
    const result = await pool.query(`
      SELECT * FROM store_regular_levels
      WHERE store_id = $1
      ORDER BY min_orders ASC, min_spent ASC
      LIMIT 1
    `, [storeId]);

    return result.rows[0];
  }

  /**
   * 신규 단골 생성
   */
  async createRegular({ storeId, userId, levelId, initialAmount }) {
    await pool.query(`
      INSERT INTO store_regular_customers 
      (store_id, user_id, level_id, visit_count, total_spent, last_visit, created_at, updated_at)
      VALUES ($1, $2, $3, 1, $4, NOW(), NOW(), NOW())
    `, [storeId, userId, levelId, initialAmount || 0]);
  }

  /**
   * 주문 정보 조회 (단골 처리용)
   */
  async getOrderInfo(orderId) {
    const result = await pool.query(`
      SELECT 
        id,
        store_id,
        user_id as user_pk,
        total_price
      FROM orders
      WHERE id = $1
    `, [orderId]);

    return result.rows[0];
  }
}

module.exports = new RegularRepository();
