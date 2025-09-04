
const pool = require('../../src/db/pool');

async function exportPsqlStyleSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 PostgreSQL \\d 스타일 스키마 출력');
    console.log('=====================================\n');

    // \d (모든 테이블 목록)
    console.log('\\d');
    console.log('                 List of relations');
    console.log(' Schema |      Name       | Type  | Owner ');
    console.log('--------+-----------------+-------+-------');
    
    const tablesResult = await client.query(`
      SELECT 
        schemaname as schema,
        tablename as name,
        'table' as type
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    tablesResult.rows.forEach(table => {
      const schema = table.schema.padEnd(6);
      const name = table.name.padEnd(15);
      const type = table.type.padEnd(5);
      console.log(` ${schema} | ${name} | ${type} | user`);
    });
    
    console.log(`(${tablesResult.rows.length} rows)\n`);

    // 각 테이블에 대해 \d [테이블명] 형태로 출력
    for (const table of tablesResult.rows) {
      const tableName = table.name;
      
      console.log(`\\d ${tableName}`);
      console.log(`                    Table "public.${tableName}"`);
      console.log('  Column   |          Type          | Collation | Nullable | Default ');
      console.log('-----------+------------------------+-----------+----------+---------');
      
      // 컬럼 정보
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      columnsResult.rows.forEach(col => {
        let typeInfo = col.data_type;
        
        // 타입 정보 포맷팅
        if (col.character_maximum_length) {
          typeInfo += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision) {
          typeInfo += `(${col.numeric_precision}`;
          if (col.numeric_scale && col.numeric_scale > 0) {
            typeInfo += `,${col.numeric_scale}`;
          }
          typeInfo += ')';
        }
        
        const colName = col.column_name.padEnd(9);
        const colType = typeInfo.padEnd(22);
        const nullable = col.is_nullable === 'YES' ? '' : 'not null';
        const defaultVal = col.column_default || '';
        
        console.log(` ${colName} | ${colType} |           | ${nullable.padEnd(8)} | ${defaultVal}`);
      });
      
      // 인덱스 정보
      const indexesResult = await client.query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1 AND indexname != $1 || '_pkey'
        ORDER BY indexname
      `, [tableName]);
      
      if (indexesResult.rows.length > 0) {
        console.log('\nIndexes:');
        indexesResult.rows.forEach(index => {
          console.log(`    "${index.indexname}" ${index.indexdef.split('USING')[1] || ''}`);
        });
      }
      
      // 외래키 제약조건
      const foreignKeysResult = await client.query(`
        SELECT 
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
        ORDER BY kcu.column_name
      `, [tableName]);
      
      if (foreignKeysResult.rows.length > 0) {
        console.log('\nForeign-key constraints:');
        foreignKeysResult.rows.forEach(fk => {
          console.log(`    "${fk.constraint_name}" FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name})`);
        });
      }
      
      // 참조하는 외래키들
      const referencedByResult = await client.query(`
        SELECT 
          tc.table_name,
          tc.constraint_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = $1
        ORDER BY tc.table_name, kcu.column_name
      `, [tableName]);
      
      if (referencedByResult.rows.length > 0) {
        console.log('\nReferenced by:');
        referencedByResult.rows.forEach(ref => {
          console.log(`    TABLE "${ref.table_name}" CONSTRAINT "${ref.constraint_name}" FOREIGN KEY (${ref.column_name})`);
        });
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    }

    // \dn (스키마 목록)
    console.log('\\dn');
    console.log('    List of schemas');
    console.log('  Name  |  Owner   ');
    console.log('--------+----------');
    console.log(' public | user');
    console.log('(1 row)\n');

    // \df (함수 목록)
    console.log('\\df');
    const functionsResult = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);
    
    if (functionsResult.rows.length > 0) {
      console.log('                            List of functions');
      console.log(' Schema |    Name    | Result data type | Argument data types | Type ');
      console.log('--------+------------+------------------+---------------------+------');
      
      functionsResult.rows.forEach(func => {
        const schema = 'public'.padEnd(6);
        const name = func.routine_name.padEnd(10);
        const resultType = (func.data_type || '').padEnd(16);
        const type = func.routine_type.toLowerCase().padEnd(4);
        console.log(` ${schema} | ${name} | ${resultType} |                     | ${type}`);
      });
      console.log(`(${functionsResult.rows.length} rows)\n`);
    } else {
      console.log('                            List of functions');
      console.log(' Schema | Name | Result data type | Argument data types | Type ');
      console.log('--------+------+------------------+---------------------+------');
      console.log('(0 rows)\n');
    }

    // 시퀀스 목록 (\ds)
    console.log('\\ds');
    const sequencesResult = await client.query(`
      SELECT sequence_name
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name
    `);
    
    if (sequencesResult.rows.length > 0) {
      console.log('          List of relations');
      console.log(' Schema |     Name      | Type     | Owner ');
      console.log('--------+---------------+----------+-------');
      
      sequencesResult.rows.forEach(seq => {
        const schema = 'public'.padEnd(6);
        const name = seq.sequence_name.padEnd(13);
        console.log(` ${schema} | ${name} | sequence | user`);
      });
      console.log(`(${sequencesResult.rows.length} rows)\n`);
    } else {
      console.log('Did not find any relations.\n');
    }

    console.log('✅ PostgreSQL \\d 스타일 스키마 출력 완료!');
    console.log('📄 위 내용을 복사해서 텍스트 파일로 저장하여 종이로 출력할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 스키마 출력 실패:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

exportPsqlStyleSchema().catch(console.error);
