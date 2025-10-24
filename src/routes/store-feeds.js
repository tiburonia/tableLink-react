
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * 매장 피드 조회 API
 * GET /api/store-feeds/:storeId
 */
router.get('/:storeId', async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // 매장 기본 정보 조회
    const storeResult = await pool.query(`
      SELECT 
        s.id,
        s.name,
        si.category,
        si.rating_average,
        si.review_count
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      WHERE s.id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '매장을 찾을 수 없습니다'
      });
    }

    const store = storeResult.rows[0];

    // 매장 피드 조회
    const feedsResult = await pool.query(`
      SELECT 
        id,
        title,
        content,
        image_urls,
        tags,
        visibility,
        like_count,
        comment_count,
        view_count,
        created_at,
        updated_at
      FROM store_feeds
      WHERE store_id = $1 
        AND is_active = true
        AND visibility = 'PUBLIC'
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [storeId, limit, offset]);

    // 피드 타입 결정 (tags 기반)
    const posts = feedsResult.rows.map(feed => {
      let type = 'story';
      if (feed.tags) {
        if (feed.tags.includes('이벤트') || feed.tags.includes('할인') || feed.tags.includes('1+1')) {
          type = 'promotion';
        } else if (feed.tags.includes('공지') || feed.tags.includes('휴무')) {
          type = 'notice';
        }
      }

      return {
        id: feed.id,
        author: store.name,
        avatar: '/TableLink.png',
        image: feed.image_urls && feed.image_urls.length > 0 ? feed.image_urls[0] : null,
        caption: feed.content,
        date: formatDate(feed.created_at),
        likes: feed.like_count || 0,
        type: type,
        isLiked: false, // TODO: 사용자별 좋아요 상태 조회
        title: feed.title,
        tags: feed.tags || []
      };
    });

    res.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        logo: '/TableLink.png',
        bio: `${store.category || '맛집'} 전문점`,
        followers: 0, // TODO: 단골 수 조회
        isFollowing: false // TODO: 사용자별 단골 여부 조회
      },
      posts: posts,
      totalCount: feedsResult.rowCount
    });

  } catch (error) {
    console.error('❌ 매장 피드 조회 실패:', error);
    next(error);
  }
});

/**
 * 날짜 포맷팅 헬퍼 함수
 */
function formatDate(date) {
  const now = new Date();
  const createdAt = new Date(date);
  const diffMs = now - createdAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '1일 전';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주일 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전';
  return `${Math.floor(diffDays / 365)}년 전`;
}

module.exports = router;
