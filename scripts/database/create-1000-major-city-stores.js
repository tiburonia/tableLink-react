
const pool = require('../../shared/config/database');

// 카카오 REST API 키
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

if (!KAKAO_API_KEY) {
  console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
  console.log('💡 Secrets 도구에서 KAKAO_API_KEY를 설정해주세요.');
  process.exit(1);
}

// 전국 주요 대도시 좌표 (17개 광역시/도의 주요 도시들)
const MAJOR_CITIES = [
  // 서울특별시
  { name: '서울특별시 강남구', lat: [37.495, 37.525], lng: [127.02, 127.08], weight: 15 },
  { name: '서울특별시 강서구', lat: [37.540, 37.570], lng: [126.82, 126.88], weight: 10 },
  { name: '서울특별시 종로구', lat: [37.570, 37.600], lng: [126.97, 127.01], weight: 12 },
  { name: '서울특별시 마포구', lat: [37.540, 37.570], lng: [126.90, 126.95], weight: 12 },
  
  // 부산광역시
  { name: '부산광역시 해운대구', lat: [35.155, 35.185], lng: [129.16, 129.20], weight: 12 },
  { name: '부산광역시 부산진구', lat: [35.155, 35.175], lng: [129.04, 129.08], weight: 10 },
  { name: '부산광역시 서면', lat: [35.155, 35.165], lng: [129.05, 129.06], weight: 8 },
  
  // 대구광역시
  { name: '대구광역시 중구', lat: [35.865, 35.875], lng: [128.59, 128.61], weight: 8 },
  { name: '대구광역시 수성구', lat: [35.855, 35.875], lng: [128.63, 128.65], weight: 10 },
  
  // 인천광역시
  { name: '인천광역시 남동구', lat: [37.440, 37.470], lng: [126.72, 126.76], weight: 10 },
  { name: '인천광역시 연수구', lat: [37.405, 37.425], lng: [126.67, 126.70], weight: 8 },
  
  // 광주광역시
  { name: '광주광역시 서구', lat: [35.145, 35.165], lng: [126.88, 126.92], weight: 8 },
  { name: '광주광역시 북구', lat: [35.165, 35.185], lng: [126.90, 126.94], weight: 7 },
  
  // 대전광역시
  { name: '대전광역시 유성구', lat: [36.355, 36.375], lng: [127.34, 127.37], weight: 8 },
  { name: '대전광역시 서구', lat: [36.350, 36.370], lng: [127.37, 127.40], weight: 7 },
  
  // 울산광역시
  { name: '울산광역시 남구', lat: [35.535, 35.555], lng: [129.31, 129.33], weight: 6 },
  
  // 세종특별자치시
  { name: '세종특별자치시', lat: [36.480, 36.500], lng: [127.25, 127.29], weight: 5 },
  
  // 경기도 주요 도시
  { name: '경기도 수원시', lat: [37.265, 37.285], lng: [127.00, 127.04], weight: 12 },
  { name: '경기도 성남시', lat: [37.435, 37.455], lng: [127.13, 127.17], weight: 10 },
  { name: '경기도 고양시', lat: [37.655, 37.675], lng: [126.83, 126.87], weight: 10 },
  { name: '경기도 용인시', lat: [37.235, 37.255], lng: [127.17, 127.21], weight: 8 },
  { name: '경기도 부천시', lat: [37.500, 37.520], lng: [126.76, 126.80], weight: 8 },
  { name: '경기도 안산시', lat: [37.315, 37.335], lng: [126.82, 126.86], weight: 7 },
  { name: '경기도 안양시', lat: [37.390, 37.410], lng: [126.91, 126.95], weight: 7 },
  
  // 강원도
  { name: '강원도 춘천시', lat: [37.875, 37.895], lng: [127.72, 127.74], weight: 6 },
  { name: '강원도 원주시', lat: [37.335, 37.355], lng: [127.91, 127.95], weight: 5 },
  { name: '강원도 강릉시', lat: [37.745, 37.765], lng: [128.87, 128.89], weight: 5 },
  
  // 충청북도
  { name: '충청북도 청주시', lat: [36.635, 36.655], lng: [127.48, 127.52], weight: 8 },
  { name: '충청북도 충주시', lat: [36.985, 37.005], lng: [127.92, 127.94], weight: 4 },
  
  // 충청남도
  { name: '충청남도 천안시', lat: [36.810, 36.830], lng: [127.11, 127.15], weight: 8 },
  { name: '충청남도 아산시', lat: [36.785, 36.805], lng: [127.00, 127.04], weight: 6 },
  
  // 전라북도
  { name: '전라북도 전주시', lat: [35.815, 35.835], lng: [127.14, 127.16], weight: 8 },
  { name: '전라북도 익산시', lat: [35.940, 35.960], lng: [126.95, 126.99], weight: 5 },
  
  // 전라남도
  { name: '전라남도 목포시', lat: [34.805, 34.825], lng: [126.38, 126.42], weight: 5 },
  { name: '전라남도 여수시', lat: [34.735, 34.755], lng: [127.73, 127.77], weight: 6 },
  
  // 경상북도
  { name: '경상북도 포항시', lat: [36.015, 36.035], lng: [129.34, 129.36], weight: 6 },
  { name: '경상북도 경주시', lat: [35.845, 35.865], lng: [129.22, 129.24], weight: 5 },
  
  // 경상남도
  { name: '경상남도 창원시', lat: [35.225, 35.245], lng: [128.68, 128.72], weight: 8 },
  { name: '경상남도 김해시', lat: [35.225, 35.245], lng: [128.87, 128.91], weight: 6 },
  { name: '경상남도 진주시', lat: [35.175, 35.195], lng: [128.08, 128.12], weight: 5 },
  
  // 제주특별자치도
  { name: '제주특별자치도 제주시', lat: [33.495, 33.515], lng: [126.52, 126.54], weight: 8 },
  { name: '제주특별자치도 서귀포시', lat: [33.250, 33.270], lng: [126.55, 126.57], weight: 5 }
];

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

