const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 서울 각 구별 좌표 범위
const seoulDistricts = [
  { name: '강남구', lat: 37.5173, lng: 127.0473, range: 0.02 },
  { name: '강동구', lat: 37.5301, lng: 127.1238, range: 0.02 },
  { name: '강북구', lat: 37.6398, lng: 127.0257, range: 0.02 },
  { name: '강서구', lat: 37.5509, lng: 126.8495, range: 0.02 },
  { name: '관악구', lat: 37.4781, lng: 126.9515, range: 0.02 },
  { name: '광진구', lat: 37.5384, lng: 127.0822, range: 0.02 },
  { name: '구로구', lat: 37.4954, lng: 126.8874, range: 0.02 },
  { name: '금천구', lat: 37.4569, lng: 126.8956, range: 0.02 },
  { name: '노원구', lat: 37.6544, lng: 127.0568, range: 0.02 },
  { name: '도봉구', lat: 37.6658, lng: 127.0317, range: 0.02 },
  { name: '동대문구', lat: 37.5744, lng: 127.0396, range: 0.02 },
  { name: '동작구', lat: 37.5124, lng: 126.9393, range: 0.02 },
  { name: '마포구', lat: 37.5663, lng: 126.9019, range: 0.02 },
  { name: '서대문구', lat: 37.5794, lng: 126.9368, range: 0.02 },
  { name: '서초구', lat: 37.4837, lng: 127.0324, range: 0.02 },
  { name: '성동구', lat: 37.5635, lng: 127.0369, range: 0.02 },
  { name: '성북구', lat: 37.5894, lng: 127.0167, range: 0.02 },
  { name: '송파구', lat: 37.5145, lng: 127.1059, range: 0.02 },
  { name: '양천구', lat: 37.5168, lng: 126.8665, range: 0.02 },
  { name: '영등포구', lat: 37.5264, lng: 126.8963, range: 0.02 },
  { name: '용산구', lat: 37.5384, lng: 126.9654, range: 0.02 },
  { name: '은평구', lat: 37.6027, lng: 126.9291, range: 0.02 },
  { name: '종로구', lat: 37.5735, lng: 126.9788, range: 0.02 },
  { name: '중구', lat: 37.5640, lng: 126.9970, range: 0.02 },
  { name: '중랑구', lat: 37.6063, lng: 127.0925, range: 0.02 }
];

// 카테고리별 매장명 템플릿
const storeNameTemplates = {
  '한식': ['맛집', '정', '마당', '한옥', '본가', '집', '촌', '마을', '고향'],
  '중식': ['성', '원', '각', '루', '각', '방', '빌라', '하우스', '궁'],
  '일식': ['스시', '라멘', '이자카야', '우동', '야키토리', '덴푸라', '사시미', '카이센'],
  '양식': ['비스트로', '그릴', '스테이크', '파스타', '피자', '브라세리', '카페', '레스토랑'],
  '치킨': ['후라이드', '양념', '간장', '마늘', '허니', '크리스피', '순살', '골든'],
  '카페': ['원두', '로스터리', '브루잉', '에스프레소', '라떼', '아메리카노', '드립', '핸드'],
  '분식': ['떡볶이', '순대', '튀김', '김밥', '라면', '우동', '만두', '호떡'],
  '족발보쌈': ['족발', '보쌈', '수육', '막국수', '냉면', '젓갈', '김치', '쌈']
};

