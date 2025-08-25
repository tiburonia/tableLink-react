
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 메모리 기반 주문 저장소
const memoryOrders = new Map(); // key: tableId, value: orderData

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

// POS 주문 추가 (메모리 저장)
router.post('/orders', async (req, res) => {
  try {
    const {
      storeId,
      storeName,
      tableNumber,
      items,
      totalAmount
    } = req.body;

    console.log('💳 POS 주문 추가 요청 (메모리 저장):', {
      storeId,
      storeName,
      tableNumber,
      itemCount: items?.length || 0,
      totalAmount
    });

    // 테이블 키 생성
    const tableKey = `${storeId}-${tableNumber}`;

    // 기존 메모리 주문이 있는지 확인
    const existingOrder = memoryOrders.get(tableKey);

    if (existingOrder) {
      // 기존 주문에 아이템 추가
      existingOrder.items = existingOrder.items.concat(items);
      existingOrder.totalAmount += totalAmount;
      existingOrder.lastUpdated = new Date();
      
      console.log(`🔄 테이블 ${tableNumber} 기존 주문에 메뉴 추가`);
    } else {
      // 새 주문 생성
      const newOrder = {
        storeId: parseInt(storeId),
        storeName: storeName,
        tableNumber: parseInt(tableNumber),
        items: items,
        totalAmount: totalAmount,
        created: new Date(),
        lastUpdated: new Date()
      };

      memoryOrders.set(tableKey, newOrder);
      console.log(`✨ 테이블 ${tableNumber} 새 주문 생성`);
    }

    // 📡 POS 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'order-update', {
        tableNumber: parseInt(tableNumber),
        action: 'menu-added',
        totalAmount: memoryOrders.get(tableKey).totalAmount,
        itemCount: memoryOrders.get(tableKey).items.length
      });
    }

    res.json({
      success: true,
      message: 'POS 주문이 성공적으로 추가되었습니다 (메모리 저장)',
      tableKey: tableKey,
      totalAmount: memoryOrders.get(tableKey).totalAmount,
      itemCount: memoryOrders.get(tableKey).items.length
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
router.get('/stores/:storeId/table/:tableNumber/orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;
    const tableKey = `${storeId}-${tableNumber}`;

    console.log(`🔍 POS - 테이블 ${tableNumber} 메모리 주문 정보 조회 (매장 ${storeId})`);

    // 메모리에서 주문 조회
    const memoryOrder = memoryOrders.get(tableKey);

    // DB에서 TLL 주문 조회
    const dbOrderResult = await pool.query(`
      SELECT o.user_id, o.guest_phone, u.name as user_name, o.order_date
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.store_id = $1 AND o.table_number = $2 
      AND o.order_date >= NOW() - INTERVAL '24 hours'
      AND o.order_status != 'archived'
      ORDER BY o.order_date DESC
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

    const tllOrder = dbOrderResult.rows.length > 0 ? dbOrderResult.rows[0] : null;

    res.json({
      success: true,
      memoryOrder: memoryOrder || null,
      tllOrder: tllOrder ? {
        userId: tllOrder.user_id,
        guestPhone: tllOrder.guest_phone,
        customerName: tllOrder.user_name || '고객',
        isGuest: !tllOrder.user_id,
        phone: tllOrder.guest_phone || null
      } : null
    });

  } catch (error) {
    console.error('❌ POS 테이블 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 주문 조회 실패'
    });
  }
});

// POS 주문 결제 처리 (DB 저장)
router.post('/stores/:storeId/table/:tableNumber/payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { storeId, tableNumber } = req.params;
    const { 
      paymentMethod = 'POS',
      customerType, // 'member' 또는 'guest'
      guestPhone,
      guestName
    } = req.body;

    const tableKey = `${storeId}-${tableNumber}`;

    console.log(`💳 POS 테이블 ${tableNumber} 결제 처리 요청:`, {
      customerType,
      paymentMethod,
      guestPhone: guestPhone ? '***' : undefined
    });

    // 메모리에서 주문 조회
    const memoryOrder = memoryOrders.get(tableKey);
    if (!memoryOrder) {
      return res.status(404).json({
        success: false,
        error: '해당 테이블에 주문이 없습니다'
      });
    }

    await client.query('BEGIN');

    let currentUserId = null;
    let currentGuestPhone = null;
    let finalCustomerName = 'POS 주문';

    if (customerType === 'guest') {
      // 비회원 처리
      if (guestPhone) {
        // 전화번호가 있는 경우 - 기존 게스트 확인/생성
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

          console.log(`👤 기존 게스트 방문 횟수 업데이트 - 매장 ${storeId}: ${storeVisitCount}번째 방문`);
        } else {
          // 새 게스트 생성
          const initialVisitCount = { [storeId]: 1 };

          await client.query(
            'INSERT INTO guests (phone, visit_count) VALUES ($1, $2)',
            [guestPhone, JSON.stringify(initialVisitCount)]
          );

          console.log(`✨ 새 게스트 생성 - 매장 ${storeId}: 첫 방문`);
        }

        currentGuestPhone = guestPhone;
        finalCustomerName = guestName || `게스트 (${guestPhone})`;
      } else {
        // 전화번호 없는 경우 - 익명 게스트
        currentGuestPhone = null;
        finalCustomerName = '익명 게스트';
        console.log(`👤 익명 게스트 주문`);
      }
    } else {
      // 회원 처리 (POS 전용 사용자)
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
      console.log(`👤 POS 회원 주문 - User ID: ${currentUserId}`);
    }

    // 기존 주문들 아카이브 처리
    await client.query(`
      UPDATE orders 
      SET order_status = 'archived'
      WHERE store_id = $1 AND table_number = $2 
      AND order_date >= NOW() - INTERVAL '24 hours'
      AND order_status != 'archived'
    `, [parseInt(storeId), parseInt(tableNumber)]);

    console.log(`🗄️ 테이블 ${tableNumber}의 기존 주문들을 아카이브 처리 완료`);

    // 주문 데이터 저장
    const orderData = {
      items: memoryOrder.items,
      storeId: memoryOrder.storeId,
      storeName: memoryOrder.storeName,
      tableNumber: memoryOrder.tableNumber
    };

    const orderResult = await client.query(`
      INSERT INTO orders (
        user_id, guest_phone, store_id, table_number, 
        order_data, final_amount, customer_name, order_source,
        order_status, payment_status, payment_method, payment_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      currentUserId, 
      currentGuestPhone, 
      parseInt(storeId), 
      parseInt(tableNumber), 
      JSON.stringify(orderData), 
      memoryOrder.totalAmount, 
      finalCustomerName, 
      'POS',
      'paid',
      'completed',
      paymentMethod,
      new Date()
    ]);

    const orderId = orderResult.rows[0].id;
    console.log(`✅ POS 주문 ID ${orderId} 저장 및 결제 완료`);

    // order_items 테이블에 메뉴별 데이터 저장
    for (const item of memoryOrder.items) {
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

    // 회원인 경우 포인트 적립
    if (currentUserId && currentUserId !== 'pos_user') {
      const earnedPoint = Math.floor(memoryOrder.totalAmount * 0.1);

      try {
        await client.query(
          'SELECT update_user_store_stats($1, $2, $3, $4)',
          [currentUserId, parseInt(storeId), memoryOrder.totalAmount, new Date()]
        );
        console.log(`🎉 POS 결제 - 매장 ${storeId}에서 ${earnedPoint}원 포인트 적립 완료`);
      } catch (pointError) {
        console.error('⚠️ POS 결제 포인트 적립 실패:', pointError);
      }
    }

    await client.query('COMMIT');

    // 메모리에서 주문 삭제
    memoryOrders.delete(tableKey);
    console.log(`🗑️ 테이블 ${tableNumber} 메모리 주문 삭제 완료`);

    // 📡 결제 완료 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(parseInt(storeId), 'payment-completed', {
        orderId: orderId,
        tableNumber: parseInt(tableNumber),
        paymentMethod: paymentMethod,
        finalAmount: memoryOrder.totalAmount,
        customerType: customerType,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ POS 테이블 ${tableNumber} 결제 처리 완료 (${paymentMethod})`);

    res.json({
      success: true,
      orderId: orderId,
      paymentMethod: paymentMethod,
      finalAmount: memoryOrder.totalAmount,
      customerName: finalCustomerName,
      customerType: customerType,
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

// 메모리 주문 상태 조회 (디버깅용)
router.get('/memory-orders', (req, res) => {
  const orders = Array.from(memoryOrders.entries()).map(([tableKey, orderData]) => ({
    tableKey,
    ...orderData
  }));

  res.json({
    success: true,
    memoryOrders: orders,
    count: orders.length
  });
});

module.exports = router;
