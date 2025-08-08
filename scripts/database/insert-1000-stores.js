
const pool = require('../../shared/config/database');

// 한국 주요 도시 및 지역
const koreanCities = [
  { name: '서울특별시', lat: 37.5665, lng: 126.9780 },
  { name: '부산광역시', lat: 35.1796, lng: 129.0756 },
  { name: '대구광역시', lat: 35.8714, lng: 128.6014 },
  { name: '인천광역시', lat: 37.4563, lng: 126.7052 },
  { name: '광주광역시', lat: 35.1595, lng: 126.8526 },
  { name: '대전광역시', lat: 36.3504, lng: 127.3845 },
  { name: '울산광역시', lat: 35.5384, lng: 129.3114 },
  { name: '세종특별자치시', lat: 36.4800, lng: 127.2890 },
  { name: '경기도 수원시', lat: 37.2636, lng: 127.0286 },
  { name: '경기도 성남시', lat: 37.4449, lng: 127.1388 },
  { name: '경기도 고양시', lat: 37.6584, lng: 126.8320 },
  { name: '경기도 용인시', lat: 37.2411, lng: 127.1775 },
  { name: '경기도 부천시', lat: 37.5036, lng: 126.7660 },
  { name: '경기도 안산시', lat: 37.3236, lng: 126.8219 },
  { name: '경기도 안양시', lat: 37.3943, lng: 126.9568 },
  { name: '경기도 남양주시', lat: 37.6363, lng: 127.2167 },
  { name: '강원도 춘천시', lat: 37.8813, lng: 127.7298 },
  { name: '강원도 원주시', lat: 37.3422, lng: 127.9202 },
  { name: '강원도 강릉시', lat: 37.7519, lng: 128.8761 },
  { name: '충청북도 청주시', lat: 36.6424, lng: 127.4890 },
  { name: '충청남도 천안시', lat: 36.8151, lng: 127.1139 },
  { name: '전라북도 전주시', lat: 35.8242, lng: 127.1480 },
  { name: '전라남도 목포시', lat: 34.8118, lng: 126.3922 },
  { name: '경상북도 포항시', lat: 36.0190, lng: 129.3435 },
  { name: '경상남도 창원시', lat: 35.2281, lng: 128.6811 },
  { name: '제주특별자치도 제주시', lat: 33.4996, lng: 126.5312 }
];

