
const pool = require('../../shared/config/database');

async function updateOrdersTable() {
  try {
    console.log('🔄 orders 테이블 스키마 업데이트 시작...');

    // 기존 컬럼 확인
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);

    console.log('📋 현재 orders 테이블 컬럼:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // 필요한 컬럼들 추가 (이미 존재하면 무시)
    console.log('➕ 새로운 컬럼들 추가 중...');

    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS original_amount INTEGER
    `);
    console.log('✅ original_amount 컬럼 추가');

    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS used_point INTEGER DEFAULT 0
    `);
    console.log('✅ used_point 컬럼 추가');

    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS coupon_discount INTEGER DEFAULT 0
    `);
    console.log('✅ coupon_discount 컬럼 추가');

    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS table_unique_id VARCHAR(50)
    `);
    console.log('✅ table_unique_id 컬럼 추가');

    // 기존 데이터가 있다면 original_amount를 total_amount 값으로 초기화
    await pool.query(`
      UPDATE orders 
      SET original_amount = total_amount 
      WHERE original_amount IS NULL AND total_amount IS NOT NULL
    `);
    console.log('✅ 기존 데이터의 original_amount 초기화');

    // final_amount가 없다면 total_amount 값으로 초기화
    await pool.query(`
      UPDATE orders 
      SET final_amount = total_amount 
      WHERE final_amount IS NULL AND total_amount IS NOT NULL
    `);
    console.log('✅ 기존 데이터의 final_amount 초기화');

    // 인덱스 추가
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_table_unique_id ON orders(table_unique_id);
    `);
    console.log('✅ table_unique_id 인덱스 추가');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_original_amount ON orders(original_amount);
    `);
    console.log('✅ original_amount 인덱스 추가');

    // 업데이트 후 테이블 구조 확인
    const updatedColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);

    console.log('\n📊 업데이트된 orders 테이블 구조:');
    updatedColumnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // 데이터 개수 확인
    const countResult = await pool.query('SELECT COUNT(*) as total FROM orders');
    console.log(`\n📋 총 주문 데이터: ${countResult.rows[0].total}개`);

    console.log('🎉 orders 테이블 업데이트 완료!');
    process.exit(0);

  } catch (error) {
    console.error('❌ orders 테이블 업데이트 실패:', error);
    process.exit(1);
  }
}

updateOrdersTable();
