const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

/**
 * 테이블 라우트 - 레이어드 아키텍처 적용
 * Controller → Service → Repository 패턴
 */

// 테이블별 TLL 연동 상태 확인
router.get('/stores/:storeId/table/:tableNumber/tll-status', tableController.checkTLLIntegrationStatus);

// 매장별 테이블 조회 API
router.get('/stores/:storeId', tableController.getStoreTablesByStoreId);

// 테이블 점유 처리 API
router.post('/occupy', tableController.occupyTable);

// 테이블 해제 처리 API
router.post('/release', tableController.releaseTable);

module.exports = router;