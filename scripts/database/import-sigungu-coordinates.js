
const XLSX = require('xlsx');
const pool = require('../../shared/config/database');
const path = require('path');

async function importSigunguCoordinates() {
  try {
    console.log('📊 시군구 행정기관 좌표 데이터 가져오기 시작...');
    
    // 엑셀 파일 경로
    const excelPath = path.join(__dirname, '../../attached_assets/SIGUNGU_LATLON_1754799204277.xlsx');
    
    console.log(`📁 파일 경로: ${excelPath}`);
    
    // 엑셀 파일 읽기
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // 첫 번째 시트 사용
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📋 시트명: ${sheetName}`);
    
    // JSON으로 변환
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 데이터 행 수: ${jsonData.length}`);
    console.log('📄 첫 번째 행 예시:', jsonData[0]);
    
    if (jsonData.length === 0) {
      console.log('⚠️ 데이터가 없습니다.');
      return;
    }
    
    // 데이터 컬럼명 확인
    const columns = Object.keys(jsonData[0]);
    console.log('📋 컬럼명:', columns);
    
    // administrative_offices 테이블이 존재하는지 확인하고 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS administrative_offices (
        id SERIAL PRIMARY KEY,
        region_type VARCHAR(20) NOT NULL, -- 'sido' 또는 'sigungu'
        region_name VARCHAR(100) NOT NULL,
        office_name VARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(region_type, region_name)
      );
    `);
    
    console.log('✅ administrative_offices 테이블 준비 완료');
    
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // 각 행을 처리
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        // 컬럼명이 다를 수 있으므로 여러 가능성을 확인
        let sigunguName = null;
        let latitude = null;
        let longitude = null;
        
        // 가능한 컬럼명들을 확인
        for (const [key, value] of Object.entries(row)) {
          const lowerKey = key.toLowerCase();
          
          if (lowerKey.includes('시군구') || lowerKey.includes('sigungu') || lowerKey.includes('name')) {
            sigunguName = String(value).trim();
          } else if (lowerKey.includes('lat') || lowerKey.includes('위도') || lowerKey.includes('y')) {
            latitude = parseFloat(value);
          } else if (lowerKey.includes('lng') || lowerKey.includes('lon') || lowerKey.includes('경도') || lowerKey.includes('x')) {
            longitude = parseFloat(value);
          }
        }
        
        console.log(`📍 [${i + 1}/${jsonData.length}] 처리 중: ${sigunguName} (${latitude}, ${longitude})`);
        
        // 데이터 유효성 검사
        if (!sigunguName || isNaN(latitude) || isNaN(longitude)) {
          console.log(`⚠️ 건너뛰기: 유효하지 않은 데이터 - ${sigunguName}, ${latitude}, ${longitude}`);
          skippedCount++;
          continue;
        }
        
        // 좌표 범위 검사 (대한민국 범위)
        if (latitude < 33 || latitude > 39 || longitude < 124 || longitude > 132) {
          console.log(`⚠️ 건너뛰기: 좌표 범위 초과 - ${sigunguName} (${latitude}, ${longitude})`);
          skippedCount++;
          continue;
        }
        
        // 시군구청 이름 생성
        let officeName = sigunguName;
        if (!officeName.includes('청')) {
          if (officeName.includes('시') && !officeName.includes('구')) {
            officeName += '청';
          } else if (officeName.includes('군')) {
            officeName += '청';
          } else if (officeName.includes('구')) {
            officeName += '청';
          } else {
            officeName += '청';
          }
        }
        
        // DB에 삽입
        await pool.query(`
          INSERT INTO administrative_offices (region_type, region_name, office_name, latitude, longitude)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (region_type, region_name) 
          DO UPDATE SET 
            office_name = EXCLUDED.office_name,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude
        `, ['sigungu', sigunguName, officeName, latitude, longitude]);
        
        insertedCount++;
        
        // 진행상황 표시
        if (insertedCount % 50 === 0) {
          console.log(`📊 진행상황: ${insertedCount}개 처리 완료`);
        }
        
      } catch (error) {
        console.error(`❌ 행 ${i + 1} 처리 실패:`, error.message);
        console.error(`   데이터:`, row);
        errorCount++;
      }
    }
    
    // 결과 확인
    const totalResult = await pool.query(`
      SELECT COUNT(*) as count FROM administrative_offices WHERE region_type = 'sigungu'
    `);
    
    console.log(`\n🎉 시군구 행정기관 좌표 데이터 가져오기 완료!`);
    console.log(`📊 처리 결과:`);
    console.log(`  - 성공: ${insertedCount}개`);
    console.log(`  - 건너뛰기: ${skippedCount}개`);
    console.log(`  - 실패: ${errorCount}개`);
    console.log(`  - DB 내 총 시군구 수: ${totalResult.rows[0].count}개`);
    
    // 샘플 데이터 확인
    const samples = await pool.query(`
      SELECT office_name, region_name, latitude, longitude 
      FROM administrative_offices 
      WHERE region_type = 'sigungu'
      ORDER BY RANDOM() 
      LIMIT 10
    `);
    
    console.log(`\n📍 샘플 데이터:`);
    samples.rows.forEach(office => {
      console.log(`  - ${office.office_name} (${office.region_name}): ${office.latitude}, ${office.longitude}`);
    });
    
  } catch (error) {
    console.error('❌ 시군구 좌표 가져오기 실패:', error);
    console.error('❌ 에러 세부사항:', error.message);
    console.error('❌ 에러 스택:', error.stack);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
importSigunguCoordinates();
