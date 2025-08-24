
const pool = require('../../shared/config/database');

async function createOrderItemsTable() {
  const client = await pool.connect();
  
  try {
    console.log('📋 order_items 테이블 생성 중...');
    
    // order_items 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        menu_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price INTEGER NOT NULL,
        cooking_status VARCHAR(20) DEFAULT 'PENDING',
        cook_station VARCHAR(50),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT valid_cooking_status CHECK (cooking_status IN ('PENDING', 'COOKING', 'COMPLETED'))
      )
    `);
    
    console.log('✅ order_items 테이블 생성 완료');
    
    // 인덱스 추가
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_cooking_status ON order_items(cooking_status);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order_status ON order_items(order_id, cooking_status);
    `);
    
    console.log('✅ order_items 인덱스 생성 완료');
    
    // updated_at 자동 업데이트 트리거 생성
    await client.query(`
      CREATE OR REPLACE FUNCTION update_order_items_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_order_items_updated_at_trigger ON order_items;
      CREATE TRIGGER update_order_items_updated_at_trigger
        BEFORE UPDATE ON order_items
        FOR EACH ROW
        EXECUTE FUNCTION update_order_items_updated_at();
    `);
    
    console.log('✅ order_items 트리거 생성 완료');
    
    console.log('🎉 order_items 테이블 설정 완료!');
    
  } catch (error) {
    console.error('❌ order_items 테이블 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  createOrderItemsTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = createOrderItemsTable;
