
const pool = require('./database');

async function initializeDatabase() {
  try {
    console.log('🚀 데이터베이스 초기화 시작...');

    // 테이블 생성
    await createTables();
    
    // 더미 데이터 삽입
    await insertDummyData();
    
    console.log('✅ 데이터베이스 초기화 완료!');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  }
}

async function createTables() {
  console.log('📋 테이블 생성 중...');

  // users 테이블 생성
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      pw VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      point INTEGER DEFAULT 0,
      order_list JSONB DEFAULT '[]'::jsonb,
      coupons JSONB DEFAULT '{"unused": [], "used": []}'::jsonb,
      favorite_stores JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // stores 테이블 생성
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(100) NOT NULL,
      distance VARCHAR(50),
      address TEXT,
      phone VARCHAR(20),
      description TEXT,
      operating_hours JSONB,
      menu JSONB DEFAULT '[]'::jsonb,
      coord JSONB NOT NULL,
      reviews JSONB DEFAULT '[]'::jsonb,
      is_open BOOLEAN DEFAULT true,
      rating_average DECIMAL(3,1) DEFAULT 0.0,
      review_count INTEGER DEFAULT 0,
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // orders 테이블 생성
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      store_id INTEGER NOT NULL,
      user_id VARCHAR(50) NOT NULL,
      table_number INTEGER,
      order_data JSONB NOT NULL,
      total_amount INTEGER NOT NULL,
      final_amount INTEGER NOT NULL,
      order_status VARCHAR(50) DEFAULT 'pending',
      order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      UNIQUE(user_id, order_index),
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      unique_id VARCHAR(100) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(store_id, table_number),
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ 모든 테이블 생성 완료');
}

