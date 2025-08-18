const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 매장의 단골 레벨 조회
router.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🏆 매장 ${storeId} 단골 레벨 조회`);

    const result = await pool.query(`
      SELECT 
        id, level_rank, name, description,
        required_points, required_total_spent, required_visit_count,
        eval_policy, benefits, is_active
      FROM regular_levels
      WHERE store_id = $1 AND is_active = true
      ORDER BY level_rank ASC
    `, [storeId]);

    console.log(`✅ 매장 ${storeId} 단골 레벨 ${result.rows.length}개 조회 완료`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      levels: result.rows
    });

  } catch (error) {
    console.error('❌ 매장 단골 레벨 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 단골 레벨 조회 실패: ' + error.message
    });
  }
});

// 특정 매장의 사용자 포인트 조회
router.get('/user/:userId/store/:storeId/points', async (req, res) => {
  try {
    const { userId, storeId } = req.params;

    const result = await pool.query(`
      SELECT 
        uss.points,
        uss.total_spent,
        uss.visit_count,
        uss.last_visit_at,
        s.name as store_name
      FROM user_store_stats uss
      JOIN stores s ON uss.store_id = s.id
      WHERE uss.user_id = $1 AND uss.store_id = $2
    `, [userId, storeId]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        points: 0,
        totalSpent: 0,
        visitCount: 0,
        storeName: null
      });
    }

    const data = result.rows[0];
    res.json({
      success: true,
      points: data.points || 0,
      totalSpent: data.total_spent || 0,
      visitCount: data.visit_count || 0,
      lastVisitAt: data.last_visit_at,
      storeName: data.store_name
    });

  } catch (error) {
    console.error('❌ 매장별 포인트 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장별 포인트 조회에 실패했습니다'
    });
  }
});

// 사용자의 모든 매장별 포인트 정보 조회
router.get('/user/:userId/all-points', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`💰 사용자 ${userId} 전체 매장별 포인트 조회`);

    const result = await pool.query(`
      SELECT 
        uss.store_id,
        uss.points,
        uss.total_spent,
        uss.visit_count,
        uss.last_visit_at,
        s.name as store_name,
        s.category as store_category
      FROM user_store_stats uss
      JOIN stores s ON uss.store_id = s.id
      WHERE uss.user_id = $1 AND uss.points > 0
      ORDER BY uss.points DESC
    `, [userId]);

    const storePoints = result.rows.map(row => ({
      storeId: row.store_id,
      storeName: row.store_name,
      storeCategory: row.store_category,
      points: row.points || 0,
      totalSpent: parseFloat(row.total_spent) || 0,
      visitCount: row.visit_count || 0,
      lastVisitAt: row.last_visit_at
    }));

    console.log(`✅ 사용자 ${userId} 매장별 포인트 조회 완료: ${storePoints.length}개 매장`);

    res.json({
      success: true,
      userId: userId,
      storePoints: storePoints,
      totalStores: storePoints.length
    });

  } catch (error) {
    console.error('❌ 매장별 포인트 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장별 포인트 조회 실패: ' + error.message
    });
  }
});

// 사용자의 특정 매장 단골 정보 조회
router.get('/user/:userId/store/:storeId', async (req, res) => {
  try {
    const { userId, storeId } = req.params;

    console.log(`👤 사용자 ${userId} 매장 ${storeId} 단골 정보 조회`);

    const result = await pool.query(`
      SELECT 
        uss.user_id,
        uss.store_id,
        uss.points, 
        uss.total_spent, 
        uss.visit_count, 
        uss.last_visit_at, 
        uss.current_level_at, 
        uss.current_level_id,
        rl.id as current_level_id, 
        rl.level_rank as current_level_rank, 
        rl.name as current_level_name, 
        rl.description as current_level_description, 
        rl.benefits,
        rl.required_points, 
        rl.required_total_spent, 
        rl.required_visit_count, 
        rl.eval_policy
      FROM user_store_stats uss
      LEFT JOIN regular_levels rl ON uss.current_level_id = rl.id
      WHERE uss.user_id = $1 AND uss.store_id = $2
    `, [userId, storeId]);

    console.log(`🔍 조회된 통계 데이터 (비정규화):`, result.rows[0]);

    let userStats = null;
    if (result.rows.length > 0) {
      const row = result.rows[0];

      // 현재 레벨이 있는 경우 (비정규화된 데이터 사용)
      if (row.current_level_rank > 0) {
        const points = row.points || 0;
        const totalSpent = parseFloat(row.total_spent) || 0;
        const visitCount = row.visit_count || 0;
        const requiredPoints = row.required_points || 0;
        const requiredSpent = parseFloat(row.required_total_spent) || 0;
        const requiredVisits = row.required_visit_count || 0;
        const evalPolicy = row.eval_policy || 'OR';

        console.log(`🔍 레벨 조건 검증 (비정규화):`);
        console.log(`   현재 레벨: ${row.current_level_name} (랭크 ${row.current_level_rank})`);
        console.log(`   사용자 현황: 포인트 ${points}, 결제 ${totalSpent}, 방문 ${visitCount}`);
        console.log(`   필요 조건: 포인트 ${requiredPoints}, 결제 ${requiredSpent}, 방문 ${requiredVisits}`);
        console.log(`   평가 정책: ${evalPolicy}`);

        let meetsCondition = false;
        if (evalPolicy === 'OR') {
          meetsCondition = points >= requiredPoints || totalSpent >= requiredSpent || visitCount >= requiredVisits;
        } else {
          meetsCondition = points >= requiredPoints && totalSpent >= requiredSpent && visitCount >= requiredVisits;
        }

        console.log(`   조건 만족 여부: ${meetsCondition ? '✅ 만족' : '❌ 불만족'}`);

        if (!meetsCondition) {
          console.log(`⚠️ 경고: 현재 레벨 ${row.current_level_name}의 조건을 만족하지 않습니다!`);
        }
      }

      userStats = {
        points: row.points || 0,
        totalSpent: parseFloat(row.total_spent) || 0,
        visitCount: row.visit_count || 0,
        lastVisitAt: row.last_visit_at,
        currentLevel: row.current_level_rank > 0 ? {
          id: row.current_level_id,
          rank: row.current_level_rank,
          name: row.current_level_name,
          description: row.current_level_description,
          benefits: row.benefits,
          achievedAt: row.current_level_at
        } : null
      };
    }

    // 현재 사용자의 레벨 랭크 조회 (신규 고객인 경우 0으로 처리)
    const currentLevelRank = userStats && userStats.currentLevel ? userStats.currentLevel.rank : 0;
    console.log(`📊 현재 사용자 레벨 랭크: ${currentLevelRank} (${currentLevelRank === 0 ? '신규 고객' : '기존 레벨'})`);

    // 다음 레벨 정보 조회 
    // 신규 고객(랭크 0)인 경우 가장 낮은 랭크(1)부터, 기존 레벨이 있는 경우 현재 랭크보다 높은 레벨
    let nextLevelResult;
    if (currentLevelRank === 0) {
      // 신규 고객: 가장 낮은 랭크의 레벨 조회
      nextLevelResult = await pool.query(`
        SELECT id, level_rank, name, description, required_points, required_total_spent, required_visit_count, eval_policy, benefits
        FROM regular_levels
        WHERE store_id = $1 AND is_active = true
        ORDER BY level_rank ASC
        LIMIT 1
      `, [storeId]);
    } else {
      // 기존 레벨 고객: 현재 랭크보다 높은 다음 레벨 조회
      nextLevelResult = await pool.query(`
        SELECT id, level_rank, name, description, required_points, required_total_spent, required_visit_count, eval_policy, benefits
        FROM regular_levels
        WHERE store_id = $1 AND is_active = true AND level_rank > $2
        ORDER BY level_rank ASC
        LIMIT 1
      `, [storeId, currentLevelRank]);
    }

    console.log(`🔍 다음 레벨 조회 결과: ${nextLevelResult.rows.length}개 발견 (${currentLevelRank === 0 ? '신규 고객용 첫 레벨' : `현재 랭크 ${currentLevelRank} 이후`})`);

    let nextLevel = null;
    if (nextLevelResult.rows.length > 0) {
      const next = nextLevelResult.rows[0];
      nextLevel = {
        id: next.id,
        rank: next.level_rank,
        name: next.name,
        description: next.description,
        requiredPoints: next.required_points || 0,
        requiredTotalSpent: parseFloat(next.required_total_spent) || 0,
        requiredVisitCount: next.required_visit_count || 0,
        evalPolicy: next.eval_policy || 'OR',
        benefits: next.benefits || []
      };
      console.log(`✅ 다음 레벨 발견: ${next.name} (랭크 ${next.level_rank})`);
      console.log(`📋 다음 레벨 조건: 포인트 ${nextLevel.requiredPoints}, 결제 ${nextLevel.requiredTotalSpent}, 방문 ${nextLevel.requiredVisitCount}, 정책 ${nextLevel.evalPolicy}`);
    } else {
      console.log(`ℹ️ 다음 레벨 없음 - 최고 등급 도달 또는 레벨 시스템 미설정`);
    }

    console.log(`✅ 사용자 ${userId} 매장 ${storeId} 단골 정보 조회 완료`);

    res.json({
      success: true,
      userId: userId,
      storeId: parseInt(storeId),
      userStats: userStats,
      nextLevel: nextLevel
    });

  } catch (error) {
    console.error('❌ 사용자 단골 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '사용자 단골 정보 조회 실패: ' + error.message
    });
  }
});

// 사용자의 모든 매장 단골 정보 조회
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`👤 사용자 ${userId} 전체 단골 정보 조회`);

    const result = await pool.query(`
      SELECT 
        uss.store_id, s.name as store_name, s.category,
        uss.points, uss.total_spent, uss.visit_count, 
        uss.last_visit_at, uss.current_level_at, uss.current_level_id,
        rl.level_rank, rl.name as level_name, rl.benefits, rl.description
      FROM user_store_stats uss
      LEFT JOIN stores s ON uss.store_id = s.id
      LEFT JOIN regular_levels rl ON uss.current_level_id = rl.id
      WHERE uss.user_id = $1
      ORDER BY uss.total_spent DESC, uss.visit_count DESC
      LIMIT $2
    `, [userId, limit]);

    // 각 매장별로 다음 레벨 정보 조회
    const userRegularStores = await Promise.all(result.rows.map(async (row) => {
      const currentLevelRank = row.level_rank || 0;

      // 다음 레벨 정보 조회
      const nextLevelResult = await pool.query(`
        SELECT id, level_rank, name, required_points, required_total_spent, required_visit_count, eval_policy
        FROM regular_levels
        WHERE store_id = $1 AND is_active = true AND level_rank > $2
        ORDER BY level_rank ASC
        LIMIT 1
      `, [row.store_id, currentLevelRank]);

      let nextLevel = null;
      if (nextLevelResult.rows.length > 0) {
        const next = nextLevelResult.rows[0];
        nextLevel = {
          id: next.id,
          rank: next.level_rank,
          name: next.name,
          requiredPoints: next.required_points || 0,
          requiredTotalSpent: parseFloat(next.required_total_spent) || 0,
          requiredVisitCount: next.required_visit_count || 0,
          evalPolicy: next.eval_policy || 'OR'
        };
      }

      return {
        storeId: row.store_id,
        storeName: row.store_name,
        category: row.category,
        points: row.points || 0,
        totalSpent: parseFloat(row.total_spent) || 0,
        visitCount: row.visit_count || 0,
        lastVisitAt: row.last_visit_at,
        currentLevel: row.level_rank ? {
          id: row.current_level_id,
          rank: row.level_rank,
          name: row.level_name,
          description: row.description,
          benefits: row.benefits,
          achievedAt: row.current_level_at
        } : null,
        nextLevel: nextLevel
      };
    }));

    console.log(`✅ 사용자 ${userId} 단골 매장 ${userRegularStores.length}개 조회 완료`);

    res.json({
      success: true,
      userId: userId,
      regularStores: userRegularStores,
      totalCount: userRegularStores.length
    });

  } catch (error) {
    console.error('❌ 사용자 전체 단골 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '사용자 전체 단골 정보 조회 실패: ' + error.message
    });
  }
});

// 사용자의 레벨 변경 이력 조회
router.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    console.log(`📋 사용자 ${userId} 단골 레벨 변경 이력 조회`);

    const result = await pool.query(`
      SELECT 
        rlh.store_id, s.name as store_name,
        from_rl.name as from_level_name, from_rl.level_rank as from_rank,
        to_rl.name as to_level_name, to_rl.level_rank as to_rank,
        rlh.reason, rlh.changed_at
      FROM regular_level_history rlh
      LEFT JOIN stores s ON rlh.store_id = s.id
      LEFT JOIN regular_levels from_rl ON rlh.from_level_id = from_rl.id
      LEFT JOIN regular_levels to_rl ON rlh.to_level_id = to_rl.id
      WHERE rlh.user_id = $1
      ORDER BY rlh.changed_at DESC
      LIMIT $2
    `, [userId, limit]);

    const levelHistory = result.rows.map(row => ({
      storeId: row.store_id,
      storeName: row.store_name,
      fromLevel: row.from_rank ? {
        rank: row.from_rank,
        name: row.from_level_name
      } : null,
      toLevel: row.to_rank ? {
        rank: row.to_rank,
        name: row.to_level_name
      } : null,
      reason: row.reason,
      changedAt: row.changed_at
    }));

    console.log(`✅ 사용자 ${userId} 레벨 변경 이력 ${levelHistory.length}개 조회 완료`);

    res.json({
      success: true,
      userId: userId,
      history: levelHistory,
      totalCount: levelHistory.length
    });

  } catch (error) {
    console.error('❌ 사용자 레벨 변경 이력 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '레벨 변경 이력 조회 실패: ' + error.message
    });
  }
});

// 사용자의 미사용 혜택 조회
router.get('/user/:userId/benefits', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🎁 사용자 ${userId} 단골 혜택 조회`);

    const result = await pool.query(`
      SELECT 
        rlbi.id, rlbi.store_id, s.name as store_name,
        rlbi.benefit_type, rlbi.benefit_data, 
        rlbi.issued_at, rlbi.expires_at,
        rl.name as level_name, rl.level_rank
      FROM regular_level_benefit_issues rlbi
      LEFT JOIN stores s ON rlbi.store_id = s.id
      LEFT JOIN regular_levels rl ON rlbi.level_id = rl.id
      WHERE rlbi.user_id = $1 AND rlbi.is_used = false
      AND (rlbi.expires_at IS NULL OR rlbi.expires_at > CURRENT_TIMESTAMP)
      ORDER BY rlbi.issued_at DESC
    `, [userId]);

    const availableBenefits = result.rows.map(row => ({
      id: row.id,
      storeId: row.store_id,
      storeName: row.store_name,
      benefitType: row.benefit_type,
      benefitData: row.benefit_data,
      issuedAt: row.issued_at,
      expiresAt: row.expires_at,
      levelName: row.level_name,
      levelRank: row.level_rank
    }));

    console.log(`✅ 사용자 ${userId} 미사용 혜택 ${availableBenefits.length}개 조회 완료`);

    res.json({
      success: true,
      userId: userId,
      benefits: availableBenefits,
      totalCount: availableBenefits.length
    });

  } catch (error) {
    console.error('❌ 사용자 혜택 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '사용자 혜택 조회 실패: ' + error.message
    });
  }
});

