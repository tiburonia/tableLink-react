
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 서울 25개 구
const seoulDistricts = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구',
  '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구',
  '종로구', '중구', '중랑구'
];

// 매장 카테고리
const categories = [
  '한식', '중식', '일식', '양식', '카페', '치킨', '분식', '피자', '족발보쌈',
  '찜닭', '버거', '돈까스', '회/초밥', '이탈리안', '멕시칸', '베트남', '인도'
];

// 서울 좌표 범위
const seoulBounds = {
  minLat: 37.413294,
  maxLat: 37.715133,
  minLng: 126.734086,
  maxLng: 127.269311
};

// 랜덤 좌표 생성
function randomCoordinate() {
  return {
    lat: seoulBounds.minLat + Math.random() * (seoulBounds.maxLat - seoulBounds.minLat),
    lng: seoulBounds.minLng + Math.random() * (seoulBounds.maxLng - seoulBounds.minLng)
  };
}

// 랜덤 선택
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 랜덤 정수
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 사용자 더미데이터 생성
async function createDummyUsers() {
  const client = await pool.connect();
  
  try {
    console.log('👥 사용자 더미데이터 생성 시작...');
    
    const users = [
      { username: 'user2', name: '이영희', phone: '01012345679', email: 'user2@test.com' },
      { username: 'user3', name: '박민수', phone: '01012345680', email: 'user3@test.com' },
      { username: 'user4', name: '최지연', phone: '01012345681', email: 'user4@test.com' },
      { username: 'user5', name: '정태현', phone: '01012345682', email: 'user5@test.com' }
    ];

    for (const user of users) {
      try {
        await client.query(`
          INSERT INTO users (username, name, phone, email, password_hash, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'dummy_hash', NOW(), NOW())
          ON CONFLICT (username) DO NOTHING
        `, [user.username, user.name, user.phone, user.email]);
        
        console.log(`✅ 사용자 생성: ${user.name} (${user.username})`);
      } catch (error) {
        console.log(`⚠️ 사용자 ${user.username} 이미 존재하거나 스킵됨`);
      }
    }
    
  } catch (error) {
    console.error('❌ 사용자 생성 실패:', error);
  } finally {
    client.release();
  }
}

