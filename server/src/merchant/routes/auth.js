const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * TLM 인증 라우트
 * Base: /api/merchants/auth
 */

/**
 * [POST] /signup - 회원가입
 */
router.post('/signup', authController.signup);

/**
 * [POST] /login - 로그인
 */
router.post('/login', authController.login);

/**
 * [POST] /check-email - 이메일 중복 체크
 */
router.post('/check-email', authController.checkEmail);

/**
 * [POST] /check-phone - 전화번호 중복 체크
 */
router.post('/check-phone', authController.checkPhone);

module.exports = router;
