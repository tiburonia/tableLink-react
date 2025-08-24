const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 결제 처리 API (기존 /pay 엔드포인트 유지)
router.post('/pay', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      userId,
      storeId,
      storeName,
      tableNumber,
      orderData,
      usedPoint,
      finalTotal,
      selectedCouponId,
      couponDiscount
    } = req.body;

    console.log('💳 결제 처리 요청:', {
      userId,
      storeId,
      storeName,
      tableNumber,
      orderTotal: orderData?.total,
      usedPoint,
      finalTotal
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

    const appliedPoint = Math.min(usedPoint, userStorePoints, orderData.total); // userStorePoints 사용
    const finalAmount = orderData.total - (couponDiscount || 0) - appliedPoint;
    const earnedPoint = Math.floor(orderData.total * 0.1);

    // users 테이블의 포인트는 전체 통합 포인트로 유지, 매장별 포인트는 user_store_stats 에서 관리
    // const newPoint = user.point - appliedPoint + earnedPoint;

    let newCoupons = { ...currentCoupons };
    if (usedCoupon) {
      const unusedIndex = newCoupons.unused.findIndex(c => c.id == selectedCouponId);
      if (unusedIndex !== -1) {
        const movedCoupon = newCoupons.unused.splice(unusedIndex, 1)[0];
        newCoupons.used.push(movedCoupon);
      }
    }

    // 첫 주문 여부 확인 (orders 테이블에서)
    const orderCountResult = await client.query(
      'SELECT COUNT(*) as order_count FROM orders WHERE user_id = $1',
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

    // users 테이블에서 포인트와 쿠폰만 업데이트
    // user.point 업데이트 로직 제거, coupons만 업데이트
    await client.query(
      'UPDATE users SET coupons = $1 WHERE id = $2',
      [JSON.stringify(newCoupons), userId]
    );

    // 테이블 정보 처리
    let tableUniqueId = null;
    let actualTableNumber = null;

    if (tableNumber && storeId) {
      try {
        // 테이블 번호에서 숫자만 추출 (예: "테이블 5" -> 5)
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

    // 주문 데이터 저장
    const orderResult = await client.query(`
      INSERT INTO orders (
        user_id, store_id, table_number, order_data,
        total_amount, original_amount, used_point, coupon_discount, final_amount,
        order_status, order_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      userId,                 // $1
      storeId,               // $2
      actualTableNumber,     // $3
      JSON.stringify({       // $4
        ...orderData,
        storeId: storeId,
        storeName: storeName,
        tableNumber: tableNumber
      }),
      orderData.total,       // $5 - total_amount
      orderData.total,       // $6 - original_amount
      appliedPoint,          // $7 - used_point
      couponDiscount || 0,   // $8 - coupon_discount
      finalAmount,           // $9 - final_amount
      'completed',           // $10 - order_status
      new Date()            // $11 - order_date
    ]);

    const orderId = orderResult.rows[0].id;
    console.log(`✅ 주문 ID ${orderId} orders 테이블에 저장 완료`);

    // order_items 테이블에 메뉴별 조리 상태 데이터 저장
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
          'PENDING'  // 기본 상태는 조리 대기
        ]);
      }
      console.log(`✅ 주문 ID ${orderId}의 메뉴 아이템들을 order_items에 저장 완료`);
    }

    // 매장별 포인트 사용분 차감 처리
    if (usedPoint > 0) {
      await client.query(`
        UPDATE user_store_stats
        SET points = points - $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND store_id = $3
      `, [usedPoint, userId, storeId]);
      console.log(`💰 매장 ${storeId}에서 포인트 ${usedPoint}원 차감 완료`);
    }

    // 포인트 적립 처리 (단골 지표 업데이트)
    try {
      await client.query(
        'SELECT update_user_store_stats($1, $2, $3, $4)',
        [userId, storeId, orderData.total, new Date()]
      );
      console.log(`🎉 매장 ${storeId}에서 ${earnedPoint}원 포인트 적립 완료`);
    } catch (pointError) {
      console.error('⚠️ 포인트 적립 실패:', pointError);
      // 포인트 적립 실패해도 주문은 완료되도록 처리
    }

    // 🆕 결제 완료 후 테이블 자동 점유 처리
    if (tableUniqueId && actualTableNumber) {
      try {
        const occupiedTime = new Date();

        console.log(`🔍 [ORDER] 테이블 점유 처리 시작: unique_id=${tableUniqueId}, tableNumber=${actualTableNumber}, storeId=${storeId}`);

        // 현재 테이블 상태 확인
        const currentTableResult = await client.query(`
          SELECT * FROM store_tables WHERE unique_id = $1
        `, [tableUniqueId]);

        if (currentTableResult.rows.length === 0) {
          console.error(`❌ [ORDER] 테이블을 찾을 수 없음: unique_id=${tableUniqueId}`);
        } else {
          const currentTable = currentTableResult.rows[0];
          console.log(`📊 [ORDER] 현재 테이블 상태:`, {
            tableName: currentTable.table_name,
            isOccupied: currentTable.is_occupied,
            occupiedSince: currentTable.occupied_since,
            autoReleaseSource: currentTable.auto_release_source
          });
        }

        // 테이블을 점유 상태로 설정 (auto_release_source = 'ORDER')
        const updateResult = await client.query(`
          UPDATE store_tables
          SET is_occupied = $1, occupied_since = $2, auto_release_source = $3
          WHERE unique_id = $4
          RETURNING *
        `, [true, occupiedTime, 'ORDER', tableUniqueId]);

        if (updateResult.rows.length > 0) {
          const updatedTable = updateResult.rows[0];
          console.log(`✅ [ORDER] 테이블 ${actualTableNumber} 점유 처리 완료:`, {
            tableName: updatedTable.table_name,
            isOccupied: updatedTable.is_occupied,
            occupiedSince: updatedTable.occupied_since,
            autoReleaseSource: updatedTable.auto_release_source
          });
        } else {
          console.error(`❌ [ORDER] 테이블 점유 업데이트 실패: unique_id=${tableUniqueId}`);
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

              console.log(`📊 [ORDER] 테이블 ${actualTableNumber} 점유 시간: ${diffMinutes}분`);

              if (diffMinutes >= 3) {
                await pool.query(`
                  UPDATE store_tables
                  SET is_occupied = $1, occupied_since = $2, auto_release_source = $3
                  WHERE unique_id = $4
                `, [false, null, null, tableUniqueId]);

                console.log(`✅ [ORDER] 테이블 ${actualTableNumber} 3분 후 자동 해제 완료`);
              } else {
                console.log(`ℹ️ [ORDER] 테이블 ${actualTableNumber} 아직 3분 미만 (${diffMinutes}분)`);
              }
            } else {
              console.log(`ℹ️ [ORDER] 테이블 ${actualTableNumber} 이미 해제됨 또는 다른 소스로 변경됨`);
            }
          } catch (error) {
            console.error('❌ [ORDER] 테이블 자동 해제 실패:', error);
          }
        }, 3 * 60 * 1000); // 3분

      } catch (tableError) {
        console.error('❌ [ORDER] 테이블 점유 처리 실패:', tableError);
        console.error('❌ [ORDER] 상세 에러 정보:', {
          message: tableError.message,
          stack: tableError.stack,
          tableUniqueId: tableUniqueId,
          actualTableNumber: actualTableNumber,
          storeId: storeId
        });
        // 테이블 점유 실패해도 주문은 완료되도록 처리
      }
    } else {
      console.log(`ℹ️ [ORDER] 테이블 정보 없음: tableUniqueId=${tableUniqueId}, actualTableNumber=${actualTableNumber}`);
    }

    await client.query('COMMIT');

    // 📡 새 주문 KDS 실시간 업데이트 전송
    if (global.kdsWebSocket) {
      console.log(`📡 새 주문 ${orderId} KDS 실시간 업데이트 전송 - 매장 ${storeId}`);
      global.kdsWebSocket.broadcast(storeId, 'new-order', {
        orderId: orderId,
        storeName: storeName,
        tableNumber: actualTableNumber,
        customerName: user.name || '손님',
        itemCount: orderData.items ? orderData.items.length : 0,
        totalAmount: orderData.total
      });
    }

    res.json({
      success: true,
      message: '결제가 완료되었습니다',
      result: {
        orderId: orderResult.rows[0].id,
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

// 매장별 주문 내역 조회 API
router.get('/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status, limit = 100 } = req.query;

    console.log(`📋 매장 ${storeId} 주문 내역 조회 (제한: ${limit}개, 상태: ${status || '전체'})`);

    let query = `
      SELECT
        o.id, o.store_id, o.user_id, o.table_number, o.order_data,
        o.original_amount, o.used_point, o.coupon_discount, o.final_amount,
        o.order_status, o.order_date, o.created_at,
        u.name as customer_name, u.phone as customer_phone,
        s.name as store_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.store_id = $1
    `;

    const params = [parseInt(storeId)];

    if (status) {
      query += ` AND o.order_status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY o.order_date DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    const orders = result.rows.map(row => ({
      id: row.id,
      storeId: row.store_id,
      storeName: row.store_name,
      userId: row.user_id,
      customerName: row.customer_name || '알 수 없음',
      customerPhone: row.customer_phone || '정보없음',
      tableNumber: row.table_number,
      orderData: row.order_data,
      originalAmount: row.original_amount,
      usedPoint: row.used_point || 0,
      couponDiscount: row.coupon_discount || 0,
      finalAmount: row.final_amount,
      orderStatus: row.order_status,
      orderDate: row.order_date,
      createdAt: row.created_at
    }));

    console.log(`✅ 매장 ${storeId} 주문 내역 ${orders.length}개 조회 완료`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      total: orders.length,
      orders: orders
    });

  } catch (error) {
    console.error('❌ 매장 주문 내역 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 내역 조회 실패: ' + error.message
    });
  }
});

// 사용자별 주문 내역 조회 API
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`📋 사용자 ${userId} 주문 내역 조회 (최대 ${limit}개)`);

    // orders 테이블에서 주문 내역 조회
    const ordersResult = await pool.query(`
      SELECT
        o.id,
        o.store_id,
        s.name as store_name,
        o.order_data,
        o.total_amount,
        o.final_amount,
        o.order_status,
        o.order_date,
        o.created_at,
        o.table_number
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.user_id = $1
      ORDER BY o.order_date DESC
      LIMIT $2
    `, [userId, limit]);

    const orders = ordersResult.rows.map(order => ({
      id: order.id,
      store_id: order.store_id,
      store_name: order.store_name,
      order_data: order.order_data,
      total_amount: order.total_amount,
      final_amount: order.final_amount,
      order_status: order.order_status,
      order_date: order.order_date,
      created_at: order.created_at,
      table_number: order.table_number
    }));

    console.log(`📦 사용자 ${userId}의 주문 수: ${orders.length}개`);

    res.json({
      success: true,
      orders: orders,
      totalCount: orders.length
    });

  } catch (error) {
    console.error('❌ 사용자 주문 내역 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 내역 조회 실패: ' + error.message
    });
  }
});

