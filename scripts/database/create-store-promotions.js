
const pool = require('../../shared/config/database');

async function createStorePromotions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🎉 매장 프로모션 시스템 생성 시작...');
    
    // 1. store_promotions 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_promotions (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL, -- 'discount', 'point', 'free_delivery', 'new_customer', 'loyalty' 등
        discount_percent INTEGER DEFAULT 0,
        discount_amount INTEGER DEFAULT 0,
        point_rate INTEGER DEFAULT 0,
        min_order_amount INTEGER DEFAULT 0,
        max_discount_amount INTEGER DEFAULT 0,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        usage_limit INTEGER DEFAULT NULL, -- NULL이면 무제한
        usage_count INTEGER DEFAULT 0,
        target_customers VARCHAR(50) DEFAULT 'all', -- 'all', 'new', 'regular', 'vip' 등
        conditions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ store_promotions 테이블 생성 완료');
    
    // 2. 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_promotions_store_active 
      ON store_promotions(store_id, is_active);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_promotions_dates 
      ON store_promotions(start_date, end_date);
    `);
    
    console.log('✅ 프로모션 인덱스 생성 완료');
    
    // 3. 치킨천국 프로모션 데이터 추가
    const chickenStoreResult = await client.query(
      "SELECT id FROM stores WHERE name = '치킨천국' LIMIT 1"
    );
    
    if (chickenStoreResult.rows.length > 0) {
      const chickenStoreId = chickenStoreResult.rows[0].id;
      
      // 치킨천국 프로모션들
      const chickenPromotions = [
        {
          name: '신규 고객 20% 할인',
          description: '첫 주문 시 전 메뉴 20% 할인',
          type: 'new_customer',
          discount_percent: 20,
          max_discount_amount: 5000,
          target_customers: 'new',
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
        },
        {
          name: '3만원 이상 무료배송',
          description: '3만원 이상 주문 시 배송비 무료',
          type: 'free_delivery',
          min_order_amount: 30000,
          target_customers: 'all'
        },
        {
          name: '단골 고객 15% 할인',
          description: '5회 이상 방문 고객 15% 할인',
          type: 'loyalty',
          discount_percent: 15,
          max_discount_amount: 8000,
          target_customers: 'regular'
        },
        {
          name: '포인트 2배 적립',
          description: '이번 주 모든 주문 포인트 2배 적립',
          type: 'point',
          point_rate: 200, // 2배 = 200%
          target_customers: 'all',
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후
        }
      ];
      
      for (const promo of chickenPromotions) {
        await client.query(`
          INSERT INTO store_promotions (
            store_id, name, description, type, discount_percent, discount_amount,
            point_rate, min_order_amount, max_discount_amount, target_customers, end_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          chickenStoreId, promo.name, promo.description, promo.type,
          promo.discount_percent || 0, promo.discount_amount || 0,
          promo.point_rate || 0, promo.min_order_amount || 0,
          promo.max_discount_amount || 0, promo.target_customers,
          promo.end_date || null
        ]);
      }
      
      console.log(`✅ 치킨천국 프로모션 ${chickenPromotions.length}개 추가 완료`);
    }
    
    // 4. 분식왕국 프로모션 데이터 추가
    const bunshikStoreResult = await client.query(
      "SELECT id FROM stores WHERE name = '분식왕국' LIMIT 1"
    );
    
    if (bunshikStoreResult.rows.length > 0) {
      const bunshikStoreId = bunshikStoreResult.rows[0].id;
      
      // 분식왕국 프로모션들
      const bunshikPromotions = [
        {
          name: '첫방문 고객 5천원 할인',
          description: '신규 고객 첫 주문 시 5천원 할인',
          type: 'new_customer',
          discount_amount: 5000,
          min_order_amount: 15000,
          target_customers: 'new'
        },
        {
          name: '2만원 이상 떡볶이 무료',
          description: '2만원 이상 주문 시 떡볶이 무료 제공',
          type: 'discount',
          min_order_amount: 20000,
          target_customers: 'all'
        },
        {
          name: 'VIP 고객 25% 할인',
          description: '골드 등급 이상 고객 25% 할인',
          type: 'loyalty',
          discount_percent: 25,
          max_discount_amount: 10000,
          target_customers: 'vip'
        },
        {
          name: '점심시간 특가',
          description: '오전 11시-오후 2시 10% 할인',
          type: 'discount',
          discount_percent: 10,
          max_discount_amount: 3000,
          target_customers: 'all',
          conditions: JSON.stringify({
            time_range: { start: '11:00', end: '14:00' }
          })
        }
      ];
      
      for (const promo of bunshikPromotions) {
        await client.query(`
          INSERT INTO store_promotions (
            store_id, name, description, type, discount_percent, discount_amount,
            min_order_amount, max_discount_amount, target_customers, conditions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          bunshikStoreId, promo.name, promo.description, promo.type,
          promo.discount_percent || 0, promo.discount_amount || 0,
          promo.min_order_amount || 0, promo.max_discount_amount || 0,
          promo.target_customers, promo.conditions || '{}'
        ]);
      }
      
      console.log(`✅ 분식왕국 프로모션 ${bunshikPromotions.length}개 추가 완료`);
    }
    
    // 5. 다른 매장들에도 랜덤 프로모션 추가 (5개 매장)
    const randomStoresResult = await client.query(`
      SELECT id, name FROM stores 
      WHERE name NOT IN ('치킨천국', '분식왕국')
      ORDER BY RANDOM()
      LIMIT 5
    `);
    
    const basicPromotions = [
      {
        name: '신규 고객 10% 할인',
        description: '첫 주문 고객 10% 할인 혜택',
        type: 'new_customer',
        discount_percent: 10,
        target_customers: 'new'
      },
      {
        name: '배달비 무료',
        description: '2만원 이상 주문 시 배달비 무료',
        type: 'free_delivery',
        min_order_amount: 20000,
        target_customers: 'all'
      },
      {
        name: '포인트 1.5배 적립',
        description: '이벤트 기간 포인트 1.5배 적립',
        type: 'point',
        point_rate: 150,
        target_customers: 'all'
      }
    ];
    
    for (const store of randomStoresResult.rows) {
      const randomPromo = basicPromotions[Math.floor(Math.random() * basicPromotions.length)];
      
      await client.query(`
        INSERT INTO store_promotions (
          store_id, name, description, type, discount_percent, 
          point_rate, min_order_amount, target_customers
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        store.id, randomPromo.name, randomPromo.description, randomPromo.type,
        randomPromo.discount_percent || 0, randomPromo.point_rate || 0,
        randomPromo.min_order_amount || 0, randomPromo.target_customers
      ]);
    }
    
    console.log(`✅ 기타 매장 프로모션 ${randomStoresResult.rows.length}개 추가 완료`);
    
    await client.query('COMMIT');
    
    // 6. 최종 결과 확인
    const totalPromotionsResult = await client.query(
      'SELECT COUNT(*) as total FROM store_promotions WHERE is_active = true'
    );
    
    console.log('🎉 매장 프로모션 시스템 생성 완료!');
    console.log(`📊 총 ${totalPromotionsResult.rows[0].total}개의 활성 프로모션이 생성되었습니다.`);
    
    // 치킨천국 프로모션 확인
    const chickenPromosResult = await client.query(`
      SELECT name, type, discount_percent, discount_amount
      FROM store_promotions 
      WHERE store_id = (SELECT id FROM stores WHERE name = '치킨천국' LIMIT 1)
      AND is_active = true
    `);
    
    console.log('\n🐔 치킨천국 프로모션 목록:');
    chickenPromosResult.rows.forEach((promo, index) => {
      console.log(`   ${index + 1}. ${promo.name} (${promo.type})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 매장 프로모션 시스템 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  createStorePromotions()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = createStorePromotions;
