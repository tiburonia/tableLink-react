
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * TLL 비회원 주문 전용 API
 * - QR 스캔부터 결제까지 비회원 전용 처리
 */

/**
 * [POST] /tll-guest/start - 비회원 TLL 주문 시작
 */
router.post('/start', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, guestPhone, guestName } = req.body;

    console.log(`🎫 비회원 TLL 주문 시작:`, { storeId, tableNumber, guestPhone, guestName });

    if (!storeId || !tableNumber || !guestPhone) {
      return res.status(400).json({
        success: false,
        error: '매장 ID, 테이블 번호, 전화번호가 필요합니다'
      });
    }

    await client.query('BEGIN');

    // 1. 게스트 정보 처리
    let guestId = null;
    const existingGuest = await client.query(`
      SELECT id FROM guests WHERE phone = $1
    `, [guestPhone]);

    if (existingGuest.rows.length > 0) {
      guestId = existingGuest.rows[0].id;
      console.log(`🔍 기존 게스트 발견: ID ${guestId}`);
    } else {
      const newGuest = await client.query(`
        INSERT INTO guests (phone, created_at)
        VALUES ($1, CURRENT_TIMESTAMP)
        RETURNING id
      `, [guestPhone]);
      guestId = newGuest.rows[0].id;
      console.log(`✅ 새 게스트 생성: ID ${guestId}`);
    }

    // 2. 테이블 상태 확인
    const tableCheck = await client.query(`
      SELECT status, processing_order_id
      FROM store_tables
      WHERE store_id = $1 AND id = $2
    `, [storeId, tableNumber]);

    if (tableCheck.rows.length === 0) {
      throw new Error('테이블을 찾을 수 없습니다');
    }

    const table = tableCheck.rows[0];

    // 3. 주문 생성
    const orderResult = await client.query(`
      INSERT INTO orders (
        store_id,
        table_num,
        guest_phone,
        source,
        status,
        payment_status,
        session_status,
        created_at
      ) VALUES ($1, $2, $3, 'TLL', 'OPEN', 'UNPAID', 'OPEN', CURRENT_TIMESTAMP)
      RETURNING id
    `, [storeId, tableNumber, guestPhone]);

    const orderId = orderResult.rows[0].id;

    // 4. 테이블 점유 처리
    await client.query(`
      UPDATE store_tables
      SET status = 'OCCUPIED',
          processing_order_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $2 AND id = $3
    `, [orderId, storeId, tableNumber]);

    // 5. table_orders 연결
    await client.query(`
      INSERT INTO table_orders (order_id, table_id, store_id, source, linked_at)
      VALUES ($1, $2, $3, 'TLL', CURRENT_TIMESTAMP)
    `, [orderId, tableNumber, storeId]);

    await client.query('COMMIT');

    console.log(`✅ 비회원 TLL 주문 ${orderId} 생성 완료`);

    res.json({
      success: true,
      orderId: orderId,
      guestId: guestId,
      storeId: parseInt(storeId),
      tableNumber: parseInt(tableNumber),
      message: '비회원 주문이 시작되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 비회원 TLL 주문 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '비회원 주문 시작 실패'
    });
  } finally {
    client.release();
  }
});

/**
 * [POST] /tll-guest/add-items - 비회원 주문에 아이템 추가
 */
router.post('/add-items', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId, items } = req.body;

    console.log(`🛒 비회원 주문 ${orderId}에 ${items.length}개 아이템 추가`);

    if (!orderId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '주문 ID와 아이템이 필요합니다'
      });
    }

    await client.query('BEGIN');

    // 주문 확인
    const orderCheck = await client.query(`
      SELECT id, store_id, status FROM orders WHERE id = $1
    `, [orderId]);

    if (orderCheck.rows.length === 0) {
      throw new Error('주문을 찾을 수 없습니다');
    }

    const order = orderCheck.rows[0];

    if (order.status !== 'OPEN') {
      throw new Error('이미 종료된 주문입니다');
    }

    // 티켓 생성
    const ticketResult = await client.query(`
      INSERT INTO order_tickets (
        order_id,
        store_id,
        table_num,
        source,
        batch_no,
        paid_status,
        status,
        created_at
      )
      SELECT $1, $2, o.table_num, 'TLL', 
             COALESCE(MAX(ot.batch_no), 0) + 1,
             'UNPAID', 'PENDING', CURRENT_TIMESTAMP
      FROM orders o
      LEFT JOIN order_tickets ot ON o.id = ot.order_id
      WHERE o.id = $1
      GROUP BY o.table_num
      RETURNING id, batch_no
    `, [orderId, order.store_id]);

    const ticketId = ticketResult.rows[0].id;
    const batchNo = ticketResult.rows[0].batch_no;

    // 아이템 추가
    let totalAmount = 0;
    for (const item of items) {
      const itemTotal = item.unit_price * item.quantity;
      totalAmount += itemTotal;

      await client.query(`
        INSERT INTO order_items (
          order_id,
          ticket_id,
          store_id,
          menu_name,
          quantity,
          unit_price,
          total_price,
          item_status,
          cook_station,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, CURRENT_TIMESTAMP)
      `, [
        orderId,
        ticketId,
        order.store_id,
        item.menu_name,
        item.quantity,
        item.unit_price,
        itemTotal,
        item.cook_station || 'KITCHEN'
      ]);
    }

    // 주문 총액 업데이트
    await client.query(`
      UPDATE orders
      SET total_price = COALESCE(total_price, 0) + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [totalAmount, orderId]);

    await client.query('COMMIT');

    console.log(`✅ 비회원 주문 ${orderId} 아이템 추가 완료 (총액: ${totalAmount}원)`);

    res.json({
      success: true,
      orderId: orderId,
      ticketId: ticketId,
      batchNo: batchNo,
      itemCount: items.length,
      addedAmount: totalAmount,
      message: '아이템이 추가되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 비회원 주문 아이템 추가 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '아이템 추가 실패'
    });
  } finally {
    client.release();
  }
});

/**
 * [POST] /tll-guest/payment/prepare - 비회원 결제 준비
 */
router.post('/payment/prepare', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId, guestPhone, guestName } = req.body;

    console.log(`💳 비회원 결제 준비:`, { orderId, guestPhone, guestName });

    if (!orderId || !guestPhone) {
      return res.status(400).json({
        success: false,
        error: '주문 ID와 전화번호가 필요합니다'
      });
    }

    await client.query('BEGIN');

    // 주문 정보 조회
    const orderResult = await client.query(`
      SELECT
        o.id,
        o.store_id,
        o.table_num,
        o.total_price,
        o.status,
        o.payment_status,
        s.name as store_name
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      throw new Error('주문을 찾을 수 없습니다');
    }

    const order = orderResult.rows[0];

    if (order.status !== 'OPEN') {
      throw new Error('이미 종료된 주문입니다');
    }

    if (order.payment_status === 'PAID') {
      throw new Error('이미 결제된 주문입니다');
    }

    // pending_payments에 저장
    await client.query(`
      INSERT INTO pending_payments (
        order_id,
        user_pk,
        store_id,
        table_number,
        order_data,
        amount,
        status,
        created_at
      ) VALUES ($1, NULL, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP)
      ON CONFLICT (order_id) 
      DO UPDATE SET
        amount = EXCLUDED.amount,
        order_data = EXCLUDED.order_data,
        updated_at = CURRENT_TIMESTAMP
    `, [
      orderId,
      order.store_id,
      order.table_num,
      JSON.stringify({
        guestPhone,
        guestName,
        storeName: order.store_name
      }),
      order.total_price
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      orderId: orderId,
      amount: order.total_price,
      storeName: order.store_name,
      tableNumber: order.table_num,
      message: '결제 준비 완료'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 비회원 결제 준비 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '결제 준비 실패'
    });
  } finally {
    client.release();
  }
});

