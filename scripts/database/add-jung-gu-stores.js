
const pool = require('../../shared/config/database');

async function addJungGuStores() {
  try {
    console.log('🏪 서울특별시 중구 더미 매장 20개 추가 시작...');
    
    // 현재 stores 테이블 최대 ID 확인
    const maxIdResult = await pool.query('SELECT MAX(id) as max_id FROM stores');
    let nextId = (maxIdResult.rows[0].max_id || 0) + 1;
    
    console.log(`📊 다음 매장 ID: ${nextId}부터 시작`);
    
    // 서울특별시 중구의 실제 좌표를 기반으로 한 매장 데이터
    const jungGuStores = [
      // 명동 일대
      { name: "명동 치킨마을", category: "치킨", lat: 37.5636, lng: 126.9834, dong: "명동" },
      { name: "을지로 피자스토리", category: "양식", lat: 37.5658, lng: 126.9910, dong: "을지로동" },
      { name: "종로 한우집", category: "한식", lat: 37.5701, lng: 126.9826, dong: "종로1가" },
      { name: "시청앞 카페베네", category: "카페", lat: 37.5664, lng: 126.9779, dong: "태평로1가" },
      { name: "남대문 짜장면", category: "중식", lat: 37.5598, lng: 126.9756, dong: "남대문로5가" },
      
      // 충무로, 동대문 일대
      { name: "충무로 족발집", category: "한식", lat: 37.5615, lng: 126.9934, dong: "충무로1가" },
      { name: "동대문 버거킹", category: "패스트푸드", lat: 37.5714, lng: 127.0098, dong: "종로5가" },
      { name: "을지로입구 스시바", category: "일식", lat: 37.5665, lng: 126.9821, dong: "을지로1가" },
      { name: "시청역 아웃백", category: "양식", lat: 37.5656, lng: 126.9769, dong: "태평로1가" },
      { name: "명동성당 파스타집", category: "양식", lat: 37.5630, lng: 126.9866, dong: "명동2가" },
      
      // 회현, 남산 일대
      { name: "회현역 김밥천국", category: "분식", lat: 37.5588, lng: 126.9785, dong: "회현동1가" },
      { name: "남산타워 갈비집", category: "한식", lat: 37.5511, lng: 126.9882, dong: "예장동" },
      { name: "소공동 떡볶이집", category: "분식", lat: 37.5641, lng: 126.9772, dong: "소공동" },
      { name: "중구청 근처 카페", category: "카페", lat: 37.5581, lng: 126.9977, dong: "서소문동" },
      { name: "정동 프랜차이즈 치킨", category: "치킨", lat: 37.5658, lng: 126.9726, dong: "정동" },
      
      // 동국대, 장충동 일대
      { name: "동국대 맛집", category: "한식", lat: 37.5581, lng: 126.9977, dong: "필동3가" },
      { name: "장충동 족발보쌈", category: "한식", lat: 37.5590, lng: 127.0046, dong: "장충동1가" },
      { name: "신당역 순대국", category: "한식", lat: 37.5668, lng: 127.0177, dong: "신당동" },
      { name: "동대입구 타코벨", category: "패스트푸드", lat: 37.5582, lng: 127.0096, dong: "신당5동" },
      { name: "약수역 감자탕", category: "한식", lat: 37.5544, lng: 127.0096, dong: "신당6동" }
    ];
    
    console.log(`📋 생성할 매장 목록: ${jungGuStores.length}개`);
    jungGuStores.forEach((store, index) => {
      console.log(`  ${index + 1}. ${store.name} (${store.category}) - ${store.dong}`);
    });
    
    let createdCount = 0;
    
    for (let i = 0; i < jungGuStores.length; i++) {
      const store = jungGuStores[i];
      const storeId = nextId + i;
      
      try {
        console.log(`🏪 매장 ${storeId} 생성 중: ${store.name}...`);
        
        // 1. stores 테이블에 매장 추가
        await pool.query(`
          INSERT INTO stores (id, name, category, menu, review_count, rating_average, is_open)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          storeId,
          store.name,
          store.category,
          JSON.stringify([]), // 빈 메뉴 배열
          Math.floor(Math.random() * 50) + 1, // 1-50개 랜덤 리뷰 수
          (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0 랜덤 평점
          Math.random() > 0.2 // 80% 확률로 운영중
        ]);
        
        // 2. store_address 테이블에 주소 정보 추가
        const fullAddress = `서울특별시 중구 ${store.dong} ${Math.floor(Math.random() * 999) + 1}`;
        
        await pool.query(`
          INSERT INTO store_address (
            store_id, address_full, sido, sigungu, eupmyeondong, 
            latitude, longitude, coord
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          storeId,
          fullAddress,
          '서울특별시',
          '중구',
          store.dong,
          store.lat,
          store.lng,
          JSON.stringify({ lat: store.lat, lng: store.lng })
        ]);
        
        console.log(`  ✅ 매장 ${storeId} (${store.name}) 생성 완료`);
        console.log(`     📍 주소: ${fullAddress}`);
        console.log(`     🗺️ 좌표: (${store.lat}, ${store.lng})`);
        
        createdCount++;
        
      } catch (storeError) {
        console.error(`❌ 매장 ${storeId} 생성 실패:`, storeError.message);
      }
    }
    
    // 생성된 매장들에 테이블 추가
    console.log('🪑 생성된 매장들에 테이블 추가 중...');
    
    for (let i = 0; i < createdCount; i++) {
      const storeId = nextId + i;
      
      try {
        // 4-8개 테이블 랜덤 생성
        const tableCount = Math.floor(Math.random() * 5) + 4;
        
        for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
          const seats = [2, 4, 6][Math.floor(Math.random() * 3)];
          const tableName = `테이블 ${tableNum}`;
          const uniqueId = `store_${storeId}_table_${tableNum}`;
          
          await pool.query(`
            INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied, unique_id)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [storeId, tableNum, tableName, seats, false, uniqueId]);
        }
        
        console.log(`  🪑 매장 ${storeId}에 ${tableCount}개 테이블 추가 완료`);
        
      } catch (tableError) {
        console.error(`❌ 매장 ${storeId} 테이블 생성 실패:`, tableError.message);
      }
    }
    
    // 최종 결과 확인
    const finalResult = await pool.query(`
      SELECT 
        s.id, s.name, s.category, s.is_open, s.rating_average, s.review_count,
        sa.address_full, sa.latitude, sa.longitude,
        COUNT(st.id) as table_count
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      LEFT JOIN store_tables st ON s.id = st.store_id
      WHERE s.id >= $1 AND s.id < $2
        AND sa.sido = '서울특별시' 
        AND sa.sigungu = '중구'
      GROUP BY s.id, s.name, s.category, s.is_open, s.rating_average, s.review_count,
               sa.address_full, sa.latitude, sa.longitude
      ORDER BY s.id
    `, [nextId, nextId + jungGuStores.length]);
    
    console.log(`\n🎉 서울특별시 중구 더미 매장 추가 완료!`);
    console.log(`📊 최종 결과:`);
    console.log(`  - 생성된 매장 수: ${createdCount}개`);
    console.log(`  - 검증된 매장 수: ${finalResult.rows.length}개`);
    
    console.log(`\n📋 생성된 매장 목록:`);
    finalResult.rows.forEach((store, index) => {
      console.log(`  ${index + 1}. ${store.name} (ID: ${store.id})`);
      console.log(`     📍 주소: ${store.address_full}`);
      console.log(`     🗺️ 좌표: (${store.latitude}, ${store.longitude})`);
      console.log(`     ⭐ 평점: ${store.rating_average} (${store.review_count}개 리뷰)`);
      console.log(`     🪑 테이블: ${store.table_count}개`);
      console.log(`     🏪 운영상태: ${store.is_open ? '운영중' : '운영중지'}\n`);
    });
    
    // 중구 전체 매장 수 확인
    const jungGuTotal = await pool.query(`
      SELECT COUNT(*) as total 
      FROM stores s
      JOIN store_address sa ON s.id = sa.store_id
      WHERE sa.sido = '서울특별시' AND sa.sigungu = '중구'
    `);
    
    console.log(`📊 서울특별시 중구 전체 매장 수: ${jungGuTotal.rows[0].total}개`);
    
  } catch (error) {
    console.error('❌ 서울특별시 중구 더미 매장 추가 실패:', error);
    console.error('❌ 에러 세부사항:', error.message);
    console.error('❌ 에러 스택:', error.stack);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
addJungGuStores();
