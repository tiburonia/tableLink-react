const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

/**
 * TLM 매장 라우트
 * Base: /api/merchants/stores
 */

// 매장 등록
router.post('/', storeController.createStore);

// 내 매장 목록 조회
router.get('/', storeController.getMyStores);

// 매장 상세 조회
router.get('/:storeId', storeController.getStoreDetail);

// 메뉴 추가
router.post('/:storeId/menu', storeController.addMenuItem);

// 메뉴 일괄 추가
router.post('/:storeId/menu/bulk', storeController.addMenuItems);

module.exports = router;
