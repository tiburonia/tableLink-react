const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// 매장 검색 API (경로 우선순위를 위해 상단 배치)
router.get('/search', storeController.searchStores);

// 매장 기본 정보 조회 API (userId 쿼리 파라미터 지원)
router.get('/:storeId', storeController.getStoreInfo);

// 매장 메뉴 조회 API (TLL용)
router.get('/:storeId/menu/tll', storeController.getStoreMenu);

module.exports = router;