async function insertDummyData() {
  // 기존 데이터 확인
  const existingStores = await pool.query('SELECT COUNT(*) FROM stores');
  const storeCount = parseInt(existingStores.rows[0].count);

  if (storeCount >= 1000) {
    console.log(`📊 이미 ${storeCount}개의 매장이 존재합니다. 건너뛰기...`);
    return;
  }

  console.log('🏪 1000개 매장 더미 데이터 생성 중...');

  // 전국 주요 도시와 좌표
  const cities = [
    // 서울
    { name: '강남구', lat: 37.5172, lng: 127.0473, city: '서울' },
    { name: '강서구', lat: 37.5509, lng: 126.8495, city: '서울' },
    { name: '관악구', lat: 37.4781, lng: 126.9515, city: '서울' },
    { name: '광진구', lat: 37.5384, lng: 127.0822, city: '서울' },
    { name: '구로구', lat: 37.4955, lng: 126.8876, city: '서울' },
    { name: '금천구', lat: 37.4569, lng: 126.8956, city: '서울' },
    { name: '노원구', lat: 37.6541, lng: 127.0568, city: '서울' },
    { name: '도봉구', lat: 37.6688, lng: 127.0471, city: '서울' },
    { name: '동대문구', lat: 37.5744, lng: 127.0396, city: '서울' },
    { name: '동작구', lat: 37.5124, lng: 126.9393, city: '서울' },
    
    // 부산
    { name: '해운대구', lat: 35.1631, lng: 129.1640, city: '부산' },
    { name: '부산진구', lat: 35.1628, lng: 129.0532, city: '부산' },
    { name: '동래구', lat: 35.2049, lng: 129.0837, city: '부산' },
    { name: '남구', lat: 35.1336, lng: 129.0843, city: '부산' },
    { name: '서구', lat: 35.0970, lng: 129.0243, city: '부산' },
    
    // 대구
    { name: '수성구', lat: 35.8581, lng: 128.6311, city: '대구' },
    { name: '달서구', lat: 35.8295, lng: 128.5326, city: '대구' },
    { name: '북구', lat: 35.8858, lng: 128.5828, city: '대구' },
    { name: '중구', lat: 35.8694, lng: 128.6069, city: '대구' },
    
    // 인천
    { name: '연수구', lat: 37.4106, lng: 126.6784, city: '인천' },
    { name: '남동구', lat: 37.4467, lng: 126.7313, city: '인천' },
    { name: '부평구', lat: 37.5073, lng: 126.7219, city: '인천' },
    { name: '서구', lat: 37.5452, lng: 126.6761, city: '인천' },
    
    // 광주
    { name: '서구', lat: 35.1520, lng: 126.8895, city: '광주' },
    { name: '북구', lat: 35.1743, lng: 126.9117, city: '광주' },
    { name: '남구', lat: 35.1327, lng: 126.9026, city: '광주' },
    
    // 대전
    { name: '유성구', lat: 36.3621, lng: 127.3565, city: '대전' },
    { name: '서구', lat: 36.3555, lng: 127.3838, city: '대전' },
    { name: '중구', lat: 36.3265, lng: 127.4210, city: '대전' },
    
    // 울산
    { name: '남구', lat: 35.5447, lng: 129.3300, city: '울산' },
    { name: '동구', lat: 35.5049, lng: 129.4167, city: '울산' },
    { name: '북구', lat: 35.5826, lng: 129.3614, city: '울산' },
    
    // 경기도
    { name: '수원시', lat: 37.2636, lng: 127.0286, city: '경기' },
    { name: '성남시', lat: 37.4201, lng: 127.1262, city: '경기' },
    { name: '고양시', lat: 37.6584, lng: 126.8320, city: '경기' },
    { name: '용인시', lat: 37.2411, lng: 127.1776, city: '경기' },
    { name: '부천시', lat: 37.5036, lng: 126.7660, city: '경기' },
    { name: '안산시', lat: 37.3219, lng: 126.8309, city: '경기' },
    { name: '안양시', lat: 37.3943, lng: 126.9568, city: '경기' },
    { name: '남양주시', lat: 37.6364, lng: 127.2167, city: '경기' },
    
    // 강원도
    { name: '춘천시', lat: 37.8813, lng: 127.7298, city: '강원' },
    { name: '원주시', lat: 37.3422, lng: 127.9202, city: '강원' },
    { name: '강릉시', lat: 37.7519, lng: 128.8761, city: '강원' },
    
    // 충청도
    { name: '청주시', lat: 36.6424, lng: 127.4890, city: '충북' },
    { name: '천안시', lat: 36.8151, lng: 127.1139, city: '충남' },
    { name: '아산시', lat: 36.7898, lng: 127.0018, city: '충남' },
    
    // 전라도
    { name: '전주시', lat: 35.8242, lng: 127.1480, city: '전북' },
    { name: '목포시', lat: 34.8118, lng: 126.3922, city: '전남' },
    { name: '여수시', lat: 34.7604, lng: 127.6622, city: '전남' },
    
    // 경상도
    { name: '포항시', lat: 36.0190, lng: 129.3435, city: '경북' },
    { name: '경주시', lat: 35.8562, lng: 129.2247, city: '경북' },
    { name: '창원시', lat: 35.2280, lng: 128.6811, city: '경남' },
    { name: '김해시', lat: 35.2342, lng: 128.8811, city: '경남' },
    
    // 제주도
    { name: '제주시', lat: 33.4996, lng: 126.5312, city: '제주' },
    { name: '서귀포시', lat: 33.2541, lng: 126.5600, city: '제주' }
  ];

  // 매장 카테고리와 이름
  const storeCategories = [
    {
      category: '한식',
      names: ['한옥집', '고향식당', '서울집', '맛고을', '전통한식', '가마솥밥집', '한정식', '시골밥상', '정갈한집', '청국장집']
    },
    {
      category: '중식',
      names: ['차이나타운', '북경반점', '홍콩반점', '짜장명가', '중화루', '용궁반점', '대륙반점', '금강반점', '만리장성', '화룡반점']
    },
    {
      category: '일식',
      names: ['스시혼', '사케바', '라멘집', '우동명가', '이자카야', '스시로', '가츠동', '덴푸라집', '일미집', '와규']
    },
    {
      category: '양식',
      names: ['파스타하우스', '스테이크존', '피자플레이스', '이탈리아노', '프렌치카페', '브런치카페', '샐러드바', '와인바', '비스트로', '레스토랑']
    },
    {
      category: '카페',
      names: ['커피빈', '카페모카', '드립커피', '로스터리', '카페라떼', '베이커리카페', '디저트카페', '카페브릭', '원두커피', '아메리카노']
    },
    {
      category: '치킨',
      names: ['치킨매니아', '황금치킨', '바삭치킨', '허니치킨', '양념치킨집', '후라이드킹', '치킨플러스', '크리스피치킨', '맛있는치킨', '치킨하우스']
    },
    {
      category: '분식',
      names: ['떡볶이천국', '분식왕국', '김밥천국', '즉석떡볶이', '분식집', '떡볶이마을', '김밥나라', '튀김집', '오뎅집', '순대국']
    },
    {
      category: '피자',
      names: ['피자헛', '도미노피자', '피자마루', '미스터피자', '피자스쿨', '치즈피자', '페페로니피자', '피자팩토리', '오븐피자', '피자킹']
    }
  ];

  // 메뉴 데이터
  const menuByCategory = {
    '한식': [
      { name: '김치찌개', price: 8000, description: '집에서 끓인 듯한 진짜 맛' },
      { name: '된장찌개', price: 7000, description: '구수한 된장의 깊은 맛' },
      { name: '불고기', price: 15000, description: '달콤한 양념에 재운 소고기' },
      { name: '비빔밥', price: 9000, description: '신선한 나물과 고추장' },
      { name: '냉면', price: 10000, description: '시원한 육수의 냉면' },
      { name: '갈비탕', price: 12000, description: '진한 사골 육수' },
      { name: '삼겹살', price: 18000, description: '두툼한 삼겹살' }
    ],
    '중식': [
      { name: '짜장면', price: 6000, description: '달콤한 춘장 소스' },
      { name: '짬뽕', price: 7000, description: '매콤한 해물 국물' },
      { name: '탕수육', price: 15000, description: '바삭한 튀김과 새콤달콤 소스' },
      { name: '볶음밥', price: 8000, description: '고슬고슬한 볶음밥' },
      { name: '마파두부', price: 12000, description: '매콤한 사천식 두부' },
      { name: '깐풍기', price: 16000, description: '바삭한 닭고기와 매콤한 소스' }
    ],
    '일식': [
      { name: '초밥세트', price: 20000, description: '신선한 회와 초밥' },
      { name: '라멘', price: 9000, description: '진한 돈코츠 육수' },
      { name: '우동', price: 8000, description: '쫄깃한 면발' },
      { name: '돈까스', price: 12000, description: '바삭한 튀김옷' },
      { name: '회덮밥', price: 15000, description: '신선한 생선회' },
      { name: '가라아게', price: 10000, description: '일본식 치킨' }
    ],
    '양식': [
      { name: '스테이크', price: 25000, description: '부드러운 소고기 스테이크' },
      { name: '파스타', price: 14000, description: '알덴테 면발의 파스타' },
      { name: '리조또', price: 16000, description: '크리미한 이탈리안 리조또' },
      { name: '샐러드', price: 12000, description: '신선한 야채 샐러드' },
      { name: '햄버거', price: 11000, description: '수제 패티 햄버거' },
      { name: '오믈렛', price: 9000, description: '부드러운 계란 요리' }
    ],
    '카페': [
      { name: '아메리카노', price: 4000, description: '진한 원두의 깊은 맛' },
      { name: '카페라떼', price: 5000, description: '부드러운 우유와 에스프레소' },
      { name: '카푸치노', price: 5500, description: '풍성한 거품의 커피' },
      { name: '케이크', price: 6000, description: '달콤한 수제 케이크' },
      { name: '샌드위치', price: 7000, description: '신선한 재료의 샌드위치' },
      { name: '스무디', price: 6500, description: '신선한 과일 스무디' }
    ],
    '치킨': [
      { name: '후라이드치킨', price: 18000, description: '바삭하고 담백한 치킨' },
      { name: '양념치킨', price: 19000, description: '달콤매콤한 양념' },
      { name: '간장치킨', price: 20000, description: '고소한 간장 맛' },
      { name: '치킨무', price: 2000, description: '아삭한 치킨무' },
      { name: '콜라', price: 2000, description: '시원한 탄산음료' },
      { name: '치킨버거', price: 8000, description: '치킨 패티 버거' }
    ],
    '분식': [
      { name: '떡볶이', price: 4000, description: '매콤달콤한 떡볶이' },
      { name: '김밥', price: 3000, description: '다양한 재료의 김밥' },
      { name: '튀김', price: 500, description: '바삭한 야채튀김' },
      { name: '순대', price: 5000, description: '담백한 순대' },
      { name: '어묵', price: 1000, description: '따뜻한 어묵' },
      { name: '라면', price: 3500, description: '얼큰한 라면' }
    ],
    '피자': [
      { name: '페페로니피자', price: 22000, description: '매콤한 페페로니' },
      { name: '치즈피자', price: 20000, description: '진한 치즈의 맛' },
      { name: '불고기피자', price: 25000, description: '한국식 불고기 토핑' },
      { name: '하와이안피자', price: 23000, description: '파인애플과 햄' },
      { name: '콤비네이션피자', price: 26000, description: '다양한 토핑' },
      { name: '마르게리타피자', price: 21000, description: '바질과 토마토' }
    ]
  };

  // 1000개 매장 생성
  const batchSize = 100;
  for (let batch = 0; batch < 10; batch++) {
    const stores = [];
    
    for (let i = 0; i < batchSize; i++) {
      const storeIndex = batch * batchSize + i;
      const city = cities[Math.floor(Math.random() * cities.length)];
      const categoryData = storeCategories[Math.floor(Math.random() * storeCategories.length)];
      const storeName = categoryData.names[Math.floor(Math.random() * categoryData.names.length)];
      
      // 좌표에 약간의 랜덤성 추가 (같은 도시 내에서도 다양한 위치)
      const lat = city.lat + (Math.random() - 0.5) * 0.05;
      const lng = city.lng + (Math.random() - 0.5) * 0.05;
      
      // 메뉴 생성
      const categoryMenus = menuByCategory[categoryData.category] || [];
      const selectedMenus = categoryMenus.slice(0, Math.floor(Math.random() * 4) + 3); // 3-6개 메뉴
      
      stores.push([
        `${storeName} ${city.name}점`,
        categoryData.category,
        `${Math.floor(Math.random() * 500) + 100}m`,
        `${city.city} ${city.name} ${Math.floor(Math.random() * 999) + 1}번지`,
        `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        `맛있는 ${categoryData.category} 전문점입니다.`,
        JSON.stringify({
          monday: "09:00-22:00",
          tuesday: "09:00-22:00", 
          wednesday: "09:00-22:00",
          thursday: "09:00-22:00",
          friday: "09:00-23:00",
          saturday: "09:00-23:00",
          sunday: "10:00-21:00"
        }),
        JSON.stringify(selectedMenus),
        JSON.stringify({ lat, lng }),
        JSON.stringify([]),
        Math.random() > 0.1, // 90% 확률로 운영중
        (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0 별점
        Math.floor(Math.random() * 200) + 10, // 10-209 리뷰 수
        lat,
        lng
      ]);
    }
    
    // 배치별로 삽입
    const placeholders = stores.map((_, index) => 
      `($${index * 15 + 1}, $${index * 15 + 2}, $${index * 15 + 3}, $${index * 15 + 4}, $${index * 15 + 5}, $${index * 15 + 6}, $${index * 15 + 7}, $${index * 15 + 8}, $${index * 15 + 9}, $${index * 15 + 10}, $${index * 15 + 11}, $${index * 15 + 12}, $${index * 15 + 13}, $${index * 15 + 14}, $${index * 15 + 15})`
    ).join(', ');
    
    const flatValues = stores.flat();
    
    await pool.query(`
      INSERT INTO stores (name, category, distance, address, phone, description, operating_hours, menu, coord, reviews, is_open, rating_average, review_count, latitude, longitude)
      VALUES ${placeholders}
    `, flatValues);
    
    console.log(`✅ 배치 ${batch + 1}/10 완료 (${(batch + 1) * batchSize}개 매장 생성)`);
  }

  // 테스트 사용자 생성
  const existingUsers = await pool.query('SELECT COUNT(*) FROM users WHERE id = $1', ['12']);
  if (parseInt(existingUsers.rows[0].count) === 0) {
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

  // 각 매장마다 테이블 생성
  console.log('🪑 매장별 테이블 정보 생성 중...');
  const allStores = await pool.query('SELECT id FROM stores ORDER BY id');
  
  for (const store of allStores.rows) {
    const storeId = store.id;
    
    // 기존 테이블 확인
    const existingTables = await pool.query('SELECT COUNT(*) FROM store_tables WHERE store_id = $1', [storeId]);
    if (parseInt(existingTables.rows[0].count) > 0) continue;
    
    // 각 매장마다 8-12개의 테이블 생성
    const tableCount = Math.floor(Math.random() * 5) + 8;
    
    for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
      const seats = tableNum <= 2 ? 2 : tableNum <= 5 ? 4 : tableNum <= 7 ? 6 : 8;
      
      await pool.query(`
        INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied, unique_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [storeId, tableNum, `테이블 ${tableNum}`, seats, Math.random() > 0.7, `store_${storeId}_table_${tableNum}`]);
    }
  }
  
  console.log('✅ 모든 매장 테이블 정보 생성 완료');
  
  // 더미 리뷰 생성
  console.log('📝 더미 리뷰 데이터 생성 중...');
  const dummyUsers = [
    { id: '12', name: '테스트사용자' },
    { id: 'user001', name: '배고픈곰' },
    { id: 'user002', name: '익명1' },
    { id: 'user003', name: '이현수' },
    { id: 'user004', name: '푸드파이터' },
    { id: 'user005', name: '치킨광' },
    { id: 'user006', name: '매운맛사랑' },
    { id: 'user007', name: '맛집탐험가' }
  ];

  for (const user of dummyUsers) {
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

  const reviewTexts = [
    '음식이 정말 맛있고 서비스도 친절해요!',
    '깔끔하고 맛있어요. 재방문 의사 있습니다.',
    '항상 맛있게 먹고 있어요. 추천!',
    '보통이에요. 나쁘지 않지만 특별하지도...',
    '가격 대비 괜찮은 것 같아요.',
    '친구들과 함께 와서 즐겁게 먹었습니다.',
    '배달도 빨라요. 포장 상태도 깔끔했어요.',
    '분위기가 좋네요. 다음에 또 올게요.',
    '음식 나오는 속도도 빠르고 맛도 좋습니다!',
    '가족과 함께 먹기 좋아요. 추천합니다!'
  ];

  // 각 매장마다 랜덤 리뷰 생성 (1000개 매장 × 평균 5개 리뷰)
  let orderIndex = 100000;
  for (let storeId = 1; storeId <= 1000; storeId++) {
    const reviewCount = Math.floor(Math.random() * 8) + 2; // 2-9개 리뷰
    
    for (let i = 0; i < reviewCount; i++) {
      const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)];
      const randomText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
      const rating = Math.floor(Math.random() * 3) + 3; // 3-5점
      
      try {
        await pool.query(`
          INSERT INTO reviews (user_id, store_id, order_index, rating, review_text, order_date)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          randomUser.id,
          storeId,
          orderIndex++,
          rating,
          randomText,
          new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString()
        ]);
      } catch (error) {
        // 중복 키 에러 무시
        if (!error.message.includes('unique constraint')) {
          console.error(`❌ 리뷰 삽입 실패:`, error.message);
        }
      }
    }
    
    if (storeId % 100 === 0) {
      console.log(`📝 리뷰 생성 진행상황: ${storeId}/1000 매장 완료`);
    }
  }

  // 별점 평균 업데이트
  console.log('⭐ 매장별 별점 평균 업데이트 중...');
  for (let storeId = 1; storeId <= 1000; storeId++) {
    const ratingResult = await pool.query(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
      FROM reviews 
      WHERE store_id = $1
    `, [storeId]);
    
    const avgRating = ratingResult.rows[0].avg_rating;
    const reviewCount = parseInt(ratingResult.rows[0].review_count);
    const formattedRating = avgRating ? parseFloat(avgRating).toFixed(1) : 0;
    
    await pool.query(`
      UPDATE stores 
      SET rating_average = $1, review_count = $2 
      WHERE id = $3
    `, [formattedRating, reviewCount, storeId]);
    
    if (storeId % 100 === 0) {
      console.log(`⭐ 별점 업데이트 진행상황: ${storeId}/1000 매장 완료`);
    }
  }

  console.log('🎉 1000개 매장 더미 데이터 생성 완료!');
}

module.exports = initializeDatabase;

// 직접 실행할 때만 초기화 수행
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ 데이터베이스 초기화 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 데이터베이스 초기화 실패:', error);
      process.exit(1);
    });
}
