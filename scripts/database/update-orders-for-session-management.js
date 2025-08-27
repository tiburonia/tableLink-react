
const pool = require('../../shared/config/database');

async function updateOrdersForSessionManagement() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 orders 테이블을 세션 관리용으로 업데이트 시작...');
    
    await client.query('BEGIN');
    
    // 1. cooking_status에 OPEN, CLOSED 상태 추가
    console.log('📋 cooking_status에 세션 상태 추가 중...');
    
    await client.query(`
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS chk_orders_cooking_status
    `);
    
    await client.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT chk_orders_cooking_status 
      CHECK (cooking_status IN ('OPEN', 'PENDING', 'COOKING', 'COMPLETED', 'CLOSED', 'ARCHIVED', 'TABLE_RELEASED'))
    `);
    console.log('✅ cooking_status 제약조건 업데이트 완료');
    
    // 2. session_started_at 컬럼 추가 (세션 시작 시점 추적)
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMP
    `);
    console.log('✅ session_started_at 컬럼 추가 완료');
    
    // 3. paid_order_id 컬럼을 nullable로 변경 (세션 진행 중에는 null)
    await client.query(`
      ALTER TABLE orders 
      ALTER COLUMN paid_order_id DROP NOT NULL
    `);
    console.log('✅ paid_order_id 컬럼을 nullable로 변경 완료');
    
    // 4. order_items 테이블에서 paid_order_id 컬럼 제거 (불필요해짐)
    await client.query(`
      ALTER TABLE order_items 
      DROP COLUMN IF EXISTS paid_order_id
    `);
    console.log('✅ order_items.paid_order_id 컬럼 제거 완료');
    
    // 5. 인덱스 추가
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_session_status ON orders(store_id, table_number, cooking_status);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_session_started ON orders(session_started_at);
    `);
    console.log('✅ 세션 관리용 인덱스 추가 완료');
    
    // 6. 기존 데이터 마이그레이션 (PENDING 상태를 OPEN으로 변경)
    const updateResult = await client.query(`
      UPDATE orders 
      SET cooking_status = 'OPEN',
          session_started_at = COALESCE(created_at, CURRENT_TIMESTAMP)
      WHERE cooking_status = 'PENDING'
    `);
    console.log(`✅ 기존 PENDING 주문 ${updateResult.rowCount}개를 OPEN 세션으로 변경 완료`);
    
    await client.query('COMMIT');
    
    // 7. 테이블 구조 확인
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);

    console.log('\n📊 업데이트된 orders 테이블 구조:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // 제약조건 확인
    const constraintsResult = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'orders'::regclass 
      AND contype = 'c'
    `);
    
    console.log('\n📋 orders 테이블 제약조건:');
    constraintsResult.rows.forEach(constraint => {
      console.log(`  - ${constraint.conname}: ${constraint.definition}`);
    });
    
    console.log('🎉 orders 테이블 세션 관리 업데이트 완료!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ orders 테이블 업데이트 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  updateOrdersForSessionManagement()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = updateOrdersForSessionManagement;
