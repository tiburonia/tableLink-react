const pool = require('../db/pool');

/**
 * 주문 레포지토리 - 데이터베이스 접근
 */
class OrderRepository {
  /**
   * 데이터베이스 클라이언트 가져오기
   */
  async getClient() {
    return await pool.connect();
  }

  /**
   * 매장 정보 조회
   */
  async getStoreById(storeId) {
    const result = await pool.query(`
      SELECT id, name FROM stores WHERE id = $1
    `, [storeId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 매장 메뉴 조회
   */
  async getStoreMenu(storeId) {
    const result = await pool.query(`
      SELECT
        id,
        name,
        price,
        description,
        cook_station as category
      FROM store_menu
      WHERE store_id = $1
      ORDER BY id ASC
    `, [storeId]);

    return result.rows;
  }

  /**
   * POS 주문 아이템 조회 (미지불만)
   */
  async getPOSOrderItems(storeId, tableNumber) {
    const result = await pool.query(`
      SELECT
        oi.id,
        oi.menu_id,
        oi.menu_name,
        oi.unit_price,
        oi.quantity,
        oi.total_price,
        oi.item_status,
        oi.cook_station,
        oi.ticket_id,
        oi.created_at,
        ot.order_id,
        ot.paid_status,
        o.session_status as order_status
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      JOIN orders o ON ot.order_id = o.id
      WHERE o.store_id = $1
        AND o.table_num = $2
        AND ot.source = 'POS'
        AND ot.paid_status = 'UNPAID'
        AND ot.paid_status != 'PAID'
        AND o.session_status = 'OPEN'
        AND oi.item_status NOT IN ('CANCELED', 'REFUNDED')
      ORDER BY oi.created_at ASC
    `, [storeId, tableNumber]);

    return result.rows;
  }

  /**
   * TLL 주문 조회
   */
  async getTLLOrders(storeId, tableNumber) {
    const result = await pool.query(`
      SELECT
        oi.id,
        oi.menu_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.item_status,
        oi.cook_station,
        oi.order_id,
        ot.paid_status,
        ot.created_at as ticket_created_at,
        o.user_id,
        o.guest_phone,
        o.created_at as order_created_at,
        o.is_mixed
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      JOIN orders o ON ot.order_id = o.id
      WHERE o.store_id = $1
        AND o.table_num = $2
        AND ot.source = 'TLL'
        AND oi.item_status != 'CANCELED'
        AND o.session_status = 'OPEN'
      ORDER BY oi.created_at DESC
    `, [storeId, tableNumber]);

    return result.rows;
  }

  /**
   * 사용자 정보 조회
   */
  async getUserById(userId) {
    const result = await pool.query(`
      SELECT id, name, phone, created_at
      FROM users
      WHERE id = $1
    `, [userId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 주문 생성
   */
  async createOrder(client, orderData) {
    const { storeId, tableNumber, source, totalPrice } = orderData;

    const result = await client.query(`
      INSERT INTO orders (
        store_id,
        table_num,
        source,
        session_status,
        payment_status,
        total_price,
        created_at
      ) VALUES ($1, $2, $3, 'OPEN', 'PENDING', $4, NOW())
      RETURNING id
    `, [storeId, tableNumber, source, totalPrice]);

    return result.rows[0].id;
  }

  /**
   * 티켓 생성
   */
  async createTicket(client, ticketData) {
    const { orderId, storeId, tableNumber, batchNo = 1, source } = ticketData;

    const result = await client.query(`
      INSERT INTO order_tickets (
        order_id,
        store_id,
        batch_no,
        status,
        payment_type,
        source,
        table_num,
        created_at,
        paid_status
      ) VALUES ($1, $2, $3, 'PENDING', 'POSTPAID', $4, $5, NOW(), 'UNPAID')
      RETURNING id
    `, [orderId, storeId, batchNo, source, tableNumber]);

    return result.rows[0].id;
  }

  /**
   * 주문 아이템 생성
   */
  async createOrderItem(client, itemData) {
    const { orderId, ticketId, menuId, menuName, unitPrice, quantity, options, cookStation, storeId } = itemData;

    await client.query(`
      INSERT INTO order_items (
        order_id,
        ticket_id,
        menu_id,
        menu_name,
        unit_price,
        quantity,
        total_price,
        item_status,
        cook_station,
        options,
        created_at,
        store_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9, NOW(), $10)
    `, [
      orderId,
      ticketId,
      menuId,
      menuName,
      unitPrice,
      quantity,
      unitPrice * quantity,
      cookStation || 'KITCHEN',
      options ? JSON.stringify(options) : null,
      storeId
    ]);
  }

  /**
   * 활성 주문 ID 조회
   */
  async getActiveOrderId(client, storeId, tableNumber) {
    const result = await client.query(`
      SELECT DISTINCT o.id, o.created_at
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      WHERE o.store_id = $1
        AND o.table_num = $2
        AND ot.paid_status = 'UNPAID'
        AND o.session_status = 'OPEN'
        AND ot.source = 'POS'
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [storeId, tableNumber]);

    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  /**
   * 다음 배치 번호 조회
   */
  async getNextBatchNo(client, orderId) {
    // orderId 파라미터 검증
    if (!orderId || isNaN(orderId)) {
      throw new Error(`Invalid orderId for getNextBatchNo: ${orderId}`);
    }

    const result = await client.query(`
      SELECT COALESCE(MAX(batch_no), 0) + 1 as next_batch_no
      FROM order_tickets
      WHERE order_id = $1
    `, [parseInt(orderId)]);

    return result.rows[0].next_batch_no;
  }

  /**
   * 메뉴 이름으로 조회
   */
  async getMenuByName(client, storeId, menuName) {
    const result = await pool.query(`
      SELECT id, price, cook_station
      FROM store_menu
      WHERE store_id = $1 AND name = $2
    `, [storeId, menuName]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 제거용 티켓 조회
   */
  async getTicketsForRemoval(client, orderId, menuName) {
    const result = await client.query(`
      SELECT
        ot.id as ticket_id,
        ot.batch_no,
        ot.version,
        oi.id as item_id,
        oi.quantity,
        oi.unit_price,
        oi.cook_station,
        oi.menu_id
      FROM order_tickets ot
      JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.order_id = $1
        AND oi.menu_name = $2
        AND ot.status != 'CANCELED'
        AND oi.item_status != 'CANCELED'
        AND ot.paid_status = 'UNPAID'
        AND ot.source = 'POS'
      ORDER BY ot.batch_no DESC, ot.created_at DESC
    `, [orderId, menuName]);

    return result.rows;
  }

  /**
   * 주문 아이템 수량 업데이트
   */
  async updateOrderItemQuantity(client, itemId, quantity, totalPrice) {
    await client.query(`
      UPDATE order_items
      SET quantity = $1, total_price = $2, updated_at = NOW()
      WHERE id = $3
    `, [quantity, totalPrice, itemId]);
  }

  /**
   * 주문 아이템 취소
   */
  async cancelOrderItem(client, itemId) {
    await client.query(`
      UPDATE order_items
      SET item_status = 'CANCELED', updated_at = NOW()
      WHERE id = $1
    `, [itemId]);
  }

  /**
   * 활성 아이템 존재 여부 확인
   */
  async hasActiveItems(client, orderId) {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      WHERE ot.order_id = $1
        AND ot.status != 'CANCELED'
        AND oi.item_status != 'CANCELED'
    `, [orderId]);

    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * 모든 티켓 취소
   */
  async cancelAllTickets(client, orderId) {
    await client.query(`
      UPDATE order_tickets
      SET status = 'CANCELED', updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 AND status != 'CANCELED'
    `, [orderId]);
  }

  /**
   * 주문 취소
   */
  async cancelOrder(client, orderId) {
    await client.query(`
      UPDATE orders
      SET session_status = 'CANCELED', updated_at = CURRENT_TIMESTAMP, total_price = 0
      WHERE id = $1
    `, [orderId]);
  }

  /**
   * 다른 활성 주문 존재 여부 확인
   */
  async hasOtherActiveOrders(client, storeId, tableNumber, excludeOrderId) {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      WHERE o.store_id = $1
        AND o.table_num = $2
        AND o.session_status = 'OPEN'
        AND o.id != $3
    `, [storeId, tableNumber, excludeOrderId]);

    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * 주문 총 금액 업데이트
   */
  async updateOrderTotalAmount(client, orderId) {
    const totalResult = await client.query(`
      SELECT
        COALESCE(SUM(oi.unit_price * oi.quantity), 0) as item_total
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      WHERE ot.order_id = $1
        AND oi.item_status NOT IN ('CANCELLED', 'REFUNDED')
        AND oi.item_status NOT IN ('CANCELLED')
    `, [orderId]);

    const itemTotal = parseFloat(totalResult.rows[0].item_total) || 0;

    await client.query(`
      UPDATE orders
      SET
        total_price = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId, itemTotal]);
  }

  /**
   * 주문 정보 조회
   */
  async getOrderById(client, orderId) {
    const query = `
      SELECT id, source, session_status, is_mixed, created_at, updated_at
      FROM orders
      WHERE id = $1
    `;

    const result = client ?
      await client.query(query, [orderId]) :
      await pool.query(query, [orderId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 주문 Mixed 상태 업데이트
   */
  async updateOrderMixed(client, orderId, isMixed) {
    await client.query(`
      UPDATE orders
      SET is_mixed = $1, updated_at = NOW()
      WHERE id = $2
    `, [isMixed, orderId]);
  }

  /**
   * 메인 활성 주문 조회
   */
  async getMainActiveOrders(storeId) {
    const result = await pool.query(`
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
        'main' as order_type,
        st.spare_processing_order_id
      FROM store_tables st
      JOIN orders o ON st.processing_order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status != 'CANCELED'
      WHERE st.store_id = $1 AND st.processing_order_id IS NOT NULL
      GROUP BY st.id, o.id, u.name, o.user_id,
               o.total_price, o.session_status, o.created_at, o.source, st.spare_processing_order_id
    `, [storeId]);

    return result.rows;
  }

  /**
   * 보조 활성 주문 조회
   */
  async getSpareActiveOrders(storeId) {
    const result = await pool.query(`
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
        'spare' as order_type
      FROM store_tables st
      JOIN orders o ON st.spare_processing_order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status != 'CANCELED'
      WHERE st.store_id = $1 AND st.spare_processing_order_id IS NOT NULL
      GROUP BY st.id, o.id, u.name, o.user_id,
               o.total_price, o.session_status, o.created_at, o.source
    `, [storeId]);

    return result.rows;
  }

  /**
   * source별 주문 티켓 조회
   */
  async getOrderTicketsBySource(orderId) {
    const result = await pool.query(`
      SELECT
        ot.id as ticket_id,
        ot.source,
        ot.paid_status,
        ot.created_at as ticket_created_at,
        oi.id as item_id,
        oi.menu_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.item_status,
        oi.cook_station
      FROM order_tickets ot
      JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.order_id = $1
        AND oi.item_status != 'CANCELED'
      ORDER BY ot.source, ot.created_at, oi.created_at
    `, [orderId]);

    return result.rows;
  }

  /**
   * 혼합 주문 아이템 조회
   */
  async getMixedOrderItems(orderId, tableNumber) {
    const result = await pool.query(`
      SELECT
        oi.id,
        oi.menu_name,
        oi.unit_price,
        oi.quantity,
        oi.total_price,
        oi.cook_station,
        oi.item_status,
        ot.source as ticket_source,
        oi.created_at
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      WHERE ot.order_id = $1
        AND oi.item_status NOT IN ('CANCELED', 'REFUNDED')
      ORDER BY ot.source, oi.created_at
    `, [orderId]);

    return result.rows;
  }

  /**
   * 테이블별 활성 주문 조회
   */
  async getActiveOrderByTable(storeId, tableNumber) {
    const result = await pool.query(`
      SELECT DISTINCT o.id as order_id, o.created_at, o.total_price,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id AND oi.item_status != 'CANCELED'
      WHERE o.store_id = $1
        AND o.table_num = $2
        AND ot.paid_status = 'UNPAID'
        AND ot.status != 'CANCELED'
        AND o.session_status = 'OPEN'
      GROUP BY o.id, o.created_at, o.total_price
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [storeId, tableNumber]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 활성 세션 조회
   */
  async getActiveSessions(storeId, tableNumber) {
    const result = await pool.query(`
      SELECT
        o.id,
        o.status,
        o.created_at,
        COALESCE(u.name, '포스고객') as customer_name,
        o.source,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.ticket_id
      WHERE o.store_id = $1 AND o.table_num = $2 AND o.status = 'OPEN'
      GROUP BY o.id, o.status, o.created_at, u.name, o.source
      ORDER BY o.created_at DESC
    `, [storeId, tableNumber]);

    return result.rows;
  }

  /**
   * 매장별 일일 통계 조회
   */
  async getDailyStats(storeId, date) {
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
    `, [storeId, date]);

    return result.rows[0];
  }

  /**
   * 주문 상태 업데이트
   */
  async updateOrderStatus(orderId, statusData) {
    const { status, cookingStatus } = statusData;

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

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(parseInt(orderId));

    const updateResult = await pool.query(`
      UPDATE orders
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, status, cooking_status, updated_at
    `, values);

    return updateResult.rows.length > 0 ? updateResult.rows[0] : null;
  }

  /**
   * 주문과 아이템 조회
   */
  async getOrderWithItems(orderId) {
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
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return null;
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
    `, [orderId]);

    return {
      ...order,
      items: itemsResult.rows.map(item => ({
        ...item,
        options: typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {})
      }))
    };
  }

  /**
   * 사용자 주문 목록 조회
   */
  async getUserOrders(userId, options) {
    const { limit, offset, status } = options;

    let whereClause = 'WHERE o.user_id = $1';
    const queryParams = [userId];

    if (status) {
      whereClause += ' AND o.session_status = $2';
      queryParams.push(status);
    }

    const result = await pool.query(`
      SELECT
        o.id,
        o.total_price,
        o.session_status,
        o.source,
        o.created_at,
        o.table_num as table_number,
        s.id as store_id,
        s.name as store_name,
        si.category as store_category,
        COUNT(DISTINCT ot.id) as ticket_count,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'menu_name', oi.menu_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price
            )
          ) FILTER (
            WHERE oi.id IS NOT NULL 
            AND ot_paid.paid_status = 'PAID' 
            AND oi.item_status != 'CANCELED'
          ),
          '[]'::json
        ) as order_items
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN order_tickets ot ON o.id = ot.order_id
      LEFT JOIN order_tickets ot_paid ON o.id = ot_paid.order_id AND ot_paid.paid_status = 'PAID'
      LEFT JOIN order_items oi ON ot_paid.id = oi.ticket_id AND oi.item_status != 'CANCELED'
      ${whereClause}
      GROUP BY o.id, s.id, s.name, si.category
      ORDER BY o.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `, [...queryParams, limit, offset]);

    // null 값 필터링
    return result.rows.map(row => ({
      ...row,
      order_items: row.order_items || []
    }));
  }

  /**
   * 매장 주문 목록 조회
   */
  async getStoreOrders(storeId, options) {
    const { limit, offset, status, cookingStatus, date } = options;

    let whereClause = 'WHERE o.store_id = $1';
    const queryParams = [storeId];
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

    const result = await pool.query(`
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
    `, [...queryParams, limit, offset]);

    return result.rows;
  }

  /**
   * 주문과 관련 아이템 삭제
   */
  async deleteOrderWithItems(orderId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 주문 항목들 먼저 삭제
      await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);

      // 주문 티켓들 삭제
      await client.query('DELETE FROM order_tickets WHERE order_id = $1', [orderId]);

      // 주문 삭제
      await client.query('DELETE FROM orders WHERE id = $1', [orderId]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 주문 진행 상황 조회
   */
  async getOrderProgress(orderId) {
    // 주문 기본 정보 조회
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
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    // 티켓과 아이템 정보 조회
    const ticketsResult = await pool.query(`
      SELECT
        ot.id as ticket_id,
        ot.order_id,
        COALESCE(ot.batch_no, 1) as batch_no,
        COALESCE(ot.status, 'PENDING') as status,
        COALESCE(ot.source, 'TLL') as source,
        COALESCE(ot.paid_status, 'PAID') as paid_status,
        ot.created_at,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_name', COALESCE(oi.menu_name, '메뉴'),
            'name', COALESCE(oi.menu_name, '메뉴'),
            'quantity', COALESCE(oi.quantity, 1),
            'unit_price', COALESCE(oi.unit_price, 0),
            'cook_station', COALESCE(oi.cook_station, 'KITCHEN'),
            'status', COALESCE(oi.item_status, 'PENDING'),
            'options', COALESCE(oi.options, '{}')
          ) ORDER BY oi.created_at
        ) as items
      FROM order_tickets ot
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.order_id = $1
      GROUP BY ot.id, ot.order_id, ot.batch_no, ot.status, ot.source, ot.paid_status, ot.created_at
      ORDER BY ot.created_at DESC
    `, [orderId]);

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
    `, [orderId]);

    const tickets = ticketsResult.rows.map(ticket => ({
      ticket_id: ticket.ticket_id,
      id: ticket.ticket_id,
      order_id: ticket.order_id,
      batch_no: ticket.batch_no,
      status: ticket.status,
      source: ticket.source,
      paid_status: ticket.paid_status,
      created_at: ticket.created_at,
      items: ticket.items.filter(item => item.id !== null).map(item => ({
        ...item,
        options: typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {})
      }))
    }));

    const payments = paymentsResult.rows.map(payment => ({
      id: payment.id,
      method: payment.method?.toString().toUpperCase() || 'UNKNOWN',
      amount: parseInt(payment.amount) || 0,
      status: payment.status,
      createdAt: payment.created_at,
      payment_key: payment.payment_key,
      ticket_ids: []
    }));

    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAmount = paidAmount > 0 ? paidAmount : parseInt(order.base_amount) || 0;

    return {
      id: order.id,
      storeId: order.store_id,
      storeName: order.store_name,
      tableNumber: order.table_number,
      status: order.status,
      session_status: order.session_status,
      createdAt: order.created_at,
      sessionEnded: order.session_ended,
      session_ended_at: order.session_ended_at,
      totalOrders: tickets.length,
      totalAmount: totalAmount,
      tickets: tickets,
      payments: payments
    };
  }

  /**
   * 현재 세션 정보 조회
   */
  async getCurrentSession(storeId, tableNumber) {
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
    `, [storeId, tableNumber]);

    if (sessionResult.rows.length === 0) {
      return null;
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

    return {
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
  }

  /**
   * 주문 세션 종료
   */
  async endOrderSession(client, orderId) {
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
    `, [orderId]);

    return updateResult.rows.length > 0 ? updateResult.rows[0] : null;
  }

