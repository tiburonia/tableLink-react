const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});


// 📈 매장별 일일 통계 조회
router.get('/stats/:storeId/daily', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    console.log(`📈 매장 ${storeId} 일일 통계 조회: ${date}`);

    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COUNT(DISTINCT COALESCE(o.user_id, o.guest_phone)) as total_customers,
        COUNT(CASE WHEN p.method = 'CASH' THEN 1 END) as cash_orders,
        COUNT(CASE WHEN p.method = 'CARD' THEN 1 END) as card_orders,
        COUNT(CASE WHEN p.method = 'TOSS' THEN 1 END) as toss_orders
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.store_id = $1 
        AND DATE(o.created_at) = $2
        AND o.status != 'CANCELLED'
        AND (p.status = 'completed' OR p.status IS NULL)
    `, [parseInt(storeId), date]);

    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        date: date,
        totalRevenue: parseInt(stats.total_revenue),
        totalOrders: parseInt(stats.total_orders),
        totalCustomers: parseInt(stats.total_customers),
        cashRevenue: parseInt(stats.cash_orders) > 0 ? parseInt(stats.total_revenue) / parseInt(stats.total_orders) * parseInt(stats.cash_orders) : 0,
        cardRevenue: parseInt(stats.card_orders) > 0 ? parseInt(stats.total_revenue) / parseInt(stats.total_orders) * parseInt(stats.card_orders) : 0,
        tossRevenue: parseInt(stats.toss_orders) > 0 ? parseInt(stats.total_revenue) / parseInt(stats.total_orders) * parseInt(stats.toss_orders) : 0
      },
      realTime: true
    });

  } catch (error) {
    console.error('❌ 일일 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '일일 통계 조회 실패'
    });
  }
});


// 주문 상태 업데이트 API
router.put('/update-status', async (req, res) => {
  try {
    const { orderId, status, cookingStatus } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: '주문 ID가 필요합니다'
      });
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updateFields.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (cookingStatus) {
      updateFields.push(`cooking_status = $${paramCount}`);
      values.push(cookingStatus);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: '업데이트할 상태 정보가 필요합니다'
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(parseInt(orderId));

    const updateResult = await pool.query(`
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, status, cooking_status, updated_at
    `, values);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const updatedOrder = updateResult.rows[0];

    console.log(`🔄 주문 상태 업데이트: 주문 ID ${orderId}, 상태: ${updatedOrder.status}, 조리상태: ${updatedOrder.cooking_status}`);

    res.json({
      success: true,
      message: '주문 상태가 업데이트되었습니다',
      order: updatedOrder
    });

  } catch (error) {
    console.error('❌ 주문 상태 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 상태 업데이트 실패'
    });
  }
});

// 주문 조회 API (단일)
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(`
      SELECT 
        o.*,
        s.name as store_name,
        s.category as store_category,
        u.name as user_name
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [parseInt(orderId)]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = orderResult.rows[0];

    // 주문 항목들 조회
    const itemsResult = await pool.query(`
      SELECT 
        oi.*,
        m.name as menu_name,
        m.category as menu_category
      FROM order_items oi
      LEFT JOIN menus m ON oi.menu_id = m.id
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `, [parseInt(orderId)]);

    res.json({
      success: true,
      order: {
        ...order,
        items: itemsResult.rows.map(item => ({
          ...item,
          options: typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {})
        }))
      }
    });

  } catch (error) {
    console.error('❌ 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 조회 실패'
    });
  }
});