// 혜택 사용 처리
router.put('/benefits/:benefitId/use', async (req, res) => {
  try {
    const { benefitId } = req.params;
    const { userId } = req.body;

    console.log(`🎁 혜택 ${benefitId} 사용 처리 (사용자: ${userId})`);

    const result = await pool.query(`
      UPDATE regular_level_benefit_issues
      SET is_used = true, used_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND is_used = false
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      RETURNING *
    `, [benefitId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용 가능한 혜택을 찾을 수 없습니다'
      });
    }

    console.log(`✅ 혜택 ${benefitId} 사용 처리 완료`);

    res.json({
      success: true,
      message: '혜택이 사용 처리되었습니다',
      benefit: result.rows[0]
    });

  } catch (error) {
    console.error('❌ 혜택 사용 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '혜택 사용 처리 실패: ' + error.message
    });
  }
});

// 단골 지표 수동 업데이트 (관리자용)
router.post('/user/:userId/store/:storeId/update', async (req, res) => {
  try {
    const { userId, storeId } = req.params;
    const { orderTotal, orderDate } = req.body;

    console.log(`🔧 단골 지표 수동 업데이트: 사용자 ${userId}, 매장 ${storeId}`);

    await pool.query(
      'SELECT update_user_store_stats($1, $2, $3, $4)',
      [userId, parseInt(storeId), orderTotal, orderDate || new Date()]
    );

    console.log(`✅ 단골 지표 수동 업데이트 완료`);

    res.json({
      success: true,
      message: '단골 지표가 업데이트되었습니다'
    });

  } catch (error) {
    console.error('❌ 단골 지표 수동 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: '단골 지표 업데이트 실패: ' + error.message
    });
  }
});

