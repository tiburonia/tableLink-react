const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 비회원 결제 처리 API (게스트 전용)
router.post('/guest-pay', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      guestPhone,
      storeId,
      storeName,
      tableNumber,
      orderData,
      finalTotal
    } = req.body;

    console.log('💳 비회원 결제 처리 요청:', {
      guestPhone: guestPhone ? '***' : undefined,
      storeId,
      storeName,
      tableNumber,
      orderTotal: orderData?.total,
      finalTotal
    });

    await client.query('BEGIN');

    // 전화번호 검증
    if (!guestPhone || guestPhone.trim() === '') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '전화번호는 필수입니다' });
    }

    // 테이블 정보 처리
    let actualTableNumber = null;
    if (tableNumber && storeId) {
      try {
        const tableNumMatch = tableNumber.toString().match(/\d+/);
        const tableNum = tableNumMatch ? parseInt(tableNumMatch[0]) : null;

        if (tableNum) {
          const tableResult = await client.query(`
            SELECT table_number FROM store_tables
            WHERE store_id = $1 AND table_number = $2
          `, [storeId, tableNum]);

          actualTableNumber = tableResult.rows.length > 0 ? tableNum : tableNumber;
        } else {
          actualTableNumber = tableNumber;
        }
      } catch (error) {
        console.error(`❌ 테이블 정보 조회 실패:`, error);
        actualTableNumber = tableNumber;
      }
    }

    // 기존 게스트 정보 업데이트 또는 생성
    try {
      // 전화번호 정규화 (하이픈 제거)
      const normalizedPhone = guestPhone.replace(/[^0-9]/g, '');

      // 먼저 해당 전화번호가 기존 회원인지 확인
      const existingUser = await client.query(
        'SELECT id, name FROM users WHERE phone = $1 OR phone = $2',
        [guestPhone, normalizedPhone]
      );

      if (existingUser.rows.length > 0) {
        console.log(`⚠️ 전화번호 ${guestPhone}는 기존 회원입니다: ${existingUser.rows[0].name}`);
        // 기존 회원이면 게스트로 처리하지 않음
      } else {
        // 게스트 처리
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

          console.log(`👤 기존 게스트 방문 횟수 업데이트: 매장 ${storeId} - ${storeVisitCount}회`);
        } else {
          // 새 게스트 등록
          const initialVisitCount = { [storeId]: 1 };
          await client.query(`
            INSERT INTO guests (phone, visit_count, created_at, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (phone) DO NOTHING
          `, [guestPhone, JSON.stringify(initialVisitCount)]);

          console.log(`🆕 새 게스트 등록: ${guestPhone} - 매장 ${storeId} 첫 방문`);
        }
      }
    } catch (guestError) {
      console.error('⚠️ 게스트 정보 처리 실패:', guestError);
      // 게스트 정보 처리 실패해도 주문은 계속 진행
    }

    // 1. 비회원 결제 정보를 paid_orders 테이블에만 저장
    const paidOrderResult = await client.query(`
      INSERT INTO paid_orders (
        guest_phone, store_id, table_number, order_data,
        original_amount, final_amount, payment_method,
        payment_status, payment_date, order_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      guestPhone,            // $1 - 게스트 전화번호
      storeId,               // $2
      actualTableNumber,     // $3
      JSON.stringify({       // $4
        ...orderData,
        storeId: storeId,
        storeName: storeName,
        tableNumber: tableNumber
      }),
      orderData.total,       // $5 - original_amount
      finalTotal,            // $6 - final_amount
      'card',                // $7 - payment_method
      'completed',           // $8 - payment_status
      new Date(),            // $9 - payment_date
      'TLL'                  // $10 - order_source
    ]);

    const paidOrderId = paidOrderResult.rows[0].id;
    console.log(`✅ 비회원 결제 정보 ID ${paidOrderId} paid_orders 테이블에만 저장 완료`);

    // 2. orders 테이블에 KDS용 제조 정보 저장 (paid_order_id 참조)
    const orderResult = await client.query(`
      INSERT INTO orders (
        paid_order_id, store_id, table_number, customer_name,
        order_data, total_amount, cooking_status, guest_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      paidOrderId,           // $1 - paid_orders.id 참조
      storeId,               // $2
      actualTableNumber,     // $3
      '게스트',              // $4
      JSON.stringify({       // $5
        items: orderData.items,
        storeId: storeId,
        storeName: storeName,
        tableNumber: tableNumber
      }),
      orderData.total,       // $6
      'PENDING',             // $7
      guestPhone             // $8
    ]);

    const orderId = orderResult.rows[0].id;
    console.log(`✅ 비회원 제조 정보 ID ${orderId} orders 테이블에 저장 완료`);

    // 3. order_items 테이블에 메뉴별 데이터 저장
    if (orderData.items && orderData.items.length > 0) {
      for (const item of orderData.items) {
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
      console.log(`✅ 비회원 주문 ID ${orderId}의 메뉴 아이템들을 order_items에 저장 완료`);
    }

    await client.query('COMMIT');

    // 📡 새 주문 KDS 실시간 업데이트 전송
    if (global.kdsWebSocket) {
      console.log(`📡 비회원 주문 ${orderId} KDS 실시간 업데이트 전송 - 매장 ${storeId}`);
      global.kdsWebSocket.broadcast(storeId, 'new-order', {
        orderId: orderId,
        paidOrderId: paidOrderId,
        storeName: storeName,
        tableNumber: actualTableNumber,
        customerName: '게스트',
        itemCount: orderData.items ? orderData.items.length : 0,
        totalAmount: orderData.total,
        source: 'TLL_GUEST'
      });
    }

    // POS 실시간 새 주문 알림
    if (global.posWebSocket) {
      console.log(`📡 비회원 주문 ${paidOrderId} POS 실시간 알림 전송`);
      global.posWebSocket.broadcastNewOrder(storeId, {
        orderId: orderId,
        paidOrderId: paidOrderId,
        storeName: storeName,
        tableNumber: actualTableNumber,
        customerName: '게스트',
        itemCount: orderData.items ? orderData.items.length : 0,
        totalAmount: orderData.total,
        source: 'TLL_GUEST'
      });
    }

    res.json({
      success: true,
      message: '비회원 결제가 완료되었습니다',
      result: {
        orderId: orderId,
        paidOrderId: paidOrderId,
        finalTotal: finalTotal,
        storeId: storeId,
        storeName: storeName,
        isGuest: true
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('비회원 결제 처리 실패:', error);
    res.status(500).json({ error: '비회원 결제 처리 실패: ' + error.message });
  } finally {
    client.release();
  }
});

// 결제 처리 API (TL회원용)
router.post('/pay', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      userId,
      storeId,
      storeName,
      tableNumber,
      orderData,
      usedPoint = 0,
      finalTotal,
      selectedCouponId,
      couponDiscount = 0,
      // PG 결제 정보 추가
      pgPaymentKey,
      pgOrderId,
      pgPaymentMethod = 'CARD'
    } = req.body;

    const pgPaymentInfo = pgPaymentKey ? JSON.stringify({
      pgPaymentKey,
      pgOrderId,
      pgPaymentMethod,
      provider: 'toss'
    }) : null;

    console.log('💳 결제 처리 요청:', {
      userId,
      storeId,
      storeName,
      tableNumber,
      orderTotal: orderData?.total,
      usedPoint,
      finalTotal,
      pgPaymentKey,
      pgOrderId,
      pgPaymentMethod
    });

    await client.query('BEGIN');

    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = userResult.rows[0];
    const currentCoupons = user.coupons || { unused: [], used: [] };

    // 매장별 포인트 사용 검증
    let userStorePoints = 0;
    if (usedPoint > 0) {
      try {
        const storePointsResult = await client.query(`
          SELECT points FROM user_store_stats
          WHERE user_id = $1 AND store_id = $2
        `, [userId, storeId]);

        userStorePoints = storePointsResult.rows[0]?.points || 0;

        if (usedPoint > userStorePoints) {
          return res.status(400).json({
            error: '해당 매장의 보유 포인트가 부족합니다',
            storePoints: userStorePoints,
            requestedPoint: usedPoint
          });
        }
      } catch (error) {
        console.error('매장별 포인트 조회 실패:', error);
        return res.status(500).json({ error: '포인트 검증 중 오류가 발생했습니다' });
      }
    }

    let usedCoupon = null;
    if (selectedCouponId) {
      usedCoupon = currentCoupons.unused.find(c => c.id == selectedCouponId);
      if (!usedCoupon) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: '유효하지 않은 쿠폰입니다' });
      }
    }

    const originalAmount = orderData.total;

    const appliedPoint = Math.min(usedPoint, userStorePoints, originalAmount);
    const finalAmount = originalAmount - (couponDiscount || 0) - appliedPoint;
    const earnedPoint = Math.floor(originalAmount * 0.1);

    let newCoupons = { ...currentCoupons };
    if (usedCoupon) {
      const unusedIndex = newCoupons.unused.findIndex(c => c.id == selectedCouponId);
      if (unusedIndex !== -1) {
        const movedCoupon = newCoupons.unused.splice(unusedIndex, 1)[0];
        newCoupons.used.push(movedCoupon);
      }
    }

    // 첫 주문 여부 확인 (paid_orders 테이블에서)
    const orderCountResult = await client.query(
      'SELECT COUNT(*) as order_count FROM paid_orders WHERE user_id = $1',
      [userId]
    );
    const isFirstOrder = parseInt(orderCountResult.rows[0].order_count) === 0;

    let welcomeCoupon = null;
    if (isFirstOrder) {
      const today = new Date();
      const expireDate = new Date(today);
      expireDate.setDate(today.getDate() + 14);

      welcomeCoupon = {
        id: Math.floor(Math.random() * 100000),
        name: "첫 주문 10% 할인",
        type: "welcome",
        discountType: "percent",
        discountValue: 10,
        minOrderAmount: 5000,
        validUntil: expireDate.toISOString().slice(0, 10),
        issuedAt: today.toISOString().slice(0, 10)
      };

      newCoupons.unused.push(welcomeCoupon);
    }

    // users 테이블에서 쿠폰만 업데이트
    await client.query(
      'UPDATE users SET coupons = $1 WHERE id = $2',
      [JSON.stringify(newCoupons), userId]
    );

    // 테이블 정보 처리
    let tableUniqueId = null;
    let actualTableNumber = null;

    if (tableNumber && storeId) {
      try {
        const tableNumMatch = tableNumber.toString().match(/\d+/);
        const tableNum = tableNumMatch ? parseInt(tableNumMatch[0]) : null;

        if (tableNum) {
          const tableResult = await client.query(`
            SELECT unique_id, table_number, table_name
            FROM store_tables
            WHERE store_id = $1 AND table_number = $2
          `, [storeId, tableNum]);

          if (tableResult.rows.length > 0) {
            const table = tableResult.rows[0];
            tableUniqueId = table.unique_id;
            actualTableNumber = table.table_number;
          } else {
            actualTableNumber = tableNum;
          }
        } else {
          actualTableNumber = tableNumber;
        }
      } catch (error) {
        console.error(`❌ 테이블 정보 조회 실패:`, error);
        actualTableNumber = tableNumber;
      }
    }

    // 🆕 동일 테이블의 기존 주문 확인 (24시간 내)
    if (actualTableNumber) {
      const existingOrdersResult = await client.query(`
        SELECT p.user_id, p.guest_phone, u.name as user_name, p.payment_date
        FROM paid_orders p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.store_id = $1 AND p.table_number = $2
        AND p.payment_date >= NOW() - INTERVAL '24 hours'
        ORDER BY p.payment_date DESC
        LIMIT 1
      `, [storeId, actualTableNumber]);

      console.log(`🔍 TLL 주문 - 테이블 ${actualTableNumber} 기존 주문 확인:`,
        existingOrdersResult.rows.length > 0 ? existingOrdersResult.rows[0] : '없음');

      // 다른 사용자의 기존 주문이 있다면 해당 orders를 완료 처리
      if (existingOrdersResult.rows.length > 0) {
        const existingOrder = existingOrdersResult.rows[0];
        if (existingOrder.user_id !== userId || existingOrder.guest_phone) {
          await client.query(`
            UPDATE orders
            SET cooking_status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP
            WHERE paid_order_id IN (
              SELECT id FROM paid_orders
              WHERE store_id = $1 AND table_number = $2
              AND payment_date >= NOW() - INTERVAL '24 hours'
              AND (user_id != $3 OR user_id IS NULL)
            )
            AND cooking_status != 'COMPLETED'
          `, [storeId, actualTableNumber, userId]);

          console.log(`🗄️ TLL 주문 - 테이블 ${actualTableNumber}의 기존 다른 사용자 주문들의 제조 상태를 완료 처리`);
        } else {
          console.log(`✅ TLL 주문 - 동일 사용자의 추가 주문으로 기존 주문과 통합 처리`);
        }
      }
    }

    // TL회원은 user_paid_orders 테이블 사용 (payment_reference 컬럼 있음)
    const insertQuery = `
      INSERT INTO user_paid_orders (
        user_id, store_id, table_number, order_data, original_amount,
        used_point, coupon_discount, final_amount, payment_method,
        payment_status, order_source, payment_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, created_at
    `;

    const userPaidOrderResult = await client.query(insertQuery, [
      userId, storeId, actualTableNumber,
      JSON.stringify({
        ...orderData,
        storeId: storeId,
        storeName: storeName,
        tableNumber: tableNumber
      }),
      originalAmount,
      appliedPoint,
      couponDiscount || 0,
      finalAmount,
      pgPaymentMethod || 'CARD',
      'completed',
      'TLL',
      pgPaymentInfo
    ]);

    const userPaidOrderId = userPaidOrderResult.rows[0].id;

    console.log(`✅ TL회원 결제 정보 ID ${userPaidOrderId} user_paid_orders 테이블에 저장 완료`);

    // orders 테이블에 KDS용 제조 정보 저장 (user_paid_order_id 참조)
    const orderResult = await client.query(`
      INSERT INTO orders (
        user_paid_order_id, store_id, table_number, customer_name,
        order_data, total_amount, cooking_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      userPaidOrderId,       // user_paid_order_id 참조
      storeId,
      actualTableNumber,
      user.name || '손님',
      JSON.stringify({
        items: orderData.items,
        storeId: storeId,
        storeName: storeName,
        tableNumber: tableNumber
      }),
      orderData.total,
      'PENDING'
    ]);

    const orderId = orderResult.rows[0].id;
    console.log(`✅ TL회원 제조 정보 ID ${orderId} orders 테이블에 저장 완료`);

    // order_items 테이블에 메뉴별 데이터 저장
    if (orderData.items && orderData.items.length > 0) {
      for (const item of orderData.items) {
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
      console.log(`✅ TL회원 주문 ID ${orderId}의 메뉴 아이템들을 order_items에 저장 완료`);
    }

    // 매장별 포인트 사용분 차감 처리
    if (appliedPoint > 0) { // appliedPoint 사용
      await client.query(`
        UPDATE user_store_stats
        SET points = points - $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND store_id = $3
      `, [appliedPoint, userId, storeId]);
      console.log(`💰 매장 ${storeId}에서 포인트 ${appliedPoint}원 차감 완료`);
    }

    // 포인트 적립 처리
    try {
      await client.query(
        'SELECT update_user_store_stats($1, $2, $3, $4)',
        [userId, storeId, originalAmount, new Date()] // originalAmount 사용
      );
      console.log(`🎉 매장 ${storeId}에서 ${earnedPoint}원 포인트 적립 완료`);
    } catch (pointError) {
      console.error('⚠️ 포인트 적립 실패:', pointError);
    }

    // 🆕 결제 완료 후 테이블 자동 점유 처리
    if (tableUniqueId && actualTableNumber) {
      try {
        const occupiedTime = new Date();

        console.log(`🔍 [ORDER] 테이블 점유 처리 시작: unique_id=${tableUniqueId}, tableNumber=${actualTableNumber}, storeId=${storeId}`);

        const updateResult = await client.query(`
          UPDATE store_tables
          SET is_occupied = $1, occupied_since = $2, auto_release_source = $3
          WHERE unique_id = $4
          RETURNING *
        `, [true, occupiedTime, 'ORDER', tableUniqueId]);

        if (updateResult.rows.length > 0) {
          console.log(`✅ [ORDER] 테이블 ${actualTableNumber} 점유 처리 완료`);
        }

        // 주문 완료 후 3분 뒤 자동 해제 스케줄링
        setTimeout(async () => {
          try {
            console.log(`🕐 [ORDER] 테이블 ${actualTableNumber} 3분 자동 해제 체크 시작`);

            const tableResult = await pool.query(`
              SELECT * FROM store_tables
              WHERE unique_id = $1 AND is_occupied = true AND auto_release_source = 'ORDER'
            `, [tableUniqueId]);

            if (tableResult.rows.length > 0) {
              const currentTable = tableResult.rows[0];
              const occupiedSince = new Date(currentTable.occupied_since);
              const now = new Date();
              const diffMinutes = Math.floor((now - occupiedSince) / (1000 * 60));

              if (diffMinutes >= 3) {
                await pool.query(`
                  UPDATE store_tables
                  SET is_occupied = $1, occupied_since = $2, auto_release_source = $3
                  WHERE unique_id = $4
                `, [false, null, null, tableUniqueId]);

                console.log(`✅ [ORDER] 테이블 ${actualTableNumber} 3분 후 자동 해제 완료`);
              }
            }
          } catch (error) {
            console.error('❌ [ORDER] 테이블 자동 해제 실패:', error);
          }
        }, 3 * 60 * 1000);

      } catch (tableError) {
        console.error('❌ [ORDER] 테이블 점유 처리 실패:', tableError);
      }
    }

    await client.query('COMMIT');

    const items = orderData.items; // items 변수 정의
    const customerName = user.name || '손님'; // customerName 변수 정의

    // 📡 KDS 실시간 업데이트 전송
    try {
      if (global.kdsWebSocket) {
        console.log(`📡 TL회원 주문 ${orderId} KDS 실시간 업데이트 전송 - 매장 ${storeId}`);
        global.kdsWebSocket.broadcast(storeId, 'new-order', {
          orderId: orderId,
          paidOrderId: userPaidOrderId,
          storeName: storeName,
          tableNumber: parseInt(tableNumber),
          customerName: customerName,
          itemCount: items.length,
          totalAmount: finalTotal,
          source: 'TLL',
          orderItems: items.map(item => ({
            name: item.name,
            quantity: item.qty || item.quantity || 1,
            price: item.price,
            cookingStatus: 'PENDING'
          })),
          orderTime: new Date().toISOString(),
          paymentMethod: pgPaymentMethod || 'CARD'
        });
      }
    } catch (wsError) {
      console.error('❌ KDS WebSocket 브로드캐스트 실패:', wsError);
    }

    // POS 실시간 새 주문 알림
    try {
      // 📡 TL회원 주문 실시간 알림 전송 (POS)
      if (global.posWebSocket) {
        console.log(`📡 TL회원 주문 ${orderId} POS 실시간 알림 전송`);

        // 새 주문 알림
        global.posWebSocket.broadcast(storeId, 'new-order', {
          orderId: orderId,
          userPaidOrderId: userPaidOrderId,
          storeName: storeName,
          tableNumber: parseInt(tableNumber),
          customerName: customerName,
          itemCount: items.length,
          totalAmount: finalTotal,
          source: 'TLL',
          orderItems: items.map(item => ({
            name: item.name,
            quantity: item.qty || item.quantity || 1,
            price: item.price
          }))
        });

        // 테이블 상태 업데이트
        global.posWebSocket.broadcastTableUpdate(storeId, {
          tableNumber: parseInt(tableNumber),
          isOccupied: true,
          source: 'TLL',
          occupiedSince: new Date().toISOString(),
          customerInfo: {
            name: customerName,
            orderCount: 1
          }
        });
      }
    } catch (wsError) {
      console.error('❌ POS WebSocket 브로드캐스트 실패:', wsError);
    }

    res.json({
      success: true,
      message: '결제가 완료되었습니다',
      result: {
        orderId: orderId,
        userPaidOrderId: userPaidOrderId,
        appliedPoint: appliedPoint,
        earnedPoint: earnedPoint,
        finalTotal: finalTotal,
        totalDiscount: appliedPoint + (couponDiscount || 0),
        welcomeCoupon: welcomeCoupon,
        storeId: storeId,
        storeName: storeName,
        tableOccupied: tableUniqueId ? true : false
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('결제 처리 실패:', error);
    res.status(500).json({ error: '결제 처리 실패: ' + error.message });
  } finally {
    client.release();
  }
});

// 매장별 주문 내역 조회 API (paid_orders + user_paid_orders 통합)
router.get('/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status, limit = 100 } = req.query;

    console.log(`📋 매장 ${storeId} 주문 내역 조회 (제한: ${limit}개, 상태: ${status || '전체'})`);

    // TL회원 주문과 비회원 주문을 UNION으로 통합 조회
    let memberQuery = `
      SELECT
        upo.id, upo.store_id, upo.user_id, NULL as guest_phone, upo.table_number,
        upo.order_data, upo.original_amount, upo.used_point, upo.coupon_discount,
        upo.final_amount, upo.payment_status, upo.payment_date, upo.order_source,
        upo.created_at, u.name as customer_name, u.phone as customer_phone,
        s.name as store_name, 'TL_MEMBER' as order_type
      FROM user_paid_orders upo
      LEFT JOIN users u ON upo.user_id = u.id
      LEFT JOIN stores s ON upo.store_id = s.id
      WHERE upo.store_id = $1
    `;

    let guestQuery = `
      SELECT
        p.id, p.store_id, NULL as user_id, p.guest_phone, p.table_number,
        p.order_data, p.original_amount, p.used_point, p.coupon_discount,
        p.final_amount, p.payment_status, p.payment_date, p.order_source,
        p.created_at, '게스트' as customer_name, p.guest_phone as customer_phone,
        s.name as store_name, 'GUEST' as order_type
      FROM paid_orders p
      LEFT JOIN stores s ON p.store_id = s.id
      WHERE p.store_id = $1 AND p.user_id IS NULL AND p.guest_phone IS NOT NULL
    `;

    const params = [parseInt(storeId)];
    let paramIndex = 2;

    if (status) {
      memberQuery += ` AND upo.payment_status = $${paramIndex}`;
      guestQuery += ` AND p.payment_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const unionQuery = `
      (${memberQuery})
      UNION ALL
      (${guestQuery})
      ORDER BY payment_date DESC
      LIMIT $${paramIndex}
    `;
    params.push(parseInt(limit));

    const result = await pool.query(unionQuery, params);

    const orders = result.rows.map(row => ({
      id: row.id,
      storeId: row.store_id,
      storeName: row.store_name,
      userId: row.user_id,
      guestPhone: row.guest_phone,
      customerName: row.customer_name || '알 수 없음',
      customerPhone: row.customer_phone || '정보없음',
      tableNumber: row.table_number,
      orderData: row.order_data,
      originalAmount: row.original_amount,
      usedPoint: row.used_point || 0,
      couponDiscount: row.coupon_discount || 0,
      finalAmount: row.final_amount,
      paymentStatus: row.payment_status,
      paymentDate: row.payment_date,
      orderSource: row.order_source,
      createdAt: row.created_at,
      orderType: row.order_type,
      isMember: row.order_type === 'TL_MEMBER'
    }));

    console.log(`✅ 매장 ${storeId} 통합 주문 내역 ${orders.length}개 조회 완료 (TL회원+비회원)`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      total: orders.length,
      orders: orders,
      stats: {
        memberOrders: orders.filter(o => o.isMember).length,
        guestOrders: orders.filter(o => !o.isMember).length
      }
    });

  } catch (error) {
    console.error('❌ 매장 주문 내역 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 내역 조회 실패: ' + error.message
    });
  }
});

// 사용자별 주문 내역 조회 API (user_paid_orders 기반)
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`📋 사용자 ${userId} 주문 내역 조회 (최대 ${limit}개) - user_paid_orders 테이블 사용`);

    const ordersResult = await pool.query(`
      SELECT
        upo.id,
        upo.store_id,
        s.name as store_name,
        s.category as store_category,
        upo.order_data,
        upo.original_amount,
        upo.used_point,
        upo.coupon_discount,
        upo.final_amount,
        upo.payment_status,
        upo.payment_method,
        upo.payment_date,
        upo.order_source,
        upo.created_at,
        upo.table_number
      FROM user_paid_orders upo
      LEFT JOIN stores s ON upo.store_id = s.id
      WHERE upo.user_id = $1 AND upo.payment_status = 'completed'
      ORDER BY upo.payment_date DESC
      LIMIT $2
    `, [userId, parseInt(limit)]);

    const orders = ordersResult.rows.map(order => ({
      id: order.id,
      store_id: order.store_id,
      store_name: order.store_name || '매장 정보 없음',
      store_category: order.store_category,
      order_data: order.order_data,
      total_amount: order.original_amount,
      used_point: order.used_point || 0,
      coupon_discount: order.coupon_discount || 0,
      final_amount: order.final_amount,
      order_status: order.payment_status,
      payment_method: order.payment_method,
      order_source: order.order_source,
      order_date: order.payment_date,
      created_at: order.created_at,
      table_number: order.table_number
    }));

    console.log(`📦 사용자 ${userId}의 user_paid_orders 주문 수: ${orders.length}개`);

    res.json({
      success: true,
      orders: orders,
      totalCount: orders.length,
      source: 'user_paid_orders'
    });

  } catch (error) {
    console.error('❌ 사용자 주문 내역 조회 실패 (user_paid_orders):', error);
    res.status(500).json({
      success: false,
      error: '주문 내역 조회 실패: ' + error.message
    });
  }
});

