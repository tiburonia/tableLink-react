
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixStoreAddressesSRID() {
  const client = await pool.connect();

  try {
    console.log('🔧 store_addresses 테이블 SRID 문제 수정 시작...');

    // 1. 현재 SRID 확인
    const currentSRID = await client.query(`
      SELECT Find_SRID('public', 'store_addresses', 'geom') as current_srid;
    `);
    console.log('📍 현재 SRID:', currentSRID.rows[0].current_srid);

    // 2. SRID가 0이면 4326으로 변경
    if (currentSRID.rows[0].current_srid === 0) {
      console.log('🔄 SRID를 0에서 4326으로 변경...');
      
      // geom 컬럼을 4326으로 변환
      await client.query(`
        ALTER TABLE store_addresses 
        ALTER COLUMN geom TYPE geometry(Point, 4326) 
        USING ST_SetSRID(geom, 4326);
      `);
      
      // 공간 인덱스 재생성
      await client.query(`
        DROP INDEX IF EXISTS idx_store_addresses_geom_gist;
        CREATE INDEX idx_store_addresses_geom_gist 
        ON store_addresses USING GIST (geom);
      `);
      
      console.log('✅ SRID 변경 완료');
    } else {
      console.log('✅ SRID가 이미 올바르게 설정되어 있습니다');
    }

    // 3. 변경 후 확인
    const newSRID = await client.query(`
      SELECT Find_SRID('public', 'store_addresses', 'geom') as new_srid;
    `);
    console.log('📍 변경 후 SRID:', newSRID.rows[0].new_srid);

    // 4. 테스트 쿼리
    const testResult = await client.query(`
      SELECT COUNT(*) as count, 
             MIN(ST_X(geom)) as min_lng, MAX(ST_X(geom)) as max_lng,
             MIN(ST_Y(geom)) as min_lat, MAX(ST_Y(geom)) as max_lat
      FROM store_addresses 
      WHERE geom IS NOT NULL;
    `);
    
    console.log('📊 테스트 결과:', {
      count: testResult.rows[0].count,
      lng_range: `${testResult.rows[0].min_lng} ~ ${testResult.rows[0].max_lng}`,
      lat_range: `${testResult.rows[0].min_lat} ~ ${testResult.rows[0].max_lat}`
    });

    console.log('✅ store_addresses SRID 수정 완료');

  } catch (error) {
    console.error('❌ SRID 수정 실패:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  fixStoreAddressesSRID()
    .then(() => {
      console.log('🎉 SRID 수정 작업 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 SRID 수정 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixStoreAddressesSRID };
