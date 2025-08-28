
const pool = require('../../shared/config/database');

async function addUserPaidOrderIdToOrders() {
  const client = await pool.connect();
  
  try {
    console.log('📝 orders 테이블에 user_paid_order_id 컬럼 추가 시작...');
    
    await client.query('BEGIN');
    
    // 1. user_paid_order_id 컬럼 추가
    console.log('➕ user_paid_order_id 컬럼 추가 중...');
    
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'user_paid_order_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE orders 
        ADD COLUMN user_paid_order_id INTEGER REFERENCES user_paid_orders(id) ON DELETE CASCADE
      `);
      console.log('✅ user_paid_order_id 컬럼 추가 완료');
    } else {
      console.log('✅ user_paid_order_id 컬럼이 이미 존재');
    }
    
    // 2. 인덱스 추가
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_paid_order_id 
      ON orders(user_paid_order_id)
    `);
    console.log('✅ user_paid_order_id 인덱스 추가 완료');
    
    // 3. 제약조건 추가 (paid_order_id 또는 user_paid_order_id 중 하나는 있어야 함)
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'orders' 
      AND constraint_name = 'chk_orders_payment_reference'
    `);
    
    if (constraintCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT chk_orders_payment_reference 
        CHECK (
          (paid_order_id IS NOT NULL AND user_paid_order_id IS NULL) OR
          (paid_order_id IS NULL AND user_paid_order_id IS NOT NULL) OR
          (paid_order_id IS NULL AND user_paid_order_id IS NULL)
        )
      `);
      console.log('✅ 결제 참조 제약조건 추가 완료');
    } else {
      console.log('✅ 결제 참조 제약조건이 이미 존재');
    }
    
    await client.query('COMMIT');
    
    // 4. 테이블 구조 확인
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('paid_order_id', 'user_paid_order_id')
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 orders 테이블 결제 참조 컬럼:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n🎉 orders 테이블 user_paid_order_id 컬럼 추가 완료!');
    console.log('📋 이제 다음과 같이 사용됩니다:');
    console.log('   - TL회원 주문: user_paid_order_id 참조');
    console.log('   - 비회원/POS 주문: paid_order_id 참조');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ orders 테이블 수정 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  addUserPaidOrderIdToOrders()
    .then(() => {
      console.log('🎉 작업 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { addUserPaidOrderIdToOrders };
