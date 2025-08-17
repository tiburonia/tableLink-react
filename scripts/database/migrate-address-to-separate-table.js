
const pool = require('../../shared/config/database');

async function migrateAddressToSeparateTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 stores 테이블 주소 데이터 분리 마이그레이션 시작...');
    
    // 트랜잭션 시작
    await client.query('BEGIN');
    
    // 1. store_address 테이블 생성
    console.log('📋 1단계: store_address 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_address (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL UNIQUE,
        address_full TEXT,
        address_status VARCHAR(50) DEFAULT 'unknown',
        sido VARCHAR(100),
        sigungu VARCHAR(100),
        eupmyeondong VARCHAR(100),
        ri VARCHAR(100),
        legal_dong_code VARCHAR(20),
        admin_dong_code VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. 외래키 제약조건 추가
    console.log('🔗 2단계: 외래키 제약조건 추가...');
    await client.query(`
      ALTER TABLE store_address 
      ADD CONSTRAINT fk_store_address_store_id 
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    `);
    
    // 3. 인덱스 생성
    console.log('📊 3단계: 인덱스 생성...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_address_sido ON store_address(sido);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_address_sigungu ON store_address(sigungu);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_address_eupmyeondong ON store_address(eupmyeondong);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_address_legal_dong_code ON store_address(legal_dong_code);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_address_admin_dong_code ON store_address(admin_dong_code);
    `);
    
    // 4. 기존 데이터 마이그레이션
    console.log('📦 4단계: 기존 데이터 마이그레이션...');
    
    // stores 테이블의 현재 데이터 확인
    const storesCountResult = await client.query('SELECT COUNT(*) as total FROM stores');
    const totalStores = parseInt(storesCountResult.rows[0].total);
    console.log(`📊 총 매장 수: ${totalStores}개`);
    
    // 주소 데이터가 있는 매장 확인
    const addressDataResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(address) as with_address,
        COUNT(sido) as with_sido,
        COUNT(sigungu) as with_sigungu,
        COUNT(dong) as with_dong,
        COUNT(region_code) as with_region_code
      FROM stores
    `);
    
    const addressStats = addressDataResult.rows[0];
    console.log(`📍 주소 데이터 현황:`);
    console.log(`  - address가 있는 매장: ${addressStats.with_address}개`);
    console.log(`  - sido가 있는 매장: ${addressStats.with_sido}개`);
    console.log(`  - sigungu가 있는 매장: ${addressStats.with_sigungu}개`);
    console.log(`  - dong이 있는 매장: ${addressStats.with_dong}개`);
    console.log(`  - region_code가 있는 매장: ${addressStats.with_region_code}개`);
    
    // 데이터 이전 (배치 처리)
    const batchSize = 500;
    let processed = 0;
    
    while (processed < totalStores) {
      const storesResult = await client.query(`
        SELECT id, address, address_status, sido, sigungu, dong, region_code
        FROM stores 
        ORDER BY id 
        LIMIT $1 OFFSET $2
      `, [batchSize, processed]);
      
      if (storesResult.rows.length === 0) break;
      
      for (const store of storesResult.rows) {
        await client.query(`
          INSERT INTO store_address (
            store_id, 
            address_full, 
            address_status, 
            sido, 
            sigungu, 
            eupmyeondong, 
            legal_dong_code
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          store.id,
          store.address,  // address → address_full
          store.address_status || 'unknown',
          store.sido,
          store.sigungu,
          store.dong,     // dong → eupmyeondong
          store.region_code  // region_code → legal_dong_code
        ]);
      }
      
      processed += storesResult.rows.length;
      console.log(`  📦 ${processed}/${totalStores} 매장 데이터 이전 완료`);
    }
    
    // 5. 데이터 이전 검증
    console.log('✅ 5단계: 데이터 이전 검증...');
    
    const addressCountResult = await client.query('SELECT COUNT(*) as total FROM store_address');
    const migratedCount = parseInt(addressCountResult.rows[0].total);
    
    console.log(`📊 이전 완료 검증:`);
    console.log(`  - 원본 stores 테이블: ${totalStores}개`);
    console.log(`  - 새 store_address 테이블: ${migratedCount}개`);
    
    if (migratedCount !== totalStores) {
      throw new Error(`❌ 데이터 이전 실패: 매장 수 불일치 (${totalStores} != ${migratedCount})`);
    }
    
    // FK 제약조건 위반 검사
    const orphanResult = await client.query(`
      SELECT COUNT(*) as orphan_count 
      FROM store_address sa 
      LEFT JOIN stores s ON sa.store_id = s.id 
      WHERE s.id IS NULL
    `);
    
    const orphanCount = parseInt(orphanResult.rows[0].orphan_count);
    if (orphanCount > 0) {
      throw new Error(`❌ 외래키 제약조건 위반: ${orphanCount}개의 고아 레코드 발견`);
    }
    
    // 6. stores 테이블에서 주소 관련 컬럼 제거
    console.log('🗑️ 6단계: stores 테이블에서 주소 관련 컬럼 제거...');
    
    await client.query('ALTER TABLE stores DROP COLUMN IF EXISTS address');
    await client.query('ALTER TABLE stores DROP COLUMN IF EXISTS address_status');
    await client.query('ALTER TABLE stores DROP COLUMN IF EXISTS sido');
    await client.query('ALTER TABLE stores DROP COLUMN IF EXISTS sigungu');
    await client.query('ALTER TABLE stores DROP COLUMN IF EXISTS dong');
    await client.query('ALTER TABLE stores DROP COLUMN IF EXISTS region_code');
    
    // 트랜잭션 커밋
    await client.query('COMMIT');
    
    console.log('🎉 마이그레이션 완료!');
    
    // 최종 검증 및 통계
    console.log('\n📊 최종 검증 결과:');
    
    const finalStoreCount = await client.query('SELECT COUNT(*) as total FROM stores');
    const finalAddressCount = await client.query('SELECT COUNT(*) as total FROM store_address');
    
    console.log(`✅ stores 테이블: ${finalStoreCount.rows[0].total}개 매장`);
    console.log(`✅ store_address 테이블: ${finalAddressCount.rows[0].total}개 주소`);
    
    // 주소 통계
    const addressStatsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(address_full) as with_address_full,
        COUNT(sido) as with_sido,
        COUNT(sigungu) as with_sigungu,
        COUNT(eupmyeondong) as with_eupmyeondong,
        COUNT(legal_dong_code) as with_legal_dong_code
      FROM store_address
    `);
    
    const finalStats = addressStatsResult.rows[0];
    console.log(`\n📍 주소 데이터 분포:`);
    console.log(`  - 전체 주소: ${finalStats.with_address_full}개`);
    console.log(`  - 시도: ${finalStats.with_sido}개`);
    console.log(`  - 시군구: ${finalStats.with_sigungu}개`);
    console.log(`  - 읍면동: ${finalStats.with_eupmyeondong}개`);
    console.log(`  - 법정동코드: ${finalStats.with_legal_dong_code}개`);
    
    // 지역별 분포 (상위 10개)
    const regionDistResult = await client.query(`
      SELECT sido, COUNT(*) as count 
      FROM store_address 
      WHERE sido IS NOT NULL 
      GROUP BY sido 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log(`\n🗺️ 시도별 매장 분포 (상위 10개):`);
    regionDistResult.rows.forEach(row => {
      console.log(`  - ${row.sido}: ${row.count}개`);
    });
    
    console.log('\n✅ 주소 테이블 분리 마이그레이션이 성공적으로 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    console.log('🔄 롤백 중...');
    
    try {
      await client.query('ROLLBACK');
      console.log('✅ 롤백 완료 - 모든 변경사항이 취소되었습니다.');
    } catch (rollbackError) {
      console.error('❌ 롤백 실패:', rollbackError);
    }
    
    throw error;
    
  } finally {
    client.release();
    process.exit(0);
  }
}

// 검증 쿼리 함수 (마이그레이션 후 별도 실행 가능)
async function validateMigration() {
  try {
    console.log('🔍 마이그레이션 검증 시작...');
    
    // 1. 개수 일치 확인
    const storeCountResult = await pool.query('SELECT COUNT(*) as total FROM stores');
    const addressCountResult = await pool.query('SELECT COUNT(*) as total FROM store_address');
    
    const storeCount = parseInt(storeCountResult.rows[0].total);
    const addressCount = parseInt(addressCountResult.rows[0].total);
    
    console.log(`📊 개수 검증: stores=${storeCount}, store_address=${addressCount}`);
    
    if (storeCount !== addressCount) {
      console.error(`❌ 개수 불일치: ${storeCount} != ${addressCount}`);
      return false;
    }
    
    // 2. 외래키 제약조건 확인
    const orphanResult = await pool.query(`
      SELECT sa.id, sa.store_id 
      FROM store_address sa 
      LEFT JOIN stores s ON sa.store_id = s.id 
      WHERE s.id IS NULL 
      LIMIT 5
    `);
    
    if (orphanResult.rows.length > 0) {
      console.error('❌ 외래키 제약조건 위반 발견:', orphanResult.rows);
      return false;
    }
    
    // 3. 중복 store_id 확인
    const duplicateResult = await pool.query(`
      SELECT store_id, COUNT(*) as count 
      FROM store_address 
      GROUP BY store_id 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateResult.rows.length > 0) {
      console.error('❌ 중복 store_id 발견:', duplicateResult.rows);
      return false;
    }
    
    console.log('✅ 모든 검증 통과');
    return true;
    
  } catch (error) {
    console.error('❌ 검증 실패:', error);
    return false;
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateAddressToSeparateTable();
}

module.exports = { migrateAddressToSeparateTable, validateMigration };
