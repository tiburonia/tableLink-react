
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const sse = require('../services/sse');

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

    // 실제 stores 테이블에서 매장 정보 조회
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        address,
        phone,
        latitude, 
        longitude, 
        created_at,
        COALESCE(rating_average, 0) as rating_average,
        COALESCE(review_count, 0) as review_count
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

// KDS 주문 데이터 조회 (실제 테이블 구조 기반)
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

    // 테이블 존재 여부 확인
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('checks', 'check_items') 
      AND table_schema = 'public'
    `);

    const hasChecks = tableCheck.rows.some(row => row.table_name === 'checks');
    const hasCheckItems = tableCheck.rows.some(row => row.table_name === 'check_items');

    if (!hasChecks || !hasCheckItems) {
      console.log('❌ 필요한 테이블이 없음, 더미 데이터 반환');
      return res.json({
        success: true,
        orders: generateDummyOrders(storeId),
        count: 3
      });
    }

    // 실제 데이터 조회 (checks와 check_items 테이블 사용)
    const result = await pool.query(`
      SELECT 
        c.id,
        c.table_number,
        c.customer_name,
        c.customer_phone,
        c.status as check_status,
        c.source,
        c.total_amount,
        c.created_at,
        c.updated_at,
        CASE 
          WHEN COUNT(CASE WHEN ci.status = 'served' THEN 1 END) = COUNT(ci.id) AND COUNT(ci.id) > 0 THEN 'COMPLETED'
          WHEN COUNT(CASE WHEN ci.status = 'ready' THEN 1 END) > 0 THEN 'READY'
          WHEN COUNT(CASE WHEN ci.status = 'cooking' THEN 1 END) > 0 THEN 'COOKING'
          ELSE 'PENDING'
        END as cookingStatus,
        COALESCE(
          json_agg(
            CASE 
              WHEN ci.id IS NOT NULL THEN
                json_build_object(
                  'id', ci.id,
                  'menu_name', ci.menu_name,
                  'quantity', ci.quantity,
                  'unit_price', ci.unit_price,
                  'options', ci.options,
                  'status', COALESCE(ci.status, 'queued'),
                  'notes', ci.notes
                )
              ELSE NULL
            END
          ) FILTER (WHERE ci.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM checks c
      LEFT JOIN check_items ci ON c.id = ci.check_id
      WHERE c.store_id = $1
        AND c.status NOT IN ('cancelled', 'refunded', 'completed')
        AND c.created_at >= CURRENT_DATE - INTERVAL '1 day'
      GROUP BY c.id, c.table_number, c.customer_name, c.customer_phone, 
               c.status, c.source, c.total_amount, c.created_at, c.updated_at
      ORDER BY c.created_at DESC
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
    const dummyOrders = generateDummyOrders(storeId);
    res.json({
      success: true,
      orders: dummyOrders,
      count: dummyOrders.length
    });
  }
});

// 개별 체크 아이템 상태 업데이트
router.put('/items/:itemId/status', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { status, notes } = req.body;

    if (isNaN(itemId) || !status) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 요청입니다'
      });
    }

    console.log(`🔥 아이템 ${itemId} 상태 변경: ${status}`);

    // 상태 업데이트
    const updateResult = await pool.query(`
      UPDATE check_items 
      SET 
        status = $1,
        notes = COALESCE($2, notes),
        started_at = CASE WHEN $1 = 'cooking' AND status != 'cooking' THEN CURRENT_TIMESTAMP ELSE started_at END,
        ready_at = CASE WHEN $1 = 'ready' AND status != 'ready' THEN CURRENT_TIMESTAMP ELSE ready_at END,
        served_at = CASE WHEN $1 = 'served' AND status != 'served' THEN CURRENT_TIMESTAMP ELSE served_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, notes, itemId]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '아이템을 찾을 수 없습니다'
      });
    }

    const updatedItem = updateResult.rows[0];

    // 체크의 매장 ID 조회하여 실시간 알림
    const storeResult = await pool.query(`
      SELECT c.store_id, c.table_number, c.customer_name
      FROM checks c
      JOIN check_items ci ON c.id = ci.check_id
      WHERE ci.id = $1
    `, [itemId]);

    if (storeResult.rows.length > 0) {
      const { store_id, table_number, customer_name } = storeResult.rows[0];
      
      // SSE 실시간 알림
      const topic = `store:${store_id}`;
      sse.broadcast(topic, {
        type: 'item_status_update',
        data: {
          item_id: itemId,
          new_status: status,
          store_id,
          table_number,
          customer_name,
          updated_item: updatedItem
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ 아이템 ${itemId} 상태 업데이트 완료: ${status}`);

    res.json({
      success: true,
      message: '상태가 업데이트되었습니다',
      itemId: itemId,
      newStatus: status,
      updatedItem: updatedItem
    });

  } catch (error) {
    console.error('❌ 아이템 상태 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: '상태 업데이트에 실패했습니다'
    });
  }
});

// 주문 전체 조리 시작 (체크의 모든 아이템을 cooking으로)
router.put('/orders/:orderId/start-cooking', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    console.log(`🔥 주문 ${orderId} 조리 시작`);

    const updateResult = await pool.query(`
      UPDATE check_items 
      SET 
        status = 'cooking',
        started_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE check_id = $1 AND status = 'queued'
      RETURNING id, menu_name, status
    `, [orderId]);

    console.log(`✅ 주문 ${orderId} 조리 시작: ${updateResult.rows.length}개 아이템`);

    res.json({
      success: true,
      message: '조리를 시작했습니다',
      orderId: orderId,
      newStatus: 'COOKING',
      updatedItems: updateResult.rows
    });

  } catch (error) {
    console.error('❌ 주문 조리 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: '조리 시작에 실패했습니다'
    });
  }
});

