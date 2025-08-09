
const pool = require('../../shared/config/database');

// 카카오 REST API 키
const KAKAO_API_KEY = process.env.KAKAO_API_KEY || '2da5b80696f4403357706514d7c56b70';

console.log('🔑 카카오 API 키 확인:', KAKAO_API_KEY ? '✅ 설정됨' : '❌ 없음');

if (!KAKAO_API_KEY) {
  console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
  console.log('💡 Secrets 도구에서 KAKAO_API_KEY를 설정해주세요.');
  process.exit(1);
}

// API 호출 제한을 위한 딜레이 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 카카오 좌표 → 주소 변환 API 호출
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
      console.log(`❌ coord2address API 호출 실패: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      
      // 도로명 주소 우선, 없으면 지번 주소
      if (doc.road_address) {
        return {
          address: doc.road_address.address_name,
          buildingName: doc.road_address.building_name || null,
          zoneName: doc.road_address.zone_no || null
        };
      } else if (doc.address) {
        return {
          address: doc.address.address_name,
          buildingName: doc.address.building_name || null,
          zoneName: doc.address.zip_code || null
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('coord2address API 호출 중 오류:', error);
    return null;
  }
}

// 카카오 좌표 → 행정구역 정보 API 호출
async function getRegionCodeFromCoordinates(lat, lng) {
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
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
      // B 타입 (법정동) 우선, 없으면 H 타입 (행정동)
      const bCode = data.documents.find(doc => doc.region_type === 'B');
      const hCode = data.documents.find(doc => doc.region_type === 'H');
      
      const regionData = bCode || hCode;
      
      if (regionData) {
        return {
          sido: regionData.region_1depth_name,
          sigungu: regionData.region_2depth_name,
          dong: regionData.region_3depth_name,
          regionCode: regionData.code
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('coord2regioncode API 호출 중 오류:', error);
    return null;
  }
}

// address_status 컬럼 추가 (없는 경우)
async function addAddressStatusColumn() {
  try {
    console.log('📋 address_status 컬럼 확인 및 추가...');
    
    await pool.query(`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS address_status VARCHAR(50) DEFAULT 'unknown'
    `);
    
    console.log('✅ address_status 컬럼 준비 완료');
  } catch (error) {
    console.error('❌ address_status 컬럼 추가 실패:', error);
    throw error;
  }
}

// 행정구역 관련 컬럼 추가
async function addRegionColumns() {
  try {
    console.log('📋 행정구역 컬럼들 확인 및 추가...');
    
    await pool.query(`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS sido VARCHAR(50),
      ADD COLUMN IF NOT EXISTS sigungu VARCHAR(100),
      ADD COLUMN IF NOT EXISTS dong VARCHAR(100),
      ADD COLUMN IF NOT EXISTS region_code VARCHAR(20)
    `);
    
    console.log('✅ 행정구역 컬럼들 준비 완료');
  } catch (error) {
    console.error('❌ 행정구역 컬럼 추가 실패:', error);
    throw error;
  }
}

// 모든 매장 주소 업데이트
async function updateAllStoreAddresses() {
  try {
    console.log('🚀 모든 매장 주소 업데이트 시작');
    
    // PostgreSQL 연결 확인
    console.log('🔌 데이터베이스 연결 확인 중...');
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('✅ 데이터베이스 연결 성공:', connectionTest.rows[0].now);
    
    // 필요한 컬럼 추가
    await addAddressStatusColumn();
    await addRegionColumns();
    
    // 모든 매장의 좌표 조회
    const result = await pool.query(`
      SELECT id, name, coord 
      FROM stores 
      WHERE coord IS NOT NULL 
      ORDER BY id
    `);
    
    console.log(`🏪 총 ${result.rows.length}개 매장의 주소 업데이트 시작`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < result.rows.length; i++) {
      const store = result.rows[i];
      const { id, name, coord } = store;
      
      console.log(`\n📍 [${i + 1}/${result.rows.length}] 매장 ${id} (${name}) 처리 중...`);
      
      // 좌표 유효성 검사
      let lat, lng;
      if (typeof coord === 'object' && coord !== null) {
        lat = coord.lat;
        lng = coord.lng;
      } else if (typeof coord === 'string') {
        try {
          const parsedCoord = JSON.parse(coord);
          lat = parsedCoord.lat;
          lng = parsedCoord.lng;
        } catch (e) {
          console.log(`⚠️ 좌표 파싱 실패: ${coord}`);
        }
      }
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.log(`⚠️ 좌표 정보가 불완전함 - SKIP (lat: ${lat}, lng: ${lng})`);
        await pool.query(`
          UPDATE stores 
          SET address_status = 'no_coordinates' 
          WHERE id = $1
        `, [id]);
        failCount++;
        continue;
      }
      
      console.log(`   좌표: ${lat}, ${lng}`);
      
      // 1. 주소 정보 조회
      const addressInfo = await getAddressFromCoordinates(lat, lng);
      await delay(200); // API 제한 방지 (더 길게)
      
      // 2. 행정구역 정보 조회
      const regionInfo = await getRegionCodeFromCoordinates(lat, lng);
      await delay(200); // API 제한 방지 (더 길게)
      
      if (addressInfo || regionInfo) {
        try {
          // 완전한 주소 조합
          let finalAddress = '';
          
          if (addressInfo) {
            finalAddress = addressInfo.address;
            
            // 건물명이 있으면 추가
            if (addressInfo.buildingName) {
              finalAddress += ` (${addressInfo.buildingName})`;
            }
          } else if (regionInfo) {
            // 주소는 없지만 행정구역 정보는 있는 경우
            finalAddress = `${regionInfo.sido || ''} ${regionInfo.sigungu || ''} ${regionInfo.dong || ''}`.trim();
          }
          
          // 데이터베이스 업데이트
          await pool.query(`
            UPDATE stores 
            SET 
              address = $1,
              sido = $2,
              sigungu = $3,
              dong = $4,
              region_code = $5,
              address_status = 'success'
            WHERE id = $6
          `, [
            finalAddress || null,
            regionInfo ? regionInfo.sido : null,
            regionInfo ? regionInfo.sigungu : null,
            regionInfo ? regionInfo.dong : null,
            regionInfo ? regionInfo.regionCode : null,
            id
          ]);
          
          console.log(`   ✅ 주소: ${finalAddress}`);
          if (regionInfo) {
            console.log(`   🏛️ 행정구역: ${regionInfo.sido} ${regionInfo.sigungu} ${regionInfo.dong}`);
          }
          
          successCount++;
          
        } catch (dbError) {
          console.error(`   ❌ DB 업데이트 실패:`, dbError);
          
          await pool.query(`
            UPDATE stores 
            SET address_status = 'db_error' 
            WHERE id = $1
          `, [id]);
          
          failCount++;
        }
        
      } else {
        console.log(`   ❌ API 조회 실패 - 주소 정보를 찾을 수 없음`);
        
        await pool.query(`
          UPDATE stores 
          SET address_status = 'lookup_failed' 
          WHERE id = $1
        `, [id]);
        
        failCount++;
      }
      
      // 진행률 표시
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 진행률: ${i + 1}/${result.rows.length} (${Math.round(((i + 1) / result.rows.length) * 100)}%)`);
        console.log(`   성공: ${successCount}개, 실패: ${failCount}개`);
      }
    }
    
    console.log('\n🎉 모든 매장 주소 업데이트 완료!');
    console.log(`📊 최종 결과:`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${failCount}개`);
    console.log(`   📈 성공률: ${Math.round((successCount / (successCount + failCount)) * 100)}%`);
    
    // 상태별 통계 조회
    const statusStats = await pool.query(`
      SELECT address_status, COUNT(*) as count 
      FROM stores 
      GROUP BY address_status 
      ORDER BY count DESC
    `);
    
    console.log('\n📈 상태별 통계:');
    statusStats.rows.forEach(stat => {
      console.log(`   ${stat.address_status}: ${stat.count}개`);
    });
    
    // 업데이트된 주소 샘플 확인
    const addressSamples = await pool.query(`
      SELECT id, name, address, sido, sigungu, dong, address_status 
      FROM stores 
      WHERE address_status = 'success' 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log('\n📍 업데이트된 주소 샘플:');
    addressSamples.rows.forEach(store => {
      console.log(`   [${store.id}] ${store.name}`);
      console.log(`       주소: ${store.address}`);
      console.log(`       행정구역: ${store.sido} ${store.sigungu} ${store.dong}`);
    });
    
  } catch (error) {
    console.error('❌ 주소 업데이트 실패:', error);
    throw error;
  }
}

// 스크립트 실행
console.log('🗺️ 카카오맵 API를 이용한 전체 매장 주소 업데이트');
console.log('📋 작업 내용:');
console.log('  1. coord2address API로 정확한 주소 조회');
console.log('  2. coord2regioncode API로 행정구역 정보 조회');
console.log('  3. 기존 address 컬럼 덮어쓰기');
console.log('  4. 새로운 행정구역 컬럼 추가 및 업데이트');
console.log('  5. API 실패 시 address_status 표시');
console.log('');

updateAllStoreAddresses()
  .then(() => {
    console.log('✅ 모든 작업 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 작업 실패:', error);
    process.exit(1);
  });
