
const pool = require('../../shared/config/database');

// 카카오 REST API 키 (환경변수에서 가져오기)
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

if (!KAKAO_API_KEY) {
  console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
  console.log('💡 Secrets 도구에서 KAKAO_API_KEY를 설정해주세요.');
  process.exit(1);
}

// 주소 정규화 함수
function normalizeAddress(address) {
  if (!address || typeof address !== 'string') return null;
  
  // 1. 우편번호 제거 ([12345] 형태)
  let normalized = address.replace(/\[[0-9\-]+\]\s*/g, '');
  
  // 2. 불필요한 공백 정리
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // 3. 레거시 구명 정규화
  const legacyReplacements = {
    '서울특별시': '서울시',
    '부산광역시': '부산시',
    '대구광역시': '대구시',
    '인천광역시': '인천시',
    '광주광역시': '광주시',
    '대전광역시': '대전시',
    '울산광역시': '울산시',
    '세종특별자치시': '세종시'
  };
  
  for (const [old, new_] of Object.entries(legacyReplacements)) {
    normalized = normalized.replace(old, new_);
  }
  
  // 4. 중복 토큰 제거 (예: "서울시 서울시" -> "서울시")
  const tokens = normalized.split(' ');
  const uniqueTokens = [];
  const seen = new Set();
  
  for (const token of tokens) {
    if (!seen.has(token) && token.length > 0) {
      uniqueTokens.push(token);
      seen.add(token);
    }
  }
  
  normalized = uniqueTokens.join(' ');
  
  // 5. 표준 형식 확인 및 정리
  // "시/도 시/군/구 읍/면/동" 형태로 정규화
  const addressParts = normalized.split(' ');
  if (addressParts.length >= 3) {
    const sido = addressParts[0];
    const sigungu = addressParts[1];
    const dong = addressParts[2];
    
    // 기본 3단계 주소만 유지 (상세 주소는 별도 처리)
    const standardAddress = `${sido} ${sigungu} ${dong}`;
    
    // 나머지 부분은 상세주소로 처리
    const details = addressParts.slice(3).join(' ');
    
    if (details.length > 0) {
      return `${standardAddress} ${details}`;
    } else {
      return standardAddress;
    }
  }
  
  return normalized;
}

// 서울 지역 좌표 생성 함수 (더미데이터용)
function generateSeoulCoordinate() {
  // 서울시 중심 좌표 범위
  const minLat = 37.4300;
  const maxLat = 37.7000;
  const minLng = 126.7000;
  const maxLng = 127.2000;
  
  const lat = parseFloat((Math.random() * (maxLat - minLat) + minLat).toFixed(6));
  const lng = parseFloat((Math.random() * (maxLng - minLng) + minLng).toFixed(6));
  
  return { lat, lng };
}

