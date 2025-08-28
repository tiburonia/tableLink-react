
const pool = require('../../shared/config/database');

async function fixOrdersConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 orders 테이블 제약조건 수정 시작...');
    
    await client.query('BEGIN');
    
    // 기존 제약조건 제거
    console.log('🗑️ 기존 chk_orders_payment_reference 제약조건 제거...');
    
    await client.query(`
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS chk_orders_payment_reference
    `);
    
    console.log('✅ 기존 제약조건 제거 완료');
    
    // 새로운 제약조건 추가 (TL회원은 user_paid_order_id만 허용)
    console.log('➕ 새로운 결제 참조 제약조건 추가...');
    
    await client.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT chk_orders_payment_reference 
      CHECK (
        -- 비회원 주문: paid_order_id만
        (paid_order_id IS NOT NULL AND user_paid_order_id IS NULL) OR
        -- TL회원 주문: user_paid_order_id만
        (paid_order_id IS NULL AND user_paid_order_id IS NOT NULL) OR
        -- 아직 결제되지 않은 주문: 둘 다 NULL (POS 주문 등)
        (paid_order_id IS NULL AND user_paid_order_id IS NULL)
      )
    `);
    
    console.log('✅ 새로운 제약조건 추가 완료');
    
    await client.query('COMMIT');
    
    console.log('🎉 orders 테이블 결제 참조 제약조건 수정 완료!');
    console.log('📋 이제 다음과 같이 사용됩니다:');
    console.log('  - 비회원: paid_order_id만');
    console.log('  - TL회원: user_paid_order_id만');
    console.log('  - POS 주문: 둘 다 NULL (나중에 결제 연결)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ orders 테이블 제약조건 수정 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  fixOrdersConstraint()
    .then(() => {
      console.log('🎉 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixOrdersConstraint };
