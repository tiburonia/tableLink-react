
const pool = require('../../shared/config/database');

async function checkEupmyeondongStoreCoverage() {
  try {
    console.log('🔍 읍면동별 매장 데이터 존재 여부 확인 시작...');

    // 1. 전체 읍면동 수 확인
    const totalEupmyeondongResult = await pool.query(`
      SELECT COUNT(DISTINCT eupmyeondong) as total_count
      FROM store_address 
      WHERE eupmyeondong IS NOT NULL AND eupmyeondong != ''
    `);

    const totalEupmyeondong = parseInt(totalEupmyeondongResult.rows[0].total_count);
    console.log(`📊 전체 읍면동 수: ${totalEupmyeondong}개`);

    // 2. 매장이 있는 읍면동과 없는 읍면동 확인
    const coverageResult = await pool.query(`
      SELECT 
        sido,
        sigungu,
        eupmyeondong,
        COUNT(store_id) as store_count,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as stores_with_coords
      FROM store_address 
      WHERE eupmyeondong IS NOT NULL AND eupmyeondong != ''
      GROUP BY sido, sigungu, eupmyeondong
      ORDER BY sido, sigungu, eupmyeondong
    `);

    console.log(`\n📋 읍면동별 매장 분포:`);
    
    let emptyEupmyeondong = [];
    let lowStoreEupmyeondong = [];
    let totalStores = 0;
    let eupmyeondongWithStores = 0;

    coverageResult.rows.forEach(row => {
      const storeCount = parseInt(row.store_count);
      const coordCount = parseInt(row.stores_with_coords);
      
      totalStores += storeCount;
      
      if (storeCount > 0) {
        eupmyeondongWithStores++;
      }

      if (storeCount === 0) {
        emptyEupmyeondong.push(`${row.sido} ${row.sigungu} ${row.eupmyeondong}`);
      } else if (storeCount < 3) {
        lowStoreEupmyeondong.push(`${row.sido} ${row.sigungu} ${row.eupmyeondong} (${storeCount}개 매장, 좌표: ${coordCount}개)`);
      }

      // 상위 10개 읍면동만 출력
      if (coverageResult.rows.indexOf(row) < 10) {
        console.log(`  - ${row.sido} ${row.sigungu} ${row.eupmyeondong}: ${storeCount}개 매장 (좌표: ${coordCount}개)`);
      }
    });

    if (coverageResult.rows.length > 10) {
      console.log(`  ... 및 ${coverageResult.rows.length - 10}개 더`);
    }

    // 3. 요약 통계
    console.log(`\n📊 읍면동 매장 커버리지 요약:`);
    console.log(`  - 전체 읍면동: ${totalEupmyeondong}개`);
    console.log(`  - 매장이 있는 읍면동: ${eupmyeondongWithStores}개`);
    console.log(`  - 매장이 없는 읍면동: ${emptyEupmyeondong.length}개`);
    console.log(`  - 매장 수가 적은 읍면동 (3개 미만): ${lowStoreEupmyeondong.length}개`);
    console.log(`  - 커버리지: ${((eupmyeondongWithStores / totalEupmyeondong) * 100).toFixed(1)}%`);
    console.log(`  - 총 매장 수: ${totalStores}개`);

    // 4. 매장이 없는 읍면동 상세 출력
    if (emptyEupmyeondong.length > 0) {
      console.log(`\n❌ 매장이 없는 읍면동 (${emptyEupmyeondong.length}개):`);
      emptyEupmyeondong.slice(0, 20).forEach(location => {
        console.log(`  - ${location}`);
      });
      if (emptyEupmyeondong.length > 20) {
        console.log(`  ... 및 ${emptyEupmyeondong.length - 20}개 더`);
      }
    } else {
      console.log(`\n✅ 모든 읍면동에 매장이 존재합니다!`);
    }

    // 5. 매장 수가 적은 읍면동 출력
    if (lowStoreEupmyeondong.length > 0) {
      console.log(`\n⚠️ 매장 수가 적은 읍면동 (3개 미만, ${lowStoreEupmyeondong.length}개):`);
      lowStoreEupmyeondong.slice(0, 20).forEach(location => {
        console.log(`  - ${location}`);
      });
      if (lowStoreEupmyeondong.length > 20) {
        console.log(`  ... 및 ${lowStoreEupmyeondong.length - 20}개 더`);
      }
    }

    // 6. 시도별 읍면동 커버리지
    console.log(`\n📍 시도별 읍면동 커버리지:`);
    const provinceCoverageResult = await pool.query(`
      SELECT 
        sido,
        COUNT(DISTINCT eupmyeondong) as total_eupmyeondong,
        COUNT(DISTINCT CASE WHEN store_count > 0 THEN eupmyeondong END) as covered_eupmyeondong,
        SUM(store_count) as total_stores
      FROM (
        SELECT 
          sido, 
          eupmyeondong, 
          COUNT(store_id) as store_count
        FROM store_address 
        WHERE eupmyeondong IS NOT NULL AND eupmyeondong != ''
        GROUP BY sido, eupmyeondong
      ) as subquery
      GROUP BY sido
      ORDER BY total_stores DESC
    `);

    provinceCoverageResult.rows.forEach(row => {
      const coverage = ((parseInt(row.covered_eupmyeondong) / parseInt(row.total_eupmyeondong)) * 100).toFixed(1);
      console.log(`  - ${row.sido}: ${row.covered_eupmyeondong}/${row.total_eupmyeondong} (${coverage}%) - 총 ${row.total_stores}개 매장`);
    });

    // 7. 좌표 없는 매장 확인
    const noCoordResult = await pool.query(`
      SELECT COUNT(*) as no_coord_count
      FROM store_address 
      WHERE (latitude IS NULL OR longitude IS NULL) 
      AND eupmyeondong IS NOT NULL AND eupmyeondong != ''
    `);

    const noCoordCount = parseInt(noCoordResult.rows[0].no_coord_count);
    console.log(`\n📍 좌표 정보:`);
    console.log(`  - 좌표가 없는 매장: ${noCoordCount}개`);
    console.log(`  - 좌표가 있는 매장: ${totalStores - noCoordCount}개`);

    console.log(`\n🎉 읍면동별 매장 데이터 존재 여부 확인 완료!`);

  } catch (error) {
    console.error('❌ 읍면동 매장 커버리지 확인 실패:', error);
    console.error('❌ 에러 세부사항:', error.message);
    console.error('❌ 에러 스택:', error.stack);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
checkEupmyeondongStoreCoverage();
