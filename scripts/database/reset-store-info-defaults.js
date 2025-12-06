
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function resetStoreInfoDefaults() {
  const client = await pool.connect();

  try {
    console.log('🔄 store_info 테이블의 기본값 컬럼들을 디폴트값으로 업데이트 시작...');

    // 기본값이 있는 컬럼들을 모두 0으로 업데이트
    const updateResult = await client.query(`
      UPDATE store_info 
      SET 
        rating_average = 0,
        review_count = 0,
        favoratite_count = 0
    `);

    console.log(`✅ store_info 테이블 업데이트 완료: ${updateResult.rowCount}개 행 수정`);

    // 업데이트 결과 확인
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total_stores,
        COUNT(CASE WHEN rating_average = 0 THEN 1 END) as zero_rating,
        COUNT(CASE WHEN review_count = 0 THEN 1 END) as zero_reviews,
        COUNT(CASE WHEN favoratite_count = 0 THEN 1 END) as zero_favorites
      FROM store_info
    `);

    const stats = verifyResult.rows[0];
    console.log(`📊 업데이트 결과 확인:`);
    console.log(`   - 총 매장 수: ${stats.total_stores}`);
    console.log(`   - rating_average = 0: ${stats.zero_rating}`);
    console.log(`   - review_count = 0: ${stats.zero_reviews}`);
    console.log(`   - favoratite_count = 0: ${stats.zero_favorites}`);

    console.log('🎉 store_info 기본값 초기화 완료!');

  } catch (error) {
    console.error('❌ store_info 기본값 초기화 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
resetStoreInfoDefaults()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
