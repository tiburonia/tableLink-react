const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const ActivityLogger = require('../utils/activity-logger');

/**
 * [POST] /checks/from-qr - QR 코드로 체크 생성/조회 (새 스키마)
 */
router.post('/checks/from-qr', async (req, res) => {
  const client = await pool.connect();

  try {
    const { qr_code, user_id, guest_phone } = req.body;

    console.log(`🎯 TLL QR 체크 생성 요청:`, { qr_code, user_id, guest_phone });

    if (!qr_code) {
      return res.status(400).json({
        success: false,
        error: 'QR 코드가 필요합니다'
      });
    }

    // 체크 제약조건 검증: user_id 또는 guest_phone 중 하나는 반드시 필요
    if (!user_id && !guest_phone) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID 또는 게스트 전화번호가 필요합니다'
      });
    }

    // NULL 값을 명시적으로 처리
    const finalUserId = user_id || null;
    const finalGuestPhone = guest_phone || null;

    console.log(`🔍 TLL 체크 생성 파라미터 검증:`, {
      user_id: finalUserId,
      guest_phone: finalGuestPhone,
      qr_code
    });

    await client.query('BEGIN');

    // QR 코드에서 테이블 번호 추출 (TABLE_1, TABLE_2 형태)
    const tableMatch = qr_code.match(/^TABLE_(\d+)$/);
    if (!tableMatch) {
      throw new Error('유효하지 않은 QR 코드 형식입니다');
    }

    const tableNumber = parseInt(tableMatch[1]);

    // 현재는 매장 ID를 1로 고정 (나중에 QR 코드에서 매장 정보도 포함하도록 개선 필요)
    const storeId = 1;

    // 해당 매장에 테이블이 존재하는지 확인
    const tableResult = await client.query(`
      SELECT table_number, is_occupied
      FROM store_tables
      WHERE store_id = $1 AND table_number = $2
    `, [storeId, tableNumber]);

    if (tableResult.rows.length === 0) {
      console.log(`📝 TLL - 매장 ${storeId}에 ${tableNumber}번 테이블 자동 생성`);

      // 테이블이 없으면 자동 생성
      await client.query(`
        INSERT INTO store_tables (store_id, table_number, table_name, seats)
        VALUES ($1, $2, $3, 4)
        ON CONFLICT (store_id, table_number) DO NOTHING
      `, [storeId, tableNumber, `${tableNumber}번`]);

      console.log(`✅ TLL - ${tableNumber}번 테이블 생성 완료`);
    }

    const qrData = {
      store_id: storeId,
      table_number: tableNumber,
      is_active: true
    };

    // 기존 활성 체크 확인
    const existingCheckResult = await client.query(`
      SELECT id, status, customer_name
      FROM checks
      WHERE store_id = $1 AND table_number = $2 AND status = 'open'
      ORDER BY opened_at DESC
      LIMIT 1
    `, [qrData.store_id, qrData.table_number]);

    let checkId;

    if (existingCheckResult.rows.length > 0) {
      // 기존 체크 사용
      checkId = existingCheckResult.rows[0].id;
      console.log(`✅ TLL 기존 체크 사용: ${checkId} (테이블 ${qrData.table_number})`);
    } else {
      // 새 체크 생성
      const newCheckResult = await client.query(`
        INSERT INTO checks (
          store_id, table_number, user_id, guest_phone, customer_name,
          status, source_system, opened_at
        )
        VALUES ($1, $2, $3, $4, $5, 'open', 'TLL', CURRENT_TIMESTAMP)
        RETURNING id, opened_at
      `, [
        qrData.store_id,
        qrData.table_number,
        finalUserId,
        finalGuestPhone,
        finalUserId ? null : '게스트'
      ]);

      checkId = newCheckResult.rows[0].id;

      // 테이블 점유 처리
      await client.query(`
        UPDATE store_tables
        SET is_occupied = true,
            occupied_since = CURRENT_TIMESTAMP,
            auto_release_source = 'TLL'
        WHERE store_id = $1 AND table_number = $2
      `, [qrData.store_id, qrData.table_number]);

      console.log(`✅ TLL 새 체크 생성: ${checkId} (테이블 ${qrData.table_number})`);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      check_id: checkId,
      store_id: qrData.store_id,
      table_number: qrData.table_number
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL QR 체크 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'TLL QR 체크 생성 실패'
    });
  } finally {
    client.release();
  }
});

/**
 * [POST] /orders - TLL 주문 생성 (새 스키마)
 */
