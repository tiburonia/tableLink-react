
const pool = require('../db/pool');

/**
 * 테이블 레포지토리 - 데이터베이스 접근
 */
class TableRepository {
  /**
   * 테이블 번호로 테이블 조회
   */
  async getTableByNumber(storeId, tableNumber) {
    const result = await pool.query(`
      SELECT
        id,
        table_name,
        status,
        updated_at
      FROM store_tables
      WHERE store_id = $1 AND id = $2
    `, [storeId, tableNumber]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 테이블 ID로 테이블 조회
   */
  async getTableById(storeId, tableId) {
    const result = await pool.query(`
      SELECT id, table_name, status, updated_at
      FROM store_tables
      WHERE store_id = $1 AND id = $2
    `, [storeId, tableId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * table_orders 레코드 생성
   */
  async createTableOrder(client, orderId, storeId,  tableId) {
    const result = await client.query(`
      INSERT INTO table_orders (order_id, table_id, linked_at,store_id)
      VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
      RETURNING id
    `, [orderId, tableId, storeId]);

    console.log(`✅ table_orders 레코드 생성: 주문 ${orderId}, 테이블 ${tableId}`);
    return result.rows[0].id;
  }

  /**
   * table_orders 레코드 연결 해제 (unlinked_at 설정)
   */
  async unlinkTableOrder(client, orderId, tableId) {
    await client.query(`
      UPDATE table_orders
      SET unlinked_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 AND table_id = $2 AND unlinked_at IS NULL
    `, [orderId, tableId]);

    console.log(`✅ table_orders 연결 해제: 주문 ${orderId}, 테이블 ${tableId}`);
  }

  /**
   * 테이블 상태를 OCCUPIED로 설정
   */
  async setTableOccupied(client, storeId, tableNumber) {
    await client.query(`
      UPDATE store_tables
      SET status = 'OCCUPIED', updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $1 AND id = $2
    `, [storeId, tableNumber]);

    console.log(`🍽️ 테이블 OCCUPIED 설정: 매장 ${storeId}, 테이블 ${tableNumber}`);
  }

  /**
   * 테이블 상태를 AVAILABLE로 설정
   */
  async setTableAvailable(client, storeId, tableNumber) {
    await client.query(`
      UPDATE store_tables
      SET status = 'AVAILABLE', updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $1 AND id = $2
    `, [storeId, tableNumber]);

    console.log(`🍽️ 테이블 AVAILABLE 설정: 매장 ${storeId}, 테이블 ${tableNumber}`);
  }

  /**
   * 테이블의 활성 주문 확인
   */
  async hasActiveOrders(client, storeId, tableNumber) {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM table_orders tbo
      JOIN orders o ON tbo.order_id = o.id
      WHERE tbo.table_id = $1 
        AND tbo.unlinked_at IS NULL
        AND o.session_status = 'OPEN'
        AND o.store_id = $2
    `, [tableNumber, storeId]);

    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * 테이블에서 특정 주문 제거
   */
  async removeOrderFromTable(client, storeId, tableNumber, orderId) {
    // table_orders 연결 해제
    await this.unlinkTableOrder(client, orderId, tableNumber);

    // 해당 테이블에 다른 활성 주문이 있는지 확인
    const hasOtherOrders = await this.hasActiveOrders(client, storeId, tableNumber);

    if (!hasOtherOrders) {
      // 다른 활성 주문이 없으면 테이블 상태를 AVAILABLE로 변경
      await this.setTableAvailable(client, storeId, tableNumber);
      console.log(`🍽️ 테이블 완전 해제: 매장 ${storeId}, 테이블 ${tableNumber}`);
    } else {
      console.log(`ℹ️ 테이블 ${tableNumber}에 다른 활성 주문 존재, 상태 유지`);
    }
  }

  /**
   * 테이블 완전 해제 (모든 주문 연결 해제)
   */
  async releaseTable(client, storeId, tableNumber) {
    // 해당 테이블의 모든 활성 table_orders 연결 해제
    await client.query(`
      UPDATE table_orders
      SET unlinked_at = CURRENT_TIMESTAMP
      WHERE table_id = $1 
        AND unlinked_at IS NULL
        AND order_id IN (
          SELECT id FROM orders WHERE store_id = $2
        )
    `, [tableNumber, storeId]);

    // 테이블 상태를 AVAILABLE로 변경
    await this.setTableAvailable(client, storeId, tableNumber);

    console.log(`🍽️ 테이블 완전 해제 완료: 매장 ${storeId}, 테이블 ${tableNumber}`);
  }
  /**
   * store_id로 테이블 조회
   */
  async getStoreTable(storeId) {
    const result = await pool.query(`
    SELECT 
    id,
    store_id,
    table_name,
    capacity,
    status
    FROM store_tables
    WHERE store_id = $1
    `, [storeId])
    return result.rows.map(table => ({
      id: table.id,
      store_id: table.store_id,
      table_name: table.table_name,
      capacity: table.capacity,
      status: table.status
    }))
  }

  /**
   * 매장의 모든 테이블과 진행 중인 주문 정보를 한 번에 조회
   */
  async getStoreTablesWithOrders(storeId) {
    const result = await pool.query(`
      SELECT 
        st.id as table_id,
        st.table_name,
        st.capacity,
        st.status,
        o.id as order_id,
        o.source as source_system,
        o.created_at as order_created_at,
        oi.id as item_id,
        oi.menu_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.cook_station
      FROM store_tables st
      LEFT JOIN table_orders tbo ON st.id = tbo.table_id AND tbo.unlinked_at IS NULL
      LEFT JOIN orders o ON tbo.order_id = o.id AND o.session_status = 'OPEN'
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status NOT IN ('CANCELED', 'REFUNDED')
      WHERE st.store_id = $1
      ORDER BY st.id, o.source, oi.id
    `, [storeId]);

    return result.rows;
  }
}



module.exports = new TableRepository();
