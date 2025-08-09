
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
        // 상세 주소 조합 (법정동 기준)
        const addressParts = [];
        
        if (regionData.region_1depth_name) {
          addressParts.push(regionData.region_1depth_name);
        }
        if (regionData.region_2depth_name) {
          addressParts.push(regionData.region_2depth_name);
        }
        if (regionData.region_3depth_name) {
          addressParts.push(regionData.region_3depth_name);
        }
        
        const fullAddress = addressParts.join(' ');
        
        return {
          sido: regionData.region_1depth_name,
          sigungu: regionData.region_2depth_name,
          dong: regionData.region_3depth_name,
          regionCode: regionData.code,
          fullAddress: fullAddress,
          regionType: regionData.region_type
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('coord2regioncode API 호출 중 오류:', error);
    return null;
  }
}

// 테이블 컬럼 확인 및 추가
async function setupColumns() {
  try {
    console.log('📋 필요한 컬럼들 확인 및 추가...');
    
    // stores 테이블에 행정구역 컬럼들 추가
    await pool.query(`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS sido VARCHAR(50),
      ADD COLUMN IF NOT EXISTS sigungu VARCHAR(100),
      ADD COLUMN IF NOT EXISTS dong VARCHAR(100),
      ADD COLUMN IF NOT EXISTS region_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS address_update_status VARCHAR(50) DEFAULT 'pending'
    `);
    
    console.log('✅ 컬럼 설정 완료');
  } catch (error) {
    console.error('❌ 컬럼 설정 실패:', error);
    throw error;
  }
}

// 좌표 기반 행정구역 정보 업데이트
async function updateRegionFromCoordinates() {
  try {
    console.log('🏛️ 좌표 기반 행정구역 정보 업데이트 시작...');
    
    // 좌표가 있는 모든 매장 조회
    const result = await pool.query(`
      SELECT id, name, coord 
      FROM stores 
      WHERE coord IS NOT NULL 
      ORDER BY id
    `);
    
    console.log(`🏪 총 ${result.rows.length}개 매장의 행정구역 정보 업데이트 대상`);
    
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
          SET address_update_status = 'no_coordinates' 
          WHERE id = $1
        `, [id]);
        
        failCount++;
        continue;
      }
      
      console.log(`   좌표: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      
      try {
        // 행정구역 정보 조회
        const regionInfo = await getRegionCodeFromCoordinates(lat, lng);
        await delay(300); // API 제한 방지
        
        if (regionInfo) {
          // 기존 address 컬럼을 새로운 행정구역 정보로 덮어쓰기
          await pool.query(`
            UPDATE stores 
            SET 
              address = $1,
              sido = $2,
              sigungu = $3,
              dong = $4,
              region_code = $5,
              address_update_status = 'success'
            WHERE id = $6
          `, [
            regionInfo.fullAddress,
            regionInfo.sido,
            regionInfo.sigungu,
            regionInfo.dong,
            regionInfo.regionCode,
            id
          ]);
          
          console.log(`   ✅ 주소: ${regionInfo.fullAddress}`);
          console.log(`   🏛️ 행정구역: ${regionInfo.sido} ${regionInfo.sigungu} ${regionInfo.dong}`);
          console.log(`   📋 행정구역코드: ${regionInfo.regionCode} (${regionInfo.regionType})`);
          
          successCount++;
          
        } else {
          console.log(`   ❌ API 조회 실패`);
          
          await pool.query(`
            UPDATE stores 
            SET address_update_status = 'lookup_failed' 
            WHERE id = $1
          `, [id]);
          
          failCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ 처리 중 오류:`, error);
        
        await pool.query(`
          UPDATE stores 
          SET address_update_status = 'api_error' 
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
    
    console.log('\n🎉 행정구역 정보 업데이트 완료!');
    console.log(`📊 최종 결과:`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${failCount}개`);
    console.log(`   📈 성공률: ${Math.round((successCount / (successCount + failCount)) * 100)}%`);
    
  } catch (error) {
    console.error('❌ 행정구역 정보 업데이트 실패:', error);
    throw error;
  }
}

// 결과 확인
async function checkResults() {
  try {
    console.log('\n📊 업데이트 결과 확인...');
    
    // 상태별 통계
    const statusStats = await pool.query(`
      SELECT address_update_status, COUNT(*) as count 
      FROM stores 
      GROUP BY address_update_status 
      ORDER BY count DESC
    `);
    
    console.log('\n📈 상태별 통계:');
    statusStats.rows.forEach(stat => {
      console.log(`   ${stat.address_update_status}: ${stat.count}개`);
    });
    
    // 시도별 분포
    const sidoStats = await pool.query(`
      SELECT sido, COUNT(*) as count 
      FROM stores 
      WHERE sido IS NOT NULL 
      GROUP BY sido 
      ORDER BY count DESC
    `);
    
    console.log('\n🗺️ 시도별 분포:');
    sidoStats.rows.forEach(stat => {
      console.log(`   ${stat.sido}: ${stat.count}개`);
    });
    
    // 시군구별 분포 (상위 10개)
    const sigunguStats = await pool.query(`
      SELECT sigungu, COUNT(*) as count 
      FROM stores 
      WHERE sigungu IS NOT NULL 
      GROUP BY sigungu 
      ORDER BY count DESC
      LIMIT 10
    `);
    
    console.log('\n🏙️ 시군구별 분포 (상위 10개):');
    sigunguStats.rows.forEach(stat => {
      console.log(`   ${stat.sigungu}: ${stat.count}개`);
    });
    
    // 업데이트된 주소 샘플
    const samples = await pool.query(`
      SELECT id, name, address, sido, sigungu, dong, region_code, address_update_status 
      FROM stores 
      WHERE address_update_status = 'success' 
      ORDER BY RANDOM() 
      LIMIT 10
    `);
    
    console.log('\n📍 업데이트된 주소 샘플:');
    samples.rows.forEach(store => {
      console.log(`   [${store.id}] ${store.name}`);
      console.log(`       주소: ${store.address}`);
      console.log(`       행정구역: ${store.sido} ${store.sigungu} ${store.dong}`);
      console.log(`       지역코드: ${store.region_code}`);
    });
    
  } catch (error) {
    console.error('❌ 결과 확인 실패:', error);
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🚀 좌표 기반 행정구역 정보 업데이트 프로세스 시작');
    console.log('📋 작업 순서:');
    console.log('  1. 데이터베이스 컬럼 설정');
    console.log('  2. 카카오 coord2regioncode API를 통한 행정구역 정보 갱신');
    console.log('  3. 기존 address 컬럼 데이터 덮어쓰기');
    console.log('  4. 결과 확인');
    console.log('');
    
    // 1. 컬럼 설정
    await setupColumns();
    
    // 2. 행정구역 정보 업데이트
    await updateRegionFromCoordinates();
    
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
      console.log('🎉 좌표 기반 행정구역 정보 업데이트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 프로세스 실패:', error);
      process.exit(1);
    });
}

module.exports = {
  main,
  setupColumns,
  updateRegionFromCoordinates,
  checkResults
};