// 매장 더미데이터 생성
async function createSeoulStores() {
  const client = await pool.connect();
  
  try {
    console.log('🏪 서울 100개 매장 더미데이터 생성 시작...');
    
    // 기존 매장 수 확인
    const existingStores = await client.query('SELECT COUNT(*) FROM stores');
    console.log(`📊 기존 매장 수: ${existingStores.rows[0].count}개`);
    
    await client.query('BEGIN');
    
    for (let i = 1; i <= 100; i++) {
      try {
        const coord = randomCoordinate();
        const district = randomChoice(seoulDistricts);
        const category = randomChoice(categories);
        
        // stores 테이블에 매장 생성 (현재 스키마에 맞게)
        const storeResult = await client.query(`
          INSERT INTO stores (
            name, 
            category, 
            phone, 
            is_open, 
            rating, 
            review_count, 
            favorite_count,
            created_at, 
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING id
        `, [
          `${category} ${district} ${i}번점`,
          category,
          `02-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          Math.random() > 0.2, // 80% 확률로 영업중
          Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0 평점
          randomInt(5, 200), // 리뷰 수
          randomInt(0, 50) // 즐겨찾기 수
        ]);
        
        const storeId = storeResult.rows[0].id;
        
        // store_address 테이블에 주소 정보 추가
        await client.query(`
          INSERT INTO store_address (
            store_id,
            address,
            sido,
            sigungu,
            dong,
            latitude,
            longitude,
            address_status,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          storeId,
          `서울특별시 ${district} ${Math.floor(Math.random() * 999) + 1}`,
          '서울특별시',
          district,
          `${Math.floor(Math.random() * 9) + 1}동`,
          coord.lat,
          coord.lng,
          'completed'
        ]);
        
        // store_tables 테이블에 테이블 정보 추가 (2-6개)
        const tableCount = randomInt(2, 6);
        for (let t = 1; t <= tableCount; t++) {
          await client.query(`
            INSERT INTO store_tables (
              store_id,
              table_number,
              seats,
              status,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [
            storeId,
            t,
            randomInt(2, 8), // 2-8인석
            'available'
          ]);
        }
        
        console.log(`✅ 매장 ${i} 생성 완료: ${category} ${district} ${i}번점 (ID: ${storeId})`);
        
      } catch (error) {
        console.error(`❌ 매장 ${i} 생성 실패:`, error.message);
        throw error; // 트랜잭션 롤백을 위해 에러를 다시 throw
      }
    }
    
    await client.query('COMMIT');
    console.log('🎉 서울 100개 매장 생성 완료!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 매장 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 메뉴 더미데이터 생성
async function createMenusForStores() {
  const client = await pool.connect();
  
  try {
    console.log('🍽️ 매장 메뉴 더미데이터 생성 시작...');
    
    // 모든 매장 조회
    const stores = await client.query('SELECT id, name, category FROM stores');
    
    for (const store of stores.rows) {
      try {
        // 메뉴 그룹 생성
        const menuGroupResult = await client.query(`
          INSERT INTO menu_groups (store_id, name, display_order, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id
        `, [store.id, '대표메뉴', 1]);
        
        const groupId = menuGroupResult.rows[0].id;
        
        // 카테고리별 메뉴 생성
        const menuItems = getMenuItemsByCategory(store.category);
        
        for (let i = 0; i < menuItems.length; i++) {
          await client.query(`
            INSERT INTO menu_items (
              store_id,
              group_id,
              name,
              price,
              is_available,
              display_order,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          `, [
            store.id,
            groupId,
            menuItems[i].name,
            menuItems[i].price,
            true,
            i + 1
          ]);
        }
        
        console.log(`✅ ${store.name} 메뉴 생성 완료`);
        
      } catch (error) {
        console.error(`❌ ${store.name} 메뉴 생성 실패:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 메뉴 생성 실패:', error);
  } finally {
    client.release();
  }
}

// 카테고리별 메뉴 아이템
function getMenuItemsByCategory(category) {
  const menus = {
    '한식': [
      { name: '김치찌개', price: 8000 },
      { name: '된장찌개', price: 7000 },
      { name: '불고기', price: 15000 },
      { name: '비빔밥', price: 9000 }
    ],
    '중식': [
      { name: '짜장면', price: 6000 },
      { name: '짬뽕', price: 7000 },
      { name: '탕수육', price: 18000 },
      { name: '마파두부', price: 12000 }
    ],
    '일식': [
      { name: '초밥세트', price: 20000 },
      { name: '라멘', price: 9000 },
      { name: '돈카츠', price: 12000 },
      { name: '우동', price: 8000 }
    ],
    '양식': [
      { name: '스테이크', price: 25000 },
      { name: '파스타', price: 14000 },
      { name: '리조또', price: 16000 },
      { name: '샐러드', price: 10000 }
    ],
    '카페': [
      { name: '아메리카노', price: 4000 },
      { name: '카페라떼', price: 5000 },
      { name: '케이크', price: 6000 },
      { name: '샌드위치', price: 8000 }
    ],
    '치킨': [
      { name: '후라이드치킨', price: 18000 },
      { name: '양념치킨', price: 19000 },
      { name: '간장치킨', price: 19000 },
      { name: '맥주', price: 4000 }
    ]
  };
  
  return menus[category] || [
    { name: '대표메뉴 1', price: 10000 },
    { name: '대표메뉴 2', price: 12000 },
    { name: '대표메뉴 3', price: 15000 }
  ];
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🚀 서울 매장 더미데이터 생성 시작...');
    
    // 1. 사용자 생성
    await createDummyUsers();
    
    // 2. 매장 생성
    await createSeoulStores();
    
    // 3. 메뉴 생성
    await createMenusForStores();
    
    console.log('🎉 모든 더미데이터 생성 완료!');
    
  } catch (error) {
    console.error('❌ 더미데이터 생성 실패:', error);
  } finally {
    await pool.end();
  }
}

main();
