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

    // 4. 관련 테이블들 확인 및 각 테이블의 컬럼 구조 확인
    console.log('🔗 4단계: 관련 테이블들 확인...');

    const relatedTables = [
      'store_address', 'store_tables', 'store_hours', 'store_holidays', 
      'store_promotions', 'menu_groups', 'menu_items', 'prep_stations',
      'reviews', 'favorites', 'orders', 'reservations', 'waitlists',
      'user_paid_orders', 'carts', 'checks'
    ];

    const existingTables = {};
    const tableColumns = {};

    for (const tableName of relatedTables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [tableName]);

      existingTables[tableName] = exists.rows[0].exists;

      if (exists.rows[0].exists) {
        // 각 테이블의 컬럼 구조 확인
        const columnsResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [tableName]);

        tableColumns[tableName] = columnsResult.rows.map(row => row.column_name);

        try {
          const count = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`  ✅ ${tableName}: ${count.rows[0].count}개 레코드 (컬럼: ${tableColumns[tableName].join(', ')})`);
        } catch (error) {
          console.log(`  ⚠️ ${tableName}: 카운트 실패 - ${error.message}`);
        }
      } else {
        console.log(`  ❌ ${tableName}: 테이블 없음`);
      }
    }

    // 5. 안전한 고아 레코드 정리 (store_id 컬럼이 있는 테이블만)
    console.log('🧹 5단계: 고아 레코드 정리...');

    const safeTablesToClean = [
      'store_address', 'store_tables', 'store_hours', 'store_holidays',
      'store_promotions', 'menu_groups', 'menu_items', 'prep_stations',
      'reviews', 'favorites', 'reservations', 'waitlists', 'carts'
    ];

    for (const tableName of safeTablesToClean) {
      if (existingTables[tableName] && tableColumns[tableName] && tableColumns[tableName].includes('store_id')) {
        try {
          const result = await client.query(`
            DELETE FROM ${tableName} WHERE store_id NOT IN (SELECT id FROM stores)
          `);
          if (result.rowCount > 0) {
            console.log(`  🗑️ ${tableName}: ${result.rowCount}개 고아 레코드 삭제`);
          } else {
            console.log(`  ✅ ${tableName}: 고아 레코드 없음`);
          }
        } catch (error) {
          console.log(`  ⚠️ ${tableName}: 정리 실패 - ${error.message}`);
          // 트랜잭션 오류가 발생하면 롤백하고 다시 시작
          await client.query('ROLLBACK');
          await client.query('BEGIN');
          console.log(`  🔄 트랜잭션 재시작 후 계속 진행`);
        }
      } else if (existingTables[tableName]) {
        console.log(`  ⚠️ ${tableName}: store_id 컬럼 없음 - 건너뜀`);
      }
    }

    // orders 테이블 특별 처리 - 컬럼 존재 여부를 더 정확히 확인
    if (existingTables['orders']) {
      console.log('🔍 orders 테이블 특별 처리...');
      
      // orders 테이블의 컬럼을 다시 정확히 확인
      const ordersColumnsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'store_id'
      `);
      
      if (ordersColumnsCheck.rows.length > 0) {
        try {
          const result = await client.query(`
            DELETE FROM orders WHERE store_id NOT IN (SELECT id FROM stores)
          `);
          console.log(`  ✅ orders: ${result.rowCount}개 고아 레코드 삭제`);
        } catch (error) {
          console.log(`  ⚠️ orders: 정리 실패 - ${error.message}`);
          await client.query('ROLLBACK');
          await client.query('BEGIN');
          console.log(`  🔄 트랜잭션 재시작 후 계속 진행`);
        }
      } else {
        console.log('  ℹ️ orders 테이블에 store_id 컬럼이 없음 - 건너뜀');
      }
    }

    // checks 테이블 특별 처리 - 컬럼 존재 여부를 더 정확히 확인
    if (existingTables['checks']) {
      console.log('🔍 checks 테이블 특별 처리...');
      
      // checks 테이블의 컬럼을 다시 정확히 확인
      const checksColumnsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'checks' 
        AND column_name = 'store_id'
      `);
      
      if (checksColumnsCheck.rows.length > 0) {
        try {
          const result = await client.query(`
            DELETE FROM checks WHERE store_id NOT IN (SELECT id FROM stores)
          `);
          console.log(`  ✅ checks: ${result.rowCount}개 고아 레코드 삭제`);
        } catch (error) {
          console.log(`  ⚠️ checks: 정리 실패 - ${error.message}`);
          await client.query('ROLLBACK');
          await client.query('BEGIN');
          console.log(`  🔄 트랜잭션 재시작 후 계속 진행`);
        }
      } else {
        console.log('  ℹ️ checks 테이블에 store_id 컬럼이 없음 - 건너뜀');
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

    // 7. 외래키 제약조건 재생성 (store_id 컬럼이 있는 테이블만)
    console.log('🔗 7단계: 외래키 제약조건 재생성...');

    const foreignKeyConstraints = [
      { table: 'store_address', constraint: 'store_address_store_id_fkey', column: 'store_id' },
      { table: 'store_tables', constraint: 'store_tables_store_id_fkey', column: 'store_id' },
      { table: 'store_hours', constraint: 'store_hours_store_id_fkey', column: 'store_id' },
      { table: 'store_holidays', constraint: 'store_holidays_store_id_fkey', column: 'store_id' },
      { table: 'store_promotions', constraint: 'store_promotions_store_id_fkey', column: 'store_id' },
      { table: 'menu_groups', constraint: 'menu_groups_store_id_fkey', column: 'store_id' },
      { table: 'menu_items', constraint: 'menu_items_store_id_fkey', column: 'store_id' },
      { table: 'prep_stations', constraint: 'prep_stations_store_id_fkey', column: 'store_id' },
      { table: 'reviews', constraint: 'reviews_store_id_fkey', column: 'store_id' },
      { table: 'favorites', constraint: 'favorites_store_id_fkey', column: 'store_id' },
      { table: 'orders', constraint: 'orders_store_id_fkey', column: 'store_id' },
      { table: 'reservations', constraint: 'reservations_store_id_fkey', column: 'store_id' },
      { table: 'waitlists', constraint: 'waitlists_store_id_fkey', column: 'store_id' },
      { table: 'carts', constraint: 'carts_store_id_fkey', column: 'store_id' },
      { table: 'checks', constraint: 'checks_store_id_fkey', column: 'store_id' }
    ];

    for (const fk of foreignKeyConstraints) {
      if (existingTables[fk.table] && tableColumns[fk.table] && tableColumns[fk.table].includes(fk.column)) {
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
            FOREIGN KEY (${fk.column}) REFERENCES stores(id) ON DELETE CASCADE
          `);

          console.log(`  ✅ ${fk.table} 외래키 제약조건 복원`);
        } catch (error) {
          console.log(`  ⚠️ ${fk.table} 외래키 제약조건 복원 실패: ${error.message}`);
        }
      } else if (existingTables[fk.table]) {
        console.log(`  ⚠️ ${fk.table}: ${fk.column} 컬럼 없음 - 외래키 건너뜀`);
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

    const validationTables = [
      'store_address', 'store_tables', 'store_hours', 'menu_items', 
      'reviews', 'favorites', 'orders'
    ];

    for (const tableName of validationTables) {
      if (existingTables[tableName] && tableColumns[tableName] && tableColumns[tableName].includes('store_id')) {
        try {
          const result = await client.query(`
            SELECT COUNT(*) as count 
            FROM ${tableName} t 
            JOIN stores s ON t.store_id = s.id
          `);
          console.log(`  ✅ ${tableName}: ${result.rows[0].count}개 유효한 참조`);
        } catch (error) {
          console.log(`  ❌ ${tableName}: 참조관계 검증 실패 - ${error.message}`);
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

    // 각 관련 테이블 카운트 (store_id가 있는 테이블만)
    for (const tableName of Object.keys(existingTables)) {
      if (existingTables[tableName] && tableColumns[tableName] && tableColumns[tableName].includes('store_id')) {
        try {
          const count = await client.query(`
            SELECT COUNT(*) as count 
            FROM ${tableName} 
            WHERE store_id IN (SELECT id FROM stores)
          `);
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