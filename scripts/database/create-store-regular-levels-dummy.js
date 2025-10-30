
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * store_regular_levels 테이블 더미 데이터 생성
 * - 모든 매장에 대해 4단계 단골 레벨 시스템 생성 (브론즈, 실버, 골드, 플래티넘)
 * - grade: 등급 순위 (1=브론즈, 2=실버, 3=골드, 4=플래티넘)
 * - level: 등급 명칭
 * - min_orders: 최소 주문 횟수
 * - min_spent: 최소 누적 결제금액
 * - benefits: 혜택 정보 (할인율, 포인트 적립률 등)
 */
async function createStoreRegularLevelsDummy() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🏆 store_regular_levels 더미 데이터 생성 시작...');

    // 모든 매장 조회
    const storesResult = await client.query('SELECT id FROM stores ORDER BY id');
    const stores = storesResult.rows;

    console.log(`📊 총 ${stores.length}개 매장에 대해 단골 레벨 시스템 설정 중...`);

    // 단골 레벨 정의 (4단계)
    const levels = [
      {
        grade: 1,
        level: '브론즈',
        min_orders: 0,
        min_spent: 0,
        benefits: {
          discount: 0,
          pointRate: 1.0,
          description: '신규 고객 등급입니다.'
        }
      },
      {
        grade: 2,
        level: '실버',
        min_orders: 5,
        min_spent: 50000,
        benefits: {
          discount: 5,
          pointRate: 1.2,
          description: '5% 할인 및 포인트 1.2배 적립'
        }
      },
      {
        grade: 3,
        level: '골드',
        min_orders: 15,
        min_spent: 150000,
        benefits: {
          discount: 10,
          pointRate: 1.5,
          description: '10% 할인 및 포인트 1.5배 적립'
        }
      },
      {
        grade: 4,
        level: '플래티넘',
        min_orders: 30,
        min_spent: 300000,
        benefits: {
          discount: 15,
          pointRate: 2.0,
          description: '15% 할인 및 포인트 2배 적립, VIP 혜택'
        }
      }
    ];

    let insertCount = 0;

    for (const store of stores) {
      const storeId = store.id;

      // 기존 데이터 확인 (중복 방지)
      const existingLevels = await client.query(
        'SELECT COUNT(*) FROM store_regular_levels WHERE store_id = $1',
        [storeId]
      );

      if (parseInt(existingLevels.rows[0].count) > 0) {
        console.log(`⏭️  매장 ${storeId}는 이미 레벨 시스템이 설정되어 있음 - 건너뜀`);
        continue;
      }

      // 각 등급별로 데이터 삽입
      for (const levelData of levels) {
        await client.query(`
          INSERT INTO store_regular_levels (
            store_id, 
            grade, 
            level, 
            min_orders, 
            min_spent, 
            benefits
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          storeId,
          levelData.grade,
          levelData.level,
          levelData.min_orders,
          levelData.min_spent,
          JSON.stringify(levelData.benefits)
        ]);

        insertCount++;
      }

      if (insertCount % 100 === 0) {
        console.log(`📝 진행 중... ${insertCount}개 레벨 데이터 생성됨`);
      }
    }

    await client.query('COMMIT');
    console.log(`✅ store_regular_levels 더미 데이터 ${insertCount}건 생성 완료!`);

    // 결과 확인
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT store_id) as stores_with_levels,
        COUNT(DISTINCT level) as unique_levels
      FROM store_regular_levels
    `);

    console.log('📊 생성된 데이터 요약:');
    console.log(`   - 총 레코드 수: ${summary.rows[0].total_records}`);
    console.log(`   - 레벨 시스템이 설정된 매장: ${summary.rows[0].stores_with_levels}`);
    console.log(`   - 고유 등급 수: ${summary.rows[0].unique_levels}`);

    // 등급별 통계
    const gradeStats = await client.query(`
      SELECT 
        grade,
        level,
        COUNT(*) as count,
        AVG(min_orders) as avg_min_orders,
        AVG(min_spent) as avg_min_spent
      FROM store_regular_levels
      GROUP BY grade, level
      ORDER BY grade
    `);

    console.log('\n📈 등급별 통계:');
    gradeStats.rows.forEach(stat => {
      console.log(`   - ${stat.level} (Grade ${stat.grade}): ${stat.count}개 매장`);
      console.log(`     최소 주문: ${stat.avg_min_orders}회, 최소 결제: ${parseInt(stat.avg_min_spent).toLocaleString()}원`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ store_regular_levels 더미 데이터 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
createStoreRegularLevelsDummy()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
