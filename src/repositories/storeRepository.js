
const pool = require('../db/pool');

/**
 * 매장 레포지토리 - 데이터베이스 접근
 */
class StoreRepository {
  /**
   * ID로 매장 상세 정보 조회
   */
  async getStoreById(storeId) {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.store_tel_number,
        si.rating_average,
        si.review_count,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_X(sa.geom) as lng,
        ST_Y(sa.geom) as lat
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE s.id = $1
    `, [storeId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 매장 기본 정보 조회 (메뉴 조회용)
   */
  async getStoreBasicInfo(storeId) {
    const result = await pool.query(`
      SELECT id, name FROM stores WHERE id = $1
    `, [storeId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 매장 검색
   */
  async searchStores(searchQuery, limit) {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.category,
        si.rating_average,
        si.review_count,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_Y(sa.geom) as lat,
        ST_X(sa.geom) as lng,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE 
        s.name ILIKE $1 
        OR si.category ILIKE $1
      ORDER BY 
        CASE 
          WHEN s.name ILIKE $2 THEN 1
          WHEN s.name ILIKE $1 THEN 2
          ELSE 3
        END,
        s.is_open DESC,
        si.rating_average DESC NULLS LAST
      LIMIT $3
    `, [
      `%${searchQuery}%`,
      `${searchQuery}%`,
      limit
    ]);

    return result.rows;
  }

  /**
   * 매장 메뉴 조회
   */
  async getStoreMenu(storeId) {
    const result = await pool.query(`
      SELECT 
        id,
        store_id,
        name,
        description,
        price,
        cook_station
      FROM store_menu 
      WHERE store_id = $1
      ORDER BY id
    `, [storeId]);

 
    return result.rows.map(menuItem => ({
      id: menuItem.id,
      store_id: menuItem.store_id,
      name: menuItem.name,
      description: menuItem.description ? menuItem.description : '메뉴 설명 없음',
      cook_station: menuItem.cook_station,
      price: menuItem.price,
    }))
  }

  /**
   * 매장 리뷰 조회 (ORDER BY created_at DESC) LIMIT 5)
   */
  async getStoreReview(storeId) {
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
      LIMIT 5
    `, [storeId]);

    return result.rows.map(review => ({
      id: review.id,
      order_id: review.order_id,
      store_id: review.store_id,
      rating: review.rating,
      content: review.content || '내용 없음',
      images: review.images || [],
      status: review.status,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user_id: review.user_id,
      user_name: review.user_name || '익명'
    }));
  }
  /**
   * 매장 프로모션 조회
   */
   async getStorePromotion(storeId) {
    const result = await pool.query(`
      SELECT
        id,
        store_id,
        level,
        min_orders,
        min_spent,
        bebfit
        FROM store_regular_levels
        WHERE store_id = $1
    `, [storeId])

     return result.rows.map(promotion => ({
        id: promotion.id,
        store_id: promotion.store_id,
        level: promotion.level,
        min_orders: promotion.min_orders,
        min_spent: promotion.min_spent,
        benefit: promotion.benefit
     }))
   }
  

  /**
   * 매장 평점 정보 조회
   */
  async getStoreRating(storeId) {
    const result = await pool.query(`
      SELECT 
        rating_average,
        review_count
      FROM store_info
      WHERE store_id = $1
    `, [storeId]);

    if (result.rows.length > 0) {
      return {
        ratingAverage: parseFloat(result.rows[0].rating_average) || 0.0,
        reviewCount: parseInt(result.rows[0].review_count) || 0
      };
    }

    return {
      ratingAverage: 0.0,
      reviewCount: 0
    };
  }

  /**
   * 매장 프로모션 조회 (현재는 더미 데이터)
   */
  async getStorePromotions(storeId) {
    // 실제 프로모션 테이블이 있다면 여기서 조회
    // 현재는 빈 배열 반환
    return [];
  }

  /**
   * 매장 상위 사용자 조회 (현재는 더미 데이터)
   */
  async getStoreTopUsers(storeId) {
    // 실제 사용자 통계 테이블이 있다면 여기서 조회
    // 현재는 빈 배열 반환
    return [];
  }

  /**
   * 매장 존재 여부 확인
   */
  async existsById(storeId) {
    const result = await pool.query(`
      SELECT 1 FROM stores WHERE id = $1
    `, [storeId]);

    return result.rows.length > 0;
  }

  /**
   * 매장 카테고리별 조회
   */
  async getStoresByCategory(category, limit = 20) {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.category,
        si.rating_average,
        si.review_count,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_Y(sa.geom) as lat,
        ST_X(sa.geom) as lng
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE si.category = $1
      ORDER BY si.rating_average DESC NULLS LAST
      LIMIT $2
    `, [category, limit]);

    return result.rows;
  }

  /**
   * 지역별 매장 조회
   */
  async getStoresByRegion(sido, sigungu, eupmyeondong, limit = 20) {
    let query = `
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.category,
        si.rating_average,
        si.review_count,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_Y(sa.geom) as lat,
        ST_X(sa.geom) as lng
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (sido) {
      query += ` AND sa.sido = $${paramCount}`;
      params.push(sido);
      paramCount++;
    }

    if (sigungu) {
      query += ` AND sa.sigungu = $${paramCount}`;
      params.push(sigungu);
      paramCount++;
    }

    if (eupmyeondong) {
      query += ` AND sa.eupmyeondong = $${paramCount}`;
      params.push(eupmyeondong);
      paramCount++;
    }

    query += ` ORDER BY si.rating_average DESC NULLS LAST LIMIT $${paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = new StoreRepository();
