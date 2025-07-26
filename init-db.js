
const pool = require('./database');

async function initDatabase() {
  try {
    // stores 테이블 생성 (reviews 컬럼 제거)
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

    // reviews 테이블 생성 (stores와 관계 설정)
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
        UNIQUE(user_id, order_index),
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // store_tables 테이블 생성 (stores와 관계 설정)
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
        UNIQUE(store_id, table_number),
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ 데이터베이스 테이블 초기화 완료');

    // 기존 stores 테이블에서 reviews 컬럼 제거 (이미 존재하는 경우)
    try {
      await pool.query(`ALTER TABLE stores DROP COLUMN IF EXISTS reviews`);
      console.log('✅ stores 테이블에서 reviews 컬럼 제거 완료');
    } catch (error) {
      console.log('ℹ️ reviews 컬럼이 이미 존재하지 않음');
    }

    // 샘플 데이터 삽입
    await insertSampleData();

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
  }
}

async function insertSampleData() {
  // 기존 stores 데이터가 있는지 확인
  const existingStores = await pool.query('SELECT COUNT(*) FROM stores');

  if (parseInt(existingStores.rows[0].count) === 0) {
    // data.js에서 stores 데이터 가져와서 삽입 (reviews 제외)
    const dataModule = require('./script/data.js');
    const stores = dataModule.stores || dataModule;

    for (const store of stores) {
      await pool.query(`
        INSERT INTO stores (id, name, category, distance, menu, coord, review_count, is_open)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        store.id,
        store.name,
        store.category,
        store.distance || '정보없음',
        JSON.stringify(store.menu || []),
        JSON.stringify(store.coord || { lat: 37.5665, lng: 126.9780 }),
        0, // review_count는 나중에 계산
        store.isOpen !== false
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
    
    // 더미 사용자들 먼저 생성 (아이디 12 포함)
    const dummyUsers = [
      { id: '12', name: '테스트사용자' }, // 실제 사용자 12
      { id: 'user001', name: '배고픈곰' },
      { id: 'user002', name: '익명1' },
      { id: 'user003', name: '이현수' },
      { id: 'user004', name: '푸드파이터' },
      { id: 'user005', name: '치킨광' },
      { id: 'user006', name: '매운맛사랑' },
      { id: 'user007', name: '맛집탐험가' },
      { id: 'user008', name: '치킨러버' },
      { id: 'user009', name: '분식마니아' }
    ];
    
    for (const user of dummyUsers) {
      // 아이디 12는 이미 존재하므로 건너뛰기
      if (user.id === '12') continue;
      
      const existingUser = await pool.query('SELECT COUNT(*) FROM users WHERE id = $1', [user.id]);
      
      if (parseInt(existingUser.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO users (id, pw, name, phone, point, order_list, coupons, favorite_stores)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          user.id,
          '1234',
          user.name,
          `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          Math.floor(Math.random() * 10000),
          JSON.stringify([]),
          JSON.stringify({ unused: [], used: [] }),
          JSON.stringify([])
        ]);
      }
    }

    // 각 매장마다 더미 리뷰 생성
    const storeIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    
    const dummyReviews = [
      { rating: 5, text: "음식이 정말 맛있고 서비스도 친절해요! 재방문 의사 100%입니다.", orderDate: "2025. 1. 15. 오후 2:30:00" },
      { rating: 4, text: "깔끔하고 맛있어요. 다만 조금 짜긴 하지만 전체적으로 만족합니다.", orderDate: "2025. 1. 18. 오후 6:15:30" },
      { rating: 5, text: "항상 맛있게 먹고 있어요. 사장님도 친절하시고 음식도 빨리 나와요.", orderDate: "2025. 1. 20. 오후 7:45:15" },
      { rating: 3, text: "보통이에요. 나쁘지 않지만 특별히 좋지도 않네요.", orderDate: "2025. 1. 22. 오후 1:20:45" },
      { rating: 4, text: "가격대비 괜찮은 것 같아요. 양도 충분하고 맛도 좋습니다.", orderDate: "2025. 1. 25. 오후 8:10:22" },
      { rating: 5, text: "정말 맛있어요! 친구들과 함께 와서 즐겁게 먹었습니다.", orderDate: "2025. 1. 26. 오후 12:30:18" },
      { rating: 4, text: "배달도 빨라요. 포장 상태도 깔끔했어요.", orderDate: "2025. 1. 27. 오후 1:00:00" },
      { rating: 3, text: "다음에 또 올게요. 분위기가 좋네요.", orderDate: "2025. 1. 28. 오후 2:00:00" },
      { rating: 5, text: "음식 나오는 속도도 빠르고 맛도 좋습니다!", orderDate: "2025. 1. 29. 오후 3:00:00" },
      { rating: 4, text: "추천합니다! 가족과 함께 먹기 좋아요.", orderDate: "2025. 1. 30. 오후 4:00:00" },
      { rating: 2, text: "가격도 괜찮고 맛도 좋지만 양이 조금 적어요.", orderDate: "2025. 2. 1. 오후 5:00:00" },
      { rating: 5, text: "친절하고 빠름! 단골 될 것 같아요.", orderDate: "2025. 2. 2. 오후 6:00:00" },
      { rating: 4, text: "테스트1", orderDate: "2025. 7. 25. 오후 7:30:22" }, // 아이디 12 스타일 리뷰
      { rating: 5, text: "너무 맛있어요! 최고입니다.", orderDate: "2025. 7. 26. 오후 7:00:29" },
      { rating: 3, text: "괜찮네요. 다시 올 의향 있어요.", orderDate: "2025. 7. 20. 오후 6:30:15" }
    ];

    let orderIndex = 100000; // 큰 숫자로 시작하여 중복 방지
    
    for (const storeId of storeIds) {
      // 각 매장마다 10-15개의 리뷰 생성
      const reviewCount = Math.floor(Math.random() * 6) + 10; // 10~15개
      
      for (let i = 0; i < reviewCount; i++) {
        const randomReview = dummyReviews[Math.floor(Math.random() * dummyReviews.length)];
        const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)];
        
        try {
          await pool.query(`
            INSERT INTO reviews (user_id, store_id, order_index, rating, review_text, order_date, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
          `, [
            randomUser.id,
            storeId,
            orderIndex++, // 고유한 order_index 사용
            randomReview.rating,
            randomReview.text,
            randomReview.orderDate
          ]);
        } catch (error) {
          console.error(`❌ 매장 ${storeId} 리뷰 삽입 실패:`, error.message);
        }
      }
      
      // 아이디 12 전용 리뷰 몇 개 추가 (각 매장에 1-2개씩)
      const user12ReviewCount = Math.floor(Math.random() * 2) + 1; // 1~2개
      
      for (let j = 0; j < user12ReviewCount; j++) {
        const user12Review = dummyReviews[Math.floor(Math.random() * dummyReviews.length)];
        
        try {
          await pool.query(`
            INSERT INTO reviews (user_id, store_id, order_index, rating, review_text, order_date, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${Math.floor(Math.random() * 15)} days')
          `, [
            '12', // 실제 사용자 12
            storeId,
            orderIndex++,
            user12Review.rating,
            user12Review.text,
            user12Review.orderDate
          ]);
        } catch (error) {
          console.error(`❌ 매장 ${storeId} 사용자 12 리뷰 삽입 실패:`, error.message);
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
