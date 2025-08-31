
const pool = require('../../shared/config/database');

async function fullDatabaseRebuild() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 TableLink 데이터베이스 완전 재구축 시작');
    console.log('⚠️  이 작업은 되돌릴 수 없습니다. 기존 데이터가 모두 삭제됩니다.');

    await client.query('BEGIN');

    // 1. 기존 모든 테이블과 타입 완전 삭제
    console.log('\n1️⃣ 기존 테이블과 타입 완전 삭제...');
    await dropAllExisting(client);

    // 2. 확장 및 ENUM 타입 생성
    console.log('\n2️⃣ 확장 및 ENUM 타입 생성...');
    await createExtensionsAndEnums(client);

    // 3. 코어 레퍼런스 테이블 생성
    console.log('\n3️⃣ 코어 레퍼런스 테이블 생성...');
    await createCoreReferenceTables(client);

    // 4. 스토어/주소/테이블 생성
    console.log('\n4️⃣ 스토어/주소/테이블 생성...');
    await createStoreAndAddressTables(client);

    // 5. 메뉴/옵션/프린터 스테이션 생성
    console.log('\n5️⃣ 메뉴/옵션/프린터 스테이션 생성...');
    await createMenuAndOptionTables(client);

    // 6. 주문/결제 시스템 생성
    console.log('\n6️⃣ 주문/결제 시스템 생성...');
    await createOrderAndPaymentTables(client);

    // 7. 접근/예약 시스템 생성
    console.log('\n7️⃣ 접근/예약 시스템 생성...');
    await createAccessTables(client);

    // 8. QR/세션 시스템 생성
    console.log('\n8️⃣ QR/세션 시스템 생성...');
    await createQRTables(client);

    // 9. 로열티/프로모션 시스템 생성
    console.log('\n9️⃣ 로열티/프로모션 시스템 생성...');
    await createLoyaltyAndPromotionTables(client);

    // 10. 리뷰/즐겨찾기 시스템 생성
    console.log('\n🔟 리뷰/즐겨찾기 시스템 생성...');
    await createReviewAndFavoriteTables(client);

    // 11. 장바구니 시스템 생성
    console.log('\n1️⃣1️⃣ 장바구니 시스템 생성...');
    await createCartTables(client);

    // 12. 직원/단말 시스템 생성
    console.log('\n1️⃣2️⃣ 직원/단말 시스템 생성...');
    await createStaffAndTerminalTables(client);

    // 13. 알림/웹훅 시스템 생성
    console.log('\n1️⃣3️⃣ 알림/웹훅 시스템 생성...');
    await createNotificationTables(client);

    // 14. 함수/뷰/트리거 생성
    console.log('\n1️⃣4️⃣ 함수/뷰/트리거 생성...');
    await createFunctionsViewsAndTriggers(client);

    // 15. 인덱스 생성
    console.log('\n1️⃣5️⃣ 인덱스 생성...');
    await createIndexes(client);

    // 16. 기본 데이터 삽입
    console.log('\n1️⃣6️⃣ 기본 데이터 삽입...');
    await insertBasicData(client);

    await client.query('COMMIT');

    console.log('\n🎉 TableLink 데이터베이스 재구축 완료!');
    console.log('📊 생성된 시스템:');
    console.log('  - POS/KDS/TLL/KRP 통합 주문 시스템');
    console.log('  - TLA 예약/웨이팅 시스템');
    console.log('  - TLR 로열티/리뷰 시스템');
    console.log('  - TLM 직원/단말 관리 시스템');
    console.log('  - TLG 고객 앱 시스템');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 데이터베이스 재구축 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 기존 모든 테이블과 타입 삭제
