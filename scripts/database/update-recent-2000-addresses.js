
const pool = require('../../shared/config/database');

// 카카오 REST API 키
const KAKAO_API_KEY = process.env.KAKAO_API_KEY || '2da5b80696f4403357706514d7c56b70';

console.log('🔑 카카오 API 키:', KAKAO_API_KEY ? '✅ 설정됨' : '❌ 없음');

if (!KAKAO_API_KEY) {
  console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

// API 호출 딜레이
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
          buildingName: doc.road_address.building_name || null,
          zoneNo: doc.road_address.zone_no || null
        };
      } 
      // 지번 주소
      else if (doc.address) {
        return {
          address: doc.address.address_name,
          buildingName: null,
          zoneNo: null
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('coord2address API 호출 중 오류:', error);
    return null;
  }
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

// 필요한 컬럼 확인 및 추가
async function ensureColumns() {
  try {
    console.log('📋 필요한 컬럼들 확인 및 추가...');
    
    // address_status 컬럼 추가
    await pool.query(`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS address_status VARCHAR(50) DEFAULT 'pending'
    `);
    
    // 행정구역 컬럼들 추가
    await pool.query(`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS sido VARCHAR(50),
      ADD COLUMN IF NOT EXISTS sigungu VARCHAR(100),
      ADD COLUMN IF NOT EXISTS dong VARCHAR(100),
      ADD COLUMN IF NOT EXISTS region_code VARCHAR(20)
    `);
    
    console.log('✅ 컬럼 설정 완료');
  } catch (error) {
    console.error('❌ 컬럼 설정 실패:', error);
    throw error;
  }
}

// 최근 4000개 매장 주소 정보 업데이트
async function updateRecent4000StoreAddresses() {
  try {
    console.log('🏠 최근 4000개 매장 주소 정보 업데이트 시작...');
    
    // 최근 4000개 매장 조회 (ID 기준 내림차순으로 최근 것들)
    const result = await pool.query(`
      SELECT id, name, coord 
      FROM stores 
      WHERE coord IS NOT NULL 
      ORDER BY id DESC 
      LIMIT 4000
    `);
    
    console.log(`🏪 총 ${result.rows.length}개 매장 주소 업데이트 대상`);
    
    if (result.rows.length === 0) {
      console.log('⚠️ 업데이트할 매장이 없습니다.');
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < result.rows.length; i++) {
      const store = result.rows[i];
      const { id, name, coord } = store;
      
      console.log(`\n📍 [${i + 1}/${result.rows.length}] ${name} (ID: ${id}) 처리 중...`);
      
      // 좌표 파싱
      let lat, lng;
      try {
        if (typeof coord === 'object' && coord !== null) {
          lat = coord.lat;
          lng = coord.lng;
        } else if (typeof coord === 'string') {
          const parsedCoord = JSON.parse(coord);
          lat = parsedCoord.lat;
          lng = parsedCoord.lng;
        }
        
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          throw new Error('좌표 정보 없음');
        }
      } catch (error) {
        console.log(`⚠️ 좌표 파싱 실패: ${error.message}`);
        
        await pool.query(`
          UPDATE stores 
          SET address_status = 'no_coordinates' 
          WHERE id = $1
        `, [id]);
        
        failCount++;
        continue;
      }
      
      console.log(`   좌표: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      
      try {
        // 1. 주소 정보 조회
        const addressInfo = await getAddressFromCoordinates(lat, lng);
        await delay(300); // API 제한 방지
        
        // 2. 행정구역 정보 조회
        const regionInfo = await getRegionCodeFromCoordinates(lat, lng);
        await delay(300); // API 제한 방지
        
        if (addressInfo || regionInfo) {
          // 주소 조합
          let finalAddress = '';
          
          if (addressInfo) {
            finalAddress = addressInfo.address;
            if (addressInfo.buildingName) {
              finalAddress += ` (${addressInfo.buildingName})`;
            }
          } else if (regionInfo) {
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
            console.log(`   🔢 지역코드: ${regionInfo.regionCode}`);
          }
          
          successCount++;
          
        } else {
          console.log(`   ❌ API 조회 실패`);
          
          await pool.query(`
            UPDATE stores 
            SET address_status = 'lookup_failed' 
            WHERE id = $1
          `, [id]);
          
          failCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ 처리 중 오류:`, error);
        
        await pool.query(`
          UPDATE stores 
          SET address_status = 'api_error' 
          WHERE id = $1
        `, [id]);
        
        failCount++;
      }
      
      // 진행률 표시
      if ((i + 1) % 50 === 0) {
        console.log(`\n📊 진행률: ${i + 1}/${result.rows.length} (${Math.round(((i + 1) / result.rows.length) * 100)}%)`);
        console.log(`   성공: ${successCount}개, 실패: ${failCount}개`);
        
        // 중간 저장 확인
        const checkResult = await pool.query(`
          SELECT address_status, COUNT(*) as count 
          FROM stores 
          WHERE id IN (SELECT id FROM stores ORDER BY id DESC LIMIT 2000)
          GROUP BY address_status
        `);
        
        console.log('   현재 상태별 통계:');
        checkResult.rows.forEach(stat => {
          console.log(`     ${stat.address_status}: ${stat.count}개`);
        });
      }
    }
    
    console.log('\n🎉 최근 4000개 매장 주소 업데이트 완료!');
    console.log(`📊 최종 결과:`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${failCount}개`);
    console.log(`   📈 성공률: ${Math.round((successCount / (successCount + failCount)) * 100)}%`);
    
  } catch (error) {
    console.error('❌ 주소 업데이트 실패:', error);
    throw error;
  }
}

// 결과 확인
async function checkResults() {
  try {
    console.log('\n📊 최종 결과 확인...');
    
    // 최근 4000개 매장의 상태별 통계
    const statusStats = await pool.query(`
      SELECT address_status, COUNT(*) as count 
      FROM stores 
      WHERE id IN (SELECT id FROM stores ORDER BY id DESC LIMIT 4000)
      GROUP BY address_status 
      ORDER BY count DESC
    `);
    
    console.log('\n📈 최근 4000개 매장 상태별 통계:');
    statusStats.rows.forEach(stat => {
      console.log(`   ${stat.address_status || 'null'}: ${stat.count}개`);
    });
    
    // 성공한 매장들의 지역별 분포
    const regionStats = await pool.query(`
      SELECT sido, COUNT(*) as count 
      FROM stores 
      WHERE id IN (SELECT id FROM stores ORDER BY id DESC LIMIT 4000)
        AND sido IS NOT NULL 
        AND address_status = 'success'
      GROUP BY sido 
      ORDER BY count DESC
    `);
    
    console.log('\n🗺️ 성공한 매장들의 시도별 분포:');
    regionStats.rows.forEach(stat => {
      console.log(`   ${stat.sido}: ${stat.count}개`);
    });
    
    // 샘플 주소 확인
    const samples = await pool.query(`
      SELECT id, name, address, sido, sigungu, dong, region_code, address_status 
      FROM stores 
      WHERE id IN (SELECT id FROM stores ORDER BY id DESC LIMIT 4000)
        AND address_status = 'success' 
      ORDER BY RANDOM() 
      LIMIT 10
    `);
    
    console.log('\n📍 업데이트된 주소 샘플 (10개):');
    samples.rows.forEach(store => {
      console.log(`   [${store.id}] ${store.name}`);
      console.log(`       주소: ${store.address}`);
      console.log(`       행정구역: ${store.sido} ${store.sigungu} ${store.dong}`);
      console.log(`       지역코드: ${store.region_code}`);
      console.log(`       상태: ${store.address_status}`);
    });
    
    // 전체 매장 통계도 확인
    const totalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_stores,
        COUNT(CASE WHEN address_status = 'success' THEN 1 END) as success_stores,
        COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as stores_with_address
      FROM stores
    `);
    
    console.log('\n🌍 전체 매장 통계:');
    console.log(`   총 매장 수: ${totalStats.rows[0].total_stores}개`);
    console.log(`   주소 업데이트 성공: ${totalStats.rows[0].success_stores}개`);
    console.log(`   주소 보유 매장: ${totalStats.rows[0].stores_with_address}개`);
    
  } catch (error) {
    console.error('❌ 결과 확인 실패:', error);
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🚀 최근 4000개 매장 주소 정보 업데이트 시작');
    console.log('📋 작업 순서:');
    console.log('  1. 데이터베이스 컬럼 확인 및 설정');
    console.log('  2. 최근 4000개 매장 조회');
    console.log('  3. 카카오 API를 통한 주소 정보 업데이트');
    console.log('  4. 결과 확인');
    console.log('');
    
    // 1. 컬럼 설정
    await ensureColumns();
    
    // 2. 최근 4000개 매장 주소 업데이트
    await updateRecent4000StoreAddresses();
    
    // 3. 결과 확인
    await checkResults();
    
    console.log('\n✅ 모든 작업 완료');
    
  } catch (error) {
    console.error('❌ 프로세스 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 최근 4000개 매장 주소 정보 업데이트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 프로세스 실패:', error);
      process.exit(1);
    });
}

module.exports = {
  main,
  ensureColumns,
  updateRecent4000StoreAddresses,
  checkResults
};
