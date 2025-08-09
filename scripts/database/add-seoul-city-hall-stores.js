
const pool = require('../../shared/config/database');

// 카카오 REST API 키
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

if (!KAKAO_API_KEY) {
  console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
  console.log('💡 Secrets 도구에서 KAKAO_API_KEY를 설정해주세요.');
  process.exit(1);
}

// 서울시청 좌표 (37.5666805, 126.9784147)
const SEOUL_CITY_HALL = { lat: 37.5666805, lng: 126.9784147 };

// 1km 반경 내 랜덤 좌표 생성 (약 0.009도 = 1km)
const RADIUS_DEGREE = 0.009;

// 매장 카테고리별 이름 템플릿
const STORE_TEMPLATES = {
  한식: [
    '명동 갈비집', '시청 한정식', '중구 국밥', '을지로 삼겹살', '종로 비빔밥',
    '정동 제육볶음', '소공동 김치찌개', '명동 백반', '시청 보쌈', '중구 족발'
  ],
  중식: [
    '명동 차이나타운', '시청 짜장면', '중구 짬뽕', '을지로 탕수육', '종로 마라탕',
    '정동 중화요리', '소공동 딤섬', '명동 울면', '시청 양장피', '중구 깐풍기'
  ],
  일식: [
    '명동 스시', '시청 라멘', '중구 우동', '을지로 돈카츠', '종로 규동',
    '정동 초밥', '소공동 사시미', '명동 야키토리', '시청 덴푸라', '중구 소바'
  ],
  양식: [
    '명동 스테이크', '시청 파스타', '중구 피자', '을지로 햄버거', '종로 샐러드',
    '정동 브런치', '소공동 이탈리안', '명동 프렌치', '시청 그릴', '중구 비스트로'
  ],
  카페: [
    '명동 카페', '시청 커피숍', '중구 디저트카페', '을지로 베이커리', '종로 브런치카페',
    '정동 로스터리', '소공동 스페셜티', '명동 테마카페', '시청 와플하우스', '중구 아이스크림'
  ],
  치킨: [
    '명동 치킨', '시청 후라이드', '중구 양념치킨', '을지로 간장치킨', '종로 치킨호프',
    '정동 닭강정', '소공동 치킨버거', '명동 순살치킨', '시청 뿌링클', '중구 불닭'
  ]
};

// 서울 중구 지역명
const JUNG_GU_AREAS = [
  '명동', '시청', '소공동', '을지로', '종로', '정동', '중림동', '신당동', '황학동', '필동'
];

// 1km 반경 내 랜덤 좌표 생성
function getRandomCoordinateInRadius() {
  const angle = Math.random() * 2 * Math.PI;
  const radius = Math.random() * RADIUS_DEGREE;
  
  const lat = SEOUL_CITY_HALL.lat + radius * Math.cos(angle);
  const lng = SEOUL_CITY_HALL.lng + radius * Math.sin(angle);
  
  return { 
    lat: parseFloat(lat.toFixed(6)), 
    lng: parseFloat(lng.toFixed(6)) 
  };
}

// 랜덤 매장명 생성
function generateStoreName(category) {
  const templates = STORE_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const area = JUNG_GU_AREAS[Math.floor(Math.random() * JUNG_GU_AREAS.length)];
  
  // 50% 확률로 지역명 추가
  if (Math.random() > 0.5) {
    return `${area} ${template}`;
  }
  return template;
}

