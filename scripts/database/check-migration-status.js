
const pool = require('../../shared/config/database');

async function checkMigrationStatus() {
  try {
    console.log('🔍 마이그레이션 상태 확인 시작...');
    
    // 1. stores 테이블 구조 확인
    console.log('\n📋 1. stores 테이블 현재 구조:');
    const storesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      ORDER BY ordinal_position
    `);
    
    console.log('stores 테이블 컬럼:');
    storesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 2. store_address 테이블 존재 여부 확인
    console.log('\n📋 2. store_address 테이블 확인:');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'store_address'
      )
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ store_address 테이블이 존재합니다.');
      
      // store_address 테이블 구조 확인
      const addressColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'store_address' 
        ORDER BY ordinal_position
      `);
      
      console.log('store_address 테이블 컬럼:');
      addressColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // 데이터 개수 확인
      const addressCount = await pool.query('SELECT COUNT(*) as count FROM store_address');
      console.log(`\n📊 store_address 테이블 데이터: ${addressCount.rows[0].count}개`);
      
      // 샘플 데이터 확인
      const sampleData = await pool.query(`
        SELECT sa.store_id, sa.address_full, sa.sido, sa.sigungu, sa.eupmyeondong, sa.legal_dong_code, s.name
        FROM store_address sa
        LEFT JOIN stores s ON sa.store_id = s.id
        ORDER BY sa.store_id
        LIMIT 10
      `);
      
      console.log('\n📋 샘플 데이터 (상위 10개):');
      sampleData.rows.forEach(row => {
        console.log(`  매장 ${row.store_id} (${row.name}): ${row.address_full}`);
        console.log(`    └ ${row.sido} ${row.sigungu} ${row.eupmyeondong} [${row.legal_dong_code}]`);
      });
      
    } else {
      console.log('❌ store_address 테이블이 존재하지 않습니다!');
    }
    
    // 3. stores 테이블 데이터 개수 확인
    console.log('\n📊 3. 데이터 개수 비교:');
    const storesCount = await pool.query('SELECT COUNT(*) as count FROM stores');
    console.log(`stores 테이블: ${storesCount.rows[0].count}개`);
    
    if (tableExists.rows[0].exists) {
      const addressCount = await pool.query('SELECT COUNT(*) as count FROM store_address');
      console.log(`store_address 테이블: ${addressCount.rows[0].count}개`);
      
      if (storesCount.rows[0].count === addressCount.rows[0].count) {
        console.log('✅ 데이터 개수가 일치합니다.');
      } else {
        console.log('❌ 데이터 개수가 일치하지 않습니다!');
      }
    }
    
    // 4. stores 테이블에 주소 관련 컬럼이 남아있는지 확인
    console.log('\n🔍 4. stores 테이블 주소 컬럼 잔여 확인:');
    const addressColumnsInStores = storesColumns.rows.filter(col => 
      ['address', 'address_status', 'sido', 'sigungu', 'dong', 'region_code'].includes(col.column_name)
    );
    
    if (addressColumnsInStores.length > 0) {
      console.log('⚠️ stores 테이블에 아직 주소 관련 컬럼이 남아있습니다:');
      addressColumnsInStores.forEach(col => {
        console.log(`  - ${col.column_name}`);
      });
    } else {
      console.log('✅ stores 테이블에서 주소 관련 컬럼이 모두 제거되었습니다.');
    }
    
    // 5. 외래키 제약조건 확인
    if (tableExists.rows[0].exists) {
      console.log('\n🔗 5. 외래키 제약조건 확인:');
      const fkConstraints = await pool.query(`
        SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name
        JOIN information_schema.key_column_usage kcu2 ON rc.unique_constraint_name = kcu2.constraint_name
        WHERE kcu.table_name = 'store_address'
      `);
      
      if (fkConstraints.rows.length > 0) {
        console.log('✅ 외래키 제약조건이 설정되어 있습니다:');
        fkConstraints.rows.forEach(fk => {
          console.log(`  - ${fk.constraint_name}: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      } else {
        console.log('❌ 외래키 제약조건이 설정되지 않았습니다.');
      }
    }
    
    console.log('\n✅ 마이그레이션 상태 확인 완료');
    
  } catch (error) {
    console.error('❌ 마이그레이션 상태 확인 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
if (require.main === module) {
  checkMigrationStatus();
}

module.exports = { checkMigrationStatus };
