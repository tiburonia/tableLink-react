
const pool = require('./database');

async function initDatabase() {
  try {
    // stores 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        distance VARCHAR(50),
        menu JSONB,
        coord JSONB,
        review_count INTEGER DEFAULT 0,
        is_open BOOLEAN DEFAULT true,
        reviews JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // users 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        pw VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        phone VARCHAR(20),
        point INTEGER DEFAULT 0,
        order_list JSONB DEFAULT '[]'::jsonb,
        reservation_list JSONB DEFAULT '[]'::jsonb,
        coupons JSONB DEFAULT '{"unused": [], "used": []}'::jsonb,
        favorite_stores JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // carts 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        store_id INTEGER NOT NULL,
        store_name VARCHAR(100) NOT NULL,
        table_num VARCHAR(10),
        order_data JSONB NOT NULL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, store_id)
      )
    `);

    // reviews 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        store_id INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        order_date VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, order_index)
      )
    `);

    // store_tables 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_tables (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        table_number INTEGER NOT NULL,
        table_name VARCHAR(50) NOT NULL,
        seats INTEGER NOT NULL,
        is_occupied BOOLEAN DEFAULT false,
        occupied_since TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, table_number)
      )
    `);

    console.log('✅ 데이터베이스 테이블 초기화 완료');

    // 샘플 데이터 삽입 (기존 data.js의 stores 데이터 사용)
    await insertSampleData();

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
  }
}

async function insertSampleData() {
  // 기존 stores 데이터가 있는지 확인
  const existingStores = await pool.query('SELECT COUNT(*) FROM stores');

  if (parseInt(existingStores.rows[0].count) === 0) {
    // data.js에서 stores 데이터 가져와서 삽입
    const dataModule = require('./script/data.js');
    const stores = dataModule.stores || dataModule;

    for (const store of stores) {
      await pool.query(`
        INSERT INTO stores (id, name, category, distance, menu, coord, review_count, is_open, reviews)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        store.id,
        store.name,
        store.category,
        store.distance || '정보없음',
        JSON.stringify(store.menu || []),
        JSON.stringify(store.coord || { lat: 37.5665, lng: 126.9780 }),
        store.reviewCount || 0,
        store.isOpen !== false,
        JSON.stringify(store.reviews || [])
      ]);
    }

    console.log('✅ stores 샘플 데이터 삽입 완료');
  }

  // 기존 users 데이터가 있는지 확인
  const existingUsers = await pool.query('SELECT COUNT(*) FROM users WHERE id = $1', ['12']);

  if (parseInt(existingUsers.rows[0].count) === 0) {
    // 테스트용 사용자 생성
    await pool.query(`
      INSERT INTO users (id, pw, name, phone, point, order_list, coupons, favorite_stores)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      '12',
      '1234',
      '테스트사용자',
      '010-1234-5678',
      5000,
      JSON.stringify([]),
      JSON.stringify({ unused: [], used: [] }),
      JSON.stringify([])
    ]);

    console.log('✅ 테스트 사용자 생성 완료');
  }

  // 테이블 데이터 삽입
  const existingTables = await pool.query('SELECT COUNT(*) FROM store_tables');
  
  if (parseInt(existingTables.rows[0].count) === 0) {
    const storeIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    
    for (const storeId of storeIds) {
      // 각 매장에 10개의 테이블 생성
      for (let tableNum = 1; tableNum <= 10; tableNum++) {
        const seats = tableNum <= 2 ? 2 : tableNum <= 5 ? 4 : tableNum <= 7 ? 6 : 8;
        
        await pool.query(`
          INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied)
          VALUES ($1, $2, $3, $4, $5)
        `, [storeId, tableNum, `테이블 ${tableNum}`, seats, false]);
      }
    }
    
    console.log('✅ 테이블 샘플 데이터 삽입 완료');
  }

  // 더미 리뷰 데이터 삽입
  const existingReviews = await pool.query('SELECT COUNT(*) FROM reviews');
  
  if (parseInt(existingReviews.rows[0].count) === 0) {
    console.log('📝 더미 리뷰 데이터 생성 중...');
    
    // 각 매장마다 3-5개의 더미 리뷰 생성
    const storeIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    
    const dummyReviews = [
      { rating: 5, text: "음식이 정말 맛있고 서비스도 친절해요! 재방문 의사 100%입니다.", orderDate: "2025. 1. 15. 오후 2:30:00" },
      { rating: 4, text: "깔끔하고 맛있어요. 다만 조금 짜긴 하지만 전체적으로 만족합니다.", orderDate: "2025. 1. 18. 오후 6:15:30" },
      { rating: 5, text: "항상 맛있게 먹고 있어요. 사장님도 친절하시고 음식도 빨리 나와요.", orderDate: "2025. 1. 20. 오후 7:45:15" },
      { rating: 3, text: "보통이에요. 나쁘지 않지만 특별히 좋지도 않네요.", orderDate: "2025. 1. 22. 오후 1:20:45" },
      { rating: 4, text: "가격대비 괜찮은 것 같아요. 양도 충분하고 맛도 좋습니다.", orderDate: "2025. 1. 25. 오후 8:10:22" },
      { rating: 5, text: "정말 맛있어요! 친구들과 함께 와서 즐겁게 먹었습니다.", orderDate: "2025. 1. 26. 오후 12:30:18" }
    ];

    const userIds = ['user001', 'user002', 'user003', 'user004', 'user005', 'user006'];
    
    let reviewId = 1;
    
    for (const storeId of storeIds) {
      // 각 매장마다 3-5개의 리뷰 랜덤 생성
      const reviewCount = Math.floor(Math.random() * 3) + 3; // 3~5개
      
      for (let i = 0; i < reviewCount; i++) {
        const randomReview = dummyReviews[Math.floor(Math.random() * dummyReviews.length)];
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        
        try {
          await pool.query(`
            INSERT INTO reviews (user_id, store_id, order_index, rating, review_text, order_date, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
          `, [
            randomUserId,
            storeId,
            reviewId++, // 고유한 order_index 사용
            randomReview.rating,
            randomReview.text,
            randomReview.orderDate
          ]);
        } catch (error) {
          console.error(`❌ 매장 ${storeId} 리뷰 삽입 실패:`, error.message);
        }
      }
    }

    // stores 테이블의 review_count 업데이트
    for (const storeId of storeIds) {
      const reviewCountResult = await pool.query(
        'SELECT COUNT(*) as count FROM reviews WHERE store_id = $1',
        [storeId]
      );
      const count = parseInt(reviewCountResult.rows[0].count);
      
      await pool.query(
        'UPDATE stores SET review_count = $1 WHERE id = $2',
        [count, storeId]
      );
    }

    console.log('✅ 더미 리뷰 데이터 삽입 완료');
  }

  // 더미 사용자들 생성 (리뷰 작성자용)
  const dummyUsers = ['user001', 'user002', 'user003', 'user004', 'user005', 'user006'];
  
  for (const userId of dummyUsers) {
    const existingUser = await pool.query('SELECT COUNT(*) FROM users WHERE id = $1', [userId]);
    
    if (parseInt(existingUser.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO users (id, pw, name, phone, point, order_list, coupons, favorite_stores)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        userId,
        '1234',
        `사용자${userId.slice(-3)}`,
        `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        Math.floor(Math.random() * 10000),
        JSON.stringify([]),
        JSON.stringify({ unused: [], used: [] }),
        JSON.stringify([])
      ]);
    }
  }

  console.log('✅ 더미 사용자 생성 완료');
  console.log('🎉 모든 샘플 데이터 삽입 완료');
}

// 데이터베이스 초기화 실행
initDatabase().then(() => {
  console.log('🚀 데이터베이스 초기화 프로세스 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 초기화 프로세스 실패:', error);
  process.exit(1);
});
