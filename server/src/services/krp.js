
const { v4: uuidv4 } = require('uuid');

/**
 * KRP 결제 서비스 모의 구현
 * 실제 PG 연동 시 이 인터페이스만 교체하면 됨
 */
class KRPService {
  constructor() {
    this.provider = 'MOCK';
    this.transactions = new Map(); // 메모리 저장소 (실제론 DB/Redis)
  }

  /**
   * 결제 승인 요청
   * @param {object} params - { amount, method, metadata? }
   * @returns {Promise<object>} { ok, provider, txn_id, error? }
   */
  async authorize({ amount, method, metadata = {} }) {
    try {
      // 입력 검증
      if (!amount || amount <= 0) {
        return { ok: false, error: 'Invalid amount' };
      }

      if (!['CARD', 'CASH', 'TRANSFER', 'MOBILE'].includes(method)) {
        return { ok: false, error: 'Unsupported payment method' };
      }

      // 모의 승인 처리 (실제론 PG API 호출)
      const txnId = uuidv4();
      
      // 랜덤 실패 시뮬레이션 (5% 확률)
      if (Math.random() < 0.05) {
        return { 
          ok: false, 
          error: 'Authorization failed',
          code: 'DECLINED'
        };
      }

      // 트랜잭션 저장
      this.transactions.set(txnId, {
        txn_id: txnId,
        amount,
        method,
        status: 'authorized',
        metadata,
        created_at: new Date(),
        updated_at: new Date()
      });

      console.log(`✅ KRP 승인 완료: ${txnId} (₩${amount.toLocaleString()}, ${method})`);

      return {
        ok: true,
        provider: this.provider,
        txn_id: txnId,
        amount,
        method
      };

    } catch (error) {
      console.error('❌ KRP 승인 실패:', error);
      return {
        ok: false,
        error: error.message
      };
    }
  }

  /**
   * 결제 확정 (capture)
   * @param {object} params - { txn_id, amount? }
   * @returns {Promise<object>} { ok, txn_id, captured_amount, error? }
   */
  async capture({ txn_id, amount }) {
    try {
      const transaction = this.transactions.get(txn_id);
      
      if (!transaction) {
        return { ok: false, error: 'Transaction not found' };
      }

      if (transaction.status !== 'authorized') {
        return { ok: false, error: 'Transaction not in authorized state' };
      }

      // 부분 캡처 검증
      const captureAmount = amount || transaction.amount;
      if (captureAmount > transaction.amount) {
        return { ok: false, error: 'Capture amount exceeds authorized amount' };
      }

      // 모의 캡처 처리
      transaction.status = 'captured';
      transaction.captured_amount = captureAmount;
      transaction.updated_at = new Date();

      console.log(`✅ KRP 캡처 완료: ${txn_id} (₩${captureAmount.toLocaleString()})`);

      return {
        ok: true,
        txn_id,
        captured_amount: captureAmount
      };

    } catch (error) {
      console.error('❌ KRP 캡처 실패:', error);
      return {
        ok: false,
        error: error.message
      };
    }
  }

  /**
   * 환불 처리
   * @param {object} params - { txn_id, amount, reason? }
   * @returns {Promise<object>} { ok, refund_id, refunded_amount, error? }
   */
  async refund({ txn_id, amount, reason = 'Customer request' }) {
    try {
      const transaction = this.transactions.get(txn_id);
      
      if (!transaction) {
        return { ok: false, error: 'Transaction not found' };
      }

      if (transaction.status !== 'captured') {
        return { ok: false, error: 'Transaction not in captured state' };
      }

      const refundAmount = Math.abs(amount);
      const capturedAmount = transaction.captured_amount || transaction.amount;

      if (refundAmount > capturedAmount) {
        return { ok: false, error: 'Refund amount exceeds captured amount' };
      }

      // 모의 환불 처리
      const refundId = uuidv4();
      
      // 환불 기록 추가
      if (!transaction.refunds) {
        transaction.refunds = [];
      }
      
      transaction.refunds.push({
        refund_id: refundId,
        amount: refundAmount,
        reason,
        created_at: new Date()
      });

      const totalRefunded = transaction.refunds.reduce((sum, r) => sum + r.amount, 0);
      
      if (totalRefunded >= capturedAmount) {
        transaction.status = 'fully_refunded';
      } else {
        transaction.status = 'partially_refunded';
      }

      transaction.updated_at = new Date();

      console.log(`✅ KRP 환불 완료: ${refundId} (₩${refundAmount.toLocaleString()})`);

      return {
        ok: true,
        refund_id: refundId,
        txn_id,
        refunded_amount: refundAmount,
        total_refunded: totalRefunded
      };

    } catch (error) {
      console.error('❌ KRP 환불 실패:', error);
      return {
        ok: false,
        error: error.message
      };
    }
  }

  /**
   * 트랜잭션 상태 조회
   * @param {string} txnId 
   * @returns {Promise<object>}
   */
  async getTransaction(txnId) {
    const transaction = this.transactions.get(txnId);
    return transaction ? { ok: true, transaction } : { ok: false, error: 'Transaction not found' };
  }

  /**
   * 웹훅 서명 검증 (실제 구현 시 사용)
   * @param {string} payload 
   * @param {string} signature 
   * @returns {boolean}
   */
  verifyWebhookSignature(payload, signature) {
    // TODO: 실제 PG사 HMAC 검증 로직 구현
    return true; // 개발 환경에서는 항상 통과
  }
}

// 싱글톤 인스턴스
const krpService = new KRPService();

module.exports = krpService;