router.post('/orders', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      check_id,
      items,
      payment_method = 'TOSS',
      toss_order_id = null,
      user_notes = null
    } = req.body;

    console.log(`🛒 TLL 주문 생성:`, {
      check_id,
      itemCount: items?.length,
      payment_method
    });

    if (!check_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '체크 ID와 주문 아이템이 필요합니다'
      });
    }

    await client.query('BEGIN');

    // 체크 존재 및 상태 확인
    const checkResult = await client.query(`
      SELECT id, store_id, table_number, status, user_id, guest_phone
      FROM checks
      WHERE id = $1
    `, [check_id]);

    if (checkResult.rows.length === 0) {
      throw new Error('체크를 찾을 수 없습니다');
    }

    const check = checkResult.rows[0];
    const { store_id } = check; // KDS 티켓 생성 시 store_id 필요

    if (check.status !== 'open') {
      throw new Error('이미 종료된 체크입니다');
    }

    // 주문 아이템들을 check_items에 추가
    const itemIds = [];
    let totalAmount = 0;

    for (const item of items) {
      const { menu_name, unit_price, quantity, options = {}, notes = '' } = item;

      if (!menu_name || !unit_price || !quantity) {
        throw new Error(`주문 아이템에 필수 정보가 누락되었습니다: ${JSON.stringify(item)}`);
      }

      const itemResult = await client.query(`
        INSERT INTO check_items (
          check_id, menu_name, unit_price, quantity,
          options, kitchen_notes, status, ordered_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'ordered', CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        check_id,
        menu_name,
        parseFloat(unit_price),
        parseInt(quantity),
        JSON.stringify(options),
        notes
      ]);

      itemIds.push(itemResult.rows[0].id);
      totalAmount += parseFloat(unit_price) * parseInt(quantity);

      console.log(`  📦 TLL 아이템 추가: ${menu_name} x ${quantity} (₩${unit_price})`);
    }

    // 체크 총액 업데이트
    await client.query(`
      UPDATE checks
      SET
        subtotal_amount = (
          SELECT COALESCE(SUM(unit_price * quantity), 0)
          FROM check_items
          WHERE check_id = $1 AND status != 'canceled'
        ),
        final_amount = (
          SELECT COALESCE(SUM(unit_price * quantity), 0)
          FROM check_items
          WHERE check_id = $1 AND status != 'canceled'
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [check_id]);

    // 결제 방법이 지정된 경우에만 결제 대기 상태 생성
    if (payment_method && payment_method !== 'LATER') {
      await client.query(`
        INSERT INTO payments (
          check_id, method, amount, status,
          payment_data, requested_at
        )
        VALUES ($1, $2, $3, 'pending', $4, CURRENT_TIMESTAMP)
      `, [
        check_id,
        payment_method,
        totalAmount,
        JSON.stringify({
          toss_order_id,
          user_notes,
          created_via: 'TLL'
        })
      ]);
    }

    // 활동 로그 생성
    try {
      await ActivityLogger.logOrderCreated(
        check.user_id,
        check.guest_phone,
        check.store_id,
        check_id,
        { items, totalAmount, source: 'TLL' }
      );
    } catch (logError) {
      console.warn('⚠️ 활동 로그 생성 실패:', logError.message);
    }

    // KDS 티켓 자동 생성
    try {
      const { createKDSTicketsForOrder } = require('./kds');
      const kdsResult = await createKDSTicketsForOrder(check_id, store_id, 'TLL');
      console.log('✅ KDS 티켓 자동 생성 완료:', kdsResult);
    } catch (kdsError) {
      console.error('⚠️ KDS 티켓 생성 실패 (주문은 정상 처리):', kdsError.message);
      // KDS 티켓 생성 실패해도 주문은 정상 진행
    }

    await client.query('COMMIT');

    console.log(`✅ TLL 주문 생성 완료: 체크 ${check_id}, ${items.length}개 아이템, 총액 ₩${totalAmount.toLocaleString()}`);

    res.status(201).json({
      success: true,
      check_id: check_id,
      item_ids: itemIds,
      total_amount: totalAmount,
      payment_required: payment_method === 'TOSS',
      message: 'TLL 주문이 생성되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL 주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'TLL 주문 생성 실패'
    });
  } finally {
    client.release();
  }
});

/**
 * [POST] /payments/confirm - TLL 결제 확인 처리 (토스페이먼츠)
 */
