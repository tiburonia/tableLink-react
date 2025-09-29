
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
        status,
        payment_status,
        total_price,
        session_status,
        created_at
      ) VALUES ($1, $2, $3, 'OPEN', 'PENDING', $4, 'OPEN', NOW())
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
      SELECT DISTINCT o.id
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
    const result = await client.query(`
      SELECT COALESCE(MAX(batch_no), 0) + 1 AS next_batch 
      FROM order_tickets 
      WHERE order_id = $1
    `, [orderId]);

    return result.rows[0].next_batch;
  }

  /**
   * 메뉴 이름으로 조회
   */
  async getMenuByName(client, storeId, menuName) {
    const result = await client.query(`
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
        AND ot.status NOT IN ('CANCELLED')
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
}

module.exports = new OrderRepository();
