const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 📋 체크 생성 또는 기존 체크에 아이템 추가 (POS/TLL 통합)
router.post('/create-or-add', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      storeId,
      tableNumber,
      items,
      userId,
      guestPhone,
      customerName,
      sourceSystem = 'TLL'
    } = req.body;

    console.log(`📋 체크 생성/추가 요청:`, {
      storeId,
      tableNumber,
      itemCount: items?.length,
      sourceSystem,
      customer: userId || guestPhone || customerName
    });

    await client.query('BEGIN');

    // 1. 해당 테이블의 활성 체크 확인
    let checkId = null;
    const activeCheckResult = await client.query(`
      SELECT id, final_amount, customer_name
      FROM checks
      WHERE store_id = $1 AND table_number = $2 AND status = 'open'
      ORDER BY opened_at DESC
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

    if (activeCheckResult.rows.length > 0) {
      // 기존 체크에 추가
      checkId = activeCheckResult.rows[0].id;
      console.log(`🔄 기존 체크 ${checkId}에 아이템 추가`);
    } else {
      // 새 체크 생성
      const newCheckResult = await client.query(`
        INSERT INTO checks (
          store_id, table_number, user_id, guest_phone, customer_name,
          status, source_system
        ) VALUES ($1, $2, $3, $4, $5, 'open', $6)
        RETURNING id
      `, [
        parseInt(storeId),
        parseInt(tableNumber),
        userId || null,
        guestPhone || null,
        customerName || (userId ? null : '게스트'),
        sourceSystem
      ]);

      checkId = newCheckResult.rows[0].id;
      console.log(`✅ 새 체크 ${checkId} 생성 완료`);

      // 테이블 점유 처리
      await client.query(`
        UPDATE store_tables 
        SET is_occupied = true, 
            occupied_since = CURRENT_TIMESTAMP,
            auto_release_source = $3
        WHERE store_id = $1 AND table_number = $2
      `, [parseInt(storeId), parseInt(tableNumber), sourceSystem]);
    }

    // 2. 아이템들 추가 (같은 메뉴는 수량 통합)
    for (const item of items) {
      // 같은 체크에서 동일한 메뉴 찾기
      const existingItemResult = await client.query(`
        SELECT id, quantity FROM check_items 
        WHERE check_id = $1 AND menu_name = $2 AND unit_price = $3 
        AND status NOT IN ('canceled') AND options = $4
        LIMIT 1
      `, [checkId, item.name, item.price, item.options || {}]);

      if (existingItemResult.rows.length > 0) {
        // 기존 아이템 수량 증가
        const existingItem = existingItemResult.rows[0];
        await client.query(`
          UPDATE check_items 
          SET quantity = quantity + $1, 
              ordered_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [item.quantity, existingItem.id]);

        console.log(`🔄 기존 메뉴 수량 증가: ${item.name} (+${item.quantity}개)`);
      } else {
        // 새 아이템 추가
        await client.query(`
          INSERT INTO check_items (
            check_id, menu_name, menu_category, unit_price, quantity,
            options, status
          ) VALUES ($1, $2, $3, $4, $5, $6, 'ordered')
        `, [checkId, item.name, item.category, item.price, item.quantity, item.options]);

        console.log(`➕ 새 메뉴 추가: ${item.name} (${item.quantity}개)`);
      }
    }

    // 3. 게스트 정보 업데이트 (필요한 경우)
    if (guestPhone && !userId) {
      await client.query(`
        INSERT INTO guests (phone, total_visits, last_visit_date)
        VALUES ($1, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (phone) 
        DO UPDATE SET
          total_visits = guests.total_visits + 1,
          last_visit_date = CURRENT_TIMESTAMP
      `, [guestPhone]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      checkId: checkId,
      tableNumber: parseInt(tableNumber),
      itemCount: items.length,
      message: activeCheckResult.rows.length > 0 ? 
        '기존 체크에 아이템이 추가되었습니다' : 
        '새로운 체크가 생성되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 체크 생성/추가 실패:', error);
    res.status(500).json({
      success: false,
      error: '체크 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 💳 체크 결제 처리 (POS/TLL 통합)
router.post('/pay/:checkId', async (req, res) => {
  const client = await pool.connect();

  try {
    const { checkId } = req.params;
    const { 
      paymentMethod, 
      paymentData, 
      discountAmount = 0 
    } = req.body;

    console.log(`💳 체크 ${checkId} 결제 처리:`, {
      method: paymentMethod,
      discount: discountAmount
    });

    await client.query('BEGIN');

    // 1. 체크 정보 조회
    const checkResult = await client.query(`
      SELECT id, store_id, table_number, user_id, guest_phone, 
             subtotal_amount, final_amount, status
      FROM checks
      WHERE id = $1 AND status = 'open'
    `, [parseInt(checkId)]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '활성 체크를 찾을 수 없습니다'
      });
    }

    const check = checkResult.rows[0];

    // 2. 할인 적용 및 최종 금액 계산
    const finalAmount = check.final_amount - discountAmount;

    if (finalAmount < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: '할인 금액이 주문 금액을 초과합니다'
      });
    }

    // 3. 결제 기록 생성
    const paymentResult = await client.query(`
      INSERT INTO payments (
        check_id, payment_method, amount, status, 
        payment_data, completed_at
      ) VALUES ($1, $2, $3, 'completed', $4, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      parseInt(checkId),
      paymentMethod,
      finalAmount,
      paymentData ? JSON.stringify(paymentData) : null
    ]);

    const paymentId = paymentResult.rows[0].id;

    // 4. 체크 완료 처리
    await client.query(`
      UPDATE checks 
      SET status = 'closed',
          discount_amount = $1,
          final_amount = $2,
          closed_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [discountAmount, finalAmount, parseInt(checkId)]);

    // 5. 모든 아이템을 'served' 상태로 변경
    await client.query(`
      UPDATE check_items 
      SET status = 'served',
          served_at = CURRENT_TIMESTAMP
      WHERE check_id = $1 AND status != 'canceled'
    `, [parseInt(checkId)]);

    // 6. 테이블 해제
    await client.query(`
      UPDATE store_tables 
      SET is_occupied = false,
          occupied_since = NULL,
          auto_release_source = NULL
      WHERE store_id = $1 AND table_number = $2
    `, [check.store_id, check.table_number]);

    // 7. 사용자 통계 업데이트 (회원인 경우)
    if (check.user_id) {
      const points = Math.floor(finalAmount * 0.01); // 1% 포인트

      await client.query(`
        INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count)
        VALUES ($1, $2, $3, $4, 1)
        ON CONFLICT (user_id, store_id)
        DO UPDATE SET
          points = user_store_stats.points + $3,
          total_spent = user_store_stats.total_spent + $4,
          visit_count = user_store_stats.visit_count + 1,
          updated_at = CURRENT_TIMESTAMP
      `, [check.user_id, check.store_id, points, finalAmount]);

      // 사용자 포인트 업데이트
      await client.query(`
        UPDATE users 
        SET point = COALESCE(point, 0) + $1
        WHERE id = $2
      `, [points, check.user_id]);

      console.log(`🎉 회원 ${check.user_id} 포인트 적립: ${points}원`);
    }

    await client.query('COMMIT');

    // 결제 완료 시 KDS에 실시간 이벤트 전송
    if (global.io) {
      // 해당 매장의 모든 티켓을 DONE 상태로 브로드캐스트
      global.io.to(`kds:${check.store_id}`).emit('kds-update', {
        type: 'payment_completed',
        data: {
          table_number: check.table_number,
          check_id: parseInt(checkId),
          final_amount: finalAmount,
          action: 'remove_all_table_tickets'
        }
      });

      console.log(`📡 결제 완료 이벤트 브로드캐스트: 매장 ${check.store_id}, 테이블 ${check.table_number}`);
    }

    res.json({
      success: true,
      checkId: parseInt(checkId),
      paymentId: paymentId,
      finalAmount: finalAmount,
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

// 📊 POS 주문 현황 조회
router.get('/pos/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`💳 POS 주문 현황 조회 - 매장 ${storeId}`);

    const result = await pool.query(`
      SELECT 
        c.id as check_id,
        c.table_number,
        c.customer_name,
        c.user_id,
        c.guest_phone,
        c.final_amount,
        c.status,
        c.opened_at,
        c.source_system,
        COUNT(ci.id) as item_count,
        COUNT(CASE WHEN ci.status = 'ready' THEN 1 END) as ready_items
      FROM checks c
      LEFT JOIN check_items ci ON c.id = ci.check_id
      WHERE c.store_id = $1
      GROUP BY c.id, c.table_number, c.customer_name, c.user_id, c.guest_phone, 
               c.final_amount, c.status, c.opened_at, c.source_system
      ORDER BY c.opened_at DESC
      LIMIT 50
    `, [parseInt(storeId)]);

    res.json({
      success: true,
      checks: result.rows
    });

  } catch (error) {
    console.error('❌ POS 주문 현황 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 주문 현황 조회 실패'
    });
  }
});

// TLL 주문 관련 로직은 /api/tll 라우터로 이동됨

// 📈 매장별 일일 통계 조회
router.get('/stats/:storeId/daily', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    console.log(`📈 매장 ${storeId} 일일 통계 조회: ${date}`);

    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COUNT(DISTINCT COALESCE(o.user_id, o.guest_phone)) as total_customers,
        COUNT(CASE WHEN p.method = 'CASH' THEN 1 END) as cash_orders,
        COUNT(CASE WHEN p.method = 'CARD' THEN 1 END) as card_orders,
        COUNT(CASE WHEN p.method = 'TOSS' THEN 1 END) as toss_orders
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.store_id = $1 
        AND DATE(o.created_at) = $2
        AND o.status != 'CANCELLED'
        AND (p.status = 'completed' OR p.status IS NULL)
    `, [parseInt(storeId), date]);

    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        date: date,
        totalRevenue: parseInt(stats.total_revenue),
        totalOrders: parseInt(stats.total_orders),
        totalCustomers: parseInt(stats.total_customers),
        cashRevenue: parseInt(stats.cash_orders) > 0 ? parseInt(stats.total_revenue) / parseInt(stats.total_orders) * parseInt(stats.cash_orders) : 0,
        cardRevenue: parseInt(stats.card_orders) > 0 ? parseInt(stats.total_revenue) / parseInt(stats.total_orders) * parseInt(stats.card_orders) : 0,
        tossRevenue: parseInt(stats.toss_orders) > 0 ? parseInt(stats.total_revenue) / parseInt(stats.total_orders) * parseInt(stats.toss_orders) : 0
      },
      realTime: true
    });

  } catch (error) {
    console.error('❌ 일일 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '일일 통계 조회 실패'
    });
  }
});

// 🔄 체크 상태 조회
router.get('/check/:checkId', async (req, res) => {
  try {
    const { checkId } = req.params;

    const result = await pool.query(`
      SELECT 
        c.*,
        array_agg(
          json_build_object(
            'id', ci.id,
            'menuName', ci.menu_name,
            'quantity', ci.quantity,
            'unitPrice', ci.unit_price,
            'totalPrice', ci.total_price,
            'status', ci.status,
            'orderedAt', ci.ordered_at
          ) ORDER BY ci.ordered_at
        ) as items,
        array_agg(
          json_build_object(
            'id', p.id,
            'method', p.payment_method,
            'amount', p.amount,
            'status', p.status,
            'completedAt', p.completed_at
          )
        ) FILTER (WHERE p.id IS NOT NULL) as payments
      FROM checks c
      LEFT JOIN check_items ci ON c.id = ci.check_id
      LEFT JOIN payments p ON c.id = p.check_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [parseInt(checkId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '체크를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      check: result.rows[0]
    });

  } catch (error) {
    console.error('❌ 체크 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '체크 조회 실패'
    });
  }
});

