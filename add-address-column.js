
const pool = require('./database');

// 카카오 REST API 키 (서버사이드용)
const KAKAO_API_KEY = 'f3266dc51f8b4635c03d58b09a6fdecc';

async function addAddressColumn() {
  try {
    console.log('📍 stores 테이블에 address 컬럼 추가 중...');
    
    // address 컬럼 추가 (이미 존재하면 무시)
    await pool.query(`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS address TEXT
    `);
    
    console.log('✅ address 컬럼 추가 완료');
    
    // 모든 매장의 좌표 조회
    const result = await pool.query('SELECT id, name, coord FROM stores WHERE coord IS NOT NULL');
    console.log(`🏪 ${result.rows.length}개 매장의 좌표 정보 조회 완료`);
    
    for (const store of result.rows) {
      try {
        const coord = store.coord;
        if (!coord || !coord.lat || !coord.lng) {
          console.log(`⚠️ 매장 ${store.id} (${store.name}): 좌표 정보가 불완전함`);
          continue;
        }
        
        console.log(`🔍 매장 ${store.id} (${store.name}) 주소 조회 중... (${coord.lat}, ${coord.lng})`);
        
        // 카카오 Geocoding API 호출 (좌표 → 주소)
        const response = await fetch(
          `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${coord.lng}&y=${coord.lat}`,
          {
            headers: {
              'Authorization': `KakaoAK ${KAKAO_API_KEY}`
            }
          }
        );
        
        if (!response.ok) {
          console.log(`❌ 매장 ${store.id} API 호출 실패: ${response.status}`);
          
          // API 실패 시 좌표 기반 임시 주소 생성
          const tempAddress = `서울특별시 중구 (위도: ${coord.lat.toFixed(4)}, 경도: ${coord.lng.toFixed(4)})`;
          
          await pool.query(
            'UPDATE stores SET address = $1 WHERE id = $2',
            [tempAddress, store.id]
          );
          console.log(`⚠️ 매장 ${store.id} (${store.name}) 임시 주소 설정: ${tempAddress}`);
          
          await new Promise(resolve => setTimeout(resolve, 100)); // API 제한 방지
          continue;
        }
        
        const data = await response.json();
        
        let address = null;
        
        // 도로명 주소 우선, 없으면 지번 주소 사용
        if (data.documents && data.documents.length > 0) {
          const doc = data.documents[0];
          
          if (doc.road_address && doc.road_address.address_name) {
            address = doc.road_address.address_name;
            console.log(`📍 매장 ${store.id} 도로명 주소: ${address}`);
          } else if (doc.address && doc.address.address_name) {
            address = doc.address.address_name;
            console.log(`📍 매장 ${store.id} 지번 주소: ${address}`);
          }
        }
        
        if (address) {
          // 데이터베이스에 주소 업데이트
          await pool.query(
            'UPDATE stores SET address = $1 WHERE id = $2',
            [address, store.id]
          );
          console.log(`✅ 매장 ${store.id} (${store.name}) 주소 업데이트 완료: ${address}`);
        } else {
          console.log(`⚠️ 매장 ${store.id} (${store.name}): 주소를 찾을 수 없음`);
        }
        
        // API 호출 제한 방지를 위한 딜레이 (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ 매장 ${store.id} (${store.name}) 주소 조회 실패:`, error.message);
        continue;
      }
    }
    
    console.log('🎉 모든 매장의 주소 업데이트 완료!');
    
    // 결과 확인
    const finalResult = await pool.query(
      'SELECT id, name, address FROM stores WHERE address IS NOT NULL ORDER BY id'
    );
    
    console.log(`\n📊 주소가 설정된 매장: ${finalResult.rows.length}개`);
    finalResult.rows.forEach(store => {
      console.log(`  - 매장 ${store.id}: ${store.name} → ${store.address}`);
    });
    
  } catch (error) {
    console.error('❌ 주소 컬럼 추가 및 업데이트 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
addAddressColumn();
