
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

    return result.rows.map(store => ({
      id: store.id,
      name: store.name,
      is_open: store.is_open,
      store_tel_number: store.store_tel_number,
      rating_average: store.rating_average,
      review_count: store.review_count,
      sido: store.sido,
      sigungu: store.sigungu,
      eupmyeondong: store.eupmyeondong,
      full_address: store.full_address,
      lng: store.lng,
      lat: store.lat
    }))
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
        benefits
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
   * 매장 편의시설 조회
   */
  async getStoreAmenities(storeId) {
    const result = await pool.query(`
      SELECT amenities
      FROM store_info
      WHERE store_id = $1
    `, [storeId]);

    if (result.rows.length > 0 && result.rows[0].amenities) {
      return result.rows[0].amenities;
    }

    // amenities 정보가 없을 경우 기본값 반환
    return {
      wifi: false,
      parking: false,
      pet_friendly: false,
      power_outlet: false,
      smoking_area: false
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

  /**
   * 모든 매장 정보 조회 (지도용 - Legacy)
   */
  async getAllStores() {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.category,
        si.rating_average,
        si.review_count,
        si.store_tel_number,
        sa.road_address,
        sa.jibun_address,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_Y(sa.geom) as latitude,
        ST_X(sa.geom) as longitude,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE sa.latitude IS NOT NULL AND sa.longitude IS NOT NULL
      ORDER BY s.id
    `);

    return result.rows;
  }

  /**
   * 매장 초기 로딩 (커서 기반 페이지네이션, id순)
   * @param {number} limit - 가져올 개수
   */
  async getInitialStores(limit = 20) {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.category,
        si.rating_average,
        si.review_count,
        si.store_tel_number,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_Y(sa.geom) as latitude,
        ST_X(sa.geom) as longitude,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      ORDER BY s.id ASC
      LIMIT $1
    `, [limit + 1]); // limit + 1로 hasNext 확인

    const hasNext = result.rows.length > limit;
    const items = hasNext ? result.rows.slice(0, limit) : result.rows;
    const lastItem = items[items.length - 1];
    const nextCursor = hasNext && lastItem ? String(lastItem.id) : null;

    return {
      items,
      nextCursor,
      hasNext
    };
  }

  /**
   * 매장 추가 로딩 (커서 기반, id순)
   * @param {string} cursor - 커서 (마지막 id)
   * @param {number} limit - 가져올 개수
   */
  async getMoreStores(cursor, limit = 20) {
    const cursorId = parseInt(cursor);

    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.category,
        si.rating_average,
        si.review_count,
        si.store_tel_number,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_Y(sa.geom) as latitude,
        ST_X(sa.geom) as longitude,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE s.id > $1
      ORDER BY s.id ASC
      LIMIT $2
    `, [cursorId, limit + 1]);

    const hasNext = result.rows.length > limit;
    const items = hasNext ? result.rows.slice(0, limit) : result.rows;
    const lastItem = items[items.length - 1];
    const nextCursor = hasNext && lastItem ? String(lastItem.id) : null;

    return {
      items,
      nextCursor,
      hasNext
    };
  }

  /**
   * 카테고리별 매장 조회
   * @param {string} category - 카테고리 ID (korean, japanese, chinese 등)
   * @param {number} limit - 가져올 개수
   */
  async getStoresByCategory(category, limit = 6) {
    // 카테고리 ID를 한글 카테고리명으로 매핑
    const categoryMap = {
      korean: '한식',
      japanese: '일식',
      chinese: '중식',
      western: '양식',
      cafe: '카페',
      etc: '기타'
    };

    const categoryName = categoryMap[category] || category;

    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.category,
        si.rating_average,
        si.review_count,
        si.store_tel_number,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_Y(sa.geom) as latitude,
        ST_X(sa.geom) as longitude,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE si.category ILIKE $1
      ORDER BY si.rating_average DESC NULLS LAST, s.id ASC
      LIMIT $2
    `, [`%${categoryName}%`, limit]);

    return result.rows;
  }

  /**
   * 위치 기반 근처 매장 조회 (PostGIS)
   * @param {number} lat - 위도
   * @param {number} lng - 경도
   * @param {number} radius - 반경 (미터)
   * @param {number} limit - 가져올 개수
   */
  async getStoresNearby(lat, lng, radius = 1000, limit = 6) {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.category,
        si.rating_average,
        si.review_count,
        si.store_tel_number,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_Y(sa.geom) as latitude,
        ST_X(sa.geom) as longitude,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong,
        ST_Distance(
          sa.geom::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) as distance
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE sa.geom IS NOT NULL
        AND ST_DWithin(
          sa.geom::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $3
        )
      ORDER BY distance ASC, si.rating_average DESC NULLS LAST
      LIMIT $4
    `, [lat, lng, radius, limit]);

    return result.rows;
  }

  /**
   * 요일 기반 매장 조회 (id % t === 0인 매장 랜덤 조회)
   * @param {number} t - 요일 값 (월=1 ~ 일=7)
   * @param {number} limit - 가져올 개수
   */
  async getStoresByDayMod(t, limit = 5) {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.category,
        si.rating_average,
        si.review_count,
        si.store_tel_number,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_Y(sa.geom) as latitude,
        ST_X(sa.geom) as longitude,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE s.id % $1 = 0
      ORDER BY RANDOM()
      LIMIT $2
    `, [t, limit]);

    return result.rows;
  }
}

module.exports = new StoreRepository();