router.post('/payments/confirm', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      check_id,
      payment_key,
      order_id,
      amount
    } = req.body;

    console.log(`💳 TLL 결제 확인:`, { check_id, order_id, amount });

    if (!check_id || !payment_key || !order_id || !amount) {
      return res.status(400).json({
        success: false,
        error: '결제 확인에 필요한 정보가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // 체크 존재 및 상태 확인
    const checkResult = await client.query(`
      SELECT
        c.id,
        c.store_id,
        c.table_number,
        c.status,
        c.final_amount,
        c.user_id,
        c.guest_phone
      FROM checks c
      WHERE c.id = $1
    `, [check_id]);

    if (checkResult.rows.length === 0) {
      throw new Error('체크를 찾을 수 없습니다');
    }

    const check = checkResult.rows[0];

    if (check.status !== 'open') {
      throw new Error('이미 종료된 체크입니다');
    }

    // 결제 금액 검증
    const expectedAmount = check.final_amount;
    if (Math.abs(expectedAmount - amount) > 1) {
      throw new Error(`결제 금액 불일치: 예상 ₩${expectedAmount}, 실제 ₩${amount}`);
    }

    // 대기 중인 결제를 완료 상태로 변경 (표준 필드 포함)
    const paymentUpdateResult = await client.query(`
      UPDATE payments
      SET
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        pg_transaction_id = $2,
        payment_data = payment_data || $3
      WHERE check_id = $1 AND status = 'pending'
      RETURNING id
    `, [
      check_id,
      payment_key, // PG 거래 ID로 사용
      JSON.stringify({
        payment_key,
        toss_order_id: order_id,
        confirmed_at: new Date().toISOString()
      })
    ]);

    if (paymentUpdateResult.rows.length === 0) {
      // 대기 중인 결제가 없으면 새로 생성
      await client.query(`
        INSERT INTO payments (
          check_id, method, amount, status,
          requested_at, payment_data
        )
        VALUES ($1, 'TOSS', $2, 'completed', CURRENT_TIMESTAMP, $3)
      `, [
        check_id,
        amount,
        JSON.stringify({ payment_key, toss_order_id: order_id })
      ]);
    }

    // 체크 종료
    await client.query(`
      UPDATE checks
      SET
        status = 'closed',
        closed_at = CURRENT_TIMESTAMP,
        final_amount = $2
      WHERE id = $1
    `, [check_id, amount]);

    // 모든 아이템을 주문 상태로 변경 (주방에서 조리 시작)
    await client.query(`
      UPDATE check_items
      SET status = 'ordered'
      WHERE check_id = $1 AND status = 'ordered'
    `, [check_id]);

    // 테이블 해제 (결제 완료 시)
    await client.query(`
      UPDATE store_tables
      SET is_occupied = false,
          occupied_since = NULL,
          auto_release_source = NULL
      WHERE store_id = $1 AND table_number = $2
    `, [check.store_id, check.table_number]);

    // TLL 회원 포인트 적립
    if (check.user_id) {
      const points = Math.floor(amount * 0.01); // 1% 적립
      if (points > 0) {
        await client.query(`
          UPDATE users
          SET point = COALESCE(point, 0) + $1
          WHERE id = $2
        `, [points, check.user_id]);

        console.log(`🎉 TLL 회원 ${check.user_id} 포인트 적립: ${points}원`);
      }
    }

    // 게스트 방문 기록 업데이트
    if (check.guest_phone && !check.user_id) {
      await client.query(`
        INSERT INTO guests (phone, total_visits, last_visit_date)
        VALUES ($1, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (phone)
        DO UPDATE SET
          total_visits = guests.total_visits + 1,
          last_visit_date = CURRENT_TIMESTAMP
      `, [check.guest_phone]);
    }

    // 활동 로그 생성
    try {
      const finalPaymentId = paymentUpdateResult.rows[0]?.id;
      await ActivityLogger.logPaymentCompleted(
        check.user_id,
        check.guest_phone,
        check.store_id,
        check_id,
        finalPaymentId,
        { amount, method: 'TOSS', pgTransactionId: payment_key }
      );
    } catch (logError) {
      console.warn('⚠️ 결제 활동 로그 생성 실패:', logError.message);
    }

    await client.query('COMMIT');

    console.log(`✅ TLL 결제 완료: 체크 ${check_id}, 금액 ₩${amount.toLocaleString()}`);

    res.json({
      success: true,
      check_id: check_id,
      payment_amount: amount,
      store_id: check.store_id,
      table_number: check.table_number,
      message: 'TLL 결제가 완료되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL 결제 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'TLL 결제 확인 실패'
    });
  } finally {
    client.release();
  }
});

/**
 * [GET] /checks/:checkId - TLL 체크 상태 조회
 */
