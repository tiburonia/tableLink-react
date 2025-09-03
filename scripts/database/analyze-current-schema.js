
const pool = require('../../shared/config/database');

async function analyzeCurrentSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 실시간 데이터베이스 스키마 완전 분석\n');
    
    // 1. 모든 테이블 목록
    console.log('1️⃣ 데이터베이스의 모든 테이블:');
    const tablesResult = await client.query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📋 총 ${tablesResult.rows.length}개 테이블:`);
    tablesResult.rows.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    // 2. 각 테이블의 상세 컬럼 정보
    console.log('\n2️⃣ 각 테이블의 상세 컬럼 구조:');
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      console.log(`\n📊 ${tableName} 테이블:`);
      
      // 컬럼 정보
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      if (columnsResult.rows.length > 0) {
        columnsResult.rows.forEach(col => {
          const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  ${col.ordinal_position}. ${col.column_name} - ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
        });
        
        // 레코드 수 확인
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`  📈 레코드 수: ${countResult.rows[0].count}개`);
        } catch (error) {
          console.log(`  ⚠️ 레코드 수 확인 실패: ${error.message}`);
        }
      } else {
        console.log(`  ❌ 컬럼 정보를 찾을 수 없습니다.`);
      }
    }
    
    // 3. 외래키 관계 매핑
    console.log('\n3️⃣ 외래키 관계 매핑:');
    
    const foreignKeysResult = await client.query(`
      SELECT 
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
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    if (foreignKeysResult.rows.length > 0) {
      foreignKeysResult.rows.forEach(fk => {
        console.log(`  🔗 ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log(`  ⚠️ 외래키 관계가 없습니다.`);
    }
    
    // 4. 인덱스 정보
    console.log('\n4️⃣ 인덱스 정보:');
    
    const indexesResult = await client.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    if (indexesResult.rows.length > 0) {
      let currentTable = '';
      indexesResult.rows.forEach(idx => {
        if (currentTable !== idx.tablename) {
          currentTable = idx.tablename;
          console.log(`\n  📇 ${currentTable} 테이블 인덱스:`);
        }
        console.log(`    • ${idx.indexname}`);
      });
    } else {
      console.log(`  ⚠️ 인덱스가 없습니다.`);
    }
    
    // 5. 주요 테이블 샘플 데이터
    console.log('\n5️⃣ 주요 테이블 샘플 데이터:');
    
    const mainTables = ['stores', 'users', 'orders', 'menu_items'];
    
    for (const tableName of mainTables) {
      const tableExists = tablesResult.rows.some(t => t.table_name === tableName);
      
      if (tableExists) {
        console.log(`\n  📋 ${tableName} 샘플 데이터 (상위 3개):`);
        try {
          const sampleResult = await client.query(`SELECT * FROM ${tableName} ORDER BY id LIMIT 3`);
          
          if (sampleResult.rows.length > 0) {
            sampleResult.rows.forEach((row, index) => {
              console.log(`    ${index + 1}번째 레코드:`);
              Object.entries(row).forEach(([key, value]) => {
                const displayValue = value ? (typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : value.toString().substring(0, 50)) : 'NULL';
                console.log(`      ${key}: ${displayValue}`);
              });
            });
          } else {
            console.log(`    데이터가 없습니다.`);
          }
        } catch (error) {
          console.log(`    ⚠️ 샘플 데이터 조회 실패: ${error.message}`);
        }
      } else {
        console.log(`\n  ❌ ${tableName} 테이블이 존재하지 않습니다.`);
      }
    }
    
    // 6. 데이터베이스 전체 통계
    console.log('\n6️⃣ 데이터베이스 전체 통계:');
    
    // 전체 테이블 수
    console.log(`  📊 총 테이블 수: ${tablesResult.rows.length}개`);
    
    // 전체 외래키 수
    console.log(`  🔗 총 외래키 수: ${foreignKeysResult.rows.length}개`);
    
    // 전체 인덱스 수
    console.log(`  📇 총 인덱스 수: ${indexesResult.rows.length}개`);
    
    // 데이터베이스 크기
    try {
      const sizeResult = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      console.log(`  💾 데이터베이스 크기: ${sizeResult.rows[0].size}`);
    } catch (error) {
      console.log(`  ⚠️ 데이터베이스 크기 확인 실패: ${error.message}`);
    }
    
    console.log('\n✅ 스키마 분석 완료!');
    
  } catch (error) {
    console.error('❌ 스키마 분석 중 오류:', error.message);
    console.error('상세 오류:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// 실행
analyzeCurrentSchema().catch(console.error);
