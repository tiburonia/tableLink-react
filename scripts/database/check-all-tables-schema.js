
const pool = require('../../shared/config/database');

async function checkAllTablesSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 전체 데이터베이스 스키마 확인 및 stores 문제 진단\n');
    
    // 1. 모든 테이블 목록 조회
    console.log('1️⃣ 데이터베이스의 모든 테이블 목록:');
    const tablesResult = await client.query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📋 총 ${tablesResult.rows.length}개 테이블 발견:`);
    tablesResult.rows.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name} (${table.table_type})`);
    });
    
    // 2. stores 테이블 상세 분석
    console.log('\n2️⃣ stores 테이블 상세 분석:');
    
    // stores 테이블 컬럼 구조
    const storesColumns = await client.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      ORDER BY ordinal_position
    `);
    
    if (storesColumns.rows.length === 0) {
      console.log('❌ stores 테이블이 존재하지 않습니다!');
      return;
    }
    
    console.log('📊 stores 테이블 컬럼 구조:');
    storesColumns.rows.forEach(col => {
      const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.ordinal_position}. ${col.column_name}`);
      console.log(`     타입: ${col.data_type}${maxLength}`);
      console.log(`     제약: ${nullable}${defaultVal}`);
    });
    
    // 3. stores와 관련된 모든 외래키 관계 확인
    console.log('\n3️⃣ stores 테이블과 관련된 모든 외래키 관계:');
    
    // stores를 참조하는 외래키들
    const referencingTables = await client.query(`
      SELECT DISTINCT
        tc.table_name,
        kcu.column_name,
        tc.constraint_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'stores'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    console.log('📍 stores를 참조하는 테이블들:');
    if (referencingTables.rows.length > 0) {
      referencingTables.rows.forEach(fk => {
        console.log(`  • ${fk.table_name}.${fk.column_name} → stores.${fk.foreign_column_name}`);
        console.log(`    제약조건: ${fk.constraint_name}`);
      });
    } else {
      console.log('  ⚠️ stores를 참조하는 외래키가 없습니다.');
    }
    
    // stores가 참조하는 외래키들
    const referencedTables = await client.query(`
      SELECT DISTINCT
        tc.table_name,
        kcu.column_name,
        tc.constraint_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'stores'
      ORDER BY kcu.column_name
    `);
    
    console.log('\n📍 stores가 참조하는 테이블들:');
    if (referencedTables.rows.length > 0) {
      referencedTables.rows.forEach(fk => {
        console.log(`  • stores.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        console.log(`    제약조건: ${fk.constraint_name}`);
      });
    } else {
      console.log('  ℹ️ stores가 참조하는 외래키가 없습니다.');
    }
    
    // 4. 각 관련 테이블의 상태 확인
    console.log('\n4️⃣ 관련 테이블들의 상태 확인:');
    
    const relatedTableNames = [...new Set([
      ...referencingTables.rows.map(fk => fk.table_name),
      ...referencedTables.rows.map(fk => fk.foreign_table_name)
    ])];
    
    for (const tableName of relatedTableNames) {
      if (tableName === 'stores') continue;
      
      try {
        // 테이블 존재 확인
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
          console.log(`  ❌ ${tableName}: 테이블이 존재하지 않음`);
          continue;
        }
        
        // 레코드 수 확인
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        
        // store_id 컬럼 존재 확인
        const hasStoreId = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = 'store_id'
          )
        `, [tableName]);
        
        const storeIdInfo = hasStoreId.rows[0].exists ? '✅ store_id 컬럼 존재' : '⚠️ store_id 컬럼 없음';
        
        console.log(`  ✅ ${tableName}: ${countResult.rows[0].count}개 레코드, ${storeIdInfo}`);
        
        // store_id가 있는 경우 무결성 검사
        if (hasStoreId.rows[0].exists) {
          const orphanCheck = await client.query(`
            SELECT COUNT(*) as orphan_count 
            FROM ${tableName} t 
            LEFT JOIN stores s ON t.store_id = s.id 
            WHERE s.id IS NULL
          `);
          
          const orphanCount = parseInt(orphanCheck.rows[0].orphan_count);
          if (orphanCount > 0) {
            console.log(`    ⚠️ 고아 레코드 ${orphanCount}개 발견 (참조하는 stores가 없음)`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ ${tableName}: 확인 중 오류 - ${error.message}`);
      }
    }
    
    // 5. stores 테이블의 데이터 무결성 검사
    console.log('\n5️⃣ stores 테이블 데이터 무결성 검사:');
    
    const storesCount = await client.query('SELECT COUNT(*) as count FROM stores');
    console.log(`  총 stores 레코드: ${storesCount.rows[0].count}개`);
    
    // NULL 값 검사
    const nullChecks = await client.query(`
      SELECT 
        COUNT(CASE WHEN id IS NULL THEN 1 END) as null_ids,
        COUNT(CASE WHEN name IS NULL THEN 1 END) as null_names
      FROM stores
    `);
    
    console.log(`  NULL id: ${nullChecks.rows[0].null_ids}개`);
    console.log(`  NULL name: ${nullChecks.rows[0].null_names}개`);
    
    // 중복 ID 검사
    const duplicateIds = await client.query(`
      SELECT id, COUNT(*) as count 
      FROM stores 
      GROUP BY id 
      HAVING COUNT(*) > 1
      LIMIT 5
    `);
    
    if (duplicateIds.rows.length > 0) {
      console.log(`  ❌ 중복 ID 발견:`);
      duplicateIds.rows.forEach(dup => {
        console.log(`    ID ${dup.id}: ${dup.count}번 중복`);
      });
    } else {
      console.log(`  ✅ ID 중복 없음`);
    }
    
    // 6. 인덱스 및 제약조건 확인
    console.log('\n6️⃣ stores 테이블 인덱스 및 제약조건:');
    
    // 인덱스 확인
    const indexes = await client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'stores'
      ORDER BY indexname
    `);
    
    console.log('📇 인덱스:');
    if (indexes.rows.length > 0) {
      indexes.rows.forEach(idx => {
        console.log(`  • ${idx.indexname}`);
        console.log(`    ${idx.indexdef}`);
      });
    } else {
      console.log('  ⚠️ 인덱스가 없습니다.');
    }
    
    // 제약조건 확인
    const constraints = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'stores'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    console.log('\n🔒 제약조건:');
    if (constraints.rows.length > 0) {
      constraints.rows.forEach(cons => {
        console.log(`  • ${cons.constraint_type}: ${cons.constraint_name}`);
        if (cons.column_name) {
          console.log(`    컬럼: ${cons.column_name}`);
        }
      });
    } else {
      console.log('  ⚠️ 제약조건이 없습니다.');
    }
    
    // 7. 문제 진단 및 권장사항
    console.log('\n7️⃣ 문제 진단 및 권장사항:');
    
    const problems = [];
    
    // Primary Key 확인
    const hasPrimaryKey = constraints.rows.some(c => c.constraint_type === 'PRIMARY KEY');
    if (!hasPrimaryKey) {
      problems.push('❌ PRIMARY KEY가 없습니다.');
    }
    
    // 외래키 문제 확인
    if (referencingTables.rows.length === 0) {
      problems.push('⚠️ stores를 참조하는 외래키가 없어 관계가 끊어져 있을 수 있습니다.');
    }
    
    if (problems.length > 0) {
      console.log('🚨 발견된 문제들:');
      problems.forEach(problem => console.log(`  ${problem}`));
      
      console.log('\n💡 권장 해결방안:');
      console.log('  1. PRIMARY KEY 추가: ALTER TABLE stores ADD CONSTRAINT stores_pkey PRIMARY KEY (id);');
      console.log('  2. 외래키 관계 복원을 위한 스크립트 실행');
      console.log('  3. 데이터 무결성 확인 후 재구축');
    } else {
      console.log('✅ 주요 구조적 문제가 발견되지 않았습니다.');
      console.log('   외래키 클릭 문제는 애플리케이션 레벨에서 발생할 수 있습니다.');
    }
    
    console.log('\n✅ 전체 스키마 확인 완료');
    
  } catch (error) {
    console.error('❌ 스키마 확인 중 오류:', error.message);
    console.error('상세 오류:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// 실행
checkAllTablesSchema().catch(console.error);