router.get('/checks/:checkId', async (req, res) => {
  try {
    const { checkId } = req.params;

    console.log(`📋 TLL 체크 조회: ${checkId}`);

    const result = await pool.query(`
      SELECT
        c.id as check_id,
        c.store_id,
        c.table_number,
        c.status,
        c.final_amount,
        c.subtotal_amount,
        c.opened_at,
        c.closed_at,
        c.user_id,
        c.guest_phone,
        c.customer_name,
        s.name as store_name,
        s.category as store_category,
        COUNT(ci.id) as item_count,
        array_agg(
          json_build_object(
            'id', ci.id,
            'menuName', ci.menu_name,
            'unitPrice', ci.unit_price,
            'quantity', ci.quantity,
            'status', ci.status,
            'orderedAt', ci.ordered_at,
            'options', ci.options,
            'notes', ci.kitchen_notes
          ) ORDER BY ci.ordered_at
        ) FILTER (WHERE ci.id IS NOT NULL) as items
      FROM checks c
      JOIN stores s ON c.store_id = s.id
      LEFT JOIN check_items ci ON c.id = ci.check_id AND ci.status != 'canceled'
      WHERE c.id = $1
      GROUP BY c.id, s.name, s.category
    `, [checkId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '체크를 찾을 수 없습니다'
      });
    }

    const checkData = result.rows[0];

    res.json({
      success: true,
      check: {
        id: checkData.check_id,
        storeId: checkData.store_id,
        storeName: checkData.store_name,
        storeCategory: checkData.store_category,
        tableNumber: checkData.table_number,
        status: checkData.status,
        totalAmount: checkData.final_amount || 0,
        subtotalAmount: checkData.subtotal_amount || 0,
        openedAt: checkData.opened_at,
        closedAt: checkData.closed_at,
        isGuest: !checkData.user_id,
        customerInfo: {
          userId: checkData.user_id,
          guestPhone: checkData.guest_phone,
          customerName: checkData.customer_name
        },
        items: checkData.items || [],
        itemCount: parseInt(checkData.item_count)
      }
    });

  } catch (error) {
    console.error('❌ TLL 체크 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 체크 조회 실패'
    });
  }
});

/**
 * [PUT] /check-items/:itemId - TLL 주문 아이템 수정/취소
 */
router.put('/check-items/:itemId', async (req, res) => {
  const client = await pool.connect();

  try {
    const { itemId } = req.params;
    const { action, quantity, notes } = req.body;

    console.log(`✏️ TLL 아이템 수정: ${itemId}, 액션: ${action}`);

    if (!action || !['cancel', 'updateQuantity', 'updateNotes'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 액션입니다'
      });
    }

    await client.query('BEGIN');

    // 아이템 확인
    const itemResult = await client.query(`
      SELECT
        ci.id,
        ci.status,
        ci.check_id,
        ci.menu_name,
        ci.quantity,
        c.status as check_status
      FROM check_items ci
      JOIN checks c ON ci.check_id = c.id
      WHERE ci.id = $1
    `, [itemId]);

    if (itemResult.rows.length === 0) {
      throw new Error('아이템을 찾을 수 없습니다');
    }

    const item = itemResult.rows[0];

    if (item.check_status !== 'open') {
      throw new Error('종료된 체크의 아이템은 수정할 수 없습니다');
    }

    if (action === 'cancel') {
      // 아이템 취소
      if (item.status === 'served') {
        throw new Error('이미 서빙된 아이템은 취소할 수 없습니다');
      }

      await client.query(`
        UPDATE check_items
        SET
          status = 'canceled',
          canceled_at = CURRENT_TIMESTAMP,
          kitchen_notes = COALESCE(kitchen_notes, '') || ' [TLL 취소]'
        WHERE id = $1
      `, [itemId]);

      console.log(`🗑️ TLL 아이템 취소: ${item.menu_name}`);

    } else if (action === 'updateQuantity' && quantity > 0) {
      // 수량 변경
      await client.query(`
        UPDATE check_items
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [quantity, itemId]);

      console.log(`🔢 TLL 아이템 수량 변경: ${item.menu_name} → ${quantity}개`);

    } else if (action === 'updateNotes') {
      // 주문 메모 변경
      await client.query(`
        UPDATE check_items
        SET kitchen_notes = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [notes, itemId]);

      console.log(`📝 TLL 아이템 메모 변경: ${item.menu_name}`);
    }

    // 체크 총액 재계산
    await client.query(`
      UPDATE checks
      SET
        subtotal_amount = (
          SELECT COALESCE(SUM(unit_price * quantity), 0)
          FROM check_items
          WHERE check_id = $1 AND status != 'canceled'
        ),
        final_amount = (
          SELECT COALESCE(SUM(unit_price * quantity), 0)
          FROM check_items
          WHERE check_id = $1 AND status != 'canceled'
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [item.check_id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      item_id: parseInt(itemId),
      action: action,
      check_id: item.check_id,
      message: 'TLL 아이템 수정이 완료되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL 아이템 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'TLL 아이템 수정 실패'
    });
  } finally {
    client.release();
  }
});

module.exports = router;