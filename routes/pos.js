const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// POS 전용 사용자 생성/조회
async function ensurePOSUser() {
  try {
    let userResult = await pool.query('SELECT * FROM users WHERE id = $1', ['pos-user']);

    if (userResult.rows.length === 0) {
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

// 테이블의 TLL 주문 조회 (POS용)
router.get('/stores/:storeId/table/:tableNumber/tll-orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;
    console.log(`🔍 POS - 테이블 ${tableNumber} TLL 주문 조회 (매장 ${storeId})`);

    // 최근 2시간 내 완료된 TLL 주문 조회
    const result = await pool.query(`
      SELECT 
        o.id,
        o.order_date,
        o.customer_name,
        o.order_data,
        o.total_amount
      FROM orders o
      WHERE o.store_id = $1 
        AND o.table_number = $2 
        AND o.is_tll_order = true
        AND o.payment_status = 'COMPLETED'
        AND o.order_date >= NOW() - INTERVAL '2 hours'
      ORDER BY o.order_date DESC
      LIMIT 10
    `, [parseInt(storeId), parseInt(tableNumber)]);

    console.log(`✅ 테이블 ${tableNumber} TLL 주문 조회 완료: ${result.rows.length}개`);

    res.json({
      success: true,
      tllOrders: result.rows
    });

  } catch (error) {
    console.error('❌ TLL 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 주문 조회 실패'
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

    // totalAmount 검증 및 계산
    let calculatedTotalAmount = totalAmount;
    if (!calculatedTotalAmount || calculatedTotalAmount === undefined || calculatedTotalAmount === null) {
      calculatedTotalAmount = items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
      console.log('⚠️ totalAmount가 없어서 계산함:', calculatedTotalAmount);
    }

    console.log('📦 POS 주문 추가 요청 (테이블 세션 단위):', {
      storeId,
      storeName,
      tableNumber,
      itemCount: items?.length || 0,
      totalAmount: calculatedTotalAmount,
      isTLLOrder
    });

    await client.query('BEGIN');

    // 🔄 고객 정보 처리
    let currentUserId = null;
    let finalGuestPhone = null;
    let finalCustomerName = customerName || '포스 주문';

    if (isTLLOrder && (userId || guestPhone)) {
      currentUserId = userId;
      finalGuestPhone = guestPhone;
      finalCustomerName = customerName || '게스트';
    } else {
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
      const existingOrder = existingOrderResult.rows[0];
      orderId = existingOrder.id;

      await client.query(`
        UPDATE orders 
        SET total_amount = total_amount + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [calculatedTotalAmount, orderId]);

      console.log(`✅ 기존 주문 세션 ${orderId}에 추가 주문 (기존: ₩${existingOrder.total_amount.toLocaleString()} + 추가: ₩${calculatedTotalAmount.toLocaleString()})`);

    } else {
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
        calculatedTotalAmount,
        'OPEN',
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
      console.log(`✅ 새로운 테이블 세션 ${orderId} 시작 (총액: ₩${calculatedTotalAmount.toLocaleString()})`);

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

    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'order-update', {
        tableNumber: parseInt(tableNumber),
        orderId: orderId,
        action: existingOrderResult.rows.length > 0 ? 'items-added' : 'session-started',
        itemCount: items.length,
        addedAmount: calculatedTotalAmount
      });

      if (existingOrderResult.rows.length === 0) {
        global.posWebSocket.broadcastTableUpdate(storeId, {
          tableNumber: parseInt(tableNumber),
          isOccupied: true,
          source: 'POS',
          occupiedSince: new Date().toISOString()
        });
      }
    }

    if (global.kdsWebSocket) {
      console.log(`📡 POS 주문 ${orderId} KDS 실시간 업데이트 전송 - 매장 ${storeId}`);
      global.kdsWebSocket.broadcast(storeId, 'new-order', {
        orderId: orderId,
        paidOrderId: null,
        storeName: storeName,
        tableNumber: parseInt(tableNumber),
        customerName: finalCustomerName,
        itemCount: items.length,
        totalAmount: calculatedTotalAmount,
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
        addedAmount: calculatedTotalAmount,
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

// POS VAN사 샌드박스 카드 결제 처리
router.post('/stores/:storeId/table/:tableNumber/card-payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { storeId, tableNumber } = req.params;
    const { amount, cardNumber, expiryDate, cvc } = req.body;

    console.log(`💳 POS VAN사 샌드박스 카드 결제 (테이블 ${tableNumber}):`, {
      amount: `₩${amount.toLocaleString()}`,
      cardNumber: `****-****-****-${cardNumber.slice(-4)}`,
      test: true
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

    // 2. VAN사 샌드박스 결제 시뮬레이션
    const vanResponse = simulateVANPayment({
      amount: amount,
      cardNumber: cardNumber,
      expiryDate: expiryDate,
      cvc: cvc
    });

    if (!vanResponse.success) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `카드 결제 실패: ${vanResponse.error}`,
        errorCode: vanResponse.errorCode
      });
    }

    console.log(`✅ VAN사 샌드박스 결제 승인: ${vanResponse.approvalNumber}`);

    // 3. 주문 아이템들 조회
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

    // 4. paid_orders에 결제 내역 기록
    const paidOrderResult = await client.query(`
      INSERT INTO paid_orders (
        user_id, guest_phone, store_id, table_number, 
        order_data, original_amount, final_amount, order_source,
        payment_status, payment_method, payment_date, payment_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11)
      RETURNING id
    `, [
      'pos-user',
      null,
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
      'CARD',
      JSON.stringify({
        provider: 'VAN_SANDBOX',
        approvalNumber: vanResponse.approvalNumber,
        cardCompany: vanResponse.cardCompany,
        cardNumber: `****-****-****-${cardNumber.slice(-4)}`,
        installment: 0,
        acquirer: 'TEST_ACQUIRER'
      })
    ]);

    const paidOrderId = paidOrderResult.rows[0].id;

    // 5. orders 세션을 CLOSED 상태로 변경
    await client.query(`
      UPDATE orders 
      SET cooking_status = 'CLOSED',
          paid_order_id = $1,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [paidOrderId, orderId]);

    // 6. order_items의 cooking_status를 COMPLETED로 변경
    await client.query(`
      UPDATE order_items 
      SET cooking_status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
    `, [orderId]);

    // 7. 테이블 해제 처리
    try {
      console.log(`🔓 POS 카드 결제 완료로 인한 테이블 ${tableNumber} 자동 해제 처리`);

      await client.query(`
        UPDATE store_tables 
        SET is_occupied = false, 
            occupied_since = NULL,
            auto_release_source = NULL
        WHERE store_id = $1 AND table_number = $2
      `, [parseInt(storeId), parseInt(tableNumber)]);

      console.log(`✅ 테이블 ${tableNumber} POS 카드 결제 완료로 인한 자동 해제 완료`);
    } catch (tableError) {
      console.error('❌ 테이블 자동 해제 실패:', tableError);
    }

    await client.query('COMMIT');

    // 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'card-payment-completed', {
        orderId: orderId,
        paidOrderId: paidOrderId,
        tableNumber: parseInt(tableNumber),
        approvalNumber: vanResponse.approvalNumber,
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
      paymentMethod: 'CARD',
      totalAmount: totalAmount,
      itemCount: orderItems.length,
      vanResponse: {
        approvalNumber: vanResponse.approvalNumber,
        cardCompany: vanResponse.cardCompany,
        cardNumber: `****-****-****-${cardNumber.slice(-4)}`
      },
      message: `테이블 ${tableNumber} 카드 결제가 성공적으로 완료되었습니다`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 카드 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 카드 결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// VAN사 샌드박스 결제 시뮬레이션 (확장 버전)
function simulateVANPayment({ amount, cardNumber, expiryDate, cvc }) {
  console.log('🏦 VAN사 샌드박스 결제 시뮬레이션 시작:', {
    amount: `₩${amount.toLocaleString()}`,
    cardNumber: `****-****-****-${cardNumber.slice(-4)}`,
    expiryDate: expiryDate,
    cvc: '***'
  });

  // 카드 번호 유효성 검사
  if (!cardNumber || cardNumber.length < 13) {
    return {
      success: false,
      error: '유효하지 않은 카드 번호',
      errorCode: 'INVALID_CARD_NUMBER'
    };
  }

  // 만료일 검사 (MM/YY 형식)
  if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return {
      success: false,
      error: '유효하지 않은 만료일 형식',
      errorCode: 'INVALID_EXPIRY_DATE'
    };
  }

  // CVC 검사
  if (!cvc || cvc.length < 3) {
    return {
      success: false,
      error: '유효하지 않은 CVC',
      errorCode: 'INVALID_CVC'
    };
  }

  // 테스트 카드 번호별 결과 시뮬레이션
  const testCards = {
    '4111111111111111': { company: 'VISA', success: true },
    '4000111111111115': { company: 'VISA', success: true },
    '5555555555554444': { company: 'MASTERCARD', success: true },
    '5105105105105100': { company: 'MASTERCARD', success: true },
    '374245455400001': { company: 'AMEX', success: true },
    '4000000000000002': { company: 'VISA', success: false, error: '카드 거절됨', code: 'CARD_DECLINED' },
    '4000000000000119': { company: 'VISA', success: false, error: '잔액 부족', code: 'INSUFFICIENT_FUNDS' },
    '4000000000000127': { company: 'VISA', success: false, error: '승인 거절', code: 'AUTHORIZATION_DECLINED' },
    '4000000000000069': { company: 'VISA', success: false, error: '만료된 카드', code: 'EXPIRED_CARD' }
  };

  const cardInfo = testCards[cardNumber] || { company: 'UNKNOWN', success: true };

  // 처리 지연 시뮬레이션 (실제 VAN사 응답 시간 모방)
  const processingDelay = Math.random() * 1000 + 500; // 0.5~1.5초

  if (!cardInfo.success) {
    return {
      success: false,
      error: cardInfo.error,
      errorCode: cardInfo.code,
      processingTime: Math.round(processingDelay)
    };
  }

  // 성공 응답 생성
  const approvalNumber = `VAN${Date.now().toString().slice(-6)}`;
  const transactionId = `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return {
    success: true,
    approvalNumber: approvalNumber,
    transactionId: transactionId,
    cardCompany: cardInfo.company,
    acquirer: 'SANDBOX_ACQUIRER',
    merchantId: 'TLINK_MERCHANT',
    terminalId: `POS_${storeId}`,
    processingTime: Math.round(processingDelay),
    timestamp: new Date().toISOString()
  };
}

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

    // 응답 데이터 구성 (TLL 주문은 별도 처리)
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
        addedAt: item.created_at,
        source: 'POS'
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

// POS VAN사 샌드박스 카드 결제 처리 (프론트엔드용)
router.post('/stores/:storeId/table/:tableNumber/van-card-payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { storeId, tableNumber } = req.params;
    const { amount, cardNumber, expiryDate, cvc } = req.body;

    console.log(`💳 POS VAN사 샌드박스 카드 결제 UI (테이블 ${tableNumber}):`, {
      amount: `₩${amount.toLocaleString()}`,
      cardNumber: `****-****-****-${cardNumber.slice(-4)}`,
      test: true
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

    // 금액 검증
    if (Math.abs(amount - session.total_amount) > 1) {
      return res.status(400).json({
        success: false,
        error: `결제 금액 불일치 (세션: ₩${session.total_amount.toLocaleString()}, 요청: ₩${amount.toLocaleString()})`
      });
    }

    // 2. VAN사 샌드박스 결제 시뮬레이션
    const vanResponse = simulateVANPayment({
      amount: amount,
      cardNumber: cardNumber,
      expiryDate: expiryDate,
      cvc: cvc
    });

    if (!vanResponse.success) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `카드 결제 실패: ${vanResponse.error}`,
        errorCode: vanResponse.errorCode,
        vanResponse: vanResponse
      });
    }

    console.log(`✅ VAN사 샌드박스 결제 승인: ${vanResponse.approvalNumber}`);

    // 3. 주문/결제 완료 처리 (기존 로직 사용)
    const orderId = session.id;
    const totalAmount = session.total_amount;

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

    const paidOrderResult = await client.query(`
      INSERT INTO paid_orders (
        user_id, guest_phone, store_id, table_number, 
        order_data, original_amount, final_amount, order_source,
        payment_status, payment_method, payment_date, payment_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11)
      RETURNING id
    `, [
      'pos-user',
      null,
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
      'CARD',
      JSON.stringify({
        provider: 'VAN_SANDBOX',
        approvalNumber: vanResponse.approvalNumber,
        cardCompany: vanResponse.cardCompany,
        cardNumber: `****-****-****-${cardNumber.slice(-4)}`,
        installment: 0,
        acquirer: 'TEST_ACQUIRER',
        transactionId: vanResponse.transactionId
      })
    ]);

    const paidOrderId = paidOrderResult.rows[0].id;

    // 세션 완료 처리
    await client.query(`
      UPDATE orders 
      SET cooking_status = 'CLOSED',
          paid_order_id = $1,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [paidOrderId, orderId]);

    await client.query(`
      UPDATE order_items 
      SET cooking_status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
    `, [orderId]);

    // 테이블 해제
    await client.query(`
      UPDATE store_tables 
      SET is_occupied = false, 
          occupied_since = NULL,
          auto_release_source = NULL
      WHERE store_id = $1 AND table_number = $2
    `, [parseInt(storeId), parseInt(tableNumber)]);

    await client.query('COMMIT');

    // 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'van-card-payment-completed', {
        orderId: orderId,
        paidOrderId: paidOrderId,
        tableNumber: parseInt(tableNumber),
        vanResponse: vanResponse,
        totalAmount: totalAmount,
        timestamp: new Date().toISOString()
      });

      global.posWebSocket.broadcastTableUpdate(storeId, {
        tableNumber: parseInt(tableNumber),
        isOccupied: false,
        source: 'VAN_CARD_PAYMENT'
      });
    }

    res.json({
      success: true,
      sessionId: orderId,
      paidOrderId: paidOrderId,
      paymentMethod: 'CARD',
      totalAmount: totalAmount,
      vanResponse: {
        approvalNumber: vanResponse.approvalNumber,
        cardCompany: vanResponse.cardCompany,
        cardNumber: `****-****-****-${cardNumber.slice(-4)}`,
        transactionId: vanResponse.transactionId
      },
      message: `테이블 ${tableNumber} VAN 카드 결제가 성공적으로 완료되었습니다`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS VAN 카드 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS VAN 카드 결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 테이블의 TLL 주문 정보 조회 (토스페이먼츠 정보 포함)
router.get('/stores/:storeId/table/:tableNumber/orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 POS - 테이블 ${tableNumber} TLL 주문 정보 조회 (매장 ${storeId})`);

    const memberOrdersQuery = `
      SELECT 
        upo.user_id, 
        NULL as guest_phone, 
        u.name as user_name, 
        upo.payment_date,
        upo.final_amount,
        upo.payment_method,
        upo.payment_reference,
        'TL_MEMBER' as order_type
      FROM user_paid_orders upo
      LEFT JOIN users u ON upo.user_id = u.id
      LEFT JOIN orders o ON upo.id = o.user_paid_order_id
      WHERE upo.store_id = $1 AND upo.table_number = $2 
      AND upo.order_source = 'TLL'
      AND upo.payment_status = 'completed'
      AND upo.payment_date >= NOW() - INTERVAL '24 hours'
      AND (
        o.id IS NULL OR 
        (o.cooking_status NOT IN ('ARCHIVED', 'TABLE_RELEASED', 'CLOSED') AND o.is_visible = true)
      )
    `;

    const guestOrdersQuery = `
      SELECT 
        NULL as user_id,
        p.guest_phone, 
        '게스트' as user_name, 
        p.payment_date,
        p.final_amount,
        p.payment_method,
        NULL as payment_reference,
        'GUEST' as order_type
      FROM paid_orders p
      LEFT JOIN orders o ON p.id = o.paid_order_id
      WHERE p.store_id = $1 AND p.table_number = $2 
      AND p.order_source = 'TLL'
      AND p.payment_status = 'completed'
      AND p.payment_date >= NOW() - INTERVAL '24 hours'
      AND p.user_id IS NULL AND p.guest_phone IS NOT NULL
      AND (
        o.id IS NULL OR 
        (o.cooking_status NOT IN ('ARCHIVED', 'TABLE_RELEASED', 'CLOSED') AND o.is_visible = true)
      )
    `;

    const memberResult = await pool.query(memberOrdersQuery, [parseInt(storeId), parseInt(tableNumber)]);
    const guestResult = await pool.query(guestOrdersQuery, [parseInt(storeId), parseInt(tableNumber)]);

    const allResults = [...memberResult.rows, ...guestResult.rows]
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
      .slice(0, 1);

    if (allResults.length > 0) {
      const tllOrder = allResults[0];

      let paymentInfo = null;
      if (tllOrder.payment_reference) {
        try {
          paymentInfo = typeof tllOrder.payment_reference === 'string' 
            ? JSON.parse(tllOrder.payment_reference) 
            : tllOrder.payment_reference;
        } catch (parseError) {
          console.warn('⚠️ 결제 정보 파싱 실패:', parseError);
        }
      }

      res.json({
        success: true,
        tllOrder: {
          userId: tllOrder.user_id,
          guestPhone: tllOrder.guest_phone,
          customerName: tllOrder.user_name || '게스트',
          isGuest: !tllOrder.user_id,
          phone: tllOrder.guest_phone || null,
          orderType: tllOrder.order_type,
          paymentDate: tllOrder.payment_date,
          finalAmount: tllOrder.final_amount,
          paymentMethod: tllOrder.payment_method,
          tossPaymentInfo: paymentInfo ? {
            paymentKey: paymentInfo.pgPaymentKey,
            orderId: paymentInfo.pgOrderId,
            method: paymentInfo.pgPaymentMethod,
            provider: paymentInfo.provider,
            isOnlinePayment: true,
            paymentProvider: '토스페이먼츠'
          } : {
            paymentKey: null,
            orderId: null,
            method: tllOrder.payment_method,
            provider: 'UNKNOWN',
            isOnlinePayment: false,
            paymentProvider: '기타'
          }
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

// 테이블 세션 상태 검증 API
router.get('/stores/:storeId/table/:tableNumber/session-status', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 테이블 ${tableNumber} 세션 상태 검증 (매장 ${storeId})`);

    // 1. 현재 활성 세션 조회
    const activeSessionResult = await pool.query(`
      SELECT 
        id, 
        customer_name,
        total_amount,
        session_started_at,
        created_at,
        cooking_status
      FROM orders 
      WHERE store_id = $1 AND table_number = $2 AND cooking_status = 'OPEN'
      ORDER BY created_at DESC
    `, [parseInt(storeId), parseInt(tableNumber)]);

    // 2. 충돌 가능한 세션들 확인 (동시 접근)
    const recentSessionsResult = await pool.query(`
      SELECT 
        o.id,
        o.session_started_at,
        o.total_amount,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.store_id = $1 AND o.table_number = $2 
      AND o.session_started_at >= NOW() - INTERVAL '30 minutes'
      AND o.cooking_status = 'OPEN'
      GROUP BY o.id, o.session_started_at, o.total_amount
      ORDER BY o.session_started_at DESC
    `, [parseInt(storeId), parseInt(tableNumber)]);

    // 3. 세션 분석
    const hasActiveSession = activeSessionResult.rows.length > 0;
    const hasMultipleSessions = recentSessionsResult.rows.length > 1;

    let sessionInfo = null;
    let conflictingSessions = [];

    if (hasActiveSession) {
      const session = activeSessionResult.rows[0];
      sessionInfo = {
        id: session.id,
        customerName: session.customer_name,
        totalAmount: session.total_amount,
        startTime: session.session_started_at,
        duration: new Date() - new Date(session.session_started_at),
        status: session.cooking_status
      };

      // 세션 만료 검사 (4시간)
      const maxDuration = 4 * 60 * 60 * 1000; // 4시간
      if (sessionInfo.duration > maxDuration) {
        console.log(`⏰ 테이블 ${tableNumber} 세션 만료 감지`);

        // 만료된 세션 자동 종료
        await pool.query(`
          UPDATE orders 
          SET cooking_status = 'EXPIRED',
              completed_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [session.id]);

        return res.json({
          success: true,
          hasActiveSession: false,
          sessionExpired: true,
          message: '세션이 만료되어 자동 종료되었습니다.'
        });
      }
    }

    if (hasMultipleSessions) {
      conflictingSessions = recentSessionsResult.rows.map(session => ({
        id: session.id,
        startTime: session.session_started_at,
        totalAmount: session.total_amount,
        itemCount: session.item_count,
        lastActivity: session.session_started_at,
        deviceInfo: `POS 터미널` // 실제로는 세션 정보에서 가져와야 함
      }));
    }

    // 4. 테이블 점유 상태 확인
    const tableStatusResult = await pool.query(`
      SELECT is_occupied, occupied_since, auto_release_source
      FROM store_tables
      WHERE store_id = $1 AND table_number = $2
    `, [parseInt(storeId), parseInt(tableNumber)]);

    const tableStatus = tableStatusResult.rows[0] || { is_occupied: false };

    res.json({
      success: true,
      hasActiveSession: hasActiveSession,
      sessionInfo: sessionInfo,
      conflictingSessions: hasMultipleSessions ? conflictingSessions : [],
      tableStatus: {
        isOccupied: tableStatus.is_occupied,
        occupiedSince: tableStatus.occupied_since,
        source: tableStatus.auto_release_source
      },
      canAddItems: true, // 기본적으로 추가 가능
      message: hasActiveSession ? '기존 세션에 아이템을 추가할 수 있습니다.' : '새 세션을 시작할 수 있습니다.'
    });

  } catch (error) {
    console.error('❌ 세션 상태 검증 실패:', error);
    res.status(500).json({
      success: false,
      error: '세션 상태 검증 실패: ' + error.message
    });
  }
});

// 세션 실시간 동기화 API
router.post('/stores/:storeId/table/:tableNumber/sync-session', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;
    const { sessionData, lastSyncTime, deviceId } = req.body;

    console.log(`🔄 테이블 ${tableNumber} 세션 실시간 동기화 요청`);

    // 1. 현재 서버 세션 상태 조회
    const serverSessionResult = await pool.query(`
      SELECT 
        id,
        order_data,
        session_started_at,
        created_at,
        updated_at
      FROM orders 
      WHERE store_id = $1 AND table_number = $2 AND cooking_status = 'OPEN'
      ORDER BY created_at DESC
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

    let syncResult = {
      success: true,
      action: 'no_change',
      serverSession: null,
      conflictResolution: null
    };

    if (serverSessionResult.rows.length > 0) {
      const serverSession = serverSessionResult.rows[0];
      const serverUpdateTime = new Date(serverSession.updated_at);
      const clientSyncTime = new Date(lastSyncTime);

      // 2. 충돌 감지 및 해결
      if (serverUpdateTime > clientSyncTime) {
        console.log(`⚠️ 세션 충돌 감지 - 서버: ${serverUpdateTime}, 클라이언트: ${clientSyncTime}`);

        // 서버 데이터 우선 (Last Write Wins)
        syncResult.action = 'server_wins';
        syncResult.serverSession = {
          id: serverSession.id,
          orderData: serverSession.order_data,
          lastModified: serverSession.updated_at
        };
        syncResult.conflictResolution = 'server_priority';
      } else {
        // 클라이언트 데이터로 서버 업데이트
        await client.query(`
          UPDATE orders 
          SET order_data = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [JSON.stringify(sessionData), serverSession.id]);

        syncResult.action = 'client_updated';
      }
    } else {
      // 새 세션 생성 필요
      syncResult.action = 'create_new_session';
    }

    // 3. 실시간 업데이트 브로드캐스트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'session-sync', {
        tableNumber: parseInt(tableNumber),
        action: syncResult.action,
        timestamp: new Date().toISOString(),
        deviceId: deviceId
      });
    }

    res.json(syncResult);

  } catch (error) {
    console.error('❌ 세션 동기화 실패:', error);
    res.status(500).json({
      success: false,
      error: '세션 동기화 실패: ' + error.message
    });
  }
});

