const express = require('express');
const router = express.Router();
const pool  = require('../db/pool');
const { v4: uuidv4 } = require('uuid');


// 매장 기본 정보 조회 API
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    // ID 유효성 검사
    const numericStoreId = parseInt(storeId);
    if (isNaN(numericStoreId) || numericStoreId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID입니다'
      });
    }

    console.log(`🏪 매장 ${storeId} 기본 정보 조회 요청`);

    // 매장 기본 정보 조회
    const storeResult = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.store_tel_number,
        si.rating_average,
        si.review_count,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
        ST_X(sa.geom) as lng,
        ST_Y(sa.geom) as lat
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE s.id = $1
    `, [numericStoreId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    const store = storeResult.rows[0];

    console.log(`✅ 매장 ${storeId} 기본 정보 조회 완료: ${store.name}`);

    res.json({
      success: true,
      store: store
    });

  } catch (error) {
    console.error('❌ 매장 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '매장 정보 조회 중 오류가 발생했습니다'
    });
  }
});


// 매장 검색 API
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(400).json({
        success: false,
        error: '검색어를 입력해주세요'
      });
    }

    const searchQuery = query.trim();
    const searchLimit = Math.min(parseInt(limit) || 20, 100);

    console.log(`🔍 매장 검색 요청: "${searchQuery}" (limit: ${searchLimit})`);

    // 매장 검색 쿼리 (이름, 카테고리로 검색)
    const searchResult = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.is_open,
        si.category,
        si.rating_average,
        si.review_count,
        CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as address,
        ST_Y(sa.geom) as latitude,
        ST_X(sa.geom) as longitude
      FROM stores s
      LEFT JOIN store_info si ON s.id = si.store_id
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE 
        s.name ILIKE $1 
        OR si.category ILIKE $1
      ORDER BY 
        CASE 
          WHEN s.name ILIKE $2 THEN 1
          WHEN s.name ILIKE $1 THEN 2
          ELSE 3
        END,
        s.is_open DESC,
        si.rating_average DESC NULLS LAST
      LIMIT $3
    `, [
      `%${searchQuery}%`,
      `${searchQuery}%`,
      searchLimit
    ]);

    const stores = searchResult.rows.map(store => ({
      id: store.id,
      store_id: store.id,
      name: store.name || '매장명 없음',
      category: store.category || '기타',
      address: store.address || '주소 정보 없음',
      ratingAverage: parseFloat(store.rating_average) || 0.0,
      reviewCount: store.review_count || 0,
      favoriteCount: 0,
      isOpen: store.is_open !== false,
      coord: store.latitude && store.longitude ? { 
        lat: parseFloat(store.latitude), 
        lng: parseFloat(store.longitude) 
      } : null,
      region: {
        sido: store.sido,
        sigungu: store.sigungu,
        eupmyeondong: store.eupmyeondong
      }
    }));

    console.log(`✅ 매장 검색 완료: ${stores.length}개 결과`);

    res.json({
      success: true,
      stores: stores,
      query: searchQuery,
      count: stores.length
    });

  } catch (error) {
    console.error('❌ 매장 검색 오류:', error);
    res.status(500).json({
      success: false,
      error: '매장 검색 중 오류가 발생했습니다'
    });
  }
});



// 매장 메뉴 조회 API (새 스키마 기반)
router.get('/:storeId/menu/tll', async (req, res) => {
  try {
    const { storeId } = req.params;

    // ID 유효성 검사
    const numericStoreId = parseInt(storeId);
    if (isNaN(numericStoreId) || numericStoreId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID입니다'
      });
    }

    console.log(`🔍 매장 ${storeId} 메뉴 조회 요청`);

    // 매장 존재 확인
    const storeResult = await pool.query('SELECT id, name FROM stores WHERE id = $1', [numericStoreId]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    // 메뉴 조회 (현재 스키마에 맞게, cook_station 정보 포함)
    const menuResult = await pool.query(`
      SELECT 
        id,
        name,
        description,
        price,
        cook_station,
        cook_station as category
      FROM store_menu 
      WHERE store_id = $1
      ORDER BY id
    `, [numericStoreId]);

    console.log(`✅ 매장 ${storeId} 메뉴 ${menuResult.rows.length}개 조회 완료`);

    res.json({
      success: true,
      store: storeResult.rows[0],
      menu: menuResult.rows
    });

  } catch (error) {
    console.error('❌ 메뉴 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '메뉴 조회 중 오류가 발생했습니다'
    });
  }
});



module.exports = router;