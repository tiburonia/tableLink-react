
const pool = require('../../shared/config/database');

// 카카오 REST API 키
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

if (!KAKAO_API_KEY) {
  console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
  console.log('💡 Secrets 도구에서 KAKAO_API_KEY를 설정해주세요.');
  process.exit(1);
}

// 서울시청 좌표 (37.5665, 126.9780)
const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.9780 };

// 매장 카테고리별 이름 템플릿
const STORE_TEMPLATES = {
  한식: [
    '한식당', '밥집', '국밥집', '정식집', '갈비집', '삼겹살집', '불고기집', '비빔밥집', 
    '김치찌개집', '된장찌개집', '순두부찌개집', '부대찌개집', '김치볶음밥집', '제육볶음집'
  ],
  중식: [
    '중국집', '짜장면집', '짬뽕집', '탕수육집', '마라탕집', '마라샹궈집', '딤섬집',
    '볶음밥집', '울면집', '양장피집', '깐풍기집', '팔보채집', '유린기집'
  ],
  일식: [
    '일식당', '초밥집', '라멘집', '우동집', '돈카츠집', '규동집', '사시미집', '회집',
    '야키토리집', '오코노미야키집', '타코야키집', '카츠동집'
  ],
  양식: [
    '양식당', '스테이크하우스', '파스타집', '피자집', '햄버거집', '샐러드집', '브런치카페',
    '이탈리안레스토랑', '프렌치레스토랑', '그릴하우스', '비스트로'
  ],
  카페: [
    '카페', '커피숍', '디저트카페', '베이커리카페', '브런치카페', '로스터리카페',
    '스페셜티카페', '테마카페', '디저트전문점', '와플하우스'
  ]
};

// 서울시청 근처 지역명
const NEARBY_AREAS = [
  '중구', '종로구', '용산구', '서대문구', '마포구', '영등포구', '강남구', '서초구',
  '송파구', '강동구', '성동구', '광진구', '동대문구', '성북구', '강북구'
];

// 10km 반경 내 랜덤 좌표 생성 (더 정확한 반경 계산)
function getRandomCoordinateNearSeoulCityHall() {
  // 10km = 약 0.09도 (위도/경도)
  const radiusInDegrees = 0.09;
  
  // 랜덤 각도와 거리
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;
  
  // 극좌표를 직교좌표로 변환
  const deltaLat = distance * Math.cos(angle);
  const deltaLng = distance * Math.sin(angle);
  
  const lat = SEOUL_CITY_HALL.lat + deltaLat;
  const lng = SEOUL_CITY_HALL.lng + deltaLng;
  
  return { 
    lat: parseFloat(lat.toFixed(6)), 
    lng: parseFloat(lng.toFixed(6)) 
  };
}

// 랜덤 매장명 생성
function generateStoreName(category) {
  const templates = STORE_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const prefixes = ['맛있는', '유명한', '전통', '신선한', '특별한', '프리미엄', '고급', '정통', '본격'];
  const suffixes = ['본점', '1호점', '시청점', '명동점', '을지로점', '중구점', '종로점'];
  
  const usePrefix = Math.random() > 0.5;
  const useSuffix = Math.random() > 0.3;
  
  let name = template;
  if (usePrefix) {
    name = prefixes[Math.floor(Math.random() * prefixes.length)] + ' ' + name;
  }
  if (useSuffix) {
    name = name + ' ' + suffixes[Math.floor(Math.random() * suffixes.length)];
  }
  
  return name;
}