// 세션 강제 종료 API
router.delete('/stores/:storeId/table/:tableNumber/session/:sessionId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { storeId, tableNumber, sessionId } = req.params;
    const { reason = 'manual_termination' } = req.body;

    console.log(`🛑 테이블 ${tableNumber} 세션 ${sessionId} 강제 종료 요청 (사유: ${reason})`);

    await client.query('BEGIN');

    // 1. 세션 상태 확인
    const sessionResult = await pool.query(`
      SELECT id, cooking_status, total_amount, customer_name
      FROM orders
      WHERE id = $1 AND store_id = $2 AND table_number = $3
    `, [sessionId, parseInt(storeId), parseInt(tableNumber)]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '세션을 찾을 수 없습니다.'
      });
    }

    const session = sessionResult.rows[0];

    if (session.cooking_status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: '이미 종료된 세션입니다.'
      });
    }

    // 2. 세션 강제 종료 처리
    await client.query(`
      UPDATE orders 
      SET cooking_status = 'FORCE_CLOSED',
          completed_at = CURRENT_TIMESTAMP,
          order_data = jsonb_set(
            COALESCE(order_data, '{}'), 
            '{termination}', 
            $1
          )
      WHERE id = $2
    `, [JSON.stringify({
      reason: reason,
      terminatedAt: new Date().toISOString(),
      terminatedBy: 'pos-user'
    }), sessionId]);

    // 3. 관련 order_items 상태 업데이트
    await client.query(`
      UPDATE order_items 
      SET cooking_status = 'CANCELLED',
          completed_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
    `, [sessionId]);

    // 4. 테이블 자동 해제 (필요한 경우)
    if (reason === 'manual_termination' || reason === 'session_expired') {
      await client.query(`
        UPDATE store_tables 
        SET is_occupied = false,
            occupied_since = NULL,
            auto_release_source = NULL
        WHERE store_id = $1 AND table_number = $2
      `, [parseInt(storeId), parseInt(tableNumber)]);
    }

    await client.query('COMMIT');

    // 5. 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'session-terminated', {
        sessionId: sessionId,
        tableNumber: parseInt(tableNumber),
        reason: reason,
        timestamp: new Date().toISOString()
      });

      if (reason === 'manual_termination' || reason === 'session_expired') {
        global.posWebSocket.broadcastTableUpdate(storeId, {
          tableNumber: parseInt(tableNumber),
          isOccupied: false,
          source: 'SESSION_TERMINATION'
        });
      }
    }

    console.log(`✅ 테이블 ${tableNumber} 세션 ${sessionId} 강제 종료 완료`);

    res.json({
      success: true,
      sessionId: sessionId,
      reason: reason,
      message: `세션이 성공적으로 종료되었습니다.`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 세션 강제 종료 실패:', error);
    res.status(500).json({
      success: false,
      error: '세션 강제 종료 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// POS 테이블 세션 결제 처리 API (기본 현금/간편결제)
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

    let currentUserId = null;
    let finalGuestPhone = null;

    if (guestPhone && guestPhone.trim()) {
      console.log(`🔍 전화번호 확인 중: ${guestPhone}`);

      try {
        const normalizedPhone = guestPhone.replace(/[^0-9]/g, '');

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

          const existingGuest = await client.query(
            'SELECT phone, visit_count FROM guests WHERE phone = $1',
            [guestPhone]
          );

          if (existingGuest.rows.length > 0) {
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

    if (currentUserId && !currentUserId.startsWith('pos')) {
      console.log(`💳 TL회원 POS 결제 - user_paid_orders에도 저장: ${currentUserId}`);

      await client.query(`
        INSERT INTO user_paid_orders (
          user_id, store_id, table_number, order_data,
          original_amount, used_point, coupon_discount, final_amount,
          payment_method, payment_status, payment_date, order_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11)
      `, [
        currentUserId,
        parseInt(storeId),
        parseInt(tableNumber),
        JSON.stringify({
          items: orderItems,
          sessionId: orderId,
          customerName: session.customer_name,
          sessionStarted: session.session_started_at
        }),
        totalAmount,
        0,
        0,
        totalAmount,
        paymentMethod,
        'completed',
        'POS'
      ]);

      console.log(`✅ TL회원 POS 결제 user_paid_orders 저장 완료: ${currentUserId}`);
    }

    let userPaidOrderId = null;

    if (currentUserId && !currentUserId.startsWith('pos')) {
      const userPaidOrderResult = await client.query(
        'SELECT id FROM user_paid_orders WHERE user_id = $1 AND store_id = $2 ORDER BY created_at DESC LIMIT 1',
        [currentUserId, parseInt(storeId)]
      );

      if (userPaidOrderResult.rows.length > 0) {
        userPaidOrderId = userPaidOrderResult.rows[0].id;
      }
    }

    if (userPaidOrderId) {
      await client.query(`
        UPDATE orders 
        SET cooking_status = 'CLOSED',
            paid_order_id = $1,
            user_paid_order_id = $2,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [paidOrderId, userPaidOrderId, orderId]);
    } else {
      await client.query(`
        UPDATE orders 
        SET cooking_status = 'CLOSED',
            paid_order_id = $1,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [paidOrderId, orderId]);
    }

    await client.query(`
      UPDATE order_items 
      SET cooking_status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
    `, [orderId]);

    console.log(`✅ 테이블 세션 ${orderId} 결제 완료 (결제 ID: ${paidOrderId})`);

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

// 부분 결제 처리 API
router.post('/stores/:storeId/table/:tableNumber/payment-partial', async (req, res) => {
  const client = await pool.connect();
  try {
    const { storeId, tableNumber } = req.params;
    const { paymentMethod, amount, sessionId, isPartialPayment } = req.body;

    console.log(`💳 부분 결제 처리 (테이블 ${tableNumber}):`, {
      method: paymentMethod,
      amount: `₩${amount.toLocaleString()}`,
      sessionId: sessionId
    });

    await client.query('BEGIN');

    // 1. 세션 확인
    const sessionResult = await pool.query(`
      SELECT id, total_amount, customer_name, order_data
      FROM orders
      WHERE id = $1 AND store_id = $2 AND table_number = $3 AND cooking_status = 'OPEN'
    `, [sessionId, parseInt(storeId), parseInt(tableNumber)]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '활성 세션을 찾을 수 없습니다.'
      });
    }

    const session = sessionResult.rows[0];

    // 2. 부분 결제 기록 저장
    const partialPaymentResult = await client.query(`
      INSERT INTO partial_payments (
        order_id, payment_method, amount, payment_status, payment_date
      ) VALUES ($1, $2, $3, 'completed', CURRENT_TIMESTAMP)
      RETURNING id
    `, [sessionId, paymentMethod, amount]);

    const partialPaymentId = partialPaymentResult.rows[0].id;

    // 3. 세션의 결제 누적 금액 계산
    const totalPaidResult = await client.query(`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM partial_payments
      WHERE order_id = $1 AND payment_status = 'completed'
    `, [sessionId]);

    const totalPaid = parseInt(totalPaidResult.rows[0].total_paid);
    const remainingAmount = session.total_amount - totalPaid;

    // 4. 세션 완료 여부 확인
    if (remainingAmount <= 0) {
      // 전체 결제 완료 - paid_orders로 이관
      const orderItems = await client.query(`
        SELECT menu_name, quantity, price
        FROM order_items
        WHERE order_id = $1
      `, [sessionId]);

      const paidOrderResult = await client.query(`
        INSERT INTO paid_orders (
          user_id, store_id, table_number, order_data,
          original_amount, final_amount, order_source,
          payment_status, payment_method, payment_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        'pos-user',
        parseInt(storeId),
        parseInt(tableNumber),
        JSON.stringify({
          items: orderItems,
          sessionId: sessionId,
          partialPayments: await this.getPartialPayments(sessionId, client)
        }),
        session.total_amount,
        session.total_amount,
        'POS',
        'completed',
        'COMBO' // 복합 결제 표시
      ]);

      // 세션 종료
      await client.query(`
        UPDATE orders 
        SET cooking_status = 'CLOSED',
            paid_order_id = $1,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [paidOrderResult.rows[0].id, sessionId]);

      // 테이블 해제
      await client.query(`
        UPDATE store_tables 
        SET is_occupied = false,
            occupied_since = NULL,
            auto_release_source = NULL
        WHERE store_id = $1 AND table_number = $2
      `, [parseInt(storeId), parseInt(tableNumber)]);
    } else {
      // 부분 결제 진행 중 상태 업데이트
      await client.query(`
        UPDATE orders 
        SET order_data = jsonb_set(
          COALESCE(order_data, '{}'),
          '{partialPayments}',
          $1
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [JSON.stringify({
        totalPaid: totalPaid,
        remainingAmount: remainingAmount,
        lastPayment: {
          method: paymentMethod,
          amount: amount,
          timestamp: new Date().toISOString()
        }
      }), sessionId]);
    }

    await client.query('COMMIT');

    // 5. 실시간 업데이트
    if (global.posWebSocket) {
      global.posWebSocket.broadcast(storeId, 'partial-payment-completed', {
        sessionId: sessionId,
        tableNumber: parseInt(tableNumber),
        paymentMethod: paymentMethod,
        amount: amount,
        totalPaid: totalPaid,
        remainingAmount: remainingAmount,
        isSessionComplete: remainingAmount <= 0,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      partialPaymentId: partialPaymentId,
      paymentMethod: paymentMethod,
      amount: amount,
      totalPaid: totalPaid,
      remainingAmount: remainingAmount,
      isSessionComplete: remainingAmount <= 0,
      message: remainingAmount <= 0 ? 
        '전체 결제가 완료되었습니다.' : 
        `부분 결제 완료. 잔여 금액: ₩${remainingAmount.toLocaleString()}`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 부분 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '부분 결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 부분 결제 내역 조회 헬퍼
async function getPartialPayments(orderId, client) {
  const result = await client.query(`
    SELECT payment_method, amount, payment_date, payment_status
    FROM partial_payments
    WHERE order_id = $1
    ORDER BY payment_date ASC
  `, [orderId]);

  return result.rows;
}

// 기존 세션에 아이템 추가 API
router.post('/orders/add-to-session', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      sessionId,
      storeId,
      storeName,
      tableNumber,
      items,
      totalAmount,
      isTLLOrder = false
    } = req.body;

    console.log(`➕ 세션 ${sessionId}에 아이템 추가:`, {
      storeId,
      tableNumber,
      itemCount: items?.length,
      totalAmount,
      isTLLOrder
    });

    await client.query('BEGIN');

    // 세션 존재 확인
    const sessionCheck = await client.query(`
      SELECT id, order_data, total_amount 
      FROM orders 
      WHERE id = $1 AND store_id = $2 AND cooking_status = 'OPEN'
    `, [sessionId, storeId]);

    if (sessionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '유효한 세션을 찾을 수 없습니다'
      });
    }

    const session = sessionCheck.rows[0];
    const currentOrderData = session.order_data || { items: [] };
    const currentTotal = session.total_amount || 0;

    // 새 아이템들을 기존 주문 데이터에 추가
    const updatedItems = [...(currentOrderData.items || []), ...items];
    const updatedTotal = currentTotal + totalAmount;

    // 세션 업데이트
    const updateResult = await client.query(`
      UPDATE orders 
      SET 
        order_data = $1,
        total_amount = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [
      JSON.stringify({
        ...currentOrderData,
        items: updatedItems,
        storeId,
        storeName,
        tableNumber,
        sessionId,
        lastUpdated: new Date().toISOString()
      }),
      updatedTotal,
      sessionId
    ]);

    // 각 아이템을 order_items 테이블에도 추가
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id, menu_name, quantity, price, cooking_status
        ) VALUES ($1, $2, $3, $4, $5)
      `, [sessionId, item.name, item.quantity, item.price, 'PENDING']);
    }

    await client.query('COMMIT');

    console.log(`✅ 세션 ${sessionId} 업데이트 완료 (기존: ₩${currentTotal.toLocaleString()} + 추가: ₩${totalAmount.toLocaleString()})`);

    res.json({
      success: true,
      sessionId: sessionId,
      updatedOrder: updateResult.rows[0],
      addedItems: items.length,
      newTotal: updatedTotal,
      message: `세션에 ${items.length}개 아이템이 추가되었습니다`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 세션 아이템 추가 실패:', error);
    res.status(500).json({
      success: false,
      error: '세션 아이템 추가 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 🆕 스마트 세션 아이템 추가 API (같은 메뉴 통합)
router.post('/orders/add-to-session-smart', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      sessionId,
      storeId,
      storeName,
      tableNumber,
      item,
      isTLLOrder = false
    } = req.body;

    console.log(`🧠 스마트 세션 ${sessionId}에 아이템 추가:`, {
      storeId,
      tableNumber,
      itemName: item.name,
      itemPrice: item.price,
      isTLLOrder
    });

    await client.query('BEGIN');

    // 세션 존재 확인
    const sessionCheck = await client.query(`
      SELECT id, order_data, total_amount 
      FROM orders 
      WHERE id = $1 AND store_id = $2 AND cooking_status = 'OPEN'
    `, [sessionId, storeId]);

    if (sessionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '유효한 세션을 찾을 수 없습니다'
      });
    }

    const session = sessionCheck.rows[0];
    const currentOrderData = session.order_data || { items: [] };
    const currentItems = currentOrderData.items || [];
    const currentTotal = session.total_amount || 0;

    // 같은 메뉴(이름과 가격이 동일)가 있는지 확인
    const existingItemIndex = currentItems.findIndex(
      existing => existing.name === item.name && existing.price === item.price
    );

    let updatedItems;
    let action;
    let updatedTotal = currentTotal + item.price;

    if (existingItemIndex !== -1) {
      // 같은 메뉴가 있으면 수량 증가
      updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: (updatedItems[existingItemIndex].quantity || 1) + (item.quantity || 1)
      };
      action = 'quantity_increased';

      // order_items 테이블에서도 수량 증가
      await client.query(`
        UPDATE order_items 
        SET quantity = quantity + $1
        WHERE order_id = $2 AND menu_name = $3 AND price = $4
      `, [item.quantity || 1, sessionId, item.name, item.price]);

      console.log(`🔄 같은 메뉴 발견 - 수량 증가: ${item.name} (${updatedItems[existingItemIndex].quantity}개)`);
    } else {
      // 새로운 메뉴면 추가
      updatedItems = [...currentItems, item];
      action = 'new_item_added';

      // order_items 테이블에도 새 아이템 추가
      await client.query(`
        INSERT INTO order_items (
          order_id, menu_name, quantity, price, cooking_status
        ) VALUES ($1, $2, $3, $4, $5)
      `, [sessionId, item.name, item.quantity || 1, item.price, 'PENDING']);

      console.log(`➕ 새 메뉴 추가: ${item.name}`);
    }

    // 세션 업데이트
    const updateResult = await client.query(`
      UPDATE orders 
      SET 
        order_data = $1,
        total_amount = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [
      JSON.stringify({
        ...currentOrderData,
        items: updatedItems,
        storeId,
        storeName,
        tableNumber,
        sessionId,
        lastUpdated: new Date().toISOString()
      }),
      updatedTotal,
      sessionId
    ]);

    await client.query('COMMIT');

    console.log(`✅ 스마트 세션 ${sessionId} 업데이트 완료 (${action}) - 총액: ₩${updatedTotal.toLocaleString()}`);

    res.json({
      success: true,
      sessionId: sessionId,
      action: action,
      updatedOrder: updateResult.rows[0],
      newTotal: updatedTotal,
      message: action === 'quantity_increased' 
        ? `${item.name} 수량이 증가되었습니다`
        : `${item.name}이 추가되었습니다`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 스마트 세션 아이템 추가 실패:', error);
    res.status(500).json({
      success: false,
      error: '스마트 세션 아이템 추가 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;