// KDS용 매장별 주문 조회 API (orders + order_items)
router.get('/kds/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`📟 KDS - 매장 ${storeId} 주문 조회`);

    // 조리가 완료되지 않은 orders 조회 (user_paid_orders와 paid_orders 모두 지원)
    const query = `
      SELECT
        o.id as order_id, o.paid_order_id, o.user_paid_order_id,
        o.store_id, o.table_number, o.customer_name, o.order_data,
        o.total_amount, o.cooking_status, o.started_at, o.completed_at, o.created_at,
        COALESCE(upo.user_id, p.user_id) as user_id,
        p.guest_phone,
        COALESCE(upo.payment_date, p.payment_date) as payment_date,
        COALESCE(upo.order_source, p.order_source) as order_source,
        s.name as store_name
      FROM orders o
      LEFT JOIN paid_orders p ON o.paid_order_id = p.id
      LEFT JOIN user_paid_orders upo ON o.user_paid_order_id = upo.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.store_id = $1
      AND o.cooking_status IN ('PENDING', 'COOKING', 'OPEN')
      AND (o.is_visible IS NULL OR o.is_visible = true)
      ORDER BY
        CASE
          WHEN o.cooking_status = 'OPEN' THEN 1
          WHEN o.cooking_status = 'PENDING' THEN 2
          WHEN o.cooking_status = 'COOKING' THEN 3
          ELSE 4
        END,
        o.created_at ASC
    `;

    const result = await pool.query(query, [parseInt(storeId)]);

    const orders = [];

    for (const row of result.rows) {
      // 각 주문의 order_items 조회
      const itemsResult = await pool.query(`
        SELECT id, menu_name, quantity, price, cooking_status, started_at, completed_at
        FROM order_items
        WHERE order_id = $1
        ORDER BY created_at ASC
      `, [row.order_id]);

      const orderTime = new Date(row.created_at);
      const now = new Date();
      const waitingMinutes = Math.floor((now - orderTime) / (1000 * 60));

      const items = itemsResult.rows;
      const pendingItems = items.filter(item => item.cooking_status === 'PENDING');
      const cookingItems = items.filter(item => item.cooking_status === 'COOKING');
      const completedItems = items.filter(item => item.cooking_status === 'COMPLETED');

      // POS OPEN 상태 주문의 경우 특별 처리
      const displayStatus = row.cooking_status === 'OPEN' ? 'PENDING' : row.cooking_status;
      const isPOSOrder = !row.paid_order_id || row.order_source === 'POS';

      orders.push({
        id: row.order_id,
        paidOrderId: row.paid_order_id,
        storeId: row.store_id,
        storeName: row.store_name,
        userId: row.user_id,
        guestPhone: row.guest_phone,
        customerName: row.customer_name || (isPOSOrder ? 'POS 주문' : '손님'),
        tableNumber: row.table_number || '배달',
        orderData: row.order_data,
        totalAmount: row.total_amount,
        cookingStatus: displayStatus,
        paymentDate: row.payment_date || row.created_at,
        createdAt: row.created_at,
        orderDate: row.created_at, // KDS 호환성을 위해 추가
        waitingMinutes: waitingMinutes,
        items: items,
        pendingCount: pendingItems.length,
        cookingCount: cookingItems.length,
        completedCount: completedItems.length,
        isUrgent: waitingMinutes > 15,
        orderSource: row.order_source || (isPOSOrder ? 'POS' : 'TLL'),
        isPOSOrder: isPOSOrder
      });
    }

    console.log(`✅ KDS - 매장 ${storeId} 주문 ${orders.length}개 조회 완료`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      orders: orders,
      totalOrders: orders.length
    });

  } catch (error) {
    console.error('❌ KDS 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 주문 조회 실패: ' + error.message
    });
  }
});

