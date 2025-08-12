
const pool = require('../../shared/config/database');

async function reorderStoreIds() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 stores 테이블 ID 순차 재배열 시작...');
    
    // 트랜잭션 시작
    await client.query('BEGIN');
    
    // 현재 매장 수 확인
    const countResult = await client.query('SELECT COUNT(*) as total FROM stores');
    const totalStores = parseInt(countResult.rows[0].total);
    console.log(`📊 총 매장 수: ${totalStores}개`);
    
    if (totalStores === 0) {
      console.log('❌ 재배열할 매장이 없습니다.');
      await client.query('ROLLBACK');
      return;
    }
    
    // 현재 stores 테이블 구조 확인
    console.log('📋 현재 stores 테이블 구조 확인...');
    const storeColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      ORDER BY ordinal_position
    `);
    
    console.log('현재 stores 테이블 컬럼:');
    storeColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // 현재 ID 범위 확인
    const rangeResult = await client.query('SELECT MIN(id) as min_id, MAX(id) as max_id FROM stores');
    const minId = rangeResult.rows[0].min_id;
    const maxId = rangeResult.rows[0].max_id;
    console.log(`📊 현재 ID 범위: ${minId} ~ ${maxId}`);
    
    // 기존 매장들을 현재 ID 순서대로 조회
    const existingStores = await client.query(`
      SELECT * FROM stores ORDER BY id
    `);
    
    console.log(`📋 기존 매장 목록 확인: ${existingStores.rows.length}개`);
    
    // 임시 테이블 생성 (ID 매핑용)
    console.log('🏗️ 임시 ID 매핑 테이블 생성 중...');
    await client.query(`
      CREATE TEMP TABLE temp_id_mapping (
        old_id INTEGER,
        new_id INTEGER,
        PRIMARY KEY (old_id)
      )
    `);
    
    // ID 매핑 정보 생성
    console.log('🔄 ID 매핑 정보 생성 중...');
    for (let i = 0; i < existingStores.rows.length; i++) {
      const oldId = existingStores.rows[i].id;
      const newId = i + 1;
      
      await client.query(`
        INSERT INTO temp_id_mapping (old_id, new_id) VALUES ($1, $2)
      `, [oldId, newId]);
    }
    
    console.log(`✅ ID 매핑 생성 완료: ${existingStores.rows.length}개`);
    
    // 임시 stores 테이블 생성 (새로운 ID로)
    console.log('🏗️ 임시 stores 테이블 생성 중...');
    await client.query(`
      CREATE TEMP TABLE stores_new AS 
      SELECT 
        ROW_NUMBER() OVER (ORDER BY id) as id,
        name,
        category,
        menu,
        review_count,
        is_open,
        created_at,
        rating_average,
        address_update_status
      FROM stores 
      ORDER BY id
    `);
    
    // stores 테이블의 기본키 제약조건 임시 제거를 위해 이름 변경
    console.log('🔄 기존 stores 테이블 백업...');
    await client.query('ALTER TABLE stores RENAME TO stores_old');
    await client.query('ALTER TABLE stores_new RENAME TO stores');
    
    // stores 테이블에 기본키 제약조건 다시 추가
    console.log('🔧 stores 테이블 기본키 제약조건 재설정...');
    await client.query('ALTER TABLE stores ADD PRIMARY KEY (id)');
    
    // 시퀀스 생성 및 연결
    console.log('🔄 stores 테이블 시퀀스 재설정...');
    await client.query('DROP SEQUENCE IF EXISTS stores_id_seq CASCADE');
    await client.query('CREATE SEQUENCE stores_id_seq');
    await client.query(`ALTER SEQUENCE stores_id_seq RESTART WITH ${totalStores + 1}`);
    await client.query('ALTER TABLE stores ALTER COLUMN id SET DEFAULT nextval(\'stores_id_seq\')');
    await client.query('ALTER SEQUENCE stores_id_seq OWNED BY stores.id');
    
    console.log(`✅ stores 테이블 재생성 완료: ${existingStores.rows.length}개`);
    
    // 관련 테이블들 업데이트
    console.log('🔄 관련 테이블 store_id 업데이트 시작...');
    
    // 1. reviews 테이블 업데이트
    console.log('🔄 reviews 테이블 store_id 업데이트 중...');
    const reviewsUpdated = await client.query(`
      UPDATE reviews 
      SET store_id = temp_id_mapping.new_id 
      FROM temp_id_mapping, stores_old
      WHERE reviews.store_id = stores_old.id 
      AND stores_old.id = temp_id_mapping.old_id
    `);
    console.log(`✅ reviews 테이블 업데이트 완료: ${reviewsUpdated.rowCount}개 행`);
    
    // 2. orders 테이블 업데이트
    console.log('🔄 orders 테이블 store_id 업데이트 중...');
    const ordersUpdated = await client.query(`
      UPDATE orders 
      SET store_id = temp_id_mapping.new_id 
      FROM temp_id_mapping, stores_old
      WHERE orders.store_id = stores_old.id 
      AND stores_old.id = temp_id_mapping.old_id
    `);
    console.log(`✅ orders 테이블 업데이트 완료: ${ordersUpdated.rowCount}개 행`);
    
    // 3. store_tables 테이블 업데이트
    console.log('🔄 store_tables 테이블 store_id 업데이트 중...');
    const tablesUpdated = await client.query(`
      UPDATE store_tables 
      SET store_id = temp_id_mapping.new_id 
      FROM temp_id_mapping, stores_old
      WHERE store_tables.store_id = stores_old.id 
      AND stores_old.id = temp_id_mapping.old_id
    `);
    console.log(`✅ store_tables 테이블 업데이트 완료: ${tablesUpdated.rowCount}개 행`);
    
    // 4. carts 테이블 업데이트
    console.log('🔄 carts 테이블 store_id 업데이트 중...');
    const cartsUpdated = await client.query(`
      UPDATE carts 
      SET store_id = temp_id_mapping.new_id 
      FROM temp_id_mapping, stores_old
      WHERE carts.store_id = stores_old.id 
      AND stores_old.id = temp_id_mapping.old_id
    `);
    console.log(`✅ carts 테이블 업데이트 완료: ${cartsUpdated.rowCount}개 행`);
    
    // 5. store_address 테이블 업데이트 (존재하는 경우)
    const addressTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'store_address'
      )
    `);
    
    if (addressTableExists.rows[0].exists) {
      console.log('🔄 store_address 테이블 store_id 업데이트 중...');
      const addressUpdated = await client.query(`
        UPDATE store_address 
        SET store_id = temp_id_mapping.new_id 
        FROM temp_id_mapping, stores_old
        WHERE store_address.store_id = stores_old.id 
        AND stores_old.id = temp_id_mapping.old_id
      `);
      console.log(`✅ store_address 테이블 업데이트 완료: ${addressUpdated.rowCount}개 행`);
    }
    
    // 6. users 테이블의 favorite_stores 업데이트 (JSONB 배열)
    console.log('🔄 users 테이블 favorite_stores 업데이트 중...');
    const usersResult = await client.query(`
      SELECT id, favorite_stores FROM users WHERE favorite_stores IS NOT NULL
    `);
    
    let usersFavoriteUpdated = 0;
    for (const user of usersResult.rows) {
      try {
        const favoriteStores = user.favorite_stores;
        if (Array.isArray(favoriteStores) && favoriteStores.length > 0) {
          const updatedFavorites = [];
          
          for (const oldStoreId of favoriteStores) {
            const mappingResult = await client.query(`
              SELECT new_id FROM temp_id_mapping WHERE old_id = $1
            `, [oldStoreId]);
            
            if (mappingResult.rows.length > 0) {
              updatedFavorites.push(mappingResult.rows[0].new_id);
            }
          }
          
          if (updatedFavorites.length > 0) {
            await client.query(`
              UPDATE users SET favorite_stores = $1 WHERE id = $2
            `, [JSON.stringify(updatedFavorites), user.id]);
            usersFavoriteUpdated++;
          }
        }
      } catch (error) {
        console.warn(`⚠️ 사용자 ${user.id} favorite_stores 업데이트 실패:`, error.message);
      }
    }
    console.log(`✅ users 테이블 favorite_stores 업데이트 완료: ${usersFavoriteUpdated}개 사용자`);
    
    // 백업된 stores_old 테이블 삭제
    console.log('🗑️ 백업 테이블 정리...');
    await client.query('DROP TABLE stores_old');
    
    // 트랜잭션 커밋
    await client.query('COMMIT');
    
    // 최종 검증
    console.log('🔍 최종 검증 중...');
    const finalResult = await client.query(`
      SELECT COUNT(*) as total, MIN(id) as min_id, MAX(id) as max_id 
      FROM stores
    `);
    const finalTotal = parseInt(finalResult.rows[0].total);
    const finalMinId = finalResult.rows[0].min_id;
    const finalMaxId = finalResult.rows[0].max_id;
    
    console.log(`\n📊 최종 결과:`);
    console.log(`  - 총 매장 수: ${finalTotal}개`);
    console.log(`  - ID 범위: ${finalMinId} ~ ${finalMaxId}`);
    console.log(`  - 연속성 확인: ${finalMaxId - finalMinId + 1 === finalTotal ? '✅ 연속적' : '❌ 비연속적'}`);
    
    // 관련 테이블 데이터 수 확인
    const reviewsCount = await client.query('SELECT COUNT(*) as count FROM reviews');
    const ordersCount = await client.query('SELECT COUNT(*) as count FROM orders');
    const tablesCount = await client.query('SELECT COUNT(*) as count FROM store_tables');
    const cartsCount = await client.query('SELECT COUNT(*) as count FROM carts');
    
    console.log(`\n📋 관련 테이블 데이터 수:`);
    console.log(`  - reviews: ${reviewsCount.rows[0].count}개`);
    console.log(`  - orders: ${ordersCount.rows[0].count}개`);
    console.log(`  - store_tables: ${tablesCount.rows[0].count}개`);
    console.log(`  - carts: ${cartsCount.rows[0].count}개`);
    
    if (addressTableExists.rows[0].exists) {
      const addressCount = await client.query('SELECT COUNT(*) as count FROM store_address');
      console.log(`  - store_address: ${addressCount.rows[0].count}개`);
    }
    
    // 샘플 데이터 확인
    const sampleResult = await client.query(`
      SELECT s.id, s.name, s.category
      FROM stores s
      ORDER BY s.id
      LIMIT 10
    `);
    
    console.log(`\n📋 재배열된 매장 샘플 (상위 10개):`);
    sampleResult.rows.forEach(store => {
      console.log(`  - ID ${store.id}: ${store.name} (${store.category})`);
    });
    
    console.log('\n🎉 stores 테이블 ID 순차 재배열 완료!');
    
  } catch (error) {
    console.error('❌ stores 테이블 ID 재배열 실패:', error);
    console.error('❌ 에러 세부사항:', error.message);
    console.error('❌ 에러 스택:', error.stack);
    
    try {
      await client.query('ROLLBACK');
      console.log('🔄 트랜잭션 롤백 완료');
    } catch (rollbackError) {
      console.error('❌ 트랜잭션 롤백 실패:', rollbackError);
    }
  } finally {
    client.release();
    process.exit(0);
  }
}

// 스크립트 실행
reorderStoreIds();
