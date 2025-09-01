
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 사용자 즐겨찾기 상태 조회
router.get('/favorite/status/:userId/:storeId', async (req, res) => {
  try {
    const { userId, storeId } = req.params;

    const result = await pool.query(`
      SELECT id FROM favorites
      WHERE user_id = $1 AND store_id = $2
    `, [userId, storeId]);

    res.json({
      success: true,
      isFavorite: result.rows.length > 0
    });

  } catch (error) {
    console.error('❌ 즐겨찾기 상태 조회 실패:', error);
    res.json({
      success: true,
      isFavorite: false
    });
  }
});

// 즐겨찾기 토글
router.post('/favorite/toggle', async (req, res) => {
  try {
    const { userId, storeId } = req.body;

    // 기존 즐겨찾기 확인
    const existingResult = await pool.query(`
      SELECT id FROM favorites
      WHERE user_id = $1 AND store_id = $2
    `, [userId, storeId]);

    if (existingResult.rows.length > 0) {
      // 즐겨찾기 제거
      await pool.query(`
        DELETE FROM favorites
        WHERE user_id = $1 AND store_id = $2
      `, [userId, storeId]);

      res.json({
        success: true,
        isFavorite: false,
        message: '즐겨찾기에서 제거되었습니다'
      });
    } else {
      // 즐겨찾기 추가
      await pool.query(`
        INSERT INTO favorites (user_id, store_id)
        VALUES ($1, $2)
      `, [userId, storeId]);

      res.json({
        success: true,
        isFavorite: true,
        message: '즐겨찾기에 추가되었습니다'
      });
    }

  } catch (error) {
    console.error('❌ 즐겨찾기 토글 실패:', error);
    res.status(500).json({
      success: false,
      error: '즐겨찾기 처리 실패'
    });
  }
});

module.exports = router;
