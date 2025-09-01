
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function queryMenuItems() {
  const client = await pool.connect();
  
  try {
    console.log('🍽️ menu_items 테이블 데이터 조회...\n');
    
    // 1. 전체 메뉴 아이템 수
    const totalCount = await client.query('SELECT COUNT(*) as total FROM menu_items');
    console.log(`총 메뉴 아이템 수: ${totalCount.rows[0].total}개\n`);
    
    // 2. 상위 20개 메뉴 아이템 조회
    console.log('상위 20개 메뉴 아이템:');
    const topMenuItems = await client.query(`
      SELECT 
        mi.id,
        mi.store_id,
        s.name as store_name,
        mi.name as menu_name,
        mi.price,
        mi.is_active,
        mg.name as group_name
      FROM menu_items mi
      LEFT JOIN stores s ON mi.store_id = s.id
      LEFT JOIN menu_groups mg ON mi.group_id = mg.id
      ORDER BY mi.id
      LIMIT 20
    `);
    
    topMenuItems.rows.forEach(item => {
      console.log(`  ID: ${item.id} | 매장: ${item.store_name} | 메뉴: ${item.menu_name} | 가격: ${item.price}원 | 그룹: ${item.group_name || 'N/A'}`);
    });
    
    // 3. 매장별 메뉴 수 통계
    console.log('\n매장별 메뉴 수 (상위 10개):');
    const storeMenuCounts = await client.query(`
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
    
    storeMenuCounts.rows.forEach(store => {
      console.log(`  매장 ${store.id} (${store.store_name}): ${store.menu_count}개 메뉴`);
    });
    
  } catch (error) {
    console.error('❌ 메뉴 아이템 조회 실패:', error);
  } finally {
    client.release();
  }
}

queryMenuItems()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
