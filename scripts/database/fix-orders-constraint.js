
const pool = require('../../shared/config/database');

async function fixOrdersConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 orders 테이블 제약조건 수정 시작...');
    
    await client.query('BEGIN');
    
    // 1. 기존 제약조건 제거
    console.log('🗑️ 기존 chk_orders_payment_reference 제약조건 제거...');
    
    await client.query(`
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS chk_orders_payment_reference
    `);
    
    console.log('✅ 기존 제약조건 제거 완료');
    
    // 2. 기존 데이터 상태 확인
    console.log('📊 기존 orders 데이터 상태 확인...');
    
    const dataCheckResult = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN paid_order_id IS NOT NULL THEN 1 END) as has_paid_order_id,
        COUNT(CASE WHEN user_paid_order_id IS NOT NULL THEN 1 END) as has_user_paid_order_id,
        COUNT(CASE WHEN paid_order_id IS NOT NULL AND user_paid_order_id IS NOT NULL THEN 1 END) as has_both,
        COUNT(CASE WHEN paid_order_id IS NULL AND user_paid_order_id IS NULL THEN 1 END) as has_neither
      FROM orders
    `);
    
    const stats = dataCheckResult.rows[0];
    console.log('📊 데이터 상태:');
    console.log(`  - 전체 주문: ${stats.total_orders}개`);
    console.log(`  - paid_order_id 있음: ${stats.has_paid_order_id}개`);
    console.log(`  - user_paid_order_id 있음: ${stats.has_user_paid_order_id}개`);
    console.log(`  - 둘 다 있음: ${stats.has_both}개`);
    console.log(`  - 둘 다 없음: ${stats.has_neither}개`);
    
    // 3. 문제가 되는 데이터 확인 (둘 다 있는 경우)
    if (parseInt(stats.has_both) > 0) {
      console.log('⚠️ 둘 다 있는 주문 데이터 확인...');
      
      const problematicOrders = await client.query(`
        SELECT id, paid_order_id, user_paid_order_id, customer_name, created_at
        FROM orders 
        WHERE paid_order_id IS NOT NULL AND user_paid_order_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      console.log(`🔍 문제 데이터 ${problematicOrders.rows.length}개 발견:`);
      problematicOrders.rows.forEach(row => {
        console.log(`  - ID ${row.id}: paid_order_id=${row.paid_order_id}, user_paid_order_id=${row.user_paid_order_id}, 고객=${row.customer_name}`);
      });
      
      // 4. user_paid_order_id가 있는 경우 paid_order_id를 NULL로 설정
      console.log('🔄 TL회원 주문의 paid_order_id를 NULL로 설정...');
      
      const updateResult = await client.query(`
        UPDATE orders 
        SET paid_order_id = NULL 
        WHERE paid_order_id IS NOT NULL AND user_paid_order_id IS NOT NULL
        RETURNING id, user_paid_order_id, customer_name
      `);
      
      console.log(`✅ ${updateResult.rows.length}개 주문의 paid_order_id를 NULL로 설정 완료`);
      updateResult.rows.forEach(row => {
        console.log(`  - 주문 ID ${row.id}: user_paid_order_id=${row.user_paid_order_id}, 고객=${row.customer_name}`);
      });
    }
    
    // 5. 데이터 정리 후 상태 재확인
    console.log('📊 데이터 정리 후 상태 재확인...');
    
    const afterCleanupResult = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN paid_order_id IS NOT NULL AND user_paid_order_id IS NULL THEN 1 END) as only_paid_order,
        COUNT(CASE WHEN paid_order_id IS NULL AND user_paid_order_id IS NOT NULL THEN 1 END) as only_user_paid_order,
        COUNT(CASE WHEN paid_order_id IS NULL AND user_paid_order_id IS NULL THEN 1 END) as neither,
        COUNT(CASE WHEN paid_order_id IS NOT NULL AND user_paid_order_id IS NOT NULL THEN 1 END) as both_should_be_zero
      FROM orders
    `);
    
    const afterStats = afterCleanupResult.rows[0];
    console.log('📊 정리 후 데이터 상태:');
    console.log(`  - 전체 주문: ${afterStats.total_orders}개`);
    console.log(`  - 비회원 주문 (paid_order_id만): ${afterStats.only_paid_order}개`);
    console.log(`  - TL회원 주문 (user_paid_order_id만): ${afterStats.only_user_paid_order}개`);
    console.log(`  - 아직 결제되지 않은 주문 (둘 다 NULL): ${afterStats.neither}개`);
    console.log(`  - 둘 다 있음 (문제): ${afterStats.both_should_be_zero}개`);
    
    // 6. 새로운 제약조건 추가
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
    
    // 7. 제약조건 확인
    const constraintCheck = await client.query(`
      SELECT conname as constraint_name, 
             pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'orders'::regclass 
      AND conname = 'chk_orders_payment_reference'
    `);
    
    if (constraintCheck.rows.length > 0) {
      console.log('✅ 제약조건 적용 확인:', constraintCheck.rows[0].constraint_name);
      console.log('📋 제약조건 정의:', constraintCheck.rows[0].definition);
    }
    
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
