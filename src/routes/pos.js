
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/pool');
const { calcCheckTotal, sumPayments, getPaymentStatus } = require('../utils/total');
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
      status: check.status
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

    // 체크 존재 및 매장 스코프 확인
    const checkResult = await client.query(`
      SELECT id, store_id, status 
      FROM checks 
      WHERE id = $1
    `, [checkId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        message: '체크를 찾을 수 없습니다',
        code: 'CHECK_NOT_FOUND'
      });
    }

    if (checkResult.rows[0].store_id !== storeId) {
      return res.status(403).json({
        message: '접근 권한이 없습니다',
        code: 'STORE_SCOPE_VIOLATION'
      });
    }

    // 합계 계산
    const finalTotal = await calcCheckTotal(client, checkId);
    const paidTotal = await sumPayments(client, checkId);

    // 라인 상태별 카운트
    const lineStatsResult = await client.query(`
      SELECT status, COUNT(*) as count
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      WHERE o.check_id = $1
      GROUP BY status
    `, [checkId]);

    const lines = {
      queued: 0,
      cooking: 0, 
      ready: 0,
      served: 0,
      canceled: 0
    };

    lineStatsResult.rows.forEach(row => {
      lines[row.status] = parseInt(row.count);
    });

    // 조정 내역
    const adjustmentsResult = await client.query(`
      SELECT id, adj_type, value_type, value, created_at
      FROM adjustments
      WHERE check_id = $1
      ORDER BY created_at DESC
    `, [checkId]);

    // 결제 내역
    const paymentsResult = await client.query(`
      SELECT id, amount, status, payment_method, created_at
      FROM payments
      WHERE check_id = $1
      ORDER BY created_at DESC
    `, [checkId]);

    const payments = paymentsResult.rows.map(p => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      method: p.payment_method,
      paid_at: p.created_at
    }));

    res.json({
      check_id: checkId,
      final_total: finalTotal,
      paid_total: paidTotal,
      due: Math.max(0, finalTotal - paidTotal),
      lines: lines,
      adjustments: adjustmentsResult.rows,
      payments: payments
    });

  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
});

/**
 * [POST] /orders - 주문 생성
 */
router.post('/orders', checkIdempotency, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { check_id, source = 'POS', ext_key } = req.body;
    const { storeId, idempotencyKey } = req;
    const finalExtKey = ext_key || idempotencyKey;

    await client.query('BEGIN');

    // 체크 존재 및 매장 스코프 확인
    const checkResult = await client.query(`
      SELECT id, store_id, status
      FROM checks 
      WHERE id = $1
    `, [check_id]);

    if (checkResult.rows.length === 0) {
      throw new Error('체크를 찾을 수 없습니다');
    }

    if (checkResult.rows[0].store_id !== storeId) {
      return res.status(403).json({
        message: '접근 권한이 없습니다',
        code: 'STORE_SCOPE_VIOLATION'
      });
    }

    if (checkResult.rows[0].status === 'closed') {
      throw new Error('이미 종료된 체크입니다');
    }

    // 중복 주문 확인
    if (finalExtKey) {
      const duplicateResult = await client.query(`
        SELECT id FROM orders 
        WHERE ext_key = $1 AND check_id = $2
      `, [finalExtKey, check_id]);

      if (duplicateResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(201).json({
          order_id: duplicateResult.rows[0].id
        });
      }
    }

    // 주문 생성
    const orderResult = await client.query(`
      INSERT INTO orders (check_id, status, source, ext_key)
      VALUES ($1, 'confirmed', $2, $3)
      RETURNING id, status, created_at
    `, [check_id, source, finalExtKey]);

    const order = orderResult.rows[0];

    // 이벤트 기록
    await client.query(`
      INSERT INTO order_events (check_id, order_id, event_type, details)
      VALUES ($1, $2, 'ORDER_CREATED', $3)
    `, [check_id, order.id, JSON.stringify({ source, ext_key: finalExtKey })]);

    await client.query('COMMIT');

    console.log(`✅ 주문 생성: ${order.id} (체크 ${check_id})`);

    res.status(201).json({
      order_id: order.id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * [POST] /order-lines/bulk - 주문 라인 대량 생성
 */
router.post('/order-lines/bulk', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { order_id, items = [] } = req.body;
    const { storeId } = req;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: '주문 아이템이 필요합니다',
        code: 'MISSING_ORDER_ITEMS'
      });
    }

    await client.query('BEGIN');

    // 주문 존재 및 매장 스코프 확인
    const orderResult = await client.query(`
      SELECT o.id, o.check_id, c.store_id
      FROM orders o
      JOIN checks c ON o.check_id = c.id
      WHERE o.id = $1
    `, [order_id]);

    if (orderResult.rows.length === 0) {
      throw new Error('주문을 찾을 수 없습니다');
    }

    if (orderResult.rows[0].store_id !== storeId) {
      return res.status(403).json({
        message: '접근 권한이 없습니다',
        code: 'STORE_SCOPE_VIOLATION'
      });
    }

    const lineIds = [];
    let createdCount = 0;

    // 각 아이템에 대해 count만큼 라인 생성
    for (const item of items) {
      const { 
        menu_id, 
        menu_name, 
        unit_price, 
        count = 1, 
        cook_station, 
        notes, 
        options = [] 
      } = item;

      // count만큼 개별 라인 생성
      for (let i = 0; i < count; i++) {
        const lineResult = await client.query(`
          INSERT INTO order_lines (
            order_id, menu_item_id, menu_name, unit_price, 
            quantity, cook_station, special_instructions, status
          )
          VALUES ($1, $2, $3, $4, 1, $5, $6, 'queued')
          RETURNING id
        `, [order_id, menu_id, menu_name, unit_price, cook_station, notes]);

        const lineId = lineResult.rows[0].id;
        lineIds.push(lineId);
        createdCount++;

        // 옵션 추가
        for (const option of options) {
          await client.query(`
            INSERT INTO line_options (line_id, option_id, option_name, price_delta)
            VALUES ($1, $2, $3, $4)
          `, [lineId, option.option_id, option.name, option.price_delta || 0]);
        }
      }
    }

    await client.query('COMMIT');

    console.log(`✅ 주문 라인 대량 생성: ${createdCount}개 (주문 ${order_id})`);

    res.status(201).json({
      line_ids: lineIds,
      created: createdCount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * [PATCH] /order-lines/:id - 주문 라인 상태 변경
 */
router.patch('/order-lines/:id', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const lineId = parseInt(req.params.id);
    const { status, notes } = req.body;
    const { storeId } = req;

    if (!['queued', 'cooking', 'ready', 'served', 'canceled'].includes(status)) {
      return res.status(400).json({
        message: '유효하지 않은 상태입니다',
        code: 'INVALID_STATUS'
      });
    }

    await client.query('BEGIN');

    // 라인 존재 및 매장 스코프 확인
    const lineResult = await client.query(`
      SELECT ol.id, ol.status, ol.order_id, c.store_id
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE ol.id = $1
    `, [lineId]);

    if (lineResult.rows.length === 0) {
      throw new Error('주문 라인을 찾을 수 없습니다');
    }

    const line = lineResult.rows[0];

    if (line.store_id !== storeId) {
      return res.status(403).json({
        message: '접근 권한이 없습니다',
        code: 'STORE_SCOPE_VIOLATION'
      });
    }

    // 이미 served된 항목은 canceled로 변경 불가
    if (line.status === 'served' && status === 'canceled') {
      return res.status(409).json({
        message: '이미 서빙된 항목은 취소할 수 없습니다',
        code: 'CANNOT_CANCEL_SERVED'
      });
    }

    // 상태 업데이트
    await client.query(`
      UPDATE order_lines 
      SET status = $1, special_instructions = COALESCE($2, special_instructions)
      WHERE id = $3
    `, [status, notes, lineId]);

    // 이벤트 기록
    const eventType = status === 'canceled' ? 'LINE_CANCELED' : 'LINE_STATUS_CHANGED';
    await client.query(`
      INSERT INTO order_events (check_id, order_id, line_id, event_type, details)
      SELECT c.id, o.id, $1, $2, $3
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE ol.id = $1
    `, [lineId, eventType, JSON.stringify({ old_status: line.status, new_status: status, notes })]);

    await client.query('COMMIT');

    console.log(`✅ 라인 상태 변경: ${lineId} (${line.status} → ${status})`);

    res.json({
      line_id: lineId,
      status: status
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * [POST] /adjustments - 조정 추가
 */
router.post('/adjustments', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { scope, check_id, line_id, adj_type, value_type, value } = req.body;
    const { storeId } = req;

    if (!['CHECK', 'LINE'].includes(scope)) {
      return res.status(400).json({
        message: '유효하지 않은 스코프입니다',
        code: 'INVALID_SCOPE'
      });
    }

    if (!['amount', 'percent'].includes(value_type)) {
      return res.status(400).json({
        message: '유효하지 않은 값 타입입니다',
        code: 'INVALID_VALUE_TYPE'
      });
    }

    await client.query('BEGIN');

    // 체크 존재 및 매장 스코프 확인
    const checkResult = await client.query(`
      SELECT id, store_id 
      FROM checks 
      WHERE id = $1
    `, [check_id]);

    if (checkResult.rows.length === 0) {
      throw new Error('체크를 찾을 수 없습니다');
    }

    if (checkResult.rows[0].store_id !== storeId) {
      return res.status(403).json({
        message: '접근 권한이 없습니다',
        code: 'STORE_SCOPE_VIOLATION'
      });
    }

    // LINE 스코프인 경우 라인 존재 확인
    if (scope === 'LINE' && line_id) {
      const lineResult = await client.query(`
        SELECT ol.id
        FROM order_lines ol
        JOIN orders o ON ol.order_id = o.id
        WHERE ol.id = $1 AND o.check_id = $2
      `, [line_id, check_id]);

      if (lineResult.rows.length === 0) {
        throw new Error('해당 체크에 속한 라인을 찾을 수 없습니다');
      }
    }

    // 조정 생성
    const adjustmentResult = await client.query(`
      INSERT INTO adjustments (check_id, line_id, adj_scope, adj_type, value_type, value)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `, [check_id, scope === 'LINE' ? line_id : null, scope, adj_type, value_type, value]);

    const adjustment = adjustmentResult.rows[0];

    await client.query('COMMIT');

    console.log(`✅ 조정 추가: ${adjustment.id} (체크 ${check_id}, ${scope})`);

    res.status(201).json({
      adjustment_id: adjustment.id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
