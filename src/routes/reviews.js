
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

/**
 * 리뷰 라우트 - 레이어드 아키텍처 적용
 * Controller -> Service -> Repository 계층 분리
 */

// 매장별 전체 리뷰 조회
router.get('/stores/:storeId', reviewController.getStoreReviews.bind(reviewController));

// 사용자별 리뷰 조회
router.get('/users/:userId', reviewController.getUserReviews.bind(reviewController));

// 리뷰 제출
router.post('/submit', reviewController.submitReview.bind(reviewController));

module.exports = router;
