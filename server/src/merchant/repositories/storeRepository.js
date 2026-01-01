const pool = require('../../db/pool');

/**
 * TLM Store 레포지토리 - 매장 관련 DB 접근
 */
class MerchantStoreRepository {
  /**
   * 매장 생성 (stores 테이블)
   */
  async createStore(storeData) {
    const result = await pool.query(`
      INSERT INTO stores (name, is_open)
      VALUES ($1, $2)
      RETURNING id, name, is_open, created_at
    `, [storeData.name, storeData.is_open || false]);

    return result.rows[0];
  }

  /**
   * 매장 상세 정보 생성 (store_info 테이블)
   * amenities는 JSONB 형식으로 저장
   */
  async createStoreInfo(storeId, infoData) {
    const result = await pool.query(`
      INSERT INTO store_info (
        store_id, category, store_tel_number, 
        rating_average, review_count, name, amenities
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      storeId,
      infoData.category,
      infoData.store_tel_number,
      0, // rating_average 초기값
      0, // review_count 초기값
      infoData.store_name,
      JSON.stringify(infoData.amenities || {})
    ]);

    return result.rows[0];
  }

  /**
   * 매장 주소 생성 (store_addresses 테이블)
   * latitude, longitude, geom은 NOT NULL 필수 필드
   */
  async createStoreAddress(storeId, addressData) {
    // latitude, longitude는 필수
    if (!addressData.latitude || !addressData.longitude) {
      throw new Error('위도(latitude)와 경도(longitude)는 필수 입력값입니다');
    }

    const query = `
      INSERT INTO store_addresses (
        store_id, sido, sigungu, eupmyeondong, 
        road_address, detail_address, latitude, longitude, geom
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        ST_SetSRID(ST_MakePoint($8, $7), 4326)
      )
      RETURNING id, store_id, sido, sigungu, eupmyeondong, 
                road_address, detail_address, latitude, longitude,
                ST_X(geom) as lng, ST_Y(geom) as lat
    `;
    
    const params = [
      storeId,
      addressData.sido,
      addressData.sigungu,
      addressData.eupmyeondong,
      addressData.road_address,
      addressData.detail_address || null,
      addressData.latitude,
      addressData.longitude
    ];

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * 매장 편의시설 생성 (store_amenities 테이블)
   */
  async createStoreAmenities(storeId, amenities) {
    const result = await pool.query(`
      INSERT INTO store_amenities (
        store_id, wifi, parking, pet_friendly, 
        power_outlet, smoking_area
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      storeId,
      amenities.wifi || false,
      amenities.parking || false,
      amenities.pet_friendly || false,
      amenities.power_outlet || false,
      amenities.smoking_area || false
    ]);

    return result.rows[0];
  }

  /**
   * 매장 멤버 추가 (store_members 테이블)
   * member가 매장의 owner/admin이 됨
   */
  async createStoreMember(storeId, memberId, role = 'owner') {
    const result = await pool.query(`
      INSERT INTO store_members (
        store_id, member_id, role, permissions, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      storeId,
      memberId,
      role,
      JSON.stringify({ all: true }), // owner는 모든 권한
      'active'
    ]);

    return result.rows[0];
  }

  /**
   * 메뉴 아이템 생성 (store_menu 테이블)
   */
  async createMenuItem(storeId, menuItem) {
    const result = await pool.query(`
      INSERT INTO store_menu (
        store_id, name, description, price, cook_station
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      storeId,
      menuItem.name,
      menuItem.description || null,
      menuItem.price,
      menuItem.cook_station || 'KITCHEN'
    ]);

    return result.rows[0];
  }

  /**
   * 여러 메뉴 아이템 일괄 생성
   */
  async createMenuItems(storeId, menuItems) {
    if (!menuItems || menuItems.length === 0) return [];

    const results = [];
    for (const item of menuItems) {
      const result = await this.createMenuItem(storeId, item);
      results.push(result);
    }
    return results;
  }

