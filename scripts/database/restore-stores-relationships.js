
const pool = require('../../shared/config/database');

async function restoreStoresRelationships() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 stores 테이블 참조관계 복원 시작...');
    console.log('✅ PostgreSQL 데이터베이스 연결');

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 1. 스키마 차이 확인 및 조정
    console.log('🔍 1단계: 스키마 차이 확인 및 조정...');
    
    // stores 테이블 스키마 확인
    const storesColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      ORDER BY ordinal_position
    `);
    
    const storesColumnNames = storesColumns.rows.map(row => row.column_name);
    console.log(`✅ 현재 stores 컬럼: ${storesColumnNames.join(', ')}`);

    // stores_backup 테이블 스키마 확인
    const backupExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'stores_backup'
      )
    `);

    if (!backupExists.rows[0].exists) {
      throw new Error('❌ stores_backup 테이블이 존재하지 않습니다. 복원할 데이터가 없습니다.');
    }

    const backupColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stores_backup' 
      ORDER BY ordinal_position
    `);
    
    const backupColumnNames = backupColumns.rows.map(row => row.column_name);
    console.log(`✅ 백업 stores 컬럼: ${backupColumnNames.join(', ')}`);

    // 공통 컬럼 찾기
    const commonColumns = storesColumnNames.filter(col => backupColumnNames.includes(col));
    console.log(`🔗 공통 컬럼: ${commonColumns.join(', ')}`);

    // 2. 현재 stores 테이블 초기화
    console.log('🗑️ 2단계: 현재 stores 테이블 데이터 초기화...');
    await client.query('DELETE FROM stores');
    console.log('✅ 기존 stores 데이터 삭제 완료');

    // 3. 백업 데이터를 공통 컬럼만으로 복원
    console.log('📥 3단계: 백업 데이터 복원...');
    
    const columnsList = commonColumns.join(', ');
    const insertQuery = `
      INSERT INTO stores (${columnsList})
      SELECT ${columnsList}
      FROM stores_backup
      ORDER BY id
    `;
    
    console.log(`🔧 복원 쿼리: ${insertQuery}`);
    await client.query(insertQuery);

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
      'reviews', 'favorites', 'orders', 'reservations', 'waitlists',
      'user_paid_orders', 'carts', 'checks'
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
        try {
          const count = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`  ✅ ${tableName}: ${count.rows[0].count}개 레코드`);
        } catch (error) {
          console.log(`  ⚠️ ${tableName}: 카운트 실패 - ${error.message}`);
        }
      } else {
        console.log(`  ❌ ${tableName}: 테이블 없음`);
      }
    }

    // 5. 고아 레코드 정리
    console.log('🧹 5단계: 고아 레코드 정리...');
    
    const cleanupQueries = [
      {
        table: 'store_address',
        query: `DELETE FROM store_address WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'store_tables',
        query: `DELETE FROM store_tables WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'store_hours',
        query: `DELETE FROM store_hours WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'store_holidays',
        query: `DELETE FROM store_holidays WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'store_promotions',
        query: `DELETE FROM store_promotions WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'menu_groups',
        query: `DELETE FROM menu_groups WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'menu_items',
        query: `DELETE FROM menu_items WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'prep_stations',
        query: `DELETE FROM prep_stations WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'reviews',
        query: `DELETE FROM reviews WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'favorites',
        query: `DELETE FROM favorites WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'orders',
        query: `DELETE FROM orders WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'reservations',
        query: `DELETE FROM reservations WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'waitlists',
        query: `DELETE FROM waitlists WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'carts',
        query: `DELETE FROM carts WHERE store_id NOT IN (SELECT id FROM stores)`
      },
      {
        table: 'checks',
        query: `DELETE FROM checks WHERE store_id NOT IN (SELECT id FROM stores)`
      }
    ];

    for (const cleanup of cleanupQueries) {
      if (existingTables[cleanup.table]) {
        try {
          const result = await client.query(cleanup.query);
          if (result.rowCount > 0) {
            console.log(`  🗑️ ${cleanup.table}: ${result.rowCount}개 고아 레코드 삭제`);
          } else {
            console.log(`  ✅ ${cleanup.table}: 고아 레코드 없음`);
          }
        } catch (error) {
          console.log(`  ⚠️ ${cleanup.table}: 정리 실패 - ${error.message}`);
        }
      }
    }

    // 6. 필수 테이블 데이터 보장
    console.log('🏗️ 6단계: 필수 테이블 데이터 보장...');

    // store_address 테이블 - 주소가 없는 매장에 기본 주소 생성
    if (existingTables['store_address']) {
      const missingAddresses = await client.query(`
        SELECT s.id, s.name
        FROM stores s
        LEFT JOIN store_address sa ON s.id = sa.store_id
        WHERE sa.store_id IS NULL
      `);

      if (missingAddresses.rows.length > 0) {
        console.log(`🏠 ${missingAddresses.rows.length}개 매장에 기본 주소 생성...`);
        
        for (const store of missingAddresses.rows) {
          await client.query(`
            INSERT INTO store_address (store_id, address_full, sido, sigungu, eupmyeondong, latitude, longitude)
            VALUES ($1, $2, '서울특별시', '중구', '명동', 37.5665, 126.9780)
          `, [store.id, `서울특별시 중구 명동 ${store.id}번지`]);
        }
        console.log('✅ 기본 주소 생성 완료');
      }
    }

    // 7. 외래키 제약조건 재생성
    console.log('🔗 7단계: 외래키 제약조건 재생성...');
    
    const foreignKeyConstraints = [
      {
        table: 'store_address',
        constraint: 'store_address_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'store_tables',
        constraint: 'store_tables_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'store_hours',
        constraint: 'store_hours_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'store_holidays',
        constraint: 'store_holidays_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'store_promotions',
        constraint: 'store_promotions_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'menu_groups',
        constraint: 'menu_groups_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'menu_items',
        constraint: 'menu_items_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'prep_stations',
        constraint: 'prep_stations_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'reviews',
        constraint: 'reviews_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'favorites',
        constraint: 'favorites_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'orders',
        constraint: 'orders_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'reservations',
        constraint: 'reservations_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'waitlists',
        constraint: 'waitlists_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'carts',
        constraint: 'carts_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'checks',
        constraint: 'checks_store_id_fkey',
        column: 'store_id',
        references: 'stores(id)',
        onDelete: 'CASCADE'
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
            FOREIGN KEY (${fk.column}) REFERENCES ${fk.references} ON DELETE ${fk.onDelete}
          `);
          
          console.log(`  ✅ ${fk.table} 외래키 제약조건 복원`);
        } catch (error) {
          console.log(`  ⚠️ ${fk.table} 외래키 제약조건 복원 실패: ${error.message}`);
        }
      }
    }

    // 8. stores 테이블 통계 업데이트
    console.log('📊 8단계: stores 테이블 통계 업데이트...');
    
    // review_count와 rating_average가 컬럼에 있는지 확인
    const hasReviewStats = storesColumnNames.includes('review_count') && storesColumnNames.includes('rating_average');
    const hasFavoriteCount = storesColumnNames.includes('favorite_count');

    if (hasReviewStats && existingTables['reviews']) {
      // review_count 재계산
      await client.query(`
        UPDATE stores 
        SET review_count = COALESCE((
          SELECT COUNT(*) 
          FROM reviews 
          WHERE reviews.store_id = stores.id
        ), 0)
      `);

      // rating_average 재계산
      await client.query(`
        UPDATE stores 
        SET rating_average = COALESCE((
          SELECT ROUND(AVG(rating), 2)
          FROM reviews 
          WHERE reviews.store_id = stores.id
          GROUP BY store_id
        ), 0)
      `);
      console.log('✅ 리뷰 통계 업데이트 완료');
    }

    if (hasFavoriteCount && existingTables['favorites']) {
      // favorite_count 재계산
      await client.query(`
        UPDATE stores 
        SET favorite_count = COALESCE((
          SELECT COUNT(*) 
          FROM favorites 
          WHERE favorites.store_id = stores.id
        ), 0)
      `);
      console.log('✅ 즐겨찾기 통계 업데이트 완료');
    }

    // 9. 최종 검증
    console.log('🔍 9단계: 참조관계 무결성 최종 검증...');
    
    const finalChecks = [
      { name: 'store_address', query: `SELECT COUNT(*) as count FROM store_address sa JOIN stores s ON sa.store_id = s.id` },
      { name: 'store_tables', query: `SELECT COUNT(*) as count FROM store_tables st JOIN stores s ON st.store_id = s.id` },
      { name: 'store_hours', query: `SELECT COUNT(*) as count FROM store_hours sh JOIN stores s ON sh.store_id = s.id` },
      { name: 'menu_items', query: `SELECT COUNT(*) as count FROM menu_items mi JOIN stores s ON mi.store_id = s.id` },
      { name: 'reviews', query: `SELECT COUNT(*) as count FROM reviews r JOIN stores s ON r.store_id = s.id` },
      { name: 'favorites', query: `SELECT COUNT(*) as count FROM favorites f JOIN stores s ON f.store_id = s.id` },
      { name: 'orders', query: `SELECT COUNT(*) as count FROM orders o JOIN stores s ON o.store_id = s.id` }
    ];

    for (const check of finalChecks) {
      if (existingTables[check.name]) {
        try {
          const result = await client.query(check.query);
          console.log(`  ✅ ${check.name}: ${result.rows[0].count}개 유효한 참조`);
        } catch (error) {
          console.log(`  ❌ ${check.name}: 참조관계 검증 실패 - ${error.message}`);
        }
      }
    }

    // 트랜잭션 커밋
    await client.query('COMMIT');

    // 10. 최종 결과 확인
    console.log('🎯 10단계: 최종 결과 확인...');
    
    const finalStoreCount = await client.query('SELECT COUNT(*) as count FROM stores');
    console.log(`\n📊 최종 복원 결과:`);
    console.log(`✅ stores: ${finalStoreCount.rows[0].count}개 매장`);

    // 각 관련 테이블 카운트
    for (const tableName of Object.keys(existingTables)) {
      if (existingTables[tableName]) {
        try {
          const count = await client.query(`SELECT COUNT(*) as count FROM ${tableName} WHERE store_id IN (SELECT id FROM stores)`);
          console.log(`✅ ${tableName}: ${count.rows[0].count}개 레코드`);
        } catch (error) {
          console.log(`⚠️ ${tableName}: 카운트 실패`);
        }
      }
    }

    // 샘플 매장 확인
    const sampleStores = await client.query(`
      SELECT s.id, s.name, s.category,
             ${hasReviewStats ? 's.review_count, s.rating_average,' : ''}
             ${hasFavoriteCount ? 's.favorite_count,' : ''}
             sa.address_full
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      ORDER BY s.id
      LIMIT 5
    `);

    console.log('\n🔬 복원된 샘플 매장:');
    sampleStores.rows.forEach(store => {
      console.log(`  - ID ${store.id}: ${store.name} (${store.category})`);
      console.log(`    주소: ${store.address_full || '주소 없음'}`);
      if (hasReviewStats) {
        console.log(`    리뷰: ${store.review_count || 0}개, 평점: ${store.rating_average || 0}`);
      }
      if (hasFavoriteCount) {
        console.log(`    즐겨찾기: ${store.favorite_count || 0}개`);
      }
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
    await pool.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  restoreStoresRelationships();
}

module.exports = { restoreStoresRelationships };
