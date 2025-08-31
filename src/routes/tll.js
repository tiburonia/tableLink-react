
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/pool');
const { calcCheckTotal, sumPayments } = require('../utils/total');
const { storeAuth, checkIdempotency } = require('../mw/auth');

// 모든 라우트에 매장 인증 적용
router.use(storeAuth);

/**
 * [POST] /checks/from-qr - QR 코드로 체크 생성/조회
 */
router.post('/checks/from-qr', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { qr_code, user_id, guest_phone } = req.body;
    const { storeId } = req;

    if (!qr_code) {
      return res.status(400).json({
        message: 'QR 코드가 필요합니다',
        code: 'MISSING_QR_CODE'
      });
    }

    await client.query('BEGIN');

    // QR 코드로 매장 및 테이블 정보 조회
    const qrResult = await client.query(`
      SELECT store_id, table_number, is_active
      FROM qr_codes
      WHERE code = $1
    `, [qr_code]);

    if (qrResult.rows.length === 0) {
      throw new Error('유효하지 않은 QR 코드입니다');
    }

    const qrData = qrResult.rows[0];

    if (!qrData.is_active) {
      throw new Error('비활성화된 QR 코드입니다');
    }

    if (qrData.store_id !== storeId) {
      return res.status(403).json({
        message: '접근 권한이 없습니다',
        code: 'STORE_SCOPE_VIOLATION'
      });
    }

    // 기존 open 체크 확인
    const existingCheckResult = await client.query(`
      SELECT id, status
      FROM checks
      WHERE store_id = $1 AND table_number = $2 AND status = 'open'
      ORDER BY created_at DESC
      LIMIT 1
    `, [qrData.store_id, qrData.table_number]);

    let checkId;

    if (existingCheckResult.rows.length > 0) {
      // 기존 체크 사용
      checkId = existingCheckResult.rows[0].id;
      console.log(`✅ 기존 체크 사용: ${checkId} (테이블 ${qrData.table_number})`);
    } else {
      // 새 체크 생성
      const newCheckResult = await client.query(`
        INSERT INTO checks (
          store_id, table_number, user_id, guest_phone, 
          source, channel, status
        )
        VALUES ($1, $2, $3, $4, 'TLL', 'DINE_IN', 'open')
        RETURNING id, created_at
      `, [qrData.store_id, qrData.table_number, user_id, guest_phone]);

      checkId = newCheckResult.rows[0].id;

      // 이벤트 기록
      await client.query(`
        INSERT INTO order_events (check_id, event_type, details)
        VALUES ($1, 'CHECK_CREATED', $2)
      `, [checkId, JSON.stringify({ 
        source: 'TLL', 
        channel: 'DINE_IN', 
        qr_code, 
        table_number: qrData.table_number 
      })]);

      console.log(`✅ 새 TLL 체크 생성: ${checkId} (테이블 ${qrData.table_number})`);
    }

    await client.query('COMMIT');

    res.status(201).json({
      check_id: checkId,
      store_id: qrData.store_id,
      table_number: qrData.table_number
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * [POST] /orders - TLL 주문 생성
 */
router.post('/orders', checkIdempotency, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { check_id, ext_key } = req.body;
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

    // TLL 주문 생성
    const orderResult = await client.query(`
      INSERT INTO orders (check_id, status, source, ext_key)
      VALUES ($1, 'confirmed', 'TLL', $2)
      RETURNING id, status, created_at
    `, [check_id, finalExtKey]);

    const order = orderResult.rows[0];

    // 이벤트 기록
    await client.query(`
      INSERT INTO order_events (check_id, order_id, event_type, details)
      VALUES ($1, $2, 'ORDER_CREATED', $3)
    `, [check_id, order.id, JSON.stringify({ source: 'TLL', ext_key: finalExtKey })]);

    await client.query('COMMIT');

    console.log(`✅ TLL 주문 생성: ${order.id} (체크 ${check_id})`);

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
 * [POST] /order-lines/bulk - TLL 주문 라인 대량 생성
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

    // 각 아이템에 대해 가격 검증 및 라인 생성
    for (const item of items) {
      let { 
        menu_id, 
        menu_name, 
        unit_price, 
        count = 1, 
        cook_station, 
        notes, 
        options = [] 
      } = item;

      // 메뉴 ID가 있으면 서버에서 가격 검증
      if (menu_id) {
        const menuResult = await client.query(`
          SELECT name, price, cook_station
          FROM menu_items
          WHERE id = $1 AND store_id = $2
        `, [menu_id, storeId]);

        if (menuResult.rows.length > 0) {
          const menuData = menuResult.rows[0];
          // 서버 가격으로 대체 (가격 신뢰성 보장)
          unit_price = menuData.price;
          menu_name = menu_name || menuData.name;
          cook_station = cook_station || menuData.cook_station;
          
          console.log(`🔍 TLL 가격 검증: ${menu_name} - 클라이언트: ₩${item.unit_price}, 서버: ₩${unit_price}`);
        }
      }

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

    console.log(`✅ TLL 주문 라인 대량 생성: ${createdCount}개 (주문 ${order_id})`);

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
 * [DELETE] /order-lines/:id - TLL 주문 라인 취소 (조리 전만)
 */
router.delete('/order-lines/:id', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const lineId = parseInt(req.params.id);
    const { storeId } = req;

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

    // queued 상태에서만 삭제 허용
    if (line.status !== 'queued') {
      return res.status(409).json({
        message: '조리가 시작된 주문은 취소할 수 없습니다',
        code: 'CANNOT_CANCEL_COOKING'
      });
    }

    // 라인 삭제 (실제로는 canceled 상태로 변경)
    await client.query(`
      UPDATE order_lines 
      SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [lineId]);

    // 이벤트 기록
    await client.query(`
      INSERT INTO order_events (check_id, order_id, line_id, event_type, details)
      SELECT c.id, o.id, $1, 'LINE_CANCELED', $2
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE ol.id = $1
    `, [lineId, JSON.stringify({ reason: 'TLL_CUSTOMER_CANCEL', old_status: 'queued' })]);

    await client.query('COMMIT');

    console.log(`✅ TLL 라인 취소: ${lineId} (조리 전 취소)`);

    res.json({
      line_id: lineId,
      status: 'canceled',
      message: '주문이 취소되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
