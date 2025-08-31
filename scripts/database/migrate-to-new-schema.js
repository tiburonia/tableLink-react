
const pool = require('../../shared/config/database');

async function migrateToNewSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 데이터 마이그레이션 시작...');
    
    await client.query('BEGIN');
    
    // 1. orders -> checks 마이그레이션
    console.log('📋 1단계: orders -> checks 마이그레이션');
    
    await client.query(`
      INSERT INTO checks (store_id, table_number, user_id, guest_phone, channel, source, status, opened_at)
      SELECT DISTINCT 
        o.store_id, 
        o.table_number, 
        o.user_id, 
        o.guest_phone,
        'DINE_IN',
        CASE 
          WHEN o.user_id IS NOT NULL THEN 'TLL'
          WHEN o.guest_phone IS NOT NULL THEN 'TLL'
          ELSE 'POS'
        END,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM paid_orders p 
            WHERE p.store_id = o.store_id 
            AND p.table_number = o.table_number 
            AND (p.user_id = o.user_id OR p.guest_phone = o.guest_phone)
            AND p.payment_status = 'completed'
          ) THEN 'closed'::check_status
          ELSE 'open'::check_status
        END,
        MIN(o.created_at)
      FROM orders o
      WHERE o.store_id IS NOT NULL
      GROUP BY o.store_id, o.table_number, o.user_id, o.guest_phone
    `);
    
    console.log('✅ checks 테이블 마이그레이션 완료');
    
    // 2. orders -> orders (신규) 마이그레이션
    console.log('📝 2단계: orders -> orders (신규) 마이그레이션');
    
    await client.query(`
      INSERT INTO orders (check_id, source, status, created_at)
      SELECT 
        c.id,
        CASE 
          WHEN o.user_id IS NOT NULL OR o.guest_phone IS NOT NULL THEN 'TLL'
          ELSE 'POS'
        END,
        CASE 
          WHEN o.cooking_status = 'PENDING' OR o.cooking_status = 'OPEN' THEN 'pending'::order_status
          WHEN o.cooking_status IN ('COOKING', 'COMPLETED', 'CLOSED') THEN 'confirmed'::order_status
          ELSE 'void'::order_status
        END,
        o.created_at
      FROM orders o
      JOIN checks c ON c.store_id = o.store_id 
        AND c.table_number = o.table_number
        AND (c.user_id IS NOT DISTINCT FROM o.user_id)
        AND (c.guest_phone IS NOT DISTINCT FROM o.guest_phone)
      WHERE o.store_id IS NOT NULL
    `);
    
    console.log('✅ orders (신규) 테이블 마이그레이션 완료');
    
    // 3. order_items -> order_lines 마이그레이션 (수량 분해)
    console.log('🍽️ 3단계: order_items -> order_lines 마이그레이션');
    
    const orderItemsResult = await client.query(`
      SELECT 
        oi.id,
        oi.order_id as old_order_id,
        oi.menu_name,
        oi.price,
        oi.quantity,
        oi.cooking_status,
        oi.created_at,
        o2.id as new_order_id
      FROM order_items oi
      JOIN orders o1 ON o1.id = oi.order_id
      JOIN checks c ON c.store_id = o1.store_id 
        AND c.table_number = o1.table_number
        AND (c.user_id IS NOT DISTINCT FROM o1.user_id)
        AND (c.guest_phone IS NOT DISTINCT FROM o1.guest_phone)
      JOIN orders o2 ON o2.check_id = c.id
      ORDER BY oi.id
    `);
    
    console.log(`📊 처리할 order_items: ${orderItemsResult.rows.length}개`);
    
    for (const item of orderItemsResult.rows) {
      const quantity = Math.max(1, item.quantity || 1);
      
      for (let i = 0; i < quantity; i++) {
        await client.query(`
          INSERT INTO order_lines (order_id, menu_name, unit_price, status, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          item.new_order_id,
          item.menu_name,
          item.price,
          item.cooking_status === 'COMPLETED' ? 'served' : 'queued',
          item.created_at
        ]);
      }
    }
    
    console.log('✅ order_lines 테이블 마이그레이션 완료');
    
    // 4. paid_orders -> payments 마이그레이션
    console.log('💳 4단계: paid_orders -> payments 마이그레이션');
    
    await client.query(`
      INSERT INTO payments (check_id, method, amount, status, paid_at, created_at)
      SELECT 
        c.id,
        COALESCE(po.payment_method, 'CARD'),
        po.final_amount,
        'paid'::pay_status,
        po.payment_date,
        po.created_at
      FROM paid_orders po
      JOIN checks c ON c.store_id = po.store_id 
        AND c.table_number = po.table_number
        AND (c.user_id IS NOT DISTINCT FROM po.user_id)
        AND (c.guest_phone IS NOT DISTINCT FROM po.guest_phone)
      WHERE po.payment_status = 'completed'
    `);
    
    console.log('✅ payments 테이블 마이그레이션 완료');
    
    // 5. user_paid_orders -> payments 마이그레이션 (TL회원용)
    console.log('👤 5단계: user_paid_orders -> payments 마이그레이션');
    
    await client.query(`
      INSERT INTO payments (check_id, method, amount, status, paid_at, created_at)
      SELECT 
        c.id,
        COALESCE(upo.payment_method, 'TOSS'),
        upo.final_amount,
        'paid'::pay_status,
        upo.payment_date,
        upo.created_at
      FROM user_paid_orders upo
      JOIN checks c ON c.store_id = upo.store_id 
        AND c.table_number = upo.table_number
        AND c.user_id = upo.user_id
      WHERE upo.payment_status = 'completed'
    `);
    
    console.log('✅ user_paid_orders -> payments 마이그레이션 완료');
    
    await client.query('COMMIT');
    
    // 6. 마이그레이션 검증
    console.log('🔍 마이그레이션 검증 중...');
    
    const verification = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM checks) as checks_count,
        (SELECT COUNT(*) FROM orders) as orders_count,
        (SELECT COUNT(*) FROM order_lines) as lines_count,
        (SELECT COUNT(*) FROM payments) as payments_count
    `);
    
    const stats = verification.rows[0];
    console.log('📊 마이그레이션 결과:');
    console.log(`   - checks: ${stats.checks_count}개`);
    console.log(`   - orders: ${stats.orders_count}개`);
    console.log(`   - order_lines: ${stats.lines_count}개`);
    console.log(`   - payments: ${stats.payments_count}개`);
    
    console.log('🎉 데이터 마이그레이션 완료!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateToNewSchema()
    .then(() => {
      console.log('✅ 마이그레이션 성공');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateToNewSchema };
