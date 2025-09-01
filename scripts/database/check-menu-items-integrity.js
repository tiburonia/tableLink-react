
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkMenuItemsIntegrity() {
  const client = await pool.connect();
  
  try {
    console.log('🍽️ menu_items 테이블 무결성 검사 시작...\n');
    
    // 1. menu_items 테이블 존재 확인
    console.log('1️⃣ menu_items 테이블 존재 확인:');
    const menuItemsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'menu_items'
      )
    `);
    
    if (!menuItemsExists.rows[0].exists) {
      console.log('❌ menu_items 테이블이 존재하지 않습니다.');
      return;
    }
    console.log('✅ menu_items 테이블 존재 확인');
    
    // 2. menu_items 외래 키 제약조건 확인
    console.log('\n2️⃣ menu_items 외래 키 제약조건 확인:');
    const foreignKeys = await client.query(`
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
        AND tc.table_name = 'menu_items'
      ORDER BY kcu.column_name
    `);
    
    if (foreignKeys.rows.length > 0) {
      console.log('📋 menu_items 외래 키 제약조건들:');
      foreignKeys.rows.forEach(fk => {
        console.log(`  • ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        console.log(`    제약조건: ${fk.constraint_name}`);
      });
    } else {
      console.log('⚠️ menu_items에 외래 키 제약조건이 없습니다.');
    }
    
    // 3. menu_items 데이터 통계
    console.log('\n3️⃣ menu_items 테이블 데이터 통계:');
    const menuItemsCount = await client.query('SELECT COUNT(*) as total FROM menu_items');
    console.log(`  총 메뉴 아이템 수: ${menuItemsCount.rows[0].total}개`);
    
    // 4. stores와의 관계 무결성 검사
    console.log('\n4️⃣ stores와의 관계 무결성 검사:');
    const orphanMenuItems = await client.query(`
      SELECT COUNT(*) as orphan_count 
      FROM menu_items mi 
      LEFT JOIN stores s ON mi.store_id = s.id 
      WHERE s.id IS NULL
    `);
    
    const orphanCount = parseInt(orphanMenuItems.rows[0].orphan_count);
    if (orphanCount > 0) {
      console.log(`❌ 고아 메뉴 아이템 ${orphanCount}개 발견 (참조하는 매장이 없음)`);
      
      // 고아 메뉴 아이템들 조회
      const orphanItems = await client.query(`
        SELECT mi.id, mi.store_id, mi.name 
        FROM menu_items mi 
        LEFT JOIN stores s ON mi.store_id = s.id 
        WHERE s.id IS NULL
        LIMIT 10
      `);
      
      console.log('고아 메뉴 아이템 샘플 (최대 10개):');
      orphanItems.rows.forEach(item => {
        console.log(`  - ID: ${item.id}, store_id: ${item.store_id}, name: ${item.name}`);
      });
    } else {
      console.log('✅ 모든 메뉴 아이템이 유효한 매장을 참조하고 있습니다.');
    }
    
    // 5. menu_groups와의 관계 무결성 검사
    console.log('\n5️⃣ menu_groups와의 관계 무결성 검사:');
    const orphanFromGroups = await client.query(`
      SELECT COUNT(*) as orphan_count 
      FROM menu_items mi 
      LEFT JOIN menu_groups mg ON mi.group_id = mg.id 
      WHERE mi.group_id IS NOT NULL AND mg.id IS NULL
    `);
    
    const orphanFromGroupsCount = parseInt(orphanFromGroups.rows[0].orphan_count);
    if (orphanFromGroupsCount > 0) {
      console.log(`❌ 고아 메뉴 아이템 ${orphanFromGroupsCount}개 발견 (참조하는 메뉴 그룹이 없음)`);
    } else {
      console.log('✅ 모든 메뉴 아이템이 유효한 메뉴 그룹을 참조하고 있습니다.');
    }
    
    // 6. 매장별 메뉴 아이템 분포
    console.log('\n6️⃣ 매장별 메뉴 아이템 분포 (상위 10개):');
    const menuDistribution = await client.query(`
      SELECT 
        s.id, 
        s.name as store_name,
        COUNT(mi.id) as menu_count
      FROM stores s
      LEFT JOIN menu_items mi ON s.id = mi.store_id
      GROUP BY s.id, s.name
      HAVING COUNT(mi.id) > 0
      ORDER BY menu_count DESC
      LIMIT 10
    `);
    
    menuDistribution.rows.forEach(row => {
      console.log(`  매장 ${row.id} (${row.store_name}): ${row.menu_count}개 메뉴`);
    });
    
    // 7. 메뉴 아이템이 없는 매장들
    console.log('\n7️⃣ 메뉴 아이템이 없는 매장 수:');
    const storesWithoutMenus = await client.query(`
      SELECT COUNT(*) as count
      FROM stores s
      LEFT JOIN menu_items mi ON s.id = mi.store_id
      WHERE mi.id IS NULL
    `);
    
    console.log(`  메뉴가 없는 매장: ${storesWithoutMenus.rows[0].count}개`);
    
    console.log('\n🎉 menu_items 테이블 무결성 검사 완료!');
    
  } catch (error) {
    console.error('❌ menu_items 무결성 검사 중 오류:', error);
  } finally {
    client.release();
  }
}

// 메인 실행
checkMenuItemsIntegrity()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
