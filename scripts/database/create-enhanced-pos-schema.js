
const pool = require('../../shared/config/database');

async function createEnhancedPOSSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 향상된 POS 스키마 생성 시작...');
    
    await client.query('BEGIN');
    
    // 1. 메인 결제 정보 테이블 (분리된 결제 관리)
    console.log('💳 main_payments 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS main_payments (
        id SERIAL PRIMARY KEY,
        payment_key VARCHAR(200) UNIQUE NOT NULL,
        order_name VARCHAR(200) NOT NULL,
        amount INTEGER NOT NULL,
        method VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        pg_transaction_id VARCHAR(200),
        card_brand VARCHAR(50),
        is_refunded BOOLEAN DEFAULT false,
        refund_amount INTEGER DEFAULT 0,
        payment_data JSONB DEFAULT '{}',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP,
        failed_at TIMESTAMP,
        refunded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. 주문 테이블 개선 (결제와 분리)
    console.log('🍳 orders 테이블 구조 개선...');
    await client.query(`
      DROP TABLE IF EXISTS orders CASCADE;
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        check_id INTEGER NOT NULL,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        source VARCHAR(20) DEFAULT 'POS',
        total_amount INTEGER DEFAULT 0,
        payment_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (check_id) REFERENCES checks(id) ON DELETE CASCADE,
        FOREIGN KEY (payment_id) REFERENCES main_payments(id) ON DELETE SET NULL,
        CONSTRAINT chk_order_status CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'))
      )
    `);
    
    // 3. 주문 라인 테이블 (KDS 상태 세분화)
    console.log('🍽️ order_lines 테이블 개선...');
    await client.query(`
      DROP TABLE IF EXISTS order_lines CASCADE;
      CREATE TABLE order_lines (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        menu_name VARCHAR(200) NOT NULL,
        unit_price INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'queued',
        cook_station VARCHAR(50),
        priority INTEGER DEFAULT 0,
        estimated_time INTEGER,
        notes TEXT,
        started_at TIMESTAMP,
        ready_at TIMESTAMP,
        served_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT chk_line_status CHECK (status IN ('queued', 'cooking', 'ready', 'served', 'hold', 'cancelled'))
      )
    `);
    
    // 4. KDS 이벤트 로그 테이블
    console.log('📊 kds_events 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kds_events (
        id SERIAL PRIMARY KEY,
        line_id INTEGER NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        old_status VARCHAR(20),
        new_status VARCHAR(20),
        cook_station VARCHAR(50),
        operator VARCHAR(100),
        cooking_time INTEGER,
        event_data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (line_id) REFERENCES order_lines(id) ON DELETE CASCADE
      )
    `);
    
    // 5. 분할 결제 지원 테이블
    console.log('💰 split_payments 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS split_payments (
        id SERIAL PRIMARY KEY,
        check_id INTEGER NOT NULL,
        payment_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        sequence_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (check_id) REFERENCES checks(id) ON DELETE CASCADE,
        FOREIGN KEY (payment_id) REFERENCES main_payments(id) ON DELETE CASCADE,
        UNIQUE(check_id, sequence_number)
      )
    `);
    
    // 6. 영업일/정산 테이블
    console.log('📅 shifts 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        shift_date DATE NOT NULL,
        opened_by VARCHAR(100),
        closed_by VARCHAR(100),
        opened_at TIMESTAMP,
        closed_at TIMESTAMP,
        cash_opening DECIMAL(10,2) DEFAULT 0,
        cash_closing DECIMAL(10,2) DEFAULT 0,
        total_sales DECIMAL(10,2) DEFAULT 0,
        total_refunds DECIMAL(10,2) DEFAULT 0,
        is_closed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE(store_id, shift_date)
      )
    `);
    
    // 7. 로열티 포인트 로그 테이블
    console.log('🎁 loyalty_point_logs 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS loyalty_point_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        store_id INTEGER,
        source_type VARCHAR(50) NOT NULL,
        source_id INTEGER,
        delta INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL,
        CONSTRAINT chk_source_type CHECK (source_type IN ('order', 'review', 'signup', 'event', 'refund', 'expired'))
      )
    `);
    
    // 8. 사용자 등급 테이블
    console.log('🏆 user_tiers 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_tiers (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        store_id INTEGER NOT NULL,
        tier_level VARCHAR(20) DEFAULT 'BRONZE',
        tier_points INTEGER DEFAULT 0,
        last_visit_date DATE,
        visit_count INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE(user_id, store_id),
        CONSTRAINT chk_tier_level CHECK (tier_level IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'VIP'))
      )
    `);
    
    // 9. 주문 라인 옵션 테이블
    console.log('🔧 line_options 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS line_options (
        id SERIAL PRIMARY KEY,
        line_id INTEGER NOT NULL,
        option_name VARCHAR(100) NOT NULL,
        option_value VARCHAR(200),
        price_delta INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (line_id) REFERENCES order_lines(id) ON DELETE CASCADE
      )
    `);
    
    // 10. 조정/할인 테이블
    console.log('📉 adjustments 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS adjustments (
        id SERIAL PRIMARY KEY,
        check_id INTEGER,
        line_id INTEGER,
        scope VARCHAR(10) NOT NULL,
        adjustment_type VARCHAR(50) NOT NULL,
        value_type VARCHAR(10) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        reason VARCHAR(200),
        operator VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (check_id) REFERENCES checks(id) ON DELETE CASCADE,
        FOREIGN KEY (line_id) REFERENCES order_lines(id) ON DELETE CASCADE,
        CONSTRAINT chk_scope CHECK (scope IN ('CHECK', 'LINE')),
        CONSTRAINT chk_value_type CHECK (value_type IN ('amount', 'percent')),
        CONSTRAINT chk_adjustment_target CHECK (
          (scope = 'CHECK' AND check_id IS NOT NULL AND line_id IS NULL) OR
          (scope = 'LINE' AND line_id IS NOT NULL)
        )
      )
    `);
    
    // 11. 인덱스 생성
    console.log('📊 성능 최적화 인덱스 생성...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_check_id ON orders(check_id);
      CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_order_lines_order_id ON order_lines(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_lines_status ON order_lines(status);
      CREATE INDEX IF NOT EXISTS idx_order_lines_cook_station ON order_lines(cook_station);
      CREATE INDEX IF NOT EXISTS idx_order_lines_updated_at ON order_lines(updated_at);
      
      CREATE INDEX IF NOT EXISTS idx_main_payments_status ON main_payments(status);
      CREATE INDEX IF NOT EXISTS idx_main_payments_payment_key ON main_payments(payment_key);
      CREATE INDEX IF NOT EXISTS idx_main_payments_created_at ON main_payments(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_kds_events_line_id ON kds_events(line_id);
      CREATE INDEX IF NOT EXISTS idx_kds_events_created_at ON kds_events(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_loyalty_logs_user_id ON loyalty_point_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_loyalty_logs_store_id ON loyalty_point_logs(store_id);
      CREATE INDEX IF NOT EXISTS idx_loyalty_logs_created_at ON loyalty_point_logs(created_at);
    `);
    
    // 12. KDS 알림 트리거 개선
    console.log('🔔 KDS 알림 트리거 생성...');
    await client.query(`
      CREATE OR REPLACE FUNCTION enhanced_notify_kds_event()
      RETURNS TRIGGER AS $$
      BEGIN
        -- KDS 이벤트 로그 기록
        INSERT INTO kds_events (line_id, event_type, old_status, new_status, cook_station, event_data)
        VALUES (
          COALESCE(NEW.id, OLD.id),
          TG_OP,
          OLD.status,
          NEW.status,
          COALESCE(NEW.cook_station, OLD.cook_station),
          jsonb_build_object(
            'timestamp', EXTRACT(epoch FROM NOW()),
            'cooking_time', CASE 
              WHEN NEW.status = 'ready' AND OLD.status = 'cooking' 
              THEN EXTRACT(epoch FROM (NOW() - COALESCE(NEW.started_at, OLD.started_at)))
              ELSE NULL 
            END
          )
        );
        
        -- 실시간 알림
        PERFORM pg_notify('kds_line_events', 
          json_build_object(
            'line_id', COALESCE(NEW.id, OLD.id),
            'order_id', COALESCE(NEW.order_id, OLD.order_id),
            'status', COALESCE(NEW.status, 'deleted'),
            'cook_station', COALESCE(NEW.cook_station, OLD.cook_station),
            'event_type', TG_OP,
            'timestamp', EXTRACT(epoch FROM NOW())
          )::text
        );
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS enhanced_order_lines_notify_trigger ON order_lines;
      CREATE TRIGGER enhanced_order_lines_notify_trigger
        AFTER INSERT OR UPDATE OR DELETE ON order_lines
        FOR EACH ROW EXECUTE FUNCTION enhanced_notify_kds_event();
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ 향상된 POS 스키마 생성 완료');
    
    // 구조 확인
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('main_payments', 'orders', 'order_lines', 'kds_events', 'split_payments', 'shifts', 'loyalty_point_logs', 'user_tiers', 'line_options', 'adjustments')
      ORDER BY table_name
    `);
    
    console.log('\n📊 생성된 테이블들:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 스키마 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  createEnhancedPOSSchema()
    .then(() => {
      console.log('🎉 향상된 POS 스키마 생성 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { createEnhancedPOSSchema };
