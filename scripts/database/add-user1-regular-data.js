
const pool = require('../../shared/config/database');

async function addUser1RegularData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🎲 user1의 단골 레벨 시스템 더미 데이터 생성 시작...');
    
    // 1. 모든 매장 조회
    const storesResult = await client.query('SELECT id, name FROM stores ORDER BY id');
    const stores = storesResult.rows;
    
    if (stores.length === 0) {
      console.log('❌ 매장 데이터가 없습니다.');
      return;
    }
    
    console.log(`📊 처리할 매장 수: ${stores.length}개`);
    
    // 2. user1 존재 확인
    const userResult = await client.query('SELECT id FROM users WHERE id = $1', ['user1']);
    if (userResult.rows.length === 0) {
      console.log('❌ user1이 존재하지 않습니다.');
      return;
    }
    
    // 3. 기존 user1 데이터 완전 삭제
    console.log('🧹 기존 user1 단골 데이터 정리 중...');
    
    // 기존 혜택 발급 기록 삭제
    const deletedBenefits = await client.query(`
      DELETE FROM regular_level_benefit_issues WHERE user_id = 'user1'
    `);
    console.log(`   - 기존 혜택 발급 기록: ${deletedBenefits.rowCount}개 삭제`);
    
    // 기존 레벨 변경 이력 삭제
    const deletedHistory = await client.query(`
      DELETE FROM regular_level_history WHERE user_id = 'user1'
    `);
    console.log(`   - 기존 레벨 변경 이력: ${deletedHistory.rowCount}개 삭제`);
    
    // 기존 단골 통계 삭제
    const deletedStats = await client.query(`
      DELETE FROM user_store_stats WHERE user_id = 'user1'
    `);
    console.log(`   - 기존 단골 통계: ${deletedStats.rowCount}개 삭제`);
    
    let statsCreated = 0;
    let historyCreated = 0;
    let benefitsIssued = 0;
    
    console.log(`👤 user1의 ${stores.length}개 매장 단골 데이터 생성 시작`);
    
    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];
      
      // 랜덤한 단골 통계 생성 (더 현실적인 분포)
      const visitProbability = Math.random();
      
      let points, totalSpent, visitCount;
      
      if (visitProbability < 0.3) {
        // 30% - 신규/가끔 방문 고객
        points = Math.floor(Math.random() * 200); // 0-200 포인트
        totalSpent = Math.floor(Math.random() * 50000); // 0-5만원
        visitCount = Math.floor(Math.random() * 5) + 1; // 1-5회 방문
      } else if (visitProbability < 0.6) {
        // 30% - 일반 고객
        points = Math.floor(Math.random() * 500) + 100; // 100-600 포인트
        totalSpent = Math.floor(Math.random() * 200000) + 30000; // 3-23만원
        visitCount = Math.floor(Math.random() * 15) + 5; // 5-20회 방문
      } else if (visitProbability < 0.85) {
        // 25% - 단골 고객
        points = Math.floor(Math.random() * 800) + 400; // 400-1200 포인트
        totalSpent = Math.floor(Math.random() * 500000) + 150000; // 15-65만원
        visitCount = Math.floor(Math.random() * 25) + 15; // 15-40회 방문
      } else {
        // 15% - VIP 고객
        points = Math.floor(Math.random() * 1500) + 800; // 800-2300 포인트
        totalSpent = Math.floor(Math.random() * 1000000) + 400000; // 40-140만원
        visitCount = Math.floor(Math.random() * 50) + 30; // 30-80회 방문
      }
      
      // 마지막 방문일 (최근 6개월 내, 방문 횟수에 따라 더 최근)
      const daysAgo = visitCount > 20 ? 
        Math.floor(Math.random() * 30) + 1 : // VIP는 최근 30일 내
        Math.floor(Math.random() * 180) + 1; // 일반은 6개월 내
      
      const lastVisitAt = new Date();
      lastVisitAt.setDate(lastVisitAt.getDate() - daysAgo);
      
      try {
        // 현재 레벨 계산
        const levelResult = await client.query(`
          SELECT calculate_regular_level($1, $2, $3, $4, $5) as level_id
        `, ['user1', store.id, points, totalSpent, visitCount]);
        
        const currentLevelId = levelResult.rows[0].level_id;
        const currentLevelAt = currentLevelId ? lastVisitAt : null;
        
        // user_store_stats 삽입
        await client.query(`
          INSERT INTO user_store_stats (
            user_id, store_id, points, total_spent, visit_count,
            last_visit_at, current_level_id, current_level_at,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          'user1', store.id, points, totalSpent, visitCount,
          lastVisitAt, currentLevelId, currentLevelAt,
          lastVisitAt, lastVisitAt
        ]);
        
        statsCreated++;
        
        // 레벨 변경 이력 생성 (현재 레벨이 있는 경우)
        if (currentLevelId) {
          // 브론즈 → 현재 레벨까지의 이력 생성
          const levelHistoryResult = await client.query(`
            SELECT id, level_rank FROM regular_levels 
            WHERE store_id = $1 AND level_rank <= (
              SELECT level_rank FROM regular_levels WHERE id = $2
            )
            ORDER BY level_rank
          `, [store.id, currentLevelId]);
          
          const levelHistory = levelHistoryResult.rows;
          
          for (let j = 0; j < levelHistory.length; j++) {
            const fromLevelId = j === 0 ? null : levelHistory[j - 1].id;
            const toLevelId = levelHistory[j].id;
            
            // 레벨업 날짜 (시간 간격을 두고)
            const levelUpDate = new Date(lastVisitAt);
            levelUpDate.setDate(levelUpDate.getDate() - (levelHistory.length - j) * 15);
            
            await client.query(`
              INSERT INTO regular_level_history (
                user_id, store_id, from_level_id, to_level_id, reason, changed_at
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, ['user1', store.id, fromLevelId, toLevelId, 'system', levelUpDate]);
            
            historyCreated++;
            
            // 레벨별 혜택 발급 (60% 확률로)
            if (Math.random() > 0.4) {
              const levelResult = await client.query(`
                SELECT benefits FROM regular_levels WHERE id = $1
              `, [toLevelId]);
              
              const benefits = levelResult.rows[0]?.benefits;
              if (benefits && Array.isArray(benefits)) {
                for (const benefit of benefits) {
                  const expiresAt = benefit.expires_days ? 
                    new Date(levelUpDate.getTime() + benefit.expires_days * 24 * 60 * 60 * 1000) : 
                    null;
                  
                  const isUsed = Math.random() > 0.6; // 40% 확률로 사용됨
                  const usedAt = isUsed ? 
                    new Date(levelUpDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : 
                    null;
                  
                  await client.query(`
                    INSERT INTO regular_level_benefit_issues (
                      user_id, store_id, level_id, benefit_type, benefit_data,
                      issued_at, used_at, expires_at, is_used
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                  `, [
                    'user1', store.id, toLevelId, benefit.type, benefit,
                    levelUpDate, usedAt, expiresAt, isUsed
                  ]);
                  
                  benefitsIssued++;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ 매장 ${store.id} (${store.name}) 처리 실패:`, error.message);
        continue;
      }
      
      // 10개 배치마다 로그 출력
      if ((i + 1) % 10 === 0) {
        const progress = ((i + 1) / stores.length * 100).toFixed(1);
        console.log(`📦 배치 ${Math.ceil((i + 1) / 10)}: ${i + 1}/${stores.length} 완료 (${progress}%) - 통계: ${statsCreated}개, 이력: ${historyCreated}개, 혜택: ${benefitsIssued}개`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n🎉 user1 단골 레벨 더미 데이터 생성 완료!');
    console.log(`📊 최종 생성된 데이터:`);
    console.log(`   - 단골 통계: ${statsCreated}개`);
    console.log(`   - 레벨 이력: ${historyCreated}개`);
    console.log(`   - 혜택 발급: ${benefitsIssued}개`);
    
    // 결과 요약 출력
    const summaryResult = await client.query(`
      SELECT 
        COUNT(*) as total_stats,
        COUNT(CASE WHEN current_level_id IS NOT NULL THEN 1 END) as users_with_level,
        AVG(points) as avg_points,
        AVG(total_spent) as avg_spent,
        AVG(visit_count) as avg_visits,
        MAX(points) as max_points,
        MAX(total_spent) as max_spent,
        MAX(visit_count) as max_visits
      FROM user_store_stats
      WHERE user_id = 'user1'
    `);
    
    const summary = summaryResult.rows[0];
    console.log(`\n📈 user1 단골 통계 요약:`);
    console.log(`   - 총 단골 매장: ${summary.total_stats}개`);
    console.log(`   - 레벨 보유 매장: ${summary.users_with_level}개`);
    console.log(`   - 평균 포인트: ${Math.round(summary.avg_points)}점 (최대: ${summary.max_points}점)`);
    console.log(`   - 평균 누적 결제: ${Math.round(summary.avg_spent).toLocaleString()}원 (최대: ${Math.round(summary.max_spent).toLocaleString()}원)`);
    console.log(`   - 평균 방문 횟수: ${Math.round(summary.avg_visits)}회 (최대: ${summary.max_visits}회)`);
    
    // 레벨별 분포 확인
    const levelDistribution = await client.query(`
      SELECT 
        rl.name as level_name,
        rl.level_rank,
        COUNT(*) as count
      FROM user_store_stats uss
      JOIN regular_levels rl ON uss.current_level_id = rl.id
      WHERE uss.user_id = 'user1'
      GROUP BY rl.id, rl.name, rl.level_rank
      ORDER BY rl.level_rank
    `);
    
    console.log(`\n🏆 user1 레벨 분포:`);
    for (const level of levelDistribution.rows) {
      console.log(`   - ${level.level_name}: ${level.count}개 매장`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 더미 데이터 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  addUser1RegularData()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = addUser1RegularData;