// 매장 카테고리별 상세 정보
const storeCategories = {
  '한식': {
    names: ['맛있는 한정식', '전통 갈비집', '김치찌개 전문점', '불고기 명가', '한식 뷔페', '삼계탕 전문점', '냉면 맛집', '비빔밥 전문점', '순두부찌개 맛집', '한우 전문점'],
    menus: [
      { name: '김치찌개', price: 8000, category: '찌개류', description: '집에서 담근 김치로 끓인 얼큰한 찌개' },
      { name: '불고기', price: 15000, category: '구이류', description: '달콤한 양념에 재운 부드러운 소고기' },
      { name: '비빔밥', price: 9000, category: '밥류', description: '신선한 나물과 고추장이 어우러진 영양 만점 비빔밥' },
      { name: '갈비탕', price: 12000, category: '탕류', description: '푹 끓인 사골 국물의 진한 갈비탕' },
      { name: '냉면', price: 7000, category: '면류', description: '시원하고 담백한 물냉면' }
    ]
  },
  '중식': {
    names: ['중화요리 전문점', '짜장면 맛집', '탕수육 전문점', '딤섬 하우스', '마라탕 전문점', '중국집', '홍콩 반점', '사천요리 전문점', '북경 요리', '광동 요리'],
    menus: [
      { name: '짜장면', price: 6000, category: '면류', description: '진한 춘장으로 만든 정통 짜장면' },
      { name: '탕수육', price: 18000, category: '요리류', description: '바삭한 튀김옷과 새콤달콤한 소스' },
      { name: '짬뽕', price: 7000, category: '면류', description: '얼큰한 국물의 해물 짬뽕' },
      { name: '마파두부', price: 12000, category: '요리류', description: '마라향이 일품인 사천식 마파두부' },
      { name: '딤섬', price: 15000, category: '요리류', description: '다양한 종류의 신선한 딤섬 세트' }
    ]
  },
  '일식': {
    names: ['초밥 전문점', '라멘 가게', '돈카츠 전문점', '우동 맛집', '일식당', '스시 바', '이자카야', '텐동 전문점', '소바 맛집', '규카츠 전문점'],
    menus: [
      { name: '연어초밥', price: 2500, category: '초밥류', description: '신선한 노르웨이산 연어 초밥' },
      { name: '돈카츠', price: 12000, category: '튀김류', description: '바삭한 옷을 입은 두툼한 돼지고기' },
      { name: '라멘', price: 9000, category: '면류', description: '진한 돈코츠 국물의 정통 라멘' },
      { name: '우동', price: 7000, category: '면류', description: '쫄깃한 면발의 따뜻한 우동' },
      { name: '치라시동', price: 15000, category: '덮밥류', description: '신선한 회가 올라간 일식 덮밥' }
    ]
  },
  '양식': {
    names: ['이탈리안 레스토랑', '스테이크 하우스', '파스타 전문점', '피자 맛집', '브런치 카페', '햄버거 전문점', '샐러드 바', '와인 바', '비스트로', '펍'],
    menus: [
      { name: '스테이크', price: 25000, category: '메인요리', description: '부드러운 소고기 스테이크' },
      { name: '파스타', price: 14000, category: '면류', description: '토마토 베이스의 정통 이탈리안 파스타' },
      { name: '피자', price: 18000, category: '피자류', description: '치즈가 듬뿍 들어간 마르게리타 피자' },
      { name: '리조또', price: 16000, category: '밥류', description: '크림소스의 부드러운 리조또' },
      { name: '샐러드', price: 12000, category: '사이드', description: '신선한 채소와 드레싱의 조화' }
    ]
  },
  '카페': {
    names: ['원두 카페', '디저트 카페', '브런치 카페', '베이커리 카페', '전망 좋은 카페', '힐링 카페', '로스터리 카페', '테마 카페', '책 카페', '펜션 카페'],
    menus: [
      { name: '아메리카노', price: 4000, category: '커피', description: '깔끔하고 진한 에스프레소 베이스' },
      { name: '카페라떼', price: 4500, category: '커피', description: '부드러운 우유와 에스프레소의 조화' },
      { name: '크로와상', price: 3500, category: '베이커리', description: '버터향 가득한 바삭한 크로와상' },
      { name: '치즈케이크', price: 6000, category: '디저트', description: '진한 크림치즈의 부드러운 케이크' },
      { name: '샌드위치', price: 8000, category: '브런치', description: '신선한 재료로 만든 클럽샌드위치' }
    ]
  },
  '치킨': {
    names: ['황금 치킨', '바삭 치킨', '양념치킨 전문점', '후라이드 치킨', '치킨 & 맥주', '닭강정 전문점', '치킨버거 전문점', '순살치킨 맛집', '치킨 도시락', '치킨갈비 전문점'],
    menus: [
      { name: '후라이드치킨', price: 16000, category: '치킨류', description: '바삭하고 담백한 후라이드 치킨' },
      { name: '양념치킨', price: 17000, category: '치킨류', description: '달콤매콤한 특제 양념치킨' },
      { name: '반반치킨', price: 18000, category: '치킨류', description: '후라이드와 양념이 반반' },
      { name: '닭강정', price: 12000, category: '치킨류', description: '달콤한 소스의 바삭한 닭강정' },
      { name: '치킨버거', price: 8000, category: '버거류', description: '바삭한 치킨패티 버거' }
    ]
  },
  '분식': {
    names: ['옛날 분식점', '떡볶이 전문점', '김밥천국', '분식 맛집', '즉석 분식', '길거리 분식', '추억의 분식점', '학교 앞 분식', '24시간 분식', '분식왕'],
    menus: [
      { name: '떡볶이', price: 4000, category: '분식류', description: '매콤달콤한 떡볶이' },
      { name: '김밥', price: 3000, category: '분식류', description: '다양한 재료가 들어간 김밥' },
      { name: '순대', price: 5000, category: '분식류', description: '쫄깃한 순대와 특제소스' },
      { name: '어묵', price: 2000, category: '분식류', description: '따뜻한 국물의 어묵' },
      { name: '튀김', price: 1000, category: '분식류', description: '바삭한 야채튀김' }
    ]
  },
  '피자': {
    names: ['이탈리아 피자', '나폴리 피자', '시카고 피자', '피자 팩토리', '화덕 피자', '피자 스튜디오', '크러스트 피자', '피자 마니아', '핸드메이드 피자', '프리미엄 피자'],
    menus: [
      { name: '마르게리타', price: 15000, category: '피자류', description: '토마토, 모짜렐라, 바질의 클래식 피자' },
      { name: '페퍼로니', price: 18000, category: '피자류', description: '매콤한 페퍼로니가 올라간 피자' },
      { name: '하와이안', price: 17000, category: '피자류', description: '햄과 파인애플의 달콤한 조합' },
      { name: '고르곤졸라', price: 20000, category: '피자류', description: '진한 치즈향의 고르곤졸라 피자' },
      { name: '불고기피자', price: 19000, category: '피자류', description: '한국식 불고기가 올라간 피자' }
    ]
  }
};

