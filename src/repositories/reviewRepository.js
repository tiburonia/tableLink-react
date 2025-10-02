
const pool = require('../db/pool');

/**
 * 리뷰 레포지토리 - 데이터베이스 접근
 */
class ReviewRepository {
  /**
   * 매장별 전체 리뷰 조회
   */
  async getStoreReviews(storeId, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.order_id,
        r.store_id,
        r.rating,
        r.content,
        r.images,
        r.status,
        r.created_at,
        r.updated_at,
        r.user_id,
        u.name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1 
        AND r.status = 'VISIBLE'
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [storeId, limit, offset]);

    return result.rows.map(review => ({
      id: review.id,
      order_id: review.order_id,
      store_id: review.store_id,
      score: review.rating,
      content: review.content || '내용 없음',
      images: review.images || [],
      status: review.status,
      created_at: review.created_at,
      updated_at: review.updated_at,
      userId: review.user_id,
      user: review.user_name || '익명'
    }));
  }

  /**
   * 사용자별 리뷰 조회
   */
  async getUserReviews(userId, limit = 10) {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.rating as score,
        r.review_text as content,
        r.created_at,
        r.store_id as storeId,
        s.name as storeName,
        TO_CHAR(r.created_at, 'YYYY.MM.DD') as date
      FROM reviews r
      JOIN stores s ON r.store_id = s.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  /**
   * 사용자 리뷰 총 개수 조회
   */
  async getUserReviewCount(userId) {
    const result = await pool.query(`
      SELECT COUNT(*) as total 
      FROM reviews 
      WHERE user_id = $1
    `, [userId]);

    return parseInt(result.rows[0].total);
  }

  /**
   * 리뷰 생성
   */
  async createReview(reviewData) {
    const result = await pool.query(`
      INSERT INTO reviews (
        user_id, store_id, order_id, rating, review_text, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING 
        id,
        user_id,
        store_id,
        order_id,
        rating,
        review_text,
        created_at
    `, [
      reviewData.userId,
      reviewData.storeId,
      reviewData.orderId,
      reviewData.rating,
      reviewData.reviewText
    ]);

    return result.rows[0];
  }

  /**
   * 주문에 대한 리뷰 존재 여부 확인
   */
  async checkReviewExistsByOrderId(orderId) {
    const result = await pool.query(`
      SELECT id FROM reviews WHERE order_id = $1 LIMIT 1
    `, [orderId]);

    return result.rows.length > 0;
  }
}

module.exports = new ReviewRepository();