// 마이페이지용 사용자별 주문 내역 조회 API (별도 엔드포인트)
router.get('/mypage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`📋 마이페이지 - 사용자 ${userId} 주문 내역 조회 (최대 ${limit}개)`);

    const ordersResult = await pool.query(`
      SELECT
        o.id,
        o.store_id,
        s.name as store_name,
        o.order_data,
        o.total_amount,
        o.final_amount,
        o.order_status,
        o.order_date,
        o.table_number
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.user_id = $1
      ORDER BY o.order_date DESC
      LIMIT $2
    `, [userId, limit]);

    const orders = ordersResult.rows.map(order => ({
      id: order.id,
      store_id: order.store_id,
      store_name: order.store_name,
      order_data: order.order_data,
      total_amount: order.total_amount,
      final_amount: order.final_amount,
      order_status: order.order_status,
      order_date: order.order_date,
      table_number: order.table_number
    }));

    console.log(`📦 마이페이지 - 사용자 ${userId}의 주문 수: ${orders.length}개`);

    res.json({
      success: true,
      orders: orders,
      totalCount: orders.length
    });

  } catch (error) {
    console.error('❌ 마이페이지 주문 내역 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 내역 조회 실패: ' + error.message
    });
  }
});

// 최근 주문 조회 API (TLM용)
router.get('/recent/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const limit = req.query.limit || 5;

    console.log(`📋 매장 ${storeId} 최근 주문 조회 (최대 ${limit}개)`);

    const result = await pool.query(`
      SELECT
        o.id, o.table_number, o.final_amount, o.order_date, o.order_status,
        o.order_data, u.name as customer_name, s.name as store_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.store_id = $1
      ORDER BY o.order_date DESC
      LIMIT $2
    `, [storeId, limit]);

    const orders = result.rows.map(row => ({
      id: row.id,
      table_number: row.table_number,
      final_amount: row.final_amount,
      order_date: row.order_date,
      order_status: row.order_status,
      customer_name: row.customer_name,
      order_data: row.order_data,
      store_name: row.store_name
    }));

    console.log(`✅ 매장 ${storeId} 최근 주문 ${orders.length}개 조회 완료`);

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('❌ 최근 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '최근 주문 조회 실패'
    });
  }
});

