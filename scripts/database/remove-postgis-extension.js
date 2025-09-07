
const pool = require('../../shared/config/database');

/**
 * PostGIS 확장 기능 완전 제거
 * - PostGIS 관련 모든 함수, 타입, 테이블 삭제
 * - 확장 기능 자체 제거
 */

async function removePostGISExtension() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️ PostGIS 확장 기능 완전 제거 시작...');
    
    await client.query('BEGIN');
    
    // 1. PostGIS 관련 뷰 삭제
    console.log('👁️ 1단계: PostGIS 관련 뷰 삭제...');
    
    const postgisViews = [
      'geography_columns',
      'geometry_columns'
    ];
    
    for (const view of postgisViews) {
      try {
        await client.query(`DROP VIEW IF EXISTS ${view} CASCADE`);
        console.log(`  ✅ ${view} 뷰 삭제 완료`);
      } catch (error) {
        console.log(`  ℹ️ ${view} 뷰가 존재하지 않음`);
      }
    }
    
    // 2. PostGIS 관련 테이블 삭제
    console.log('📊 2단계: PostGIS 관련 테이블 삭제...');
    
    const postgisTables = [
      'spatial_ref_sys'
    ];
    
    for (const table of postgisTables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`  ✅ ${table} 테이블 삭제 완료`);
      } catch (error) {
        console.log(`  ℹ️ ${table} 테이블이 존재하지 않음`);
      }
    }
    
    // 3. PostGIS 확장 기능 완전 제거
    console.log('🔧 3단계: PostGIS 확장 기능 제거...');
    
    try {
      await client.query('DROP EXTENSION IF EXISTS postgis CASCADE');
      console.log('  ✅ PostGIS 확장 기능 제거 완료');
    } catch (error) {
      console.log(`  ⚠️ PostGIS 확장 기능 제거 실패: ${error.message}`);
    }
    
    // 4. PostGIS 관련 스키마 정리
    console.log('📋 4단계: PostGIS 관련 스키마 정리...');
    
    try {
      // PostGIS 관련 함수들이 남아있을 수 있으므로 정리
      const postgisObjects = await client.query(`
        SELECT routine_name, routine_type
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND (
          routine_name LIKE 'st_%' OR
          routine_name LIKE 'geometry_%' OR
          routine_name LIKE 'geography_%' OR
          routine_name LIKE '_st_%' OR
          routine_name LIKE 'postgis_%' OR
          routine_name LIKE 'box2d%' OR
          routine_name LIKE 'box3d%'
        )
      `);
      
      console.log(`  📊 정리할 PostGIS 객체: ${postgisObjects.rows.length}개`);
      
      for (const obj of postgisObjects.rows) {
        try {
          await client.query(`DROP ${obj.routine_type} IF EXISTS ${obj.routine_name}() CASCADE`);
          console.log(`  ✅ ${obj.routine_type} ${obj.routine_name}() 삭제`);
        } catch (error) {
          console.log(`  ⚠️ ${obj.routine_name} 삭제 실패: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`  ℹ️ PostGIS 객체 정리 중 오류: ${error.message}`);
    }
    
    // 5. PostGIS 관련 타입 삭제
    console.log('📝 5단계: PostGIS 관련 타입 삭제...');
    
    const postgisTypes = [
      'geometry', 'geography', 'box2d', 'box3d', 
      'spheroid', 'datum', 'spatial_ref_sys'
    ];
    
    for (const type of postgisTypes) {
      try {
        await client.query(`DROP TYPE IF EXISTS ${type} CASCADE`);
        console.log(`  ✅ ${type} 타입 삭제 완료`);
      } catch (error) {
        console.log(`  ℹ️ ${type} 타입이 존재하지 않음`);
      }
    }
    
    await client.query('COMMIT');
    
    // 6. 최종 검증
    console.log('🔍 6단계: PostGIS 제거 검증...');
    
    try {
      const extensionCheck = await client.query(`
        SELECT * FROM pg_extension WHERE extname = 'postgis'
      `);
      
      if (extensionCheck.rows.length === 0) {
        console.log('  ✅ PostGIS 확장 기능이 완전히 제거되었습니다!');
      } else {
        console.log('  ⚠️ PostGIS 확장 기능이 여전히 남아있습니다.');
      }
      
      const objectsCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND (
          routine_name LIKE 'st_%' OR
          routine_name LIKE 'geometry_%' OR
          routine_name LIKE 'geography_%' OR
          routine_name LIKE '_st_%' OR
          routine_name LIKE 'postgis_%'
        )
      `);
      
      console.log(`  📊 남은 PostGIS 관련 객체: ${objectsCheck.rows[0].count}개`);
      
    } catch (error) {
      console.log(`  ⚠️ 검증 중 오류: ${error.message}`);
    }
    
    console.log('\n🎉 PostGIS 확장 기능 제거 완료!');
    console.log('💡 이제 완전히 깨끗한 상태에서 새로운 스키마를 설치할 수 있습니다.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostGIS 제거 중 오류:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  removePostGISExtension()
    .then(() => {
      console.log('\n✨ PostGIS 확장 기능이 완전히 제거되었습니다!');
      console.log('🔄 다음 단계:');
      console.log('   1. node scripts/database/complete-database-reset.js');
      console.log('   2. node scripts/database/import-sql-dump.js [덤프파일명]');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 PostGIS 제거 실패:', error);
      process.exit(1);
    });
}

module.exports = { removePostGISExtension };
