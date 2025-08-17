
const pool = require('../../shared/config/database');

async function fixRegularLevelIssues() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 단골 레벨 시스템 문제 해결 시작...');
    
    // 1. regular_level_history 테이블의 reason 제약조건 확인 및 수정
    console.log('📋 reason 제약조건 확인 중...');
    
    const constraintResult = await client.query(`
      SELECT constraint_name, check_clause 
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'regular_level_history_reason_check'
    `);
    
    if (constraintResult.rows.length > 0) {
      console.log('🔧 기존 reason 제약조건 제거 중...');
      await client.query(`
        ALTER TABLE regular_level_history 
        DROP CONSTRAINT IF EXISTS regular_level_history_reason_check
      `);
    }
    
    // 새로운 reason 제약조건 추가
    console.log('✅ 새로운 reason 제약조건 추가 중...');
    await client.query(`
      ALTER TABLE regular_level_history 
      ADD CONSTRAINT regular_level_history_reason_check 
      CHECK (reason IN ('auto_promotion', 'manual_start', 'manual_promotion', 'manual_demotion', 'system', 'purchase'))
    `);
    
    // 2. 현재 잘못된 레벨 데이터 정리
    console.log('🔍 레벨 조건 불만족 데이터 확인 중...');
    
    const incorrectLevels = await client.query(`
      SELECT 
        uss.user_id, uss.store_id, uss.points, uss.total_spent, uss.visit_count,
        rl.id as current_level_id, rl.name as current_level_name, rl.level_rank,
        rl.required_points, rl.required_total_spent, rl.required_visit_count, rl.eval_policy
      FROM user_store_stats uss
      JOIN regular_levels rl ON uss.current_level_id = rl.id
      WHERE uss.current_level_id IS NOT NULL
    `);
    
    let fixedCount = 0;
    let reassignedCount = 0;
    
    for (const row of incorrectLevels.rows) {
      const points = row.points || 0;
      const totalSpent = parseFloat(row.total_spent) || 0;
      const visitCount = row.visit_count || 0;
      
      const requiredPoints = row.required_points || 0;
      const requiredSpent = parseFloat(row.required_total_spent) || 0;
      const requiredVisits = row.required_visit_count || 0;
      const evalPolicy = row.eval_policy || 'OR';
      
      let meetsCondition = false;
      if (evalPolicy === 'OR') {
        meetsCondition = points >= requiredPoints || totalSpent >= requiredSpent || visitCount >= requiredVisits;
      } else {
        meetsCondition = points >= requiredPoints && totalSpent >= requiredSpent && visitCount >= requiredVisits;
      }
      
      if (!meetsCondition) {
        console.log(`❌ 조건 불만족: 사용자 ${row.user_id}, 매장 ${row.store_id}, 레벨 ${row.current_level_name}`);
        console.log(`   현재: P${points}, S${totalSpent}, V${visitCount} | 필요: P${requiredPoints}, S${requiredSpent}, V${requiredVisits} (${evalPolicy})`);
        
        // 올바른 레벨 재계산
        const correctLevelResult = await client.query(`
          SELECT calculate_regular_level($1, $2, $3, $4, $5) as correct_level_id
        `, [row.user_id, row.store_id, points, totalSpent, visitCount]);
        
        const correctLevelId = correctLevelResult.rows[0]?.correct_level_id;
        
        if (correctLevelId !== row.current_level_id) {
          await client.query(`
            UPDATE user_store_stats 
            SET current_level_id = $1, current_level_at = CURRENT_TIMESTAMP
            WHERE user_id = $2 AND store_id = $3
          `, [correctLevelId, row.user_id, row.store_id]);
          
          reassignedCount++;
          console.log(`✅ 레벨 재할당: ${row.current_level_name} → ${correctLevelId ? '올바른 레벨' : '신규고객'}`);
        }
        
        fixedCount++;
      }
    }
    
    // 3. NULL 레벨을 가진 사용자들의 레벨 재계산
    console.log('🔄 NULL 레벨 사용자들 레벨 재계산 중...');
    
    const nullLevelUsers = await client.query(`
      SELECT user_id, store_id, points, total_spent, visit_count
      FROM user_store_stats 
      WHERE current_level_id IS NULL 
      AND (points > 0 OR total_spent > 0 OR visit_count > 0)
    `);
    
    let nullFixed = 0;
    for (const row of nullLevelUsers.rows) {
      const correctLevelResult = await client.query(`
        SELECT calculate_regular_level($1, $2, $3, $4, $5) as correct_level_id
      `, [row.user_id, row.store_id, row.points || 0, row.total_spent || 0, row.visit_count || 0]);
      
      const correctLevelId = correctLevelResult.rows[0]?.correct_level_id;
      
      if (correctLevelId) {
        await client.query(`
          UPDATE user_store_stats 
          SET current_level_id = $1, current_level_at = CURRENT_TIMESTAMP
          WHERE user_id = $2 AND store_id = $3
        `, [correctLevelId, row.user_id, row.store_id]);
        
        nullFixed++;
        console.log(`✅ NULL 레벨 수정: 사용자 ${row.user_id}, 매장 ${row.store_id} → 레벨 ${correctLevelId}`);
      }
    }
    
    // 4. 테스트: user1의 치킨천국 데이터 강제 업데이트
    console.log('🧪 user1 치킨천국 데이터 테스트 업데이트...');
    
    await client.query(`
      UPDATE user_store_stats 
      SET visit_count = visit_count + 0
      WHERE user_id = 'user1' AND store_id = 1
    `);
    
    const testResult = await client.query(`
      SELECT current_level_id, points, total_spent, visit_count
      FROM user_store_stats 
      WHERE user_id = 'user1' AND store_id = 1
    `);
    
    console.log('🔍 user1 치킨천국 최종 상태:', testResult.rows[0]);
    
    console.log('🎉 단골 레벨 시스템 문제 해결 완료!');
    console.log(`📊 수정 결과:`);
    console.log(`   - 조건 불만족 레벨: ${fixedCount}개 확인`);
    console.log(`   - 레벨 재할당: ${reassignedCount}개`);
    console.log(`   - NULL 레벨 수정: ${nullFixed}개`);
    
  } catch (error) {
    console.error('❌ 단골 레벨 문제 해결 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 직접 실행
if (require.main === module) {
  fixRegularLevelIssues()
    .then(() => {
      console.log('✅ 단골 레벨 문제 해결 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = fixRegularLevelIssues;
