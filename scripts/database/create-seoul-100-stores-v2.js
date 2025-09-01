
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

// 실제 서울 지역 좌표 범위
const seoulBounds = {
  minLat: 37.413294,
  maxLat: 37.715133,
  minLng: 126.734086,
  maxLng: 127.269311
};

// 랜덤 좌표 생성
function generateRandomCoord() {
  const lat = seoulBounds.minLat + (Math.random() * (seoulBounds.maxLat - seoulBounds.minLat));
  const lng = seoulBounds.minLng + (Math.random() * (seoulBounds.maxLng - seoulBounds.minLng));
  return { lat, lng };
}

// 랜덤 주소 생성
function generateAddress(district) {
  const roads = ['로', '길', '대로'];
  const roadTypes = ['중앙', '테헤란', '강남', '종로', '명동', '홍대', '신촌', '건대'];
  
  const roadType = roadTypes[Math.floor(Math.random() * roadTypes.length)];
  const road = roads[Math.floor(Math.random() * roads.length)];
  const number = Math.floor(Math.random() * 500) + 1;
  
  return `서울특별시 ${district} ${roadType}${road} ${number}`;
}

async function createSeoul100Stores() {
  const client = await pool.connect();
  
  try {
    console.log('🏪 서울 100개 매장 더미데이터 생성 시작...');
    
    await client.query('BEGIN');
    
    // 1. 기존 데이터 확인
    const existingStores = await client.query('SELECT COUNT(*) as count FROM stores');
    console.log(`📊 기존 매장 수: ${existingStores.rows[0].count}개`);
    
    let createdStores = 0;
    let createdAddresses = 0;
    let createdTables = 0;
    
    // 2. 100개 매장 생성
    for (let i = 0; i < 100; i++) {
      const district = seoulDistricts[Math.floor(Math.random() * seoulDistricts.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const coord = generateRandomCoord();
      
      // 매장명 생성
      const storeNames = [
        `${district} ${category} 맛집`, `${category} 전문점`, `서울 ${category}`,
        `${district} 맛집`, `${category} 하우스`, `${district} ${category} 본점`
      ];
      const storeName = storeNames[Math.floor(Math.random() * storeNames.length)] + ` ${i + 1}호점`;
      
      // 매장 기본 정보 생성
      const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0 - 5.0
      const reviewCount = Math.floor(Math.random() * 500);
      const favoriteCount = Math.floor(Math.random() * 100);
      
      try {
        // stores 테이블에 삽입
        const storeResult = await client.query(`
          INSERT INTO stores (
            name, category, description, rating_average, review_count, 
            favorite_count, coord, is_open, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, POINT($7, $8), $9, NOW(), NOW())
          RETURNING id
        `, [
          storeName,
          category,
          `맛있는 ${category} 전문점입니다.`,
          parseFloat(rating),
          reviewCount,
          favoriteCount,
          coord.lng,
          coord.lat,
          Math.random() > 0.1 // 90% 확률로 영업중
        ]);
        
        const storeId = storeResult.rows[0].id;
        createdStores++;
        
        // store_address 테이블에 주소 정보 삽입
        const address = generateAddress(district);
        await client.query(`
          INSERT INTO store_address (
            store_id, address_full, sido, sigungu, dong, 
            latitude, longitude, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          storeId,
          address,
          '서울특별시',
          district,
          `${district.slice(0, -1)}동`,
          coord.lat,
          coord.lng
        ]);
        createdAddresses++;
        
        // store_tables 테이블에 테이블 정보 삽입 (4-8개 테이블)
        const tableCount = Math.floor(Math.random() * 5) + 4; // 4-8개
        
        for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
          const seats = Math.floor(Math.random() * 6) + 2; // 2-7인석
          const tableName = `테이블 ${tableNum}`;
          
          await client.query(`
            INSERT INTO store_tables (
              store_id, table_number, table_name, seats, 
              is_occupied, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
          `, [
            storeId,
            tableNum,
            tableName,
            seats,
            Math.random() < 0.3 // 30% 확률로 사용중
          ]);
          createdTables++;
        }
        
        // VIP룸, 커플석, 단체석 추가 (일부 매장에만)
        if (Math.random() < 0.3) { // 30% 확률
          // VIP룸
          await client.query(`
            INSERT INTO store_tables (
              store_id, table_number, table_name, seats, 
              is_occupied, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
          `, [storeId, 100, 'VIP룸 1', 8, false]);
          createdTables++;
        }
        
        if (Math.random() < 0.2) { // 20% 확률
          // 커플석
          await client.query(`
            INSERT INTO store_tables (
              store_id, table_number, table_name, seats, 
              is_occupied, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
          `, [storeId, 200, '커플석 1', 2, false]);
          createdTables++;
        }
        
        if (Math.random() < 0.15) { // 15% 확률
          // 단체석
          await client.query(`
            INSERT INTO store_tables (
              store_id, table_number, table_name, seats, 
              is_occupied, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
          `, [storeId, 300, '단체석 1', 12, false]);
          createdTables++;
        }
        
        if ((i + 1) % 20 === 0) {
          console.log(`📈 진행률: ${i + 1}/100 매장 생성 완료`);
        }
        
      } catch (error) {
        console.error(`❌ 매장 ${i + 1} 생성 실패:`, error.message);
      }
    }
    
    // 3. 일부 매장에 메뉴 그룹 및 메뉴 아이템 생성
    console.log('🍽️ 매장별 메뉴 생성 중...');
    
    const stores = await client.query('SELECT id FROM stores ORDER BY id DESC LIMIT 50');
    
    for (const store of stores.rows) {
      try {
        // 메뉴 그룹 생성
        const menuGroupResult = await client.query(`
          INSERT INTO menu_groups (store_id, name, sort_order, is_active)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [store.id, '대표메뉴', 1, true]);
        
        const groupId = menuGroupResult.rows[0].id;
        
        // 메뉴 아이템 3-5개 생성
        const menuCount = Math.floor(Math.random() * 3) + 3;
        const menuNames = ['시그니처 메뉴', '인기메뉴', '추천메뉴', '특별메뉴', '프리미엄 메뉴'];
        
        for (let j = 0; j < menuCount; j++) {
          const price = (Math.floor(Math.random() * 20) + 5) * 1000; // 5,000 - 25,000원
          await client.query(`
            INSERT INTO menu_items (
              store_id, group_id, name, price, description, 
              is_available, sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            store.id,
            groupId,
            `${menuNames[j % menuNames.length]} ${j + 1}`,
            price,
            '맛있는 메뉴입니다.',
            true,
            j + 1
          ]);
        }
      } catch (error) {
        console.warn(`⚠️ 매장 ${store.id} 메뉴 생성 실패:`, error.message);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n🎉 서울 100개 매장 더미데이터 생성 완료!');
    console.log(`📊 생성 결과:`);
    console.log(`  ✅ 매장: ${createdStores}개`);
    console.log(`  ✅ 주소: ${createdAddresses}개`);
    console.log(`  ✅ 테이블: ${createdTables}개`);
    
    // 최종 확인
    const finalCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM stores) as stores,
        (SELECT COUNT(*) FROM store_address) as addresses,
        (SELECT COUNT(*) FROM store_tables) as tables,
        (SELECT COUNT(*) FROM menu_groups) as menu_groups,
        (SELECT COUNT(*) FROM menu_items) as menu_items
    `);
    
    const counts = finalCheck.rows[0];
    console.log(`\n📈 전체 데이터 현황:`);
    console.log(`  - 매장: ${counts.stores}개`);
    console.log(`  - 주소: ${counts.addresses}개`);
    console.log(`  - 테이블: ${counts.tables}개`);
    console.log(`  - 메뉴 그룹: ${counts.menu_groups}개`);
    console.log(`  - 메뉴 아이템: ${counts.menu_items}개`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 매장 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 사용자 더미데이터도 함께 생성
async function createDummyUsers() {
  const client = await pool.connect();
  
  try {
    console.log('👥 사용자 더미데이터 생성 중...');
    
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCount.rows[0].count) >= 10) {
      console.log('✅ 이미 충분한 사용자 데이터가 있습니다.');
      return;
    }
    
    const users = [
      { id: 'user1', name: '김철수', phone: '010-1234-5678', email: 'user1@test.com' },
      { id: 'user2', name: '이영희', phone: '010-2345-6789', email: 'user2@test.com' },
      { id: 'user3', name: '박민수', phone: '010-3456-7890', email: 'user3@test.com' },
      { id: 'user4', name: '최지연', phone: '010-4567-8901', email: 'user4@test.com' },
      { id: 'user5', name: '정태현', phone: '010-5678-9012', email: 'user5@test.com' }
    ];
    
    for (const user of users) {
      try {
        await client.query(`
          INSERT INTO users (id, pw, name, phone, email, point, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          user.id,
          'password123', // 간단한 테스트 패스워드
          user.name,
          user.phone,
          user.email,
          Math.floor(Math.random() * 10000) // 0-10000 포인트
        ]);
        console.log(`✅ 사용자 생성: ${user.name} (${user.id})`);
      } catch (error) {
        console.warn(`⚠️ 사용자 ${user.id} 생성 실패:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 사용자 생성 실패:', error);
  } finally {
    client.release();
  }
}

// 메인 실행
async function main() {
  try {
    await createDummyUsers();
    await createSeoul100Stores();
    console.log('🎊 모든 더미데이터 생성 완료!');
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createSeoul100Stores, createDummyUsers };
