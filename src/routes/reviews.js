
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 매장별 리뷰 조회 API
router.get('/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT 
        r.id,
        r.user_id,
        r.rating,
        r.content,
        r.created_at,
        u.name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [storeId, limit, offset]);

    res.json({
      success: true,
      reviews: result.rows
    });
  } catch (error) {
    console.error('리뷰 조회 실패:', error);
    res.status(500).json({ error: '리뷰 조회 실패' });
  }
});

// 사용자별 리뷰 조회 API
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`📝 사용자 ${userId} 리뷰 조회`);

    // reviews 테이블의 실제 컬럼명 확인 후 조회
    const result = await pool.query(`
      SELECT 
        r.id,
        r.rating as score,
        COALESCE(r.review_text, r.comment, '') as content,
        r.created_at,
        s.name as storeName,
        TO_CHAR(r.created_at, 'YYYY.MM.DD') as date
      FROM reviews r
      JOIN stores s ON r.store_id = s.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM reviews WHERE user_id = $1
    `, [userId]);

    res.json({
      success: true,
      reviews: result.rows,
      total: parseInt(totalResult.rows[0].total)
    });
  } catch (error) {
    console.error('사용자 리뷰 조회 실패:', error);
    res.status(500).json({ success: false, error: '리뷰 조회 실패' });
  }
});

// 리뷰 작성 API
router.post('/submit', async (req, res) => {
  try {
    const { storeId, userId, rating, content } = req.body;

    const result = await pool.query(`
      INSERT INTO reviews (store_id, user_id, rating, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [storeId, userId, rating, content]);

    res.json({
      success: true,
      review: result.rows[0]
    });
  } catch (error) {
    console.error('리뷰 작성 실패:', error);
    res.status(500).json({ error: '리뷰 작성 실패' });
  }
});

module.exports = router;
