
const pool = require('../../shared/config/database');

async function syncFavoriteCounts() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 favorite_count 실제 데이터 동기화 시작...');
    
    // 1. 현재 불일치 상황 확인
    console.log('📊 1단계: 불일치 데이터 확인...');
    const mismatchQuery = await client.query(`
      SELECT 
        s.id, s.name, s.favorite_count, COUNT(f.store_id) as actual_favorites
      FROM stores s 
      LEFT JOIN favorites f ON s.id = f.store_id 
      GROUP BY s.id, s.name, s.favorite_count
      HAVING s.favorite_count != COUNT(f.store_id)
      ORDER BY s.id
    `);
    
    console.log(`⚠️ 불일치하는 매장: ${mismatchQuery.rows.length}개`);
    
    if (mismatchQuery.rows.length > 0) {
      console.log('📋 불일치 매장 목록:');
      mismatchQuery.rows.forEach(row => {
        console.log(`   🏪 ID ${row.id} (${row.name}): 저장됨 ${row.favorite_count} vs 실제 ${row.actual_favorites}`);
      });
    }
    
    // 2. 모든 매장의 favorite_count 동기화
    console.log('\n🔄 2단계: 모든 매장 favorite_count 동기화...');
    
    const updateResult = await client.query(`
      UPDATE stores 
      SET favorite_count = COALESCE(fav_counts.actual_count, 0)
      FROM (
        SELECT store_id, COUNT(*) as actual_count 
        FROM favorites 
        GROUP BY store_id
      ) as fav_counts
      WHERE stores.id = fav_counts.store_id
    `);
    
    console.log(`✅ 즐겨찾기가 있는 매장 업데이트: ${updateResult.rowCount}개`);
    
    // 3. 즐겨찾기가 없는 매장들을 0으로 설정
    const zeroUpdateResult = await client.query(`
      UPDATE stores 
      SET favorite_count = 0
      WHERE id NOT IN (SELECT DISTINCT store_id FROM favorites)
      AND favorite_count != 0
    `);
    
    console.log(`✅ 즐겨찾기가 없는 매장을 0으로 설정: ${zeroUpdateResult.rowCount}개`);
    
    // 4. 동기화 후 검증
    console.log('\n🔍 3단계: 동기화 후 검증...');
    
    const afterSyncCheck = await client.query(`
      SELECT 
        s.id, s.name, s.favorite_count, COUNT(f.store_id) as actual_favorites
      FROM stores s 
      LEFT JOIN favorites f ON s.id = f.store_id 
      GROUP BY s.id, s.name, s.favorite_count
      HAVING s.favorite_count != COUNT(f.store_id)
      ORDER BY s.id
      LIMIT 5
    `);
    
    if (afterSyncCheck.rows.length === 0) {
      console.log('✅ 모든 매장의 favorite_count가 정확히 동기화되었습니다!');
    } else {
      console.log(`⚠️ 아직 ${afterSyncCheck.rows.length}개 매장에 불일치가 남아있습니다:`);
      afterSyncCheck.rows.forEach(row => {
        console.log(`   🏪 ID ${row.id} (${row.name}): 저장됨 ${row.favorite_count} vs 실제 ${row.actual_favorites}`);
      });
    }
    
    // 5. 통계 출력
    const statsQuery = await client.query(`
      SELECT 
        COUNT(*) as total_stores,
        COUNT(CASE WHEN favorite_count > 0 THEN 1 END) as stores_with_favorites,
        MAX(favorite_count) as max_favorites,
        SUM(favorite_count) as total_favorites
      FROM stores
    `);
    
    const stats = statsQuery.rows[0];
    console.log(`\n📊 동기화 완료 통계:`);
    console.log(`   🏪 전체 매장 수: ${stats.total_stores}개`);
    console.log(`   ❤️ 즐겨찾기가 있는 매장: ${stats.stores_with_favorites}개`);
    console.log(`   🏆 최대 즐겨찾기 수: ${stats.max_favorites}개`);
    console.log(`   📈 총 즐겨찾기 수: ${stats.total_favorites}개`);
    
    console.log('\n🎉 favorite_count 동기화 완료!');
    
  } catch (error) {
    console.error('❌ favorite_count 동기화 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  syncFavoriteCounts()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { syncFavoriteCounts };
