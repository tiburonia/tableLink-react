
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function ensurePostGISIndexes() {
  const client = await pool.connect();

  try {
    console.log('🔧 PostGIS 클러스터링 최적화 인덱스 생성 시작...');

    // 1. 공간 인덱스 (GIST) - 클러스터링 API의 핵심
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_addresses_geom_gist
      ON store_addresses USING GIST (geom);
    `);
    console.log('✅ 공간 인덱스 (GIST) 생성 완료');

    // 2. store_id 인덱스 (JOIN 최적화)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_addresses_store_id
      ON store_addresses (store_id);
    `);
    console.log('✅ store_id 인덱스 생성 완료');

    // 3. stores 테이블 is_open 인덱스 (필터링 최적화)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stores_is_open
      ON stores (is_open);
    `);
    console.log('✅ is_open 인덱스 생성 완료');

    // 4. store_info 테이블 store_id 인덱스 (JOIN 최적화)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_info_store_id
      ON store_info (store_id);
    `);
    console.log('✅ store_info store_id 인덱스 생성 완료');

    // 5. 복합 인덱스 (자주 함께 사용되는 컬럼들)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stores_id_is_open
      ON stores (id, is_open);
    `);
    console.log('✅ 복합 인덱스 (id, is_open) 생성 완료');

    // 인덱스 상태 확인
    const indexResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('store_addresses', 'stores', 'store_info')
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);

    console.log('\n📊 생성된 인덱스 목록:');
    indexResult.rows.forEach(row => {
      console.log(`   ${row.tablename}.${row.indexname}`);
    });

    console.log('\n🎉 PostGIS 인덱스 최적화 완료!');

  } catch (error) {
    console.error('❌ 인덱스 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  ensurePostGISIndexes()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { ensurePostGISIndexes };
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function ensurePostGISIndexes() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 PostGIS 인덱스 확인 및 생성 시작...');

    // 1. 기본 GIST 인덱스 확인 및 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_addresses_geom
      ON store_addresses USING GIST (geom);
    `);
    console.log('✅ store_addresses GIST 인덱스 확인 완료');

    // 2. 뷰포트 쿼리용 추가 인덱스
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_addresses_geom_gist_ops
      ON store_addresses USING GIST (geom gist_geometry_ops_2d);
    `);
    console.log('✅ GIST 최적화 인덱스 확인 완료');

    // 3. 복합 인덱스 (매장 상태 + 지리정보)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stores_is_open
      ON stores (is_open);
    `);
    console.log('✅ 매장 상태 인덱스 확인 완료');

    // 4. 주소 텍스트 검색용 인덱스
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_addresses_text_search
      ON store_addresses (sido, sigungu, eupmyeondong);
    `);
    console.log('✅ 주소 텍스트 검색 인덱스 확인 완료');

    console.log('🎉 모든 PostGIS 인덱스 확인 완료!');

  } catch (error) {
    console.error('❌ PostGIS 인덱스 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
ensurePostGISIndexes()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
