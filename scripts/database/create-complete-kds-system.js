
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createCompleteKDSSystem() {
  let client;
  
  try {
    console.log('🚀 완전한 KDS/KRP 시스템 생성 시작...');
    client = await pool.connect();
    
    await client.query('BEGIN');
    
    // 1. 스테이션 테이블
    console.log('🏭 KDS 스테이션 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kds_stations (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        is_expo BOOLEAN DEFAULT FALSE,
        default_printer_id INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. 스테이션 라우팅 테이블
    console.log('🗺️ 스테이션 라우팅 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kds_station_routes (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        menu_id INTEGER,
        category_id INTEGER,
        station_id INTEGER NOT NULL REFERENCES kds_stations(id) ON DELETE CASCADE,
        prep_sec INTEGER DEFAULT 600,
        UNIQUE (store_id, menu_id, category_id, station_id)
      )
    `);
    
    // 3. KDS 티켓 테이블
    console.log('🎫 KDS 티켓 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kds_tickets (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        check_id INTEGER NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
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
    
    // 4. KDS 티켓 아이템 테이블
    console.log('🍽️ KDS 티켓 아이템 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kds_ticket_items (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES kds_tickets(id) ON DELETE CASCADE,
        check_item_id INTEGER NOT NULL REFERENCES check_items(id) ON DELETE CASCADE,
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
    
    // 5. KDS 이벤트 테이블
    console.log('📊 KDS 이벤트 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kds_events (
        id BIGSERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        ticket_id INTEGER REFERENCES kds_tickets(id) ON DELETE CASCADE,
        ticket_item_id INTEGER REFERENCES kds_ticket_items(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        payload JSONB DEFAULT '{}',
        actor_type TEXT,
        actor_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 6. 프린터 테이블
    console.log('🖨️ 프린터 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS printers (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'ESCPOS_NET',
        conn_uri TEXT,
        status TEXT DEFAULT 'ONLINE',
        last_seen TIMESTAMP,
        CONSTRAINT chk_printer_type CHECK (type IN ('ESCPOS_NET', 'ESCPOS_USB', 'CLOUD_AGENT')),
        CONSTRAINT chk_printer_status CHECK (status IN ('ONLINE', 'OFFLINE', 'UNKNOWN'))
      )
    `);
    
    // 7. 프린트 잡 테이블
    console.log('📄 프린트 잡 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS print_jobs (
        id BIGSERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
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
    
    // 8. check_items 테이블에 KDS 컬럼 추가
    console.log('🔧 check_items 테이블 KDS 컬럼 추가...');
    await client.query(`
      ALTER TABLE check_items 
      ADD COLUMN IF NOT EXISTS kds_status TEXT DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS station_id INTEGER,
      ADD COLUMN IF NOT EXISTS course_no INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS fired_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS done_at TIMESTAMP
    `);
    
    // 9. 기본 스테이션 생성 (매장 1, 2에 대해)
    console.log('🏭 기본 스테이션 생성...');
    const stores = await client.query('SELECT id FROM stores LIMIT 3');
    
    for (const store of stores.rows) {
      await client.query(`
        INSERT INTO kds_stations (store_id, name, code, is_expo) VALUES
        ($1, '주방', 'MAIN', false),
        ($1, '음료', 'DRINK', false),
        ($1, '튀김', 'FRY', false),
        ($1, '엑스포', 'EXPO', true)
        ON CONFLICT (code) DO NOTHING
      `, [store.id]);
      
      // 기본 프린터 생성
      await client.query(`
        INSERT INTO printers (store_id, name, type, status) VALUES
        ($1, '주방프린터', 'ESCPOS_NET', 'ONLINE'),
        ($1, '엑스포프린터', 'ESCPOS_NET', 'ONLINE')
      `, [store.id]);
    }
    
    // 10. 트리거 함수 생성
    console.log('⚡ KDS 실시간 트리거 생성...');
    await client.query(`
      CREATE OR REPLACE FUNCTION kds_notify_trigger_func()
      RETURNS TRIGGER AS $$
      BEGIN
        -- KDS 이벤트 로그 생성
        INSERT INTO kds_events (
          store_id, ticket_item_id, event_type, payload, actor_type
        ) VALUES (
          (SELECT s.id FROM stores s JOIN kds_tickets t ON s.id = t.store_id JOIN kds_ticket_items ti ON t.id = ti.ticket_id WHERE ti.id = COALESCE(NEW.id, OLD.id)),
          COALESCE(NEW.id, OLD.id),
          CASE TG_OP
            WHEN 'INSERT' THEN 'ITEM_CREATED'
            WHEN 'UPDATE' THEN 'ITEM_STATUS_CHANGED'
            WHEN 'DELETE' THEN 'ITEM_DELETED'
          END,
          jsonb_build_object(
            'old_status', COALESCE(OLD.kds_status, ''),
            'new_status', COALESCE(NEW.kds_status, ''),
            'timestamp', EXTRACT(epoch FROM NOW())
          ),
          'SYSTEM'
        );
        
        -- 실시간 알림
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
      
      DROP TRIGGER IF EXISTS kds_notify_trigger ON kds_ticket_items;
      CREATE TRIGGER kds_notify_trigger
        AFTER INSERT OR UPDATE OR DELETE ON kds_ticket_items
        FOR EACH ROW EXECUTE FUNCTION kds_notify_trigger_func();
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ 완전한 KDS/KRP 시스템 생성 완료!');
    console.log('📊 생성된 테이블:');
    console.log('  - kds_stations (스테이션)');
    console.log('  - kds_station_routes (라우팅)');
    console.log('  - kds_tickets (티켓)');
    console.log('  - kds_ticket_items (티켓 아이템)');
    console.log('  - kds_events (이벤트)');
    console.log('  - printers (프린터)');
    console.log('  - print_jobs (프린트 잡)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ KDS/KRP 시스템 생성 실패:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
}

if (require.main === module) {
  createCompleteKDSSystem()
    .then(() => {
      console.log('🎉 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { createCompleteKDSSystem };
