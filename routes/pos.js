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
      guestName
    } = req.body;

    console.log('💳 POS 주문 추가 요청:', {
      storeId,
      storeName,
      tableNumber,
      itemCount: items?.length || 0,
      totalAmount,
      isGuestOrder,
      guestPhone: guestPhone ? '***' : undefined
    });

    await client.query('BEGIN');

    let currentUserId = null;
    let currentGuestId = null;
    let customerName = 'POS 주문';
    let orderSource = 'POS';
    let shouldClearExistingOrders = false;

    // 현재 테이블의 기존 주문 확인 (24시간 내)
    const existingOrdersResult = await client.query(`
      SELECT DISTINCT o.user_id, o.guest_id, u.name as user_name, g.name as guest_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN guests g ON o.guest_id = g.id
      WHERE o.store_id = $1 AND o.table_number = $2 
      AND o.order_date >= NOW() - INTERVAL '24 hours'
      ORDER BY o.order_date DESC
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

    console.log(`🔍 테이블 ${tableNumber} 기존 주문 확인:`, existingOrdersResult.rows.length > 0 ? 
      existingOrdersResult.rows[0] : '없음');

    if (isGuestOrder) {
      // 비회원 처리
      if (!guestPhone) {
        throw new Error('비회원 주문 시 전화번호는 필수입니다');
      }

      // guests 테이블에 저장 또는 기존 게스트 조회
      const existingGuest = await client.query(
        'SELECT id, name FROM guests WHERE phone = $1',
        [guestPhone]
      );

      if (existingGuest.rows.length > 0) {
        currentGuestId = existingGuest.rows[0].id;
        customerName = existingGuest.rows[0].name || guestName || 'POS 손님';
      } else {
        const newGuest = await client.query(
          'INSERT INTO guests (phone, name) VALUES ($1, $2) RETURNING id',
          [guestPhone, guestName || 'POS 손님']
        );
        currentGuestId = newGuest.rows[0].id;
        customerName = guestName || 'POS 손님';
      }

      // 기존 주문과 비교 - 다른 사용자가 주문했었다면 초기화
      if (existingOrdersResult.rows.length > 0) {
        const existingOrder = existingOrdersResult.rows[0];
        if (existingOrder.user_id || existingOrder.guest_id !== currentGuestId) {
          shouldClearExistingOrders = true;
          console.log(`🔄 다른 사용자 감지 - 기존 주문 초기화 예정`);
        }
      }

      console.log(`👤 비회원 주문 - Guest ID: ${currentGuestId}, 이름: ${customerName}`);
    } else {
      // 회원 처리 (POS 전용 사용자 생성)
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
      customerName = 'POS 사용자';

      // 기존 주문과 비교 - 다른 사용자가 주문했었다면 초기화
      if (existingOrdersResult.rows.length > 0) {
        const existingOrder = existingOrdersResult.rows[0];
        if (existingOrder.guest_id || existingOrder.user_id !== currentUserId) {
          shouldClearExistingOrders = true;
          console.log(`🔄 다른 사용자 감지 - 기존 주문 초기화 예정`);
        }
      }

      console.log(`👤 회원 주문 - User ID: ${currentUserId}`);
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
        user_id, guest_id, store_id, table_number, order_data,
        total_amount, original_amount, final_amount, order_source, order_status, order_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      currentUserId,                 // $1
      currentGuestId,                // $2
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
        customerName: customerName,
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
      customerName: customerName,
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

module.exports = router;