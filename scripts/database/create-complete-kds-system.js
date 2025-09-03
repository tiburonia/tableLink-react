
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

console.log('🔍 환경변수 확인:');
console.log('DATABASE_URL 존재:', !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function createCompleteKDSSystem() {
  let client;
  
  try {
    console.log('🚀 완전한 KDS/KRP 시스템 생성 시작...');
    
    // 연결 테스트
    console.log('🔗 데이터베이스 연결 테스트 중...');
    client = await pool.connect();
    console.log('✅ 데이터베이스 연결 성공');
    
    await client.query('BEGIN');
    console.log('✅ 트랜잭션 시작');
    
    // 기존 테이블 존재 확인 및 삭제 (필요시)
    console.log('🧹 기존 KDS 테이블 확인 및 정리...');
    await client.query(`
      DROP TABLE IF EXISTS kds_events CASCADE;
      DROP TABLE IF EXISTS print_jobs CASCADE;
      DROP TABLE IF EXISTS kds_ticket_items CASCADE;
      DROP TABLE IF EXISTS kds_tickets CASCADE;
      DROP TABLE IF EXISTS kds_station_routes CASCADE;
      DROP TABLE IF EXISTS printers CASCADE;
      DROP TABLE IF EXISTS kds_stations CASCADE;
    `);
    
    // 1. 스테이션 테이블
    console.log('🏭 KDS 스테이션 테이블 생성...');
    await client.query(`
      CREATE TABLE kds_stations (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        is_expo BOOLEAN DEFAULT FALSE,
        default_printer_id INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. 프린터 테이블 (스테이션과 독립적으로 먼저 생성)
    console.log('🖨️ 프린터 테이블 생성...');
    await client.query(`
      CREATE TABLE printers (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'ESCPOS_NET',
        conn_uri TEXT,
        status TEXT DEFAULT 'ONLINE',
        last_seen TIMESTAMP,
        CONSTRAINT chk_printer_type CHECK (type IN ('ESCPOS_NET', 'ESCPOS_USB', 'CLOUD_AGENT')),
        CONSTRAINT chk_printer_status CHECK (status IN ('ONLINE', 'OFFLINE', 'UNKNOWN'))
      )
    `);
    
    // 3. 스테이션 라우팅 테이블
    console.log('🗺️ 스테이션 라우팅 테이블 생성...');
    await client.query(`
      CREATE TABLE kds_station_routes (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        menu_id INTEGER,
        category_id INTEGER,
        station_id INTEGER NOT NULL REFERENCES kds_stations(id) ON DELETE CASCADE,
        prep_sec INTEGER DEFAULT 600,
        UNIQUE (store_id, menu_id, category_id, station_id)
      )
    `);
    
    // 4. KDS 티켓 테이블
    console.log('🎫 KDS 티켓 테이블 생성...');
    await client.query(`
      CREATE TABLE kds_tickets (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        check_id INTEGER,
        station_id INTEGER NOT NULL REFERENCES kds_stations(id) ON DELETE CASCADE,
        course_no INTEGER DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'OPEN',
        priority INTEGER DEFAULT 0,
        source_system TEXT NOT NULL DEFAULT 'TLL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fired_at TIMESTAMP,
        ready_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_ticket_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'READY', 'BUMPED')),
        CONSTRAINT chk_source_system CHECK (source_system IN ('TLL', 'POS', 'ADMIN'))
      )
    `);
    
    // 5. KDS 티켓 아이템 테이블
    console.log('🍽️ KDS 티켓 아이템 테이블 생성...');
    await client.query(`
      CREATE TABLE kds_ticket_items (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES kds_tickets(id) ON DELETE CASCADE,
        check_item_id INTEGER,
        menu_id INTEGER,
        menu_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        options JSONB NOT NULL DEFAULT '{}',
        kds_status TEXT NOT NULL DEFAULT 'PENDING',
        cook_station TEXT,
        est_prep_sec INTEGER DEFAULT 600,
        notes TEXT,
        started_at TIMESTAMP,
        done_at TIMESTAMP,
        expo_at TIMESTAMP,
        served_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_kds_status CHECK (kds_status IN ('PENDING', 'COOKING', 'DONE', 'EXPO', 'SERVED', 'HOLD', 'CANCELED'))
      )
    `);
    
    // 6. KDS 이벤트 테이블
    console.log('📊 KDS 이벤트 테이블 생성...');
    await client.query(`
      CREATE TABLE kds_events (
        id BIGSERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        ticket_id INTEGER REFERENCES kds_tickets(id) ON DELETE CASCADE,
        ticket_item_id INTEGER REFERENCES kds_ticket_items(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        payload JSONB DEFAULT '{}',
        actor_type TEXT,
        actor_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 7. 프린트 잡 테이블
    console.log('📄 프린트 잡 테이블 생성...');
    await client.query(`
      CREATE TABLE print_jobs (
        id BIGSERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        printer_id INTEGER NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
        ref_type TEXT NOT NULL,
        ref_id INTEGER NOT NULL,
        job_type TEXT NOT NULL,
        template_code TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'QUEUED',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        idempotency_key TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_ref_type CHECK (ref_type IN ('TICKET', 'TICKET_ITEM', 'CHECK')),
        CONSTRAINT chk_job_type CHECK (job_type IN ('NEW_ORDER', 'ADD_ON', 'VOID', 'READY_SLIP', 'REPRINT')),
        CONSTRAINT chk_print_status CHECK (status IN ('QUEUED', 'PRINTING', 'SUCCESS', 'FAILED', 'CANCELED'))
      )
    `);
    
    // 8. 기본 스테이션 데이터 생성
    console.log('🏭 기본 스테이션 데이터 생성...');
    
    // 매장별 기본 스테이션 생성 (1~3번 매장)
    for (let storeId = 1; storeId <= 3; storeId++) {
      // 스테이션 생성
      const stationInserts = [
        [storeId, '주방', 'MAIN_' + storeId, false],
        [storeId, '음료', 'DRINK_' + storeId, false],
        [storeId, '튀김', 'FRY_' + storeId, false],
        [storeId, '엑스포', 'EXPO_' + storeId, true]
      ];
      
      for (const [store_id, name, code, is_expo] of stationInserts) {
        await client.query(`
          INSERT INTO kds_stations (store_id, name, code, is_expo) 
          VALUES ($1, $2, $3, $4)
        `, [store_id, name, code, is_expo]);
      }
      
      // 프린터 생성
      await client.query(`
        INSERT INTO printers (store_id, name, type, status) VALUES
        ($1, '주방프린터', 'ESCPOS_NET', 'ONLINE'),
        ($1, '엑스포프린터', 'ESCPOS_NET', 'ONLINE')
      `, [storeId]);
    }
    
    // 9. check_items 테이블 컬럼 추가 (있으면 무시)
    console.log('🔧 check_items 테이블 KDS 컬럼 추가...');
    try {
      await client.query(`
        ALTER TABLE check_items 
        ADD COLUMN kds_status TEXT DEFAULT 'PENDING'
      `);
    } catch (e) {
      console.log('ℹ️ kds_status 컬럼 이미 존재');
    }
    
    try {
      await client.query(`
        ALTER TABLE check_items 
        ADD COLUMN station_id INTEGER
      `);
    } catch (e) {
      console.log('ℹ️ station_id 컬럼 이미 존재');
    }
    
    try {
      await client.query(`
        ALTER TABLE check_items 
        ADD COLUMN course_no INTEGER DEFAULT 1
      `);
    } catch (e) {
      console.log('ℹ️ course_no 컬럼 이미 존재');
    }
    
    // 10. 실시간 알림 함수 생성
    console.log('⚡ KDS 실시간 트리거 생성...');
    await client.query(`
      CREATE OR REPLACE FUNCTION kds_notify_trigger_func()
      RETURNS TRIGGER AS $$
      BEGIN
        PERFORM pg_notify('kds_updates', 
          json_build_object(
            'type', 'item_status_change',
            'item_id', COALESCE(NEW.id, OLD.id),
            'ticket_id', COALESCE(NEW.ticket_id, OLD.ticket_id),
            'old_status', COALESCE(OLD.kds_status, ''),
            'new_status', COALESCE(NEW.kds_status, ''),
            'timestamp', EXTRACT(epoch FROM NOW())
          )::text
        );
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS kds_notify_trigger ON kds_ticket_items;
      CREATE TRIGGER kds_notify_trigger
        AFTER INSERT OR UPDATE OR DELETE ON kds_ticket_items
        FOR EACH ROW EXECUTE FUNCTION kds_notify_trigger_func();
    `);
    
    await client.query('COMMIT');
    console.log('✅ 트랜잭션 커밋 완료');
    
    console.log('🎉 완전한 KDS/KRP 시스템 생성 완료!');
    console.log('📊 생성된 테이블:');
    console.log('  - kds_stations (스테이션)');
    console.log('  - kds_station_routes (라우팅)');
    console.log('  - kds_tickets (티켓)');
    console.log('  - kds_ticket_items (티켓 아이템)');
    console.log('  - kds_events (이벤트)');
    console.log('  - printers (프린터)');
    console.log('  - print_jobs (프린트 잡)');
    
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('🔄 트랜잭션 롤백 완료');
      } catch (rollbackError) {
        console.error('❌ 롤백 실패:', rollbackError);
      }
    }
    console.error('❌ KDS/KRP 시스템 생성 실패:', error);
    console.error('상세 오류:', error.message);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
        console.log('🔌 데이터베이스 연결 해제');
      } catch (releaseError) {
        console.error('❌ 연결 해제 실패:', releaseError);
      }
    }
  }
}

async function testConnection() {
  try {
    console.log('🧪 데이터베이스 연결 테스트...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ 연결 테스트 성공:', result.rows[0]);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error.message);
    return false;
  }
}

async function main() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('💥 데이터베이스에 연결할 수 없습니다.');
      process.exit(1);
    }
    
    await createCompleteKDSSystem();
    console.log('🎉 스크립트 실행 완료');
    process.exit(0);
  } catch (error) {
    console.error('💥 스크립트 실행 실패:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createCompleteKDSSystem };