// 레거시 orders 테이블 생성 API - checks 기반 시스템으로 통합됨
// TLL 주문: /api/tll/orders 사용
// POS 주문: /api/orders/create-or-add 사용

// 주문 상태 업데이트 API
router.put('/update-status', async (req, res) => {
  try {
    const { orderId, status, cookingStatus } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: '주문 ID가 필요합니다'
      });
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updateFields.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (cookingStatus) {
      updateFields.push(`cooking_status = $${paramCount}`);
      values.push(cookingStatus);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: '업데이트할 상태 정보가 필요합니다'
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(parseInt(orderId));

    const updateResult = await pool.query(`
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, status, cooking_status, updated_at
    `, values);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const updatedOrder = updateResult.rows[0];

    console.log(`🔄 주문 상태 업데이트: 주문 ID ${orderId}, 상태: ${updatedOrder.status}, 조리상태: ${updatedOrder.cooking_status}`);

    res.json({
      success: true,
      message: '주문 상태가 업데이트되었습니다',
      order: updatedOrder
    });

  } catch (error) {
    console.error('❌ 주문 상태 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 상태 업데이트 실패'
    });
  }
});

// 주문 조회 API (단일)
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(`
      SELECT 
        o.*,
        s.name as store_name,
        s.category as store_category,
        u.name as user_name
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [parseInt(orderId)]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = orderResult.rows[0];

    // 주문 항목들 조회
    const itemsResult = await pool.query(`
      SELECT 
        oi.*,
        m.name as menu_name,
        m.category as menu_category
      FROM order_items oi
      LEFT JOIN menus m ON oi.menu_id = m.id
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `, [parseInt(orderId)]);

    res.json({
      success: true,
      order: {
        ...order,
        items: itemsResult.rows.map(item => ({
          ...item,
          options: typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {})
        }))
      }
    });

  } catch (error) {
    console.error('❌ 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 조회 실패'
    });
  }
});

// 사용자 주문 목록 조회 API
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0, status } = req.query;

    console.log(`📋 사용자 ${userId} 주문 목록 조회`);

    let whereClause = 'WHERE o.user_id = $1';
    const queryParams = [userId];

    if (status) {
      whereClause += ' AND o.status = $2';
      queryParams.push(status);
    }

    const ordersResult = await pool.query(`
      SELECT 
        o.id, 
        o.total_price, 
        COALESCE(o.status, 'OPEN') as status,
        o.created_at,
        o.table_num as table_number,
        s.id as store_id, 
        s.name as store_name, 
        s.category as store_category,
        COUNT(ot.id) as ticket_count
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      LEFT JOIN order_tickets ot ON o.id = ot.order_id
      ${whereClause}
      GROUP BY o.id, s.id, s.name, s.category
      ORDER BY o.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      orders: ordersResult.rows
    });

  } catch (error) {
    console.error('❌ 사용자 주문 목록 조회 실패:', error);

    // 테이블이 존재하지 않는 경우 빈 배열 반환
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      console.log('⚠️ 테이블이 존재하지 않음 - 빈 결과 반환');
      return res.json({
        success: true,
        orders: []
      });
    }

    res.status(500).json({
      success: false,
      error: '주문 목록 조회 실패'
    });
  }
});