  /**
   * 테이블 생성 (store_tables 테이블)
   */
  async createStoreTable(storeId, tableData) {
    const result = await pool.query(`
      INSERT INTO store_tables (
        store_id, table_name, capacity, status
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      storeId,
      tableData.table_name,
      tableData.capacity || 2,
      tableData.status || 'AVAILABLE'
    ]);

    return result.rows[0];
  }

  /**
   * 여러 테이블 일괄 생성
   */
  async createStoreTables(storeId, tables) {
    if (!tables || tables.length === 0) return [];

    const results = [];
    for (const table of tables) {
      const result = await this.createStoreTable(storeId, table);
      results.push(result);
    }
    return results;
  }

  /**
   * 영업시간 생성 (store_hours 테이블)
   */
  async createStoreHour(storeId, hourData) {
    const result = await pool.query(`
      INSERT INTO store_hours (
        store_id, day_of_week, open_time, close_time, is_closed, is_24hours, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      storeId,
      hourData.day_of_week,
      hourData.open_time || '09:00',
      hourData.close_time || '22:00',
      hourData.is_closed || false,
      hourData.is_24hours || false,
      hourData.description || null
    ]);

    return result.rows[0];
  }

  /**
   * 전체 영업시간 일괄 생성 (월~일)
   */
  async createStoreHours(storeId, hours) {
    if (!hours || hours.length === 0) {
      // 기본 영업시간 생성 (월~일 09:00-22:00)
      hours = Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        open_time: '09:00',
        close_time: '22:00',
        is_closed: false,
        is_24hours: false
      }));
    }

    const results = [];
    for (const hour of hours) {
      const result = await this.createStoreHour(storeId, hour);
      results.push(result);
    }
    return results;
  }

  /**
   * 기본 단골 등급 생성 (store_regular_levels 테이블)
   */
  async createDefaultRegularLevels(storeId) {
    const defaultLevels = [
      { level: '브론즈', min_orders: 0, min_spent: 0 },
      { level: '실버', min_orders: 5, min_spent: 50000 },
      { level: '골드', min_orders: 15, min_spent: 150000 },
      { level: '플래티넘', min_orders: 30, min_spent: 300000 },
    ];

    const results = [];
    for (const levelData of defaultLevels) {
      const result = await pool.query(`
        INSERT INTO store_regular_levels (
          store_id, level, min_orders, min_spent
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [storeId, levelData.level, levelData.min_orders, levelData.min_spent]);
      results.push(result.rows[0]);
    }
    return results;
  }

  /**
   * member_id로 소유한 매장 목록 조회
   */
  async getStoresByMemberId(memberId) {
    const result = await pool.query(`
      SELECT 
        s.id, s.name, s.is_open, s.created_at,
        si.category, si.store_tel_number,
        sa.road_address, sa.sido, sa.sigungu,
        sm.role, sm.status
      FROM store_members sm
      JOIN stores s ON sm.store_id = s.id
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE sm.member_id = $1
      ORDER BY s.created_at DESC
    `, [memberId]);

    return result.rows;
  }

  /**
   * 매장 ID로 전체 정보 조회
   */
  async getStoreFullInfo(storeId) {
    const store = await pool.query(`
      SELECT 
        s.id, s.name, s.is_open, s.created_at,
        si.category, si.store_tel_number, si.rating_average, si.review_count,
        sa.sido, sa.sigungu, sa.eupmyeondong, sa.road_address, sa.detail_address,
        ST_X(sa.geom) as lng, ST_Y(sa.geom) as lat,
        sam.wifi, sam.parking, sam.pet_friendly, sam.power_outlet, sam.smoking_area
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      LEFT JOIN store_amenities sam ON s.id = sam.store_id
      WHERE s.id = $1
    `, [storeId]);

    return store.rows[0] || null;
  }
}

module.exports = new MerchantStoreRepository();
