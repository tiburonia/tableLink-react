
const tableRepository = require('../repositories/tableRepository');
const orderRepository = require('../repositories/orderRepository');

/**
 * 테이블 서비스 - 테이블 상태 관리
 */
class TableService {
  /**
   * 테이블 상태 조회 (TLL 연동 교차주문 확인용)
   */
  async getTableStatus(storeId, tableNumber) {
    const table = await tableRepository.getTableByNumber(storeId, tableNumber);
    
    if (!table) {
      throw new Error('테이블을 찾을 수 없습니다');
    }

    // TLL 연동 교차주문 여부 판단 (POI = SPOI이고 둘 다 null이 아님)
    const isTLLMixedOrder = (
      table.processing_order_id !== null &&
      table.spare_processing_order_id !== null &&
      parseInt(table.processing_order_id) === parseInt(table.spare_processing_order_id)
    );

    // 추가 검증: 해당 주문이 실제로 is_mixed = true인지 확인
    let isActuallyMixed = false;
    if (isTLLMixedOrder && table.processing_order_id) {
      try {
        const order = await orderRepository.getOrderById(null, table.processing_order_id);
        if (order) {
          isActuallyMixed = (
            order.is_mixed === true &&
            order.source === 'TLL' &&
            order.session_status === 'OPEN'
          );
        }
      } catch (error) {
        console.warn(`⚠️ 주문 is_mixed 상태 확인 실패: ${table.processing_order_id}`, error);
      }
    }

    const finalTLLMixedStatus = isTLLMixedOrder && isActuallyMixed;

    return {
      id: table.id,
      processing_order_id: table.processing_order_id,
      spare_processing_order_id: table.spare_processing_order_id,
      status: table.status,
      updated_at: table.updated_at,
      isTLLMixedOrder: finalTLLMixedStatus
    };
  }
}

module.exports = new TableService();
