
const pool = require('../db/pool');

/**
 * 피드 레포지토리 - 피드 데이터 접근
 */
class FeedRepository {
  /**
   * 팔로잉 매장 최근 방문 정보 조회
   */
  async getFollowingRecentVisits(userId) {
    const result = await pool.query(`
      SELECT 
        src.store_id,
        s.name as store_name,
        si.category,
        src.last_visit,
        srl.level,
        src.total_spent as points,
        (
          SELECT COUNT(*) 
          FROM user_coupons uc 
          JOIN coupons c ON uc.coupon_id = c.id 
          WHERE uc.user_id = $1 
          AND c.store_id = src.store_id 
          AND uc.status = 'AVAILABLE'
        ) as coupons
      FROM store_regular_customers src
      JOIN stores s ON src.store_id = s.id
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_regular_levels srl ON src.level_id = srl.id
      WHERE src.user_id = $1
      AND src.is_processing_level = TRUE
      ORDER BY src.last_visit DESC
      LIMIT 5
    `, [userId]);

    return result.rows.map(row => ({
      storeId: row.store_id,
      storeName: row.store_name,
      category: row.category || '매장',
      lastVisit: this.formatLastVisit(row.last_visit),
      level: row.level || 'BRONZE',
      points: parseInt(row.points) || 0,
      coupons: parseInt(row.coupons) || 0
    }));
  }

  /**
   * 팔로잉 매장 피드 포스트 조회
   */
  async getFollowingPosts(userId) {
    const result = await pool.query(`
      SELECT 
        sf.id,
        sf.store_id,
        s.name as store_name,
        si.category,
        sf.title,
        sf.content,
        sf.image_urls,
        sf.tags,
        sf.like_count,
        sf.comment_count,
        sf.created_at,
        srl.level as user_level
      FROM store_feeds sf
      JOIN following f ON sf.store_id = f.store_id
      JOIN stores s ON sf.store_id = s.id
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_regular_customers src ON src.store_id = sf.store_id AND src.user_id = $1
      LEFT JOIN store_regular_levels srl ON src.level_id = srl.id
      WHERE f.user_id = $1
      ORDER BY sf.created_at DESC
      LIMIT 20
    `, [userId]);

    return result.rows.map(row => ({
      id: row.id,
      storeId: row.store_id,
      storeName: row.store_name,
      storeLogo: this.getCategoryEmoji(row.category),
      postType: this.determinePostType(row.tags),
      title: row.title,
      content: row.content,
      targetTag: this.getTargetTag(row.tags),
      hasImage: row.image_urls && row.image_urls.length > 0,
      imageUrl: row.image_urls && row.image_urls.length > 0 ? row.image_urls[0] : null,
      likes: row.like_count || 0,
      comments: row.comment_count || 0,
      hasLiked: false, // TODO: 사용자별 좋아요 상태 조회
      hasCoupon: row.tags && row.tags.includes('쿠폰'),
      couponReceived: false,
      createdAt: row.created_at
    }));
  }

  /**
   * 마지막 방문 시간 포맷
   */
  formatLastVisit(lastVisit) {
    if (!lastVisit) return '방문 기록 없음';

    const now = new Date();
    const visitDate = new Date(lastVisit);
    const diffMs = now - visitDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}개월 전`;
  }

  /**
   * 카테고리별 이모지 반환
   */
  getCategoryEmoji(category) {
    const emojiMap = {
      '카페': '☕',
      '치킨': '🍗',
      '한식': '🍜',
      '중식': '🥟',
      '일식': '🍱',
      '양식': '🍝',
      '분식': '🍢',
      '베이커리': '🥖',
      '디저트': '🍰'
    };
    return emojiMap[category] || '🏪';
  }

  /**
   * 태그 기반 포스트 타입 결정
   */
  determinePostType(tags) {
    if (!tags) return 'story';
    
    if (tags.includes('이벤트') || tags.includes('할인') || tags.includes('1+1')) {
      return 'event';
    }
    if (tags.includes('신메뉴') || tags.includes('메뉴')) {
      return 'new_menu';
    }
    if (tags.includes('프로모션')) {
      return 'promotion';
    }
    if (tags.includes('공지') || tags.includes('휴무')) {
      return 'notice';
    }
    
    return 'story';
  }

  /**
   * 태그에서 타겟 태그 추출
   */
  getTargetTag(tags) {
    if (!tags || tags.length === 0) return '';
    
    const tagMap = {
      '이벤트': '이벤트',
      '할인': '할인',
      '신메뉴': '신메뉴',
      '프로모션': '프로모션',
      '공지': '공지사항',
      '단골전용': '단골전용'
    };

    for (const tag of tags) {
      if (tagMap[tag]) {
        return tagMap[tag];
      }
    }

    return tags[0] || '';
  }
}

module.exports = new FeedRepository();
