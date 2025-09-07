
const { Pool } = require('pg');

/**
 * 데이터베이스 완전 재생성 스크립트
 * - 기존 데이터베이스 완전 삭제
 * - 새 데이터베이스 생성
 * - 깨끗한 상태로 초기화
 */

async function completeDatabaseRegenerate() {
  console.log('🚨 데이터베이스 완전 재생성 시작');
  console.log('⚠️  모든 데이터가 영구적으로 삭제됩니다!');
  
  // DATABASE_URL에서 연결 정보 추출
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
  }

  console.log('📋 DATABASE_URL 확인:', databaseUrl.replace(/\/\/.*@/, '//***:***@'));
  
  // URL에서 데이터베이스명 추출
  const urlParts = new URL(databaseUrl);
  const dbName = urlParts.pathname.substring(1); // '/' 제거
  
  // postgres 기본 데이터베이스에 연결하기 위해 URL 수정
  const postgresUrl = databaseUrl.replace(`/${dbName}`, '/postgres');
  
  const adminPool = new Pool({
    connectionString: postgresUrl
  });

  try {
    // 1. 모든 연결 종료
    console.log('\n🔌 1단계: 기존 데이터베이스 연결 강제 종료...');
    await adminPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid()
    `, [dbName]);
    console.log('  ✅ 모든 연결 강제 종료 완료');

    // 2. 기존 데이터베이스 삭제
    console.log('\n🗑️ 2단계: 기존 데이터베이스 완전 삭제...');
    try {
      await adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
      console.log(`  ✅ 데이터베이스 "${dbName}" 완전 삭제 완료`);
    } catch (error) {
      console.log(`  ⚠️ 데이터베이스 삭제 중 오류: ${error.message}`);
    }

    // 3. 새 데이터베이스 생성
    console.log('\n🆕 3단계: 새 데이터베이스 생성...');
    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`  ✅ 새 데이터베이스 "${dbName}" 생성 완료`);

    // 4. 새 데이터베이스에 연결
    console.log('\n🔗 4단계: 새 데이터베이스 연결 테스트...');
    const newPool = new Pool({
      connectionString: databaseUrl // 원래 DATABASE_URL 사용
    });

    const testResult = await newPool.query('SELECT NOW() as current_time');
    console.log(`  ✅ 새 데이터베이스 연결 성공: ${testResult.rows[0].current_time}`);

    // 5. UUID 확장 설치 (PostGIS 없이)
    console.log('\n🔧 5단계: 필수 확장 기능 설치...');
    await newPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('  ✅ UUID 확장 기능 설치 완료');

    // 6. 연결 정리
    await newPool.end();

    console.log('\n🎉 데이터베이스 완전 재생성 성공!');
    console.log('📊 현재 상태:');
    console.log(`  - 데이터베이스명: ${dbName}`);
    console.log('  - PostGIS: 설치 안됨 (깨끗한 상태)');
    console.log('  - UUID 확장: 설치됨');
    console.log('  - 모든 테이블: 없음 (완전히 비어있음)');

  } catch (error) {
    console.error('\n❌ 데이터베이스 재생성 실패:', error);
    throw error;
  } finally {
    await adminPool.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  completeDatabaseRegenerate()
    .then(() => {
      console.log('\n🎊 데이터베이스 완전 재생성 성공!');
      console.log('💡 다음 단계:');
      console.log('   1. node scripts/database/import-sql-dump.js [덤프파일명] (덤프 적용)');
      console.log('   2. 또는 node scripts/database/full-database-rebuild.js (새 스키마 생성)');
      console.log('   3. 또는 node shared/config/init-db.js (기본 스키마 생성)');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 데이터베이스 재생성 실패:', error);
      console.log('🔧 관리자 권한이 필요할 수 있습니다.');
      process.exit(1);
    });
}

module.exports = { completeDatabaseRegenerate };
