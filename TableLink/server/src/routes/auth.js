const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { verifyToken, optionalAuth } = require('../mw/auth');
const { verifyRefreshToken, generateAccessToken } = require('../utils/jwtUtils');

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
 * 경로: /api/auth/login
 */
router.post('/login', authController.login);

/**
 * [POST] /users/login - 로그인 (대체 경로)
 * 경로: /api/auth/users/login
 */
router.post('/users/login', authController.login);

/**
 * [POST] /refresh - Access Token 갱신
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token이 필요합니다'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken({
      userId: decoded.userId
    });

    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    if (error.message === 'REFRESH_TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token이 만료되었습니다. 다시 로그인해주세요'
      });
    }
    next(error);
  }
});

// ============ 사용자 정보 관련 (인증 필요) ============

/**
 * [GET] /users/:userId/mypage - 마이페이지 통합 데이터 조회
 */
router.get('/users/:userId/mypage', verifyToken, userController.getMypageData);

/**
 * [POST] /users/info - 사용자 정보 조회
 */
router.post('/users/info', verifyToken, userController.getUserInfo);

/**
 * [GET] /user/:userId - 사용자 정보 조회 (쿠폰 포함)
 */
router.get('/user/:userId', verifyToken, authController.getUserWithCoupons);

/**
 * [PUT] /users/update - 사용자 정보 업데이트
 */
router.put('/users/update', verifyToken, userController.updateUserInfo);

// ============ 즐겨찾기 관련 (인증 필요) ============

/**
 * [GET] /users/favorites/:userId - 즐겨찾기 조회
 */
router.get('/users/favorites/:userId', verifyToken, userController.getFavoriteStores);



/**
 * [POST] /users/favorite/toggle - 즐겨찾기 토글
 */
router.post('/users/favorite/toggle', verifyToken, userController.toggleFavorite);


/**
 * [POST] /users/check-guest-orders - 전화번호로 게스트 주문 조회 (선택적 인증)
 */
router.post('/users/check-guest-orders', optionalAuth, authController.checkGuestOrders);


/**
 * [GET] /users/favorite/status/:userId/:storeId - 즐겨찾기 상태 확인
 */
router.get('/users/favorite/status/:userId/:storeId', verifyToken, userController.getFavoriteStatus);

module.exports = router;