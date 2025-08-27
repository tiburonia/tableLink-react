
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// POS 전용 사용자 생성/조회
async function ensurePOSUser() {
  try {
    let userResult = await pool.query('SELECT * FROM users WHERE id = $1', ['pos-user']);

    if (userResult.rows.length === 0) {
      // POS 전용 사용자 생성
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, phone, is_pos_user)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['pos-user', 'POS 시스템', 'pos@system.local', 'pos-system', '000-0000-0000', true]);

      userResult = await pool.query('SELECT * FROM users WHERE id = $1', ['pos-user']);
      console.log('✅ POS 전용 사용자 생성 완료');
    }

    return userResult.rows[0];
  } catch (error) {
    console.error('❌ POS 사용자 확인/생성 실패:', error);
    throw error;
  }
}

// POS 매장 목록 조회
router.get('/stores', async (req, res) => {
  try {
    console.log('🏪 POS 매장 목록 조회');

    const result = await pool.query(`
      SELECT s.id, s.name, s.category, s.is_open as "isOpen"
      FROM stores s
      ORDER BY s.name
    `);

    res.json({
      success: true,
      stores: result.rows
    });

  } catch (error) {
    console.error('❌ POS 매장 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 목록 조회 실패'
    });
  }
});

// POS 매장별 메뉴 조회
router.get('/stores/:storeId/menu', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🍽️ POS 매장 ${storeId} 메뉴 조회`);

    const result = await pool.query(`
      SELECT id, name, category, menu
      FROM stores
      WHERE id = $1
    `, [parseInt(storeId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    const store = result.rows[0];
    let menu = store.menu || [];

    if (typeof menu === 'string') {
      try {
        menu = JSON.parse(menu);
      } catch (error) {
        console.warn('메뉴 JSON 파싱 실패:', error);
        menu = [];
      }
    }

    res.json({
      success: true,
      menu: menu
    });

  } catch (error) {
    console.error('❌ POS 메뉴 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '메뉴 조회 실패'
    });
  }
});

// POS 매장별 테이블 조회
router.get('/stores/:storeId/tables', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🪑 POS 매장 ${storeId} 테이블 조회`);

    const result = await pool.query(`
      SELECT id, table_number as "tableNumber", table_name as "tableName", 
             seats, is_occupied as "isOccupied", occupied_since as "occupiedSince"
      FROM store_tables
      WHERE store_id = $1
      ORDER BY table_number
    `, [parseInt(storeId)]);

    res.json({
      success: true,
      tables: result.rows
    });

  } catch (error) {
    console.error('❌ POS 테이블 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 조회 실패'
    });
  }
});