async function dropAllExisting(client) {
  const tables = [
    'webhook_events', 'webhooks', 'notifications',
    'kds_screen_stations', 'kds_screens', 'terminals', 'staff_roles', 'roles', 'staff',
    'carts', 'favorites', 'reviews', 'promotions', 'coupon_issues', 'coupons',
    'points_ledger', 'user_store_stats', 'qr_sessions', 'qr_codes',
    'waitlists', 'reservations', 'order_events', 'payment_allocations',
    'payments', 'adjustments', 'line_options', 'order_lines', 'orders', 'checks',
    'print_jobs', 'printers', 'item_option_groups', 'options', 'option_groups',
    'menu_items', 'menu_groups', 'prep_stations', 'store_holidays', 'store_hours',
    'store_tables', 'store_address', 'stores', 'guests', 'users',
    'user_paid_orders', 'paid_orders', 'order_items', 'daily_stats'
  ];

  for (const table of tables) {
    try {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`  ✅ ${table} 테이블 삭제`);
    } catch (error) {
      console.log(`  ⚠️ ${table} 삭제 실패: ${error.message}`);
    }
  }

  // 뷰 삭제
  const views = ['paid_orders_view', 'user_paid_orders_view'];
  for (const view of views) {
    try {
      await client.query(`DROP VIEW IF EXISTS ${view} CASCADE`);
      console.log(`  ✅ ${view} 뷰 삭제`);
    } catch (error) {
      console.log(`  ⚠️ ${view} 뷰 삭제 실패`);
    }
  }

  // ENUM 타입 삭제
  const enums = [
    'check_status', 'order_status', 'item_status', 'pay_status',
    'channel_type', 'source_type', 'adj_scope', 'adj_type', 'value_type'
  ];
  
  for (const enumType of enums) {
    try {
      await client.query(`DROP TYPE IF EXISTS ${enumType} CASCADE`);
      console.log(`  ✅ ${enumType} 타입 삭제`);
    } catch (error) {
      console.log(`  ⚠️ ${enumType} 타입 삭제 실패`);
    }
  }
}

// 확장 및 ENUM 타입 생성
async function createExtensionsAndEnums(client) {
  // UUID 확장
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  // ENUM 타입들 생성
  const enums = [
    `CREATE TYPE check_status AS ENUM ('open','closed','canceled')`,
    `CREATE TYPE order_status AS ENUM ('pending','confirmed','void')`,
    `CREATE TYPE item_status AS ENUM ('queued','cooking','ready','served','canceled')`,
    `CREATE TYPE pay_status AS ENUM ('authorized','paid','void','refunded','failed')`,
    `CREATE TYPE channel_type AS ENUM ('DINE_IN','TAKEOUT','DELIVERY')`,
    `CREATE TYPE source_type AS ENUM ('POS','TLL','ADMIN')`,
    `CREATE TYPE adj_scope AS ENUM ('CHECK','LINE')`,
    `CREATE TYPE adj_type AS ENUM ('COUPON','PROMO','MANUAL','POINT')`,
    `CREATE TYPE value_type AS ENUM ('amount','percent')`
  ];

  for (const enumSql of enums) {
    await client.query(enumSql);
    console.log(`  ✅ ENUM 타입 생성`);
  }
}

