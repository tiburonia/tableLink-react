
const pool = require('../../shared/config/database');

async function addRegularLevelDummyData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🎲 단골 레벨 시스템 더미 데이터 생성 시작...');
    
    // 1. 기존 매장들 조회 (1-24번 매장)
    const storesResult = await client.query('SELECT id FROM stores WHERE id <= 24 ORDER BY id');
    const stores = storesResult.rows;
    
    if (stores.length === 0) {
      console.log('❌ 매장 데이터가 없습니다.');
      return;
    }
    
    // 2. 기존 사용자들 조회
    const usersResult = await client.query(`
      SELECT id FROM users 
      WHERE id IN ('12', 'user001', 'user002', 'user003', 'user004', 'user005')
    `);
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.log('❌ 사용자 데이터가 없습니다.');
      return;
    }
    
    console.log(`📊 매장 수: ${stores.length}개, 사용자 수: ${users.length}개`);
    
    // 3. 각 사용자별로 랜덤한 매장들에 단골 통계 생성
    let statsCreated = 0;
    let historyCreated = 0;
    let benefitsIssued = 0;
    
    for (const user of users) {
      // 각 사용자가 방문할 매장 수 (3-8개 랜덤)
      const visitStoreCount = Math.floor(Math.random() * 6) + 3;
      const shuffledStores = [...stores].sort(() => Math.random() - 0.5).slice(0, visitStoreCount);
      
      console.log(`👤 사용자 ${user.id}: ${visitStoreCount}개 매장 방문 데이터 생성`);
      
      for (const store of shuffledStores) {
        // 랜덤한 단골 통계 생성
        const points = Math.floor(Math.random() * 2000); // 0-2000 포인트
        const totalSpent = Math.floor(Math.random() * 1000000); // 0-100만원
        const visitCount = Math.floor(Math.random() * 50) + 1; // 1-50회 방문
        
        // 마지막 방문일 (최근 6개월 내)
        const lastVisitAt = new Date();
        lastVisitAt.setDate(lastVisitAt.getDate() - Math.floor(Math.random() * 180));
        
        // 현재 레벨 계산
        const levelResult = await client.query(`
          SELECT calculate_regular_level($1, $2, $3, $4, $5) as level_id
        `, [user.id, store.id, points, totalSpent, visitCount]);
        
        const currentLevelId = levelResult.rows[0].level_id;
        const currentLevelAt = currentLevelId ? lastVisitAt : null;
        
        // user_store_stats 삽입
        await client.query(`
          INSERT INTO user_store_stats (
            user_id, store_id, points, total_spent, visit_count,
            last_visit_at, current_level_id, current_level_at,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (user_id, store_id) DO NOTHING
        `, [
          user.id, store.id, points, totalSpent, visitCount,
          lastVisitAt, currentLevelId, currentLevelAt,
          lastVisitAt, lastVisitAt
        ]);
        
        statsCreated++;
        
        // 4. 레벨 변경 이력 생성 (현재 레벨이 있는 경우)
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
          
          for (let i = 0; i < levelHistory.length; i++) {
            const fromLevelId = i === 0 ? null : levelHistory[i - 1].id;
            const toLevelId = levelHistory[i].id;
            
            // 레벨업 날짜 (시간 간격을 두고)
            const levelUpDate = new Date(lastVisitAt);
            levelUpDate.setDate(levelUpDate.getDate() - (levelHistory.length - i) * 10);
            
            await client.query(`
              INSERT INTO regular_level_history (
                user_id, store_id, from_level_id, to_level_id, reason, changed_at
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [user.id, store.id, fromLevelId, toLevelId, 'system', levelUpDate]);
            
            historyCreated++;
            
            // 5. 레벨별 혜택 발급 (50% 확률로)
            if (Math.random() > 0.5) {
              const levelResult = await client.query(`
                SELECT benefits FROM regular_levels WHERE id = $1
              `, [toLevelId]);
              
              const benefits = levelResult.rows[0]?.benefits;
              if (benefits && Array.isArray(benefits)) {
                for (const benefit of benefits) {
                  const expiresAt = benefit.expires_days ? 
                    new Date(levelUpDate.getTime() + benefit.expires_days * 24 * 60 * 60 * 1000) : 
                    null;
                  
                  const isUsed = Math.random() > 0.7; // 30% 확률로 사용됨
                  const usedAt = isUsed ? 
                    new Date(levelUpDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : 
                    null;
                  
                  await client.query(`
                    INSERT INTO regular_level_benefit_issues (
                      user_id, store_id, level_id, benefit_type, benefit_data,
                      issued_at, used_at, expires_at, is_used
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                  `, [
                    user.id, store.id, toLevelId, benefit.type, benefit,
                    levelUpDate, usedAt, expiresAt, isUsed
                  ]);
                  
                  benefitsIssued++;
                }
              }
            }
          }
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('🎉 단골 레벨 더미 데이터 생성 완료!');
    console.log(`📊 생성된 데이터:`);
    console.log(`   - 단골 통계: ${statsCreated}개`);
    console.log(`   - 레벨 이력: ${historyCreated}개`);
    console.log(`   - 혜택 발급: ${benefitsIssued}개`);
    
    // 6. 결과 요약 출력
    const summaryResult = await client.query(`
      SELECT 
        COUNT(*) as total_stats,
        COUNT(CASE WHEN current_level_id IS NOT NULL THEN 1 END) as users_with_level,
        AVG(points) as avg_points,
        AVG(total_spent) as avg_spent,
        AVG(visit_count) as avg_visits
      FROM user_store_stats
    `);
    
    const summary = summaryResult.rows[0];
    console.log(`📈 전체 통계 요약:`);
    console.log(`   - 총 단골 관계: ${summary.total_stats}개`);
    console.log(`   - 레벨 보유 사용자: ${summary.users_with_level}개`);
    console.log(`   - 평균 포인트: ${Math.round(summary.avg_points)}점`);
    console.log(`   - 평균 누적 결제: ${Math.round(summary.avg_spent).toLocaleString()}원`);
    console.log(`   - 평균 방문 횟수: ${Math.round(summary.avg_visits)}회`);
    
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
  addRegularLevelDummyData()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = addRegularLevelDummyData;
