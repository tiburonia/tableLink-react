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

// 메모리 기반 POS 주문 저장소
const pendingOrders = new Map(); // key: storeId-tableNumber, value: orderData

// POS 주문 추가 (메모리 저장)
router.post('/orders', async (req, res) => {
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

    console.log('📦 POS 주문 추가 요청 (메모리 저장):', {
      storeId,
      storeName,
      tableNumber,
      itemCount: items?.length || 0,
      totalAmount,
      isTLLOrder
    });

    const orderKey = `${storeId}-${tableNumber}`;

    // 기존 메모리 주문이 있는지 확인
    let existingOrder = pendingOrders.get(orderKey);

    if (isTLLOrder && (userId || guestPhone)) {
      // TLL 주문 연동 - 기존 주문에 메뉴 추가
      console.log('🔗 TLL 주문 연동 - 메뉴 추가');

      if (existingOrder) {
        // 기존 주문에 새 메뉴 추가
        existingOrder.items.push(...items);
        existingOrder.totalAmount += totalAmount;
        console.log(`✅ TLL 주문에 메뉴 추가 완료 - 총 ${existingOrder.items.length}개 메뉴, ₩${existingOrder.totalAmount.toLocaleString()}`);
      } else {
        // 새 TLL 연동 주문 생성
        existingOrder = {
          storeId: parseInt(storeId),
          storeName,
          tableNumber: parseInt(tableNumber),
          items: items,
          totalAmount: totalAmount,
          isTLLOrder: true,
          userId: userId || null,
          guestPhone: guestPhone || null,
          customerName: customerName || '익명 고객',
          orderSource: 'POS',
          createdAt: new Date().toISOString()
        };
        console.log(`✨ 새 TLL 연동 주문 생성`);
      }
    } else {
      // 일반 POS 주문 - 새로운 주문으로 기존 주문 교체
      console.log('📦 일반 POS 주문 생성');

      existingOrder = {
        storeId: parseInt(storeId),
        storeName,
        tableNumber: parseInt(tableNumber),
        items: items,
        totalAmount: totalAmount,
        isTLLOrder: false,
        customerName: '포스 주문',
        orderSource: 'POS',
        createdAt: new Date().toISOString()
      };
    }

    // 메모리에 저장
    pendingOrders.set(orderKey, existingOrder);

    // 🪑 테이블 자동 점유 처리 (POS 주문 추가 시)
    try {
      console.log(`🔒 POS 주문 추가로 인한 테이블 ${tableNumber} 자동 점유 처리`);

      await pool.query(`
        UPDATE store_tables 
        SET is_occupied = true, 
            occupied_since = CURRENT_TIMESTAMP,
            auto_release_source = 'POS'
        WHERE store_id = $1 AND table_number = $2 AND is_occupied = false
      `, [parseInt(storeId), parseInt(tableNumber)]);

      console.log(`✅ 테이블 ${tableNumber} POS 주문으로 인한 자동 점유 완료`);
    } catch (tableError) {
      console.error('❌ 테이블 자동 점유 실패:', tableError);
      // 테이블 점유 실패해도 주문은 처리되도록 함
    }

    // 📡 POS 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'order-update', {
        tableNumber: parseInt(tableNumber),
        action: 'order-added',
        itemCount: existingOrder.items.length,
        totalAmount: existingOrder.totalAmount
      });

      // 테이블 상태 변경 알림
      global.posWebSocket.broadcastTableUpdate(storeId, {
        tableNumber: parseInt(tableNumber),
        isOccupied: true,
        source: 'POS',
        occupiedSince: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'POS 주문이 메모리에 추가되었습니다',
      orderData: {
        tableNumber: parseInt(tableNumber),
        itemCount: existingOrder.items.length,
        totalAmount: existingOrder.totalAmount,
        items: existingOrder.items
      }
    });

  } catch (error) {
    console.error('❌ POS 주문 추가 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 주문 추가 실패: ' + error.message
    });
  }
});

// 테이블의 메모리 주문 조회
router.get('/stores/:storeId/table/:tableNumber/pending-orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;
    const orderKey = `${storeId}-${tableNumber}`;

    const pendingOrder = pendingOrders.get(orderKey);

    if (pendingOrder) {
      res.json({
        success: true,
        hasPendingOrder: true,
        orderData: pendingOrder
      });
    } else {
      res.json({
        success: true,
        hasPendingOrder: false,
        orderData: null
      });
    }

  } catch (error) {
    console.error('❌ 메모리 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '메모리 주문 조회 실패'
    });
  }
});

