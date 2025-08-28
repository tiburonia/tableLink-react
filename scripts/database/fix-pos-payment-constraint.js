
const pool = require('../../shared/config/database');

async function fixPOSPaymentConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 orders 테이블 결제 참조 제약조건 수정 시작...');
    
    await client.query('BEGIN');
    
    // 1. 기존 제약조건 제거
    console.log('🗑️ 기존 chk_orders_payment_reference 제약조건 제거...');
    
    await client.query(`
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS chk_orders_payment_reference
    `);
    
    console.log('✅ 기존 제약조건 제거 완료');
    
    // 2. 새로운 제약조건 추가 (TL회원은 both 허용)
    console.log('➕ 새로운 결제 참조 제약조건 추가...');
    
    await client.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT chk_orders_payment_reference 
      CHECK (
        -- 비회원 POS 주문: paid_order_id만
        (paid_order_id IS NOT NULL AND user_paid_order_id IS NULL) OR
        -- TL회원 POS 주문: 둘 다 가능
        (paid_order_id IS NOT NULL AND user_paid_order_id IS NOT NULL) OR
        -- 아직 결제되지 않은 주문: 둘 다 NULL
        (paid_order_id IS NULL AND user_paid_order_id IS NULL)
      )
    `);
    
    console.log('✅ 새로운 제약조건 추가 완료');
    
    // 3. 제약조건 확인
    const constraintCheck = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'chk_orders_payment_reference'
    `);
    
    if (constraintCheck.rows.length > 0) {
      console.log('✅ 제약조건 적용 확인:', constraintCheck.rows[0].constraint_name);
    }
    
    await client.query('COMMIT');
    
    console.log('🎉 orders 테이블 결제 참조 제약조건 수정 완료!');
    console.log('📋 이제 다음과 같이 사용됩니다:');
    console.log('  - 비회원 POS: paid_order_id만');
    console.log('  - TL회원 POS: paid_order_id + user_paid_order_id 둘 다');
    console.log('  - 미결제 주문: 둘 다 NULL');
    
    process.exit(0);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 제약조건 수정 실패:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

fixPOSPaymentConstraint();
