
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
        processing_order_id,
        spare_processing_order_id,
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
      SELECT processing_order_id, spare_processing_order_id, status
      FROM store_tables
      WHERE store_id = $1 AND id = $2
    `, [storeId, tableId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * spare_processing_order_id 업데이트
   */
  async updateSpareProcessingOrder(client, orderId) {
    await client.query(`
      UPDATE store_tables
      SET spare_processing_order_id = $1, updated_at = NOW()
      WHERE processing_order_id = $1
    `, [orderId]);
  }

  /**
   * 메인 주문 설정
   */
  async setMainOrder(client, storeId, tableNumber, orderId) {
    await client.query(`
      UPDATE store_tables
      SET processing_order_id = $1,
          status = 'OCCUPIED',
          updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $2 AND id = $3
    `, [orderId, storeId, tableNumber]);
  }

  /**
   * 보조 주문 설정
   */
  async setSpareOrder(client, storeId, tableNumber, orderId) {
    await client.query(`
      UPDATE store_tables
      SET spare_processing_order_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $2 AND id = $3 
    `, [orderId, storeId, tableNumber]);
  }

  /**
   * 보조 주문 해제
   */
  async clearSpareOrder(client, storeId, tableNumber) {
    await client.query(`
      UPDATE store_tables
      SET
        spare_processing_order_id = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $1 AND id = $2 
    `, [storeId, tableNumber]);
  }

  /**
   * 보조 주문을 메인으로 이동
   */
  async moveSpareToMain(client, storeId, tableNumber) {
    await client.query(`
      UPDATE store_tables
      SET
        processing_order_id = spare_processing_order_id,
        spare_processing_order_id = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $1 AND id = $2
    `, [storeId, tableNumber]);
  }

  /**
   * 테이블 완전 해제
   */
  async clearTable(client, storeId, tableNumber) {
    await client.query(`
      UPDATE store_tables
      SET
        processing_order_id = NULL,
        spare_processing_order_id = NULL,
        status = 'AVAILABLE',
        updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $1 AND id = $2
    `, [storeId, tableNumber]);
  }

  /**
   * 테이블 상태 OCCUPIED 반복 설정
   */
  async setTableOccupied(storeId, tableNumber){
    await pool.query(`
      UPDATE store_tables
      SET status = 'OCCUPIED', updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $1 AND id = $2
    `, [storeId, tableNumber])
  }
}

module.exports = new TableRepository();
