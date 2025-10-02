
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
    `, [userId]);

    return result.rows[0];
  }

  /**
   * 유저 정보 조회 (user_id로)
   */
  async getUserByUserId(userId) {
    const result = await pool.query(`
      SELECT * FROM users WHERE user_id = $1
    `, [userId]);

    return result.rows[0];
  }

  /**
   * 사용자 리뷰 조회
   */
  async getUserReviews(userId) {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.store_id,
        r.rating,
        r.content,
        r.created_at,
        s.name as store_name
      FROM reviews r
      LEFT JOIN stores s ON r.store_id = s.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT 3
    `, [userId]);

    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM reviews WHERE user_id = $1
    `, [userId]);

    return {
      total: parseInt(countResult.rows[0].total),
      reviews: result.rows
    };
  }

  /**
   * 즐겨찾기 매장 조회
   */
  async getFavoriteStores(userId) {
    const result = await pool.query(`
      SELECT 
        f.id as favorite_id,
        f.created_at,
        s.id, s.name, s.category, s.rating_average, s.review_count, s.is_open,
        sa.address_full as address, sa.latitude, sa.longitude
      FROM favorites f
      JOIN stores s ON f.store_id = s.id
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);

    return result.rows.map(store => ({
      id: store.id,
      favoriteId: store.favorite_id,
      name: store.name,
      category: store.category,
      address: store.address || '주소 정보 없음',
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0,
      isOpen: store.is_open !== false,
      favoriteDate: store.created_at,
      coord: store.latitude && store.longitude 
        ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
        : null
    }));
  }

  /**
   * 단골 레벨 조회
   */
  async getRegularLevels(userId, limit = 3) {
    const result = await pool.query(`
      SELECT 
        src.id,
        src.store_id,
        src.level_name,
        src.visit_count,
        src.total_spent,
        src.last_visit,
        s.name as store_name
      FROM store_regular_customers src
      JOIN stores s ON src.store_id = s.id
      WHERE src.user_id = $1
      ORDER BY src.visit_count DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  /**
   * 사용자 쿠폰 조회
   */
  async getUserCoupons(userId) {
    const result = await pool.query(`
      SELECT 
        c.id as coupon_id,
        c.name as coupon_name,
        c.description,
        c.discount_type,
        c.discount_value,
        c.min_order_price as min_order_amount,
        c.max_discount_value as max_discount,
        c.valid_from as starts_at,
        c.valid_until as ends_at,
        uc.used_at,
        uc.status,
        s.name as store_name
      FROM user_coupons uc
      JOIN coupons c ON uc.coupon_id = c.id
      LEFT JOIN stores s ON c.store_id = s.id
      WHERE uc.user_id = $1
      ORDER BY 
        CASE WHEN uc.used_at IS NULL THEN 0 ELSE 1 END,
        c.valid_until ASC
    `, [userId]);

    const coupons = { unused: [], used: [] };

    result.rows.forEach(coupon => {
      const couponData = {
        id: coupon.coupon_id,
        name: coupon.coupon_name,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        minOrderAmount: coupon.min_order_amount,
        maxDiscount: coupon.max_discount,
        startsAt: coupon.starts_at,
        endsAt: coupon.ends_at,
        storeName: coupon.store_name,
        validUntil: coupon.ends_at ? new Date(coupon.ends_at).toLocaleDateString() : null,
        status: coupon.status
      };

      if (coupon.used_at || coupon.status === 'USED') {
        coupons.used.push({ ...couponData, usedAt: coupon.used_at });
      } else {
        const now = new Date();
        const endDate = coupon.ends_at ? new Date(coupon.ends_at) : null;

        if ((!endDate || endDate > now) && coupon.status === 'AVAILABLE') {
          coupons.unused.push(couponData);
        } else {
          coupons.used.push({ ...couponData, usedAt: null, expired: true });
        }
      }
    });

    return coupons;
  }

  /**
   * 매장 정보 조회
   */
  async getStoreById(storeId) {
    const result = await pool.query(`
      SELECT id, name FROM stores WHERE id = $1
    `, [storeId]);

    return result.rows[0];
  }

  /**
   * 즐겨찾기 존재 확인
   */
  async checkFavoriteExists(userId, storeId) {
    const result = await pool.query(`
      SELECT id FROM favorites WHERE user_id = $1 AND store_id = $2
    `, [userId, storeId]);

    return result.rows.length > 0;
  }

  /**
   * 즐겨찾기 추가
   */
  async addFavorite(userId, storeId) {
    await pool.query(`
      INSERT INTO favorites (user_id, store_id)
      VALUES ($1, $2)
    `, [userId, storeId]);
  }

  /**
   * 즐겨찾기 제거
   */
  async removeFavorite(userId, storeId) {
    await pool.query(`
      DELETE FROM favorites WHERE user_id = $1 AND store_id = $2
    `, [userId, storeId]);
  }

  /**
   * 매장 즐겨찾기 수 증가
   */
  async incrementStoreFavoriteCount(storeId) {
    await pool.query(`
      UPDATE stores SET favorite_count = favorite_count + 1 WHERE id = $1
    `, [storeId]);
  }

  /**
   * 매장 즐겨찾기 수 감소
   */
  async decrementStoreFavoriteCount(storeId) {
    await pool.query(`
      UPDATE stores SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = $1
    `, [storeId]);
  }

  /**
   * 전화번호 중복 체크
   */
  async checkPhoneDuplicate(phone, excludeUserId) {
    const result = await pool.query(`
      SELECT id FROM users WHERE phone = $1 AND id != $2
    `, [phone, excludeUserId]);

    return result.rows.length > 0;
  }

  /**
   * 사용자 주문 내역 조회
   */
  async getUserOrders(userId, options = {}) {
    const limit = options.limit || 10;
    
    const result = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.store_id,
        o.total_price,
        o.status,
        o.order_type,
        o.created_at,
        s.name as store_name,
        s.category as store_category
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      storeId: order.store_id,
      storeName: order.store_name,
      storeCategory: order.store_category,
      totalPrice: order.total_price,
      status: order.status,
      orderType: order.order_type,
      createdAt: order.created_at
    }));
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUser(userId, updateData) {
    const result = await pool.query(`
      UPDATE users 
      SET 
        name = $1,
        phone = $2,
        email = $3,
        birth = $4,
        gender = $5,
        address = $6,
        detail_address = $7,
        email_notifications = $8,
        sms_notifications = $9,
        push_notifications = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 
      RETURNING *
    `, [
      updateData.name?.trim() || null,
      updateData.phone?.trim() || null,
      updateData.email?.trim() || null,
      updateData.birth || null,
      updateData.gender || null,
      updateData.address?.trim() || null,
      updateData.detailAddress?.trim() || null,
      updateData.notifications?.email === true,
      updateData.notifications?.sms === true,
      updateData.notifications?.push === true,
      userId
    ]);

    return result.rows[0];
  }
}

module.exports = new UserRepository();
