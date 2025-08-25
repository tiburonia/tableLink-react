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

// POS 주문 처리
router.post('/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      storeId,
      storeName,
      tableNumber,
      items,
      totalAmount,
      isGuestOrder,
      guestPhone,
      guestName,
      isTLLOrder,
      userId,
      guestId, // This guestId is from TLL, not our new guest table PK
      customerName
    } = req.body;

    console.log('💳 POS 주문 추가 요청:', {
      storeId,
      storeName,
      tableNumber,
      itemCount: items?.length || 0,
      totalAmount,
      isGuestOrder,
      isTLLOrder,
      guestPhone: guestPhone ? '***' : undefined
    });

    await client.query('BEGIN');

    let currentUserId = null;
    let currentGuestPhone = null;
    let finalCustomerName = 'POS 주문';
    let orderSource = 'POS';
    let shouldClearExistingOrders = false;

    // TLL 주문 연동 처리
    if (isTLLOrder && (userId || guestId)) {
      console.log('🔗 TLL 주문 연동 처리 시작');
      currentUserId = userId;
      // TLL에서는 기존 guest_id를 phone으로 변환해야 함 (임시 처리)
      if (guestId && !userId) {
        // 기존 guestId에서 phone 조회 로직이 필요하지만 일단 스킵
        console.log('⚠️ TLL 게스트 연동은 추후 구현 예정');
      }
      finalCustomerName = customerName || 'TLL 연동 주문';
      orderSource = 'POS'; // TLL 주문에 POS에서 추가된 메뉴 (POS 소스로 표시)

      console.log(`✅ TLL 주문 연동: ${isGuestOrder ? '게스트' : '회원'} - ${finalCustomerName}`);
    } else {
      // 기존 일반 POS 주문 로직
      console.log('📦 일반 POS 주문 처리 시작');
    }

    // 현재 테이블의 기존 주문 확인 (24시간 내)
    const existingOrdersResult = await client.query(`
      SELECT o.user_id, o.guest_phone, u.name as user_name, o.order_date
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.store_id = $1 AND o.table_number = $2 
      AND o.order_date >= NOW() - INTERVAL '24 hours'
      ORDER BY o.order_date DESC
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

    console.log(`🔍 테이블 ${tableNumber} 기존 주문 확인:`, existingOrdersResult.rows.length > 0 ? 
      existingOrdersResult.rows[0] : '없음');

    if (isGuestOrder && !isTLLOrder) {
      // 일반 POS 비회원 처리
      let targetPhone = guestPhone || null; // 전화번호는 nullable

      if (targetPhone) {
        // 전화번호가 있는 경우 - 기존 게스트 확인/생성
        const existingGuest = await client.query(
          'SELECT phone, visit_count FROM guests WHERE phone = $1',
          [targetPhone]
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
          `, [`{${storeId}}`, storeVisitCount, targetPhone]);

          console.log(`👤 기존 게스트 방문 횟수 업데이트 - 매장 ${storeId}: ${storeVisitCount}번째 방문`);
        } else {
          // 새 게스트 생성
          const initialVisitCount = { [storeId]: 1 };

          await client.query(
            'INSERT INTO guests (phone, visit_count) VALUES ($1, $2)',
            [targetPhone, JSON.stringify(initialVisitCount)]
          );

          console.log(`✨ 새 게스트 생성 - 매장 ${storeId}: 첫 방문`);
        }

        currentGuestPhone = targetPhone;
        finalCustomerName = guestName || `게스트 (${targetPhone})`;
      } else {
        // 전화번호 없는 경우 - 익명 게스트 (visit_count 업데이트 없음)
        currentGuestPhone = null;
        finalCustomerName = '익명 게스트';
        console.log(`👤 익명 게스트 주문`);
      }

      // 기존 주문과 비교 - 다른 사용자가 주문했었다면 초기화
      if (existingOrdersResult.rows.length > 0) {
        const existingOrder = existingOrdersResult.rows[0];
        if (existingOrder.user_id || existingOrder.guest_phone !== currentGuestPhone) {
          shouldClearExistingOrders = true;
          console.log(`🔄 다른 사용자 감지 - 기존 주문 초기화 예정`);
        }
      }
    } else if (!isGuestOrder) {
      if (isTLLOrder && currentUserId) {
        // TLL 연동 회원 주문 - 기존 사용자 ID 사용
        console.log(`🔗 TLL 연동 회원 주문 - User ID: ${currentUserId}, 이름: ${finalCustomerName}`);
      } else {
        // 일반 POS 회원 처리 (POS 전용 사용자 생성)
        const posUserId = 'pos_user';
        const existingUser = await client.query(
          'SELECT id, name FROM users WHERE id = $1',
          [posUserId]
        );

        if (existingUser.rows.length === 0) {
          // POS 전용 사용자 생성
          await client.query(`
            INSERT INTO users (id, name, phone, email, point, coupons, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            posUserId,
            'POS 사용자',
            '000-0000-0000',
            'pos@system.com',
            0,
            JSON.stringify({ unused: [], used: [] }),
            new Date()
          ]);
          console.log('✅ POS 전용 사용자 생성');
        }

        currentUserId = posUserId;
        finalCustomerName = 'POS 사용자';

        console.log(`👤 일반 POS 회원 주문 - User ID: ${currentUserId}`);
      }

      // 기존 주문과 비교 - 다른 사용자가 주문했었다면 초기화
      if (existingOrdersResult.rows.length > 0) {
        const existingOrder = existingOrdersResult.rows[0];
        if (existingOrder.guest_phone || existingOrder.user_id !== currentUserId) {
          shouldClearExistingOrders = true;
          console.log(`🔄 다른 사용자 감지 - 기존 주문 초기화 예정`);
        }
      }
    }

    // 다른 사용자의 기존 주문이 있다면 숨김 처리 (삭제하지 않고 상태 변경)
    if (shouldClearExistingOrders) {
      await client.query(`
        UPDATE orders 
        SET order_status = 'archived'
        WHERE store_id = $1 AND table_number = $2 
        AND order_date >= NOW() - INTERVAL '24 hours'
        AND order_status != 'archived'
      `, [parseInt(storeId), parseInt(tableNumber)]);

      console.log(`🗄️ 테이블 ${tableNumber}의 기존 주문들을 아카이브 처리 완료`);
    }

    // 주문 데이터 저장
    const orderResult = await client.query(`
      INSERT INTO orders (
        user_id, guest_phone, store_id, table_number, order_data,
        total_amount, original_amount, final_amount, order_source, order_status, order_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      currentUserId,                 // $1
      currentGuestPhone,             // $2 (Using guest_phone as the link for non-members)
      parseInt(storeId),             // $3
      parseInt(tableNumber),         // $4
      JSON.stringify({               // $5
        items: items,
        storeId: storeId,
        storeName: storeName,
        tableNumber: tableNumber
      }),
      totalAmount,                   // $6
      totalAmount,                   // $7
      totalAmount,                   // $8
      orderSource,                   // $9
      'completed',                   // $10
      new Date()                     // $11
    ]);

    const orderId = orderResult.rows[0].id;
    console.log(`✅ POS 주문 ID ${orderId} 저장 완료`);

    // order_items 테이블에 메뉴별 데이터 저장
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

    console.log(`✅ POS 주문 ID ${orderId}의 메뉴 아이템들을 order_items에 저장 완료`);

    await client.query('COMMIT');

    // 📡 POS 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcastNewOrder(storeId, {
        orderId: orderId,
        storeName: storeName,
        tableNumber: parseInt(tableNumber),
        customerName: finalCustomerName,
        itemCount: items.length,
        totalAmount: totalAmount,
        source: 'POS',
        isNewCustomer: shouldClearExistingOrders
      });

      global.posWebSocket.broadcast(storeId, 'order-update', {
        orderId: orderId,
        tableNumber: parseInt(tableNumber),
        action: shouldClearExistingOrders ? 'customer-changed' : 'additional-order'
      });
    }

    res.json({
      success: true,
      orderId: orderId,
      message: shouldClearExistingOrders ? 
        'POS 주문이 성공적으로 추가되었습니다 (새 고객으로 인한 기존 주문 아카이브)' : 
        'POS 주문이 성공적으로 추가되었습니다',
      customerName: finalCustomerName,
      totalAmount: totalAmount,
      isNewCustomer: shouldClearExistingOrders
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

// 테이블의 TLL 주문 정보 조회
router.get('/stores/:storeId/table/:tableNumber/orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 POS - 테이블 ${tableNumber} TLL 주문 정보 조회 (매장 ${storeId})`);

    // 해당 테이블의 최근 24시간 내 활성 주문 조회
    const result = await pool.query(`
      SELECT 
        o.id, o.user_id, o.guest_phone, o.order_source, o.order_date,
        u.name as user_name, u.phone as user_phone,
        g.name as guest_name, g.phone as guest_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN guests g ON o.guest_phone = g.phone -- Joining guests on phone for TLL guest lookup
      WHERE o.store_id = $1 AND o.table_number = $2 
      AND o.order_date >= NOW() - INTERVAL '24 hours'
      AND o.order_status != 'archived'
      AND o.order_source = 'TLL'
      ORDER BY o.order_date DESC
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        hasTLLOrder: false,
        message: '해당 테이블에 TLL 주문이 없습니다'
      });
    }

    const order = result.rows[0];
    const isGuest = !!order.guest_phone; // Determining if it's a guest order based on guest_phone

    const tllOrderInfo = {
      orderId: order.id,
      userId: order.user_id,
      guestPhone: order.guest_phone, // Returning guest_phone
      customerName: isGuest ? (order.guest_name || '게스트') : (order.user_name || 'TLL 사용자'),
      phone: isGuest ? order.guest_phone : order.user_phone,
      isGuest: isGuest,
      orderDate: order.order_date,
      orderSource: order.order_source
    };

    console.log(`✅ POS - 테이블 ${tableNumber} TLL 주문 정보 조회 완료:`, {
      orderId: order.id,
      customerName: tllOrderInfo.customerName,
      isGuest: isGuest
    });

    res.json({
      success: true,
      hasTLLOrder: true,
      tllOrder: tllOrderInfo
    });

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
      FROM orders
      WHERE store_id = $1 AND DATE(order_date) = $2
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

// TLL 연동 POS 주문 결제 처리 API
router.post('/orders/:orderId/payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { orderId } = req.params;
    const { paymentMethod = 'POS' } = req.body;

    console.log(`💳 POS 주문 ${orderId} 결제 처리 요청`);

    await client.query('BEGIN');

    // 주문 정보 조회
    const orderResult = await client.query(`
      SELECT o.*, u.name as user_name, u.point as user_point, g.name as guest_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN guests g ON o.guest_phone = g.phone -- Join with guests using guest_phone
      WHERE o.id = $1
    `, [parseInt(orderId)]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = orderResult.rows[0];

    // 이미 결제 완료된 주문인지 확인
    if (order.order_status === 'paid' || order.payment_status === 'completed') {
      return res.status(400).json({
        success: false,
        error: '이미 결제가 완료된 주문입니다'
      });
    }

    // 결제 완료 상태로 업데이트
    await client.query(`
      UPDATE orders
      SET order_status = 'paid', 
          payment_status = 'completed',
          payment_method = $1,
          payment_date = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [paymentMethod, parseInt(orderId)]);

    // TLL 회원 주문인 경우 포인트 적립 처리
    if (order.user_id && order.order_source !== 'TLL') {
      const earnedPoint = Math.floor(order.final_amount * 0.1);

      // 매장별 포인트 적립
      try {
        await client.query(
          'SELECT update_user_store_stats($1, $2, $3, $4)',
          [order.user_id, order.store_id, order.final_amount, new Date()]
        );
        console.log(`🎉 POS 결제 - 매장 ${order.store_id}에서 ${earnedPoint}원 포인트 적립 완료`);
      } catch (pointError) {
        console.error('⚠️ POS 결제 포인트 적립 실패:', pointError);
        // 포인트 적립 실패해도 결제는 완료되도록 처리
      }
    }

    await client.query('COMMIT');

    // 📡 결제 완료 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(order.store_id, 'payment-completed', {
        orderId: parseInt(orderId),
        tableNumber: order.table_number,
        paymentMethod: paymentMethod,
        finalAmount: order.final_amount,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ POS 주문 ${orderId} 결제 처리 완료 (${paymentMethod})`);

    res.json({
      success: true,
      orderId: parseInt(orderId),
      paymentMethod: paymentMethod,
      finalAmount: order.final_amount,
      customerName: order.user_name || order.guest_name || 'POS 주문',
      message: '결제가 성공적으로 완료되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 주문 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 주문 결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;