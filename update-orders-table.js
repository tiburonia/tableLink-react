
const pool = require('./shared/config/database');

async function updateOrdersTable() {
  try {
    console.log('🔄 orders 테이블 업데이트 시작...');

    // table_unique_id 컬럼 추가
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS table_unique_id VARCHAR(50)
    `);

    // 인덱스 추가
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_table_unique_id ON orders(table_unique_id);
    `);

    console.log('✅ orders 테이블에 table_unique_id 컬럼 추가 완료');
    process.exit(0);

  } catch (error) {
    console.error('❌ orders 테이블 업데이트 실패:', error);
    process.exit(1);
  }
}

updateOrdersTable();
