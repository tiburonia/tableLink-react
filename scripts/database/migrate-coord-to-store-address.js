
const pool = require('../../shared/config/database');

async function migrateCoordToStoreAddress() {
  const client = await pool.connect();
  
  try {
    console.log('📍 stores 테이블의 coord 컬럼을 store_address 테이블로 이동 시작...');
    
    // 트랜잭션 시작
    await client.query('BEGIN');
    
    // 1. store_address 테이블에 새 컬럼 추가
    console.log('📋 1단계: store_address 테이블에 좌표 컬럼 추가...');
    await client.query(`
      ALTER TABLE store_address 
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
      ADD COLUMN IF NOT EXISTS coord JSONB
    `);
    
    // 2. 인덱스 생성
    console.log('📊 2단계: 좌표 검색을 위한 인덱스 생성...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_address_latitude ON store_address(latitude);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_address_longitude ON store_address(longitude);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_address_coord ON store_address USING GIN(coord);
    `);
    
    // 3. 현재 데이터 상태 확인
    console.log('📊 3단계: 현재 데이터 상태 확인...');
    
    const storesWithCoord = await client.query(`
      SELECT COUNT(*) as count 
      FROM stores 
      WHERE coord IS NOT NULL
    `);
    
    const totalStores = await client.query('SELECT COUNT(*) as count FROM stores');
    const totalAddresses = await client.query('SELECT COUNT(*) as count FROM store_address');
    
    console.log(`📊 현재 상태:`);
    console.log(`  - 전체 stores: ${totalStores.rows[0].count}개`);
    console.log(`  - 전체 store_address: ${totalAddresses.rows[0].count}개`);
    console.log(`  - coord가 있는 stores: ${storesWithCoord.rows[0].count}개`);
    
    // 4. coord 데이터를 store_address로 이동
    console.log('🔄 4단계: coord 데이터 이동 및 latitude, longitude 분리...');
    
    const storesWithCoordData = await client.query(`
      SELECT id, coord 
      FROM stores 
      WHERE coord IS NOT NULL
      ORDER BY id
    `);
    
    console.log(`📦 ${storesWithCoordData.rows.length}개 매장의 좌표 데이터 처리 중...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const store of storesWithCoordData.rows) {
      try {
        const coord = store.coord;
        let latitude = null;
        let longitude = null;
        
        // coord JSON에서 lat, lng 추출
        if (coord && typeof coord === 'object') {
          if (coord.lat && coord.lng) {
            latitude = parseFloat(coord.lat);
            longitude = parseFloat(coord.lng);
          }
        }
        
        if (latitude && longitude) {
          // store_address 테이블 업데이트
          await client.query(`
            UPDATE store_address 
            SET 
              coord = $1,
              latitude = $2,
              longitude = $3
            WHERE store_id = $4
          `, [JSON.stringify(coord), latitude, longitude, store.id]);
          
          successCount++;
          
          if (successCount % 100 === 0) {
            console.log(`  📦 진행률: ${successCount}/${storesWithCoordData.rows.length} (${Math.round((successCount/storesWithCoordData.rows.length)*100)}%)`);
          }
        } else {
          console.log(`⚠️ 매장 ${store.id}: 잘못된 좌표 데이터 - ${JSON.stringify(coord)}`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ 매장 ${store.id} 좌표 이동 실패:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`📊 좌표 이동 결과:`);
    console.log(`  - 성공: ${successCount}개`);
    console.log(`  - 실패: ${errorCount}개`);
    
    // 5. 데이터 검증
    console.log('✅ 5단계: 데이터 이동 검증...');
    
    const migratedCoordCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM store_address 
      WHERE coord IS NOT NULL
    `);
    
    const migratedLatLngCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM store_address 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);
    
    console.log(`📊 이동 완료 검증:`);
    console.log(`  - store_address에 coord가 있는 레코드: ${migratedCoordCount.rows[0].count}개`);
    console.log(`  - latitude, longitude가 있는 레코드: ${migratedLatLngCount.rows[0].count}개`);
    
    // 6. stores 테이블에서 coord 컬럼 제거
    console.log('🗑️ 6단계: stores 테이블에서 coord 컬럼 제거...');
    await client.query('ALTER TABLE stores DROP COLUMN IF EXISTS coord');
    
    // 트랜잭션 커밋
    await client.query('COMMIT');
    
    console.log('🎉 좌표 데이터 이동 완료!');
    
    // 최종 검증
    console.log('\n📊 최종 검증:');
    
    const finalStoreColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      ORDER BY ordinal_position
    `);
    
    const finalAddressColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'store_address' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ stores 테이블 컬럼:', finalStoreColumns.rows.map(r => r.column_name).join(', '));
    console.log('✅ store_address 테이블 컬럼:', finalAddressColumns.rows.map(r => r.column_name).join(', '));
    
    // 샘플 데이터 확인
    const sampleData = await client.query(`
      SELECT sa.store_id, sa.address_full, sa.latitude, sa.longitude
      FROM store_address sa
      WHERE sa.latitude IS NOT NULL AND sa.longitude IS NOT NULL
      LIMIT 5
    `);
    
    console.log('\n📍 샘플 좌표 데이터:');
    sampleData.rows.forEach(row => {
      console.log(`  매장 ${row.store_id}: ${row.address_full} (${row.latitude}, ${row.longitude})`);
    });
    
    console.log('\n✅ 좌표 데이터 이동 마이그레이션이 성공적으로 완료되었습니다!');
    
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

// 스크립트 실행
if (require.main === module) {
  migrateCoordToStoreAddress();
}

module.exports = { migrateCoordToStoreAddress };
