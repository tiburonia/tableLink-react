
const pool = require('../../shared/config/database');

// 카카오 REST API 키
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

if (!KAKAO_API_KEY) {
  console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
  console.log('💡 Secrets 도구에서 KAKAO_API_KEY를 설정해주세요.');
  process.exit(1);
}

// 서울 주요 지역별 좌표 범위
const SEOUL_AREAS = {
  강남구: { lat: [37.4955, 37.5148], lng: [127.0470, 127.0947] },
  서초구: { lat: [37.4733, 37.5158], lng: [126.9817, 127.0507] },
  송파구: { lat: [37.4954, 37.5321], lng: [127.0589, 127.1463] },
  강동구: { lat: [37.5184, 37.5668], lng: [127.1096, 127.1561] },
  마포구: { lat: [37.5398, 37.5768], lng: [126.8895, 126.9567] },
  용산구: { lat: [37.5209, 37.5509], lng: [126.9632, 127.0109] },
  성동구: { lat: [37.5407, 37.5634], lng: [127.0268, 127.0567] },
  광진구: { lat: [37.5317, 37.5559], lng: [127.0622, 127.1048] },
  동대문구: { lat: [37.5636, 37.5895], lng: [127.0220, 127.0680] },
  중랑구: { lat: [37.5851, 37.6207], lng: [127.0729, 127.1107] },
  성북구: { lat: [37.5736, 37.6133], lng: [126.9893, 127.0356] },
  강북구: { lat: [37.6256, 37.6469], lng: [127.0007, 127.0357] },
  도봉구: { lat: [37.6528, 37.6783], lng: [127.0267, 127.0609] },
  노원구: { lat: [37.6470, 37.6669], lng: [127.0456, 127.0795] },
  은평구: { lat: [37.5886, 37.6359], lng: [126.9058, 126.9609] },
  서대문구: { lat: [37.5644, 37.5909], lng: [126.9156, 126.9609] },
  종로구: { lat: [37.5630, 37.6002], lng: [126.9614, 127.0109] },
  중구: { lat: [37.5570, 37.5734], lng: [126.9779, 127.0167] },
  영등포구: { lat: [37.5144, 37.5345], lng: [126.8958, 126.9367] },
  동작구: { lat: [37.4970, 37.5188], lng: [126.9268, 126.9709] },
  관악구: { lat: [37.4658, 37.4939], lng: [126.9267, 126.9809] },
  서초구2: { lat: [37.4733, 37.5158], lng: [126.9817, 127.0507] },
  강서구: { lat: [37.5324, 37.5734], lng: [126.8095, 126.8895] },
  양천구: { lat: [37.5067, 37.5367], lng: [126.8445, 126.8895] },
  구로구: { lat: [37.4845, 37.5145], lng: [126.8367, 126.9067] }
};

// 매장 카테고리별 이름 템플릿
const STORE_TEMPLATES = {
  한식: [
    '한식당', '밥집', '국밥집', '정식집', '갈비집', '삼겹살집', '불고기집', '비빔밥집',
    '김치찌개집', '된장찌개집', '순두부찌개집', '부대찌개집', '제육볶음집', '돈까스집'
  ],
  중식: [
    '중국집', '짜장면집', '짬뽕집', '탕수육집', '마라탕집', '마라샹궈집', '딤섬집',
    '볶음밥집', '울면집', '양장피집', '깐풍기집', '팔보채집'
  ],
  일식: [
    '일식당', '초밥집', '라멘집', '우동집', '돈카츠집', '규동집', '사시미집', '회집',
    '야키토리집', '오코노미야키집', '타코야키집', '카츠동집'
  ],
  양식: [
    '양식당', '스테이크하우스', '파스타집', '피자집', '햄버거집', '샐러드집', '브런치카페',
    '이탈리안레스토랑', '프렌치레스토랑', '그릴하우스'
  ],
  카페: [
    '카페', '커피숍', '디저트카페', '베이커리카페', '브런치카페', '로스터리카페',
    '스페셜티카페', '테마카페', '디저트전문점'
  ],
  치킨: [
    '치킨집', '후라이드치킨집', '양념치킨집', '간장치킨집', '치킨호프', '닭강정집',
    '순살치킨집', '뿌링클치킨집'
  ],
  분식: [
    '분식집', '떡볶이집', '김밥집', '순대집', '어묵집', '튀김집', '만두집',
    '라면집', '쫄면집', '냉면집'
  ]
};

