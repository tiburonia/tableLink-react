
const pool = require('../../shared/config/database');

async function deleteNullAddressStores() {
  try {
    console.log('🗑️ address가 null인 매장 삭제 작업 시작...');
    
    // address가 null인 매장 수 확인
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM stores WHERE address IS NULL'
    );
    const nullAddressCount = parseInt(countResult.rows[0].count);
    
    console.log(`📊 address가 null인 매장 수: ${nullAddressCount}개`);
    
    if (nullAddressCount === 0) {
      console.log('✅ address가 null인 매장이 없습니다. 삭제할 데이터가 없습니다.');
      return;
    }
    
    // address가 null인 매장 목록 확인
    const storesToDelete = await pool.query(
      'SELECT id, name, category FROM stores WHERE address IS NULL ORDER BY id'
    );
    
    console.log(`📋 삭제될 매장 목록 (${storesToDelete.rows.length}개):`);
    storesToDelete.rows.forEach((store, index) => {
      if (index < 10) { // 처음 10개만 표시
        console.log(`  - 매장 ${store.id}: ${store.name} (${store.category})`);
      } else if (index === 10) {
        console.log(`  ... 및 ${storesToDelete.rows.length - 10}개 더`);
      }
    });
    
    // 사용자 확인 (실제 운영에서는 주석 처리 가능)
    console.log(`\n⚠️  총 ${nullAddressCount}개의 매장이 삭제됩니다.`);
    console.log('⚠️  이 작업은 되돌릴 수 없습니다.');
    
    // 관련 데이터부터 삭제 (외래키 제약 조건 순서에 따라)
    console.log('\n🔄 관련 데이터 삭제 중...');
    
    // 1. 리뷰 삭제
    const reviewsDeleted = await pool.query(
      'DELETE FROM reviews WHERE store_id IN (SELECT id FROM stores WHERE address IS NULL)'
    );
    console.log(`✅ 리뷰 ${reviewsDeleted.rowCount}개 삭제`);
    
    // 2. 주문 삭제
    const ordersDeleted = await pool.query(
      'DELETE FROM orders WHERE store_id IN (SELECT id FROM stores WHERE address IS NULL)'
    );
    console.log(`✅ 주문 ${ordersDeleted.rowCount}개 삭제`);
    
    // 3. 테이블 삭제
    const tablesDeleted = await pool.query(
      'DELETE FROM store_tables WHERE store_id IN (SELECT id FROM stores WHERE address IS NULL)'
    );
    console.log(`✅ 테이블 ${tablesDeleted.rowCount}개 삭제`);
    
    // 4. 매장 삭제
    const storesDeleted = await pool.query(
      'DELETE FROM stores WHERE address IS NULL'
    );
    console.log(`✅ 매장 ${storesDeleted.rowCount}개 삭제`);
    
    // 최종 결과 확인
    const finalResult = await pool.query('SELECT COUNT(*) as total, MAX(id) as max_id FROM stores');
    const remainingStores = parseInt(finalResult.rows[0].total);
    const maxId = finalResult.rows[0].max_id;
    
    console.log(`\n🎉 삭제 작업 완료!`);
    console.log(`📊 현재 남은 매장 수: ${remainingStores}개`);
    console.log(`📍 최대 매장 ID: ${maxId}`);
    console.log(`🗑️ 총 삭제된 매장 수: ${storesDeleted.rowCount}개`);
    
    // address가 null인 매장이 모두 삭제되었는지 확인
    const verifyResult = await pool.query('SELECT COUNT(*) as count FROM stores WHERE address IS NULL');
    const remainingNullAddress = parseInt(verifyResult.rows[0].count);
    
    if (remainingNullAddress === 0) {
      console.log('✅ 검증 완료: address가 null인 매장이 모두 삭제되었습니다.');
    } else {
      console.log(`⚠️  검증 실패: 아직 ${remainingNullAddress}개의 address가 null인 매장이 남아있습니다.`);
    }
    
  } catch (error) {
    console.error('❌ address가 null인 매장 삭제 실패:', error);
    console.error('❌ 에러 세부사항:', error.message);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
deleteNullAddressStores();
