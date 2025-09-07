
const pool = require('../../shared/config/database');

// 서울 지역 구별 좌표 범위
const seoulDistricts = [
  { name: '강남구', lat: 37.5172, lng: 127.0473, range: 0.02 },
  { name: '강동구', lat: 37.5301, lng: 127.1238, range: 0.02 },
  { name: '강북구', lat: 37.6396, lng: 127.0258, range: 0.02 },
  { name: '강서구', lat: 37.5509, lng: 126.8495, range: 0.02 },
  { name: '관악구', lat: 37.4784, lng: 126.9516, range: 0.02 },
  { name: '광진구', lat: 37.5385, lng: 127.0823, range: 0.02 },
  { name: '구로구', lat: 37.4955, lng: 126.8876, range: 0.02 },
  { name: '금천구', lat: 37.4569, lng: 126.8956, range: 0.02 },
  { name: '노원구', lat: 37.6542, lng: 127.0568, range: 0.02 },
  { name: '도봉구', lat: 37.6688, lng: 127.0472, range: 0.02 },
  { name: '동대문구', lat: 37.5744, lng: 127.0396, range: 0.02 },
  { name: '동작구', lat: 37.5124, lng: 126.9393, range: 0.02 },
  { name: '마포구', lat: 37.5664, lng: 126.9018, range: 0.02 },
  { name: '서대문구', lat: 37.5794, lng: 126.9368, range: 0.02 },
  { name: '서초구', lat: 37.4837, lng: 127.0324, range: 0.02 },
  { name: '성동구', lat: 37.5636, lng: 127.0368, range: 0.02 },
  { name: '성북구', lat: 37.5894, lng: 127.0167, range: 0.02 },
  { name: '송파구', lat: 37.5145, lng: 127.1059, range: 0.02 },
  { name: '양천구', lat: 37.5168, lng: 126.8664, range: 0.02 },
  { name: '영등포구', lat: 37.5264, lng: 126.8962, range: 0.02 },
  { name: '용산구', lat: 37.5326, lng: 126.9900, range: 0.02 },
  { name: '은평구', lat: 37.6027, lng: 126.9292, range: 0.02 },
  { name: '종로구', lat: 37.5735, lng: 126.9788, range: 0.02 },
  { name: '중구', lat: 37.5641, lng: 126.9979, range: 0.02 },
  { name: '중랑구', lat: 37.6063, lng: 127.0929, range: 0.02 }
];

// 매장 카테고리별 이름과 설명
const storeCategories = {
  '한식': {
    names: ['한옥정', '정성반찬', '고향집', '맛고을', '전통한식', '밥상머리', '할머니집', '옛날솥밥', '토속촌', '정갈한식'],
    descriptions: ['전통 한식을 정성껏 만듭니다', '집밥 같은 정갈한 한식', '어머니 손맛 그대로', '신선한 재료로 만든 건강한 한식']
  },
  '치킨': {
    names: ['황금치킨', '바삭치킨', '맛있닭', '치킨마루', '후라이드킹', '양념대왕', '치킨하우스', '크런치치킨', '닭강정집', '치킨플러스'],
    descriptions: ['바삭하고 맛있는 치킨 전문점', '신선한 국내산 닭고기 사용', '특제 양념으로 만든 치킨', '24시간 신선한 치킨']
  },
  '양식': {
    names: ['이탈리안키친', '파스타하우스', '스테이크하우스', '브라보피자', '유럽식당', '리스토란테', '파미글리아', '델리시오', '라비올리', '까르보나라'],
    descriptions: ['정통 이탈리안 요리', '수제 파스타와 피자', '프리미엄 스테이크 전문점', '유럽 전통 방식의 요리']
  },
  '중식': {
    names: ['차이나타운', '홍루각', '만리장성', '북경반점', '상해반점', '용궁각', '황금성', '중화요리', '대만각', '동북면가'],
    descriptions: ['정통 중화요리', '수제 면과 만두', '사천식 매운 요리 전문', '깔끔한 중화요리']
  },
  '일식': {
    names: ['스시바', '라멘집', '이자카야', '도쿄식당', '오사카', '사쿠라', '우동명가', '돈카츠하우스', '초밥왕', '규카츠'],
    descriptions: ['신선한 회와 초밥', '진짜 일본 라멘', '정통 일식 요리', '프리미엄 돈카츠']
  },
  '카페': {
    names: ['원두마을', '커피빈하우스', '아메리카노', '카페라떼', '브루잉커피', '로스터리', '에스프레소바', '카페모카', '드립커피', '빈티지카페'],
    descriptions: ['신선하게 볶은 원두', '핸드드립 전문 카페', '아늑한 분위기의 카페', '직접 로스팅한 커피']
  },
  '분식': {
    names: ['떡볶이마을', '분식천국', '옛날분식', '김밥나라', '순대국밥', '어묵바', '튀김공주', '라면사랑', '분식왕', '떡볶이대왕'],
    descriptions: ['매콤한 떡볶이', '푸짐한 김밥과 분식', '옛날 방식 그대로', '학생들이 좋아하는 분식']
  }
};

