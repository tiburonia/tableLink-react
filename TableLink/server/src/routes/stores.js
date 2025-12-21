const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// 모든 매장 목록 조회 API (경로 우선순위를 위해 최상단 배치)
router.get('/all', storeController.getAllStores);

// 매장 검색 API (경로 우선순위를 위해 상단 배치)
router.get('/search', storeController.searchStores);

// 매장 기본 정보 조회 API (userId 쿼리 파라미터 지원)
router.get('/:storeId', storeController.getStoreInfo);

// 매장 메뉴 조회 API (주문 페이지용)
router.get('/:storeId/menu', storeController.getStoreMenu);

// 매장 메뉴 조회 API (TLL용)
router.get('/:storeId/menu/tll', storeController.getStoreMenu);

module.exports = router;