// 전체 주문 조회 API (TLM용)
router.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const limit = req.query.limit || 50;

    console.log(`📋 매장 ${storeId} 전체 주문 조회 (최대 ${limit}개)`);

    const result = await pool.query(`
      SELECT
        o.id, o.table_number, o.final_amount, o.order_date, o.order_status,
        o.order_data, u.name as customer_name, s.name as store_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.store_id = $1
      ORDER BY o.order_date DESC
      LIMIT $2
    `, [parseInt(storeId), limit]);

    const orders = result.rows.map(row => ({
      id: row.id,
      table_number: row.table_number,
      final_amount: row.final_amount,
      order_date: row.order_date,
      order_status: row.order_status,
      customer_name: row.customer_name,
      order_data: row.order_data,
      store_name: row.store_name
    }));

    console.log(`✅ 매장 ${storeId} 전체 주문 ${orders.length}개 조회 완료`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      total: orders.length,
      orders: orders
    });

  } catch (error) {
    console.error('❌ 전체 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '전체 주문 조회 실패: ' + error.message
    });
  }
});

// 주문 상태 업데이트 API (TLM용)
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`📝 주문 ${orderId} 상태 업데이트: ${status}`);

    const result = await pool.query(`
      UPDATE orders
      SET order_status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, parseInt(orderId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    console.log(`✅ 주문 ${orderId} 상태 업데이트 완료: ${status}`);

    res.json({
      success: true,
      order: result.rows[0],
      message: `주문 상태가 ${status}로 변경되었습니다`
    });

  } catch (error) {
    console.error('❌ 주문 상태 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 상태 업데이트 실패'
    });
  }
});

// 주문별 리뷰 존재 여부 확인
router.get('/:orderId/review-status', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`🔍 주문 ${orderId}의 리뷰 존재 여부 확인`);

    const result = await pool.query(
      'SELECT COUNT(*) as review_count FROM reviews WHERE order_id = $1',
      [orderId]
    );

    const hasReview = parseInt(result.rows[0].review_count) > 0;

    console.log(`✅ 주문 ${orderId} 리뷰 존재 여부: ${hasReview ? '있음' : '없음'}`);

    res.json({
      success: true,
      orderId: orderId,
      hasReview: hasReview,
      reviewCount: parseInt(result.rows[0].review_count)
    });

  } catch (error) {
    console.error('❌ 주문 리뷰 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '리뷰 상태 확인에 실패했습니다'
    });
  }
});

// KDS용 매장별 주문 조회 API (order_items 포함)
router.get('/kds/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`📟 KDS - 매장 ${storeId} 주문 조회`);

    // 조리가 완료되지 않은 order_items가 있는 주문들만 조회
    const query = `
      SELECT DISTINCT
        o.id, o.store_id, o.user_id, o.table_number, o.order_data,
        o.original_amount, o.used_point, o.coupon_discount, o.final_amount,
        o.order_status, o.order_date, o.created_at,
        u.name as customer_name, u.phone as customer_phone,
        s.name as store_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE o.store_id = $1
      AND oi.cooking_status IN ('PENDING', 'COOKING')
      ORDER BY o.order_date ASC
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
      `, [row.id]);

      const orderTime = new Date(row.order_date);
      const now = new Date();
      const waitingMinutes = Math.floor((now - orderTime) / (1000 * 60));

      // 전체 아이템 중 조리 상태별 분류
      const items = itemsResult.rows;
      const pendingItems = items.filter(item => item.cooking_status === 'PENDING');
      const cookingItems = items.filter(item => item.cooking_status === 'COOKING');
      const completedItems = items.filter(item => item.cooking_status === 'COMPLETED');

      // 주문 전체 상태 결정
      let overallStatus = 'PENDING';
      if (cookingItems.length > 0) {
        overallStatus = 'COOKING';
      }
      if (pendingItems.length === 0 && cookingItems.length === 0) {
        overallStatus = 'COMPLETED';
      }

      orders.push({
        id: row.id,
        storeId: row.store_id,
        storeName: row.store_name,
        userId: row.user_id,
        customerName: row.customer_name || '손님',
        customerPhone: row.customer_phone || '',
        tableNumber: row.table_number || '배달',
        orderData: row.order_data,
        originalAmount: row.original_amount,
        usedPoint: row.used_point || 0,
        couponDiscount: row.coupon_discount || 0,
        finalAmount: row.final_amount,
        orderDate: row.order_date,
        createdAt: row.created_at,
        waitingMinutes: waitingMinutes,
        overallStatus: overallStatus,
        items: items,
        pendingCount: pendingItems.length,
        cookingCount: cookingItems.length,
        completedCount: completedItems.length,
        isUrgent: waitingMinutes > 15
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
      const orderResult = await pool.query('SELECT store_id FROM orders WHERE id = $1', [updatedItem.order_id]);
      if (orderResult.rows.length > 0) {
        const storeId = orderResult.rows[0].store_id;
        console.log(`📡 메뉴 아이템 ${updatedItem.id} 조리 시작 - KDS 실시간 업데이트 전송 (매장 ${storeId})`);
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
      const orderResult = await pool.query('SELECT store_id FROM orders WHERE id = $1', [completedItem.order_id]);
      if (orderResult.rows.length > 0) {
        const storeId = orderResult.rows[0].store_id;
        console.log(`📡 메뉴 아이템 ${completedItem.id} 조리 완료 - KDS 실시간 업데이트 전송 (매장 ${storeId})`);
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

    console.log(`✅ 주문 ${orderId}의 메뉴 ${result.rows.length}개 조리 시작 완료`);

    // 📡 KDS 실시간 업데이트 전송 (주문 전체 조리 시작)
    if (global.kdsWebSocket) {
      const orderResult = await pool.query('SELECT store_id FROM orders WHERE id = $1', [orderId]);
      if (orderResult.rows.length > 0) {
        const storeId = orderResult.rows[0].store_id;
        console.log(`📡 주문 ${orderId} 전체 조리 시작 - KDS 실시간 업데이트 전송 (매장 ${storeId})`);
        
        // 주문 전체 조리 시작 이벤트
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

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '완료할 조리중인 메뉴가 없습니다'
      });
    }

    console.log(`✅ 주문 ${orderId}의 메뉴 ${result.rows.length}개 조리 완료`);

    // 📡 KDS 실시간 업데이트 전송 (주문 완료)
    if (global.kdsWebSocket) {
      const orderResult = await pool.query('SELECT store_id FROM orders WHERE id = $1', [orderId]);
      if (orderResult.rows.length > 0) {
        const storeId = orderResult.rows[0].store_id;
        console.log(`📡 주문 ${orderId} 완료 - KDS 실시간 업데이트 전송 (매장 ${storeId})`);
        
        // 주문 완료 이벤트
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

module.exports = router;