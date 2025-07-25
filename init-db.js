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
    console.log('✅ carts 테이블 생성 완료');

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
        store.distance,
        JSON.stringify(store.menu),
        JSON.stringify(store.coord),
        store.reviewCount,
        store.isOpen,
        JSON.stringify(store.reviews)
      ]);
    }

    console.log('✅ 샘플 stores 데이터 삽입 완료');
  }

  // 기존 users 데이터가 있는지 확인
  const existingUsers = await pool.query('SELECT COUNT(*) FROM users');

  if (parseInt(existingUsers.rows[0].count) === 0) {
    // loginInfo.js의 users 데이터 삽입
    const testUsers = {
      "12": {
        pw: "12",
        name: '',
        phone: '',
        point: 0,
        order_list: [],
        reservation_list: [],
        coupons: { unused: [], used: [] },
        favorite_stores: []
      }
    };

    // user1~user10 테스트 계정들 생성 (loginInfo.js와 동일하게)
    for (let i = 1; i <= 10; i++) {
      const userId = `user${i}`;
      testUsers[userId] = {
        pw: `${i}${i}`, // 11, 22, 33, ...
        name: `테스트유저${i}`,
        phone: `010-0000-000${i}`,
        point: 0,
        order_list: [],
        reservation_list: [],
        coupons: { unused: [], used: [] },
        favorite_stores: []
      };
    }

    // 데이터베이스에 삽입
    for (const [userId, userData] of Object.entries(testUsers)) {
      await pool.query(`
        INSERT INTO users (id, pw, name, phone, point, order_list, reservation_list, coupons, favorite_stores)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        userId,
        userData.pw,
        userData.name,
        userData.phone,
        userData.point,
        JSON.stringify(userData.order_list),
        JSON.stringify(userData.reservation_list),
        JSON.stringify(userData.coupons),
        JSON.stringify(userData.favorite_stores)
      ]);
    }

    console.log('✅ 샘플 users 데이터 삽입 완료');
  }
}

// 모듈을 직접 실행할 때만 초기화 실행
if (require.main === module) {
  initDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = { initDatabase };