// 주문 전체 조리 완료
router.put('/orders/:orderId/complete', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    console.log(`✅ 주문 ${orderId} 조리 완료`);

    const updateResult = await pool.query(`
      UPDATE check_items 
      SET 
        status = 'ready',
        ready_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE check_id = $1 AND status = 'cooking'
      RETURNING id, menu_name, status
    `, [orderId]);

    console.log(`✅ 주문 ${orderId} 조리 완료: ${updateResult.rows.length}개 아이템`);

    res.json({
      success: true,
      message: '조리가 완료되었습니다',
      orderId: orderId,
      newStatus: 'READY',
      updatedItems: updateResult.rows
    });

  } catch (error) {
    console.error('❌ 조리 완료 실패:', error);
    res.status(500).json({
      success: false,
      error: '조리 완료에 실패했습니다'
    });
  }
});

// 주문 전체 서빙 완료
router.put('/orders/:orderId/serve', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    console.log(`🍽️ 주문 ${orderId} 서빙 완료`);

    // 아이템들을 served로 변경
    const itemUpdateResult = await pool.query(`
      UPDATE check_items 
      SET 
        status = 'served',
        served_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE check_id = $1 AND status = 'ready'
      RETURNING id, menu_name, status
    `, [orderId]);

    // 모든 아이템이 served되었으면 체크도 완료 처리
    const checkUpdateResult = await pool.query(`
      UPDATE checks 
      SET 
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      AND NOT EXISTS (
        SELECT 1 FROM check_items 
        WHERE check_id = $1 AND status != 'served'
      )
      RETURNING id, status
    `, [orderId]);

    console.log(`✅ 주문 ${orderId} 서빙 완료: ${itemUpdateResult.rows.length}개 아이템`);

    res.json({
      success: true,
      message: '서빙이 완료되었습니다',
      orderId: orderId,
      newStatus: 'COMPLETED',
      updatedItems: itemUpdateResult.rows,
      checkCompleted: checkUpdateResult.rows.length > 0
    });

  } catch (error) {
    console.error('❌ 서빙 완료 실패:', error);
    res.status(500).json({
      success: false,
      error: '서빙 완료에 실패했습니다'
    });
  }
});

// KDS 실시간 스트림
router.get('/stream/:storeId', (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    
    if (isNaN(storeId) || storeId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID입니다'
      });
    }

    const topic = `store:${storeId}`;
    
    if (!sse.add(topic, res)) {
      return;
    }

    // 연결 확인 메시지
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      storeId,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 연결 종료 시 정리
    res.on('close', () => {
      sse.remove(topic, res);
      console.log(`🔌 KDS SSE 연결 종료: store ${storeId}`);
    });

    console.log(`🔌 KDS SSE 연결: store ${storeId}`);

  } catch (error) {
    console.error('❌ KDS SSE 연결 에러:', error);
    res.status(400).json({
      success: false,
      error: 'SSE 연결 실패'
    });
  }
});

// KDS 통계 조회
router.get('/stats/:storeId', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    console.log(`📊 KDS - 매장 ${storeId} 통계 조회`);

    // 오늘 체크 통계
    const todayStats = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status IN ('confirmed', 'preparing') THEN 1 END) as preparing_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM checks
      WHERE store_id = $1 AND DATE(created_at) = CURRENT_DATE
    `, [storeId]);

    // 아이템별 통계
    const itemStats = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN ci.status = 'served' THEN 1 END) as completed_items,
        COUNT(CASE WHEN ci.status = 'cooking' THEN 1 END) as cooking_items,
        COUNT(CASE WHEN ci.status = 'ready' THEN 1 END) as ready_items,
        COUNT(CASE WHEN ci.status = 'queued' THEN 1 END) as queued_items
      FROM check_items ci
      JOIN checks c ON ci.check_id = c.id
      WHERE c.store_id = $1 AND DATE(ci.created_at) = CURRENT_DATE
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

  } catch (error) {
    console.error('❌ KDS 통계 조회 실패:', error);
    res.json({
      success: true,
      stats: {
        orders: {
          total_orders: 0,
          completed_orders: 0,
          preparing_orders: 0,
          total_revenue: 0
        },
        items: {
          total_items: 0,
          completed_items: 0,
          cooking_items: 0,
          ready_items: 0,
          queued_items: 0
        }
      }
    });
  }
});

// 더미 주문 데이터 생성 함수
function generateDummyOrders(storeId) {
  const now = new Date();
  return [
    {
      id: 1,
      check_status: 'confirmed',
      source: 'TLL',
      total_amount: 25000,
      created_at: now.toISOString(),
      table_number: 3,
      customer_name: '김고객',
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
      check_status: 'confirmed',
      source: 'POS',
      total_amount: 18000,
      created_at: new Date(now.getTime() - 300000).toISOString(),
      table_number: 7,
      customer_name: '이고객',
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
      check_status: 'confirmed',
      source: 'TLL',
      total_amount: 12000,
      created_at: new Date(now.getTime() - 600000).toISOString(),
      table_number: 2,
      customer_name: '박고객',
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

module.exports = router;
