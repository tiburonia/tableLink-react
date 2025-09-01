
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 사용자별 단골 레벨 조회
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🏆 사용자 ${userId} 단골 레벨 조회`);

    const result = await pool.query(`
      SELECT 
        uss.store_id as "storeId",
        s.name as "storeName",
        s.category as "storeCategory",
        uss.visit_count as "visitCount",
        uss.total_spent as "totalSpent",
        uss.points,
        CASE 
          WHEN uss.visit_count >= 20 THEN json_build_object('rank', 5, 'name', '다이아몬드', 'description', '최고 등급의 단골 고객')
          WHEN uss.visit_count >= 15 THEN json_build_object('rank', 4, 'name', '플래티넘', 'description', '프리미엄 단골 고객')
          WHEN uss.visit_count >= 10 THEN json_build_object('rank', 3, 'name', '골드', 'description', '골드 단골 고객')
          WHEN uss.visit_count >= 5 THEN json_build_object('rank', 2, 'name', '실버', 'description', '실버 단골 고객')
          WHEN uss.visit_count >= 1 THEN json_build_object('rank', 1, 'name', '브론즈', 'description', '신규 단골 고객')
          ELSE json_build_object('rank', 0, 'name', '신규고객', 'description', '첫 방문을 환영합니다')
        END as "currentLevel"
      FROM user_store_stats uss
      JOIN stores s ON uss.store_id = s.id
      WHERE uss.user_id = $1 AND uss.visit_count > 0
      ORDER BY uss.visit_count DESC, uss.total_spent DESC
    `, [userId]);

    res.json({
      success: true,
      regularStores: result.rows
    });

  } catch (error) {
    console.error('❌ 단골 레벨 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '단골 레벨 조회 실패'
    });
  }
});

// 사용자별 모든 포인트 조회
router.get('/user/:userId/all-points', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`💰 사용자 ${userId} 전체 포인트 조회`);

    const result = await pool.query(`
      SELECT 
        uss.store_id as "storeId",
        s.name as "storeName", 
        s.category as "storeCategory",
        uss.points
      FROM user_store_stats uss
      JOIN stores s ON uss.store_id = s.id
      WHERE uss.user_id = $1 AND uss.points > 0
      ORDER BY uss.points DESC
    `, [userId]);

    res.json({
      success: true,
      storePoints: result.rows
    });

  } catch (error) {
    console.error('❌ 포인트 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '포인트 조회 실패'
    });
  }
});



module.exports = router;