// 단골 레벨 시작 (신규 고객을 첫 번째 레벨로 승급)
router.post('/start-loyalty', async (req, res) => {
  try {
    const { userId, storeId, levelId } = req.body;

    console.log(`🚀 단골 레벨 시작 요청: 사용자 ${userId}, 매장 ${storeId}, 레벨 ${levelId}`);

    // 입력 값 검증
    if (!userId || !storeId || !levelId) {
      return res.status(400).json({
        success: false,
        error: '필수 파라미터가 누락되었습니다'
      });
    }

    // 해당 레벨이 존재하고 활성화되어 있는지 확인
    const levelResult = await pool.query(`
      SELECT id, level_rank, name, description, benefits
      FROM regular_levels
      WHERE id = $1 AND store_id = $2 AND is_active = true
    `, [levelId, storeId]);

    if (levelResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '유효하지 않은 레벨입니다'
      });
    }

    const level = levelResult.rows[0];

    // 사용자의 현재 매장별 통계 확인
    const statsResult = await pool.query(`
      SELECT current_level_id, points, total_spent, visit_count
      FROM user_store_stats
      WHERE user_id = $1 AND store_id = $2
    `, [userId, storeId]);

    if (statsResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: '해당 매장에 방문 기록이 없습니다'
      });
    }

    const userStats = statsResult.rows[0];

    // 이미 레벨이 있는지 확인
    if (userStats.current_level_id) {
      return res.status(400).json({
        success: false,
        error: '이미 단골 레벨이 설정되어 있습니다'
      });
    }

    // 첫 번째 레벨(rank 1)인지 확인
    if (level.level_rank !== 1) {
      return res.status(400).json({
        success: false,
        error: '첫 번째 레벨만 시작할 수 있습니다'
      });
    }

    // 트랜잭션 시작
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 사용자 통계 업데이트 (레벨 설정)
      await client.query(`
        UPDATE user_store_stats
        SET current_level_id = $1, current_level_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND store_id = $3
      `, [levelId, userId, storeId]);

      // 레벨 변경 이력 기록
      await client.query(`
        INSERT INTO regular_level_history (user_id, store_id, from_level_id, to_level_id, reason, changed_at)
        VALUES ($1, $2, NULL, $3, 'manual_start', CURRENT_TIMESTAMP)
      `, [userId, storeId, levelId]);

      // 레벨 혜택 발급 (있는 경우)
      if (level.benefits && level.benefits.length > 0) {
        for (const benefit of level.benefits) {
          let expiresAt = null;
          if (benefit.expires_days) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + benefit.expires_days);
          }

          await client.query(`
            INSERT INTO regular_level_benefit_issues (
              user_id, store_id, level_id, benefit_type, benefit_data, 
              expires_at, issued_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [
            userId, 
            storeId, 
            levelId,
            benefit.type || 'loyalty_coupon',
            JSON.stringify(benefit),
            expiresAt
          ]);
        }
      }

      await client.query('COMMIT');
      console.log(`✅ 단골 레벨 시작 완료: 사용자 ${userId} → ${level.name} 등급`);

      res.json({
        success: true,
        message: '단골 레벨이 시작되었습니다',
        levelId: levelId,
        levelName: level.name,
        levelRank: level.level_rank,
        benefits: level.benefits
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ 단골 레벨 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: '단골 레벨 시작 실패: ' + error.message
    });
  }
});

module.exports = router;