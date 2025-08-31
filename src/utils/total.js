const { query } = require('../db/pool');

/**
 * 체크 총액 계산 (취소된 라인 제외)
 */
async function calcCheckTotal(client, checkId) {
  try {
    // 기본 라인 금액 (취소 제외)
    const lineResult = await client.query(`
      SELECT COALESCE(SUM(ol.unit_price), 0) as line_total
      FROM order_lines ol
      JOIN orders o ON o.id = ol.order_id
      WHERE o.check_id = $1 AND ol.status != 'canceled'
    `, [checkId]);

    let total = parseInt(lineResult.rows[0].line_total) || 0;

    // 옵션 금액 추가 (취소된 라인 제외)
    const optionResult = await client.query(`
      SELECT COALESCE(SUM(lo.price_delta), 0) as option_total
      FROM line_options lo
      JOIN order_lines ol ON ol.id = lo.line_id
      JOIN orders o ON o.id = ol.order_id
      WHERE o.check_id = $1 AND ol.status != 'canceled'
    `, [checkId]);

    total += parseInt(optionResult.rows[0].option_total) || 0;

    // 체크 레벨 조정
    const checkAdjResult = await client.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN value_type = 'amount' THEN value ELSE 0 END), 0) as amount_adj,
        COALESCE(SUM(CASE WHEN value_type = 'percent' THEN (value * $2 / 100) ELSE 0 END), 0) as percent_adj
      FROM adjustments
      WHERE check_id = $1 AND adj_scope = 'CHECK'
    `, [checkId, total]);

    const checkAdj = checkAdjResult.rows[0];
    total += parseInt(checkAdj.amount_adj) + parseInt(checkAdj.percent_adj);

    // 라인 레벨 조정 (취소된 라인 제외)
    const lineAdjResult = await client.query(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN a.value_type = 'amount' THEN a.value
          WHEN a.value_type = 'percent' THEN (ol.unit_price * a.value / 100)
          ELSE 0
        END
      ), 0) as line_adj
      FROM adjustments a
      JOIN order_lines ol ON ol.id = a.line_id
      JOIN orders o ON o.id = ol.order_id
      WHERE o.check_id = $1 AND a.adj_scope = 'LINE' AND ol.status != 'canceled'
    `, [checkId]);

    total += parseInt(lineAdjResult.rows[0].line_adj) || 0;

    return Math.max(0, total);
  } catch (error) {
    console.error('❌ 체크 총액 계산 실패:', error);
    return 0;
  }
}

/**
 * 결제 총합 계산
 */
async function sumPayments(client, checkId) {
  try {
    const result = await client.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments 
      WHERE check_id = $1 AND status = 'paid'
    `, [checkId]);

    return parseInt(result.rows[0].total) || 0;
  } catch (error) {
    console.error('❌ 결제 총합 계산 실패:', error);
    return 0;
  }
}

/**
 * 체크의 결제 상태 확인
 * @param {object} client - PostgreSQL 클라이언트
 * @param {number} checkId - 체크 ID
 * @returns {Promise<object>} 결제 상태 정보
 */
async function getPaymentStatus(client, checkId) {
  const total = await calcCheckTotal(client, checkId);
  const paid = await sumPayments(client, checkId);

  return {
    total_amount: total,
    paid_amount: paid,
    remaining_amount: total - paid,
    is_fully_paid: (total - paid) <= 0,
    is_overpaid: paid > total
  };
}

module.exports = { 
  calcCheckTotal, 
  sumPayments, 
  getPaymentStatus 
};