// 운영 시간 패턴
const operatingHours = [
  '09:00-22:00',
  '10:00-23:00',
  '11:00-21:00',
  '08:00-20:00',
  '24시간 운영',
  '12:00-02:00',
  '11:00-23:30',
  '10:30-22:30'
];

// 매장 설명 패턴
const descriptions = [
  '신선한 재료와 정성으로 만드는 맛있는 요리',
  '가족과 함께 즐길 수 있는 따뜻한 분위기의 매장',
  '합리적인 가격에 푸짐한 양을 제공하는 맛집',
  '전통의 맛을 현대적으로 재해석한 특별한 요리',
  '깨끗하고 쾌적한 환경에서 즐기는 맛있는 식사',
  '정성스럽게 준비한 요리로 고객만족을 추구합니다',
  '오랜 전통과 노하우로 만든 자랑스러운 맛',
  '신선한 재료만을 사용하여 건강한 요리를 제공',
  '편안하고 아늑한 분위기에서 맛보는 특별한 요리',
  '고객의 입맛을 사로잡는 다양하고 맛있는 메뉴'
];

// 한국 지역별 주소 패턴
const addressPatterns = [
  '서울특별시 강남구 테헤란로',
  '서울특별시 종로구 종로',
  '서울특별시 마포구 홍대로',
  '부산광역시 해운대구 해운대해변로',
  '대구광역시 중구 동성로',
  '인천광역시 중구 차이나타운로',
  '광주광역시 서구 상무중앙로',
  '대전광역시 유성구 대학로',
  '울산광역시 남구 삼산로',
  '경기도 수원시 영통구 영통로'
];