// 카카오 API로 주소 조회
async function getAddressFromCoordinates(lat, lng) {
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      return `서울특별시 중구 (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    }

    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      
      if (doc.road_address && doc.road_address.address_name) {
        return doc.road_address.address_name;
      } else if (doc.address && doc.address.address_name) {
        return doc.address.address_name;
      }
    }
    
    return `서울특별시 중구 (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    
  } catch (error) {
    console.error('주소 조회 오류:', error.message);
    return `서울특별시 중구 (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
  }
}

async function addSeoulCityHallStores() {
  try {
    console.log('🏛️ 서울시청 근방 1km 내 20개 매장 생성 시작...');
    console.log(`📍 서울시청 좌표: ${SEOUL_CITY_HALL.lat}, ${SEOUL_CITY_HALL.lng}`);
    
    // 현재 최대 매장 ID 조회
    const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM stores');
    let currentMaxId = parseInt(maxIdResult.rows[0].max_id);
    
    console.log(`📊 현재 최대 매장 ID: ${currentMaxId}`);
    
    const categories = Object.keys(STORE_TEMPLATES);
    const totalStores = 20;
    
    for (let i = 0; i < totalStores; i++) {
      const newStoreId = currentMaxId + i + 1;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const coord = getRandomCoordinateInRadius();
      const storeName = generateStoreName(category);
      const isOpen = Math.random() > 0.1; // 90% 확률로 운영중
      
      // 시청으로부터의 거리 계산 (대략적)
      const distance = Math.sqrt(
        Math.pow((coord.lat - SEOUL_CITY_HALL.lat) * 111, 2) + 
        Math.pow((coord.lng - SEOUL_CITY_HALL.lng) * 88, 2)
      );
      const distanceKm = (distance).toFixed(1);
      
      console.log(`🏪 매장 ${newStoreId}: ${storeName} (${category})`);
      console.log(`📍 좌표: ${coord.lat}, ${coord.lng} (시청에서 ${distanceKm}km)`);
      
      // 주소 조회
      const address = await getAddressFromCoordinates(coord.lat, coord.lng);
      console.log(`🏠 주소: ${address}`);
      
      // 데이터베이스에 삽입
      await pool.query(`
        INSERT INTO stores (id, name, category, distance, address, menu, coord, review_count, rating_average, is_open)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        newStoreId,
        storeName,
        category,
        `${distanceKm}km`,
        address,
        JSON.stringify([]),
        JSON.stringify(coord),
        0,
        '0.0',
        isOpen
      ]);
      
      // 각 매장에 기본 테이블 2-4개 추가
      const tableCount = Math.floor(Math.random() * 3) + 2; // 2-4개
      for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
        const seats = [2, 4, 6][Math.floor(Math.random() * 3)]; // 2, 4, 6인석 중 랜덤
        await pool.query(`
          INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied)
          VALUES ($1, $2, $3, $4, $5)
        `, [newStoreId, tableNum, `테이블 ${tableNum}`, seats, false]);
      }
      
      console.log(`✅ 매장 ${newStoreId} 생성 완료 (테이블 ${tableCount}개)`);
      
      // API 제한 방지 (100ms 딜레이)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 최종 결과 확인
    const finalResult = await pool.query('SELECT COUNT(*) as total FROM stores');
    const totalStoresInDB = parseInt(finalResult.rows[0].total);
    
    console.log(`\n🎉 서울시청 근방 20개 매장 생성 완료!`);
    console.log(`📊 데이터베이스 총 매장 수: ${totalStoresInDB}개`);
    
    // 새로 추가된 매장들의 좌표 범위 확인
    const rangeResult = await pool.query(`
      SELECT 
        MIN((coord->>'lat')::float) as min_lat,
        MAX((coord->>'lat')::float) as max_lat,
        MIN((coord->>'lng')::float) as min_lng,
        MAX((coord->>'lng')::float) as max_lng
      FROM stores 
      WHERE id > $1
    `, [currentMaxId]);
    
    const range = rangeResult.rows[0];
    console.log('\n📍 새로 추가된 매장 좌표 범위:');
    console.log(`위도: ${range.min_lat} ~ ${range.max_lat}`);
    console.log(`경도: ${range.min_lng} ~ ${range.max_lng}`);
    
    // 시청 기준 거리 통계
    console.log('\n📏 시청으로부터 거리 분포:');
    const distanceResult = await pool.query(`
      SELECT 
        CASE 
          WHEN distance LIKE '%0.%km' THEN '1km 미만'
          WHEN distance LIKE '%1.%km' THEN '1km 대'
          ELSE '기타'
        END as distance_range,
        COUNT(*) as count
      FROM stores 
      WHERE id > $1
      GROUP BY distance_range
      ORDER BY distance_range
    `, [currentMaxId]);
    
    distanceResult.rows.forEach(row => {
      console.log(`  - ${row.distance_range}: ${row.count}개`);
    });
    
    // 카테고리별 분포 확인
    console.log('\n🍽️ 새로 추가된 매장 카테고리 분포:');
    const categoryResult = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM stores 
      WHERE id > $1
      GROUP BY category
      ORDER BY count DESC
    `, [currentMaxId]);
    
    categoryResult.rows.forEach(row => {
      console.log(`  - ${row.category}: ${row.count}개`);
    });
    
  } catch (error) {
    console.error('❌ 서울시청 근방 매장 생성 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
addSeoulCityHallStores();
