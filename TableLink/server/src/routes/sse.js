
const express = require('express');
const router = express.Router();
const sseHub = require('../services/sse');
const pool = require('../db/pool');

/**
 * SSE 연결 엔드포인트
 */
router.get('/pos/:storeId', (req, res) => {
  const { storeId } = req.params;
  
  console.log(`📡 POS SSE 연결 요청: 매장 ${storeId}`);
  
  // SSE 연결 추가
  const success = sseHub.add(`pos:${storeId}`, res);
  
  if (!success) {
    return; // 이미 응답이 전송됨
  }
  
  console.log(`✅ POS SSE 연결 완료: 매장 ${storeId}`);
});

/**
 * 테이블 상태 변경 브로드캐스트
 */
async function broadcastTableUpdate(storeId, tableNumber = null) {
  try {
    console.log(`📡 테이블 업데이트 브로드캐스트: 매장 ${storeId}, 테이블 ${tableNumber || 'ALL'}`);
    
    // 활성 주문 정보 조회
    const ordersResult = await pool.query(`
      SELECT 
        st.id as table_number,
        o.id as order_id,
        COALESCE(u.name, '포스고객') as customer_name,
        o.user_id,
        o.total_price as total_amount,
        o.session_status,
        o.created_at as opened_at,
        o.source as source_system,
        COUNT(oi.id) as item_count,
        CASE 
          WHEN st.processing_order_id = o.id THEN 'main'
          WHEN st.spare_processing_order_id = o.id THEN 'spare'
          ELSE 'unknown'
        END as order_type,
        st.spare_processing_order_id
      FROM store_tables st
      LEFT JOIN orders o ON (st.processing_order_id = o.id OR st.spare_processing_order_id = o.id)
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status != 'CANCELED'
      WHERE st.store_id = $1 
        AND (st.processing_order_id IS NOT NULL OR st.spare_processing_order_id IS NOT NULL)
        ${tableNumber ? 'AND st.id = $2' : ''}
      GROUP BY st.id, o.id, u.name, o.user_id, 
               o.total_price, o.session_status, o.created_at, o.source, 
               st.processing_order_id, st.spare_processing_order_id
      ORDER BY st.id, o.created_at
    `, tableNumber ? [storeId, tableNumber] : [storeId]);

    // 테이블별로 그룹화
    const tableUpdates = {};
    ordersResult.rows.forEach(row => {
      const tableNum = row.table_number;
      if (!tableUpdates[tableNum]) {
        tableUpdates[tableNum] = {
          tableNumber: tableNum,
          orders: [],
          hasCrossOrders: false
        };
      }
      
      if (row.order_id) {
        tableUpdates[tableNum].orders.push({
          checkId: row.order_id,
          customerName: row.customer_name,
          isGuest: !row.user_id,
          totalAmount: row.total_amount || 0,
          status: row.session_status,
          openedAt: row.opened_at,
          sourceSystem: row.source_system,
          itemCount: parseInt(row.item_count),
          orderType: row.order_type
        });
      }
    });

    // 교차 주문 여부 확인
    Object.values(tableUpdates).forEach(table => {
      table.hasCrossOrders = table.orders.length > 1;
    });

    sseHub.broadcast(`pos:${storeId}`, {
      type: 'table_update',
      data: {
        storeId: parseInt(storeId),
        tables: Object.values(tableUpdates),
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ 테이블 업데이트 브로드캐스트 완료: ${Object.keys(tableUpdates).length}개 테이블`);
    
  } catch (error) {
    console.error('❌ 테이블 업데이트 브로드캐스트 실패:', error);
  }
}

// 전역 함수로 내보내기
global.broadcastPOSTableUpdate = broadcastTableUpdate;

module.exports = router;
