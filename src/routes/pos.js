const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');

/**
 * 새로운 POS 시스템 API (레이어드 아키텍처)
 * routes -> controllers -> services -> repositories
 */

/**
 * [GET] /store/:storeId - POS 전용 매장 정보 조회
 */
router.get('/store/:storeId', posController.getPOSStoreInfo);

/**
 * [GET] /stores/:storeId/menu - 매장 메뉴 조회
 */
router.get('/stores/:storeId/menu', posController.getStoreMenu);

/**
 * [GET] /stores/:storeId/table/:tableNumber/order-items - 테이블별 order_items 조회 (수량 통합용)
 */
router.get('/stores/:storeId/table/:tableNumber/order-items', posController.getTableOrderItems);

/**
 * [GET] /stores/:storeId/table/:tableNumber/tll-orders - 테이블별 TLL 주문 조회
 */
router.get('/stores/:storeId/table/:tableNumber/tll-orders', posController.getTLLOrders);

/**
 * [GET] /stores/:storeId/table/:tableNumber/session-status - 테이블 세션 상태 확인
 */
router.get('/stores/:storeId/table/:tableNumber/session-status', posController.getSessionStatus);

/**
 * [POST] /orders - POS 주문 생성 (기존 API - 호환성용)
 */
router.post('/orders', posController.createOrder);

/**
 * [POST] /orders/modify-batch - POS 주문 수정 (batch 알고리즘)
 */
router.post('/orders/modify-batch', posController.modifyBatch);

/**
 * [PUT] /orders/:orderId/enable-mixed - TLL 주문의 is_mixed 상태를 true로 변경
 */
router.put('/orders/:orderId/enable-mixed', posController.enableMixed);

/**
 * [GET] /orders/:orderId/mixed-status - TLL 주문의 is_mixed 상태 조회
 */
router.get('/orders/:orderId/mixed-status', posController.getMixedStatus);

/**
 * [GET] /stores/:storeId/table/:tableId/shared-order - POI=SPOI인 경우 order_tickets source별 그룹핑 조회
 */
router.get('/stores/:storeId/table/:tableId/shared-order', posController.getSharedOrder);

/**
 * [GET] /stores/:storeId/table/:tableNumber/active-order - 현재 테이블의 활성 주문 조회
 */
router.get('/stores/:storeId/table/:tableNumber/active-order', posController.getActiveOrder);

/**
 * [GET] /stores/:storeId/table/:tableNumber/status - 테이블 상태 조회 (TLL 연동 교차주문 확인용)
 */
router.get('/stores/:storeId/table/:tableNumber/status', posController.getTableStatus);

/**
 * [GET] /stores/:storeId/table/:tableNumber/mixed-order-items - TLL 연동 교차주문 아이템 조회 (source별 분리)
 */
router.get('/stores/:storeId/table/:tableNumber/mixed-order-items', posController.getMixedOrderItems);

/**
 * [GET] /stores/:storeId/orders/active - 활성 주문 조회 (교차 주문 지원)
 */
router.get('/stores/:storeId/orders/active', posController.getActiveOrders);

/**
 * [GET] /stores/:storeId/table/:tableId/mixed-order-items - TLL 연동 교차주문 아이템 조회
 */
router.get('/stores/:storeId/table/:tableId/mixed-order-items', posController.getMixedOrderItems);

module.exports = router;