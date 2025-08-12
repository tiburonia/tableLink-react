
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
    
    // 현재 ID 범위 확인
    const rangeResult = await client.query('SELECT MIN(id) as min_id, MAX(id) as max_id FROM stores');
    const minId = rangeResult.rows[0].min_id;
    const maxId = rangeResult.rows[0].max_id;
    console.log(`📊 현재 ID 범위: ${minId} ~ ${maxId}`);
    
    // 기존 매장들을 생성 순서대로 조회 (현재 테이블 구조에 맞춰)
    const existingStores = await client.query(`
      SELECT id, name, category, is_open, rating_average, review_count,
             phone, description, operating_hours, menu
      FROM stores 
      ORDER BY id
    `);
    
    console.log(`📋 기존 매장 목록 확인: ${existingStores.rows.length}개`);
    
    // 임시 테이블 생성 (현재 구조에 맞춰)
    console.log('🏗️ 임시 테이블 생성 중...');
    await client.query(`
      CREATE TEMP TABLE temp_stores (
        old_id INTEGER,
        new_id INTEGER,
        name VARCHAR(255),
        category VARCHAR(100),
        is_open BOOLEAN,
        rating_average DECIMAL(3,2),
        review_count INTEGER,
        phone VARCHAR(20),
        description TEXT,
        operating_hours JSONB,
        menu JSONB
      )
    `);
    
    // 임시 테이블에 새로운 ID와 함께 데이터 삽입
    console.log('📝 새로운 ID 매핑 생성 중...');
    for (let i = 0; i < existingStores.rows.length; i++) {
      const store = existingStores.rows[i];
      const newId = i + 1; // 1부터 시작하는 순차 ID
      
      await client.query(`
        INSERT INTO temp_stores (
          old_id, new_id, name, category, is_open, 
          rating_average, review_count, phone, description, operating_hours, menu
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        store.id, newId, store.name, store.category, store.is_open,
        store.rating_average, store.review_count, store.phone, 
        store.description, store.operating_hours, store.menu
      ]);
      
      if ((i + 1) % 100 === 0 || i === existingStores.rows.length - 1) {
        console.log(`📊 매핑 생성 진행률: ${i + 1}/${existingStores.rows.length}`);
      }
    }
    
    // ID 매핑 확인
    const mappingResult = await client.query(`
      SELECT old_id, new_id FROM temp_stores ORDER BY new_id LIMIT 10
    `);
    console.log('🔍 ID 매핑 샘플:');
    mappingResult.rows.forEach(row => {
      console.log(`  ${row.old_id} -> ${row.new_id}`);
    });
    
    // 외래키 제약조건 일시 비활성화
    console.log('🔒 외래키 제약조건 일시 비활성화...');
    await client.query('SET session_replication_role = replica');
    
    // 1. reviews 테이블 업데이트
    console.log('🔄 reviews 테이블 store_id 업데이트 중...');
    const reviewsUpdated = await client.query(`
      UPDATE reviews 
      SET store_id = temp_stores.new_id 
      FROM temp_stores 
      WHERE reviews.store_id = temp_stores.old_id
    `);
    console.log(`✅ reviews 테이블 업데이트 완료: ${reviewsUpdated.rowCount}개 행`);
    
    // 2. orders 테이블 업데이트
    console.log('🔄 orders 테이블 store_id 업데이트 중...');
    const ordersUpdated = await client.query(`
      UPDATE orders 
      SET store_id = temp_stores.new_id 
      FROM temp_stores 
      WHERE orders.store_id = temp_stores.old_id
    `);
    console.log(`✅ orders 테이블 업데이트 완료: ${ordersUpdated.rowCount}개 행`);
    
    // 3. store_tables 테이블 업데이트
    console.log('🔄 store_tables 테이블 store_id 업데이트 중...');
    const tablesUpdated = await client.query(`
      UPDATE store_tables 
      SET store_id = temp_stores.new_id 
      FROM temp_stores 
      WHERE store_tables.store_id = temp_stores.old_id
    `);
    console.log(`✅ store_tables 테이블 업데이트 완료: ${tablesUpdated.rowCount}개 행`);
    
    // 4. store_address 테이블 업데이트 (새로 추가된 테이블)
    console.log('🔄 store_address 테이블 store_id 업데이트 중...');
    const addressUpdated = await client.query(`
      UPDATE store_address 
      SET store_id = temp_stores.new_id 
      FROM temp_stores 
      WHERE store_address.store_id = temp_stores.old_id
    `);
    console.log(`✅ store_address 테이블 업데이트 완료: ${addressUpdated.rowCount}개 행`);
    
    // 5. users 테이블의 favorite_stores 업데이트 (JSONB 배열)
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
              SELECT new_id FROM temp_stores WHERE old_id = $1
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
        console.warn(`⚠️ 사용자 ${user.id}의 favorite_stores 업데이트 실패:`, error.message);
      }
    }
    console.log(`✅ users 테이블 favorite_stores 업데이트 완료: ${usersFavoriteUpdated}명`);
    
    // 6. stores 테이블 완전 재생성
    console.log('🔄 stores 테이블 데이터 교체 중...');
    
    // 기존 stores 테이블 데이터 삭제
    await client.query('DELETE FROM stores');
    
    // 새로운 데이터 삽입 (현재 테이블 구조에 맞춰)
    await client.query(`
      INSERT INTO stores (
        id, name, category, is_open, rating_average, review_count,
        phone, description, operating_hours, menu
      )
      SELECT 
        new_id, name, category, is_open, rating_average, review_count,
        phone, description, operating_hours, menu
      FROM temp_stores 
      ORDER BY new_id
    `);
    
    console.log(`✅ stores 테이블 데이터 교체 완료: ${totalStores}개 행`);
    
    // stores 테이블 시퀀스 재설정
    console.log('🔄 stores 테이블 시퀀스 재설정 중...');
    const maxNewId = totalStores;
    await client.query(`ALTER SEQUENCE stores_id_seq RESTART WITH ${maxNewId + 1}`);
    console.log(`✅ 시퀀스 재설정 완료: 다음 ID는 ${maxNewId + 1}`);
    
    // 외래키 제약조건 재활성화
    console.log('🔓 외래키 제약조건 재활성화...');
    await client.query('SET session_replication_role = DEFAULT');
    
    // 임시 테이블 삭제
    await client.query('DROP TABLE temp_stores');
    
    // 최종 검증
    console.log('🔍 최종 검증 중...');
    const finalResult = await client.query(`
      SELECT COUNT(*) as total, MIN(id) as min_id, MAX(id) as max_id 
      FROM stores
    `);
    const finalTotal = parseInt(finalResult.rows[0].total);
    const finalMinId = finalResult.rows[0].min_id;
    const finalMaxId = finalResult.rows[0].max_id;
    
    console.log(`📊 최종 결과:`);
    console.log(`  - 총 매장 수: ${finalTotal}개`);
    console.log(`  - ID 범위: ${finalMinId} ~ ${finalMaxId}`);
    console.log(`  - 연속성 확인: ${finalMaxId - finalMinId + 1 === finalTotal ? '✅ 연속적' : '❌ 비연속적'}`);
    
    // 관련 테이블 데이터 수 확인
    const reviewsCount = await client.query('SELECT COUNT(*) as count FROM reviews');
    const ordersCount = await client.query('SELECT COUNT(*) as count FROM orders');
    const tablesCount = await client.query('SELECT COUNT(*) as count FROM store_tables');
    const addressCount = await client.query('SELECT COUNT(*) as count FROM store_address');
    
    console.log(`📊 관련 테이블 데이터 수:`);
    console.log(`  - 리뷰: ${reviewsCount.rows[0].count}개`);
    console.log(`  - 주문: ${ordersCount.rows[0].count}개`);
    console.log(`  - 테이블: ${tablesCount.rows[0].count}개`);
    console.log(`  - 주소: ${addressCount.rows[0].count}개`);
    
    // 조인 쿼리 테스트
    console.log('🔍 조인 쿼리 테스트...');
    const joinTest = await client.query(`
      SELECT s.id, s.name, sa.address_full
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      LIMIT 5
    `);
    
    console.log('✅ 조인 쿼리 테스트 결과:');
    joinTest.rows.forEach(row => {
      console.log(`  - ID ${row.id}: ${row.name} (${row.address_full || 'NO ADDRESS'})`);
    });
    
    // 트랜잭션 커밋
    await client.query('COMMIT');
    console.log('🎉 stores 테이블 ID 순차 재배열 완료!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ stores 테이블 ID 재배열 실패:', error);
    console.error('❌ 에러 세부사항:', error.message);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

// 스크립트 실행
reorderStoreIds();
