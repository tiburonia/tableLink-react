
const pool = require('../shared/config/database');

async function createTestKDSOrders() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 KDS 테스트용 주문 데이터 생성 시작...');
    
    await client.query('BEGIN');

    // 테스트 매장 1번에 대한 체크 생성
    const checkResult = await client.query(`
      INSERT INTO checks (store_id, table_number, customer_name, customer_phone, status, total_amount)
      VALUES 
        (1, '1', '김고객', '010-1234-5678', 'active', 25000),
        (1, '2', '이손님', '010-9876-5432', 'active', 18000),
        (1, '3', null, null, 'active', 12000)
      RETURNING id, table_number
    `);

    console.log(`✅ 체크 생성 완료: ${checkResult.rows.length}개`);

    // 각 체크에 대한 주문 생성
    for (const check of checkResult.rows) {
      const orderResult = await client.query(`
        INSERT INTO orders (check_id, order_number, status, source, total_amount)
        VALUES ($1, $2, 'confirmed', 'TLL', (SELECT total_amount FROM checks WHERE id = $1))
        RETURNING id
      `, [check.id, `ORD_${Date.now()}_${check.id}`]);

      const orderId = orderResult.rows[0].id;

      // 각 주문에 대한 아이템들 생성
      const menuItems = [
        { name: '김치찌개', price: 8000, status: 'queued' },
        { name: '된장찌개', price: 7000, status: 'queued' },
        { name: '불고기정식', price: 12000, status: 'cooking' },
        { name: '비빔밥', price: 9000, status: 'ready' },
        { name: '냉면', price: 8500, status: 'queued' }
      ];

      const randomItems = menuItems.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);

      for (const item of randomItems) {
        await client.query(`
          INSERT INTO order_items (
            order_id, menu_name, quantity, unit_price, 
            options, status, cook_station, priority, estimated_time
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          orderId,
          item.name,
          Math.floor(Math.random() * 3) + 1, // 1-3개
          item.price,
          Math.random() > 0.7 ? '매운맛' : null, // 30% 확률로 옵션
          item.status,
          '주방', // 기본 조리스테이션
          Math.floor(Math.random() * 5) + 1, // 1-5 우선순위
          Math.floor(Math.random() * 20) + 10 // 10-30분 예상시간
        ]);
      }

      console.log(`✅ 주문 ${orderId} 생성 완료 (테이블 ${check.table_number}, ${randomItems.length}개 아이템)`);
    }

    await client.query('COMMIT');
    
    console.log('🎉 KDS 테스트용 주문 데이터 생성 완료!');
    console.log('📟 http://localhost:5000/kds.html로 접속하여 KDS를 확인하세요');
    console.log('🔗 특정 매장: http://localhost:5000/kds.html?store=1');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ KDS 테스트 데이터 생성 실패:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

createTestKDSOrders();
