
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/pool');
const { calcCheckTotal, sumPayments } = require('../utils/total');
const { storeAuth, checkIdempotency } = require('../mw/auth');
const krpService = require('../services/krp');

// 모든 라우트에 매장 인증 적용 (웹훅 제외)
router.use((req, res, next) => {
  if (req.path === '/webhook') {
    return next(); // 웹훅은 인증 제외
  }
  storeAuth(req, res, next);
});

/**
 * [POST] /api/payments - 결제 처리
 */
router.post('/', checkIdempotency, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { check_id, method, amount, krp_provider = 'MOCK' } = req.body;
    const { storeId, idempotencyKey } = req;

    if (!check_id || !method || !amount || amount <= 0) {
      return res.status(400).json({
        message: '필수 필드가 누락되었거나 유효하지 않습니다',
        code: 'INVALID_PAYMENT_REQUEST'
      });
    }

    await client.query('BEGIN');

    // 체크 잠금 및 존재 확인
    const checkResult = await client.query(`
      SELECT id, store_id, status, final_amount
      FROM checks 
      WHERE id = $1
      FOR UPDATE
    `, [check_id]);

    if (checkResult.rows.length === 0) {
      throw new Error('체크를 찾을 수 없습니다');
    }

    const check = checkResult.rows[0];

    if (check.store_id !== storeId) {
      return res.status(403).json({
        message: '접근 권한이 없습니다',
        code: 'STORE_SCOPE_VIOLATION'
      });
    }

    if (check.status === 'closed') {
      throw new Error('이미 종료된 체크입니다');
    }

    // 중복 결제 방지
    const duplicateResult = await client.query(`
      SELECT id, status, amount
      FROM payments 
      WHERE idempotency_key = $1
    `, [idempotencyKey]);

    if (duplicateResult.rows.length > 0) {
      const existing = duplicateResult.rows[0];
      await client.query('ROLLBACK');
      
      return res.status(201).json({
        payment_id: existing.id,
        status: existing.status,
        amount: existing.amount,
        duplicate: true
      });
    }

    // 합계 재계산
    const finalTotal = await calcCheckTotal(client, check_id);
    const currentPaid = await sumPayments(client, check_id);
    const remaining = finalTotal - currentPaid;

    if (amount > remaining) {
      throw new Error(`결제 금액이 잔액을 초과합니다 (잔액: ₩${remaining.toLocaleString()})`);
    }

    // KRP 결제 승인 및 캡처
    let krpResult = null;
    let krpTxnId = null;

    if (amount > 0) {
      // 승인 요청
      const authResult = await krpService.authorize({
        amount,
        method,
        metadata: { check_id, store_id: storeId }
      });

      if (!authResult.ok) {
        throw new Error(`결제 승인 실패: ${authResult.error}`);
      }

      krpTxnId = authResult.txn_id;

      // 즉시 캡처
      const captureResult = await krpService.capture({
        txn_id: krpTxnId,
        amount
      });

      if (!captureResult.ok) {
        throw new Error(`결제 캡처 실패: ${captureResult.error}`);
      }

      krpResult = captureResult;
    }

    // 결제 기록 생성
    const paymentResult = await client.query(`
      INSERT INTO payments (
        check_id, method, amount, status, 
        krp_provider, krp_txn_id, idempotency_key,
        created_at
      )
      VALUES ($1, $2, $3, 'paid', $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, status, created_at
    `, [check_id, method, amount, krp_provider, krpTxnId, idempotencyKey]);

    const payment = paymentResult.rows[0];

    // 결제 완료 확인 및 체크 종료
    const newPaidTotal = currentPaid + amount;
    let checkStatus = check.status;

    if (newPaidTotal >= finalTotal) {
      await client.query(`
        UPDATE checks 
        SET status = 'closed', closed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [check_id]);
      
      checkStatus = 'closed';
      
      console.log(`✅ 체크 종료: ${check_id} (완결제 달성)`);
    }

    await client.query('COMMIT');

    console.log(`✅ 결제 완료: ${payment.id} (체크 ${check_id}, ₩${amount.toLocaleString()})`);

    res.status(201).json({
      payment_id: payment.id,
      status: payment.status,
      amount: amount,
      check_status: checkStatus,
      krp_txn_id: krpTxnId,
      paid_total: newPaidTotal,
      final_total: finalTotal
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * [POST] /:id/refund - 환불 처리
 */
router.post('/:id/refund', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const paymentId = parseInt(req.params.id);
    const { amount, allocations = [] } = req.body;
    const { storeId } = req;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: '환불 금액이 필요합니다',
        code: 'INVALID_REFUND_AMOUNT'
      });
    }

    const refundAmount = Math.abs(amount);

    await client.query('BEGIN');

    // 원본 결제 확인
    const paymentResult = await client.query(`
      SELECT p.id, p.check_id, p.amount, p.status, p.krp_txn_id, c.store_id
      FROM payments p
      JOIN checks c ON p.check_id = c.id
      WHERE p.id = $1
      FOR UPDATE
    `, [paymentId]);

    if (paymentResult.rows.length === 0) {
      throw new Error('결제를 찾을 수 없습니다');
    }

    const payment = paymentResult.rows[0];

    if (payment.store_id !== storeId) {
      return res.status(403).json({
        message: '접근 권한이 없습니다',
        code: 'STORE_SCOPE_VIOLATION'
      });
    }

    if (payment.status !== 'paid') {
      throw new Error('환불 가능한 결제가 아닙니다');
    }

    if (refundAmount > payment.amount) {
      throw new Error('환불 금액이 원본 결제 금액을 초과합니다');
    }

    // KRP 환불 처리
    let krpRefundResult = null;
    
    if (payment.krp_txn_id) {
      krpRefundResult = await krpService.refund({
        txn_id: payment.krp_txn_id,
        amount: refundAmount,
        reason: 'Manual refund request'
      });

      if (!krpRefundResult.ok) {
        throw new Error(`환불 처리 실패: ${krpRefundResult.error}`);
      }
    }

    // 환불 기록 생성
    const refundResult = await client.query(`
      INSERT INTO payments (
        check_id, method, amount, status,
        krp_provider, krp_txn_id, 
        original_payment_id, created_at
      )
      VALUES ($1, $2, $3, 'refunded', $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, status, created_at
    `, [
      payment.check_id, 
      payment.method || 'REFUND', 
      -refundAmount, // 음수로 저장
      'MOCK',
      krpRefundResult?.refund_id,
      paymentId
    ]);

    const refund = refundResult.rows[0];

    // 결제 할당 기록 (allocations)
    for (const allocation of allocations) {
      if (allocation.line_id && allocation.amount > 0) {
        await client.query(`
          INSERT INTO payment_allocations (payment_id, line_id, amount)
          VALUES ($1, $2, $3)
        `, [refund.id, allocation.line_id, allocation.amount]);
      }
    }

    await client.query('COMMIT');

    console.log(`✅ 환불 완료: ${refund.id} (원본 ${paymentId}, ₩${refundAmount.toLocaleString()})`);

    res.status(201).json({
      payment_id: refund.id,
      status: refund.status,
      refunded_amount: refundAmount,
      krp_refund_id: krpRefundResult?.refund_id,
      allocations: allocations.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * [POST] /webhook - 결제 웹훅 처리
 */
router.post('/webhook', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { 
      krp_provider, 
      krp_txn_id, 
      status, 
      amount, 
      check_id,
      signature 
    } = req.body;

    // 서명 검증 (실제 환경에서는 필수)
    if (process.env.NODE_ENV === 'production') {
      const payload = JSON.stringify(req.body);
      if (!krpService.verifyWebhookSignature(payload, signature)) {
        return res.status(401).json({
          message: '웹훅 서명 검증 실패',
          code: 'INVALID_SIGNATURE'
        });
      }
    }

    await client.query('BEGIN');

    // 기존 웹훅 처리 확인 (중복 방지)
    const existingResult = await client.query(`
      SELECT id FROM payments 
      WHERE krp_provider = $1 AND krp_txn_id = $2
    `, [krp_provider, krp_txn_id]);

    if (existingResult.rows.length > 0) {
      // 이미 처리된 웹훅
      await client.query('ROLLBACK');
      return res.json({ ok: true, message: 'Already processed' });
    }

    // 상태에 따른 처리
    let paymentStatus;
    
    switch (status) {
      case 'paid':
      case 'captured':
        paymentStatus = 'paid';
        break;
      case 'failed':
      case 'cancelled':
        paymentStatus = 'failed';
        break;
      case 'refunded':
        paymentStatus = 'refunded';
        break;
      default:
        paymentStatus = 'pending';
    }

    // 결제 기록 upsert
    const paymentResult = await client.query(`
      INSERT INTO payments (
        check_id, amount, status, 
        krp_provider, krp_txn_id, 
        method, created_at
      )
      VALUES ($1, $2, $3, $4, $5, 'WEBHOOK', CURRENT_TIMESTAMP)
      ON CONFLICT (krp_provider, krp_txn_id) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        amount = EXCLUDED.amount,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, status
    `, [check_id, amount, paymentStatus, krp_provider, krp_txn_id]);

    const payment = paymentResult.rows[0];

    // 성공적인 결제인 경우 체크 종료 검토
    if (paymentStatus === 'paid' && check_id) {
      const finalTotal = await calcCheckTotal(client, check_id);
      const paidTotal = await sumPayments(client, check_id);

      if (paidTotal >= finalTotal) {
        await client.query(`
          UPDATE checks 
          SET status = 'closed', closed_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND status != 'closed'
        `, [check_id]);
        
        console.log(`✅ 웹훅으로 체크 종료: ${check_id}`);
      }
    }

    await client.query('COMMIT');

    console.log(`✅ 웹훅 처리 완료: ${krp_txn_id} (${status} → ${paymentStatus})`);

    res.json({ 
      ok: true, 
      payment_id: payment.id,
      status: payment.status 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 웹훅 처리 실패:', error);
    
    // 웹훅은 에러 응답이 중요함
    res.status(500).json({
      ok: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * [GET] /:id - 결제 상세 조회
 */
router.get('/:id', async (req, res, next) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { storeId } = req;

    const result = await pool.query(`
      SELECT 
        p.id, p.check_id, p.method, p.amount, p.status,
        p.krp_provider, p.krp_txn_id, p.created_at,
        c.store_id, c.table_number
      FROM payments p
      JOIN checks c ON p.check_id = c.id
      WHERE p.id = $1
    `, [paymentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: '결제를 찾을 수 없습니다',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    const payment = result.rows[0];

    if (payment.store_id !== storeId) {
      return res.status(403).json({
        message: '접근 권한이 없습니다',
        code: 'STORE_SCOPE_VIOLATION'
      });
    }

    res.json(payment);

  } catch (error) {
    next(error);
  }
});

module.exports = router;
