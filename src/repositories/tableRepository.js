
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
/**
   * 테이블에서 특정 주문 제거
   */
  async removeOrderFromTable(client, storeId, tableNumber, orderId) {
    // 현재 테이블 상태 조회
    const currentTable = await this.getTableByNumber(storeId, tableNumber);

    if (!currentTable) {
      console.warn(`⚠️ 테이블을 찾을 수 없음: 매장 ${storeId}, 테이블 ${tableNumber}`);
      return;
    }

    const processingOrderId = parseInt(currentTable.processing_order_id);
    const spareOrderId = parseInt(currentTable.spare_processing_order_id);
    const targetOrderId = parseInt(orderId);

    if (spareOrderId === targetOrderId) {
      // 보조 주문인 경우 - 보조 슬롯만 비움
      await client.query(`
        UPDATE store_tables
        SET spare_processing_order_id = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE store_id = $1 AND id = $2
      `, [storeId, tableNumber]);

      console.log(`✅ 보조 주문 제거: 테이블 ${tableNumber}, 주문 ${orderId}`);

    } else if (processingOrderId === targetOrderId) {
      // 메인 주문인 경우
      if (currentTable.spare_processing_order_id !== null) {
        // 보조가 있으면 보조를 메인으로 이동
        await client.query(`
          UPDATE store_tables
          SET processing_order_id = spare_processing_order_id,
              spare_processing_order_id = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE store_id = $1 AND id = $2
        `, [storeId, tableNumber]);

        console.log(`✅ 메인 주문 제거 후 보조 승격: 테이블 ${tableNumber}, 완료된 주문 ${orderId}`);
      } else {
        // 보조가 없으면 테이블 완전 해제
        await this.releaseTable(client, storeId, tableNumber);
      }
    }
  }

  /**
   * 테이블 완전 해제
   */
  async releaseTable(client, storeId, tableNumber) {
    await client.query(`
      UPDATE store_tables
      SET processing_order_id = NULL,
          spare_processing_order_id = NULL,
          status = 'AVAILABLE',
          updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $1 AND id = $2
    `, [storeId, tableNumber]);

    console.log(`🍽️ 테이블 완전 해제: 매장 ${storeId}, 테이블 ${tableNumber}`);
  }
}

module.exports = new TableRepository();
