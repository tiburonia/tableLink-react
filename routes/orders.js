
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 결제 처리 API
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

    if (usedPoint > user.point) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '포인트가 부족합니다' });
    }

    let usedCoupon = null;
    if (selectedCouponId) {
      usedCoupon = currentCoupons.unused.find(c => c.id == selectedCouponId);
      if (!usedCoupon) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: '유효하지 않은 쿠폰입니다' });
      }
    }

    const appliedPoint = Math.min(usedPoint, user.point, orderData.total);
    const finalAmount = orderData.total - (couponDiscount || 0) - appliedPoint;
    const earnedPoint = Math.floor(orderData.total * 0.1);

    const newPoint = user.point - appliedPoint + earnedPoint;
    const currentOrderList = user.order_list || [];

    const orderRecord = {
      ...orderData,
      total: orderData.total,
      usedPoint: appliedPoint,
      couponDiscount: couponDiscount,
      totalDiscount: appliedPoint + (couponDiscount || 0),
      couponUsed: selectedCouponId || null,
      realTotal: finalAmount,
      earnedPoint: earnedPoint,
      paymentStrategy: ((couponDiscount || 0) > 0 || appliedPoint > 0)
        ? ((couponDiscount || 0) >= appliedPoint ? "couponFirst" : "pointFirst")
        : "none"
    };

    let newCoupons = { ...currentCoupons };
    if (usedCoupon) {
      const unusedIndex = newCoupons.unused.findIndex(c => c.id == selectedCouponId);
      if (unusedIndex !== -1) {
        const movedCoupon = newCoupons.unused.splice(unusedIndex, 1)[0];
        newCoupons.used.push(movedCoupon);
      }
    }

    let welcomeCoupon = null;
    if (currentOrderList.length === 0) {
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

    const newOrderList = [...currentOrderList, orderRecord];

    await client.query(
      'UPDATE users SET point = $1, order_list = $2, coupons = $3 WHERE id = $4',
      [newPoint, JSON.stringify(newOrderList), JSON.stringify(newCoupons), userId]
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
        original_amount, used_point, coupon_discount, final_amount, 
        order_status, order_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      userId,
      storeId,
      actualTableNumber,
      JSON.stringify({
        ...orderData,
        storeId: storeId,
        storeName: storeName,
        tableNumber: tableNumber
      }),
      orderData.total,
      appliedPoint,
      couponDiscount || 0,
      finalTotal,
      'completed',
      new Date()
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '결제가 완료되었습니다',
      result: {
        orderId: orderResult.rows[0].id,
        appliedPoint: appliedPoint,
        earnedPoint: earnedPoint,
        finalTotal: finalTotal,
        totalDiscount: appliedPoint + (couponDiscount || 0),
        welcomeCoupon: welcomeCoupon
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

    console.log(`📋 매장 ${storeId} 주문 내역 조회 요청 (제한: ${limit}개, 상태: ${status || '전체'})`);

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

module.exports = router;