// 랜덤 좌표 생성
function getRandomCoord(district) {
  const lat = district.lat + (Math.random() - 0.5) * district.range * 2;
  const lng = district.lng + (Math.random() - 0.5) * district.range * 2;
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

// 랜덤 매장 이름 생성
function getRandomStoreName(category) {
  const categoryData = storeCategories[category];
  const baseName = categoryData.names[Math.floor(Math.random() * categoryData.names.length)];
  const suffix = ['', ' 본점', ' 역점', ' 센터점', ' 플러스', ' 프리미엄'];
  return baseName + suffix[Math.floor(Math.random() * suffix.length)];
}

// 랜덤 설명 생성
function getRandomDescription(category) {
  const categoryData = storeCategories[category];
  return categoryData.descriptions[Math.floor(Math.random() * categoryData.descriptions.length)];
}

// 주소 생성
function generateAddress(district, coord) {
  const dong = ['동', '가', '로'][Math.floor(Math.random() * 3)];
  const streetNumber = Math.floor(Math.random() * 500) + 1;
  const buildingNumber = Math.floor(Math.random() * 50) + 1;
  
  return `서울특별시 ${district.name} ${streetNumber}${dong} ${buildingNumber}`;
}

// 카테고리별 기본 메뉴 생성
function getMenuByCategory(category) {
  const menus = {
    '한식': [
      { name: '김치찌개', price: 8000, description: '얼큰한 김치찌개', cook_station: '주방' },
      { name: '된장찌개', price: 7000, description: '구수한 된장찌개', cook_station: '주방' },
      { name: '불고기', price: 15000, description: '달콤한 불고기', cook_station: '주방' },
      { name: '비빔밥', price: 9000, description: '영양만점 비빔밥', cook_station: '주방' },
      { name: '공기밥', price: 1000, description: '갓지은 밥', cook_station: '주방' }
    ],
    '치킨': [
      { name: '양념치킨', price: 18000, description: '매콤달콤한 양념치킨', cook_station: '프라이어' },
      { name: '후라이드치킨', price: 16000, description: '바삭한 후라이드치킨', cook_station: '프라이어' },
      { name: '순살치킨', price: 19000, description: '뼈없는 순살치킨', cook_station: '프라이어' },
      { name: '치킨무', price: 3000, description: '시원한 치킨무', cook_station: '주방' },
      { name: '콜라', price: 2000, description: '시원한 콜라', cook_station: '음료' }
    ],
    '양식': [
      { name: '마르게리타 피자', price: 15000, description: '클래식 마르게리타', cook_station: '오븐' },
      { name: '페퍼로니 피자', price: 18000, description: '매콤한 페퍼로니', cook_station: '오븐' },
      { name: '크림파스타', price: 12000, description: '부드러운 크림 파스타', cook_station: '주방' },
      { name: '토마토파스타', price: 11000, description: '상큼한 토마토 파스타', cook_station: '주방' },
      { name: '샐러드', price: 8000, description: '신선한 샐러드', cook_station: '주방' }
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
    '카페': [
      { name: '아메리카노', price: 4000, description: '깔끔한 아메리카노', cook_station: '바리스타' },
      { name: '카페라떼', price: 4500, description: '부드러운 카페라떼', cook_station: '바리스타' },
      { name: '카푸치노', price: 5000, description: '거품이 풍부한 카푸치노', cook_station: '바리스타' },
      { name: '크로와상', price: 3500, description: '버터향 가득한 크로와상', cook_station: '베이커리' },
      { name: '치즈케이크', price: 6000, description: '진한 치즈케이크', cook_station: '베이커리' }
    ],
    '분식': [
      { name: '떡볶이', price: 3000, description: '매콤한 떡볶이', cook_station: '주방' },
      { name: '김밥', price: 2500, description: '속이 꽉찬 김밥', cook_station: '주방' },
      { name: '순대', price: 4000, description: '따뜻한 순대', cook_station: '주방' },
      { name: '튀김', price: 500, description: '바삭한 튀김', cook_station: '프라이어' },
      { name: '라면', price: 3500, description: '뜨끈한 라면', cook_station: '주방' }
    ]
  };
  
  return menus[category] || menus['한식'];
}

async function createDummyStores() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🏗️ 서울 지역 100개 매장 더미데이터 생성 시작...');
    
    // 카테고리 배열
    const categories = Object.keys(storeCategories);
    
    for (let i = 1; i <= 100; i++) {
      // 랜덤 구 선택
      const district = seoulDistricts[Math.floor(Math.random() * seoulDistricts.length)];
      const coord = getRandomCoord(district);
      
      // 랜덤 카테고리 선택
      const category = categories[Math.floor(Math.random() * categories.length)];
      const storeName = getRandomStoreName(category);
      const description = getRandomDescription(category);
      const address = generateAddress(district, coord);
      
      // 1. stores 테이블에 기본 데이터 삽입
      const storeResult = await client.query(`
        INSERT INTO stores (name, is_open, created_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        RETURNING id
      `, [storeName, Math.random() > 0.1]); // 90% 확률로 영업중
      
      const storeId = storeResult.rows[0].id;
      
      // 2. store_addresses 테이블에 주소 정보 삽입
      await client.query(`
        INSERT INTO store_addresses (store_id, address_full, latitude, longitude, sido, sigungu, eupmyeondong)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        storeId,
        address,
        coord.lat,
        coord.lng,
        '서울특별시',
        district.name,
        `${Math.floor(Math.random() * 10) + 1}동`
      ]);
      
      // 3. store_info 테이블에 상세 정보 삽입
      const ratingAverage = parseFloat((Math.random() * 2 + 3).toFixed(1)); // 3.0 ~ 5.0
      const reviewCount = Math.floor(Math.random() * 100) + 1;
      const favoriteCount = Math.floor(Math.random() * 50);
      const telNumber = `02${Math.floor(Math.random() * 90000000) + 10000000}`;
      
      await client.query(`
        INSERT INTO store_info (store_id, name, category, store_tel_number, rating_average, review_count, favoratite_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        storeId,
        storeName,
        category,
        parseInt(telNumber),
        Math.floor(ratingAverage * 10), // 소수점 1자리를 정수로 변환 (예: 4.5 -> 45)
        reviewCount,
        favoriteCount
      ]);
      
      // 4. store_tables 테이블에 테이블 정보 삽입 (5~15개 테이블)
      const tableCount = Math.floor(Math.random() * 11) + 5; // 5~15개
      
      for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
        const seats = tableNum <= 3 ? 2 : tableNum <= 8 ? 4 : tableNum <= 12 ? 6 : 8;
        
        await client.query(`
          INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied)
          VALUES ($1, $2, $3, $4, $5)
        `, [storeId, tableNum, `테이블 ${tableNum}`, seats, Math.random() < 0.3]); // 30% 확률로 사용중
      }
      
      // 5. store_menu 테이블에 메뉴 삽입
      const menuItems = getMenuByCategory(category);
      
      for (const menu of menuItems) {
        await client.query(`
          INSERT INTO store_menu (store_id, name, description, price, cook_station)
          VALUES ($1, $2, $3, $4, $5)
        `, [storeId, menu.name, menu.description, menu.price, menu.cook_station]);
      }
      
      // 6. store_regular_levels 테이블에 VIP 고객 정보 삽입 (몇 명의 단골 고객)
      const regularCustomerCount = Math.floor(Math.random() * 5) + 1; // 1~5명
      
      for (let j = 0; j < regularCustomerCount; j++) {
        const visitCount = Math.floor(Math.random() * 50) + 10; // 10~59회
        const totalSpent = visitCount * (Math.floor(Math.random() * 20000) + 10000); // 방문당 1~3만원
        
        let levelName = 'Bronze';
        if (visitCount >= 30) levelName = 'Gold';
        else if (visitCount >= 20) levelName = 'Silver';
        
        try {
          await client.query(`
            INSERT INTO store_regular_levels (store_id, user_id, level_name, visit_count, total_spent, points)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            storeId,
            `regular_user_${storeId}_${j + 1}`,
            levelName,
            visitCount,
            totalSpent,
            Math.floor(totalSpent * 0.01) // 1% 포인트
          ]);
        } catch (error) {
          // 중복 키 에러는 무시
          if (error.code !== '23505') {
            throw error;
          }
        }
      }
      
      console.log(`✅ 매장 ${i}/100 생성 완료: ${storeName} (${category}) - ${district.name}`);
    }
    
    await client.query('COMMIT');
    console.log('🎉 100개 매장 더미데이터 생성 완료!');
    
    // 생성된 데이터 통계 출력
    const storeStats = await client.query(`
      SELECT 
        si.category,
        COUNT(*) as store_count,
        AVG(si.rating_average::float/10) as avg_rating
      FROM store_info si
      JOIN stores s ON si.store_id = s.id
      WHERE s.id > (SELECT COALESCE(MAX(id), 0) FROM stores) - 100
      GROUP BY si.category
      ORDER BY store_count DESC
    `);
    
    console.log('\n📊 생성된 매장 통계:');
    storeStats.rows.forEach(stat => {
      console.log(`  ${stat.category}: ${stat.store_count}개 매장 (평균 평점: ${parseFloat(stat.avg_rating).toFixed(1)})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 더미데이터 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  createDummyStores()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { createDummyStores };
