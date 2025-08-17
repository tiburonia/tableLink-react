
const pool = require('../../shared/config/database');

async function fixStoresTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 stores 테이블 구조 수정 시작...');
    
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
    
    // 2. store_address 테이블 존재 확인
    const addressTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'store_address'
      )
    `);
    
    if (!addressTableExists.rows[0].exists) {
      console.log('❌ store_address 테이블이 존재하지 않습니다. 먼저 마이그레이션을 실행해주세요.');
      await client.query('ROLLBACK');
      return;
    }
    
    console.log('✅ store_address 테이블 존재 확인');
    
    // 3. 데이터 백업 확인
    const storeCount = await client.query('SELECT COUNT(*) as total FROM stores');
    const addressCount = await client.query('SELECT COUNT(*) as total FROM store_address');
    
    console.log(`📊 데이터 확인: stores=${storeCount.rows[0].total}, store_address=${addressCount.rows[0].total}`);
    
    if (parseInt(storeCount.rows[0].total) !== parseInt(addressCount.rows[0].total)) {
      console.log('❌ stores와 store_address 테이블의 데이터 수가 일치하지 않습니다.');
      await client.query('ROLLBACK');
      return;
    }
    
    // 4. stores 테이블에서 주소 관련 컬럼들 완전 제거
    console.log('🗑️ 2단계: stores 테이블에서 주소 관련 컬럼 제거...');
    
    const columnsToRemove = ['address', 'address_status', 'sido', 'sigungu', 'dong', 'region_code'];
    
    for (const column of columnsToRemove) {
      try {
        await client.query(`ALTER TABLE stores DROP COLUMN IF EXISTS ${column}`);
        console.log(`  ✅ ${column} 컬럼 제거 완료`);
      } catch (error) {
        console.log(`  ⚠️ ${column} 컬럼 제거 중 오류 (이미 제거되었을 수 있음): ${error.message}`);
      }
    }
    
    // 5. 불필요한 컬럼들도 제거 (latitude, longitude는 coord에 포함되어 있음)
    console.log('🗑️ 3단계: 중복 컬럼 제거...');
    
    const duplicateColumns = ['latitude', 'longitude', 'distance'];
    
    for (const column of duplicateColumns) {
      try {
        await client.query(`ALTER TABLE stores DROP COLUMN IF EXISTS ${column}`);
        console.log(`  ✅ ${column} 컬럼 제거 완료`);
      } catch (error) {
        console.log(`  ⚠️ ${column} 컬럼 제거 중 오류: ${error.message}`);
      }
    }
    
    // 6. 최종 stores 테이블 구조 확인
    console.log('📋 4단계: 최종 stores 테이블 구조 확인...');
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
    
    // 7. 조인 쿼리 테스트
    console.log('🔍 5단계: 조인 쿼리 테스트...');
    const testResult = await client.query(`
      SELECT s.id, s.name, s.category, sa.address_full, s.coord, s.is_open
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      LIMIT 5
    `);
    
    console.log(`✅ 조인 쿼리 테스트 성공: ${testResult.rows.length}개 행 조회`);
    testResult.rows.forEach(row => {
      console.log(`  - ${row.name} (ID: ${row.id}): ${row.address_full || 'NO ADDRESS'}`);
    });
    
    // 트랜잭션 커밋
    await client.query('COMMIT');
    
    console.log('\n🎉 stores 테이블 구조 수정 완료!');
    console.log('\n📊 최종 결과:');
    console.log(`✅ stores 테이블: ${storeCount.rows[0].total}개 매장 (주소 컬럼 제거됨)`);
    console.log(`✅ store_address 테이블: ${addressCount.rows[0].total}개 주소`);
    console.log('✅ 조인 쿼리 정상 작동 확인');
    
  } catch (error) {
    console.error('❌ stores 테이블 수정 실패:', error);
    console.log('🔄 롤백 중...');
    
    try {
      await client.query('ROLLBACK');
      console.log('✅ 롤백 완료');
    } catch (rollbackError) {
      console.error('❌ 롤백 실패:', rollbackError);
    }
    
    throw error;
    
  } finally {
    client.release();
    process.exit(0);
  }
}

// 스크립트 실행
if (require.main === module) {
  fixStoresTable();
}

module.exports = { fixStoresTable };
