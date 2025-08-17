
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addChickenBunshikRegularLevels() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🏪 치킨천국과 분식왕국 단골 레벨 시스템 생성 시작');
    
    // 1. 치킨천국 (store_id: 1) 단골 레벨 시스템
    console.log('🍗 치킨천국 단골 레벨 생성 중...');
    
    // 기존 레벨 삭제 (있다면)
    await client.query('DELETE FROM regular_levels WHERE store_id = 1');
    
    const chickenLevels = [
      {
        name: '브론즈',
        rank: 1,
        description: '치킨 입문자',
        requiredPoints: 0,
        requiredTotalSpent: 0,
        requiredVisitCount: 1,
        evalPolicy: 'OR',
        benefits: [
          {
            name: '브론즈회원 5% 할인',
            type: 'discount_coupon',
            discount: 5,
            expires_days: 30
          },
          {
            name: '생일 치킨 1조각 서비스',
            type: 'birthday_gift',
            expires_days: 365
          }
        ]
      },
      {
        name: '실버',
        rank: 2,
        description: '치킨 애호가',
        requiredPoints: 300,
        requiredTotalSpent: 50000,
        requiredVisitCount: 5,
        evalPolicy: 'AND',
        benefits: [
          {
            name: '실버회원 10% 할인',
            type: 'loyalty_coupon',
            discount: 10,
            expires_days: 30
          },
          {
            name: '콜라 무료 서비스',
            type: 'free_drink',
            expires_days: 30
          }
        ]
      },
      {
        name: '골드',
        rank: 3,
        description: '치킨 마니아',
        requiredPoints: 500,
        requiredTotalSpent: 200000,
        requiredVisitCount: 15,
        evalPolicy: 'AND',
        benefits: [
          {
            name: '골드회원 15% 할인',
            type: 'vip_coupon',
            discount: 15,
            expires_days: 60
          },
          {
            name: '음료 무료 쿠폰',
            type: 'free_drink',
            expires_days: 30
          },
          {
            name: '치킨무 추가 서비스',
            type: 'free_side',
            expires_days: 30
          }
        ]
      },
      {
        name: '플래티넘',
        rank: 4,
        description: '치킨 전문가',
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
            name: '매월 치킨 1마리 무료',
            type: 'monthly_free',
            expires_days: 30
          },
          {
            name: '우선 주문 처리',
            type: 'priority_service',
            expires_days: 365
          }
        ]
      }
    ];
    
    for (const level of chickenLevels) {
      await client.query(`
        INSERT INTO regular_levels (
          store_id, level_rank, name, description,
          required_points, required_total_spent, required_visit_count,
          eval_policy, benefits, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      `, [
        1, level.rank, level.name, level.description,
        level.requiredPoints, level.requiredTotalSpent, level.requiredVisitCount,
        level.evalPolicy, JSON.stringify(level.benefits), true
      ]);
      
      console.log(`  ✅ 치킨천국 ${level.name} 레벨 생성 완료`);
    }
    
    // 2. 분식왕국 (store_id: 2) 단골 레벨 시스템
    console.log('🍜 분식왕국 단골 레벨 생성 중...');
    
    // 분식왕국 매장이 없다면 생성
    const bunshikStore = await client.query('SELECT id FROM stores WHERE name = $1', ['분식왕국']);
    let bunshikStoreId;
    
    if (bunshikStore.rows.length === 0) {
      const newStore = await client.query(`
        INSERT INTO stores (
          name, category, address, sido, sigungu, eupmyeondong,
          coord, is_open, created_at
        ) VALUES (
          '분식왕국', '분식', '서울특별시 강남구 역삼동',
          '서울특별시', '강남구', '역삼동',
          '{"lat": 37.500600, "lng": 127.036800}', true, CURRENT_TIMESTAMP
        ) RETURNING id
      `);
      bunshikStoreId = newStore.rows[0].id;
      console.log(`  🆕 분식왕국 매장 생성 완료 (ID: ${bunshikStoreId})`);
    } else {
      bunshikStoreId = bunshikStore.rows[0].id;
      console.log(`  📍 분식왕국 매장 발견 (ID: ${bunshikStoreId})`);
    }
    
    // 기존 레벨 삭제 (있다면)
    await client.query('DELETE FROM regular_levels WHERE store_id = $1', [bunshikStoreId]);
    
    const bunshikLevels = [
      {
        name: '브론즈',
        rank: 1,
        description: '분식 입문자',
        requiredPoints: 0,
        requiredTotalSpent: 0,
        requiredVisitCount: 1,
        evalPolicy: 'OR',
        benefits: [
          {
            name: '브론즈회원 5% 할인',
            type: 'discount_coupon',
            discount: 5,
            expires_days: 30
          },
          {
            name: '김치 추가 서비스',
            type: 'free_side',
            expires_days: 30
          }
        ]
      },
      {
        name: '실버',
        rank: 2,
        description: '분식 애호가',
        requiredPoints: 300,
        requiredTotalSpent: 30000,
        requiredVisitCount: 5,
        evalPolicy: 'AND',
        benefits: [
          {
            name: '실버회원 10% 할인',
            type: 'loyalty_coupon',
            discount: 10,
            expires_days: 30
          },
          {
            name: '떡볶이 곱빼기 서비스',
            type: 'free_upgrade',
            expires_days: 30
          },
          {
            name: '음료 무료 서비스',
            type: 'free_drink',
            expires_days: 30
          }
        ]
      },
      {
        name: '골드',
        rank: 3,
        description: '분식 마니아',
        requiredPoints: 500,
        requiredTotalSpent: 100000,
        requiredVisitCount: 12,
        evalPolicy: 'AND',
        benefits: [
          {
            name: '골드회원 15% 할인',
            type: 'vip_coupon',
            discount: 15,
            expires_days: 60
          },
          {
            name: '순대 무료 추가',
            type: 'free_side',
            expires_days: 30
          },
          {
            name: '생일 떡볶이 세트 무료',
            type: 'birthday_gift',
            expires_days: 365
          }
        ]
      },
      {
        name: '플래티넘',
        rank: 4,
        description: '분식 전문가',
        requiredPoints: 800,
        requiredTotalSpent: 300000,
        requiredVisitCount: 25,
        evalPolicy: 'AND',
        benefits: [
          {
            name: '플래티넘회원 20% 할인',
            type: 'premium_coupon',
            discount: 20,
            expires_days: 90
          },
          {
            name: '매월 떡볶이 세트 무료',
            type: 'monthly_free',
            expires_days: 30
          },
          {
            name: '신메뉴 우선 체험',
            type: 'early_access',
            expires_days: 365
          },
          {
            name: '우선 주문 처리',
            type: 'priority_service',
            expires_days: 365
          }
        ]
      }
    ];
    
    for (const level of bunshikLevels) {
      await client.query(`
        INSERT INTO regular_levels (
          store_id, level_rank, name, description,
          required_points, required_total_spent, required_visit_count,
          eval_policy, benefits, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      `, [
        bunshikStoreId, level.rank, level.name, level.description,
        level.requiredPoints, level.requiredTotalSpent, level.requiredVisitCount,
        level.evalPolicy, JSON.stringify(level.benefits), true
      ]);
      
      console.log(`  ✅ 분식왕국 ${level.name} 레벨 생성 완료`);
    }
    
    // 3. 사용자별 통계 재계산
    console.log('📊 사용자 단골 레벨 재계산 중...');
    
    // user1의 치킨천국 레벨 재계산
    await client.query(`
      SELECT calculate_regular_level('user1', 1, 
        (SELECT points FROM user_store_stats WHERE user_id = 'user1' AND store_id = 1),
        (SELECT total_spent FROM user_store_stats WHERE user_id = 'user1' AND store_id = 1),
        (SELECT visit_count FROM user_store_stats WHERE user_id = 'user1' AND store_id = 1)
      )
    `);
    
    // user1의 분식왕국 기본 통계 생성 (없다면)
    const bunshikStats = await client.query(
      'SELECT * FROM user_store_stats WHERE user_id = $1 AND store_id = $2',
      ['user1', bunshikStoreId]
    );
    
    if (bunshikStats.rows.length === 0) {
      await client.query(`
        INSERT INTO user_store_stats (
          user_id, store_id, points, total_spent, visit_count,
          current_level_id, created_at, updated_at
        ) VALUES ($1, $2, 300, 30000, 1, 
          (SELECT id FROM regular_levels WHERE store_id = $2 AND level_rank = 2),
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `, ['user1', bunshikStoreId]);
      
      console.log('  ✅ user1 분식왕국 기본 통계 생성 완료');
    }
    
    await client.query('COMMIT');
    
    console.log('🎉 치킨천국과 분식왕국 단골 레벨 시스템 생성 완료!');
    console.log('📊 생성된 레벨:');
    console.log('   🍗 치킨천국: 브론즈, 실버, 골드, 플래티넘');
    console.log('   🍜 분식왕국: 브론즈, 실버, 골드, 플래티넘');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 단골 레벨 시스템 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  addChickenBunshikRegularLevels()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { addChickenBunshikRegularLevels };