// 카카오 API로 주소 조회
async function getAddressFromCoordinates(lat, lng) {
  try {
    console.log(`📍 좌표 (${lat}, ${lng})에서 주소 조회 중...`);
    
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.log(`❌ API 호출 실패: ${response.status}`);
      return {
        fullAddress: `GPS 위치 (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        sido: '서울특별시',
        sigungu: '중구',
        dong: '을지로동'
      };
    }

    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      
      let fullAddress = '';
      let sido = '';
      let sigungu = '';
      let dong = '';
      
      if (doc.road_address && doc.road_address.address_name) {
        fullAddress = doc.road_address.address_name;
        sido = doc.road_address.region_1depth_name || '서울특별시';
        sigungu = doc.road_address.region_2depth_name || '중구';
        dong = doc.road_address.region_3depth_name || '을지로동';
      } else if (doc.address && doc.address.address_name) {
        fullAddress = doc.address.address_name;
        sido = doc.address.region_1depth_name || '서울특별시';
        sigungu = doc.address.region_2depth_name || '중구';
        dong = doc.address.region_3depth_name || '을지로동';
      }
      
      console.log(`✅ 주소 조회 성공: ${fullAddress}`);
      return { fullAddress, sido, sigungu, dong };
    }
    
    return {
      fullAddress: `GPS 위치 (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
      sido: '서울특별시',
      sigungu: '중구',
      dong: '을지로동'
    };
    
  } catch (error) {
    console.error('주소 조회 오류:', error.message);
    return {
      fullAddress: `GPS 위치 (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
      sido: '서울특별시',
      sigungu: '중구',
      dong: '을지로동'
    };
  }
}

async function addSeoulCityHallStores() {
  try {
    console.log('🏢 서울시청 근처 10km 반경에 15개 매장 추가 시작...');
    
    // 현재 최대 매장 ID 조회
    const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM stores');
    let currentMaxId = parseInt(maxIdResult.rows[0].max_id);
    
    console.log(`📊 현재 최대 매장 ID: ${currentMaxId}`);
    
    const categories = Object.keys(STORE_TEMPLATES);
    const storeCount = 15;
    
    console.log(`📍 서울시청 좌표: ${SEOUL_CITY_HALL.lat}, ${SEOUL_CITY_HALL.lng}`);
    console.log(`🎯 10km 반경 내 ${storeCount}개 매장 생성 시작\n`);
    
    for (let i = 0; i < storeCount; i++) {
      const storeIndex = i + 1;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const coord = getRandomCoordinateNearSeoulCityHall();
      const storeName = generateStoreName(category);
      const isOpen = Math.random() > 0.1; // 90% 확률로 운영중
      
      const newStoreId = currentMaxId + storeIndex;
      
      // 시청으로부터의 거리 계산 (대략적)
      const latDiff = Math.abs(coord.lat - SEOUL_CITY_HALL.lat);
      const lngDiff = Math.abs(coord.lng - SEOUL_CITY_HALL.lng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // km 변환
      
      console.log(`🏪 [${storeIndex}/${storeCount}] 매장 ${newStoreId}: ${storeName}`);
      console.log(`📍 좌표: ${coord.lat}, ${coord.lng} (시청에서 약 ${distance.toFixed(1)}km)`);
      console.log(`🏷️ 카테고리: ${category}, 운영상태: ${isOpen ? '운영중' : '운영중지'}`);
      
      // 주소 조회
      const addressInfo = await getAddressFromCoordinates(coord.lat, coord.lng);
      console.log(`📍 주소: ${addressInfo.fullAddress}`);
      console.log(`🏛️ 행정구역: ${addressInfo.sido} ${addressInfo.sigungu} ${addressInfo.dong}\n`);
      
      // stores 테이블에 매장 추가
      await pool.query(`
        INSERT INTO stores (id, name, category, distance, address, menu, coord, review_count, rating_average, is_open)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        newStoreId,
        storeName,
        category,
        `시청에서 ${distance.toFixed(1)}km`,
        addressInfo.fullAddress,
        JSON.stringify([]),
        JSON.stringify(coord),
        0,
        '0.0',
        isOpen
      ]);
      
      // store_address 테이블에 주소 정보 추가
      await pool.query(`
        INSERT INTO store_address (store_id, address_full, sido, sigungu, dong, latitude, longitude, coord)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (store_id) DO UPDATE SET
          address_full = EXCLUDED.address_full,
          sido = EXCLUDED.sido,
          sigungu = EXCLUDED.sigungu,
          dong = EXCLUDED.dong,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          coord = EXCLUDED.coord
      `, [
        newStoreId,
        addressInfo.fullAddress,
        addressInfo.sido,
        addressInfo.sigungu,
        addressInfo.dong,
        coord.lat,
        coord.lng,
        JSON.stringify(coord)
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
      
      // API 제한 방지 (200ms 딜레이)
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // 최종 결과 확인
    const finalResult = await pool.query('SELECT COUNT(*) as total FROM stores');
    const totalStoresInDB = parseInt(finalResult.rows[0].total);
    
    console.log(`\n🎉 서울시청 근처 15개 매장 추가 완료!`);
    console.log(`📊 데이터베이스 총 매장 수: ${totalStoresInDB}개`);
    
    // 새로 추가된 매장들 확인
    console.log('\n📍 새로 추가된 매장 목록:');
    const newStores = await pool.query(`
      SELECT s.id, s.name, s.category, sa.address_full, s.distance
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE s.id > $1
      ORDER BY s.id
    `, [currentMaxId]);
    
    newStores.rows.forEach((store, index) => {
      console.log(`  ${index + 1}. 매장 ${store.id}: ${store.name} (${store.category})`);
      console.log(`     📍 ${store.address_full}`);
      console.log(`     📏 ${store.distance}`);
    });
    
    // 카테고리별 분포 확인
    console.log('\n🍽️ 새로 추가된 매장 카테고리별 분포:');
    const categoryDistribution = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM stores 
      WHERE id > $1
      GROUP BY category
      ORDER BY count DESC
    `, [currentMaxId]);
    
    categoryDistribution.rows.forEach(row => {
      console.log(`  - ${row.category}: ${row.count}개`);
    });
    
  } catch (error) {
    console.error('❌ 서울시청 근처 매장 추가 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
addSeoulCityHallStores();
