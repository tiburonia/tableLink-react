const pool = require('../../shared/config/database');

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

// 전국 주요 좌표 범위 (더 넓은 범위)
const KOREA_COORDINATES = {
  lat: [33.1, 38.6], // 제주도부터 북한 경계까지
  lng: [124.6, 131.9] // 서해안부터 동해안까지
};

// 랜덤 좌표 생성 함수
function getRandomCoordinate() {
  const lat = Math.random() * (KOREA_COORDINATES.lat[1] - KOREA_COORDINATES.lat[0]) + KOREA_COORDINATES.lat[0];
  const lng = Math.random() * (KOREA_COORDINATES.lng[1] - KOREA_COORDINATES.lng[0]) + KOREA_COORDINATES.lng[0];
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

// 랜덤 매장명 생성 함수
function generateStoreName(category) {
  const templates = STORE_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const prefixes = ['맛있는', '유명한', '전통', '신선한', '특별한', '프리미엄', '고급', '정통', '본격', '진짜'];
  const suffixes = ['본점', '1호점', '강남점', '역삼점', '명동점', '홍대점', '신촌점', '분점'];

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

async function create2000Stores() {
  try {
    console.log('🏪 2000개 매장 더미데이터 생성 시작...');

    // 현재 최대 매장 ID 조회
    const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM stores');
    let currentMaxId = parseInt(maxIdResult.rows[0].max_id);

    console.log(`📊 현재 최대 매장 ID: ${currentMaxId}`);
    
    // 시퀀스 값을 현재 최대 ID + 1로 설정
    await pool.query(`SELECT setval('stores_id_seq', $1, false)`, [currentMaxId + 1]);
    console.log(`🔄 시퀀스를 ${currentMaxId + 1}로 재설정 완료`);

    const categories = Object.keys(STORE_TEMPLATES);
    const storesPerBatch = 100; // 배치 단위
    const totalStores = 2000;

    for (let batch = 0; batch < Math.ceil(totalStores / storesPerBatch); batch++) {
      const batchStart = batch * storesPerBatch;
      const batchEnd = Math.min((batch + 1) * storesPerBatch, totalStores);
      const batchSize = batchEnd - batchStart;

      console.log(`\n📦 배치 ${batch + 1}/${Math.ceil(totalStores / storesPerBatch)} 처리 중... (${batchStart + 1}-${batchEnd}번째 매장)`);

      const storeData = [];

      // 배치별 매장 데이터 생성
      for (let i = 0; i < batchSize; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const coord = getRandomCoordinate();
        const storeName = generateStoreName(category);
        const isOpen = Math.random() > 0.1; // 90% 확률로 운영중
        const ratingAverage = (Math.random() * 4 + 1).toFixed(1); // 1.0-5.0 사이 평점
        const reviewCount = Math.floor(Math.random() * 100); // 0-99개 리뷰

        console.log(`🏪 매장 생성 예정: ${storeName} (${category}) - ${coord.lat}, ${coord.lng}`);

        storeData.push([
          storeName,           // name
          category,            // category
          '정보없음',          // distance
          JSON.stringify([]),  // menu
          JSON.stringify(coord), // coord
          reviewCount,         // review_count
          ratingAverage,       // rating_average
          isOpen,              // is_open
          null,                // address (null로 설정)
          'unknown',           // address_status (기본값)
          null,                // sido (null로 설정)
          null                 // sigungu (null로 설정)
        ]);
      }

      // 배치 단위로 데이터베이스에 삽입
      console.log(`💾 배치 ${batch + 1} 데이터베이스 삽입 중...`);

      try {
        // PostgreSQL용 VALUES 절 생성
        const valuesClauses = [];
        const allParams = [];
        let paramIndex = 1;

        for (const store of storeData) {
          const placeholders = [];
          for (let i = 0; i < store.length; i++) {
            placeholders.push(`$${paramIndex++}`);
            allParams.push(store[i]);
          }
          valuesClauses.push(`(${placeholders.join(', ')})`);
        }

        const insertQuery = `
          INSERT INTO stores (name, category, distance, menu, coord, review_count, rating_average, is_open, address, address_status, sido, sigungu)
          VALUES ${valuesClauses.join(', ')}
          RETURNING id
        `;

        await pool.query(insertQuery, allParams);
        console.log(`✅ 배치 ${batch + 1} 완료 (${batchSize}개 매장)`);

        // 배치 삽입 후 즉시 확인
        const batchCheckResult = await pool.query('SELECT COUNT(*) as count FROM stores');
        console.log(`📊 현재 데이터베이스 매장 수: ${batchCheckResult.rows[0].count}개`);
      } catch (insertError) {
        console.error(`❌ 배치 ${batch + 1} 삽입 오류:`, insertError);
        // 오류 발생 시에도 다음 배치를 계속 진행하거나, 여기서 중단할 수 있습니다.
        // 현재는 오류 로그만 남기고 계속 진행합니다.
      }
    }

    // 최종 결과 확인
    const finalCountResult = await pool.query('SELECT COUNT(*) as total FROM stores');
    const totalStoresInDB = parseInt(finalCountResult.rows[0].total);

    console.log(`\n🎉 2000개 매장 더미데이터 생성 완료!`);
    console.log(`📊 데이터베이스 총 매장 수: ${totalStoresInDB}개`);

    // 카테고리별 분포 확인 (새로 추가된 매장만)
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

    // null 필드 확인 (전체 매장)
    console.log('\n📍 null 필드 확인:');
    const nullFieldsCheck = await pool.query(`
      SELECT
        COUNT(CASE WHEN address IS NULL THEN 1 END) as null_address,
        COUNT(CASE WHEN address_status IS NULL THEN 1 END) as null_address_status,
        COUNT(CASE WHEN sido IS NULL THEN 1 END) as null_sido,
        COUNT(CASE WHEN sigungu IS NULL THEN 1 END) as null_sigungu
      FROM stores
    `);

    const nullStats = nullFieldsCheck.rows[0];
    console.log(`  - address null: ${nullStats.null_address}개`);
    console.log(`  - address_status null: ${nullStats.null_address_status}개`);
    console.log(`  - sido null: ${nullStats.null_sido}개`);
    console.log(`  - sigungu null: ${nullStats.null_sigungu}개`);

  } catch (error) {
    console.error('❌ 2000개 매장 생성 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
create2000Stores();