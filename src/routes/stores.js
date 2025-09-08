const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

// 매장 기본 정보 조회 API
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🏪 매장 ${storeId} 기본 정보 조회 요청`);

    // 매장 기본 정보 조회
    const storeResult = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.phone,
        si.rating_average,
        si.review_count,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_X(sa.geom) as lng,
        ST_Y(sa.geom) as lat
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE s.id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    const store = storeResult.rows[0];

    console.log(`✅ 매장 ${storeId} 기본 정보 조회 완료: ${store.name}`);

    res.json({
      success: true,
      store: store
    });

  } catch (error) {
    console.error('❌ 매장 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '매장 정보 조회 중 오류가 발생했습니다'
    });
  }
});

// 매장 메뉴 조회 API (새 스키마 기반)
router.get('/:storeId/menu/tll', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🔍 매장 ${storeId} 메뉴 조회 요청`);

    // 매장 존재 확인
    const storeResult = await pool.query('SELECT id, name FROM stores WHERE id = $1', [storeId]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    // 메뉴 조회 (현재 스키마에 맞게)
    const menuResult = await pool.query(`
      SELECT 
        id,
        name,
        description,
        price,
        cook_station as category
      FROM store_menu 
      WHERE store_id = $1
      ORDER BY id
    `, [storeId]);

    console.log(`✅ 매장 ${storeId} 메뉴 ${menuResult.rows.length}개 조회 완료`);

    res.json({
      success: true,
      store: storeResult.rows[0],
      menu: menuResult.rows
    });

  } catch (error) {
    console.error('❌ 메뉴 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '메뉴 조회 중 오류가 발생했습니다'
    });
  }
});

// TLL 주문 생성 API (결제 직전)
router.post('/orders/create-tll', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      store_id,
      table_number,
      user_id,
      items,
      used_points = 0,
      coupon_id = null,
      coupon_discount = 0,
      idempotency_key
    } = req.body;

    console.log('🛒 TLL 주문 생성 요청:', {
      store_id,
      table_number,
      user_id,
      items: items?.length,
      total_items: items?.reduce((sum, item) => sum + item.quantity, 0),
      idempotency_key
    });

    // 입력값 검증
    if (!store_id || !table_number || !user_id || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error('필수 데이터가 누락되었습니다');
    }

    // idempotency_key 중복 검증
    if (idempotency_key) {
      const existingOrder = await client.query(
        'SELECT id FROM orders WHERE idempotency_key = $1',
        [idempotency_key]
      );

      if (existingOrder.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          error: '중복된 요청입니다',
          order_id: existingOrder.rows[0].id
        });
      }
    }

    // 매장 및 사용자 존재 확인
    const storeCheck = await client.query('SELECT name FROM stores WHERE id = $1', [store_id]);
    if (storeCheck.rows.length === 0) {
      throw new Error('매장을 찾을 수 없습니다');
    }

    const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // 총 금액 계산
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const total_amount = Math.max(0, subtotal - used_points - coupon_discount);

    // 1. orders 테이블에 주문 생성
    const orderResult = await client.query(`
      INSERT INTO orders (
        store_id, 
        user_id, 
        table_number,
        status, 
        payment_status,
        subtotal,
        total_amount,
        source,
        order_type,
        idempotency_key,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id, created_at
    `, [
      store_id, 
      user_id, 
      table_number,
      'PENDING', 
      'PENDING',
      subtotal,
      total_amount,
      'TLL',
      'DINE_IN',
      idempotency_key
    ]);

    const orderId = orderResult.rows[0].id;

    // 2. order_tickets 테이블에 티켓 생성
    const ticketResult = await client.query(`
      INSERT INTO order_tickets (
        order_id,
        batch_no,
        status,
        payment_type,
        total_amount,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `, [orderId, 1, 'PENDING', 'PREPAID', total_amount]);

    const ticketId = ticketResult.rows[0].id;

    // 3. order_items 테이블에 주문 아이템들 생성
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id,
          ticket_id,
          menu_name,
          unit_price,
          quantity,
          subtotal,
          item_status,
          options
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        orderId,
        ticketId,
        item.menu_name,
        item.unit_price,
        item.quantity,
        item.unit_price * item.quantity,
        'PENDING',
        item.options ? JSON.stringify(item.options) : null
      ]);
    }

    // 4. 포인트 사용 기록 (order_adjustments)
    if (used_points > 0) {
      await client.query(`
        INSERT INTO order_adjustments (
          order_id,
          type,
          amount,
          description,
          created_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [orderId, 'POINT', -used_points, '포인트 사용']);
    }

    // 5. 쿠폰 사용 기록 (order_adjustments)
    if (coupon_id && coupon_discount > 0) {
      await client.query(`
        INSERT INTO order_adjustments (
          order_id,
          type,
          amount,
          description,
          reference_id,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [orderId, 'COUPON', -coupon_discount, '쿠폰 할인', coupon_id]);
    }

    await client.query('COMMIT');

    console.log('✅ TLL 주문 생성 완료:', {
      order_id: orderId,
      ticket_id: ticketId,
      total_amount,
      items_count: items.length
    });

    res.json({
      success: true,
      order_id: orderId,
      ticket_id: ticketId,
      total_amount,
      message: 'TLL 주문이 성공적으로 생성되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL 주문 생성 실패:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'TLL 주문 생성 중 오류가 발생했습니다'
    });
  } finally {
    client.release();
  }
});

module.exports = router;