/**
 * [POST] /tll-guest/payment/confirm - 비회원 결제 확인 (토스 페이먼츠 콜백)
 */
router.post('/payment/confirm', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId, paymentKey, amount } = req.body;

    console.log(`✅ 비회원 결제 확인:`, { orderId, paymentKey, amount });

    if (!orderId || !paymentKey || !amount) {
      return res.status(400).json({
        success: false,
        error: '결제 확인에 필요한 정보가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // pending_payments 조회
    const pendingResult = await client.query(`
      SELECT * FROM pending_payments
      WHERE order_id = $1 AND status = 'PENDING'
    `, [orderId]);

    if (pendingResult.rows.length === 0) {
      throw new Error('대기 중인 결제를 찾을 수 없습니다');
    }

    const pending = pendingResult.rows[0];

    // 금액 검증
    if (Math.abs(pending.amount - amount) > 1) {
      throw new Error('결제 금액이 일치하지 않습니다');
    }

    // payments 레코드 생성
    const paymentResult = await client.query(`
      INSERT INTO payments (
        order_id,
        method,
        amount,
        status,
        paid_at,
        transaction_id,
        provider_response
      ) VALUES ($1, 'TOSS', $2, 'COMPLETED', CURRENT_TIMESTAMP, $3, $4)
      RETURNING id
    `, [
      orderId,
      amount,
      paymentKey,
      JSON.stringify({
        payment_key: paymentKey,
        guest_payment: true,
        confirmed_at: new Date().toISOString()
      })
    ]);

    const paymentId = paymentResult.rows[0].id;

    // 모든 티켓 PAID 처리
    await client.query(`
      UPDATE order_tickets
      SET paid_status = 'PAID',
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 AND paid_status = 'UNPAID'
    `, [orderId]);

    // payment_details 생성
    const ticketsResult = await client.query(`
      SELECT id FROM order_tickets WHERE order_id = $1
    `, [orderId]);

    for (const ticket of ticketsResult.rows) {
      await client.query(`
        INSERT INTO payment_details (payment_id, order_id, ticket_id)
        VALUES ($1, $2, $3)
      `, [paymentId, orderId, ticket.id]);
    }

    // 주문 상태 업데이트
    await client.query(`
      UPDATE orders
      SET payment_status = 'PAID',
          status = 'COMPLETED',
          session_status = 'CLOSED',
          session_ended = true,
          session_ended_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId]);

    // pending_payments 완료 처리
    await client.query(`
      UPDATE pending_payments
      SET status = 'COMPLETED',
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
    `, [orderId]);

    // 테이블 해제
    await client.query(`
      UPDATE store_tables
      SET status = 'AVAILABLE',
          processing_order_id = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $1 AND processing_order_id = $2
    `, [pending.store_id, orderId]);

    // table_orders 연결 해제
    await client.query(`
      UPDATE table_orders
      SET unlinked_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 AND unlinked_at IS NULL
    `, [orderId]);

    await client.query('COMMIT');

    console.log(`✅ 비회원 결제 완료: 주문 ${orderId}, 금액 ${amount}원`);

    res.json({
      success: true,
      orderId: orderId,
      paymentId: paymentId,
      amount: amount,
      message: '비회원 결제가 완료되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 비회원 결제 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '결제 확인 실패'
    });
  } finally {
    client.release();
  }
});

module.exports = router;
