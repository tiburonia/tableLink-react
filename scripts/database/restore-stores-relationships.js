
const pool = require('../../shared/config/database');

async function restoreStoresRelationships() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 stores 테이블 참조관계 복원 시작...');
    console.log('✅ PostgreSQL 데이터베이스 연결');

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 1. 백업 테이블 확인
    console.log('📦 1단계: 백업 테이블 확인...');
    const backupExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'stores_backup'
      )
    `);

    if (!backupExists.rows[0].exists) {
      throw new Error('❌ stores_backup 테이블이 존재하지 않습니다. 복원할 데이터가 없습니다.');
    }

    const backupCount = await client.query('SELECT COUNT(*) as count FROM stores_backup');
    console.log(`✅ 백업 확인: ${backupCount.rows[0].count}개 매장 데이터`);

    // 2. 현재 stores 테이블 초기화
    console.log('🗑️ 2단계: 현재 stores 테이블 데이터 초기화...');
    await client.query('DELETE FROM stores');
    console.log('✅ 기존 stores 데이터 삭제 완료');

    // 3. 백업 데이터를 현재 stores 테이블로 복원
    console.log('📥 3단계: 백업 데이터 복원...');
    await client.query(`
      INSERT INTO stores (id, name, category, is_open, rating_average, review_count, favorite_count, description, created_at, updated_at)
      SELECT id, name, category, is_open, rating_average, review_count, favorite_count, description, created_at, updated_at
      FROM stores_backup
      ORDER BY id
    `);

    // stores 시퀀스 재설정
    const maxIdResult = await client.query('SELECT MAX(id) as max_id FROM stores');
    const maxId = maxIdResult.rows[0].max_id || 0;
    await client.query(`SELECT setval('stores_id_seq', ${maxId})`);

    const restoredCount = await client.query('SELECT COUNT(*) as count FROM stores');
    console.log(`✅ stores 데이터 복원 완료: ${restoredCount.rows[0].count}개 매장`);

    // 4. 관련 테이블들 확인 및 복원 준비
    console.log('🔗 4단계: 관련 테이블들 확인...');
    
    const relatedTables = [
      'store_address', 'store_tables', 'store_hours', 'store_holidays', 
      'store_promotions', 'menu_groups', 'menu_items', 'prep_stations',
      'reviews', 'favorites', 'orders', 'reservations', 'waitlists'
    ];

    const existingTables = {};
    for (const tableName of relatedTables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [tableName]);
      
      existingTables[tableName] = exists.rows[0].exists;
      
      if (exists.rows[0].exists) {
        const count = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`  ✅ ${tableName}: ${count.rows[0].count}개 레코드`);
      } else {
        console.log(`  ❌ ${tableName}: 테이블 없음`);
      }
    }

    // 5. store_address 테이블 확인 및 복원
    if (existingTables['store_address']) {
      console.log('🏠 5단계: store_address 참조관계 확인...');
      
      // store_address의 고아 레코드 확인
      const orphanAddresses = await client.query(`
        SELECT sa.*, s.id as store_exists
        FROM store_address sa
        LEFT JOIN stores s ON sa.store_id = s.id
        WHERE s.id IS NULL
      `);

      if (orphanAddresses.rows.length > 0) {
        console.log(`⚠️ ${orphanAddresses.rows.length}개의 고아 주소 레코드 발견`);
        
        // 고아 레코드 삭제
        const deletedOrphans = await client.query(`
          DELETE FROM store_address 
          WHERE store_id NOT IN (SELECT id FROM stores)
        `);
        console.log(`🗑️ ${deletedOrphans.rowCount}개 고아 주소 레코드 삭제`);
      }

      // 주소가 없는 매장에 대한 기본 주소 생성
      const missingAddresses = await client.query(`
        SELECT s.id, s.name
        FROM stores s
        LEFT JOIN store_address sa ON s.id = sa.store_id
        WHERE sa.store_id IS NULL
      `);

      if (missingAddresses.rows.length > 0) {
        console.log(`🏗️ ${missingAddresses.rows.length}개 매장에 기본 주소 생성...`);
        
        for (const store of missingAddresses.rows) {
          await client.query(`
            INSERT INTO store_address (store_id, address_full, sido, sigungu, eupmyeondong, latitude, longitude)
            VALUES ($1, $2, '서울특별시', '중구', '명동', 37.5665, 126.9780)
          `, [store.id, `서울특별시 중구 명동 ${store.id}번지`]);
        }
        console.log('✅ 기본 주소 생성 완료');
      }
    }

    // 6. store_tables 참조관계 확인
    if (existingTables['store_tables']) {
      console.log('🪑 6단계: store_tables 참조관계 확인...');
      
      const orphanTables = await client.query(`
        DELETE FROM store_tables 
        WHERE store_id NOT IN (SELECT id FROM stores)
      `);
      
      if (orphanTables.rowCount > 0) {
        console.log(`🗑️ ${orphanTables.rowCount}개 고아 테이블 레코드 삭제`);
      }
    }

    // 7. menu_items 참조관계 확인
    if (existingTables['menu_items']) {
      console.log('🍽️ 7단계: menu_items 참조관계 확인...');
      
      const orphanMenuItems = await client.query(`
        DELETE FROM menu_items 
        WHERE store_id NOT IN (SELECT id FROM stores)
      `);
      
      if (orphanMenuItems.rowCount > 0) {
        console.log(`🗑️ ${orphanMenuItems.rowCount}개 고아 메뉴 아이템 삭제`);
      }
    }

    // 8. reviews 참조관계 확인
    if (existingTables['reviews']) {
      console.log('⭐ 8단계: reviews 참조관계 확인...');
      
      const orphanReviews = await client.query(`
        DELETE FROM reviews 
        WHERE store_id NOT IN (SELECT id FROM stores)
      `);
      
      if (orphanReviews.rowCount > 0) {
        console.log(`🗑️ ${orphanReviews.rowCount}개 고아 리뷰 삭제`);
      }
    }

    // 9. favorites 참조관계 확인
    if (existingTables['favorites']) {
      console.log('❤️ 9단계: favorites 참조관계 확인...');
      
      const orphanFavorites = await client.query(`
        DELETE FROM favorites 
        WHERE store_id NOT IN (SELECT id FROM stores)
      `);
      
      if (orphanFavorites.rowCount > 0) {
        console.log(`🗑️ ${orphanFavorites.rowCount}개 고아 즐겨찾기 삭제`);
      }
    }

    // 10. orders 참조관계 확인
    if (existingTables['orders']) {
      console.log('📋 10단계: orders 참조관계 확인...');
      
      const orphanOrders = await client.query(`
        DELETE FROM orders 
        WHERE store_id NOT IN (SELECT id FROM stores)
      `);
      
      if (orphanOrders.rowCount > 0) {
        console.log(`🗑️ ${orphanOrders.rowCount}개 고아 주문 삭제`);
      }
    }

    // 11. 외래키 제약조건 재생성
    console.log('🔗 11단계: 외래키 제약조건 재생성...');
    
    const foreignKeyConstraints = [
      {
        table: 'store_address',
        constraint: 'store_address_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)'
      },
      {
        table: 'store_tables',
        constraint: 'store_tables_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)'
      },
      {
        table: 'menu_items',
        constraint: 'menu_items_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)'
      },
      {
        table: 'reviews',
        constraint: 'reviews_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)'
      },
      {
        table: 'favorites',
        constraint: 'favorites_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)'
      }
    ];

    for (const fk of foreignKeyConstraints) {
      if (existingTables[fk.table]) {
        try {
          // 기존 제약조건 삭제 (있을 경우)
          await client.query(`
            ALTER TABLE ${fk.table} 
            DROP CONSTRAINT IF EXISTS ${fk.constraint}
          `);

          // 새 제약조건 추가
          await client.query(`
            ALTER TABLE ${fk.table} 
            ADD CONSTRAINT ${fk.constraint} 
            FOREIGN KEY (${fk.column}) REFERENCES ${fk.references} ON DELETE CASCADE
          `);
          
          console.log(`  ✅ ${fk.table} 외래키 제약조건 복원`);
        } catch (error) {
          console.log(`  ⚠️ ${fk.table} 외래키 제약조건 복원 실패: ${error.message}`);
        }
      }
    }

    // 12. 최종 검증
    console.log('🔍 12단계: 참조관계 무결성 최종 검증...');
    
    const finalChecks = [
      {
        name: 'store_address',
        query: `SELECT COUNT(*) as count FROM store_address sa JOIN stores s ON sa.store_id = s.id`
      },
      {
        name: 'store_tables',
        query: `SELECT COUNT(*) as count FROM store_tables st JOIN stores s ON st.store_id = s.id`
      },
      {
        name: 'menu_items',
        query: `SELECT COUNT(*) as count FROM menu_items mi JOIN stores s ON mi.store_id = s.id`
      },
      {
        name: 'reviews',
        query: `SELECT COUNT(*) as count FROM reviews r JOIN stores s ON r.store_id = s.id`
      },
      {
        name: 'favorites',
        query: `SELECT COUNT(*) as count FROM favorites f JOIN stores s ON f.store_id = s.id`
      }
    ];

    for (const check of finalChecks) {
      if (existingTables[check.name]) {
        try {
          const result = await client.query(check.query);
          console.log(`  ✅ ${check.name}: ${result.rows[0].count}개 유효한 참조`);
        } catch (error) {
          console.log(`  ❌ ${check.name}: 참조관계 검증 실패`);
        }
      }
    }

    // 13. stores 테이블 통계 업데이트
    console.log('📊 13단계: stores 테이블 통계 업데이트...');
    
    // review_count 재계산
    await client.query(`
      UPDATE stores 
      SET review_count = (
        SELECT COUNT(*) 
        FROM reviews 
        WHERE reviews.store_id = stores.id
      )
    `);

    // favorite_count 재계산
    await client.query(`
      UPDATE stores 
      SET favorite_count = (
        SELECT COUNT(*) 
        FROM favorites 
        WHERE favorites.store_id = stores.id
      )
    `);

    // rating_average 재계산
    await client.query(`
      UPDATE stores 
      SET rating_average = (
        SELECT ROUND(AVG(rating), 2)
        FROM reviews 
        WHERE reviews.store_id = stores.id
        GROUP BY store_id
      )
      WHERE id IN (SELECT DISTINCT store_id FROM reviews)
    `);

    console.log('✅ stores 테이블 통계 업데이트 완료');

    // 트랜잭션 커밋
    await client.query('COMMIT');

    // 14. 최종 결과 확인
    console.log('🎯 14단계: 최종 결과 확인...');
    
    const finalStoreCount = await client.query('SELECT COUNT(*) as count FROM stores');
    const addressCount = await client.query('SELECT COUNT(*) as count FROM store_address WHERE store_id IN (SELECT id FROM stores)');
    const tablesCount = await client.query('SELECT COUNT(*) as count FROM store_tables WHERE store_id IN (SELECT id FROM stores)');
    const menuCount = await client.query('SELECT COUNT(*) as count FROM menu_items WHERE store_id IN (SELECT id FROM stores)');
    const reviewsCount = await client.query('SELECT COUNT(*) as count FROM reviews WHERE store_id IN (SELECT id FROM stores)');
    const favoritesCount = await client.query('SELECT COUNT(*) as count FROM favorites WHERE store_id IN (SELECT id FROM stores)');

    console.log('\n📊 최종 복원 결과:');
    console.log(`✅ stores: ${finalStoreCount.rows[0].count}개 매장`);
    console.log(`✅ store_address: ${addressCount.rows[0].count}개 주소`);
    console.log(`✅ store_tables: ${tablesCount.rows[0].count}개 테이블`);
    console.log(`✅ menu_items: ${menuCount.rows[0].count}개 메뉴`);
    console.log(`✅ reviews: ${reviewsCount.rows[0].count}개 리뷰`);
    console.log(`✅ favorites: ${favoritesCount.rows[0].count}개 즐겨찾기`);

    // 샘플 매장 확인
    const sampleStores = await client.query(`
      SELECT s.id, s.name, s.category, s.review_count, s.favorite_count,
             sa.address_full
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      ORDER BY s.id
      LIMIT 10
    `);

    console.log('\n🔬 복원된 샘플 매장:');
    sampleStores.rows.forEach(store => {
      console.log(`  - ID ${store.id}: ${store.name} (${store.category})`);
      console.log(`    주소: ${store.address_full || '주소 없음'}`);
      console.log(`    리뷰: ${store.review_count}개, 즐겨찾기: ${store.favorite_count}개`);
    });

    console.log('\n🎉 stores 테이블 참조관계 복원 완료!');
    console.log('💡 이제 Replit Database 패널에서 stores 테이블의 외래키 관계를 확인할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 참조관계 복원 실패:', error);
    console.log('🔄 롤백 중...');
    
    try {
      await client.query('ROLLBACK');
      console.log('✅ 롤백 완료 - 변경사항이 취소되었습니다.');
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
  restoreStoresRelationships();
}

module.exports = { restoreStoresRelationships };
