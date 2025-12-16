const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// 📈 매장별 일일 통계 조회
router.get('/stats/:storeId/daily', orderController.getDailyStats);

// 주문 상태 업데이트 API
router.put('/update-status', orderController.updateOrderStatus);

// 주문 조회 API (단일)
router.get('/order/:orderId', orderController.getOrderById);

// 마이페이지 주문 목록 조회 API (경로 우선순위 위해 상단 배치)
router.get('/mypage/:userId', orderController.getUserOrders);

// 사용자 주문 목록 조회 API
router.get('/users/:userId', orderController.getUserOrders);

// 매장 주문 목록 조회 API
router.get('/store/:storeId', orderController.getStoreOrders);

// 주문 삭제 API
router.delete('/order/:orderId', orderController.deleteOrder);

// 📋 주문 진행 상황 조회 API
router.get('/processing/:orderId', orderController.getOrderProgress);

// 📋 현재 세션 정보 조회 API (POS 주문 화면용)
router.get('/current-session/:storeId/:tableNumber', orderController.getCurrentSession);

// 🔚 주문 세션 종료 API
router.put('/:orderId/end-session', orderController.endSession);

// 🔄 KDS 동기화 API
router.get('/kds/:storeId/sync', orderController.syncKDS);

// 주문별 리뷰 상태 확인 API  
router.get('/:orderId/review-status', orderController.getReviewStatus);

// 📋 비회원 POS 주문 생성
router.post('/pos-guest', orderController.createGuestPOSOrder);

// 🛒 일반 주문 생성 API
router.post('/', orderController.createOrder);

module.exports = router;