// 개별 메뉴 아이템 조리 시작 API
router.put('/items/:itemId/start-cooking', async (req, res) => {
  try {
    const { itemId } = req.params;

    console.log(`🍳 메뉴 아이템 ${itemId} 조리 시작`);

    const result = await pool.query(`
      UPDATE order_items
      SET cooking_status = 'COOKING', started_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND cooking_status = 'PENDING'
      RETURNING *
    `, [parseInt(itemId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '메뉴 아이템을 찾을 수 없거나 이미 조리가 시작되었습니다'
      });
    }

    const updatedItem = result.rows[0];
    console.log(`✅ 메뉴 아이템 ${itemId} 조리 시작 완료: ${updatedItem.menu_name}`);

    // 📡 KDS 실시간 업데이트 전송
    if (global.kdsWebSocket && updatedItem.order_id) {
      const orderResult = await pool.query(`
        SELECT o.store_id FROM orders o WHERE o.id = $1
      `, [updatedItem.order_id]);

      if (orderResult.rows.length > 0) {
        const storeId = orderResult.rows[0].store_id;
        global.kdsWebSocket.broadcast(storeId, 'cooking-started', {
          itemId: updatedItem.id,
          orderId: updatedItem.order_id,
          menuName: updatedItem.menu_name,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      item: updatedItem,
      message: `${updatedItem.menu_name} 조리를 시작했습니다`
    });

  } catch (error) {
    console.error('❌ 조리 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: '조리 시작 처리 실패'
    });
  }
});

// 개별 메뉴 아이템 조리 완료 API
router.put('/items/:itemId/complete-cooking', async (req, res) => {
  try {
    const { itemId } = req.params;

    console.log(`✅ 메뉴 아이템 ${itemId} 조리 완료`);

    const result = await pool.query(`
      UPDATE order_items
      SET cooking_status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND cooking_status = 'COOKING'
      RETURNING *
    `, [parseInt(itemId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '메뉴 아이템을 찾을 수 없거나 조리 중 상태가 아닙니다'
      });
    }

    const completedItem = result.rows[0];
    console.log(`✅ 메뉴 아이템 ${itemId} 조리 완료: ${completedItem.menu_name}`);

    // 📡 KDS 실시간 업데이트 전송
    if (global.kdsWebSocket && completedItem.order_id) {
      const orderResult = await pool.query(`
        SELECT o.store_id FROM orders o WHERE o.id = $1
      `, [completedItem.order_id]);

      if (orderResult.rows.length > 0) {
        const storeId = orderResult.rows[0].store_id;
        global.kdsWebSocket.broadcast(storeId, 'cooking-completed', {
          itemId: completedItem.id,
          orderId: completedItem.order_id,
          menuName: completedItem.menu_name,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      item: completedItem,
      message: `${completedItem.menu_name} 조리가 완료되었습니다`
    });

  } catch (error) {
    console.error('❌ 조리 완료 실패:', error);
    res.status(500).json({
      success: false,
      error: '조리 완료 처리 실패'
    });
  }
});

// 주문 전체 조리 시작 API
router.put('/:orderId/start-cooking', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`🍳 주문 ${orderId} 전체 조리 시작`);

    const result = await pool.query(`
      UPDATE order_items
      SET cooking_status = 'COOKING', started_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 AND cooking_status = 'PENDING'
      RETURNING *
    `, [parseInt(orderId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '조리 시작할 메뉴가 없습니다'
      });
    }

    // orders 테이블도 업데이트
    await pool.query(`
      UPDATE orders
      SET cooking_status = 'COOKING', started_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [parseInt(orderId)]);

    console.log(`✅ 주문 ${orderId}의 메뉴 ${result.rows.length}개 조리 시작 완료`);

    // 📡 KDS 실시간 업데이트 전송
    if (global.kdsWebSocket) {
      const orderResult = await pool.query('SELECT store_id FROM orders WHERE id = $1', [orderId]);
      if (orderResult.rows.length > 0) {
        const storeId = orderResult.rows[0].store_id;
        global.kdsWebSocket.broadcast(storeId, 'order-cooking-started', {
          orderId: orderId,
          itemCount: result.rows.length,
          items: result.rows.map(item => ({
            itemId: item.id,
            menuName: item.menu_name
          })),
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      updatedItems: result.rows,
      message: `주문 #${orderId}의 모든 메뉴 조리를 시작했습니다`
    });

  } catch (error) {
    console.error('❌ 주문 조리 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 조리 시작 처리 실패'
    });
  }
});

