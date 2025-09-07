
const pool = require('../../shared/config/database');

/**
 * 데이터베이스 완전 초기화 스크립트
 * - 모든 테이블, 뷰, 함수, 트리거, ENUM 타입 완전 삭제
 * - 안전한 순서로 체계적 삭제 진행
 */

async function completeDatabaseReset() {
  const client = await pool.connect();
  
  try {
    console.log('🚨 TableLink 데이터베이스 완전 초기화 시작');
    console.log('⚠️  이 작업은 되돌릴 수 없습니다!');
    console.log('📊 모든 데이터, 테이블, 구조가 완전히 삭제됩니다.');
    
    await client.query('BEGIN');

    // 1단계: 현재 DB 상태 분석
    console.log('\n🔍 1단계: 현재 데이터베이스 상태 분석...');
    await analyzeDatabaseState(client);

    // 2단계: 모든 뷰 삭제
    console.log('\n👁️ 2단계: 모든 뷰 삭제...');
    await dropAllViews(client);

    // 3단계: 모든 트리거 삭제  
    console.log('\n⚡ 3단계: 모든 트리거 삭제...');
    await dropAllTriggers(client);

    // 4단계: 모든 함수 삭제
    console.log('\n🔧 4단계: 모든 함수 삭제...');
    await dropAllFunctions(client);

    // 5단계: 모든 테이블 삭제 (CASCADE)
    console.log('\n🗑️ 5단계: 모든 테이블 완전 삭제...');
    await dropAllTables(client);

    // 6단계: 모든 ENUM 타입 삭제
    console.log('\n📋 6단계: 모든 ENUM 타입 삭제...');
    await dropAllEnums(client);

    // 7단계: 모든 시퀀스 삭제
    console.log('\n🔢 7단계: 모든 시퀀스 삭제...');
    await dropAllSequences(client);

    // 8단계: 확장 기능 정리
    console.log('\n🧩 8단계: 확장 기능 정리...');
    await cleanupExtensions(client);

    // 9단계: 최종 검증
    console.log('\n✅ 9단계: 최종 정리 검증...');
    await verifyCleanState(client);

    await client.query('COMMIT');

    console.log('\n🎉 데이터베이스 완전 초기화 성공!');
    console.log('📊 현재 데이터베이스는 완전히 비어있는 상태입니다.');
    console.log('🔄 새로운 스키마를 생성하려면 init-db.js를 실행하세요.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 데이터베이스 초기화 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 현재 DB 상태 분석
async function analyzeDatabaseState(client) {
  try {
    // 테이블 수 확인
    const tablesResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    // 뷰 수 확인
    const viewsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.views 
      WHERE table_schema = 'public'
    `);

    // 함수 수 확인
    const functionsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
    `);

    // ENUM 타입 수 확인
    const enumsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_type 
      WHERE typtype = 'e'
    `);

    console.log(`  📊 테이블: ${tablesResult.rows[0].count}개`);
    console.log(`  👁️ 뷰: ${viewsResult.rows[0].count}개`);
    console.log(`  🔧 함수: ${functionsResult.rows[0].count}개`);
    console.log(`  📋 ENUM 타입: ${enumsResult.rows[0].count}개`);

    // 주요 테이블 데이터 개수 확인
    const mainTables = ['users', 'stores', 'orders', 'checks', 'reviews', 'favorites'];
    
    for (const tableName of mainTables) {
      try {
        const countResult = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public'
        `, [tableName]);

        if (countResult.rows[0].count > 0) {
          const dataResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`  📄 ${tableName}: ${dataResult.rows[0].count}개 레코드`);
        }
      } catch (error) {
        // 테이블이 없으면 무시
      }
    }

  } catch (error) {
    console.error('  ⚠️ DB 상태 분석 중 오류:', error.message);
  }
}

// 모든 뷰 삭제
async function dropAllViews(client) {
  try {
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    let deletedCount = 0;

    for (const view of viewsResult.rows) {
      const viewName = view.table_name;
      
      try {
        await client.query(`DROP VIEW IF EXISTS ${viewName} CASCADE`);
        console.log(`  ✅ 뷰 삭제: ${viewName}`);
        deletedCount++;
      } catch (error) {
        console.warn(`  ⚠️ 뷰 삭제 실패: ${viewName} - ${error.message}`);
      }
    }

    console.log(`  📊 총 ${deletedCount}개 뷰 삭제 완료`);

  } catch (error) {
    console.error('  ❌ 뷰 삭제 중 오류:', error.message);
  }
}

// 모든 트리거 삭제
async function dropAllTriggers(client) {
  try {
    const triggersResult = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY trigger_name
    `);

    let deletedCount = 0;

    for (const trigger of triggersResult.rows) {
      const triggerName = trigger.trigger_name;
      const tableName = trigger.event_object_table;
      
      try {
        await client.query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName} CASCADE`);
        console.log(`  ✅ 트리거 삭제: ${triggerName} (${tableName})`);
        deletedCount++;
      } catch (error) {
        console.warn(`  ⚠️ 트리거 삭제 실패: ${triggerName} - ${error.message}`);
      }
    }

    console.log(`  📊 총 ${deletedCount}개 트리거 삭제 완료`);

  } catch (error) {
    console.error('  ❌ 트리거 삭제 중 오류:', error.message);
  }
}