// 지역별 랜덤 좌표 생성
function getRandomCoordinateInArea(areaName) {
  const area = SEOUL_AREAS[areaName];
  if (!area) return { lat: 37.5665, lng: 126.9780 }; // 기본값 (서울시청)
  
  const lat = Math.random() * (area.lat[1] - area.lat[0]) + area.lat[0];
  const lng = Math.random() * (area.lng[1] - area.lng[0]) + area.lng[0];
  
  return {
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6))
  };
}

// 랜덤 매장명 생성
function generateStoreName(category, areaName) {
  const templates = STORE_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const prefixes = ['맛있는', '유명한', '전통', '신선한', '특별한', '고급', '정통'];
  const suffixes = ['본점', '1호점', `${areaName}점`, '역삼점', '강남점', '홍대점'];
  
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

async function addSeoul100Stores() {
  try {
    console.log('🏢 서울에 100개 매장 더미데이터 생성 시작...');

    // 현재 최대 매장 ID 조회
    const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM stores');
    let currentMaxId = parseInt(maxIdResult.rows[0].max_id);

    console.log(`📊 현재 최대 매장 ID: ${currentMaxId}`);

    const categories = Object.keys(STORE_TEMPLATES);
    const areas = Object.keys(SEOUL_AREAS);
    const storeCount = 100;

    console.log(`🎯 서울 ${areas.length}개 구에 ${storeCount}개 매장 생성 시작\n`);

    for (let i = 0; i < storeCount; i++) {
      const storeIndex = i + 1;
      const areaName = areas[Math.floor(Math.random() * areas.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const coord = getRandomCoordinateInArea(areaName);
      const storeName = generateStoreName(category, areaName);
      const isOpen = Math.random() > 0.1; // 90% 확률로 운영중

      const newStoreId = currentMaxId + storeIndex;

      console.log(`🏪 [${storeIndex}/${storeCount}] 매장 ${newStoreId}: ${storeName}`);
      console.log(`📍 지역: ${areaName}, 카테고리: ${category}`);
      console.log(`📍 좌표: ${coord.lat}, ${coord.lng}`);

      // 주소 조회
      const addressInfo = await getAddressFromCoordinates(coord.lat, coord.lng);
      console.log(`📍 주소: ${addressInfo.fullAddress}\n`);

      // stores 테이블에 매장 추가
      await pool.query(`
        INSERT INTO stores (id, name, category, menu, review_count, rating_average, is_open)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        newStoreId,
        storeName,
        category,
        JSON.stringify([]),
        Math.floor(Math.random() * 50), // 0-50개 리뷰
        (3.5 + Math.random() * 1.5).toFixed(1), // 3.5-5.0 평점
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

      // 각 매장에 테이블 2-6개 추가
      const tableCount = Math.floor(Math.random() * 5) + 2; // 2-6개
      for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
        const seats = [2, 4, 6, 8][Math.floor(Math.random() * 4)];
        await pool.query(`
          INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied)
          VALUES ($1, $2, $3, $4, $5)
        `, [newStoreId, tableNum, `테이블 ${tableNum}`, seats, false]);
      }

      // API 제한 방지 (150ms 딜레이)
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // 최종 결과 확인
    const finalResult = await pool.query('SELECT COUNT(*) as total FROM stores');
    const totalStoresInDB = parseInt(finalResult.rows[0].total);

    console.log(`\n🎉 서울에 100개 매장 더미데이터 생성 완료!`);
    console.log(`📊 데이터베이스 총 매장 수: ${totalStoresInDB}개`);

    // 구별 분포 확인
    console.log('\n📍 서울 구별 매장 분포:');
    const areaDistribution = await pool.query(`
      SELECT 
        sigungu,
        COUNT(*) as count
      FROM store_address sa
      JOIN stores s ON sa.store_id = s.id
      WHERE s.id > $1 AND sa.sido = '서울특별시'
      GROUP BY sigungu
      ORDER BY count DESC
    `, [currentMaxId]);

    areaDistribution.rows.forEach(row => {
      console.log(`  - ${row.sigungu}: ${row.count}개`);
    });

    // 카테고리별 분포 확인
    console.log('\n🍽️ 카테고리별 매장 분포:');
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
    console.error('❌ 서울 100개 매장 생성 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
addSeoul100Stores();
