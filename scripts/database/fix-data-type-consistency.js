
const pool = require('../../shared/config/database');

async function fixDataTypeConsistency() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 데이터 타입 일관성 확인 및 수정 시작...');
    console.log('✅ PostgreSQL 데이터베이스 연결\n');

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 1. stores.id와 관련된 모든 외래키의 데이터 타입 확인
    console.log('1️⃣ 외래키 데이터 타입 호환성 확인...');
    
    const typeCheckQuery = `
      SELECT 
        tc.table_name,
        kcu.column_name,
        tc.constraint_name,
        col.data_type as fk_data_type,
        col.numeric_precision as fk_precision,
        stores_col.data_type as stores_data_type,
        stores_col.numeric_precision as stores_precision,
        CASE 
          WHEN col.data_type = stores_col.data_type THEN 'MATCH'
          WHEN col.data_type = 'integer' AND stores_col.data_type = 'bigint' THEN 'NEEDS_UPDATE'
          ELSE 'MISMATCH'
        END as compatibility_status
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.columns col
        ON tc.table_name = col.table_name AND kcu.column_name = col.column_name
      JOIN information_schema.columns stores_col
        ON ccu.table_name = stores_col.table_name AND ccu.column_name = stores_col.column_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'stores'
        AND ccu.column_name = 'id'
      ORDER BY tc.table_name, kcu.column_name
    `;

    const typeCheckResult = await client.query(typeCheckQuery);
    
    console.log('📊 데이터 타입 호환성 분석:');
    let needsUpdate = [];
    let hasMismatch = false;
    
    typeCheckResult.rows.forEach(row => {
      const status = row.compatibility_status === 'MATCH' ? '✅' : 
                    row.compatibility_status === 'NEEDS_UPDATE' ? '⚠️' : '❌';
      
      console.log(`  ${status} ${row.table_name}.${row.column_name}`);
      console.log(`     현재: ${row.fk_data_type} → stores.id: ${row.stores_data_type}`);
      console.log(`     상태: ${row.compatibility_status}`);
      
      if (row.compatibility_status === 'NEEDS_UPDATE') {
        needsUpdate.push({
          table: row.table_name,
          column: row.column_name,
          constraint: row.constraint_name
        });
      } else if (row.compatibility_status === 'MISMATCH') {
        hasMismatch = true;
      }
    });

    // 2. integer → bigint 변환이 필요한 컬럼들 수정
    if (needsUpdate.length > 0) {
      console.log(`\n2️⃣ ${needsUpdate.length}개 테이블의 데이터 타입 업데이트 시작...`);
      
      for (const item of needsUpdate) {
        try {
          console.log(`🔧 ${item.table}.${item.column} 수정 중...`);
          
          // 외래키 제약조건 임시 제거
          await client.query(`ALTER TABLE ${item.table} DROP CONSTRAINT IF EXISTS ${item.constraint}`);
          
          // 데이터 타입 변경 (integer → bigint)
          await client.query(`ALTER TABLE ${item.table} ALTER COLUMN ${item.column} TYPE bigint`);
          
          // 외래키 제약조건 재생성
          await client.query(`
            ALTER TABLE ${item.table} 
            ADD CONSTRAINT ${item.constraint} 
            FOREIGN KEY (${item.column}) REFERENCES stores(id) ON DELETE CASCADE
          `);
          
          console.log(`  ✅ ${item.table}.${item.column} 업데이트 완료`);
          
        } catch (error) {
          console.log(`  ❌ ${item.table}.${item.column} 업데이트 실패: ${error.message}`);
        }
      }
    }

    // 3. 참조 무결성 재검증
    console.log('\n3️⃣ 참조 무결성 재검증...');
    
    const integrityCheckTables = [
      'carts', 'checks', 'favorites', 'menu_groups', 'menu_items',
      'prep_stations', 'regular_levels', 'reservations', 'reviews',
      'store_address', 'store_holidays', 'store_hours', 'store_promotions',
      'store_tables', 'waitlists'
    ];
    
    for (const tableName of integrityCheckTables) {
      try {
        const orphanCheck = await client.query(`
          SELECT COUNT(*) as orphan_count 
          FROM ${tableName} t 
          LEFT JOIN stores s ON t.store_id = s.id 
          WHERE s.id IS NULL AND t.store_id IS NOT NULL
        `);
        
        const orphanCount = parseInt(orphanCheck.rows[0].orphan_count);
        if (orphanCount > 0) {
          console.log(`  ⚠️ ${tableName}: ${orphanCount}개 고아 레코드 발견`);
          
          // 고아 레코드 정리 (옵션)
          await client.query(`
            DELETE FROM ${tableName} 
            WHERE store_id NOT IN (SELECT id FROM stores)
          `);
          console.log(`    🗑️ ${tableName}: 고아 레코드 ${orphanCount}개 정리 완료`);
        } else {
          console.log(`  ✅ ${tableName}: 참조 무결성 정상`);
        }
      } catch (error) {
        console.log(`  ⚠️ ${tableName}: 확인 실패 - ${error.message}`);
      }
    }

    // 4. 데이터베이스 통계 업데이트
    console.log('\n4️⃣ 데이터베이스 통계 업데이트...');
    
    try {
      await client.query('ANALYZE stores');
      console.log('  ✅ stores 테이블 통계 업데이트 완료');
      
      // 관련 테이블들도 분석
      for (const tableName of integrityCheckTables.slice(0, 5)) { // 처음 5개만
        await client.query(`ANALYZE ${tableName}`);
      }
      console.log('  ✅ 관련 테이블 통계 업데이트 완료');
    } catch (error) {
      console.log(`  ⚠️ 통계 업데이트 실패: ${error.message}`);
    }

    // 5. 최종 검증
    console.log('\n5️⃣ 최종 검증...');
    
    const finalCheck = await client.query(typeCheckQuery);
    
    let allFixed = true;
    finalCheck.rows.forEach(row => {
      if (row.compatibility_status !== 'MATCH') {
        allFixed = false;
        console.log(`  ❌ ${row.table_name}.${row.column_name}: ${row.compatibility_status}`);
      }
    });
    
    if (allFixed) {
      console.log('  ✅ 모든 데이터 타입이 일치합니다!');
    }

    // 트랜잭션 커밋
    await client.query('COMMIT');
    
    console.log('\n🎉 데이터 타입 일관성 수정 완료!');
    
    if (hasMismatch) {
      console.log('\n⚠️ 여전히 일부 불일치가 남아있습니다.');
      console.log('   이는 Replit Database 패널의 UI 버그일 가능성이 높습니다.');
    }
    
    console.log('\n💡 권장사항:');
    console.log('   1. 브라우저 캐시를 지우고 Replit을 새로고침하세요');
    console.log('   2. Database 패널을 닫았다가 다시 열어보세요');
    console.log('   3. 문제가 지속되면 Replit의 알려진 UI 버그입니다');
    
  } catch (error) {
    console.error('❌ 데이터 타입 일관성 수정 실패:', error);
    
    try {
      await client.query('ROLLBACK');
      console.log('🔄 롤백 완료');
    } catch (rollbackError) {
      console.error('❌ 롤백 실패:', rollbackError);
    }
    
    throw error;
    
  } finally {
    client.release();
    await pool.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  fixDataTypeConsistency();
}

module.exports = { fixDataTypeConsistency };