// 서울 구/동 목록
const seoulDistricts = [
  { gu: '강남구', dongs: ['역삼동', '개포동', '압구정동', '청담동', '삼성동', '대치동', '신사동', '논현동', '자곡동', '율현동', '세곡동', '수서동', '일원동', '자곡동'] },
  { gu: '강동구', dongs: ['강일동', '상일동', '명일동', '고덕동', '암사동', '천호동', '성내동', '길동', '둔촌동'] },
  { gu: '강북구', dongs: ['수유동', '우이동', '인수동', '삼양동', '미아동', '번동', '송중동', '송천동'] },
  { gu: '강서구', dongs: ['염창동', '등촌동', '화곡동', '가양동', '마곡동', '내발산동', '외발산동', '공항동', '방화동', '개화동'] },
  { gu: '관악구', dongs: ['보라매동', '청림동', '청룡동', '은천동', '성현동', '중앙동', '인헌동', '남현동', '행운동', '낙성대동', '인헌동', '남현동', '신림동', '서원동'] },
  { gu: '광진구', dongs: ['중곡동', '능동', '구의동', '광장동', '자양동', '화양동'] },
  { gu: '구로구', dongs: ['신도림동', '구로동', '가리봉동', '고척동', '개봉동', '오류동', '천왕동', '항동'] },
  { gu: '금천구', dongs: ['가산동', '독산동', '시흥동'] },
  { gu: '노원구', dongs: ['월계동', '공릉동', '하계동', '중계동', '상계동'] },
  { gu: '도봉구', dongs: ['쌍문동', '방학동', '창동', '도봉동'] },
  { gu: '동대문구', dongs: ['용신동', '제기동', '전농동', '답십리동', '장안동', '청량리동', '회기동', '휘경동', '이문동'] },
  { gu: '동작구', dongs: ['노량진동', '상도동', '상도1동', '흑석동', '사당동', '대방동', '신대방동'] },
  { gu: '마포구', dongs: ['공덕동', '아현동', '도화동', '용강동', '대흥동', '염리동', '신수동', '서강동', '서교동', '합정동', '망원동', '연남동', '성산동', '상암동'] },
  { gu: '서대문구', dongs: ['충정로동', '천연동', '영천동', '서소문동', '미근동', '냉천동', '옥천동', '신촌동', '연희동', '홍제동', '홍은동', '남가좌동', '북가좌동'] },
  { gu: '서초구', dongs: ['서초동', '잠원동', '반포동', '방배동', '양재동', '내곡동'] },
  { gu: '성동구', dongs: ['왕십리동', '마장동', '사근동', '행당동', '응봉동', '금호동', '옥수동', '성수동', '송정동', '용답동'] },
  { gu: '성북구', dongs: ['성북동', '삼선동', '동선동', '돈암동', '안암동', '보문동', '정릉동', '길음동', '종암동', '석관동'] },
  { gu: '송파구', dongs: ['풍납동', '거여동', '마천동', '방이동', '오금동', '송파동', '석촌동', '삼전동', '가락동', '문정동', '장지동', '위례동', '잠실동'] },
  { gu: '양천구', dongs: ['목동', '신월동', '신정동'] },
  { gu: '영등포구', dongs: ['영등포동', '여의동', '당산동', '도림동', '문래동', '양평동', '신길동', '대림동'] },
  { gu: '용산구', dongs: ['후암동', '용산동', '남영동', '청파동', '원효로동', '효창동', '용문동', '한강로동', '이촌동', '이태원동', '한남동', '서빙고동'] },
  { gu: '은평구', dongs: ['은평동', '녹번동', '불광동', '갈현동', '구산동', '대조동', '응암동', '역촌동', '신사동', '증산동', '수색동', '진관동'] },
  { gu: '종로구', dongs: ['청운동', '효자동', '사직동', '삼청동', '부암동', '평창동', '무악동', '교남동', '가회동', '종로1가', '종로2가', '종로3가', '종로4가', '종로5가', '종로6가', '이화동', '혜화동', '명륜3가', '창신동', '숭인동'] },
  { gu: '중구', dongs: ['소공동', '회현동', '명동', '필동', '장충동', '광희동', '을지로동', '신당동', '다산동', '약수동', '청구동', '신당동', '동화동', '황학동', '중림동'] },
  { gu: '중랑구', dongs: ['면목동', '상봉동', '중화동', '묵동', '망우동', '신내동'] }
];

// 정규화된 주소로 더미 데이터 생성
function generateNormalizedStoreData(count = 500) {
  const categories = ['한식', '중식', '일식', '양식', '카페', '치킨', '분식', '피자', '버거', '디저트'];
  const storeTypes = ['맛집', '전문점', '카페', '레스토랑', '하우스', '바', '공방', '집', '관', '원'];
  
  const stores = [];
  
  for (let i = 25; i <= 24 + count; i++) {
    // 랜덤 서울 구/동 선택
    const randomDistrict = seoulDistricts[Math.floor(Math.random() * seoulDistricts.length)];
    const randomDong = randomDistrict.dongs[Math.floor(Math.random() * randomDistrict.dongs.length)];
    
    // 정규화된 주소 생성
    const normalizedAddress = `서울시 ${randomDistrict.gu} ${randomDong}`;
    
    // 좌표 생성
    const coord = generateSeoulCoordinate();
    
    // 매장명 생성
    const category = categories[Math.floor(Math.random() * categories.length)];
    const storeType = storeTypes[Math.floor(Math.random() * storeTypes.length)];
    const name = `${category} ${storeType} ${randomDong}점`;
    
    stores.push({
      id: i,
      name: name,
      category: category,
      address: normalizedAddress,
      coord: coord,
      isOpen: Math.random() > 0.2 // 80% 확률로 운영중
    });
  }
  
  return stores;
}

async function normalizeExistingAddresses() {
  try {
    console.log('🔄 기존 주소 데이터 정규화 시작...');
    
    // 기존 매장들의 주소 조회
    const result = await pool.query('SELECT id, name, address FROM stores WHERE address IS NOT NULL');
    
    console.log(`📍 ${result.rows.length}개 매장의 주소 정규화 진행`);
    
    let normalizedCount = 0;
    
    for (const store of result.rows) {
      const originalAddress = store.address;
      const normalizedAddress = normalizeAddress(originalAddress);
      
      if (normalizedAddress && normalizedAddress !== originalAddress) {
        await pool.query(
          'UPDATE stores SET address = $1 WHERE id = $2',
          [normalizedAddress, store.id]
        );
        
        console.log(`✅ 매장 ${store.id} (${store.name})`);
        console.log(`   이전: ${originalAddress}`);
        console.log(`   이후: ${normalizedAddress}`);
        
        normalizedCount++;
      } else if (normalizedAddress) {
        console.log(`ℹ️ 매장 ${store.id} (${store.name}): 이미 정규화됨`);
      } else {
        console.log(`⚠️ 매장 ${store.id} (${store.name}): 주소 정규화 실패`);
      }
    }
    
    console.log(`✅ 주소 정규화 완료: ${normalizedCount}개 매장 업데이트됨`);
    
  } catch (error) {
    console.error('❌ 주소 정규화 실패:', error);
    throw error;
  }
}

