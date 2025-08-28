
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

// POS 주문 추가 (테이블 세션 단위 관리)
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

    console.log('📦 POS 주문 추가 요청 (테이블 세션 단위):', {
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

    // 1. 해당 테이블의 기존 OPEN 상태 주문 세션 확인
    let orderId = null;
    const existingOrderResult = await client.query(`
      SELECT id, total_amount 
      FROM orders 
      WHERE store_id = $1 AND table_number = $2 AND cooking_status = 'OPEN'
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

    if (existingOrderResult.rows.length > 0) {
      // 기존 OPEN 세션이 있으면 해당 order_id 사용
      const existingOrder = existingOrderResult.rows[0];
      orderId = existingOrder.id;
      
      // 총 금액 업데이트
      await client.query(`
        UPDATE orders 
        SET total_amount = total_amount + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [totalAmount, orderId]);

      console.log(`✅ 기존 주문 세션 ${orderId}에 추가 주문 (기존: ₩${existingOrder.total_amount.toLocaleString()} + 추가: ₩${totalAmount.toLocaleString()})`);

    } else {
      // 새로운 테이블 세션 시작
      const newOrderResult = await client.query(`
        INSERT INTO orders (
          store_id, table_number, customer_name,
          total_amount, cooking_status, session_started_at, order_data
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
        RETURNING id
      `, [
        parseInt(storeId), 
        parseInt(tableNumber), 
        finalCustomerName,
        totalAmount,
        'OPEN',  // 새로운 세션 시작
        JSON.stringify({
          sessionType: 'POS',
          items: items,
          isTLLOrder: isTLLOrder,
          customerInfo: {
            userId: currentUserId,
            guestPhone: finalGuestPhone,
            customerName: finalCustomerName
          }
        })
      ]);

      orderId = newOrderResult.rows[0].id;
      console.log(`✅ 새로운 테이블 세션 ${orderId} 시작 (총액: ₩${totalAmount.toLocaleString()})`);

      // 🪑 테이블 자동 점유 처리 (새 세션 시작 시에만)
      try {
        console.log(`🔒 POS 주문 세션 시작으로 인한 테이블 ${tableNumber} 자동 점유 처리`);

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
    }

    // 2. order_items 테이블에 개별 메뉴 아이템 추가
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id, menu_name, quantity, price, cooking_status
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        orderId,
        item.name,
        item.quantity || 1,
        item.price,
        'PENDING'
      ]);
    }

    console.log(`✅ 주문 세션 ${orderId}에 메뉴 아이템 ${items.length}개 추가 완료`);

    await client.query('COMMIT');

    // 📡 POS 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'order-update', {
        tableNumber: parseInt(tableNumber),
        orderId: orderId,
        action: existingOrderResult.rows.length > 0 ? 'items-added' : 'session-started',
        itemCount: items.length,
        addedAmount: totalAmount
      });

      // 새 세션 시작한 경우에만 테이블 점유 상태 업데이트
      if (existingOrderResult.rows.length === 0) {
        global.posWebSocket.broadcastTableUpdate(storeId, {
          tableNumber: parseInt(tableNumber),
          isOccupied: true,
          source: 'POS',
          occupiedSince: new Date().toISOString()
        });
      }
    }

    // 📡 KDS 실시간 업데이트 전송 (POS 주문도 KDS에 표시)
    if (global.kdsWebSocket) {
      console.log(`📡 POS 주문 ${orderId} KDS 실시간 업데이트 전송 - 매장 ${storeId}`);
      global.kdsWebSocket.broadcast(storeId, 'new-order', {
        orderId: orderId,
        paidOrderId: null, // POS 주문은 아직 결제 전
        storeName: storeName,
        tableNumber: parseInt(tableNumber),
        customerName: finalCustomerName,
        itemCount: items.length,
        totalAmount: totalAmount,
        source: 'POS'
      });
    }

    res.json({
      success: true,
      orderId: orderId,
      isNewSession: existingOrderResult.rows.length === 0,
      message: existingOrderResult.rows.length > 0 ? 
        `기존 세션에 메뉴가 추가되었습니다` : 
        `새로운 테이블 세션이 시작되었습니다`,
      orderData: {
        tableNumber: parseInt(tableNumber),
        itemCount: items.length,
        addedAmount: totalAmount,
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

// 테이블의 모든 주문 조회 (세션 단위 관리)
router.get('/stores/:storeId/table/:tableNumber/all-orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 POS - 테이블 ${tableNumber} 모든 주문 조회 (세션 단위)`);

    // 1. 현재 OPEN 상태인 테이블 세션 조회
    const openSessionResponse = await pool.query(`
      SELECT 
        o.id as order_id,
        o.customer_name,
        o.total_amount,
        o.cooking_status,
        o.session_started_at,
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.store_id = $1 AND o.table_number = $2 AND o.cooking_status = 'OPEN'
      GROUP BY o.id, o.customer_name, o.total_amount, o.cooking_status, o.session_started_at, o.created_at
      ORDER BY o.created_at DESC
    `, [parseInt(storeId), parseInt(tableNumber)]);

    // 2. OPEN 세션의 order_items 상세 조회
    let sessionItems = [];
    if (openSessionResponse.rows.length > 0) {
      const orderId = openSessionResponse.rows[0].order_id;
      const itemsResponse = await pool.query(`
        SELECT id, menu_name, quantity, price, cooking_status, created_at
        FROM order_items
        WHERE order_id = $1
        ORDER BY created_at ASC
      `, [orderId]);
      
      sessionItems = itemsResponse.rows;
    }

    // 3. 완료된 TLL 주문들 (최근 12시간, 아카이브되지 않은 것만)
    const completedTLLResponse = await pool.query(`
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
        (o.cooking_status NOT IN ('ARCHIVED', 'TABLE_RELEASED', 'CLOSED') AND o.is_visible = true)
      )
      ORDER BY p.payment_date DESC
      LIMIT 5
    `, [parseInt(storeId), parseInt(tableNumber)]);

    // 응답 데이터 구성
    const currentSession = openSessionResponse.rows.length > 0 ? {
      orderId: openSessionResponse.rows[0].order_id,
      customerName: openSessionResponse.rows[0].customer_name,
      totalAmount: openSessionResponse.rows[0].total_amount,
      itemCount: parseInt(openSessionResponse.rows[0].item_count),
      sessionStarted: openSessionResponse.rows[0].session_started_at,
      status: 'OPEN',
      items: sessionItems.map(item => ({
        id: item.id,
        menuName: item.menu_name,
        quantity: item.quantity,
        price: item.price,
        cookingStatus: item.cooking_status,
        addedAt: item.created_at
      }))
    } : null;

    const completedTLLOrders = completedTLLResponse.rows.map(order => ({
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

    console.log(`✅ 테이블 ${tableNumber} 주문 조회 완료: 현재 세션 ${currentSession ? '1개' : '없음'}, 완료된 TLL ${completedTLLOrders.length}개`);

    res.json({
      success: true,
      tableNumber: parseInt(tableNumber),
      currentSession: currentSession,
      completedTLLOrders: completedTLLOrders,
      totalActiveItems: currentSession ? currentSession.itemCount : 0
    });

  } catch (error) {
    console.error('❌ POS 테이블 주문 조회 실패:', error);
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
        (o.cooking_status NOT IN ('ARCHIVED', 'TABLE_RELEASED', 'CLOSED') AND o.is_visible = true)
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

// POS 테이블 세션 결제 처리 API
router.post('/stores/:storeId/table/:tableNumber/payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { storeId, tableNumber } = req.params;
    const { 
      paymentMethod = 'CARD',
      guestPhone
    } = req.body;

    console.log(`💳 POS 테이블 세션 결제 처리 (테이블 ${tableNumber}):`, {
      paymentMethod,
      guestPhone: guestPhone ? '***' : undefined
    });

    await client.query('BEGIN');

    // 1. 현재 OPEN 상태인 테이블 세션 확인
    const sessionResult = await client.query(`
      SELECT id, total_amount, customer_name, session_started_at
      FROM orders
      WHERE store_id = $1 AND table_number = $2 AND cooking_status = 'OPEN'
    `, [parseInt(storeId), parseInt(tableNumber)]);

    if (sessionResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: '결제할 활성 주문 세션이 없습니다'
      });
    }

    const session = sessionResult.rows[0];
    const orderId = session.id;
    const totalAmount = session.total_amount;

    console.log(`💳 테이블 ${tableNumber} 세션 ${orderId} 결제 처리 시작 (총액: ₩${totalAmount.toLocaleString()})`);

    // 2. 주문 아이템들 조회
    const itemsResult = await client.query(`
      SELECT menu_name, quantity, price
      FROM order_items
      WHERE order_id = $1
    `, [orderId]);

    const orderItems = itemsResult.rows.map(item => ({
      name: item.menu_name,
      quantity: item.quantity,
      price: item.price
    }));

    // 🔄 전화번호 기반 자동 회원/게스트 판단 로직
    let currentUserId = null;
    let finalGuestPhone = null;

    if (guestPhone && guestPhone.trim()) {
      console.log(`🔍 전화번호 확인 중: ${guestPhone}`);
      
      try {
        // 전화번호 정규화 (하이픈 제거)
        const normalizedPhone = guestPhone.replace(/[^0-9]/g, '');
        
        // 기존 회원 확인 (정규화된 전화번호와 원본 전화번호 모두 확인)
        const existingUser = await client.query(
          'SELECT id, name FROM users WHERE phone = $1 OR phone = $2',
          [guestPhone, normalizedPhone]
        );

        if (existingUser.rows.length > 0) {
          currentUserId = existingUser.rows[0].id;
          finalGuestPhone = null;
          console.log(`👨‍💼 기존 회원으로 처리: ${existingUser.rows[0].name} (${existingUser.rows[0].id})`);
        } else {
          finalGuestPhone = guestPhone;
          
          // 게스트 테이블 확인 및 처리
          const existingGuest = await client.query(
            'SELECT phone, visit_count FROM guests WHERE phone = $1',
            [guestPhone]
          );

          if (existingGuest.rows.length > 0) {
            // 기존 게스트의 방문 횟수 업데이트
            let currentVisitCount = {};
            try {
              currentVisitCount = typeof existingGuest.rows[0].visit_count === 'string' 
                ? JSON.parse(existingGuest.rows[0].visit_count) 
                : existingGuest.rows[0].visit_count || {};
            } catch (parseError) {
              console.warn('⚠️ visit_count JSON 파싱 실패, 초기화:', parseError);
              currentVisitCount = {};
            }
            
            const storeVisitCount = (currentVisitCount[storeId] || 0) + 1;
            currentVisitCount[storeId] = storeVisitCount;

            await client.query(`
              UPDATE guests 
              SET visit_count = $1,
                  updated_at = CURRENT_TIMESTAMP
              WHERE phone = $2
            `, [JSON.stringify(currentVisitCount), guestPhone]);

            console.log(`👤 기존 게스트로 처리 - 매장 ${storeId}: ${storeVisitCount}번째 방문`);
          } else {
            // 새 게스트 등록
            const initialVisitCount = { [storeId]: 1 };
            await client.query(`
              INSERT INTO guests (phone, visit_count, created_at, updated_at) 
              VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
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

    // 3. paid_orders에 결제 내역 기록
    const paidOrderResult = await client.query(`
      INSERT INTO paid_orders (
        user_id, guest_phone, store_id, table_number, 
        order_data, original_amount, final_amount, order_source,
        payment_status, payment_method, payment_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      currentUserId,
      finalGuestPhone,
      parseInt(storeId),
      parseInt(tableNumber),
      JSON.stringify({
        items: orderItems,
        sessionId: orderId,
        customerName: session.customer_name,
        sessionStarted: session.session_started_at
      }),
      totalAmount,
      totalAmount,
      'POS',
      'completed',
      paymentMethod
    ]);

    const paidOrderId = paidOrderResult.rows[0].id;

    // 4. orders 세션을 CLOSED 상태로 변경
    await client.query(`
      UPDATE orders 
      SET cooking_status = 'CLOSED',
          paid_order_id = $1,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [paidOrderId, orderId]);

    // 5. order_items의 cooking_status를 COMPLETED로 변경
    await client.query(`
      UPDATE order_items 
      SET cooking_status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
    `, [orderId]);

    console.log(`✅ 테이블 세션 ${orderId} 결제 완료 (결제 ID: ${paidOrderId})`);

    // 🗄️ 해당 테이블의 TLL 주문들도 아카이브 처리
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
        AND (cooking_status IS NULL OR cooking_status NOT IN ('ARCHIVED', 'TABLE_RELEASED', 'CLOSED'))
        RETURNING id
      `, [parseInt(storeId), parseInt(tableNumber)]);

      console.log(`✅ 테이블 ${tableNumber}의 TLL 주문들 아카이브 처리 완료: ${tllArchiveResult.rows.length}개`);
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
      global.posWebSocket.broadcast(storeId, 'session-payment-completed', {
        orderId: orderId,
        paidOrderId: paidOrderId,
        tableNumber: parseInt(tableNumber),
        paymentMethod: paymentMethod,
        totalAmount: totalAmount,
        itemCount: orderItems.length,
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
      sessionId: orderId,
      paidOrderId: paidOrderId,
      paymentMethod: paymentMethod,
      totalAmount: totalAmount,
      itemCount: orderItems.length,
      message: `테이블 ${tableNumber} 세션의 결제가 성공적으로 완료되었습니다`
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