// 주문 완료 API (KDS용)
router.put('/:orderId/complete', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`✅ 주문 ${orderId} 완료 처리 시작`);

    // 해당 주문의 모든 조리중인 아이템을 완료로 변경
    const result = await pool.query(`
      UPDATE order_items
      SET cooking_status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 AND cooking_status = 'COOKING'
      RETURNING *
    `, [parseInt(orderId)]);

    // orders 테이블도 완료로 업데이트
    await pool.query(`
      UPDATE orders
      SET cooking_status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [parseInt(orderId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '완료할 조리중인 메뉴가 없습니다'
      });
    }

    console.log(`✅ 주문 ${orderId}의 메뉴 ${result.rows.length}개 조리 완료`);

    // 📡 KDS 실시간 업데이트 전송
    if (global.kdsWebSocket) {
      const orderResult = await pool.query('SELECT store_id FROM orders WHERE id = $1', [orderId]);
      if (orderResult.rows.length > 0) {
        const storeId = orderResult.rows[0].store_id;
        global.kdsWebSocket.broadcast(storeId, 'order-completed', {
          orderId: orderId,
          itemCount: result.rows.length,
          items: result.rows.map(item => ({
            itemId: item.id,
            menuName: item.menu_name
          })),
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      completedItems: result.rows,
      message: `주문 #${orderId}이 완료되었습니다`
    });

  } catch (error) {
    console.error('❌ 주문 완료 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 완료 처리 실패'
    });
  }
});

// 주문별 리뷰 존재 여부 확인 (user_paid_orders 기반)
router.get('/:paidOrderId/review-status', async (req, res) => {
  try {
    const { paidOrderId } = req.params;

    console.log(`🔍 사용자 결제주문 ${paidOrderId}의 리뷰 존재 여부 확인 (user_paid_orders 기준)`);

    // orders 테이블을 통해서 리뷰 확인 (user_paid_order_id 대신 paid_order_id 사용)
    const result = await pool.query(`
      SELECT COUNT(r.*) as review_count 
      FROM reviews r
      JOIN orders o ON r.order_id = o.id
      WHERE o.user_paid_order_id = $1
    `, [paidOrderId]);

    const hasReview = parseInt(result.rows[0].review_count) > 0;

    console.log(`✅ 사용자 결제주문 ${paidOrderId} 리뷰 존재 여부: ${hasReview ? '있음' : '없음'}`);

    res.json({
      success: true,
      paidOrderId: paidOrderId,
      hasReview: hasReview,
      reviewCount: parseInt(result.rows[0].review_count),
      source: 'user_paid_orders'
    });

  } catch (error) {
    console.error('❌ 주문 리뷰 상태 확인 실패 (user_paid_orders):', error);
    res.status(500).json({
      success: false,
      error: '리뷰 상태 확인에 실패했습니다'
    });
  }
});


