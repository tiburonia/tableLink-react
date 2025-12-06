
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function updateCookStations() {
  const client = await pool.connect();

  try {
    console.log('🔄 store_menu 테이블의 cook_station 업데이트 시작...');

    // 음료 관련 키워드로 DRINK 분류
    const drinkKeywords = [
      '콜라', '사이다', '음료', '주스', '커피', '차', '라떼', '아메리카노', 
      '에스프레소', '카푸치노', '마키아또', '물', '맥주', '소주', '와인',
      '칵테일', '스무디', '밀크셰이크', '아이스크림', '빙수', '음료수',
      '드링크', 'drink', 'coffee', 'tea', 'juice', 'cola', 'beer'
    ];

    // DRINK로 업데이트 (음료 관련 메뉴)
    for (const keyword of drinkKeywords) {
      const result = await client.query(`
        UPDATE store_menu 
        SET cook_station = 'DRINK'
        WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1
      `, [`%${keyword.toLowerCase()}%`]);
      
      if (result.rowCount > 0) {
        console.log(`✅ "${keyword}" 관련 메뉴 ${result.rowCount}개를 DRINK로 업데이트`);
      }
    }

    // 나머지 모든 메뉴를 KITCHEN으로 업데이트
    const kitchenResult = await client.query(`
      UPDATE store_menu 
      SET cook_station = 'KITCHEN'
      WHERE cook_station != 'DRINK' OR cook_station IS NULL
    `);

    console.log(`✅ 나머지 메뉴 ${kitchenResult.rowCount}개를 KITCHEN으로 업데이트`);

    // 업데이트 결과 확인
    const verifyResult = await client.query(`
      SELECT 
        cook_station,
        COUNT(*) as count,
        STRING_AGG(name, ', ') as sample_menus
      FROM (
        SELECT 
          cook_station,
          name,
          ROW_NUMBER() OVER (PARTITION BY cook_station ORDER BY name) as rn
        FROM store_menu
      ) ranked
      WHERE rn <= 5
      GROUP BY cook_station
      ORDER BY cook_station
    `);

    console.log('\n📊 업데이트 결과:');
    verifyResult.rows.forEach(row => {
      console.log(`   ${row.cook_station}: ${row.count}개 메뉴`);
      console.log(`   예시: ${row.sample_menus}${row.count > 5 ? ' ...' : ''}`);
    });

    // 특정 매장의 예시 확인
    const sampleResult = await client.query(`
      SELECT 
        store_id,
        name,
        cook_station,
        price
      FROM store_menu 
      WHERE store_id = (SELECT MIN(store_id) FROM store_menu)
      ORDER BY cook_station, name
      LIMIT 10
    `);

    if (sampleResult.rows.length > 0) {
      console.log(`\n📋 매장 ${sampleResult.rows[0].store_id} 메뉴 예시:`);
      sampleResult.rows.forEach(row => {
        console.log(`   ${row.cook_station}: ${row.name} (₩${row.price.toLocaleString()})`);
      });
    }

    console.log('\n🎉 cook_station 업데이트 완료!');

  } catch (error) {
    console.error('❌ cook_station 업데이트 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
updateCookStations()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
