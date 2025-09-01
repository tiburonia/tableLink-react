
const pool = require('../../shared/config/database');

async function compareStoresSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 stores 테이블과 stores_backup 스키마 비교\n');
    
    // 1. stores 테이블 스키마 조회
    console.log('1️⃣ 현재 stores 테이블 스키마:');
    const storesColumns = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      ORDER BY ordinal_position
    `);
    
    if (storesColumns.rows.length === 0) {
      console.log('❌ stores 테이블이 존재하지 않습니다.');
    } else {
      storesColumns.rows.forEach(col => {
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.ordinal_position}. ${col.column_name} - ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
      });
    }
    
    // 2. stores_backup 테이블 스키마 조회
    console.log('\n2️⃣ stores_backup 테이블 스키마:');
    const backupColumns = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'stores_backup' 
      ORDER BY ordinal_position
    `);
    
    if (backupColumns.rows.length === 0) {
      console.log('❌ stores_backup 테이블이 존재하지 않습니다.');
    } else {
      backupColumns.rows.forEach(col => {
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.ordinal_position}. ${col.column_name} - ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
      });
    }
    
    // 3. 스키마 차이점 분석
    console.log('\n3️⃣ 스키마 차이점 분석:');
    
    const storesSet = new Set(storesColumns.rows.map(col => col.column_name));
    const backupSet = new Set(backupColumns.rows.map(col => col.column_name));
    
    // stores에만 있는 컬럼들
    const storesOnly = [...storesSet].filter(col => !backupSet.has(col));
    if (storesOnly.length > 0) {
      console.log('📝 현재 stores에만 있는 컬럼들:');
      storesOnly.forEach(col => console.log(`  + ${col}`));
    }
    
    // backup에만 있는 컬럼들
    const backupOnly = [...backupSet].filter(col => !storesSet.has(col));
    if (backupOnly.length > 0) {
      console.log('📝 stores_backup에만 있는 컬럼들:');
      backupOnly.forEach(col => console.log(`  - ${col}`));
    }
    
    // 공통 컬럼들
    const commonColumns = [...storesSet].filter(col => backupSet.has(col));
    if (commonColumns.length > 0) {
      console.log('📝 공통 컬럼들:');
      commonColumns.forEach(col => console.log(`  = ${col}`));
    }
    
    // 4. 데이터 개수 확인
    console.log('\n4️⃣ 데이터 개수 확인:');
    
    const storesCount = await client.query('SELECT COUNT(*) as count FROM stores');
    console.log(`  stores: ${storesCount.rows[0].count}개 레코드`);
    
    const backupCount = await client.query('SELECT COUNT(*) as count FROM stores_backup');
    console.log(`  stores_backup: ${backupCount.rows[0].count}개 레코드`);
    
    // 5. 백업 데이터 샘플 확인
    if (backupColumns.rows.length > 0) {
      console.log('\n5️⃣ stores_backup 샘플 데이터:');
      const sampleData = await client.query('SELECT * FROM stores_backup ORDER BY id LIMIT 3');
      
      sampleData.rows.forEach((row, index) => {
        console.log(`\n  ${index + 1}번째 레코드:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`);
        });
      });
    }
    
    console.log('\n✅ 스키마 비교 완료');
    
  } catch (error) {
    console.error('❌ 스키마 비교 중 오류:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// 실행
compareStoresSchema().catch(console.error);
