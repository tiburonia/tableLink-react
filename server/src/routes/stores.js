const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// 매장 초기 로딩 API (커서 기반 페이지네이션, id순)
router.get('/initial', storeController.getInitialStores);

// 매장 추가 로딩 API (커서 기반 페이지네이션, id순)
router.get('/more', storeController.getMoreStores);

// 오늘의 가게 추천 API (요일 기반)
router.get('/recommend/today', storeController.getRecommendToday);

// 카테고리별 추천 매장 API
router.get('/recommend/category', storeController.getRecommendByCategory);

// 위치 기반 추천 매장 API
router.get('/recommend/nearby', storeController.getRecommendNearby);

// 모든 매장 목록 조회 API (Legacy - 지도용)
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