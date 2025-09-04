
const pool = require('../../shared/config/database');
const fs = require('fs');
const path = require('path');

async function exportCompleteSchema() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Complete PostgreSQL Schema Export');
    console.log('=====================================\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(__dirname, `../../backups/schema-export-${timestamp}.txt`);
    
    let output = '';
    
    function addToOutput(text) {
      console.log(text);
      output += text + '\n';
    }
    
    addToOutput('🔍 COMPLETE DATABASE SCHEMA DOCUMENTATION');
    addToOutput('=========================================');
    addToOutput(`Generated: ${new Date().toLocaleString()}`);
    addToOutput(`Database: public schema\n`);

    // 1. 데이터베이스 정보
    addToOutput('1️⃣ DATABASE INFORMATION');
    addToOutput('========================');
    
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_schema() as current_schema,
        version() as postgresql_version
    `);
    
    addToOutput(`Database Name: ${dbInfo.rows[0].database_name}`);
    addToOutput(`Current Schema: ${dbInfo.rows[0].current_schema}`);
    addToOutput(`PostgreSQL Version: ${dbInfo.rows[0].postgresql_version}\n`);

    // 2. 모든 테이블 목록
    addToOutput('2️⃣ ALL TABLES');
    addToOutput('==============');
    
    const tablesResult = await client.query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    addToOutput(`Total Tables: ${tablesResult.rows.length}\n`);
    
    tablesResult.rows.forEach((table, index) => {
      addToOutput(`${index + 1}. ${table.table_name} (${table.table_type})`);
    });
    addToOutput('');

    // 3. 각 테이블의 상세 구조
    addToOutput('3️⃣ DETAILED TABLE STRUCTURES');
    addToOutput('=============================\n');

    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      addToOutput(`TABLE: ${tableName.toUpperCase()}`);
      addToOutput(''.padStart(tableName.length + 7, '='));
      
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
      
      addToOutput('\nColumns:');
      addToOutput('--------');
      
      columnsResult.rows.forEach(col => {
        let typeInfo = col.data_type;
        if (col.character_maximum_length) {
          typeInfo += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision) {
          typeInfo += `(${col.numeric_precision}`;
          if (col.numeric_scale) {
            typeInfo += `,${col.numeric_scale}`;
          }
          typeInfo += ')';
        }
        
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        
        addToOutput(`  ${col.ordinal_position}. ${col.column_name}`);
        addToOutput(`     Type: ${typeInfo}`);
        addToOutput(`     Constraint: ${nullable}${defaultVal}`);
      });
      
      // 제약조건
      const constraintsResult = await client.query(`
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = $1
        ORDER BY tc.constraint_type, tc.constraint_name
      `, [tableName]);
      
      if (constraintsResult.rows.length > 0) {
        addToOutput('\nConstraints:');
        addToOutput('------------');
        constraintsResult.rows.forEach(constraint => {
          addToOutput(`  • ${constraint.constraint_type}: ${constraint.constraint_name}`);
          if (constraint.column_name) {
            addToOutput(`    Column: ${constraint.column_name}`);
          }
          if (constraint.foreign_table_name) {
            addToOutput(`    References: ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
          }
        });
      }
      
      // 인덱스
      const indexesResult = await client.query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1
        ORDER BY indexname
      `, [tableName]);
      
      if (indexesResult.rows.length > 0) {
        addToOutput('\nIndexes:');
        addToOutput('--------');
        indexesResult.rows.forEach(index => {
          addToOutput(`  • ${index.indexname}`);
          addToOutput(`    Definition: ${index.indexdef}`);
        });
      }
      
      // 테이블 통계
      try {
        const statsResult = await client.query(`
          SELECT 
            pg_size_pretty(pg_total_relation_size($1)) as table_size,
            (SELECT COUNT(*) FROM ${tableName}) as row_count
        `, [tableName]);
        
        addToOutput('\nStatistics:');
        addToOutput('-----------');
        addToOutput(`  Size: ${statsResult.rows[0].table_size}`);
        addToOutput(`  Rows: ${statsResult.rows[0].row_count}`);
      } catch (error) {
        addToOutput('\nStatistics: Unable to retrieve');
      }
      
      addToOutput('\n' + ''.padStart(80, '-') + '\n');
    }

    // 4. 외래키 관계 전체 맵
    addToOutput('4️⃣ FOREIGN KEY RELATIONSHIPS');
    addToOutput('=============================\n');
    
    const foreignKeysResult = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    if (foreignKeysResult.rows.length > 0) {
      addToOutput(`Total Foreign Key Relationships: ${foreignKeysResult.rows.length}\n`);
      
      foreignKeysResult.rows.forEach((fk, index) => {
        addToOutput(`${index + 1}. ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        addToOutput(`   Constraint: ${fk.constraint_name}`);
      });
    } else {
      addToOutput('No foreign key relationships found.');
    }
    addToOutput('');

    // 5. 시퀀스 정보
    addToOutput('5️⃣ SEQUENCES');
    addToOutput('=============\n');
    
    const sequencesResult = await client.query(`
      SELECT 
        sequence_name,
        data_type,
        start_value,
        minimum_value,
        maximum_value,
        increment
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name
    `);
    
    if (sequencesResult.rows.length > 0) {
      sequencesResult.rows.forEach((seq, index) => {
        addToOutput(`${index + 1}. ${seq.sequence_name}`);
        addToOutput(`   Type: ${seq.data_type}`);
        addToOutput(`   Start: ${seq.start_value}, Min: ${seq.minimum_value}, Max: ${seq.maximum_value}`);
        addToOutput(`   Increment: ${seq.increment}`);
      });
    } else {
      addToOutput('No sequences found.');
    }
    addToOutput('');

    // 6. 뷰 정보
    addToOutput('6️⃣ VIEWS');
    addToOutput('=========\n');
    
    const viewsResult = await client.query(`
      SELECT 
        table_name as view_name,
        view_definition
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (viewsResult.rows.length > 0) {
      viewsResult.rows.forEach((view, index) => {
        addToOutput(`${index + 1}. ${view.view_name}`);
        addToOutput(`   Definition: ${view.view_definition.substring(0, 200)}...`);
      });
    } else {
      addToOutput('No views found.');
    }
    addToOutput('');

    // 7. 함수 및 트리거
    addToOutput('7️⃣ FUNCTIONS & TRIGGERS');
    addToOutput('=======================\n');
    
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
      addToOutput('Functions:');
      functionsResult.rows.forEach((func, index) => {
        addToOutput(`  ${index + 1}. ${func.routine_name} (${func.routine_type}) → ${func.data_type}`);
      });
    }
    
    const triggersResult = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY trigger_name
    `);
    
    if (triggersResult.rows.length > 0) {
      addToOutput('\nTriggers:');
      triggersResult.rows.forEach((trigger, index) => {
        addToOutput(`  ${index + 1}. ${trigger.trigger_name}`);
        addToOutput(`     Event: ${trigger.event_manipulation} on ${trigger.event_object_table}`);
        addToOutput(`     Action: ${trigger.action_statement.substring(0, 100)}...`);
      });
    }
    addToOutput('');

    // 8. 전체 요약
    addToOutput('8️⃣ SCHEMA SUMMARY');
    addToOutput('=================\n');
    
    addToOutput(`📊 Database Statistics:`);
    addToOutput(`   • Total Tables: ${tablesResult.rows.length}`);
    addToOutput(`   • Total Foreign Keys: ${foreignKeysResult.rows.length}`);
    addToOutput(`   • Total Sequences: ${sequencesResult.rows.length}`);
    addToOutput(`   • Total Views: ${viewsResult.rows.length}`);
    addToOutput(`   • Total Functions: ${functionsResult.rows.length}`);
    addToOutput(`   • Total Triggers: ${triggersResult.rows.length}`);
    
    // 정규화 수준 평가
    const normalizationRatio = Math.round((foreignKeysResult.rows.length / tablesResult.rows.length) * 100);
    addToOutput(`   • Normalization Level: ${normalizationRatio}%`);
    
    if (normalizationRatio > 70) {
      addToOutput(`   • Assessment: Highly Normalized ✅`);
    } else if (normalizationRatio > 40) {
      addToOutput(`   • Assessment: Moderately Normalized ⚠️`);
    } else {
      addToOutput(`   • Assessment: Low Normalization ❌`);
    }
    
    addToOutput(`\n📝 Export completed at: ${new Date().toLocaleString()}`);
    addToOutput(`📄 Documentation saved to: ${outputFile}`);

    // 파일로 저장
    const backupDir = path.dirname(outputFile);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(outputFile, output, 'utf8');
    
    console.log(`\n✅ Schema documentation exported successfully!`);
    console.log(`📄 File saved: ${outputFile}`);
    console.log(`📝 You can now print this file for physical documentation.`);
    
  } catch (error) {
    console.error('❌ Schema export failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// 실행
exportCompleteSchema().catch(console.error);
