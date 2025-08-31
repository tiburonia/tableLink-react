
const { query } = require('../db/pool');

/**
 * 체크의 최종 합계 계산
 * @param {object} client - PostgreSQL 클라이언트 (트랜잭션용)
 * @param {number} checkId - 체크 ID
 * @returns {Promise<number>} 최종 합계 (센트 단위)
 */
async function calcCheckTotal(client, checkId) {
  const result = await client.query('SELECT calc_check_total($1) as total', [checkId]);
  return result.rows[0]?.total || 0;
}

/**
 * 체크의 결제 총액 계산
 * @param {object} client - PostgreSQL 클라이언트
 * @param {number} checkId - 체크 ID  
 * @returns {Promise<number>} 결제된 총액 (센트 단위)
 */
async function sumPayments(client, checkId) {
  const result = await client.query(`
    SELECT COALESCE(SUM(CASE 
      WHEN status IN ('paid', 'refunded') THEN amount 
      ELSE 0 
    END), 0) as paid_total
    FROM payments 
    WHERE check_id = $1
  `, [checkId]);
  return result.rows[0]?.paid_total || 0;
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