// 매장 주문 목록 조회 API
router.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 50, offset = 0, status, cookingStatus, date } = req.query;

    let whereClause = 'WHERE o.store_id = $1';
    const queryParams = [parseInt(storeId)];
    let paramCount = 2;

    if (status) {
      whereClause += ` AND o.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    if (cookingStatus) {
      whereClause += ` AND o.cooking_status = $${paramCount}`;
      queryParams.push(cookingStatus);
      paramCount++;
    }

    if (date) {
      whereClause += ` AND DATE(o.created_at) = $${paramCount}`;
      queryParams.push(date);
      paramCount++;
    }

    const ordersResult = await pool.query(`
      SELECT 
        o.*,
        COALESCE(u.name, '게스트') as customer_name,
        COALESCE(u.phone, o.guest_phone) as customer_phone,
        COUNT(ot.id) as ticket_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_tickets ot ON o.id = ot.order_id
      ${whereClause}
      GROUP BY o.id, u.name, u.phone
      ORDER BY o.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      orders: ordersResult.rows
    });

  } catch (error) {
    console.error('❌ 매장 주문 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 주문 목록 조회 실패'
    });
  }
});

// 주문 삭제 API
router.delete('/order/:orderId', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId } = req.params;

    await client.query('BEGIN');

    // 주문 존재 확인
    const orderResult = await pool.query(
      'SELECT id, status FROM orders WHERE id = $1',
      [parseInt(orderId)]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = orderResult.rows[0];

    // 완료된 주문은 삭제 불가
    if (order.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: '완료된 주문은 삭제할 수 없습니다'
      });
    }

    // 주문 항목들 먼저 삭제
    await client.query('DELETE FROM order_items WHERE order_id = $1', [parseInt(orderId)]);

    // 주문 티켓들 삭제
    await client.query('DELETE FROM order_tickets WHERE order_id = $1', [parseInt(orderId)]);

    // 주문 삭제
    await client.query('DELETE FROM orders WHERE id = $1', [parseInt(orderId)]);

    await client.query('COMMIT');

    console.log(`🗑️ 주문 삭제 완료: 주문 ID ${orderId}`);

    res.json({
      success: true,
      message: '주문이 삭제되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 주문 삭제 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 삭제 실패'
    });
  } finally {
    client.release();
  }
});

