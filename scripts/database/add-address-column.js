
const pool = require('./database');

// 카카오 REST API 키 (환경변수에서 가져오기)
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

if (!KAKAO_API_KEY) {
  console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
  console.log('💡 Secrets 도구에서 KAKAO_API_KEY를 설정해주세요.');
  process.exit(1);
}

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
          
          // API 실패 시 좌표 기반 상세 임시 주소 생성
          const tempAddress = `[API실패] 서울특별시 중구 추정위치 (GPS: ${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}) - ${store.name} 매장`;
          
          await pool.query(
            'UPDATE stores SET address = $1 WHERE id = $2',
            [tempAddress, store.id]
          );
          console.log(`⚠️ 매장 ${store.id} (${store.name}) 상세 임시 주소 설정: ${tempAddress}`);
          
          await new Promise(resolve => setTimeout(resolve, 100)); // API 제한 방지
          continue;
        }
        
        const data = await response.json();
        
        let address = null;
        
        // 도로명 주소와 세부 정보를 조합하여 완전한 주소 생성
        if (data.documents && data.documents.length > 0) {
          const doc = data.documents[0];
          
          if (doc.road_address) {
            const roadAddr = doc.road_address;
            
            // 도로명 주소 조합: 시/도 + 시/군/구 + 도로명 + 건물번호 + 세부정보
            let fullAddress = '';
            
            // 기본 도로명 주소
            if (roadAddr.address_name) {
              fullAddress = roadAddr.address_name;
            }
            
            // 건물명이 있으면 추가
            if (roadAddr.building_name) {
              fullAddress += ` (${roadAddr.building_name})`;
            }
            
            // 지하 정보가 있으면 추가
            if (roadAddr.underground_yn === 'Y') {
              fullAddress = '지하 ' + fullAddress;
            }
            
            // 우편번호 추가
            if (roadAddr.zone_no) {
              fullAddress = `[${roadAddr.zone_no}] ${fullAddress}`;
            }
            
            address = fullAddress;
            console.log(`📍 매장 ${store.id} 상세 도로명 주소: ${address}`);
            
          } else if (doc.address) {
            const jibunAddr = doc.address;
            
            // 지번 주소도 세부 정보 포함하여 조합
            let fullAddress = '';
            
            if (jibunAddr.address_name) {
              fullAddress = jibunAddr.address_name;
            }
            
            // 건물명이 있으면 추가
            if (jibunAddr.building_name) {
              fullAddress += ` (${jibunAddr.building_name})`;
            }
            
            // 우편번호 추가
            if (jibunAddr.zip_code) {
              fullAddress = `[${jibunAddr.zip_code}] ${fullAddress}`;
            }
            
            address = fullAddress;
            console.log(`📍 매장 ${store.id} 상세 지번 주소: ${address}`);
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
