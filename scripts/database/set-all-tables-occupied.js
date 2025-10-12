
const pool = require('../../src/db/pool');

async function setAllTablesOccupied() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 모든 테이블 상태를 OCCUPIED로 변경 중...');
    
    const result = await client.query(`
      UPDATE store_tables 
      SET status = 'OCCUPIED', updated_at = CURRENT_TIMESTAMP
      RETURNING id, store_id, table_name, status
    `);
    
    console.log(`✅ ${result.rowCount}개 테이블의 상태가 OCCUPIED로 변경되었습니다.`);
    console.log('\n변경된 테이블 목록:');
    result.rows.forEach(row => {
      console.log(`  - 매장 ${row.store_id}, 테이블 ${row.id} (${row.table_name}): ${row.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 테이블 상태 변경 실패:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

setAllTablesOccupied();