// 카테고리별 메뉴 템플릿
const menuTemplates = {
  '한식': [
    { name: '김치찌개', price: 8000, description: '얼큰한 김치찌개', cook_station: '주방' },
    { name: '된장찌개', price: 7000, description: '구수한 된장찌개', cook_station: '주방' },
    { name: '비빔밥', price: 9000, description: '영양만점 비빔밥', cook_station: '주방' },
    { name: '불고기', price: 15000, description: '달콤한 불고기', cook_station: '그릴' },
    { name: '제육볶음', price: 12000, description: '매콤한 제육볶음', cook_station: '주방' }
  ],
  '중식': [
    { name: '짜장면', price: 6000, description: '달콤한 짜장면', cook_station: '주방' },
    { name: '짬뽕', price: 7000, description: '얼큰한 짬뽕', cook_station: '주방' },
    { name: '탕수육', price: 15000, description: '바삭한 탕수육', cook_station: '프라이어' },
    { name: '군만두', price: 8000, description: '고소한 군만두', cook_station: '주방' },
    { name: '볶음밥', price: 8000, description: '고슬고슬한 볶음밥', cook_station: '주방' }
  ],
  '일식': [
    { name: '초밥세트', price: 20000, description: '신선한 초밥', cook_station: '스시바' },
    { name: '라멘', price: 9000, description: '진한 돈코츠 라멘', cook_station: '주방' },
    { name: '돈카츠', price: 12000, description: '바삭한 돈카츠', cook_station: '프라이어' },
    { name: '우동', price: 8000, description: '따뜻한 우동', cook_station: '주방' },
    { name: '연어회', price: 18000, description: '신선한 연어회', cook_station: '스시바' }
  ],
  '양식': [
    { name: '스테이크', price: 25000, description: '육즙 가득한 스테이크', cook_station: '그릴' },
    { name: '파스타', price: 14000, description: '크림 파스타', cook_station: '주방' },
    { name: '피자', price: 18000, description: '치즈 피자', cook_station: '오븐' },
    { name: '리조또', price: 16000, description: '버섯 리조또', cook_station: '주방' },
    { name: '샐러드', price: 12000, description: '신선한 샐러드', cook_station: '주방' }
  ],
  '치킨': [
    { name: '후라이드치킨', price: 16000, description: '바삭한 후라이드', cook_station: '프라이어' },
    { name: '양념치킨', price: 17000, description: '달콤매콤 양념치킨', cook_station: '프라이어' },
    { name: '간장치킨', price: 17000, description: '고소한 간장치킨', cook_station: '프라이어' },
    { name: '치킨무', price: 2000, description: '시원한 치킨무', cook_station: '주방' },
    { name: '콜라', price: 2000, description: '시원한 콜라', cook_station: '음료' }
  ],
  '카페': [
    { name: '아메리카노', price: 4000, description: '깔끔한 아메리카노', cook_station: '바리스타' },
    { name: '카페라떼', price: 4500, description: '부드러운 카페라떼', cook_station: '바리스타' },
    { name: '카푸치노', price: 5000, description: '거품이 풍부한 카푸치노', cook_station: '바리스타' },
    { name: '에스프레소', price: 3500, description: '진한 에스프레소', cook_station: '바리스타' },
    { name: '케이크', price: 6000, description: '달콤한 케이크', cook_station: '베이커리' }
  ],
  '분식': [
    { name: '떡볶이', price: 3500, description: '매콤달콤 떡볶이', cook_station: '주방' },
    { name: '순대', price: 4000, description: '고소한 순대', cook_station: '주방' },
    { name: '튀김', price: 500, description: '바삭한 튀김', cook_station: '프라이어' },
    { name: '김밥', price: 3000, description: '든든한 김밥', cook_station: '주방' },
    { name: '라면', price: 3000, description: '얼큰한 라면', cook_station: '주방' }
  ],
  '족발보쌈': [
    { name: '족발', price: 25000, description: '쫄깃한 족발', cook_station: '주방' },
    { name: '보쌈', price: 22000, description: '부드러운 보쌈', cook_station: '주방' },
    { name: '막국수', price: 8000, description: '시원한 막국수', cook_station: '주방' },
    { name: '냉면', price: 9000, description: '시원한 냉면', cook_station: '주방' },
    { name: '쌈채소', price: 3000, description: '신선한 쌈채소', cook_station: '주방' }
  ]
};