  /**
   * KDS 변경사항 조회
   */
  async getKDSChanges(storeId, syncTimestamp) {
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
    `, [storeId, syncTimestamp]);

    // 삭제된 티켓들 조회
    const deletedTicketsResult = await pool.query(`
      SELECT
        ot.id as ticket_id,
        ot.updated_at
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      WHERE o.store_id = $1
        AND ot.updated_at > $2
        AND ot.display_status = 'UNVISIBLE'
    `, [storeId, syncTimestamp]);

    return {
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
  }

  /**
   * 리뷰 상태 확인
   */
  async getReviewStatus(orderId) {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM reviews r
      JOIN orders o ON r.store_id = o.store_id AND r.user_id = o.user_id
      WHERE o.id = $1
    `, [orderId]);

    return parseInt(result.rows[0].count) > 0;
  }
  /**
   * 주문에 게스트 전화번호 업데이트
   */
  async updateOrderGuestInfo(client, orderId, guestPhone) {
    await client.query(`
      UPDATE orders
      SET guest_phone = $1
      WHERE id = $2
    `, [guestPhone, orderId]);
  }

  /**
   * 주문에 회원 정보 업데이트
   */
  async updateOrderMemberInfo(client, orderId, userId) {
    await client.query(`
      UPDATE orders
      SET user_id = $1
      WHERE id = $2
    `, [userId, orderId]);
  }

  /**
   * 주문을 결제 완료 상태로 변경
   */
  async markOrderAsPaid(client, orderId) {
    await client.query(`
      UPDATE orders
      SET payment_status = 'PAID',
          session_status = 'CLOSED',
          session_ended = true,
          session_ended_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId]);
  }

  /**
   * 다른 활성 주문 존재 여부 확인
   */
  async hasOtherActiveOrders(client, storeId, tableNumber, excludeOrderId) {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      WHERE o.store_id = $1
        AND o.table_num = $2
        AND o.session_status = 'OPEN'
        AND o.id != $3
    `, [storeId, tableNumber, excludeOrderId]);

    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = new OrderRepository();