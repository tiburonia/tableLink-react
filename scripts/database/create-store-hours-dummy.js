
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * store_hours 테이블 더미 데이터 생성
 * - 모든 매장에 대해 영업시간 설정
 * - dow: 0 (일요일) ~ 6 (토요일)
 * - 기본 영업시간: 월~금 10:00~22:00, 토~일 11:00~23:00
 * - 일부 매장은 특정 요일에 휴무 설정
 */
async function createStoreHoursDummy() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🕐 store_hours 더미 데이터 생성 시작...');

    // 모든 매장 조회
    const storesResult = await client.query('SELECT id FROM stores ORDER BY id');
    const stores = storesResult.rows;

    console.log(`📊 총 ${stores.length}개 매장에 대해 영업시간 설정 중...`);

    let insertCount = 0;

    for (const store of stores) {
      const storeId = store.id;

      // 기존 데이터 확인 (중복 방지)
      const existingHours = await client.query(
        'SELECT COUNT(*) FROM store_hours WHERE store_id = $1',
        [storeId]
      );

      if (parseInt(existingHours.rows[0].count) > 0) {
        console.log(`⏭️  매장 ${storeId}: 이미 영업시간 데이터 존재, 건너뜀`);
        continue;
      }

      // 랜덤 영업 패턴 결정 (90%는 기본 패턴, 10%는 특별 패턴)
      const useSpecialPattern = Math.random() < 0.1;

      if (useSpecialPattern) {
        // 특별 패턴: 특정 요일 휴무
        const closedDay = Math.floor(Math.random() * 7); // 0~6 중 랜덤 휴무일

        for (let dow = 0; dow <= 6; dow++) {
          if (dow === closedDay) {
            // 휴무일
            await client.query(`
              INSERT INTO store_hours (store_id, day_of_week, open_time, close_time, is_closed)
              VALUES ($1, $2, NULL, NULL, true)
            `, [storeId, dow]);
          } else if (dow === 0 || dow === 6) {
            // 주말 (일요일, 토요일)
            await client.query(`
              INSERT INTO store_hours (store_id, dow, open_time, close_time, is_closed)
              VALUES ($1, $2, $3, $4, false)
            `, [storeId, dow, '11:00:00', '23:00:00']);
          } else {
            // 평일 (월~금)
            await client.query(`
              INSERT INTO store_hours (store_id, dow, open_time, close_time, is_closed)
              VALUES ($1, $2, $3, $4, false)
            `, [storeId, dow, '10:00:00', '22:00:00']);
          }
          insertCount++;
        }
      } else {
        // 기본 패턴: 모든 요일 영업
        for (let dow = 0; dow <= 6; dow++) {
          let openTime, closeTime;

          if (dow === 0 || dow === 6) {
            // 주말
            openTime = '11:00:00';
            closeTime = '23:00:00';
          } else {
            // 평일
            openTime = '10:00:00';
            closeTime = '22:00:00';
          }

          await client.query(`
            INSERT INTO store_hours (store_id, dow, open_time, close_time, is_closed)
            VALUES ($1, $2, $3, $4, false)
          `, [storeId, dow, openTime, closeTime]);
          insertCount++;
        }
      }

      if (storeId % 10 === 0) {
        console.log(`⏳ 진행 중... ${storeId}/${stores.length} 매장 완료`);
      }
    }

    await client.query('COMMIT');
    console.log(`✅ store_hours 더미 데이터 ${insertCount}건 생성 완료!`);

    // 결과 확인
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT store_id) as stores_with_hours,
        SUM(CASE WHEN is_closed = true THEN 1 ELSE 0 END) as closed_days
      FROM store_hours
    `);

    console.log('📊 생성된 데이터 요약:');
    console.log(`   - 총 레코드 수: ${summary.rows[0].total_records}`);
    console.log(`   - 영업시간 설정된 매장: ${summary.rows[0].stores_with_hours}`);
    console.log(`   - 휴무일 설정: ${summary.rows[0].closed_days}건`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ store_hours 더미 데이터 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
createStoreHoursDummy()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
