
const pool = require('../../shared/config/database');

async function fixPOSOrderDataConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 POS 주문을 위한 order_data 제약조건 수정 시작...');
    
    await client.query('BEGIN');
    
    // 1. order_data 컬럼을 nullable로 변경
    await client.query(`
      ALTER TABLE orders 
      ALTER COLUMN order_data DROP NOT NULL
    `);
    console.log('✅ orders.order_data 컬럼을 nullable로 변경 완료');
    
    // 2. 기존 OPEN 상태 주문들의 order_data를 기본값으로 설정
    await client.query(`
      UPDATE orders 
      SET order_data = '{}'::jsonb
      WHERE order_data IS NULL AND cooking_status = 'OPEN'
    `);
    console.log('✅ 기존 OPEN 상태 주문들의 order_data 기본값 설정 완료');
    
    await client.query('COMMIT');
    
    // 3. 테이블 구조 확인
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'order_data'
    `);

    console.log('\n📊 수정된 order_data 컬럼 정보:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    console.log('🎉 POS 주문을 위한 order_data 제약조건 수정 완료!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ order_data 제약조건 수정 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 직접 실행
if (require.main === module) {
  fixPOSOrderDataConstraint()
    .then(() => {
      console.log('✅ 마이그레이션 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixPOSOrderDataConstraint };
