const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

// ============ 회원가입 관련 ============

/**
 * [POST] /users/check-id - 아이디 중복 체크
 */
router.post('/users/check-id', authController.checkId);

/**
 * [POST] /users/check-phone - 전화번호 중복 체크
 */
router.post('/users/check-phone', authController.checkPhone);

/**
 * [POST] /users/signup - 회원가입
 */
router.post('/users/signup', authController.signup);

// ============ 로그인 관련 ============

/**
 * [POST] /login - 로그인
 */
router.post('/login', authController.login);

/**
 * [POST] /users/login - 로그인 (대체 경로)
 */
router.post('/users/login', authController.login);

// ============ 사용자 정보 관련 ============

/**
 * [GET] /users/:userId/mypage - 마이페이지 통합 데이터 조회
 */
router.get('/users/:userId/mypage', userController.getMypageData);

/**
 * [POST] /users/info - 사용자 정보 조회
 */
router.post('/users/info', userController.getUserInfo);

/**
 * [GET] /user/:userId - 사용자 정보 조회 (쿠폰 포함)
 */
router.get('/user/:userId', authController.getUserWithCoupons);

/**
 * [PUT] /users/update - 사용자 정보 업데이트
 */
router.put('/users/update', userController.updateUserInfo);

// ============ 즐겨찾기 관련 ============

/**
 * [GET] /users/favorites/:userId - 즐겨찾기 조회
 */
router.get('/users/favorites/:userId', userController.getFavoriteStores);



/**
 * [POST] /users/favorite/toggle - 즐겨찾기 토글
 */
router.post('/users/favorite/toggle', userController.toggleFavorite);


/**
 * [POST] /users/check-guest-orders - 전화번호로 게스트 주문 조회
 */
router.post('/users/check-guest-orders', authController.checkGuestOrders);


/**
 * [GET] /users/favorite/status/:userId/:storeId - 즐겨찾기 상태 확인
 */
router.get('/users/favorite/status/:userId/:storeId', userController.getFavoriteStatus);

// 팔로잉 상태 조회 (users 라우터로 이동됨)
// router.get('/following/status/:userId/:storeId', authController.getFollowingStatus.bind(authController));

// 팔로잉 토글 (users 라우터로 이동됨)
// router.post('/users/following/toggle', authController.toggleFollowing.bind(authController));

module.exports = router;