// 랜덤 매장명 생성
function generateStoreName(category) {
  const templates = storeNameTemplates[category] || ['맛집'];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const prefixes = ['맛있는', '유명한', '전통', '신선한', '정통', '본격', '황금', '특별한'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  return `${prefix} ${template}`;
}

// 서울 구별 주소 생성
function generateSeoulAddress(district) {
  const roads = ['중앙로', '평화로', '번영로', '희망로', '사랑로', '행복로', '미래로', '꿈나무로'];
  const road = roads[Math.floor(Math.random() * roads.length)];
  const roadNumber = Math.floor(Math.random() * 200) + 1;

  return {
    sido: '서울특별시',
    sigungu: district.name,
    eupmyeondong: `${district.name.slice(0, -1)}동`,
    road_address: `서울특별시 ${district.name} ${road} ${roadNumber}`,
    jibun_address: `서울특별시 ${district.name} ${district.name.slice(0, -1)}동 ${Math.floor(Math.random() * 999) + 1}-${Math.floor(Math.random() * 99) + 1}`,
    postal_code: `${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
    legal_code: `1168${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`
  };
}

// 좌표 생성 (서울 내)
function generateCoordinates(district) {
  const lat = district.lat + (Math.random() - 0.5) * district.range;
  const lng = district.lng + (Math.random() - 0.5) * district.range;
  return { lat, lng };
}

async function createDummyStores() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🏪 더미 매장 100개 생성 시작...');

    const categories = ['한식', '중식', '일식', '양식', '치킨', '카페', '분식', '족발보쌈'];

    for (let i = 1; i <= 100; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const district = seoulDistricts[Math.floor(Math.random() * seoulDistricts.length)];
      const storeName = generateStoreName(category);
      const address = generateSeoulAddress(district);
      const coords = generateCoordinates(district);

      // 1. stores 테이블에 기본 정보 삽입
      const storeResult = await client.query(`
        INSERT INTO stores (name, is_open)
        VALUES ($1, $2)
        RETURNING id
      `, [storeName, Math.random() > 0.1]); // 90% 확률로 영업중

      const storeId = storeResult.rows[0].id;
      console.log(`✅ 매장 ${i}: ${storeName} (ID: ${storeId}) - ${category}`);

      // 2. store_info 테이블에 상세 정보 삽입 (store_id는 자동 생성되지 않음, 수동으로 설정)
      await client.query(`
        INSERT INTO store_info (store_id, name, category, store_tel_number, rating_average, review_count, favoratite_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        storeId,
        storeName,
        category,
        Math.floor(Math.random() * 89999999) + 10000000, // 8자리 전화번호
        Math.floor(Math.random() * 5) + 1, // 1-5점 평점
        Math.floor(Math.random() * 100), // 리뷰 수
        Math.floor(Math.random() * 50) // 즐겨찾기 수
      ]);

      // 3. store_addresses 테이블에 주소 정보 삽입 (PostGIS 함수 사용)
      await client.query(`
        INSERT INTO store_addresses (
          store_id, road_address, jibun_address, postal_code, 
          sido, sigungu, eupmyeondong, legal_code,
          latitude, longitude, geom
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($11, $12), 4326))
      `, [
        storeId, address.road_address, address.jibun_address, address.postal_code,
        address.sido, address.sigungu, address.eupmyeondong, address.legal_code,
        coords.lat, coords.lng, coords.lng, coords.lat
      ]);

      // 4. store_tables 테이블에 테이블 정보 삽입
      const tableCount = Math.floor(Math.random() * 8) + 3; // 3-10개 테이블
      for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
        const capacity = Math.floor(Math.random() * 6) + 2; // 2-7명 수용
        const isOccupied = Math.random() < 0.3; // 30% 확률로 사용중

        await client.query(`
          INSERT INTO store_tables (store_id, table_name, capacity, status)
          VALUES ($1, $2, $3, $4)
        `, [
          storeId,
          `테이블 ${tableNum}`,
          capacity,
          isOccupied ? 'OCCUPIED' : 'AVAILABLE'
        ]);
      }

      // 5. store_menu 테이블에 메뉴 삽입
      const menuItems = menuTemplates[category] || menuTemplates['한식'];

      for (const menu of menuItems) {
        await client.query(`
          INSERT INTO store_menu (store_id, name, description, price, cook_station)
          VALUES ($1, $2, $3, $4, $5)
        `, [storeId, menu.name, menu.description, menu.price, menu.cook_station]);
      }

      // 6. store_regular_levels 테이블에 단골 레벨 시스템 삽입
      const levels = [
        { level: '브론즈', min_orders: 0, min_spent: 0, benefits: { discount: 0, points: 1 } },
        { level: '실버', min_orders: 5, min_spent: 50000, benefits: { discount: 5, points: 1.2 } },
        { level: '골드', min_orders: 15, min_spent: 150000, benefits: { discount: 10, points: 1.5 } },
        { level: '플래티넘', min_orders: 30, min_spent: 300000, benefits: { discount: 15, points: 2.0 } }
      ];

      for (const levelData of levels) {
        await client.query(`
          INSERT INTO store_regular_levels (store_id, level, min_orders, min_spent, benefits)
          VALUES ($1, $2, $3, $4, $5)
        `, [storeId, levelData.level, levelData.min_orders, levelData.min_spent, JSON.stringify(levelData.benefits)]);
      }
    }

    await client.query('COMMIT');
    console.log('🎉 더미 매장 100개 생성 완료!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 더미 매장 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
createDummyStores()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });