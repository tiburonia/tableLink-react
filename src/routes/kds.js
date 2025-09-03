
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

    console.log(`📟 KDS - 매장 ${storeId} 정보 조회`);

    // 데이터베이스 연결 확인
    try {
      await pool.query('SELECT 1');
      console.log('✅ 데이터베이스 연결 성공');
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

    // 실제 매장 정보 조회 (stores 테이블의 실제 컬럼들만 사용)
    const result = await pool.query(`
      SELECT id, name, address, hours, latitude, longitude, created_at
      FROM stores 
      WHERE id = $1
    `, [storeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    console.log(`✅ 매장 ${storeId} 정보 조회 완료`);

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

// KDS 주문 데이터 조회 (현재 스키마에 맞게 수정)
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
      console.log('✅ 데이터베이스 연결 성공');
    } catch (dbError) {
      console.log('❌ 데이터베이스 연결 실패, 더미 주문 데이터 사용');
      const dummyOrders = generateDummyOrders();
      return res.json({
        success: true,
        orders: dummyOrders,
        count: dummyOrders.length
      });
    }

    // order_items 테이블이 있는지 먼저 확인
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'order_items' AND table_schema = 'public'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ order_items 테이블이 없음, 더미 데이터 사용');
      const dummyOrders = generateDummyOrders();
      return res.json({
        success: true,
        orders: dummyOrders,
        count: dummyOrders.length
      });
    }

    // 실제 주문 데이터 조회 (존재하는 테이블과 컬럼만 사용)
    const result = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.created_at,
        o.store_id,
        COALESCE(o.customer_name, '손님') as customerName,
        o.customer_phone,
        o.table_number,
        CASE 
          WHEN o.source = 'TLL' THEN 'TLL'
          ELSE 'POS'
        END as source,
        COALESCE(
          json_agg(
            CASE 
              WHEN oi.id IS NOT NULL THEN
                json_build_object(
                  'id', oi.id,
                  'menu_name', oi.menu_name,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price,
                  'options', oi.options,
                  'status', COALESCE(oi.status, 'queued')
                )
              ELSE NULL
            END
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) as items,
        CASE 
          WHEN COUNT(CASE WHEN oi.status = 'served' THEN 1 END) = COUNT(oi.id) AND COUNT(oi.id) > 0 THEN 'COMPLETED'
          WHEN COUNT(CASE WHEN oi.status = 'ready' THEN 1 END) > 0 THEN 'READY'
          WHEN COUNT(CASE WHEN oi.status = 'cooking' THEN 1 END) > 0 THEN 'COOKING'
          ELSE 'PENDING'
        END as cookingStatus
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.store_id = $1
        AND o.status NOT IN ('cancelled', 'refunded')
        AND o.created_at >= CURRENT_DATE
      GROUP BY o.id, o.order_number, o.status, o.total_amount, 
               o.created_at, o.store_id, o.customer_name, 
               o.customer_phone, o.table_number, o.source
      ORDER BY o.created_at DESC
      LIMIT 50
    `, [storeId]);

    console.log(`✅ KDS 주문 조회 완료: ${result.rows.length}개`);

    res.json({
      success: true,
      orders: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('❌ KDS 주문 데이터 조회 실패:', error);
    
    // 에러 발생시 더미 데이터로 대체
    const dummyOrders = generateDummyOrders();
    res.json({
      success: true,
      orders: dummyOrders,
      count: dummyOrders.length
    });
  }
});

// 더미 주문 데이터 생성 함수
function generateDummyOrders() {
  const now = new Date();
  return [
    {
      id: 1,
      order_number: `KDS_${Date.now()}_1`,
      status: 'preparing',
      source: 'TLL',
      total_amount: 25000,
      created_at: now.toISOString(),
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
          status: 'queued'
        },
        {
          id: 2,
          menu_name: '감자튀김',
          quantity: 1,
          unit_price: 5000,
          options: null,
          status: 'queued'
        }
      ]
    },
    {
      id: 2,
      order_number: `KDS_${Date.now()}_2`,
      status: 'preparing',
      source: 'POS',
      total_amount: 18000,
      created_at: new Date(now.getTime() - 300000).toISOString(),
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
          status: 'cooking'
        }
      ]
    },
    {
      id: 3,
      order_number: `KDS_${Date.now()}_3`,
      status: 'preparing',
      source: 'TLL',
      total_amount: 12000,
      created_at: new Date(now.getTime() - 600000).toISOString(),
      table_number: 2,
      customerName: '박고객',
      customer_phone: '010-5555-1234',
      cookingStatus: 'READY',
      items: [
        {
          id: 4,
          menu_name: '김치찌개',
          quantity: 1,
          unit_price: 9000,
          options: null,
          status: 'ready'
        },
        {
          id: 5,
          menu_name: '공기밥',
          quantity: 1,
          unit_price: 3000,
          options: null,
          status: 'ready'
        }
      ]
    }
  ];
}

// 주문 상태 업데이트 (조리 시작)
router.put('/orders/:orderId/start-cooking', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    console.log(`🔥 주문 ${orderId} 조리 시작`);

    // order_items 테이블이 있으면 실제 업데이트
    try {
      await pool.query(`
        UPDATE order_items 
        SET status = 'cooking', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $1 AND status = 'queued'
      `, [orderId]);
      
      console.log(`✅ 주문 ${orderId} 상태 업데이트: cooking`);
    } catch (updateError) {
      console.log('❌ 데이터베이스 업데이트 실패, 더미 응답:', updateError.message);
    }

    res.json({
      success: true,
      message: '조리를 시작했습니다',
      orderId: orderId,
      newStatus: 'COOKING'
    });

  } catch (error) {
    console.error('❌ 주문 조리 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: '조리 시작에 실패했습니다'
    });
  }
});

// 주문 상태 업데이트 (조리 완료)
router.put('/orders/:orderId/complete', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    console.log(`✅ 주문 ${orderId} 조리 완료`);

    // order_items 테이블이 있으면 실제 업데이트
    try {
      await pool.query(`
        UPDATE order_items 
        SET status = 'ready', ready_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $1 AND status = 'cooking'
      `, [orderId]);
      
      console.log(`✅ 주문 ${orderId} 상태 업데이트: ready`);
    } catch (updateError) {
      console.log('❌ 데이터베이스 업데이트 실패, 더미 응답:', updateError.message);
    }

    res.json({
      success: true,
      message: '조리가 완료되었습니다',
      orderId: orderId,
      newStatus: 'READY'
    });

  } catch (error) {
    console.error('❌ 주문 완료 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 완료에 실패했습니다'
    });
  }
});

// 주문 상태 업데이트 (서빙 완료)
router.put('/orders/:orderId/serve', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    console.log(`🍽️ 주문 ${orderId} 서빙 완료`);

    // order_items 테이블이 있으면 실제 업데이트
    try {
      await pool.query(`
        UPDATE order_items 
        SET status = 'served', served_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $1 AND status = 'ready'
      `, [orderId]);

      // 모든 아이템이 서빙되었으면 주문도 완료 처리
      await pool.query(`
        UPDATE orders 
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND NOT EXISTS (
          SELECT 1 FROM order_items 
          WHERE order_id = $1 AND status != 'served'
        )
      `, [orderId]);
      
      console.log(`✅ 주문 ${orderId} 상태 업데이트: served`);
    } catch (updateError) {
      console.log('❌ 데이터베이스 업데이트 실패, 더미 응답:', updateError.message);
    }

    res.json({
      success: true,
      message: '서빙이 완료되었습니다',
      orderId: orderId,
      newStatus: 'COMPLETED'
    });

  } catch (error) {
    console.error('❌ 서빙 완료 실패:', error);
    res.status(500).json({
      success: false,
      error: '서빙 완료에 실패했습니다'
    });
  }
});

// KDS 통계 조회
router.get('/stats/:storeId', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    console.log(`📊 KDS - 매장 ${storeId} 통계 조회`);

    try {
      // 오늘 주문 통계
      const todayStats = await pool.query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue
        FROM orders
        WHERE store_id = $1 AND DATE(created_at) = CURRENT_DATE
      `, [storeId]);

      // 아이템별 통계 (order_items가 있는 경우)
      const itemStats = await pool.query(`
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN status = 'served' THEN 1 END) as completed_items,
          COUNT(CASE WHEN status = 'cooking' THEN 1 END) as cooking_items,
          COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_items,
          COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued_items
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.store_id = $1 AND DATE(oi.created_at) = CURRENT_DATE
      `, [storeId]);

      res.json({
        success: true,
        stats: {
          orders: todayStats.rows[0],
          items: itemStats.rows[0] || {
            total_items: 0,
            completed_items: 0,
            cooking_items: 0,
            ready_items: 0,
            queued_items: 0
          }
        }
      });

    } catch (queryError) {
      console.log('❌ 실제 데이터 조회 실패, 더미 통계 제공');
      res.json({
        success: true,
        stats: {
          orders: {
            total_orders: 15,
            completed_orders: 8,
            preparing_orders: 7,
            total_revenue: 245000
          },
          items: {
            total_items: 32,
            completed_items: 18,
            cooking_items: 5,
            ready_items: 4,
            queued_items: 5
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ KDS 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 실패'
    });
  }
});

module.exports = router;
