
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * [POST] /checks/from-qr - QR 코드로 주문 세션 생성/조회 (현재 스키마 기반)
 */
router.post('/checks/from-qr', async (req, res) => {
  const client = await pool.connect();

  try {
    const { qr_code, user_id, guest_phone } = req.body;

    console.log(`🎯 TLL QR 주문 세션 생성 요청:`, { qr_code, user_id, guest_phone });

    if (!qr_code) {
      return res.status(400).json({
        success: false,
        error: 'QR 코드가 필요합니다'
      });
    }

    // 사용자 ID 또는 게스트 전화번호 중 하나는 반드시 필요
    if (!user_id && !guest_phone) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID 또는 게스트 전화번호가 필요합니다'
      });
    }

    // 사용자 ID 검증 (현재 스키마의 users.user_id는 문자열)
    if (user_id) {
      const userExists = await client.query(`
        SELECT user_id FROM users WHERE user_id = $1
      `, [user_id]);

      if (userExists.rows.length === 0) {
        throw new Error('존재하지 않는 사용자입니다');
      }
    }

    await client.query('BEGIN');

    // QR 코드에서 테이블 번호 추출 (TABLE_1, TABLE_2 형태)
    const tableMatch = qr_code.match(/^TABLE_(\d+)$/);
    if (!tableMatch) {
      throw new Error('유효하지 않은 QR 코드 형식입니다');
    }

    const tableNumber = parseInt(tableMatch[1]);
    const storeId = 9; // 현재는 매장 ID를 9로 고정 (본격 우동)

    // 게스트 처리
    let guestId = null;
    if (guest_phone) {
      // 기존 게스트 확인
      const existingGuest = await client.query(`
        SELECT id FROM guest WHERE phone = $1
      `, [guest_phone]);

      if (existingGuest.rows.length > 0) {
        guestId = existingGuest.rows[0].id;
      } else {
        // 새 게스트 생성
        const newGuest = await client.query(`
          INSERT INTO guest (phone) VALUES ($1) RETURNING id
        `, [guest_phone]);
        guestId = newGuest.rows[0].id;
      }
    }

    // 기존 활성 주문 확인 (같은 매장, 같은 사용자/게스트)
    const existingOrderResult = await client.query(`
      SELECT id, status
      FROM orders
      WHERE store_id = $1 
        AND status = 'OPEN'
        AND (
          (user_id = $2 AND $2 IS NOT NULL) OR 
          (guest_id = $3 AND $3 IS NOT NULL)
        )
      ORDER BY created_at DESC
      LIMIT 1
    `, [storeId, user_id || null, guestId]);

    let orderId;

    if (existingOrderResult.rows.length > 0) {
      // 기존 주문 사용
      orderId = existingOrderResult.rows[0].id;
      console.log(`🔄 TLL 기존 주문 ${orderId} 사용 (테이블 ${tableNumber})`);
    } else {
      // 새 주문 생성 (현재 스키마에 맞게)
      const newOrderResult = await client.query(`
        INSERT INTO orders (
          store_id, user_id, guest_id, source, status, payment_status, table_number, table_num
        ) VALUES ($1, $2, $3, 'TLL', 'OPEN', 'UNPAID', $4, $5)
        RETURNING id
      `, [storeId, user_id || null, guestId, tableNumber, tableNumber]);

      orderId = newOrderResult.rows[0].id;
      console.log(`✅ TLL 새 주문 ${orderId} 생성 완료 (테이블 ${tableNumber})`);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      check_id: orderId, // 호환성을 위해 check_id로 반환
      order_id: orderId,
      store_id: storeId,
      table_number: tableNumber
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL QR 주문 세션 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'TLL QR 주문 세션 생성 실패'
    });
  } finally {
    client.release();
  }
});

/**
 * [POST] /orders - TLL 주문 생성 (현재 스키마 기반)
 */
