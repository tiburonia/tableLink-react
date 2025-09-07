
const pool = require('../../shared/config/database');

/**
 * 데이터베이스 완전 초기화 스크립트 (PostGIS 호환)
 * - 시스템 뷰/확장 기능 보호
 * - 트랜잭션 분리로 안전한 삭제
 * - 단계별 검증
 */

async function completeDatabaseReset() {
  console.log('🚨 TableLink 데이터베이스 완전 초기화 시작');
  console.log('⚠️  이 작업은 되돌릴 수 없습니다!');
  console.log('📊 모든 사용자 데이터와 테이블이 완전히 삭제됩니다.');
  
  try {
    // 1단계: 현재 DB 상태 분석
    console.log('\n🔍 1단계: 현재 데이터베이스 상태 분석...');
    await analyzeDatabaseState();

    // 2단계: 사용자 데이터 삭제
    console.log('\n🗂️ 2단계: 모든 사용자 데이터 삭제...');
    await deleteAllUserData();

    // 3단계: 사용자 테이블 삭제 (의존성 순서)
    console.log('\n🗑️ 3단계: 사용자 테이블 삭제...');
    await dropUserTables();

    // 4단계: 사용자 뷰 삭제
    console.log('\n👁️ 4단계: 사용자 뷰 삭제...');
    await dropUserViews();

    // 5단계: 사용자 ENUM 타입 삭제
    console.log('\n📋 5단계: 사용자 ENUM 타입 삭제...');
    await dropUserEnums();

    // 6단계: 사용자 함수 삭제
    console.log('\n🔧 6단계: 사용자 함수 삭제...');
    await dropUserFunctions();

    // 7단계: 최종 정리 및 검증
    console.log('\n✅ 7단계: 최종 정리 및 검증...');
    await finalCleanupAndVerify();

    console.log('\n🎉 데이터베이스 완전 초기화 성공!');
    console.log('📊 현재 데이터베이스는 완전히 비어있는 상태입니다.');
    console.log('🔄 새로운 스키마를 생성하려면 다음 명령을 실행하세요:');
    console.log('   node shared/config/init-db.js');

  } catch (error) {
    console.error('\n❌ 데이터베이스 초기화 실패:', error);
    throw error;
  }
}

