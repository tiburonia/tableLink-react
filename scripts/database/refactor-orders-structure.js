
const pool = require('../../shared/config/database');

async function refactorOrdersStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 orders 테이블 구조 리팩토링 시작...');
    
    await client.query('BEGIN');
    
    // 1. 기존 orders 테이블 백업
    console.log('💾 기존 orders 테이블 백업 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders_backup AS 
      SELECT * FROM orders
    `);
    console.log('✅ orders_backup 테이블 생성 완료');
    
    // 2. paid_orders 테이블 생성
    console.log('💳 paid_orders 테이블 생성 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS paid_orders (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        user_id VARCHAR(50),
        guest_phone VARCHAR(20) DEFAULT NULL,
        table_number INTEGER,
        order_data JSONB NOT NULL,
        original_amount INTEGER NOT NULL,
        used_point INTEGER DEFAULT 0,
        coupon_discount INTEGER DEFAULT 0,
        final_amount INTEGER NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'card',
        payment_status VARCHAR(20) DEFAULT 'completed',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        order_source VARCHAR(20) DEFAULT 'TLL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ paid_orders 테이블 생성 완료');
    
    // 3. 새로운 orders 테이블 구조로 재생성 (KDS용)
    console.log('🍳 새로운 orders 테이블 구조 생성 중...');
    
    // 기존 orders 테이블 삭제 (백업은 이미 완료)
    await client.query(`DROP TABLE IF EXISTS orders CASCADE`);
    
    // 새로운 orders 테이블 생성 (KDS 제조상태 관리용)
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        paid_order_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        table_number INTEGER,
        customer_name VARCHAR(100) DEFAULT '손님',
        order_data JSONB NOT NULL,
        total_amount INTEGER NOT NULL,
        cooking_status VARCHAR(20) DEFAULT 'PENDING',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        estimated_time INTEGER,
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paid_order_id) REFERENCES paid_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ 새로운 orders 테이블 생성 완료');
    
    // 4. order_items 테이블 수정 (paid_order_id 추가)
    console.log('🍽️ order_items 테이블 구조 수정 중...');
    await client.query(`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS paid_order_id INTEGER,
      ADD CONSTRAINT fk_order_items_paid_order 
      FOREIGN KEY (paid_order_id) REFERENCES paid_orders(id) ON DELETE CASCADE
    `);
    console.log('✅ order_items 테이블 수정 완료');
    
    // 5. 인덱스 생성
    console.log('📊 인덱스 생성 중...');
    
    // paid_orders 인덱스
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_paid_orders_store_id ON paid_orders(store_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_paid_orders_user_id ON paid_orders(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_paid_orders_guest_phone ON paid_orders(guest_phone);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_paid_orders_payment_date ON paid_orders(payment_date);
    `);
    
    // orders 인덱스
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_paid_order_id ON orders(paid_order_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_cooking_status ON orders(cooking_status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    `);
    
    // order_items 인덱스
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_paid_order_id ON order_items(paid_order_id);
    `);
    
    console.log('✅ 인덱스 생성 완료');
    
    // 6. 트리거 생성 (updated_at 자동 업데이트)
    console.log('⚡ 트리거 생성 중...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_paid_orders_updated_at ON paid_orders;
      CREATE TRIGGER update_paid_orders_updated_at
        BEFORE UPDATE ON paid_orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
      CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('✅ 트리거 생성 완료');
    
    // 7. 제약조건 추가
    console.log('🔒 제약조건 추가 중...');
    
    // paid_orders: user_id 또는 guest_phone 중 하나는 있어야 함 (익명 주문도 허용)
    await client.query(`
      ALTER TABLE paid_orders 
      ADD CONSTRAINT chk_paid_orders_customer 
      CHECK (
        (user_id IS NOT NULL) OR 
        (guest_phone IS NOT NULL AND guest_phone != '') OR
        (user_id IS NULL AND guest_phone IS NULL)
      )
    `);
    
    // orders: cooking_status 제한
    await client.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT chk_orders_cooking_status 
      CHECK (cooking_status IN ('PENDING', 'COOKING', 'COMPLETED', 'CANCELLED'))
    `);
    
    console.log('✅ 제약조건 추가 완료');
    
    await client.query('COMMIT');
    
    // 8. 테이블 구조 확인
    console.log('\n📊 리팩토링된 테이블 구조 확인:');
    
    // paid_orders 구조
    const paidOrdersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'paid_orders' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n💳 paid_orders 테이블 구조:');
    paidOrdersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // orders 구조
    const ordersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🍳 orders 테이블 구조:');
    ordersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    console.log('\n🎉 orders 테이블 구조 리팩토링 완료!');
    console.log('📝 다음 단계:');
    console.log('  1. routes/orders.js 파일을 새로운 구조에 맞게 수정');
    console.log('  2. routes/pos.js 파일을 새로운 구조에 맞게 수정');
    console.log('  3. KDS 관련 로직을 새로운 orders 테이블 구조에 맞게 수정');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ orders 테이블 리팩토링 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  refactorOrdersStructure()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('리팩토링 실패:', error);
      process.exit(1);
    });
}

module.exports = { refactorOrdersStructure };
