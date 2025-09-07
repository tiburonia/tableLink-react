
const { Pool } = require('pg');

/**
 * 데이터베이스 완전 초기화 스크립트 (Neon 호환)
 * - 기존 테이블과 데이터 완전 삭제
 * - 새로운 스키마로 초기화
 */

async function completeDatabaseRegenerate() {
  console.log('🚨 데이터베이스 완전 초기화 시작');
  console.log('⚠️  모든 데이터가 영구적으로 삭제됩니다!');
  
  // DATABASE_URL 확인
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
  }

  console.log('📋 DATABASE_URL 확인:', databaseUrl.replace(/\/\/.*@/, '//***:***@'));
  
  const pool = new Pool({
    connectionString: databaseUrl
  });

  try {
    // 1. 모든 테이블 목록 조회
    console.log('\n🔍 1단계: 기존 테이블 목록 조회...');
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'spatial_%'
      AND tablename NOT LIKE 'geometry_%'
      AND tablename NOT LIKE 'geography_%'
      ORDER BY tablename
    `);

    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`  ✅ ${tables.length}개 테이블 발견:`, tables.join(', '));

    // 2. 외래키 제약조건 모두 삭제
    console.log('\n🔗 2단계: 외래키 제약조건 삭제...');
    const constraintsResult = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    `);

    for (const constraint of constraintsResult.rows) {
      try {
        await pool.query(`ALTER TABLE ${constraint.table_name} DROP CONSTRAINT IF EXISTS ${constraint.constraint_name} CASCADE`);
        console.log(`  ✅ 외래키 ${constraint.constraint_name} 삭제`);
      } catch (error) {
        console.log(`  ⚠️ 외래키 ${constraint.constraint_name} 삭제 실패: ${error.message}`);
      }
    }

    // 3. 모든 테이블 삭제
    console.log('\n🗑️ 3단계: 모든 테이블 삭제...');
    for (const table of tables) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`  ✅ 테이블 ${table} 삭제 완료`);
      } catch (error) {
        console.log(`  ⚠️ 테이블 ${table} 삭제 실패: ${error.message}`);
      }
    }

    // 4. 모든 시퀀스 삭제
    console.log('\n🔢 4단계: 모든 시퀀스 삭제...');
    const sequencesResult = await pool.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);

    for (const sequence of sequencesResult.rows) {
      try {
        await pool.query(`DROP SEQUENCE IF EXISTS ${sequence.sequence_name} CASCADE`);
        console.log(`  ✅ 시퀀스 ${sequence.sequence_name} 삭제 완료`);
      } catch (error) {
        console.log(`  ⚠️ 시퀀스 ${sequence.sequence_name} 삭제 실패: ${error.message}`);
      }
    }

    // 5. 모든 뷰 삭제
    console.log('\n👁️ 5단계: 모든 뷰 삭제...');
    const viewsResult = await pool.query(`
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'public'
    `);

    for (const view of viewsResult.rows) {
      try {
        await pool.query(`DROP VIEW IF EXISTS ${view.viewname} CASCADE`);
        console.log(`  ✅ 뷰 ${view.viewname} 삭제 완료`);
      } catch (error) {
        console.log(`  ⚠️ 뷰 ${view.viewname} 삭제 실패: ${error.message}`);
      }
    }

    // 6. 사용자 정의 타입 삭제
    console.log('\n🔧 6단계: 사용자 정의 타입 삭제...');
    const typesResult = await pool.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
    `);

    for (const type of typesResult.rows) {
      try {
        await pool.query(`DROP TYPE IF EXISTS ${type.typname} CASCADE`);
        console.log(`  ✅ 타입 ${type.typname} 삭제 완료`);
      } catch (error) {
        console.log(`  ⚠️ 타입 ${type.typname} 삭제 실패: ${error.message}`);
      }
    }

    // 7. PostGIS 관련 정리 (있다면)
    console.log('\n🗺️ 7단계: PostGIS 관련 정리...');
    try {
      await pool.query('DROP EXTENSION IF EXISTS postgis CASCADE');
      console.log('  ✅ PostGIS 확장 제거 완료');
    } catch (error) {
      console.log('  ℹ️ PostGIS 확장이 없거나 제거할 수 없음');
    }

    // 8. UUID 확장 설치
    console.log('\n🆔 8단계: 필수 확장 기능 설치...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('  ✅ UUID 확장 기능 설치 완료');

    // 9. 완전 정리 검증
    console.log('\n✅ 9단계: 정리 결과 검증...');
    const finalTablesResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'spatial_%'
      AND tablename NOT LIKE 'geometry_%'
      AND tablename NOT LIKE 'geography_%'
    `);
    
    const remainingTables = parseInt(finalTablesResult.rows[0].count);
    console.log(`  📊 남은 테이블: ${remainingTables}개`);

    if (remainingTables === 0) {
      console.log('\n🎉 데이터베이스 완전 초기화 성공!');
      console.log('📊 현재 상태:');
      console.log('  - 모든 테이블: 삭제됨');
      console.log('  - 모든 데이터: 삭제됨');
      console.log('  - 모든 제약조건: 삭제됨');
      console.log('  - UUID 확장: 설치됨');
      console.log('  - PostGIS: 제거됨 (깨끗한 상태)');
    } else {
      console.log(`\n⚠️ ${remainingTables}개 테이블이 남아있습니다.`);
    }

  } catch (error) {
    console.error('\n❌ 데이터베이스 초기화 실패:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  completeDatabaseRegenerate()
    .then(() => {
      console.log('\n🎊 데이터베이스 완전 초기화 성공!');
      console.log('💡 다음 단계:');
      console.log('   1. node shared/config/init-db.js (기본 스키마 생성)');
      console.log('   2. node scripts/database/import-sql-dump.js [덤프파일명] (덤프 적용)');
      console.log('   3. 또는 원하는 스키마 스크립트 실행');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 데이터베이스 초기화 실패:', error.message);
      process.exit(1);
    });
}

module.exports = { completeDatabaseRegenerate };