// 📋 주문 진행 상황 조회 API
router.get('/processing/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`📋 주문 진행 상황 조회: ${orderId}`);

    // 입력 검증
    if (!orderId || isNaN(parseInt(orderId))) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 주문 ID입니다'
      });
    }

    const parsedOrderId = parseInt(orderId);

    // 주문 기본 정보 조회
    const orderResult = await pool.query(`
      SELECT 
        o.id,
        o.store_id,
        COALESCE(o.table_num, 1) as table_number,
        COALESCE(o.status, 'OPEN') as status,
        o.created_at,
        COALESCE(o.session_ended, false) as session_ended,
        COALESCE(o.total_price, 0) as base_amount,
        COALESCE(s.name, '알 수 없는 매장') as store_name
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.id = $1
    `, [parsedOrderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = orderResult.rows[0];

    // 티켓 정보 조회 (아이템 포함)
    const ticketsResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.order_id,
        COALESCE(ot.batch_no, 1) as batch_no,
        COALESCE(ot.status, 'PENDING') as status,
        ot.created_at
      FROM order_tickets ot
      WHERE ot.order_id = $1
      ORDER BY ot.created_at DESC
    `, [parsedOrderId]);

    // 각 티켓에 대해 아이템 정보 조회
    const ticketsWithItems = await Promise.all(
      ticketsResult.rows.map(async (ticket) => {
        console.log(`🔍 티켓 ${ticket.ticket_id} 아이템 조회 시작`);

        // order_items에서 ticket_id로 조회
        const itemsResult = await pool.query(`
          SELECT 
            oi.id,
            COALESCE(oi.menu_name, '메뉴') as menu_name,
            COALESCE(oi.menu_name, '메뉴') as name,
            COALESCE(oi.quantity, 1) as quantity,
            COALESCE(oi.unit_price, 0) as unit_price,
            COALESCE(oi.cook_station, 'KITCHEN') as cook_station,
            COALESCE(oi.item_status, 'PENDING') as status,
            oi.options
          FROM order_items oi
          WHERE oi.ticket_id = $1
          ORDER BY oi.created_at
        `, [ticket.ticket_id]);

        const items = itemsResult.rows.map(item => ({
          ...item,
          options: typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {})
        }));

        console.log(`✅ 티켓 ${ticket.ticket_id} 아이템 조회 완료: ${items.length}개`);

        return {
          ticket_id: ticket.ticket_id,
          id: ticket.ticket_id,
          order_id: ticket.order_id,
          batch_no: ticket.batch_no,
          status: ticket.status,
          created_at: ticket.created_at,
          items: items
        };
      })
    );

    // 결제 내역 조회
    const paymentsResult = await pool.query(`
      SELECT 
        p.id,
        COALESCE(p.method, 'UNKNOWN') as method,
        COALESCE(p.amount, 0) as amount,
        COALESCE(p.status, 'pending') as status,
        p.created_at,
        p.payment_key
      FROM payments p 
      WHERE p.order_id = $1 
      ORDER BY p.created_at DESC
    `, [parsedOrderId]);

    const payments = paymentsResult.rows.map(payment => ({
      id: payment.id,
      method: payment.method?.toString().toUpperCase() || 'UNKNOWN',
      amount: parseInt(payment.amount) || 0,
      status: payment.status,
      createdAt: payment.created_at,
      payment_key: payment.payment_key,
      ticket_ids: []
    }));

    // 최종 금액 계산
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAmount = paidAmount > 0 ? paidAmount : parseInt(order.base_amount) || 0;

    const responseData = {
      id: order.id,
      storeId: order.store_id,
      storeName: order.store_name,
      tableNumber: order.table_number,
      status: order.status,
      createdAt: order.created_at,
      sessionEnded: order.session_ended,
      totalOrders: ticketsWithItems.length,
      totalAmount: totalAmount,
      tickets: ticketsWithItems,
      payments: payments
    };

    console.log(`✅ 주문 진행 상황 조회 성공:`, {
      orderId: responseData.id,
      storeName: responseData.storeName,
      ticketCount: ticketsWithItems.length,
      paymentCount: payments.length,
      totalAmount: responseData.totalAmount,
      ticketItems: ticketsWithItems.map(t => ({ ticket_id: t.ticket_id, itemCount: t.items.length }))
    });

    res.json({
      success: true,
      order: responseData
    });

  } catch (error) {
    console.error('❌ 주문 진행 상황 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 진행 상황을 조회할 수 없습니다: ' + error.message
    });
  }
});

// 🔚 주문 세션 종료 API
router.put('/:orderId/end-session', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId } = req.params;

    console.log(`🔚 주문 세션 종료: ${orderId}`);

    await client.query('BEGIN');

    // 주문 세션 종료 처리
    const updateResult = await client.query(`
      UPDATE orders
      SET 
        session_ended = true,
        session_ended_at = CURRENT_TIMESTAMP,
        status = CASE 
          WHEN status = 'OPEN' THEN 'CLOSED'
          ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [parseInt(orderId)]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = updateResult.rows[0];

    // 해당 테이블 해제 (다른 활성 주문이 없는 경우)
    const activeOrdersResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE store_id = $1 AND table_num = $2 
        AND status = 'OPEN' AND session_ended = false
        AND id != $3
    `, [order.store_id, order.table_num, parseInt(orderId)]);

    const hasActiveOrders = parseInt(activeOrdersResult.rows[0].count) > 0;

    if (!hasActiveOrders) {
      await client.query(`
        UPDATE store_tables
        SET 
          status = 'AVAILABLE'
        WHERE store_id = $1 AND id = $2
      `, [order.store_id, order.table_num]);

      console.log(`🍽️ 테이블 ${order.table_num} 해제 완료`);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '주문 세션이 종료되었습니다',
      orderId: parseInt(orderId),
      tableReleased: !hasActiveOrders
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 주문 세션 종료 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 세션 종료 실패'
    });
  } finally {
    client.release();
  }
});

// 🔄 KDS 동기화 API
router.get('/kds/:storeId/sync', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { lastSyncAt } = req.query;

    console.log(`🔄 KDS 동기화 요청: 매장 ${storeId}, 마지막 동기화: ${lastSyncAt}`);

    const syncTimestamp = lastSyncAt ? new Date(lastSyncAt) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 업데이트된 티켓들 조회
    const updatedTicketsResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.status,
        ot.order_id,
        ot.batch_no,
        ot.updated_at,
        o.table_num as table_number,
        o.created_at,
        array_agg(
          json_build_object(
            'id', oi.id,
            'menuName', oi.menu_name,
            'quantity', oi.quantity,
            'status', COALESCE(oi.item_status, 'PENDING'),
            'item_status', COALESCE(oi.item_status, 'PENDING'),
            'cook_station', COALESCE(oi.cook_station, 'KITCHEN')
          ) ORDER BY oi.created_at
        ) as items
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE o.store_id = $1 
        AND ot.updated_at > $2
        AND ot.display_status != 'UNVISIBLE'
      GROUP BY ot.id, ot.status, ot.order_id, ot.batch_no, ot.updated_at, o.table_num, o.created_at
      ORDER BY ot.updated_at ASC
    `, [parseInt(storeId), syncTimestamp]);

    // 삭제된 티켓들 조회 (UNVISIBLE 상태)
    const deletedTicketsResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.updated_at
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      WHERE o.store_id = $1 
        AND ot.updated_at > $2
        AND ot.display_status = 'UNVISIBLE'
    `, [parseInt(storeId), syncTimestamp]);

    const changes = {
      updated: updatedTicketsResult.rows.map(ticket => ({
        ticket_id: ticket.ticket_id,
        id: ticket.ticket_id,
        check_id: ticket.ticket_id,
        order_id: ticket.order_id,
        table_number: ticket.table_number,
        status: ticket.status?.toUpperCase() || 'PENDING',
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        items: ticket.items || []
      })),
      deleted: deletedTicketsResult.rows.map(ticket => ({
        ticket_id: ticket.ticket_id,
        updated_at: ticket.updated_at
      }))
    };

    console.log(`✅ KDS 동기화 완료: 업데이트 ${changes.updated.length}개, 삭제 ${changes.deleted.length}개`);

    res.json({
      success: true,
      lastSyncAt: new Date().toISOString(),
      changes: changes
    });

  } catch (error) {
    console.error('❌ KDS 동기화 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 동기화 실패: ' + error.message
    });
  }
});

// 주문별 리뷰 상태 확인 API  
router.get('/:orderId/review-status', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM reviews r
      JOIN orders o ON r.store_id = o.store_id AND r.user_id = o.user_id
      WHERE o.id = $1
    `, [parseInt(orderId)]);

    const hasReview = parseInt(result.rows[0].count) > 0;

    res.json({
      success: true,
      hasReview: hasReview
    });

  } catch (error) {
    console.error('❌ 리뷰 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '리뷰 상태 확인 실패'
    });
  }
});

module.exports = router;