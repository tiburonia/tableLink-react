
const pool = require('../../shared/config/database');

async function createCompatibilityViews() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 호환성 뷰 생성 시작...');
    
    await client.query('BEGIN');
    
    // 1. paid_orders 호환 뷰
    console.log('💳 paid_orders 호환 뷰 생성 중...');
    
    await client.query(`
      CREATE OR REPLACE VIEW paid_orders_view AS
      SELECT
        p.id,
        ch.store_id,
        ch.user_id,
        ch.guest_phone,
        ch.table_number,
        jsonb_build_object(
          'items', COALESCE(
            (SELECT jsonb_agg(
              jsonb_build_object(
                'name', ol.menu_name,
                'price', ol.unit_price,
                'quantity', 1
              )
            )
            FROM order_lines ol
            JOIN orders o ON o.id = ol.order_id
            WHERE o.check_id = ch.id), '[]'::jsonb
          ),
          'totalAmount', p.amount
        ) as order_data,
        p.amount as original_amount,
        0 as used_point,
        0 as coupon_discount,
        p.amount AS final_amount,
        p.method AS payment_method,
        p.status AS payment_status,
        p.paid_at AS payment_date,
        ch.source as order_source,
        p.created_at
      FROM payments p
      JOIN checks ch ON ch.id = p.check_id
      WHERE p.status = 'paid'
    `);
    
    // 2. user_paid_orders 호환 뷰
    console.log('👤 user_paid_orders 호환 뷰 생성 중...');
    
    await client.query(`
      CREATE OR REPLACE VIEW user_paid_orders_view AS
      SELECT
        p.id,
        ch.user_id,
        ch.store_id,
        ch.table_number,
        jsonb_build_object(
          'items', COALESCE(
            (SELECT jsonb_agg(
              jsonb_build_object(
                'name', ol.menu_name,
                'price', ol.unit_price,
                'quantity', 1
              )
            )
            FROM order_lines ol
            JOIN orders o ON o.id = ol.order_id
            WHERE o.check_id = ch.id), '[]'::jsonb
          ),
          'totalAmount', p.amount
        ) as order_data,
        p.amount as original_amount,
        0 as used_point,
        0 as coupon_discount,
        p.amount AS final_amount,
        p.method AS payment_method,
        'completed' AS payment_status,
        p.paid_at AS payment_date,
        ch.source as order_source,
        p.created_at,
        NULL as payment_reference
      FROM payments p
      JOIN checks ch ON ch.id = p.check_id
      WHERE ch.user_id IS NOT NULL AND p.status = 'paid'
    `);
    
    // 3. orders 호환 뷰 (KDS용)
    console.log('🍳 orders 호환 뷰 생성 중...');
    
    await client.query(`
      CREATE OR REPLACE VIEW orders_view AS
      SELECT
        o.id,
        p.id as paid_order_id,
        NULL as user_paid_order_id,
        ch.store_id,
        ch.table_number,
        COALESCE(ch.user_id, '게스트') as customer_name,
        jsonb_build_object(
          'items', COALESCE(
            (SELECT jsonb_agg(
              jsonb_build_object(
                'name', ol.menu_name,
                'price', ol.unit_price,
                'status', ol.status
              )
            )
            FROM order_lines ol
            WHERE ol.order_id = o.id), '[]'::jsonb
          )
        ) as order_data,
        COALESCE(p.amount, 0) as total_amount,
        CASE 
          WHEN o.status = 'pending' THEN 'PENDING'
          WHEN o.status = 'confirmed' THEN 'COOKING'
          ELSE 'COMPLETED'
        END as cooking_status,
        o.created_at as started_at,
        NULL as completed_at,
        o.created_at,
        CURRENT_TIMESTAMP as updated_at,
        ch.user_id,
        ch.guest_phone,
        true as is_visible
      FROM orders o
      JOIN checks ch ON ch.id = o.check_id
      LEFT JOIN payments p ON p.check_id = ch.id AND p.status = 'paid'
    `);
    
    // 4. order_items 호환 뷰
    console.log('🍽️ order_items 호환 뷰 생성 중...');
    
    await client.query(`
      CREATE OR REPLACE VIEW order_items_view AS
      SELECT
        ol.id,
        o.id as order_id,
        ol.menu_name,
        1 as quantity,
        ol.unit_price as price,
        ol.status as cooking_status,
        ol.created_at,
        NULL as started_at,
        NULL as completed_at,
        NULL as paid_order_id
      FROM order_lines ol
      JOIN orders o ON o.id = ol.order_id
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ 호환성 뷰 생성 완료');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 호환성 뷰 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  createCompatibilityViews()
    .then(() => {
      console.log('✅ 호환성 뷰 생성 성공');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 호환성 뷰 생성 실패:', error);
      process.exit(1);
    });
}

module.exports = { createCompatibilityViews };
