
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

// 전국 주요 도시 좌표 (더 다양한 지역 추가)
const MAJOR_CITIES = [
  // 수도권
  { name: '서울특별시', lat: 37.5665, lng: 126.9780 },
  { name: '인천광역시', lat: 37.4563, lng: 126.7052 },
  { name: '경기도 수원시', lat: 37.2636, lng: 127.0286 },
  { name: '경기도 성남시', lat: 37.4201, lng: 127.1262 },
  { name: '경기도 안양시', lat: 37.3943, lng: 126.9568 },
  { name: '경기도 부천시', lat: 37.5036, lng: 126.7660 },
  { name: '경기도 안산시', lat: 37.3219, lng: 126.8309 },
  { name: '경기도 고양시', lat: 37.6584, lng: 126.8320 },
  
  // 광역시
  { name: '부산광역시', lat: 35.1796, lng: 129.0756 },
  { name: '대구광역시', lat: 35.8714, lng: 128.6014 },
  { name: '광주광역시', lat: 35.1595, lng: 126.8526 },
  { name: '대전광역시', lat: 36.3504, lng: 127.3845 },
  { name: '울산광역시', lat: 35.5384, lng: 129.3114 },
  { name: '세종특별자치시', lat: 36.4875, lng: 127.2818 },
  
  // 경상도
  { name: '경상북도 포항시', lat: 36.0190, lng: 129.3435 },
  { name: '경상북도 경주시', lat: 35.8562, lng: 129.2247 },
  { name: '경상북도 구미시', lat: 36.1196, lng: 128.3441 },
  { name: '경상북도 안동시', lat: 36.5684, lng: 128.7294 },
  { name: '경상남도 창원시', lat: 35.2280, lng: 128.6811 },
  { name: '경상남도 진주시', lat: 35.1800, lng: 128.1076 },
  { name: '경상남도 김해시', lat: 35.2285, lng: 128.8890 },
  
  // 전라도
  { name: '전라북도 전주시', lat: 35.8242, lng: 127.1480 },
  { name: '전라북도 익산시', lat: 35.9483, lng: 126.9574 },
  { name: '전라남도 목포시', lat: 34.8118, lng: 126.3922 },
  { name: '전라남도 여수시', lat: 34.7604, lng: 127.6622 },
  { name: '전라남도 순천시', lat: 34.9506, lng: 127.4872 },
  
  // 충청도
  { name: '충청북도 청주시', lat: 36.6424, lng: 127.4890 },
  { name: '충청북도 충주시', lat: 36.9910, lng: 127.9259 },
  { name: '충청남도 천안시', lat: 36.8151, lng: 127.1139 },
  { name: '충청남도 아산시', lat: 36.7898, lng: 127.0020 },
  
  // 강원도
  { name: '강원도 춘천시', lat: 37.8813, lng: 127.7298 },
  { name: '강원도 원주시', lat: 37.3422, lng: 127.9202 },
  { name: '강원도 강릉시', lat: 37.7519, lng: 128.8761 },
  
  // 제주도
  { name: '제주특별자치도 제주시', lat: 33.4996, lng: 126.5312 },
  { name: '제주특별자치도 서귀포시', lat: 33.2541, lng: 126.5603 }
];

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

// 테이블 컬럼 확인 및 추가
async function setupColumns() {
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

// 전국 좌표 다시 생성 (기존 좌표 완전 대체)
async function regenerateNationalCoordinates() {
  try {
    console.log('🌍 전국 다양한 지역으로 좌표 재생성 시작...');
    
    const result = await pool.query('SELECT id, name FROM stores ORDER BY id');
    const stores = result.rows;
    
    console.log(`📍 총 ${stores.length}개 매장의 좌표를 전국으로 재배치`);
    
    let successCount = 0;
    
    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];
      
      // 전국 주요 도시 중 랜덤 선택
      const randomCity = MAJOR_CITIES[Math.floor(Math.random() * MAJOR_CITIES.length)];
      
      // 선택된 도시 중심에서 반경 10km 내 랜덤 좌표 생성
      const latOffset = (Math.random() - 0.5) * 0.2; // 약 ±10km
      const lngOffset = (Math.random() - 0.5) * 0.2;
      
      const newLat = randomCity.lat + latOffset;
      const newLng = randomCity.lng + lngOffset;
      
      // 좌표 업데이트
      await pool.query(`
        UPDATE stores 
        SET coord = $1, address_status = 'pending'
        WHERE id = $2
      `, [JSON.stringify({ lat: newLat, lng: newLng }), store.id]);
      
      console.log(`📍 [${i + 1}/${stores.length}] ${store.name} → ${randomCity.name} 지역 (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`);
      
      successCount++;
      
      // 진행률 표시
      if ((i + 1) % 50 === 0) {
        console.log(`📊 진행률: ${i + 1}/${stores.length} (${Math.round(((i + 1) / stores.length) * 100)}%)`);
      }
    }
    
    console.log(`✅ 전국 좌표 재생성 완료: ${successCount}개 매장`);
    
    // 지역별 분포 확인
    const distribution = {};
    for (const city of MAJOR_CITIES) {
      const region = city.name.split(' ')[0];
      distribution[region] = (distribution[region] || 0) + 1;
    }
    
    console.log('\n📊 예상 지역별 분포:');
    Object.entries(distribution).forEach(([region, count]) => {
      console.log(`   ${region}: 약 ${Math.round((count / MAJOR_CITIES.length) * stores.length)}개 매장`);
    });
    
  } catch (error) {
    console.error('❌ 좌표 재생성 실패:', error);
    throw error;
  }
}

// 주소 정보 업데이트
async function updateAllAddresses() {
  try {
    console.log('🏠 모든 매장 주소 정보 업데이트 시작...');
    
    const result = await pool.query(`
      SELECT id, name, coord 
      FROM stores 
      WHERE coord IS NOT NULL 
      ORDER BY id
    `);
    
    console.log(`🏪 총 ${result.rows.length}개 매장 주소 업데이트`);
    
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
    
  } catch (error) {
    console.error('❌ 주소 업데이트 실패:', error);
    throw error;
  }
}

// 결과 확인
async function checkResults() {
  try {
    console.log('\n📊 최종 결과 확인...');
    
    // 상태별 통계
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
    
    // 지역별 분포
    const regionStats = await pool.query(`
      SELECT sido, COUNT(*) as count 
      FROM stores 
      WHERE sido IS NOT NULL 
      GROUP BY sido 
      ORDER BY count DESC
    `);
    
    console.log('\n🗺️ 시도별 분포:');
    regionStats.rows.forEach(stat => {
      console.log(`   ${stat.sido}: ${stat.count}개`);
    });
    
    // 샘플 주소 확인
    const samples = await pool.query(`
      SELECT id, name, address, sido, sigungu, dong, address_status 
      FROM stores 
      WHERE address_status = 'success' 
      ORDER BY RANDOM() 
      LIMIT 15
    `);
    
    console.log('\n📍 업데이트된 주소 샘플:');
    samples.rows.forEach(store => {
      console.log(`   [${store.id}] ${store.name}`);
      console.log(`       주소: ${store.address}`);
      console.log(`       행정구역: ${store.sido} ${store.sigungu} ${store.dong}`);
    });
    
  } catch (error) {
    console.error('❌ 결과 확인 실패:', error);
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🚀 전국 매장 주소 정규화 프로세스 시작');
    console.log('📋 작업 순서:');
    console.log('  1. 데이터베이스 컬럼 설정');
    console.log('  2. 전국 다양한 지역으로 좌표 재배치');
    console.log('  3. 카카오 API를 통한 주소 정보 업데이트');
    console.log('  4. 결과 확인');
    console.log('');
    
    // 1. 컬럼 설정
    await setupColumns();
    
    // 2. 전국 좌표 재생성
    await regenerateNationalCoordinates();
    
    // 3. 주소 업데이트
    await updateAllAddresses();
    
    // 4. 결과 확인
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
      console.log('🎉 전국 매장 주소 정규화 완료');
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
  regenerateNationalCoordinates,
  updateAllAddresses,
  checkResults
};
