const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// KDS 매장별 주문 데이터 조회 (새 스키마 기반)
router.get('/orders/:storeId', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);

    if (isNaN(storeId)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID입니다'
      });
    }

    console.log(`📟 KDS - 매장 ${storeId} 주문 데이터 조회`);

    // 새 스키마 기반 주문 데이터 조회
    const result = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.status as order_status,
        o.source,
        o.total_amount,
        o.created_at,
        o.updated_at,
        c.table_number,
        c.customer_name,
        c.customer_phone,
        c.guest_name,
        COALESCE(c.customer_name, c.guest_name, '손님') as customerName,
        -- 주문 아이템들
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_name', oi.menu_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'options', oi.options,
            'cooking_status', oi.status,
            'cook_station', oi.cook_station,
            'started_at', oi.started_at,
            'ready_at', oi.ready_at,
            'served_at', oi.served_at,
            'priority', oi.priority,
            'estimated_time', oi.estimated_time
          ) ORDER BY oi.created_at
        ) as items,
        -- 전체 조리 상태 계산
        CASE 
          WHEN COUNT(CASE WHEN oi.status = 'served' THEN 1 END) = COUNT(oi.id) THEN 'COMPLETED'
          WHEN COUNT(CASE WHEN oi.status = 'ready' THEN 1 END) > 0 THEN 'READY'
          WHEN COUNT(CASE WHEN oi.status = 'cooking' THEN 1 END) > 0 THEN 'COOKING'
          ELSE 'PENDING'
        END as cookingStatus
      FROM orders o
      JOIN checks c ON o.check_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE c.store_id = $1
        AND o.status NOT IN ('cancelled')
        AND oi.status NOT IN ('served', 'cancelled')
      GROUP BY o.id, o.order_number, o.status, o.source, o.total_amount, 
               o.created_at, o.updated_at, c.table_number, c.customer_name, 
               c.customer_phone, c.guest_name
      ORDER BY o.created_at DESC
      LIMIT 50
    `, [storeId]);

    console.log(`✅ KDS 주문 조회 완료: ${result.rows.length}개`);

    res.json({
      success: true,
      orders: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('❌ KDS 주문 데이터 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 주문 데이터 조회 실패'
    });
  }
});

// 주문 전체 조리 시작
router.put('/orders/:orderId/start-cooking', async (req, res) => {
  const client = await pool.connect();

  try {
    const orderId = parseInt(req.params.orderId);

    await client.query('BEGIN');

    // 주문의 모든 대기중인 아이템을 조리중으로 변경
    const result = await client.query(`
      UPDATE order_items 
      SET status = 'cooking', 
          started_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 
        AND status = 'queued'
      RETURNING *
    `, [orderId]);

    // 주문 상태도 업데이트
    await client.query(`
      UPDATE orders 
      SET status = 'preparing',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId]);

    await client.query('COMMIT');

    console.log(`🔥 주문 ${orderId} 조리 시작 (${result.rows.length}개 아이템)`);

    res.json({
      success: true,
      message: '조리를 시작했습니다',
      updatedItems: result.rows.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 주문 조리 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: '조리 시작에 실패했습니다'
    });
  } finally {
    client.release();
  }
});

// 주문 완료
router.put('/orders/:orderId/complete', async (req, res) => {
  const client = await pool.connect();

  try {
    const orderId = parseInt(req.params.orderId);

    await client.query('BEGIN');

    // 주문의 모든 조리중인 아이템을 완료로 변경
    const result = await client.query(`
      UPDATE order_items 
      SET status = 'ready', 
          ready_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 
        AND status = 'cooking'
      RETURNING *
    `, [orderId]);

    // 주문 상태도 업데이트
    await client.query(`
      UPDATE orders 
      SET status = 'ready',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId]);

    await client.query('COMMIT');

    console.log(`✅ 주문 ${orderId} 조리 완료 (${result.rows.length}개 아이템)`);

    res.json({
      success: true,
      message: '조리가 완료되었습니다',
      updatedItems: result.rows.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 주문 완료 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 완료에 실패했습니다'
    });
  } finally {
    client.release();
  }
});

// 개별 메뉴 아이템 조리 시작
router.put('/items/:itemId/start-cooking', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);

    const result = await pool.query(`
      UPDATE order_items 
      SET status = 'cooking', 
          started_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'queued'
      RETURNING *
    `, [itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '아이템을 찾을 수 없거나 이미 조리 중입니다'
      });
    }

    console.log(`🔥 아이템 ${itemId} 조리 시작`);

    res.json({
      success: true,
      message: '메뉴 조리를 시작했습니다',
      item: result.rows[0]
    });

  } catch (error) {
    console.error('❌ 아이템 조리 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: '메뉴 조리 시작에 실패했습니다'
    });
  }
});

// 개별 메뉴 아이템 조리 완료
router.put('/items/:itemId/complete-cooking', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);

    const result = await pool.query(`
      UPDATE order_items 
      SET status = 'ready', 
          ready_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'cooking'
      RETURNING *
    `, [itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '아이템을 찾을 수 없거나 조리 중이 아닙니다'
      });
    }

    console.log(`✅ 아이템 ${itemId} 조리 완료`);

    res.json({
      success: true,
      message: '메뉴 조리가 완료되었습니다',
      item: result.rows[0]
    });

  } catch (error) {
    console.error('❌ 아이템 조리 완료 실패:', error);
    res.status(500).json({
      success: false,
      error: '메뉴 조리 완료에 실패했습니다'
    });
  }
});

// KDS 실시간 업데이트 알림
router.post('/notify-update', async (req, res) => {
  try {
    const { storeId, type, data } = req.body;

    console.log(`📡 KDS 업데이트 알림: 매장 ${storeId}, 타입: ${type}`);

    // WebSocket이나 SSE로 실시간 알림을 보낼 수 있음
    // 현재는 로그만 남김

    res.json({
      success: true,
      message: 'KDS 업데이트 알림 전송 완료'
    });

  } catch (error) {
    console.error('❌ KDS 업데이트 알림 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 업데이트 알림 실패'
    });
  }
});

// KDS 매장 정보 조회
router.get('/store/:storeId', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);

    const result = await pool.query(`
      SELECT id, name, phone, address, hours, 
             latitude, longitude, created_at
      FROM stores 
      WHERE id = $1
    `, [storeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      store: result.rows[0]
    });

  } catch (error) {
    console.error('❌ KDS 매장 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 정보 조회 실패'
    });
  }
});

module.exports = router;