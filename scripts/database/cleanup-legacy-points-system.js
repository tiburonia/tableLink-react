
const pool = require('../../shared/config/database');

async function cleanupLegacyPointsSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 레거시 포인트 시스템 정리 시작...');
    
    // 트랜잭션 시작
    await client.query('BEGIN');
    
    // 1. 레거시 포인트 관련 테이블들 삭제
    console.log('🗑️ 1단계: 레거시 포인트 테이블 삭제...');
    
    const tablesToDrop = [
      'point_transactions',
      'user_points',
      'store_points',
      'loyalty_points',
      'point_history'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`  ✅ ${table} 테이블 삭제 완료`);
      } catch (error) {
        console.log(`  ⚠️ ${table} 테이블 삭제 중 오류 (이미 삭제되었을 수 있음): ${error.message}`);
      }
    }
    
    // 2. users 테이블에서 레거시 포인트 관련 컬럼 삭제
    console.log('🗑️ 2단계: users 테이블에서 레거시 포인트 컬럼 삭제...');
    
    const userColumnsToRemove = [
      'points',
      'total_points',
      'point_balance',
      'loyalty_points',
      'accumulated_points'
    ];
    
    for (const column of userColumnsToRemove) {
      try {
        await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS ${column}`);
        console.log(`  ✅ users.${column} 컬럼 삭제 완료`);
      } catch (error) {
        console.log(`  ⚠️ users.${column} 컬럼 삭제 중 오류: ${error.message}`);
      }
    }
    
    // 3. stores 테이블에서 레거시 포인트 관련 컬럼 삭제
    console.log('🗑️ 3단계: stores 테이블에서 레거시 포인트 컬럼 삭제...');
    
    const storeColumnsToRemove = [
      'point_rate',
      'point_ratio',
      'loyalty_rate',
      'point_multiplier'
    ];
    
    for (const column of storeColumnsToRemove) {
      try {
        await client.query(`ALTER TABLE stores DROP COLUMN IF EXISTS ${column}`);
        console.log(`  ✅ stores.${column} 컬럼 삭제 완료`);
      } catch (error) {
        console.log(`  ⚠️ stores.${column} 컬럼 삭제 중 오류: ${error.message}`);
      }
    }
    
    // 4. orders 테이블에서 레거시 포인트 관련 컬럼 삭제
    console.log('🗑️ 4단계: orders 테이블에서 레거시 포인트 컬럼 삭제...');
    
    const orderColumnsToRemove = [
      'points_earned',
      'points_used',
      'point_discount',
      'loyalty_points_earned'
    ];
    
    for (const column of orderColumnsToRemove) {
      try {
        await client.query(`ALTER TABLE orders DROP COLUMN IF EXISTS ${column}`);
        console.log(`  ✅ orders.${column} 컬럼 삭제 완료`);
      } catch (error) {
        console.log(`  ⚠️ orders.${column} 컬럼 삭제 중 오류: ${error.message}`);
      }
    }
    
    // 5. 레거시 포인트 관련 함수들 삭제
    console.log('🗑️ 5단계: 레거시 포인트 관련 함수 삭제...');
    
    const functionsToRemove = [
      'calculate_points',
      'update_user_points',
      'get_point_balance',
      'add_loyalty_points'
    ];
    
    for (const func of functionsToRemove) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS ${func}() CASCADE`);
        console.log(`  ✅ ${func}() 함수 삭제 완료`);
      } catch (error) {
        console.log(`  ⚠️ ${func}() 함수 삭제 중 오류: ${error.message}`);
      }
    }
    
    // 6. 레거시 포인트 관련 트리거 삭제
    console.log('🗑️ 6단계: 레거시 포인트 관련 트리거 삭제...');
    
    const triggersToRemove = [
      'point_calculation_trigger',
      'loyalty_update_trigger',
      'point_balance_trigger'
    ];
    
    for (const trigger of triggersToRemove) {
      try {
        await client.query(`DROP TRIGGER IF EXISTS ${trigger} ON orders CASCADE`);
        await client.query(`DROP TRIGGER IF EXISTS ${trigger} ON users CASCADE`);
        console.log(`  ✅ ${trigger} 트리거 삭제 완료`);
      } catch (error) {
        console.log(`  ⚠️ ${trigger} 트리거 삭제 중 오류: ${error.message}`);
      }
    }
    
    // 7. 현재 테이블 상태 확인
    console.log('📊 7단계: 현재 테이블 상태 확인...');
    
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%point%'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('⚠️ 남아있는 포인트 관련 테이블들:');
      tableCheck.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('✅ 포인트 관련 테이블이 모두 정리되었습니다');
    }
    
    // 커밋
    await client.query('COMMIT');
    console.log('✅ 레거시 포인트 시스템 정리 완료!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 레거시 포인트 시스템 정리 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  cleanupLegacyPointsSystem()
    .then(() => {
      console.log('🎉 레거시 포인트 시스템 정리 스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = cleanupLegacyPointsSystem;
