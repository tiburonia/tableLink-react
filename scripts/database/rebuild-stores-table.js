
const pool = require('../../shared/config/database');

async function rebuildStoresTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 stores 테이블 완전 재생성 시작...');
    console.log('✅ PostgreSQL 데이터베이스 연결');

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 1. 기존 stores 테이블 백업
    console.log('📦 1단계: 기존 stores 테이블 백업...');
    
    const backupExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'stores_backup'
      )
    `);

    if (backupExists.rows[0].exists) {
      await client.query('DROP TABLE stores_backup');
      console.log('  🗑️ 기존 백업 테이블 삭제');
    }

    // 기존 stores 데이터 백업
    await client.query(`
      CREATE TABLE stores_backup AS 
      SELECT * FROM stores
    `);
    
    const backupCount = await client.query('SELECT COUNT(*) as count FROM stores_backup');
    console.log(`  ✅ 백업 완료: ${backupCount.rows[0].count}개 매장 백업됨`);

    // 2. 관련 테이블의 외래키 제약조건 확인 및 데이터 백업
    console.log('🔗 2단계: 관련 테이블 외래키 데이터 백업...');
    
    const relatedTables = [
      'store_address', 'store_tables', 'store_hours', 'store_holidays',
      'menu_groups', 'menu_items', 'reviews', 'favorites', 'reservations',
      'waitlists', 'carts', 'checks', 'user_store_stats', 'promotions'
    ];

    const backupData = {};
    
    for (const tableName of relatedTables) {
      try {
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [tableName]);

        if (tableExists.rows[0].exists) {
          const hasStoreId = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = $1 AND column_name = 'store_id'
            )
          `, [tableName]);

          if (hasStoreId.rows[0].exists) {
            const data = await client.query(`SELECT * FROM ${tableName} WHERE store_id IS NOT NULL`);
            backupData[tableName] = data.rows;
            console.log(`  📋 ${tableName}: ${data.rows.length}개 레코드 백업`);
          }
        }
      } catch (error) {
        console.log(`  ⚠️ ${tableName} 백업 건너뜀: ${error.message}`);
      }
    }

    // 3. 외래키 제약조건이 있는 테이블들의 데이터 삭제
    console.log('🗑️ 3단계: 관련 테이블 데이터 삭제...');
    
    const deletionOrder = [
      'webhook_events', 'webhooks', 'notifications',
      'kds_screen_stations', 'terminals', 'staff_roles', 'staff',
      'carts', 'favorites', 'reviews', 'promotions', 'coupon_issues',
      'points_ledger', 'user_store_stats', 'qr_sessions', 'qr_codes',
      'waitlists', 'reservations', 'order_events', 'payment_allocations',
      'payments', 'adjustments', 'line_options', 'order_lines', 'orders', 'checks',
      'print_jobs', 'printers', 'item_option_groups', 'options', 'option_groups',
      'menu_items', 'menu_groups', 'prep_stations', 'store_holidays', 'store_hours',
      'store_tables', 'store_address'
    ];

    for (const tableName of deletionOrder) {
      try {
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [tableName]);

        if (tableExists.rows[0].exists) {
          const hasStoreId = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = $1 AND column_name = 'store_id'
            )
          `, [tableName]);

          if (hasStoreId.rows[0].exists) {
            const deleteResult = await client.query(`DELETE FROM ${tableName} WHERE store_id IS NOT NULL`);
            console.log(`  🗑️ ${tableName}: ${deleteResult.rowCount}개 레코드 삭제`);
          }
        }
      } catch (error) {
        console.log(`  ⚠️ ${tableName} 삭제 실패: ${error.message}`);
      }
    }

    // 4. stores 테이블 완전 삭제
    console.log('💥 4단계: stores 테이블 완전 삭제...');
    await client.query('DROP TABLE IF EXISTS stores CASCADE');
    console.log('  ✅ stores 테이블 완전 삭제 완료');

    // 5. 새로운 stores 테이블 생성 (최신 스키마)
    console.log('🏗️ 5단계: 새로운 stores 테이블 생성...');
    
    await client.query(`
      CREATE TABLE stores (
        id              BIGSERIAL PRIMARY KEY,
        name            VARCHAR(255) NOT NULL,
        category        VARCHAR(100),
        is_open         BOOLEAN DEFAULT true,
        rating_average  NUMERIC(3,2),
        review_count    INT DEFAULT 0,
        favorite_count  INT DEFAULT 0,
        description     TEXT,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('  ✅ 새로운 stores 테이블 생성 완료');

    // 6. 기본 샘플 데이터 삽입
    console.log('📦 6단계: 기본 샘플 데이터 삽입...');
    
    const sampleStores = [
      { name: '테스트 매장', category: '한식', description: '기본 테스트용 매장입니다.' },
      { name: '서울 중식 1호점', category: '중식', description: '짜장면과 짬뽕 전문점' },
      { name: '영등포구 맛집 2호점', category: '한식', description: '전통 한식 전문점' },
      { name: '마포구 맛집 3호점', category: '카페', description: '아메리카노와 디저트 전문' },
      { name: '일식 전문점 4호점', category: '일식', description: '초밥과 라멘 전문점' }
    ];

    const insertedStores = [];
    for (const store of sampleStores) {
      const result = await client.query(`
        INSERT INTO stores (name, category, description, is_open, rating_average, review_count, favorite_count)
        VALUES ($1, $2, $3, true, 4.5, 0, 0)
        RETURNING *
      `, [store.name, store.category, store.description]);
      
      insertedStores.push(result.rows[0]);
      console.log(`  ✅ ${store.name} (ID: ${result.rows[0].id}) 생성`);
    }

    // 7. 필수 관련 테이블들 재생성
    console.log('🔗 7단계: 필수 관련 테이블 재생성...');

    // store_address 테이블이 존재하지 않으면 생성
    const addressTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'store_address'
      )
    `);

    if (!addressTableExists.rows[0].exists) {
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
      console.log('  ✅ store_address 테이블 생성');
    }

    // 각 매장에 대한 주소 정보 생성
    for (const store of insertedStores) {
      await client.query(`
        INSERT INTO store_address (store_id, address_full, sido, sigungu, eupmyeondong, latitude, longitude)
        VALUES ($1, $2, '서울특별시', '중구', '명동', 37.5665, 126.9780)
      `, [store.id, `서울특별시 중구 명동 ${store.id}번지`]);
    }

    // store_tables 테이블 확인 및 기본 테이블 생성
    const tablesTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'store_tables'
      )
    `);

    if (tablesTableExists.rows[0].exists) {
      // 각 매장에 기본 테이블 생성
      for (const store of insertedStores) {
        for (let i = 1; i <= 5; i++) {
          await client.query(`
            INSERT INTO store_tables (store_id, table_number, table_name, seats)
            VALUES ($1, $2, $3, $4)
          `, [store.id, i, `테이블 ${i}`, i <= 2 ? 2 : 4]);
        }
      }
      console.log('  ✅ 기본 테이블 생성 완료');
    }

    // 8. 인덱스 재생성
    console.log('📊 8단계: 인덱스 재생성...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category)',
      'CREATE INDEX IF NOT EXISTS idx_stores_is_open ON stores(is_open)',
      'CREATE INDEX IF NOT EXISTS idx_stores_rating ON stores(rating_average)',
      'CREATE INDEX IF NOT EXISTS idx_stores_created ON stores(created_at)'
    ];

    for (const index of indexes) {
      await client.query(index);
      console.log(`  ✅ 인덱스 생성: ${index.split(' ')[3]}`);
    }

    // 트랜잭션 커밋
    await client.query('COMMIT');

    // 9. 최종 검증
    console.log('🔍 9단계: 최종 검증...');
    
    const finalCount = await client.query('SELECT COUNT(*) as count FROM stores');
    const addressCount = await client.query('SELECT COUNT(*) as count FROM store_address');
    
    console.log('\n📊 최종 결과:');
    console.log(`✅ 새로운 stores 테이블: ${finalCount.rows[0].count}개 매장`);
    console.log(`✅ store_address 테이블: ${addressCount.rows[0].count}개 주소`);
    console.log(`✅ 백업 테이블: stores_backup (복원 시 사용 가능)`);

    // 샘플 데이터 확인
    const sampleResult = await client.query('SELECT id, name, category, created_at FROM stores ORDER BY id LIMIT 5');
    console.log('\n🔬 생성된 샘플 데이터:');
    sampleResult.rows.forEach(row => {
      console.log(`  - ID ${row.id}: ${row.name} (${row.category})`);
    });

    console.log('\n🎉 stores 테이블 완전 재생성 완료!');
    console.log('💡 백업된 데이터는 stores_backup 테이블에서 확인 가능합니다.');
    
  } catch (error) {
    console.error('❌ stores 테이블 재생성 실패:', error);
    console.log('🔄 롤백 중...');
    
    try {
      await client.query('ROLLBACK');
      console.log('✅ 롤백 완료');
    } catch (rollbackError) {
      console.error('❌ 롤백 실패:', rollbackError);
    }
    
    throw error;
    
  } finally {
    client.release();
    process.exit(0);
  }
}

// 스크립트 실행
if (require.main === module) {
  rebuildStoresTable();
}

module.exports = { rebuildStoresTable };
