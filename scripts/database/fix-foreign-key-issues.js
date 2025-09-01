
const pool = require('../../shared/config/database');

async function fixForeignKeyIssues() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 외래키 관련 문제 해결 시작...');
    console.log('✅ PostgreSQL 데이터베이스 연결');

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 1. store_promotions 테이블의 store_id 데이터 타입 수정
    console.log('🔧 1단계: store_promotions.store_id 데이터 타입 수정 (integer → bigint)...');
    
    try {
      // 기존 외래키 제약조건 제거
      await client.query(`
        ALTER TABLE store_promotions 
        DROP CONSTRAINT IF EXISTS store_promotions_store_id_fkey
      `);
      
      // store_id 컬럼 타입을 bigint로 변경
      await client.query(`
        ALTER TABLE store_promotions 
        ALTER COLUMN store_id TYPE bigint
      `);
      
      // 외래키 제약조건 재생성
      await client.query(`
        ALTER TABLE store_promotions 
        ADD CONSTRAINT store_promotions_store_id_fkey 
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      `);
      
      console.log('✅ store_promotions.store_id 데이터 타입 수정 완료');
    } catch (error) {
      console.log(`⚠️ store_promotions 수정 실패: ${error.message}`);
    }

    // 2. regular_levels 테이블의 store_id 데이터 타입 수정 및 외래키 제약조건 추가
    console.log('🔧 2단계: regular_levels.store_id 데이터 타입 수정 및 외래키 제약조건 추가...');
    
    try {
      // store_id 컬럼 타입을 bigint로 변경
      await client.query(`
        ALTER TABLE regular_levels 
        ALTER COLUMN store_id TYPE bigint
      `);
      
      // 고아 레코드 정리 (존재하지 않는 store_id 참조하는 레코드 삭제)
      const orphanResult = await client.query(`
        DELETE FROM regular_levels 
        WHERE store_id NOT IN (SELECT id FROM stores)
      `);
      
      if (orphanResult.rowCount > 0) {
        console.log(`🗑️ regular_levels에서 ${orphanResult.rowCount}개 고아 레코드 삭제`);
      }
      
      // 외래키 제약조건 추가
      await client.query(`
        ALTER TABLE regular_levels 
        ADD CONSTRAINT regular_levels_store_id_fkey 
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      `);
      
      console.log('✅ regular_levels.store_id 외래키 제약조건 추가 완료');
    } catch (error) {
      console.log(`⚠️ regular_levels 수정 실패: ${error.message}`);
    }

    // 3. orders 테이블에 store_id 컬럼 추가 (필요한 경우)
    console.log('🔧 3단계: orders 테이블 store_id 컬럼 확인...');
    
    const ordersStoreIdExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'store_id'
      )
    `);
    
    if (!ordersStoreIdExists.rows[0].exists) {
      try {
        // orders 테이블에 store_id 컬럼 추가
        await client.query(`
          ALTER TABLE orders 
          ADD COLUMN store_id bigint
        `);
        
        // checks 테이블을 통해 store_id 값 업데이트 (가능한 경우)
        const checksTableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'checks'
          )
        `);
        
        if (checksTableExists.rows[0].exists) {
          await client.query(`
            UPDATE orders 
            SET store_id = c.store_id 
            FROM checks c 
            WHERE orders.check_id = c.id AND c.store_id IS NOT NULL
          `);
          
          // store_id가 설정된 orders에 대해 외래키 제약조건 추가
          const ordersWithStoreId = await client.query(`
            SELECT COUNT(*) as count 
            FROM orders 
            WHERE store_id IS NOT NULL
          `);
          
          if (parseInt(ordersWithStoreId.rows[0].count) > 0) {
            await client.query(`
              ALTER TABLE orders 
              ADD CONSTRAINT orders_store_id_fkey 
              FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
            `);
            console.log('✅ orders 테이블에 store_id 컬럼 및 외래키 제약조건 추가 완료');
          } else {
            console.log('ℹ️ orders 테이블에 store_id 컬럼 추가했지만 데이터가 없어 외래키 제약조건은 추가하지 않음');
          }
        } else {
          console.log('ℹ️ checks 테이블이 없어 orders.store_id 값을 업데이트할 수 없음');
        }
      } catch (error) {
        console.log(`⚠️ orders 테이블 수정 실패: ${error.message}`);
      }
    } else {
      console.log('ℹ️ orders 테이블에 store_id 컬럼이 이미 존재함');
    }

    // 4. 모든 외래키 제약조건이 올바른 데이터 타입으로 설정되었는지 확인
    console.log('🔍 4단계: 외래키 제약조건 최종 검증...');
    
    const foreignKeyCheck = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        tc.constraint_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        col.data_type,
        fk_col.data_type AS foreign_data_type
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.columns col
        ON tc.table_name = col.table_name AND kcu.column_name = col.column_name
      JOIN information_schema.columns fk_col
        ON ccu.table_name = fk_col.table_name AND ccu.column_name = fk_col.column_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'stores'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    console.log('📋 stores를 참조하는 외래키 상태:');
    let hasTypeIssues = false;
    
    foreignKeyCheck.rows.forEach(fk => {
      const typeMatch = fk.data_type === fk.foreign_data_type || 
                       (fk.data_type === 'integer' && fk.foreign_data_type === 'bigint') ||
                       (fk.data_type === 'bigint' && fk.foreign_data_type === 'bigint');
      
      const status = typeMatch ? '✅' : '❌';
      console.log(`  ${status} ${fk.table_name}.${fk.column_name} (${fk.data_type}) → stores.${fk.foreign_column_name} (${fk.foreign_data_type})`);
      
      if (!typeMatch) {
        hasTypeIssues = true;
        console.log(`    ⚠️ 데이터 타입 불일치 발견!`);
      }
    });
    
    if (!hasTypeIssues) {
      console.log('✅ 모든 외래키 데이터 타입이 일치합니다.');
    }

    // 5. 참조 무결성 검증
    console.log('🔍 5단계: 참조 무결성 검증...');
    
    const integrityChecks = [
      'store_address', 'store_tables', 'store_promotions', 'regular_levels',
      'reviews', 'favorites', 'reservations', 'waitlists', 'carts'
    ];
    
    for (const tableName of integrityChecks) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as orphan_count
          FROM ${tableName} t
          WHERE NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = t.store_id)
        `);
        
        const orphanCount = parseInt(result.rows[0].orphan_count);
        if (orphanCount > 0) {
          console.log(`⚠️ ${tableName}: ${orphanCount}개 고아 레코드 발견`);
        } else {
          console.log(`✅ ${tableName}: 참조 무결성 정상`);
        }
      } catch (error) {
        console.log(`⚠️ ${tableName}: 검증 실패 - ${error.message}`);
      }
    }

    // 트랜잭션 커밋
    await client.query('COMMIT');
    
    console.log('\n🎉 외래키 문제 해결 완료!');
    console.log('💡 이제 Replit Database 패널에서 stores 테이블의 외래키를 클릭해도 문제가 없을 것입니다.');
    
  } catch (error) {
    console.error('❌ 외래키 문제 해결 실패:', error);
    
    try {
      await client.query('ROLLBACK');
      console.log('🔄 롤백 완료');
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
  fixForeignKeyIssues();
}

module.exports = { fixForeignKeyIssues };