// 사용자 주문 목록 조회 API
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0, status } = req.query;

    console.log(`📋 사용자 ${userId} 주문 목록 조회`);

    let whereClause = 'WHERE o.user_id = $1';
    const queryParams = [userId];

    if (status) {
      whereClause += ' AND o.status = $2';
      queryParams.push(status);
    }

    const ordersResult = await pool.query(`
      SELECT 
        o.id, 
        o.total_price, 
        COALESCE(o.session_status, 'OPEN') as session_status,
        o.created_at,
        o.table_num as table_number,
        s.id as store_id, 
        s.name as store_name, 
        COUNT(ot.id) as ticket_count
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      LEFT JOIN order_tickets ot ON o.id = ot.order_id
      ${whereClause}
      GROUP BY o.id, s.id, s.name, s.category
      ORDER BY o.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      orders: ordersResult.rows
    });

  } catch (error) {
    console.error('❌ 사용자 주문 목록 조회 실패:', error);

    // 테이블이 존재하지 않는 경우 빈 배열 반환
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      console.log('⚠️ 테이블이 존재하지 않음 - 빈 결과 반환');
      return res.json({
        success: true,
        orders: []
      });
    }

    res.status(500).json({
      success: false,
      error: '주문 목록 조회 실패'
    });
  }
});

// 매장 주문 목록 조회 API
router.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 50, offset = 0, status, cookingStatus, date } = req.query;

    let whereClause = 'WHERE o.store_id = $1';
    const queryParams = [parseInt(storeId)];
    let paramCount = 2;

    if (status) {
      whereClause += ` AND o.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    if (cookingStatus) {
      whereClause += ` AND o.cooking_status = $${paramCount}`;
      queryParams.push(cookingStatus);
      paramCount++;
    }

    if (date) {
      whereClause += ` AND DATE(o.created_at) = $${paramCount}`;
      queryParams.push(date);
      paramCount++;
    }

    const ordersResult = await pool.query(`
      SELECT 
        o.*,
        COALESCE(u.name, '게스트') as customer_name,
        COALESCE(u.phone, o.guest_phone) as customer_phone,
        COUNT(ot.id) as ticket_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_tickets ot ON o.id = ot.order_id
      ${whereClause}
      GROUP BY o.id, u.name, u.phone
      ORDER BY o.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      orders: ordersResult.rows
    });

  } catch (error) {
    console.error('❌ 매장 주문 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 주문 목록 조회 실패'
    });
  }
});

// 주문 삭제 API
router.delete('/order/:orderId', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId } = req.params;

    await client.query('BEGIN');

    // 주문 존재 확인
    const orderResult = await pool.query(
      'SELECT id, status FROM orders WHERE id = $1',
      [parseInt(orderId)]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = orderResult.rows[0];

    // 완료된 주문은 삭제 불가
    if (order.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: '완료된 주문은 삭제할 수 없습니다'
      });
    }

    // 주문 항목들 먼저 삭제
    await client.query('DELETE FROM order_items WHERE order_id = $1', [parseInt(orderId)]);

    // 주문 티켓들 삭제
    await client.query('DELETE FROM order_tickets WHERE order_id = $1', [parseInt(orderId)]);

    // 주문 삭제
    await client.query('DELETE FROM orders WHERE id = $1', [parseInt(orderId)]);

    await client.query('COMMIT');

    console.log(`🗑️ 주문 삭제 완료: 주문 ID ${orderId}`);

    res.json({
      success: true,
      message: '주문이 삭제되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 주문 삭제 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 삭제 실패'
    });
  } finally {
    client.release();
  }
});

// 📋 주문 진행 상황 조회 API
router.get('/processing/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`📋 주문 진행 상황 조회: ${orderId}`);

    // 입력 검증
    if (!orderId || isNaN(parseInt(orderId))) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 주문 ID입니다'
      });
    }

    const parsedOrderId = parseInt(orderId);

    // 주문 기본 정보 조회 (세션 상태 정보 포함)
    const orderResult = await pool.query(`
      SELECT 
        o.id,
        o.store_id,
        COALESCE(o.table_num, 1) as table_number,
        COALESCE(o.session_status, 'OPEN') as session_status,
        o.created_at,
        COALESCE(o.session_ended, false) as session_ended,
        o.session_ended_at,
        COALESCE(o.total_price, 0) as base_amount,
        COALESCE(s.name, '알 수 없는 매장') as store_name
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.id = $1
    `, [parsedOrderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = orderResult.rows[0];

    // 티켓 정보 조회 (아이템 포함)
    const ticketsResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.order_id,
        COALESCE(ot.batch_no, 1) as batch_no,
        COALESCE(ot.status, 'PENDING') as status,
        COALESCE(ot.source, 'TLL') as source,
        COALESCE(ot.paid_status, 'PAID') as paid_status,
        ot.created_at
      FROM order_tickets ot
      WHERE ot.order_id = $1
      ORDER BY ot.created_at DESC
    `, [parsedOrderId]);

    // 각 티켓에 대해 아이템 정보 조회
    const ticketsWithItems = await Promise.all(
      ticketsResult.rows.map(async (ticket) => {
        console.log(`🔍 티켓 ${ticket.ticket_id} 아이템 조회 시작`);

        // order_items에서 ticket_id로 조회
        const itemsResult = await pool.query(`
          SELECT 
            oi.id,
            COALESCE(oi.menu_name, '메뉴') as menu_name,
            COALESCE(oi.menu_name, '메뉴') as name,
            COALESCE(oi.quantity, 1) as quantity,
            COALESCE(oi.unit_price, 0) as unit_price,
            COALESCE(oi.cook_station, 'KITCHEN') as cook_station,
            COALESCE(oi.item_status, 'PENDING') as status,
            oi.options
          FROM order_items oi
          WHERE oi.ticket_id = $1
          ORDER BY oi.created_at
        `, [ticket.ticket_id]);

        const items = itemsResult.rows.map(item => ({
          ...item,
          options: typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {})
        }));

        console.log(`✅ 티켓 ${ticket.ticket_id} 아이템 조회 완료: ${items.length}개`);

        return {
          ticket_id: ticket.ticket_id,
          id: ticket.ticket_id,
          order_id: ticket.order_id,
          batch_no: ticket.batch_no,
          status: ticket.status,
          source: ticket.source,
          paid_status: ticket.paid_status,
          created_at: ticket.created_at,
          items: items
        };
      })
    );

    // 결제 내역 조회
    const paymentsResult = await pool.query(`
      SELECT 
        p.id,
        COALESCE(p.method, 'UNKNOWN') as method,
        COALESCE(p.amount, 0) as amount,
        COALESCE(p.status, 'pending') as status,
        p.created_at,
        p.transaction_id as payment_key
      FROM payments p 
      WHERE p.order_id = $1 
      ORDER BY p.created_at DESC
    `, [parsedOrderId]);

    const payments = paymentsResult.rows.map(payment => ({
      id: payment.id,
      method: payment.method?.toString().toUpperCase() || 'UNKNOWN',
      amount: parseInt(payment.amount) || 0,
      status: payment.status,
      createdAt: payment.created_at,
      payment_key: payment.payment_key,
      ticket_ids: []
    }));

    // 최종 금액 계산
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAmount = paidAmount > 0 ? paidAmount : parseInt(order.base_amount) || 0;

    const responseData = {
      id: order.id,
      storeId: order.store_id,
      storeName: order.store_name,
      tableNumber: order.table_number,
      status: order.status,
      session_status: order.session_status,
      createdAt: order.created_at,
      sessionEnded: order.session_ended,
      session_ended_at: order.session_ended_at,
      totalOrders: ticketsWithItems.length,
      totalAmount: totalAmount,
      tickets: ticketsWithItems,
      payments: payments
    };

    console.log(`✅ 주문 진행 상황 조회 성공:`, {
      orderId: responseData.id,
      storeName: responseData.storeName,
      ticketCount: ticketsWithItems.length,
      paymentCount: payments.length,
      totalAmount: responseData.totalAmount,
      ticketItems: ticketsWithItems.map(t => ({ ticket_id: t.ticket_id, itemCount: t.items.length }))
    });

    res.json({
      success: true,
      order: responseData
    });

  } catch (error) {
    console.error('❌ 주문 진행 상황 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 진행 상황을 조회할 수 없습니다: ' + error.message
    });
  }
});

