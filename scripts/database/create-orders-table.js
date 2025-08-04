
const pool = require('./shared/config/database');

async function createOrdersTable() {
  try {
    console.log('📋 orders 테이블 생성 중...');
    
    // orders 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        table_number INTEGER,
        order_data JSONB NOT NULL,
        total_amount INTEGER NOT NULL,
        discount_amount INTEGER DEFAULT 0,
        final_amount INTEGER NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'card',
        order_status VARCHAR(20) DEFAULT 'pending',
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ orders 테이블 생성 완료');
    
    // 인덱스 추가 (검색 성능 향상)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
    `);
    
    console.log('✅ orders 테이블 인덱스 생성 완료');
    
    // 샘플 주문 데이터 삽입 (테스트용)
    const existingOrders = await pool.query('SELECT COUNT(*) FROM orders');
    
    if (parseInt(existingOrders.rows[0].count) === 0) {
      console.log('📝 샘플 주문 데이터 생성 중...');
      
      // 최근 주문 샘플 데이터
      const sampleOrders = [
        {
          store_id: 1,
          user_id: '12',
          table_number: 3,
          order_data: {
            storeName: '치킨천국',
            items: [
              { name: '후라이드치킨', price: 18000, quantity: 1 },
              { name: '콜라', price: 2000, quantity: 2 }
            ],
            total: 22000
          },
          total_amount: 22000,
          final_amount: 22000,
          order_status: 'completed'
        },
        {
          store_id: 1,
          user_id: 'user001',
          table_number: 5,
          order_data: {
            storeName: '치킨천국',
            items: [
              { name: '양념치킨', price: 19000, quantity: 1 },
              { name: '치킨무', price: 1000, quantity: 1 }
            ],
            total: 20000
          },
          total_amount: 20000,
          final_amount: 20000,
          order_status: 'preparing'
        },
        {
          store_id: 2,
          user_id: '12',
          table_number: 2,
          order_data: {
            storeName: '분식왕국',
            items: [
              { name: '떡볶이', price: 8000, quantity: 1 },
              { name: '김밥', price: 3000, quantity: 2 }
            ],
            total: 14000
          },
          total_amount: 14000,
          final_amount: 14000,
          order_status: 'completed'
        }
      ];
      
      for (const order of sampleOrders) {
        // 랜덤한 시간 생성 (최근 24시간 내)
        const randomHours = Math.floor(Math.random() * 24);
        const orderDate = new Date();
        orderDate.setHours(orderDate.getHours() - randomHours);
        
        await pool.query(`
          INSERT INTO orders (
            store_id, user_id, table_number, order_data, 
            total_amount, final_amount, order_status, order_date, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
        `, [
          order.store_id,
          order.user_id,
          order.table_number,
          JSON.stringify(order.order_data),
          order.total_amount,
          order.final_amount,
          order.order_status,
          orderDate
        ]);
      }
      
      console.log('✅ 샘플 주문 데이터 삽입 완료');
    }
    
    console.log('🎉 orders 테이블 설정 완료!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ orders 테이블 생성 실패:', error);
    process.exit(1);
  }
}

createOrdersTable();
