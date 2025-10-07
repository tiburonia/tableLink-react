
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * store_info 테이블의 amenities 필드에 랜덤 데이터 삽입
 */
async function updateStoreAmenities() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🏪 store_info 테이블의 amenities 업데이트 시작...');

    // 모든 매장 조회
    const storesResult = await client.query('SELECT store_id FROM store_info ORDER BY store_id');
    const stores = storesResult.rows;

    console.log(`📊 총 ${stores.length}개 매장의 amenities 업데이트 중...`);

    let updateCount = 0;

    for (const store of stores) {
      const storeId = store.store_id;

      // 랜덤 boolean 값 생성
      const amenities = {
        wifi: Math.random() > 0.5,
        parking: Math.random() > 0.5,
        pet_friendly: Math.random() > 0.5,
        power_outlet: Math.random() > 0.5,
        smoking_area: Math.random() > 0.5
      };

      // amenities 필드 업데이트
      await client.query(`
        UPDATE store_info 
        SET amenities = $1::jsonb
        WHERE store_id = $2
      `, [JSON.stringify(amenities), storeId]);

      updateCount++;

      if (storeId % 10 === 0) {
        console.log(`⏳ 진행 중... ${updateCount}/${stores.length} 매장 완료`);
      }
    }

    await client.query('COMMIT');
    console.log(`✅ amenities 업데이트 ${updateCount}건 완료!`);

    // 결과 확인
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN amenities->>'wifi' = 'true' THEN 1 END) as wifi_enabled,
        COUNT(CASE WHEN amenities->>'parking' = 'true' THEN 1 END) as parking_enabled,
        COUNT(CASE WHEN amenities->>'pet_friendly' = 'true' THEN 1 END) as pet_friendly_enabled,
        COUNT(CASE WHEN amenities->>'power_outlet' = 'true' THEN 1 END) as power_outlet_enabled,
        COUNT(CASE WHEN amenities->>'smoking_area' = 'true' THEN 1 END) as smoking_area_enabled
      FROM store_info
      WHERE amenities IS NOT NULL
    `);

    console.log('📊 업데이트된 데이터 요약:');
    console.log(`   - 총 레코드 수: ${summary.rows[0].total_records}`);
    console.log(`   - WiFi 제공: ${summary.rows[0].wifi_enabled}개 매장`);
    console.log(`   - 주차 가능: ${summary.rows[0].parking_enabled}개 매장`);
    console.log(`   - 반려동물 동반: ${summary.rows[0].pet_friendly_enabled}개 매장`);
    console.log(`   - 콘센트 제공: ${summary.rows[0].power_outlet_enabled}개 매장`);
    console.log(`   - 흡연구역: ${summary.rows[0].smoking_area_enabled}개 매장`);

    // 샘플 데이터 출력
    const sampleResult = await client.query(`
      SELECT store_id, amenities 
      FROM store_info 
      WHERE amenities IS NOT NULL 
      LIMIT 5
    `);

    console.log('\n📝 샘플 데이터 (처음 5개):');
    sampleResult.rows.forEach(row => {
      console.log(`   - 매장 ID ${row.store_id}:`, row.amenities);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ amenities 업데이트 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
updateStoreAmenities()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