async function reinitializeDatabase() {
  try {
    console.log('🔄 데이터베이스 완전 초기화 시작...');
    
    // 1. 기존 데이터 백업 (선택사항)
    console.log('📦 기존 사용자 데이터 백업...');
    const userBackup = await pool.query('SELECT * FROM users WHERE id = $1', ['12']);
    
    // 2. 관련 테이블 데이터 삭제 (외래키 순서 고려)
    await pool.query('DELETE FROM reviews');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM store_tables');
    await pool.query('DELETE FROM carts');
    await pool.query('DELETE FROM stores WHERE id > 24'); // 기존 24개 매장 유지
    
    console.log('🗑️ 기존 더미 데이터 삭제 완료');
    
    // 3. 기존 24개 매장 주소 정규화
    await normalizeExistingAddresses();
    
    // 4. 새로운 정규화된 더미 데이터 500개 생성
    console.log('📝 정규화된 새 더미 데이터 생성 중...');
    const newStores = generateNormalizedStoreData(500);
    
    for (const store of newStores) {
      await pool.query(`
        INSERT INTO stores (id, name, category, distance, menu, coord, address, review_count, is_open)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        store.id,
        store.name,
        store.category,
        '정보없음',
        JSON.stringify([]),
        JSON.stringify(store.coord),
        store.address,
        0,
        store.isOpen
      ]);
    }
    
    console.log('✅ 새 매장 데이터 500개 삽입 완료');
    
    // 5. 각 매장에 테이블 생성
    console.log('🪑 매장별 테이블 데이터 생성 중...');
    
    for (const store of newStores) {
      const tableCount = Math.floor(Math.random() * 8) + 3; // 3-10개 테이블
      
      for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
        const seats = tableNum <= 2 ? 2 : tableNum <= 5 ? 4 : tableNum <= 7 ? 6 : 8;
        
        await pool.query(`
          INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied)
          VALUES ($1, $2, $3, $4, $5)
        `, [store.id, tableNum, `테이블 ${tableNum}`, seats, false]);
      }
    }
    
    console.log('✅ 매장별 테이블 데이터 생성 완료');
    
    // 6. 사용자 데이터 복원
    if (userBackup.rows.length > 0) {
      const user = userBackup.rows[0];
      await pool.query(`
        INSERT INTO users (id, pw, name, phone, point, order_list, coupons, favorite_stores)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          pw = EXCLUDED.pw,
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          point = EXCLUDED.point,
          order_list = EXCLUDED.order_list,
          coupons = EXCLUDED.coupons,
          favorite_stores = EXCLUDED.favorite_stores
      `, [
        user.id, user.pw, user.name, user.phone, user.point,
        user.order_list, user.coupons, user.favorite_stores
      ]);
      
      console.log('✅ 사용자 데이터 복원 완료');
    }
    
    // 7. 최종 통계
    const finalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_stores,
        COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as stores_with_address,
        COUNT(CASE WHEN is_open = true THEN 1 END) as open_stores
      FROM stores
    `);
    
    const tableStats = await pool.query('SELECT COUNT(*) as total_tables FROM store_tables');
    
    console.log('\n🎉 데이터베이스 초기화 완료!');
    console.log(`📊 최종 통계:`);
    console.log(`  - 총 매장 수: ${finalStats.rows[0].total_stores}개`);
    console.log(`  - 주소 보유 매장: ${finalStats.rows[0].stores_with_address}개`);
    console.log(`  - 운영중 매장: ${finalStats.rows[0].open_stores}개`);
    console.log(`  - 총 테이블 수: ${tableStats.rows[0].total_tables}개`);
    
    // 주소 형식 샘플 확인
    const addressSamples = await pool.query(`
      SELECT name, address 
      FROM stores 
      WHERE address IS NOT NULL 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log('\n📍 정규화된 주소 샘플:');
    addressSamples.rows.forEach(store => {
      console.log(`  - ${store.name}: ${store.address}`);
    });
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  }
}

// 스크립트 실행
console.log('🚀 데이터베이스 정규화 및 초기화 시작');
console.log('📋 작업 내용:');
console.log('  1. 기존 주소 데이터 정규화');
console.log('  2. 불일치/비정형 데이터 정리');
console.log('  3. 새로운 정규화된 더미 데이터 500개 생성');
console.log('  4. 사용자 데이터 보존');
console.log('');

reinitializeDatabase()
  .then(() => {
    console.log('✅ 모든 작업 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 작업 실패:', error);
    process.exit(1);
  });
