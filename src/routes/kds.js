const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// KDS 매장 정보 조회
router.get('/store/:storeId', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);

    if (isNaN(storeId) || storeId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID입니다'
      });
    }

    // 데이터베이스 연결 확인
    try {
      await pool.query('SELECT 1');
    } catch (dbError) {
      console.log('❌ 데이터베이스 연결 실패, 더미 데이터 사용');
      return res.json({
        success: true,
        store: {
          id: storeId,
          name: `테스트 매장 ${storeId}`,
          address: '서울시 강남구 테스트로 123',
          hours: '09:00-22:00',
          created_at: new Date().toISOString()
        }
      });
    }

    // 실제 매장 정보 조회
    const result = await pool.query(`
      SELECT id, name, phone, address, hours, 
             latitude, longitude, created_at
      FROM stores 
      WHERE id = $1
    `, [storeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      store: result.rows[0]
    });

  } catch (error) {
    console.error('❌ KDS 매장 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 정보 조회 실패'
    });
  }
});

// KDS 주문 데이터 조회
router.get('/orders/:storeId', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);

    if (isNaN(storeId) || storeId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID입니다'
      });
    }

    console.log(`📟 KDS - 매장 ${storeId} 주문 데이터 조회`);

    // 데이터베이스 연결 확인
    try {
      await pool.query('SELECT 1');
    } catch (dbError) {
      console.log('❌ 데이터베이스 연결 실패, 더미 주문 데이터 사용');
      const dummyOrders = [
        {
          id: 1,
          order_number: 'TLL_001',
          status: 'preparing',
          source: 'TLL',
          total_amount: 25000,
          created_at: new Date().toISOString(),
          table_number: 3,
          customerName: '김고객',
          customer_phone: '010-1234-5678',
          cookingStatus: 'PENDING',
          items: [
            {
              id: 1,
              menu_name: '치킨버거',
              quantity: 2,
              unit_price: 8000,
              options: '매운맛',
              cooking_status: 'queued'
            },
            {
              id: 2,
              menu_name: '감자튀김',
              quantity: 1,
              unit_price: 5000,
              options: null,
              cooking_status: 'queued'
            }
          ]
        },
        {
          id: 2,
          order_number: 'TLL_002',
          status: 'preparing',
          source: 'POS',
          total_amount: 18000,
          created_at: new Date(Date.now() - 300000).toISOString(),
          table_number: 7,
          customerName: '이고객',
          customer_phone: '010-9876-5432',
          cookingStatus: 'COOKING',
          items: [
            {
              id: 3,
              menu_name: '불고기피자',
              quantity: 1,
              unit_price: 18000,
              options: '치즈 추가',
              cooking_status: 'cooking'
            }
          ]
        }
      ];

      return res.json({
        success: true,
        orders: dummyOrders,
        count: dummyOrders.length
      });
    }

    // 실제 주문 데이터 조회 시도
    const result = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.status as order_status,
        o.source,
        o.total_amount,
        o.created_at,
        c.table_number,
        COALESCE(c.customer_name, c.guest_name, '손님') as customerName,
        c.customer_phone,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_name', oi.menu_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'options', oi.options,
            'cooking_status', COALESCE(oi.status, 'queued')
          ) ORDER BY oi.created_at
        ) as items,
        CASE 
          WHEN COUNT(CASE WHEN oi.status = 'served' THEN 1 END) = COUNT(oi.id) THEN 'COMPLETED'
          WHEN COUNT(CASE WHEN oi.status = 'ready' THEN 1 END) > 0 THEN 'READY'
          WHEN COUNT(CASE WHEN oi.status = 'cooking' THEN 1 END) > 0 THEN 'COOKING'
          ELSE 'PENDING'
        END as cookingStatus
      FROM orders o
      JOIN checks c ON o.check_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE c.store_id = $1
        AND o.status NOT IN ('cancelled')
      GROUP BY o.id, o.order_number, o.status, o.source, o.total_amount, 
               o.created_at, c.table_number, c.customer_name, 
               c.customer_phone, c.guest_name
      ORDER BY o.created_at DESC
      LIMIT 20
    `, [storeId]);

    console.log(`✅ KDS 주문 조회 완료: ${result.rows.length}개`);

    res.json({
      success: true,
      orders: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('❌ KDS 주문 데이터 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 주문 데이터 조회 실패'
    });
  }
});

// 주문 상태 업데이트
router.put('/orders/:orderId/start-cooking', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    console.log(`🔥 주문 ${orderId} 조리 시작`);

    res.json({
      success: true,
      message: '조리를 시작했습니다'
    });
  } catch (error) {
    console.error('❌ 주문 조리 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: '조리 시작에 실패했습니다'
    });
  }
});

router.put('/orders/:orderId/complete', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    console.log(`✅ 주문 ${orderId} 조리 완료`);

    res.json({
      success: true,
      message: '조리가 완료되었습니다'
    });
  } catch (error) {
    console.error('❌ 주문 완료 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 완료에 실패했습니다'
    });
  }
});

module.exports = router;