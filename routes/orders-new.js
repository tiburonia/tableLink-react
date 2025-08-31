
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// TLL 주문 생성 (새 스키마)
router.post('/tll/create', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      storeId,
      tableNumber,
      userId,
      guestPhone,
      orderData,
      finalTotal
    } = req.body;

    console.log('🆕 TLL 주문 생성 (새 스키마):', {
      storeId,
      tableNumber,
      userId: userId ? '***' : undefined,
      guestPhone: guestPhone ? '***' : undefined,
      finalTotal
    });

    await client.query('BEGIN');

    // 1. 체크 생성 또는 기존 체크 찾기
    let checkResult = await client.query(`
      SELECT id FROM checks 
      WHERE store_id = $1 AND table_number = $2 
      AND status = 'open'
      AND (user_id = $3 OR guest_phone = $4)
      ORDER BY opened_at DESC LIMIT 1
    `, [storeId, tableNumber, userId, guestPhone]);

    let checkId;
    if (checkResult.rows.length > 0) {
      checkId = checkResult.rows[0].id;
      console.log(`✅ 기존 체크 사용: ${checkId}`);
    } else {
      const newCheckResult = await client.query(`
        INSERT INTO checks (store_id, table_number, user_id, guest_phone, channel, source, status)
        VALUES ($1, $2, $3, $4, 'DINE_IN', 'TLL', 'open')
        RETURNING id
      `, [storeId, tableNumber, userId, guestPhone]);
      
      checkId = newCheckResult.rows[0].id;
      console.log(`✅ 새 체크 생성: ${checkId}`);
    }

    // 2. 주문 생성
    const extKey = `tll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const orderResult = await client.query(`
      INSERT INTO orders (check_id, source, status, ext_key)
      VALUES ($1, 'TLL', 'confirmed', $2)
      RETURNING id
    `, [checkId, extKey]);

    const orderId = orderResult.rows[0].id;

    // 3. 주문 라인 생성
    for (const item of orderData.items) {
      const quantity = item.quantity || 1;
      
      for (let i = 0; i < quantity; i++) {
        await client.query(`
          INSERT INTO order_lines (order_id, menu_name, unit_price, status)
          VALUES ($1, $2, $3, 'queued')
        `, [orderId, item.name, item.price]);
      }
    }

    // 4. 결제 생성
    const paymentResult = await client.query(`
      INSERT INTO payments (check_id, method, amount, status, paid_at, idempotency_key)
      VALUES ($1, $2, $3, 'paid', CURRENT_TIMESTAMP, $4)
      RETURNING id
    `, [checkId, 'TOSS', finalTotal, `pay-${extKey}`]);

    const paymentId = paymentResult.rows[0].id;

    // 5. 체크 닫기
    await client.query(`
      UPDATE checks SET status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [checkId]);

    // 6. 이벤트 로그
    await client.query(`
      INSERT INTO order_events (check_id, order_id, actor, event_type, payload)
      VALUES ($1, $2, 'TLL', 'ORDER_CREATED', $3)
    `, [checkId, orderId, JSON.stringify({
      itemCount: orderData.items.length,
      totalAmount: finalTotal,
      paymentMethod: 'TOSS'
    })]);

    await client.query('COMMIT');

    // 7. KDS 실시간 업데이트
    if (global.kdsWebSocket) {
      global.kdsWebSocket.broadcast(storeId, 'new-order-v2', {
        checkId: checkId,
        orderId: orderId,
        storeName: orderData.storeName,
        tableNumber: tableNumber,
        customerName: userId ? '회원' : '게스트',
        itemCount: orderData.items.length,
        totalAmount: finalTotal,
        source: 'TLL'
      });
    }

    res.json({
      success: true,
      checkId: checkId,
      orderId: orderId,
      paymentId: paymentId,
      message: 'TLL 주문이 성공적으로 생성되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL 주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 주문 생성 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// POS 주문 생성 (새 스키마)
router.post('/pos/create', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      storeId,
      tableNumber,
      items
    } = req.body;

    console.log('🆕 POS 주문 생성 (새 스키마):', {
      storeId,
      tableNumber,
      itemCount: items?.length
    });

    await client.query('BEGIN');

    // 1. 기존 열린 체크 찾기 또는 새로 생성
    let checkResult = await client.query(`
      SELECT id FROM checks 
      WHERE store_id = $1 AND table_number = $2 AND status = 'open'
      ORDER BY opened_at DESC LIMIT 1
    `, [storeId, tableNumber]);

    let checkId;
    if (checkResult.rows.length > 0) {
      checkId = checkResult.rows[0].id;
      console.log(`✅ 기존 POS 체크 사용: ${checkId}`);
    } else {
      const newCheckResult = await client.query(`
        INSERT INTO checks (store_id, table_number, channel, source, status)
        VALUES ($1, $2, 'DINE_IN', 'POS', 'open')
        RETURNING id
      `, [storeId, tableNumber]);
      
      checkId = newCheckResult.rows[0].id;
      console.log(`✅ 새 POS 체크 생성: ${checkId}`);
    }

    // 2. 주문 생성
    const orderResult = await client.query(`
      INSERT INTO orders (check_id, source, status)
      VALUES ($1, 'POS', 'pending')
      RETURNING id
    `, [checkId]);

    const orderId = orderResult.rows[0].id;

    // 3. 주문 라인 생성
    for (const item of items) {
      const quantity = item.quantity || 1;
      
      for (let i = 0; i < quantity; i++) {
        await client.query(`
          INSERT INTO order_lines (order_id, menu_name, unit_price, status)
          VALUES ($1, $2, $3, 'queued')
        `, [orderId, item.name, item.price]);
      }
    }

    // 4. 이벤트 로그
    await client.query(`
      INSERT INTO order_events (check_id, order_id, actor, event_type, payload)
      VALUES ($1, $2, 'POS', 'ORDER_CREATED', $3)
    `, [checkId, orderId, JSON.stringify({ itemCount: items.length })]);

    await client.query('COMMIT');

    // 5. KDS 실시간 업데이트
    if (global.kdsWebSocket) {
      global.kdsWebSocket.broadcast(storeId, 'new-order-v2', {
        checkId: checkId,
        orderId: orderId,
        tableNumber: tableNumber,
        itemCount: items.length,
        source: 'POS'
      });
    }

    res.json({
      success: true,
      checkId: checkId,
      orderId: orderId,
      message: 'POS 주문이 성공적으로 생성되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 주문 생성 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 체크 결제 처리
router.post('/checks/:checkId/payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { checkId } = req.params;
    const { method, amount, idempotencyKey } = req.body;

    console.log(`💳 체크 ${checkId} 결제 처리:`, {
      method,
      amount: `₩${amount.toLocaleString()}`
    });

    await client.query('BEGIN');

    // 1. 체크 상태 확인
    const checkResult = await client.query(`
      SELECT * FROM checks WHERE id = $1 AND status = 'open'
    `, [checkId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '결제할 수 있는 열린 체크를 찾을 수 없습니다'
      });
    }

    const check = checkResult.rows[0];

    // 2. 결제 생성
    const paymentResult = await client.query(`
      INSERT INTO payments (check_id, method, amount, status, paid_at, idempotency_key)
      VALUES ($1, $2, $3, 'paid', CURRENT_TIMESTAMP, $4)
      RETURNING id
    `, [checkId, method, amount, idempotencyKey]);

    const paymentId = paymentResult.rows[0].id;

    // 3. 체크 닫기
    await client.query(`
      UPDATE checks SET status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [checkId]);

    // 4. 주문 라인 상태 업데이트
    await client.query(`
      UPDATE order_lines 
      SET status = 'served'
      WHERE order_id IN (
        SELECT id FROM orders WHERE check_id = $1
      )
    `, [checkId]);

    // 5. 이벤트 로그
    await client.query(`
      INSERT INTO order_events (check_id, actor, event_type, payload)
      VALUES ($1, 'POS', 'PAYMENT_COMPLETED', $2)
    `, [checkId, JSON.stringify({
      paymentId: paymentId,
      method: method,
      amount: amount
    })]);

    await client.query('COMMIT');

    // 6. 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(check.store_id, 'payment-completed-v2', {
        checkId: checkId,
        paymentId: paymentId,
        tableNumber: check.table_number,
        amount: amount
      });
    }

    res.json({
      success: true,
      paymentId: paymentId,
      message: '결제가 성공적으로 완료되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// KDS용 주문 조회
router.get('/kds/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🍳 KDS 주문 조회 (새 스키마): 매장 ${storeId}`);

    const result = await pool.query(`
      SELECT 
        c.id as check_id,
        o.id as order_id,
        c.store_id,
        c.table_number,
        COALESCE(u.name, '게스트') as customer_name,
        c.source,
        o.created_at,
        COUNT(ol.id) as total_items,
        COUNT(CASE WHEN ol.status = 'queued' THEN 1 END) as queued_items,
        COUNT(CASE WHEN ol.status = 'cooking' THEN 1 END) as cooking_items,
        COUNT(CASE WHEN ol.status = 'ready' THEN 1 END) as ready_items,
        COUNT(CASE WHEN ol.status = 'served' THEN 1 END) as served_items
      FROM checks c
      JOIN orders o ON o.check_id = c.id
      JOIN order_lines ol ON ol.order_id = o.id
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.store_id = $1 
      AND c.status = 'open'
      AND ol.status IN ('queued', 'cooking', 'ready')
      GROUP BY c.id, o.id, c.store_id, c.table_number, u.name, c.source, o.created_at
      ORDER BY o.created_at ASC
    `, [storeId]);

    res.json({
      success: true,
      orders: result.rows
    });

  } catch (error) {
    console.error('❌ KDS 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 주문 조회 실패: ' + error.message
    });
  }
});

// 주문 라인 상태 업데이트 (KDS용)
router.patch('/lines/:lineId/status', async (req, res) => {
  try {
    const { lineId } = req.params;
    const { status } = req.body;

    console.log(`🔄 주문 라인 ${lineId} 상태 변경: ${status}`);

    const result = await pool.query(`
      UPDATE order_lines 
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, lineId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문 라인을 찾을 수 없습니다'
      });
    }

    const line = result.rows[0];

    // 이벤트 로그
    await pool.query(`
      INSERT INTO order_events (line_id, actor, event_type, payload)
      VALUES ($1, 'KDS', 'STATUS_CHANGED', $2)
    `, [lineId, JSON.stringify({ newStatus: status })]);

    res.json({
      success: true,
      line: line,
      message: `상태가 ${status}로 변경되었습니다`
    });

  } catch (error) {
    console.error('❌ 주문 라인 상태 변경 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 라인 상태 변경 실패: ' + error.message
    });
  }
});

module.exports = router;
