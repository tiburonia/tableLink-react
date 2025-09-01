
const pool = require('../../shared/config/database');

async function checkForeignKeys() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 stores 테이블 외래 키 관계 확인\n');
    
    // 1. stores 테이블 존재 확인
    console.log('1️⃣ stores 테이블 존재 확인:');
    const storesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'stores'
      )
    `);
    
    if (!storesExists.rows[0].exists) {
      console.log('❌ stores 테이블이 존재하지 않습니다.');
      return;
    }
    console.log('✅ stores 테이블 존재 확인');
    
    // 2. stores를 참조하는 외래 키들 조회
    console.log('\n2️⃣ stores 테이블을 참조하는 외래 키들:');
    const foreignKeys = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        tc.constraint_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'stores'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    if (foreignKeys.rows.length > 0) {
      console.log('📋 stores를 참조하는 테이블들:');
      foreignKeys.rows.forEach(fk => {
        console.log(`  • ${fk.table_name}.${fk.column_name} → stores.${fk.foreign_column_name}`);
        console.log(`    제약조건: ${fk.constraint_name}`);
      });
    } else {
      console.log('⚠️ stores를 참조하는 외래 키가 없습니다.');
    }
    
    // 3. stores가 참조하는 외래 키들 조회
    console.log('\n3️⃣ stores 테이블이 참조하는 외래 키들:');
    const referencedKeys = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        tc.constraint_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'stores'
      ORDER BY kcu.column_name
    `);
    
    if (referencedKeys.rows.length > 0) {
      console.log('📋 stores가 참조하는 테이블들:');
      referencedKeys.rows.forEach(fk => {
        console.log(`  • stores.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        console.log(`    제약조건: ${fk.constraint_name}`);
      });
    } else {
      console.log('ℹ️ stores가 참조하는 외래 키가 없습니다.');
    }
    
    // 4. 관련 테이블들 존재 확인 및 컬럼 구조 상세 분석
    console.log('\n4️⃣ 관련 테이블들 존재 확인:');
    const relatedTables = [
      'store_address', 'store_tables', 'store_promotions', 
      'reviews', 'orders', 'regular_levels', 'favorites'
    ];
    
    for (const tableName of relatedTables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [tableName]);
      
      const status = exists.rows[0].exists ? '✅' : '❌';
      console.log(`  ${status} ${tableName}`);
      
      if (exists.rows[0].exists) {
        // 해당 테이블의 레코드 수 확인
        const count = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`      레코드 수: ${count.rows[0].count}개`);
        
        // 해당 테이블의 컬럼 구조 확인 (특히 store_id 컬럼)
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        const hasStoreId = columns.rows.find(col => col.column_name === 'store_id');
        if (hasStoreId) {
          console.log(`      📍 store_id 컬럼: ${hasStoreId.data_type} (${hasStoreId.is_nullable === 'YES' ? 'NULL 허용' : 'NOT NULL'})`);
        } else {
          console.log(`      ⚠️ store_id 컬럼 없음`);
        }
        
        // 해당 테이블의 외래키 제약조건 확인
        const tableForeignKeys = await client.query(`
          SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = $1
        `, [tableName]);
        
        if (tableForeignKeys.rows.length > 0) {
          console.log(`      🔗 외래키 제약조건:`);
          tableForeignKeys.rows.forEach(fk => {
            console.log(`        - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name} (${fk.constraint_name})`);
          });
        } else {
          console.log(`      ⚠️ 외래키 제약조건 없음`);
        }
      }
    }
    
    // 5. stores 테이블 기본 정보
    console.log('\n5️⃣ stores 테이블 기본 정보:');
    const storeCount = await client.query('SELECT COUNT(*) as count FROM stores');
    console.log(`  총 매장 수: ${storeCount.rows[0].count}개`);
    
    // 6. stores 테이블 컬럼 정보
    console.log('\n6️⃣ stores 테이블 컬럼 구조:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      ORDER BY ordinal_position
    `);
    
    columns.rows.forEach(col => {
      console.log(`  • ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 7. 인덱스 정보
    console.log('\n7️⃣ stores 테이블 인덱스:');
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'stores'
      ORDER BY indexname
    `);
    
    if (indexes.rows.length > 0) {
      indexes.rows.forEach(idx => {
        console.log(`  • ${idx.indexname}`);
        console.log(`    ${idx.indexdef}`);
      });
    } else {
      console.log('  ❌ 인덱스가 없습니다.');
    }
    
    console.log('\n🎯 외래 키 관계 확인 완료!');
    
  } catch (error) {
    console.error('❌ 외래 키 확인 실패:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

// 스크립트 실행
checkForeignKeys();