router.post('/orders', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      check_id, // 실제로는 order_id
      items,
      payment_method = 'TOSS',
      toss_order_id = null,
      user_notes = null
    } = req.body;

    console.log(`🛒 TLL 주문 생성:`, {
      order_id: check_id,
      itemCount: items?.length,
      payment_method
    });

    if (!check_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '주문 ID와 주문 아이템이 필요합니다'
      });
    }

    await client.query('BEGIN');

    // 주문 존재 및 상태 확인
    const orderResult = await client.query(`
      SELECT id, store_id, status, user_id, guest_id
      FROM orders
      WHERE id = $1
    `, [check_id]);

    if (orderResult.rows.length === 0) {
      throw new Error('주문을 찾을 수 없습니다');
    }

    const order = orderResult.rows[0];

    if (order.status !== 'OPEN') {
      throw new Error('이미 종료된 주문입니다');
    }

    // 주문 티켓 생성
    const ticketResult = await client.query(`
      INSERT INTO order_tickets (order_id, store_id, batch_no, status, payment_type, table_num)
      VALUES ($1, $2, 1, 'PENDING', 'PREPAID', $3)
      RETURNING id
    `, [check_id, store_id, tableNumber]);

    const ticketId = ticketResult.rows[0].id;

    // 주문 아이템들 추가
    const itemIds = [];
    let totalAmount = 0;

    for (const item of items) {
      const { menu_name, unit_price, quantity, options = {}, notes = '', cook_station = 'KITCHEN' } = item;

      if (!menu_name || !unit_price || !quantity) {
        throw new Error(`주문 아이템에 필수 정보가 누락되었습니다: ${JSON.stringify(item)}`);
      }

      // cook_station 정보를 포함하여 order_items에 삽입
      const itemResult = await client.query(`
        INSERT INTO order_items (
          ticket_id, store_id, menu_id, menu_name, quantity, unit_price, 
          total_price, item_status, cook_station
        )
        VALUES ($1, $2, 1, $3, $4, $5, $6, 'PENDING', $7)
        RETURNING id
      `, [
        ticketId,
        store_id,
        menu_name,
        parseInt(quantity),
        parseFloat(unit_price),
        parseFloat(unit_price) * parseInt(quantity),
        cook_station
      ]);

      itemIds.push(itemResult.rows[0].id);
      totalAmount += parseFloat(unit_price) * parseInt(quantity);

      console.log(`  📦 TLL 아이템 추가: ${menu_name} x ${quantity} (₩${unit_price})`);
    }

    // 주문 총액 업데이트
    await client.query(`
      UPDATE orders
      SET " total_price" = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [totalAmount, check_id]);

    // 결제 방법이 지정된 경우에만 결제 대기 상태 생성
    if (payment_method && payment_method !== 'LATER') {
      await client.query(`
        INSERT INTO payments (
          order_id, ticket_id, method, amount, status, transaction_id
        )
        VALUES ($1, $2, $3, $4, 'PENDING', $5)
      `, [
        check_id,
        ticketId,
        payment_method,
        totalAmount,
        toss_order_id
      ]);
    }

    await client.query('COMMIT');

    console.log(`✅ TLL 주문 생성 완료: 주문 ${check_id}, ${items.length}개 아이템, 총액 ₩${totalAmount.toLocaleString()}`);

    res.status(201).json({
      success: true,
      check_id: check_id,
      order_id: check_id,
      ticket_id: ticketId,
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
 * [POST] /payments/confirm - TLL 결제 확인 처리 (현재 스키마 기반)
 */
router.post('/payments/confirm', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      check_id, // 실제로는 order_id
      payment_key,
      order_id,
      amount
    } = req.body;

    console.log(`💳 TLL 결제 확인:`, { order_id: check_id, toss_order_id: order_id, amount });

    if (!check_id || !payment_key || !order_id || !amount) {
      return res.status(400).json({
        success: false,
        error: '결제 확인에 필요한 정보가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // 주문 존재 및 상태 확인
    const orderResult = await client.query(`
      SELECT
        o.id,
        o.store_id,
        o.status,
        o." total_price" as total_amount,
        o.user_id,
        o.guest_id
      FROM orders o
      WHERE o.id = $1
    `, [check_id]);

    if (orderResult.rows.length === 0) {
      throw new Error('주문을 찾을 수 없습니다');
    }

    const order = orderResult.rows[0];

    if (order.status !== 'OPEN') {
      throw new Error('이미 종료된 주문입니다');
    }

    // 결제 금액 검증
    const expectedAmount = order.total_amount;
    if (Math.abs(expectedAmount - amount) > 1) {
      throw new Error(`결제 금액 불일치: 예상 ₩${expectedAmount}, 실제 ₩${amount}`);
    }

    // 대기 중인 결제를 완료 상태로 변경
    const paymentUpdateResult = await client.query(`
      UPDATE payments
      SET
        status = 'COMPLETED',
        paid_at = CURRENT_TIMESTAMP,
        transaction_id = $2,
        provider_response = $3
      WHERE order_id = $1 AND status = 'PENDING'
      RETURNING id
    `, [
      check_id,
      payment_key,
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
          order_id, method, amount, status,
          paid_at, transaction_id, provider_response
        )
        VALUES ($1, 'TOSS', $2, 'COMPLETED', CURRENT_TIMESTAMP, $3, $4)
      `, [
        check_id,
        amount,
        payment_key,
        JSON.stringify({ payment_key, toss_order_id: order_id })
      ]);
    }

    // 주문 종료
    await client.query(`
      UPDATE orders
      SET
        status = 'COMPLETED',
        payment_status = 'PAID',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [check_id]);

    await client.query('COMMIT');

    console.log(`✅ TLL 결제 완료: 주문 ${check_id}, 금액 ₩${amount.toLocaleString()}`);

    res.json({
      success: true,
      check_id: check_id,
      order_id: check_id,
      payment_amount: amount,
      store_id: order.store_id,
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
 * [GET] /checks/:checkId - TLL 주문 상태 조회 (현재 스키마 기반)
 */
router.get('/checks/:checkId', async (req, res) => {
  try {
    const { checkId } = req.params;

    console.log(`📋 TLL 주문 조회: ${checkId}`);

    const result = await pool.query(`
      SELECT
        o.id as order_id,
        o.store_id,
        o.status,
        o." total_price" as total_amount,
        o.created_at,
        o.updated_at,
        o.user_id,
        o.guest_id,
        si.name as store_name,
        si.category as store_category,
        COUNT(oi.id) as item_count,
        array_agg(
          json_build_object(
            'id', oi.id,
            'menuName', oi.menu_name,
            'unitPrice', oi.unit_price,
            'quantity', oi.quantity,
            'totalPrice', oi.total_price,
            'status', oi.item_status,
            'cookStation', oi.cook_station
          ) ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL) as items
      FROM orders o
      LEFT JOIN store_info si ON o.store_id = si.store_id
      LEFT JOIN order_tickets ot ON o.id = ot.order_id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE o.id = $1
      GROUP BY o.id, si.name, si.category
    `, [checkId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const orderData = result.rows[0];

    res.json({
      success: true,
      check: {
        id: orderData.order_id,
        storeId: orderData.store_id,
        storeName: orderData.store_name || '매장',
        storeCategory: orderData.store_category,
        status: orderData.status,
        totalAmount: orderData.total_amount || 0,
        createdAt: orderData.created_at,
        updatedAt: orderData.updated_at,
        isGuest: !orderData.user_id,
        customerInfo: {
          userId: orderData.user_id,
          guestId: orderData.guest_id
        },
        items: orderData.items || [],
        itemCount: parseInt(orderData.item_count)
      }
    });

  } catch (error) {
    console.error('❌ TLL 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 주문 조회 실패'
    });
  }
});

/**
 * [PUT] /check-items/:itemId - TLL 주문 아이템 수정/취소 (현재 스키마 기반)
 */
router.put('/check-items/:itemId', async (req, res) => {
  const client = await pool.connect();

  try {
    const { itemId } = req.params;
    const { action, quantity, notes } = req.body;

    console.log(`✏️ TLL 아이템 수정: ${itemId}, 액션: ${action}`);

    if (!action || !['cancel', 'updateQuantity'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 액션입니다'
      });
    }

    await client.query('BEGIN');

    // 아이템 확인
    const itemResult = await client.query(`
      SELECT
        oi.id,
        oi.item_status,
        oi.ticket_id,
        oi.menu_name,
        oi.quantity,
        oi.unit_price,
        o.status as order_status,
        o.id as order_id
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      JOIN orders o ON ot.order_id = o.id
      WHERE oi.id = $1
    `, [itemId]);

    if (itemResult.rows.length === 0) {
      throw new Error('아이템을 찾을 수 없습니다');
    }

    const item = itemResult.rows[0];

    if (item.order_status !== 'OPEN') {
      throw new Error('종료된 주문의 아이템은 수정할 수 없습니다');
    }

    if (action === 'cancel') {
      // 아이템 취소
      if (item.item_status === 'COMPLETED') {
        throw new Error('이미 완료된 아이템은 취소할 수 없습니다');
      }

      await client.query(`
        UPDATE order_items
        SET item_status = 'CANCELLED'
        WHERE id = $1
      `, [itemId]);

      console.log(`🗑️ TLL 아이템 취소: ${item.menu_name}`);

    } else if (action === 'updateQuantity' && quantity > 0) {
      // 수량 변경
      const newTotalPrice = item.unit_price * quantity;

      await client.query(`
        UPDATE order_items
        SET quantity = $1, total_price = $2
        WHERE id = $3
      `, [quantity, newTotalPrice, itemId]);

      console.log(`🔢 TLL 아이템 수량 변경: ${item.menu_name} → ${quantity}개`);
    }

    // 주문 총액 재계산
    const totalResult = await client.query(`
      SELECT COALESCE(SUM(oi.total_price), 0) as new_total
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      WHERE ot.order_id = $1 AND oi.item_status != 'CANCELLED'
    `, [item.order_id]);

    const newTotal = totalResult.rows[0].new_total;

    await client.query(`
      UPDATE orders
      SET " total_price" = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newTotal, item.order_id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      item_id: parseInt(itemId),
      action: action,
      order_id: item.order_id,
      new_total: newTotal,
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