// 현재 DB 상태 분석
async function analyzeDatabaseState() {
  try {
    // 사용자 테이블 수 확인
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
    `);

    // 사용자 뷰 수 확인
    const viewsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      AND table_name NOT IN ('geography_columns', 'geometry_columns')
    `);

    // 사용자 ENUM 타입 수 확인
    const enumsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_type 
      WHERE typtype = 'e'
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);

    console.log(`  📊 사용자 테이블: ${tablesResult.rows[0].count}개`);
    console.log(`  👁️ 사용자 뷰: ${viewsResult.rows[0].count}개`);
    console.log(`  📋 사용자 ENUM 타입: ${enumsResult.rows[0].count}개`);

    // 주요 테이블 데이터 개수 확인
    const mainTables = ['users', 'stores', 'orders', 'checks', 'reviews', 'favorites'];
    
    for (const tableName of mainTables) {
      try {
        const countResult = await pool.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public'
        `, [tableName]);

        if (countResult.rows[0].count > 0) {
          const dataResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
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

// 모든 사용자 데이터 삭제
async function deleteAllUserData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 데이터 삭제 순서 (외래키 의존성 고려)
    const deleteOrder = [
      'webhook_events', 'notifications', 'kds_screen_stations', 'terminals',
      'staff_roles', 'staff', 'carts', 'favorites', 'reviews', 'promotions',
      'coupon_issues', 'points_ledger', 'user_store_stats', 'qr_sessions',
      'qr_codes', 'waitlists', 'reservations', 'order_events', 
      'payment_allocations', 'payments', 'adjustments', 'line_options',
      'order_lines', 'orders', 'checks', 'print_jobs', 'printers',
      'item_option_groups', 'options', 'option_groups', 'menu_items',
      'menu_groups', 'prep_stations', 'store_holidays', 'store_hours',
      'store_tables', 'store_address', 'stores', 'guests', 'users',
      'user_paid_orders', 'paid_orders', 'order_items', 'daily_stats'
    ];

    let deletedTablesCount = 0;

    for (const tableName of deleteOrder) {
      try {
        // 테이블 존재 여부 확인
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1 AND table_schema = 'public'
          )
        `, [tableName]);

        if (tableExists.rows[0].exists) {
          // 데이터 개수 확인 후 삭제
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const recordCount = countResult.rows[0].count;

          if (recordCount > 0) {
            await client.query(`DELETE FROM ${tableName}`);
            console.log(`  ✅ ${tableName}: ${recordCount}개 레코드 삭제`);
          } else {
            console.log(`  ℹ️ ${tableName}: 데이터 없음`);
          }
          deletedTablesCount++;
        }
      } catch (error) {
        console.warn(`  ⚠️ ${tableName} 데이터 삭제 실패: ${error.message}`);
      }
    }

    await client.query('COMMIT');
    console.log(`  📊 총 ${deletedTablesCount}개 테이블 데이터 삭제 완료`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('  ❌ 데이터 삭제 중 오류:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 사용자 테이블 삭제
async function dropUserTables() {
  const client = await pool.connect();
  
  try {
    // 사용자 테이블 목록 조회 (시스템 테이블 제외)
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('spatial_ref_sys')
      ORDER BY table_name
    `);

    console.log(`  📊 삭제 대상 테이블: ${tablesResult.rows.length}개`);

    let deletedCount = 0;

    // 각 테이블을 개별 트랜잭션으로 삭제
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      try {
        await client.query('BEGIN');
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        await client.query('COMMIT');
        console.log(`  ✅ 테이블 삭제: ${tableName}`);
        deletedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.warn(`  ⚠️ 테이블 삭제 실패: ${tableName} - ${error.message}`);
      }
    }

    console.log(`  📊 총 ${deletedCount}개 테이블 삭제 완료`);

  } catch (error) {
    console.error('  ❌ 테이블 삭제 중 오류:', error.message);
  } finally {
    client.release();
  }
}

// 사용자 뷰 삭제
async function dropUserViews() {
  const client = await pool.connect();
  
  try {
    const viewsResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      AND table_name NOT IN ('geography_columns', 'geometry_columns')
      ORDER BY table_name
    `);

    let deletedCount = 0;

    for (const view of viewsResult.rows) {
      const viewName = view.table_name;
      
      try {
        await client.query('BEGIN');
        await client.query(`DROP VIEW IF EXISTS ${viewName} CASCADE`);
        await client.query('COMMIT');
        console.log(`  ✅ 뷰 삭제: ${viewName}`);
        deletedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.warn(`  ⚠️ 뷰 삭제 실패: ${viewName} - ${error.message}`);
      }
    }

    console.log(`  📊 총 ${deletedCount}개 뷰 삭제 완료`);

  } catch (error) {
    console.error('  ❌ 뷰 삭제 중 오류:', error.message);
  } finally {
    client.release();
  }
}

// 사용자 ENUM 타입 삭제
async function dropUserEnums() {
  const client = await pool.connect();
  
  try {
    const enumsResult = await pool.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e'
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY typname
    `);

    let deletedCount = 0;

    for (const enumType of enumsResult.rows) {
      const enumName = enumType.typname;
      
      try {
        await client.query('BEGIN');
        await client.query(`DROP TYPE IF EXISTS ${enumName} CASCADE`);
        await client.query('COMMIT');
        console.log(`  ✅ ENUM 타입 삭제: ${enumName}`);
        deletedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.warn(`  ⚠️ ENUM 타입 삭제 실패: ${enumName} - ${error.message}`);
      }
    }

    console.log(`  📊 총 ${deletedCount}개 ENUM 타입 삭제 완료`);

  } catch (error) {
    console.error('  ❌ ENUM 타입 삭제 중 오류:', error.message);
  } finally {
    client.release();
  }
}

// 사용자 함수 삭제
async function dropUserFunctions() {
  const client = await pool.connect();
  
  try {
    // PostGIS 시스템 함수 제외하고 사용자 함수만 조회
    const functionsResult = await pool.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name NOT LIKE 'st_%'
      AND routine_name NOT LIKE 'geometry_%'
      AND routine_name NOT LIKE 'geography_%'
      AND routine_name NOT LIKE '_st_%'
      ORDER BY routine_name
    `);

    let deletedCount = 0;

    for (const func of functionsResult.rows) {
      const functionName = func.routine_name;
      const functionType = func.routine_type;
      
      try {
        await client.query('BEGIN');
        await client.query(`DROP ${functionType} IF EXISTS ${functionName}() CASCADE`);
        await client.query('COMMIT');
        console.log(`  ✅ ${functionType} 삭제: ${functionName}()`);
        deletedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.warn(`  ⚠️ ${functionType} 삭제 실패: ${functionName} - ${error.message}`);
      }
    }

    console.log(`  📊 총 ${deletedCount}개 함수/프로시저 삭제 완료`);

  } catch (error) {
    console.error('  ❌ 함수 삭제 중 오류:', error.message);
  } finally {
    client.release();
  }
}

// 최종 정리 및 검증
async function finalCleanupAndVerify() {
  try {
    // 사용자 테이블 확인
    const tablesCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name NOT IN ('spatial_ref_sys')
    `);

    // 사용자 뷰 확인
    const viewsCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      AND table_name NOT IN ('geography_columns', 'geometry_columns')
    `);

    // 사용자 ENUM 타입 확인
    const enumsCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_type 
      WHERE typtype = 'e'
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);

    console.log('  📊 정리 후 상태:');
    console.log(`    - 사용자 테이블: ${tablesCheck.rows[0].count}개`);
    console.log(`    - 사용자 뷰: ${viewsCheck.rows[0].count}개`);
    console.log(`    - 사용자 ENUM 타입: ${enumsCheck.rows[0].count}개`);

    const isClean = tablesCheck.rows[0].count == 0 && 
                   viewsCheck.rows[0].count == 0 && 
                   enumsCheck.rows[0].count == 0;

    if (isClean) {
      console.log('  ✅ 데이터베이스가 완전히 정리되었습니다!');
      console.log('  🛡️ PostGIS 시스템 구성 요소는 보존되었습니다.');
    } else {
      console.log('  ⚠️ 일부 사용자 객체가 남아있을 수 있습니다.');
      
      // 남은 객체 목록 표시
      if (tablesCheck.rows[0].count > 0) {
        const remainingTables = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name NOT IN ('spatial_ref_sys')
        `);
        console.log('  📋 남은 테이블:', remainingTables.rows.map(r => r.table_name).join(', '));
      }
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
      console.log('   2. 또는 node scripts/database/full-database-rebuild.js (완전한 스키마 생성)');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 데이터베이스 초기화 실패:', error);
      console.log('🔧 문제 해결 후 다시 시도해주세요.');
      process.exit(1);
    });
}

module.exports = { completeDatabaseReset };
