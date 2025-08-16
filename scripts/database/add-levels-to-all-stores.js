
const pool = require('../../shared/config/database');

async function addLevelsToAllStores() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🏆 모든 매장에 기본 레벨 1~4 추가 시작...');

    // 1. 모든 매장 조회
    const storesResult = await client.query('SELECT id, name FROM stores ORDER BY id');
    const stores = storesResult.rows;

    console.log(`📋 총 ${stores.length}개 매장에 레벨 추가 예정`);

    // 2. 기본 레벨 템플릿 정의
    const defaultLevels = [
      {
        rank: 1,
        name: '브론즈',
        description: '신규 단골',
        requiredPoints: 0,
        requiredTotalSpent: 0,
        requiredVisitCount: 1,
        evalPolicy: 'OR',
        benefits: [
          {
            name: '신규 단골 환영 쿠폰',
            type: 'welcome_coupon',
            discount: 5,
            expires_days: 30
          }
        ]
      },
      {
        rank: 2,
        name: '실버',
        description: '단골 고객',
        requiredPoints: 100,
        requiredTotalSpent: 50000,
        requiredVisitCount: 5,
        evalPolicy: 'OR',
        benefits: [
          {
            name: '실버회원 10% 할인',
            type: 'member_coupon',
            discount: 10,
            expires_days: 30
          },
          {
            name: '무료 음료 쿠폰',
            type: 'free_drink',
            expires_days: 30
          }
        ]
      },
      {
        rank: 3,
        name: '골드',
        description: '우수 단골',
        requiredPoints: 500,
        requiredTotalSpent: 200000,
        requiredVisitCount: 15,
        evalPolicy: 'OR',
        benefits: [
          {
            name: '골드회원 15% 할인',
            type: 'vip_coupon',
            discount: 15,
            expires_days: 60
          },
          {
            name: '무료 사이드 메뉴',
            type: 'free_side',
            expires_days: 30
          },
          {
            name: '우선 주문 처리',
            type: 'priority_service',
            expires_days: 30
          }
        ]
      },
      {
        rank: 4,
        name: '플래티넘',
        description: 'VIP 단골',
        requiredPoints: 1000,
        requiredTotalSpent: 500000,
        requiredVisitCount: 30,
        evalPolicy: 'AND',
        benefits: [
          {
            name: '플래티넘회원 20% 할인',
            type: 'premium_coupon',
            discount: 20,
            expires_days: 90
          },
          {
            name: '매월 무료 메뉴',
            type: 'monthly_free',
            expires_days: 30
          },
          {
            name: 'VIP 전용 서비스',
            type: 'vip_service',
            expires_days: 365
          }
        ]
      }
    ];

    // 3. 각 매장별로 레벨 추가
    let totalAdded = 0;
    let skippedStores = 0;

    for (const store of stores) {
      try {
        // 기존 레벨이 있는지 확인
        const existingLevels = await client.query(
          'SELECT COUNT(*) as count FROM regular_levels WHERE store_id = $1',
          [store.id]
        );

        if (existingLevels.rows[0].count > 0) {
          console.log(`⏭️ 매장 ${store.id} (${store.name}): 기존 레벨이 있어 건너뜀`);
          skippedStores++;
          continue;
        }

        // 각 레벨 추가
        for (const level of defaultLevels) {
          await client.query(`
            INSERT INTO regular_levels (
              store_id, level_rank, name, description,
              required_points, required_total_spent, required_visit_count,
              eval_policy, benefits, is_active, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
          `, [
            store.id,
            level.rank,
            level.name,
            level.description,
            level.requiredPoints,
            level.requiredTotalSpent,
            level.requiredVisitCount,
            level.evalPolicy,
            JSON.stringify(level.benefits),
            true
          ]);

          totalAdded++;
        }

        console.log(`✅ 매장 ${store.id} (${store.name}): 레벨 1~4 추가 완료`);

      } catch (error) {
        console.error(`❌ 매장 ${store.id} (${store.name}) 레벨 추가 실패:`, error.message);
      }
    }

    // 4. 결과 요약
    console.log('\n📊 레벨 추가 완료 요약:');
    console.log(`- 총 매장 수: ${stores.length}개`);
    console.log(`- 레벨 추가된 매장: ${totalAdded / 4}개`);
    console.log(`- 건너뛴 매장: ${skippedStores}개`);
    console.log(`- 총 추가된 레벨: ${totalAdded}개`);

    // 5. 최종 검증
    const finalCount = await client.query('SELECT COUNT(*) as count FROM regular_levels');
    console.log(`✅ regular_levels 테이블 총 레코드: ${finalCount.rows[0].count}개`);

    await client.query('COMMIT');
    console.log('🎉 모든 매장 기본 레벨 추가 완료!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 레벨 추가 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  addLevelsToAllStores()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = addLevelsToAllStores;