// 전화번호로 게스트 주문 내역 조회 API
router.get('/guest-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { limit = 20 } = req.query;

    console.log(`📱 전화번호 ${phone}로 게스트 주문 내역 조회`);

    // paid_orders 테이블에서 해당 전화번호의 주문 내역 조회
    const ordersResult = await pool.query(`
      SELECT
        p.id,
        p.store_id,
        s.name as store_name,
        p.order_data,
        p.original_amount,
        p.final_amount,
        p.payment_status,
        p.payment_date,
        p.order_source,
        p.table_number
      FROM paid_orders p
      LEFT JOIN stores s ON p.store_id = s.id
      WHERE p.guest_phone = $1
      ORDER BY p.payment_date DESC
      LIMIT $2
    `, [phone, parseInt(limit)]);

    // guests 테이블에서 방문 정보도 조회
    const guestInfoResult = await pool.query(`
      SELECT phone, visit_count, created_at, updated_at
      FROM guests
      WHERE phone = $1
    `, [phone]);

    const orders = ordersResult.rows.map(order => ({
      id: order.id,
      store_id: order.store_id,
      store_name: order.store_name,
      order_data: order.order_data,
      original_amount: order.original_amount,
      final_amount: order.final_amount,
      payment_status: order.payment_status,
      payment_date: order.payment_date,
      order_date: order.payment_date, // 호환성을 위해 추가
      order_source: order.order_source,
      table_number: order.table_number
    }));

    const guestInfo = guestInfoResult.rows.length > 0 ? guestInfoResult.rows[0] : null;

    console.log(`✅ 전화번호 ${phone}의 주문 내역 ${orders.length}건 조회 완료`);

    res.json({
      success: true,
      phone: phone,
      orders: orders,
      guestInfo: guestInfo,
      totalCount: orders.length,
      stats: {
        totalOrders: orders.length,
        totalAmount: orders.reduce((sum, order) => sum + (order.final_amount || 0), 0),
        latestOrderDate: orders.length > 0 ? orders[0].payment_date : null
      }
    });

  } catch (error) {
    console.error('❌ 전화번호 게스트 주문 내역 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 내역 조회 실패: ' + error.message
    });
  }
});

