
const pool = require('../../shared/config/database');

async function removeUnusedColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️ stores 테이블에서 사용되지 않는 컬럼 삭제 시작...');
    
    // 트랜잭션 시작
    await client.query('BEGIN');
    
    // 1. 현재 stores 테이블 구조 확인
    console.log('📋 1단계: 현재 stores 테이블 구조 확인...');
    const storesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      ORDER BY ordinal_position
    `);
    
    console.log('현재 stores 테이블 컬럼:');
    storesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // 2. 삭제할 컬럼들 정의
    const columnsToRemove = ['sido', 'sigungu', 'dong', 'region_code'];
    
    console.log(`\n🗑️ 2단계: 삭제할 컬럼들 - ${columnsToRemove.join(', ')}`);
    
    // 3. 각 컬럼의 현재 데이터 상태 확인
    console.log('📊 3단계: 컬럼별 데이터 상태 확인...');
    for (const column of columnsToRemove) {
      try {
        const columnExists = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'stores' AND column_name = $1
          )
        `, [column]);
        
        if (columnExists.rows[0].exists) {
          const dataCheck = await client.query(`
            SELECT 
              COUNT(*) as total,
              COUNT(${column}) as non_null,
              COUNT(*) - COUNT(${column}) as null_count
            FROM stores
          `);
          
          const stats = dataCheck.rows[0];
          console.log(`  📍 ${column}: 총 ${stats.total}개 중 NULL=${stats.null_count}개, 데이터=${stats.non_null}개`);
        } else {
          console.log(`  ⚠️ ${column}: 컬럼이 존재하지 않습니다`);
        }
      } catch (error) {
        console.log(`  ❌ ${column}: 확인 중 오류 - ${error.message}`);
      }
    }
    
    // 4. 컬럼 삭제 실행
    console.log('\n🗑️ 4단계: 컬럼 삭제 실행...');
    let deletedCount = 0;
    
    for (const column of columnsToRemove) {
      try {
        await client.query(`ALTER TABLE stores DROP COLUMN IF EXISTS ${column}`);
        console.log(`  ✅ ${column} 컬럼 삭제 완료`);
        deletedCount++;
      } catch (error) {
        console.log(`  ❌ ${column} 컬럼 삭제 실패: ${error.message}`);
      }
    }
    
    // 5. 최종 stores 테이블 구조 확인
    console.log('\n📋 5단계: 최종 stores 테이블 구조 확인...');
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ 최종 stores 테이블 컬럼:');
    finalColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // 6. 테이블 상태 확인
    console.log('\n📊 6단계: 테이블 상태 확인...');
    const tableStats = await client.query(`
      SELECT 
        COUNT(*) as total_stores,
        COUNT(name) as stores_with_name,
        COUNT(coord) as stores_with_coord
      FROM stores
    `);
    
    const stats = tableStats.rows[0];
    console.log(`  📊 총 매장 수: ${stats.total_stores}개`);
    console.log(`  📊 이름이 있는 매장: ${stats.stores_with_name}개`);
    console.log(`  📊 좌표가 있는 매장: ${stats.stores_with_coord}개`);
    
    // 트랜잭션 커밋
    await client.query('COMMIT');
    
    console.log(`\n🎉 stores 테이블 컬럼 삭제 완료!`);
    console.log(`📊 삭제된 컬럼 수: ${deletedCount}개`);
    console.log(`✅ 남은 컬럼 수: ${finalColumns.rows.length}개`);
    
    console.log('\n📋 주소 관련 데이터는 store_address 테이블에서 관리됩니다:');
    const addressTableCheck = await client.query(`
      SELECT 
        COUNT(*) as total_addresses,
        COUNT(sido) as with_sido,
        COUNT(sigungu) as with_sigungu,
        COUNT(eupmyeondong) as with_eupmyeondong
      FROM store_address
    `);
    
    const addressStats = addressTableCheck.rows[0];
    console.log(`  📍 store_address 테이블: ${addressStats.total_addresses}개 주소`);
    console.log(`  📍 시도: ${addressStats.with_sido}개`);
    console.log(`  📍 시군구: ${addressStats.with_sigungu}개`);
    console.log(`  📍 읍면동: ${addressStats.with_eupmyeondong}개`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 컬럼 삭제 실패:', error);
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    client.release();
  }
}

removeUnusedColumns();
