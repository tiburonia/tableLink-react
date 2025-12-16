const express = require('express');
const router = express.Router();
const tossController = require('../controllers/tossController');

/**
 * 토스페이먼츠 라우터
 * - 회원/비회원 TLL 결제
 */

/**
 * [POST] /toss/prepare - 회원 TLL 결제 준비
 */
router.post('/prepare', tossController.prepare);

/**
 * [POST] /toss/prepare-guest - 비회원 TLL 결제 준비
 */
router.post('/prepare-guest', tossController.prepareGuest);

/**
 * [GET] /toss/client-key - 클라이언트 키 조회
 */
router.get('/client-key', tossController.getClientKey);

/**
 * [POST] /toss/confirm - 회원 TLL 결제 승인
 */
router.post('/confirm', tossController.confirm);

/**
 * [POST] /toss/confirm-guest - 비회원 TLL 결제 승인
 */
router.post('/confirm-guest', tossController.confirmGuest);

module.exports = router;