// POS 주문 추가 (DB 저장)
router.post('/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      storeId,
      storeName,
      tableNumber,
      items,
      totalAmount,
      isTLLOrder,
      userId,
      guestPhone,
      customerName
    } = req.body;

    console.log('📦 POS 주문 추가 요청 (DB 저장):', {
      storeId,
      storeName,
      tableNumber,
      itemCount: items?.length || 0,
      totalAmount,
      isTLLOrder
    });

    await client.query('BEGIN');

    // 🔄 고객 정보 처리
    let currentUserId = null;
    let finalGuestPhone = null;
    let finalCustomerName = customerName || '포스 주문';

    if (isTLLOrder && (userId || guestPhone)) {
      // TLL 주문 연동
      currentUserId = userId;
      finalGuestPhone = guestPhone;
      finalCustomerName = customerName || '게스트';
    } else {
      // 일반 POS 주문
      finalCustomerName = '포스 주문';
    }

    // 1. paid_orders 테이블에 임시 결제 정보 저장
    const paidOrderResult = await client.query(`
      INSERT INTO paid_orders (
        user_id, guest_phone, store_id, table_number, 
        order_data, original_amount, final_amount, order_source,
        payment_status, payment_method, payment_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      currentUserId, 
      finalGuestPhone,
      parseInt(storeId), 
      parseInt(tableNumber), 
      JSON.stringify({
        items: items,
        storeId: parseInt(storeId),
        storeName,
        tableNumber: parseInt(tableNumber)
      }), 
      totalAmount,  // original_amount
      totalAmount,  // final_amount
      isTLLOrder ? 'TLL' : 'POS',
      'pending',    // 결제 대기 상태
      null,         // 결제 방법은 아직 미정
      null          // 결제 날짜는 아직 미정
    ]);

    const paidOrderId = paidOrderResult.rows[0].id;
    console.log(`✅ 임시 결제 정보 ID ${paidOrderId} paid_orders 테이블에 저장 완료`);

    // 2. orders 테이블에 KDS용 제조 정보 저장
    const orderResult = await client.query(`
      INSERT INTO orders (
        paid_order_id, store_id, table_number, customer_name,
        order_data, total_amount, cooking_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      paidOrderId,
      parseInt(storeId), 
      parseInt(tableNumber), 
      finalCustomerName,
      JSON.stringify({
        items: items,
        storeId: parseInt(storeId),
        storeName,
        tableNumber: parseInt(tableNumber)
      }),
      totalAmount,
      'PENDING'
    ]);

    const orderId = orderResult.rows[0].id;
    console.log(`✅ 제조 정보 ID ${orderId} orders 테이블에 저장 완료`);

    // 3. order_items 테이블에 메뉴별 데이터 저장
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id, paid_order_id, menu_name, quantity, price, cooking_status
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        orderId,
        paidOrderId,
        item.name,
        item.quantity || 1,
        item.price,
        'PENDING'
      ]);
    }

    // 🪑 테이블 자동 점유 처리
    try {
      console.log(`🔒 POS 주문 추가로 인한 테이블 ${tableNumber} 자동 점유 처리`);

      await client.query(`
        UPDATE store_tables 
        SET is_occupied = true, 
            occupied_since = CURRENT_TIMESTAMP,
            auto_release_source = 'POS'
        WHERE store_id = $1 AND table_number = $2 AND is_occupied = false
      `, [parseInt(storeId), parseInt(tableNumber)]);

      console.log(`✅ 테이블 ${tableNumber} POS 주문으로 인한 자동 점유 완료`);
    } catch (tableError) {
      console.error('❌ 테이블 자동 점유 실패:', tableError);
    }

    await client.query('COMMIT');

    // 📡 POS 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'order-update', {
        tableNumber: parseInt(tableNumber),
        action: 'order-added',
        itemCount: items.length,
        totalAmount: totalAmount
      });

      global.posWebSocket.broadcastTableUpdate(storeId, {
        tableNumber: parseInt(tableNumber),
        isOccupied: true,
        source: 'POS',
        occupiedSince: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      orderId: orderId,
      paidOrderId: paidOrderId,
      message: 'POS 주문이 데이터베이스에 추가되었습니다',
      orderData: {
        tableNumber: parseInt(tableNumber),
        itemCount: items.length,
        totalAmount: totalAmount,
        items: items
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 주문 추가 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 주문 추가 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 테이블의 모든 주문 조회 (DB 기반)
router.get('/stores/:storeId/table/:tableNumber/all-orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 POS - 테이블 ${tableNumber} 모든 주문 조회 (DB 기반)`);

    // 미결제 주문 조회 (payment_status = 'pending', 아카이브되지 않은 것만)
    const pendingOrdersResponse = await pool.query(`
      SELECT p.id, p.user_id, p.guest_phone, u.name as user_name, 
             p.order_data, p.original_amount, p.final_amount, p.order_source,
             CURRENT_TIMESTAMP as order_date
      FROM paid_orders p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN orders o ON p.id = o.paid_order_id
      WHERE p.store_id = $1 AND p.table_number = $2 
      AND p.payment_status = 'pending'
      AND (o.is_visible IS NULL OR o.is_visible = true)
      AND (o.cooking_status IS NULL OR o.cooking_status NOT IN ('ARCHIVED', 'TABLE_RELEASED'))
      ORDER BY p.id DESC
    `, [parseInt(storeId), parseInt(tableNumber)]);

    // 완료된 TLL 주문만 조회 (아카이브되지 않은 것만)
    const completedOrdersResponse = await pool.query(`
      SELECT p.id, p.user_id, p.guest_phone, u.name as user_name, 
             p.payment_date, p.final_amount, p.order_data, p.payment_status,
             p.order_source
      FROM paid_orders p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN orders o ON p.id = o.paid_order_id
      WHERE p.store_id = $1 AND p.table_number = $2 
      AND p.payment_status = 'completed'
      AND p.order_source = 'TLL'
      AND p.payment_date >= NOW() - INTERVAL '12 hours'
      AND (
        o.id IS NULL OR 
        (o.cooking_status NOT IN ('ARCHIVED', 'TABLE_RELEASED') AND o.is_visible = true)
      )
      ORDER BY p.payment_date DESC
      LIMIT 5
    `, [parseInt(storeId), parseInt(tableNumber)]);

    const pendingOrders = pendingOrdersResponse.rows.map(order => ({
      id: order.id,
      type: 'pending',
      userId: order.user_id,
      guestPhone: order.guest_phone,
      customerName: order.user_name || '게스트',
      orderDate: order.order_date,
      finalAmount: order.final_amount,
      orderData: order.order_data,
      paymentStatus: 'pending',
      orderSource: order.order_source,
      isPaid: false
    }));

    const completedOrders = completedOrdersResponse.rows.map(order => ({
      id: order.id,
      type: 'completed',
      userId: order.user_id,
      guestPhone: order.guest_phone,
      customerName: order.user_name || '게스트',
      orderDate: order.payment_date,
      finalAmount: order.final_amount,
      orderData: order.order_data,
      paymentStatus: order.payment_status,
      orderSource: order.order_source,
      isPaid: true
    }));

    console.log(`✅ 테이블 ${tableNumber} 주문 조회 완료: 미결제 ${pendingOrders.length}개, 완료 ${completedOrders.length}개`);

    res.json({
      success: true,
      tableNumber: parseInt(tableNumber),
      pendingOrders: pendingOrders,
      completedOrders: completedOrders,
      totalOrders: pendingOrders.length + completedOrders.length
    });

  } catch (error) {
    console.error('❌ POS 테이블 통합 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 주문 조회 실패'
    });
  }
});

