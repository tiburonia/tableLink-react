
const pool = require('../../shared/config/database');

async function fixCookingStatusConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 orders 테이블 cooking_status 제약조건 수정 시작...');
    
    await client.query('BEGIN');
    
    // 1. 기존 제약조건 제거
    console.log('🗑️ 기존 chk_orders_cooking_status 제약조건 제거...');
    
    await client.query(`
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS chk_orders_cooking_status
    `);
    
    console.log('✅ 기존 제약조건 제거 완료');
    
    // 2. 새로운 제약조건 추가 (EXPIRED 상태 포함)
    console.log('➕ 새로운 cooking_status 제약조건 추가...');
    
    await client.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT chk_orders_cooking_status 
      CHECK (
        cooking_status IN (
          'PENDING', 'COOKING', 'COMPLETED', 'CANCELLED', 
          'OPEN', 'CLOSED', 'EXPIRED', 'FORCE_CLOSED', 'ARCHIVED', 'TABLE_RELEASED'
        )
      )
    `);
    
    console.log('✅ 새로운 제약조건 추가 완료');
    
    // 3. 기존 EXPIRED 상태의 주문들 확인 및 수정
    console.log('🔍 기존 EXPIRED 상태 주문 확인...');
    
    const expiredOrders = await client.query(`
      SELECT id, cooking_status, table_number, total_amount
      FROM orders 
      WHERE cooking_status = 'EXPIRED'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📊 EXPIRED 상태 주문: ${expiredOrders.rows.length}개`);
    
    if (expiredOrders.rows.length > 0) {
      // EXPIRED 주문들의 order_items도 함께 정리
      await client.query(`
        UPDATE order_items 
        SET cooking_status = 'CANCELLED',
            completed_at = CURRENT_TIMESTAMP
        WHERE order_id IN (
          SELECT id FROM orders WHERE cooking_status = 'EXPIRED'
        )
        AND cooking_status NOT IN ('CANCELLED', 'COMPLETED')
      `);
      
      console.log('✅ EXPIRED 주문의 order_items 정리 완료');
    }
    
    await client.query('COMMIT');
    console.log('✅ cooking_status 제약조건 수정 완료');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ cooking_status 제약조건 수정 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  fixCookingStatusConstraint()
    .then(() => {
      console.log('✅ cooking_status 제약조건 수정 스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixCookingStatusConstraint };
