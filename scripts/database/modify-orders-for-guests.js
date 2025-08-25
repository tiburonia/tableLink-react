
const pool = require('../../shared/config/database');

async function modifyOrdersForGuests() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 orders 테이블 guests 지원을 위한 수정 시작...');
    
    await client.query('BEGIN');
    
    // guest_id 컬럼 추가
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS guest_id INTEGER,
      ADD CONSTRAINT fk_orders_guest_id 
      FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL
    `);
    console.log('✅ orders.guest_id 컬럼 추가 완료');
    
    // order_source ENUM 타입 생성
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE order_source_enum AS ENUM ('TLL', 'POS_MEMBER', 'POS_GUEST');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ order_source_enum 타입 생성 완료');
    
    // order_source 컬럼 추가
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS order_source order_source_enum DEFAULT 'TLL'
    `);
    console.log('✅ orders.order_source 컬럼 추가 완료');
    
    // user_id NULL 허용으로 변경 (게스트 주문 허용)
    await client.query(`
      ALTER TABLE orders 
      ALTER COLUMN user_id DROP NOT NULL
    `);
    console.log('✅ orders.user_id NULL 허용 변경 완료');
    
    // CHECK 제약조건 추가 (user_id 또는 guest_id 중 하나는 반드시 있어야 함)
    await client.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT chk_orders_user_or_guest 
      CHECK (
        (user_id IS NOT NULL AND guest_id IS NULL) OR 
        (user_id IS NULL AND guest_id IS NOT NULL)
      )
    `);
    console.log('✅ orders user_id/guest_id 제약조건 추가 완료');
    
    // 인덱스 추가
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_guest_id ON orders(guest_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_order_source ON orders(order_source);
    `);
    
    console.log('✅ orders 테이블 인덱스 추가 완료');
    
    // 기존 데이터 order_source 업데이트
    await client.query(`
      UPDATE orders 
      SET order_source = CASE 
        WHEN user_id IS NOT NULL THEN 'TLL'::order_source_enum
        ELSE 'TLL'::order_source_enum
      END
      WHERE order_source IS NULL
    `);
    console.log('✅ 기존 데이터 order_source 업데이트 완료');
    
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
    
    console.log('🎉 orders 테이블 guests 지원 수정 완료!');
    process.exit(0);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ orders 테이블 수정 실패:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

modifyOrdersForGuests();