// 코어 레퍼런스 테이블 생성
async function createCoreReferenceTables(client) {
  // 사용자 테이블
  await client.query(`
    CREATE TABLE users (
      id               VARCHAR(50) PRIMARY KEY,
      pw               VARCHAR(255) NOT NULL,
      name             VARCHAR(100),
      phone            VARCHAR(20) UNIQUE,
      email            VARCHAR(255) UNIQUE,
      birth            DATE,
      gender           VARCHAR(10),
      address          VARCHAR(500),
      detail_address   VARCHAR(255),
      point            INT DEFAULT 0,
      email_notifications BOOLEAN DEFAULT true,
      sms_notifications   BOOLEAN DEFAULT true,
      push_notifications  BOOLEAN DEFAULT false,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 게스트 테이블
  await client.query(`
    CREATE TABLE guests (
      id        BIGSERIAL PRIMARY KEY,
      phone     VARCHAR(20) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('  ✅ 사용자/게스트 테이블 생성 완료');
}

// 스토어/주소/테이블 생성
async function createStoreAndAddressTables(client) {
  // 매장 테이블
  await client.query(`
    CREATE TABLE stores (
      id              BIGSERIAL PRIMARY KEY,
      name            VARCHAR(255) NOT NULL,
      category        VARCHAR(100),
      is_open         BOOLEAN DEFAULT true,
      rating_average  NUMERIC(3,2),
      review_count    INT DEFAULT 0,
      favorite_count  INT DEFAULT 0,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 매장 주소 테이블
  await client.query(`
    CREATE TABLE store_address (
      id           BIGSERIAL PRIMARY KEY,
      store_id     BIGINT NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
      address_full VARCHAR(500),
      sido         VARCHAR(50),
      sigungu      VARCHAR(50),
      eupmyeondong VARCHAR(100),
      latitude     NUMERIC(10,8),
      longitude    NUMERIC(11,8),
      region_code  VARCHAR(20),
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 테이블 테이블
  await client.query(`
    CREATE TABLE store_tables (
      id             BIGSERIAL PRIMARY KEY,
      store_id       BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      table_number   INT NOT NULL,
      table_name     VARCHAR(50) NOT NULL,
      seats          INT NOT NULL,
      is_occupied    BOOLEAN DEFAULT false,
      occupied_since TIMESTAMP,
      auto_release_source VARCHAR(20),
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(store_id, table_number)
    )
  `);

  // 영업시간 테이블
  await client.query(`
    CREATE TABLE store_hours (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      dow       INT NOT NULL CHECK (dow BETWEEN 0 AND 6),
      open_time TIME NOT NULL,
      close_time TIME NOT NULL,
      is_closed BOOLEAN DEFAULT false,
      UNIQUE(store_id, dow)
    )
  `);

  // 휴무일 테이블
  await client.query(`
    CREATE TABLE store_holidays (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      holiday_date DATE NOT NULL,
      reason    VARCHAR(200),
      UNIQUE(store_id, holiday_date)
    )
  `);

  console.log('  ✅ 매장/주소/테이블 시스템 생성 완료');
}

// 메뉴/옵션/프린터 스테이션 생성
async function createMenuAndOptionTables(client) {
  // 조리 스테이션
  await client.query(`
    CREATE TABLE prep_stations (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      code      VARCHAR(50) NOT NULL,
      name      VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      UNIQUE(store_id, code)
    )
  `);

  // 메뉴 그룹
  await client.query(`
    CREATE TABLE menu_groups (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      name      VARCHAR(100) NOT NULL,
      sort_order INT DEFAULT 0
    )
  `);

  // 메뉴 아이템
  await client.query(`
    CREATE TABLE menu_items (
      id          BIGSERIAL PRIMARY KEY,
      store_id    BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      group_id    BIGINT REFERENCES menu_groups(id) ON DELETE SET NULL,
      name        VARCHAR(255) NOT NULL,
      price       INT NOT NULL,
      station_id  BIGINT REFERENCES prep_stations(id) ON DELETE SET NULL,
      is_active   BOOLEAN DEFAULT true,
      description TEXT,
      image_url   TEXT,
      sort_order  INT DEFAULT 0
    )
  `);

  // 옵션 그룹
  await client.query(`
    CREATE TABLE option_groups (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      name      VARCHAR(100) NOT NULL,
      selection VARCHAR(10) NOT NULL DEFAULT 'SINGLE',
      min_select INT DEFAULT 0,
      max_select INT DEFAULT 1,
      UNIQUE(store_id, name)
    )
  `);

  // 옵션 항목
  await client.query(`
    CREATE TABLE options (
      id        BIGSERIAL PRIMARY KEY,
      group_id  BIGINT NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
      name      VARCHAR(100) NOT NULL,
      price_delta INT NOT NULL DEFAULT 0,
      sort_order INT DEFAULT 0
    )
  `);

  // 메뉴-옵션 그룹 연결
  await client.query(`
    CREATE TABLE item_option_groups (
      id        BIGSERIAL PRIMARY KEY,
      item_id   BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
      group_id  BIGINT NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
      sort_order INT DEFAULT 0,
      UNIQUE(item_id, group_id)
    )
  `);

  // 프린터
  await client.query(`
    CREATE TABLE printers (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      name      VARCHAR(100) NOT NULL,
      type      VARCHAR(20) NOT NULL DEFAULT 'KITCHEN',
      target_station_id BIGINT REFERENCES prep_stations(id) ON DELETE SET NULL,
      conn_info JSONB,
      is_active BOOLEAN DEFAULT true
    )
  `);

  // 출력 잡
  await client.query(`
    CREATE TABLE print_jobs (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      printer_id BIGINT REFERENCES printers(id) ON DELETE SET NULL,
      payload   JSONB NOT NULL,
      status    VARCHAR(20) NOT NULL DEFAULT 'queued',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sent_at    TIMESTAMP
    )
  `);

  console.log('  ✅ 메뉴/옵션/프린터 시스템 생성 완료');
}

// 주문/결제 시스템 생성
async function createOrderAndPaymentTables(client) {
  // 체크 테이블
  await client.query(`
    CREATE TABLE checks (
      id            BIGSERIAL PRIMARY KEY,
      store_id      BIGINT NOT NULL REFERENCES stores(id),
      table_number  INT,
      user_id       VARCHAR(50) REFERENCES users(id),
      guest_phone   VARCHAR(20),
      channel       channel_type NOT NULL DEFAULT 'DINE_IN',
      source        source_type  NOT NULL DEFAULT 'POS',
      status        check_status NOT NULL DEFAULT 'open',
      opened_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      closed_at     TIMESTAMP,
      notes         TEXT
    )
  `);

  // 주문 테이블
  await client.query(`
    CREATE TABLE orders (
      id         BIGSERIAL PRIMARY KEY,
      check_id   BIGINT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      source     source_type NOT NULL DEFAULT 'POS',
      status     order_status NOT NULL DEFAULT 'pending',
      ext_key    VARCHAR(100) UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 주문 라인 테이블
  await client.query(`
    CREATE TABLE order_lines (
      id           BIGSERIAL PRIMARY KEY,
      order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_id      BIGINT REFERENCES menu_items(id) ON DELETE SET NULL,
      menu_name    VARCHAR(255) NOT NULL,
      unit_price   INT NOT NULL,
      status       item_status NOT NULL DEFAULT 'queued',
      cook_station VARCHAR(50),
      notes        TEXT,
      created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 라인별 선택 옵션
  await client.query(`
    CREATE TABLE line_options (
      id        BIGSERIAL PRIMARY KEY,
      line_id   BIGINT NOT NULL REFERENCES order_lines(id) ON DELETE CASCADE,
      option_id BIGINT REFERENCES options(id) ON DELETE SET NULL,
      name      VARCHAR(100) NOT NULL,
      price_delta INT NOT NULL DEFAULT 0
    )
  `);

  // 할인/조정 테이블
  await client.query(`
    CREATE TABLE adjustments (
      id          BIGSERIAL PRIMARY KEY,
      check_id    BIGINT REFERENCES checks(id) ON DELETE CASCADE,
      line_id     BIGINT REFERENCES order_lines(id) ON DELETE CASCADE,
      scope       adj_scope NOT NULL,
      adj_type    adj_type  NOT NULL,
      value_type  value_type NOT NULL,
      value       NUMERIC(10,2) NOT NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK ((scope='CHECK' AND line_id IS NULL) OR (scope='LINE' AND line_id IS NOT NULL))
    )
  `);

  // 결제 테이블
  await client.query(`
    CREATE TABLE payments (
      id               BIGSERIAL PRIMARY KEY,
      check_id         BIGINT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      method           VARCHAR(30) NOT NULL,
      amount           INT NOT NULL,
      status           pay_status NOT NULL,
      krp_provider     VARCHAR(30),
      krp_txn_id       VARCHAR(100),
      idempotency_key  VARCHAR(100),
      paid_at          TIMESTAMP,
      created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(krp_provider, krp_txn_id),
      UNIQUE(idempotency_key)
    )
  `);

  // 결제-라인 배분
  await client.query(`
    CREATE TABLE payment_allocations (
      payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      line_id    BIGINT NOT NULL REFERENCES order_lines(id) ON DELETE CASCADE,
      amount     INT NOT NULL,
      PRIMARY KEY(payment_id, line_id)
    )
  `);

  // 이벤트 로그
  await client.query(`
    CREATE TABLE order_events (
      id         BIGSERIAL PRIMARY KEY,
      check_id   BIGINT REFERENCES checks(id),
      order_id   BIGINT REFERENCES orders(id),
      line_id    BIGINT REFERENCES order_lines(id),
      actor      source_type NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      payload    JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('  ✅ 주문/결제 시스템 생성 완료');
}

// 접근/예약 시스템 생성
async function createAccessTables(client) {
  // 예약 테이블
  await client.query(`
    CREATE TABLE reservations (
      id          BIGSERIAL PRIMARY KEY,
      store_id    BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      user_id     VARCHAR(50) REFERENCES users(id),
      guest_phone VARCHAR(20),
      visit_time  TIMESTAMP NOT NULL,
      party_size  INT NOT NULL,
      status      VARCHAR(20) NOT NULL DEFAULT 'requested',
      requests    TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 웨이팅 테이블
  await client.query(`
    CREATE TABLE waitlists (
      id         BIGSERIAL PRIMARY KEY,
      store_id   BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      user_id    VARCHAR(50) REFERENCES users(id),
      guest_phone VARCHAR(20),
      party_size INT NOT NULL,
      status     VARCHAR(20) NOT NULL DEFAULT 'waiting',
      ticket_no  INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('  ✅ 접근/예약 시스템 생성 완료');
}

// QR/세션 시스템 생성
async function createQRTables(client) {
  // QR 코드 테이블
  await client.query(`
    CREATE TABLE qr_codes (
      id         BIGSERIAL PRIMARY KEY,
      store_id   BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      table_number INT,
      code       VARCHAR(100) NOT NULL UNIQUE,
      is_active  BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // QR 세션 테이블
  await client.query(`
    CREATE TABLE qr_sessions (
      id         BIGSERIAL PRIMARY KEY,
      qr_id      BIGINT NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
      check_id   BIGINT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      user_id    VARCHAR(50) REFERENCES users(id),
      opened_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      closed_at  TIMESTAMP
    )
  `);

  console.log('  ✅ QR/세션 시스템 생성 완료');
}

// 로열티/프로모션 시스템 생성
async function createLoyaltyAndPromotionTables(client) {
  // 매장별 유저 스탯
  await client.query(`
    CREATE TABLE user_store_stats (
      id          BIGSERIAL PRIMARY KEY,
      user_id     VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      store_id    BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      points      INT DEFAULT 0,
      total_spent INT DEFAULT 0,
      visit_count INT DEFAULT 0,
      level_name  VARCHAR(50) DEFAULT 'Bronze',
      level_points INT DEFAULT 0,
      level_benefits JSONB DEFAULT '{}',
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, store_id)
    )
  `);

  // 포인트 원장
  await client.query(`
    CREATE TABLE points_ledger (
      id         BIGSERIAL PRIMARY KEY,
      user_id    VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      store_id   BIGINT REFERENCES stores(id) ON DELETE SET NULL,
      delta      INT NOT NULL,
      reason     VARCHAR(100),
      related_check_id BIGINT REFERENCES checks(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 쿠폰 정의
  await client.query(`
    CREATE TABLE coupons (
      id          BIGSERIAL PRIMARY KEY,
      code        VARCHAR(50) UNIQUE,
      name        VARCHAR(100) NOT NULL,
      description TEXT,
      scope       VARCHAR(10) NOT NULL DEFAULT 'CHECK',
      value_type  value_type NOT NULL,
      value       NUMERIC(10,2) NOT NULL,
      min_order_total INT DEFAULT 0,
      store_id    BIGINT REFERENCES stores(id) ON DELETE SET NULL,
      starts_at   TIMESTAMP,
      ends_at     TIMESTAMP,
      max_uses_per_user INT DEFAULT 1,
      is_active   BOOLEAN DEFAULT true,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 쿠폰 발급
  await client.query(`
    CREATE TABLE coupon_issues (
      id         BIGSERIAL PRIMARY KEY,
      coupon_id  BIGINT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
      user_id    VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status     VARCHAR(20) NOT NULL DEFAULT 'unused',
      issued_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      used_at    TIMESTAMP,
      UNIQUE(coupon_id, user_id, status) DEFERRABLE INITIALLY DEFERRED
    )
  `);

  // 프로모션
  await client.query(`
    CREATE TABLE promotions (
      id         BIGSERIAL PRIMARY KEY,
      store_id   BIGINT REFERENCES stores(id) ON DELETE SET NULL,
      title      VARCHAR(200) NOT NULL,
      payload    JSONB,
      starts_at  TIMESTAMP,
      ends_at    TIMESTAMP,
      is_active  BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('  ✅ 로열티/프로모션 시스템 생성 완료');
}

// 리뷰/즐겨찾기 시스템 생성
async function createReviewAndFavoriteTables(client) {
  // 리뷰 테이블
  await client.query(`
    CREATE TABLE reviews (
      id         BIGSERIAL PRIMARY KEY,
      user_id    VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      store_id   BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      check_id   BIGINT REFERENCES checks(id) ON DELETE SET NULL,
      rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      review_text TEXT NOT NULL,
      photos     JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, store_id, check_id)
    )
  `);

  // 즐겨찾기 테이블
  await client.query(`
    CREATE TABLE favorites (
      id         BIGSERIAL PRIMARY KEY,
      user_id    VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      store_id   BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, store_id)
    )
  `);

  console.log('  ✅ 리뷰/즐겨찾기 시스템 생성 완료');
}

// 장바구니 시스템 생성
async function createCartTables(client) {
  await client.query(`
    CREATE TABLE carts (
      id         BIGSERIAL PRIMARY KEY,
      user_id    VARCHAR(50) NOT NULL REFERENCES users(id),
      store_id   BIGINT NOT NULL REFERENCES stores(id),
      table_num  INT,
      payload    JSONB NOT NULL,
      saved_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, store_id)
    )
  `);

  console.log('  ✅ 장바구니 시스템 생성 완료');
}

// 직원/단말 시스템 생성
async function createStaffAndTerminalTables(client) {
  // 직원 테이블
  await client.query(`
    CREATE TABLE staff (
      id         BIGSERIAL PRIMARY KEY,
      store_id   BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      name       VARCHAR(100) NOT NULL,
      phone      VARCHAR(20) UNIQUE,
      email      VARCHAR(255) UNIQUE,
      is_active  BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 역할 테이블
  await client.query(`
    CREATE TABLE roles (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      name      VARCHAR(50) NOT NULL,
      permissions JSONB,
      UNIQUE(store_id, name)
    )
  `);

  // 직원-역할 매핑
  await client.query(`
    CREATE TABLE staff_roles (
      staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      role_id  BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (staff_id, role_id)
    )
  `);

  // 단말 테이블
  await client.query(`
    CREATE TABLE terminals (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      type      VARCHAR(20) NOT NULL,
      name      VARCHAR(100),
      api_key   VARCHAR(100) UNIQUE,
      meta      JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // KDS 스크린
  await client.query(`
    CREATE TABLE kds_screens (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      terminal_id BIGINT REFERENCES terminals(id) ON DELETE SET NULL,
      name      VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE kds_screen_stations (
      screen_id  BIGINT NOT NULL REFERENCES kds_screens(id) ON DELETE CASCADE,
      station_id BIGINT NOT NULL REFERENCES prep_stations(id) ON DELETE CASCADE,
      PRIMARY KEY (screen_id, station_id)
    )
  `);

  console.log('  ✅ 직원/단말 시스템 생성 완료');
}

// 알림/웹훅 시스템 생성
async function createNotificationTables(client) {
  // 알림 큐
  await client.query(`
    CREATE TABLE notifications (
      id        BIGSERIAL PRIMARY KEY,
      user_id   VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
      store_id  BIGINT REFERENCES stores(id) ON DELETE SET NULL,
      type      VARCHAR(30) NOT NULL,
      title     VARCHAR(200),
      payload   JSONB,
      status    VARCHAR(20) DEFAULT 'queued',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sent_at    TIMESTAMP
    )
  `);

  // 웹훅 엔드포인트
  await client.query(`
    CREATE TABLE webhooks (
      id        BIGSERIAL PRIMARY KEY,
      store_id  BIGINT REFERENCES stores(id) ON DELETE CASCADE,
      url       TEXT NOT NULL,
      secret    TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 웹훅 이벤트
  await client.query(`
    CREATE TABLE webhook_events (
      id        BIGSERIAL PRIMARY KEY,
      webhook_id BIGINT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
      event_type VARCHAR(50) NOT NULL,
      payload    JSONB NOT NULL,
      status     VARCHAR(20) DEFAULT 'queued',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sent_at    TIMESTAMP
    )
  `);

  console.log('  ✅ 알림/웹훅 시스템 생성 완료');
}

// 함수/뷰/트리거 생성
async function createFunctionsViewsAndTriggers(client) {
  // 체크 총액 계산 함수
  await client.query(`
    CREATE OR REPLACE FUNCTION calc_check_total(p_check_id BIGINT)
    RETURNS INT LANGUAGE plpgsql AS $$
    DECLARE
      subtotal INT := 0;
      optsum   INT := 0;
      line_amt NUMERIC := 0;
      line_pct NUMERIC := 0;
      chk_amt  NUMERIC := 0;
      chk_pct  NUMERIC := 0;
      final    NUMERIC := 0;
    BEGIN
      -- 라인 금액
      SELECT COALESCE(SUM(ol.unit_price),0)
        INTO subtotal
      FROM order_lines ol
      JOIN orders o ON o.id=ol.order_id
      WHERE o.check_id=p_check_id
        AND ol.status IN ('queued','cooking','ready','served');

      -- 옵션 합
      SELECT COALESCE(SUM(lo.price_delta),0)
        INTO optsum
      FROM order_lines ol
      JOIN orders o ON o.id=ol.order_id
      LEFT JOIN line_options lo ON lo.line_id=ol.id
      WHERE o.check_id=p_check_id
        AND ol.status IN ('queued','cooking','ready','served');

      subtotal := subtotal + optsum;

      -- 라인 조정: amount
      SELECT COALESCE(SUM(a.value),0)
        INTO line_amt
      FROM adjustments a
      JOIN order_lines ol ON ol.id=a.line_id
      JOIN orders o ON o.id=ol.order_id
      WHERE a.scope='LINE' AND a.value_type='amount'
        AND o.check_id=p_check_id;

      -- 라인 조정: percent
      SELECT COALESCE(SUM(ol.unit_price * (a.value/100.0)),0)
        INTO line_pct
      FROM adjustments a
      JOIN order_lines ol ON ol.id=a.line_id
      JOIN orders o ON o.id=ol.order_id
      WHERE a.scope='LINE' AND a.value_type='percent'
        AND o.check_id=p_check_id;

      -- 체크 조정: amount
      SELECT COALESCE(SUM(a.value),0)
        INTO chk_amt
      FROM adjustments a
      WHERE a.scope='CHECK' AND a.value_type='amount'
        AND a.check_id=p_check_id;

      -- 체크 조정: percent
      SELECT COALESCE(SUM(subtotal * (a.value/100.0)),0)
        INTO chk_pct
      FROM adjustments a
      WHERE a.scope='CHECK' AND a.value_type='percent'
        AND a.check_id=p_check_id;

      final := subtotal - line_amt - line_pct - chk_amt - chk_pct;
      IF final < 0 THEN final := 0; END IF;
      RETURN ROUND(final)::INT;
    END $$
  `);

  // 호환성 뷰들
  await client.query(`
    CREATE OR REPLACE VIEW paid_orders_view AS
    SELECT
      p.id,
      ch.store_id,
      ch.user_id,
      ch.guest_phone,
      ch.table_number,
      p.amount AS final_amount,
      p.method AS payment_method,
      p.paid_at AS payment_date,
      p.created_at
    FROM payments p
    JOIN checks ch ON ch.id=p.check_id
    WHERE p.status='paid'
  `);

  await client.query(`
    CREATE OR REPLACE VIEW user_paid_orders_view AS
    SELECT
      p.id,
      ch.user_id,
      ch.store_id,
      s.name AS store_name,
      ch.table_number,
      p.amount AS final_amount,
      p.method AS payment_method,
      p.paid_at AS payment_date,
      p.created_at
    FROM payments p
    JOIN checks ch ON ch.id=p.check_id
    JOIN stores s ON s.id=ch.store_id
    WHERE ch.user_id IS NOT NULL AND p.status='paid'
  `);

  // KDS 실시간 트리거
  await client.query(`
    CREATE OR REPLACE FUNCTION kds_line_notify() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      PERFORM pg_notify(
        'kds_line_events',
        json_build_object(
          'line_id', NEW.id,
          'order_id', NEW.order_id,
          'status', NEW.status,
          'created_at', NEW.created_at
        )::text
      );
      RETURN NEW;
    END $$
  `);

  await client.query(`
    DROP TRIGGER IF EXISTS trg_kds_line_ins ON order_lines;
    CREATE TRIGGER trg_kds_line_ins
    AFTER INSERT ON order_lines
    FOR EACH ROW EXECUTE FUNCTION kds_line_notify()
  `);

  await client.query(`
    DROP TRIGGER IF EXISTS trg_kds_line_upd ON order_lines;
    CREATE TRIGGER trg_kds_line_upd
    AFTER UPDATE OF status ON order_lines
    FOR EACH ROW EXECUTE FUNCTION kds_line_notify()
  `);

  console.log('  ✅ 함수/뷰/트리거 생성 완료');
}

// 인덱스 생성
async function createIndexes(client) {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_checks_store_status ON checks(store_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_checks_user ON checks(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_check ON orders(check_id)',
    'CREATE INDEX IF NOT EXISTS idx_lines_order ON order_lines(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_lines_status ON order_lines(status)',
    'CREATE INDEX IF NOT EXISTS idx_lines_created ON order_lines(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_line_options_line ON line_options(line_id)',
    'CREATE INDEX IF NOT EXISTS idx_adj_check ON adjustments(check_id)',
    'CREATE INDEX IF NOT EXISTS idx_adj_line ON adjustments(line_id)',
    'CREATE INDEX IF NOT EXISTS idx_pay_check ON payments(check_id)',
    'CREATE INDEX IF NOT EXISTS idx_evt_check ON order_events(check_id)',
    'CREATE INDEX IF NOT EXISTS idx_evt_created ON order_events(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_res_store_time ON reservations(store_id, visit_time)',
    'CREATE INDEX IF NOT EXISTS idx_wait_store ON waitlists(store_id, status, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_qr_store_table ON qr_codes(store_id, table_number)',
    'CREATE INDEX IF NOT EXISTS idx_points_user ON points_ledger(user_id, created_at DESC)'
  ];

  for (const index of indexes) {
    await client.query(index);
    console.log(`  ✅ 인덱스 생성: ${index.split(' ')[3]}`);
  }
}

// 기본 데이터 삽입
async function insertBasicData(client) {
  // 샘플 매장 생성
  const storeResult = await client.query(`
    INSERT INTO stores (name, category, is_open, rating_average, review_count, favorite_count)
    VALUES ('테스트 매장', '한식', true, 4.5, 0, 0)
    RETURNING id
  `);
  const storeId = storeResult.rows[0].id;

  // 매장 주소
  await client.query(`
    INSERT INTO store_address (store_id, address_full, sido, sigungu, eupmyeondong, latitude, longitude)
    VALUES ($1, '서울특별시 중구 명동 123', '서울특별시', '중구', '명동', 37.5665, 126.9780)
  `, [storeId]);

  // 테이블 생성
  for (let i = 1; i <= 10; i++) {
    await client.query(`
      INSERT INTO store_tables (store_id, table_number, table_name, seats)
      VALUES ($1, $2, $3, $4)
    `, [storeId, i, `테이블 ${i}`, i <= 2 ? 2 : i <= 5 ? 4 : 6]);
  }

  // 조리 스테이션
  await client.query(`
    INSERT INTO prep_stations (store_id, code, name)
    VALUES 
      ($1, 'KITCHEN', '주방'),
      ($1, 'BAR', '음료'),
      ($1, 'GRILL', '구이')
  `, [storeId, storeId, storeId]);

  // 메뉴 그룹
  const groupResult = await client.query(`
    INSERT INTO menu_groups (store_id, name, sort_order)
    VALUES 
      ($1, '메인요리', 1),
      ($1, '음료', 2),
      ($1, '사이드', 3)
    RETURNING id
  `, [storeId, storeId, storeId]);

  const groupIds = groupResult.rows.map(row => row.id);

  // 메뉴 아이템
  await client.query(`
    INSERT INTO menu_items (store_id, group_id, name, price, is_active)
    VALUES 
      ($1, $2, '김치찌개', 8000, true),
      ($1, $2, '된장찌개', 7000, true),
      ($1, $3, '콜라', 2000, true),
      ($1, $3, '사이다', 2000, true),
      ($1, $4, '김치', 3000, true)
  `, [storeId, groupIds[0], storeId, groupIds[1], storeId, groupIds[2]]);

  // 테스트 사용자
  await client.query(`
    INSERT INTO users (id, pw, name, phone, point)
    VALUES ('user1', '1234', '테스트사용자', '010-1234-5678', 1000)
  `);

  console.log('  ✅ 기본 데이터 삽입 완료');
  console.log(`  📍 생성된 매장 ID: ${storeId}`);
}

// 실행
if (require.main === module) {
  fullDatabaseRebuild()
    .then(() => {
      console.log('\n✅ TableLink 데이터베이스 재구축 성공');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ TableLink 데이터베이스 재구축 실패:', error);
      process.exit(1);
    });
}

module.exports = { fullDatabaseRebuild };