// API 호출 딜레이
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 지역별 랜덤 좌표 생성
function getRandomCoordinateInCity(city) {
  const lat = Math.random() * (city.lat[1] - city.lat[0]) + city.lat[0];
  const lng = Math.random() * (city.lng[1] - city.lng[0]) + city.lng[0];
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

// 랜덤 매장명 생성
function generateStoreName(category, cityName) {
  const templates = STORE_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const prefixes = ['맛있는', '유명한', '전통', '신선한', '특별한', '프리미엄', '고급', '정통', '본격', '진짜'];
  const cityBasedSuffixes = [
    '본점', '1호점', '역점', '중앙점', '시장점', '대로점', '광장점', '터미널점'
  ];

  const usePrefix = Math.random() > 0.6;
  const useSuffix = Math.random() > 0.4;

  let name = template;
  if (usePrefix) {
    name = prefixes[Math.floor(Math.random() * prefixes.length)] + ' ' + name;
  }
  if (useSuffix) {
    name = name + ' ' + cityBasedSuffixes[Math.floor(Math.random() * cityBasedSuffixes.length)];
  }

  return name;
}

// 카카오 좌표 → 행정구역 정보
async function getRegionCodeFromCoordinates(lat, lng) {
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}&input_coord=WGS84`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.log(`❌ coord2regioncode API 호출 실패: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      // B 타입 (법정동) 우선
      const bCode = data.documents.find(doc => doc.region_type === 'B');
      const hCode = data.documents.find(doc => doc.region_type === 'H');
      
      const regionData = bCode || hCode;
      
      if (regionData) {
        return {
          sido: regionData.region_1depth_name,
          sigungu: regionData.region_2depth_name,
          eupmyeondong: regionData.region_3depth_name,
          region_type: regionData.region_type
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('coord2regioncode API 호출 중 오류:', error);
    return null;
  }
}

// 카카오 좌표 → 주소 변환
async function getAddressFromCoordinates(lat, lng) {
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}&input_coord=WGS84`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.log(`❌ coord2address API 호출 실패: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      
      // 도로명 주소 우선
      if (doc.road_address) {
        return {
          address: doc.road_address.address_name,
          buildingName: doc.road_address.building_name || null
        };
      } else if (doc.address) {
        return {
          address: doc.address.address_name,
          buildingName: null
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('coord2address API 호출 중 오류:', error);
    return null;
  }
}

async function create1000MajorCityStores() {
  try {
    console.log('🏙️ 전국 주요 대도시 1000개 매장 더미데이터 생성 시작...');

    // 현재 최대 매장 ID 조회
    const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM stores');
    let currentMaxId = parseInt(maxIdResult.rows[0].max_id);

    console.log(`📊 현재 최대 매장 ID: ${currentMaxId}`);

    // 가중치에 따른 매장 분배 계산
    const totalWeight = MAJOR_CITIES.reduce((sum, city) => sum + city.weight, 0);
    const storesPerCity = MAJOR_CITIES.map(city => ({
      ...city,
      storeCount: Math.round((city.weight / totalWeight) * 1000)
    }));

    // 실제 총합이 1000이 되도록 조정
    let actualTotal = storesPerCity.reduce((sum, city) => sum + city.storeCount, 0);
    const diff = 1000 - actualTotal;
    if (diff !== 0) {
      // 가장 큰 도시에서 조정
      const largestCity = storesPerCity.reduce((max, city) => 
        city.storeCount > max.storeCount ? city : max
      );
      largestCity.storeCount += diff;
    }

    console.log('\n🗺️ 도시별 매장 분배:');
    storesPerCity.forEach(city => {
      console.log(`   📍 ${city.name}: ${city.storeCount}개`);
    });

    const categories = Object.keys(STORE_TEMPLATES);
    let totalCreated = 0;
    let successCount = 0;
    let failCount = 0;

    for (const city of storesPerCity) {
      if (city.storeCount === 0) continue;

      console.log(`\n🏙️ ${city.name} - ${city.storeCount}개 매장 생성 시작`);

      for (let i = 0; i < city.storeCount; i++) {
        try {
          const category = categories[Math.floor(Math.random() * categories.length)];
          const coord = getRandomCoordinateInCity(city);
          const storeName = generateStoreName(category, city.name);
          const isOpen = Math.random() > 0.1; // 90% 확률로 운영중
          const ratingAverage = (Math.random() * 4 + 1).toFixed(1); // 1.0-5.0 사이 평점
          const reviewCount = Math.floor(Math.random() * 100); // 0-99개 리뷰

          console.log(`🏪 [${i + 1}/${city.storeCount}] ${storeName} (${coord.lat}, ${coord.lng}) 생성 중...`);

          // 1. stores 테이블에 매장 정보 삽입
          const storeInsertResult = await pool.query(`
            INSERT INTO stores (name, category, distance, menu, review_count, rating_average, is_open)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `, [
            storeName,
            category,
            '정보없음',
            JSON.stringify([]),
            reviewCount,
            ratingAverage,
            isOpen
          ]);

          const storeId = storeInsertResult.rows[0].id;

          // API 호출 딜레이 (카카오 API 제한 고려)
          await delay(100);

          // 2. 카카오 API로 행정구역 정보 조회
          const regionData = await getRegionCodeFromCoordinates(coord.lat, coord.lng);
          await delay(50);

          // 3. 카카오 API로 주소 정보 조회
          const addressData = await getAddressFromCoordinates(coord.lat, coord.lng);
          await delay(50);

          // 4. store_address 테이블에 주소 정보 삽입
          await pool.query(`
            INSERT INTO store_address (
              store_id, latitude, longitude, address_full, 
              sido, sigungu, eupmyeondong, address_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            storeId,
            coord.lat,
            coord.lng,
            addressData ? addressData.address : `GPS 위치 (${coord.lat}, ${coord.lng})`,
            regionData ? regionData.sido : '정보없음',
            regionData ? regionData.sigungu : '정보없음',
            regionData ? regionData.eupmyeondong : '정보없음',
            (regionData && addressData) ? 'success' : 'partial'
          ]);

          successCount++;
          totalCreated++;

          if (regionData && addressData) {
            console.log(`   ✅ ${storeName} - ${addressData.address} (${regionData.sido} ${regionData.sigungu} ${regionData.eupmyeondong})`);
          } else {
            console.log(`   ⚠️ ${storeName} - API 응답 불완전 (GPS: ${coord.lat}, ${coord.lng})`);
          }

        } catch (error) {
          console.error(`   ❌ 매장 생성 실패:`, error.message);
          failCount++;
        }
      }

      // 도시별 완료 후 잠시 대기
      console.log(`✅ ${city.name} 완료 - 성공: ${city.storeCount}개`);
      await delay(200);
    }

    // 최종 결과 확인
    const finalCountResult = await pool.query('SELECT COUNT(*) as total FROM stores');
    const totalStoresInDB = parseInt(finalCountResult.rows[0].total);

    console.log(`\n🎉 전국 주요 대도시 1000개 매장 더미데이터 생성 완료!`);
    console.log(`📊 생성된 매장 수: ${totalCreated}개`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`📊 데이터베이스 총 매장 수: ${totalStoresInDB}개`);

    // 카테고리별 분포 확인
    console.log('\n🍽️ 카테고리별 매장 분포 (전체):');
    const categoryDistribution = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM stores
      GROUP BY category
      ORDER BY count DESC
    `);

    categoryDistribution.rows.forEach(row => {
      console.log(`  - ${row.category}: ${row.count}개`);
    });

    // 지역별 분포 확인 (상위 10개 지역)
    console.log('\n🗺️ 지역별 매장 분포 (상위 10개):');
    const regionDistribution = await pool.query(`
      SELECT 
        CONCAT(sido, ' ', sigungu) as region,
        COUNT(*) as count
      FROM store_address
      WHERE sido IS NOT NULL AND sigungu IS NOT NULL
      GROUP BY sido, sigungu
      ORDER BY count DESC
      LIMIT 10
    `);

    regionDistribution.rows.forEach(row => {
      console.log(`  - ${row.region}: ${row.count}개`);
    });

    // 주소 상태별 통계
    console.log('\n📍 주소 상태별 통계:');
    const addressStatusStats = await pool.query(`
      SELECT 
        address_status,
        COUNT(*) as count
      FROM store_address
      GROUP BY address_status
      ORDER BY count DESC
    `);

    addressStatusStats.rows.forEach(row => {
      console.log(`  - ${row.address_status}: ${row.count}개`);
    });

  } catch (error) {
    console.error('❌ 1000개 매장 생성 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
create1000MajorCityStores();
