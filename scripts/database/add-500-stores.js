
const pool = require('../../shared/config/database');

// 카카오 REST API 키
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

if (!KAKAO_API_KEY) {
  console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
  console.log('💡 Secrets 도구에서 KAKAO_API_KEY를 설정해주세요.');
  process.exit(1);
}

// 전국 주요 도시별 좌표 범위
const CITY_COORDINATES = {
  서울: { lat: [37.413, 37.715], lng: [126.734, 127.269] },
  부산: { lat: [35.095, 35.396], lng: [128.748, 129.366] },
  대구: { lat: [35.790, 35.920], lng: [128.470, 128.780] },
  인천: { lat: [37.263, 37.637], lng: [126.406, 126.878] },
  광주: { lat: [35.095, 35.248], lng: [126.705, 127.018] },
  대전: { lat: [36.248, 36.456], lng: [127.309, 127.546] },
  울산: { lat: [35.477, 35.623], lng: [129.206, 129.468] },
  수원: { lat: [37.205, 37.370], lng: [126.888, 127.122] },
  성남: { lat: [37.320, 37.488], lng: [127.075, 127.263] },
  고양: { lat: [37.570, 37.750], lng: [126.770, 126.980] },
  용인: { lat: [37.178, 37.370], lng: [127.075, 127.330] },
  창원: { lat: [35.180, 35.320], lng: [128.500, 128.780] },
  천안: { lat: [36.730, 36.890], lng: [127.090, 127.200] },
  전주: { lat: [35.720, 35.900], lng: [127.050, 127.200] },
  안산: { lat: [37.270, 37.370], lng: [126.790, 126.890] },
  안양: { lat: [37.380, 37.430], lng: [126.890, 126.970] },
  포항: { lat: [35.960, 36.100], lng: [129.280, 129.420] },
  의정부: { lat: [37.720, 37.780], lng: [127.020, 127.080] },
  원주: { lat: [37.300, 37.400], lng: [127.900, 128.000] },
  춘천: { lat: [37.850, 37.920], lng: [127.680, 127.780] }
};

// 매장 카테고리별 이름 템플릿
const STORE_TEMPLATES = {
  한식: [
    '한식당', '밥집', '국밥집', '정식집', '갈비집', '삼겹살집', '불고기집', '비빔밥집', 
    '김치찌개집', '된장찌개집', '순두부찌개집', '부대찌개집', '김치볶음밥집', '제육볶음집',
    '한정식', '백반집', '보쌈집', '족발집', '닭갈비집', '돼지갈비집'
  ],
  중식: [
    '중국집', '짜장면집', '짬뽕집', '탕수육집', '마라탕집', '마라샹궈집', '딤섬집',
    '볶음밥집', '울면집', '양장피집', '깐풍기집', '팔보채집', '유린기집', '꿔바로우집'
  ],
  일식: [
    '일식당', '초밥집', '라멘집', '우동집', '돈카츠집', '규동집', '사시미집', '회집',
    '야키토리집', '오코노미야키집', '타코야키집', '카츠동집', '덴푸라집', '소바집'
  ],
  양식: [
    '양식당', '스테이크하우스', '파스타집', '피자집', '햄버거집', '샐러드집', '브런치카페',
    '이탈리안레스토랑', '프렌치레스토랑', '그릴하우스', '비스트로', '펍', '와인바'
  ],
  카페: [
    '카페', '커피숍', '디저트카페', '베이커리카페', '브런치카페', '로스터리카페',
    '스페셜티카페', '테마카페', '디저트전문점', '와플하우스', '아이스크림카페'
  ],
  치킨: [
    '치킨집', '후라이드치킨집', '양념치킨집', '간장치킨집', '치킨호프', '닭강정집',
    '치킨버거집', '순살치킨집', '뿌링클치킨집', '불닭치킨집'
  ],
  분식: [
    '분식집', '떡볶이집', '김밥집', '순대집', '어묵집', '튀김집', '만두집',
    '라면집', '쫄면집', '냉면집', '막국수집', '칼국수집'
  ],
  술집: [
    '주점', '호프집', '맥주집', '포차', '술집', '이자카야', '와인바', '칵테일바',
    '소주방', '막걸리집', '생맥주집', '치킨호프'
  ]
};

