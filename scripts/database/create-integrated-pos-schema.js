
const pool = require('../../shared/config/database');

async function createIntegratedPOSSchema() {
  const client = await pool.connect();

  try {
    console.log('🏗️ POS/KDS/TLL/KRP 통합 스키마 생성 시작...');

    await client.query('BEGIN');

    // 1. 기존 테이블 백업 및 삭제
    console.log('🗑️ 기존 테이블 정리...');
    
    const tablesToDrop = [
      'payment_allocations', 'partial_payments', 'user_paid_orders', 
      'paid_orders', 'order_items', 'orders', 'guests'
    ];

    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ ${table} 테이블 삭제 완료`);
      } catch (error) {
        console.log(`⚠️ ${table} 삭제 실패: ${error.message}`);
      }
    }

    // 2. 핵심 POS 통합 테이블들 생성
    console.log('🏗️ 핵심 POS 통합 테이블 생성...');

    // 📋 checks - 체크/세션 단위 (POS 중심)
    await client.query(`
      CREATE TABLE checks (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        table_number INTEGER NOT NULL,
        
        -- 고객 정보 (회원 또는 게스트)
        user_id VARCHAR(20) REFERENCES users(id) ON DELETE SET NULL,
        guest_phone VARCHAR(20),
        customer_name VARCHAR(100) DEFAULT '고객',
        
        -- 체크 상태 및 금액
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'canceled')),
        subtotal_amount INTEGER DEFAULT 0,
        discount_amount INTEGER DEFAULT 0,
        final_amount INTEGER DEFAULT 0,
        
        -- 시간 추적
        opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP,
        
        -- 소스 추적 (POS, TLL, KDS)
        source_system VARCHAR(10) DEFAULT 'POS' CHECK (source_system IN ('POS', 'TLL', 'KDS')),
        device_info JSONB,
        
        -- 메타데이터
        notes TEXT,
        metadata JSONB,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- 제약조건: 회원 또는 게스트 정보 중 하나는 필수
        CHECK (user_id IS NOT NULL OR guest_phone IS NOT NULL)
      )
    `);

    // 📦 check_items - 주문 아이템 (KDS 중심)
    await client.query(`
      CREATE TABLE check_items (
        id SERIAL PRIMARY KEY,
        check_id INTEGER NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
        
        -- 메뉴 정보
        menu_name VARCHAR(200) NOT NULL,
        menu_category VARCHAR(100),
        unit_price INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        total_price INTEGER GENERATED ALWAYS AS (unit_price * quantity) STORED,
        
        -- 옵션 및 할인
        options JSONB,
        discount_amount INTEGER DEFAULT 0,
        final_price INTEGER GENERATED ALWAYS AS (unit_price * quantity - discount_amount) STORED,
        
        -- KDS 상태 관리
        status VARCHAR(20) DEFAULT 'ordered' CHECK (
          status IN ('ordered', 'preparing', 'ready', 'served', 'canceled')
        ),
        
        -- 시간 추적
        ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        preparing_at TIMESTAMP,
        ready_at TIMESTAMP,
        served_at TIMESTAMP,
        canceled_at TIMESTAMP,
        
        -- 조리 지시사항
        kitchen_notes TEXT,
        priority INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 💳 payments - 결제 정보 (POS/TLL 통합)
    await client.query(`
      CREATE TABLE payments (
        id SERIAL PRIMARY KEY,
        check_id INTEGER NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
        
        -- 결제 정보
        payment_method VARCHAR(20) NOT NULL CHECK (
          payment_method IN ('CASH', 'CARD', 'TOSS', 'MIXED', 'POINT')
        ),
        amount INTEGER NOT NULL,
        
        -- 상태 관리
        status VARCHAR(20) DEFAULT 'pending' CHECK (
          status IN ('pending', 'completed', 'failed', 'refunded')
        ),
        
        -- 결제 상세 정보
        payment_data JSONB, -- 토스페이먼츠, VAN사 정보 등
        approval_number VARCHAR(100),
        transaction_id VARCHAR(100),
        
        -- 시간 추적
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        failed_at TIMESTAMP,
        
        -- 환불 정보
        refund_amount INTEGER DEFAULT 0,
        refunded_at TIMESTAMP,
        refund_reason TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 👥 guests - 게스트 관리 (TLL 중심)
    await client.query(`
      CREATE TABLE guests (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        
        -- 방문 통계
        total_visits INTEGER DEFAULT 0,
        total_spent INTEGER DEFAULT 0,
        first_visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- 매장별 통계
        store_stats JSONB DEFAULT '{}', -- {storeId: {visits: 0, spent: 0}}
        
        -- 선호도 정보
        preferred_stores JSONB DEFAULT '[]',
        preferred_categories JSONB DEFAULT '[]',
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 📊 daily_stats - 일일 통계 (관리자/TLM 중심)
    await client.query(`
      CREATE TABLE daily_stats (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        
        -- 매출 통계
        total_revenue INTEGER DEFAULT 0,
        total_orders INTEGER DEFAULT 0,
        total_customers INTEGER DEFAULT 0,
        
        -- 결제 방법별 통계
        cash_revenue INTEGER DEFAULT 0,
        card_revenue INTEGER DEFAULT 0,
        toss_revenue INTEGER DEFAULT 0,
        
        -- 고객 타입별 통계
        member_orders INTEGER DEFAULT 0,
        guest_orders INTEGER DEFAULT 0,
        pos_orders INTEGER DEFAULT 0,
        tll_orders INTEGER DEFAULT 0,
        
        -- 테이블 회전율
        avg_table_turnover DECIMAL(3,1) DEFAULT 0.0,
        peak_hour VARCHAR(10),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(store_id, date)
      )
    `);

    // 3. 인덱스 생성 (성능 최적화)
    console.log('🔍 성능 최적화 인덱스 생성...');

    const indexes = [
      'CREATE INDEX idx_checks_store_id ON checks(store_id)',
      'CREATE INDEX idx_checks_table_number ON checks(store_id, table_number)',
      'CREATE INDEX idx_checks_user_id ON checks(user_id)',
      'CREATE INDEX idx_checks_guest_phone ON checks(guest_phone)',
      'CREATE INDEX idx_checks_status ON checks(status)',
      'CREATE INDEX idx_checks_opened_at ON checks(opened_at)',
      
      'CREATE INDEX idx_check_items_check_id ON check_items(check_id)',
      'CREATE INDEX idx_check_items_status ON check_items(status)',
      'CREATE INDEX idx_check_items_menu_name ON check_items(menu_name)',
      
      'CREATE INDEX idx_payments_check_id ON payments(check_id)',
      'CREATE INDEX idx_payments_method ON payments(payment_method)',
      'CREATE INDEX idx_payments_status ON payments(status)',
      'CREATE INDEX idx_payments_completed_at ON payments(completed_at)',
      
      'CREATE INDEX idx_guests_phone ON guests(phone)',
      'CREATE INDEX idx_guests_last_visit ON guests(last_visit_date)',
      
      'CREATE INDEX idx_daily_stats_store_date ON daily_stats(store_id, date)',
      'CREATE INDEX idx_daily_stats_date ON daily_stats(date)'
    ];

    for (const index of indexes) {
      try {
        await client.query(index);
        console.log(`✅ 인덱스 생성: ${index.split(' ')[2]}`);
      } catch (error) {
        console.log(`⚠️ 인덱스 생성 실패: ${error.message}`);
      }
    }

    // 4. 트리거 생성 (자동 집계 및 동기화)
    console.log('⚡ 자동 집계 트리거 생성...');

    // 체크 업데이트 시 총액 자동 계산
    await client.query(`
      CREATE OR REPLACE FUNCTION update_check_totals()
      RETURNS TRIGGER AS $$
      BEGIN
        -- 해당 체크의 모든 아이템 합계 계산
        UPDATE checks 
        SET 
          subtotal_amount = (
            SELECT COALESCE(SUM(final_price), 0)
            FROM check_items 
            WHERE check_id = NEW.check_id AND status != 'canceled'
          ),
          final_amount = (
            SELECT COALESCE(SUM(final_price), 0)
            FROM check_items 
            WHERE check_id = NEW.check_id AND status != 'canceled'
          ) - COALESCE(
            (SELECT discount_amount FROM checks WHERE id = NEW.check_id), 0
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.check_id;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER trigger_update_check_totals
      AFTER INSERT OR UPDATE OR DELETE ON check_items
      FOR EACH ROW EXECUTE FUNCTION update_check_totals();
    `);

    // 일일 통계 자동 업데이트
    await client.query(`
      CREATE OR REPLACE FUNCTION update_daily_stats()
      RETURNS TRIGGER AS $$
      DECLARE
        target_date DATE;
      BEGIN
        target_date := DATE(COALESCE(NEW.closed_at, NEW.opened_at));
        
        -- 일일 통계 업데이트 또는 생성
        INSERT INTO daily_stats (store_id, date, total_revenue, total_orders, total_customers)
        VALUES (NEW.store_id, target_date, NEW.final_amount, 1, 1)
        ON CONFLICT (store_id, date) 
        DO UPDATE SET
          total_revenue = daily_stats.total_revenue + NEW.final_amount,
          total_orders = daily_stats.total_orders + 1,
          total_customers = daily_stats.total_customers + 1,
          updated_at = CURRENT_TIMESTAMP;
          
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER trigger_update_daily_stats
      AFTER INSERT OR UPDATE ON checks
      FOR EACH ROW 
      WHEN (NEW.status = 'closed')
      EXECUTE FUNCTION update_daily_stats();
    `);

    // 5. 호환성 뷰 생성 (기존 코드 호환)
    console.log('🔄 호환성 뷰 생성...');

    // orders 호환 뷰
    await client.query(`
      CREATE OR REPLACE VIEW orders AS
      SELECT 
        c.id,
        c.store_id,
        c.table_number,
        c.user_id,
        c.guest_phone,
        c.customer_name,
        CASE 
          WHEN c.status = 'closed' THEN 'completed'
          WHEN c.status = 'canceled' THEN 'canceled'
          ELSE 'pending'
        END as cooking_status,
        c.final_amount as total_amount,
        c.opened_at as created_at,
        c.closed_at as completed_at,
        c.opened_at as order_date,
        CASE WHEN c.source_system = 'TLL' THEN true ELSE false END as is_tll_order,
        'pending' as payment_status,
        NULL as paid_order_id,
        NULL as user_paid_order_id,
        true as is_visible,
        c.metadata as order_data
      FROM checks c
    `);

    // order_items 호환 뷰
    await client.query(`
      CREATE OR REPLACE VIEW order_items AS
      SELECT 
        ci.id,
        ci.check_id as order_id,
        ci.menu_name,
        ci.quantity,
        ci.unit_price as price,
        ci.total_price,
        ci.status as cooking_status,
        ci.ordered_at as created_at,
        ci.served_at as completed_at
      FROM check_items ci
    `);

    // paid_orders 호환 뷰
    await client.query(`
      CREATE OR REPLACE VIEW paid_orders AS
      SELECT 
        p.id,
        c.user_id,
        c.guest_phone,
        c.store_id,
        c.table_number,
        jsonb_build_object(
          'items', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'name', ci.menu_name,
                'quantity', ci.quantity,
                'price', ci.unit_price
              )
            )
            FROM check_items ci
            WHERE ci.check_id = c.id
          ),
          'checkId', c.id,
          'customerName', c.customer_name,
          'source', c.source_system
        ) as order_data,
        c.final_amount as original_amount,
        c.final_amount,
        c.source_system as order_source,
        p.status as payment_status,
        p.payment_method,
        p.completed_at as payment_date,
        p.payment_data as payment_reference,
        p.created_at,
        p.updated_at
      FROM payments p
      JOIN checks c ON p.check_id = c.id
      WHERE p.status = 'completed'
    `);

    // user_paid_orders 호환 뷰
    await client.query(`
      CREATE OR REPLACE VIEW user_paid_orders AS
      SELECT 
        p.id,
        c.user_id,
        c.store_id,
        c.table_number,
        jsonb_build_object(
          'items', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'name', ci.menu_name,
                'quantity', ci.quantity,
                'price', ci.unit_price
              )
            )
            FROM check_items ci
            WHERE ci.check_id = c.id
          ),
          'checkId', c.id,
          'customerName', c.customer_name
        ) as order_data,
        c.final_amount as original_amount,
        0 as used_point,
        0 as coupon_discount,
        c.final_amount,
        p.payment_method,
        p.status as payment_status,
        p.completed_at as payment_date,
        c.source_system as order_source,
        p.created_at,
        p.updated_at
      FROM payments p
      JOIN checks c ON p.check_id = c.id
      WHERE p.status = 'completed' AND c.user_id IS NOT NULL
    `);

    // 6. 샘플 데이터 생성
    console.log('🎯 샘플 데이터 생성...');

    // 매장 1, 테이블 1번에 샘플 체크 생성
    const sampleCheckResult = await client.query(`
      INSERT INTO checks (
        store_id, table_number, user_id, customer_name, 
        status, final_amount, source_system
      ) VALUES (1, 1, 'user1', '김테스트', 'open', 0, 'POS')
      RETURNING id
    `);

    const sampleCheckId = sampleCheckResult.rows[0].id;

    // 샘플 아이템들 추가
    const sampleItems = [
      { name: '김치찌개', price: 8000, quantity: 1 },
      { name: '공기밥', price: 2000, quantity: 2 },
      { name: '콜라', price: 3000, quantity: 1 }
    ];

    for (const item of sampleItems) {
      await client.query(`
        INSERT INTO check_items (
          check_id, menu_name, unit_price, quantity, status
        ) VALUES ($1, $2, $3, $4, 'ordered')
      `, [sampleCheckId, item.name, item.price, item.quantity]);
    }

    console.log(`✅ 샘플 체크 ${sampleCheckId} 생성 완료 (3개 아이템)`);

    await client.query('COMMIT');

    console.log('\n🎉 POS/KDS/TLL/KRP 통합 스키마 생성 완료!');
    console.log('📊 생성된 테이블:');
    console.log('  - checks: 체크/세션 관리 (POS 중심)');
    console.log('  - check_items: 주문 아이템 관리 (KDS 중심)');
    console.log('  - payments: 결제 처리 (POS/TLL 통합)');
    console.log('  - guests: 게스트 관리 (TLL 중심)');
    console.log('  - daily_stats: 일일 통계 (관리자/TLM)');
    console.log('\n🔄 호환성 뷰:');
    console.log('  - orders, order_items, paid_orders, user_paid_orders');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 통합 스키마 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  createIntegratedPOSSchema()
    .then(() => {
      console.log('✅ 통합 스키마 생성 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 통합 스키마 생성 실패:', error);
      process.exit(1);
    });
}

module.exports = { createIntegratedPOSSchema };
