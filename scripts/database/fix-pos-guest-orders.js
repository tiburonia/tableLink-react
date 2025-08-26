
const pool = require('../../shared/config/database');

async function fixPOSGuestOrders() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 POS 게스트 주문 지원을 위한 orders 테이블 수정 시작...');
    
    await client.query('BEGIN');
    
    // guest_phone 컬럼 추가 (이미 있다면 스킵)
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(20)
    `);
    console.log('✅ orders.guest_phone 컬럼 추가 완료');
    
    // 기존 제약조건 제거
    await client.query(`
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS chk_orders_user_or_guest
    `);
    console.log('✅ 기존 제약조건 제거 완료');
    
    // 새로운 제약조건 추가 (익명 주문 허용)
    await client.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT chk_orders_user_or_guest 
      CHECK (
        (user_id IS NOT NULL) OR 
        (guest_phone IS NOT NULL AND guest_phone != '') OR
        (user_id IS NULL AND guest_phone IS NULL)
      )
    `);
    console.log('✅ 새로운 제약조건 추가 완료 (익명 주문 허용)');
    
    // guest_phone 인덱스 추가
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_guest_phone ON orders(guest_phone);
    `);
    console.log('✅ guest_phone 인덱스 추가 완료');
    
    await client.query('COMMIT');
    
    // 테이블 구조 확인
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);

    console.log('\n📊 수정된 orders 테이블 구조:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // 제약조건 확인 (PostgreSQL 호환성 개선)
    const constraintsResult = await client.query(`
      SELECT conname, 
             CASE WHEN pg_get_constraintdef(oid) IS NOT NULL 
                  THEN pg_get_constraintdef(oid) 
                  ELSE 'N/A' 
             END as definition
      FROM pg_constraint 
      WHERE conrelid = 'orders'::regclass 
      AND contype = 'c'
    `);
    
    console.log('\n📋 orders 테이블 제약조건:');
    constraintsResult.rows.forEach(constraint => {
      console.log(`  - ${constraint.conname}: ${constraint.definition}`);
    });
    
    console.log('🎉 POS 게스트 주문 지원 수정 완료!');
    console.log('✅ 이제 전화번호 없는 익명 주문도 가능합니다.');
    process.exit(0);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ orders 테이블 수정 실패:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

fixPOSGuestOrders();
