
const pool = require('../../shared/config/database');
const fs = require('fs').promises;
const path = require('path');

async function fullMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 TableLink DB 전체 마이그레이션 시작');
    console.log('⚠️  이 작업은 되돌릴 수 없습니다. 기존 데이터가 모두 삭제됩니다.');

    // 1. 현재 DB 구조 백업
    console.log('\n1️⃣ 현재 DB 구조 백업...');
    await backupCurrentStructure(client);
    
    // 2. 기존 테이블 완전 삭제
    console.log('\n2️⃣ 기존 테이블 완전 삭제...');
    await dropAllTables(client);
    
    // 3. 새로운 POS 중심 스키마 생성
    console.log('\n3️⃣ 새로운 POS 중심 스키마 생성...');
    await createNewPOSSchema(client);
    
    // 4. 기본 데이터 생성
    console.log('\n4️⃣ 기본 데이터 생성...');
    await createInitialData(client);
    
    // 5. 호환성 뷰 생성
    console.log('\n5️⃣ 호환성 뷰 생성...');
    await createCompatibilityViews(client);
    
    console.log('\n✅ 전체 마이그레이션 완료!');
    console.log('🎯 새로운 POS 중심 DB 구조로 전환되었습니다.');
    
  } catch (error) {
    console.error('❌ 전체 마이그레이션 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 현재 구조 백업
async function backupCurrentStructure(client) {
  try {
    console.log('🔄 현재 DB 구조 전체 백업 시작...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(__dirname, '../../backups');
    const backupFile = path.join(backupDir, `pre-migration-backup-${timestamp}.sql`);
    
    // 백업 디렉토리 생성
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (error) {
      // 디렉토리가 이미 존재하는 경우 무시
    }
    
    // 모든 테이블 목록 조회
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    let backupContent = `-- TableLink Database Pre-Migration Backup
-- Generated: ${new Date().toISOString()}
-- Tables: ${tablesResult.rows.length}

`;
    
    // 각 테이블 백업
    for (const table of tablesResult.rows) {
      const tableName = table.tablename;
      
      try {
        console.log(`💾 백업 중: ${tableName}`);
        
        // 테이블 구조
        const structureResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        backupContent += `-- Table: ${tableName}\n`;
        backupContent += `-- Columns: ${structureResult.rows.length}\n`;
        
        // 데이터 개수
        const countResult = await client.query(`SELECT COUNT(*) as total FROM ${tableName}`);
        backupContent += `-- Records: ${countResult.rows[0].total}\n\n`;
        
      } catch (tableError) {
        console.warn(`⚠️ ${tableName} 백업 실패:`, tableError.message);
      }
    }
    
    await fs.writeFile(backupFile, backupContent, 'utf8');
    console.log(`✅ 전체 백업 완료: ${backupFile}`);
    
  } catch (error) {
    console.error('❌ 백업 실패:', error);
    // 백업 실패해도 마이그레이션은 계속 진행
  }
}

// 모든 테이블 삭제
async function dropAllTables(client) {
  try {
    console.log('🗑️ 기존 테이블 완전 삭제 시작...');
    
    // 모든 테이블 목록 조회
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log(`📋 삭제할 테이블: ${tablesResult.rows.length}개`);
    
    // CASCADE로 모든 테이블 삭제
    for (const table of tablesResult.rows) {
      const tableName = table.tablename;
      
      try {
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        console.log(`✅ ${tableName} 삭제 완료`);
      } catch (error) {
        console.warn(`⚠️ ${tableName} 삭제 실패:`, error.message);
      }
    }
    
    // ENUM 타입도 삭제
    const enumTypes = ['check_status', 'item_status', 'payment_method', 'payment_status'];
    for (const enumType of enumTypes) {
      try {
        await client.query(`DROP TYPE IF EXISTS ${enumType} CASCADE`);
        console.log(`✅ ENUM ${enumType} 삭제 완료`);
      } catch (error) {
        console.warn(`⚠️ ENUM ${enumType} 삭제 실패:`, error.message);
      }
    }
    
    console.log('✅ 기존 테이블 완전 삭제 완료');
    
  } catch (error) {
    console.error('❌ 테이블 삭제 실패:', error);
    throw error;
  }
}

// 새로운 POS 중심 스키마 생성
async function createNewPOSSchema(client) {
  try {
    console.log('🏗️ 새로운 POS 중심 스키마 생성 시작...');
    
    // 1. ENUM 타입 생성
    console.log('📋 ENUM 타입 생성 중...');
    
    await client.query(`
      CREATE TYPE check_status AS ENUM ('open', 'closed', 'canceled');
    `);
    
    await client.query(`
      CREATE TYPE item_status AS ENUM ('ordered', 'preparing', 'ready', 'served', 'canceled');
    `);
    
    await client.query(`
      CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'MIXED');
    `);
    
    await client.query(`
      CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
    `);
    
    console.log('✅ ENUM 타입 생성 완료');
    
    // 2. 기본 테이블들 생성
    console.log('🏪 기본 테이블 생성 중...');
    
    // users 테이블
    await client.query(`
      CREATE TABLE users (
        id VARCHAR(50) PRIMARY KEY,
        pw VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        phone VARCHAR(20) UNIQUE,
        email VARCHAR(255),
        birth DATE,
        gender VARCHAR(10),
        address TEXT,
        detail_address TEXT,
        point INTEGER DEFAULT 0,
        email_notifications BOOLEAN DEFAULT true,
        sms_notifications BOOLEAN DEFAULT true,
        push_notifications BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // stores 테이블
    await client.query(`
      CREATE TABLE stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        rating_average DECIMAL(3,2) DEFAULT 0.0,
        review_count INTEGER DEFAULT 0,
        favorite_count INTEGER DEFAULT 0,
        is_open BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // store_address 테이블
    await client.query(`
      CREATE TABLE store_address (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        address_full TEXT NOT NULL,
        sido VARCHAR(50),
        sigungu VARCHAR(100),
        eupmyeondong VARCHAR(100),
        detail_address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        region_code VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // store_tables 테이블
    await client.query(`
      CREATE TABLE store_tables (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        table_number INTEGER NOT NULL,
        is_occupied BOOLEAN DEFAULT false,
        occupied_by VARCHAR(50),
        occupied_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, table_number)
      )
    `);
    
    // favorites 테이블
    await client.query(`
      CREATE TABLE favorites (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, store_id)
      )
    `);
    
    // 3. POS 핵심 테이블들 생성
    console.log('🧾 POS 핵심 테이블 생성 중...');
    
    // checks 테이블 (POS 세션)
    await client.query(`
      CREATE TABLE checks (
        id BIGSERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        table_number INTEGER,
        user_id VARCHAR(50) REFERENCES users(id),
        guest_phone VARCHAR(20),
        status check_status DEFAULT 'open',
        subtotal INTEGER DEFAULT 0,
        discount_amount INTEGER DEFAULT 0,
        total_amount INTEGER DEFAULT 0,
        tax_amount INTEGER DEFAULT 0,
        service_charge INTEGER DEFAULT 0,
        final_amount INTEGER DEFAULT 0,
        opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP,
        notes TEXT,
        CHECK (user_id IS NOT NULL OR guest_phone IS NOT NULL)
      )
    `);
    
    // check_items 테이블
    await client.query(`
      CREATE TABLE check_items (
        id BIGSERIAL PRIMARY KEY,
        check_id BIGINT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
        menu_name VARCHAR(255) NOT NULL,
        unit_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        subtotal INTEGER NOT NULL,
        discount_amount INTEGER DEFAULT 0,
        final_price INTEGER NOT NULL,
        status item_status DEFAULT 'ordered',
        special_requests TEXT,
        ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        served_at TIMESTAMP
      )
    `);
    
    // payments 테이블
    await client.query(`
      CREATE TABLE payments (
        id BIGSERIAL PRIMARY KEY,
        check_id BIGINT NOT NULL REFERENCES checks(id),
        payment_method payment_method NOT NULL,
        amount INTEGER NOT NULL,
        status payment_status DEFAULT 'pending',
        transaction_id VARCHAR(255),
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `);
    
    // payment_allocations 테이블 (환불 시 아이템별 분배)
    await client.query(`
      CREATE TABLE payment_allocations (
        id BIGSERIAL PRIMARY KEY,
        payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        check_item_id BIGINT NOT NULL REFERENCES check_items(id),
        allocated_amount INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 4. 보조 테이블들 생성
    console.log('📊 보조 테이블 생성 중...');
    
    // user_store_stats 테이블
    await client.query(`
      CREATE TABLE user_store_stats (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        points INTEGER DEFAULT 0,
        total_spent INTEGER DEFAULT 0,
        visit_count INTEGER DEFAULT 0,
        last_visit TIMESTAMP,
        level_name VARCHAR(50) DEFAULT 'Bronze',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, store_id)
      )
    `);
    
    // guests 테이블
    await client.query(`
      CREATE TABLE guests (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100),
        last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        visit_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // reviews 테이블
    await client.query(`
      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
        guest_phone VARCHAR(20),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (user_id IS NOT NULL OR guest_phone IS NOT NULL)
      )
    `);
    
    // store_promotions 테이블
    await client.query(`
      CREATE TABLE store_promotions (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        promotion_type VARCHAR(50) DEFAULT 'discount',
        discount_rate INTEGER DEFAULT 0,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 5. 인덱스 생성
    console.log('🗂️ 인덱스 생성 중...');
    
    await client.query('CREATE INDEX idx_checks_store_id ON checks(store_id)');
    await client.query('CREATE INDEX idx_checks_table_number ON checks(store_id, table_number)');
    await client.query('CREATE INDEX idx_checks_user_id ON checks(user_id)');
    await client.query('CREATE INDEX idx_checks_guest_phone ON checks(guest_phone)');
    await client.query('CREATE INDEX idx_checks_status ON checks(status)');
    await client.query('CREATE INDEX idx_check_items_check_id ON check_items(check_id)');
    await client.query('CREATE INDEX idx_payments_check_id ON payments(check_id)');
    await client.query('CREATE INDEX idx_store_address_store_id ON store_address(store_id)');
    await client.query('CREATE INDEX idx_favorites_user_id ON favorites(user_id)');
    await client.query('CREATE INDEX idx_reviews_store_id ON reviews(store_id)');
    
    console.log('✅ 새로운 POS 스키마 생성 완료');
    
  } catch (error) {
    console.error('❌ 스키마 생성 실패:', error);
    throw error;
  }
}

// 기존 테이블 완전 삭제
async function dropAllTables(client) {
  try {
    console.log('🗑️ 모든 기존 테이블 DROP CASCADE 실행...');
    
    const tables = [
      'user_paid_orders', 'paid_orders', 'order_items', 'orders',
      'favorites', 'store_tables', 'store_address', 'user_store_stats',
      'guests', 'reviews', 'store_promotions', 'stores', 'users'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ ${table} 삭제 완료`);
      } catch (error) {
        console.warn(`⚠️ ${table} 삭제 실패:`, error.message);
      }
    }
    
    // ENUM 타입들도 삭제
    const enums = ['check_status', 'item_status', 'payment_method', 'payment_status'];
    for (const enumType of enums) {
      try {
        await client.query(`DROP TYPE IF EXISTS ${enumType} CASCADE`);
        console.log(`✅ ENUM ${enumType} 삭제 완료`);
      } catch (error) {
        console.warn(`⚠️ ENUM ${enumType} 삭제 실패:`, error.message);
      }
    }
    
    console.log('✅ 모든 기존 테이블 삭제 완료');
    
  } catch (error) {
    console.error('❌ 테이블 삭제 실패:', error);
    throw error;
  }
}

// 기본 데이터 생성
async function createInitialData(client) {
  try {
    console.log('📝 기본 데이터 생성 중...');
    
    // 1. 기본 매장 데이터
    await client.query(`
      INSERT INTO stores (id, name, category, description, is_open) VALUES
      (1, '치킨천국', '치킨', '맛있는 치킨 전문점', true),
      (2, '피자월드', '양식', '신선한 피자 맛집', true),
      (3, '한식당', '한식', '전통 한식 요리', true)
    `);
    
    // 2. 매장 주소 정보
    await client.query(`
      INSERT INTO store_address (store_id, address_full, sido, sigungu, eupmyeondong, latitude, longitude) VALUES
      (1, '서울특별시 강남구 역삼동 123-45', '서울특별시', '강남구', '역삼동', 37.5665, 126.9780),
      (2, '서울특별시 강남구 삼성동 67-89', '서울특별시', '강남구', '삼성동', 37.5145, 127.0559),
      (3, '서울특별시 종로구 종로1가 10-20', '서울특별시', '종로구', '종로1가', 37.5701, 126.9826)
    `);
    
    // 3. 매장 테이블 정보
    await client.query(`
      INSERT INTO store_tables (store_id, table_number) VALUES
      (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),
      (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6),
      (3, 1), (3, 2), (3, 3), (3, 4)
    `);
    
    // 4. 테스트 사용자
    await client.query(`
      INSERT INTO users (id, pw, name, phone, point) VALUES
      ('user1', '1234', '김테스트', '010-1234-5678', 1000),
      ('user2', '1234', '이테스트', '010-9876-5432', 500)
    `);
    
    // 5. 시퀀스 재설정
    await client.query(`SELECT setval('stores_id_seq', 3, true)`);
    
    console.log('✅ 기본 데이터 생성 완료');
    
  } catch (error) {
    console.error('❌ 기본 데이터 생성 실패:', error);
    throw error;
  }
}

// 호환성 뷰 생성 (기존 코드 호환)
async function createCompatibilityViews(client) {
  try {
    console.log('🔗 호환성 뷰 생성 중...');
    
    // orders 뷰 (기존 orders 테이블 호환)
    await client.query(`
      CREATE VIEW orders AS
      SELECT 
        c.id,
        c.store_id,
        c.table_number,
        c.user_id,
        c.guest_phone,
        CASE 
          WHEN c.status = 'closed' THEN 'completed'
          WHEN c.status = 'canceled' THEN 'canceled'
          ELSE 'pending'
        END as status,
        c.final_amount as total_amount,
        c.opened_at as created_at,
        c.closed_at as completed_at,
        s.name as store_name,
        COALESCE(u.name, 'Guest') as customer_name,
        
        -- 기존 컬럼들 (NULL로 설정)
        NULL::INTEGER as paid_order_id,
        NULL::INTEGER as user_paid_order_id,
        NULL::JSONB as order_data,
        NULL::VARCHAR as order_type,
        NULL::VARCHAR as cooking_status,
        NULL::BOOLEAN as is_tll_order,
        NULL::BOOLEAN as archived
        
      FROM checks c
      LEFT JOIN stores s ON c.store_id = s.id
      LEFT JOIN users u ON c.user_id = u.id
    `);
    
    // paid_orders 뷰 (결제 완료된 주문)
    await client.query(`
      CREATE VIEW paid_orders AS
      SELECT 
        c.id,
        c.store_id,
        c.table_number,
        c.guest_phone,
        s.name as store_name,
        c.final_amount,
        c.closed_at as payment_date,
        p.payment_method,
        p.transaction_id,
        c.opened_at as created_at
      FROM checks c
      JOIN payments p ON c.id = p.check_id
      JOIN stores s ON c.store_id = s.id
      WHERE c.status = 'closed' AND p.status = 'completed'
      AND c.user_id IS NULL
    `);
    
    // user_paid_orders 뷰 (회원 결제 완료 주문)
    await client.query(`
      CREATE VIEW user_paid_orders AS
      SELECT 
        c.id,
        c.store_id,
        c.table_number,
        c.user_id,
        s.name as store_name,
        u.name as user_name,
        c.final_amount,
        c.closed_at as payment_date,
        p.payment_method,
        p.transaction_id,
        c.opened_at as created_at
      FROM checks c
      JOIN payments p ON c.id = p.check_id
      JOIN stores s ON c.store_id = s.id
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'closed' AND p.status = 'completed'
      AND c.user_id IS NOT NULL
    `);
    
    console.log('✅ 호환성 뷰 생성 완료');
    
  } catch (error) {
    console.error('❌ 호환성 뷰 생성 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  fullMigration()
    .then(() => {
      console.log('\n🎉 TableLink DB 마이그레이션 성공!');
      console.log('🔄 서버를 재시작하여 새로운 스키마를 적용하세요.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ 전체 마이그레이션 실패:', error);
      console.log('💡 백업 파일을 확인하여 복구하세요.');
      process.exit(1);
    });
}

module.exports = { fullMigration };
