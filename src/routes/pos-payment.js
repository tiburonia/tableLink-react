const express = require('express');
const router = express.Router();
const posPaymentController = require('../controllers/posPaymentController');

/**
 * POS 결제 라우터 (리팩토링된 버전)
 * - 레이어드 아키텍처 적용: routes -> controllers -> services -> repositories
 * - 기존 API 호환성 유지
 */

/**
 * [POST] /pos-payment/process-with-customer - POS 결제 처리 (회원/비회원 분기 처리)
 */
router.post('/process-with-customer', posPaymentController.processWithCustomer);

/**
 * [GET] /pos-payment/unpaid-tickets/:orderId - 미지불 티켓 조회
 */
router.get('/unpaid-tickets/:orderId', posPaymentController.getUnpaidTickets);

/**
 * [GET] /pos-payment/status/:orderId - 주문 결제 상태 확인
 */
router.get('/status/:orderId', posPaymentController.getPaymentStatus);

module.exports = router;