
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function showStoresSchema() {
  const client = await pool.connect();
  
  try {
    console.log('📋 stores 테이블 스키마 상세 정보\n');
    
    // 1. 컬럼 정보 조회
    console.log('🔍 1. 컬럼 정보:');
    const columnsResult = await client.query(`
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
    
    if (columnsResult.rows.length === 0) {
      console.log('❌ stores 테이블이 존재하지 않습니다.');
      return;
    }
    
    columnsResult.rows.forEach(col => {
      const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      
      console.log(`  ${col.ordinal_position}. ${col.column_name}`);
      console.log(`     타입: ${col.data_type}${maxLength}`);
      console.log(`     제약: ${nullable}${defaultVal}`);
      console.log('');
    });
    
    // 2. 제약조건 정보 조회
    console.log('🔒 2. 제약조건 정보:');
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
      WHERE tc.table_name = 'stores'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    if (constraintsResult.rows.length > 0) {
      constraintsResult.rows.forEach(constraint => {
        console.log(`  • ${constraint.constraint_type}: ${constraint.constraint_name}`);
        console.log(`    컬럼: ${constraint.column_name}`);
        if (constraint.foreign_table_name) {
          console.log(`    참조: ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        }
        console.log('');
      });
    } else {
      console.log('  제약조건이 없습니다.\n');
    }
    
    // 3. 인덱스 정보 조회
    console.log('📇 3. 인덱스 정보:');
    const indexesResult = await client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'stores'
      ORDER BY indexname
    `);
    
    if (indexesResult.rows.length > 0) {
      indexesResult.rows.forEach(index => {
        console.log(`  • ${index.indexname}`);
        console.log(`    정의: ${index.indexdef}`);
        console.log('');
      });
    } else {
      console.log('  인덱스가 없습니다.\n');
    }
    
    // 4. 테이블 크기 정보
    console.log('📊 4. 테이블 정보:');
    const tableInfoResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE tablename = 'stores'
    `);
    
    if (tableInfoResult.rows.length > 0) {
      const info = tableInfoResult.rows[0];
      console.log(`  스키마: ${info.schemaname}`);
      console.log(`  테이블명: ${info.tablename}`);
      console.log(`  크기: ${info.size}`);
    }
    
    // 5. 데이터 개수
    const countResult = await client.query('SELECT COUNT(*) as count FROM stores');
    console.log(`  레코드 수: ${countResult.rows[0].count}개`);
    
    // 6. 샘플 데이터
    console.log('\n🔬 5. 샘플 데이터 (상위 3개):');
    const sampleResult = await client.query('SELECT * FROM stores ORDER BY id LIMIT 3');
    
    if (sampleResult.rows.length > 0) {
      sampleResult.rows.forEach((row, index) => {
        console.log(`\n  ${index + 1}번째 레코드:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`);
        });
      });
    } else {
      console.log('  샘플 데이터가 없습니다.');
    }
    
    console.log('\n✅ stores 테이블 스키마 분석 완료');
    
  } catch (error) {
    console.error('❌ 스키마 조회 중 오류:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// 실행
showStoresSchema().catch(console.error);
