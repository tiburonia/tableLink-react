
const pool = require('./database');

// 카카오 REST API 키 (환경변수에서 가져오기)
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

if (!KAKAO_API_KEY) {
  console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
  console.log('💡 Secrets 도구에서 KAKAO_API_KEY를 설정해주세요.');
  process.exit(1);
}

async function removeZipCodesFromAddresses() {
  try {
    console.log('🔄 모든 매장 주소에서 우편번호 제거 중...');
    
    // 모든 매장의 좌표와 현재 주소 조회
    const result = await pool.query('SELECT id, name, coord, address FROM stores WHERE coord IS NOT NULL ORDER BY id');
    console.log(`🏪 ${result.rows.length}개 매장의 주소에서 우편번호 제거 시작`);
    
    for (const store of result.rows) {
      try {
        const coord = store.coord;
        if (!coord || !coord.lat || !coord.lng) {
          console.log(`⚠️ 매장 ${store.id} (${store.name}): 좌표 정보가 불완전함`);
          continue;
        }
        
        console.log(`🔍 매장 ${store.id} (${store.name}) 우편번호 없는 주소 조회 중...`);
        console.log(`   현재 주소: ${store.address || '없음'}`);
        
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
          continue;
        }
        
        const data = await response.json();
        let cleanAddress = null;
        
        // 우선순위: 도로명 주소 > 지번 주소 (우편번호 제외)
        if (data.documents && data.documents.length > 0) {
          const doc = data.documents[0];
          
          // 1순위: 도로명 주소 (우편번호 제외)
          if (doc.road_address) {
            const roadAddr = doc.road_address;
            let fullAddress = '';
            
            // 기본 도로명 주소 (우편번호 없이)
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
            
            cleanAddress = fullAddress;
            console.log(`✅ 도로명 주소 (우편번호 제거): ${cleanAddress}`);
            
          } 
          // 2순위: 지번 주소 (우편번호 제외)
          else if (doc.address) {
            const jibunAddr = doc.address;
            let fullAddress = '';
            
            if (jibunAddr.address_name) {
              fullAddress = jibunAddr.address_name;
            }
            
            // 건물명이 있으면 추가
            if (jibunAddr.building_name) {
              fullAddress += ` (${jibunAddr.building_name})`;
            }
            
            cleanAddress = fullAddress;
            console.log(`⚠️ 지번 주소로 대체 (우편번호 제거): ${cleanAddress}`);
          }
        }
        
        // 주소가 변경되었거나 우편번호가 포함된 경우 업데이트
        const hasZipCode = store.address && store.address.includes('[');
        const needsUpdate = !store.address || 
                           hasZipCode || 
                           store.address !== cleanAddress;
        
        if (cleanAddress && needsUpdate) {
          await pool.query(
            'UPDATE stores SET address = $1 WHERE id = $2',
            [cleanAddress, store.id]
          );
          console.log(`🔄 매장 ${store.id} (${store.name}) 주소 우편번호 제거 완료`);
          console.log(`   이전: ${store.address || '없음'}`);
          console.log(`   이후: ${cleanAddress}`);
        } else if (cleanAddress) {
          console.log(`✅ 매장 ${store.id} (${store.name}) 이미 우편번호 없는 형식`);
        } else {
          console.log(`⚠️ 매장 ${store.id} (${store.name}): 주소를 찾을 수 없음`);
        }
        
        // API 호출 제한 방지를 위한 딜레이 (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ 매장 ${store.id} (${store.name}) 주소 처리 실패:`, error.message);
        continue;
      }
    }
    
    console.log('\n🎉 모든 매장의 주소 우편번호 제거 완료!');
    
    // 최종 결과 확인
    const finalResult = await pool.query(
      'SELECT id, name, address FROM stores WHERE address IS NOT NULL ORDER BY id'
    );
    
    console.log(`\n📊 우편번호 제거된 주소 현황: ${finalResult.rows.length}개 매장`);
    
    // 통계 출력
    const withZipCode = finalResult.rows.filter(store => store.address.includes('[')).length;
    const withoutZipCode = finalResult.rows.length - withZipCode;
    
    console.log(`✅ 우편번호 없음: ${withoutZipCode}개`);
    console.log(`⚠️ 우편번호 포함: ${withZipCode}개`);
    
    console.log('\n📋 우편번호 제거된 주소 목록:');
    finalResult.rows.forEach(store => {
      const hasZipCode = store.address.includes('[') ? '⚠️' : '✅';
      console.log(`  ${hasZipCode} 매장 ${store.id}: ${store.name}`);
      console.log(`      ${store.address}`);
    });
    
  } catch (error) {
    console.error('❌ 주소 우편번호 제거 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
removeZipCodesFromAddresses();