// 테이블의 TLL 주문 정보 조회
router.get('/stores/:storeId/table/:tableNumber/orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 POS - 테이블 ${tableNumber} TLL 주문 정보 조회 (매장 ${storeId})`);

    // 해당 테이블의 최근 24시간 내 활성 TLL 주문 조회 (아카이브되지 않은 것만)
    const response = await pool.query(`
      SELECT DISTINCT p.user_id, p.guest_phone, u.name as user_name, p.payment_date
      FROM paid_orders p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN orders o ON p.id = o.paid_order_id
      WHERE p.store_id = $1 AND p.table_number = $2 
      AND p.order_source = 'TLL'
      AND p.payment_status = 'completed'
      AND p.payment_date >= NOW() - INTERVAL '24 hours'
      AND (
        o.id IS NULL OR 
        (o.cooking_status IS NULL OR o.cooking_status NOT IN ('ARCHIVED', 'TABLE_RELEASED'))
        AND (o.is_visible IS NULL OR o.is_visible = true)
      )
      ORDER BY p.payment_date DESC
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

    if (response.rows.length > 0) {
      const tllOrder = response.rows[0];

      res.json({
        success: true,
        tllOrder: {
          userId: tllOrder.user_id,
          guestPhone: tllOrder.guest_phone,
          customerName: tllOrder.user_name || '게스트',
          isGuest: !tllOrder.user_id,
          phone: tllOrder.guest_phone || null
        }
      });
    } else {
      res.json({
        success: true,
        tllOrder: null
      });
    }

  } catch (error) {
    console.error('❌ POS 테이블 TLL 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 TLL 주문 조회 실패'
    });
  }
});

// POS 매장별 오늘 주문 통계
router.get('/stores/:storeId/stats', async (req, res) => {
  try {
    const { storeId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    console.log(`📊 POS 매장 ${storeId} 오늘 통계 조회`);

    const result = await pool.query(`
      SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(final_amount), 0) as total_revenue
      FROM paid_orders
      WHERE store_id = $1 AND DATE(payment_date) = $2 AND payment_status = 'completed'
    `, [parseInt(storeId), today]);

    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        orderCount: parseInt(stats.order_count),
        totalRevenue: parseInt(stats.total_revenue),
        date: today
      }
    });

  } catch (error) {
    console.error('❌ POS 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 실패'
    });
  }
});

// POS 주문 결제 처리 API
router.post('/stores/:storeId/table/:tableNumber/payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { storeId, tableNumber } = req.params;
    const { 
      orderIds,
      paymentMethod = 'CARD',
      guestPhone
    } = req.body;

    console.log(`💳 POS 주문 결제 처리 (테이블 ${tableNumber}):`, {
      orderIds,
      paymentMethod,
      guestPhone: guestPhone ? '***' : undefined
    });

    if (!orderIds || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '결제할 주문을 선택해주세요'
      });
    }

    await client.query('BEGIN');

    // 🔄 전화번호 기반 자동 회원/게스트 판단 로직
    let currentUserId = null;
    let finalGuestPhone = null;

    if (guestPhone && guestPhone.trim()) {
      console.log(`🔍 전화번호 확인 중: ${guestPhone}`);
      
      try {
        // 1. 기존 회원 확인
        const existingUser = await client.query(
          'SELECT id, name FROM users WHERE phone = $1',
          [guestPhone]
        );

        if (existingUser.rows.length > 0) {
          // 기존 회원이 있는 경우 - 회원 계정으로 처리
          currentUserId = existingUser.rows[0].id;
          finalGuestPhone = null;
          console.log(`👨‍💼 기존 회원으로 처리: ${existingUser.rows[0].name} (${existingUser.rows[0].id})`);
        } else {
          // 2. 회원이 없다면 게스트로 처리
          finalGuestPhone = guestPhone;
          
          const existingGuest = await client.query(
            'SELECT phone, visit_count FROM guests WHERE phone = $1',
            [guestPhone]
          );

          if (existingGuest.rows.length > 0) {
            // 기존 게스트 - 방문 횟수 업데이트
            const currentVisitCount = existingGuest.rows[0].visit_count || {};
            const storeVisitCount = (currentVisitCount[storeId] || 0) + 1;

            await client.query(`
              UPDATE guests 
              SET visit_count = jsonb_set(visit_count, $1, $2::text::jsonb),
                  updated_at = CURRENT_TIMESTAMP
              WHERE phone = $3
            `, [`{${storeId}}`, storeVisitCount, guestPhone]);

            console.log(`👤 기존 게스트로 처리 - 매장 ${storeId}: ${storeVisitCount}번째 방문`);
          } else {
            // 3. 완전히 새로운 전화번호 - 새 게스트 생성
            const initialVisitCount = { [storeId]: 1 };

            await client.query(`
              INSERT INTO guests (phone, visit_count) 
              VALUES ($1, $2) 
              ON CONFLICT (phone) DO NOTHING
            `, [guestPhone, JSON.stringify(initialVisitCount)]);

            console.log(`🆕 새 게스트로 등록 - 매장 ${storeId}: 첫 방문`);
          }
        }
      } catch (error) {
        console.error('❌ 전화번호 처리 실패:', error);
        throw error;
      }
    }

    let totalAmount = 0;
    const completedOrders = [];

    // 각 주문 결제 처리
    for (const orderId of orderIds) {
      // 주문 정보 조회
      const orderResult = await client.query(`
        SELECT p.id, p.final_amount, p.order_data, p.user_id, p.guest_phone
        FROM paid_orders p
        WHERE p.id = $1 AND p.store_id = $2 AND p.table_number = $3 AND p.payment_status = 'pending'
      `, [orderId, parseInt(storeId), parseInt(tableNumber)]);

      if (orderResult.rows.length === 0) {
        continue; // 해당 주문이 없거나 이미 결제됨
      }

      const order = orderResult.rows[0];
      totalAmount += order.final_amount;

      // 결제 정보 업데이트
      await client.query(`
        UPDATE paid_orders 
        SET payment_status = 'completed',
            payment_method = $1,
            payment_date = CURRENT_TIMESTAMP,
            user_id = COALESCE($2, user_id),
            guest_phone = COALESCE($3, guest_phone)
        WHERE id = $4
      `, [paymentMethod, currentUserId, finalGuestPhone, orderId]);

      // 🆕 POS 결제 완료된 주문을 ARCHIVED 상태로 변경하여 POS UI에서 숨김
      await client.query(`
        UPDATE orders 
        SET cooking_status = 'ARCHIVED',
            is_visible = false,
            archived_at = CURRENT_TIMESTAMP
        WHERE paid_order_id = $1
      `, [orderId]);

      console.log(`✅ 주문 ${orderId} 결제 완료 및 아카이브 처리: ₩${order.final_amount.toLocaleString()}`);

      completedOrders.push({
        orderId: orderId,
        amount: order.final_amount
      });

      console.log(`✅ 주문 ${orderId} 결제 완료 및 아카이브 처리: ₩${order.final_amount.toLocaleString()}`);
    }

    // 🗄️ POS 결제 완료 후 해당 테이블의 모든 TLL 주문도 아카이브 처리
    try {
      console.log(`🗄️ 테이블 ${tableNumber}의 모든 TLL 주문 아카이브 처리`);

      const tllArchiveResult = await client.query(`
        UPDATE orders 
        SET cooking_status = 'ARCHIVED',
            is_visible = false,
            table_release_source = 'POS_PAYMENT_COMPLETED',
            archived_at = CURRENT_TIMESTAMP
        WHERE paid_order_id IN (
          SELECT p.id FROM paid_orders p
          WHERE p.store_id = $1 AND p.table_number = $2 
          AND p.order_source = 'TLL'
          AND p.payment_status = 'completed'
          AND p.payment_date >= NOW() - INTERVAL '24 hours'
        )
        AND (cooking_status IS NULL OR cooking_status NOT IN ('ARCHIVED', 'TABLE_RELEASED'))
        RETURNING id, paid_order_id
      `, [parseInt(storeId), parseInt(tableNumber)]);

      console.log(`✅ 테이블 ${tableNumber}의 TLL 주문들 아카이브 처리 완료: ${tllArchiveResult.rows.length}개`);

      // order_items도 아카이브 처리
      if (tllArchiveResult.rows.length > 0) {
        const orderIds = tllArchiveResult.rows.map(row => row.id);
        await client.query(`
          UPDATE order_items 
          SET cooking_status = 'ARCHIVED'
          WHERE order_id = ANY($1)
        `, [orderIds]);
        console.log(`✅ TLL 주문 아이템들도 아카이브 처리 완료`);
      }

    } catch (archiveError) {
      console.error('❌ TLL 주문 아카이브 실패:', archiveError);
    }

    // 🪑 결제 완료 후 테이블 해제 처리
    try {
      console.log(`🔓 POS 결제 완료로 인한 테이블 ${tableNumber} 자동 해제 처리`);

      await client.query(`
        UPDATE store_tables 
        SET is_occupied = false, 
            occupied_since = NULL,
            auto_release_source = NULL
        WHERE store_id = $1 AND table_number = $2
      `, [parseInt(storeId), parseInt(tableNumber)]);

      console.log(`✅ 테이블 ${tableNumber} POS 결제 완료로 인한 자동 해제 완료`);
    } catch (tableError) {
      console.error('❌ 테이블 자동 해제 실패:', tableError);
    }

    // 포인트 적립 처리 (회원인 경우)
    if (currentUserId && !currentUserId.startsWith('pos')) {
      try {
        await client.query(`
          INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count, updated_at)
          VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id, store_id) 
          DO UPDATE SET 
            points = user_store_stats.points + $3,
            total_spent = user_store_stats.total_spent + $4,
            visit_count = user_store_stats.visit_count + 1,
            updated_at = CURRENT_TIMESTAMP
        `, [currentUserId, parseInt(storeId), Math.floor(totalAmount * 0.1), totalAmount]);

        console.log(`🎉 POS 결제 포인트 적립 완료: ${Math.floor(totalAmount * 0.1)}원`);
      } catch (pointError) {
        console.error('⚠️ 포인트 적립 실패:', pointError);
      }
    }

    await client.query('COMMIT');

    // 📡 결제 완료 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'payment-completed', {
        orderIds: orderIds,
        tableNumber: parseInt(tableNumber),
        paymentMethod: paymentMethod,
        finalAmount: totalAmount,
        timestamp: new Date().toISOString()
      });

      global.posWebSocket.broadcastTableUpdate(storeId, {
        tableNumber: parseInt(tableNumber),
        isOccupied: false,
        source: 'POS'
      });
    }

    res.json({
      success: true,
      completedOrders: completedOrders,
      paymentMethod: paymentMethod,
      totalAmount: totalAmount,
      message: `${completedOrders.length}개 주문의 결제가 성공적으로 완료되었습니다`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
