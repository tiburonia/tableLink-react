const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// 사용자별 매장별 포인트 조회
router.get('/user/:userId/store/:storeId/points', async (req, res) => {
  try {
    const { userId, storeId } = req.params;

    console.log(`💰 사용자 ${userId} 매장 ${storeId} 포인트 조회`);

    const result = await pool.query(`
      SELECT 
        sp.balance as points,
        sp.updated_at,
        s.name as store_name
      FROM store_points sp
      JOIN stores s ON sp.store_id = s.id
      WHERE sp.user_id = $1 AND sp.store_id = $2
    `, [userId, storeId]);

    if (result.rows.length === 0) {
      res.json({
        success: true,
        points: 0,
        store_name: null,
        updated_at: null
      });
      return;
    }

    const pointsData = result.rows[0];

    res.json({
      success: true,
      points: pointsData.points || 0,
      store_name: pointsData.store_name,
      updated_at: pointsData.updated_at
    });

  } catch (error) {
    console.error('❌ 매장별 포인트 조회 실패:', error);
    res.json({
      success: true,
      points: 0,
      store_name: null,
      updated_at: null
    });
  }
});

module.exports = router;

// 사용자별 매장 단골 레벨 조회
router.get('/user/:userId/store/:storeId', async (req, res) => {
  try {
    const { userId, storeId } = req.params;

    const result = await pool.query(`
      SELECT 
        rl.*,
        ll.name as level_name,
        ll.rank,
        ll.required_visit_count,
        ll.required_total_spent,
        ll.required_points,
        ll.eval_policy
      FROM regular_levels rl
      LEFT JOIN loyalty_levels ll ON rl.level_id = ll.id
      WHERE rl.user_id = $1 AND rl.store_id = $2
    `, [userId, storeId]);

    if (result.rows.length === 0) {
      res.json({
        success: true,
        level: null,
        stats: { points: 0, visitCount: 0, totalSpent: 0 },
        nextLevel: { name: '단골 고객', requiredVisitCount: 5 },
        progress: { percentage: 0, visits_needed: 5 }
      });
      return;
    }

    const levelData = result.rows[0];

    res.json({
      success: true,
      level: {
        name: levelData.level_name || '신규 고객',
        rank: levelData.rank || 0
      },
      stats: {
        points: levelData.points || 0,
        visitCount: levelData.visit_count || 0,
        totalSpent: levelData.total_spent || 0
      },
      nextLevel: {
        name: '다음 단계',
        requiredVisitCount: levelData.required_visit_count || 5,
        requiredTotalSpent: levelData.required_total_spent || 50000,
        requiredPoints: levelData.required_points || 100,
        evalPolicy: levelData.eval_policy || 'OR'
      },
      progress: {
        percentage: Math.min(100, ((levelData.visit_count || 0) / (levelData.required_visit_count || 5)) * 100),
        visits_needed: Math.max(0, (levelData.required_visit_count || 5) - (levelData.visit_count || 0))
      }
    });

  } catch (error) {
    console.error('❌ 단골 레벨 조회 실패:', error);
    res.json({
      success: true,
      level: null,
      stats: { points: 0, visitCount: 0, totalSpent: 0 },
      nextLevel: { name: '단골 고객', requiredVisitCount: 5 },
      progress: { percentage: 0, visits_needed: 5 }
    });
  }
});

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
// });

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



// 포인트 사용
router.post('/user/:userId/store/:storeId/points/use', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { userId, storeId } = req.params;
    const { points, orderId } = req.body;

    if (!points || points <= 0) {
      throw new Error('유효하지 않은 포인트 수량입니다');
    }

    console.log(`💸 포인트 사용 요청: 사용자 ${userId}, 매장 ${storeId}, 포인트 ${points}`);

    // 현재 포인트 잔액 확인
    const balanceResult = await client.query(`
      SELECT balance FROM store_points 
      WHERE user_id = $1 AND store_id = $2
    `, [userId, storeId]);

    const currentBalance = balanceResult.rows.length > 0 ? balanceResult.rows[0].balance : 0;

    if (currentBalance < points) {
      throw new Error('보유 포인트가 부족합니다');
    }

    // 포인트 차감
    await client.query(`
      INSERT INTO store_points (user_id, store_id, balance, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, store_id)
      DO UPDATE SET 
        balance = store_points.balance - $3,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, storeId, points]);

    await client.query('COMMIT');

    res.json({
      success: true,
      used_points: points,
      remaining_balance: currentBalance - points,
      message: '포인트 사용이 완료되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 포인트 사용 실패:', error);
    res.status(400).json({
      success: false,
      error: error.message || '포인트 사용 실패'
    });
  } finally {
    client.release();
  }
});

// 포인트 적립
router.post('/user/:userId/store/:storeId/points/earn', async (req, res) => {
  try {
    const { userId, storeId } = req.params;
    const { points, orderId } = req.body;

    if (!points || points <= 0) {
      throw new Error('유효하지 않은 포인트 수량입니다');
    }

    console.log(`💰 포인트 적립 요청: 사용자 ${userId}, 매장 ${storeId}, 포인트 ${points}`);

    // 포인트 적립
    await pool.query(`
      INSERT INTO store_points (user_id, store_id, balance, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, store_id)
      DO UPDATE SET 
        balance = store_points.balance + $3,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, storeId, points]);

    // 현재 잔액 조회
    const balanceResult = await pool.query(`
      SELECT balance FROM store_points 
      WHERE user_id = $1 AND store_id = $2
    `, [userId, storeId]);

    const newBalance = balanceResult.rows[0].balance;

    res.json({
      success: true,
      earned_points: points,
      total_balance: newBalance,
      message: '포인트 적립이 완료되었습니다'
    });

  } catch (error) {
    console.error('❌ 포인트 적립 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '포인트 적립 실패'
    });
  }
});

module.exports = router;