// 모든 함수 삭제
async function dropAllFunctions(client) {
  try {
    const functionsResult = await client.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);

    let deletedCount = 0;

    for (const func of functionsResult.rows) {
      const functionName = func.routine_name;
      const functionType = func.routine_type;
      
      try {
        await client.query(`DROP ${functionType} IF EXISTS ${functionName}() CASCADE`);
        console.log(`  ✅ ${functionType} 삭제: ${functionName}()`);
        deletedCount++;
      } catch (error) {
        console.warn(`  ⚠️ ${functionType} 삭제 실패: ${functionName} - ${error.message}`);
      }
    }

    console.log(`  📊 총 ${deletedCount}개 함수/프로시저 삭제 완료`);

  } catch (error) {
    console.error('  ❌ 함수 삭제 중 오류:', error.message);
  }
}

// 모든 테이블 삭제
async function dropAllTables(client) {
  try {
    // 모든 테이블 목록 조회 (의존성 순서 고려)
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`  📊 삭제 대상 테이블: ${tablesResult.rows.length}개`);

    let deletedCount = 0;

    // CASCADE로 모든 테이블 삭제
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      try {
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        console.log(`  ✅ 테이블 삭제: ${tableName}`);
        deletedCount++;
      } catch (error) {
        console.warn(`  ⚠️ 테이블 삭제 실패: ${tableName} - ${error.message}`);
      }
    }

    console.log(`  📊 총 ${deletedCount}개 테이블 삭제 완료`);

  } catch (error) {
    console.error('  ❌ 테이블 삭제 중 오류:', error.message);
  }
}

// 모든 ENUM 타입 삭제
async function dropAllEnums(client) {
  try {
    const enumsResult = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e'
      ORDER BY typname
    `);

    let deletedCount = 0;

    for (const enumType of enumsResult.rows) {
      const enumName = enumType.typname;
      
      try {
        await client.query(`DROP TYPE IF EXISTS ${enumName} CASCADE`);
        console.log(`  ✅ ENUM 타입 삭제: ${enumName}`);
        deletedCount++;
      } catch (error) {
        console.warn(`  ⚠️ ENUM 타입 삭제 실패: ${enumName} - ${error.message}`);
      }
    }

    console.log(`  📊 총 ${deletedCount}개 ENUM 타입 삭제 완료`);

  } catch (error) {
    console.error('  ❌ ENUM 타입 삭제 중 오류:', error.message);
  }
}

// 모든 시퀀스 삭제
async function dropAllSequences(client) {
  try {
    const sequencesResult = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name
    `);

    let deletedCount = 0;

    for (const seq of sequencesResult.rows) {
      const sequenceName = seq.sequence_name;
      
      try {
        await client.query(`DROP SEQUENCE IF EXISTS ${sequenceName} CASCADE`);
        console.log(`  ✅ 시퀀스 삭제: ${sequenceName}`);
        deletedCount++;
      } catch (error) {
        console.warn(`  ⚠️ 시퀀스 삭제 실패: ${sequenceName} - ${error.message}`);
      }
    }

    console.log(`  📊 총 ${deletedCount}개 시퀀스 삭제 완료`);

  } catch (error) {
    console.error('  ❌ 시퀀스 삭제 중 오류:', error.message);
  }
}

// 확장 기능 정리
async function cleanupExtensions(client) {
  try {
    console.log('  🧩 설치된 확장 기능 확인...');
    
    const extensionsResult = await client.query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extname != 'plpgsql'
      ORDER BY extname
    `);

    for (const ext of extensionsResult.rows) {
      console.log(`  📦 확장 기능 유지: ${ext.extname}`);
    }

    console.log('  ✅ 확장 기능은 유지됩니다 (필요시 수동 삭제)');

  } catch (error) {
    console.error('  ❌ 확장 기능 확인 중 오류:', error.message);
  }
}

// 최종 검증
async function verifyCleanState(client) {
  try {
    // 테이블 확인
    const tablesCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    // 뷰 확인
    const viewsCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.views 
      WHERE table_schema = 'public'
    `);

    // 함수 확인
    const functionsCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
    `);

    // ENUM 타입 확인
    const enumsCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_type 
      WHERE typtype = 'e'
    `);

    console.log('  📊 정리 후 상태:');
    console.log(`    - 테이블: ${tablesCheck.rows[0].count}개`);
    console.log(`    - 뷰: ${viewsCheck.rows[0].count}개`);
    console.log(`    - 함수: ${functionsCheck.rows[0].count}개`);
    console.log(`    - ENUM 타입: ${enumsCheck.rows[0].count}개`);

    const isClean = tablesCheck.rows[0].count == 0 && 
                   viewsCheck.rows[0].count == 0 && 
                   functionsCheck.rows[0].count == 0 && 
                   enumsCheck.rows[0].count == 0;

    if (isClean) {
      console.log('  ✅ 데이터베이스가 완전히 정리되었습니다!');
    } else {
      console.log('  ⚠️ 일부 객체가 남아있을 수 있습니다.');
    }

  } catch (error) {
    console.error('  ❌ 최종 검증 중 오류:', error.message);
  }
}

// 스크립트 실행
if (require.main === module) {
  completeDatabaseReset()
    .then(() => {
      console.log('\n🎊 TableLink 데이터베이스 완전 초기화 성공!');
      console.log('💡 다음 단계:');
      console.log('   1. node shared/config/init-db.js (기본 스키마 생성)');
      console.log('   2. 또는 scripts/database/full-database-rebuild.js (완전한 스키마 생성)');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 데이터베이스 초기화 실패:', error);
      console.log('🔧 문제 해결 후 다시 시도해주세요.');
      process.exit(1);
    });
}

module.exports = { completeDatabaseReset };