// 전화번호 생성 함수
function generatePhoneNumber() {
  const areaCodes = ['02', '031', '032', '051', '052', '053', '054', '055', '061', '062', '063', '064'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const middle = Math.floor(Math.random() * 9000) + 1000;
  const last = Math.floor(Math.random() * 9000) + 1000;
  return `${areaCode}-${middle}-${last}`;
}

// 랜덤 좌표 생성 함수 (기준점에서 반경 내)
function generateRandomCoord(baseCity) {
  const latOffset = (Math.random() - 0.5) * 0.1; // ±0.05도 범위
  const lngOffset = (Math.random() - 0.5) * 0.1;
  
  return {
    lat: parseFloat((baseCity.lat + latOffset).toFixed(6)),
    lng: parseFloat((baseCity.lng + lngOffset).toFixed(6))
  };
}

// 메뉴 가격 변동 함수
function adjustMenuPrice(basePrice) {
  const variation = Math.random() * 0.4 - 0.2; // ±20% 변동
  const adjustedPrice = Math.round(basePrice * (1 + variation) / 500) * 500; // 500원 단위로 반올림
  return Math.max(adjustedPrice, 1000); // 최소 1000원
}

// 주소 생성 함수
function generateAddress(cityName) {
  const baseAddress = addressPatterns[Math.floor(Math.random() * addressPatterns.length)];
  const buildingNumber = Math.floor(Math.random() * 999) + 1;
  const detailAddress = Math.floor(Math.random() * 20) + 1;
  
  if (cityName.includes('서울')) {
    return `${baseAddress} ${buildingNumber}, ${detailAddress}층`;
  } else {
    return `${cityName} ${baseAddress.split(' ').slice(-1)[0]} ${buildingNumber}, ${detailAddress}층`;
  }
}

async function insert1000Stores() {
  try {
    console.log('🚀 1000개 매장 더미 데이터 생성 시작...');
    
    // 기존 매장 수 확인
    const existingStoresResult = await pool.query('SELECT MAX(id) as max_id FROM stores');
    const startId = (existingStoresResult.rows[0].max_id || 0) + 1;
    
    console.log(`📊 기존 최대 매장 ID: ${startId - 1}, 새로운 매장 ID 시작: ${startId}`);
    
    const storePromises = [];
    
    for (let i = 0; i < 1000; i++) {
      const storeId = startId + i;
      
      // 랜덤 도시 선택
      const randomCity = koreanCities[Math.floor(Math.random() * koreanCities.length)];
      
      // 랜덤 카테고리 선택
      const categories = Object.keys(storeCategories);
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const categoryData = storeCategories[randomCategory];
      
      // 매장명 생성
      const baseName = categoryData.names[Math.floor(Math.random() * categoryData.names.length)];
      const storeName = `${baseName} ${randomCity.name.split(' ')[0]} ${i + 1}호점`;
      
      // 메뉴 생성 (3-7개 랜덤 선택)
      const menuCount = Math.floor(Math.random() * 5) + 3; // 3~7개
      const selectedMenus = [];
      const shuffledMenus = [...categoryData.menus].sort(() => Math.random() - 0.5);
      
      for (let j = 0; j < Math.min(menuCount, shuffledMenus.length); j++) {
        const menu = { ...shuffledMenus[j] };
        menu.price = adjustMenuPrice(menu.price);
        selectedMenus.push(menu);
      }
      
      // 좌표 생성
      const coord = generateRandomCoord(randomCity);
      
      // 매장 데이터 객체
      const storeData = {
        id: storeId,
        name: storeName,
        category: randomCategory,
        distance: `${(Math.random() * 5 + 0.1).toFixed(1)}km`,
        menu: selectedMenus,
        coord: coord,
        review_count: Math.floor(Math.random() * 200) + 10, // 10~209
        is_open: Math.random() > 0.1, // 90% 확률로 운영중
        address: generateAddress(randomCity.name),
        phone: generatePhoneNumber(),
        rating_average: (Math.random() * 2 + 3).toFixed(1), // 3.0~5.0
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        operating_hours: operatingHours[Math.floor(Math.random() * operatingHours.length)],
        latitude: coord.lat,
        longitude: coord.lng
      };
      
      // 데이터베이스 삽입 Promise 추가
      const insertPromise = pool.query(`
        INSERT INTO stores (
          id, name, category, distance, menu, coord, review_count, is_open,
          address, phone, rating_average, description, operating_hours, latitude, longitude
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
      `, [
        storeData.id,
        storeData.name,
        storeData.category,
        storeData.distance,
        JSON.stringify(storeData.menu),
        JSON.stringify(storeData.coord),
        storeData.review_count,
        storeData.is_open,
        storeData.address,
        storeData.phone,
        parseFloat(storeData.rating_average),
        storeData.description,
        storeData.operating_hours,
        storeData.latitude,
        storeData.longitude
      ]);
      
      storePromises.push(insertPromise);
      
      // 진행 상황 출력 (100개씩)
      if ((i + 1) % 100 === 0) {
        console.log(`⏳ ${i + 1}/1000 매장 데이터 준비 완료...`);
      }
    }
    
    console.log('💾 데이터베이스에 매장 정보 삽입 중...');
    
    // 모든 Promise 실행 (병렬 처리)
    const results = await Promise.allSettled(storePromises);
    
    // 결과 분석
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    console.log(`✅ 매장 데이터 삽입 완료: 성공 ${successful}개, 실패 ${failed}개`);
    
    if (failed > 0) {
      console.log('❌ 실패한 삽입들:');
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.log(`  - 매장 ID ${startId + index}: ${result.reason.message}`);
        }
      });
    }
    
    // 각 매장에 테이블 데이터도 생성
    console.log('🪑 매장별 테이블 데이터 생성 중...');
    
    const tablePromises = [];
    
    for (let i = 0; i < successful; i++) {
      const storeId = startId + i;
      
      // 각 매장마다 8-15개의 테이블 생성
      const tableCount = Math.floor(Math.random() * 8) + 8; // 8~15개
      
      for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
        const seats = tableNum <= 3 ? 2 : tableNum <= 6 ? 4 : tableNum <= 10 ? 6 : 8;
        
        const tablePromise = pool.query(`
          INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (store_id, table_number) DO NOTHING
        `, [storeId, tableNum, `테이블 ${tableNum}`, seats, Math.random() < 0.2]); // 20% 확률로 점유
        
        tablePromises.push(tablePromise);
      }
    }
    
    await Promise.allSettled(tablePromises);
    console.log('✅ 테이블 데이터 생성 완료');
    
    // 최종 통계
    const finalCount = await pool.query('SELECT COUNT(*) as total FROM stores');
    const newStoreCount = await pool.query('SELECT COUNT(*) as new_count FROM stores WHERE id >= $1', [startId]);
    
    console.log('🎉 1000개 매장 더미 데이터 생성 완료!');
    console.log(`📊 전체 매장 수: ${finalCount.rows[0].total}개`);
    console.log(`🆕 새로 생성된 매장: ${newStoreCount.rows[0].new_count}개`);
    console.log(`🗺️ 생성된 지역: ${koreanCities.length}개 도시`);
    console.log(`🍽️ 생성된 카테고리: ${Object.keys(storeCategories).length}개 분류`);
    
  } catch (error) {
    console.error('❌ 1000개 매장 데이터 생성 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  insert1000Stores()
    .then(() => {
      console.log('🚀 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { insert1000Stores };