// 📋 현재 세션 정보 조회 API (POS 주문 화면용)
router.get('/current-session/:storeId/:tableNumber', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`📋 현재 세션 조회: 매장 ${storeId}, 테이블 ${tableNumber}`);

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID 또는 테이블 번호입니다'
      });
    }

    // 해당 테이블의 현재 활성 주문 조회
    const sessionResult = await pool.query(`
      SELECT 
        o.id as order_id,
        o.session_status,
        o.created_at,
        o.user_id,
        o.guest_phone,
        o.total_price,
        COALESCE(u.name, '게스트') as customer_name,
        COUNT(ot.id) as ticket_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_tickets ot ON o.id = ot.order_id
      WHERE o.store_id = $1 
        AND o.table_num = $2 
        AND o.session_status = 'OPEN'
        AND NOT COALESCE(o.session_ended, false)
      GROUP BY o.id, u.name
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [parsedStoreId, parsedTableNumber]);

    if (sessionResult.rows.length === 0) {
      console.log(`ℹ️ 테이블 ${tableNumber}에 활성 세션 없음`);
      return res.json({
        success: true,
        session: null
      });
    }

    const session = sessionResult.rows[0];

    // 세션의 주문 아이템들 조회
    const itemsResult = await pool.query(`
      SELECT 
        oi.id as order_item_id,
        oi.menu_name,
        oi.unit_price,
        oi.quantity,
        oi.item_status,
        oi.ticket_id,
        oi.created_at
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      WHERE ot.order_id = $1
      ORDER BY oi.created_at
    `, [session.order_id]);

    const sessionData = {
      orderId: session.order_id,
      status: session.status,
      createdAt: session.created_at,
      customerId: session.user_id,
      customerName: session.customer_name,
      guestPhone: session.guest_phone,
      totalPrice: session.total_price,
      ticketCount: session.ticket_count,
      orderItems: itemsResult.rows
    };

    console.log(`✅ 현재 세션 조회 완료: 주문 ${session.order_id}, 아이템 ${itemsResult.rows.length}개`);

    res.json({
      success: true,
      session: sessionData
    });

  } catch (error) {
    console.error('❌ 현재 세션 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '현재 세션 조회 실패: ' + error.message
    });
  }
});

// 🔚 주문 세션 종료 API
router.put('/:orderId/end-session', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId } = req.params;

    console.log(`🔚 주문 세션 종료: ${orderId}`);

    await client.query('BEGIN');

    // 주문 세션 종료 처리
    const updateResult = await client.query(`
      UPDATE orders
      SET 
        session_ended = true,
        session_ended_at = CURRENT_TIMESTAMP,
        session_status = CASE 
          WHEN session_status = 'OPEN' THEN 'CLOSED'
          ELSE session_status
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [parseInt(orderId)]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = updateResult.rows[0];

    // 해당 테이블 해제 (다른 활성 주문이 없는 경우)
    const activeOrdersResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      WHERE o.store_id = $1 
        AND o.table_num = $2 
        AND o.session_status = 'OPEN'
        AND o.id != $3
    `, [order.store_id, order.table_num, parseInt(orderId)]);

    const hasOtherActiveOrders = parseInt(activeOrdersResult.rows[0].count) > 0;

    if (hasOtherActiveOrders) {
      console.log(`🔄 세션 종료 - 다른 활성 주문 존재로 테이블 유지: 매장 ${order.store_id}, 테이블 ${order.table_num}, 현재 주문 ${orderId}`);

      // 현재 주문이 processing_order_id인지 spare_processing_order_id인지 확인하여 처리
      const currentTableResult = await client.query(`
        SELECT processing_order_id, spare_processing_order_id
        FROM store_tables
        WHERE store_id = $1 AND id = $2
      `, [order.store_id, order.table_num]);

      let tableFieldUpdated = false;

      if (currentTableResult.rows.length > 0) {
        const currentTable = currentTableResult.rows[0];
        const processingOrderId = parseInt(currentTable.processing_order_id);
        const spareOrderId = parseInt(currentTable.spare_processing_order_id);
        const currentOrderId = parseInt(orderId);

        if (spareOrderId === currentOrderId) {
          // Case 1: spare_processing_order_id에 현재 주문이 있는 경우
          // spare를 null로 처리 (status는 업데이트하지 않음)
          console.log(`🔍 spare_processing_order_id 처리 전: processing_order_id=${processingOrderId}, spare_processing_order_id=${spareOrderId}, 현재주문=${currentOrderId}`);
          
          const updateResult = await client.query(`
            UPDATE store_tables
            SET
              spare_processing_order_id = NULL,
              updated_at = CURRENT_TIMESTAMP
            WHERE store_id = $1 AND id = $2 
            RETURNING processing_order_id, spare_processing_order_id
          `, [order.store_id, order.table_num]);
          
          if (updateResult.rowCount > 0) {
            const updatedRow = updateResult.rows[0];
            console.log(`✅ spare_processing_order_id 처리 완료 - 보조 주문을 삭제 (status 유지): 테이블 ${order.table_num}, 주문 ${orderId}`);
            console.log(`📋 업데이트 후: processing_order_id=${updatedRow.processing_order_id}, spare_processing_order_id=${updatedRow.spare_processing_order_id}`);
            tableFieldUpdated = true;
          } else {
            console.error(`❌ spare_processing_order_id 업데이트 실패 - 매칭되는 테이블 없음. store_id=${order.store_id}, table_num=${order.table_num}`);
          }
        } else if (processingOrderId === currentOrderId) {
          // Case 2: processing_order_id에 현재 주문이 있는 경우
          console.log(`🔍 processing_order_id 처리 전: processing_order_id=${processingOrderId}, spare_processing_order_id=${spareOrderId}, 현재주문=${currentOrderId}`);
          
          if (currentTable.spare_processing_order_id !== null) {
            // spare가 존재하면 spare를 processing으로 이동하고 spare는 null 처리
            const updateResult = await client.query(`
              UPDATE store_tables
              SET
                processing_order_id = spare_processing_order_id,
                spare_processing_order_id = NULL,
                updated_at = CURRENT_TIMESTAMP
              WHERE store_id = $1 AND id = $2
              RETURNING processing_order_id, spare_processing_order_id
            `, [order.store_id, order.table_num]);
            
            if (updateResult.rowCount > 0) {
              const updatedRow = updateResult.rows[0];
              console.log(`✅ processing_order_id 처리 완료 - 보조 주문을 메인으로 이동: 테이블 ${order.table_num}, 완료된 주문 ${orderId}, 새 메인 주문 ${updatedRow.processing_order_id}`);
              console.log(`📋 업데이트 후: processing_order_id=${updatedRow.processing_order_id}, spare_processing_order_id=${updatedRow.spare_processing_order_id}`);
              tableFieldUpdated = true;
            } else {
              console.error(`❌ processing_order_id (spare 이동) 업데이트 실패 - 매칭되는 테이블 없음. store_id=${order.store_id}, table_num=${order.table_num}`);
            }
          } else {
            // spare가 없으면 processing을 null 처리하고 status를 AVAILABLE로 변경
            const updateResult = await client.query(`
              UPDATE store_tables
              SET
                processing_order_id = NULL,
                spare_processing_order_id = NULL,
                status = 'AVAILABLE',
                updated_at = CURRENT_TIMESTAMP
              WHERE store_id = $1 AND id = $2
              RETURNING processing_order_id, spare_processing_order_id, status
            `, [order.store_id, order.table_num]);
            
            if (updateResult.rowCount > 0) {
              const updatedRow = updateResult.rows[0];
              console.log(`✅ processing_order_id 처리 완료 - 테이블 완전 해제: 테이블 ${order.table_num}, 주문 ${orderId}`);
              console.log(`📋 업데이트 후: processing_order_id=${updatedRow.processing_order_id}, spare_processing_order_id=${updatedRow.spare_processing_order_id}, status=${updatedRow.status}`);
              tableFieldUpdated = true;
            } else {
              console.error(`❌ processing_order_id (테이블 해제) 업데이트 실패 - 매칭되는 테이블 없음. store_id=${order.store_id}, table_num=${order.table_num}`);
            }
          }
        } else {
          console.warn(`⚠️ 세션 종료 - 해당 주문 ${orderId}이 테이블 ${order.table_num}의 processing_order_id(${processingOrderId}) 또는 spare_processing_order_id(${spareOrderId})에 매칭되지 않음`);
        }
      } else {
        console.error(`❌ 세션 종료 - 테이블 ${order.table_num}을 store_tables에서 찾을 수 없음`);
      }

      if (!tableFieldUpdated) {
        console.warn(`⚠️ 세션 종료 - 테이블 ${order.table_num} 업데이트 실패 또는 주문 ${orderId} 매칭 실패`);
      }
    } else {
      // 다른 활성 주문이 없으면 테이블 완전 해제
      // store_tables 직접 업데이트 (여러 방식으로 시도)
      let tableUpdated = false;

      // 방법 1: id 필드로 매칭
      const tableUpdateResult1 = await client.query(`
        UPDATE store_tables
        SET 
          processing_order_id = NULL,
          spare_processing_order_id = NULL,
          status = 'AVAILABLE',
          updated_at = CURRENT_TIMESTAMP
        WHERE store_id = $1 AND id = $2
      `, [order.store_id, order.table_num]);

      if (tableUpdateResult1.rowCount > 0) {
        tableUpdated = true;
        console.log(`🍽️ 세션 종료 후 테이블 완전 해제 (id 매칭): 매장 ${order.store_id}, 테이블 ${order.table_num}`);
      } else {
        // 방법 2: table_number 필드로 매칭
        const tableUpdateResult2 = await client.query(`
          UPDATE store_tables
          SET 
            processing_order_id = NULL,
            spare_processing_order_id = NULL,
            status = 'AVAILABLE',
            updated_at = CURRENT_TIMESTAMP
          WHERE store_id = $1 AND table_number = $2
        `, [order.store_id, order.table_num]);

        if (tableUpdateResult2.rowCount > 0) {
          tableUpdated = true;
          console.log(`🍽️ 세션 종료 후 테이블 완전 해제 (table_number 매칭): 매장 ${order.store_id}, 테이블 ${order.table_num}`);
        } else {
          // 방법 3: processing_order_id 또는 spare_processing_order_id로 매칭
          const tableUpdateResult3 = await client.query(`
            UPDATE store_tables
            SET 
              processing_order_id = CASE WHEN processing_order_id = $2 THEN spare_processing_order_id ELSE processing_order_id END,
              spare_processing_order_id = CASE WHEN spare_processing_order_id = $2 THEN NULL ELSE spare_processing_order_id END,
              status = CASE WHEN processing_order_id = $2 AND spare_processing_order_id IS NULL THEN 'AVAILABLE' ELSE status END,
              updated_at = CURRENT_TIMESTAMP
            WHERE store_id = $1 AND (processing_order_id = $2 OR spare_processing_order_id = $2)
          `, [order.store_id, parseInt(orderId)]);

          if (tableUpdateResult3.rowCount > 0) {
            tableUpdated = true;
            console.log(`🍽️ 세션 종료 후 주문별 해제 처리: 매장 ${order.store_id}, 주문 ${orderId}`);
          }
        }
      }

      if (!tableUpdated) {
        console.warn(`⚠️ 세션 종료 후 store_tables 업데이트 실패: 매장 ${order.store_id}, 테이블 ${order.table_num}, 주문 ${orderId}`);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '주문 세션이 종료되었습니다',
      orderId: parseInt(orderId),
      tableReleased: !hasOtherActiveOrders
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 주문 세션 종료 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 세션 종료 실패'
    });
  } finally {
    client.release();
  }
});

// 🔄 KDS 동기화 API
router.get('/kds/:storeId/sync', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { lastSyncAt } = req.query;

    console.log(`🔄 KDS 동기화 요청: 매장 ${storeId}, 마지막 동기화: ${lastSyncAt}`);

    const syncTimestamp = lastSyncAt ? new Date(lastSyncAt) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 업데이트된 티켓들 조회
    const updatedTicketsResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.status,
        ot.order_id,
        ot.batch_no,
        ot.updated_at,
        o.table_num as table_number,
        o.created_at,
        array_agg(
          json_build_object(
            'id', oi.id,
            'menuName', oi.menu_name,
            'quantity', oi.quantity,
            'status', COALESCE(oi.item_status, 'PENDING'),
            'item_status', COALESCE(oi.item_status, 'PENDING'),
            'cook_station', COALESCE(oi.cook_station, 'KITCHEN')
          ) ORDER BY oi.created_at
        ) as items
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE o.store_id = $1 
        AND ot.updated_at > $2
        AND ot.display_status != 'UNVISIBLE'
      GROUP BY ot.id, ot.status, ot.order_id, ot.batch_no, ot.updated_at, o.table_num, o.created_at
      ORDER BY ot.updated_at ASC
    `, [parseInt(storeId), syncTimestamp]);

    // 삭제된 티켓들 조회 (UNVISIBLE 상태)
    const deletedTicketsResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.updated_at
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      WHERE o.store_id = $1 
        AND ot.updated_at > $2
        AND ot.display_status = 'UNVISIBLE'
    `, [parseInt(storeId), syncTimestamp]);

    const changes = {
      updated: updatedTicketsResult.rows.map(ticket => ({
        ticket_id: ticket.ticket_id,
        id: ticket.ticket_id,
        check_id: ticket.ticket_id,
        order_id: ticket.order_id,
        table_number: ticket.table_number,
        status: ticket.status?.toUpperCase() || 'PENDING',
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        items: ticket.items || []
      })),
      deleted: deletedTicketsResult.rows.map(ticket => ({
        ticket_id: ticket.ticket_id,
        updated_at: ticket.updated_at
      }))
    };

    console.log(`✅ KDS 동기화 완료: 업데이트 ${changes.updated.length}개, 삭제 ${changes.deleted.length}개`);

    res.json({
      success: true,
      lastSyncAt: new Date().toISOString(),
      changes: changes
    });

  } catch (error) {
    console.error('❌ KDS 동기화 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 동기화 실패: ' + error.message
    });
  }
});

// 주문별 리뷰 상태 확인 API  
router.get('/:orderId/review-status', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM reviews r
      JOIN orders o ON r.store_id = o.store_id AND r.user_id = o.user_id
      WHERE o.id = $1
    `, [parseInt(orderId)]);

    const hasReview = parseInt(result.rows[0].count) > 0;

    res.json({
      success: true,
      hasReview: hasReview
    });

  } catch (error) {
    console.error('❌ 리뷰 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '리뷰 상태 확인 실패'
    });
  }
});

