const express = require('express');
const router = express.Router();
const tossController = require('../controllers/tossController');

/**
 * 토스페이먼츠 라우터 (리팩토링됨)
 * 단순히 URL → Controller 연결만 담당
 */

/**
 * [POST] /prepare - 결제 준비
 */
router.post('/prepare', tossController.prepare);

/**
 * [GET] /client-key - 클라이언트 키 반환
 */
router.get('/client-key', tossController.getClientKey);

/**
 * [POST] /confirm - 결제 승인
 */
router.post('/confirm', tossController.confirm);

module.exports = router;