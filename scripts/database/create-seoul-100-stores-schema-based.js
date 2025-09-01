
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
function generateRandomCoord() {
  const lat = seoulBounds.minLat + (Math.random() * (seoulBounds.maxLat - seoulBounds.minLat));
  const lng = seoulBounds.minLng + (Math.random() * (seoulBounds.maxLng - seoulBounds.minLng));
  return { 
    lat: parseFloat(lat.toFixed(8)), 
    lng: parseFloat(lng.toFixed(8)) 
  };
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

// 읍면동 생성
function generateEupmyeondong(district) {
  const dongSuffixes = ['동', '가', '로'];
  const dongNames = ['역삼', '논현', '청담', '압구정', '신사', '대치', '개포', '일원', '수서'];
  
  const name = dongNames[Math.floor(Math.random() * dongNames.length)];
  const suffix = dongSuffixes[Math.floor(Math.random() * dongSuffixes.length)];
  
  return `${name}${suffix}`;
}

// 더미 사용자 생성
async function createDummyUsers() {
  const client = await pool.connect();
  
  try {
    console.log('👥 더미 사용자 생성 시작...');
    
    const users = [
      { id: 'user1', name: '김철수', phone: '01011111111', email: 'user1@test.com' },
      { id: 'user2', name: '이영희', phone: '01022222222', email: 'user2@test.com' },
      { id: 'user3', name: '박민수', phone: '01033333333', email: 'user3@test.com' },
      { id: 'user4', name: '최지연', phone: '01044444444', email: 'user4@test.com' },
      { id: 'user5', name: '정태현', phone: '01055555555', email: 'user5@test.com' },
      { id: 'user6', name: '황미영', phone: '01066666666', email: 'user6@test.com' },
      { id: 'user7', name: '안동훈', phone: '01077777777', email: 'user7@test.com' },
      { id: 'user8', name: '서윤아', phone: '01088888888', email: 'user8@test.com' },
      { id: 'user9', name: '장준혁', phone: '01099999999', email: 'user9@test.com' },
      { id: 'user10', name: '조아라', phone: '01010101010', email: 'user10@test.com' }
    ];
    
    for (const user of users) {
      try {
        await client.query(`
          INSERT INTO users (id, password_hash, name, phone, email, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          user.id,
          'dummy_hash_password',
          user.name,
          user.phone,
          user.email
        ]);
        
        console.log(`✅ 사용자 생성: ${user.name} (${user.id})`);
      } catch (error) {
        console.log(`⚠️ 사용자 ${user.id} 이미 존재하거나 스킵됨`);
      }
    }
    
  } catch (error) {
    console.error('❌ 사용자 생성 실패:', error);
  } finally {
    client.release();
  }
}

// 서울 100개 매장 생성
async function createSeoul100Stores() {
  const client = await pool.connect();
  
  try {
    console.log('🏪 서울 100개 매장 더미데이터 생성 시작...');
    
    await client.query('BEGIN');
    
    let createdStores = 0;
    let createdAddresses = 0;
    let createdTables = 0;
    let createdMenuGroups = 0;
    let createdMenuItems = 0;
    
    for (let i = 1; i <= 100; i++) {
      try {
        const district = seoulDistricts[Math.floor(Math.random() * seoulDistricts.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const coord = generateRandomCoord();
        
        // 매장명 생성
        const storeNames = [
          `${district} ${category} 맛집`, `${category} 전문점`, `서울 ${category}`,
          `${district} 맛집`, `${category} 하우스`, `${district} ${category} 본점`
        ];
        const storeName = storeNames[Math.floor(Math.random() * storeNames.length)] + ` ${i}호점`;
        
        // 1. stores 테이블에 매장 생성 (현재 스키마에 정확히 맞춤)
        const storeResult = await client.query(`
          INSERT INTO stores (
            name, 
            category, 
            is_open, 
            rating_average, 
            review_count, 
            favorite_count, 
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING id
        `, [
          storeName,
          category,
          Math.random() > 0.1, // 90% 확률로 영업중
          parseFloat((Math.random() * 2 + 3).toFixed(2)), // 3.00 - 5.00 평점
          Math.floor(Math.random() * 200), // 0-200개 리뷰
          Math.floor(Math.random() * 50) // 0-50개 즐겨찾기
        ]);
        
        const storeId = storeResult.rows[0].id;
        createdStores++;
        
        // 2. store_address 테이블에 주소 정보 생성
        const address = generateAddress(district);
        const eupmyeondong = generateEupmyeondong(district);
        
        await client.query(`
          INSERT INTO store_address (
            store_id, 
            address_full, 
            sido, 
            sigungu, 
            eupmyeondong,
            latitude, 
            longitude, 
            region_code,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          storeId,
          address,
          '서울특별시',
          district,
          eupmyeondong,
          coord.lat,
          coord.lng,
          `11${String(Math.floor(Math.random() * 900) + 100)}` // 서울 지역코드 11 + 랜덤 3자리
        ]);
        createdAddresses++;
        
        // 3. store_tables 테이블에 테이블 정보 생성 (3-8개)
        const tableCount = Math.floor(Math.random() * 6) + 3; // 3-8개
        
        for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
          const seats = [2, 4, 6, 8][Math.floor(Math.random() * 4)];
          
          await client.query(`
            INSERT INTO store_tables (
              store_id, 
              table_number, 
              table_name, 
              seats, 
              is_occupied, 
              created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
          `, [
            storeId,
            tableNum,
            `테이블 ${tableNum}`,
            seats,
            Math.random() < 0.2 // 20% 확률로 사용중
          ]);
          createdTables++;
        }
        
        // 4. menu_groups 테이블에 메뉴 그룹 생성
        const menuGroupResult = await client.query(`
          INSERT INTO menu_groups (
            store_id, 
            name, 
            sort_order
          ) VALUES ($1, $2, $3)
          RETURNING id
        `, [
          storeId,
          '대표메뉴',
          1
        ]);
        
        const groupId = menuGroupResult.rows[0].id;
        createdMenuGroups++;
        
        // 5. menu_items 테이블에 메뉴 아이템 생성 (3-6개)
        const menuCount = Math.floor(Math.random() * 4) + 3; // 3-6개
        const menuItems = getMenuItemsByCategory(category);
        
        for (let j = 0; j < Math.min(menuCount, menuItems.length); j++) {
          const item = menuItems[j % menuItems.length];
          
          await client.query(`
            INSERT INTO menu_items (
              store_id,
              group_id,
              name,
              price,
              is_active,
              description,
              sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            storeId,
            groupId,
            `${item.name} ${j > 0 ? j + 1 : ''}`.trim(),
            item.price + Math.floor(Math.random() * 3000), // 가격 변동
            true,
            `맛있는 ${item.name}입니다.`,
            j + 1
          ]);
          createdMenuItems++;
        }
        
        // 6. prep_stations 테이블에 조리 스테이션 생성 (50% 확률)
        if (Math.random() > 0.5) {
          await client.query(`
            INSERT INTO prep_stations (
              store_id,
              code,
              name,
              is_active
            ) VALUES ($1, $2, $3, $4)
          `, [
            storeId,
            `KITCHEN_${storeId}`,
            '주방',
            true
          ]);
        }
        
        // 7. store_hours 테이블에 영업시간 생성 (월-일)
        for (let dow = 0; dow <= 6; dow++) {
          const openHour = Math.floor(Math.random() * 3) + 9; // 9-11시 오픈
          const closeHour = Math.floor(Math.random() * 3) + 21; // 21-23시 마감
          
          await client.query(`
            INSERT INTO store_hours (
              store_id,
              dow,
              open_time,
              close_time,
              is_closed
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            storeId,
            dow,
            `${String(openHour).padStart(2, '0')}:00:00`,
            `${String(closeHour).padStart(2, '0')}:00:00`,
            Math.random() < 0.1 // 10% 확률로 휴무
          ]);
        }
        
        // 8. qr_codes 테이블에 QR 코드 생성 (각 테이블별)
        for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
          const qrCode = `QR_${storeId}_T${tableNum}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          await client.query(`
            INSERT INTO qr_codes (
              store_id,
              table_number,
              code,
              is_active,
              created_at
            ) VALUES ($1, $2, $3, $4, NOW())
          `, [
            storeId,
            tableNum,
            qrCode,
            true
          ]);
        }
        
        if (i % 20 === 0) {
          console.log(`📈 진행률: ${i}/100 매장 생성 완료`);
        }
        
      } catch (error) {
        console.error(`❌ 매장 ${i} 생성 실패:`, error.message);
        // 개별 매장 실패 시 전체 트랜잭션을 롤백하지 않고 계속 진행
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n🎉 서울 100개 매장 더미데이터 생성 완료!');
    console.log(`📊 생성 결과:`);
    console.log(`  ✅ 매장: ${createdStores}개`);
    console.log(`  ✅ 주소: ${createdAddresses}개`);
    console.log(`  ✅ 테이블: ${createdTables}개`);
    console.log(`  ✅ 메뉴 그룹: ${createdMenuGroups}개`);
    console.log(`  ✅ 메뉴 아이템: ${createdMenuItems}개`);
    
    // 최종 확인
    const finalCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM stores) as stores,
        (SELECT COUNT(*) FROM store_address) as addresses,
        (SELECT COUNT(*) FROM store_tables) as tables,
        (SELECT COUNT(*) FROM menu_groups) as menu_groups,
        (SELECT COUNT(*) FROM menu_items) as menu_items,
        (SELECT COUNT(*) FROM qr_codes) as qr_codes
    `);
    
    const counts = finalCheck.rows[0];
    console.log(`\n📈 전체 데이터 현황:`);
    console.log(`  - 매장: ${counts.stores}개`);
    console.log(`  - 주소: ${counts.addresses}개`);
    console.log(`  - 테이블: ${counts.tables}개`);
    console.log(`  - 메뉴 그룹: ${counts.menu_groups}개`);
    console.log(`  - 메뉴 아이템: ${counts.menu_items}개`);
    console.log(`  - QR 코드: ${counts.qr_codes}개`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 매장 생성 실패:', error);
    throw error;
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
      { name: '비빔밥', price: 9000 },
      { name: '제육볶음', price: 12000 },
      { name: '갈비탕', price: 13000 }
    ],
    '중식': [
      { name: '짜장면', price: 6000 },
      { name: '짬뽕', price: 7000 },
      { name: '탕수육', price: 18000 },
      { name: '마파두부', price: 12000 },
      { name: '볶음밥', price: 8000 },
      { name: '깐풍기', price: 20000 }
    ],
    '일식': [
      { name: '초밥세트', price: 20000 },
      { name: '라멘', price: 9000 },
      { name: '돈카츠', price: 12000 },
      { name: '우동', price: 8000 },
      { name: '규동', price: 8500 },
      { name: '사시미', price: 25000 }
    ],
    '양식': [
      { name: '스테이크', price: 25000 },
      { name: '파스타', price: 14000 },
      { name: '리조또', price: 16000 },
      { name: '샐러드', price: 10000 },
      { name: '그릴드치킨', price: 18000 },
      { name: '오믈렛', price: 12000 }
    ],
    '카페': [
      { name: '아메리카노', price: 4000 },
      { name: '카페라떼', price: 5000 },
      { name: '케이크', price: 6000 },
      { name: '샌드위치', price: 8000 },
      { name: '아이스크림', price: 5500 },
      { name: '와플', price: 9000 }
    ],
    '치킨': [
      { name: '후라이드치킨', price: 18000 },
      { name: '양념치킨', price: 19000 },
      { name: '간장치킨', price: 19000 },
      { name: '맥주', price: 4000 },
      { name: '치킨무', price: 2000 },
      { name: '감자튀김', price: 6000 }
    ],
    '분식': [
      { name: '떡볶이', price: 3000 },
      { name: '김밥', price: 2500 },
      { name: '순대', price: 4000 },
      { name: '튀김', price: 500 },
      { name: '라면', price: 3500 },
      { name: '어묵', price: 1000 }
    ],
    '피자': [
      { name: '페퍼로니피자', price: 22000 },
      { name: '콤비네이션피자', price: 25000 },
      { name: '불고기피자', price: 24000 },
      { name: '시카고피자', price: 28000 },
      { name: '마르게리타', price: 20000 },
      { name: '치즈피자', price: 18000 }
    ]
  };
  
  return menus[category] || [
    { name: '대표메뉴 1', price: 10000 },
    { name: '대표메뉴 2', price: 12000 },
    { name: '대표메뉴 3', price: 15000 },
    { name: '대표메뉴 4', price: 8000 }
  ];
}

// 리뷰 생성
async function createReviewsForStores() {
  const client = await pool.connect();
  
  try {
    console.log('📝 매장별 리뷰 생성 시작...');
    
    // 매장과 사용자 조회
    const storesResult = await client.query('SELECT id FROM stores ORDER BY id DESC LIMIT 50');
    const usersResult = await client.query('SELECT id FROM users LIMIT 10');
    
    const stores = storesResult.rows;
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.log('⚠️ 사용자가 없어 리뷰 생성을 건너뜁니다.');
      return;
    }
    
    const reviewTexts = [
      '음식이 정말 맛있고 서비스도 친절해요!',
      '가격대비 좋은 것 같아요. 재방문 의사 있습니다.',
      '깔끔하고 맛있어요. 분위기도 좋네요.',
      '음식은 괜찮은데 서비스가 조금 아쉬워요.',
      '완벽해요! 다음에도 꼭 올 거예요.',
      '보통이에요. 나쁘지 않지만 특별하지도 않네요.',
      '정말 맛집이네요! 강력 추천합니다.',
      '재료가 신선하고 맛있어요.',
      '분위기 좋고 데이트하기 좋은 곳이에요.',
      '빠른 서비스와 맛있는 음식 감사합니다.'
    ];
    
    for (const store of stores) {
      // 각 매장마다 1-5개 리뷰 생성
      const reviewCount = Math.floor(Math.random() * 5) + 1;
      
      for (let r = 0; r < reviewCount; r++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const rating = Math.floor(Math.random() * 5) + 1; // 1-5점
        const text = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
        
        try {
          await client.query(`
            INSERT INTO reviews (
              user_id,
              store_id,
              rating,
              review_text,
              created_at
            ) VALUES ($1, $2, $3, $4, NOW())
          `, [
            user.id,
            store.id,
            rating,
            text
          ]);
        } catch (error) {
          // 중복 리뷰 등의 경우 무시
          console.log(`⚠️ 리뷰 생성 실패 (사용자: ${user.id}, 매장: ${store.id})`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 리뷰 생성 실패:', error);
  } finally {
    client.release();
  }
}

// 즐겨찾기 생성
async function createFavoritesForUsers() {
  const client = await pool.connect();
  
  try {
    console.log('⭐ 사용자별 즐겨찾기 생성 시작...');
    
    const usersResult = await client.query('SELECT id FROM users LIMIT 10');
    const storesResult = await client.query('SELECT id FROM stores ORDER BY id DESC LIMIT 100');
    
    const users = usersResult.rows;
    const stores = storesResult.rows;
    
    for (const user of users) {
      // 각 사용자마다 3-8개 매장 즐겨찾기
      const favoriteCount = Math.floor(Math.random() * 6) + 3;
      const shuffledStores = [...stores].sort(() => Math.random() - 0.5).slice(0, favoriteCount);
      
      for (const store of shuffledStores) {
        try {
          await client.query(`
            INSERT INTO favorites (user_id, store_id, created_at)
            VALUES ($1, $2, NOW())
          `, [user.id, store.id]);
        } catch (error) {
          // 중복 즐겨찾기 등의 경우 무시
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 즐겨찾기 생성 실패:', error);
  } finally {
    client.release();
  }
}

// 단골 통계 생성
async function createUserStoreStats() {
  const client = await pool.connect();
  
  try {
    console.log('📊 사용자별 매장 단골 통계 생성 시작...');
    
    const usersResult = await client.query('SELECT id FROM users LIMIT 10');
    const storesResult = await client.query('SELECT id FROM stores ORDER BY id DESC LIMIT 50');
    
    const users = usersResult.rows;
    const stores = storesResult.rows;
    
    const levelNames = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    
    for (const user of users) {
      // 각 사용자마다 5-15개 매장에 단골 통계
      const statsCount = Math.floor(Math.random() * 11) + 5;
      const shuffledStores = [...stores].sort(() => Math.random() - 0.5).slice(0, statsCount);
      
      for (const store of shuffledStores) {
        const visitCount = Math.floor(Math.random() * 20) + 1;
        const totalSpent = visitCount * (Math.floor(Math.random() * 30000) + 10000);
        const points = Math.floor(totalSpent * 0.01); // 1% 적립
        const levelName = levelNames[Math.min(Math.floor(visitCount / 5), levelNames.length - 1)];
        const levelPoints = Math.floor(Math.random() * 1000);
        
        try {
          await client.query(`
            INSERT INTO user_store_stats (
              user_id,
              store_id,
              points,
              total_spent,
              visit_count,
              level_name,
              level_points,
              level_benefits,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          `, [
            user.id,
            store.id,
            points,
            totalSpent,
            visitCount,
            levelName,
            levelPoints,
            JSON.stringify({
              discount: levelName === 'Diamond' ? 10 : levelName === 'Platinum' ? 5 : 0,
              freeItems: levelName === 'Diamond' ? ['음료수'] : []
            })
          ]);
        } catch (error) {
          // 중복 데이터 등의 경우 무시
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 단골 통계 생성 실패:', error);
  } finally {
    client.release();
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🚀 서울 100개 매장 스키마 기반 더미데이터 생성 시작...');
    console.log('📋 현재 스키마 정보를 바탕으로 정확한 데이터를 생성합니다.\n');
    
    // 1. 사용자 생성
    await createDummyUsers();
    
    // 2. 매장 생성 (메인)
    await createSeoul100Stores();
    
    // 3. 리뷰 생성
    await createReviewsForStores();
    
    // 4. 즐겨찾기 생성
    await createFavoritesForUsers();
    
    // 5. 단골 통계 생성
    await createUserStoreStats();
    
    console.log('\n🎉 모든 더미데이터 생성 완료!');
    console.log('🔧 이제 POS 시스템에서 정상적으로 매장 정보를 조회할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  createSeoul100Stores, 
  createDummyUsers, 
  createReviewsForStores, 
  createFavoritesForUsers, 
  createUserStoreStats 
};
