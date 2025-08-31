
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/pool');
const { calcCheckTotal, getPaymentStatus } = require('../utils/total');
const { storeAuth, checkIdempotency } = require('../mw/auth');

// 모든 라우트에 매장 인증 적용
router.use(storeAuth);

/**
 * [POST] /checks - 새 체크 생성
 */
router.post('/checks', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { table_number, user_id, guest_phone, channel = 'POS', source = 'MANUAL' } = req.body;
    const { storeId } = req;

    await client.query('BEGIN');

    // 체크 생성
    const checkResult = await client.query(`
      INSERT INTO checks (store_id, table_number, user_id, guest_phone, channel, source, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'open')
      RETURNING id, status, created_at
    `, [storeId, table_number, user_id, guest_phone, channel, source]);

    const check = checkResult.rows[0];

    // 이벤트 기록
    await client.query(`
      INSERT INTO order_events (check_id, event_type, details)
      VALUES ($1, 'CHECK_CREATED', $2)
    `, [check.id, JSON.stringify({ channel, source, table_number })]);

    await client.query('COMMIT');

    console.log(`✅ 새 체크 생성: ${check.id} (매장 ${storeId})`);

    res.status(201).json({
      check_id: check.id,
      status: check.status,
      store_id: storeId,
      created_at: check.created_at
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * [GET] /checks/:id/summary - 체크 요약 정보
 */
router.get('/checks/:id/summary', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const checkId = parseInt(req.params.id);
    const { storeId } = req;

    // 체크 기본 정보
    const checkResult = await client.query(`
      SELECT id, store_id, table_number, user_id, guest_phone, 
             status, channel, source, created_at, final_amount
      FROM checks 
      WHERE id = $1 AND store_id = $2
    `, [checkId, storeId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        message: '체크를 찾을 수 없습니다',
        code: 'CHECK_NOT_FOUND'
      });
    }

    const check = checkResult.rows[0];

    // 합계 계산
    const finalTotal = await calcCheckTotal(client, checkId);
    const paymentStatus = await getPaymentStatus(client, checkId);

    // 주문 라인 수
    const lineCountResult = await client.query(`
      SELECT COUNT(*) as line_count
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      WHERE o.check_id = $1
    `, [checkId]);

    res.json({
      check_id: check.id,
      store_id: check.store_id,
      table_number: check.table_number,
      user_id: check.user_id,
      guest_phone: check.guest_phone,
      status: check.status,
      channel: check.channel,
      source: check.source,
      created_at: check.created_at,
      final_total: finalTotal,
      line_count: parseInt(lineCountResult.rows[0].line_count),
      payment_status: paymentStatus
    });

  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
});

/**
 * [POST] /checks/:id/orders - 체크에 주문 추가
 */
router.post('/checks/:id/orders', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const checkId = parseInt(req.params.id);
    const { storeId } = req;
    const { items = [], notes = '' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: '주문 아이템이 필요합니다',
        code: 'MISSING_ORDER_ITEMS'
      });
    }

    await client.query('BEGIN');

    // 체크 존재 확인
    const checkResult = await client.query(`
      SELECT id, status FROM checks 
      WHERE id = $1 AND store_id = $2
    `, [checkId, storeId]);

    if (checkResult.rows.length === 0) {
      throw new Error('체크를 찾을 수 없습니다');
    }

    if (checkResult.rows[0].status === 'closed') {
      throw new Error('이미 종료된 체크입니다');
    }

    // 주문 생성
    const orderResult = await client.query(`
      INSERT INTO orders (check_id, status, notes)
      VALUES ($1, 'pending', $2)
      RETURNING id, status, created_at
    `, [checkId, notes]);

    const order = orderResult.rows[0];
    const lineIds = [];

    // 주문 라인 생성
    for (const item of items) {
      const { menu_item_id, quantity = 1, unit_price, special_instructions } = item;

      const lineResult = await client.query(`
        INSERT INTO order_lines (order_id, menu_item_id, quantity, unit_price, special_instructions, status)
        VALUES ($1, $2, $3, $4, $5, 'ordered')
        RETURNING id
      `, [order.id, menu_item_id, quantity, unit_price, special_instructions]);

      lineIds.push(lineResult.rows[0].id);
    }

    // 이벤트 기록
    await client.query(`
      INSERT INTO order_events (check_id, order_id, event_type, details)
      VALUES ($1, $2, 'ORDER_PLACED', $3)
    `, [checkId, order.id, JSON.stringify({ line_count: items.length, notes })]);

    await client.query('COMMIT');

    console.log(`✅ 주문 추가: ${order.id} (체크 ${checkId}, 라인 ${lineIds.length}개)`);

    res.status(201).json({
      order_id: order.id,
      check_id: checkId,
      status: order.status,
      line_ids: lineIds,
      created_at: order.created_at
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * [POST] /checks/:id/payments - 결제 처리
 */
router.post('/checks/:id/payments', checkIdempotency, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const checkId = parseInt(req.params.id);
    const { storeId, idempotencyKey } = req;
    const { 
      amount, 
      payment_method = 'CASH', 
      reference = '', 
      ext_key = idempotencyKey 
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: '유효한 결제 금액이 필요합니다',
        code: 'INVALID_PAYMENT_AMOUNT'
      });
    }

    await client.query('BEGIN');

    // 체크 잠금 및 확인
    const checkResult = await client.query(`
      SELECT id, status, final_amount 
      FROM checks 
      WHERE id = $1 AND store_id = $2
      FOR UPDATE
    `, [checkId, storeId]);

    if (checkResult.rows.length === 0) {
      throw new Error('체크를 찾을 수 없습니다');
    }

    if (checkResult.rows[0].status === 'closed') {
      throw new Error('이미 종료된 체크입니다');
    }

    // 중복 결제 확인
    const duplicateResult = await client.query(`
      SELECT id FROM payments 
      WHERE ext_key = $1 AND check_id = $2
    `, [ext_key, checkId]);

    if (duplicateResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: '이미 처리된 결제입니다',
        code: 'DUPLICATE_PAYMENT',
        payment_id: duplicateResult.rows[0].id
      });
    }

    // 결제 생성
    const paymentResult = await client.query(`
      INSERT INTO payments (check_id, amount, payment_method, reference, ext_key, status)
      VALUES ($1, $2, $3, $4, $5, 'paid')
      RETURNING id, status, created_at
    `, [checkId, amount, payment_method, reference, ext_key]);

    const payment = paymentResult.rows[0];

    // 결제 상태 확인 후 체크 상태 업데이트
    const paymentStatus = await getPaymentStatus(client, checkId);
    
    if (paymentStatus.is_fully_paid) {
      await client.query(`
        UPDATE checks 
        SET status = 'closed', final_amount = $1, closed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [paymentStatus.total_amount, checkId]);
    }

    // 이벤트 기록
    await client.query(`
      INSERT INTO order_events (check_id, event_type, details)
      VALUES ($1, 'PAYMENT_PROCESSED', $2)
    `, [checkId, JSON.stringify({ 
      payment_id: payment.id, 
      amount, 
      payment_method,
      is_fully_paid: paymentStatus.is_fully_paid 
    })]);

    await client.query('COMMIT');

    console.log(`💳 결제 처리: ${payment.id} (체크 ${checkId}, ${amount}원)`);

    res.status(201).json({
      payment_id: payment.id,
      check_id: checkId,
      amount: amount,
      payment_method: payment_method,
      status: payment.status,
      payment_status: paymentStatus,
      created_at: payment.created_at
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
