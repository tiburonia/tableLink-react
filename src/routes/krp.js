const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/pool');
const { calcCheckTotal, sumPayments } = require('../utils/total');
const { storeAuth, checkIdempotency } = require('../mw/auth');
const krpService = require('../services/krp');
const { validateRequired, validateTypes, validateRange } = require('../utils/validation'); // Assuming validation utilities are added

// SSE 연결 수 제한 및 타임아웃/하트비트 관련 로직은 별도 파일 또는 서비스로 분리하는 것이 좋습니다.
// 현재 코드에는 SSE 관련 로직이 직접적으로 포함되어 있지 않아, 해당 부분은 추후 구현 시 반영합니다.

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
router.post('/', storeAuth, checkIdempotency, async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { check_id, method, amount, krp_provider = 'MOCK' } = req.body;

    // Input validation
    validateRequired(req.body, ['check_id', 'method', 'amount']);
    validateTypes(req.body, {
      check_id: 'number',
      method: 'string',
      amount: 'number',
      krp_provider: 'string'
    });

    const validatedAmount = validateRange(amount, 100, 1000000, 'amount'); // 100 won to 1 million won
    const checkId = validateRange(check_id, 1, Number.MAX_SAFE_INTEGER, 'check_id');


    await client.query('BEGIN');

    // 체크 잠금 및 존재 확인
    // SQL 인덱스 힌트: checks 테이블의 id 컬럼에 PRIMARY KEY 제약 조건이 있다면 별도의 인덱스 힌트는 불필요할 수 있습니다.
    // WHERE 절에 사용되는 다른 컬럼(예: store_id, status)에 대한 인덱스도 고려해야 합니다.
    const checkResult = await client.query(`
      SELECT id, store_id, status, final_amount
      FROM checks 
      WHERE id = $1
      FOR UPDATE
    `, [checkId]); // Use validated checkId

    if (checkResult.rows.length === 0) {
      // 에러 메시지 표준화: { error: { code, message, details? } }
      return res.status(404).json({ error: { code: 'CHECK_NOT_FOUND', message: '체크를 찾을 수 없습니다' } });
    }

    const check = checkResult.rows[0];

    if (check.store_id !== req.storeId) { // Use req.storeId which is set by storeAuth middleware
      // 에러 메시지 표준화
      return res.status(403).json({ error: { code: 'STORE_SCOPE_VIOLATION', message: '접근 권한이 없습니다' } });
    }

    if (check.status === 'closed') {
      // 에러 메시지 표준화
      throw new Error('이미 종료된 체크입니다');
    }

    // 중복 결제 방지
    const duplicateResult = await client.query(`
      SELECT id, status, amount
      FROM payments 
      WHERE idempotency_key = $1
    `, [req.idempotencyKey]); // Use req.idempotencyKey

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
    const finalTotal = await calcCheckTotal(client, checkId);
    const currentPaid = await sumPayments(client, checkId);
    const remaining = finalTotal - currentPaid;

    if (validatedAmount > remaining) { // Use validatedAmount
      // 에러 메시지 표준화
      throw new Error(`결제 금액이 잔액을 초과합니다 (잔액: ₩${remaining.toLocaleString()})`);
    }

    // KRP 결제 승인 및 캡처
    let krpResult = null;
    let krpTxnId = null;

    if (validatedAmount > 0) { // Use validatedAmount
      // 승인 요청
      const authResult = await krpService.authorize({
        amount: validatedAmount, // Use validatedAmount
        method,
        metadata: { check_id: checkId, store_id: req.storeId } // Use checkId and req.storeId
      });

      if (!authResult.ok) {
        // 에러 메시지 표준화
        throw new Error(`결제 승인 실패: ${authResult.error}`);
      }

      krpTxnId = authResult.txn_id;

      // 즉시 캡처
      const captureResult = await krpService.capture({
        txn_id: krpTxnId,
        amount: validatedAmount // Use validatedAmount
      });

      if (!captureResult.ok) {
        // 에러 메시지 표준화
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
    `, [checkId, method, validatedAmount, krp_provider, krpTxnId, req.idempotencyKey]); // Use checkId, validatedAmount, req.idempotencyKey

    const payment = paymentResult.rows[0];

    // 결제 완료 확인 및 체크 종료
    const newPaidTotal = currentPaid + validatedAmount; // Use validatedAmount
    let checkStatus = check.status;

    if (newPaidTotal >= finalTotal) {
      await client.query(`
        UPDATE checks 
        SET status = 'closed', closed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [checkId]); // Use checkId

      checkStatus = 'closed';

      console.log(`✅ 체크 종료: ${checkId} (완결제 달성)`);
    }

    await client.query('COMMIT');

    console.log(`✅ 결제 완료: ${payment.id} (체크 ${checkId}, ₩${validatedAmount.toLocaleString()})`); // Use checkId and validatedAmount

    res.status(201).json({
      payment_id: payment.id,
      status: payment.status,
      amount: validatedAmount, // Use validatedAmount
      check_status: checkStatus,
      krp_txn_id: krpTxnId,
      paid_total: newPaidTotal,
      final_total: finalTotal
    });

  } catch (error) {
    await client.query('ROLLBACK');
    // 에러 메시지 표준화: 에러 객체를 그대로 next로 넘기기 전에,
    // 클라이언트에게 보여줄 형식으로 가공하여 넘기는 것이 좋습니다.
    // 예: next({ code: 'INTERNAL_SERVER_ERROR', message: '처리 중 오류가 발생했습니다.' })
    next(error); // error 객체에 code, message, details 포함하여 next로 전달
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

    // 입력값 검증 (필수값, 타입, 범위)
    validateRequired(req.body, ['amount']);
    validateTypes(req.body, { amount: 'number' });
    const refundAmount = validateRange(Math.abs(amount), 0, Number.MAX_SAFE_INTEGER, 'amount'); // 환불 금액은 0 이상

    await client.query('BEGIN');

    // 원본 결제 확인
    // SQL 인덱스 힌트: payments 테이블의 id 컬럼은 PK일 가능성이 높으므로 별도 인덱스 불필요.
    // JOIN에 사용되는 c.id (checks 테이블 PK)도 마찬가지.
    const paymentResult = await client.query(`
      SELECT p.id, p.check_id, p.amount, p.status, p.krp_txn_id, c.store_id
      FROM payments p
      JOIN checks c ON p.check_id = c.id
      WHERE p.id = $1
      FOR UPDATE
    `, [paymentId]);

    if (paymentResult.rows.length === 0) {
      // 에러 메시지 표준화
      return res.status(404).json({ error: { code: 'PAYMENT_NOT_FOUND', message: '결제를 찾을 수 없습니다' } });
    }

    const payment = paymentResult.rows[0];

    if (payment.store_id !== storeId) {
      // 에러 메시지 표준화
      return res.status(403).json({ error: { code: 'STORE_SCOPE_VIOLATION', message: '접근 권한이 없습니다' } });
    }

    if (payment.status !== 'paid') {
      // 에러 메시지 표준화
      throw new Error('환불 가능한 결제가 아닙니다');
    }

    if (refundAmount > payment.amount) {
      // 에러 메시지 표준화
      throw new Error('환불 금액이 원본 결제 금액을 초과합니다');
    }

    // KRP 환불 처리
    let krpRefundResult = null;

    if (payment.krp_txn_id && refundAmount > 0) { // 환불 금액이 0보다 클 때만 KRP 환불 시도
      krpRefundResult = await krpService.refund({
        txn_id: payment.krp_txn_id,
        amount: refundAmount,
        reason: 'Manual refund request'
      });

      if (!krpRefundResult.ok) {
        // 에러 메시지 표준화
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
      'MOCK', // krp_provider는 원본 결제에서 가져오거나 'MOCK' 사용
      krpRefundResult?.refund_id, // KRP 환불 ID
      paymentId
    ]);

    const refund = refundResult.rows[0];

    // 결제 할당 기록 (allocations)
    for (const allocation of allocations) {
      // 할당 금액도 검증 필요
      const validatedAllocationAmount = validateRange(allocation.amount, 0, refundAmount, 'allocation amount');
      if (allocation.line_id && validatedAllocationAmount > 0) {
        await client.query(`
          INSERT INTO payment_allocations (payment_id, line_id, amount)
          VALUES ($1, $2, $3)
        `, [refund.id, allocation.line_id, validatedAllocationAmount]);
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
    // 에러 메시지 표준화
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
      signature // signature 필드가 body에 포함되어 있다고 가정
    } = req.body;

    // TODO: 실제 PG 연동 시 HMAC 서명 검증 구현 필요
    // const signature = req.headers['x-krp-signature']; // 헤더에서 가져오는 것이 일반적
    // if (!verifyHMACSignature(req.body, signature, process.env.KRP_SECRET)) { // verifyHMACSignature 함수 필요
    //   return res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: '웹훅 서명 검증 실패' } });
    // }

    // 실제 PG 연동 시에는 signature 필드나 헤더를 검증해야 함.
    // 현재는 시뮬레이션을 위해 검증 로직을 주석 처리.

    await client.query('BEGIN');

    // 기존 웹훅 처리 확인 (중복 방지)
    // SQL 인덱스 힌트: payments 테이블에 (krp_provider, krp_txn_id) 복합 인덱스 생성 권장
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
    // SQL 인덱스 힌트: payments 테이블에 (krp_provider, krp_txn_id) 복합 인덱스 사용
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
        // SQL 인덱스 힌트: checks 테이블에 id 컬럼은 PK이므로 별도 인덱스 불필요.
        // status 컬럼에 대한 인덱스가 있다면 WHERE 조건 성능 향상.
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
    // 에러 메시지 표준화
    res.status(500).json({
      ok: false,
      error: { code: 'WEBHOOK_PROCESSING_ERROR', message: error.message || '알 수 없는 웹훅 처리 오류' }
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

    // SQL 인덱스 힌트: payments 테이블의 id 컬럼은 PK, checks 테이블의 id 컬럼은 PK.
    // JOIN 조건인 p.check_id = c.id 에 대해 checks 테이블의 id 컬럼에 대한 인덱스 (PK)가 사용됨.
    // WHERE 조건인 p.id = $1 에 대해 payments 테이블의 id 컬럼에 대한 인덱스 (PK)가 사용됨.
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
      // 에러 메시지 표준화
      return res.status(404).json({ error: { code: 'PAYMENT_NOT_FOUND', message: '결제를 찾을 수 없습니다' } });
    }

    const payment = result.rows[0];

    if (payment.store_id !== storeId) {
      // 에러 메시지 표준화
      return res.status(403).json({ error: { code: 'STORE_SCOPE_VIOLATION', message: '접근 권한이 없습니다' } });
    }

    res.json(payment);

  } catch (error) {
    // 에러 메시지 표준화
    next(error);
  }
});

// TODO: 메뉴 가격 서버 신뢰, RBAC/JWT 확장 포인트 등은 별도 로직으로 구현 필요.
// TODO: README 섹션 (실행법, ENV, 라우팅 표, 흐름도)은 별도 파일로 관리.

module.exports = router;