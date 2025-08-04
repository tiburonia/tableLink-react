
const pool = require('./shared/config/database');

async function fixPaymentIssue() {
  try {
    console.log('🔧 결제 처리 오류 수정 시작...');

    // store_tables 테이블에 unique_id 컬럼 추가
    await pool.query(`
      ALTER TABLE store_tables 
      ADD COLUMN IF NOT EXISTS unique_id VARCHAR(50) UNIQUE
    `);
    console.log('✅ store_tables에 unique_id 컬럼 추가 완료');

    // 기존 테이블들에 unique_id 생성
    const existingTables = await pool.query(`
      SELECT id, store_id, table_number, table_name 
      FROM store_tables 
      WHERE unique_id IS NULL
    `);

    for (const table of existingTables.rows) {
      let uniqueId;
      
      // 테이블 이름에 따라 unique_id 생성
      if (table.table_name.includes('vip룸')) {
        const vipNum = table.table_name.match(/\d+/)[0];
        uniqueId = `store_${table.store_id}_vip_${vipNum}`;
      } else if (table.table_name.includes('커플석')) {
        const coupleNum = table.table_name.match(/\d+/)[0];
        uniqueId = `store_${table.store_id}_couple_${coupleNum}`;
      } else if (table.table_name.includes('단체석')) {
        uniqueId = `store_${table.store_id}_group_1`;
      } else {
        uniqueId = `store_${table.store_id}_table_${table.table_number}`;
      }

      await pool.query(`
        UPDATE store_tables 
        SET unique_id = $1 
        WHERE id = $2
      `, [uniqueId, table.id]);
    }

    console.log('✅ 기존 테이블들에 unique_id 추가 완료');

    // orders 테이블에 table_unique_id 컬럼 추가
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS table_unique_id VARCHAR(50)
    `);
    console.log('✅ orders에 table_unique_id 컬럼 추가 완료');

    // 인덱스 추가
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_store_tables_unique_id ON store_tables(unique_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_table_unique_id ON orders(table_unique_id);
    `);

    console.log('✅ 인덱스 추가 완료');
    console.log('🎉 결제 처리 오류 수정 완료!');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ 결제 처리 오류 수정 실패:', error);
    process.exit(1);
  }
}

fixPaymentIssue();
