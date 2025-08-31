
const pool = require('../../shared/config/database');

async function createNewSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🏗️ 새로운 스키마 생성 시작...');
    
    await client.query('BEGIN');
    
    // 1. ENUM 타입들 생성
    console.log('📋 ENUM 타입 생성 중...');
    
    await client.query(`
      CREATE TYPE check_status AS ENUM ('open','closed','canceled')
    `);
    
    await client.query(`
      CREATE TYPE order_status AS ENUM ('pending','confirmed','void')
    `);
    
    await client.query(`
      CREATE TYPE item_status AS ENUM ('queued','cooking','ready','served','canceled')
    `);
    
    await client.query(`
      CREATE TYPE adj_scope AS ENUM ('CHECK','LINE')
    `);
    
    await client.query(`
      CREATE TYPE adj_type AS ENUM ('COUPON','PROMO','MANUAL','POINT')
    `);
    
    await client.query(`
      CREATE TYPE pay_status AS ENUM ('authorized','paid','void','refunded','failed')
    `);
    
    console.log('✅ ENUM 타입 생성 완료');
    
    // 2. checks 테이블 (체크/영수증 단위)
    console.log('🧾 checks 테이블 생성 중...');
    
    await client.query(`
      CREATE TABLE checks (
        id            BIGSERIAL PRIMARY KEY,
        store_id      INT NOT NULL REFERENCES stores(id),
        table_number  INT,
        user_id       VARCHAR(50) REFERENCES users(id),
        guest_phone   VARCHAR(20),
        channel       VARCHAR(20) NOT NULL DEFAULT 'DINE_IN',
        source        VARCHAR(20) NOT NULL DEFAULT 'POS',
        status        check_status NOT NULL DEFAULT 'open',
        opened_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        closed_at     TIMESTAMP,
        notes         TEXT
      )
    `);
    
    // 3. orders 테이블 (주문 증분 단위)
    console.log('📝 orders 테이블 생성 중...');
    
    await client.query(`
      CREATE TABLE orders (
        id         BIGSERIAL PRIMARY KEY,
        check_id   BIGINT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
        source     VARCHAR(20) NOT NULL DEFAULT 'POS',
        status     order_status NOT NULL DEFAULT 'pending',
        ext_key    VARCHAR(100) UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 4. order_lines 테이블 (주문 라인/단품 단위)
    console.log('🍽️ order_lines 테이블 생성 중...');
    
    await client.query(`
      CREATE TABLE order_lines (
        id           BIGSERIAL PRIMARY KEY,
        order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        menu_id      INT,
        menu_name    VARCHAR(255) NOT NULL,
        unit_price   INT NOT NULL,
        status       item_status NOT NULL DEFAULT 'queued',
        cook_station VARCHAR(50),
        notes        TEXT,
        created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 5. adjustments 테이블 (가격 조정)
    console.log('💰 adjustments 테이블 생성 중...');
    
    await client.query(`
      CREATE TABLE adjustments (
        id          BIGSERIAL PRIMARY KEY,
        check_id    BIGINT REFERENCES checks(id) ON DELETE CASCADE,
        line_id     BIGINT REFERENCES order_lines(id) ON DELETE CASCADE,
        scope       adj_scope NOT NULL,
        adj_type    adj_type NOT NULL,
        value_type  VARCHAR(10) NOT NULL,
        value       NUMERIC(10,2) NOT NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK ((scope='CHECK' AND line_id IS NULL) OR (scope='LINE' AND line_id IS NOT NULL))
      )
    `);
    
    // 6. payments 테이블 (결제/환불)
    console.log('💳 payments 테이블 생성 중...');
    
    await client.query(`
      CREATE TABLE payments (
        id             BIGSERIAL PRIMARY KEY,
        check_id       BIGINT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
        method         VARCHAR(30) NOT NULL,
        amount         INT NOT NULL,
        status         pay_status NOT NULL,
        krp_provider   VARCHAR(30),
        krp_txn_id     VARCHAR(100),
        idempotency_key VARCHAR(100) UNIQUE,
        paid_at        TIMESTAMP,
        created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (krp_provider, krp_txn_id)
      )
    `);
    
    // 7. payment_allocations 테이블 (결제-아이템 배분)
    console.log('🔗 payment_allocations 테이블 생성 중...');
    
    await client.query(`
      CREATE TABLE payment_allocations (
        payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        line_id    BIGINT NOT NULL REFERENCES order_lines(id) ON DELETE CASCADE,
        amount     INT NOT NULL,
        PRIMARY KEY (payment_id, line_id)
      )
    `);
    
    // 8. order_events 테이블 (이벤트 로그)
    console.log('📊 order_events 테이블 생성 중...');
    
    await client.query(`
      CREATE TABLE order_events (
        id         BIGSERIAL PRIMARY KEY,
        check_id   BIGINT REFERENCES checks(id),
        order_id   BIGINT REFERENCES orders(id),
        line_id    BIGINT REFERENCES order_lines(id),
        actor      VARCHAR(20) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        payload    JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 9. 인덱스 생성
    console.log('📊 인덱스 생성 중...');
    
    const indexes = [
      'CREATE INDEX idx_checks_store_status ON checks(store_id, status)',
      'CREATE INDEX idx_checks_user ON checks(user_id)',
      'CREATE INDEX idx_orders_check ON orders(check_id)',
      'CREATE INDEX idx_lines_order ON order_lines(order_id)',
      'CREATE INDEX idx_lines_status ON order_lines(status)',
      'CREATE INDEX idx_adj_check ON adjustments(check_id)',
      'CREATE INDEX idx_adj_line ON adjustments(line_id)',
      'CREATE INDEX idx_pay_check ON payments(check_id)',
      'CREATE INDEX idx_evt_check ON order_events(check_id)'
    ];
    
    for (const index of indexes) {
      await client.query(index);
    }
    
    console.log('✅ 인덱스 생성 완료');
    
    await client.query('COMMIT');
    
    console.log('🎉 새로운 스키마 생성 완료!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 스키마 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  createNewSchema()
    .then(() => {
      console.log('✅ 스키마 생성 성공');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스키마 생성 실패:', error);
      process.exit(1);
    });
}

module.exports = { createNewSchema };
