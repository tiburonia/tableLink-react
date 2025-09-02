
const pool = require('../../shared/config/database');

async function createKDSRebinding() {
  let client;
  
  try {
    console.log('✅ PostgreSQL 데이터베이스 연결');
    client = await pool.connect();
    
    console.log('🔄 KDS 리바인딩을 위한 스키마 생성 시작...');
    
    await client.query('BEGIN');
    
    // 1. 기존 뷰 제거
    console.log('🗑️ 기존 orders 뷰 제거...');
    await client.query(`DROP VIEW IF EXISTS orders CASCADE`);
    await client.query(`DROP VIEW IF EXISTS order_items_view CASCADE`);
    
    // 2. KDS용 orders 테이블 생성
    console.log('🍳 KDS orders 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        check_id INTEGER NOT NULL,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        source VARCHAR(20) DEFAULT 'TLL',
        total_amount INTEGER DEFAULT 0,
        payment_id INTEGER,
        table_number INTEGER,
        customer_name VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (check_id) REFERENCES checks(id) ON DELETE CASCADE,
        CONSTRAINT chk_order_status CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'))
      )
    `);
    
    // 3. KDS용 order_items 테이블 생성 (세분화된 상태)
    console.log('🍽️ KDS order_items 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        menu_name VARCHAR(200) NOT NULL,
        unit_price INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'queued',
        cook_station VARCHAR(50) DEFAULT 'main',
        priority INTEGER DEFAULT 0,
        estimated_time INTEGER DEFAULT 10,
        cooking_notes TEXT,
        started_at TIMESTAMP,
        ready_at TIMESTAMP,
        served_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT chk_item_status CHECK (status IN ('queued', 'cooking', 'ready', 'served', 'hold', 'cancelled'))
      )
    `);
    
    // 4. KDS 이벤트 로그 테이블 (외래키 제약조건 없이 먼저 생성)
    console.log('📊 KDS 이벤트 로그 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kds_events (
        id SERIAL PRIMARY KEY,
        item_id INTEGER NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        old_status VARCHAR(20),
        new_status VARCHAR(20),
        cook_station VARCHAR(50),
        operator VARCHAR(100),
        cooking_time INTEGER,
        event_data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 5. 주문 상태 업데이트 트리거 함수
    console.log('🔔 KDS 상태 업데이트 트리거 생성...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_order_status_from_items()
      RETURNS TRIGGER AS $$
      BEGIN
        -- 주문 아이템 상태 변경 시 주문 전체 상태 자동 업데이트
        UPDATE orders 
        SET status = CASE
          WHEN NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = NEW.order_id AND status != 'served' AND status != 'cancelled') 
          THEN 'served'
          WHEN EXISTS (SELECT 1 FROM order_items WHERE order_id = NEW.order_id AND status = 'cooking')
          THEN 'preparing'
          WHEN EXISTS (SELECT 1 FROM order_items WHERE order_id = NEW.order_id AND status = 'ready')
          THEN 'ready'
          ELSE 'confirmed'
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.order_id;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS update_order_status_trigger ON order_items;
      CREATE TRIGGER update_order_status_trigger
        AFTER UPDATE ON order_items
        FOR EACH ROW EXECUTE FUNCTION update_order_status_from_items();
    `);
    
    // 6. KDS 실시간 알림 트리거
    console.log('📡 KDS 실시간 알림 트리거 생성...');
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_kds_update()
      RETURNS TRIGGER AS $$
      BEGIN
        -- KDS 이벤트 로그 기록
        INSERT INTO kds_events (
          item_id, event_type, old_status, new_status, 
          cook_station, cooking_time, event_data
        ) VALUES (
          COALESCE(NEW.id, OLD.id),
          TG_OP,
          OLD.status,
          NEW.status,
          COALESCE(NEW.cook_station, OLD.cook_station),
          CASE 
            WHEN NEW.status = 'ready' AND OLD.status = 'cooking' AND NEW.started_at IS NOT NULL
            THEN EXTRACT(epoch FROM (NOW() - NEW.started_at))::INTEGER
            ELSE NULL 
          END,
          jsonb_build_object(
            'timestamp', EXTRACT(epoch FROM NOW()),
            'table_number', (SELECT table_number FROM orders WHERE id = COALESCE(NEW.order_id, OLD.order_id)),
            'customer_name', (SELECT customer_name FROM orders WHERE id = COALESCE(NEW.order_id, OLD.order_id))
          )
        );
        
        -- 실시간 알림 전송
        PERFORM pg_notify('kds_updates', 
          json_build_object(
            'type', 'item_status_change',
            'item_id', COALESCE(NEW.id, OLD.id),
            'order_id', COALESCE(NEW.order_id, OLD.order_id),
            'old_status', OLD.status,
            'new_status', NEW.status,
            'cook_station', COALESCE(NEW.cook_station, OLD.cook_station),
            'timestamp', EXTRACT(epoch FROM NOW())
          )::text
        );
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS kds_notify_trigger ON order_items;
      CREATE TRIGGER kds_notify_trigger
        AFTER INSERT OR UPDATE OR DELETE ON order_items
        FOR EACH ROW EXECUTE FUNCTION notify_kds_update();
    `);
    
    // 7. 인덱스 생성 (KDS 성능 최적화)
    console.log('📊 KDS 성능 최적화 인덱스 생성...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_check_id ON orders(check_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
      CREATE INDEX IF NOT EXISTS idx_order_items_cook_station ON order_items(cook_station);
      CREATE INDEX IF NOT EXISTS idx_order_items_priority ON order_items(priority);
      CREATE INDEX IF NOT EXISTS idx_order_items_updated_at ON order_items(updated_at);
      
      CREATE INDEX IF NOT EXISTS idx_kds_events_item_id ON kds_events(item_id);
      CREATE INDEX IF NOT EXISTS idx_kds_events_created_at ON kds_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_kds_events_event_type ON kds_events(event_type);
    `);
    
    // 8. 외래키 제약조건 추가 (모든 테이블 생성 후)
    console.log('🔗 외래키 제약조건 추가...');
    await client.query(`
      ALTER TABLE kds_events 
      ADD CONSTRAINT fk_kds_events_item_id 
      FOREIGN KEY (item_id) REFERENCES order_items(id) ON DELETE CASCADE
    `);
    
    // 9. 자동 타임스탬프 업데이트 트리거
    console.log('⏰ 자동 타임스탬프 트리거 생성...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
      CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
      CREATE TRIGGER update_order_items_updated_at
        BEFORE UPDATE ON order_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // 10. 기존 check_items 데이터 마이그레이션
    console.log('🔄 기존 check_items 데이터 마이그레이션...');
    
    // 기존 데이터 확인
    const checkResult = await client.query('SELECT COUNT(*) FROM checks WHERE EXISTS (SELECT 1 FROM check_items WHERE check_id = checks.id)');
    const checkCount = parseInt(checkResult.rows[0].count);
    console.log(`📊 마이그레이션 대상: ${checkCount}개 체크`);
    
    if (checkCount > 0) {
      // 기존 check_items로부터 orders 생성
      const orderInsertResult = await client.query(`
        INSERT INTO orders (check_id, order_number, status, source, total_amount, table_number, customer_name, created_at)
        SELECT DISTINCT 
          c.id as check_id,
          'ORD_' || c.id || '_' || EXTRACT(epoch FROM c.opened_at)::bigint as order_number,
          CASE 
            WHEN c.status = 'open' THEN 'preparing'
            WHEN c.status = 'closed' THEN 'served'
            ELSE 'confirmed'
          END as status,
          COALESCE(c.source_system, 'TLL') as source,
          COALESCE((
            SELECT SUM(ci.unit_price * ci.quantity) 
            FROM check_items ci 
            WHERE ci.check_id = c.id
          ), 0) as total_amount,
          c.table_number,
          COALESCE(c.customer_name, '고객') as customer_name,
          c.opened_at as created_at
        FROM checks c
        WHERE EXISTS (SELECT 1 FROM check_items ci WHERE ci.check_id = c.id)
        ON CONFLICT (order_number) DO NOTHING
        RETURNING id
      `);
      
      console.log(`✅ Orders 생성: ${orderInsertResult.rows.length}개`);
      
      // 기존 check_items로부터 order_items 생성
      const itemInsertResult = await client.query(`
        INSERT INTO order_items (
          order_id, menu_name, unit_price, quantity, status, 
          cook_station, cooking_notes, created_at, updated_at
        )
        SELECT 
          o.id as order_id,
          ci.menu_name,
          ci.unit_price,
          ci.quantity,
          CASE 
            WHEN ci.status = 'ordered' THEN 'queued'
            WHEN ci.status = 'preparing' THEN 'cooking'
            WHEN ci.status = 'ready' THEN 'ready'
            WHEN ci.status = 'served' THEN 'served'
            ELSE 'queued'
          END as status,
          'main' as cook_station,
          ci.kitchen_notes as cooking_notes,
          ci.ordered_at as created_at,
          ci.ordered_at as updated_at
        FROM check_items ci
        JOIN orders o ON o.check_id = ci.check_id
        WHERE o.order_number = 'ORD_' || ci.check_id || '_' || EXTRACT(epoch FROM (SELECT opened_at FROM checks WHERE id = ci.check_id))::bigint
        RETURNING id
      `);
      
      console.log(`✅ Order items 생성: ${itemInsertResult.rows.length}개`);
    } else {
      console.log('ℹ️ 마이그레이션할 체크 데이터가 없습니다.');
    }
    
    console.log('✅ 기존 데이터 마이그레이션 완료');
    
    await client.query('COMMIT');
    
    // 11. 생성된 테이블 확인
    console.log('\n📊 생성된 KDS 테이블 구조 확인:');
    
    const ordersResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🍳 orders 테이블:');
    ordersResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    const itemsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🍽️ order_items 테이블:');
    itemsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 데이터 개수 확인
    const orderCount = await client.query('SELECT COUNT(*) FROM orders');
    const itemCount = await client.query('SELECT COUNT(*) FROM order_items');
    
    console.log(`\n📈 마이그레이션 결과:`);
    console.log(`  - 생성된 orders: ${orderCount.rows[0].count}개`);
    console.log(`  - 생성된 order_items: ${itemCount.rows[0].count}개`);
    
    console.log('\n🎉 KDS 리바인딩 완료!');
    console.log('📋 KDS 상태 관리:');
    console.log('  - 아이템 상태: queued → cooking → ready → served');
    console.log('  - 주문 상태: pending → confirmed → preparing → ready → served');
    console.log('  - 실시간 알림: pg_notify를 통한 Socket.IO 연동');
    console.log('  - 조리시간 추적: started_at, ready_at 자동 기록');
    
  } catch (error) {
    console.error('❌ KDS 리바인딩 실패:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ 롤백 실패:', rollbackError.message);
      }
    }
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
        console.log('🔐 데이터베이스 연결 해제');
      } catch (releaseError) {
        console.error('❌ 연결 해제 실패:', releaseError.message);
      }
    }
  }
}

if (require.main === module) {
  createKDSRebinding()
    .then(() => {
      console.log('🎉 KDS 리바인딩 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { createKDSRebinding };