// 📋 비회원 POS 주문 생성
router.post('/pos-guest', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      storeId,
      tableNumber,
      orderItems, // [{ menuId, menuName, price, quantity, cookStation }]
      notes = ''
    } = req.body;

    console.log(`📋 비회원 POS 주문 생성: 매장 ${storeId}, 테이블 ${tableNumber}`);

    if (!storeId || !tableNumber || !orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: '필수 파라미터가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // 총 금액 계산
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 1. orders 테이블에 주문 생성 (guest_phone는 null로 설정)
    const orderResult = await pool.query(`
      INSERT INTO orders (
        store_id,
        table_num,
        total_price,
        notes,
        created_at,
        guest_phone
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, null)
      RETURNING id, created_at
    `, [storeId, tableNumber, totalAmount, notes]);

    const orderId = orderResult.rows[0].id;
    console.log(`✅ 비회원 주문 생성: ${orderId}`);

    // 2. order_tickets 테이블에 티켓 생성 (POS 소스, UNPAID 상태)
    const ticketResult = await pool.query(`
      INSERT INTO order_tickets (
        order_id,
        batch_no,
        status,
        source,
        paid_status,
        created_at
      ) VALUES ($1, 1, 'PENDING', 'POS', 'UNPAID', CURRENT_TIMESTAMP)
      RETURNING id
    `, [orderId]);

    const ticketId = ticketResult.rows[0].id;
    console.log(`✅ 비회원 티켓 생성: ${ticketId}`);

    // 3. order_items 테이블에 주문 아이템들 생성
    for (const item of orderItems) {
      await client.query(`
        INSERT INTO order_items (
          ticket_id,
          menu_name,
          unit_price,
          quantity,
          cook_station,
          item_status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP)
      `, [
        ticketId,
        item.menuName,
        item.price,
        item.quantity,
        item.cookStation || 'KITCHEN'
      ]);
    }

    await client.query('COMMIT');

    console.log(`✅ 비회원 POS 주문 생성 완료: 주문 ${orderId}, 티켓 ${ticketId}, 아이템 ${orderItems.length}개`);

    res.json({
      success: true,
      order: {
        id: orderId,
        ticketId: ticketId,
        totalAmount: totalAmount,
        itemCount: orderItems.length,
        createdAt: orderResult.rows[0].created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 비회원 POS 주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 생성 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;