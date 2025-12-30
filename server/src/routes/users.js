const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * 사용자 라우트 - 레이어드 아키텍처 적용
 * Controller → Service → Repository 패턴
 */

// 사용자 정보 조회 (마이페이지용)
router.post('/info', userController.getUserInfo.bind(userController));

// 사용자 주문 내역 조회
router.get('/:userId/orders', userController.getUserOrders.bind(userController));

// 사용자 즐겨찾기 상태 조회
router.get('/favorite/status/:userId/:storeId', userController.getFavoriteStatus.bind(userController));

// 즐겨찾기 토글
router.post('/favorite/toggle', userController.toggleFavorite.bind(userController));

// 전화번호로 회원 조회
router.get('/search-by-phone', userController.searchByPhone.bind(userController));

// 개인화된 피드 조회
const feedController = require('../controllers/feedController');
router.get('/:userId/personalized-feed', feedController.getPersonalizedFeed.bind(feedController));

module.exports = router;