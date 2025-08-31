
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// KRP 화면 라우트
router.get('/', async (req, res) => {
  const { storeId } = req.query;

  if (!storeId) {
    return res.status(400).json({ success: false, error: 'storeId가 필요합니다' });
  }

  try {
    console.log(`📟 KRP - 매장 ${storeId} 주문 조회`);

    // 매장의 최근 주문들 조회
    const result = await pool.query(`
      SELECT 
        o.id,
        o.table_number,
        o.created_at,
        o.cooking_status,
        o.customer_name,
        array_agg(
          json_build_object(
            'menu_name', oi.menu_name,
            'quantity', oi.quantity,
            'options', oi.options
          )
        ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.store_id = $1 
        AND o.cooking_status IN ('pending', 'cooking')
      GROUP BY o.id, o.table_number, o.created_at, o.cooking_status, o.customer_name
      ORDER BY o.created_at DESC
      LIMIT 20
    `, [storeId]);

    console.log(`✅ KRP - 매장 ${storeId} 주문 ${result.rows.length}개 조회 완료`);

    res.json({
      success: true,
      orders: result.rows,
      storeId: parseInt(storeId)
    });

  } catch (err) {
    console.error('❌ KRP 주문 조회 실패:', err);
    res.status(500).json({ success: false, error: 'KRP 주문 조회 실패' });
  }
});

// 주문서 출력 처리
router.post('/print', async (req, res) => {
  const { storeId, orderId } = req.body;

  if (!storeId || !orderId) {
    return res.status(400).json({ success: false, error: 'storeId와 orderId가 필요합니다' });
  }

  try {
    console.log(`🖨️ KRP - 주문 ${orderId} 출력 처리`);

    // 주문 상세 정보 조회
    const orderResult = await pool.query(`
      SELECT 
        o.id,
        o.table_number,
        o.created_at,
        o.customer_name,
        array_agg(
          json_build_object(
            'menu_name', oi.menu_name,
            'quantity', oi.quantity,
            'options', oi.options
          )
        ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1 AND o.store_id = $2
      GROUP BY o.id, o.table_number, o.created_at, o.customer_name
    `, [orderId, storeId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '주문을 찾을 수 없습니다' });
    }

    const order = orderResult.rows[0];

    // WebSocket으로 KRP 클라이언트들에게 출력 이벤트 전송
    if (global.krpWebSocket) {
      global.krpWebSocket.broadcastPrint(storeId, {
        type: 'print-receipt',
        order: order,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ KRP - 주문 ${orderId} 출력 완료`);

    res.json({
      success: true,
      message: '주문서 출력 완료',
      order: order
    });

  } catch (err) {
    console.error('❌ KRP 출력 실패:', err);
    res.status(500).json({ success: false, error: 'KRP 출력 실패' });
  }
});

module.exports = router;