// 테이블의 모든 주문 조회 (메모리 + DB 통합)
router.get('/stores/:storeId/table/:tableNumber/all-orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;
    const orderKey = `${storeId}-${tableNumber}`;

    console.log(`🔍 POS - 테이블 ${tableNumber} 모든 주문 조회 (메모리+DB 통합)`);

    // 1. 메모리 주문 조회
    const pendingOrder = pendingOrders.get(orderKey);

    // 2. DB 주문 조회 (최근 24시간 내, paid_orders 기반)
    const dbOrdersResponse = await pool.query(`
      SELECT p.id, p.user_id, p.guest_phone, u.name as user_name, 
             p.payment_date, p.final_amount, p.order_data, p.payment_status,
             p.order_source
      FROM paid_orders p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.store_id = $1 AND p.table_number = $2 
      AND p.payment_date >= NOW() - INTERVAL '24 hours'
      ORDER BY p.payment_date DESC
    `, [parseInt(storeId), parseInt(tableNumber)]);

    const dbOrders = dbOrdersResponse.rows.map(order => ({
      id: order.id,
      type: 'completed',
      userId: order.user_id,
      guestPhone: order.guest_phone,
      customerName: order.user_name || '고객',
      orderDate: order.payment_date,
      finalAmount: order.final_amount,
      orderData: order.order_data,
      paymentStatus: order.payment_status,
      orderSource: order.order_source,
      isPaid: order.payment_status === 'completed'
    }));

    // 3. 응답 데이터 구성
    const responseData = {
      success: true,
      tableNumber: parseInt(tableNumber),
      pendingOrder: pendingOrder ? {
        ...pendingOrder,
        type: 'pending',
        isPaid: false
      } : null,
      completedOrders: dbOrders,
      totalOrders: (pendingOrder ? 1 : 0) + dbOrders.length
    };

    console.log(`✅ 테이블 ${tableNumber} 주문 조회 완료: 미결제 ${pendingOrder ? 1 : 0}개, 완료 ${dbOrders.length}개`);

    res.json(responseData);

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

    // 해당 테이블의 최근 24시간 내 활성 주문 조회 (paid_orders 기반)
    const response = await pool.query(`
      SELECT p.user_id, p.guest_phone, u.name as user_name, p.payment_date
      FROM paid_orders p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.store_id = $1 AND p.table_number = $2 
      AND p.payment_date >= NOW() - INTERVAL '24 hours'
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
          customerName: tllOrder.user_name || '고객',
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
      WHERE store_id = $1 AND DATE(payment_date) = $2
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

// POS 메모리 주문 결제 처리 API
router.post('/stores/:storeId/table/:tableNumber/payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { storeId, tableNumber } = req.params;
    const { 
      paymentMethod = 'POS',
      guestPhone
    } = req.body;

    console.log(`💳 POS 메모리 주문 결제 처리 (테이블 ${tableNumber}):`, {
      paymentMethod,
      guestPhone: guestPhone ? '***' : undefined
    });

    const orderKey = `${storeId}-${tableNumber}`;
    const pendingOrder = pendingOrders.get(orderKey);

    if (!pendingOrder) {
      return res.status(404).json({
        success: false,
        error: '결제할 주문이 없습니다'
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
          finalGuestPhone = null; // 회원인 경우 guest_phone은 null
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
    } else {
      console.log('👤 익명 게스트 결제 (전화번호 없음)');
      finalGuestPhone = null;
    }

    // 🆕 동일 테이블의 기존 TLL 주문 확인 (24시간 내) - 아카이브하지 않고 유지
    const existingOrdersResult = await client.query(`
      SELECT o.id, p.user_id, p.guest_phone, u.name as user_name, p.payment_date, p.final_amount
      FROM orders o
      JOIN paid_orders p ON o.paid_order_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE o.store_id = $1 AND o.table_number = $2 
      AND p.payment_date >= NOW() - INTERVAL '24 hours'
      AND o.cooking_status != 'COMPLETED'
      ORDER BY p.payment_date DESC
    `, [parseInt(storeId), parseInt(tableNumber)]);

    console.log(`🔍 POS 결제 - 테이블 ${tableNumber} 기존 TLL 주문 확인: ${existingOrdersResult.rows.length}개 발견`);

    // 기존 TLL 주문들을 아카이브하지 않고 유지 (추가 주문으로 처리)
    if (existingOrdersResult.rows.length > 0) {
      console.log(`✅ POS 결제 - 테이블 ${tableNumber}의 기존 TLL 주문들 유지, 추가 주문으로 처리`);
      existingOrdersResult.rows.forEach((order, index) => {
        console.log(`   ${index + 1}. 주문 ID ${order.id}: ${order.user_name || '게스트'} - ₩${order.final_amount.toLocaleString()}`);
      });
    }

    // 1. paid_orders 테이블에 결제 정보 저장
    const orderData = {
      items: pendingOrder.items,
      storeId: pendingOrder.storeId,
      storeName: pendingOrder.storeName,
      tableNumber: pendingOrder.tableNumber
    };

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
      pendingOrder.storeId, 
      pendingOrder.tableNumber, 
      JSON.stringify(orderData), 
      pendingOrder.totalAmount,  // original_amount
      pendingOrder.totalAmount,  // final_amount
      currentUserId ? 'POS_MEMBER' : 'POS_GUEST',
      'completed',
      paymentMethod,
      new Date()
    ]);

    const paidOrderId = paidOrderResult.rows[0].id;
    console.log(`✅ 결제 정보 ID ${paidOrderId} paid_orders 테이블에 저장 완료`);

    // 2. orders 테이블에 KDS용 제조 정보 저장
    const customerName = currentUserId && !currentUserId.startsWith('pos') 
      ? '회원' : (finalGuestPhone ? '게스트' : '포스 주문');

    const orderResult = await client.query(`
      INSERT INTO orders (
        paid_order_id, store_id, table_number, customer_name,
        order_data, total_amount, cooking_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      paidOrderId,
      pendingOrder.storeId, 
      pendingOrder.tableNumber, 
      customerName,
      JSON.stringify({
        items: pendingOrder.items,
        storeId: pendingOrder.storeId,
        storeName: pendingOrder.storeName,
        tableNumber: pendingOrder.tableNumber
      }),
      pendingOrder.totalAmount,
      'PENDING'
    ]);

    const orderId = orderResult.rows[0].id;
    console.log(`✅ 제조 정보 ID ${orderId} orders 테이블에 저장 완료`);

    // 3. order_items 테이블에 메뉴별 데이터 저장
    for (const item of pendingOrder.items) {
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

    // 🪑 결제 완료 후 테이블 해제 처리 (트랜잭션 내에서 실행)
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
      // 테이블 해제 실패해도 결제는 완료되도록 함
    }

    // 포인트 적립 처리 (회원인 경우)
    if (currentUserId && !currentUserId.startsWith('pos')) {
      try {
        // user_store_stats 테이블에 레코드가 없을 수도 있으므로 UPSERT 방식 사용
        await client.query(`
          INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count, updated_at)
          VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id, store_id) 
          DO UPDATE SET 
            points = user_store_stats.points + $3,
            total_spent = user_store_stats.total_spent + $4,
            visit_count = user_store_stats.visit_count + 1,
            updated_at = CURRENT_TIMESTAMP
        `, [currentUserId, pendingOrder.storeId, Math.floor(pendingOrder.totalAmount * 0.1), pendingOrder.totalAmount]);

        console.log(`🎉 POS 결제 포인트 적립 완료: ${Math.floor(pendingOrder.totalAmount * 0.1)}원`);
      } catch (pointError) {
        console.error('⚠️ 포인트 적립 실패:', pointError);
        // 포인트 적립 실패해도 결제는 완료되도록 함
      }
    }

    await client.query('COMMIT');

    // 메모리에서 주문 제거
    pendingOrders.delete(orderKey);
    console.log(`🗑️ 테이블 ${tableNumber} 메모리 주문 제거 완료`);

    // 📡 결제 완료 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'payment-completed', {
        orderId: orderId,
        paidOrderId: paidOrderId,
        tableNumber: parseInt(tableNumber),
        paymentMethod: paymentMethod,
        finalAmount: pendingOrder.totalAmount,
        timestamp: new Date().toISOString()
      });

      // 테이블 해제 상태 변경 알림
      global.posWebSocket.broadcastTableUpdate(storeId, {
        tableNumber: parseInt(tableNumber),
        isOccupied: false,
        source: 'POS'
      });
    }

    // 📡 새 주문 KDS 실시간 업데이트 전송
    if (global.kdsWebSocket) {
      console.log(`📡 POS 주문 ${orderId} KDS 실시간 업데이트 전송 - 매장 ${storeId}`);
      global.kdsWebSocket.broadcast(storeId, 'new-order', {
        orderId: orderId,
        paidOrderId: paidOrderId,
        storeName: pendingOrder.storeName,
        tableNumber: parseInt(tableNumber),
        customerName: customerName,
        itemCount: pendingOrder.items.length,
        totalAmount: pendingOrder.totalAmount,
        source: 'POS'
      });
    }

    res.json({
      success: true,
      orderId: orderId,
      paidOrderId: paidOrderId,
      paymentMethod: paymentMethod,
      finalAmount: pendingOrder.totalAmount,
      message: '결제가 성공적으로 완료되었습니다'
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