// 랜덤 좌표 생성 함수
function getRandomCoordinate(cityName) {
  const city = CITY_COORDINATES[cityName];
  const lat = Math.random() * (city.lat[1] - city.lat[0]) + city.lat[0];
  const lng = Math.random() * (city.lng[1] - city.lng[0]) + city.lng[0];
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

// 랜덤 매장명 생성 함수
function generateStoreName(category, cityName) {
  const templates = STORE_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const prefixes = ['맛있는', '유명한', '전통', '신선한', '특별한', '프리미엄', '고급', '정통', '본격', '진짜'];
  const suffixes = ['본점', '1호점', '강남점', '역삼점', '명동점', '홍대점', '신촌점', cityName + '점'];
  
  const usePrefix = Math.random() > 0.6;
  const useSuffix = Math.random() > 0.4;
  
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
      return `GPS 위치 (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
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
    
    return `GPS 위치 (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    
  } catch (error) {
    console.error('주소 조회 오류:', error.message);
    return `GPS 위치 (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
  }
}

async function add500Stores() {
  try {
    console.log('🏪 전국 500개 매장 더미데이터 생성 시작...');
    
    // 현재 최대 매장 ID 조회
    const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM stores');
    let currentMaxId = parseInt(maxIdResult.rows[0].max_id);
    
    console.log(`📊 현재 최대 매장 ID: ${currentMaxId}`);
    
    const categories = Object.keys(STORE_TEMPLATES);
    const cities = Object.keys(CITY_COORDINATES);
    const storesPerBatch = 50; // 배치 단위
    const totalStores = 500;
    
    for (let batch = 0; batch < Math.ceil(totalStores / storesPerBatch); batch++) {
      const batchStart = batch * storesPerBatch;
      const batchEnd = Math.min((batch + 1) * storesPerBatch, totalStores);
      const batchSize = batchEnd - batchStart;
      
      console.log(`\n📦 배치 ${batch + 1}/${Math.ceil(totalStores / storesPerBatch)} 처리 중... (${batchStart + 1}-${batchEnd}번째 매장)`);
      
      const storeData = [];
      
      // 배치별 매장 데이터 생성
      for (let i = 0; i < batchSize; i++) {
        const storeIndex = batchStart + i;
        const cityName = cities[Math.floor(Math.random() * cities.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const coord = getRandomCoordinate(cityName);
        const storeName = generateStoreName(category, cityName);
        const isOpen = Math.random() > 0.1; // 90% 확률로 운영중
        
        const newStoreId = currentMaxId + storeIndex + 1;
        
        console.log(`🏪 매장 ${newStoreId}: ${storeName} (${category}, ${cityName}) - ${coord.lat}, ${coord.lng}`);
        
        // 주소 조회
        const address = await getAddressFromCoordinates(coord.lat, coord.lng);
        console.log(`📍 주소: ${address}`);
        
        storeData.push({
          id: newStoreId,
          name: storeName,
          category: category,
          address: address,
          coord: coord,
          isOpen: isOpen
        });
        
        // API 제한 방지 (100ms 딜레이)
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 배치 단위로 데이터베이스에 삽입
      console.log(`💾 배치 ${batch + 1} 데이터베이스 삽입 중...`);
      
      for (const store of storeData) {
        await pool.query(`
          INSERT INTO stores (id, name, category, distance, address, menu, coord, review_count, rating_average, is_open)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          store.id,
          store.name,
          store.category,
          '정보없음',
          store.address,
          JSON.stringify([]),
          JSON.stringify(store.coord),
          0,
          '0.0',
          store.isOpen
        ]);
        
        // 각 매장에 기본 테이블 2-4개 추가
        const tableCount = Math.floor(Math.random() * 3) + 2; // 2-4개
        for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
          const seats = [2, 4, 6][Math.floor(Math.random() * 3)]; // 2, 4, 6인석 중 랜덤
          await pool.query(`
            INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied)
            VALUES ($1, $2, $3, $4, $5)
          `, [store.id, tableNum, `테이블 ${tableNum}`, seats, false]);
        }
      }
      
      console.log(`✅ 배치 ${batch + 1} 완료 (${batchSize}개 매장)`);
    }
    
    // 최종 결과 확인
    const finalResult = await pool.query('SELECT COUNT(*) as total FROM stores');
    const totalStoresInDB = parseInt(finalResult.rows[0].total);
    
    console.log(`\n🎉 전국 500개 매장 더미데이터 생성 완료!`);
    console.log(`📊 데이터베이스 총 매장 수: ${totalStoresInDB}개`);
    
    // 도시별 매장 분포 확인
    console.log('\n📍 도시별 매장 분포:');
    const cityDistribution = await pool.query(`
      SELECT 
        CASE 
          WHEN address LIKE '%서울%' THEN '서울'
          WHEN address LIKE '%부산%' THEN '부산'
          WHEN address LIKE '%대구%' THEN '대구'
          WHEN address LIKE '%인천%' THEN '인천'
          WHEN address LIKE '%광주%' THEN '광주'
          WHEN address LIKE '%대전%' THEN '대전'
          WHEN address LIKE '%울산%' THEN '울산'
          WHEN address LIKE '%수원%' THEN '수원'
          WHEN address LIKE '%성남%' THEN '성남'
          WHEN address LIKE '%고양%' THEN '고양'
          WHEN address LIKE '%용인%' THEN '용인'
          WHEN address LIKE '%창원%' THEN '창원'
          WHEN address LIKE '%천안%' THEN '천안'
          WHEN address LIKE '%전주%' THEN '전주'
          WHEN address LIKE '%안산%' THEN '안산'
          WHEN address LIKE '%안양%' THEN '안양'
          WHEN address LIKE '%포항%' THEN '포항'
          WHEN address LIKE '%의정부%' THEN '의정부'
          WHEN address LIKE '%원주%' THEN '원주'
          WHEN address LIKE '%춘천%' THEN '춘천'
          ELSE '기타'
        END as city,
        COUNT(*) as count
      FROM stores 
      WHERE id > ${currentMaxId}
      GROUP BY city
      ORDER BY count DESC
    `);
    
    cityDistribution.rows.forEach(row => {
      console.log(`  - ${row.city}: ${row.count}개`);
    });
    
    // 카테고리별 분포 확인
    console.log('\n🍽️ 카테고리별 매장 분포:');
    const categoryDistribution = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM stores 
      WHERE id > ${currentMaxId}
      GROUP BY category
      ORDER BY count DESC
    `);
    
    categoryDistribution.rows.forEach(row => {
      console.log(`  - ${row.category}: ${row.count}개`);
    });
    
  } catch (error) {
    console.error('❌ 500개 매장 생성 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
add500Stores();
