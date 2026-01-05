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

// 메뉴 목록 조회
router.get('/:storeId/menu', storeController.getMenuItems);

// 메뉴 수정
router.put('/:storeId/menu/:menuId', storeController.updateMenuItem);

// 메뉴 삭제
router.delete('/:storeId/menu/:menuId', storeController.deleteMenuItem);

// ========== 테이블 관리 API ==========

// 테이블 목록 조회
router.get('/:storeId/tables', storeController.getTables);

// 테이블 추가
router.post('/:storeId/tables', storeController.addTable);

// 테이블 수정
router.put('/:storeId/tables/:tableId', storeController.updateTable);

// 테이블 삭제
router.delete('/:storeId/tables/:tableId', storeController.deleteTable);

// 테이블 상태 변경
router.patch('/:storeId/tables/:tableId/status', storeController.updateTableStatus);

module.exports = router;
