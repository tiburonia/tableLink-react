
const pool = require('../../shared/config/database');

async function createTablesForStores() {
  try {
    console.log('🪑 테이블이 없는 매장들에 대한 테이블 생성 작업 시작...');
    
    // 테이블이 없는 매장들 조회
    const storesWithoutTables = await pool.query(`
      SELECT s.id, s.name, s.category 
      FROM stores s 
      LEFT JOIN store_tables st ON s.id = st.store_id 
      WHERE st.store_id IS NULL 
      ORDER BY s.id
    `);
    
    const storesCount = storesWithoutTables.rows.length;
    console.log(`📊 테이블이 없는 매장 수: ${storesCount}개`);
    
    if (storesCount === 0) {
      console.log('✅ 모든 매장에 테이블이 이미 존재합니다.');
      return;
    }
    
    console.log(`📋 테이블 생성 대상 매장들 (처음 10개):`);
    storesWithoutTables.rows.slice(0, 10).forEach(store => {
      console.log(`  - 매장 ${store.id}: ${store.name} (${store.category})`);
    });
    
    if (storesCount > 10) {
      console.log(`  ... 및 ${storesCount - 10}개 더`);
    }
    
    let totalTablesCreated = 0;
    let processedStores = 0;
    
    // 각 매장에 대해 테이블 생성
    for (const store of storesWithoutTables.rows) {
      const storeId = store.id;
      const storeName = store.name;
      
      try {
        // 4~8개 중 랜덤 개수 결정
        const tableCount = Math.floor(Math.random() * 5) + 4; // 4~8개
        
        console.log(`🏪 매장 ${storeId} (${storeName})에 ${tableCount}개 테이블 생성 중...`);
        
        const tables = [];
        
        for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
          // 랜덤 좌석 수 (2, 4, 6인석 중 선택)
          const seats = [2, 4, 6][Math.floor(Math.random() * 3)];
          
          // 테이블명 생성
          const tableName = `테이블 ${tableNum}`;
          
          // unique_id 생성
          const uniqueId = `store_${storeId}_table_${tableNum}`;
          
          // 테이블 생성
          await pool.query(`
            INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied, unique_id)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [storeId, tableNum, tableName, seats, false, uniqueId]);
          
          tables.push({ tableNum, tableName, seats });
        }
        
        totalTablesCreated += tableCount;
        processedStores++;
        
        console.log(`✅ 매장 ${storeId} 테이블 생성 완료: ${tableCount}개`);
        tables.forEach(table => {
          console.log(`   - ${table.tableName}: ${table.seats}인석`);
        });
        
        // 진행상황 표시 (100개마다)
        if (processedStores % 100 === 0) {
          console.log(`📊 진행상황: ${processedStores}/${storesCount} 매장 처리 완료`);
        }
        
      } catch (storeError) {
        console.error(`❌ 매장 ${storeId} 테이블 생성 실패:`, storeError.message);
      }
    }
    
    // 최종 결과 확인
    const finalTableCount = await pool.query('SELECT COUNT(*) as total FROM store_tables');
    const storesWithTables = await pool.query(`
      SELECT COUNT(DISTINCT store_id) as count FROM store_tables
    `);
    
    console.log(`\n🎉 테이블 생성 작업 완료!`);
    console.log(`📊 처리된 매장 수: ${processedStores}개`);
    console.log(`🪑 생성된 테이블 수: ${totalTablesCreated}개`);
    console.log(`📋 전체 테이블 수: ${finalTableCount.rows[0].total}개`);
    console.log(`🏪 테이블이 있는 매장 수: ${storesWithTables.rows[0].count}개`);
    
    // 검증: 테이블이 없는 매장이 아직 있는지 확인
    const remainingStoresWithoutTables = await pool.query(`
      SELECT COUNT(*) as count 
      FROM stores s 
      LEFT JOIN store_tables st ON s.id = st.store_id 
      WHERE st.store_id IS NULL
    `);
    
    const remainingCount = parseInt(remainingStoresWithoutTables.rows[0].count);
    
    if (remainingCount === 0) {
      console.log('✅ 검증 완료: 모든 매장에 테이블이 생성되었습니다.');
    } else {
      console.log(`⚠️ 검증 결과: 아직 ${remainingCount}개 매장에 테이블이 없습니다.`);
    }
    
    // 매장별 테이블 수 통계
    const tableStats = await pool.query(`
      SELECT 
        COUNT(CASE WHEN table_count = 4 THEN 1 END) as stores_with_4_tables,
        COUNT(CASE WHEN table_count = 5 THEN 1 END) as stores_with_5_tables,
        COUNT(CASE WHEN table_count = 6 THEN 1 END) as stores_with_6_tables,
        COUNT(CASE WHEN table_count = 7 THEN 1 END) as stores_with_7_tables,
        COUNT(CASE WHEN table_count = 8 THEN 1 END) as stores_with_8_tables
      FROM (
        SELECT store_id, COUNT(*) as table_count 
        FROM store_tables 
        GROUP BY store_id
        HAVING COUNT(*) BETWEEN 4 AND 8
      ) as store_table_counts
    `);
    
    const stats = tableStats.rows[0];
    console.log(`\n📈 테이블 수별 매장 분포:`);
    console.log(`  - 4개 테이블: ${stats.stores_with_4_tables}개 매장`);
    console.log(`  - 5개 테이블: ${stats.stores_with_5_tables}개 매장`);
    console.log(`  - 6개 테이블: ${stats.stores_with_6_tables}개 매장`);
    console.log(`  - 7개 테이블: ${stats.stores_with_7_tables}개 매장`);
    console.log(`  - 8개 테이블: ${stats.stores_with_8_tables}개 매장`);
    
  } catch (error) {
    console.error('❌ 테이블 생성 작업 실패:', error);
    console.error('❌ 에러 세부사항:', error.message);
    console.error('❌ 에러 스택:', error.stack);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
createTablesForStores();
