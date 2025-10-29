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

// 사용자 팔로잉 상태 조회
router.get('/following/status/:userId/:storeId', userController.getFollowingStatus.bind(userController));

// 팔로잉 토글
router.post('/following/toggle', userController.toggleFollowing.bind(userController));

// 전화번호로 회원 조회
router.get('/search-by-phone', userController.searchByPhone.bind(userController));

module.exports = router;