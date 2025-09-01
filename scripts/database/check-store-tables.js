
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkStoreTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 store_tables 테이블 존재 여부 확인 중...');
    
    // 테이블 존재 여부 확인
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'store_tables'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ store_tables 테이블이 존재하지 않음 - 생성 중...');
      
      await client.query(`
        CREATE TABLE store_tables (
          id SERIAL PRIMARY KEY,
          store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
          table_number INTEGER NOT NULL,
          table_name VARCHAR(50),
          seats INTEGER DEFAULT 4,
          status VARCHAR(20) DEFAULT 'available',
          is_occupied BOOLEAN DEFAULT false,
          occupied_by VARCHAR(100),
          occupied_at TIMESTAMP,
          occupied_since TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(store_id, table_number)
        );
      `);
      
      // 기본 테이블 데이터 추가 (매장 1번에 테이블 10개)
      await client.query(`
        INSERT INTO store_tables (store_id, table_number, table_name, seats)
        SELECT 1, generate_series(1, 10), 'Table ' || generate_series(1, 10), 4
        WHERE EXISTS (SELECT 1 FROM stores WHERE id = 1);
      `);
      
      console.log('✅ store_tables 테이블 생성 및 기본 데이터 추가 완료');
    } else {
      console.log('✅ store_tables 테이블 존재함');
      
      // 매장 1번의 테이블 현황 확인
      const storeTablesResult = await client.query(`
        SELECT COUNT(*) as table_count
        FROM store_tables 
        WHERE store_id = 1
      `);
      
      console.log(`📊 매장 1번 테이블 수: ${storeTablesResult.rows[0].table_count}개`);
      
      if (parseInt(storeTablesResult.rows[0].table_count) === 0) {
        console.log('➕ 매장 1번에 기본 테이블 추가 중...');
        await client.query(`
          INSERT INTO store_tables (store_id, table_number, table_name, seats)
          SELECT 1, generate_series(1, 10), 'Table ' || generate_series(1, 10), 4;
        `);
        console.log('✅ 매장 1번에 테이블 10개 추가 완료');
      }
    }
    
    // store_promotions 테이블도 확인
    const promotionsTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'store_promotions'
      );
    `);
    
    if (!promotionsTableExists.rows[0].exists) {
      console.log('❌ store_promotions 테이블이 존재하지 않음 - 생성 중...');
      
      await client.query(`
        CREATE TABLE store_promotions (
          id SERIAL PRIMARY KEY,
          store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log('✅ store_promotions 테이블 생성 완료');
    } else {
      console.log('✅ store_promotions 테이블 존재함');
    }
    
  } catch (error) {
    console.error('❌ 테이블 확인 실패:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStoreTables();
