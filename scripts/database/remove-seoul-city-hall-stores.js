
const pool = require('../../shared/config/database');

async function removeSeoulCityHallStores() {
  try {
    console.log('🗑️ 서울시청 근방 20개 매장 삭제 시작...');
    
    // 현재 최대 매장 ID 확인
    const maxIdResult = await pool.query('SELECT MAX(id) as max_id FROM stores');
    const currentMaxId = maxIdResult.rows[0].max_id;
    
    console.log(`📊 현재 최대 매장 ID: ${currentMaxId}`);
    
    // 최근 추가된 20개 매장 ID 범위 계산 (가장 최근에 추가된 것들)
    const startId = currentMaxId - 19; // 20개 매장
    const endId = currentMaxId;
    
    console.log(`🎯 삭제 대상: ID ${startId} ~ ${endId} (20개 매장)`);
    
    // 삭제할 매장들 먼저 확인
    const storesToDelete = await pool.query(
      'SELECT id, name, address FROM stores WHERE id BETWEEN $1 AND $2 ORDER BY id',
      [startId, endId]
    );
    
    console.log(`📋 삭제할 매장 목록 (${storesToDelete.rows.length}개):`);
    storesToDelete.rows.forEach(store => {
      console.log(`  - 매장 ${store.id}: ${store.name} (${store.address})`);
    });
    
    if (storesToDelete.rows.length === 0) {
      console.log('❌ 삭제할 매장이 없습니다.');
      return;
    }
    
    // 관련 데이터 삭제 (외래키 순서에 따라)
    console.log('🔄 관련 데이터 삭제 중...');
    
    // 1. 리뷰 삭제
    const reviewsDeleted = await pool.query(
      'DELETE FROM reviews WHERE store_id BETWEEN $1 AND $2',
      [startId, endId]
    );
    console.log(`✅ 리뷰 ${reviewsDeleted.rowCount}개 삭제`);
    
    // 2. 주문 삭제
    const ordersDeleted = await pool.query(
      'DELETE FROM orders WHERE store_id BETWEEN $1 AND $2',
      [startId, endId]
    );
    console.log(`✅ 주문 ${ordersDeleted.rowCount}개 삭제`);
    
    // 3. 테이블 삭제
    const tablesDeleted = await pool.query(
      'DELETE FROM store_tables WHERE store_id BETWEEN $1 AND $2',
      [startId, endId]
    );
    console.log(`✅ 테이블 ${tablesDeleted.rowCount}개 삭제`);
    
    // 4. 매장 삭제
    const storesDeleted = await pool.query(
      'DELETE FROM stores WHERE id BETWEEN $1 AND $2',
      [startId, endId]
    );
    console.log(`✅ 매장 ${storesDeleted.rowCount}개 삭제`);
    
    // 최종 결과 확인
    const finalResult = await pool.query('SELECT COUNT(*) as total, MAX(id) as max_id FROM stores');
    console.log(`\n🎉 삭제 완료!`);
    console.log(`📊 현재 총 매장 수: ${finalResult.rows[0].total}개`);
    console.log(`📊 현재 최대 매장 ID: ${finalResult.rows[0].max_id}`);
    
  } catch (error) {
    console.error('❌ 매장 삭제 실패:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
removeSeoulCityHallStores();