// TL회원 결제 내역 조회 (기존 paid_orders 테이블 사용)
router.post('/paid-orders', async (req, res) => {
  const client = await pool.connect();

  try {
    const { paymentKey, orderId, amount } = req.body;

    console.log('💰 paid_orders에서 결제 정보 조회:', { paymentKey, orderId, amount });

    // payment_reference에서 토스페이먼츠 정보로 주문 조회
    const orderResult = await client.query(`
      SELECT po.*, s.name as store_name
      FROM paid_orders po
      JOIN stores s ON po.store_id = s.id
      WHERE po.payment_reference->>'paymentKey' = $1
      AND po.payment_reference->>'orderId' = $2
      ORDER BY po.created_at DESC
      LIMIT 1
    `, [paymentKey, orderId]);

    if (orderResult.rows.length === 0) {
      console.error('❌ 결제 정보를 찾을 수 없음:', { paymentKey, orderId });
      return res.status(404).json({
        success: false,
        error: '결제 정보를 찾을 수 없습니다.'
      });
    }

    const order = orderResult.rows[0];
    console.log('✅ 결제 정보 조회 성공:', order.id);

    res.json({
      success: true,
      order: {
        id: order.id,
        storeName: order.store_name,
        orderData: order.order_data,
        originalAmount: order.original_amount,
        usedPoint: order.used_point,
        couponDiscount: order.coupon_discount,
        finalAmount: order.final_amount,
        paymentDate: order.created_at,
        paymentReference: order.payment_reference
      }
    });

  } catch (error) {
    console.error('❌ paid_orders 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '결제 정보 조회 중 오류가 발생했습니다.'
    });
  } finally {
    client.release();
  }
});

// TL회원 결제 내역 조회 (user_paid_orders)
router.post('/user-paid-orders', async (req, res) => {
  // This route is for fetching user_paid_orders, which is not modified in this change.
  // If you need to modify this as well, please provide specific instructions.
});

module.exports = router;